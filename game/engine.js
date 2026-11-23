// ORBIT DODGE — a tiny browser game, built from one prompt.
// Pure logic: no DOM here, so the same code drives the browser canvas
// and the headless demo/test runners. draw() only calls the small set of
// canvas-2d methods the renderers implement: fillRect, fillCircle (custom),
// fillText, and the fillStyle / font / textAlign properties.
'use strict';

const W = 540, H = 960;
const SHIP_Y = 820;
const WIN_SCORE = 300;
const GAME_SECONDS = 60;

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createGame(opts) {
  opts = opts || {};
  const rand = mulberry32(opts.seed == null ? 1337 : opts.seed);
  const gameSeconds = opts.gameSeconds || GAME_SECONDS;
  const winScore = opts.winScore || WIN_SCORE;

  const g = {
    W, H, state: 'title', // title | playing | won | lost
    t: 0, score: 0, lives: 3,
    ship: { x: W / 2, y: SHIP_Y, vx: 0 },
    asteroids: [], stars: [], parts: [],
    spawnA: 0, spawnS: 0, shake: 0, flash: 0,
    msg: '', msgT: 0,
    input: { left: false, right: false, x: null },
    gameSeconds, winScore,
  };

  function spawnAsteroid() {
    if (g.asteroids.length >= 5) return;
    const r = 16 + rand() * 26;
    let x = 30 + rand() * (W - 60), tries = 0;
    while (tries++ < 8 && g.asteroids.some(a => a.y < 200 && Math.abs(a.x - x) < 110)) {
      x = 30 + rand() * (W - 60);
    }
    g.asteroids.push({
      x, y: -40,
      r, vy: 120 + rand() * 110 + g.t * 1.2, rot: rand() * 6.28, vr: (rand() - 0.5) * 3,
    });
  }
  function spawnStar() {
    g.stars.push({ x: 30 + rand() * (W - 60), y: -30, r: 13, vy: 130 + rand() * 60, ph: rand() * 6.28 });
  }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      const a = rand() * 6.28, sp = 60 + rand() * 220;
      g.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + rand() * 0.4, color, r: 2 + rand() * 4 });
    }
  }
  function hit() {
    g.lives -= 1;
    g.shake = 14; g.flash = 0.35;
    burst(g.ship.x, g.ship.y, '#ff5a5a', 26);
    g.msg = g.lives > 0 ? 'HIT! ' + g.lives + (g.lives === 1 ? ' LIFE LEFT' : ' LIVES LEFT') : '';
    g.msgT = 1.2;
    if (g.lives <= 0) { g.state = 'lost'; }
  }

  g.start = function () {
    g.state = 'playing'; g.t = 0; g.score = 0; g.lives = 3;
    g.asteroids = []; g.stars = []; g.parts = [];
    g.ship.x = W / 2; g.spawnA = 0; g.spawnS = 0; g.msg = 'DODGE! COLLECT STARS!'; g.msgT = 1.6;
  };

  g.update = function (dt) {
    if (g.state !== 'playing') return;
    g.t += dt;
    const left = g.t >= g.gameSeconds;
    if (g.score >= g.winScore) { g.state = 'won'; return; }
    if (left) { g.state = 'won'; return; }

    // Ship: keys move it, pointer drags it.
    const accel = 2600, maxV = 560;
    if (g.input.x != null) {
      g.ship.x += (g.input.x - g.ship.x) * Math.min(1, dt * 14);
      g.ship.vx = 0;
    } else {
      if (g.input.left) g.ship.vx -= accel * dt;
      if (g.input.right) g.ship.vx += accel * dt;
      if (!g.input.left && !g.input.right) g.ship.vx *= Math.max(0, 1 - dt * 8);
      g.ship.vx = Math.max(-maxV, Math.min(maxV, g.ship.vx));
      g.ship.x += g.ship.vx * dt;
    }
    g.ship.x = Math.max(26, Math.min(W - 26, g.ship.x));

    g.spawnA -= dt; g.spawnS -= dt;
    if (g.spawnA <= 0) { spawnAsteroid(); g.spawnA = Math.max(0.7, 1.3 - g.t * 0.008); }
    if (g.spawnS <= 0) { spawnStar(); g.spawnS = 0.9 + rand() * 0.8; }

    for (const a of g.asteroids) { a.y += a.vy * dt; a.rot += a.vr * dt; }
    for (const s of g.stars) { s.y += s.vy * dt; s.ph += dt * 5; }
    g.asteroids = g.asteroids.filter(a => a.y < H + 60);
    g.stars = g.stars.filter(s => s.y < H + 40);

    // Collisions.
    for (let i = g.asteroids.length - 1; i >= 0; i--) {
      const a = g.asteroids[i];
      const dx = a.x - g.ship.x, dy = a.y - g.ship.y;
      if (dx * dx + dy * dy < (a.r + 14) * (a.r + 14)) {
        g.asteroids.splice(i, 1);
        hit();
        if (g.state !== 'playing') return;
      }
    }
    for (let i = g.stars.length - 1; i >= 0; i--) {
      const s = g.stars[i];
      const dx = s.x - g.ship.x, dy = s.y - g.ship.y;
      if (dx * dx + dy * dy < 34 * 34) {
        g.stars.splice(i, 1);
        g.score += 10;
        burst(s.x, s.y, '#ffd23f', 10);
        if (g.score >= g.winScore) { g.state = 'won'; return; }
      }
    }
    for (const p of g.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    g.parts = g.parts.filter(p => p.life > 0);
    if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 40);
    if (g.flash > 0) g.flash -= dt;
    if (g.msgT > 0) g.msgT -= dt;
  };

  g.draw = function (c) {
    const shx = g.shake > 0 ? (Math.random() - 0.5) * g.shake : 0;
    const shy = g.shake > 0 ? (Math.random() - 0.5) * g.shake : 0;
    c.save(); c.translate(shx, shy);
    // Space.
    c.fillStyle = '#0b1026'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 70; i++) {
      const sx = (((i + 1) * 2654435761) >>> 0) % W, sy = (((i + 1001) * 2654435761) >>> 0) % H;
      c.globalAlpha = 0.25 + ((i * 37) % 10) / 16;
      c.fillRect(sx, sy, 2, 2);
    }
    c.globalAlpha = 1;
    // Stars.
    for (const s of g.stars) {
      c.fillStyle = '#ffd23f';
      c.fillCircle(s.x, s.y, s.r);
      c.fillStyle = '#fff3c4';
      c.fillCircle(s.x, s.y, s.r * 0.45);
    }
    // Asteroids: jagged rock circles.
    for (const a of g.asteroids) {
      c.fillStyle = '#8a7f8d';
      c.fillCircle(a.x, a.y, a.r);
      c.fillStyle = '#6b5f6e';
      c.fillCircle(a.x - a.r * 0.3, a.y - a.r * 0.25, a.r * 0.45);
      c.fillStyle = '#a89aa9';
      c.fillCircle(a.x + a.r * 0.35, a.y + a.r * 0.3, a.r * 0.3);
    }
    // Particles.
    for (const p of g.parts) {
      c.globalAlpha = Math.max(0, p.life * 2);
      c.fillStyle = p.color;
      c.fillCircle(p.x, p.y, p.r);
    }
    c.globalAlpha = 1;
    // Ship: a little rocket.
    const x = g.ship.x, y = g.ship.y;
    c.fillStyle = '#ff5a5a';
    c.fillTriangle(x, y - 26, x - 15, y + 14, x + 15, y + 14);
    c.fillStyle = '#e8f4ff';
    c.fillTriangle(x, y - 18, x - 8, y + 12, x + 8, y + 12);
    c.fillStyle = '#ffd23f';
    c.fillCircle(x, y + 20, 5 + Math.sin(g.t * 30) * 2);
    c.restore();

    // HUD.
    c.fillStyle = '#ffffff'; c.font = 'bold 28px monospace'; c.textAlign = 'left';
    c.fillText('SCORE ' + g.score, 18, 44);
    c.textAlign = 'right';
    c.fillText('TIME ' + Math.max(0, Math.ceil(g.gameSeconds - g.t)) + 's', W - 18, 44);
    c.textAlign = 'left';
    c.fillStyle = '#ff5a5a'; c.font = 'bold 28px monospace';
    c.fillText('♥'.repeat(Math.max(0, g.lives)) + '♡'.repeat(Math.max(0, 3 - g.lives)), 18, 82);
    c.fillStyle = '#9aa3ff'; c.font = '20px monospace';
    c.fillText('GOAL ' + g.winScore + ' PTS OR SURVIVE', 18, 116);
    if (g.msgT > 0 && g.msg) {
      c.fillStyle = '#ffd23f'; c.font = 'bold 34px monospace'; c.textAlign = 'center';
      c.fillText(g.msg, W / 2, 300);
      c.textAlign = 'left';
    }
    if (g.flash > 0) {
      c.globalAlpha = g.flash * 0.9; c.fillStyle = '#ff0000'; c.fillRect(0, 0, W, H);
      c.globalAlpha = 1;
    }
    if (g.state === 'title') {
      c.fillStyle = 'rgba(5,8,20,0.72)'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffffff'; c.font = 'bold 64px monospace'; c.textAlign = 'center';
      c.fillText('ORBIT', W / 2, 330);
      c.fillText('DODGE', W / 2, 400);
      c.fillStyle = '#ffd23f'; c.font = 'bold 26px monospace';
      c.fillText('ONE PROMPT. ONE GAME.', W / 2, 470);
      c.fillStyle = '#ffffff'; c.font = '24px monospace';
      c.fillText('Dodge the rocks. Grab the stars.', W / 2, 540);
      c.fillText('Reach 300 pts or survive 60s.', W / 2, 575);
      c.fillStyle = '#9aa3ff'; c.font = 'bold 26px monospace';
      c.fillText('← → / A D  or  drag to fly', W / 2, 660);
      c.fillStyle = '#ffd23f'; c.font = 'bold 32px monospace';
      c.fillText('PRESS SPACE / TAP TO PLAY', W / 2, 740);
      c.textAlign = 'left';
    } else if (g.state === 'won') {
      c.fillStyle = 'rgba(5,20,8,0.72)'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#7dff8a'; c.font = 'bold 64px monospace'; c.textAlign = 'center';
      c.fillText('YOU WIN!', W / 2, 420);
      c.fillStyle = '#ffffff'; c.font = 'bold 30px monospace';
      c.fillText('SCORE ' + g.score, W / 2, 500);
      c.fillStyle = '#ffd23f'; c.font = '26px monospace';
      c.fillText('Built from one prompt.', W / 2, 560);
      c.fillText('Press SPACE to fly again', W / 2, 640);
      c.textAlign = 'left';
    } else if (g.state === 'lost') {
      c.fillStyle = 'rgba(20,5,8,0.72)'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ff5a5a'; c.font = 'bold 64px monospace'; c.textAlign = 'center';
      c.fillText('GAME OVER', W / 2, 420);
      c.fillStyle = '#ffffff'; c.font = 'bold 30px monospace';
      c.fillText('SCORE ' + g.score, W / 2, 500);
      c.fillStyle = '#ffd23f'; c.font = '26px monospace';
      c.fillText('The rocks win this time.', W / 2, 560);
      c.fillText('Press SPACE to retry', W / 2, 640);
      c.textAlign = 'left';
    }
  };

  return g;
}

if (typeof module !== 'undefined') module.exports = { createGame, W, H, WIN_SCORE, GAME_SECONDS };
