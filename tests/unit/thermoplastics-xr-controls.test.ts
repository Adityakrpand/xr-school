import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL(
    "../../apps/web/components/simulations/PlasticMouldingViewer.tsx",
    import.meta.url,
  ),
  "utf8",
);

describe("thermoplastics immersive controls", () => {
  it("keeps an in-world action for every learning stage", () => {
    const requiredActions = [
      "stage:1",
      "mould:1",
      "mould:4",
      "stage:2",
      "reshape:1",
      "reshape:6",
      "stage:3",
      "cross:1",
      "cross:6",
      "stage:4",
      "molecule:heat",
      "compare:replay",
      "stage:5",
      "stage:6",
      "sort:polythene:thermoplastic",
      "sort:pvc:thermoplastic",
      "sort:bakelite:thermoset",
      "sort:melamine:thermoset",
      "stage:7",
      "tag:a",
      "tag:b",
      "tag:2",
      "tag:6",
      "stage:8",
      "handle:polythene",
      "handle:bakelite",
      "restart",
    ];

    for (const action of requiredActions) {
      expect(source, `missing XR action ${action}`).toContain(`"${action}"`);
    }
    expect(source).toContain("`compare:${key}`");
  });

  it("includes the 5:45 guided result and reduced-motion support", () => {
    expect(source).toContain(
      "const SIMULATION_DURATION_SECONDS = 5 * 60 + 45",
    );
    expect(source).toContain("showGuidedResult");
    expect(source).toContain("prefers-reduced-motion: reduce");
  });
});
