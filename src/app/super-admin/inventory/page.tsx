"use client";

import { useEffect, useState } from "react";

type Category = "new-materials" | "international-hall";
type ProductSize = { label: string; initialStock: number; currentStock: number };

type Product = {
  id: string;
  name: string;
  category: Category;
  price: number;
  cost: number;
  hasSizes: boolean;
  sizes: ProductSize[];
  initialStock: number;
  currentStock: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  active: boolean;
};

const CATEGORY_LABEL: Record<Category, string> = {
  "new-materials": "신소재",
  "international-hall": "국제관",
};

const REFRESH_MS = 5000;

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(showSpinner = false) {
    if (showSpinner) setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    if (showSpinner) setLoading(false);
  }

  useEffect(() => {
    load(true);
    const timer = setInterval(() => load(false), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  function updateLocal(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function updateSizeLocal(id: string, label: string, patch: Partial<ProductSize>) {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, sizes: p.sizes.map((s) => (s.label === label ? { ...s, ...patch } : s)) }
          : p
      )
    );
  }

  async function save(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setSavingId(id);
    setError(null);

    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        category: product.category,
        price: product.price,
        cost: product.cost,
        sizes: product.sizes,
        currentStock: product.currentStock,
        lowStockThreshold: product.lowStockThreshold,
        imageUrl: product.imageUrl,
        active: product.active,
      }),
    });
    setSavingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "저장에 실패했습니다.");
      return;
    }
    load(false);
  }

  const groups: Category[] = ["new-materials", "international-hall"];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">재고 관리</h1>
        <p className="mt-1 text-sm text-neutral-500">
          신소재/국제관 사이트나 굿즈 뷰어에서 판매가 일어나면 여기에 실시간으로 반영됩니다 (5초마다
          자동 새로고침). 사이즈가 있는 상품은 사이즈별 재고를 따로 관리합니다.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">불러오는 중…</p>
      ) : (
        groups.map((cat) => {
          const items = products.filter((p) => p.category === cat);
          return (
            <section key={cat}>
              <h2 className="mb-3 text-lg font-semibold text-neutral-900">
                {CATEGORY_LABEL[cat]} 재고 ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((p) => (
                  <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-neutral-500">상품명</span>
                        <input
                          className="input"
                          value={p.name}
                          onChange={(e) => updateLocal(p.id, { name: e.target.value })}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-neutral-500">담당</span>
                        <select
                          className="input"
                          value={p.category}
                          onChange={(e) => updateLocal(p.id, { category: e.target.value as Category })}
                        >
                          <option value="new-materials">신소재</option>
                          <option value="international-hall">국제관</option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-neutral-500">판매가</span>
                        <input
                          type="number"
                          className="input"
                          value={p.price}
                          onChange={(e) => updateLocal(p.id, { price: Number(e.target.value) })}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-neutral-500">원가</span>
                        <input
                          type="number"
                          className="input"
                          value={p.cost}
                          onChange={(e) => updateLocal(p.id, { cost: Number(e.target.value) })}
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-xs font-medium text-neutral-500">부족 기준</span>
                        <input
                          type="number"
                          className="input"
                          value={p.lowStockThreshold}
                          onChange={(e) =>
                            updateLocal(p.id, { lowStockThreshold: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label className="flex items-end gap-1.5 pb-2">
                        <input
                          type="checkbox"
                          checked={p.active}
                          onChange={(e) => updateLocal(p.id, { active: e.target.checked })}
                        />
                        <span className="text-xs text-neutral-500">{p.active ? "판매중" : "중지"}</span>
                      </label>
                    </div>

                    <label className="mt-3 block">
                      <span className="mb-1 block text-xs font-medium text-neutral-500">이미지 경로/URL</span>
                      <input
                        className="input"
                        value={p.imageUrl ?? ""}
                        onChange={(e) => updateLocal(p.id, { imageUrl: e.target.value })}
                        placeholder="/goods/... 또는 https://…"
                      />
                    </label>

                    {p.hasSizes ? (
                      <div className="mt-3">
                        <span className="mb-1 block text-xs font-medium text-neutral-500">
                          사이즈별 현재 재고
                        </span>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                          {p.sizes.map((size) => (
                            <div key={size.label} className="rounded border border-neutral-200 p-2">
                              <p className="mb-1 text-center text-xs font-semibold text-neutral-700">
                                {size.label}
                              </p>
                              <input
                                type="number"
                                className="input w-full px-1 text-center"
                                value={size.currentStock}
                                onChange={(e) =>
                                  updateSizeLocal(p.id, size.label, {
                                    currentStock: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 sm:w-1/6">
                        <label className="block">
                          <span className="mb-1 block text-xs font-medium text-neutral-500">현재 재고</span>
                          <input
                            type="number"
                            className="input"
                            value={p.currentStock}
                            onChange={(e) => updateLocal(p.id, { currentStock: Number(e.target.value) })}
                          />
                        </label>
                      </div>
                    )}

                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => save(p.id)}
                        disabled={savingId === p.id}
                        className="rounded bg-neutral-900 px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                      >
                        {savingId === p.id ? "저장 중…" : "저장"}
                      </button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
                    등록된 상품이 없습니다.
                  </p>
                )}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
