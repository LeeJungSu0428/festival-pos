export default function BrandBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/key-visual.jpg"
        alt=""
        className="h-full w-full object-cover opacity-[0.09]"
      />
      <div className="absolute inset-0 bg-white/60" />
    </div>
  );
}
