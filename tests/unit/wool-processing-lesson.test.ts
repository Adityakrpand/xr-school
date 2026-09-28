import { describe, expect, it } from "vitest";
import {
  createWoolProcessingState,
  currentWoolProcessingStage,
  reduceWoolProcessing,
  SCOURING_CONTAINERS,
  SCOURING_STATION_SEQUENCE,
  SHEARING_PATH,
  SHEARING_PREPARATION_SEQUENCE,
  WOOL_PROCESSING_QUIZ,
  WOOL_PROCESSING_STAGES,
  WOOL_PROCESS_SEQUENCE,
  woolProcessingCanContinue,
  type WoolProcessingState,
} from "../../apps/web/lib/woolProcessingLesson";

const inspect = (state: WoolProcessingState, ...targets: string[]) =>
  targets.reduce(
    (next, target) => reduceWoolProcessing(next, { type: "inspect", target }),
    state,
  );

const next = (state: WoolProcessingState) =>
  reduceWoolProcessing(state, { type: "next" });

describe("Mission Wool lesson", () => {
  it("publishes all ten story stages and the canonical wool journey", () => {
    expect(WOOL_PROCESSING_STAGES.map((stage) => stage.id)).toEqual([
      "arrival",
      "season",
      "prepare",
      "shearing",
      "detective",
      "experiment",
      "station",
      "compare",
      "journey",
      "quiz",
    ]);
    expect(WOOL_PROCESS_SEQUENCE).toEqual([
      "sheep",
      "shearing",
      "raw-fleece",
      "scouring",
      "rinsing",
      "drying",
    ]);
    expect(WOOL_PROCESSING_QUIZ).toHaveLength(4);
    expect(WOOL_PROCESSING_QUIZ[3].correct).toBe("lanolin");
  });

  it("requires evidence at arrival and the correct warm-weather choice", () => {
    let state = createWoolProcessingState();
    expect(woolProcessingCanContinue(state)).toBe(false);
    state = inspect(
      state,
      "fleece",
      "heartbeat",
      "temperature-scanner",
      "wool-fibre",
    );
    expect(woolProcessingCanContinue(state)).toBe(true);
    state = next(state);
    expect(currentWoolProcessingStage(state).id).toBe("season");

    state = reduceWoolProcessing(state, {
      type: "choose-season",
      value: "winter",
    });
    expect(state.selectedSeason).toBeNull();
    expect(state.feedback).toContain("needs the thick fleece");
    state = reduceWoolProcessing(state, {
      type: "choose-season",
      value: "rainy",
    });
    expect(woolProcessingCanContinue(state)).toBe(false);
    state = reduceWoolProcessing(state, {
      type: "choose-season",
      value: "summer",
    });
    expect(woolProcessingCanContinue(state)).toBe(true);
    state = next(state);
    expect(state.earnedStars).toEqual(["season-expert"]);
  });

  it("enforces safe preparation and careful ordered shearing", () => {
    let state: WoolProcessingState = {
      ...createWoolProcessingState(),
      stageIndex: 2,
    };

    state = reduceWoolProcessing(state, {
      type: "prepare",
      target: "kitchen-knife",
    });
    expect(state.preparationIndex).toBe(0);
    expect(state.feedback).toContain("Unsafe equipment");
    state = reduceWoolProcessing(state, {
      type: "prepare",
      target: "electric-shears",
    });
    expect(state.preparationIndex).toBe(0);
    expect(state.feedback).toContain("Next: check dry");

    for (const target of SHEARING_PREPARATION_SEQUENCE) {
      state = reduceWoolProcessing(state, { type: "prepare", target });
    }
    expect(woolProcessingCanContinue(state)).toBe(true);
    state = next(state);

    state = reduceWoolProcessing(state, {
      type: "shear-pass",
      target: "shear-path-1",
      angle: "steep",
      speed: "steady",
    });
    expect(state.shearingIndex).toBe(0);
    expect(state.feedback).toContain("parallel");
    state = reduceWoolProcessing(state, {
      type: "shear-pass",
      target: "shear-path-1",
      angle: "parallel",
      speed: "too-fast",
    });
    expect(state.shearingIndex).toBe(0);

    for (const target of SHEARING_PATH) {
      state = reduceWoolProcessing(state, {
        type: "shear-pass",
        target,
        angle: "parallel",
        speed: "steady",
      });
    }
    expect(woolProcessingCanContinue(state)).toBe(true);
    state = next(state);
    expect(state.earnedStars).toContain("animal-care");
  });

  it("distinguishes raw-fleece evidence and safe scouring methods", () => {
    let state: WoolProcessingState = {
      ...createWoolProcessingState(),
      stageIndex: 4,
    };
    state = reduceWoolProcessing(state, {
      type: "answer-fleece",
      value: "clean-first",
    });
    expect(state.fleeceAnswer).toBeNull();
    expect(state.feedback).toContain("4 impurity clues remain");
    state = inspect(state, "dust-soil", "sweat", "plant-material", "lanolin");
    state = reduceWoolProcessing(state, {
      type: "answer-fleece",
      value: "spin-now",
    });
    expect(woolProcessingCanContinue(state)).toBe(false);
    state = reduceWoolProcessing(state, {
      type: "answer-fleece",
      value: "clean-first",
    });
    expect(woolProcessingCanContinue(state)).toBe(true);
    state = next(state);

    state = reduceWoolProcessing(state, {
      type: "choose-container",
      value: "warm-solution",
    });
    expect(state.selectedContainer).toBeNull();
    for (const value of SCOURING_CONTAINERS) {
      state = reduceWoolProcessing(state, { type: "test-container", value });
    }
    state = reduceWoolProcessing(state, {
      type: "choose-container",
      value: "very-hot-water",
    });
    expect(state.selectedContainer).toBeNull();
    state = reduceWoolProcessing(state, {
      type: "choose-container",
      value: "warm-solution",
    });
    expect(woolProcessingCanContinue(state)).toBe(true);
    expect(state.feedback).toContain("without rough damage");
  });

  it("completes every ordered interaction and the final assessment", () => {
    let state = inspect(
      createWoolProcessingState(),
      "fleece",
      "heartbeat",
      "temperature-scanner",
      "wool-fibre",
    );
    state = next(state);
    state = reduceWoolProcessing(state, {
      type: "choose-season",
      value: "summer",
    });
    state = next(state);
    for (const target of SHEARING_PREPARATION_SEQUENCE) {
      state = reduceWoolProcessing(state, { type: "prepare", target });
    }
    state = next(state);
    for (const target of SHEARING_PATH) {
      state = reduceWoolProcessing(state, {
        type: "shear-pass",
        target,
        angle: "parallel",
        speed: "steady",
      });
    }
    state = next(state);
    state = inspect(state, "dust-soil", "sweat", "plant-material", "lanolin");
    state = reduceWoolProcessing(state, {
      type: "answer-fleece",
      value: "clean-first",
    });
    state = next(state);
    for (const value of SCOURING_CONTAINERS) {
      state = reduceWoolProcessing(state, { type: "test-container", value });
    }
    state = reduceWoolProcessing(state, {
      type: "choose-container",
      value: "warm-solution",
    });
    state = next(state);
    for (const target of SCOURING_STATION_SEQUENCE) {
      state = reduceWoolProcessing(state, { type: "scour", target });
    }
    state = next(state);
    state = inspect(state, "raw-sample", "clean-sample");
    state = next(state);
    for (const value of WOOL_PROCESS_SEQUENCE) {
      state = reduceWoolProcessing(state, { type: "sequence", value });
    }
    state = next(state);
    for (const question of WOOL_PROCESSING_QUIZ) {
      state = reduceWoolProcessing(state, {
        type: "quiz",
        value: question.correct,
      });
    }

    expect(woolProcessingCanContinue(state)).toBe(true);
    state = next(state);
    expect(state.completed).toBe(true);
    expect(state.earnedStars).toEqual([
      "season-expert",
      "animal-care",
      "fibre-detective",
      "scouring-scientist",
    ]);
    expect(state.feedback).toContain("Shearing removes the fleece");
  });

  it("rejects hidden, unsafe and out-of-order station interactions", () => {
    const initial = createWoolProcessingState();
    expect(
      reduceWoolProcessing(initial, {
        type: "choose-season",
        value: "summer",
      }),
    ).toBe(initial);
    expect(
      reduceWoolProcessing(initial, {
        type: "sequence",
        value: "sheep",
      }),
    ).toBe(initial);

    let station: WoolProcessingState = {
      ...createWoolProcessingState(),
      stageIndex: 6,
    };
    station = reduceWoolProcessing(station, {
      type: "scour",
      target: "twist-wool",
    });
    expect(station.scouringIndex).toBe(0);
    expect(station.feedback).toContain("Do not twist");
    station = reduceWoolProcessing(station, {
      type: "scour",
      target: "drying-rack",
    });
    expect(station.scouringIndex).toBe(0);
    expect(station.feedback).toContain("Next: temperature dial");
  });

  it("does not double-count repeated evidence and freezes completion", () => {
    let state = reduceWoolProcessing(createWoolProcessingState(), {
      type: "inspect",
      target: "fleece",
    });
    state = reduceWoolProcessing(state, {
      type: "inspect",
      target: "fleece",
    });
    expect(state.inspected).toEqual(["fleece"]);

    const finishedShearing: WoolProcessingState = {
      ...createWoolProcessingState(),
      stageIndex: 3,
      shearingIndex: SHEARING_PATH.length,
    };
    expect(
      reduceWoolProcessing(finishedShearing, {
        type: "shear-pass",
        target: "shear-path-4",
        angle: "parallel",
        speed: "steady",
      }),
    ).toBe(finishedShearing);

    const complete: WoolProcessingState = {
      ...createWoolProcessingState(),
      completed: true,
    };
    expect(
      reduceWoolProcessing(complete, {
        type: "inspect",
        target: "fleece",
      }),
    ).toBe(complete);
  });

  it("restarts with independent clean collections", () => {
    const changed = inspect(createWoolProcessingState(), "fleece");
    const restarted = reduceWoolProcessing(changed, { type: "restart" });
    expect(restarted).toEqual(createWoolProcessingState());
    expect(restarted.inspected).not.toBe(changed.inspected);
    expect(restarted.testedContainers).not.toBe(changed.testedContainers);
    expect(restarted.earnedStars).not.toBe(changed.earnedStars);
  });
});
