import { describe, expect, it } from "vitest";
import {
  AMOEBA_QUIZ,
  AMOEBA_SEQUENCE,
  amoebaCanContinue,
  createAmoebaState,
  currentAmoebaStage,
  reduceAmoeba,
} from "../../apps/web/lib/amoebaNutritionLesson";

const inspect = (
  state: ReturnType<typeof createAmoebaState>,
  ...targets: string[]
) => targets.reduce((next, target) => reduceAmoeba(next, { type: "inspect", target }), state);

describe("amoeba nutrition lesson", () => {
  it("requires the pond sample method in scientific order", () => {
    let state = createAmoebaState();
    state = reduceAmoeba(state, { type: "sample", target: "microscope" });
    expect(state.sampleIndex).toBe(0);
    for (const target of ["dropper", "pond-water", "glass-slide", "microscope"]) {
      state = reduceAmoeba(state, { type: "sample", target });
    }
    expect(amoebaCanContinue(state)).toBe(true);
    state = reduceAmoeba(state, { type: "next" });
    expect(currentAmoebaStage(state).id).toBe("find");
  });

  it("completes every cellular nutrition process and assessment", () => {
    let state = createAmoebaState();
    for (const target of ["dropper", "pond-water", "glass-slide", "microscope"]) {
      state = reduceAmoeba(state, { type: "sample", target });
    }
    state = reduceAmoeba(state, { type: "next" });
    state = inspect(state, "amoeba");
    state = reduceAmoeba(state, { type: "next" });
    state = inspect(state, "cell-membrane", "cytoplasm", "nucleus", "pseudopodia", "food-vacuole");
    state = reduceAmoeba(state, { type: "next" });
    state = inspect(state, "food-particle", "feeding-pseudopodium");
    state = reduceAmoeba(state, { type: "next" });
    state = inspect(state, "left-pseudopodium", "right-pseudopodium", "ingestion-vacuole");
    state = reduceAmoeba(state, { type: "next" });
    state = inspect(state, "enzyme-one", "enzyme-two", "enzyme-three");
    state = reduceAmoeba(state, { type: "next" });
    state = inspect(state, "energy-nutrient", "growth-nutrient", "repair-nutrient");
    state = reduceAmoeba(state, { type: "next" });
    state = inspect(state, "waste-vacuole", "waste-release");
    state = reduceAmoeba(state, { type: "next" });
    for (const value of AMOEBA_SEQUENCE) state = reduceAmoeba(state, { type: "sequence", value });
    state = reduceAmoeba(state, { type: "next" });
    for (const question of AMOEBA_QUIZ) state = reduceAmoeba(state, { type: "quiz", value: question.correct });
    expect(amoebaCanContinue(state)).toBe(true);
    state = reduceAmoeba(state, { type: "next" });
    expect(state.completed).toBe(true);
  });

  it("rejects stale interactions and incorrect sequence choices", () => {
    const initial = createAmoebaState();
    expect(reduceAmoeba(initial, { type: "inspect", target: "amoeba" })).toBe(initial);
    expect(reduceAmoeba(initial, { type: "sequence", value: "egestion" })).toBe(initial);
    expect(reduceAmoeba(initial, { type: "quiz", value: "pseudopodia" })).toBe(initial);
  });

  it("restarts with independent clean state", () => {
    const changed = reduceAmoeba(createAmoebaState(), { type: "sample", target: "dropper" });
    const restarted = reduceAmoeba(changed, { type: "restart" });
    expect(restarted).toEqual(createAmoebaState());
    expect(restarted.inspected).not.toBe(changed.inspected);
  });
});
