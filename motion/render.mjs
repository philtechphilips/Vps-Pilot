// Renders every clip in both themes into ../public/motion:
//   <clip>-<theme>.webm  VP9, for browsers that play it
//   <clip>-<theme>.mp4   H.264 fallback (older Safari)
//   <clip>-<theme>.webp  the final frame, shown when motion is reduced
//
// usage: node render.mjs [clip ...]   (default: all clips)
// Needs Node 22+ and FFmpeg with libvpx-vp9, libx264 and libwebp.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const HYPERFRAMES = "hyperframes@0.8.185";
const CLIPS = ["hero", "deploy", "monitor", "databases", "security"];
const THEMES = ["light", "dark"];
const FPS = 60;

const here = resolve(import.meta.dirname);
const out = resolve(here, "../public/motion");
const work = mkdtempSync(join(tmpdir(), "vpspilot-motion-"));
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: "1" };
delete env.GEMINI_API_KEY; // snapshot/check would send frames to Gemini for review

const run = (cmd, args) => execFileSync(cmd, args, { cwd: here, env, stdio: ["ignore", "inherit", "inherit"] });
const ffmpeg = (args) => run("ffmpeg", ["-v", "error", "-y", ...args]);

mkdirSync(out, { recursive: true });
const clips = process.argv.length > 2 ? process.argv.slice(2) : CLIPS;
try {
  for (const clip of clips) {
    for (const theme of THEMES) {
      const name = `${clip}-${theme}`;
      const master = join(work, `${name}.mp4`);
      console.log(`\n▸ ${name}`);
      // A near-lossless master; the web files are encoded from it below.
      run("npx", ["--yes", HYPERFRAMES, "render", clip, "--fps", String(FPS), "--format", "mp4", "--crf", "12", "--quiet", "--variables", JSON.stringify({ theme }), "-o", master]);
      ffmpeg(["-i", master, "-an", "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-row-mt", "1", "-deadline", "good", "-cpu-used", "2", join(out, `${name}.webm`)]);
      ffmpeg(["-i", master, "-an", "-c:v", "libx264", "-crf", "25", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(out, `${name}.mp4`)]);
      ffmpeg(["-sseof", "-0.05", "-i", master, "-frames:v", "1", "-c:v", "libwebp", "-quality", "88", join(out, `${name}.webp`)]);
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
console.log(`\nDone: ${out}`);
