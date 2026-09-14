import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createAmoebaState } from "../../apps/web/lib/amoebaNutritionLesson";
import { createAmoebaNutritionScene } from "../../apps/web/lib/amoebaNutritionScene";

const REQUIRED_TARGETS = [
  "dropper", "pond-water", "glass-slide", "microscope", "amoeba",
  "cell-membrane", "cytoplasm", "nucleus", "pseudopodia", "food-vacuole",
  "food-particle", "feeding-pseudopodium", "left-pseudopodium", "right-pseudopodium",
  "ingestion-vacuole", "enzyme-one", "enzyme-two", "enzyme-three",
  "energy-nutrient", "growth-nutrient", "repair-nutrient", "waste-vacuole",
  "waste-release", "sequence-ingestion", "sequence-digestion", "sequence-absorption",
  "sequence-assimilation", "sequence-egestion", "recap-pseudopodia",
  "recap-food-vacuole", "recap-nucleus", "recap-egestion",
] as const;

const STAGES = [
  "pond", "find", "anatomy", "hungry", "ingestion", "digestion",
  "assimilation", "egestion", "sequence", "recap",
] as const;

const isVisible = (object: THREE.Object3D) => {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
};

describe("amoeba nutrition scene", () => {
  it("builds every interaction target with finite bounds", () => {
    const scene = new THREE.Scene();
    const world = createAmoebaNutritionScene(scene);
    expect(new Set(world.targets.keys())).toEqual(new Set(REQUIRED_TARGETS));
    for (const id of REQUIRED_TARGETS) {
      const object = world.targets.get(id)!;
      expect(object, id).toBeDefined();
      const bounds = new THREE.Box3().setFromObject(object);
      expect(bounds.isEmpty(), id).toBe(false);
      for (const value of [...bounds.min.toArray(), ...bounds.max.toArray()]) {
        expect(Number.isFinite(value), id).toBe(true);
      }
    }
    world.dispose();
    expect(scene.children).not.toContain(world.root);
  });

  it("provides comfortable finite camera frames for all ten scenes", () => {
    const world = createAmoebaNutritionScene(new THREE.Scene());
    for (const stage of STAGES) {
      const frame = world.getFrame(stage);
      const distance = frame.position.distanceTo(frame.target);
      expect(distance, stage).toBeGreaterThan(1);
      expect(distance, stage).toBeLessThan(7);
      for (const value of [...frame.position.toArray(), ...frame.target.toArray()]) {
        expect(Number.isFinite(value), stage).toBe(true);
      }
    }
    world.dispose();
  });

  it("reveals only the active scientific scene", () => {
    const world = createAmoebaNutritionScene(new THREE.Scene());
    const initial = createAmoebaState();
    world.update(initial, 0.016, 0);
    expect(isVisible(world.targets.get("microscope")!)).toBe(true);
    expect(isVisible(world.targets.get("amoeba")!)).toBe(false);
    world.update({ ...initial, stageIndex: 5, inspected: ["enzyme-one", "enzyme-two"] }, 0.016, 3);
    expect(isVisible(world.targets.get("enzyme-one")!)).toBe(true);
    expect(isVisible(world.targets.get("microscope")!)).toBe(false);
    world.update({ ...initial, stageIndex: 8, sequenceIndex: 2 }, 0.016, 6);
    expect(isVisible(world.targets.get("sequence-ingestion")!)).toBe(true);
    expect(isVisible(world.targets.get("waste-release")!)).toBe(false);
    world.dispose();
  });
});
