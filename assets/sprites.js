/* The Void — procedural pixel-art sprite toolkit: painter, astronaut, ships, critters. All art is generated in code. */
(function () {
  'use strict';
  var V = window.VOID, TAU = V.TAU, S = V.spr = {};
  var pkc = {};
  function pk(c) { if (typeof c === 'number') return c; var k = pkc[c]; if (k !== undefined) return k; var a = V.hex(c); return (pkc[c] = (0xff000000 | (a[2] << 16) | (a[1] << 8) | a[0]) >>> 0); }
  S.pk = pk;
  function Paint(w, h) { this.w = w; this.h = h; this.cv = V.mk(w, h); this.img = this.cv.g.createImageData(w, h); this.u = new Uint32Array(this.img.data.buffer); }
  Paint.prototype = {
    set: function (x, y, c) { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h || c == null) return; this.u[y * this.w + x] = pk(c); },
    get: function (x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? 0 : this.u[y * this.w + x]; },
    rect: function (x, y, w, h, c) { for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.set(x + i, y + j, c); },
    ell: function (cx, cy, rx, ry, fn) { var x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry); for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) { var dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) { var c = typeof fn === 'function' ? fn(dx, dy, x, y) : fn; if (c != null) this.set(x, y, c); } } },
    line: function (x0, y0, x1, y1, c) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); var dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, e = dx + dy; for (;;) { this.set(x0, y0, c); if (x0 === x1 && y0 === y1) break; var e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } },
    poly: function (pts, fn) { var minY = 1e9, maxY = -1e9, i; for (i = 0; i < pts.length; i++) { minY = Math.min(minY, pts[i][1]); maxY = Math.max(maxY, pts[i][1]); } for (var y = Math.floor(minY); y <= Math.ceil(maxY); y++) { var xs = [], yy = y + .5; for (i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) xs.push(a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0])); } xs.sort(function (p, q) { return p - q; }); for (i = 0; i + 1 < xs.length; i += 2) for (var x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) { var c = typeof fn === 'function' ? fn(x, y) : fn; if (c != null) this.set(x, y, c); } } },
    done: function () { this.cv.g.putImageData(this.img, 0, 0); return this.cv; }
  };
  S.Paint = Paint;
  /* dithered tone pick: pal = array of hex dark→light, v in 0..1 */
  S.tone = function (pal, v, x, y) { var n = pal.length - 1, t = V.clamp(v, 0, 1) * n, i = Math.floor(t); if (i >= n) return pal[n]; return (t - i) > V.bayer(x, y) ? pal[i + 1] : pal[i]; };
  /* shaded ball */
  S.ball = function (p, cx, cy, r, pal, lx, ly, rx) { lx = lx == null ? -.5 : lx; ly = ly == null ? -.6 : ly; p.ell(cx, cy, rx || r, r, function (dx, dy, x, y) { var z = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy)), v = (dx * lx + dy * ly + z * .7) * .75 + .22; return S.tone(pal, v, x, y); }); };

  /* ---------- astronaut: 9x13, facing right, frames built from a torso + animated legs ---------- */
  var TORSO = ['...hhhh..', '..hhhhhh.', '..hhVVWh.', '.phhVVVVh', '.phhVVVVh', '.pghhhhg.', '.ppsssdd.', '.ppsaasdd', '.ppsssdd.', '..ssssdd.'];
  var ACOL = { h: '#f4f6ff', g: '#a9b2d4', V: '#2b1b5e', W: '#8fe7ff', p: '#8892b8', s: '#e3e8fa', d: '#9aa4c8', a: '#c04df0', b: '#4a4f80', f: '#d7dcf2', e: '#6b7096' };
  S.astronaut = function (suit) {
    suit = suit || ''; var on = function (i) { return suit[i] === '1'; }, AC = ACOL;
    /* suit upgrades change the look: 0 jetpack 1 visor 2 heat 3 cold 4 oxygen 5 grapple 6 multitool 7 translator */
    if (suit) { AC = Object.assign({}, ACOL); if (on(1)) { AC.V = '#6a3a08'; AC.W = '#ffd040'; } if (on(2)) { AC.s = '#f6dccb'; AC.d = '#d0806a'; AC.a = '#ff7a30'; } if (on(3)) { AC.d = '#6a8ad8'; AC.g = '#c8e0ff'; AC.a = on(2) ? '#ff7a30' : '#4ad0ff'; } if (on(0)) { AC.p = '#6a7098'; } }
    var fr = {}, specs = { idle: [[3, 0, 5, 0], 0], idle2: [[3, 0, 5, 0], 1], w0: [[2, 0, 6, 0], 0], w1: [[3, 0, 5, 0], -1], w2: [[4, 0, 4, 0], 0], w3: [[3, 0, 5, 0], -1], jump: [[2, -1, 6, -2], 0], fall: [[2, 0, 6, 0], 0] };
    function leg(p, x, y0, len, col, boot) { p.rect(x, y0, 2, len, col); p.rect(x - (boot ? 0 : 0), y0 + len, 3, 1, ACOL.b); }
    Object.keys(specs).forEach(function (k) {
      var p = new Paint(11, 15), ox = 1, bob = k === 'idle2' ? 1 : (k === 'w1' || k === 'w3' ? 1 : 0), i;
      for (var j = 0; j < TORSO.length; j++) for (i = 0; i < 9; i++) { var ch = TORSO[j][i]; if (ch !== '.') p.set(ox + i, 1 + j + (k === 'idle2' ? 0 : 0) + (bob && k !== 'idle2' ? 0 : 0), AC[ch]); }
      if (suit) { if (on(0)) { p.rect(0, 5, 2, 5, '#4a4f80'); p.set(0, 5, '#8892b8'); p.set(0, 10, '#ff9030'); p.set(1, 10, '#ffd060'); } if (on(4)) { p.set(1, 3, '#7affe8'); p.set(1, 4, '#3ab0c8'); } if (on(7)) { p.set(6, 0, '#a9b2d4'); p.set(6, -1 + 1, '#a9b2d4'); p.set(7, 0, '#ff4a6a'); } if (on(5)) { p.set(10, 8, '#c8c8d8'); p.set(10, 7, '#8a8aa8'); } if (on(6)) { p.set(10, 9, '#7affa8'); } if (on(2) || on(3)) { p.set(3, 7, AC.a); p.set(8, 7, AC.a); } }
      var s = specs[k][0], ly = 11 + (k === 'idle2' ? 0 : 0), bl = 3;
      var bx = s[0] + ox, fx = s[2] + ox;
      if (k === 'w0') { p.rect(bx - 1, ly, 2, 2, ACOL.e); p.rect(bx - 2, ly + 2, 2, 1, ACOL.e); p.rect(bx - 3, ly + 3, 3, 1, ACOL.b); p.rect(fx, ly, 2, 3, ACOL.f); p.rect(fx, ly + 3, 3, 1, ACOL.b); }
      else if (k === 'w2') { p.rect(bx + 1, ly, 2, 2, ACOL.e); p.rect(bx + 2, ly + 2, 2, 1, ACOL.e); p.rect(bx + 2, ly + 3, 3, 1, ACOL.b); p.rect(fx - 2, ly, 2, 3, ACOL.f); p.rect(fx - 3, ly + 3, 3, 1, ACOL.b); }
      else if (k === 'jump') { p.rect(bx, ly, 2, 2, ACOL.e); p.rect(bx - 1, ly + 2, 3, 1, ACOL.b); p.rect(fx, ly, 2, 2, ACOL.f); p.rect(fx, ly + 2, 3, 1, ACOL.b); }
      else if (k === 'fall') { p.rect(bx - 1, ly, 2, 3, ACOL.e); p.rect(bx - 1, ly + 3, 3, 1, ACOL.b); p.rect(fx + 1, ly, 2, 3, ACOL.f); p.rect(fx + 1, ly + 3, 3, 1, ACOL.b); }
      else { p.rect(bx, ly, 2, 3, ACOL.e); p.rect(bx - 1, ly + 3, 3, 1, ACOL.b); p.rect(fx, ly, 2, 3, ACOL.f); p.rect(fx, ly + 3, 3, 1, ACOL.b); }
      fr[k] = p.done();
    });
    return fr;
  };
  S.astro = null; var suitCache = {};
  S.suitFrames = function (key) { return suitCache[key] || (suitCache[key] = S.astronaut(key)); };

  /* ---------- the ship (space view): pre-rotated frames sampled from one shape, so every frame is crisp pixel art ---------- */
  var SHIP_N = 32, SHIP_R = 10;
  /* tiers: 0 scout, 1 side pods, 2 warp ring, 3 gold long-wing, 4 crystal */
  function shipPix(u, v, tier) {
    tier = tier || 0; var av0 = Math.abs(v);
    if (tier >= 2 && u > -6.6 && u < -5.2 && av0 > 2.2 && av0 < 4.4) return av0 > 3.6 ? '#7affe8' : '#c04df0';                    /* warp ring */
    if (tier >= 1 && u > -3.5 && u < 2.5 && av0 > 2.6 && av0 < 3.8) return u > 1.5 ? (tier >= 4 ? '#ffffff' : '#7affe8') : (tier >= 3 ? '#e8b440' : '#8a82b8'); /* side pods */
    if (tier >= 3) { var wu = u + .5, wing2 = wu < 0 && wu > -5.5 && av0 > 3.6 && av0 < 7.6 && av0 < (wu + 6.4) * 1.3 + 1; if (wing2) return tier >= 4 ? (av0 > 6.6 ? '#ffffff' : (v < 0 ? '#c8f8ff' : '#7ac8ff')) : (av0 > 6.6 ? '#fff0a0' : '#e8b440'); }
    var c = shipPix0(u * (tier >= 1 ? .92 : 1), v); if (!c || tier < 4) return c;
    return { '#bff4ff': '#ffffff', '#6fd0f0': '#ff8ae8', '#c04df0': '#ffffff', '#9a8ac8': '#9af0ff', '#6b5c9a': '#4ab0e0', '#4a3d78': '#2a5a9a', '#c9c2ea': '#d8fbff', '#8a82b8': '#8ad8f0', '#efeaff': '#ffffff', '#b3abd8': '#a8e8ff' }[c] || c;
  }
  function shipPix0(u, v) { /* u forward, v right ; returns hex or null */
    var au = u, av = Math.abs(v), hw;
    if (au > 6.5 || au < -5.5) return null;
    hw = au > 2 ? (6.5 - au) * .72 : au > -2 ? 2.1 : au > -4 ? 2.5 : 1.8;
    var inW = av <= hw;
    var wing = (au < 1 && au > -5.5) ? (av <= (1 - au) * 1.0 + .5 && av <= 6 && av > 1.5 && av < (au + 5.8) * 1.1 + 1) : false;
    if (!inW && !wing) return null;
    if (inW && au > 1 && au < 3.6 && av < 1.1) return v < 0 ? '#bff4ff' : '#6fd0f0';
    if (wing && !inW) return av > 4.7 ? '#c04df0' : (v < 0 ? '#9a8ac8' : '#6b5c9a');
    if (au < -4.2) return '#4a3d78';
    if (av > 1.6) return v < 0 ? '#c9c2ea' : '#8a82b8';
    return v < 0 ? '#efeaff' : '#b3abd8';
  }
  S.ship = function (tier) {
    var fr = [], c = SHIP_R;
    for (var f = 0; f < SHIP_N; f++) {
      var a = f / SHIP_N * TAU, ca = Math.cos(a), sa = Math.sin(a), p = new Paint(c * 2 + 1, c * 2 + 1);
      for (var y = 0; y < p.h; y++) for (var x = 0; x < p.w; x++) { var dx = x + .5 - (c + .5), dy = y + .5 - (c + .5), u = dx * ca + dy * sa, v = -dx * sa + dy * ca; p.set(x, y, shipPix(u, v, tier)); }
      fr.push(p.done());
    }
    return fr;
  };
  var tierFrames = {};
  S.shipFrame = function (ang, tier) { var f = Math.round(((ang % TAU + TAU) % TAU) / TAU * SHIP_N) % SHIP_N; tier = tier || 0; var set = tier ? (tierFrames[tier] || (tierFrames[tier] = S.ship(tier))) : S.shipFrames; return set[f]; };
  S.SHIP_C = SHIP_R;
  /* ship on the ground (side view): closed / open hatch */
  var landC = {};
  S.landedShip = function (open, tier) {
    tier = tier || 0; var key = (open ? 1 : 0) + ':' + tier; if (landC[key]) return landC[key];
    var p = new Paint(34, 20), HULL = tier >= 4 ? ['#2a5a9a', '#7ac8f0', '#c8f8ff', '#ffffff'] : ['#4a3d78', '#8a82b8', '#c9c2ea', '#f4f0ff'];
    /* legs */
    p.line(9, 14, 5, 19, '#6b5c9a'); p.line(25, 14, 29, 19, '#6b5c9a'); p.line(17, 15, 17, 19, '#6b5c9a'); p.rect(3, 19, 5, 1, '#4a3d78'); p.rect(27, 19, 5, 1, '#4a3d78'); p.rect(15, 19, 5, 1, '#4a3d78');
    /* hull */
    p.ell(17, 9, 15, 7, function (dx, dy, x, y) { var v = (1 - dy) * .45 + (-dx) * .25 + .2; return S.tone(HULL, v, x, y); });
    p.rect(3, 9, 28, 1, '#c04df0'); p.rect(4, 11, 26, 1, '#7a2ea8');
    /* fins */
    p.poly([[2, 8], [-0, 13], [6, 13]], '#7a2ea8'); p.poly([[31, 8], [34, 13], [28, 13]], '#7a2ea8');
    /* cockpit dome */
    p.ell(20, 6, 5, 3.5, function (dx, dy, x, y) { return S.tone(['#1f3a7a', '#4a8ad8', '#bff4ff'], (1 - dy) * .5 + (-dx) * .3 + .15, x, y); });
    /* engine */
    p.rect(13, 15, 8, 1, '#4a3d78');
    /* hatch */
    if (open) { p.rect(9, 6, 4, 6, '#120a26'); p.rect(9, 12, 7, 1, '#9a8ac8'); p.line(13, 13, 16, 14, '#9a8ac8'); }
    else { p.rect(9, 6, 4, 6, '#6b5c9a'); p.rect(10, 7, 2, 3, '#4a3d78'); }
    if (tier >= 1) { p.rect(24, 10, 7, 2, '#8a82b8'); p.rect(29, 10, 2, 1, '#7affe8'); p.rect(3, 10, 5, 2, '#8a82b8'); p.set(3, 10, '#7affe8'); }
    if (tier >= 2) { p.ell(1, 9, 1.5, 4.5, function () { return '#c04df0'; }); p.set(1, 5, '#7affe8'); p.set(1, 13, '#7affe8'); p.set(0, 9, '#7affe8'); }
    if (tier >= 3) { p.rect(5, 8, 24, 1, '#e8b440'); p.poly([[24, 6], [33, 3], [31, 7]], '#e8b440'); p.set(32, 3, '#fff0a0'); }
    if (tier >= 4) { p.poly([[14, 2], [17, -1], [19, 2]], '#ff8ae8'); p.set(17, 0, '#ffffff'); p.rect(3, 9, 28, 1, '#ffffff'); }
    return (landC[key] = p.done());
  };
  /* the crashed ship: tilted, scorched, a leg snapped, panels missing */
  var wreckC = null;
  S.wreckShip = function () {
    if (wreckC) return wreckC; var src = S.landedShip(false, 0), sw = src.width, sh = src.height, sd = src.g.getImageData(0, 0, sw, sh).data, W = 40, H = 26, c = V.mk(W, H), g = c.g, img = g.createImageData(W, H), d = img.data, a = -.26, ca = Math.cos(a), sa = Math.sin(a);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var dx = x - W / 2, dy = y - H / 2 - 2, u = Math.round(dx * ca + dy * sa + sw / 2), v = Math.round(-dx * sa + dy * ca + sh / 2); if (u < 0 || v < 0 || u >= sw || v >= sh) continue; var k = (v * sw + u) * 4; if (!sd[k + 3]) continue;
      if (v >= 15 && u > 22) continue; /* snapped legs on the high side */
      var o = (y * W + x) * 4, burn = V.hf(u >> 1, v >> 1, 9) < .35 || (u > 20 && V.hf(u, v, 3) < .5), hole = V.hf(u >> 1, v, 4) > .93 && v > 5 && v < 12;
      var r0 = sd[k], g0 = sd[k + 1], b0 = sd[k + 2]; if (hole) { r0 = 18; g0 = 10; b0 = 34; } else if (burn) { r0 = r0 * .45 + 20; g0 = g0 * .4 + 14; b0 = b0 * .4 + 18; }
      d[o] = r0; d[o + 1] = g0; d[o + 2] = b0; d[o + 3] = 255;
    }
    g.putImageData(img, 0, 0); g.fillStyle = '#ff9030'; g.fillRect(27, 11, 1, 1); g.fillStyle = '#ffd060'; g.fillRect(12, 13, 1, 1);
    return (wreckC = c);
  };

  /* ---------- critters ---------- */
  /* quadruped, 2 walk frames, facing right. o: {len,h,legH,ear,tail,horn,hump,col[]} */
  S.quad = function (r, o) {
    var pal = o.col, L = o.len, H = o.h, lg = o.legH, w = L + 8, hgt = H + lg + 8 + (o.horn || 0) + (o.ear || 0), out = [];
    for (var f = 0; f < 2; f++) {
      var p = new Paint(w, hgt), by = hgt - lg - 1 - H / 2 + 1, bx = 3 + L / 2;
      var legs = [[bx - L * .32, f ? 1 : -1], [bx - L * .32 + 1, f ? -1 : 1], [bx + L * .3, f ? -1 : 1], [bx + L * .3 + 1, f ? 1 : -1]];
      legs.forEach(function (l, i) { var x = Math.round(l[0]), c = i % 2 ? pal[0] : pal[1]; p.rect(x + (l[1] * (lg > 3 ? 1 : 0)), Math.round(by + H / 2 - 1), 1, lg + 1, c); });
      if (o.tail) p.rect(3 - 1, Math.round(by - H / 4), 2, 2, o.tailCol || pal[2]);
      p.ell(bx, by, L / 2, H / 2, function (dx, dy, x, y) { return S.tone(pal, (1 - dy) * .5 + .08 + (o.belly && dy > .4 ? .5 : 0), x, y); });
      if (o.hump) for (var h = 0; h < o.hump; h++) p.ell(bx - L * .15 + h * L * .3, by - H / 2 - .5, 2.2, 2, function (dx, dy, x, y) { return S.tone(pal, (1 - dy) * .5 + .15, x, y); });
      var hx = bx + L / 2 + (o.neck || 0) * .5, hy = by - H / 2 - (o.neck || 0) + 1;
      if (o.neck) p.rect(Math.round(bx + L / 2 - 1), Math.round(hy + 1), 2, o.neck + 1, pal[1]);
      p.ell(hx, hy, 2.6, 2.3, function (dx, dy, x, y) { return S.tone(pal, (1 - dy) * .5 + .2, x, y); });
      p.set(Math.round(hx + 1.2), Math.round(hy - .5), '#10081a'); p.rect(Math.round(hx + 2.2), Math.round(hy), 1, 1, pal[0]);
      for (var e = 0; e < (o.ear ? 1 : 0); e++) { p.rect(Math.round(hx - 1), Math.round(hy - 2 - o.ear), 1, o.ear, pal[1]); p.rect(Math.round(hx), Math.round(hy - 2 - o.ear + 1), 1, o.ear - 1, pal[0]); }
      if (o.horn) { p.line(hx - 1, hy - 2, hx - 2, hy - 2 - o.horn, o.hornCol || '#e8e0d0'); p.line(hx, hy - 2, hx + 1, hy - 2 - o.horn, o.hornCol || '#e8e0d0'); }
      out.push(p.done());
    }
    return out;
  };
  S.bird = function (pal) { var out = []; for (var f = 0; f < 3; f++) { var p = new Paint(9, 7); p.ell(4.5, 3.5, 2.6, 1.6, function (dx, dy, x, y) { return S.tone(pal, (1 - dy) * .5 + .2, x, y); }); p.set(7, 3, pal[1]); p.set(8, 3, '#e8b040'); p.set(6, 2, '#10081a'); if (f === 0) { p.line(3, 3, 1, 0, pal[0]); p.line(4, 3, 3, 0, pal[1]); } else if (f === 1) { p.line(3, 3, 0, 3, pal[0]); p.line(4, 3, 7, 4, pal[1]); } else { p.line(3, 3, 1, 6, pal[0]); p.line(4, 3, 3, 6, pal[1]); } out.push(p.done()); } return out; };
  S.butterfly = function (pal) { var out = []; for (var f = 0; f < 2; f++) { var p = new Paint(5, 5); p.set(2, 1, '#2a1a3a'); p.set(2, 2, '#2a1a3a'); p.set(2, 3, '#2a1a3a'); if (f) { p.rect(0, 0, 2, 2, pal[1]); p.rect(3, 0, 2, 2, pal[1]); p.rect(0, 3, 2, 1, pal[0]); p.rect(3, 3, 2, 1, pal[0]); } else { p.rect(1, 1, 1, 3, pal[1]); p.rect(3, 1, 1, 3, pal[0]); } out.push(p.done()); } return out; };
  S.fish = function (pal, len) { var out = []; len = len || 8; for (var f = 0; f < 2; f++) { var p = new Paint(len + 5, 7); p.ell(len / 2 + 3, 3.5, len / 2, 2.4, function (dx, dy, x, y) { return S.tone(pal, (1 - dy) * .55 + .1 + (dy > .45 ? .4 : 0), x, y); }); p.set(len + 1, 3, '#10081a'); var ty = f ? 1 : -1; p.line(3, 3, 0, 1 + (f ? 0 : 2), pal[1]); p.line(3, 3, 0, 5 - (f ? 0 : 2), pal[1]); p.set(2, 3, pal[1]); out.push(p.done()); } return out; };
  S.jelly = function (pal) { var out = []; for (var f = 0; f < 2; f++) { var p = new Paint(9, 12); p.ell(4.5, 4, 4, 3.4, function (dx, dy, x, y) { return dy > .1 ? null : S.tone(pal, (1 - dy) * .5 + .1, x, y); }); p.rect(1, 4, 7, 1, pal[1]); for (var i = 0; i < 4; i++) { var x = 1 + i * 2; for (var y = 5; y < 11; y++) p.set(x + ((Math.sin(y * 1.3 + i + f * 2) > 0) ? 0 : 1) * (y > 6 ? 1 : 0), y, pal[y > 8 ? 0 : 1]); } out.push(p.done()); } return out; };
  S.bug = function (pal) { var out = []; for (var f = 0; f < 2; f++) { var p = new Paint(9, 7); p.ell(4.5, 3.5, 3.6, 2.8, function (dx, dy, x, y) { return dy > .35 ? null : S.tone(pal, (1 - dy) * .5 + .2, x, y); }); p.rect(1, 4, 7, 1, pal[0]); p.set(7, 3, '#10081a'); for (var l = 0; l < 3; l++) { var x = 2 + l * 2 + (f ? 1 : 0); p.set(x, 5, pal[0]); p.set(x - 1 + (f ? 1 : 0), 6, pal[0]); } out.push(p.done()); } return out; };
  S.penguin = function () { var out = []; for (var f = 0; f < 2; f++) { var p = new Paint(8, 12); p.ell(4, 6, 3, 4.5, function (dx, dy, x, y) { return dx > .1 && dy > -.2 ? '#f4f4ff' : '#26283a'; }); p.ell(4, 2.4, 2.2, 2, '#26283a'); p.set(5, 2, '#fff'); p.rect(6, 3, 2, 1, '#f0a030'); p.rect(2 + (f ? 1 : 0), 10, 2, 1, '#f0a030'); p.rect(4 - (f ? 1 : 0), 10, 2, 1, '#f0a030'); out.push(p.done()); } return out; };
  S.whale = function () { var p = new Paint(52, 22), pal = ['#1a2a4a', '#2c4a7a', '#4a76b0', '#9ac0e8']; p.ell(22, 12, 21, 8, function (dx, dy, x, y) { return S.tone(pal, (1 - dy) * .55 + .08 + (dy > .5 ? .5 : 0), x, y); }); p.poly([[40, 12], [50, 4], [51, 8], [46, 12], [51, 16], [50, 20]], pal[1]); p.set(8, 10, '#06101e'); p.line(14, 15, 20, 19, pal[1]); return p.done(); };
  S.orb = function (col, r) { var p = new Paint(r * 2 + 1, r * 2 + 1); p.ell(r + .5, r + .5, r, r, function (dx, dy, x, y) { return S.tone([col, '#ffffff'], 1 - Math.hypot(dx, dy) * 1.1, x, y); }); return p.done(); };
})();
