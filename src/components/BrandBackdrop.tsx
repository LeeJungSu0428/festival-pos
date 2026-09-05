export default function BrandBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/key-visual.jpg"
        alt=""
        className="h-full w-full object-cover opacity-[0.4]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.7) 55%, rgba(255,255,255,0.9) 100%)",
        }}
      />
    </div>
  );
}
