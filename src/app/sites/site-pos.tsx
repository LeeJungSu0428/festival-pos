"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandBackdrop from "@/components/BrandBackdrop";

type Product = {
  id: string;
  name: string;
  category: "new-materials" | "international-hall";
  price: number;
  currentStock: number;
  active: boolean;
  imageUrl: string | null;
};

export default function SitePos({
  category,
  title,
}: {
  category: "new-materials" | "international-hall";
  title: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<{ id: string; orderNumber: number; total: number } | null>(
    null
  );

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    const list: Product[] = data.products ?? [];
    setProducts(list.filter((p) => p.category === category && p.active));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function changeQty(p: Product, delta: number) {
    setCart((prev) => {
      const current = prev[p.id] ?? 0;
      const next = Math.max(0, Math.min(p.currentStock, current + delta));
      return { ...prev, [p.id]: next };
    });
  }

  const lines = products
    .filter((p) => (cart[p.id] ?? 0) > 0)
    .map((p) => ({ productId: p.id, name: p.name, price: p.price, qty: cart[p.id] }));

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  async function complete() {
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map((l) => ({ productId: l.productId, qty: l.qty })) }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error ?? "판매 처리 중 오류가 발생했습니다.");
      return;
    }

    setLastOrder({ id: data.id, orderNumber: data.orderNumber, total: data.total });
    setCart({});
    load();
  }

  async function cancelLastOrder() {
    if (!lastOrder) return;
    if (!confirm(`주문 #${lastOrder.orderNumber}을(를) 취소할까요? 재고가 복구됩니다.`)) return;
    await fetch(`/api/orders/${lastOrder.id}/cancel`, { method: "POST" });
    setLastOrder(null);
    load();
  }

  return (
    <div className="relative min-h-screen pb-32">
      <BrandBackdrop />
      <header className="flex items-center justify-between border-b border-[#D7E2EE] bg-[#FBFDFF] px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#5B7FA6]">애국한양응원제 : 오름</p>
          <h1 className="text-lg font-bold text-[#26415F]">{title}</h1>
        </div>
        <Link href="/hub" className="text-sm text-[#5B6B82] hover:text-[#26415F]">
          ← 허브로
        </Link>
      </header>

      {error && <p className="px-4 pt-4 text-sm text-red-600 sm:px-6">{error}</p>}

      {lastOrder && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:mx-6">
          <span>
            주문 #{lastOrder.orderNumber} 판매 완료 · ₩{lastOrder.total.toLocaleString("ko-KR")}
          </span>
          <button
            onClick={cancelLastOrder}
            className="rounded border border-emerald-300 px-3 py-1 text-xs font-medium hover:bg-emerald-100"
          >
            이 주문 취소
          </button>
        </div>
      )}

      <main className="grid gap-3 p-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {products.map((p) => {
          const qty = cart[p.id] ?? 0;
          return (
            <div key={p.id} className="rounded-xl border border-[#D7E2EE] bg-[#FBFDFF] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <div>
                    <p className="font-semibold text-[#26415F]">{p.name}</p>
                    <p className="text-sm text-[#5B6B82]">₩{p.price.toLocaleString("ko-KR")}</p>
                  </div>
                </div>
                <span className="text-xs text-[#9AAEC4]">재고 {p.currentStock}</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => changeQty(p, -1)}
                  className="h-10 w-10 rounded-full border border-[#C9D6E4] text-lg font-semibold text-[#26415F] active:bg-[#E8EEF5]"
                >
                  −
                </button>
                <span className="w-8 text-center text-lg font-semibold text-[#26415F]">{qty}</span>
                <button
                  onClick={() => changeQty(p, 1)}
                  disabled={qty >= p.currentStock}
                  className="h-10 w-10 rounded-full border border-[#C9D6E4] text-lg font-semibold text-[#26415F] active:bg-[#E8EEF5] disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <p className="col-span-full text-sm text-[#9AAEC4]">
            이 사이트에 등록된 판매중 상품이 없습니다. 슈퍼관리자의 Inventory 또는 Products에서 담당
            사이트를 지정해 상품을 추가해주세요.
          </p>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#D7E2EE] bg-[#FBFDFF] p-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs text-[#5B6B82]">{lines.length}개 상품 선택됨</p>
            <p className="text-xl font-bold text-[#26415F]">₩{total.toLocaleString("ko-KR")}</p>
          </div>
          <button
            onClick={complete}
            disabled={lines.length === 0 || submitting}
            className="rounded-lg bg-[#26415F] px-8 py-3 text-base font-semibold text-[#FBFDFF] disabled:opacity-40"
          >
            {submitting ? "처리 중…" : "판매 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
