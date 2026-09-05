import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/session";

/**
 * 프론트엔드에서 화면만 숨기는 게 아니라, 여기(서버)에서 모든 접근을 검증한다.
 * 일반 관리자가 /super-admin 이나 판매기록/통계 API 주소를 직접 입력해도 차단된다.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const cookieValue = req.cookies.get(SESSION_COOKIE)?.value;
  const role = await verifySessionValue(cookieValue);

  const isApi = pathname.startsWith("/api/");

  function deny(status: number, message: string) {
    if (isApi) {
      return NextResponse.json({ error: message }, { status });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  // ---- 페이지 ----
  if (pathname.startsWith("/super-admin")) {
    if (role !== "super") return deny(403, "슈퍼관리자만 접근할 수 있습니다.");
  }
  if (pathname.startsWith("/pos")) {
    if (role !== "admin" && role !== "super") return deny(401, "로그인이 필요합니다.");
  }
  if (
    pathname.startsWith("/hub") ||
    pathname.startsWith("/sites") ||
    pathname.startsWith("/goods-viewer")
  ) {
    if (role !== "admin" && role !== "super") return deny(401, "로그인이 필요합니다.");
  }

  // ---- API: 상품 ----
  if (pathname.startsWith("/api/products")) {
    if (req.method === "GET") {
      if (role !== "admin" && role !== "super") return deny(401, "로그인이 필요합니다.");
    } else {
      // 상품 추가/수정/삭제(가격·원가·재고 등)는 슈퍼관리자만 가능
      if (role !== "super") return deny(403, "슈퍼관리자만 가능합니다.");
    }
  }

  // ---- API: 주문/판매 ----
  if (pathname.startsWith("/api/orders")) {
    if (pathname.endsWith("/cancel")) {
      // 판매 취소는 일반 관리자도 가능
      if (role !== "admin" && role !== "super") return deny(401, "로그인이 필요합니다.");
    } else if (req.method === "GET") {
      // 전체 판매 기록 조회/검색은 슈퍼관리자만 가능
      if (role !== "super") return deny(403, "슈퍼관리자만 가능합니다.");
    } else if (req.method === "POST") {
      // 판매(주문 생성)는 일반 관리자도 가능
      if (role !== "admin" && role !== "super") return deny(401, "로그인이 필요합니다.");
    }
  }

  // ---- API: 굿즈 뷰어 ----
  if (pathname.startsWith("/api/goods-viewer")) {
    if (role !== "admin" && role !== "super") return deny(401, "로그인이 필요합니다.");
  }

  // ---- API: 통계/대시보드 ----
  if (pathname.startsWith("/api/stats")) {
    if (role !== "super") return deny(403, "슈퍼관리자만 가능합니다.");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/super-admin/:path*",
    "/pos/:path*",
    "/hub/:path*",
    "/sites/:path*",
    "/goods-viewer/:path*",
    "/api/products/:path*",
    "/api/orders/:path*",
    "/api/stats/:path*",
    "/api/goods-viewer/:path*",
  ],
};
