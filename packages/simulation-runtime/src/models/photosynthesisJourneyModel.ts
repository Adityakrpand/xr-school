export type PhotosynthesisInput = 'water' | 'carbon-dioxide' | 'sunlight';

export const PHOTOSYNTHESIS_STAGES = [
  { id: 'meadow', title: 'The Plant Mystery', narration: "Plants have no mouths or kitchens, yet they make their own food. Let's shrink and discover how.", concept: 'Plants need food to grow, repair themselves and make flowers and seeds.' },
  { id: 'shrink', title: 'Become Insect-Sized', narration: 'A magical glow makes the grass and water drops appear enormous.', concept: 'Changing scale helps us observe parts of a plant that are normally too small to see.' },
  { id: 'roots', title: 'Root Water Station', narration: 'Tiny root hairs absorb water and minerals from the soil.', concept: 'Roots absorb water (H₂O) from spaces in the soil.' },
  { id: 'stem', title: 'Stem Pipeline', narration: 'The stem carries water upward from the roots to the leaves.', concept: 'Special tubes inside the stem transport water continuously upward.' },
  { id: 'leaf', title: 'Leaf Food Factory', narration: 'Leaves contain veins, tiny openings and green cells that help make food.', concept: 'Leaves are the main food factories of most plants.' },
  { id: 'carbon-dioxide', title: 'Carbon Dioxide Enters', narration: 'Carbon dioxide from the air enters through tiny openings called stomata.', concept: 'Stomata are small pores that let gases move in and out of a leaf.' },
  { id: 'sunlight', title: 'Chlorophyll Captures Light', narration: 'Green chlorophyll captures energy from sunlight.', concept: 'Sunlight supplies the energy needed to make plant food.' },
  { id: 'cell', title: 'Inside a Leaf Cell', narration: 'Inside green chloroplasts, water and carbon dioxide meet using light energy.', concept: 'Chloroplasts are tiny green parts of leaf cells containing chlorophyll.' },
  { id: 'glucose', title: 'Making Glucose', narration: 'The plant uses light energy to change water and carbon dioxide into glucose.', concept: 'Glucose is sugar made by the plant and used as food.' },
  { id: 'oxygen', title: 'Oxygen Returns to the Air', narration: 'Oxygen is released through the stomata while food is made.', concept: 'Plants release oxygen (O₂), which people and animals need to breathe.' },
  { id: 'importance', title: 'Plants Keep Earth Alive', narration: 'Photosynthesis supplies food and oxygen for living things.', concept: 'Plants begin many food chains and help maintain oxygen in the air.' },
  { id: 'activity', title: 'Build Photosynthesis', narration: 'Send sunlight, water and carbon dioxide to the leaf to make glucose and oxygen.', concept: 'Water + carbon dioxide, using light energy, produces glucose + oxygen.' },
  { id: 'quiz', title: 'Explorer Quiz', narration: 'Use what you observed to complete the final challenge.', concept: 'Recall the complete journey from root to leaf and back to the atmosphere.' },
  { id: 'ending', title: 'Protect Every Plant', narration: 'Every plant is a food factory. By protecting plants, we protect life on Earth.', concept: 'Plants support habitats, food chains and breathable air.' },
] as const;

export const PHOTOSYNTHESIS_QUIZ = [
  { question: 'Where does a plant absorb most of its water?', answers: ['Roots', 'Flowers', 'Leaves', 'Fruit'], correct: 0 },
  { question: 'Which gas enters through the stomata?', answers: ['Carbon dioxide', 'Oxygen only', 'Hydrogen', 'Helium'], correct: 0 },
  { question: 'Which gas is released during photosynthesis?', answers: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Steam only'], correct: 0 },
  { question: 'What is the plant food called?', answers: ['Glucose', 'Salt', 'Protein', 'Soil'], correct: 0 },
] as const;

export function evaluatePhotosynthesis(inputs: readonly PhotosynthesisInput[]) {
  const unique = new Set(inputs);
  const complete = unique.has('water') && unique.has('carbon-dioxide') && unique.has('sunlight');
  return { complete, missing: (['water', 'carbon-dioxide', 'sunlight'] as const).filter(input => !unique.has(input)) };
}

export function evaluatePhotosynthesisQuiz(questionIndex: number, answerIndex: number) {
  const question = PHOTOSYNTHESIS_QUIZ[questionIndex];
  if (!question) throw new Error(`Unknown photosynthesis question: ${questionIndex}`);
  return question.correct === answerIndex;
}
