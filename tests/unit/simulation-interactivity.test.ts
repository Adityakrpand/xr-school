import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function viewerSource(name: string) {
  return readFileSync(
    new URL(`../../apps/web/components/simulations/${name}`, import.meta.url),
    "utf8",
  );
}

describe("catalogue simulation interactivity", () => {
  it("requires active observations throughout the pollination cycle", () => {
    const source = viewerSource("PollinationViewer.tsx");
    expect(source).toContain("INTERACTION_ACTIONS");
    expect(source).toContain("btn-action");
    expect(source).toContain("Complete the observation action");
    expect(source).toContain("exploredRef.current[stageRef.current]");
  });

  it("supports every synthetic-fibre stage from in-world XR controls", () => {
    const source = viewerSource("SyntheticFibresViewer.tsx");
    for (const action of [
      "manufacture:1",
      "rayon:1",
      "nylon:stretch",
      "nylon:weight",
      "compare:safety",
      "vault:safety",
      "narration:replay",
      "restart",
    ]) {
      expect(source, `missing Synthetic Fibres XR action ${action}`).toContain(
        `"${action}"`,
      );
    }
    expect(source).toContain("`polyester:${task}`");
    expect(source).toContain("`acrylic:${task}`");
    expect(source).toContain('type PolyesterTask = "wrinkle" | "dry"');
    expect(source).toContain('type AcrylicTask = "weight" | "warmth"');
  });

  it("supports prediction through sorting from solubility XR controls", () => {
    const source = viewerSource("SolubleInsolubleViewer.tsx");
    for (const action of [
      "predict:soluble",
      "predict:insoluble",
      "experiment:add",
      "experiment:stir",
      "explain:vanished",
      "explain:spread",
      "sort:soluble",
      "sort:insoluble",
      "narration:replay",
      "restart",
    ]) {
      expect(source, `missing Solubility XR action ${action}`).toContain(
        `"${action}"`,
      );
    }
  });

  it("keeps narration replay available in every catalogue viewer", () => {
    for (const viewer of [
      "PollinationViewer.tsx",
      "CircuitViewer.tsx",
      "WaterFloatSinkViewer.tsx",
      "DeadSeaSaltViewer.tsx",
      "SolubleInsolubleViewer.tsx",
      "SyntheticFibresViewer.tsx",
      "PlasticMouldingViewer.tsx",
    ]) {
      const source = viewerSource(viewer);
      expect(source, `${viewer} is missing narration replay`).toMatch(
        /Replay narration|REPLAY NARRATION|🔊 Replay/,
      );
    }
  });
});
