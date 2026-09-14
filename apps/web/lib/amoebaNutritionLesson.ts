export type AmoebaStageId =
  | "pond"
  | "find"
  | "anatomy"
  | "hungry"
  | "ingestion"
  | "digestion"
  | "assimilation"
  | "egestion"
  | "sequence"
  | "recap";

export interface AmoebaStage {
  id: AmoebaStageId;
  title: string;
  shortTitle: string;
  instruction: string;
  narration: string;
  requiredTargets: readonly string[];
}

export const AMOEBA_STAGES: readonly AmoebaStage[] = [
  {
    id: "pond",
    shortTitle: "Collect pond water",
    title: "The hidden world in a pond",
    instruction:
      "Use the dropper, collect pond water, place it on the slide and inspect it through the microscope.",
    narration:
      "Welcome, young scientist. This freshwater pond contains an entire world of organisms too small for our eyes to see. Follow Dr Anaya's method: take the dropper, collect one drop of pond water, place it on the glass slide and look through the microscope.",
    requiredTargets: ["dropper", "pond-water", "glass-slide", "microscope"],
  },
  {
    id: "find",
    shortTitle: "Find Ami",
    title: "Look for a changing shape",
    instruction:
      "Search the microscopic water and select the organism that has no fixed shape.",
    narration:
      "You are now inside the water drop. Algae, bacteria and tiny organisms drift around you. Look for the transparent, jelly-like organism that continuously changes its shape. That organism is an amoeba.",
    requiredTargets: ["amoeba"],
  },
  {
    id: "anatomy",
    shortTitle: "Explore the cell",
    title: "One cell with many working parts",
    instruction:
      "Inspect the membrane, cytoplasm, nucleus, pseudopodia and food vacuole. Find the part that captures food.",
    narration:
      "Ami is a unicellular organism, which means its whole body is one cell. Inspect the protective cell membrane, jelly-like cytoplasm, controlling nucleus, temporary food vacuole and finger-like pseudopodia. Pseudopodia means false feet; they help the amoeba move and capture food.",
    requiredTargets: [
      "cell-membrane",
      "cytoplasm",
      "nucleus",
      "pseudopodia",
      "food-vacuole",
    ],
  },
  {
    id: "hungry",
    shortTitle: "Bring food closer",
    title: "Ami becomes hungry",
    instruction:
      "Choose a suitable bacterium, then guide Ami's pseudopodium towards it.",
    narration:
      "Amoeba has no mouth or teeth. It feeds on tiny organisms, bacteria and small organic particles in water. Choose a suitable food particle and help Ami extend a pseudopodium towards it.",
    requiredTargets: ["food-particle", "feeding-pseudopodium"],
  },
  {
    id: "ingestion",
    shortTitle: "Engulf the food",
    title: "Capture the food — ingestion",
    instruction:
      "Activate both pseudopodia around the food, then inspect the new food vacuole.",
    narration:
      "Watch carefully. Two pseudopodia extend around the food and join together, carrying it inside the cell. Taking food into the body is called ingestion. A food vacuole now forms around the captured particle and acts like a temporary stomach.",
    requiredTargets: ["left-pseudopodium", "right-pseudopodium", "ingestion-vacuole"],
  },
  {
    id: "digestion",
    shortTitle: "Activate digestion",
    title: "Break food into simple substances",
    instruction:
      "Activate all three digestive-enzyme points inside the food vacuole.",
    narration:
      "Digestive juices enter the food vacuole and break complex food into simple, soluble substances. Activate the three enzyme points and watch the food separate into small nutrient particles. This stage is called digestion.",
    requiredTargets: ["enzyme-one", "enzyme-two", "enzyme-three"],
  },
  {
    id: "assimilation",
    shortTitle: "Use the nutrients",
    title: "Absorption and assimilation",
    instruction:
      "Guide nutrients from the vacuole to energy, growth and body-repair zones.",
    narration:
      "Digested nutrients pass from the food vacuole into the cytoplasm. That is absorption. The cell then uses those nutrients for energy, growth and repair. Using absorbed nutrients is called assimilation. Power all three zones to help Ami become active again.",
    requiredTargets: ["energy-nutrient", "growth-nutrient", "repair-nutrient"],
  },
  {
    id: "egestion",
    shortTitle: "Remove the waste",
    title: "Undigested food leaves the cell",
    instruction:
      "Guide the waste vacuole to the membrane, then release the waste outside.",
    narration:
      "Not every part of food can be digested. Guide the remaining waste to the cell membrane and release it outside. Removing undigested food is called egestion. An amoeba can release waste through its cell membrane at different points.",
    requiredTargets: ["waste-vacuole", "waste-release"],
  },
  {
    id: "sequence",
    shortTitle: "Build the nutrition cycle",
    title: "Put holozoic nutrition in order",
    instruction:
      "Select the five stages in order: ingestion, digestion, absorption, assimilation and egestion.",
    narration:
      "Now rebuild the complete nutrition cycle. Amoeba follows holozoic nutrition: it ingests solid food, digests it, absorbs the nutrients, assimilates them for life processes and removes undigested waste by egestion.",
    requiredTargets: [],
  },
  {
    id: "recap",
    shortTitle: "Prove your discovery",
    title: "Return from the microscopic world",
    instruction:
      "Use the enlarged amoeba to answer three evidence questions and unlock the explorer badge.",
    narration:
      "You have returned to Dr Anaya's microscope. Prove what you discovered: identify the structure that captures food, the place where digestion occurs and the name of waste removal. Complete all three questions to earn the Amoeba Nutrition Explorer badge.",
    requiredTargets: [],
  },
] as const;

export const AMOEBA_SEQUENCE = [
  "ingestion",
  "digestion",
  "absorption",
  "assimilation",
  "egestion",
] as const;

export const AMOEBA_QUIZ = [
  {
    id: "capture",
    question: "Which structure helps an amoeba capture food?",
    options: [
      ["pseudopodia", "Pseudopodia"],
      ["nucleus", "Nucleus"],
      ["cytoplasm", "Cytoplasm"],
    ],
    correct: "pseudopodia",
  },
  {
    id: "digestion-place",
    question: "Where does digestion occur?",
    options: [
      ["membrane", "Cell membrane"],
      ["food-vacuole", "Food vacuole"],
      ["nucleus", "Nucleus"],
    ],
    correct: "food-vacuole",
  },
  {
    id: "waste",
    question: "What is the removal of undigested food called?",
    options: [
      ["ingestion", "Ingestion"],
      ["absorption", "Absorption"],
      ["egestion", "Egestion"],
    ],
    correct: "egestion",
  },
] as const;

export interface AmoebaState {
  stageIndex: number;
  inspected: readonly string[];
  sampleIndex: number;
  anatomyAnswer: string | null;
  sequenceIndex: number;
  quizIndex: number;
  feedback: string;
  completed: boolean;
}

export type AmoebaAction =
  | { type: "inspect"; target: string }
  | { type: "sample"; target: string }
  | { type: "answer-anatomy"; value: string }
  | { type: "sequence"; value: string }
  | { type: "quiz"; value: string }
  | { type: "next" }
  | { type: "restart" };

export function createAmoebaState(): AmoebaState {
  return {
    stageIndex: 0,
    inspected: [],
    sampleIndex: 0,
    anatomyAnswer: null,
    sequenceIndex: 0,
    quizIndex: 0,
    feedback: AMOEBA_STAGES[0].instruction,
    completed: false,
  };
}

export function currentAmoebaStage(state: AmoebaState) {
  return AMOEBA_STAGES[Math.min(state.stageIndex, AMOEBA_STAGES.length - 1)];
}

const includesEvery = (values: readonly string[], required: readonly string[]) =>
  required.every((value) => values.includes(value));

export function amoebaCanContinue(state: AmoebaState) {
  const stage = currentAmoebaStage(state);
  if (!includesEvery(state.inspected, stage.requiredTargets)) return false;
  if (stage.id === "pond") return state.sampleIndex >= stage.requiredTargets.length;
  if (stage.id === "anatomy") return state.anatomyAnswer === "pseudopodia";
  if (stage.id === "sequence") return state.sequenceIndex >= AMOEBA_SEQUENCE.length;
  if (stage.id === "recap") return state.quizIndex >= AMOEBA_QUIZ.length;
  return true;
}

const TARGET_FEEDBACK: Readonly<Record<string, string>> = {
  dropper: "The clean dropper will collect a tiny pond-water sample.",
  "pond-water": "One drop can contain many microscopic living organisms.",
  "glass-slide": "The water drop spreads into a thin layer on the glass slide.",
  microscope: "The microscope magnifies objects that our unaided eyes cannot see.",
  amoeba: "Correct. Ami has a soft body and no fixed shape.",
  "cell-membrane": "The thin membrane protects the cell and controls exchange.",
  cytoplasm: "Cytoplasm is the jelly-like material filling the cell.",
  nucleus: "The nucleus controls the amoeba's important activities.",
  pseudopodia: "Pseudopodia are temporary false feet for movement and feeding.",
  "food-vacuole": "A food vacuole stores food while it is digested.",
  "food-particle": "This small bacterium is suitable food for an amoeba.",
  "feeding-pseudopodium": "The pseudopodium grows towards the selected food.",
  "left-pseudopodium": "The first pseudopodium begins surrounding the food.",
  "right-pseudopodium": "The second pseudopodium closes around the food.",
  "ingestion-vacuole": "The enclosed food now sits inside a temporary food vacuole.",
  "enzyme-one": "Digestive juice begins weakening the complex food particle.",
  "enzyme-two": "More of the food breaks into simple soluble nutrients.",
  "enzyme-three": "Digestion is complete; usable nutrient particles are visible.",
  "energy-nutrient": "Assimilated nutrients release energy for movement and life.",
  "growth-nutrient": "Nutrients provide material for cell growth.",
  "repair-nutrient": "Nutrients help repair and maintain the cell.",
  "waste-vacuole": "Undigested material moves with the vacuole towards the membrane.",
  "waste-release": "The membrane opens briefly and the waste leaves the cell.",
};

export function reduceAmoeba(state: AmoebaState, action: AmoebaAction): AmoebaState {
  if (action.type === "restart") return createAmoebaState();
  if (state.completed) return state;
  const stage = currentAmoebaStage(state);

  if (action.type === "sample" && stage.id === "pond") {
    const expected = stage.requiredTargets[state.sampleIndex];
    if (action.target !== expected) {
      return { ...state, feedback: `Follow the method in order. Next, use the ${expected.replaceAll("-", " ")}.` };
    }
    const inspected = state.inspected.includes(action.target)
      ? state.inspected
      : [...state.inspected, action.target];
    return {
      ...state,
      inspected,
      sampleIndex: state.sampleIndex + 1,
      feedback: TARGET_FEEDBACK[action.target] ?? stage.instruction,
    };
  }

  if (action.type === "inspect") {
    if (!stage.requiredTargets.includes(action.target)) return state;
    const inspected = state.inspected.includes(action.target)
      ? state.inspected
      : [...state.inspected, action.target];
    const anatomyAnswer =
      stage.id === "anatomy" && action.target === "pseudopodia"
        ? "pseudopodia"
        : state.anatomyAnswer;
    return {
      ...state,
      inspected,
      anatomyAnswer,
      feedback: TARGET_FEEDBACK[action.target] ?? stage.instruction,
    };
  }

  if (action.type === "answer-anatomy" && stage.id === "anatomy") {
    return action.value === "pseudopodia"
      ? { ...state, anatomyAnswer: action.value, feedback: "Correct. Pseudopodia surround and capture food." }
      : { ...state, anatomyAnswer: null, feedback: "Look for the temporary false feet that extend from the cell." };
  }

  if (action.type === "sequence" && stage.id === "sequence") {
    const expected = AMOEBA_SEQUENCE[state.sequenceIndex];
    return action.value === expected
      ? {
          ...state,
          sequenceIndex: state.sequenceIndex + 1,
          feedback:
            state.sequenceIndex === AMOEBA_SEQUENCE.length - 1
              ? "Complete. Ingestion, digestion, absorption, assimilation, egestion."
              : `Correct. Now choose ${AMOEBA_SEQUENCE[state.sequenceIndex + 1]}.`,
        }
      : { ...state, feedback: `Not yet. The next stage is ${expected}.` };
  }

  if (action.type === "quiz" && stage.id === "recap" && state.quizIndex < AMOEBA_QUIZ.length) {
    const question = AMOEBA_QUIZ[state.quizIndex];
    return action.value === question.correct
      ? {
          ...state,
          quizIndex: state.quizIndex + 1,
          feedback:
            state.quizIndex === AMOEBA_QUIZ.length - 1
              ? "Evidence check complete. Amoeba Nutrition Explorer badge unlocked."
              : "Correct. Use the model to answer the next question.",
        }
      : { ...state, feedback: "Use the visible amoeba evidence and try again." };
  }

  if (action.type === "next" && amoebaCanContinue(state)) {
    if (state.stageIndex === AMOEBA_STAGES.length - 1) {
      return {
        ...state,
        completed: true,
        feedback: "Mission complete: you traced the full holozoic nutrition cycle in an amoeba.",
      };
    }
    const stageIndex = state.stageIndex + 1;
    return {
      ...state,
      stageIndex,
      inspected: [],
      anatomyAnswer: null,
      feedback: AMOEBA_STAGES[stageIndex].instruction,
    };
  }

  return state;
}
