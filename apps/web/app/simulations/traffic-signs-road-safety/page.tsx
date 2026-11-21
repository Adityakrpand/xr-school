"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const TrafficSafetyViewer = dynamic(
  () => import("@/components/simulations/TrafficSafetyViewer"),
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
          color: "#e0f2fe",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 56 }}>🤖🚦🛑</div>
          <p>Opening Smart City…</p>
        </div>
      </div>
    ),
  },
);

export default function TrafficSignsRoadSafetyPage() {
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
          minHeight: 44,
          padding: "7px 13px",
          boxSizing: "border-box",
          display: "inline-flex",
          alignItems: "center",
          borderRadius: 9,
          background: "rgba(2,6,23,.84)",
          border: "1px solid rgba(103,232,249,.36)",
          color: "#ecfeff",
          fontSize: 13,
          textDecoration: "none",
          backdropFilter: "blur(8px)",
        }}
      >
        ← Simulations
      </Link>
      <TrafficSafetyViewer />
    </div>
  );
}
