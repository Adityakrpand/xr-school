"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const WaterFloatSinkViewer = dynamic(
  () => import("@/components/simulations/WaterFloatSinkViewer"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#082f49",
          display: "grid",
          placeItems: "center",
          color: "#bae6fd",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>💧</div>
          <p>Preparing the Magical Lake laboratory…</p>
        </div>
      </div>
    ),
  },
);

export default function FloatSinkWaterPage() {
  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#082f49",
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
          background: "rgba(2,18,32,.75)",
          border: "1px solid rgba(125,211,252,.25)",
          color: "#e0f2fe",
          fontSize: 13,
          textDecoration: "none",
          backdropFilter: "blur(8px)",
        }}
      >
        ← Simulations
      </Link>
      <WaterFloatSinkViewer />
    </div>
  );
}
