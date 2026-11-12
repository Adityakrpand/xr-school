import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
const source = readFileSync(resolve(process.cwd(), 'apps/web/components/simulations/ProteinTestLabViewer.tsx'), 'utf8');
describe('protein test laboratory viewer', () => {
  it('implements the controlled reagent sequence and controls', () => {
    for (const text of ['Prepare', 'Add CuSO₄', 'Add NaOH', 'Mix & observe', 'Clean & reset', 'Positive control', 'Negative control']) expect(source).toContain(text);
  });
  it('provides safety and shared narration', () => {
    expect(source).toContain('Sodium hydroxide is corrosive');
    expect(source).toContain('playSimulationNarration');
    expect(source).toContain('stopSimulationNarration');
    expect(source).toContain('Repeat instruction');
    expect(source).toContain('ControlledLabVrMode');
  });
});
