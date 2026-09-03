import { NextResponse } from "next/server";

export function errorResponse(err: unknown, status = 400) {
  if (err instanceof Error) {
    return NextResponse.json({ error: err.message }, { status });
  }
  return NextResponse.json({ error: "알 수 없는 오류가 발생했습니다." }, { status: 500 });
}
