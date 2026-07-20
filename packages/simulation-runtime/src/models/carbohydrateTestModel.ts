export type FoodSampleId = 'potato' | 'rice' | 'bread' | 'sugar' | 'oil';

export type FoodSample = { id: FoodSampleId; label: string; containsStarch: boolean; preparation: string; untreatedColour: string; resultColour: string };

export const FOOD_SAMPLES: readonly FoodSample[] = [
  { id: 'potato', label: 'Potato', containsStarch: true, preparation: 'Place a thin, freshly cut potato slice in the test dish.', untreatedColour: 'pale cream', resultColour: 'blue-black' },
  { id: 'rice', label: 'Cooked rice', containsStarch: true, preparation: 'Mash a small spoon of cooked rice with a few drops of water.', untreatedColour: 'white', resultColour: 'blue-black' },
  { id: 'bread', label: 'Bread', containsStarch: true, preparation: 'Tear a small bread piece and moisten it with two drops of water.', untreatedColour: 'cream', resultColour: 'blue-black' },
  { id: 'sugar', label: 'Sugar solution', containsStarch: false, preparation: 'Dissolve one small spoon of sugar in water.', untreatedColour: 'colourless', resultColour: 'yellow-brown' },
  { id: 'oil', label: 'Cooking oil', containsStarch: false, preparation: 'Place three drops of cooking oil in a clean test dish.', untreatedColour: 'pale yellow', resultColour: 'yellow-brown' },
] as const;

export type CarbohydrateTestState = { sampleId: FoodSampleId; samplePrepared: boolean; iodineDrops: number; observed: boolean };

export function createCarbohydrateTest(sampleId: FoodSampleId = 'potato'): CarbohydrateTestState {
  return { sampleId, samplePrepared: false, iodineDrops: 0, observed: false };
}

export function prepareSample(state: CarbohydrateTestState): CarbohydrateTestState {
  return { ...state, samplePrepared: true, iodineDrops: 0, observed: false };
}

export function addIodineDrop(state: CarbohydrateTestState): CarbohydrateTestState {
  if (!state.samplePrepared) throw new Error('Prepare the food sample before adding iodine.');
  return { ...state, iodineDrops: Math.min(3, state.iodineDrops + 1), observed: state.iodineDrops + 1 >= 2 };
}

export function interpretCarbohydrateTest(state: CarbohydrateTestState) {
  if (!state.observed) throw new Error('Add at least two iodine drops before recording an observation.');
  const sample = FOOD_SAMPLES.find(item => item.id === state.sampleId);
  if (!sample) throw new Error(`Unknown food sample: ${state.sampleId}`);
  return {
    containsStarch: sample.containsStarch,
    colour: sample.resultColour,
    conclusion: sample.containsStarch
      ? `${sample.label} contains starch because iodine changed to blue-black.`
      : `${sample.label} does not show starch because iodine remained yellow-brown.`,
  };
}

export const CONTROL_TRIALS = {
  positive: { sample: 'Starch solution', expected: 'blue-black', purpose: 'Confirms that the iodine reagent can detect starch.' },
  negative: { sample: 'Water', expected: 'yellow-brown', purpose: 'Shows the colour when starch is absent.' },
} as const;
