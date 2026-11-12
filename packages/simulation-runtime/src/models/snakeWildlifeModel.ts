export type SnakeId = 'rat-snake' | 'cobra' | 'russells-viper' | 'common-krait' | 'python';

export type SnakeProfile = {
  id: SnakeId;
  name: string;
  scientificName: string;
  habitat: string;
  food: string;
  venomous: boolean;
  averageLengthM: number;
  color: number;
  pattern: number;
  fact: string;
  behavior: string;
  conservation: string;
};

export const SNAKE_PROFILES: readonly SnakeProfile[] = [
  { id: 'rat-snake', name: 'Indian Rat Snake', scientificName: 'Ptyas mucosa', habitat: 'Farms, grasslands and village edges', food: 'Rats, frogs and small animals', venomous: false, averageLengthM: 1.8, color: 0x9a7b3f, pattern: 0x332b1c, fact: 'It helps farmers by controlling rodents that damage crops.', behavior: 'Fast-moving, tongue-flicking and able to climb and swim.', conservation: 'Observe from a distance and let this useful predator move away.' },
  { id: 'cobra', name: 'Indian Cobra', scientificName: 'Naja naja', habitat: 'Fields, scrub and rocky shelter', food: 'Rodents, frogs and other small animals', venomous: true, averageLengthM: 1.5, color: 0x755b35, pattern: 0xe6d5a6, fact: 'Its hood is a defensive warning, not an invitation to approach.', behavior: 'Usually avoids people; raises its forebody and spreads its hood when threatened.', conservation: 'Protected wildlife. Keep distance and call a trained rescuer.' },
  { id: 'russells-viper', name: "Russell's Viper", scientificName: 'Daboia russelii', habitat: 'Dry grassland, farms and scrub', food: 'Rodents and small mammals', venomous: true, averageLengthM: 1.2, color: 0xa97944, pattern: 0x38271c, fact: 'Its chain-like markings provide excellent camouflage among dry leaves.', behavior: 'Often coils and relies on camouflage; may hiss when disturbed.', conservation: 'Watch where you step and never disturb hidden wildlife.' },
  { id: 'common-krait', name: 'Common Krait', scientificName: 'Bungarus caeruleus', habitat: 'Village outskirts, fields and scrub', food: 'Other snakes, rodents and frogs', venomous: true, averageLengthM: 1.0, color: 0x18233d, pattern: 0xf1f5f9, fact: 'It is shy and mostly active at night.', behavior: 'Slow and secretive by day, more active after dark.', conservation: 'Use a torch outdoors at night and contact a rescuer if one enters a home.' },
  { id: 'python', name: 'Indian Rock Python', scientificName: 'Python molurus', habitat: 'Forest, wetlands and rocky areas', food: 'Birds and mammals', venomous: false, averageLengthM: 3.0, color: 0x8b704c, pattern: 0x3f3125, fact: 'It is non-venomous and subdues prey with its muscular body.', behavior: 'Large, powerful, slow-moving, and capable of climbing and swimming.', conservation: 'Large snakes need undisturbed habitat and must never be captured or harassed.' },
] as const;

export const SNAKE_QUIZ = [
  { question: 'Which snake helps farmers by eating rats?', answers: ['Indian Rat Snake', 'Common Krait', 'Indian Cobra'], correct: 0 },
  { question: 'Which two snakes here are non-venomous?', answers: ['Rat snake and python', 'Cobra and krait', "Cobra and Russell's viper"], correct: 0 },
  { question: 'What should you do when you see a snake?', answers: ['Stay calm, keep distance, tell an adult', 'Try to pick it up', 'Throw stones'], correct: 0 },
  { question: 'Why should snakes be protected?', answers: ['They support ecological balance', 'They make good toys', 'They all live in houses'], correct: 0 },
] as const;

export function evaluateSnakeQuiz(questionIndex: number, answerIndex: number) {
  const question = SNAKE_QUIZ[questionIndex];
  if (!question) throw new Error(`Unknown snake quiz question: ${questionIndex}`);
  return answerIndex === question.correct;
}
