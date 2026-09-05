"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  initialStock: number;
  currentStock: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  active: boolean;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function updateLocal(id: string, patch: Partial<Product>) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
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
        price: product.price,
        cost: product.cost,
        initialStock: product.initialStock,
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
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">재고 관리</h1>
        <p className="mt-1 text-sm text-neutral-500">
          판매가, 원가, 초기/현재 재고, 재고 부족 기준을 직접 수정할 수 있습니다.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-400">불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">상품명</th>
                <th className="px-3 py-2 font-medium">판매가</th>
                <th className="px-3 py-2 font-medium">원가</th>
                <th className="px-3 py-2 font-medium">초기 재고</th>
                <th className="px-3 py-2 font-medium">현재 재고</th>
                <th className="px-3 py-2 font-medium">부족 기준</th>
                <th className="px-3 py-2 font-medium">이미지 URL</th>
                <th className="px-3 py-2 font-medium">판매 여부</th>
                <th className="px-3 py-2 font-medium" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="px-3 py-2">
                    <input
                      className="input w-32"
                      value={p.name}
                      onChange={(e) => updateLocal(p.id, { name: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input w-24"
                      value={p.price}
                      onChange={(e) => updateLocal(p.id, { price: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input w-24"
                      value={p.cost}
                      onChange={(e) => updateLocal(p.id, { cost: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input w-20"
                      value={p.initialStock}
                      onChange={(e) => updateLocal(p.id, { initialStock: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input w-20"
                      value={p.currentStock}
                      onChange={(e) => updateLocal(p.id, { currentStock: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      className="input w-20"
                      value={p.lowStockThreshold}
                      onChange={(e) => updateLocal(p.id, { lowStockThreshold: Number(e.target.value) })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="input w-36"
                      value={p.imageUrl ?? ""}
                      onChange={(e) => updateLocal(p.id, { imageUrl: e.target.value })}
                      placeholder="https://…"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <label className="inline-flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={(e) => updateLocal(p.id, { active: e.target.checked })}
                      />
                      <span className="text-xs text-neutral-500">{p.active ? "판매중" : "중지"}</span>
                    </label>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => save(p.id)}
                      disabled={savingId === p.id}
                      className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {savingId === p.id ? "저장 중…" : "저장"}
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-neutral-400">
                    등록된 상품이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
