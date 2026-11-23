// Headless play-test for Orbit Dodge: drives the real engine through
// title -> playing -> win and title -> playing -> lose, with scripted input.
// Run: node test.js   (exit 0 = all assertions passed)
'use strict';
const { createGame } = require('./engine.js');

let pass = 0;
function check(name, cond) {
  if (!cond) { console.error('FAIL: ' + name); process.exit(1); }
  console.log('ok: ' + name); pass++;
}

// Stub canvas context: records calls, draws nothing.
function stubCtx() {
  const calls = [];
  return new Proxy({}, {
    get(t, k) {
      if (k === '__calls') return calls;
      if (k === 'save' || k === 'restore' || k === 'translate') return () => {};
      if (k === 'fillRect' || k === 'fillCircle' || k === 'fillTriangle' || k === 'fillText')
        return (...a) => { calls.push([k, ...a]); };
      return undefined;
    },
    set() { return true; },
  });
}

// 1. Title screen draws, start() enters play.
let g = createGame({ seed: 7 });
check('starts on title', g.state === 'title');
g.draw(stubCtx());
g.start();
check('start() -> playing', g.state === 'playing');
check('3 lives at start', g.lives === 3);
check('score 0 at start', g.score === 0);

// 2. Ship moves right with input, stays in bounds.
g.input.right = true;
for (let i = 0; i < 120; i++) g.update(1 / 60);
check('ship moved right', g.ship.x > 270);
check('ship inside right bound', g.ship.x <= 540 - 26);
g.input.right = false; g.input.left = true;
for (let i = 0; i < 240; i++) g.update(1 / 60);
check('ship moved left to bound', g.ship.x <= 26 + 1);

// 3. Star pickup scores +10 (place a star on the ship, step once).
g = createGame({ seed: 11 });
g.start();
g.stars.push({ x: g.ship.x, y: g.ship.y, r: 13, vy: 0, ph: 0 });
g.update(1 / 60);
check('star collected: score 10', g.score === 10);

// 4. Asteroid hit costs a life.
g = createGame({ seed: 11 });
g.start();
g.asteroids.push({ x: g.ship.x, y: g.ship.y, r: 20, vy: 0, rot: 0, vr: 0 });
g.update(1 / 60);
check('asteroid hit: lives 2', g.lives === 2);
check('still playing after 1 hit', g.state === 'playing');

// 5. Three hits -> lost.
for (let h = 0; h < 2; h++) {
  g.asteroids.push({ x: g.ship.x, y: g.ship.y, r: 20, vy: 0, rot: 0, vr: 0 });
  g.update(1 / 60);
}
check('three hits -> lost', g.state === 'lost' && g.lives === 0);
g.draw(stubCtx());
check('lost screen draws', true);

// 6. Win by reaching the score (short win target) and win by surviving.
g = createGame({ seed: 3, winScore: 10 });
g.start();
g.stars.push({ x: g.ship.x, y: g.ship.y, r: 13, vy: 0, ph: 0 });
g.update(1 / 60);
check('reaching win score -> won', g.state === 'won');

g = createGame({ seed: 3, gameSeconds: 2, winScore: 100000 });
g.start();
g.input.x = 270; // park mid-screen, autopilot-ish
for (let i = 0; i < 240; i++) g.update(1 / 60);
check('surviving the timer -> won', g.state === 'won');

// 7. A full 60s game runs without errors and spawns objects.
g = createGame({ seed: 42 });
g.start();
let sawAsteroid = false, sawStar = false;
for (let i = 0; i < 60 * 60; i++) {
  // Simple autopilot: drift toward the lowest star, away from close asteroids.
  let tx = 270;
  if (g.stars.length) tx = g.stars[0].x;
  g.input.x = tx;
  g.update(1 / 60);
  if (g.asteroids.length) sawAsteroid = true;
  if (g.stars.length) sawStar = true;
  if (g.state !== 'playing') break;
}
check('60s run spawned asteroids', sawAsteroid);
check('60s run spawned stars', sawStar);
check('60s run ended won or lost', g.state === 'won' || g.state === 'lost');
console.log('final state: ' + g.state + ' score=' + g.score + ' t=' + g.t.toFixed(1) + 's');
g.draw(stubCtx());

console.log('ALL ' + pass + ' CHECKS PASSED');
