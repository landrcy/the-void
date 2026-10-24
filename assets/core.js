/* The Void — core: seeded RNG + noise, the one scene pixel grid, delta-time loop, input, dither helpers, tiny pixel font. */
(function () {
  'use strict';
  var V = window.VOID = window.VOID || {};
  var Q = new URLSearchParams(location.search);
  V.q = Q;
  V.reduced = Q.has('reduced') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- hashing / rng / noise ---------- */
  function mix(h, k) { k = Math.imul(k, 0xcc9e2d51); k = (k << 15) | (k >>> 17); k = Math.imul(k, 0x1b873593); h ^= k; h = (h << 13) | (h >>> 19); return (Math.imul(h, 5) + 0xe6546b64) | 0; }
  function fin(h) { h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return h >>> 0; }
  V.hash = function (a, b, c, d) { return fin(mix(mix(mix(mix(0x1234abcd, a | 0), b | 0), c | 0), d | 0)); };
  V.hf = function (a, b, c, d) { return V.hash(a, b, c, d) / 4294967296; };
  V.rng = function (a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  V.rint = function (r, a, b) { return a + Math.floor(r() * (b - a + 1)); };
  V.pick = function (r, arr) { return arr[Math.floor(r() * arr.length)]; };
  V.wpick = function (r, items) { var t = 0, i; for (i = 0; i < items.length; i++) t += items[i].w; var x = r() * t; for (i = 0; i < items.length; i++) { x -= items[i].w; if (x <= 0) return items[i]; } return items[items.length - 1]; };
  V.clamp = function (x, a, b) { return x < a ? a : x > b ? b : x; };
  V.lerp = function (a, b, t) { return a + (b - a) * t; };
  V.smooth = function (t) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
  V.ease = function (k, dt) { return 1 - Math.exp(-k * dt); };      /* time-based easing factor */
  V.TAU = Math.PI * 2;

  /* value noise with a permutation table (fast; seedless, offset by a seed-derived shift) */
  var PERM = new Uint8Array(512), VAL = new Float32Array(256);
  (function () { var r = V.rng(777), p = [], i; for (i = 0; i < 256; i++) { p.push(i); VAL[i] = r(); } for (i = 255; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = p[i]; p[i] = p[j]; p[j] = t; } for (i = 0; i < 512; i++) PERM[i] = p[i & 255]; })();
  function sm(t) { return t * t * (3 - 2 * t); }
  V.noise2 = function (x, y, s) {
    s = s | 0; x += (s * 37.17) % 251; y += (s * 91.31) % 241;
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; xi &= 255; yi &= 255;
    var a = VAL[PERM[PERM[xi] + yi]], b = VAL[PERM[PERM[xi + 1] + yi]], c = VAL[PERM[PERM[xi] + yi + 1]], d = VAL[PERM[PERM[xi + 1] + yi + 1]];
    var u = sm(xf), v = sm(yf); return (a + (b - a) * u) + ((c + (d - c) * u) - (a + (b - a) * u)) * v;
  };
  V.noise3 = function (x, y, z, s) {
    s = s | 0; x += (s * 37.17) % 251; y += (s * 91.31) % 241; z += (s * 13.77) % 233;
    var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi; xi &= 255; yi &= 255; zi &= 255;
    var u = sm(xf), v = sm(yf), w = sm(zf);
    var A = PERM[xi] + yi, B = PERM[xi + 1] + yi;
    var a0 = VAL[PERM[PERM[A] + zi]], b0 = VAL[PERM[PERM[B] + zi]], c0 = VAL[PERM[PERM[A + 1] + zi]], d0 = VAL[PERM[PERM[B + 1] + zi]];
    var a1 = VAL[PERM[PERM[A] + zi + 1]], b1 = VAL[PERM[PERM[B] + zi + 1]], c1 = VAL[PERM[PERM[A + 1] + zi + 1]], d1 = VAL[PERM[PERM[B + 1] + zi + 1]];
    var x0 = a0 + (b0 - a0) * u, x1 = c0 + (d0 - c0) * u, x2 = a1 + (b1 - a1) * u, x3 = c1 + (d1 - c1) * u;
    var y0 = x0 + (x1 - x0) * v, y1 = x2 + (x3 - x2) * v; return y0 + (y1 - y0) * w;
  };
  V.fbm2 = function (x, y, s, o) { var a = 0, amp = .5, f = 1, n = 0; o = o || 4; for (var i = 0; i < o; i++) { a += V.noise2(x * f, y * f, s + i * 7) * amp; n += amp; amp *= .5; f *= 2.03; } return a / n; };
  V.fbm3 = function (x, y, z, s, o) { var a = 0, amp = .5, f = 1, n = 0; o = o || 4; for (var i = 0; i < o; i++) { a += V.noise3(x * f, y * f, z * f, s + i * 7) * amp; n += amp; amp *= .5; f *= 2.03; } return a / n; };
  /* periodic 1D fbm: seamless over `period` lattice cells (for wrap-around surfaces) */
  V.pnoise1 = function (x, period, s) { var xi = Math.floor(x), xf = x - xi, a = V.hf(((xi % period) + period) % period, s), b = V.hf((((xi + 1) % period) + period) % period, s); return a + (b - a) * sm(xf); };
  V.pfbm1 = function (x, period, s, o) { var a = 0, amp = .5, n = 0, f = 1; o = o || 4; for (var i = 0; i < o; i++) { a += V.pnoise1(x * f, period * f, s + i * 13) * amp; n += amp; amp *= .5; f *= 2; } return a / n; };

  /* ---------- colour helpers ---------- */
  V.hex = function (h) { if (Array.isArray(h)) return h; h = h.replace('#', ''); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  V.css = function (c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; };
  V.hexs = function (c) { return '#' + ((1 << 24) + ((c[0] | 0) << 16) + ((c[1] | 0) << 8) + (c[2] | 0)).toString(16).slice(1); };
  V.mixc = function (a, b, t) { a = V.hex(a); b = V.hex(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  V.mixs = function (a, b, t) { return V.hexs(V.mixc(a, b, t)); };
  V.shade = function (c, f) { c = V.hex(c); return f < 1 ? [c[0] * f, c[1] * f, c[2] * f] : [c[0] + (255 - c[0]) * (f - 1), c[1] + (255 - c[1]) * (f - 1), c[2] + (255 - c[2]) * (f - 1)]; };
  /* ramp lookup: stops [[t,hex],...] -> rgb */
  V.ramp = function (stops, t) { stops = stops.map(function (s) { return [s[0], V.hex(s[1])]; }); if (t <= stops[0][0]) return stops[0][1]; for (var i = 1; i < stops.length; i++) if (t <= stops[i][0]) { var a = stops[i - 1], b = stops[i], k = (t - a[0]) / (b[0] - a[0]); return [a[1][0] + (b[1][0] - a[1][0]) * k, a[1][1] + (b[1][1] - a[1][1]) * k, a[1][2] + (b[1][2] - a[1][2]) * k]; } return stops[stops.length - 1][1]; };
  /* 8x8 Bayer ordered dither, 0..1 */
  var B8 = new Float32Array(64);
  (function () { var b = [[0]]; function ex(m) { var n = m.length, r = []; for (var y = 0; y < n * 2; y++) { r.push([]); for (var x = 0; x < n * 2; x++) { var q = m[y % n][x % n] * 4; r[y].push(q + (y < n ? (x < n ? 0 : 2) : (x < n ? 3 : 1))); } } return r; } b = ex(ex(ex(b))); for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) B8[y * 8 + x] = (b[y][x] + .5) / 64; })();
  V.B8 = B8;
  V.bayer = function (x, y) { return B8[((y & 7) << 3) | (x & 7)]; };

  /* ---------- the one scene pixel grid ---------- */
  var canvas = document.getElementById('game'), ctx = canvas.getContext('2d', { alpha: false });
  V.canvas = canvas; V.ctx = ctx; V.W = 320; V.H = 180; V.S = 4;
  V.layoutListeners = [];
  V.layout = function () {
    var vw = Math.max(200, window.innerWidth), vh = Math.max(200, window.innerHeight);
    var S = Math.max(1, Math.ceil(Math.max(vw / 400, vh / 240)));
    S = Math.max(1, Math.min(S, Math.floor(vw / 190)));
    if (Q.get('s')) S = Math.max(1, +Q.get('s') | 0);
    var W = Math.floor(vw / S), H = Math.floor(vh / S);
    var changed = (W !== V.W || H !== V.H || S !== V.S);
    V.S = S; V.W = W; V.H = H;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    canvas.style.width = (W * S) + 'px'; canvas.style.height = (H * S) + 'px';
    document.documentElement.style.setProperty('--S', S);
    ctx.imageSmoothingEnabled = false;
    if (changed) V.layoutListeners.forEach(function (f) { f(W, H, S); });
  };
  var lt = 0; window.addEventListener('resize', function () { clearTimeout(lt); lt = setTimeout(V.layout, 60); });
  window.addEventListener('orientationchange', function () { setTimeout(V.layout, 200); });
  V.layout();

  /* make a small offscreen canvas */
  V.mk = function (w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); var g = c.getContext('2d'); g.imageSmoothingEnabled = false; c.g = g; return c; };
  /* sprite from rows of chars + palette map ('.' = empty) */
  V.sprite = function (rows, pal) { var h = rows.length, w = rows[0].length, c = V.mk(w, h), g = c.g; for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var ch = rows[y][x]; if (ch !== '.' && ch !== ' ' && pal[ch]) { g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1); } } return c; };

  /* ---------- dither dissolve overlay (pixel-pure fade) ---------- */
  var dpat = {};
  function ditherPattern(color, lvl) {
    var key = color + lvl; if (dpat[key]) return dpat[key];
    var c = V.mk(8, 8), g = c.g; g.fillStyle = color; var t = lvl / 64;
    for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) if (B8[y * 8 + x] < t) g.fillRect(x, y, 1, 1);
    return (dpat[key] = ctx.createPattern(c, 'repeat'));
  }
  /* cover the screen (or a rect) with colour at level t in 0..1 */
  V.dissolve = function (g, t, color, x, y, w, h) {
    if (t <= 0) return; x = x || 0; y = y || 0; w = w || V.W; h = h || V.H; color = color || '#05020d';
    g.save();
    if (t >= 1) { g.fillStyle = color; g.fillRect(x, y, w, h); } else { g.fillStyle = ditherPattern(color, Math.round(t * 64)); g.fillRect(x, y, w, h); }
    g.restore();
  };

  /* ---------- tiny 3x5 pixel font (digits + a few letters) ---------- */
  var GL = { '0': '111101101101111', '1': '010110010010111', '2': '111001111100111', '3': '111001111001111', '4': '101101111001001', '5': '111100111001111', '6': '111100111101111', '7': '111001001001001', '8': '111101111101111', '9': '111101111001111', '#': '101111101111101', '-': '000000111000000', '.': '000000000000010', ' ': '000000000000000',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '+': '000010111010000', ':': '000010000010000', '!': '010010010000010', '/': '001001010100100', '?': '110001010000010' };
  V.textW = function (str) { return String(str).length * 4 - 1; };
  V.text = function (g, str, x, y, col, shadow) {
    str = String(str);
    for (var pass = shadow ? 0 : 1; pass < 2; pass++) {
      g.fillStyle = pass === 0 ? shadow : col;
      for (var i = 0; i < str.length; i++) { var gl = GL[str[i]] || GL[str[i].toUpperCase()] || GL[' ']; for (var k = 0; k < 15; k++) if (gl[k] === '1') g.fillRect(x + i * 4 + (k % 3) + (pass === 0 ? 1 : 0), y + ((k / 3) | 0) + (pass === 0 ? 1 : 0), 1, 1); }
    }
  };


  /* ---------- 5x5 pixel glyphs (icons instead of words) ---------- */
  var GLY = { planet: '.111.111111111111111.111.', gas: '.111.11111.....11111.111.', star: '..1....1..11111..1....1..', bh: '.111.1...11.1.11...1.111.', moon: '.11..1....1....1.....11..', station: '1.1.1.111.11111.111.1.1.1', wreck: '1...1.1.1...1...1.1.1...1', ruins: '111111...11.1.11...11...1', comet: '...1....1.11...11...111..', home: '..1...111.11111.111..1.1.', scan: '..1...1.1.1.1.1.1.1...1..', left: '..1...1...11111.1.....1..', right: '..1.....1.11111...1...1..', up: '..1...111.1.1.1..1....1..', down: '..1....1..1.1.1.111...1..', shift: '..1...1.1.1...1.1.1..111.', ship: '..1...111..111.11.11.1.1.', land: '..1....1..1.1.1.111.11111' };
  V.addGlyphs = function (o) { for (var k in o) GLY[k] = o[k]; };
  V.hasGlyph = function (k) { return !!GLY[k]; };
  V.glyph = function (g, name, x, y, col, shadow) { var p = GLY[name] || GLY.planet; for (var pass = shadow ? 0 : 1; pass < 2; pass++) { g.fillStyle = pass ? col : shadow; var o = pass ? 0 : 1; for (var k = 0; k < 25; k++) if (p[k] === '1') g.fillRect(x + (k % 5) + o, y + ((k / 5) | 0) + o, 1, 1); } };
  /* little key cap: 9x9 (or wider) box with a glyph or letter */
  V.keycap = function (g, x, y, label, w, a) { w = w || 9; g.fillStyle = '#05020d'; g.fillRect(x, y, w, 10); g.fillStyle = '#2a0f4d'; g.fillRect(x, y, w, 9); g.fillStyle = '#6a3ab0'; g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, 9); g.fillRect(x + w - 1, y, 1, 9); g.fillStyle = '#14082a'; g.fillRect(x + 1, y + 8, w - 2, 1);
    if (label === 'space') { g.fillStyle = '#efe6ff'; g.fillRect(x + 3, y + 5, w - 6, 1); g.fillRect(x + 3, y + 4, 1, 1); g.fillRect(x + w - 4, y + 4, 1, 1); }
    else if (GLY[label]) V.glyph(g, label, x + ((w - 5) >> 1), y + 2, '#efe6ff'); else V.text(g, label, x + ((w - 3) >> 1), y + 2, '#efe6ff'); };

  /* ---------- input ---------- */
  var keys = {}, edge = {};
  V.touch = { l: 0, r: 0, u: 0, d: 0, jump: 0, act: 0, boost: 0, laser: 0, build: 0 };
  function kd(e) {
    if (e.target && /input|textarea/i.test(e.target.tagName)) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === ' ' || k === 'Tab' || k.indexOf('Arrow') === 0) e.preventDefault();
    if (!keys[k]) edge[k] = true; keys[k] = true;
  }
  function ku(e) { var k = e.key.length === 1 ? e.key.toLowerCase() : e.key; keys[k] = false; }
  addEventListener('keydown', kd); addEventListener('keyup', ku);
  addEventListener('blur', function () { keys = {}; V.touch.l = V.touch.r = V.touch.u = V.touch.d = V.touch.jump = V.touch.act = V.touch.boost = 0; });
  V.keyDown = function (k) { return !!keys[k]; };
  V.keyPressed = function (k) { return !!edge[k]; };
  V.virtualKeys = function (list, val) { list.forEach(function (k) { if (val && !keys[k]) edge[k] = true; keys[k] = val; }); };
  var tEdge = {};
  V.tPress = function (n) { tEdge[n] = true; };
  V.input = {
    get x() { return (keys.ArrowRight || keys.d || V.touch.r ? 1 : 0) - (keys.ArrowLeft || keys.a || V.touch.l ? 1 : 0); },
    get y() { return (keys.ArrowDown || keys.s || V.touch.d ? 1 : 0) - (keys.ArrowUp || keys.w || V.touch.u ? 1 : 0); },
    get jump() { return !!(keys[' '] || V.touch.jump); },
    get boost() { return !!(keys.Shift || V.touch.boost); },
    get act() { return !!(keys.e || keys.Enter || V.touch.act); },
    get jumpPressed() { return !!(edge[' '] || tEdge.jump); },
    get actPressed() { return !!(edge.e || tEdge.act); }
  };
  /* pointer in logical (scene-pixel) coordinates, for the in-canvas panels and the map */
  var M = V.mouse = { x: -99, y: -99, down: false, clicked: false, long: false, wheel: 0, dragX: 0, dragY: 0, has: false, t0: 0, sx: 0, sy: 0, moved: 0, consumed: false };
  function mpos(e) { var r = canvas.getBoundingClientRect(); M.x = Math.floor((e.clientX - r.left) / r.width * V.W); M.y = Math.floor((e.clientY - r.top) / r.height * V.H); M.has = true; }
  canvas.addEventListener('pointermove', function (e) { var ox = M.x, oy = M.y; mpos(e); if (M.down) { M.dragX += M.x - ox; M.dragY += M.y - oy; M.moved += Math.abs(M.x - ox) + Math.abs(M.y - oy); } });
  canvas.addEventListener('pointerdown', function (e) { mpos(e); M.down = true; M.t0 = performance.now(); M.sx = M.x; M.sy = M.y; M.moved = 0; M.pressed = true; M.longFired = false; if (V.onPointerDown) V.onPointerDown(M); });
  addEventListener('pointerup', function (e) { if (!M.down) return; mpos(e); M.down = false; if (M.moved < 6 && !M.longFired) M.clicked = true; M.released = true; });
  canvas.addEventListener('wheel', function (e) { e.preventDefault(); M.wheel += e.deltaY > 0 ? 1 : -1; }, { passive: false });
  V.mouseLongCheck = function () { if (M.down && !M.longFired && M.moved < 6 && performance.now() - M.t0 > 450) { M.longFired = true; M.long = true; } };
  V.endInput = function () { edge = {}; tEdge = {}; M.clicked = false; M.long = false; M.wheel = 0; M.dragX = 0; M.dragY = 0; M.pressed = false; M.released = false; M.consumed = false; };
  V.anyPressed = function () { return Object.keys(edge).length > 0 || Object.keys(tEdge).length > 0; };

  /* ---------- loop (delta time, clamped) ---------- */
  V.speed = 1; V.time = 0; V.frame = 0; V.paused = false; V.fps = 60; V.dtAvg = 1 / 60; V.maxDt = .05;
  V.hooks = { update: function () { }, draw: function () { } };
  var last = 0, acc = { t: 0, n: 0 };
  V.tick = function (dt) {
    dt = Math.min(V.maxDt, Math.max(0.0005, dt));
    V.time += dt; V.frame++;
    if (V.mouseLongCheck) V.mouseLongCheck(); V.hooks.update(dt * V.speed); V.hooks.draw(ctx, dt); V.endInput();
  };
  function raf(now) {
    requestAnimationFrame(raf);
    if (document.hidden) { last = now; return; }
    var dt = last ? (now - last) / 1000 : 1 / 60; last = now;
    if (V.paused) return;
    V.dtAvg += (dt - V.dtAvg) * .05;
    acc.t += dt; acc.n++; if (acc.t >= .5) { V.fps = acc.n / acc.t; acc.t = 0; acc.n = 0; }
    V.tick(dt);
  }
  V.start = function () { requestAnimationFrame(raf); };
  /* deterministic stepping for tests: advance `sec` seconds at `fps` simulated frames/s; draws once at the end (or every frame if drawAll) */
  V.stepSim = function (sec, fps, drawAll) {
    var n = Math.round(sec * fps), dt = 1 / fps, old = V.hooks.draw; V.maxDt = 1;
    for (var i = 0; i < n; i++) { V.time += dt; V.frame++; V.hooks.update(dt * V.speed); if (drawAll || i === n - 1) old(ctx, dt); V.endInput(); }
    V.maxDt = .05;
  };
  if (Q.has('sim')) V.paused = true;
  V.shake = 0;
})();
