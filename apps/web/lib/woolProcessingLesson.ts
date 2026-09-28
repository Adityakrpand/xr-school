export type WoolStageId =
  | "arrival"
  | "season"
  | "prepare"
  | "shearing"
  | "detective"
  | "experiment"
  | "station"
  | "compare"
  | "journey"
  | "quiz";

export type WoolStarId =
  | "season-expert"
  | "animal-care"
  | "fibre-detective"
  | "scouring-scientist";

export interface WoolStage {
  id: WoolStageId;
  title: string;
  shortTitle: string;
  instruction: string;
  narration: string;
  requiredTargets: readonly string[];
  reward?: WoolStarId;
}

export const WOOL_PROCESSING_STAGES: readonly WoolStage[] = [
  {
    id: "arrival",
    shortTitle: "Meet Woolly",
    title: "Welcome to Flock Valley",
    instruction:
      "Touch Woolly's fleece, listen to the heartbeat, scan the temperature and magnify a wool fibre.",
    narration:
      "Welcome to Flock Valley, Young Wool Scientist. This is Woolly. His thick winter coat is called a fleece, and it now feels very warm. Explore the living sheep gently before beginning the mission.",
    requiredTargets: [
      "fleece",
      "heartbeat",
      "temperature-scanner",
      "wool-fibre",
    ],
  },
  {
    id: "season",
    shortTitle: "Choose the season",
    title: "When is shearing safe?",
    instruction:
      "Use the season wheel to choose winter, the rainy season or summer.",
    narration:
      "Before removing Woolly's fleece, choose the suitable season. The sheep must stay warm in winter, and wet fleece is difficult to shear safely.",
    requiredTargets: [],
    reward: "season-expert",
  },
  {
    id: "prepare",
    shortTitle: "Prepare safely",
    title: "Build a safe shearing station",
    instruction:
      "Prepare Woolly and the equipment in the correct safety order.",
    narration:
      "A trained shearer prepares carefully. Check that the fleece is dry, use a clean non-slip platform, choose clean electric shears, inspect them, oil the blades and calm Woolly.",
    requiredTargets: [],
  },
  {
    id: "shearing",
    shortTitle: "Follow the guide",
    title: "Shear without hurting Woolly",
    instruction:
      "Complete all four glowing paths with the shears parallel to the skin at a steady speed.",
    narration:
      "Shearing is the careful removal of a sheep's fleece. Keep the shears almost parallel to the skin, move at a controlled speed and follow each glowing path in order.",
    requiredTargets: [],
    reward: "animal-care",
  },
  {
    id: "detective",
    shortTitle: "Inspect raw fleece",
    title: "Become a fibre detective",
    instruction:
      "Find all four impurities, then decide whether this raw fleece can be spun immediately.",
    narration:
      "The fleece is off the sheep, but it is yellowish, heavy and sticky. Use the magnifier to find dust and soil, sweat, plant material and the natural grease called lanolin.",
    requiredTargets: ["dust-soil", "sweat", "plant-material", "lanolin"],
    reward: "fibre-detective",
  },
  {
    id: "experiment",
    shortTitle: "Compare three washes",
    title: "Discover effective scouring",
    instruction:
      "Test wool in all three containers, then choose the safe method that removes grease and dirt.",
    narration:
      "Scouring means thoroughly washing sheared wool to remove dirt, dust, sweat and grease. Compare cold water, very hot rough washing and controlled warm water with a suitable cleaning solution.",
    requiredTargets: [],
  },
  {
    id: "station",
    shortTitle: "Clean the fleece",
    title: "Operate the scouring station",
    instruction:
      "Set, wash, rinse, squeeze and dry the fleece in the correct order.",
    narration:
      "Use controlled warm water and the correct cleaning-solution dose. Move the fleece gently, rinse until the water stays clear, remove extra water with rollers and spread the wool to dry.",
    requiredTargets: [],
    reward: "scouring-scientist",
  },
  {
    id: "compare",
    shortTitle: "Before and after",
    title: "What did scouring change?",
    instruction:
      "Inspect both the raw sample and the clean sample before continuing.",
    narration:
      "Compare the two samples. Raw fleece is greasy, dirty, yellowish and heavy. Scoured wool is clean, soft, lighter and ready for the next processing stage.",
    requiredTargets: ["raw-sample", "clean-sample"],
  },
  {
    id: "journey",
    shortTitle: "Build the journey",
    title: "Put wool processing in order",
    instruction:
      "Place all six objects on the timeline from the living sheep to clean, dry wool.",
    narration:
      "Rebuild Woolly's journey. Begin with the sheep's fleece, remove it by shearing, collect the raw fleece, scour it, rinse it and finally dry it.",
    requiredTargets: [],
  },
  {
    id: "quiz",
    shortTitle: "Final challenge",
    title: "Earn the Master of Wool Processing badge",
    instruction:
      "Answer all four rapid-fire questions using evidence from the mission.",
    narration:
      "Prove that you can distinguish shearing from scouring, explain safe seasonal care and identify lanolin. Four correct answers will complete the mission.",
    requiredTargets: [],
  },
] as const;

export type SeasonChoice = "winter" | "rainy" | "summer";

export const SHEARING_PREPARATION_SEQUENCE = [
  "check-dry",
  "non-slip-platform",
  "electric-shears",
  "inspect-shears",
  "blade-oil",
  "calm-woolly",
] as const;

export type ShearingPreparationStep =
  (typeof SHEARING_PREPARATION_SEQUENCE)[number];
export type UnsafePreparationChoice =
  | "kitchen-knife"
  | "water-spray"
  | "dirty-tool";
export type PreparationChoice =
  | ShearingPreparationStep
  | UnsafePreparationChoice;

export const SHEARING_PATH = [
  "shear-path-1",
  "shear-path-2",
  "shear-path-3",
  "shear-path-4",
] as const;

export type ShearingPath = (typeof SHEARING_PATH)[number];
export type ShearingAngle = "parallel" | "steep";
export type ShearingSpeed = "too-slow" | "steady" | "too-fast";

export const SCOURING_CONTAINERS = [
  "cold-water",
  "very-hot-water",
  "warm-solution",
] as const;

export type ScouringContainer = (typeof SCOURING_CONTAINERS)[number];

export const SCOURING_STATION_SEQUENCE = [
  "temperature-dial",
  "solution-dispenser",
  "wash-paddle",
  "rinse-one",
  "rinse-two",
  "squeeze-rollers",
  "drying-rack",
] as const;

export type ScouringStationStep = (typeof SCOURING_STATION_SEQUENCE)[number];
export type ScouringStationChoice = ScouringStationStep | "twist-wool";

export const WOOL_PROCESS_SEQUENCE = [
  "sheep",
  "shearing",
  "raw-fleece",
  "scouring",
  "rinsing",
  "drying",
] as const;

export type WoolProcessStep = (typeof WOOL_PROCESS_SEQUENCE)[number];

export const WOOL_PROCESSING_QUIZ = [
  {
    id: "removal-name",
    question: "What is the removal of fleece from a sheep called?",
    options: [
      ["scouring", "Scouring"],
      ["shearing", "Shearing"],
      ["spinning", "Spinning"],
    ],
    correct: "shearing",
  },
  {
    id: "scouring-removes",
    question: "What is removed during scouring?",
    options: [
      ["only-water", "Only water"],
      ["impurities", "Dirt, sweat and grease"],
      ["skin", "The sheep's skin"],
    ],
    correct: "impurities",
  },
  {
    id: "warm-weather",
    question: "Why are sheep generally sheared during warm weather?",
    options: [
      [
        "comfort-regrowth",
        "To keep them comfortable and let fleece regrow before winter",
      ],
      ["change-colour", "To change their colour"],
      ["eat-more", "To make them eat more"],
    ],
    correct: "comfort-regrowth",
  },
  {
    id: "natural-grease",
    question: "What is the natural grease in sheep's fleece called?",
    options: [
      ["lanolin", "Lanolin"],
      ["starch", "Starch"],
      ["cellulose", "Cellulose"],
    ],
    correct: "lanolin",
  },
] as const;

export interface WoolProcessingState {
  stageIndex: number;
  inspected: readonly string[];
  selectedSeason: SeasonChoice | null;
  preparationIndex: number;
  shearingIndex: number;
  fleeceAnswer: "clean-first" | null;
  testedContainers: readonly ScouringContainer[];
  selectedContainer: ScouringContainer | null;
  scouringIndex: number;
  sequenceIndex: number;
  quizIndex: number;
  earnedStars: readonly WoolStarId[];
  feedback: string;
  completed: boolean;
}

export type WoolProcessingAction =
  | { type: "inspect"; target: string }
  | { type: "choose-season"; value: SeasonChoice }
  | { type: "prepare"; target: PreparationChoice }
  | {
      type: "shear-pass";
      target: ShearingPath;
      angle: ShearingAngle;
      speed: ShearingSpeed;
    }
  | { type: "answer-fleece"; value: "spin-now" | "clean-first" }
  | { type: "test-container"; value: ScouringContainer }
  | { type: "choose-container"; value: ScouringContainer }
  | { type: "scour"; target: ScouringStationChoice }
  | { type: "sequence"; value: WoolProcessStep }
  | { type: "quiz"; value: string }
  | { type: "next" }
  | { type: "restart" };

export function createWoolProcessingState(): WoolProcessingState {
  return {
    stageIndex: 0,
    inspected: [],
    selectedSeason: null,
    preparationIndex: 0,
    shearingIndex: 0,
    fleeceAnswer: null,
    testedContainers: [],
    selectedContainer: null,
    scouringIndex: 0,
    sequenceIndex: 0,
    quizIndex: 0,
    earnedStars: [],
    feedback: WOOL_PROCESSING_STAGES[0].instruction,
    completed: false,
  };
}

export function currentWoolProcessingStage(state: WoolProcessingState) {
  return WOOL_PROCESSING_STAGES[
    Math.min(state.stageIndex, WOOL_PROCESSING_STAGES.length - 1)
  ];
}

const includesEvery = (
  values: readonly string[],
  required: readonly string[],
) => required.every((value) => values.includes(value));

export function woolProcessingCanContinue(state: WoolProcessingState) {
  const stage = currentWoolProcessingStage(state);
  if (!includesEvery(state.inspected, stage.requiredTargets)) return false;

  if (stage.id === "season") return state.selectedSeason === "summer";
  if (stage.id === "prepare")
    return state.preparationIndex >= SHEARING_PREPARATION_SEQUENCE.length;
  if (stage.id === "shearing")
    return state.shearingIndex >= SHEARING_PATH.length;
  if (stage.id === "detective") return state.fleeceAnswer === "clean-first";
  if (stage.id === "experiment")
    return (
      includesEvery(state.testedContainers, SCOURING_CONTAINERS) &&
      state.selectedContainer === "warm-solution"
    );
  if (stage.id === "station")
    return state.scouringIndex >= SCOURING_STATION_SEQUENCE.length;
  if (stage.id === "journey")
    return state.sequenceIndex >= WOOL_PROCESS_SEQUENCE.length;
  if (stage.id === "quiz")
    return state.quizIndex >= WOOL_PROCESSING_QUIZ.length;
  return true;
}

const TARGET_FEEDBACK: Readonly<Record<string, string>> = {
  fleece:
    "This thick, springy coat of hair is Woolly's fleece. It traps air and keeps the sheep warm.",
  heartbeat:
    "Woolly's calm heartbeat reminds us that animal comfort comes before collecting wool.",
  "temperature-scanner":
    "The scanner shows that Woolly is too warm inside the heavy winter fleece.",
  "wool-fibre":
    "Magnification reveals many fine, crimped fibres packed together in the fleece.",
  "dust-soil":
    "Dust and soil collect while a sheep walks, grazes and rests on the ground.",
  sweat:
    "Sweat is produced naturally by the sheep's body and remains in raw fleece.",
  "plant-material":
    "Small pieces of grass, seeds and leaves can become trapped between wool fibres.",
  lanolin:
    "Lanolin is the natural grease that protects a sheep's skin and fleece.",
  "raw-sample":
    "Raw fleece is yellowish, greasy, sticky, heavy and still contains impurities.",
  "clean-sample":
    "Scoured wool is cleaner, softer, lighter and ready for the next processing stage.",
};

const PREPARATION_FEEDBACK: Readonly<Record<ShearingPreparationStep, string>> =
  {
    "check-dry":
      "The fleece is dry, so the shears can move cleanly through it.",
    "non-slip-platform":
      "The clean, non-slip platform helps Woolly and the shearer stay steady.",
    "electric-shears":
      "Clean electric shears are the suitable tool for this trained shearing demonstration.",
    "inspect-shears":
      "The cable, guard and blades are undamaged and ready for safe use.",
    "blade-oil":
      "A small amount of oil helps the blades move smoothly without overheating.",
    "calm-woolly":
      "Gentle brushing keeps Woolly calm, dry and ready for the trained shearer.",
  };

const SCOURING_FEEDBACK: Readonly<Record<ScouringStationStep, string>> = {
  "temperature-dial":
    "The temperature is in the controlled warm zone: enough to loosen grease without harming fibres.",
  "solution-dispenser":
    "One measured dose is enough to help lift sweat, dirt and lanolin from the wool.",
  "wash-paddle":
    "Gentle movement releases dirt and grease without tangling the fibres.",
  "rinse-one":
    "The first rinse turns cloudy as loosened soap and impurities leave the wool.",
  "rinse-two":
    "The second rinse stays clear, showing that the wool has been rinsed thoroughly.",
  "squeeze-rollers":
    "The rollers press out extra water gently without twisting the fibres.",
  "drying-rack":
    "The clean wool is spread evenly to dry until it becomes soft and fluffy.",
};

function addReward(
  rewards: readonly WoolStarId[],
  reward: WoolStarId | undefined,
) {
  if (!reward || rewards.includes(reward)) return rewards;
  return [...rewards, reward];
}

export function reduceWoolProcessing(
  state: WoolProcessingState,
  action: WoolProcessingAction,
): WoolProcessingState {
  if (action.type === "restart") return createWoolProcessingState();
  if (state.completed) return state;

  const stage = currentWoolProcessingStage(state);

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

  if (action.type === "choose-season" && stage.id === "season") {
    if (action.value === "winter") {
      return {
        ...state,
        selectedSeason: null,
        feedback:
          "Not winter. Woolly needs the thick fleece to remain warm in cold weather.",
      };
    }
    if (action.value === "rainy") {
      return {
        ...state,
        selectedSeason: null,
        feedback:
          "Not the rainy season. Wet fleece is difficult to shear and process safely.",
      };
    }
    return {
      ...state,
      selectedSeason: "summer",
      feedback:
        "Correct. Warm weather keeps Woolly comfortable and leaves time for the fleece to regrow before winter.",
    };
  }

  if (action.type === "prepare" && stage.id === "prepare") {
    if (action.target === "kitchen-knife" || action.target === "dirty-tool") {
      return {
        ...state,
        feedback:
          "Unsafe equipment selected. Use clean, suitable electric shears handled by a trained person.",
      };
    }
    if (action.target === "water-spray") {
      return {
        ...state,
        feedback:
          "Keep Woolly's fleece dry. Wet fleece is harder to shear and process.",
      };
    }

    if (state.preparationIndex >= SHEARING_PREPARATION_SEQUENCE.length)
      return state;
    const expected = SHEARING_PREPARATION_SEQUENCE[state.preparationIndex];
    if (action.target !== expected) {
      return {
        ...state,
        feedback: `Prepare in safety order. Next: ${expected.replaceAll("-", " ")}.`,
      };
    }

    const preparationIndex = Math.min(
      SHEARING_PREPARATION_SEQUENCE.length,
      state.preparationIndex + 1,
    );
    return {
      ...state,
      preparationIndex,
      feedback:
        preparationIndex === SHEARING_PREPARATION_SEQUENCE.length
          ? "Excellent preparation. Woolly is calm, dry and ready for the trained shearer."
          : PREPARATION_FEEDBACK[action.target],
    };
  }

  if (action.type === "shear-pass" && stage.id === "shearing") {
    if (state.shearingIndex >= SHEARING_PATH.length) return state;
    if (action.angle !== "parallel") {
      return {
        ...state,
        feedback:
          "Pause and use the guide: keep the shears almost parallel to Woolly's skin.",
      };
    }
    if (action.speed === "too-fast") {
      return {
        ...state,
        feedback:
          "Slow down. Careless speed can damage the fleece or hurt the sheep.",
      };
    }
    if (action.speed === "too-slow") {
      return {
        ...state,
        feedback:
          "Move a little more steadily so the blades do not pull at the fleece.",
      };
    }

    const expected = SHEARING_PATH[state.shearingIndex];
    if (action.target !== expected) {
      return {
        ...state,
        feedback: `Follow the glowing paths in order. Continue with ${expected.replaceAll("-", " ")}.`,
      };
    }

    const shearingIndex = Math.min(
      SHEARING_PATH.length,
      state.shearingIndex + 1,
    );
    return {
      ...state,
      shearingIndex,
      feedback:
        shearingIndex === SHEARING_PATH.length
          ? "Shearing complete. The fleece has come away as one sheet, and Woolly is comfortable."
          : `Safe pass complete. ${shearingIndex} of ${SHEARING_PATH.length} paths finished.`,
    };
  }

  if (action.type === "answer-fleece" && stage.id === "detective") {
    if (!includesEvery(state.inspected, stage.requiredTargets)) {
      const remaining = stage.requiredTargets.filter(
        (target) => !state.inspected.includes(target),
      ).length;
      return {
        ...state,
        fleeceAnswer: null,
        feedback: `Inspect the raw fleece first. ${remaining} impurity clue${remaining === 1 ? " remains" : "s remain"}.`,
      };
    }
    return action.value === "clean-first"
      ? {
          ...state,
          fleeceAnswer: "clean-first",
          feedback:
            "Correct. Raw fleece must be scoured before it is ready for further processing.",
        }
      : {
          ...state,
          fleeceAnswer: null,
          feedback:
            "The fleece still contains dust, sweat, plant material and lanolin. Clean it first.",
        };
  }

  if (action.type === "test-container" && stage.id === "experiment") {
    const testedContainers = state.testedContainers.includes(action.value)
      ? state.testedContainers
      : [...state.testedContainers, action.value];
    const feedback =
      action.value === "cold-water"
        ? "Cold water removes some dust, but sticky grease remains on the fibres."
        : action.value === "very-hot-water"
          ? "Very hot water and rough movement tangle and mat the wool fibres."
          : "Controlled warm water and suitable cleaning solution separate dirt, sweat and grease safely.";
    return { ...state, testedContainers, feedback };
  }

  if (action.type === "choose-container" && stage.id === "experiment") {
    if (!includesEvery(state.testedContainers, SCOURING_CONTAINERS)) {
      return {
        ...state,
        selectedContainer: null,
        feedback:
          "Test a wool sample in all three containers before choosing the best method.",
      };
    }
    return action.value === "warm-solution"
      ? {
          ...state,
          selectedContainer: "warm-solution",
          feedback:
            "Correct. Controlled warmth and a suitable cleaning solution scour wool effectively without rough damage.",
        }
      : {
          ...state,
          selectedContainer: null,
          feedback:
            action.value === "cold-water"
              ? "Cold water left grease behind. Compare the warm-solution result."
              : "Excessive heat and rough movement matted the fibres. Choose the controlled method.",
        };
  }

  if (action.type === "scour" && stage.id === "station") {
    if (state.scouringIndex >= SCOURING_STATION_SEQUENCE.length) return state;
    if (action.target === "twist-wool") {
      return {
        ...state,
        feedback:
          "Do not twist the wool. Twisting can tangle and damage the fibres; use the squeeze rollers.",
      };
    }

    const expected = SCOURING_STATION_SEQUENCE[state.scouringIndex];
    if (action.target !== expected) {
      return {
        ...state,
        feedback: `Operate the station in order. Next: ${expected.replaceAll("-", " ")}.`,
      };
    }

    const scouringIndex = Math.min(
      SCOURING_STATION_SEQUENCE.length,
      state.scouringIndex + 1,
    );
    return {
      ...state,
      scouringIndex,
      feedback:
        scouringIndex === SCOURING_STATION_SEQUENCE.length
          ? "Scouring complete. The wool is clean, rinsed, gently squeezed and drying evenly."
          : SCOURING_FEEDBACK[action.target],
    };
  }

  if (action.type === "sequence" && stage.id === "journey") {
    if (state.sequenceIndex >= WOOL_PROCESS_SEQUENCE.length) return state;
    const expected = WOOL_PROCESS_SEQUENCE[state.sequenceIndex];
    if (action.value !== expected) {
      return {
        ...state,
        feedback: `That object belongs later. Next place ${expected.replaceAll("-", " ")}.`,
      };
    }
    const sequenceIndex = Math.min(
      WOOL_PROCESS_SEQUENCE.length,
      state.sequenceIndex + 1,
    );
    return {
      ...state,
      sequenceIndex,
      feedback:
        sequenceIndex === WOOL_PROCESS_SEQUENCE.length
          ? "Journey complete: sheep, shearing, raw fleece, scouring, rinsing and drying."
          : `Correct. ${sequenceIndex} of ${WOOL_PROCESS_SEQUENCE.length} steps placed.`,
    };
  }

  if (
    action.type === "quiz" &&
    stage.id === "quiz" &&
    state.quizIndex < WOOL_PROCESSING_QUIZ.length
  ) {
    const question = WOOL_PROCESSING_QUIZ[state.quizIndex];
    if (action.value !== question.correct) {
      return {
        ...state,
        feedback:
          "Not yet. Use the evidence from Woolly's care and the two wool processes, then try again.",
      };
    }
    const quizIndex = state.quizIndex + 1;
    return {
      ...state,
      quizIndex,
      feedback:
        quizIndex === WOOL_PROCESSING_QUIZ.length
          ? "All four answers are correct. The Master of Wool Processing badge is ready."
          : "Correct. Get ready for the next rapid-fire question.",
    };
  }

  if (action.type === "next" && woolProcessingCanContinue(state)) {
    const earnedStars = addReward(state.earnedStars, stage.reward);
    if (state.stageIndex === WOOL_PROCESSING_STAGES.length - 1) {
      return {
        ...state,
        earnedStars,
        completed: true,
        feedback:
          "Mission complete. Shearing removes the fleece; scouring cleans it. Master of Wool Processing badge unlocked!",
      };
    }

    const stageIndex = state.stageIndex + 1;
    return {
      ...state,
      stageIndex,
      inspected: [],
      earnedStars,
      feedback: WOOL_PROCESSING_STAGES[stageIndex].instruction,
    };
  }

  return state;
}

export type WoolState = WoolProcessingState;
export type WoolAction = WoolProcessingAction;
export const WOOL_STAGES = WOOL_PROCESSING_STAGES;
export const WOOL_SEQUENCE = WOOL_PROCESS_SEQUENCE;
export const WOOL_QUIZ = WOOL_PROCESSING_QUIZ;
export const createWoolState = createWoolProcessingState;
export const currentWoolStage = currentWoolProcessingStage;
export const woolCanContinue = woolProcessingCanContinue;
export const reduceWool = reduceWoolProcessing;
