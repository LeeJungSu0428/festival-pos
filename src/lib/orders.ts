import { withStore, type Order, type OrderItem } from "./store";

export class OrderError extends Error {}

export type CreateOrderItemInput = { productId: string; qty: number };

/**
 * 주문을 생성하고 재고를 즉시 차감한다.
 * "화면에서 +/-를 누르는 것"과 "실제 재고 차감"은 분리되어 있고,
 * 이 함수가 호출되는 시점(판매 완료)에만 실제로 재고가 줄어든다.
 */
export async function createOrder(items: CreateOrderItemInput[]): Promise<Order> {
  if (!items || items.length === 0) {
    throw new OrderError("상품을 선택해주세요.");
  }

  return withStore((store) => {
    const orderItems: OrderItem[] = [];

    // 먼저 전부 검증만 하고(재고 변경은 하지 않고), 문제 없을 때만 실제로 차감한다.
    // -> 중간에 재고 부족 상품이 있으면 앞에서 이미 차감된 상품이 생기는 일을 방지.
    for (const raw of items) {
      const qty = Number(raw?.qty);
      const productId = raw?.productId;
      if (!productId || !Number.isFinite(qty) || qty <= 0) {
        throw new OrderError("잘못된 주문 항목입니다.");
      }
      const product = store.products.find((p) => p.id === productId);
      if (!product) throw new OrderError("존재하지 않는 상품입니다.");
      if (!product.active) throw new OrderError(`'${product.name}'은(는) 현재 판매 중이 아닙니다.`);
      if (product.currentStock < qty) {
        throw new OrderError(`'${product.name}' 재고가 부족합니다. (남은 재고: ${product.currentStock}개)`);
      }
      orderItems.push({
        productId: product.id,
        name: product.name,
        qty,
        price: product.price,
        cost: product.cost,
      });
    }

    for (const item of orderItems) {
      const product = store.products.find((p) => p.id === item.productId)!;
      product.currentStock -= item.qty;
    }

    const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const totalCost = orderItems.reduce((sum, i) => sum + i.cost * i.qty, 0);
    const orderNumber = store.nextOrderNumber;
    store.nextOrderNumber += 1;

    const order: Order = {
      id: `o${orderNumber}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: "completed",
      items: orderItems,
      total,
      totalCost,
    };
    store.orders.push(order);
    return order;
  });
}

/** 주문을 취소하고, 취소된 주문에 포함된 수량만큼 재고를 복구한다. */
export async function cancelOrder(orderId: string): Promise<Order> {
  return withStore((store) => {
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) throw new OrderError("주문을 찾을 수 없습니다.");
    if (order.status === "cancelled") throw new OrderError("이미 취소된 주문입니다.");

    for (const item of order.items) {
      const product = store.products.find((p) => p.id === item.productId);
      if (product) product.currentStock += item.qty;
    }
    order.status = "cancelled";
    order.cancelledAt = new Date().toISOString();
    return order;
  });
}
