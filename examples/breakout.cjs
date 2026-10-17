'use strict';

// Run: node examples/breakout.cjs
// Capture: SFML_DEMO_SNAPSHOT=assets/breakout.png \
//   node examples/breakout.cjs --autoplay --frames=900
// Physics checks (no window): node examples/breakout.cjs --self-test

const WIDTH = 1200;
const HEIGHT = 760;
const FIELD = { left: 38, right: 902, top: 166, bottom: 686 };
const STEP = 1 / 120;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function createGame() {
  const game = {
    phase: 'ready', score: 0, best: 0, lives: 3, remaining: 60,
    time: 0, hits: 0, trail: [], particles: [], flashes: [],
    paddle: { x: 406, y: 644, w: 128, h: 14 },
    ball: { x: 470, y: 632, r: 8, vx: 0, vy: 0 },
    bricks: [],
  };
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 10; col++) {
      game.bricks.push({ x: 58 + col * 83, y: 222 + row * 35,
        w: 77, h: 27, row, points: (6 - row) * 10, alive: true });
    }
  }
  return game;
}

function startGame(game) {
  if (game.phase === 'playing') return;
  if (game.phase === 'paused') {
    game.phase = 'playing';
    return;
  }
  if (game.phase === 'won' || game.phase === 'lost') {
    const best = game.best;
    Object.assign(game, createGame(), { best });
  }
  game.phase = 'playing';
  game.ball.vx = game.lives === 2 ? -190 : 190;
  game.ball.vy = -420;
}

function burst(game, x, y, row, count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = i / count * Math.PI * 2 + game.time;
    const speed = 70 + (i % 4) * 37;
    game.particles.push({ x, y, row, vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed, life: 0.55, maxLife: 0.55 });
  }
}

// Resolve a circle against an AABB, including corner and embedded contacts.
function hitBrick(ball, brick) {
  let dx = ball.x - clamp(ball.x, brick.x, brick.x + brick.w);
  let dy = ball.y - clamp(ball.y, brick.y, brick.y + brick.h);
  let distance = Math.hypot(dx, dy);
  if (distance > ball.r) return false;
  let penetration = ball.r - distance;
  if (distance === 0) {
    const faces = [
      [ ball.x - brick.x, -1, 0 ],
      [ brick.x + brick.w - ball.x, 1, 0 ],
      [ ball.y - brick.y, 0, -1 ],
      [ brick.y + brick.h - ball.y, 0, 1 ],
    ].sort((a, b) => a[0] - b[0]);
    [ penetration, dx, dy ] = faces[0];
    penetration += ball.r;
    distance = 1;
  }
  const nx = dx / distance;
  const ny = dy / distance;
  ball.x += nx * (penetration + 0.01);
  ball.y += ny * (penetration + 0.01);
  const dot = ball.vx * nx + ball.vy * ny;
  if (dot >= 0) return false;
  ball.vx -= 2 * dot * nx;
  ball.vy -= 2 * dot * ny;
  return true;
}

function stepGame(game, dt, input = {}) {
  if ([ 'paused', 'won', 'lost' ].includes(game.phase)) return;
  game.time += dt;
  const { ball, paddle } = game;
  const move = input.target === undefined
    ? (input.direction || 0) * 760 * dt
    : clamp(input.target - (paddle.x + paddle.w / 2), -760 * dt, 760 * dt);
  paddle.x = clamp(paddle.x + move, FIELD.left, FIELD.right - paddle.w);
  game.particles = game.particles.filter(particle => {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 160 * dt;
    return particle.life > 0;
  });
  game.flashes = game.flashes.filter(flash => {
    flash.life -= dt;
    return flash.life > 0;
  });
  game.trail = game.trail.filter(mark => game.time - mark.time < 0.2);
  if (game.phase === 'ready') {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 4;
    return;
  }

  const oldY = ball.y;
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  if (ball.x - ball.r < FIELD.left) {
    ball.x = FIELD.left + ball.r;
    ball.vx = Math.abs(ball.vx);
  } else if (ball.x + ball.r > FIELD.right) {
    ball.x = FIELD.right - ball.r;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y - ball.r < FIELD.top) {
    ball.y = FIELD.top + ball.r;
    ball.vy = Math.abs(ball.vy);
  }
  if (ball.vy > 0 && oldY + ball.r <= paddle.y &&
      ball.y + ball.r >= paddle.y &&
      ball.x + ball.r >= paddle.x && ball.x - ball.r <= paddle.x + paddle.w) {
    ball.y = paddle.y - ball.r - 0.01;
    const offset = clamp((ball.x - paddle.x - paddle.w / 2) /
      (paddle.w / 2), -1, 1);
    const speed = Math.min(760, 465 + (60 - game.remaining) * 5);
    ball.vx = Math.sin(offset * Math.PI / 3) * speed;
    if (Math.abs(ball.vx) < 80) ball.vx = (offset < 0 ? -1 : 1) * 80;
    ball.vy = -Math.sqrt(speed * speed - ball.vx * ball.vx);
    game.hits++;
    burst(game, ball.x, paddle.y, 5, 8);
  }
  for (const brick of game.bricks) {
    if (!brick.alive || !hitBrick(ball, brick)) continue;
    brick.alive = false;
    game.remaining--;
    game.score += brick.points;
    game.best = Math.max(game.best, game.score);
    burst(game, ball.x, ball.y, brick.row);
    game.flashes.push({ x: brick.x, y: brick.y, points: brick.points,
      row: brick.row, life: 0.65 });
    if (game.remaining === 0) game.phase = 'won';
    break;
  }
  if (ball.y - ball.r > FIELD.bottom) {
    game.lives--;
    game.phase = game.lives ? 'ready' : 'lost';
    game.trail = [];
    ball.vx = 0;
    ball.vy = 0;
    ball.x = paddle.x + paddle.w / 2;
    ball.y = paddle.y - ball.r - 4;
  }
  const last = game.trail[game.trail.length - 1];
  if (!last || game.time - last.time >= 1 / 120) {
    game.trail.push({ x: ball.x, y: ball.y, time: game.time });
  }
}

// Aim at the predicted landing point, reflecting the path at the side walls.
// This moves only the in-game paddle; it never reads or moves the OS mouse.
function autoplayInput(game) {
  const { ball, paddle } = game;
  let x = ball.x;
  if (ball.vy > 0) {
    const time = Math.max(0, (paddle.y - ball.r - ball.y) / ball.vy);
    const span = FIELD.right - FIELD.left - ball.r * 2;
    const projected = x - FIELD.left - ball.r + ball.vx * time;
    const wrapped = ((projected % (2 * span)) + 2 * span) % (2 * span);
    x = FIELD.left + ball.r + (wrapped > span ? 2 * span - wrapped : wrapped);
  }
  const aim = Math.sin(game.hits * 2.4 + 0.5) * paddle.w * 0.32;
  return { target: x - aim };
}

function parseOptions(args) {
  const options = { frames: Infinity, autoplay: false, selfTest: false };
  for (const arg of args) {
    if (arg === '--autoplay') options.autoplay = true;
    else if (arg === '--self-test') options.selfTest = true;
    else if (arg.startsWith('--frames=')) {
      options.frames = Number(arg.slice(9));
      if (!Number.isSafeInteger(options.frames) || options.frames <= 0) {
        throw new RangeError('--frames must be a positive integer');
      }
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }
  return options;
}

function selfTest() {
  const assert = require('node:assert/strict');
  let checks = 0;
  function check(name, test) {
    test();
    checks++;
    console.log(`PASS ${name}`);
  }
  function playing() {
    const game = createGame();
    startGame(game);
    return game;
  }

  check('Space launches a fresh board', () => {
    const game = createGame();
    assert.equal(game.phase, 'ready');
    startGame(game);
    assert.equal(game.phase, 'playing');
    assert.ok(game.ball.vy < 0);
    assert.equal(game.bricks.filter(brick => brick.alive).length, 60);
  });
  check('left and right input move and clamp the paddle', () => {
    const game = createGame();
    const initial = game.paddle.x;
    stepGame(game, STEP, { direction: -1 });
    assert.ok(game.paddle.x < initial);
    for (let i = 0; i < 400; i++) {
      stepGame(game, STEP, { direction: 1 });
    }
    assert.equal(game.paddle.x + game.paddle.w, FIELD.right);
    assert.equal(game.ball.x, game.paddle.x + game.paddle.w / 2);
  });
  check('walls reflect without leaving the field', () => {
    for (const side of [ 'left', 'right' ]) {
      const game = playing();
      Object.assign(game.ball, { x: FIELD[side], y: 480,
        vx: side === 'left' ? -300 : 300, vy: -100 });
      stepGame(game, STEP);
      assert.ok(side === 'left' ? game.ball.vx > 0 : game.ball.vx < 0);
      assert.ok(game.ball.x >= FIELD.left + game.ball.r);
      assert.ok(game.ball.x <= FIELD.right - game.ball.r);
    }
    const game = playing();
    Object.assign(game.ball, { x: 450, y: FIELD.top, vx: 100, vy: -400 });
    stepGame(game, STEP);
    assert.ok(game.ball.vy > 0);
  });
  check('paddle rebounds upward and steers from the impact position', () => {
    for (const offset of [ -40, 40 ]) {
      const game = playing();
      Object.assign(game.ball, {
        x: game.paddle.x + game.paddle.w / 2 + offset,
        y: game.paddle.y - game.ball.r - 1, vx: 0, vy: 600,
      });
      stepGame(game, STEP);
      assert.ok(game.ball.vy < 0);
      assert.equal(Math.sign(game.ball.vx), Math.sign(offset));
      assert.equal(game.hits, 1);
    }
  });
  check('a brick impact removes one brick and awards its points once', () => {
    const game = playing();
    const brick = game.bricks[50];
    Object.assign(game.ball, { x: brick.x + brick.w / 2,
      y: brick.y + brick.h + game.ball.r + 1, vx: 0, vy: -600 });
    stepGame(game, STEP);
    assert.equal(brick.alive, false);
    assert.equal(game.score, 10);
    assert.equal(game.remaining, 59);
    assert.ok(game.ball.vy > 0);
    stepGame(game, STEP);
    assert.equal(game.score, 10);
  });
  check('a side impact reflects horizontally', () => {
    const game = playing();
    game.bricks.forEach((brick, index) => { brick.alive = index === 22; });
    game.remaining = 1;
    const brick = game.bricks[22];
    Object.assign(game.ball, { x: brick.x - game.ball.r - 1,
      y: brick.y + brick.h / 2, vx: 600, vy: 0 });
    stepGame(game, STEP);
    assert.ok(game.ball.vx < 0);
    assert.equal(game.phase, 'won');
  });
  check('missing costs a life; exhausting lives loses; Space restarts', () => {
    const game = playing();
    for (let lives = 2; lives >= 0; lives--) {
      game.ball.y = FIELD.bottom + game.ball.r + 1;
      game.ball.vy = 500;
      stepGame(game, STEP);
      assert.equal(game.lives, lives);
      assert.equal(game.phase, lives ? 'ready' : 'lost');
      if (lives) startGame(game);
    }
    startGame(game);
    assert.equal(game.phase, 'playing');
    assert.equal(game.score, 0);
    assert.equal(game.lives, 3);
    assert.equal(game.remaining, 60);
  });
  check('paused games do not advance the ball', () => {
    const game = playing();
    game.phase = 'paused';
    const before = { ...game.ball };
    stepGame(game, STEP, { direction: 1 });
    assert.deepEqual(game.ball, before);
    startGame(game);
    assert.equal(game.phase, 'playing');
  });
  check('autoplay clears the real board through collisions', () => {
    const game = playing();
    for (let i = 0; i < 120 * 600 && game.phase === 'playing'; i++) {
      stepGame(game, STEP, autoplayInput(game));
      assert.ok(Number.isFinite(game.ball.x + game.ball.y));
    }
    assert.equal(game.phase, 'won');
    assert.equal(game.remaining, 0);
    assert.equal(game.score, 2100);
    assert.ok(game.hits > 0);
  });
  check('capture arguments reject unbounded or malformed frame counts', () => {
    assert.equal(parseOptions([ '--frames=3', '--autoplay' ]).frames, 3);
    for (const value of [ '0', '-1', '1.5', 'Infinity', '', 'nope' ]) {
      assert.throws(() => parseOptions([ `--frames=${value}` ]), /frames/);
    }
    assert.throws(() => parseOptions([ '--unknown' ]), /Unknown/);
  });
  console.log(`${checks} Breakout checks passed.`);
}

function createRenderer(sf, window) {
  const { label } = require('./bitmap-label.cjs');
  const vector = (x, y) => new sf.Vector2f(x, y);
  const color = (r, g, b, a = 255) => new sf.Color(r, g, b, a);
  const palette = {
    background: color(11, 20, 22), panel: color(18, 31, 33),
    edge: color(37, 60, 61), white: color(236, 246, 229),
    muted: color(132, 163, 158), mint: color(137, 241, 191),
    bricks: [
      color(244, 126, 108), color(246, 158, 111), color(245, 195, 117),
      color(209, 217, 139), color(146, 221, 171), color(101, 207, 177),
    ],
  };
  const alpha = (value, opacity) =>
    color(value.r, value.g, value.b, Math.round(clamp(opacity, 0, 1) * 255));
  const rectangle = new sf.RectangleShape(vector(1, 1));
  const circle = new sf.CircleShape({ radius: 1, pointCount: 32 });
  let previousLabels = new Map();
  let nextLabels;

  function box(x, y, width, height, fill) {
    rectangle.setPosition(vector(x, y));
    rectangle.setScale(vector(width, height));
    rectangle.setFillColor(fill);
    window.draw(rectangle);
  }
  function disc(x, y, radius, fill) {
    circle.setPosition(vector(x - radius, y - radius));
    circle.setScale(vector(radius, radius));
    circle.setFillColor(fill);
    window.draw(circle);
  }
  function pill(x, y, width, height, fill) {
    box(x + height / 2, y, width - height, height, fill);
    disc(x + height / 2, y + height / 2, height / 2, fill);
    disc(x + width - height / 2, y + height / 2, height / 2, fill);
  }
  function text(value, x, y, scale = 2, fill = palette.white) {
    const key = `${value}/${x}/${y}/${scale}/${fill.toInteger()}`;
    const sprite = previousLabels.get(key) || label(value, x, y, scale, fill);
    nextLabels.set(key, sprite);
    window.draw(sprite);
  }

  const field = new sf.VertexArray(sf.PrimitiveType.TriangleStrip, 4);
  for (const [ index, x, y, fill ] of [
    [ 0, 38, 166, color(16, 30, 32) ], [ 1, 902, 166, color(17, 33, 34) ],
    [ 2, 38, 686, color(20, 40, 40) ], [ 3, 902, 686, color(16, 30, 34) ],
  ]) {
    const vertex = field.getVertex(index);
    vertex.position = vector(x, y);
    vertex.color = fill;
  }
  const dots = new sf.VertexArray(sf.PrimitiveType.Points, 28 * 17);
  for (let row = 0; row < 17; row++) {
    for (let col = 0; col < 28; col++) {
      const vertex = dots.getVertex(row * 28 + col);
      vertex.position = vector(54 + col * 31, 183 + row * 30);
      vertex.color = color(46, 70, 69);
    }
  }

  return game => {
    nextLabels = new Map();
    window.clear(palette.background);
    box(38, 39, 6, 49, palette.mint);
    text('BREAKOUT', 60, 40, 6);
    text('A LITTLE JAVASCRIPT. A REAL NATIVE GAME.', 60, 101, 2, palette.muted);
    text('SFML.JS / ARCADE', 970, 44, 2, palette.mint);
    text('MOVE. DEFLECT. REPEAT.', 1038, 78, 1, palette.muted);
    box(38, 130, 1124, 1, palette.edge);
    text('01 / CHROMATIC', 38, 144, 2, palette.mint);
    text('CLEAR THE FIELD', 812, 147, 1, palette.muted);
    window.draw(field);
    window.draw(dots);
    box(36, 166, 2, 520, palette.edge);
    box(902, 166, 2, 520, palette.edge);
    box(38, 164, 864, 2, palette.edge);
    box(38, 686, 864, 2, palette.edge);
    for (const x of [ 36, 892 ]) {
      box(x, 164, 12, 2, palette.mint);
      box(x, 686, 12, 2, palette.mint);
    }

    for (const brick of game.bricks) {
      if (!brick.alive) {
        box(brick.x + 30, brick.y + 12, 17, 2, palette.edge);
        continue;
      }
      const fill = palette.bricks[brick.row];
      box(brick.x, brick.y + 4, brick.w, brick.h, color(6, 15, 18, 110));
      box(brick.x, brick.y, brick.w, brick.h, fill);
      box(brick.x, brick.y, brick.w, 2, alpha(palette.white, 0.32));
      box(brick.x + 4, brick.y + brick.h - 4, brick.w - 8, 2,
        color(8, 32, 30, 36));
    }
    for (const flash of game.flashes) {
      text(`+${flash.points}`, flash.x + 24,
        Math.round(flash.y - (0.65 - flash.life) * 42), 2,
        alpha(palette.bricks[flash.row], flash.life / 0.65));
    }
    for (const particle of game.particles) {
      const size = 2 + particle.life / particle.maxLife * 3;
      box(particle.x, particle.y, size, size,
        alpha(palette.bricks[particle.row], particle.life / particle.maxLife));
    }
    if (game.phase !== 'ready') {
      for (const mark of game.trail) {
        const strength = 1 - (game.time - mark.time) / 0.2;
        disc(mark.x, mark.y, 2 + 5 * strength,
          alpha(palette.mint, strength * 0.32));
      }
    }
    const { ball, paddle } = game;
    pill(paddle.x - 7, paddle.y - 6, paddle.w + 14, 26,
      alpha(palette.mint, 0.055));
    pill(paddle.x, paddle.y, paddle.w, paddle.h, palette.mint);
    box(paddle.x + 18, paddle.y + 2, paddle.w - 36, 2,
      alpha(palette.white, 0.75));
    for (let i = -1; i <= 1; i++) {
      box(paddle.x + paddle.w / 2 + i * 5, paddle.y + 7, 2, 3,
        color(48, 126, 104));
    }
    disc(ball.x, ball.y, ball.r + 10, alpha(palette.mint, 0.04));
    disc(ball.x, ball.y, ball.r + 4, alpha(palette.mint, 0.1));
    disc(ball.x, ball.y, ball.r, palette.white);
    disc(ball.x - 2, ball.y - 2, 2, sf.Color.White);
    for (let x = 58; x < 894; x += 18) {
      box(x, 675, 7, 1, color(92, 83, 70));
    }

    box(932, 166, 230, 522, palette.panel);
    text('SCORE', 952, 190, 2, palette.muted);
    text(String(game.score).padStart(5, '0'), 952, 224, 5);
    text(`BEST ${String(game.best).padStart(5, '0')}`, 952, 273, 1,
      palette.muted);
    box(952, 300, 190, 1, palette.edge);
    text('LIVES', 952, 322, 2, palette.muted);
    for (let i = 0; i < 3; i++) {
      pill(952 + i * 62, 355, 46, 10, i < game.lives
        ? palette.mint : palette.edge);
    }
    box(952, 394, 190, 1, palette.edge);
    text('FIELD CLEARED', 952, 417, 1, palette.muted);
    text(`${String(60 - game.remaining).padStart(2, '0')} / 60`,
      952, 439, 3);
    game.bricks.forEach((brick, index) => {
      box(952 + index % 10 * 19, 479 + Math.floor(index / 10) * 11, 14, 6,
        brick.alive ? palette.edge : palette.bricks[brick.row]);
    });
    box(952, 567, 190, 1, palette.edge);
    const status = {
      ready: 'READY TO GO', playing: 'IN PLAY', paused: 'PAUSED',
      won: 'FIELD CLEAR', lost: 'GAME OVER',
    };
    disc(957, 596, 4, game.phase === 'lost'
      ? palette.bricks[0] : palette.mint);
    text(status[game.phase], 972, 590, 2, palette.mint);
    text('DEFLECT WITH THE', 952, 625, 1, palette.muted);
    text('EDGE TO FIND AN ANGLE.', 952, 642, 1, palette.muted);

    if (game.phase !== 'playing') {
      box(222, 459, 496, 140, color(8, 19, 22, 242));
      box(222, 459, 3, 140, palette.mint);
      const titles = {
        ready: game.lives === 3 ? 'MAKE YOUR FIRST MOVE' : 'ANOTHER SHOT',
        paused: 'TAKE A BREATHER', won: 'FIELD CLEARED', lost: 'ONE MORE ROUND',
      };
      const title = titles[game.phase];
      text(title, 470 - title.length * 9, 486, 3);
      const subtitle = {
        ready: 'SPACE TO LAUNCH', paused: 'SPACE OR P TO RESUME',
        won: 'ALL 60 BRICKS. NICELY PLAYED.',
        lost: 'THREE LIVES. TRY A NEW ANGLE.',
      }[game.phase];
      text(subtitle, 470 - subtitle.length * 6, 530, 2, palette.muted);
      if (game.phase === 'won' || game.phase === 'lost') {
        text('SPACE TO PLAY AGAIN', 356, 568, 2, palette.mint);
      }
    }
    text('A / D  OR  LEFT / RIGHT', 38, 719, 2);
    text('MOVE', 338, 721, 1, palette.muted);
    text('SPACE', 416, 719, 2);
    text('LAUNCH / RESTART', 492, 721, 1, palette.muted);
    text('P', 674, 719, 2);
    text('PAUSE', 696, 721, 1, palette.muted);
    text('ESC', 804, 719, 2);
    text('EXIT', 850, 721, 1, palette.muted);
    text('BUILT WITH SFML.JS', 946, 719, 2, palette.mint);
    previousLabels = nextLabels;
  };
}

async function main(options) {
  const sf = require('..');
  const { setImmediate: nextFrame } = require('node:timers/promises');
  const window = new sf.RenderWindow(new sf.Vector2u(WIDTH, HEIGHT),
    'Breakout / sfml.js', { style: sf.Style.Titlebar + sf.Style.Close });
  const game = createGame();
  let frames = 0;
  let captured = false;
  const bounded = Number.isFinite(options.frames);
  const snapshotFrame = bounded ? options.frames : 900;
  const snapshot = process.env.SFML_DEMO_SNAPSHOT;
  try {
    window.setKeyRepeatEnabled(false);
    window.setFramerateLimit(60);
    const draw = createRenderer(sf, window);
    const clock = new sf.Clock();
    let accumulator = 0;
    if (options.autoplay) startGame(game);
    console.log('Breakout: A/D or arrows move; Space launches/restarts; ' +
      'P pauses; Escape closes.');
    while (window.isOpen() && frames < options.frames) {
      for (let event; (event = window.pollEvent());) {
        const key = event.getIf('KeyPressed');
        if (event.is('Closed') || key?.code === sf.Keyboard.Key.Escape) {
          window.close();
          break;
        }
        if (event.is('FocusLost') && !options.autoplay &&
            game.phase === 'playing') game.phase = 'paused';
        if (key?.code === sf.Keyboard.Key.Space) startGame(game);
        if (key?.code === sf.Keyboard.Key.P) {
          if (game.phase === 'playing') game.phase = 'paused';
          else if (game.phase === 'paused') startGame(game);
        }
      }
      if (!window.isOpen()) break;
      const elapsed = Math.min(clock.restart().asSeconds(), 0.1);
      // Bounded runs advance exactly 1/60 s per frame, independently of GPU
      // speed. Interactive play uses the same 120 Hz physics with real time.
      accumulator += bounded ? 1 / 60 : elapsed;
      let direction = 0;
      if (!options.autoplay && window.hasFocus()) {
        const down = key => sf.Keyboard.isKeyPressed(key);
        direction = Number(down(sf.Keyboard.Key.Right) ||
          down(sf.Keyboard.Key.D)) -
          Number(down(sf.Keyboard.Key.Left) || down(sf.Keyboard.Key.A));
      }
      if (options.autoplay && game.phase === 'ready') startGame(game);
      while (accumulator >= STEP) {
        stepGame(game, STEP, options.autoplay
          ? autoplayInput(game) : { direction });
        accumulator -= STEP;
      }
      draw(game);
      frames++;
      if (snapshot && !captured && frames === snapshotFrame) {
        // Texture.update flushes pending draws. Read the back buffer before
        // display swaps it; never capture the desktop or another application.
        const texture = new sf.Texture(window.getSize());
        texture.update(window);
        if (!await texture.copyToImage().saveToFile(snapshot)) {
          throw new Error(`Could not save screenshot: ${snapshot}`);
        }
        captured = true;
        console.log(`Screenshot: ${snapshot} (${WIDTH}x${HEIGHT})`);
      }
      window.display();
      await nextFrame();
    }
  } finally {
    window.close();
  }
  console.log(JSON.stringify({ frames, phase: game.phase, score: game.score,
    lives: game.lives, remaining: game.remaining, paddleHits: game.hits,
    captured }));
}

module.exports = {
  createGame, startGame, stepGame, autoplayInput, parseOptions,
};

if (require.main === module) {
  Promise.resolve().then(() => {
    const options = parseOptions(process.argv.slice(2));
    return options.selfTest ? selfTest() : main(options);
  }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
