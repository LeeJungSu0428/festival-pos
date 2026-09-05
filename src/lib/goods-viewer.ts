import { withStore, readOnly, type ProductCategory, type GoodsOrderLine } from "./store";

export class GoodsViewerError extends Error {}

/** 굿즈 뷰어에 보여줄 상품 목록(판매중인 것 전부, 담당 사이트 상관없이 전체) + 계좌 정보. */
export async function getGoodsViewerForCategory(_category: ProductCategory) {
  return readOnly((s) => ({
    bankInfo: s.goodsViewer.bankInfo,
    products: s.products.filter((p) => p.active),
  }));
}

export type SubmitGoodsOrderInput = {
  productId: string;
  size: string | null;
  qty: number;
}[];

/**
 * 손님이 굿즈 뷰어에서 "주문 확인"을 누른 내역을 기록만 한다.
 * 실제 재고(Product.currentStock / sizes[].currentStock)는 절대 건드리지 않는다 —
 * 신소재/국제관 관리자가 이 기록을 보고 자기 사이트에서 수동으로 판매를 입력해야 재고가 줄어든다.
 * 다만 현재 재고보다 많은 수량을 주문하는 등 말이 안 되는 주문은 막는다.
 */
export async function submitGoodsOrder(category: ProductCategory, items: SubmitGoodsOrderInput) {
  if (!items || items.length === 0) {
    throw new GoodsViewerError("담은 상품이 없습니다.");
  }

  return withStore((store) => {
    const lines: GoodsOrderLine[] = [];

    for (const raw of items) {
      const qty = Number(raw?.qty);
      if (!raw?.productId || !Number.isFinite(qty) || qty <= 0) {
        throw new GoodsViewerError("잘못된 주문 항목입니다.");
      }
      const product = store.products.find((p) => p.id === raw.productId);
      if (!product) throw new GoodsViewerError("존재하지 않는 상품입니다.");
      if (!product.active) throw new GoodsViewerError(`'${product.name}'은(는) 현재 판매 중이 아닙니다.`);

      if (product.hasSizes) {
        if (!raw.size) throw new GoodsViewerError(`'${product.name}'의 사이즈를 선택해주세요.`);
        const size = product.sizes.find((s) => s.label === raw.size);
        if (!size) throw new GoodsViewerError("존재하지 않는 사이즈입니다.");
        if (size.currentStock < qty) {
          throw new GoodsViewerError(`'${product.name}' ${raw.size} 재고가 부족합니다.`);
        }
      } else if (product.currentStock < qty) {
        throw new GoodsViewerError(`'${product.name}' 재고가 부족합니다.`);
      }

      lines.push({
        productId: product.id,
        name: product.name,
        size: product.hasSizes ? raw.size : null,
        qty,
        price: product.price,
      });
    }

    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const order = {
      id: `go${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      category,
      createdAt: new Date().toISOString(),
      lines,
      total,
    };
    store.goodsViewer.orders.push(order);
    return order;
  });
}
