"use client";

import { useRouter } from "next/navigation";

export default function LogoutLink() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} className="text-sm text-neutral-500 hover:text-red-600">
      로그아웃
    </button>
  );
}
