"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BrandBackdrop from "@/components/BrandBackdrop";

type GoodsSize = { label: string; available: boolean };
type GoodsItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string | null;
  hasSizes: boolean;
  sizes: GoodsSize[];
  active: boolean;
};
type GoodsViewerState = { items: GoodsItem[]; bankInfo: string };

// cart key: hasSizes면 `${itemId}::${size}`, 아니면 `${itemId}::none`
type Cart = Record<string, number>;

function cartKey(itemId: string, size: string | null) {
  return `${itemId}::${size ?? "none"}`;
}

export default function GoodsViewerPage() {
  const [state, setState] = useState<GoodsViewerState | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [editMode, setEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ total: number; bankInfo: string } | null>(
    null
  );

  async function load() {
    const res = await fetch("/api/goods-viewer");
    const data = await res.json();
    setState(data);
  }

  useEffect(() => {
    load();
  }, []);

  function changeQty(item: GoodsItem, size: string | null, delta: number) {
    const key = cartKey(item.id, size);
    setCart((prev) => {
      const next = Math.max(0, (prev[key] ?? 0) + delta);
      return { ...prev, [key]: next };
    });
  }

  const lines = useMemo(() => {
    if (!state) return [];
    const result: { itemId: string; name: string; size: string | null; qty: number; price: number }[] = [];
    for (const item of state.items) {
      if (item.hasSizes) {
        for (const size of item.sizes) {
          const qty = cart[cartKey(item.id, size.label)] ?? 0;
          if (qty > 0) result.push({ itemId: item.id, name: item.name, size: size.label, qty, price: item.price });
        }
      } else {
        const qty = cart[cartKey(item.id, null)] ?? 0;
        if (qty > 0) result.push({ itemId: item.id, name: item.name, size: null, qty, price: item.price });
      }
    }
    return result;
  }, [state, cart]);

  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

  async function saveItem(item: GoodsItem, patch: Partial<GoodsItem>) {
    await fetch("/api/goods-viewer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, patch }),
    });
    load();
  }

  async function toggleSize(item: GoodsItem, size: GoodsSize) {
    await fetch("/api/goods-viewer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id, size: size.label, available: !size.available }),
    });
    load();
  }

  async function confirmOrder() {
    if (lines.length === 0 || !state) return;
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/goods-viewer/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: lines.map((l) => ({ goodsItemId: l.itemId, size: l.size, qty: l.qty })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "주문 처리 중 오류가 발생했습니다.");
      return;
    }
    setConfirmedOrder({ total: data.total, bankInfo: state.bankInfo });
    setCart({});
  }

  return (
    <div className="relative min-h-screen pb-32">
      <BrandBackdrop />
      <header className="flex items-center justify-between border-b border-[#E7D9C3] bg-[#FFFCF6] px-4 py-3 sm:px-6">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#A47F55]">애국한양응원제 : 오름</p>
          <h1 className="text-lg font-bold text-[#3E2A1B]">굿즈 뷰어</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              editMode
                ? "border-[#B4632B] bg-[#B4632B] text-white"
                : "border-[#D9C7AE] text-[#5B3A22]"
            }`}
          >
            {editMode ? "수정 완료" : "관리 모드"}
          </button>
          <Link href="/hub" className="text-sm text-[#8A6F52] hover:text-[#3E2A1B]">
            ← 허브로
          </Link>
        </div>
      </header>

      {error && <p className="px-4 pt-4 text-sm text-red-600 sm:px-6">{error}</p>}

      <main className="grid gap-4 p-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {(state?.items ?? []).map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border border-[#E7D9C3] bg-[#FFFCF6]">
            <div className="aspect-square bg-[#F1E9DA]">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[#B29E82]">
                  이미지 없음
                </div>
              )}
            </div>

            <div className="p-4">
              {editMode ? (
                <div className="space-y-2">
                  <input
                    className="w-full rounded border border-[#E3D3BA] bg-white px-2 py-1.5 text-sm"
                    value={item.name}
                    onChange={(e) => saveItem(item, { name: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#8A6F52]">₩</span>
                    <input
                      type="number"
                      className="w-full rounded border border-[#E3D3BA] bg-white px-2 py-1.5 text-sm"
                      value={item.price}
                      onChange={(e) => saveItem(item, { price: Number(e.target.value) })}
                    />
                  </div>
                  <input
                    className="w-full rounded border border-[#E3D3BA] bg-white px-2 py-1.5 text-xs"
                    value={item.imageUrl ?? ""}
                    onChange={(e) => saveItem(item, { imageUrl: e.target.value })}
                    placeholder="이미지 경로 또는 URL"
                  />
                  <label className="flex items-center gap-1.5 text-xs text-[#5B3A22]">
                    <input
                      type="checkbox"
                      checked={item.active}
                      onChange={(e) => saveItem(item, { active: e.target.checked })}
                    />
                    판매중
                  </label>
                </div>
              ) : (
                <>
                  <p className="font-semibold text-[#3E2A1B]">{item.name}</p>
                  <p className="text-sm text-[#8A6F52]">₩{item.price.toLocaleString("ko-KR")}</p>
                </>
              )}

              {!item.active && (
                <p className="mt-2 text-xs font-medium text-red-500">현재 판매 중이 아닙니다.</p>
              )}

              {item.active && (
                <div className="mt-3 space-y-2">
                  {item.hasSizes ? (
                    item.sizes.map((size) => (
                      <div key={size.label} className="flex items-center justify-between">
                        <button
                          onClick={() => editMode && toggleSize(item, size)}
                          className={`text-sm font-medium ${
                            size.available ? "text-[#3E2A1B]" : "text-[#B29E82] line-through"
                          } ${editMode ? "underline decoration-dotted" : ""}`}
                        >
                          {size.label}
                          {!size.available && " (품절)"}
                        </button>
                        {!editMode && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => changeQty(item, size.label, -1)}
                              disabled={!size.available}
                              className="h-7 w-7 rounded-full border border-[#D9C7AE] text-sm font-semibold text-[#5B3A22] disabled:opacity-30"
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-sm font-semibold text-[#3E2A1B]">
                              {cart[cartKey(item.id, size.label)] ?? 0}
                            </span>
                            <button
                              onClick={() => changeQty(item, size.label, 1)}
                              disabled={!size.available}
                              className="h-7 w-7 rounded-full border border-[#D9C7AE] text-sm font-semibold text-[#5B3A22] disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  ) : !editMode ? (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => changeQty(item, null, -1)}
                        className="h-7 w-7 rounded-full border border-[#D9C7AE] text-sm font-semibold text-[#5B3A22]"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-sm font-semibold text-[#3E2A1B]">
                        {cart[cartKey(item.id, null)] ?? 0}
                      </span>
                      <button
                        onClick={() => changeQty(item, null, 1)}
                        className="h-7 w-7 rounded-full border border-[#D9C7AE] text-sm font-semibold text-[#5B3A22]"
                      >
                        +
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E7D9C3] bg-[#FFFCF6] p-4 sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div>
            <p className="text-xs text-[#8A6F52]">{lines.length}개 항목 선택됨</p>
            <p className="text-xl font-bold text-[#3E2A1B]">₩{total.toLocaleString("ko-KR")}</p>
          </div>
          <button
            onClick={confirmOrder}
            disabled={lines.length === 0 || submitting}
            className="rounded-lg bg-[#3E2A1B] px-8 py-3 text-base font-semibold text-[#FFFCF6] disabled:opacity-40"
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
            className="w-full max-w-sm rounded-2xl border border-[#E7D9C3] bg-[#FFFCF6] p-6 text-center"
          >
            <p className="text-sm text-[#8A6F52]">주문이 접수되었습니다</p>
            <p className="mt-2 text-3xl font-bold text-[#3E2A1B]">
              ₩{confirmedOrder.total.toLocaleString("ko-KR")}
            </p>
            <p className="mt-4 text-sm text-[#8A6F52]">아래 계좌로 입금해주세요</p>
            <p className="mt-1 text-lg font-semibold text-[#3E2A1B]">{confirmedOrder.bankInfo}</p>
            <button
              onClick={() => setConfirmedOrder(null)}
              className="mt-6 w-full rounded-lg bg-[#3E2A1B] px-4 py-2.5 text-sm font-medium text-[#FFFCF6]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
