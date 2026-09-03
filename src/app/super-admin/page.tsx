import { getStats } from "@/lib/stats";

function won(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

export default async function DashboardPage() {
  const stats = await getStats();
  const maxRevenue = Math.max(1, ...stats.byDate.map((d) => d.revenue));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">대시보드</h1>
        <p className="mt-1 text-sm text-neutral-500">
          판매 완료된 주문만 집계합니다. 취소된 주문은 제외됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <MetricCard label="총 매출" value={won(stats.totalRevenue)} />
        <MetricCard label="총 원가" value={won(stats.totalCost)} />
        <MetricCard label="순수익" value={won(stats.netProfit)} highlight />
        <MetricCard label="판매 건수" value={`${stats.orderCount.toLocaleString("ko-KR")}건`} />
        <MetricCard label="판매 수량" value={`${stats.itemCount.toLocaleString("ko-KR")}개`} />
      </div>

      {stats.lowStock.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="mb-1 text-sm font-semibold text-amber-800">재고 부족 알림</p>
          <ul className="space-y-0.5 text-sm text-amber-700">
            {stats.lowStock.map((p) => (
              <li key={p.id}>
                {p.name} — 남은 재고 {p.currentStock}개 (기준: {p.lowStockThreshold}개)
              </li>
            ))}
          </ul>
        </div>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">날짜별 매출 / 순수익</h2>
        {stats.byDate.length === 0 ? (
          <p className="text-sm text-neutral-400">아직 판매 기록이 없습니다.</p>
        ) : (
          <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
            {stats.byDate.map((d) => (
              <div key={d.date}>
                <div className="mb-1 flex flex-wrap justify-between gap-x-4 text-sm">
                  <span className="font-medium text-neutral-700">{d.date}</span>
                  <span className="text-neutral-500">
                    매출 {won(d.revenue)} · 원가 {won(d.cost)} · 순수익 {won(d.profit)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full bg-neutral-900"
                    style={{ width: `${(d.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">상품별 판매 / 수익</h2>
        {stats.byProduct.length === 0 ? (
          <p className="text-sm text-neutral-400">아직 판매 기록이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="px-4 py-2 font-medium">상품</th>
                  <th className="px-4 py-2 text-right font-medium">판매 수량</th>
                  <th className="px-4 py-2 text-right font-medium">매출</th>
                  <th className="px-4 py-2 text-right font-medium">원가</th>
                  <th className="px-4 py-2 text-right font-medium">순수익</th>
                </tr>
              </thead>
              <tbody>
                {stats.byProduct.map((p) => (
                  <tr key={p.productId} className="border-t border-neutral-100">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2 text-right">{p.qty.toLocaleString("ko-KR")}</td>
                    <td className="px-4 py-2 text-right">{won(p.revenue)}</td>
                    <td className="px-4 py-2 text-right">{won(p.cost)}</td>
                    <td className="px-4 py-2 text-right">{won(p.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        highlight ? "border-emerald-300 bg-emerald-50" : "border-neutral-200 bg-white"
      }`}
    >
      <p className="mb-1 text-xs text-neutral-500">{label}</p>
      <p className={`text-xl font-bold ${highlight ? "text-emerald-700" : "text-neutral-900"}`}>{value}</p>
    </div>
  );
}
