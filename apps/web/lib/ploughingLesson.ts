export type PloughingStageId =
  | "farm"
  | "hard-soil"
  | "plough"
  | "traditional"
  | "modern"
  | "underground"
  | "levelling"
  | "ready";

export interface PloughingStage {
  id: PloughingStageId;
  title: string;
  shortTitle: string;
  instruction: string;
  narration: string;
  requiredTargets: readonly string[];
}

export const PLOUGHING_STAGES: readonly PloughingStage[] = [
  {
    id: "farm",
    shortTitle: "Meet the field",
    title: "The field is waiting",
    instruction: "Inspect the hard soil and speak with the farmer.",
    narration:
      "Welcome to the farm. The previous crop has been harvested. Before new seeds are sown, the soil must be prepared. Inspect the soil and meet the farmer.",
    requiredTargets: ["hard-soil", "farmer"],
  },
  {
    id: "hard-soil",
    shortTitle: "Test the soil",
    title: "Can a seed grow here?",
    instruction:
      "Break open a soil clod, then decide whether this field is ready for seeds.",
    narration:
      "The soil is hard, dry and uneven. Large lumps called clods leave little room for young roots, air or water. Examine a clod before you decide.",
    requiredTargets: ["soil-clod"],
  },
  {
    id: "plough",
    shortTitle: "Know the tool",
    title: "Meet the traditional plough",
    instruction:
      "Inspect the plough, the bullocks and the strip of turned soil.",
    narration:
      "Ploughing means loosening and turning the soil before sowing. Traditionally, bullocks pull a plough. Its blade cuts the hard upper layer and turns it into smaller pieces.",
    requiredTargets: ["plough", "bullocks", "turned-soil"],
  },
  {
    id: "traditional",
    shortTitle: "Make furrows",
    title: "Guide the plough",
    instruction:
      "Select the plough three times to complete three furrows, then inspect one furrow.",
    narration:
      "Guide the bullocks in straight lines. Each pass cuts and turns another strip of earth. The long narrow trench left by the plough is called a furrow.",
    requiredTargets: ["furrow"],
  },
  {
    id: "modern",
    shortTitle: "Compare methods",
    title: "A faster tool for a larger field",
    instruction:
      "Inspect the tractor and cultivator, then compare them with the traditional method.",
    narration:
      "On a large field, a tractor can pull a cultivator. Its metal tines loosen several rows at once, so the work is completed faster than with a bullock-drawn plough.",
    requiredTargets: ["tractor", "cultivator"],
  },
  {
    id: "underground",
    shortTitle: "Look underground",
    title: "Why loose soil matters",
    instruction:
      "Find the roots, air spaces, earthworm and mixed nutrients underground.",
    narration:
      "Loose soil lets roots grow deeper and breathe through air spaces. It helps water enter, mixes manure and nutrients, and supports useful organisms such as earthworms.",
    requiredTargets: ["roots", "air-spaces", "earthworm", "nutrients"],
  },
  {
    id: "levelling",
    shortTitle: "Finish the field",
    title: "Break clods and level the soil",
    instruction:
      "Break three remaining clods, then use the leveller to smooth the field.",
    narration:
      "After ploughing, remaining clods are broken into smaller pieces. The field is then levelled so seeds can be sown evenly and irrigation water does not collect in one place.",
    requiredTargets: [],
  },
  {
    id: "ready",
    shortTitle: "Ready to sow",
    title: "The first step is complete",
    instruction:
      "Inspect the loose soil and seed bag, then complete the four-question field check.",
    narration:
      "The soil is now soft, loose and level. It contains air spaces and is ready for sowing. Complete the field check to finish your soil preparation mission.",
    requiredTargets: ["ready-soil", "seed-bag"],
  },
] as const;

export const PLOUGHING_QUIZ = [
  {
    id: "meaning",
    question: "What is ploughing?",
    options: [
      ["harvest", "Cutting a mature crop"],
      ["loosen", "Loosening and turning the soil"],
      ["water", "Watering the field"],
    ],
    correct: "loosen",
  },
  {
    id: "roots",
    question: "Why is ploughing important?",
    options: [
      ["harden", "It hardens the soil"],
      ["deep", "It helps roots grow deeper"],
      ["remove", "It removes every nutrient"],
    ],
    correct: "deep",
  },
  {
    id: "modern",
    question: "Which modern implement loosens soil?",
    options: [
      ["sickle", "Sickle"],
      ["cultivator", "Cultivator"],
      ["sprayer", "Sprayer"],
    ],
    correct: "cultivator",
  },
  {
    id: "animal",
    question: "Which animals traditionally pull a plough in India?",
    options: [
      ["goats", "Goats"],
      ["bullocks", "Bullocks"],
      ["sheep", "Sheep"],
    ],
    correct: "bullocks",
  },
] as const;

export interface PloughingState {
  stageIndex: number;
  inspected: readonly string[];
  answer: string | null;
  furrows: number;
  brokenClods: number;
  levelled: boolean;
  quizIndex: number;
  feedback: string;
  completed: boolean;
}

export type PloughingAction =
  | { type: "inspect"; target: string }
  | { type: "answer"; value: string }
  | { type: "plough-pass" }
  | { type: "break-clod" }
  | { type: "level" }
  | { type: "next" }
  | { type: "restart" };

export function createPloughingState(): PloughingState {
  return {
    stageIndex: 0,
    inspected: [],
    answer: null,
    furrows: 0,
    brokenClods: 0,
    levelled: false,
    quizIndex: 0,
    feedback: PLOUGHING_STAGES[0].instruction,
    completed: false,
  };
}

export function currentPloughingStage(state: PloughingState) {
  return PLOUGHING_STAGES[
    Math.min(state.stageIndex, PLOUGHING_STAGES.length - 1)
  ];
}

function includesEvery(values: readonly string[], required: readonly string[]) {
  return required.every((value) => values.includes(value));
}

export function ploughingCanContinue(state: PloughingState) {
  const stage = currentPloughingStage(state);
  if (!includesEvery(state.inspected, stage.requiredTargets)) return false;
  if (stage.id === "hard-soil") return state.answer === "no";
  if (stage.id === "traditional") return state.furrows >= 3;
  if (stage.id === "modern") return state.answer === "tractor";
  if (stage.id === "levelling") return state.brokenClods >= 3 && state.levelled;
  if (stage.id === "ready") return state.quizIndex >= PLOUGHING_QUIZ.length;
  return true;
}

const TARGET_FEEDBACK: Readonly<Record<string, string>> = {
  "hard-soil":
    "The surface is compact, cracked and difficult for a young root to enter.",
  farmer: "The farmer prepares the field before sowing the next crop.",
  "soil-clod": "This large, hard lump of soil is called a clod.",
  plough: "The ploughshare cuts and turns the upper soil layer.",
  bullocks:
    "A pair of bullocks provides the pulling force in the traditional method.",
  "turned-soil":
    "Turned soil is looser and contains more spaces than compact soil.",
  furrow: "A furrow is a long, narrow trench made by the plough.",
  tractor: "The tractor supplies strong, continuous pulling power.",
  cultivator: "Several metal tines loosen multiple strips during one pass.",
  roots: "Roots can spread deeper through loose soil.",
  "air-spaces": "Air spaces provide oxygen for roots and soil organisms.",
  earthworm: "Earthworms help mix and aerate the soil.",
  nutrients: "Ploughing mixes manure and nutrients through the upper soil.",
  "ready-soil": "The surface is loose, fine and evenly levelled.",
  "seed-bag": "Seeds are added only after the soil has been properly prepared.",
};

export function reducePloughing(
  state: PloughingState,
  action: PloughingAction,
): PloughingState {
  if (action.type === "restart") return createPloughingState();
  if (state.completed) return state;
  const stage = currentPloughingStage(state);
  if (action.type === "inspect") {
    if (
      !stage.requiredTargets.includes(action.target) &&
      !(stage.id === "traditional" && action.target === "furrow")
    )
      return state;
    const inspected = state.inspected.includes(action.target)
      ? state.inspected
      : [...state.inspected, action.target];
    return {
      ...state,
      inspected,
      feedback: TARGET_FEEDBACK[action.target] ?? stage.instruction,
    };
  }
  if (action.type === "answer") {
    if (stage.id === "hard-soil") {
      return action.value === "no"
        ? {
            ...state,
            answer: "no",
            feedback:
              "Correct. Hard, compact soil must be loosened before sowing.",
          }
        : {
            ...state,
            answer: null,
            feedback:
              "Look at the clod and think about a young root trying to push through it.",
          };
    }
    if (stage.id === "modern") {
      return action.value === "tractor"
        ? {
            ...state,
            answer: "tractor",
            feedback:
              "Correct. A tractor and cultivator prepare a large field faster.",
          }
        : {
            ...state,
            answer: null,
            feedback: "Compare how many rows each method loosens in one pass.",
          };
    }
    if (stage.id === "ready" && state.quizIndex < PLOUGHING_QUIZ.length) {
      const question = PLOUGHING_QUIZ[state.quizIndex];
      return action.value === question.correct
        ? {
            ...state,
            quizIndex: state.quizIndex + 1,
            feedback:
              state.quizIndex === PLOUGHING_QUIZ.length - 1
                ? "Field check complete. You are ready to sow!"
                : "Correct. Here is the next field check.",
          }
        : {
            ...state,
            feedback:
              "Not yet. Use the evidence you observed in the field and try again.",
          };
    }
    return state;
  }
  if (action.type === "plough-pass" && stage.id === "traditional") {
    const furrows = Math.min(3, state.furrows + 1);
    return {
      ...state,
      furrows,
      feedback:
        furrows === 3
          ? "Three straight furrows complete. Inspect one before continuing."
          : `Good control. ${furrows} of 3 furrows complete.`,
    };
  }
  if (action.type === "break-clod" && stage.id === "levelling") {
    const brokenClods = Math.min(3, state.brokenClods + 1);
    return {
      ...state,
      brokenClods,
      feedback:
        brokenClods === 3
          ? "The large clods are broken. Now use the leveller."
          : `${brokenClods} of 3 clods broken.`,
    };
  }
  if (
    action.type === "level" &&
    stage.id === "levelling" &&
    state.brokenClods >= 3
  ) {
    return {
      ...state,
      levelled: true,
      feedback:
        "The field is even, so seeds and irrigation water can be distributed more uniformly.",
    };
  }
  if (action.type === "next" && ploughingCanContinue(state)) {
    if (state.stageIndex === PLOUGHING_STAGES.length - 1) {
      return {
        ...state,
        completed: true,
        feedback:
          "Mission complete: loosen, turn, break and level before sowing.",
      };
    }
    const stageIndex = state.stageIndex + 1;
    return {
      ...state,
      stageIndex,
      inspected: [],
      answer: null,
      feedback: PLOUGHING_STAGES[stageIndex].instruction,
    };
  }
  return state;
}
