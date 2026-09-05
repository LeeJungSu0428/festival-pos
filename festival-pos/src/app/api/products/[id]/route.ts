import { NextRequest, NextResponse } from "next/server";
import { updateProduct, deleteProduct } from "@/lib/products";
import { errorResponse } from "@/lib/api";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const product = await updateProduct(params.id, body);
    return NextResponse.json(product);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteProduct(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
