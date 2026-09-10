import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { createPloughingState } from "../../apps/web/lib/ploughingLesson";
import { createPloughingScene } from "../../apps/web/lib/ploughingScene";

const REQUIRED_TARGETS = [
  "hard-soil",
  "farmer",
  "soil-clod",
  "plough",
  "bullocks",
  "turned-soil",
  "furrow",
  "tractor",
  "cultivator",
  "roots",
  "air-spaces",
  "earthworm",
  "nutrients",
  "finish-clod",
  "leveller",
  "ready-soil",
  "seed-bag",
] as const;

const STAGES = [
  "farm",
  "hard-soil",
  "plough",
  "traditional",
  "modern",
  "underground",
  "levelling",
  "ready",
] as const;

const isVisible = (object: THREE.Object3D) => {
  let node: THREE.Object3D | null = object;
  while (node) {
    if (!node.visible) return false;
    node = node.parent;
  }
  return true;
};

describe("ploughing preparation scene", () => {
  it("builds every raycast target with finite world bounds", () => {
    const scene = new THREE.Scene();
    const world = createPloughingScene(scene);

    expect(new Set(world.targets.keys())).toEqual(new Set(REQUIRED_TARGETS));
    expect(world.targets.size).toBe(REQUIRED_TARGETS.length);
    for (const id of REQUIRED_TARGETS) {
      const object = world.targets.get(id)!;
      let tagged = 0;
      object.traverse((child) => {
        if (child.userData.targetId === id) tagged += 1;
      });
      expect(tagged, id).toBeGreaterThan(0);
      const bounds = new THREE.Box3().setFromObject(object);
      expect(bounds.isEmpty(), id).toBe(false);
      for (const value of [...bounds.min.toArray(), ...bounds.max.toArray()]) {
        expect(Number.isFinite(value), id).toBe(true);
      }
    }

    world.dispose();
    expect(scene.children).not.toContain(world.root);
  });

  it("provides a close, finite camera frame for all eight scenes", () => {
    const world = createPloughingScene(new THREE.Scene());

    for (const stage of STAGES) {
      const frame = world.getFrame(stage);
      const distance = frame.position.distanceTo(frame.target);
      expect(distance, stage).toBeGreaterThan(1);
      expect(distance, stage).toBeLessThan(5.8);
      for (const value of [
        ...frame.position.toArray(),
        ...frame.target.toArray(),
      ]) {
        expect(Number.isFinite(value), stage).toBe(true);
      }
    }

    world.dispose();
  });

  it("reveals the correct stage and responds to completed field work", () => {
    const world = createPloughingScene(new THREE.Scene());
    const initial = createPloughingState();

    world.update(initial, 0.016, 0);
    expect(isVisible(world.targets.get("farmer")!)).toBe(true);
    expect(isVisible(world.targets.get("tractor")!)).toBe(false);

    world.update({ ...initial, stageIndex: 3, furrows: 2 }, 0.016, 1);
    const furrowRoot = world.targets.get("furrow")!;
    expect(isVisible(furrowRoot)).toBe(true);
    expect(furrowRoot.children.filter((child) => child.visible)).toHaveLength(
      2,
    );

    world.update({ ...initial, stageIndex: 4 }, 0.016, 2);
    expect(isVisible(world.targets.get("tractor")!)).toBe(true);
    expect(isVisible(world.targets.get("earthworm")!)).toBe(false);

    world.update({ ...initial, stageIndex: 6, brokenClods: 2 }, 0.016, 3);
    const finishingRoot = world.targets.get("finish-clod")!;
    const visibleClods = finishingRoot.children.filter(
      (child) => child.userData.kind === "whole-clod" && child.visible,
    );
    expect(visibleClods).toHaveLength(1);
    const visibleFragments = finishingRoot.children.filter(
      (child) => child.userData.kind === "broken-fragments" && child.visible,
    );
    expect(visibleFragments).toHaveLength(2);

    world.update({ ...initial, stageIndex: 7 }, 0.016, 4);
    expect(isVisible(world.targets.get("ready-soil")!)).toBe(true);
    expect(isVisible(world.targets.get("seed-bag")!)).toBe(true);

    world.dispose();
  });
});
