import { NextRequest, NextResponse } from "next/server";
import { listProducts, createProduct } from "@/lib/products";
import { getRoleFromRequest } from "@/lib/session";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const role = await getRoleFromRequest(req);
  const products = await listProducts();

  if (role === "super") {
    return NextResponse.json({ products });
  }

  // 일반 관리자는 판매에 필요한 정보(이름/가격/현재 재고/판매 여부)만 볼 수 있다.
  // 원가·초기 재고·재고 부족 기준 같은 민감한 값은 응답에서 아예 제외한다.
  const filtered = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    hasSizes: p.hasSizes,
    sizes: p.sizes,
    currentStock: p.currentStock,
    active: p.active,
    imageUrl: p.imageUrl,
  }));
  return NextResponse.json({ products: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
