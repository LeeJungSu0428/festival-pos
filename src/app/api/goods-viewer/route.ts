import { NextRequest, NextResponse } from "next/server";
import { getGoodsViewerForCategory } from "@/lib/goods-viewer";
import type { ProductCategory } from "@/lib/store";

const VALID: ProductCategory[] = ["new-materials", "international-hall"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as ProductCategory | null;

  if (!category || !VALID.includes(category)) {
    return NextResponse.json({ error: "잘못된 사이트입니다." }, { status: 400 });
  }

  const data = await getGoodsViewerForCategory(category);
  return NextResponse.json(data);
}
