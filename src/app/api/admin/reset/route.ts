import { NextResponse } from "next/server";
import { resetStore } from "@/lib/store";

export async function POST() {
  await resetStore();
  return NextResponse.json({ ok: true });
}
