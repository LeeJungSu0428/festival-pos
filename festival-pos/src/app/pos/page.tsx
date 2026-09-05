"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  price: number;
  currentStock: number;
  active: boolean;
  imageUrl: string | null;
};

export default function PosPage() {
  const router = useRouter();
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
    setProducts(list.filter((p) => p.active));
  }

  useEffect(() => {
    load();
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-40">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs text-neutral-400">축제 판매 시스템</p>
          <p className="text-lg font-semibold text-neutral-900">판매 화면</p>
        </div>
        <button onClick={logout} className="text-sm text-neutral-500 hover:text-red-600">
          로그아웃
        </button>
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
            <div key={p.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {p.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-neutral-900">{p.name}</p>
                    <p className="text-sm text-neutral-500">₩{p.price.toLocaleString("ko-KR")}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-400">재고 {p.currentStock}</span>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => changeQty(p, -1)}
                  className="h-10 w-10 rounded-full border border-neutral-300 text-lg font-semibold text-neutral-700 active:bg-neutral-100"
                >
                  −
                </button>
                <span className="w-8 text-center text-lg font-semibold text-neutral-900">{qty}</span>
                <button
                  onClick={() => changeQty(p, 1)}
                  disabled={qty >= p.currentStock}
                  className="h-10 w-10 rounded-full border border-neutral-300 text-lg font-semibold text-neutral-700 active:bg-neutral-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <p className="col-span-full text-sm text-neutral-400">판매 중인 상품이 없습니다.</p>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-neutral-200 bg-white p-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs text-neutral-400">{lines.length}개 상품 선택됨</p>
            <p className="text-xl font-bold text-neutral-900">₩{total.toLocaleString("ko-KR")}</p>
          </div>
          <button
            onClick={complete}
            disabled={lines.length === 0 || submitting}
            className="rounded-lg bg-neutral-900 px-8 py-3 text-base font-semibold text-white disabled:opacity-40"
          >
            {submitting ? "처리 중…" : "판매 완료"}
          </button>
        </div>
      </div>
    </div>
  );
}
