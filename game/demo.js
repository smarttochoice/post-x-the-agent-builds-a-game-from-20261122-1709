// Headless demo runner: plays Orbit Dodge with a simple autopilot and dumps
// every 2nd frame's draw calls as JSON, so the video renderer can paint the
// real game (same engine, same positions, same score) frame by frame.
// Run: node demo.js <seconds> <out.json>   (default 16 video/demo-frames.json)
'use strict';
const fs = require('node:fs');
const { createGame } = require('./engine.js');

const seconds = parseFloat(process.argv[2] || '16');
const outFile = process.argv[3] || 'demo-frames.json';

// Recording context: implements exactly the canvas surface the engine uses,
// logging every draw op with the style in force at the time.
function recordCtx() {
  return {
    ops: [],
    fillStyle: '#000', font: '10px monospace', textAlign: 'left', globalAlpha: 1,
    save() { this.ops.push(['save']); },
    restore() { this.ops.push(['restore']); },
    translate(x, y) { this.ops.push(['tr', x, y]); },
    fillRect(x, y, w, h) { this.ops.push(['rect', x, y, w, h, this.fillStyle, this.globalAlpha]); },
    fillCircle(x, y, r) { this.ops.push(['circle', x, y, r, this.fillStyle, this.globalAlpha]); },
    fillTriangle(x1, y1, x2, y2, x3, y3) { this.ops.push(['tri', x1, y1, x2, y2, x3, y3, this.fillStyle, this.globalAlpha]); },
    fillText(s, x, y) { this.ops.push(['text', String(s), x, y, this.fillStyle, this.font, this.textAlign, this.globalAlpha]); },
    reset() { this.ops.length = 0; },
  };
}

const g = createGame({ seed: 20261122 });
g.start();
const ctx = recordCtx();

const frames = [];
const steps = Math.round(seconds * 60);
let nearMiss = 0;
for (let i = 0; i < steps; i++) {
  // Autopilot: score candidate x positions by danger (rocks closing in
  // above) and reward (lowest star), pick the safest rewarding one.
  let bestX = 270, bestScore = -Infinity;
  let lowestStar = null;
  for (const s of g.stars) if (!lowestStar || s.y > lowestStar.y) lowestStar = s;
  for (const cand of [30, 90, 150, 210, 270, 330, 390, 450, 510]) {
    let sc = 0;
    for (const a of g.asteroids) {
      const dy = g.ship.y - a.y;
      if (dy > -70 && dy < 320) {
        const dx = Math.abs(a.x - cand);
        if (dx < a.r + 26) sc -= (320 - dy) * 2;
        else if (dx < a.r + 70) sc -= (320 - dy) * 0.4;
      }
    }
    if (lowestStar) sc -= Math.abs(lowestStar.x - cand) * 0.15;
    if (Math.abs(cand - g.ship.x) > 200) sc -= 20; // don't flail across the screen
    if (sc > bestScore) { bestScore = sc; bestX = cand; }
  }
  g.input.x = bestX;
  g.update(1 / 60);
  if (i % 2 === 0) {
    ctx.reset();
    g.draw(ctx);
    frames.push(ctx.ops.slice());
  }
  if (g.state !== 'playing') break;
}
fs.writeFileSync(outFile, JSON.stringify(frames));
console.log(JSON.stringify({
  frames: frames.length, fps: 30, state: g.state,
  score: g.score, lives: g.lives, t: +g.t.toFixed(2), nearMiss,
}));
