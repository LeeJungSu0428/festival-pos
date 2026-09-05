import { withStore, readOnly, type GoodsViewerState, type GoodsOrderLine } from "./store";

export class GoodsViewerError extends Error {}

export async function getGoodsViewer(): Promise<GoodsViewerState> {
  return readOnly((s) => s.goodsViewer);
}

export async function updateGoodsItem(
  itemId: string,
  patch: { name?: string; price?: number; imageUrl?: string | null; active?: boolean }
): Promise<GoodsViewerState> {
  return withStore((store) => {
    const item = store.goodsViewer.items.find((i) => i.id === itemId);
    if (!item) throw new GoodsViewerError("존재하지 않는 상품입니다.");

    if (patch.name !== undefined) {
      const name = patch.name.trim();
      if (!name) throw new GoodsViewerError("상품명을 입력해주세요.");
      item.name = name;
    }
    if (patch.price !== undefined) {
      const price = Number(patch.price);
      if (!Number.isFinite(price) || price < 0) throw new GoodsViewerError("가격은 0 이상의 숫자여야 합니다.");
      item.price = price;
    }
    if (patch.imageUrl !== undefined) {
      item.imageUrl = patch.imageUrl || null;
    }
    if (patch.active !== undefined) {
      item.active = Boolean(patch.active);
    }

    return store.goodsViewer;
  });
}

export async function setGoodsItemSizeAvailable(
  itemId: string,
  label: string,
  available: boolean
): Promise<GoodsViewerState> {
  return withStore((store) => {
    const item = store.goodsViewer.items.find((i) => i.id === itemId);
    if (!item) throw new GoodsViewerError("존재하지 않는 상품입니다.");
    const size = item.sizes.find((s) => s.label === label);
    if (!size) throw new GoodsViewerError("존재하지 않는 사이즈입니다.");
    size.available = available;
    return store.goodsViewer;
  });
}

export type SubmitGoodsOrderInput = {
  goodsItemId: string;
  size: string | null;
  qty: number;
}[];

/**
 * 손님이 굿즈 뷰어에서 "확인"을 누른 주문을 기록만 한다.
 * 실제 재고(Product.currentStock)는 절대 건드리지 않는다 — 신소재/국제관 관리자가
 * 이 기록을 보고 자기 사이트에서 수동으로 판매를 입력해야 재고가 줄어든다.
 */
export async function submitGoodsOrder(items: SubmitGoodsOrderInput) {
  if (!items || items.length === 0) {
    throw new GoodsViewerError("담은 상품이 없습니다.");
  }

  return withStore((store) => {
    const lines: GoodsOrderLine[] = [];

    for (const raw of items) {
      const qty = Number(raw?.qty);
      if (!raw?.goodsItemId || !Number.isFinite(qty) || qty <= 0) {
        throw new GoodsViewerError("잘못된 주문 항목입니다.");
      }
      const item = store.goodsViewer.items.find((i) => i.id === raw.goodsItemId);
      if (!item) throw new GoodsViewerError("존재하지 않는 상품입니다.");
      if (!item.active) throw new GoodsViewerError(`'${item.name}'은(는) 현재 판매 중이 아닙니다.`);

      if (item.hasSizes) {
        if (!raw.size) throw new GoodsViewerError(`'${item.name}'의 사이즈를 선택해주세요.`);
        const size = item.sizes.find((s) => s.label === raw.size);
        if (!size) throw new GoodsViewerError("존재하지 않는 사이즈입니다.");
        if (!size.available) throw new GoodsViewerError(`'${item.name}' ${raw.size} 사이즈는 품절입니다.`);
      }

      lines.push({
        goodsItemId: item.id,
        name: item.name,
        size: item.hasSizes ? raw.size : null,
        qty,
        price: item.price,
      });
    }

    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    const order = {
      id: `go${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      lines,
      total,
    };
    store.goodsViewer.orders.push(order);
    return order;
  });
}
