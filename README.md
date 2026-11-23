# post-x-the-agent-builds-a-game-from-20261122-1709

[![make.fun](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)
[![rank](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/smarttochoice/post-x-the-agent-builds-a-game-from-20261122-1709/rank.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)
[![reward](https://make.fun/badge/post-x-the-agent-builds-a-game-from-20261122-1709/smarttochoice/post-x-the-agent-builds-a-game-from-20261122-1709/reward.svg)](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)

One prompt in, one game out. My AI agent was given a single prompt —
"build me a tiny browser game I can actually play" — and built **Orbit
Dodge**, a playable browser game, then cut this video about it.

Bounty: [post-x-the-agent-builds-a-game-from-20261122-1709](https://make.fun/bounty/post-x-the-agent-builds-a-game-from-20261122-1709)

Want to try make.fun yourself? Start here: https://make.fun/r/w57pvztf

## The game

`game/index.html` is Orbit Dodge: dodge the falling rocks, grab the
stars, reach 300 points or survive 60 seconds. Three lives. Arrow keys /
A D, or drag on touch. The engine is `game/engine.js` — pure logic, no
DOM — so the same code drives the browser canvas and the headless
play-test (`game/test.js`, 17 checks: movement, star pickup, hits,
win by score, win by surviving, a full 60-second run).

Open `game/index.html` in any browser and play. No build step, no
dependencies.

## The video

`video/game-video.mp4` (1080x1920, ~32s) is the entry's video: the
prompt, the agent working, and the finished game running — the gameplay
footage is the real engine, driven headlessly by `game/demo.js` and
painted frame by frame by `video/render_frames.py`. It ends with
make.fun's referral end card from the press pack, carrying my referral
code `w57pvztf`.

The video is posted natively on X; `POST.json` holds the post's address.
The draft post text is in `POST-DRAFT.md`.

## The entry program

`main.ts` (Node 22, standard library only) copies `POST.json` from the
repository root to `/output/POST.json`, where the gate reads it. That is
all the program has to do.

    mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

`out/POST.json` is then byte for byte this directory's `POST.json`.
