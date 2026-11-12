export type ProteinSampleId = 'egg-white' | 'milk' | 'dal' | 'gram-flour' | 'sugar';

export type ProteinSample = { id: ProteinSampleId; label: string; containsProtein: boolean; preparation: string; resultColour: string };

export const PROTEIN_SAMPLES: readonly ProteinSample[] = [
  { id: 'egg-white', label: 'Egg white', containsProtein: true, preparation: 'Mix a small spoon of egg white with water in a clean test tube.', resultColour: 'violet' },
  { id: 'milk', label: 'Milk', containsProtein: true, preparation: 'Add a small, equal amount of milk to a clean test tube.', resultColour: 'violet' },
  { id: 'dal', label: 'Dal extract', containsProtein: true, preparation: 'Crush soaked dal with water and transfer the clear extract.', resultColour: 'violet' },
  { id: 'gram-flour', label: 'Gram flour', containsProtein: true, preparation: 'Mix a small spoon of gram flour with water and allow coarse particles to settle.', resultColour: 'violet' },
  { id: 'sugar', label: 'Sugar solution', containsProtein: false, preparation: 'Dissolve a small spoon of sugar in the same amount of water.', resultColour: 'blue' },
] as const;

export type ProteinTestState = { sampleId: ProteinSampleId; prepared: boolean; copperSulphateDrops: number; sodiumHydroxideDrops: number; mixed: boolean };

export function createProteinTest(sampleId: ProteinSampleId = 'egg-white'): ProteinTestState {
  return { sampleId, prepared: false, copperSulphateDrops: 0, sodiumHydroxideDrops: 0, mixed: false };
}

export function prepareProteinSample(state: ProteinTestState): ProteinTestState {
  return { ...state, prepared: true, copperSulphateDrops: 0, sodiumHydroxideDrops: 0, mixed: false };
}

export function addCopperSulphate(state: ProteinTestState): ProteinTestState {
  if (!state.prepared) throw new Error('Prepare the food extract first.');
  if (state.sodiumHydroxideDrops > 0) throw new Error('Copper sulphate must be added before sodium hydroxide.');
  return { ...state, copperSulphateDrops: Math.min(2, state.copperSulphateDrops + 1) };
}

export function addSodiumHydroxide(state: ProteinTestState): ProteinTestState {
  if (state.copperSulphateDrops < 2) throw new Error('Add two copper sulphate drops first.');
  return { ...state, sodiumHydroxideDrops: Math.min(10, state.sodiumHydroxideDrops + 1) };
}

export function mixProteinTest(state: ProteinTestState): ProteinTestState {
  if (state.sodiumHydroxideDrops < 10) throw new Error('Add ten sodium hydroxide drops before mixing.');
  return { ...state, mixed: true };
}

export function interpretProteinTest(state: ProteinTestState) {
  if (!state.mixed) throw new Error('Complete and mix the reagent test before observing.');
  const sample = PROTEIN_SAMPLES.find(item => item.id === state.sampleId);
  if (!sample) throw new Error(`Unknown protein sample: ${state.sampleId}`);
  return { containsProtein: sample.containsProtein, colour: sample.resultColour, conclusion: sample.containsProtein ? `${sample.label} contains protein because the mixture turned violet.` : `${sample.label} does not show protein because the mixture remained blue.` };
}

export const PROTEIN_CONTROL_TRIALS = {
  positive: { sample: 'Egg albumin solution', expected: 'violet', purpose: 'Confirms that the reagents can detect protein.' },
  negative: { sample: 'Water', expected: 'blue', purpose: 'Shows the reagent colour when protein is absent.' },
} as const;
