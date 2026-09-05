"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type GoodsViewerSize = { label: string; available: boolean };
type GoodsViewerState = { imageUrl: string | null; sizes: GoodsViewerSize[] };

export default function GoodsViewerPage() {
  const [state, setState] = useState<GoodsViewerState | null>(null);
  const [imageInput, setImageInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/goods-viewer");
    const data = await res.json();
    setState(data);
    setImageInput(data.imageUrl ?? "");
  }

  useEffect(() => {
    load();
  }, []);

  async function saveImage() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/goods-viewer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: imageInput || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "저장에 실패했습니다.");
      return;
    }
    load();
  }

  async function toggleSize(size: GoodsViewerSize) {
    await fetch("/api/goods-viewer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: size.label, available: !size.available }),
    });
    load();
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-400">축제 관리 시스템</p>
            <h1 className="text-2xl font-bold text-neutral-900">굿즈 뷰어</h1>
          </div>
          <Link href="/hub" className="text-sm text-neutral-500 hover:text-neutral-800">
            ← 허브로
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="flex aspect-square items-center justify-center bg-neutral-100">
            {state?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={state.imageUrl} alt="굿즈" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm text-neutral-400">등록된 이미지가 없습니다</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 p-4">
            {(state?.sizes ?? []).map((size) => (
              <button
                key={size.label}
                onClick={() => toggleSize(size)}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                  size.available
                    ? "border-neutral-300 bg-white text-neutral-900"
                    : "border-neutral-200 bg-neutral-100 text-neutral-400 line-through"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4">
          <p className="mb-2 text-sm font-medium text-neutral-700">이미지 변경</p>
          <div className="flex gap-2">
            <input
              className="input"
              value={imageInput}
              onChange={(e) => setImageInput(e.target.value)}
              placeholder="이미지 URL을 붙여넣으세요"
            />
            <button
              onClick={saveImage}
              disabled={saving}
              className="shrink-0 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <p className="mt-2 text-xs text-neutral-400">
            사이즈 버튼을 클릭하면 품절/판매중 상태를 바꿀 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
