export type FoodExplorerZone = 'welcome' | 'plants' | 'animals' | 'journey' | 'wildlife' | 'assessment';
export type FoodSource = 'plant' | 'animal';
export type DietType = 'herbivore' | 'carnivore' | 'omnivore';
export type PlantPart = 'root' | 'stem' | 'leaf' | 'flower' | 'fruit' | 'seed';

export const FOOD_EXPLORER_ZONES: readonly FoodExplorerZone[] = [
  'welcome', 'plants', 'animals', 'journey', 'wildlife', 'assessment',
];

export const FOOD_SOURCES: Record<string, FoodSource> = {
  rice: 'plant', tomato: 'plant', carrot: 'plant', mango: 'plant', milk: 'animal', egg: 'animal', honey: 'animal', fish: 'animal',
};

export const PLANT_PARTS: Record<string, PlantPart> = {
  carrot: 'root', radish: 'root', potato: 'stem', ginger: 'stem', spinach: 'leaf', cabbage: 'leaf',
  cauliflower: 'flower', broccoli: 'flower', mango: 'fruit', tomato: 'fruit', rice: 'seed', peas: 'seed',
};

export const ANIMAL_DIETS: Record<string, DietType> = {
  cow: 'herbivore', deer: 'herbivore', rabbit: 'herbivore', elephant: 'herbivore', giraffe: 'herbivore',
  lion: 'carnivore', tiger: 'carnivore', crocodile: 'carnivore', eagle: 'carnivore', wolf: 'carnivore',
  bear: 'omnivore', crow: 'omnivore', dog: 'omnivore', human: 'omnivore', monkey: 'omnivore', pig: 'omnivore',
};

export const FOOD_JOURNEY = ['Seed', 'Farmer', 'Crop', 'Harvest', 'Transport', 'Market', 'Home', 'Kitchen', 'Dining table'] as const;

export interface FoodExplorerSnapshot {
  zone: FoodExplorerZone;
  visited: FoodExplorerZone[];
  discoveries: string[];
  correct: number;
  attempts: number;
}

export function createFoodExplorerModel() {
  let state: FoodExplorerSnapshot = { zone: 'welcome', visited: ['welcome'], discoveries: [], correct: 0, attempts: 0 };
  const snapshot = (): FoodExplorerSnapshot => ({ ...state, visited: [...state.visited], discoveries: [...state.discoveries] });
  return {
    snapshot,
    travel(zone: FoodExplorerZone) {
      state = { ...state, zone, visited: state.visited.includes(zone) ? state.visited : [...state.visited, zone] };
      return snapshot();
    },
    discover(id: string) {
      if (!state.discoveries.includes(id)) state = { ...state, discoveries: [...state.discoveries, id] };
      return snapshot();
    },
    answer(correct: boolean) {
      state = { ...state, attempts: state.attempts + 1, correct: state.correct + (correct ? 1 : 0) };
      return snapshot();
    },
    reset() {
      state = { zone: 'welcome', visited: ['welcome'], discoveries: [], correct: 0, attempts: 0 };
      return snapshot();
    },
  };
}

export type FoodExplorerModel = ReturnType<typeof createFoodExplorerModel>;
