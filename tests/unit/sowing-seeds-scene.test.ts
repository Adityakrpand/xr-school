import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createSowingState } from "../../apps/web/lib/sowingSeedsLesson";
import { createSowingSeedsScene } from "../../apps/web/lib/sowingSeedsScene";

const REQUIRED_TARGETS = [
  "prepared-soil",
  "farmer",
  "seed-bag",
  "seed",
  "healthy-seed",
  "broken-seed",
  "damaged-seed",
  "floating-seeds",
  "sunken-seeds",
  "shallow-seed",
  "correct-depth",
  "deep-seed",
  "crowded-row",
  "proper-row",
  "traditional-tool",
  "seed-drill",
  "covered-seed",
  "root",
  "shoot",
] as const;

const STAGES = [
  "prepared",
  "meaning",
  "selection",
  "water-test",
  "depth",
  "spacing",
  "methods",
  "germination",
] as const;

const isVisible = (object: THREE.Object3D) => {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
};

describe("sowing of seeds scene", () => {
  it("builds every raycast target with finite world bounds", () => {
    const scene = new THREE.Scene();
    const world = createSowingSeedsScene(scene);

    expect(new Set(world.targets.keys())).toEqual(new Set(REQUIRED_TARGETS));
    for (const id of REQUIRED_TARGETS) {
      const object = world.targets.get(id)!;
      expect(object, id).toBeDefined();
      const bounds = new THREE.Box3().setFromObject(object);
      expect(bounds.isEmpty(), id).toBe(false);
      for (const value of [...bounds.min.toArray(), ...bounds.max.toArray()])
        expect(Number.isFinite(value), id).toBe(true);
    }

    world.dispose();
    expect(scene.children).not.toContain(world.root);
  });

  it("provides comfortable finite frames for all eight scenes", () => {
    const world = createSowingSeedsScene(new THREE.Scene());

    for (const stage of STAGES) {
      const frame = world.getFrame(stage);
      const distance = frame.position.distanceTo(frame.target);
      expect(distance, stage).toBeGreaterThan(1);
      expect(distance, stage).toBeLessThan(6);
      for (const value of [
        ...frame.position.toArray(),
        ...frame.target.toArray(),
      ])
        expect(Number.isFinite(value), stage).toBe(true);
    }

    world.dispose();
  });

  it("reveals only the active investigation and responds to student work", () => {
    const world = createSowingSeedsScene(new THREE.Scene());
    const initial = createSowingState();

    world.update(initial, 0.016, 0);
    expect(isVisible(world.targets.get("farmer")!)).toBe(true);
    expect(isVisible(world.targets.get("seed-drill")!)).toBe(false);

    world.update({ ...initial, stageIndex: 3, seedsTested: true }, 0.5, 3);
    expect(isVisible(world.targets.get("floating-seeds")!)).toBe(true);
    expect(isVisible(world.targets.get("seed")!)).toBe(false);

    world.update({ ...initial, stageIndex: 6 }, 0.016, 4);
    expect(isVisible(world.targets.get("seed-drill")!)).toBe(true);
    expect(isVisible(world.targets.get("shoot")!)).toBe(false);

    world.update({ ...initial, stageIndex: 7 }, 0.016, 6);
    expect(isVisible(world.targets.get("root")!)).toBe(true);
    expect(isVisible(world.targets.get("shoot")!)).toBe(true);

    world.dispose();
  });
});
