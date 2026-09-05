import { NextRequest, NextResponse } from "next/server";
import { readOnly } from "@/lib/store";
import { createOrder } from "@/lib/orders";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const product = searchParams.get("product");
  const orderNumber = searchParams.get("orderNumber");
  const status = searchParams.get("status");
  const minAmount = searchParams.get("minAmount");
  const maxAmount = searchParams.get("maxAmount");

  const orders = await readOnly((s) => s.orders);
  let filtered = orders;

  if (date) filtered = filtered.filter((o) => o.createdAt.slice(0, 10) === date);
  if (product) filtered = filtered.filter((o) => o.items.some((i) => i.name.includes(product)));
  if (orderNumber) filtered = filtered.filter((o) => String(o.orderNumber).includes(orderNumber));
  if (status && status !== "all") filtered = filtered.filter((o) => o.status === status);
  if (minAmount) filtered = filtered.filter((o) => o.total >= Number(minAmount));
  if (maxAmount) filtered = filtered.filter((o) => o.total <= Number(maxAmount));

  filtered = [...filtered].sort((a, b) => b.orderNumber - a.orderNumber);

  return NextResponse.json({ orders: filtered });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    const order = await createOrder(items, {
      sellerName: body?.sellerName ?? "",
      sellerPhone: body?.sellerPhone ?? "",
      managerName: body?.managerName ?? "",
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
