"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
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

    if (!res.ok) {
      setError(data.error ?? "로그인에 실패했습니다.");
      return;
    }

    router.push("/hub");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6EEE1] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-oreum.png" alt="오름" className="h-12 w-auto" />
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-[#A47F55]">애국한양응원제</p>
            <p className="text-lg font-bold text-[#3E2A1B]">오름</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#E7D9C3] bg-[#FFFCF6] p-8"
        >
          <h1 className="text-2xl font-bold text-[#3E2A1B]">관리자 로그인</h1>
          <p className="mt-2 text-sm text-[#8A6F52]">
            비밀번호를 입력하면 권한에 맞는 화면으로 이동합니다.
          </p>

          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="mt-6 w-full rounded-lg border border-[#E3D3BA] bg-[#FBF6EC] px-4 py-3 text-[#3E2A1B] placeholder-[#B29E82] outline-none focus:border-[#B4632B]"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-[#3E2A1B] px-4 py-3 font-semibold text-[#FFFCF6] disabled:opacity-50"
          >
            {loading ? "확인 중…" : "입장하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
