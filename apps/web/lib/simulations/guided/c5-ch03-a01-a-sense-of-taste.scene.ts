import type { SimulationSceneContext } from '@xr-school/simulation-web';
import { SENSE_OF_TASTE_GUIDANCE } from '@xr-school/simulation-content';

import { createSenseOfTasteWorld } from '../../world-builder/senseOfTasteWorld';
import { createGuidedSceneAdapter } from './createGuidedSceneAdapter';

export function createSenseOfTasteSceneWorld(context: SimulationSceneContext) {
  return createSenseOfTasteWorld(context);
}

export const SENSE_OF_TASTE_SCENE_ADAPTER = createGuidedSceneAdapter(
  SENSE_OF_TASTE_GUIDANCE,
  createSenseOfTasteSceneWorld,
);

export const SENSE_OF_TASTE_SCENE_ENTRY = Object.freeze({
  moduleId: SENSE_OF_TASTE_GUIDANCE.moduleId,
  createWorld: createSenseOfTasteSceneWorld,
  adapter: SENSE_OF_TASTE_SCENE_ADAPTER,
});

export default SENSE_OF_TASTE_SCENE_ADAPTER;
