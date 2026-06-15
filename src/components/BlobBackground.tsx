export function BlobBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="blob blob-1"
        style={{
          width: 520,
          height: 520,
          background: "radial-gradient(circle, #22c55e, transparent 70%)",
          top: "-10%",
          left: "-5%",
        }}
      />
      <div
        className="blob blob-2"
        style={{
          width: 600,
          height: 600,
          background: "radial-gradient(circle, #10b981, transparent 70%)",
          top: "30%",
          right: "-10%",
        }}
      />
      <div
        className="blob blob-3"
        style={{
          width: 480,
          height: 480,
          background: "radial-gradient(circle, #6ee7b7, transparent 70%)",
          bottom: "-10%",
          left: "30%",
          opacity: 0.4,
        }}
      />
      <div
        className="blob blob-1"
        style={{
          width: 360,
          height: 360,
          background: "radial-gradient(circle, #34d399, transparent 70%)",
          top: "60%",
          left: "5%",
          opacity: 0.35,
          animationDelay: "-8s",
        }}
      />
    </div>
  );
}
