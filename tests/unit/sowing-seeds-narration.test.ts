import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SOWING_STAGES } from "../../apps/web/lib/sowingSeedsLesson";
import { profileForSimulation } from "../../scripts/lib/catalog-narration-profiles";

const slug = "c8-ch01-a02-sowing-of-seeds";
const outputDirectory = resolve("apps/web/public/narration/sowing-of-seeds");
const expectedCues = SOWING_STAGES.map((stage) => ({
  id: stage.id,
  text: stage.narration,
  audioUrl: `/narration/sowing-of-seeds/${stage.id}.mp3`,
}));

describe("sowing of seeds packaged narration", () => {
  it("uses the exact lesson text and selected Neerja profile", () => {
    const plan = JSON.parse(
      execFileSync(
        process.execPath,
        ["--import", "tsx", "scripts/generate-sowing-narration.mjs", "--list-json"],
        { encoding: "utf8" },
      ),
    );

    expect(plan.slug).toBe(slug);
    expect(plan.cues).toEqual(expectedCues);
    expect(plan.profile).toEqual(profileForSimulation(slug));
    expect(plan.profile.voice).toBe("en-IN-NeerjaExpressiveNeural");
  });

  it("packages one valid MP3 larger than 1 KiB for every scene", () => {
    for (const cue of expectedCues) {
      const path = resolve("apps/web/public", `.${cue.audioUrl}`);
      expect(existsSync(path), cue.id).toBe(true);
      expect(statSync(path).size, cue.id).toBeGreaterThan(1024);
      const header = readFileSync(path).subarray(0, 3);
      const hasMp3Header =
        header.toString() === "ID3" ||
        (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
      expect(hasMp3Header, `${cue.id} should be MP3 audio`).toBe(true);
    }

    expect(
      readdirSync(outputDirectory)
        .filter((name) => name.endsWith(".mp3"))
        .sort(),
    ).toEqual(expectedCues.map((cue) => `${cue.id}.mp3`).sort());
  });

  it("keeps the manifest synchronized with the authored lesson", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(outputDirectory, "manifest.json"), "utf8"),
    );
    expect(manifest.slug).toBe(slug);
    expect(manifest.cues).toEqual(expectedCues);
    expect(manifest.profile).toEqual(profileForSimulation(slug));
  });
});
