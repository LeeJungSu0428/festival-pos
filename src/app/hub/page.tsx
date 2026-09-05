import { redirect } from "next/navigation";
import { getRoleFromCookies } from "@/lib/session";
import HubGrid from "./hub-grid";
import LogoutLink from "./logout-link";

export default async function HubPage() {
  const role = await getRoleFromCookies();
  if (role !== "admin" && role !== "super") redirect("/login");

  return (
    <div className="min-h-screen bg-[#F6EEE1] px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-oreum.png" alt="오름" className="h-16 w-auto sm:h-20" />
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-[#A47F55]">
                애국한양응원제 : 오름
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#3E2A1B] sm:text-3xl">사이트 선택</h1>
            </div>
          </div>
          <LogoutLink />
        </div>
        <p className="mt-3 text-sm text-[#8A6F52]">
          카드를 누르면 해당 페이지로 바로 이동합니다.
        </p>

        <div className="mt-10">
          <HubGrid role={role} />
        </div>
      </div>
    </div>
  );
}
