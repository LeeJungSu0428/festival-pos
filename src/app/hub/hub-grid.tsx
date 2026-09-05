"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "admin" | "super";

const SITES = [
  {
    key: "new-materials",
    tag: "INVENTORY",
    title: "신소재 재고관리",
    desc: "신소재 부스 재고를 관리합니다.",
    href: "/sites/new-materials",
  },
  {
    key: "international-hall",
    tag: "INVENTORY",
    title: "국제관 재고 관리",
    desc: "국제관 부스 재고를 관리합니다.",
    href: "/sites/international-hall",
  },
  {
    key: "goods-viewer",
    tag: "VIEWER",
    title: "굿즈 뷰어",
    desc: "굿즈 이미지와 사이즈를 보여줍니다.",
    href: "/goods-viewer",
  },
];

function CardShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E7D9C3] bg-[#FFFCF6] p-6">
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-[#D99A5B]/25 blur-2xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

export default function HubGrid({ role }: { role: Role }) {
  const router = useRouter();
  const [showGate, setShowGate] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGateSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok || data.role !== "super") {
      setError("슈퍼관리자 비밀번호가 아닙니다.");
      return;
    }

    router.push("/super-admin");
    router.refresh();
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SITES.map((site) => (
        <Link key={site.key} href={site.href} className="block transition hover:-translate-y-0.5">
          <CardShell>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B4632B]">{site.tag}</p>
            <h2 className="mt-2 text-xl font-bold text-[#3E2A1B]">{site.title}</h2>
            <p className="mt-2 text-sm text-[#8A6F52]">{site.desc}</p>
            <span className="mt-5 inline-block rounded-full bg-[#F1E3D0] px-4 py-2 text-sm font-medium text-[#5B3A22]">
              바로가기
            </span>
          </CardShell>
        </Link>
      ))}

      {role === "super" ? (
        <Link href="/super-admin" className="block transition hover:-translate-y-0.5">
          <CardShell>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B4632B]">ADMIN</p>
            <h2 className="mt-2 text-xl font-bold text-[#3E2A1B]">총 재고관리</h2>
            <p className="mt-2 text-sm text-[#8A6F52]">전체 매출/재고/판매기록을 관리합니다.</p>
            <span className="mt-5 inline-block rounded-full bg-[#3E2A1B] px-4 py-2 text-sm font-medium text-[#FFFCF6]">
              바로가기
            </span>
          </CardShell>
        </Link>
      ) : (
        <button onClick={() => setShowGate(true)} className="block text-left transition hover:-translate-y-0.5">
          <CardShell>
            <p className="text-xs font-semibold tracking-[0.2em] text-[#B4632B]">ADMIN 🔒</p>
            <h2 className="mt-2 text-xl font-bold text-[#3E2A1B]">총 재고관리</h2>
            <p className="mt-2 text-sm text-[#8A6F52]">슈퍼관리자 비밀번호가 필요합니다.</p>
            <span className="mt-5 inline-block rounded-full border border-[#D9C7AE] bg-transparent px-4 py-2 text-sm font-medium text-[#5B3A22]">
              비밀번호 입력
            </span>
          </CardShell>
        </button>
      )}

      {showGate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowGate(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleGateSubmit}
            className="w-full max-w-sm rounded-2xl border border-[#E7D9C3] bg-[#FFFCF6] p-6"
          >
            <p className="text-lg font-semibold text-[#3E2A1B]">슈퍼관리자 비밀번호</p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-3 w-full rounded-lg border border-[#E3D3BA] bg-[#FBF6EC] px-3 py-2 text-sm text-[#3E2A1B] outline-none focus:border-[#B4632B]"
              placeholder="비밀번호"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowGate(false)}
                className="flex-1 rounded-full border border-[#D9C7AE] px-4 py-2 text-sm font-medium text-[#5B3A22]"
              >
                취소
              </button>
              <button
                disabled={loading}
                className="flex-1 rounded-full bg-[#3E2A1B] px-4 py-2 text-sm font-medium text-[#FFFCF6] disabled:opacity-50"
              >
                {loading ? "확인 중…" : "확인"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
