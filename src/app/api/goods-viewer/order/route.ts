import { NextRequest, NextResponse } from "next/server";
import { submitGoodsOrder } from "@/lib/goods-viewer";
import { errorResponse } from "@/lib/api";
import type { ProductCategory } from "@/lib/store";

const VALID: ProductCategory[] = ["new-materials", "international-hall"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category = body?.category as ProductCategory;
    if (!VALID.includes(category)) {
      return NextResponse.json({ error: "잘못된 사이트입니다." }, { status: 400 });
    }
    const items = Array.isArray(body?.items) ? body.items : [];
    const order = await submitGoodsOrder(category, items);
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
