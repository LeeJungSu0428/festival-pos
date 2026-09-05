import { withStore, type Order, type OrderItem } from "./store";

export class OrderError extends Error {}

export type CreateOrderItemInput = { productId: string; size?: string | null; qty: number };

export type CreateOrderMeta = {
  sellerName: string;
  sellerPhone: string;
  managerName: string;
};

/**
 * 주문을 생성하고 재고를 즉시 차감한다.
 * 사이즈가 있는 상품이면 해당 사이즈의 재고를, 없으면 상품 전체 재고를 차감한다.
 * 판매자 이름/전화번호, 재고관리 담당자 이름은 매번 정확히 입력되어야 한다.
 */
export async function createOrder(items: CreateOrderItemInput[], meta: CreateOrderMeta): Promise<Order> {
  if (!items || items.length === 0) {
    throw new OrderError("상품을 선택해주세요.");
  }
  const sellerName = meta?.sellerName?.trim();
  const sellerPhone = meta?.sellerPhone?.trim();
  const managerName = meta?.managerName?.trim();
  if (!sellerName) throw new OrderError("판매자 이름을 입력해주세요.");
  if (!sellerPhone) throw new OrderError("판매자 전화번호를 입력해주세요.");
  if (!managerName) throw new OrderError("재고관리 담당자 이름을 입력해주세요.");

  return withStore((store) => {
    const orderItems: OrderItem[] = [];

    // 먼저 전부 검증만 하고(재고 변경은 하지 않고), 문제 없을 때만 실제로 차감한다.
    for (const raw of items) {
      const qty = Number(raw?.qty);
      const productId = raw?.productId;
      if (!productId || !Number.isFinite(qty) || qty <= 0) {
        throw new OrderError("잘못된 주문 항목입니다.");
      }
      const product = store.products.find((p) => p.id === productId);
      if (!product) throw new OrderError("존재하지 않는 상품입니다.");
      if (!product.active) throw new OrderError(`'${product.name}'은(는) 현재 판매 중이 아닙니다.`);

      if (product.hasSizes) {
        const sizeLabel = raw.size;
        if (!sizeLabel) throw new OrderError(`'${product.name}'의 사이즈를 선택해주세요.`);
        const size = product.sizes.find((s) => s.label === sizeLabel);
        if (!size) throw new OrderError("존재하지 않는 사이즈입니다.");
        if (size.currentStock < qty) {
          throw new OrderError(
            `'${product.name}' ${sizeLabel} 재고가 부족합니다. (남은 재고: ${size.currentStock}개)`
          );
        }
        orderItems.push({
          productId: product.id,
          name: product.name,
          size: sizeLabel,
          qty,
          price: product.price,
          cost: product.cost,
        });
      } else {
        if (product.currentStock < qty) {
          throw new OrderError(`'${product.name}' 재고가 부족합니다. (남은 재고: ${product.currentStock}개)`);
        }
        orderItems.push({
          productId: product.id,
          name: product.name,
          size: null,
          qty,
          price: product.price,
          cost: product.cost,
        });
      }
    }

    for (const item of orderItems) {
      const product = store.products.find((p) => p.id === item.productId)!;
      if (product.hasSizes && item.size) {
        const size = product.sizes.find((s) => s.label === item.size)!;
        size.currentStock -= item.qty;
      } else {
        product.currentStock -= item.qty;
      }
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
      sellerName,
      sellerPhone,
      managerName,
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
      if (!product) continue;
      if (product.hasSizes && item.size) {
        const size = product.sizes.find((s) => s.label === item.size);
        if (size) size.currentStock += item.qty;
      } else {
        product.currentStock += item.qty;
      }
    }
    order.status = "cancelled";
    order.cancelledAt = new Date().toISOString();
    return order;
  });
}
