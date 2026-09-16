import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  createFoodSourcesEnvironment,
  createFoodTokenVisual,
  FOOD_VISUAL_IDS,
} from '../../apps/web/lib/foodSourcesVisuals';

describe('food sources visual models', () => {
  it('builds a recognisable, uniquely named model for every food', () => {
    const signatures = new Set<string>();

    for (const id of FOOD_VISUAL_IDS) {
      const visual = createFoodTokenVisual(id);
      visual.root.updateMatrixWorld(true);
      const meshes: THREE.Mesh[] = [];
      visual.root.traverse(object => {
        if (object instanceof THREE.Mesh) meshes.push(object);
      });

      const bounds = new THREE.Box3().setFromObject(visual.root);
      const size = bounds.getSize(new THREE.Vector3());
      const namedParts = meshes.map(mesh => mesh.name).filter(Boolean).sort();

      expect(visual.root.name).toBe(`food-token-${id}`);
      expect(visual.root.userData.foodVisualId).toBe(id);
      expect(meshes.length).toBeGreaterThanOrEqual(3);
      expect(namedParts.some(name => name !== `${id}-feedback-pedestal`)).toBe(true);
      expect(Number.isFinite(size.x + size.y + size.z)).toBe(true);
      expect(Math.max(size.x, size.y, size.z)).toBeLessThan(1.2);

      const signature = `${meshes.length}:${namedParts.join(',')}`;
      expect(signatures.has(signature)).toBe(false);
      signatures.add(signature);
    }
  });

  it('places the lesson inside a populated farm market environment', () => {
    const environment = createFoodSourcesEnvironment();
    const meshes: THREE.Mesh[] = [];
    environment.traverse(object => {
      if (object instanceof THREE.Mesh) meshes.push(object);
    });

    const bounds = new THREE.Box3().setFromObject(environment);
    expect(environment.name).toBe('food-sources-environment');
    expect(meshes.length).toBeGreaterThan(50);
    expect(bounds.getSize(new THREE.Vector3()).x).toBeGreaterThan(15);
  });
});
