"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Role = "admin" | "super";

const SITES = [
  {
    key: "new-materials",
    title: "신소재 재고관리",
    href: "/sites/new-materials",
    desc: "신소재 부스 재고를 관리합니다.",
  },
  {
    key: "international-hall",
    title: "국제관 재고 관리",
    href: "/sites/international-hall",
    desc: "국제관 부스 재고를 관리합니다.",
  },
  {
    key: "goods-viewer",
    title: "굿즈 뷰어",
    href: "/goods-viewer",
    desc: "굿즈 이미지와 사이즈를 보여줍니다.",
  },
];

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
        <Link
          key={site.key}
          href={site.href}
          className="rounded-xl border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
        >
          <p className="text-lg font-semibold text-neutral-900">{site.title}</p>
          <p className="mt-1 text-sm text-neutral-500">{site.desc}</p>
        </Link>
      ))}

      {role === "super" ? (
        <Link
          href="/super-admin"
          className="rounded-xl border border-neutral-900 bg-neutral-900 p-5 text-white transition hover:opacity-90"
        >
          <p className="text-lg font-semibold">총 재고관리</p>
          <p className="mt-1 text-sm text-neutral-300">전체 매출/재고/판매기록을 관리합니다.</p>
        </Link>
      ) : (
        <button
          onClick={() => setShowGate(true)}
          className="rounded-xl border border-dashed border-neutral-300 bg-neutral-100 p-5 text-left transition hover:border-neutral-400"
        >
          <p className="text-lg font-semibold text-neutral-700">총 재고관리 🔒</p>
          <p className="mt-1 text-sm text-neutral-500">슈퍼관리자 비밀번호가 필요합니다.</p>
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
            className="w-full max-w-sm rounded-xl bg-white p-6"
          >
            <p className="text-lg font-semibold text-neutral-900">슈퍼관리자 비밀번호</p>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input mt-3"
              placeholder="비밀번호"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setShowGate(false)}
                className="flex-1 rounded border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600"
              >
                취소
              </button>
              <button
                disabled={loading}
                className="flex-1 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
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
