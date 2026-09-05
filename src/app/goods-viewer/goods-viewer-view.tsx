"use client";

import { useEffect, useMemo, useState } from "react";
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

type Cart = Record<string, number>; // key: `${productId}::${size ?? "none"}`

function cartKey(productId: string, size: string | null) {
  return `${productId}::${size ?? "none"}`;
}

export default function GoodsViewerView({
  category,
  title,
}: {
  category: "new-materials" | "international-hall";
  title: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [bankInfo, setBankInfo] = useState("");
  const [cart, setCart] = useState<Cart>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ total: number; bankInfo: string } | null>(
    null
  );

  async function load() {
    const res = await fetch(`/api/goods-viewer?category=${category}`);
    const data = await res.json();
    setProducts(data.products ?? []);
    setBankInfo(data.bankInfo ?? "");
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

  const lines = useMemo(() => {
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
  }, [products, cart]);

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  async function confirmOrder() {
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/goods-viewer/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        items: lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "주문 처리 중 오류가 발생했습니다.");
      return;
    }
    setConfirmedOrder({ total: data.total, bankInfo });
    setCart({});
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

      <main className="grid gap-4 p-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {products.map((p) => (
          <div
            key={p.id}
            className="relative overflow-hidden rounded-xl border border-[#D7E2EE] bg-[#FBFDFF]"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#5B7FA6]/15 blur-2xl" />
            <div className="relative flex aspect-[20/9] items-center justify-center bg-[#E8EEF5]">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
              ) : (
                <span className="text-sm text-[#9AAEC4]">이미지 없음</span>
              )}
            </div>

            <div className="relative p-4">
              <p className="font-semibold text-[#26415F]">{p.name}</p>
              <p className="text-sm text-[#5B6B82]">
                ₩{p.price.toLocaleString("ko-KR")}
                {!p.hasSizes && ` · 재고 ${p.currentStock}`}
              </p>

              <div className="mt-3 space-y-2">
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
                          {size.label}
                          {soldOut ? " (품절)" : ` · 재고 ${size.currentStock}`}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => changeQty(p, size.label, -1)}
                            disabled={soldOut}
                            className="h-7 w-7 rounded-full border border-[#C9D6E4] text-sm font-semibold text-[#26415F] disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold text-[#26415F]">{qty}</span>
                          <button
                            onClick={() => changeQty(p, size.label, 1)}
                            disabled={soldOut || qty >= size.currentStock}
                            className="h-7 w-7 rounded-full border border-[#C9D6E4] text-sm font-semibold text-[#26415F] disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => changeQty(p, null, -1)}
                      className="h-7 w-7 rounded-full border border-[#C9D6E4] text-sm font-semibold text-[#26415F]"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-[#26415F]">
                      {cart[cartKey(p.id, null)] ?? 0}
                    </span>
                    <button
                      onClick={() => changeQty(p, null, 1)}
                      disabled={(cart[cartKey(p.id, null)] ?? 0) >= p.currentStock}
                      className="h-7 w-7 rounded-full border border-[#C9D6E4] text-sm font-semibold text-[#26415F] disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="col-span-full text-sm text-[#9AAEC4]">
            이 사이트에 판매중인 굿즈가 없습니다. 슈퍼관리자 Products에서 상품을 추가하고 담당 사이트를
            지정해주세요.
          </p>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#D7E2EE] bg-[#FBFDFF] p-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs text-[#5B6B82]">{lines.length}개 항목 선택됨</p>
            <p className="text-xl font-bold text-[#26415F]">₩{total.toLocaleString("ko-KR")}</p>
          </div>
          <button
            onClick={confirmOrder}
            disabled={lines.length === 0 || submitting}
            className="rounded-lg bg-[#26415F] px-8 py-3 text-base font-semibold text-[#FBFDFF] disabled:opacity-40"
          >
            {submitting ? "처리 중…" : "주문 확인"}
          </button>
        </div>
      </div>

      {confirmedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConfirmedOrder(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-[#D7E2EE] bg-[#FBFDFF] p-6 text-center"
          >
            <p className="text-sm text-[#5B6B82]">주문이 접수되었습니다</p>
            <p className="mt-2 text-3xl font-bold text-[#26415F]">
              ₩{confirmedOrder.total.toLocaleString("ko-KR")}
            </p>
            <p className="mt-4 text-sm text-[#5B6B82]">아래 계좌로 입금해주세요</p>
            <p className="mt-1 text-lg font-semibold text-[#26415F]">{confirmedOrder.bankInfo}</p>
            <button
              onClick={() => setConfirmedOrder(null)}
              className="mt-6 w-full rounded-lg bg-[#26415F] px-4 py-2.5 text-sm font-medium text-[#FBFDFF]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
