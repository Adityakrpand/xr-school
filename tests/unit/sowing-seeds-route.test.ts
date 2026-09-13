import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routePath = new URL(
  "../../apps/web/app/simulations/c8-ch01-a02-sowing-of-seeds/page.tsx",
  import.meta.url,
);

describe("sowing of seeds canonical route", () => {
  it("delegates the exact canonical slug to the shared route host", () => {
    const source = readFileSync(routePath, "utf8");
    expect(source).toContain("SimulationRoutePage");
    expect(source).toContain('slug="c8-ch01-a02-sowing-of-seeds"');
  });
});
