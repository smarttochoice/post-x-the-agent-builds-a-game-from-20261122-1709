# Your job, in one page

You are entering a make.fun bounty for a short video on X: make a short
video on the subject this bounty's rules name, get it posted natively on X
as a video from a public account with make.fun or `@makefunai` and your play
code in the post's text, and hand in the post's address. Places go by the
post's score, its views plus 10 times its likes, reposts, quotes and
replies, the highest first.

Subject (from the kit's `RULES.txt`): an AI coding agent building a tiny
browser game from one prompt while you watch. Brief: show the prompt, the
agent working, and the finished game in one short clip. Keep it moving,
show the real result, and end on the game running with the call to come
build on make.fun.

## Creative decision (made in the session that built this entry)

Hook first, because the first seconds decide whether a viewer stays:
"ONE PROMPT. ONE GAME. ZERO CODE TYPED BY HAND." Then the actual prompt
being typed, the agent working in a terminal (reading, writing, testing —
17 checks passed), then the finished game running for real: Orbit Dodge,
a playable browser game the agent wrote from that one prompt, shown
mid-game with the score climbing. It ends with make.fun's referral end
card from the press pack, carrying referral code `w57pvztf`. Vertical
9:16, ~32 seconds.

## How the video was made (in the recorded session)

- The game is `game/index.html` + `game/engine.js`, written in the
  session. `game/test.js` play-tests it headlessly (17 checks pass);
  `game/demo.js` plays it with an autopilot and dumps every frame's draw
  calls, so the gameplay in the video is the real engine, not a mock-up.
- `video/render_frames.py` paints all 780 frames with PIL: hook cards,
  the typed prompt, the terminal, and the gameplay frames from
  `demo-frames.json`. `video/make_video.sh` encodes them with ffmpeg and
  lays make.fun's 9:16 referral end card (fetched from
  https://make.fun/press/manifest.json, sha256-verified against the
  manifest) over the last 2.5 seconds, with the referral code typed into
  its field.
- The video is handed to the person to post as it is (the agent never
  posts to X and never picks an account). The draft post text is in
  `POST-DRAFT.md`; after posting, replace the placeholder in `POST.json`
  with the post's address.

## The post

- Post the rendered file `video/game-video.mp4` natively on X, from a
  public account, at or after the opening (2026-11-22T17:09:00Z) and
  before the deadline (entries close 2026-11-24T17:19:00Z).
- Post text: the draft in `POST-DRAFT.md`, which carries the required
  line word for word and play code `makefun-vest-pier-cushion`.
- Keep the post up and the account public until the results are out.

## The program

`main.ts` copies `POST.json` to `/output/POST.json` and prints nothing on
success:

    mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
