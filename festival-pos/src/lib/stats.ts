import { readOnly } from "./store";

export type DailyStat = { date: string; revenue: number; cost: number; profit: number };
export type ProductStat = {
  productId: string;
  name: string;
  qty: number;
  revenue: number;
  cost: number;
  profit: number;
};

export type Stats = {
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  orderCount: number;
  itemCount: number;
  byDate: DailyStat[];
  byProduct: ProductStat[];
  lowStock: { id: string; name: string; currentStock: number; lowStockThreshold: number }[];
};

/**
 * 취소된 주문은 매출/원가/순수익 집계에서 전부 제외한다.
 * (취소 시 재고는 이미 orders.ts의 cancelOrder에서 복구됨)
 */
export async function getStats(): Promise<Stats> {
  return readOnly((store) => {
    const completed = store.orders.filter((o) => o.status === "completed");

    const totalRevenue = completed.reduce((s, o) => s + o.total, 0);
    const totalCost = completed.reduce((s, o) => s + o.totalCost, 0);
    const netProfit = totalRevenue - totalCost;
    const orderCount = completed.length;
    const itemCount = completed.reduce(
      (s, o) => s + o.items.reduce((s2, i) => s2 + i.qty, 0),
      0
    );

    const byDateMap = new Map<string, { revenue: number; cost: number }>();
    for (const o of completed) {
      const date = o.createdAt.slice(0, 10);
      const entry = byDateMap.get(date) || { revenue: 0, cost: 0 };
      entry.revenue += o.total;
      entry.cost += o.totalCost;
      byDateMap.set(date, entry);
    }
    const byDate: DailyStat[] = Array.from(byDateMap.entries())
      .map(([date, v]) => ({ date, revenue: v.revenue, cost: v.cost, profit: v.revenue - v.cost }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const byProductMap = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
    for (const o of completed) {
      for (const item of o.items) {
        const entry = byProductMap.get(item.productId) || {
          name: item.name,
          qty: 0,
          revenue: 0,
          cost: 0,
        };
        entry.qty += item.qty;
        entry.revenue += item.price * item.qty;
        entry.cost += item.cost * item.qty;
        byProductMap.set(item.productId, entry);
      }
    }
    const byProduct: ProductStat[] = Array.from(byProductMap.entries())
      .map(([productId, v]) => ({
        productId,
        name: v.name,
        qty: v.qty,
        revenue: v.revenue,
        cost: v.cost,
        profit: v.revenue - v.cost,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const lowStock = store.products
      .filter((p) => p.active && p.currentStock <= p.lowStockThreshold)
      .map((p) => ({
        id: p.id,
        name: p.name,
        currentStock: p.currentStock,
        lowStockThreshold: p.lowStockThreshold,
      }));

    return { totalRevenue, totalCost, netProfit, orderCount, itemCount, byDate, byProduct, lowStock };
  });
}
