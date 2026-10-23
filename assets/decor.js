/* The Void — procedural decor sprites for surface worlds (trees, rocks, crystals, ruins, buildings...). Anchor = bottom centre. */
(function () {
  'use strict';
  var V = window.VOID, S = V.spr, Paint = S.Paint, tone = S.tone, D = V.decor = {};
  function R(r, a, b) { return a + r() * (b - a); }
  function ri(r, a, b) { return Math.floor(R(r, a, b + 1)); }
  function lerpP(a, b, t) { return t; }
  /* helpers */
  function ball(p, cx, cy, r, pal, ry) { S.ball(p, cx, cy, r, pal, -.5, -.65, null); if (ry) { } }
  function leafBlob(p, cx, cy, rx, ry, pal) { p.ell(cx, cy, rx, ry, function (dx, dy, x, y) { var v = (1 - dy) * .45 + (-dx) * .22 + .2; return tone(pal, v, x, y); }); }
  function speck(p, r, n, x0, y0, x1, y1, col, mask) { for (var i = 0; i < n; i++) { var x = ri(r, x0, x1), y = ri(r, y0, y1); if (p.get(x, y) !== 0) p.set(x, y, col); } }

  var G = {};
  G.oak = function (r, pal) {
    var H = ri(r, 20, 32), W = ri(r, 22, 32), p = new Paint(W, H + 4), cx = W / 2, tw = ri(r, 3, 4), th = ri(r, 9, 14);
    for (var y = 0; y < th; y++) for (var x = 0; x < tw + (y > th - 3 ? 1 : 0); x++) p.set(cx - tw / 2 + x - (y > th - 3 ? .5 : 0), H + 3 - y, tone(pal.trunk, .8 - x / tw * .7, x, y));
    p.line(cx, H - th + 4, cx - 4, H - th - 1, pal.trunk[1]); p.line(cx, H - th + 4, cx + 4, H - th - 1, pal.trunk[0]);
    var n = ri(r, 4, 6); for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2 + R(r, 0, 1), d = i === 0 ? 0 : R(r, W * .12, W * .26); leafBlob(p, cx + Math.cos(a) * d, (H - th) * .55 + Math.sin(a) * d * .6 + 3, R(r, W * .22, W * .32), R(r, W * .2, W * .28), pal.leaf); }
    speck(p, r, 14, 2, 2, W - 3, H - th, pal.leaf[3]); speck(p, r, 8, 2, 2, W - 3, H - th, pal.leaf[0]);
    if (pal.fruit) for (i = 0; i < 4; i++) { var fx = ri(r, 5, W - 6), fy = ri(r, 4, H - th); if (p.get(fx, fy)) p.set(fx, fy, pal.fruit); }
    return { c: p.done() };
  };
  G.pine = function (r, pal) {
    var H = ri(r, 22, 40), W = Math.round(H * R(r, .5, .62)) | 1, p = new Paint(W, H), cx = (W - 1) / 2, tiers = ri(r, 4, 6), tH = H / tiers;
    for (var y = 0; y < H - 3; y++) { var t = y / (H - 3), tier = Math.floor(y / tH), ty = (y - tier * tH) / tH, hw = (.18 + ty * .82) * cx * (.3 + .7 * (tier + 1) / tiers) + .6;
      for (var x = Math.round(cx - hw); x <= Math.round(cx + hw); x++) { var v = .5 - (x - cx) / (cx + 1) * .5 + (ty < .22 ? .12 : 0) - ty * .15; var c = tone(pal.leaf, v, x, y); if (pal.snow && ty < .38 && Math.abs(x - cx) < hw - .5 + (1 - ty)) c = tone(pal.snow, .6 - (x - cx) / (cx + 1) * .25 + (1 - ty) * .3, x, y); p.set(x, y, c); } }
    p.rect(Math.round(cx), H - 3, 2, 3, pal.trunk[1]);
    return { c: p.done() };
  };
  G.palm = function (r, pal) {
    var H = ri(r, 26, 36), W = 36, p = new Paint(W, H + 4), lean = R(r, -5, 5), bx = W / 2 - lean * .4, pts = [];
    for (var i = 0; i <= H - 4; i++) { var t = i / (H - 4), x = bx + lean * t * t * 1.4, y = H + 3 - i; pts.push([x, y]); p.set(x, y, pal.trunk[i % 4 < 2 ? 1 : 0]); p.set(x + 1, y, pal.trunk[i % 4 < 2 ? 2 : 1]); }
    var top = pts[pts.length - 1], n = 7; for (i = 0; i < n; i++) { var a = (i / n) * Math.PI - Math.PI, len = R(r, 9, 13), ex = top[0] + Math.cos(a) * len, ey = top[1] + Math.sin(a) * len * .35 + len * .45 * Math.abs(Math.cos(a));
      var mx = (top[0] + ex) / 2, my = Math.min(top[1], ey) - 3 - R(r, 0, 2); for (var s = 0; s <= 18; s++) { var u = s / 18, xx = (1 - u) * (1 - u) * top[0] + 2 * u * (1 - u) * mx + u * u * ex, yy = (1 - u) * (1 - u) * top[1] + 2 * u * (1 - u) * my + u * u * ey; p.set(xx, yy, pal.leaf[2 - (s % 5 === 0 ? 1 : 0)]); p.set(xx, yy + 1, pal.leaf[1]); if (s % 3 === 0) p.set(xx, yy + 2, pal.leaf[0]); } }
    p.rect(Math.round(top[0]) - 1, Math.round(top[1]), 3, 2, '#7a5030');
    return { c: p.done() };
  };
  G.cactus = function (r, pal) {
    var H = ri(r, 16, 28), W = 18, p = new Paint(W, H), cx = 9, w = 4, cols = pal.leaf;
    function stem(x, y0, y1, wd) { for (var y = y0; y <= y1; y++) for (var i = 0; i < wd; i++) p.set(x + i, y, tone(cols, .85 - i / wd * .7 + (i === 1 && y % 3 === 0 ? -.05 : 0), x + i, y)); p.set(x + 1, y0 - 1, cols[2]); p.set(x + wd - 2, y0 - 1, cols[1]); }
    stem(cx - 2, 2, H - 1, w); p.rect(cx - 1, 1, 2, 1, cols[2]);
    var arms = ri(r, 1, 2); for (var a = 0; a < arms; a++) { var side = a ? 1 : -1, ay = ri(r, H * .4, H * .7), len = ri(r, 4, 6); var ax = side < 0 ? cx - 2 - len : cx + 2; for (var i = 0; i < len; i++) p.rect(side < 0 ? cx - 2 - i - 1 : cx + 2 + i, ay + (i === len - 1 ? 0 : 0), 1, 3, cols[side < 0 ? 2 : 1]); stem(side < 0 ? cx - 2 - len - 1 : cx + 2 + len - 1, ay - ri(r, 4, 7), ay + 2, 3); }
    if (pal.flower && r() < .7) p.rect(cx - 1, 0, 2, 1, pal.flower);
    return { c: p.done() };
  };
  G.bush = function (r, pal) { var W = ri(r, 10, 16), H = ri(r, 7, 10), p = new Paint(W, H); for (var i = 0; i < 3; i++) leafBlob(p, W * (.28 + i * .22), H * .6, W * .3, H * .42, pal.leaf); speck(p, r, 6, 1, 1, W - 2, H - 2, pal.leaf[3]); if (pal.berry) for (i = 0; i < 3; i++) { var x = ri(r, 2, W - 3), y = ri(r, 2, H - 3); if (p.get(x, y)) p.set(x, y, pal.berry); } return { c: p.done() }; };
  G.tuft = function (r, pal) {
    var W = 9, H = ri(r, 5, 9), out = [], blades = [], i; for (i = 0; i < 6; i++) blades.push([ri(r, 1, W - 2), ri(r, 3, H), ri(r, -1, 1)]);
    for (var f = 0; f < 2; f++) { var p = new Paint(W, H + 1); blades.forEach(function (b) { for (var y = 0; y < b[1]; y++) { var sway = (y > b[1] * .5 ? (f ? 1 : -1) * (b[2] || 1) : 0); p.set(b[0] + sway, H - y, pal.grass[Math.min(2, 1 + (y > b[1] * .6 ? 1 : 0))]); } }); out.push(p.done()); }
    return { c: out[0], frames: out };
  };
  G.flowers = function (r, pal) {
    var W = 11, H = ri(r, 7, 11), out = [], fl = [], i, cols = pal.flowers || ['#ff7ab0', '#ffe27a', '#fff', '#b07aff']; var col = cols[ri(r, 0, cols.length - 1)];
    for (i = 0; i < 3; i++) fl.push([ri(r, 2, W - 3), ri(r, 4, H), cols[ri(r, 0, cols.length - 1)]]);
    for (var f = 0; f < 2; f++) { var p = new Paint(W, H + 1); fl.forEach(function (b) { var x = b[0] + (f ? 1 : 0); for (var y = 0; y < b[1]; y++) p.set(b[0] + (y > b[1] * .6 ? (f ? 1 : 0) : 0), H - y, pal.grass[1]); p.set(x, H - b[1], b[2]); p.set(x - 1, H - b[1], b[2]); p.set(x + 1, H - b[1], b[2]); p.set(x, H - b[1] - 1, b[2]); p.set(x, H - b[1] + 1, '#ffe27a'); }); out.push(p.done()); }
    return { c: out[0], frames: out };
  };
  G.rock = function (r, pal) {
    var W = ri(r, 9, 22), H = ri(r, 6, Math.min(W, 15)), p = new Paint(W, H), pts = [], n = ri(r, 6, 9), i;
    for (i = 0; i < n; i++) { var a = i / n * Math.PI * 2, rr = R(r, .75, 1); pts.push([W / 2 + Math.cos(a) * W / 2 * rr, H * .72 + Math.sin(a) * H * .62 * rr]); }
    p.poly(pts, function (x, y) { var v = (1 - y / H) * .55 + (1 - x / W) * .3 + (V.noise2(x * .5, y * .5, 4) - .5) * .5; return tone(pal.rock, v, x, y); });
    for (i = 0; i < 3; i++) { var x0 = ri(r, 2, W - 3), y0 = ri(r, 1, H - 2); p.line(x0, y0, x0 + ri(r, -2, 2), y0 + ri(r, 1, 3), pal.rock[0]); }
    return { c: p.done() };
  };
  G.fungus = function (r, pal) {
    var H = ri(r, 22, 34), W = ri(r, 20, 28), p = new Paint(W, H), cx = W / 2, cr = pal.cap || ['#5a1a6a', '#a03ac0', '#e070e8', '#ffc0ff'], sh = ri(r, 10, 15);
    for (var y = 0; y < sh; y++) for (var x = -2; x <= 2; x++) p.set(cx + x, H - 1 - y, tone(pal.stem || ['#8a7aa0', '#c8b8d8', '#f0e8ff'], .85 - (x + 2) / 5 * .7, x, y));
    var capH = H - sh + 2; p.ell(cx, capH - 1, W * .48, capH * .8, function (dx, dy, x, y) { return dy > .25 ? null : tone(cr, (1 - dy) * .5 + (-dx) * .2 + .12, x, y); });
    p.rect(Math.round(cx - W * .45), capH - 1, Math.round(W * .9), 2, cr[0]);
    for (var i = 0; i < 6; i++) { var x2 = ri(r, 3, W - 4), y2 = ri(r, 2, capH - 3); if (p.get(x2, y2)) { p.set(x2, y2, cr[3]); p.set(x2 + 1, y2, cr[3]); } }
    return { c: p.done(), glow: [[cx, capH, cr[2], 16]] };
  };
  G.smallmush = function (r, pal) { var W = 7, H = 7, p = new Paint(W, H), cr = pal.cap || ['#7a2a2a', '#e05050', '#ff9a9a']; p.rect(3, 3, 2, 4, '#e8e0d0'); p.ell(3.5, 3, 3.4, 2.6, function (dx, dy, x, y) { return dy > .3 ? null : tone(cr, (1 - dy) * .5 + .2, x, y); }); p.set(2, 1, '#fff'); p.set(5, 2, '#fff'); return { c: p.done() }; };
  G.crystal = function (r, pal) {
    var W = ri(r, 14, 26), H = ri(r, 14, 30), p = new Paint(W, H), cols = pal.crystal || ['#2a1a6a', '#6a4ae0', '#a89aff', '#e8e0ff'], n = ri(r, 3, 5), glow = [];
    for (var i = 0; i < n; i++) { var bx = W * (.15 + .7 * (i / (n - 1 || 1))), h = H * R(r, .45, 1) * (i % 2 ? .75 : 1), w = R(r, 2.5, 4.2), lean = R(r, -3, 3);
      p.poly([[bx - w, H], [bx - w * .8 + lean * .4, H - h * .7], [bx + lean, H - h], [bx + w * .8 + lean * .4, H - h * .7], [bx + w, H]], function (x, y) { var u = (x - (bx - w)) / (w * 2); return u < .45 ? cols[2] : u < .75 ? cols[1] : cols[0]; });
      p.line(bx + lean, H - h, bx - w * .8 + lean * .4, H - h * .7, cols[3]); p.line(bx + lean, H - h, bx + lean * .6 - .5, H - 2, cols[3]);
      glow.push([bx + lean, H - h * .6, cols[2], 12]); }
    return { c: p.done(), glow: glow.slice(0, 2) };
  };
  G.alienplant = function (r, pal) {
    var H = ri(r, 16, 30), W = 20, p = new Paint(W, H), cols = pal.alien || ['#1a4a5a', '#2aa0a0', '#7affe0'], bulb = pal.bulb || '#b8ffe8', x = 10, lean = R(r, -4, 4), tip;
    for (var i = 0; i < H - 4; i++) { var t = i / (H - 4), xx = x + lean * t * t * 2; p.set(xx, H - 1 - i, cols[1]); p.set(xx + 1, H - 1 - i, cols[0]); if (i % 6 === 3) { var dir = (i % 12 < 6) ? -1 : 1; p.line(xx, H - 1 - i, xx + dir * 4, H - 1 - i - 2, cols[2]); p.line(xx + dir * 4, H - 1 - i - 2, xx + dir * 5, H - 1 - i + 1, cols[1]); } tip = [xx, H - 1 - i]; }
    p.ell(tip[0] + .5, tip[1] - 1, 3, 3, function (dx, dy, x2, y2) { return tone([cols[1], bulb, '#ffffff'], (1 - dy) * .5 + .2, x2, y2); });
    return { c: p.done(), glow: [[tip[0], tip[1], bulb, 16]] };
  };
  G.fern = function (r, pal) { var W = 16, H = 12, p = new Paint(W, H); for (var i = 0; i < 6; i++) { var a = -Math.PI + (i / 5) * Math.PI, len = R(r, 6, 9); for (var s = 0; s <= len; s++) { var u = s / len, x = 8 + Math.cos(a) * s, y = H - 2 + Math.sin(a) * s * .9 + u * u * 4 * Math.abs(Math.cos(a)); p.set(x, y, pal.leaf[s % 3 === 0 ? 2 : 1]); if (s % 2 === 0) p.set(x, y + 1, pal.leaf[0]); } } return { c: p.done() }; };
  G.jtree = function (r, pal) {
    var H = ri(r, 40, 58), W = 34, p = new Paint(W, H), cx = 17, tw = 5, i;
    for (var y = 0; y < H - 10; y++) { var w = tw + (y < 6 ? 2 - (y > 3 ? 1 : 0) : 0); for (var x = 0; x < w; x++) p.set(cx - w / 2 + x, H - 1 - y, tone(pal.trunk, .9 - x / w * .8 + (V.noise2(x, y * .3, 3) - .5) * .3, x, y)); }
    for (i = 0; i < 5; i++) leafBlob(p, cx + (i - 2) * 6.5, 8 + (i % 2) * 3, 8, 5.5, pal.leaf);
    leafBlob(p, cx, 6, 12, 5, pal.leaf);
    speck(p, r, 20, 2, 1, W - 3, 14, pal.leaf[3]);
    for (i = 0; i < 7; i++) { var vx = ri(r, 5, W - 6), vl = ri(r, 8, 24); for (var y2 = 10; y2 < 10 + vl; y2++) p.set(vx + (y2 % 7 === 0 ? 1 : 0), y2, pal.leaf[y2 % 5 === 0 ? 2 : 1]); }
    return { c: p.done() };
  };
  G.deadtree = function (r, pal) { var H = ri(r, 18, 30), W = 26, p = new Paint(W, H), cols = pal.trunk; function br(x, y, a, len, w) { for (var i = 0; i < len; i++) { x += Math.cos(a); y += Math.sin(a); p.set(x, y, cols[1]); if (w > 1) p.set(x + 1, y, cols[0]); if (i > len * .4 && r() < .12 && w > 0) br(x, y, a + R(r, -1, 1), len * .5, 0); } } for (var y = 0; y < H * .6; y++) { p.set(13, H - 1 - y, cols[1]); p.set(14, H - 1 - y, cols[0]); p.set(12, H - 1 - y, cols[2]); } br(13, H * .4, -Math.PI / 2 - .6, H * .4, 1); br(13, H * .45, -Math.PI / 2 + .7, H * .35, 1); br(13, H * .3, -Math.PI / 2 - 1.2, H * .25, 1); return { c: p.done() }; };
  G.icespike = function (r, pal) { var W = ri(r, 10, 20), H = ri(r, 14, 30), p = new Paint(W, H), cols = pal.ice || ['#3a6aa0', '#7ab8e8', '#c8ecff', '#ffffff'], n = ri(r, 2, 4); for (var i = 0; i < n; i++) { var bx = W * (.2 + .6 * (i / (n - 1 || 1))), h = H * R(r, .5, 1), w = R(r, 2, 3.5); p.poly([[bx - w, H], [bx + R(r, -1, 1), H - h], [bx + w, H]], function (x, y) { return x < bx - .5 ? cols[2] : x < bx + w * .4 ? cols[1] : cols[0]; }); p.set(bx - 1, H - h + 2, cols[3]); } return { c: p.done(), glow: [[W / 2, H * .6, cols[1], 10]] }; };
  G.pillar = function (r, pal) { var W = ri(r, 8, 11), H = ri(r, 18, 34), p = new Paint(W, H), c = pal.stone || ['#3a3548', '#6a6478', '#a49cb4', '#d4cce0']; for (var y = 0; y < H; y++) for (var x = 1; x < W - 1; x++) { var broken = y < 4 ? ((x + y * 2) % 3 === 0 ? 1 : 0) : 0; if (!broken) p.set(x, y, tone(c, .95 - (x - 1) / (W - 2) * .85 + (y % 7 === 0 ? -.15 : 0), x, y)); } p.rect(0, H - 3, W, 3, c[1]); p.rect(0, H - 1, W, 1, c[0]); p.rect(0, 4, W, 1, c[2]); if (pal.moss) speck(p, r, 8, 1, 4, W - 2, H - 2, pal.moss); return { c: p.done() }; };
  G.arch = function (r, pal) { var W = ri(r, 26, 34), H = ri(r, 24, 32), p = new Paint(W, H), c = pal.stone || ['#3a3548', '#6a6478', '#a49cb4', '#d4cce0']; for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var dx = (x + .5 - W / 2) / (W / 2), dy = (y + .5 - H * .45) / (H * .45), outer = (y < H * .45 ? dx * dx + dy * dy <= 1 : Math.abs(dx) <= 1), inner = (y < H * .45 ? dx * dx + dy * dy <= .5 : Math.abs(dx) <= .7); if (outer && !inner && !(y < 5 && (x * 7 + y) % 5 === 0)) p.set(x, y, tone(c, .9 - (x / W) * .6 - (y / H) * .15 + (V.noise2(x * .4, y * .4, 2) - .5) * .4, x, y)); } if (pal.moss) speck(p, r, 12, 0, 0, W - 1, H - 1, pal.moss); return { c: p.done() }; };
  G.wall = function (r, pal) { var W = ri(r, 20, 40), H = ri(r, 10, 18), p = new Paint(W, H), c = pal.stone || ['#3a3548', '#6a6478', '#a49cb4', '#d4cce0']; for (var x = 0; x < W; x++) { var h = H - Math.floor(Math.abs(Math.sin(x * .3 + r() * .5)) * 5 + (r() < .1 ? 4 : 0)); for (var y = H - h; y < H; y++) p.set(x, y, tone(c, .9 - (y - (H - h)) / h * .45 - ((x + (((y >> 2) & 1) * 3)) % 6 === 0 ? .3 : 0), x, y)); } if (pal.moss) speck(p, r, 10, 0, 0, W - 1, H - 1, pal.moss); return { c: p.done() }; };
  G.ruinTower = function (r, pal) { var W = ri(r, 16, 24), H = ri(r, 40, 80), p = new Paint(W, H), c = pal.concrete || ['#2a2838', '#4a4860', '#6a6882', '#8a88a2']; for (var x = 0; x < W; x++) { var top = Math.floor(R(r, 0, 12) * (x > W * .6 ? 2 : 1) + (x % 5 === 0 ? 3 : 0)); for (var y = top; y < H; y++) { var win = (x % 4 === 1 || x % 4 === 2) && (y % 6 === 2 || y % 6 === 3) && x > 1 && x < W - 2 && y > top + 2; p.set(x, y, win ? (r() < .2 ? '#0a0818' : c[0]) : tone(c, .85 - (x / W) * .5 - (y / H) * .1, x, y)); } } if (pal.moss) { speck(p, r, 16, 0, 10, W - 1, H - 1, pal.moss); for (var i = 0; i < 4; i++) { var vx = ri(r, 1, W - 2), vl = ri(r, 4, 14); for (var y2 = 8; y2 < 8 + vl; y2++) if (p.get(vx, y2)) p.set(vx, y2, pal.moss); } } return { c: p.done() }; };
  G.building = function (r, pal) { var W = ri(r, 14, 24), H = ri(r, 34, 90), p = new Paint(W, H), c = pal.concrete || ['#1a1a30', '#2a2a48', '#3a3a5e', '#5a5a80'], glow = [], cols = pal.neon || ['#ff3ac0', '#3ae0ff', '#ffe03a']; for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) { var win = x % 3 === 1 && y % 4 === 1 && x > 0 && x < W - 1 && y > 2 && y < H - 3; p.set(x, y, win ? (r() < .55 ? '#ffe9a0' : '#1a1830') : tone(c, .8 - x / W * .55, x, y)); } p.rect(0, 0, W, 1, c[3]); if (r() < .5) p.rect(W / 2, -0, 1, 1, '#f33'); var ncol = cols[ri(r, 0, cols.length - 1)]; if (r() < .7) { var sy = ri(r, 8, H - 14); p.rect(2, sy, W - 4, 2, ncol); glow.push([W / 2, sy + 1, ncol, 14]); } for (var i = 0; i < 3; i++) glow.push([ri(r, 2, W - 3), ri(r, 4, H - 4), '#ffd070', 4]); return { c: p.done(), glow: glow, winGlow: true }; };
  G.lamp = function (r, pal) { var H = 22, p = new Paint(9, H); p.rect(4, 4, 1, H - 4, '#3a3a52'); p.rect(2, H - 1, 5, 1, '#3a3a52'); p.rect(2, 2, 5, 2, '#4a4a66'); p.rect(3, 4, 3, 1, '#ffeaa0'); p.rect(3, 1, 3, 1, '#6a6a8a'); return { c: p.done(), glow: [[4, 4, '#ffd88a', 22]] }; };
  G.car = function (r, pal) { var p = new Paint(22, 9), body = ['#5a2a2a', '#a04a3a', '#d87a5a']; var c = ri(r, 0, 2); var cols = [['#2a3a5a', '#4a6aa0', '#7aa0e0'], ['#5a2a2a', '#a04a3a', '#d87a5a'], ['#3a4a3a', '#6a8a5a', '#a0c088']][c]; p.rect(1, 3, 20, 4, cols[1]); p.rect(1, 3, 20, 1, cols[2]); p.rect(5, 0, 11, 4, cols[1]); p.rect(6, 1, 4, 2, '#1a1a30'); p.rect(11, 1, 4, 2, '#1a1a30'); p.rect(3, 6, 4, 3, '#1a1a22'); p.rect(15, 6, 4, 3, '#1a1a22'); if (pal.rust) speck(p, r, 8, 1, 3, 20, 6, '#7a4a2a'); return { c: p.done() }; };
  G.dish = function (r, pal) { var p = new Paint(18, 24); p.rect(8, 10, 2, 14, '#6a6a82'); p.ell(9, 7, 8, 7, function (dx, dy, x, y) { return dy > .1 ? null : tone(['#4a4a62', '#8a8aa4', '#d0d0e0'], (1 - dy) * .5 + (-dx) * .2 + .1, x, y); }); p.line(9, 7, 13, 1, '#6a6a82'); p.set(13, 0, '#ff5050'); return { c: p.done() }; };
  G.monolith = function (r, pal) { var H = ri(r, 36, 48), p = new Paint(14, H); for (var y = 0; y < H; y++) for (var x = 2; x < 12; x++) p.set(x, y, x === 2 ? '#4a4a6a' : (x === 11 ? '#0a0a12' : '#0e0e18')); p.rect(2, 0, 10, 1, '#5a5a7a'); return { c: p.done(), glow: [[7, H / 2, '#8a7aff', 16]] }; };
  G.bones = function (r, pal) { var W = ri(r, 24, 36), H = ri(r, 12, 18), p = new Paint(W, H), n = ri(r, 4, 6); p.rect(0, H - 2, W, 2, '#d8d0b8'); for (var i = 0; i < n; i++) { var x = 4 + i * (W - 8) / (n - 1); for (var y = 0; y < H - 2; y++) { var t = y / (H - 2), xx = x + Math.sin(t * 3) * 0; var half = Math.sin((1 - t) * Math.PI * .5) * 0; p.set(x + (t < .4 ? 0 : 0) - Math.round((1 - t) * (1 - t) * 2), H - 3 - y, y % 2 ? '#f0e8d0' : '#d8d0b8'); } } return { c: p.done() }; };
  G.boat = function (r, pal) { var p = new Paint(24, 24), c = ['#3a2a1a', '#7a5a3a', '#b08a5a']; p.poly([[0, 17], [23, 17], [19, 23], [4, 23]], function (x, y) { return tone(c, 1 - (y - 17) / 6 * .8, x, y); }); p.rect(11, 2, 1, 15, '#5a4030'); p.poly([[13, 3], [22, 15], [13, 15]], function (x, y) { return tone(['#c8c8e0', '#f0f0ff'], 1 - (x - 13) / 10, x, y); }); p.poly([[10, 5], [3, 15], [10, 15]], '#d8d8f0'); return { c: p.done() }; };
  G.lighthouse = function (r, pal) { var H = 54, p = new Paint(16, H); for (var y = 6; y < H; y++) { var w = 4 + (y - 6) / 12; for (var x = -w; x <= w; x++) p.set(8 + x, y, ((y >> 2) & 1) ? tone(['#a03030', '#e05050', '#ff9090'], .8 - (x + w) / (2 * w) * .7, x, y) : tone(['#8a8aa0', '#d8d8ea', '#fff'], .8 - (x + w) / (2 * w) * .7, x, y)); } p.rect(3, 4, 10, 2, '#4a4a62'); p.rect(5, 0, 6, 4, '#ffe9a0'); p.rect(4, 0, 8, 1, '#4a4a62'); return { c: p.done(), glow: [[8, 2, '#ffe9a0', 26]], beam: [8, 2] }; };
  G.vent = function (r, pal) { var W = 14, H = 10, p = new Paint(W, H), c = ['#2a1210', '#5a2a1a', '#8a4a2a']; p.poly([[0, H], [4, 2], [W - 4, 2], [W, H]], function (x, y) { return tone(c, 1 - (y / H) * .8 - x / W * .3, x, y); }); p.rect(5, 1, 4, 2, '#ff9a30'); p.rect(6, 1, 2, 1, '#ffe080'); return { c: p.done(), glow: [[7, 1, '#ff7a20', 18]] }; };
  G.metal = function (r, pal) { var W = ri(r, 10, 20), H = ri(r, 8, 18), p = new Paint(W, H), c = ['#2a2a3a', '#4a4a62', '#7a7a96', '#aaaac0']; for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) p.set(x, y, tone(c, .9 - x / W * .5 - y / H * .2 + ((x % 5 === 0 || y % 6 === 0) ? -.35 : 0), x, y)); if (r() < .5) { p.rect(2, 2, 3, 3, '#1a1a28'); p.set(3, 3, '#ff5050'); } return { c: p.done() }; };
  G.cloudpuff = function (r, pal) { var W = ri(r, 24, 50), H = ri(r, 10, 18), p = new Paint(W, H), c = pal.cloud || ['#a06a3a', '#e0a060', '#ffd9a0', '#fff0d8']; for (var i = 0; i < 4; i++) p.ell(W * (.2 + i * .2), H * .7, W * .2, H * .35 + (i % 2) * 2, function (dx, dy, x, y) { return tone(c, (1 - dy) * .5 + .15, x, y); }); return { c: p.done() }; };
  G.tent = G.rock;
  G.stalk = function (r, pal) { var H = ri(r, 24, 44), p = new Paint(12, H), c = pal.alien || ['#3a2a5a', '#7a5aa0', '#c8a0e8']; for (var y = 0; y < H; y++) { var w = Math.max(1, 3 - y * 3 / H); for (var x = 0; x < w + 1; x++) p.set(6 + Math.sin(y * .25) * 2 + x, H - 1 - y, c[1 + (x === 0 ? 1 : 0)]); } return { c: p.done(), glow: [[6, 2, c[2], 10]] }; };


  G.kelp = function (r, pal) { var H = ri(r, 18, 40), p = new Paint(12, H), c = pal.leaf; for (var s = 0; s < ri(r, 1, 3); s++) { var x0 = 3 + s * 3, ph = R(r, 0, 6); for (var y = 0; y < H - s * 4; y++) { var x = x0 + Math.sin(y * .22 + ph) * 2; p.set(x, H - 1 - y, c[y % 7 < 3 ? 1 : 2]); p.set(x + 1, H - 1 - y, c[y % 5 === 0 ? 3 : 1]); if (y % 6 === 3) { p.set(x - 1, H - 1 - y, c[2]); p.set(x + 2, H - 2 - y, c[2]); } } } return { c: p.done() }; };
  G.coral = function (r, pal) { var W = ri(r, 12, 20), H = ri(r, 10, 20), p = new Paint(W, H), c = pal.crystal; function br(x, y, a, len, d) { for (var i = 0; i < len; i++) { x += Math.cos(a) * .9; y += Math.sin(a) * .9; p.set(x, y, c[1 + (i % 3 === 0 ? 1 : 0)]); p.set(x + 1, y, c[0]); if (i === len - 1) { p.set(x, y - 1, c[3]); } if (d < 2 && i > 2 && i % 3 === 0) br(x, y, a + (r() < .5 ? -.7 : .7), len * .6, d + 1); } } for (var i = 0; i < 3; i++) br(W * (.25 + i * .25), H - 1, -Math.PI / 2 + R(r, -.5, .5), H * .6, 0); return { c: p.done(), glow: [[W / 2, H / 2, c[2], 8]] }; };
  var memo = {};
  D.make = function (kind, seed, pal, palKey) {
    var k = kind + '|' + seed + '|' + palKey, m = memo[k]; if (m) return m;
    var gen = G[kind] || G.rock, out = gen(V.rng(seed * 7919 + 13), pal); out.w = out.c.width; out.h = out.c.height; out.kind = kind;
    if (out.glow) out.glowC = out.glow.map(function (g) { return { x: g[0], y: g[1], r: g[3], c: D.glowSprite(g[2], g[3]) }; });
    memo[k] = out; return out;
  };
  var gcache = {};
  /* dithered glow disc (pixel-pure: opaque dither pixels only, no soft alpha) */
  D.glowSprite = function (col, r) {
    var key = col + r, c = gcache[key]; if (c) return c; var p = new Paint(r * 2 + 1, r * 2 + 1), a = V.hex(col);
    for (var y = 0; y < p.h; y++) for (var x = 0; x < p.w; x++) { var d = Math.hypot(x - r, y - r) / r; if (d >= 1) continue; var v = Math.pow(1 - d, 1.7) * .62; if (v > V.bayer(x, y)) p.set(x, y, col); }
    return (gcache[key] = p.done());
  };
  D.kinds = Object.keys(G);
})();
