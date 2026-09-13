import { describe, expect, it } from "vitest";
import {
  createSowingState,
  currentSowingStage,
  reduceSowing,
  SOWING_QUIZ,
  sowingCanContinue,
} from "../../apps/web/lib/sowingSeedsLesson";

const inspect = (
  state: ReturnType<typeof createSowingState>,
  ...targets: string[]
) =>
  targets.reduce(
    (next, target) => reduceSowing(next, { type: "inspect", target }),
    state,
  );

describe("sowing of seeds lesson", () => {
  it("requires evidence and the correct concept answer before advancing", () => {
    let state = createSowingState();
    expect(sowingCanContinue(state)).toBe(false);
    state = inspect(state, "prepared-soil", "seed-bag", "farmer");
    expect(sowingCanContinue(state)).toBe(true);
    state = reduceSowing(state, { type: "next" });
    expect(currentSowingStage(state).id).toBe("meaning");
    state = inspect(state, "seed", "prepared-soil");
    state = reduceSowing(state, { type: "answer", value: "harvest" });
    expect(sowingCanContinue(state)).toBe(false);
    state = reduceSowing(state, { type: "answer", value: "sowing" });
    expect(sowingCanContinue(state)).toBe(true);
  });

  it("completes selection, water, depth, spacing, methods and crop check", () => {
    let state = inspect(
      createSowingState(),
      "prepared-soil",
      "seed-bag",
      "farmer",
    );
    state = reduceSowing(state, { type: "next" });
    state = inspect(state, "seed", "prepared-soil");
    state = reduceSowing(state, { type: "answer", value: "sowing" });
    state = reduceSowing(state, { type: "next" });
    state = inspect(state, "broken-seed", "damaged-seed");
    for (let index = 0; index < 5; index += 1)
      state = reduceSowing(state, { type: "select-healthy" });
    state = reduceSowing(state, { type: "next" });
    state = reduceSowing(state, { type: "test-seeds" });
    state = inspect(state, "floating-seeds", "sunken-seeds");
    state = reduceSowing(state, { type: "next" });
    state = inspect(state, "shallow-seed", "correct-depth", "deep-seed");
    state = reduceSowing(state, { type: "place-depth", value: "correct" });
    state = reduceSowing(state, { type: "next" });
    state = inspect(state, "crowded-row", "proper-row");
    for (let index = 0; index < 3; index += 1)
      state = reduceSowing(state, { type: "space-seed" });
    state = reduceSowing(state, { type: "next" });
    state = inspect(state, "traditional-tool", "seed-drill");
    state = reduceSowing(state, { type: "answer", value: "seed-drill" });
    state = reduceSowing(state, { type: "next" });
    state = inspect(state, "covered-seed", "root", "shoot");
    for (const question of SOWING_QUIZ)
      state = reduceSowing(state, { type: "answer", value: question.correct });
    expect(sowingCanContinue(state)).toBe(true);
    state = reduceSowing(state, { type: "next" });
    expect(state.completed).toBe(true);
  });

  it("rejects hidden and stale interactions", () => {
    const initial = createSowingState();
    expect(
      reduceSowing(initial, { type: "inspect", target: "seed-drill" }),
    ).toBe(initial);
    expect(reduceSowing(initial, { type: "select-healthy" })).toBe(initial);
    expect(reduceSowing(initial, { type: "space-seed" })).toBe(initial);
  });

  it("restarts with independent clean state", () => {
    const changed = inspect(createSowingState(), "prepared-soil");
    const restarted = reduceSowing(changed, { type: "restart" });
    expect(restarted).toEqual(createSowingState());
    expect(restarted.inspected).not.toBe(changed.inspected);
  });
});
