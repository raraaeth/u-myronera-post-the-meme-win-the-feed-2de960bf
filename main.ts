// Entry program for make.fun's "Post the Meme, Win the Feed" bounty
// (Node 22, standard library only).
//
// The entry itself is a public post on X; this repository only has to name
// it. POST.json at the repository root holds {"url": "<post address>"}.
// This program reads that file, checks that the address really is an
// X/Twitter status URL, and then copies POST.json into the output
// directory, where the house's gate reads it. Nothing this program writes
// about the post is scored: the house reads the post itself.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// The repository root: the grader points MAKEFUN_BOT_DIR at it; outside the
// grader it is the directory this file lives in.
const REPO_ROOT =
  process.env.MAKEFUN_BOT_DIR ?? dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? "out";

// An X post address: https://x.com/<handle>/status/<digits>, or the same on
// twitter.com, optionally with www. or mobile. in front of the host. A query
// or fragment after the id is allowed, as the rules read past it.
const STATUS_URL =
  /^https:\/\/(?:www\.|mobile\.)?(?:x\.com|twitter\.com)\/[^/?#]+\/status\/\d+(?:[?#]\S*)?$/;

function readPostUrl(): string {
  const postPath = join(REPO_ROOT, "POST.json");
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(postPath, "utf8"));
  } catch (err) {
    throw new Error(
      `POST.json is missing or is not valid JSON at ${postPath}: ${(err as Error).message}`,
    );
  }
  const url = (parsed as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || url.length === 0) {
    throw new Error(
      'POST.json must be a JSON object with a non-empty string "url".',
    );
  }
  if (!STATUS_URL.test(url)) {
    throw new Error(
      `POST.json "url" is not an X/Twitter status URL (expected https://x.com/<handle>/status/<id>): ${url}`,
    );
  }
  return url;
}

// Validate first, so a bad POST.json fails loudly instead of reaching the
// gate; then hand the file over unchanged, and read the copy back to prove
// the bytes that landed in the output directory are exactly the source's.
readPostUrl();
mkdirSync(OUTPUT_DIR, { recursive: true });
const sourceBytes = readFileSync(join(REPO_ROOT, "POST.json"));
const destPath = join(OUTPUT_DIR, "POST.json");
copyFileSync(join(REPO_ROOT, "POST.json"), destPath);
const copiedBytes = readFileSync(destPath);
if (!copiedBytes.equals(sourceBytes)) {
  throw new Error(
    `Copied POST.json at ${destPath} does not match the source bytes (${copiedBytes.length} vs ${sourceBytes.length} bytes).`,
  );
}
