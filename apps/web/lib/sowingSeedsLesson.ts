export type SowingStageId =
  | "prepared"
  | "meaning"
  | "selection"
  | "water-test"
  | "depth"
  | "spacing"
  | "methods"
  | "germination";

export interface SowingStage {
  id: SowingStageId;
  title: string;
  shortTitle: string;
  instruction: string;
  narration: string;
  requiredTargets: readonly string[];
}

export const SOWING_STAGES: readonly SowingStage[] = [
  {
    id: "prepared",
    shortTitle: "Enter the seedbed",
    title: "The field is ready",
    instruction: "Inspect the loose soil, seed bag and farmer before sowing.",
    narration:
      "Welcome back to the farm. The soil has been ploughed and levelled, so it is loose, even and ready. Inspect the seedbed, the seed bag and the farmer to begin the next crop-production step.",
    requiredTargets: ["prepared-soil", "seed-bag", "farmer"],
  },
  {
    id: "meaning",
    shortTitle: "Define sowing",
    title: "Place a seed with purpose",
    instruction:
      "Inspect a seed and its furrow, then identify what sowing means.",
    narration:
      "Sowing is the process of placing seeds in prepared soil so they can germinate and grow into new plants. Examine the seed and the furrow, then choose the correct meaning.",
    requiredTargets: ["seed", "prepared-soil"],
  },
  {
    id: "selection",
    shortTitle: "Choose good seed",
    title: "Build a healthy seed batch",
    instruction:
      "Select five healthy seeds and inspect the broken and damaged examples.",
    narration:
      "Before sowing, farmers select healthy, well-developed seeds. Choose five full, undamaged seeds for the good-seed basket, and inspect why broken or damaged seeds are rejected.",
    requiredTargets: ["broken-seed", "damaged-seed"],
  },
  {
    id: "water-test",
    shortTitle: "Observe a water test",
    title: "Which seeds float and sink?",
    instruction:
      "Drop the sample into water, then inspect the floating and sunken seeds.",
    narration:
      "A simple water activity can reveal differences in a seed sample. Some hollow or damaged seeds may float, while well-filled seeds often sink. This observation supports selection, but it does not replace checking the crop and seed source.",
    requiredTargets: ["floating-seeds", "sunken-seeds"],
  },
  {
    id: "depth",
    shortTitle: "Set the depth",
    title: "Not shallow. Not too deep.",
    instruction:
      "Compare all three positions and place the seed at the suitable depth.",
    narration:
      "Seeds must be placed at a suitable depth. A shallow seed can dry out or be eaten by birds. A very deep seed may struggle to reach the surface. Choose the middle position where moisture and emergence are balanced.",
    requiredTargets: ["shallow-seed", "correct-depth", "deep-seed"],
  },
  {
    id: "spacing",
    shortTitle: "Give plants room",
    title: "Turn a crowded row into a crop row",
    instruction:
      "Compare both rows, then move three seeds into evenly spaced positions.",
    narration:
      "Seeds also need proper spacing. Crowded plants compete for sunlight, water, nutrients and room for their roots. Compare the crowded and evenly spaced rows, then correct the crowded row.",
    requiredTargets: ["crowded-row", "proper-row"],
  },
  {
    id: "methods",
    shortTitle: "Compare sowing tools",
    title: "From funnel tool to seed drill",
    instruction:
      "Inspect both tools and identify which one places seeds uniformly in rows.",
    narration:
      "Traditional sowing can use a funnel-shaped tool behind a plough. A tractor-drawn seed drill places seeds in rows at a more uniform depth and spacing, then covers them with soil. Compare both methods.",
    requiredTargets: ["traditional-tool", "seed-drill"],
  },
  {
    id: "germination",
    shortTitle: "Watch life begin",
    title: "The seed wakes underground",
    instruction:
      "Inspect the covered seed, root and shoot, then complete the five-question crop check.",
    narration:
      "The selected seeds are now covered at the correct depth and spacing. With suitable water, air and temperature, the seed absorbs water, its root grows downward and its shoot reaches upward toward light. Complete the crop check.",
    requiredTargets: ["covered-seed", "root", "shoot"],
  },
] as const;

export const SOWING_QUIZ = [
  {
    id: "meaning",
    question: "What is sowing?",
    options: [
      ["harvest", "Cutting mature crops"],
      ["sowing", "Placing seeds in prepared soil"],
      ["weeding", "Removing weeds"],
    ],
    correct: "sowing",
  },
  {
    id: "quality",
    question: "Which seeds are best for sowing?",
    options: [
      ["healthy", "Healthy and well-developed seeds"],
      ["broken", "Broken seeds"],
      ["damaged", "Damaged seeds"],
    ],
    correct: "healthy",
  },
  {
    id: "depth",
    question: "Why should seeds be sown at a suitable depth?",
    options: [
      ["germinate", "To support moisture and emergence"],
      ["stop", "To stop them from growing"],
      ["harden", "To make the soil hard"],
    ],
    correct: "germinate",
  },
  {
    id: "spacing",
    question: "Why is proper spacing important?",
    options: [
      ["resources", "Plants receive enough space and resources"],
      ["competition", "Plants compete more"],
      ["crowding", "Crowding stops roots from growing"],
    ],
    correct: "resources",
  },
  {
    id: "equipment",
    question: "Which modern equipment is used for sowing?",
    options: [
      ["cultivator", "Cultivator"],
      ["drill", "Seed drill"],
      ["sickle", "Sickle"],
    ],
    correct: "drill",
  },
] as const;

export interface SowingState {
  stageIndex: number;
  inspected: readonly string[];
  answer: string | null;
  healthySeeds: number;
  seedsTested: boolean;
  depthChoice: "shallow" | "correct" | "deep" | null;
  spacingFixes: number;
  quizIndex: number;
  feedback: string;
  completed: boolean;
}

export type SowingAction =
  | { type: "inspect"; target: string }
  | { type: "answer"; value: string }
  | { type: "select-healthy" }
  | { type: "test-seeds" }
  | { type: "place-depth"; value: "shallow" | "correct" | "deep" }
  | { type: "space-seed" }
  | { type: "next" }
  | { type: "restart" };

export function createSowingState(): SowingState {
  return {
    stageIndex: 0,
    inspected: [],
    answer: null,
    healthySeeds: 0,
    seedsTested: false,
    depthChoice: null,
    spacingFixes: 0,
    quizIndex: 0,
    feedback: SOWING_STAGES[0].instruction,
    completed: false,
  };
}

export function currentSowingStage(state: SowingState) {
  return SOWING_STAGES[Math.min(state.stageIndex, SOWING_STAGES.length - 1)];
}

function includesEvery(values: readonly string[], required: readonly string[]) {
  return required.every((value) => values.includes(value));
}

export function sowingCanContinue(state: SowingState) {
  const stage = currentSowingStage(state);
  if (!includesEvery(state.inspected, stage.requiredTargets)) return false;
  if (stage.id === "meaning") return state.answer === "sowing";
  if (stage.id === "selection") return state.healthySeeds >= 5;
  if (stage.id === "water-test") return state.seedsTested;
  if (stage.id === "depth") return state.depthChoice === "correct";
  if (stage.id === "spacing") return state.spacingFixes >= 3;
  if (stage.id === "methods") return state.answer === "seed-drill";
  if (stage.id === "germination") return state.quizIndex >= SOWING_QUIZ.length;
  return true;
}

const TARGET_FEEDBACK: Readonly<Record<string, string>> = {
  "prepared-soil": "Loose, level soil forms an even seedbed for sowing.",
  "seed-bag": "The bag holds the seed lot that must be checked before use.",
  farmer: "The farmer checks seed quality, depth and spacing before sowing.",
  seed: "A seed contains a living embryo that can become a new plant.",
  "broken-seed": "A broken seed may have a damaged embryo and poor germination.",
  "damaged-seed": "Discoloured or insect-damaged seed is rejected from this batch.",
  "floating-seeds": "Some hollow or damaged seeds may float in this observation.",
  "sunken-seeds": "Well-filled seeds often sink in this simple activity.",
  "shallow-seed": "This seed is exposed near the surface and may dry out.",
  "correct-depth": "This position balances moisture, air and a short path upward.",
  "deep-seed": "A shoot from this depth may use too much stored energy before emerging.",
  "crowded-row": "Crowded plants must compete for light, water, nutrients and space.",
  "proper-row": "Even spacing gives each plant a fair share of field resources.",
  "traditional-tool": "Seeds pass through a funnel and tube behind the plough.",
  "seed-drill": "The seed drill meters seeds into rows at controlled depth and spacing.",
  "covered-seed": "The soil cover protects the seed and helps retain moisture.",
  root: "The first root grows downward and anchors the young plant.",
  shoot: "The shoot grows upward toward light and opens its first leaves.",
};

export function reduceSowing(
  state: SowingState,
  action: SowingAction,
): SowingState {
  if (action.type === "restart") return createSowingState();
  if (state.completed) return state;
  const stage = currentSowingStage(state);

  if (action.type === "inspect") {
    if (!stage.requiredTargets.includes(action.target)) return state;
    const inspected = state.inspected.includes(action.target)
      ? state.inspected
      : [...state.inspected, action.target];
    return {
      ...state,
      inspected,
      feedback: TARGET_FEEDBACK[action.target] ?? stage.instruction,
    };
  }

  if (action.type === "select-healthy" && stage.id === "selection") {
    const healthySeeds = Math.min(5, state.healthySeeds + 1);
    return {
      ...state,
      healthySeeds,
      feedback:
        healthySeeds === 5
          ? "Five healthy seeds selected. Check both rejected examples."
          : `${healthySeeds} of 5 healthy seeds selected.`,
    };
  }

  if (action.type === "test-seeds" && stage.id === "water-test") {
    return {
      ...state,
      seedsTested: true,
      feedback:
        "The sample separates: inspect both the floating and sunken seeds.",
    };
  }

  if (action.type === "place-depth" && stage.id === "depth") {
    const correct = action.value === "correct";
    return {
      ...state,
      depthChoice: action.value,
      feedback: correct
        ? "Correct depth: covered, moist and still close enough to emerge."
        : action.value === "shallow"
          ? "Too shallow. The seed is exposed to drying and birds."
          : "Too deep. The shoot may exhaust its food before reaching light.",
    };
  }

  if (action.type === "space-seed" && stage.id === "spacing") {
    const spacingFixes = Math.min(3, state.spacingFixes + 1);
    return {
      ...state,
      spacingFixes,
      feedback:
        spacingFixes === 3
          ? "The corrected row now gives every seed similar growing space."
          : `${spacingFixes} of 3 seeds moved into even positions.`,
    };
  }

  if (action.type === "answer") {
    if (stage.id === "meaning") {
      return action.value === "sowing"
        ? {
            ...state,
            answer: "sowing",
            feedback: "Correct. Sowing places seeds in prepared soil.",
          }
        : {
            ...state,
            answer: null,
            feedback: "Look at the seed entering the prepared furrow and try again.",
          };
    }
    if (stage.id === "methods") {
      return action.value === "seed-drill"
        ? {
            ...state,
            answer: "seed-drill",
            feedback:
              "Correct. The seed drill meters and covers seeds more uniformly in rows.",
          }
        : {
            ...state,
            answer: null,
            feedback:
              "Compare how each tool controls both seed depth and spacing.",
          };
    }
    if (stage.id === "germination" && state.quizIndex < SOWING_QUIZ.length) {
      const question = SOWING_QUIZ[state.quizIndex];
      return action.value === question.correct
        ? {
            ...state,
            quizIndex: state.quizIndex + 1,
            feedback:
              state.quizIndex === SOWING_QUIZ.length - 1
                ? "Crop check complete. Your seed row is ready to grow."
                : "Correct. Continue the crop check.",
          }
        : {
            ...state,
            feedback: "Use the evidence from the field and try again.",
          };
    }
  }

  if (action.type === "next" && sowingCanContinue(state)) {
    if (state.stageIndex === SOWING_STAGES.length - 1) {
      return {
        ...state,
        completed: true,
        feedback:
          "Mission complete: select healthy seed, control depth and spacing, then cover it for germination.",
      };
    }
    const stageIndex = state.stageIndex + 1;
    return {
      ...state,
      stageIndex,
      inspected: [],
      answer: null,
      feedback: SOWING_STAGES[stageIndex].instruction,
    };
  }

  return state;
}
