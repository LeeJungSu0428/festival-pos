import { withStore, readOnly, type GoodsViewerState } from "./store";

export class GoodsViewerError extends Error {}

export async function getGoodsViewer(): Promise<GoodsViewerState> {
  return readOnly((s) => s.goodsViewer);
}

export async function updateGoodsViewerImage(imageUrl: string | null): Promise<GoodsViewerState> {
  return withStore((store) => {
    store.goodsViewer.imageUrl = imageUrl || null;
    return store.goodsViewer;
  });
}

export async function setGoodsViewerSizeAvailable(
  label: string,
  available: boolean
): Promise<GoodsViewerState> {
  return withStore((store) => {
    const size = store.goodsViewer.sizes.find((s) => s.label === label);
    if (!size) throw new GoodsViewerError("존재하지 않는 사이즈입니다.");
    size.available = available;
    return store.goodsViewer;
  });
}
