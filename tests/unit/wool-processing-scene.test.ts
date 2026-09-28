import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createWoolProcessingState } from "../../apps/web/lib/woolProcessingLesson";
import { createWoolProcessingScene } from "../../apps/web/lib/woolProcessingScene";

const REQUIRED_TARGETS = [
  "fleece",
  "heartbeat",
  "temperature-scanner",
  "wool-fibre",
  "winter",
  "rainy",
  "summer",
  "check-dry",
  "non-slip-platform",
  "electric-shears",
  "inspect-shears",
  "blade-oil",
  "calm-woolly",
  "kitchen-knife",
  "water-spray",
  "dirty-tool",
  "shear-path-1",
  "shear-path-2",
  "shear-path-3",
  "shear-path-4",
  "dust-soil",
  "sweat",
  "plant-material",
  "lanolin",
  "cold-water",
  "warm-solution",
  "very-hot-water",
  "temperature-dial",
  "solution-dispenser",
  "wash-paddle",
  "rinse-one",
  "rinse-two",
  "squeeze-rollers",
  "drying-rack",
  "twist-wool",
  "raw-sample",
  "clean-sample",
  "sequence-sheep",
  "sequence-shearing",
  "sequence-raw-fleece",
  "sequence-scouring",
  "sequence-rinsing",
  "sequence-drying",
] as const;

const STAGES = [
  "arrival",
  "season",
  "prepare",
  "shearing",
  "detective",
  "experiment",
  "station",
  "compare",
  "journey",
  "quiz",
] as const;

const isVisible = (object: THREE.Object3D) => {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
};

describe("wool processing scene", () => {
  it("builds every interaction target with finite bounds and target metadata", () => {
    const scene = new THREE.Scene();
    const world = createWoolProcessingScene(scene);

    expect(new Set(world.targets.keys())).toEqual(new Set(REQUIRED_TARGETS));
    for (const id of REQUIRED_TARGETS) {
      const object = world.targets.get(id)!;
      expect(object, id).toBeDefined();
      expect(object.userData.targetId, id).toBe(id);
      const bounds = new THREE.Box3().setFromObject(object);
      expect(bounds.isEmpty(), id).toBe(false);
      for (const value of [...bounds.min.toArray(), ...bounds.max.toArray()])
        expect(Number.isFinite(value), id).toBe(true);
    }

    world.dispose();
    expect(scene.children).not.toContain(world.root);
  });

  it("provides comfortable finite camera frames for all ten scenes", () => {
    const world = createWoolProcessingScene(new THREE.Scene());

    for (const stage of STAGES) {
      const frame = world.getFrame(stage);
      const distance = frame.position.distanceTo(frame.target);
      expect(distance, stage).toBeGreaterThan(1);
      expect(distance, stage).toBeLessThan(7);
      for (const value of [
        ...frame.position.toArray(),
        ...frame.target.toArray(),
      ])
        expect(Number.isFinite(value), stage).toBe(true);
    }

    world.dispose();
  });

  it("reveals only the active mission area and responds to progress", () => {
    const world = createWoolProcessingScene(new THREE.Scene());
    const initial = createWoolProcessingState();

    world.update(initial, 0.016, 0);
    expect(isVisible(world.targets.get("fleece")!)).toBe(true);
    expect(isVisible(world.targets.get("summer")!)).toBe(false);

    world.update({ ...initial, stageIndex: 3, shearingIndex: 2 }, 0.1, 3);
    expect(isVisible(world.targets.get("shear-path-1")!)).toBe(false);
    expect(isVisible(world.targets.get("shear-path-3")!)).toBe(true);
    expect(isVisible(world.targets.get("fleece")!)).toBe(false);

    world.update({ ...initial, stageIndex: 6, scouringIndex: 4 }, 0.1, 6);
    expect(isVisible(world.targets.get("rinse-one")!)).toBe(true);
    expect(isVisible(world.targets.get("raw-sample")!)).toBe(false);

    world.update({ ...initial, stageIndex: 8, sequenceIndex: 2 }, 0.1, 8);
    expect(isVisible(world.targets.get("sequence-sheep")!)).toBe(true);
    expect(isVisible(world.targets.get("temperature-dial")!)).toBe(false);

    world.dispose();
  });

  it("contains recognizable farm, sheep, shearing and scouring landmarks", () => {
    const world = createWoolProcessingScene(new THREE.Scene());

    expect(world.root.getObjectByName("mountain-1")).toBeDefined();
    expect(world.root.getObjectByName("thick-fleece")).toBeDefined();
    expect(world.root.getObjectByName("guided-electric-shears")).toBeDefined();
    expect(world.root.getObjectByName("washing-tank")).toBeDefined();
    expect(world.root.getObjectByName("drying-wool")).toBeDefined();
    expect(
      world.root.getObjectByName("master-of-wool-processing-badge"),
    ).toBeDefined();

    world.dispose();
  });
});
