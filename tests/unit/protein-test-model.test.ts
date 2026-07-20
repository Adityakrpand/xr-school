import { describe, expect, it } from 'vitest';
import { PROTEIN_CONTROL_TRIALS, addCopperSulphate, addSodiumHydroxide, createProteinTest, interpretProteinTest, mixProteinTest, prepareProteinSample } from '../../packages/simulation-runtime/src/models/proteinTestModel';

function complete(sampleId: Parameters<typeof createProteinTest>[0]) {
  let state = prepareProteinSample(createProteinTest(sampleId));
  state = addCopperSulphate(addCopperSulphate(state));
  for (let index = 0; index < 10; index += 1) state = addSodiumHydroxide(state);
  return mixProteinTest(state);
}

describe('controlled protein test model', () => {
  it('enforces preparation, reagent order and quantities', () => {
    expect(() => addCopperSulphate(createProteinTest())).toThrow(/Prepare/);
    const prepared = prepareProteinSample(createProteinTest());
    expect(() => addSodiumHydroxide(prepared)).toThrow(/two copper sulphate/);
    expect(() => mixProteinTest(addSodiumHydroxide(addCopperSulphate(addCopperSulphate(prepared))))).toThrow(/ten sodium hydroxide/);
  });

  it('identifies protein-positive and negative evidence', () => {
    expect(interpretProteinTest(complete('milk'))).toEqual(expect.objectContaining({ containsProtein: true, colour: 'violet' }));
    expect(interpretProteinTest(complete('sugar'))).toEqual(expect.objectContaining({ containsProtein: false, colour: 'blue' }));
  });

  it('defines positive and negative controls', () => {
    expect(PROTEIN_CONTROL_TRIALS.positive.expected).toBe('violet');
    expect(PROTEIN_CONTROL_TRIALS.negative.expected).toBe('blue');
  });
});
