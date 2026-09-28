import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { questFaceButtonAction } from "../../apps/web/components/simulations/questVrControls";
import { WOOL_PROCESSING_STAGES } from "../../apps/web/lib/woolProcessingLesson";
import { getSimulationViewer } from "../../apps/web/lib/simulations/viewerRegistry";

const viewerPath = resolve(
  process.cwd(),
  "apps/web/components/simulations/WoolProcessingViewer.tsx",
);
const viewerSource = readFileSync(viewerPath, "utf8");
const questControlsSource = readFileSync(
  resolve(process.cwd(), "apps/web/components/simulations/questVrControls.ts"),
  "utf8",
);

function sourceBetween(start: string, end: string) {
  const startIndex = viewerSource.indexOf(start);
  const endIndex = viewerSource.indexOf(end, startIndex);
  expect(startIndex, start).toBeGreaterThanOrEqual(0);
  expect(endIndex, end).toBeGreaterThan(startIndex);
  return viewerSource.slice(startIndex, endIndex);
}

describe("wool processing viewer integration", () => {
  it("binds the canonical viewer key to the dedicated component", async () => {
    const registration = getSimulationViewer("wool-processing");

    expect(registration.sourcePath).toBe(
      "apps/web/components/simulations/WoolProcessingViewer.tsx",
    );
    const registeredModule = await registration.load();
    const directModule =
      await import("../../apps/web/components/simulations/WoolProcessingViewer");
    expect(registeredModule.default).toBe(directModule.default);
  });

  it("keeps orbit, pan, Quest locomotion, B-button exit and active-session cleanup wired", () => {
    expect(viewerSource).toContain(
      "createGuidedCamera(camera, renderer.domElement",
    );
    expect(viewerSource).toContain("guided.controls.enablePan = true");
    expect(viewerSource).toContain("else guided.update(delta)");
    expect(viewerSource).toContain("createQuestVrControls({");
    expect(viewerSource).toContain(
      "if (renderer.xr.isPresenting) quest.update()",
    );
    expect(viewerSource).toContain("movementBounds: new THREE.Box2(");
    expect(questControlsSource).toContain(
      "rig.position.addScaledVector(forward",
    );
    expect(questControlsSource).toContain("rig.position.addScaledVector(right");

    expect(questFaceButtonAction("right", 5)).toBe("exit");
    expect(questFaceButtonAction("right", 6)).toBe("exit");
    expect(questFaceButtonAction("left", 5)).toBe("back");
    expect(viewerSource).toContain("B: Exit VR");
    expect(viewerSource).toContain("void renderer.xr.getSession()?.end()");

    expect(viewerSource).toContain("rendererRef.current !== renderer");
    expect(viewerSource).toContain("!renderer.domElement.isConnected");
    expect(viewerSource).toContain("await session.end()");
    expect(viewerSource).toContain("quest.dispose()");
    expect(viewerSource).toMatch(
      /renderer\.xr\s*\.getSession\(\)\s*\?\.end\(\)\s*\.catch/,
    );
  });

  it("uses uninterrupted Web Audio narration with a real clip for every stage", () => {
    expect(viewerSource).toContain("createPloughingAudio");
    expect(viewerSource).toContain("void audioRef.current?.unlock()");
    expect(viewerSource).toContain(
      "audioRef.current?.enqueue([cueFor(current.id)], true)",
    );
    expect(viewerSource).toContain(
      "audioRef.current?.enqueue([cueFor(nextStage.id)], true)",
    );
    expect(viewerSource).toContain(
      "audioUrl: `/narration/wool-processing/${stage}.mp3`",
    );

    expect(WOOL_PROCESSING_STAGES).toHaveLength(10);
    for (const stage of WOOL_PROCESSING_STAGES) {
      const audioPath = resolve(
        process.cwd(),
        `apps/web/public/narration/wool-processing/${stage.id}.mp3`,
      );
      expect(existsSync(audioPath), stage.id).toBe(true);
      expect(statSync(audioPath).size, stage.id).toBeGreaterThan(1_000);
    }
  });

  it("exposes all ten stage IDs and their browser interaction contracts", () => {
    for (const stage of WOOL_PROCESSING_STAGES) {
      expect(viewerSource, stage.id).toContain(`${stage.id}:`);
    }

    for (const actionType of [
      "inspect",
      "choose-season",
      "prepare",
      "shear-pass",
      "answer-fleece",
      "test-container",
      "choose-container",
      "scour",
      "sequence",
      "quiz",
      "next",
      "restart",
    ]) {
      expect(viewerSource, actionType).toContain(`type: \"${actionType}\"`);
    }
  });

  it("lets an immersive learner complete every evidence gate without the hidden browser panel", () => {
    const activateTargetSource = sourceBetween(
      "const activateTarget = useCallback(",
      "  useEffect(() => {",
    );

    // Browser buttons are not visible inside a normal immersive-vr session, so
    // every gated lesson action must also be reachable from a raycast target.
    expect(activateTargetSource).toContain('type: "choose-season"');
    expect(activateTargetSource).toContain('type: "prepare"');
    expect(activateTargetSource).toContain('type: "shear-pass"');
    expect(activateTargetSource).toContain('type: "answer-fleece"');
    expect(activateTargetSource).toContain('type: "test-container"');
    expect(activateTargetSource).toContain('type: "choose-container"');
    expect(activateTargetSource).toContain('type: "scour"');
    expect(activateTargetSource).toContain('type: "sequence"');
    expect(activateTargetSource).toContain('type: "quiz"');
    expect(activateTargetSource).toContain('type: "inspect"');
  });

  it("does not rebuild the renderer when the learner changes shearing controls", () => {
    // The renderer-owning effect must remain stable while angle/speed changes;
    // otherwise React cleanup ends an active session and disposes narration.
    const activateTargetSource = sourceBetween(
      "const activateTarget = useCallback(",
      "  useEffect(() => {",
    );
    expect(activateTargetSource).toContain("angle: shearAngleRef.current");
    expect(activateTargetSource).toContain("speed: shearSpeedRef.current");
    expect(activateTargetSource).not.toContain("[shearAngle, shearSpeed]");
  });
});
