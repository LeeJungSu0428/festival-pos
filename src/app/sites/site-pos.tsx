"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandBackdrop from "@/components/BrandBackdrop";

type ProductSize = { label: string; initialStock: number; currentStock: number };
type Product = {
  id: string;
  name: string;
  category: "new-materials" | "international-hall";
  price: number;
  hasSizes: boolean;
  sizes: ProductSize[];
  currentStock: number;
  active: boolean;
  imageUrl: string | null;
};

// cart key: `${productId}::${size ?? "none"}`
type Cart = Record<string, number>;

function cartKey(productId: string, size: string | null) {
  return `${productId}::${size ?? "none"}`;
}

export default function SitePos({
  category,
  title,
}: {
  category: "new-materials" | "international-hall";
  title: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmForm, setConfirmForm] = useState({ buyerName: "", buyerPhone: "", managerName: "" });
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<{ id: string; orderNumber: number; total: number } | null>(
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);

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

  function maxQtyFor(p: Product, size: string | null) {
    if (p.hasSizes && size) {
      return p.sizes.find((s) => s.label === size)?.currentStock ?? 0;
    }
    return p.currentStock;
  }

  function changeQty(p: Product, size: string | null, delta: number) {
    const key = cartKey(p.id, size);
    const max = maxQtyFor(p, size);
    setCart((prev) => {
      const next = Math.max(0, Math.min(max, (prev[key] ?? 0) + delta));
      return { ...prev, [key]: next };
    });
  }

  const lines = (() => {
    const result: { productId: string; name: string; size: string | null; qty: number; price: number }[] = [];
    for (const p of products) {
      if (p.hasSizes) {
        for (const size of p.sizes) {
          const qty = cart[cartKey(p.id, size.label)] ?? 0;
          if (qty > 0) result.push({ productId: p.id, name: p.name, size: size.label, qty, price: p.price });
        }
      } else {
        const qty = cart[cartKey(p.id, null)] ?? 0;
        if (qty > 0) result.push({ productId: p.id, name: p.name, size: null, qty, price: p.price });
      }
    }
    return result;
  })();

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  function openConfirm() {
    if (lines.length === 0) return;
    setConfirmForm({ buyerName: "", buyerPhone: "", managerName: "" });
    setConfirmError(null);
    setShowConfirm(true);
  }

  async function submitSale() {
    const buyerName = confirmForm.buyerName.trim();
    const buyerPhone = confirmForm.buyerPhone.trim();
    const managerName = confirmForm.managerName.trim();
    if (!buyerName || !buyerPhone || !managerName) {
      setConfirmError("구매자 이름, 전화번호, 재고관리 담당자 이름을 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    setConfirmError(null);
    setError(null);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
        buyerName,
        buyerPhone,
        managerName,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setConfirmError(data.error ?? "판매 처리 중 오류가 발생했습니다.");
      return;
    }

    setShowConfirm(false);
    setConfirmForm({ buyerName: "", buyerPhone: "", managerName: "" });
    setLastOrder({ id: data.id, orderNumber: data.orderNumber, total: data.total });
    setShowSuccess(true);
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
        {products.map((p) => (
          <div
            key={p.id}
            className="relative overflow-hidden rounded-xl border border-[#D7E2EE] bg-[#FBFDFF] p-4"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#5B7FA6]/15 blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {p.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} className="h-12 w-16 rounded object-cover" />
                )}
                <div>
                  <p className="font-semibold text-[#26415F]">{p.name}</p>
                  <p className="text-sm text-[#5B6B82]">₩{p.price.toLocaleString("ko-KR")}</p>
                </div>
              </div>
              {!p.hasSizes && <span className="text-xs text-[#9AAEC4]">재고 {p.currentStock}</span>}
            </div>

            <div className="relative mt-3 space-y-2">
              {p.hasSizes ? (
                p.sizes.map((size) => {
                  const soldOut = size.currentStock <= 0;
                  const qty = cart[cartKey(p.id, size.label)] ?? 0;
                  return (
                    <div key={size.label} className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          soldOut ? "text-[#9AAEC4] line-through" : "text-[#26415F]"
                        }`}
                      >
                        {size.label} · 재고 {size.currentStock}
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => changeQty(p, size.label, -1)}
                          disabled={soldOut}
                          className="h-8 w-8 rounded-full border border-[#C9D6E4] text-sm font-semibold text-[#26415F] disabled:opacity-30"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-[#26415F]">{qty}</span>
                        <button
                          onClick={() => changeQty(p, size.label, 1)}
                          disabled={soldOut || qty >= size.currentStock}
                          className="h-8 w-8 rounded-full border border-[#C9D6E4] text-sm font-semibold text-[#26415F] disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => changeQty(p, null, -1)}
                    className="h-10 w-10 rounded-full border border-[#C9D6E4] text-lg font-semibold text-[#26415F]"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-lg font-semibold text-[#26415F]">
                    {cart[cartKey(p.id, null)] ?? 0}
                  </span>
                  <button
                    onClick={() => changeQty(p, null, 1)}
                    disabled={(cart[cartKey(p.id, null)] ?? 0) >= p.currentStock}
                    className="h-10 w-10 rounded-full border border-[#C9D6E4] text-lg font-semibold text-[#26415F] disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
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
            onClick={openConfirm}
            disabled={lines.length === 0 || submitting}
            className="rounded-lg bg-[#26415F] px-8 py-3 text-base font-semibold text-[#FBFDFF] disabled:opacity-40"
          >
            판매 완료
          </button>
        </div>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !submitting && setShowConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#D7E2EE] bg-[#FBFDFF] p-6"
          >
            <p className="text-lg font-semibold text-[#26415F]">판매 정보 입력</p>
            <p className="mt-1 text-sm text-[#5B6B82]">
              ₩{total.toLocaleString("ko-KR")} · {lines.length}개 항목 · 정확하게 입력해주세요.
            </p>

            <label className="mt-4 block text-sm font-medium text-[#26415F]">구매자 이름</label>
            <input
              autoFocus
              className="mt-1 w-full rounded-lg border border-[#C9D6E4] bg-white px-3 py-2 text-sm text-[#26415F] outline-none focus:border-[#3B5B82]"
              value={confirmForm.buyerName}
              onChange={(e) => setConfirmForm((f) => ({ ...f, buyerName: e.target.value }))}
            />

            <label className="mt-3 block text-sm font-medium text-[#26415F]">구매자 전화번호</label>
            <input
              className="mt-1 w-full rounded-lg border border-[#C9D6E4] bg-white px-3 py-2 text-sm text-[#26415F] outline-none focus:border-[#3B5B82]"
              value={confirmForm.buyerPhone}
              onChange={(e) => setConfirmForm((f) => ({ ...f, buyerPhone: e.target.value }))}
              placeholder="010-0000-0000"
            />

            <label className="mt-3 block text-sm font-medium text-[#26415F]">재고관리 담당자 이름</label>
            <input
              className="mt-1 w-full rounded-lg border border-[#C9D6E4] bg-white px-3 py-2 text-sm text-[#26415F] outline-none focus:border-[#3B5B82]"
              value={confirmForm.managerName}
              onChange={(e) => setConfirmForm((f) => ({ ...f, managerName: e.target.value }))}
            />

            {confirmError && <p className="mt-3 text-sm text-red-600">{confirmError}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="flex-1 rounded-full border border-[#C9D6E4] px-4 py-2 text-sm font-medium text-[#26415F] disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={submitSale}
                disabled={submitting}
                className="flex-1 rounded-full bg-[#26415F] px-4 py-2 text-sm font-medium text-[#FBFDFF] disabled:opacity-50"
              >
                {submitting ? "처리 중…" : "판매 확정"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && lastOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowSuccess(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs rounded-2xl border border-[#D7E2EE] bg-[#FBFDFF] p-6 text-center"
          >
            <p className="text-xl font-bold text-[#26415F]">확인되었습니다</p>
            <p className="mt-2 text-sm text-[#5B6B82]">
              주문 #{lastOrder.orderNumber} · ₩{lastOrder.total.toLocaleString("ko-KR")}
            </p>
            <button
              onClick={() => setShowSuccess(false)}
              className="mt-5 w-full rounded-lg bg-[#26415F] px-4 py-2.5 text-sm font-medium text-[#FBFDFF]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
