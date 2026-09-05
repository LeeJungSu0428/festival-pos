import Link from "next/link";

export default function InternationalHallPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-xl text-center">
        <p className="text-sm text-neutral-400">축제 관리 시스템</p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">국제관 재고 관리</h1>
        <p className="mt-4 text-sm text-neutral-500">
          이 페이지는 아직 준비 중입니다. 어떤 기능이 필요한지 알려주시면 이어서 만들어드릴게요.
        </p>
        <Link href="/hub" className="mt-6 inline-block text-sm text-neutral-600 underline">
          ← 허브로 돌아가기
        </Link>
      </div>
    </div>
  );
}
