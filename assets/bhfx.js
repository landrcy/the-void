/* The Void — black holes, much cooler: lensed starfield + screen-space ripple, multi-layer spinning accretion disk with
   heat bands, photon ring, polar jets, gravity waves, thousands of spiralling (and spaghettified) particles, debris torn apart,
   ship stretching + chromatic shift + shake near the horizon. Plus THE MAW: a mega black hole at the galaxy's centre.
   Everything is drawn on the scene pixel grid (the mega disk at 2x2 cells), dithered, dt-based and capped. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, P = V.planets, Pg = V.prog, TAU = V.TAU, clamp = V.clamp;
  var BX = V.bhfx = { on: !(V.q && V.q.has('oldbh')), stats: { parts: 0, px: 0 } };
  /* ---------- THE MAW ---------- */
  var MEGA = BX.MEGA = { x: 4.6e6, y: 1.3e6, r: 46 };
  var gen0 = G.genCell;
  G.genCell = function (cx, cy) {
    var c = gen0(cx, cy);
    if (cx === G.cellIndex(MEGA.x) && cy === G.cellIndex(MEGA.y) && !c._mega) {
      c._mega = true; var sys = { cx: cx, cy: cy, x: MEGA.x, y: MEGA.y, kind: 'bh', stars: [], cell: c, id: 'mega', hz: 20000, tint: [226, 200, 255] };
      var b = { id: cx + ',' + cy + ':mega', type: 'bh', isBH: true, mega: true, isStar: false, seed: 7, r: MEGA.r, landable: false, x: MEGA.x, y: MEGA.y, cx: MEGA.x, cy: MEGA.y, dot: '#c04df0', surf: 'bh', cell: c, sys: sys, idx: c.bodies.length };
      b.mass = b.r * b.r * 600; sys.stars.push(b); sys.bh = b; c.bodies.push(b); G.byId[b.id] = b; BX.megaBody = b;
      /* clear normal systems out of the maw's disk */
      for (var i = c.bodies.length - 2; i >= 0; i--) { var o = c.bodies[i]; if (Math.hypot(o.x - MEGA.x, o.y - MEGA.y) < MEGA.r * 9) { c.bodies.splice(i, 1); } }
    }
    return c;
  };
  var name0 = G.nameOf; G.nameOf = function (b) { return b && b.mega ? 'THE MAW' : name0(b); };
  var theme0 = V.themeName; V.themeName = function (b) { return b && b.mega ? 'GALACTIC CORE' : theme0(b); };
  BX.megaBodyGet = function () { return BX.megaBody || (G.genCell(G.cellIndex(MEGA.x), G.cellIndex(MEGA.y)), BX.megaBody); };

  /* ---------- palettes ---------- */
  var HEAT = ['#12051f', '#2a0a48', '#4f1680', '#8a2ec0', '#c45af0', '#ff8ae8', '#ffa860', '#ffe0a0', '#ffffff'].map(V.hex);
  function pk(c) { return (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]; }
  var HEATU = HEAT.map(pk), BLACK = pk([0, 0, 0]);
  var buf = null;
  function getBuf(W, H) { if (!buf || buf.w !== W || buf.h !== H) { var cv = V.mk(W, H); buf = { cv: cv, w: W, h: H }; } return buf; }

  /* ---------- per-hole state: particles, debris, waves ---------- */
  var ST = new Map();
  function state(b) {
    var s = ST.get(b.id); if (s) return s;
    s = { parts: [], deb: [], waves: [], lt: V.time, wT: 0, dT: 0, seed: (b.seed || 1) % 997 }; ST.set(b.id, s); if (ST.size > 12) ST.delete(ST.keys().next().value); return s;
  }
  function cap(b) { var area = (V.W * V.H) / (320 * 180), base = b.mega ? 1400 : 420; if (V.reduced) base *= .4; return Math.round(base * clamp(area, .45, 1.6)); }
  function spawn(s, rb, mega, hot) {
    var rho = hot ? rb * (1.4 + Math.random() * .8) : rb * (1.6 + Math.pow(Math.random(), .7) * (mega ? 4.2 : 3.6));
    s.parts.push({ rho: rho, phi: Math.random() * TAU, halo: Math.random() < .14, life: 0, w: .7 + Math.random() * .6, z: (Math.random() - .5) * .3 });
  }
  function step(b, s, rb, dt) {
    var n = cap(b), mega = !!b.mega;
    while (s.parts.length < n) spawn(s, rb, mega);
    var K = rb * (mega ? 2.2 : 3.4), sp = V.reduced ? .5 : 1;
    for (var i = s.parts.length - 1; i >= 0; i--) {
      var p = s.parts[i], om = K / Math.pow(p.rho, 1.5) * 3.2 * p.w * sp; p.phi += om * dt; p.rho -= (rb * .9 / Math.sqrt(p.rho / rb)) * .09 * dt * sp * (p.rho < rb * 1.8 ? 3 : 1); p.life += dt;
      if (p.rho < rb * .96) { s.parts.splice(i, 1); }
    }
    /* debris chunks spiral in and get torn apart */
    s.dT -= dt; if (s.dT <= 0 && s.deb.length < (mega ? 6 : 3)) { s.dT = (mega ? 1.2 : 2.6) + Math.random() * 2; s.deb.push({ rho: rb * (mega ? 5 : 4.6), phi: Math.random() * TAU, sz: 2 + (Math.random() * 3 | 0), spin: 0 }); }
    for (i = s.deb.length - 1; i >= 0; i--) { var d = s.deb[i]; d.phi += K / Math.pow(d.rho, 1.5) * 2.4 * dt * sp; d.rho -= rb * .32 * dt * sp * (1 + 2.5 * rb / d.rho); d.spin += dt * 4;
      if (d.rho < rb * 2.0) { for (var k = 0; k < 14 && s.parts.length < n + 40; k++) s.parts.push({ rho: d.rho * (.9 + Math.random() * .2), phi: d.phi + (Math.random() - .5) * .4, halo: false, life: 0, w: .9 + Math.random() * .4, z: 0, hot: 1 }); s.deb.splice(i, 1); } }
    /* gravity waves */
    s.wT -= dt; if (s.wT <= 0) { s.wT = mega ? 1.6 : 2.8; s.waves.push(0); }
    for (i = s.waves.length - 1; i >= 0; i--) { s.waves[i] += dt; if (s.waves[i] > (mega ? 5 : 3.6)) s.waves.splice(i, 1); }
    BX.stats.parts = s.parts.length;
  }

  /* ---------- the hole itself ---------- */
  function lens(g, cx, cy, rb, t, mega) {
    /* warp what is already drawn (stars, nebulae) around the hole: Einstein-ring style remap + a ripple near the horizon */
    var W = V.W, H = V.H, R = rb * (mega ? 4.2 : 5), x0 = Math.max(0, Math.floor(cx - R)), y0 = Math.max(0, Math.floor(cy - R)), x1 = Math.min(W, Math.ceil(cx + R)), y1 = Math.min(H, Math.ceil(cy + R));
    var w = x1 - x0, h = y1 - y0; if (w <= 2 || h <= 2) return;
    var src = g.getImageData(x0, y0, w, h), sd = new Uint32Array(src.data.buffer), out = g.createImageData(w, h), od = new Uint32Array(out.data.buffer), E2 = Math.pow(rb * 1.9, 2), rip = V.reduced ? 0 : 1;
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      var dx = x + x0 + .5 - cx, dy = y + y0 + .5 - cy, r = Math.sqrt(dx * dx + dy * dy) + 1e-3, oi = y * w + x;
      if (r > R) { od[oi] = sd[oi]; continue; }
      var rs = r - E2 / r; rs += rip * Math.sin(r * .35 - t * 7) * 1.4 * Math.max(0, 1 - (r - rb) / (rb * 1.6));
      var k = rs / r, sx = Math.round(cx + dx * k - x0 - .5), sy = Math.round(cy + dy * k - y0 - .5);
      if (sx < 0 || sy < 0 || sx >= w || sy >= h) { od[oi] = sd[oi]; continue; }
      od[oi] = sd[sy * w + sx];
    }
    g.putImageData(out, x0, y0); BX.stats.px += w * h;
  }
  function disk(g, cx, cy, rb, t, mega) {
    /* one pass over the visible window; mega renders in 2x2 cells */
    var W = V.W, H = V.H, q = mega ? 2 : 1, R = rb * 2.8, x0 = Math.max(0, Math.floor(cx - R)), y0 = Math.max(0, Math.floor(cy - R * .9)), x1 = Math.min(W, Math.ceil(cx + R)), y1 = Math.min(H, Math.ceil(cy + R * .9));
    var w = x1 - x0, h = y1 - y0; if (w <= 0 || h <= 0) return;
    var B = getBuf(Math.ceil(w / q), Math.ceil(h / q)), bw = B.w, bh = B.h, img = B.cv.g.createImageData(bw, bh), u = new Uint32Array(img.data.buffer);
    var spin = t * (V.reduced ? .15 : .42), tilt = mega ? .3 : .34, rin = rb * 1.15, rout = rb * 2.6, rl = rb * 1.45;
    for (var j = 0; j < bh; j++) for (var i = 0; i < bw; i++) {
      var px = x0 + i * q + q * .5, py = y0 + j * q + q * .5, dx = px - cx, dy = py - cy, r = Math.sqrt(dx * dx + dy * dy), front = dy > 0;
      var ry = dy / tilt, rr = Math.sqrt(dx * dx + ry * ry), val = 0, inD = rr >= rin && rr <= rout;
      if (inD) {
        var k = (rr - rin) / (rout - rin), ang = Math.atan2(ry, dx), diff = spin * (2.6 / (k + .25));
        var arm = .5 + .5 * Math.sin(ang * 3 - diff + k * 10), band = .5 + .5 * Math.sin(k * 26 - spin * 3), fine = V.noise2(ang * 4 + diff * .6, k * 11, 5);
        val = Math.pow(1 - k, 1.1) * (.45 + .35 * arm + .2 * band) * (.7 + .6 * fine) * (1.15 + .55 * -dx / rout) * 1.35; /* doppler: approaching side brighter */
      }
      var lensv = 0, rd = Math.abs(r - rl) / (rb * .38);
      if (rd < 1 && r > rb && !front) lensv = Math.pow(1 - rd, 1.3) * (.6 + .3 * Math.sin(Math.atan2(dy, dx) * 3 - spin * 2)) * 1.1; /* far disk bent over the top */
      if (rd < 1 && r > rb && front) lensv = Math.pow(1 - rd, 2) * .45;
      var oi = j * bw + i;
      if (r < rb) { if (front && inD && dy > rb * .3) { } else { u[oi] = BLACK; continue; } }
      if (!front && inD && r < rb * 1.02) val = 0;
      var best = Math.max(val, lensv);
      if (r >= rb && r < rb + (mega ? 2.5 : 1.3)) best = Math.max(best, .9 + .1 * Math.sin(Math.atan2(dy, dx) * 2 + spin * 4)); /* photon ring */
      if (best < .05) continue;
      var lv = best * 8, li = lv | 0; if (lv - li > V.bayer(i, j)) li++; if (best < .14 && V.bayer(i + 2, j) > best * 7) continue; if (li < 1) continue;
      u[oi] = HEATU[Math.min(8, li)];
    }
    B.cv.g.putImageData(img, 0, 0);
    var sm = g.imageSmoothingEnabled; g.imageSmoothingEnabled = false; g.drawImage(B.cv, 0, 0, bw, bh, x0, y0, bw * q, bh * q); g.imageSmoothingEnabled = sm; BX.stats.px += bw * bh;
  }
  function jets(g, cx, cy, rb, t, mega) {
    var L = rb * (mega ? 5 : 6.5), n = Math.round(L * 1.6), cols = ['#ffffff', '#9af0ff', '#7affe8', '#c45af0'];
    for (var sgn = -1; sgn <= 1; sgn += 2) for (var i = 0; i < n; i++) {
      var k = i / n, y = cy + sgn * (rb * .9 + k * L), spread = 1 + k * rb * .45, knot = .5 + .5 * Math.sin(k * 30 - t * 9), a = (1 - k) * (.55 + .45 * knot);
      var xx = cx + Math.round((V.noise2(k * 6, t * 2 + sgn, 2) - .5) * spread * 2); if (V.bayer(xx, Math.round(y)) > a) continue;
      g.fillStyle = cols[Math.min(3, Math.floor(k * 4 + (1 - knot) * .8))]; g.fillRect(Math.round(xx), Math.round(y), mega ? 2 : 1, 1);
    }
  }
  function drawParts(g, b, s, cx, cy, rb, t) {
    var tilt = b.mega ? .3 : .34, W = V.W, H = V.H;
    for (var i = 0; i < s.parts.length; i++) {
      var p = s.parts[i], ca = Math.cos(p.phi), sa = Math.sin(p.phi), x = cx + ca * p.rho, y = cy + sa * p.rho * (p.halo ? .9 : tilt) + p.z * rb;
      if (x < -2 || y < -2 || x > W + 2 || y > H + 2) continue;
      var behind = !p.halo && sa < 0 && Math.hypot(x - cx, y - cy) < rb * 1.05; if (behind) continue;
      var k = clamp((p.rho - rb) / (rb * 3.5), 0, 1), ci = p.hot ? 8 - Math.floor(k * 3) : Math.round(7 - k * 5); g.fillStyle = V.rgb ? '#fff' : '#fff'; g.fillStyle = '#' + hexOf(Math.max(2, Math.min(8, ci)));
      /* tangential streak + radial stretch near the horizon (spaghettification) */
      var len = Math.min(6, 1 + Math.round((1 - k) * 4)), tx = -sa, ty = ca * (p.halo ? .9 : tilt);
      for (var l = 0; l < len; l++) g.fillRect(Math.round(x - tx * l), Math.round(y - ty * l), 1, 1);
      if (p.rho < rb * 1.9) { var st = Math.round((1.9 - p.rho / rb) * 6); for (l = 1; l <= st; l++) { var q = 1 - l * .06; g.fillRect(Math.round(cx + ca * p.rho * q), Math.round(cy + sa * p.rho * q * (p.halo ? .9 : tilt)), 1, 1); } }
    }
    for (i = 0; i < s.deb.length; i++) { var d = s.deb[i], dx = Math.round(cx + Math.cos(d.phi) * d.rho), dy = Math.round(cy + Math.sin(d.phi) * d.rho * tilt), str = Math.max(0, Math.round((3 - d.rho / rb) * 2));
      g.fillStyle = '#8a82a0'; g.fillRect(dx - (d.sz >> 1), dy - (d.sz >> 1), d.sz + str, d.sz); g.fillStyle = '#c8c0d8'; g.fillRect(dx - (d.sz >> 1), dy - (d.sz >> 1), 1, 1); if (str) { g.fillStyle = '#ff9a50'; g.fillRect(dx + d.sz, dy, str, 1); } }
  }
  var HX = HEAT.map(function (c) { return c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); });
  function hexOf(i) { return HX[i]; }
  function waves(g, s, cx, cy, rb, mega) {
    var W = V.W, H = V.H;
    for (var i = 0; i < s.waves.length; i++) {
      var w = s.waves[i], R = rb * 1.6 + w * rb * (mega ? 3 : 2.6), a = 1 - w / (mega ? 5 : 3.6), n = Math.min(600, Math.round(R * 3));
      g.fillStyle = a > .6 ? '#c45af0' : '#4f1680';
      for (var k = 0; k < n; k++) { if (V.bayer(k, i * 3) > a * .7) continue; var an = k / n * TAU, x = Math.round(cx + Math.cos(an) * R), y = Math.round(cy + Math.sin(an) * R * .85); if (x >= 0 && y >= 0 && x < W && y < H) g.fillRect(x, y, 1, 1); }
    }
  }
  BX.draw = function (g, b, sx, sy, rb, t) {
    var s = state(b), dt = clamp(V.time - s.lt, 0, .05); s.lt = V.time; if (dt > 0) step(b, s, rb, dt);
    var mega = !!b.mega, R = rb * 6; if (sx + R < 0 || sy + R < 0 || sx - R > V.W || sy - R > V.H) return;
    BX.stats.px = 0;
    waves(g, s, sx, sy, rb, mega);
    lens(g, sx, sy, rb, t, mega);
    jets(g, sx, sy, rb, t, mega);
    disk(g, sx, sy, rb, t, mega);
    drawParts(g, b, s, sx, sy, rb, t);
  };
  var body0 = P.drawBody;
  P.drawBody = function (ctx, b, sx, sy, r, t, L) { if (b && b.isBH && BX.on && V.game.state === 'space') return BX.draw(ctx, b, sx, sy, r, t); return body0.apply(this, arguments); };

  /* ---------- near the horizon: pull, ship stretch, chromatic shift, shake, rumble, the maw's event ---------- */
  BX.near = null;
  function nearest() { var Sp = V.space, sh = Sp.ship, best = null, bd = 1e18; (Sp.near || []).forEach(function (b) { if (!b.isBH) return; var d = Math.hypot(b.x - sh.x, b.y - sh.y) / b.r; if (d < bd) { bd = d; best = b; } }); var m = BX.megaBody; if (m) { var dm = Math.hypot(m.x - sh.x, m.y - sh.y) / m.r; if (dm < bd) { bd = dm; best = m; } } return best ? { b: best, k: bd } : null; }
  var Sp = V.space, upd0 = Sp.update;
  Sp.update = function (dt) {
    var sh = Sp.ship;
    if (Sp.mode === 'fly') {
      /* the maw is felt from far away: a gentle pull within ~120 sectors */
      var mx = MEGA.x - sh.x, my = MEGA.y - sh.y, md = Math.hypot(mx, my) || 1, FAR = G.CELL * 120;
      if (md < FAR) { var a = 18 * Math.pow(1 - md / FAR, 2) + (md < G.CELL * 3 ? 120 * (1 - md / (G.CELL * 3)) : 0); if (Pg.has('deflector')) a *= .5; sh.vx += mx / md * a * dt; sh.vy += my / md * a * dt; }
      var mb = BX.megaBodyGet && md < G.CELL * 2 ? BX.megaBodyGet() : null;
      if (mb && md < MEGA.r * 2.4 && (Pg.shipStage ? Pg.shipStage() : 0) < 3 && !Pg.cheat.god && !BX.repT) { BX.repT = 2; sh.vx = -mx / md * 700; sh.vy = -my / md * 700; V.game.toast('TIDES TOO STRONG', 'NEEDS A CAPITAL SHIP'); if (V.sfx) V.sfx('warn', { gap: 0 }); V.shake = V.reduced ? 0 : 2; }
      else if (mb && md < MEGA.r * .95) { horizon(); }
    }
    if (BX.repT > 0) BX.repT = Math.max(0, BX.repT - dt);
    upd0(dt);
    var n = nearest(); BX.near = n;
    if (n && n.k < 8 && V.sfx) V.sfx.loop('deep', Math.min(1, (n.b.mega ? 1.4 : 1) * (1 - n.k / 8)));
    if (n && n.k < 2.6 && !V.reduced && Sp.mode === 'fly') V.shake = Math.max(V.shake || 0, (2.6 - n.k) * (n.b.mega ? .9 : .5));
  };
  function horizon() {
    var sh = Sp.ship, first = !Pg.story.mega; Pg.story.mega = true;
    if (V.sfx) { V.sfx('rumble', { gap: 0 }); V.sfx('arrive', { gap: 0 }); }
    Sp.flash = 1; Sp.flashCol = '#ffffff';
    ['essence', 'crystal', 'tech'].forEach(function (k, i) { Pg.gain(k, [60, 40, 40][i]); });
    if (first) { var s = Pg.shipStage(); if (s < 4) Pg.unlock(['frigate', 'cruiser', 'capital', 'mothership'][s]); Pg.unlock('warp3'); }
    /* thrown out of a white hole back home */
    sh.x = 0; sh.y = -3400; sh.vx = 0; sh.vy = -240; sh.ang = -Math.PI / 2; V.game.toast('THROUGH THE MAW', first ? 'A NEW HULL AND HALO' : 'WHITE HOLE');
    BX.whiteT = 3; if (V.save) V.save.write();
  }
  BX.horizon = horizon;
  /* ship stretch toward the hole + chromatic fringe, drawn by space.js right after the ship */
  BX.shipFx = function (g, f, sx, sy, c) {
    var n = BX.near; if (!n || n.k > 3.2 || V.space.mode !== 'fly') return; var sh = V.space.ship, b = n.b, dx = b.x - sh.x, dy = b.y - sh.y, d = Math.hypot(dx, dy) || 1, k = clamp((3.2 - n.k) / 2.2, 0, 1), m = Math.round(k * (b.mega ? 9 : 6));
    for (var i = 1; i <= m; i++) { if (V.bayer(i, V.frame) > 1 - i / (m + 2)) continue; g.drawImage(f, Math.round(sx - c + dx / d * i), Math.round(sy - c + dy / d * i)); }
    BX.chroma = k;
  };
  /* chromatic shift of the whole frame near a horizon (red one cell right, blue one cell left) */
  var draw0 = Sp.draw;
  Sp.draw = function (g, dt) {
    BX.chroma = 0; draw0(g, dt); var t = V.time;
    if (Pg.story && Pg.story.mega && V.space.mode !== 'transit') { var sh = Sp.ship, sx = V.W >> 1, sy = V.H >> 1, cx = Math.round(sh.x - Sp.cam.x + V.W / 2), cy = Math.round(sh.y - Sp.cam.y + V.H / 2), s = Pg.shipStage(), rr = (s ? V.spr.stageC(s) : V.spr.SHIP_C) + 6, n = Math.round(rr * 6);
      for (var i = 0; i < n; i++) { if (V.bayer(i, Math.floor(t * 5)) < .5) continue; var a = i / n * TAU + t; g.fillStyle = i % 3 ? '#c45af0' : '#ffe0a0'; g.fillRect(Math.round(cx + Math.cos(a) * rr), Math.round(cy + Math.sin(a) * rr * .4), 1, 1); } }
    if (BX.whiteT > 0) { BX.whiteT -= dt || 1 / 60; V.dissolve(g, clamp(BX.whiteT / 3, 0, 1) * .9, '#ffffff'); }
    var k = BX.chroma; if (!(k > .15) || V.reduced || Sp.mapOpen) return;
    var W = V.W, H = V.H, img = g.getImageData(0, 0, W, H), d = img.data, o = g.createImageData(W, H), od = o.data, sh2 = Math.max(1, Math.round(k * 2));
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var i2 = (y * W + x) * 4, xr = Math.max(0, x - sh2), xb = Math.min(W - 1, x + sh2); od[i2] = d[(y * W + xr) * 4]; od[i2 + 1] = d[i2 + 1]; od[i2 + 2] = d[(y * W + xb) * 4 + 2]; od[i2 + 3] = 255; }
    g.putImageData(o, 0, 0);
  };
  /* ---------- map landmark + tooltip + teleport ---------- */
  BX.mapMark = function (g, s, cands, toScreen) {
    var p = toScreen(MEGA.x, MEGA.y, s), r = Math.max(5, Math.round(MEGA.r / s)), W = V.W, H = V.H, t = V.time;
    if (p[0] < -60 || p[1] < -60 || p[0] > W + 60 || p[1] > H + 60) return;
    var R = Math.max(22, Math.min(60, Math.round(MEGA.r * 2.6 / s)));
    for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) { var d = Math.hypot(x, y / .5); if (d > R) continue; var k = d / R, an = Math.atan2(y / .5, x), v = (1 - k) * (.55 + .45 * Math.sin(an * 2 - t * 1.2 + k * 8)); if (d < R * .34) { g.fillStyle = '#000000'; } else { if (V.bayer(p[0] + x, p[1] + y) > v) continue; g.fillStyle = v > .5 ? '#ffd0a0' : v > .3 ? '#c45af0' : '#4f1680'; } g.fillRect(p[0] + x, p[1] + y, 1, 1); }
    g.fillStyle = '#ffffff'; for (var a = 0; a < 24; a++) { var aa = a / 24 * TAU; g.fillRect(Math.round(p[0] + Math.cos(aa) * R * .36), Math.round(p[1] + Math.sin(aa) * R * .36), 1, 1); }
    cands.push({ x: MEGA.x, y: MEGA.y, sx: p[0], sy: p[1], kind: 'mega', known: true });
  };
  BX.tip = function (c) {
    var sh = V.space.ship, d = Math.hypot(MEGA.x - sh.x, MEGA.y - sh.y) / G.CELL, can = Pg.has('galaxy') || Pg.has('warp3');
    return { t: 'The Maw', d: 'The mega black hole at the heart of the galaxy. Its pull is felt from far away.', s: (d < 1 ? 'Here' : d.toFixed(0) + ' sectors away'), sc: can ? 'go' : 'bad',
      n: [can ? 'Click, then Jump.' : 'Needs Galaxy Jump or Warp Core III.', 'Only a capital ship or bigger survives the tides.', Pg.story && Pg.story.mega ? 'You have been through it.' : 'Something waits past the horizon.'] };
  };
  BX.teleport = function () { var g = V.game; V.surface.leave(); g.state = 'space'; V.space.enter({ pos: { x: MEGA.x + MEGA.r * 3.3, y: MEGA.y - MEGA.r * .4, ang: Math.PI } }); if (V.ui) V.ui.setState('space'); Pg.story.warped = true; g.toast('THE MAW', 'GALACTIC CORE'); if (V.sfx) V.sfx('rumble'); };
})();
