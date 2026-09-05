import { NextRequest, NextResponse } from "next/server";
import { cancelOrder } from "@/lib/orders";
import { errorResponse } from "@/lib/api";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await cancelOrder(params.id);
    return NextResponse.json(order);
  } catch (err) {
    return errorResponse(err);
  }
}
