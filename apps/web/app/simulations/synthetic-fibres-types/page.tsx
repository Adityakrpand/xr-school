"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const SyntheticFibresViewer = dynamic(
  () => import("@/components/simulations/SyntheticFibresViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#100b2d",
          display: "grid",
          placeItems: "center",
          color: "#ede9fe",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>🧵🔬✨</div>
          <p>Preparing the synthetic fibre laboratory…</p>
        </div>
      </div>
    ),
  },
);

export default function SyntheticFibresTypesPage() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#100b2d",
      }}
    >
      <Link
        href="/simulations"
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 20,
          padding: "7px 13px",
          borderRadius: 9,
          background: "rgba(14,10,35,.8)",
          border: "1px solid rgba(196,181,253,.28)",
          color: "#f5f3ff",
          fontSize: 13,
          textDecoration: "none",
          backdropFilter: "blur(8px)",
        }}
      >
        ← Simulations
      </Link>
      <SyntheticFibresViewer />
    </div>
  );
}
