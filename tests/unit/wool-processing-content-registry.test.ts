import { describe, expect, it } from "vitest";

import {
  findImplementedSimulation,
  resolveSimulationPath,
  routeForSimulation,
} from "../../packages/simulation-content/src/index";

const slug = "c7-ch03-a01-shearing-and-scouring-of-wool";
const canonicalPath = `/simulations/${slug}`;

describe("wool processing content registration", () => {
  it("publishes one released Class 7 wool-processing definition", () => {
    const definition = findImplementedSimulation(slug);

    expect(definition?.module).toMatchObject({
      id: "sim-c07-ch03-a01-shearing-and-scouring-of-wool",
      slug,
      viewerKey: "wool-processing",
      title: "Shearing and Scouring of Wool",
      publicationStatus: "released",
      evidenceMaturity: "internalQA",
      stages: 10,
    });
    expect(definition?.experience).toMatchObject({
      gradeTone: "class6To8",
    });
    expect(definition?.experience.stages).toHaveLength(10);
    expect(routeForSimulation(definition!)).toBe(canonicalPath);
  });

  it("resolves the story-era path as a redirect to the canonical activity", () => {
    const definition = findImplementedSimulation(slug);

    expect(resolveSimulationPath(canonicalPath)).toEqual({
      definition,
      canonicalPath,
      redirect: false,
    });
    expect(
      resolveSimulationPath("/simulations/mission-wool-shearing-scouring"),
    ).toEqual({
      definition,
      canonicalPath,
      redirect: true,
    });
  });
});
