import { NextRequest, NextResponse } from "next/server";
import { getGoodsViewer, updateGoodsViewerImage, setGoodsViewerSizeAvailable } from "@/lib/goods-viewer";
import { errorResponse } from "@/lib/api";

export async function GET() {
  const state = await getGoodsViewer();
  return NextResponse.json(state);
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (typeof body.imageUrl !== "undefined") {
      const state = await updateGoodsViewerImage(body.imageUrl);
      return NextResponse.json(state);
    }

    if (typeof body.label === "string" && typeof body.available === "boolean") {
      const state = await setGoodsViewerSizeAvailable(body.label, body.available);
      return NextResponse.json(state);
    }

    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  } catch (err) {
    return errorResponse(err);
  }
}
