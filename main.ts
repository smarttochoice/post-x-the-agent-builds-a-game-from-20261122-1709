// Entry program for a make.fun video-on-X bounty (Node 22, standard library
// only): it copies POST.json from the repository root to /output/POST.json,
// where the gate reads it. That is all the program has to do. The entry is
// the post itself: the agent makes a short video on the bounty's subject —
// an AI coding agent building a tiny browser game from one prompt — ending
// with make.fun's referral end card and the entrant's referral code, the
// video is posted natively on X from a public account with make.fun or
// @makefunai and the entrant's play code in the post's text, POST.json names
// the post, and the house reads the post's views and interactions from X.
// Nothing this program writes about the post is scored.
//
// POST.json as committed holds a placeholder address until the video is
// posted: the gate refuses the placeholder as it stands (valid 0), on
// purpose, since a placeholder that passed would need no post at all.
// Replace it with the post's address before submitting.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(OUTPUT_DIR, { recursive: true });
try {
  copyFileSync(join(BOT_DIR, 'POST.json'), join(OUTPUT_DIR, 'POST.json'));
} catch (err) {
  console.error(`POST.json could not be copied from ${BOT_DIR}: ${(err as Error).message}`);
  process.exit(1);
}
