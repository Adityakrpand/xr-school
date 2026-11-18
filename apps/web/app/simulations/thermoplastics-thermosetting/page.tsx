"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const PlasticMouldingViewer = dynamic(
  () => import("@/components/simulations/PlasticMouldingViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#15101f",
          display: "grid",
          placeItems: "center",
          color: "#ffedd5",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>⭐🏭🔬</div>
          <p>Starting the virtual moulding workshop…</p>
        </div>
      </div>
    ),
  },
);

export default function ThermoplasticsThermosettingPage() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#15101f",
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
          minHeight: 44,
          boxSizing: "border-box",
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 9,
          background: "rgba(24,16,31,.82)",
          border: "1px solid rgba(251,146,60,.32)",
          color: "#fff7ed",
          fontSize: 13,
          textDecoration: "none",
          backdropFilter: "blur(8px)",
        }}
      >
        ← Simulations
      </Link>
      <PlasticMouldingViewer />
    </div>
  );
}
