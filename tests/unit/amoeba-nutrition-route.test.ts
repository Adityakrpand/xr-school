import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routePath = new URL(
  "../../apps/web/app/simulations/c7-ch02-a02-nutrition-in-amoeba/page.tsx",
  import.meta.url,
);

describe("amoeba nutrition canonical route", () => {
  it("delegates the exact canonical slug to the shared route host", () => {
    const source = readFileSync(routePath, "utf8");
    expect(source).toContain("SimulationRoutePage");
    expect(source).toContain('slug="c7-ch02-a02-nutrition-in-amoeba"');
  });
});
