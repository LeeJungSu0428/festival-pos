import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoleFromCookies } from "@/lib/session";
import NavLinks from "./nav-links";
import LogoutButton from "./logout-button";

export default async function SuperAdminLayout({ children }: { children: ReactNode }) {
  // 미들웨어가 이미 이 경로를 막지만, 페이지 자체에서도 한 번 더 확인한다.
  const role = await getRoleFromCookies();
  if (role !== "super") redirect("/login");

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-neutral-200 bg-white p-4">
        <div className="mb-6">
          <p className="text-sm text-neutral-400">축제 판매 관리</p>
          <p className="text-lg font-semibold text-neutral-900">슈퍼관리자</p>
        </div>
        <NavLinks />
        <div className="mt-auto space-y-2 border-t border-neutral-200 pt-4">
          <Link href="/hub" className="block text-sm text-neutral-500 hover:text-neutral-800">
            → 허브로 돌아가기
          </Link>
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
