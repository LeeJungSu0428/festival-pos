import { NextRequest, NextResponse } from "next/server";
import { getGoodsViewer, updateGoodsItem, setGoodsItemSizeAvailable } from "@/lib/goods-viewer";
import { errorResponse } from "@/lib/api";

export async function GET() {
  const state = await getGoodsViewer();
  return NextResponse.json(state);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.itemId || typeof body.itemId !== "string") {
      return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
    }

    if (typeof body.size === "string" && typeof body.available === "boolean") {
      const state = await setGoodsItemSizeAvailable(body.itemId, body.size, body.available);
      return NextResponse.json(state);
    }

    if (body.patch && typeof body.patch === "object") {
      const state = await updateGoodsItem(body.itemId, body.patch);
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
