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

    router.push(data.role === "super" ? "/super-admin" : "/pos");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8"
      >
        <p className="text-sm text-neutral-500">축제 판매 시스템</p>
        <h1 className="mt-1 text-2xl font-bold text-white">관리자 로그인</h1>
        <p className="mt-2 text-sm text-neutral-400">
          비밀번호를 입력하면 권한에 맞는 화면으로 이동합니다.
        </p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          className="mt-6 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-4 py-3 text-white placeholder-neutral-500 outline-none focus:border-neutral-400"
        />

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <button
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-white px-4 py-3 font-semibold text-neutral-900 disabled:opacity-50"
        >
          {loading ? "확인 중…" : "입장하기"}
        </button>
      </form>
    </div>
  );
}
