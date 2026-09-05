"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import BrandBackdrop from "@/components/BrandBackdrop";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <BrandBackdrop />

      <div className="grid w-full max-w-3xl items-center gap-10 sm:grid-cols-2">
        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-oreum.png" alt="오름" className="h-40 w-auto sm:h-52" />
          <p className="mt-2 text-sm tracking-[0.2em] text-[#A47F55]">애국한양응원제</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="w-full rounded-2xl border border-[#E7D9C3] bg-[#FFFCF6]/95 p-8 shadow-sm backdrop-blur-sm"
        >
          <h1 className="text-2xl font-bold text-[#3E2A1B]">관리자 로그인</h1>
          <p className="mt-2 text-sm text-[#8A6F52]">
            비밀번호를 입력하면 권한에 맞는 화면으로 이동합니다.
          </p>

          <label className="mt-6 block text-sm font-medium text-[#5B3A22]">비밀번호</label>
          <div className="relative mt-2">
            <input
              type={showPassword ? "text" : "password"}
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="전달받은 비밀번호"
              className="w-full rounded-lg border border-[#E3D3BA] bg-white px-4 py-3 pr-12 text-[#3E2A1B] placeholder-[#B29E82] outline-none focus:border-[#B4632B]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#8A6F52]"
            >
              {showPassword ? "숨기기" : "보기"}
            </button>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#3E2A1B] px-4 py-3 font-semibold text-[#FFFCF6] disabled:opacity-50"
          >
            {loading ? "확인 중…" : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}
