import { spawn } from "node:child_process";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { PLOUGHING_STAGES } from "../apps/web/lib/ploughingLesson.ts";
import { profileForSimulation } from "./lib/catalog-narration-profiles.ts";

const slug = "c8-ch01-a01-ploughing-preparation-of-soil";
const profile = profileForSimulation(slug);
const cues = PLOUGHING_STAGES.map((stage) => ({
  id: stage.id,
  text: stage.narration,
  audioUrl: `/narration/ploughing-soil-preparation/${stage.id}.mp3`,
}));

if (process.argv.includes("--list-json")) {
  console.log(JSON.stringify({ slug, profile, cues }));
} else {
  const outputDirectory = resolve(
    "apps/web/public/narration/ploughing-soil-preparation",
  );
  const manifestPath = resolve(outputDirectory, "manifest.json");
  const previous = await readFile(manifestPath, "utf8")
    .then(JSON.parse)
    .catch(() => null);
  const previousCues = new Map(
    (previous?.cues ?? []).map((cue) => [cue.id, cue]),
  );
  const sameProfile = ["voice", "rate", "pitch"].every(
    (key) => previous?.profile?.[key] === profile[key],
  );
  let cursor = 0;

  async function worker() {
    while (cursor < cues.length) {
      const cue = cues[cursor++];
      const output = resolve("apps/web/public", `.${cue.audioUrl}`);
      await mkdir(dirname(output), { recursive: true });
      const unchanged =
        sameProfile && previousCues.get(cue.id)?.text === cue.text;
      if (
        unchanged &&
        (await stat(output)
          .then((file) => file.size > 1024)
          .catch(() => false))
      )
        continue;
      const temporary = `${output}.${process.pid}.tmp`;
      try {
        await new Promise((done, fail) => {
          const child = spawn(
            process.env.NARRATION_PYTHON ?? "python3",
            [
              "-m",
              "edge_tts",
              "--voice",
              profile.voice,
              `--rate=${profile.rate}`,
              `--pitch=${profile.pitch}`,
              "--text",
              cue.text,
              "--write-media",
              temporary,
            ],
            {
              env: {
                ...process.env,
                PYTHONPATH: process.env.NARRATION_PYTHONPATH ?? "",
              },
              stdio: ["ignore", "ignore", "pipe"],
            },
          );
          let error = "";
          child.stderr.on("data", (chunk) => (error += chunk.toString()));
          child.on("error", fail);
          child.on("close", (code) =>
            code === 0
              ? done()
              : fail(new Error(`${cue.id}: ${error || `exit ${code}`}`)),
          );
        });
        if ((await stat(temporary)).size <= 1024)
          throw new Error(`Invalid narration clip: ${cue.id}`);
        await rename(temporary, output);
        console.log(`Recorded ${cue.id} (${profile.label})`);
      } catch (error) {
        await rm(temporary, { force: true });
        throw error;
      }
    }
  }

  await Promise.all(Array.from({ length: 3 }, worker));
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    manifestPath,
    `${JSON.stringify({ slug, profile, cues }, null, 2)}\n`,
  );
  console.log(
    `Ploughing narration: ${cues.length} clips available (${profile.voice})`,
  );
}
