import { NextRequest, NextResponse } from "next/server";
import { submitGoodsOrder } from "@/lib/goods-viewer";
import { errorResponse } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    const order = await submitGoodsOrder(items);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
