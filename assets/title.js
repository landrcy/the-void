/* The Void — title scene. Stencil lettering drawn as code on the scene pixel grid; the O is a black hole whose gravity stretches,
   smears and peels the nearby letter edges into spiralling streaks. Software framebuffer, delta-time everything. */
(function () {
  'use strict';
  var V = window.VOID, TAU = V.TAU;

  /* ---------- stencil letters (procedural masks) ---------- */
  function inPoly(x, y, p) { var c = false; for (var i = 0, j = p.length - 1; i < p.length; j = i++) { var xi = p[i][0], yi = p[i][1], xj = p[j][0], yj = p[j][1]; if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c; } return c; }
  function rr(x, y, x0, y0, x1, y1, a, b, c, d) { /* rounded rect, radii tl,tr,br,bl */
    if (x < x0 || x >= x1 || y < y0 || y >= y1) return false; a = a || 0; b = b || 0; c = c || 0; d = d || 0;
    var cx, cy, r;
    if (a && x < x0 + a && y < y0 + a) { cx = x0 + a; cy = y0 + a; r = a; return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r; }
    if (b && x >= x1 - b && y < y0 + b) { cx = x1 - b; cy = y0 + b; r = b; return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r; }
    if (c && x >= x1 - c && y >= y1 - c) { cx = x1 - c; cy = y1 - c; r = c; return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r; }
    if (d && x < x0 + d && y >= y1 - d) { cx = x0 + d; cy = y1 - d; r = d; return (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r; }
    return true;
  }
  function letter(ch, w, h) {
    var m = new Uint8Array(w * h), s = Math.round(h * 0.33), g = Math.max(1, Math.round(h * 0.055)), x, y, on;
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var px = x + .5, py = y + .5; on = false;
      if (ch === 'T') {
        var st = Math.round(s * 1.1), bar = Math.round(s * 0.92), x0 = (w - st) / 2;
        on = rr(px, py, 0, 0, w, bar, 1, 1, 0, 0) || (px >= x0 && px < x0 + st && py >= bar + g);
      } else if (ch === 'H') {
        var bh = Math.round(s * 0.85), by = (h - bh) / 2;
        on = px < s || px >= w - s || (py >= by && py < by + bh && px < w - s - g);
        if (px < s && py < 2 && px < 1.2) on = false;
      } else if (ch === 'E') {
        var as = Math.round(h * 0.25), my = (h - as) / 2;
        on = px < s || (px >= s + g && ((py < as) || (py >= my && py < my + as && px < w - s * 0.45) || py >= h - as));
        if (px >= s + g && ((py < as && px >= w - 1.5 && py < 1.5) || (py >= h - as && px >= w - 1.5 && py >= h - 1.5))) on = false;
      } else if (ch === 'V') {
        var sT = s * 1.05, sB = s * 0.78, cxm = w / 2, ap = h * 0.74;
        on = inPoly(px, py, [[0, 0], [sT, 0], [cxm - g / 2, ap], [cxm - g / 2, h], [cxm - sB, h]]) || inPoly(px, py, [[w, 0], [w - sT, 0], [cxm + g / 2, ap], [cxm + g / 2, h], [cxm + sB, h]]);
      } else if (ch === 'I') {
        on = (py < h * 0.3 || py >= h * 0.3 + g);
      } else if (ch === 'D') {
        var rad = h * 0.5, bs = Math.round(s * 0.82), bx0 = s + g;
        on = px < s || (rr(px, py, bx0, 0, w, h, 0, rad, rad, 0) && !rr(px, py, bx0 + Math.round(s * 0.34), bs, w - bs, h - bs, 0, rad - bs, rad - bs, 0));
        if (px >= s && px < bx0) on = false;
      }
      m[y * w + x] = on ? 1 : 0;
    }
    return m;
  }
  V.stencilLetter = letter;

  /* ---------- palette (purple + black) ---------- */
  var DISC = ['#0b0220', '#2a0a52', '#5a14a0', '#8e2bd6', '#c04df0', '#ff6fe0', '#ffd2f8', '#ffffff'].map(V.hex);
  var TXT = ['#fbf7ff', '#e9ddff', '#cdbcf3', '#ad98e6'].map(V.hex);
  var HOT = ['#ffd2f8', '#ff6fe0', '#c04df0', '#8e2bd6', '#5a14a0'].map(V.hex);
  var T = { buf: null, img: null, u32: null, base: null, stars: [], parts: [], lx: null, ly: null, lc: null, gone: null, edge: null, cand: [], t: 0, out: 0, outing: false, started: false, cb: null, rb: 14, cx: 0, cy: 0, active: false, acc: 0, spawnAcc: 0 };
  V.title = T;

  function pack(c) { return (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]; }
  var BLACK = pack([0, 0, 0]);

  function layout() {
    var W = V.W, H = V.H;
    T.img = new ImageData(W, H); T.u32 = new Uint32Array(T.img.data.buffer); T.base = new Uint32Array(W * H);
    var hV = Math.floor(Math.min((W - 20) / 3.6, H * 0.27)); hV = Math.max(26, hV); T.hV = hV;
    var gap = Math.max(3, Math.round(hV * 0.085)), wV = Math.round(hV * 0.92), wO = Math.round(hV * 1.14), wI = Math.round(hV * 0.34), wD = Math.round(hV * 0.80);
    var lineW = wV + wO + wI + wD + gap * 3, hT = Math.round(hV * 0.74);
    var gapV = Math.round(hV * 0.14), totalH = hT + gapV + hV;
    var x0 = Math.round((W - lineW) / 2), y0 = Math.round(H * 0.46 - totalH / 2);
    var yV = y0 + hT + gapV;
    var wT = Math.floor((lineW - gap * 2) / 3), extra = lineW - gap * 2 - wT * 3;
    var xs = [], ys = [], lc = [], defs = [];
    function add(ch, x, y, w, h, id) { var m = letter(ch, w, h); for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) if (m[j * w + i]) { xs.push(x + i); ys.push(y + j); lc.push(id | (Math.min(3, Math.floor(j / h * 4)) << 4)); } defs.push({ ch: ch, x: x, y: y, w: w, h: h }); }
    var x = x0; add('T', x, y0, wT, hT, 0); x += wT + gap; add('H', x, y0, wT + extra, hT, 1); x += wT + extra + gap; add('E', x, y0, wT, hT, 2);
    x = x0; add('V', x, yV, wV, hV, 3); x += wV + gap; T.cx = x + wO / 2; T.cy = yV + hV / 2; x += wO + gap; add('I', x, yV, wI, hV, 4); x += wI + gap; add('D', x, yV, wD, hV, 5);
    T.lx = new Int16Array(xs); T.ly = new Int16Array(ys); T.lc = new Uint8Array(lc); T.n = xs.length; T.defs = defs;
    T.gone = new Float32Array(T.n); T.rb = hV * 0.30; T.lineW = lineW; T.x0 = x0; T.bottom = yV + hV;
    /* edge pixels (4-neighbour test) */
    var occ = new Uint8Array(W * H), i; for (i = 0; i < T.n; i++) occ[T.ly[i] * W + T.lx[i]] = 1;
    T.cand = []; for (i = 0; i < T.n; i++) { var a = T.lx[i], b = T.ly[i]; if (!occ[b * W + a - 1] || !occ[b * W + a + 1] || !occ[(b - 1) * W + a] || !occ[(b + 1) * W + a]) { var d = Math.hypot(a - T.cx, b - T.cy); if (d < hV * 1.0 && d > T.rb * 1.4) T.cand.push(i); } }
    /* stars */
    var r = V.rng(4242), ns = Math.floor(W * H / 330); T.stars = [];
    for (i = 0; i < ns; i++) { var br = r(); T.stars.push({ x: Math.floor(r() * W), y: Math.floor(r() * H), b: br < .6 ? 0 : br < .9 ? 1 : 2, ph: r() * TAU, sp: .5 + r() * 2 }); }
    /* spiralling stars/dust */
    T.spir = []; for (i = 0; i < 70; i++) T.spir.push(newSpiral(r, true));
    bakeBase();
  }
  function newSpiral(r, init) { var R = T.hV * (0.7 + r() * (init ? 2.6 : 1.4)); if (!init) R = T.hV * (1.4 + r() * 1.6); return { a: r() * TAU, r: R, w: .22 + r() * .3, c: r() < .6 ? 3 : r() < .5 ? 2 : 1, dir: 1 }; }

  function bakeBase() {
    var W = V.W, H = V.H, b = T.base, x, y, cx = T.cx, cy = T.cy, hV = T.hV;
    for (y = 0; y < H; y++) for (x = 0; x < W; x++) {
      var d = Math.hypot((x - cx) / 1.0, (y - cy) / 0.8) / hV;
      var n = V.fbm2(x * .018, y * .018, 11, 4), n2 = V.fbm2(x * .03 + 40, y * .03, 5, 3);
      var neb = Math.max(0, (n - .46)) * 2.4 * (0.55 + n2 * .6);
      var glow = Math.max(0, 1 - d / 1.9); glow = glow * glow * .85;
      var v = neb * .55 + glow;
      var base = 0.0 + (1 - y / H) * .03;
      /* purple/black dithered ramp */
      var lvl = v * 5.2, li = Math.floor(lvl), fr = lvl - li; if (fr > V.bayer(x, y)) li++;
      var c; var ramp = [[2, 1, 6], [8, 3, 20], [20, 6, 46], [40, 10, 82], [70, 18, 124], [108, 34, 160]];
      c = ramp[Math.min(ramp.length - 1, Math.max(0, li))];
      if (base > 0.02 && li === 0 && V.bayer(x, y) < base * 6) c = ramp[1];
      b[y * W + x] = pack(c);
    }
  }

  /* ---------- drawing primitives on the framebuffer ---------- */
  function put(x, y, c) { if (x >= 0 && y >= 0 && x < V.W && y < V.H) T.u32[y * V.W + x] = c; }
  var DISCP = DISC.map(pack), TXTP = TXT.map(pack), HOTP = HOT.map(pack);
  var STARP = [pack([90, 70, 150]), pack([170, 150, 230]), pack([255, 245, 255])];

  function drawHole(t, rb, zoom) {
    var W = V.W, H = V.H, cx = T.cx, cy = T.cy, u = T.u32, R = Math.ceil(rb * 2.7), x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W - 1, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R * .9)), y1 = Math.min(H - 1, Math.ceil(cy + R * .9));
    var spin = t * (V.reduced ? .18 : .32) * (1 + zoom * 3), tilt = 0.33, rin = rb * 1.12, rout = rb * 2.5, rl = rb * 1.42;
    for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
      var dx = x + .5 - cx, dy = y + .5 - cy, r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx), idx = -1, dens = 0;
      var rry = Math.sqrt(dx * dx + (dy / tilt) * (dy / tilt)), front = dy > 0;
      /* back half of the flat disc */
      var inDisc = rry >= rin && rry <= rout;
      var dd = 0;
      if (inDisc) {
        var k = (rry - rin) / (rout - rin), ang = Math.atan2(dy / tilt, dx);
        var arm = .5 + .5 * Math.sin(ang * 2 - spin * 2.2 + k * 7), fine = V.noise2(ang * 3 + spin * 3, k * 9, 3);
        dd = Math.pow(1 - k, .9) * (.5 + .5 * arm) * (.75 + .5 * fine) * (1.3 + .6 * -dx / rout) * 1.25;
        dd *= 1 - Math.pow(Math.abs(Math.sin(ang * 0 + 0)), 1);
      }
      /* lensed halo ring (light bent over the shadow) */
      var ringd = Math.abs(r - rl) / (rb * .34), lens = 0;
      if (ringd < 1 && r > rb) { var th2 = th - spin * .7; lens = Math.pow(1 - ringd, 1.4) * (.55 + .45 * Math.sin(th2 * 2 + 1.0) * .5 + .25 * V.noise2(th * 2 + spin * 2, r * .3, 8)) * (.8 + .5 * Math.abs(dy) / (r + .01)); }
      var photon = (r >= rb - .3 && r < rb + .9);
      if (r < rb) { if (!(front && inDisc && dy > rb * .35)) { u[y * W + x] = BLACK; continue; } }
      var best = Math.max(dd * (front || r > rb ? 1 : 0), lens * 1.05);
      if (!front && r < rb * 1.02) best = lens;
      if (photon) best = Math.max(best, .78 + .12 * Math.sin(th * 2 + spin * 3) - (dx > 0 ? .08 : 0));
      if (best > .02) {
        var lv = best * 7.2, li = Math.floor(lv); if (lv - li > V.bayer(x, y)) li++;
        if (li > 0) { u[y * W + x] = DISCP[Math.min(7, li)]; continue; }
      }
    }
  }

  /* ---------- scene ---------- */
  T.enter = function () {
    T.active = true; T.t = 0; T.out = 0; T.outing = false; T.parts.length = 0; T.cb = null;
    layout();
    for (var i = 0; i < T.gone.length; i++) T.gone[i] = 0;
  };
  T.start = function (cb) { if (T.outing) return; T.outing = true; T.cb = cb; T.out = 0; };
  V.layoutListeners.push(function () { if (T.active) { layout(); } });

  var SUB = 1 / 120;
  function spawn(pxi, k) {
    var x = T.lx[pxi], y = T.ly[pxi], dx = T.cx - x, dy = T.cy - y, r = Math.hypot(dx, dy) || 1;
    var sp = 3 + Math.random() * 4, tx = -dy / r, ty = dx / r;
    T.parts.push({ x: x + .5, y: y + .5, vx: tx * sp * 2.2 + dx / r * 1.5, vy: ty * sp * 2.2 + dy / r * 1.5, c: T.lc[pxi] & 15, life: 0, hist: [] });
  }
  function stepPart(p, dt, rb) {
    var dx = T.cx - p.x, dy = T.cy - p.y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
    var gm = T.hV * T.hV * 5.2; /* gravitational parameter in px^3/s^2-ish, tuned */
    var a = gm / Math.max(r2, rb * rb * .8) * 1.0; a = Math.min(a, 600);
    p.vx += dx / r * a * dt; p.vy += dy / r * a * dt; /* mild drag so they spiral inward rather than slingshot */
    var dr = Math.exp(-.35 * dt); p.vx *= dr; p.vy *= dr;
    p.x += p.vx * dt; p.y += p.vy * dt; p.life += dt;
  }

  T.update = function (dt) {
    T.t += dt;
    var rb = T.rb, rate = V.reduced ? 5 : 11;
    if (T.outing) { T.out += dt / (V.reduced ? 1.6 : 3.0); rate *= 3; if (T.out >= 1 && !T.fired) { T.fired = true; if (T.cb) T.cb(); } }
    /* peel letter pixels near the hole into particles */
    T.spawnAcc += dt * rate; var tries = 0;
    while (T.spawnAcc >= 1 && T.cand.length && tries++ < 6) {
      T.spawnAcc -= 1;
      var i = T.cand[Math.floor(Math.random() * T.cand.length)];
      if (T.gone[i] > 0) continue;
      T.gone[i] = 3 + Math.random() * 4; spawn(i);
      /* a few neighbours peel with it (a flake) */
      for (var n = 0; n < 3; n++) { var j = T.cand[Math.floor(Math.random() * T.cand.length)]; if (T.gone[j] <= 0 && Math.abs(T.lx[j] - T.lx[i]) + Math.abs(T.ly[j] - T.ly[i]) < 6) { T.gone[j] = 3 + Math.random() * 4; spawn(j); } }
    }
    for (var q = 0; q < T.gone.length; q++) if (T.gone[q] > 0) T.gone[q] -= dt;
    T.acc += dt; var zoom = T.outing ? T.out : 0;
    while (T.acc >= SUB) {
      T.acc -= SUB;
      for (var k = T.parts.length - 1; k >= 0; k--) {
        var p = T.parts[k]; stepPart(p, SUB, rb * (1 + zoom * 8));
        if (((p.life * 120) | 0) % 2 === 0) { p.hist.push(p.x, p.y); if (p.hist.length > 28) p.hist.splice(0, 2); }
        if (Math.hypot(p.x - T.cx, p.y - T.cy) < rb * (1 + zoom * 8) * .95 || p.life > 14) T.parts.splice(k, 1);
      }
    }
    if (T.parts.length > 160) T.parts.splice(0, T.parts.length - 160);
    /* spiral stars */
    var gk = 1 + zoom * 6;
    for (var s = 0; s < T.spir.length; s++) {
      var sp = T.spir[s], rr_ = sp.r, om = (T.hV * .9 / Math.max(rr_, rb)) * (V.reduced ? .5 : 1) * .55 * gk;
      sp.a += om * dt; sp.r -= (3.2 + 40 * Math.pow(rb / Math.max(rr_, rb), 2)) * dt * gk * .6;
      if (sp.r < rb * 1.05) { var rn = V.rng((Math.random() * 1e9) | 0); var ns = newSpiral(rn, false); sp.a = ns.a; sp.r = ns.r; sp.c = ns.c; }
    }
  };

  T.draw = function (ctx, dt) {
    var W = V.W, H = V.H, u = T.u32, t = T.t, i, zoom = T.outing ? V.smooth(T.out) : 0;
    u.set(T.base);
    var cx = T.cx, cy = T.cy, rb0 = T.rb, rb = rb0 * (1 + zoom * zoom * 28);
    var lensK = rb0 * 1.5; lensK = lensK * lensK;
    /* background stars, lensed around the hole */
    for (i = 0; i < T.stars.length; i++) {
      var st = T.stars[i], tw = V.reduced ? 1 : (.5 + .5 * Math.sin(t * st.sp + st.ph)), lv = st.b === 2 ? 2 : (st.b === 1 ? (tw > .35 ? 1 : 0) : (tw > .7 ? 1 : 0));
      var sx = st.x, sy = st.y, dx = sx - cx, dy = sy - cy, r = Math.hypot(dx, dy);
      if (r < rb * 1.6) continue;
      if (r < rb0 * 6) { var rn = r + lensK / r * (rb0 * 4 / Math.max(r, rb0)); sx = Math.round(cx + dx / r * rn); sy = Math.round(cy + dy / r * rn); }
      if (st.b === 2 && lv === 2) { put(sx, sy, STARP[2]); if (tw > .6) { put(sx - 1, sy, STARP[0]); put(sx + 1, sy, STARP[0]); put(sx, sy - 1, STARP[0]); put(sx, sy + 1, STARP[0]); } }
      else put(sx, sy, STARP[lv]);
    }
    /* spiralling stars with trails */
    for (i = 0; i < T.spir.length; i++) {
      var sp = T.spir[i], om = (T.hV * .9 / Math.max(sp.r, rb0)) * .55, trail = Math.min(14, 2 + (rb0 * 2.2 / Math.max(sp.r - rb0 * .8, 1)) * 5);
      for (var j = 0; j < trail; j++) {
        var aa = sp.a - om * (j * .028 + .01), rrj = sp.r + j * (1.0 + 7 * Math.pow(rb0 / Math.max(sp.r, rb0), 2)) * .5;
        var px = Math.round(cx + Math.cos(aa) * rrj), py = Math.round(cy + Math.sin(aa) * rrj * .92);
        if (j > 0 && V.bayer(px, py) > 1 - j / trail) continue;
        if (j === 0) put(px, py, STARP[2]); else put(px, py, HOTP[Math.min(4, 1 + ((j / trail * 4) | 0))]);
      }
    }
    /* the hole + disc (behind the lettering) */
    drawHole(t, rb, zoom);
    /* lettering with gravity: stretch, swirl, smear */
    var breathe = V.reduced ? .8 : (.82 + .18 * Math.sin(t * .35) + .06 * Math.sin(t * .93 + 1));
    var Rinf = T.hV * (V.q.has('nograv') ? 0 : .95), K = (T.outing ? 1 + zoom * 7 : 1) * breathe;
    var P = T.pbuf || (T.pbuf = { x: new Int16Array(T.n), y: new Int16Array(T.n), c: new Uint32Array(T.n), ok: new Uint8Array(T.n), m: new Uint8Array(T.n), hc: new Uint32Array(T.n), sx: new Float32Array(T.n), sy: new Float32Array(T.n), tx: new Float32Array(T.n), ty: new Float32Array(T.n) });
    if (P.x.length !== T.n) { T.pbuf = null; P = T.pbuf = { x: new Int16Array(T.n), y: new Int16Array(T.n), c: new Uint32Array(T.n), ok: new Uint8Array(T.n), m: new Uint8Array(T.n), hc: new Uint32Array(T.n), sx: new Float32Array(T.n), sy: new Float32Array(T.n), tx: new Float32Array(T.n), ty: new Float32Array(T.n) }; }
    var SHD = 0xff3a1a4a;
    for (i = 0; i < T.n; i++) {
      P.ok[i] = 0; var g = T.gone[i]; if (g > .9) continue;
      var x = T.lx[i] + .5, y = T.ly[i] + .5, ddx = cx - x, ddy = cy - y, rd = Math.sqrt(ddx * ddx + ddy * ddy), lc = T.lc[i], shadeIdx = lc >> 4, f = 0;
      if (rd < Rinf && Rinf > 0) { f = (Rinf - rd) / (Rinf - rb0 * 1.1); f = f < 0 ? 0 : f > 1 ? 1 : f; f = Math.pow(f, 2.6); }
      var colIdx = Math.min(3, shadeIdx + ((V.bayer(T.lx[i], T.ly[i]) < .35) ? 1 : 0));
      var col = TXTP[colIdx];
      if (g > 0) col = g > .4 ? HOTP[3] : HOTP[2];
      P.m[i] = 0;
      if (f < .015) { P.x[i] = T.lx[i]; P.y[i] = T.ly[i]; P.c[i] = col; P.ok[i] = 1; continue; }
      f *= K;
      var ang = f * .38 * (V.reduced ? .5 : 1), ca = Math.cos(ang), sa = Math.sin(ang);
      var ux = -ddx / rd, uy = -ddy / rd;
      var rx = (ux * ca - uy * sa), ry = (ux * sa + uy * ca);
      var pull = Math.min(rd - rb * 1.0, f * (rd - rb0 * 1.0) * .5);
      var nx = cx + rx * (rd - pull), ny = cy + ry * (rd - pull);
      var wx = Math.round(nx - .5), wy = Math.round(ny - .5);
      if (Math.hypot(nx - cx, ny - cy) < rb * 1.02) continue;
      var hotk = Math.min(1, f * 1.4), hc = hotk < .25 ? col : hotk < .5 ? HOTP[0] : hotk < .75 ? HOTP[1] : HOTP[2];
      if (V.bayer(wx, wy) < hotk * .9) col = hc;
      P.x[i] = wx; P.y[i] = wy; P.c[i] = col; P.ok[i] = 1; P.hc[i] = hc;
      var m = Math.min(16, Math.floor(f * 22)); P.m[i] = m;
      if (m > 0) { var sdx = cx - nx, sdy = cy - ny, sl = Math.sqrt(sdx * sdx + sdy * sdy) || 1; P.sx[i] = nx; P.sy[i] = ny; P.tx[i] = sdx / sl; P.ty[i] = sdy / sl; P.hc[i] = hc; P.sx[i] = nx; P.sy[i] = ny; T.ang = ang; P.c[i] = col; }
    }
    for (i = 0; i < T.n; i++) if (P.ok[i]) put(P.x[i] + 1, P.y[i] + 1, SHD);
    for (i = 0; i < T.n; i++) if (P.ok[i]) put(P.x[i], P.y[i], P.c[i]);
    for (i = 0; i < T.n; i++) {
      var m2 = P.m[i]; if (!P.ok[i] || m2 <= 0) continue;
      var sdx2 = P.tx[i], sdy2 = P.ty[i], nx2 = P.sx[i], ny2 = P.sy[i], an = 2 * .2, hc2 = P.hc[i];
      for (var s2 = 1; s2 <= m2; s2++) {
        var sxx = Math.round(nx2 + sdx2 * s2 * 1.05 - sdy2 * s2 * s2 * .012 - .5), syy = Math.round(ny2 + sdy2 * s2 * 1.05 + sdx2 * s2 * s2 * .012 - .5);
        if (V.bayer(sxx, syy) > 1 - s2 / (m2 + 1)) continue;
        var hh = s2 / m2; put(sxx, syy, hh < .25 ? hc2 : hh < .5 ? HOTP[1] : hh < .75 ? HOTP[2] : HOTP[3]);
      }
    }
    /* peeled particles with trails */
    for (i = 0; i < T.parts.length; i++) {
      var p = T.parts[i], h = p.hist, nh = h.length / 2;
      for (var q = 0; q < nh; q++) { var tx = Math.round(h[q * 2]), ty = Math.round(h[q * 2 + 1]); var frac = (q + 1) / (nh + 1); if (V.bayer(tx, ty) > frac * 1.1) continue; put(tx, ty, HOTP[Math.min(4, 4 - ((frac * 4) | 0))]); }
      var r = Math.hypot(p.x - cx, p.y - cy), hk = Math.min(1, rb0 * 3 / r);
      put(Math.round(p.x - .5), Math.round(p.y - .5), hk > .6 ? HOTP[0] : hk > .35 ? HOTP[1] : TXTP[1]);
    }
    /* start prompt: a pixel play triangle (pulses) */
    drawPlay(t, zoom);
    ctx.putImageData(T.img, 0, 0);
    if (T.outing) {
      var fd = V.smooth((T.out - .55) / .45); if (fd > 0) V.dissolve(ctx, fd, '#000');
    }
  };

  function drawPlay(t, zoom) {
    if (zoom > .2) return;
    var W = V.W, px = Math.round(W / 2), py = Math.min(V.H - 22, Math.round(T.bottom + Math.max(16, V.H * .12))), pulse = V.reduced ? 1 : (.5 + .5 * Math.sin(t * 2.4));
    var sz = 8, col = pulse > .5 ? TXTP[0] : TXTP[2], sh = pack([58, 26, 115]);
    for (var yy = -sz; yy <= sz; yy++) { var wd = Math.floor((sz + 1 - Math.abs(yy)) * 1.15); for (var xx = 0; xx < wd; xx++) { put(px - 3 + xx + 1, py + yy + 1, sh); } }
    for (yy = -sz; yy <= sz; yy++) { wd = Math.floor((sz + 1 - Math.abs(yy)) * 1.15); for (xx = 0; xx < wd; xx++) put(px - 3 + xx, py + yy, col); }
    T.playY = py;
  }
})();
