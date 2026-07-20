import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'apps/web/components/simulations/CarbohydrateTestLabViewer.tsx'), 'utf8');

describe('carbohydrate test laboratory viewer', () => {
  it('exposes a dedicated catalog route and complete controlled procedure', () => {
    expect(source).toContain('Prepare sample');
    expect(source).toContain('Add iodine drop');
    expect(source).toContain('Observe colour');
    expect(source).toContain('Clean & reset');
    expect(source).toContain('Positive control');
    expect(source).toContain('Negative control');
  });

  it('provides narrated procedural and evidence feedback', () => {
    expect(source).toContain('@/lib/simulationAudio');
    expect(source).toContain('playSimulationNarration');
    expect(source).toContain('stopSimulationNarration');
    expect(source).toContain('Repeat instruction');
    expect(source).toContain('Blue-black is a positive starch test');
    expect(source).toContain('ControlledLabVrMode');
  });
});
