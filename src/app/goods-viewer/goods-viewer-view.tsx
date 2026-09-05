"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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

function isSoldOut(p: Product) {
  if (p.hasSizes) return p.sizes.every((s) => s.currentStock <= 0);
  return p.currentStock <= 0;
}

function StepperButton({
  onClick,
  disabled,
  active,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold disabled:opacity-30 ${
        active ? "bg-[#26415F] text-[#FBFDFF]" : "border border-[#C9D6E4] text-[#26415F]"
      }`}
    >
      {children}
    </button>
  );
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

  const checkoutPanel = (
    <div className="rounded-2xl border border-[#D7E2EE] bg-[#FBFDFF] p-5">
      <p className="text-xs font-semibold tracking-[0.15em] text-[#5B7FA6]">CHECKOUT</p>
      <h2 className="mt-1 text-lg font-bold text-[#26415F]">주문서</h2>

      {lines.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#F3F7FB] p-4 text-sm text-[#5B6B82]">
          선택한 굿즈가 없습니다.
          <br />
          상품 카드에서 + 버튼으로 수량을 담아주세요.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {lines.map((l) => (
            <li
              key={`${l.productId}-${l.size ?? "none"}`}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-[#26415F]">
                {l.name}
                {l.size && ` (${l.size})`} × {l.qty}
              </span>
              <span className="font-medium text-[#26415F]">
                ₩{(l.price * l.qty).toLocaleString("ko-KR")}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-[#E8EEF5] pt-4">
        <span className="text-sm text-[#5B6B82]">합계</span>
        <span className="text-xl font-bold text-[#26415F]">₩{total.toLocaleString("ko-KR")}</span>
      </div>

      <button
        onClick={confirmOrder}
        disabled={lines.length === 0 || submitting}
        className="mt-4 w-full rounded-lg bg-[#26415F] px-4 py-3 text-sm font-semibold text-[#FBFDFF] disabled:opacity-40"
      >
        {submitting ? "처리 중…" : "주문 확인"}
      </button>
    </div>
  );

  return (
    <div className="relative min-h-screen pb-10">
      <BrandBackdrop />
      <header className="flex items-center justify-between border-b border-[#D7E2EE] bg-[#FBFDFF] px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.15em] text-[#5B7FA6]">ORDER</p>
          <h1 className="text-lg font-bold text-[#26415F]">{title}</h1>
        </div>
        <Link href="/hub" className="text-sm text-[#5B6B82] hover:text-[#26415F]">
          ← 허브로
        </Link>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <div className="mb-5 rounded-lg bg-[#E8EEF5] px-4 py-3 text-sm text-[#26415F]">
          상품 카드에서 옵션별 수량을 조절하고{" "}
          <span className="hidden lg:inline">오른쪽 주문서에서</span>
          <span className="lg:hidden">아래 주문서에서</span> 주문을 확인해주세요.
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="grid gap-5 sm:grid-cols-2">
            {products.map((p) => {
              const soldOut = isSoldOut(p);
              return (
                <div key={p.id} className="overflow-hidden rounded-xl border border-[#D7E2EE] bg-[#FBFDFF]">
                  <div className="flex aspect-[20/9] items-center justify-center bg-[#E8EEF5]">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-sm text-[#9AAEC4]">이미지 없음</span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-[#26415F]">{p.name}</p>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          soldOut ? "bg-neutral-100 text-neutral-500" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {soldOut ? "품절" : "판매중"}
                      </span>
                    </div>
                    <p className="mt-1 text-lg font-bold text-[#26415F]">
                      ₩{p.price.toLocaleString("ko-KR")}
                    </p>

                    <div className="mt-4 space-y-3">
                      {p.hasSizes ? (
                        p.sizes.map((size) => {
                          const sizeSoldOut = size.currentStock <= 0;
                          const qty = cart[cartKey(p.id, size.label)] ?? 0;
                          return (
                            <div key={size.label} className="flex items-center justify-between">
                              <div>
                                <p
                                  className={`text-sm font-semibold ${
                                    sizeSoldOut ? "text-[#9AAEC4] line-through" : "text-[#26415F]"
                                  }`}
                                >
                                  {size.label}
                                </p>
                                <p className="text-xs text-[#9AAEC4]">
                                  {sizeSoldOut ? "품절" : `남은 재고 ${size.currentStock}개`}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <StepperButton onClick={() => changeQty(p, size.label, -1)} disabled={sizeSoldOut}>
                                  −
                                </StepperButton>
                                <span className="w-4 text-center text-sm font-semibold text-[#26415F]">
                                  {qty}
                                </span>
                                <StepperButton
                                  onClick={() => changeQty(p, size.label, 1)}
                                  disabled={sizeSoldOut || qty >= size.currentStock}
                                  active={qty > 0}
                                >
                                  +
                                </StepperButton>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-[#9AAEC4]">
                            {soldOut ? "품절" : `남은 재고 ${p.currentStock}개`}
                          </p>
                          <div className="flex items-center gap-3">
                            <StepperButton onClick={() => changeQty(p, null, -1)} disabled={soldOut}>
                              −
                            </StepperButton>
                            <span className="w-4 text-center text-sm font-semibold text-[#26415F]">
                              {cart[cartKey(p.id, null)] ?? 0}
                            </span>
                            <StepperButton
                              onClick={() => changeQty(p, null, 1)}
                              disabled={soldOut || (cart[cartKey(p.id, null)] ?? 0) >= p.currentStock}
                              active={(cart[cartKey(p.id, null)] ?? 0) > 0}
                            >
                              +
                            </StepperButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {products.length === 0 && (
              <p className="col-span-full text-sm text-[#9AAEC4]">
                이 사이트에 판매중인 굿즈가 없습니다. 슈퍼관리자 Products에서 상품을 추가하고 담당 사이트를
                지정해주세요.
              </p>
            )}
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-5">{checkoutPanel}</div>
          </aside>
        </div>

        <div className="mt-6 lg:hidden">{checkoutPanel}</div>
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
