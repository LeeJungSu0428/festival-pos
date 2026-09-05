"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

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

const SIZE_LABELS = ["S", "M", "L", "XL", "2XL", "3XL"];

const emptyForm = {
  name: "",
  category: "new-materials" as Category,
  price: "",
  cost: "",
  hasSizes: false,
  initialStock: "",
  sizeStocks: Object.fromEntries(SIZE_LABELS.map((l) => [l, ""])) as Record<string, string>,
  lowStockThreshold: "10",
  imageUrl: "",
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        price: Number(form.price),
        cost: Number(form.cost),
        hasSizes: form.hasSizes,
        sizes: form.hasSizes
          ? SIZE_LABELS.map((label) => ({ label, initialStock: Number(form.sizeStocks[label] || 0) }))
          : undefined,
        initialStock: form.hasSizes ? undefined : Number(form.initialStock),
        lowStockThreshold: Number(form.lowStockThreshold || 10),
        imageUrl: form.imageUrl || null,
      }),
    });
    setCreating(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "상품 추가에 실패했습니다.");
      return;
    }
    setForm(emptyForm);
    load();
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`'${p.name}' 상품을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;
    await fetch(`/api/products/${p.id}`, { method: "DELETE" });
    load();
  }

  async function resetAll() {
    if (
      !confirm(
        "정말 초기화할까요?\n\n상품/재고/판매기록/굿즈뷰어 주문 기록이 전부 지워지고 기본 상품 목록으로 다시 채워집니다.\n실제 판매가 시작된 뒤에는 절대 누르지 마세요."
      )
    ) {
      return;
    }
    setResetting(true);
    await fetch("/api/admin/reset", { method: "POST" });
    setResetting(false);
    router.refresh();
    load();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">상품 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">
            새 상품을 추가하거나 기존 상품을 비활성화·삭제할 수 있습니다.
          </p>
        </div>
        <button
          onClick={resetAll}
          disabled={resetting}
          className="shrink-0 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {resetting ? "초기화 중…" : "테스트 데이터 초기화"}
        </button>
      </div>

      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4"
      >
        <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-6">
          <Field label="상품명">
            <input
              required
              className="input"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </Field>
          <Field label="담당 사이트">
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
            >
              <option value="new-materials">신소재</option>
              <option value="international-hall">국제관</option>
            </select>
          </Field>
          <Field label="판매가">
            <input
              required
              type="number"
              className="input"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </Field>
          <Field label="원가">
            <input
              required
              type="number"
              className="input"
              value={form.cost}
              onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            />
          </Field>
          <Field label="부족 기준">
            <input
              type="number"
              className="input"
              value={form.lowStockThreshold}
              onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))}
            />
          </Field>
          <Field label="이미지 경로/URL">
            <input
              className="input"
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="/goods/... 또는 선택"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={form.hasSizes}
            onChange={(e) => setForm((f) => ({ ...f, hasSizes: e.target.checked }))}
          />
          사이즈별로 재고를 관리합니다 (S~3XL)
        </label>

        {form.hasSizes ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SIZE_LABELS.map((label) => (
              <Field key={label} label={`${label} 재고`}>
                <input
                  type="number"
                  className="input"
                  value={form.sizeStocks[label]}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      sizeStocks: { ...f.sizeStocks, [label]: e.target.value },
                    }))
                  }
                />
              </Field>
            ))}
          </div>
        ) : (
          <div className="sm:w-1/6">
            <Field label="재고">
              <input
                required
                type="number"
                className="input"
                value={form.initialStock}
                onChange={(e) => setForm((f) => ({ ...f, initialStock: e.target.value }))}
              />
            </Field>
          </div>
        )}

        <div>
          <button
            disabled={creating}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {creating ? "추가 중…" : "상품 추가"}
          </button>
          {error && <span className="ml-3 text-sm text-red-600">{error}</span>}
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-neutral-900">{p.name}</p>
                <p className="text-sm text-neutral-500">
                  {CATEGORY_LABEL[p.category]} · ₩{p.price.toLocaleString("ko-KR")} · 원가 ₩
                  {p.cost.toLocaleString("ko-KR")}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
                  p.active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {p.active ? "판매중" : "판매중지"}
              </span>
            </div>
            {p.hasSizes ? (
              <p className="mt-2 text-sm text-neutral-500">
                현재 재고 합계 {p.sizes.reduce((s, sz) => s + sz.currentStock, 0)}개 (사이즈별)
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-500">현재 재고 {p.currentStock}개</p>
            )}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => toggleActive(p)}
                className="flex-1 rounded border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              >
                {p.active ? "비활성화" : "활성화"}
              </button>
              <button
                onClick={() => remove(p)}
                className="flex-1 rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-sm text-neutral-400">등록된 상품이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-neutral-500">{label}</span>
      {children}
    </label>
  );
}
