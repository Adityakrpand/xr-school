import { describe, expect, it } from 'vitest';
import { ANIMAL_DIETS, FOOD_JOURNEY, FOOD_SOURCES, PLANT_PARTS, createFoodExplorerModel } from '../../packages/simulation-runtime/src';

describe('food explorer scientific model', () => {
  it('keeps the curriculum classifications explicit', () => {
    expect(FOOD_SOURCES.honey).toBe('animal');
    expect(PLANT_PARTS.potato).toBe('stem');
    expect(PLANT_PARTS.tomato).toBe('fruit');
    expect(ANIMAL_DIETS.cow).toBe('herbivore');
    expect(ANIMAL_DIETS.tiger).toBe('carnivore');
    expect(ANIMAL_DIETS.human).toBe('omnivore');
    expect(FOOD_JOURNEY.at(-1)).toBe('Dining table');
  });

  it('tracks travel, unique discoveries, and assessment evidence', () => {
    const model = createFoodExplorerModel();
    model.travel('plants');
    model.discover('rice');
    model.discover('rice');
    model.answer(true);
    model.answer(false);
    expect(model.snapshot()).toMatchObject({ zone: 'plants', visited: ['welcome', 'plants'], discoveries: ['rice'], correct: 1, attempts: 2 });
  });
});
