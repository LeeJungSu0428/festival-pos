import { redirect } from "next/navigation";
import { getRoleFromCookies } from "@/lib/session";
import HubGrid from "./hub-grid";
import LogoutLink from "./logout-link";

export default async function HubPage() {
  const role = await getRoleFromCookies();
  if (role !== "admin" && role !== "super") redirect("/login");

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-neutral-400">축제 관리 시스템</p>
            <h1 className="mt-1 text-2xl font-bold text-neutral-900">어떤 페이지로 들어갈까요?</h1>
            <p className="mt-2 text-sm text-neutral-500">원하는 사이트를 선택해주세요.</p>
          </div>
          <LogoutLink />
        </div>

        <div className="mt-8">
          <HubGrid role={role} />
        </div>
      </div>
    </div>
  );
}
