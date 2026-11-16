"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const SolubleInsolubleViewer = dynamic(
  () => import("@/components/simulations/SolubleInsolubleViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#06354a",
          display: "grid",
          placeItems: "center",
          color: "#cffafe",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>🧪💧✨</div>
          <p>Opening Professor Aqua&apos;s laboratory…</p>
        </div>
      </div>
    ),
  },
);

export default function SolubleInsolubleSubstancesPage() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#06354a",
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
          background: "rgba(2,18,32,.78)",
          border: "1px solid rgba(103,232,249,.25)",
          color: "#ecfeff",
          fontSize: 13,
          textDecoration: "none",
          backdropFilter: "blur(8px)",
        }}
      >
        ← Simulations
      </Link>
      <SolubleInsolubleViewer />
    </div>
  );
}
