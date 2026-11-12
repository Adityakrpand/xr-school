import { describe, expect, it } from 'vitest';
import { CONTROL_TRIALS, FOOD_SAMPLES, addIodineDrop, createCarbohydrateTest, interpretCarbohydrateTest, prepareSample } from '../../packages/simulation-runtime/src/models/carbohydrateTestModel';

describe('carbohydrate iodine-test model', () => {
  it('models starch-positive and starch-negative food samples', () => {
    expect(FOOD_SAMPLES.filter(sample => sample.containsStarch).map(sample => sample.id)).toEqual(['potato', 'rice', 'bread']);
    expect(FOOD_SAMPLES.filter(sample => !sample.containsStarch).map(sample => sample.id)).toEqual(['sugar', 'oil']);
    expect(CONTROL_TRIALS.positive.expected).toBe('blue-black');
    expect(CONTROL_TRIALS.negative.expected).toBe('yellow-brown');
  });

  it('requires preparation and two controlled iodine drops', () => {
    expect(() => addIodineDrop(createCarbohydrateTest())).toThrow(/Prepare/);
    const prepared = prepareSample(createCarbohydrateTest('potato'));
    const oneDrop = addIodineDrop(prepared);
    expect(oneDrop.observed).toBe(false);
    expect(() => interpretCarbohydrateTest(oneDrop)).toThrow(/two iodine drops/);
    expect(interpretCarbohydrateTest(addIodineDrop(oneDrop))).toEqual(expect.objectContaining({ containsStarch: true, colour: 'blue-black' }));
  });

  it('does not confuse sugar with starch', () => {
    let trial = prepareSample(createCarbohydrateTest('sugar'));
    trial = addIodineDrop(addIodineDrop(trial));
    expect(interpretCarbohydrateTest(trial)).toEqual(expect.objectContaining({ containsStarch: false, colour: 'yellow-brown' }));
  });
});
