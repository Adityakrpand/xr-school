import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const canonicalRoutePath = new URL(
  "../../apps/web/app/simulations/c7-ch03-a01-shearing-and-scouring-of-wool/page.tsx",
  import.meta.url,
);
const legacyRoutePath = new URL(
  "../../apps/web/app/simulations/mission-wool-shearing-scouring/page.tsx",
  import.meta.url,
);

describe("wool processing routes", () => {
  it("delegates the exact canonical slug to the shared simulation host", () => {
    const source = readFileSync(canonicalRoutePath, "utf8");
    expect(source).toContain("SimulationRoutePage");
    expect(source).toContain(
      'slug="c7-ch03-a01-shearing-and-scouring-of-wool"',
    );
  });

  it("redirects the story-era alias to the canonical route", () => {
    const source = readFileSync(legacyRoutePath, "utf8");
    expect(source).toContain('from "next/navigation"');
    expect(source).toContain(
      'redirect("/simulations/c7-ch03-a01-shearing-and-scouring-of-wool")',
    );
  });
});
