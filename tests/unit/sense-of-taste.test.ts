import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import * as THREE from 'three';
import { describe, expect, it } from 'vitest';

import {
  SENSE_OF_TASTE_SCENE_METADATA,
  SENSE_OF_TASTE_SIMULATION,
} from '../../packages/simulation-content/src/implemented/guided/sense-of-taste';
import { createSenseOfTasteWorld } from '../../apps/web/lib/world-builder/senseOfTasteWorld';
import type { SimulationSceneContext } from '@xr-school/simulation-web';

const slug = 'c5-ch03-a01-a-sense-of-taste';

describe('A Sense of Taste immersive investigation', () => {
  it('owns the canonical route, module identity and original panorama', () => {
    expect(SENSE_OF_TASTE_SIMULATION.module).toMatchObject({
      id: 'sim-c05-ch03-a01-a-sense-of-taste',
      slug,
      viewerKey: 'guided-sense-of-taste',
      title: 'From Tasting to Digesting: A Sense of Taste',
      expectedDurationMinutes: 5,
      maxSessionDurationMinutes: 5,
      simulationFormat: 'immersiveVr',
      publicationStatus: 'released',
      evidenceMaturity: 'internalQA',
    });

    const routePath = resolve(process.cwd(), `apps/web/app/simulations/${slug}/page.tsx`);
    expect(existsSync(routePath)).toBe(true);
    expect(readFileSync(routePath, 'utf8')).toContain(`slug="${slug}"`);

    const panoramaPath = resolve(process.cwd(), `apps/web/public/simulations/${slug}/environment.webp`);
    expect(existsSync(panoramaPath)).toBe(true);
    expect(statSync(panoramaPath).size).toBe(199896);
    expect(SENSE_OF_TASTE_SIMULATION.assets.assets[0]).toMatchObject({
      width: 1774,
      height: 887,
      sha256: '4223946cede9064d198bd11c1ad4581c525b6c1721c719fb33487fa741064421',
    });
  });

  it('teaches taste, smell and flavour without repeating the tongue-map myth', () => {
    const record = SENSE_OF_TASTE_SIMULATION;
    expect(record.experience.stages.map((stage) => stage.id)).toEqual([
      'saliva-release-lab',
      'taste-bud-observatory',
      'nose-flavour-connection',
      'mystery-flavour-challenge',
    ]);
    expect(record.narration.cues).toHaveLength(4);
    expect(record.narration.cues.every((cue) => cue.caption === cue.text)).toBe(true);

    const science = [
      record.module.scientificConceptExplanation,
      ...record.module.misconceptionsAddressed,
      ...Object.values(SENSE_OF_TASTE_SCENE_METADATA.stageOutcomes),
      ...record.experience.stages.flatMap((stage) => [stage.cue, stage.detail]),
      ...record.assessment.prompts.flatMap((prompt) => [
        prompt.question,
        prompt.explanation,
        ...(prompt.options ?? []).map((option) => option.label),
      ]),
    ]
      .join(' ')
      .toLowerCase();

    for (const term of ['sweet', 'sour', 'salty', 'bitter', 'umami']) {
      expect(science).toContain(term);
    }
    expect(science).toContain('saliva');
    expect(science).toContain('taste-receptor');
    expect(science).toContain('texture');
    expect(science).toContain('strict tongue map');
    expect(science).toMatch(/blocked nose|reduced smell/);
  });

  it('builds four interactive models and restores scene state on disposal', () => {
    const scene = new THREE.Scene();
    const previousBackground = new THREE.Color(0x223344);
    const previousEnvironment = new THREE.Texture();
    const previousFog = new THREE.Fog(0x334455, 2, 20);
    scene.background = previousBackground;
    scene.environment = previousEnvironment;
    scene.fog = previousFog;

    const world = createSenseOfTasteWorld({
      scene,
    } as unknown as SimulationSceneContext);

    expect(world.root.name).toBe('sense-of-taste-detective-laboratory');
    expect(world.cueIds).toEqual([
      'scene:saliva-release-lab',
      'scene:taste-bud-observatory',
      'scene:nose-flavour-connection',
      'scene:mystery-flavour-challenge',
    ]);
    expect(world.interactionTargets.map((target) => target.actionId)).toEqual([
      'dissolve-virtual-food-sample',
      'scan-taste-bud-receptors',
      'open-retronasal-aroma-route',
      'inspect-mystery-flavour-sample',
    ]);

    world.applyCue('scene:taste-bud-observatory', 1, {
      reducedMotion: false,
      seatedMode: false,
      locomotion: 'boundedTeleport',
      turnMode: 'smooth',
    });
    const stage = world.root.getObjectByName('mission-2-taste-bud-observatory');
    expect(stage?.visible).toBe(true);
    expect(world.root.getObjectByName('taste receptor quality model 5')?.visible).toBe(true);
    expect(world.focusTarget('scene:taste-bud-observatory')).toBeDefined();

    world.dispose();
    expect(world.root.parent).toBeNull();
    expect(scene.background).toBe(previousBackground);
    expect(scene.environment).toBe(previousEnvironment);
    expect(scene.fog).toBe(previousFog);
    expect(world.interactionTargets).toHaveLength(0);
  });
});
