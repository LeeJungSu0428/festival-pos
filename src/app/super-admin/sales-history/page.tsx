"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type OrderItem = { productId: string; name: string; size: string | null; qty: number; price: number; cost: number };
type Order = {
  id: string;
  orderNumber: number;
  createdAt: string;
  status: "completed" | "cancelled";
  items: OrderItem[];
  total: number;
  totalCost: number;
  cancelledAt?: string;
  buyerName: string;
  buyerPhone: string;
  managerName: string;
};

const emptyFilters = {
  date: "",
  product: "",
  orderNumber: "",
  status: "all",
  minAmount: "",
  maxAmount: "",
};

export default function SalesHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load(f: typeof emptyFilters) {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.date) params.set("date", f.date);
    if (f.product) params.set("product", f.product);
    if (f.orderNumber) params.set("orderNumber", f.orderNumber);
    if (f.status && f.status !== "all") params.set("status", f.status);
    if (f.minAmount) params.set("minAmount", f.minAmount);
    if (f.maxAmount) params.set("maxAmount", f.maxAmount);

    const res = await fetch(`/api/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load(emptyFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleFilterSubmit(e: FormEvent) {
    e.preventDefault();
    load(filters);
  }

  function resetFilters() {
    setFilters(emptyFilters);
    load(emptyFilters);
  }

  async function cancel(order: Order) {
    if (!confirm(`주문 #${order.orderNumber}을(를) 취소할까요? 재고가 복구됩니다.`)) return;
    await fetch(`/api/orders/${order.id}/cancel`, { method: "POST" });
    load(filters);
  }

  function downloadCsv() {
    const header = [
      "주문번호",
      "판매시간",
      "상태",
      "구매자",
      "구매자 전화번호",
      "재고관리 담당자",
      "상품",
      "사이즈",
      "수량",
      "판매가",
      "원가",
      "소계",
    ];
    const rows: string[][] = [];
    for (const o of orders) {
      for (const item of o.items) {
        rows.push([
          String(o.orderNumber),
          o.createdAt,
          o.status === "completed" ? "판매완료" : "취소",
          o.buyerName,
          o.buyerPhone,
          o.managerName,
          item.name,
          item.size ?? "",
          String(item.qty),
          String(item.price),
          String(item.cost),
          String(item.price * item.qty),
        ]);
      }
    }
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totals = orders
    .filter((o) => o.status === "completed")
    .reduce(
      (acc, o) => {
        acc.revenue += o.total;
        acc.cost += o.totalCost;
        return acc;
      },
      { revenue: 0, cost: 0 }
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">판매 기록</h1>
          <p className="mt-1 text-sm text-neutral-500">전체 주문 내역을 검색하고 확인할 수 있습니다.</p>
        </div>
        <button
          onClick={downloadCsv}
          className="rounded border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          CSV 다운로드
        </button>
      </div>

      <form
        onSubmit={handleFilterSubmit}
        className="grid grid-cols-2 items-end gap-3 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-6"
      >
        <Field label="날짜">
          <input
            type="date"
            className="input"
            value={filters.date}
            onChange={(e) => setFilters((f) => ({ ...f, date: e.target.value }))}
          />
        </Field>
        <Field label="상품">
          <input
            className="input"
            value={filters.product}
            onChange={(e) => setFilters((f) => ({ ...f, product: e.target.value }))}
            placeholder="예: 키캡"
          />
        </Field>
        <Field label="주문 번호">
          <input
            className="input"
            value={filters.orderNumber}
            onChange={(e) => setFilters((f) => ({ ...f, orderNumber: e.target.value }))}
          />
        </Field>
        <Field label="상태">
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="all">전체</option>
            <option value="completed">판매완료</option>
            <option value="cancelled">취소</option>
          </select>
        </Field>
        <Field label="최소 금액">
          <input
            type="number"
            className="input"
            value={filters.minAmount}
            onChange={(e) => setFilters((f) => ({ ...f, minAmount: e.target.value }))}
          />
        </Field>
        <Field label="최대 금액">
          <input
            type="number"
            className="input"
            value={filters.maxAmount}
            onChange={(e) => setFilters((f) => ({ ...f, maxAmount: e.target.value }))}
          />
        </Field>
        <div className="col-span-2 flex gap-2 md:col-span-6">
          <button className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white">검색</button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600"
          >
            초기화
          </button>
        </div>
      </form>

      <div className="text-sm text-neutral-500">
        조회된 {orders.length}건 · 매출 합계 ₩{totals.revenue.toLocaleString("ko-KR")} · 원가 합계 ₩
        {totals.cost.toLocaleString("ko-KR")} · 순수익 ₩{(totals.revenue - totals.cost).toLocaleString("ko-KR")}
        <span className="ml-1">(취소 주문 제외)</span>
      </div>

      {loading ? (
        <p className="text-sm text-neutral-400">불러오는 중…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-neutral-400">조건에 맞는 판매 기록이 없습니다.</p>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const profit = o.total - o.totalCost;
            const isOpen = expanded === o.id;
            return (
              <div key={o.id} className="rounded-lg border border-neutral-200 bg-white">
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left"
                >
                  <div>
                    <span className="font-semibold text-neutral-900">주문 #{o.orderNumber}</span>
                    <span className="ml-2 text-sm text-neutral-400">
                      {new Date(o.createdAt).toLocaleString("ko-KR")}
                    </span>
                    {o.status === "cancelled" && (
                      <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">
                        취소됨
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-600">
                    ₩{o.total.toLocaleString("ko-KR")} · 순수익 ₩{profit.toLocaleString("ko-KR")}
                  </div>
                </button>
                {isOpen && (
                  <div className="border-t border-neutral-100 px-4 py-3">
                    <p className="mb-2 text-sm text-neutral-500">
                      구매자: <span className="text-neutral-800">{o.buyerName || "-"}</span> (
                      {o.buyerPhone || "-"}) · 재고관리 담당자:{" "}
                      <span className="text-neutral-800">{o.managerName || "-"}</span>
                    </p>
                    <table className="w-full text-sm">
                      <thead className="text-left text-neutral-500">
                        <tr>
                          <th className="py-1 font-medium">상품</th>
                          <th className="py-1 text-right font-medium">수량</th>
                          <th className="py-1 text-right font-medium">판매가</th>
                          <th className="py-1 text-right font-medium">원가</th>
                          <th className="py-1 text-right font-medium">소계</th>
                        </tr>
                      </thead>
                      <tbody>
                        {o.items.map((item, i) => (
                          <tr key={i} className="border-t border-neutral-50">
                            <td className="py-1">
                              {item.name}
                              {item.size && <span className="text-[#5B6B82]"> ({item.size})</span>}
                            </td>
                            <td className="py-1 text-right">{item.qty}</td>
                            <td className="py-1 text-right">₩{item.price.toLocaleString("ko-KR")}</td>
                            <td className="py-1 text-right">₩{item.cost.toLocaleString("ko-KR")}</td>
                            <td className="py-1 text-right">
                              ₩{(item.price * item.qty).toLocaleString("ko-KR")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm text-neutral-500">
                        총 매출 ₩{o.total.toLocaleString("ko-KR")} · 총 원가 ₩
                        {o.totalCost.toLocaleString("ko-KR")} · 순수익 ₩{profit.toLocaleString("ko-KR")}
                      </p>
                      {o.status === "completed" && (
                        <button
                          onClick={() => cancel(o)}
                          className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          판매 취소
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
