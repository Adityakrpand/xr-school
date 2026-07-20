import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const VIEWERS = [
  'ChemicalReactionsLabViewer.tsx',
  'CarbohydrateTestLabViewer.tsx',
  'ProteinTestLabViewer.tsx',
  'PollinationViewer.tsx',
  'CircuitViewer.tsx',
  'ColourAdventureViewer.tsx',
  'StatesOfMatterViewer.tsx',
  'FoodSourcesSortingViewer.tsx',
  'SolubilityLabViewer.tsx',
  'DigestiveSystemViewer.tsx',
  'ExploreOurGalaxyViewer.tsx',
  'GeometryMathsLabViewer.tsx',
  'HumanBodyAnatomyViewer.tsx',
  'MicroscopicLifeObservationViewer.tsx',
  'MoneyTownViewer.tsx',
  'PhotosynthesisJourneyViewer.tsx',
  'PrepositionAdventureViewer.tsx',
  'SnakeWildlifeStoryViewer.tsx',
  'SolarSystemMissionViewer.tsx',
];

describe('implemented simulation audio contract', () => {
  it('keeps the shared browser/headset narration utility available', () => {
    const source = readFileSync(resolve(process.cwd(), 'apps/web/lib/simulationAudio.ts'), 'utf8');

    expect(source).toContain('export async function playSimulationNarration');
    expect(source).toContain('AudioContext');
    expect(source).toContain('HTMLAudioElement');
    expect(source).toContain('new Audio');
    expect(source).toContain('speechSynthesis');
    expect(source).toContain("utterance.lang = 'en-IN'");
    expect(source).toContain('speechSynthesis.resume()');
    expect(source).toContain('trySpeak();');
  });

  it('requires every implemented viewer to start narration through the shared utility', () => {
    for (const viewer of VIEWERS) {
      const source = readFileSync(resolve(process.cwd(), `apps/web/components/simulations/${viewer}`), 'utf8');

      expect(source, `${viewer} must import shared audio`).toContain('@/lib/simulationAudio');
      expect(source, `${viewer} must play narration`).toContain('playSimulationNarration');
      expect(source, `${viewer} must stop narration on cleanup`).toContain('stopSimulationNarration');
    }
  });
});
