#!/usr/bin/env node
/*
  Downloads three furniture / interior / workshop videos from Pexels into ../videos
    hero.mp4      home page hero background (short, silent loop)
    workshop.mp4  home page "See how we build"
    projects.mp4  gallery page "Project video"

  1. Get a free API key: https://www.pexels.com/api/
  2. From the vanyra-website folder run (needs Node 18 or newer):

       node scripts/fetch-pexels-videos.mjs YOUR_API_KEY

  Options
    --pick=2     use the 2nd best match instead of the 1st (try 1, 2, 3 ... until you like the clips)
    --only=hero  fetch just one of: hero, workshop, projects
    --list       only print the matches with their Pexels page links, download nothing

  Existing files are kept unless you add --force.
  The script also writes videos/ATTRIBUTION.txt (credit to the video makers).
*/
import { mkdir, writeFile, access, appendFile, unlink } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API = process.env.PEXELS_API_BASE || "https://api.pexels.com";
const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "videos");

const args = process.argv.slice(2);
const flag = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split("=")[1];
const KEY = args.find((a) => !a.startsWith("--")) || process.env.PEXELS_API_KEY;
const PICK = Math.max(1, parseInt(flag("pick") || "1", 10)) - 1;
const ONLY = flag("only");
const LIST = args.includes("--list");
const FORCE = args.includes("--force");
const MAX_MB = 45; // skip clips bigger than this so the site stays fast

const JOBS = [
  { name: "hero", file: "hero.mp4", maxWidth: 1920, minSec: 8, maxSec: 30,
    queries: ["modern living room interior", "luxury interior design", "minimal home interior"] },
  { name: "workshop", file: "workshop.mp4", maxWidth: 1280, minSec: 10, maxSec: 60,
    queries: ["carpenter woodworking workshop", "furniture making craftsman", "woodworking"] },
  { name: "projects", file: "projects.mp4", maxWidth: 1280, minSec: 10, maxSec: 60,
    queries: ["modern apartment interior", "furniture showroom", "interior design home"] },
];

if (!KEY) {
  console.error("Missing API key.\nUsage: node scripts/fetch-pexels-videos.mjs YOUR_PEXELS_API_KEY");
  process.exit(1);
}

const fail = (e) => { console.error("\nError: " + (e && e.message ? e.message : e)); process.exit(1); };
process.on("uncaughtException", fail);
process.on("unhandledRejection", fail);

const exists = (p) => access(p).then(() => true, () => false);

async function search(query) {
  const url = `${API}/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=20`;
  const res = await fetch(url, { headers: { Authorization: KEY } });
  if (res.status === 401 || res.status === 403) throw new Error("Pexels rejected the API key (check it was copied fully).");
  if (!res.ok) throw new Error(`Pexels search failed: HTTP ${res.status}`);
  return (await res.json()).videos || [];
}

// Choose the best mp4 file for a video: biggest width that is still <= maxWidth
function bestFile(video, maxWidth) {
  const mp4 = (video.video_files || []).filter((f) => f.file_type === "video/mp4" && f.width && f.link);
  const fit = mp4.filter((f) => f.width <= maxWidth && f.width >= 1280).sort((a, b) => b.width - a.width);
  if (fit.length) return fit[0];
  return mp4.filter((f) => f.width <= maxWidth).sort((a, b) => b.width - a.width)[0] || null;
}

async function candidates(job) {
  const seen = new Set();
  const out = [];
  for (const q of job.queries) {
    for (const v of await search(q)) {
      if (seen.has(v.id)) continue;
      seen.add(v.id);
      if (v.duration < job.minSec || v.duration > job.maxSec) continue;
      const f = bestFile(v, job.maxWidth);
      if (f) out.push({ video: v, file: f });
    }
  }
  return out;
}

async function download(link, dest) {
  const res = await fetch(link);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const mb = Number(res.headers.get("content-length") || 0) / 1048576;
  if (mb > MAX_MB) { await res.body?.cancel(); return { skipped: `${mb.toFixed(0)} MB is over the ${MAX_MB} MB limit` }; }
  try {
    await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
  } catch (e) { await unlink(dest).catch(() => {}); throw e; }
  return { mb };
}

await mkdir(outDir, { recursive: true });
let credits = "";

for (const job of JOBS) {
  if (ONLY && ONLY !== job.name) continue;
  const dest = path.join(outDir, job.file);
  if (!LIST && !FORCE && (await exists(dest))) { console.log(`- ${job.file}: already there (use --force to replace)`); continue; }

  console.log(`\n${job.file}`);
  const list = await candidates(job);
  if (!list.length) { console.log("  no suitable clips found, try another --pick or edit the queries in this script"); continue; }

  if (LIST) {
    list.slice(0, 8).forEach((c, i) =>
      console.log(`  ${i + 1}. ${c.video.duration}s ${c.file.width}x${c.file.height}  ${c.video.url}  (by ${c.video.user?.name})`));
    continue;
  }

  let done = false;
  for (const c of list.slice(PICK)) {
    process.stdout.write(`  trying ${c.video.url} ... `);
    try {
      const r = await download(c.file.link, dest);
      if (r.skipped) { console.log(`skipped (${r.skipped})`); continue; }
      console.log(`saved ${r.mb.toFixed(1)} MB`);
      credits += `${job.file}\r\nVideo by ${c.video.user?.name || "Pexels contributor"}: ${c.video.url}\r\n\r\n`;
      done = true;
      break;
    } catch (e) { console.log(`failed (${e.message})`); }
  }
  if (!done) console.log("  could not download a clip for this slot");
}

if (credits) {
  await appendFile(path.join(outDir, "ATTRIBUTION.txt"), "Videos downloaded from Pexels.\r\n\r\n" + credits);
  console.log("\nDone. Credits written to videos/ATTRIBUTION.txt");
}
