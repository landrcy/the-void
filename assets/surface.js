/* The Void — surface worlds: wrap-around side-view planets you explore on foot. Part 1: world generation. */
(function () {
  'use strict';
  var V = window.VOID, S = V.spr, D = V.decor, TAU = V.TAU, Su = V.surface = { worlds: {}, cur: null };
  var CHW = 128, CHTOP = 260, CHBOT = -120, CHH = CHTOP - CHBOT;
  var clamp = V.clamp, smooth = V.smooth, pk = S.pk;
  function wdx(a, b, WW) { var d = (a - b) % WW; if (d > WW / 2) d -= WW; else if (d < -WW / 2) d += WW; return d; }
  Su.wdx = wdx;

  var LQ = {
    water: { key: 'w', spark: '#ffffff', surf: '#c8f0ff', a: '#3a8ae0', b: '#1c58b0', c: '#0f3a80', wave: 1 },
    lava: { key: 'l', spark: '#ffe060', surf: '#fff0a0', a: '#ff8a20', b: '#d04010', c: '#7a1808', wave: .6, glow: '#ff7a20' },
    swamp: { key: 's', spark: '#e0f0b0', surf: '#b8d890', a: '#4a8a58', b: '#2a5a3a', c: '#183a28', wave: .5 }
  };
  Su.LQ = LQ;
  var CLOUDPAL = { mars: ['#a86a44', '#c88a5c', '#e0aa78'], earth: ['#c4d0ea', '#e6ecf8', '#ffffff'], jungle: ['#c8e0d8', '#e8f6ee', '#ffffff'], desert: ['#e8d0b0', '#f8ecd8', '#ffffff'], ice: ['#c0d4f0', '#e4f0ff', '#ffffff'], lava: ['#2a1210', '#4a2018', '#7a3a28'], crystal: ['#9a88d8', '#c8b8f8', '#f0e8ff'], gas: ['#d89850', '#f0b878', '#ffe0b0'], gasB: ['#98b8e8', '#c8e0ff', '#ffffff'], venus: ['#c8a050', '#e8c878', '#f8e8b0'] };

  function hazePal(pal, col, t) { var o = {}; for (var k in pal) { var v = pal[k]; o[k] = Array.isArray(v) ? v.map(function (c) { return V.mixs(c, col, t); }) : (typeof v === 'string' && v[0] === '#' ? V.mixs(v, col, t) : v); } return o; }

  function pickSegs(th, body, r, WW) {
    var segs = [], x = 0, i;
    if (th.seq) { th.seq.forEach(function (s) { segs.push({ id: s[0], x0: x, x1: x + s[1] }); x += s[1]; }); return { segs: segs, WW: x }; }
    var pool = th.pool; if (th.poolB && body.palKey === 'desertB') pool = th.poolB; else if (th.poolC && body.palKey === 'desertC') pool = th.poolC;
    var n = th.tiny ? 1 : clamp(Math.floor(WW / 750), 1, 7), ws = [], tot = 0; for (i = 0; i < n; i++) { ws.push(.7 + r() * .6); tot += ws[i]; }
    var prev = null; for (i = 0; i < n; i++) { var id, tries = 0; do { id = V.pick(r, pool); tries++; } while (id === prev && pool.length > 1 && tries < 6); prev = id; var w = Math.round(WW * ws[i] / tot); segs.push({ id: id, x0: x, x1: x + w }); x += w; }
    segs[n - 1].x1 = WW; return { segs: segs, WW: WW };
  }

  function buildWorld(body) {
    var th = V.themes[body.type] || V.themes.rocky, r = V.rng(V.hash(body.seed | 0, 77, 5)), w = { body: body, th: th, seed: body.seed | 0, id: body.id };
    var WW0 = body.home ? 9000 : clamp(Math.round(TAU * body.r * 30), th.minW || 600, 13000);
    var ps = pickSegs(th, body, r, WW0), segs = ps.segs, WW = ps.WW, n = segs.length, i, x;
    w.WW = WW; w.segs = segs; w.biomes = []; var idx = {};
    segs.forEach(function (sg) { sg.b = V.biomes[sg.id]; sg.w = sg.x1 - sg.x0; if (idx[sg.id] == null) { idx[sg.id] = w.biomes.length; w.biomes.push(sg.b); } sg.bi = idx[sg.id]; });
    w.wl = th.wl != null ? th.wl : -9999; w.liquid = th.liquid || 'water';
    w.g = clamp(560 * Math.sqrt(Math.max(body.r, 4) / 46) * (th.gk || 1), 90, 820); if (th.tiny) w.g = 120 + body.r * 6; if (body.home) w.g = 560;
    w.dayLen = (th.day || 300) * (.9 + r() * .2); w.skyKey = (th.sky === 'desert' && V.Gen.nameOf(body) === 'MARS') ? 'mars' : (th.sky || 'none'); w.sky = V.skies[w.skyKey]; w.airless = !!th.airless; w.tod = body.home ? .37 : .3 + r() * .3; w.seed1 = r() * 1e4 | 0;
    /* heights */
    var N1 = Math.max(3, Math.round(WW / 220)), N2 = Math.max(6, Math.round(WW / 47)), s1 = body.seed & 0xffff, s2 = s1 + 17, s3 = s1 + 41, BW = 130;
    function hseg(sg, xx) {
      var b = sg.b, u = clamp((xx - sg.x0) / sg.w, 0, 1), h = b.base;
      if (b.b1 != null) h += (b.b1 - b.base) * smooth(u); if (b.hump) h += b.hump * Math.pow(Math.sin(Math.PI * u), .9);
      var n1 = V.pnoise1(xx / WW * N1, N1, s1) * 2 - 1, n2 = V.pnoise1(xx / WW * N2, N2, s2) * 2 - 1;
      if (b.ridge) n1 = n1 * (1 - b.ridge) + (1 - 2 * Math.abs(n1)) * b.ridge;
      h += b.amp * n1 + b.amp * b.rough * .3 * n2;
      if (b.dune) { var k = Math.max(1, Math.round(WW / 150)), a = xx / WW * k * TAU + V.pnoise1(xx / WW * N1, N1, s3) * 2.2; h += b.dune * (Math.pow(.5 + .5 * Math.sin(a), 1.6) - .35); }
      return h;
    }
    var gh = new Int16Array(WW), si = 0;
    for (x = 0; x < WW; x++) {
      while (x >= segs[si].x1) si++;
      var sg = segs[si], h = hseg(sg, x), d0 = x - sg.x0, d1 = sg.x1 - x, o, t, xa;
      if (n > 1 || true) {
        if (d0 < BW) { o = segs[(si - 1 + n) % n]; xa = o.x0 > sg.x0 ? x + WW : x; t = smooth(.5 + .5 * d0 / BW); h = hseg(o, xa) * (1 - t) + h * t; }
        else if (d1 < BW) { o = segs[(si + 1) % n]; xa = o.x0 < sg.x0 ? x - WW : x; t = smooth(.5 + .5 * d1 / BW); h = hseg(o, xa) * (1 - t) + h * t; }
      }
      gh[x] = clamp(Math.round(h), -105, 235);
    }
    /* craters */
    segs.forEach(function (sg) { var nc = Math.round(sg.b.craters * sg.w / 1000); for (var c = 0; c < nc; c++) { var cx = sg.x0 + r() * sg.w, rad = 14 + r() * 40, dp = rad * (.2 + r() * .22); for (var dx = -rad * 1.35; dx <= rad * 1.35; dx++) { var xx = ((Math.round(cx + dx) % WW) + WW) % WW, q = dx / rad, v = q * q < 1 ? -dp * (1 - q * q) : 0; v += dp * .45 * Math.exp(-Math.pow((Math.abs(q) - 1.05) * 4, 2)); gh[xx] = clamp(gh[xx] + Math.round(v), -105, 235); } } });
    /* spawn clearing */
    var spawn;
    if (body.home) spawn = 330; else {
      var best = 1e9; spawn = 100; for (var c = 0; c < 28; c++) { var cx = Math.floor(r() * WW), sc = 0, mn = 1e9; for (var dx = -30; dx <= 30; dx += 3) { var hv = gh[(cx + dx + WW) % WW]; sc += Math.abs(hv - gh[cx]); mn = Math.min(mn, hv); } if (mn <= w.wl + 4) sc += 500; if (sc < best) { best = sc; spawn = cx; } }
    }
    w.spawnX = spawn; var gy0 = gh[spawn]; for (var dx = -52; dx <= 52; dx++) { var xx = (spawn + dx + WW) % WW, a = Math.abs(dx), tt = a <= 28 ? 1 : 1 - (a - 28) / 24; tt = smooth(tt); gh[xx] = Math.round(gh[xx] * (1 - tt) + gy0 * tt); }
    if (gy0 <= w.wl + 3) { /* never spawn under liquid: lift the clearing */ var lift = w.wl + 6 - gy0; for (var dx2 = -52; dx2 <= 52; dx2++) { var x2 = (spawn + dx2 + WW) % WW, a2 = Math.abs(dx2); gh[x2] += Math.round(lift * smooth(a2 <= 28 ? 1 : 1 - (a2 - 28) / 24)); } gy0 += lift; }
    w.gh = gh;
    /* biome per column with ragged borders */
    w.bAt = new Uint8Array(WW); si = 0; for (x = 0; x < WW; x++) { var xr = x + Math.round((V.noise2(x * .04, 3.3, s1) - .5) * 44); xr = ((xr % WW) + WW) % WW; var k = 0; while (k < n - 1 && xr >= segs[k].x1) k++; w.bAt[x] = segs[k].bi; }
    /* decor */
    w.items = [];
    segs.forEach(function (sg) {
      var b = sg.b;
      b.decor.forEach(function (d) {
        if (d[1] <= 0) return; var cnt = Math.round(d[1] * sg.w / 100 * (.85 + .3 * r()));
        for (var k = 0; k < cnt; k++) {
          var xx = Math.floor(sg.x0 + r() * sg.w) % WW; if (w.biomes[w.bAt[xx]] !== b) continue; if (Math.abs(wdx(xx, spawn, WW)) < 46) continue;
          var y = gh[xx], uw = !!d[3], under = y < w.wl - 1; if (uw !== under) continue; if (!uw && y < w.wl + 1) continue;
          var steep = Math.abs(gh[(xx + 5) % WW] - gh[(xx - 5 + WW) % WW]); var kk = d[0]; if (steep > 12 && !(kk === 'rock' || kk === 'icespike' || kk === 'crystal' || kk === 'coral' || kk === 'cloudpuff')) continue;
          w.items.push({ x: xx, y: y, kind: kk, z: d[2], seed: Math.floor(r() * 8), bi: sg.bi, b: b });
        }
      });
    });
    if (body.home) {
      var shore = segs.filter(function (s) { return s.id === 'shore'; })[0], ru = segs.filter(function (s) { return s.id === 'ruins'; })[0], mt = segs.filter(function (s) { return s.id === 'mountains'; })[0];
      w.items.push({ x: shore.x0 + 160, y: gh[shore.x0 + 160], kind: 'lighthouse', z: 1, seed: 0, bi: shore.bi, b: shore.b });
      w.items.push({ x: Math.round(ru.x0 + ru.w * .55), y: gh[Math.round(ru.x0 + ru.w * .55)], kind: 'monolith', z: 1, seed: 1, bi: ru.bi, b: ru.b, scan: 'monolith' });
    } else if (body.type === 'ruins' || body.type === 'station' || body.type === 'wreck') { var mx = (spawn + 260) % WW; w.items.push({ x: mx, y: gh[mx], kind: 'monolith', z: 1, seed: 2, bi: w.bAt[mx], b: w.biomes[w.bAt[mx]], scan: 'monolith' }); }
    w.items.sort(function (p, q) { return p.x - q.x; });
    /* critters */
    w.critters = []; var CR = Su.CR;
    segs.forEach(function (sg) { sg.b.critters.forEach(function (c) { var def = CR[c[0]]; if (!def) return; var cnt = Math.round(c[1] * sg.w / 1000 * (.7 + .6 * r())); for (var k = 0; k < cnt; k++) { var xx = Math.floor(sg.x0 + 40 + r() * (sg.w - 80)) % WW, y = gh[xx], under = y < w.wl - 6; if ((def.mode === 'swim' || def.swimOnly) ? !under : (under && def.mode !== 'float')) continue; if (w.biomes[w.bAt[xx]] !== sg.b) continue; w.critters.push({ type: c[0], def: def, x: xx, y: y, seg: sg, dir: r() < .5 ? -1 : 1, t: r() * 9, st: 0, ph: r() * 9, v: Math.floor(r() * 3), alt: 24 + r() * 80, scanned: false, id: body.id + '#' + c[0] + k + '@' + xx }); } }); });
    /* clouds */
    w.clouds = []; if (!w.airless && CLOUDPAL[w.skyKey]) { var cn = w.skyKey === 'gas' || w.skyKey === 'gasB' ? 12 : 9; for (i = 0; i < cn; i++) w.clouds.push({ x: r() * 900, y: .04 + r() * .4, k: Math.floor(r() * 6), sp: 2 + r() * 5, sc: r() }); }
    w.chunks = []; w.layers = []; w.weatherT = 20 + r() * 40; w.wx = { on: 0, amt: 0, type: null };
    w.rare = { t: 25 + r() * 30, ev: null };
    return w;
  }
  Su.getWorld = function (body) { var w = Su.worlds[body.id]; if (!w) w = Su.worlds[body.id] = buildWorld(body); return w; };

  /* ---------- ground chunks ---------- */
  function ints(a) { return a.map(pk); }
  function genChunk(w, ci) {
    var x0 = ci * CHW, cw = Math.min(CHW, w.WW - x0), cv = V.mk(cw, CHH), g = cv.g, img = g.createImageData(cw, CHH), u = new Uint32Array(img.data.buffer), s = w.seed1;
    for (var i = 0; i < cw; i++) {
      var x = x0 + i, gy = w.gh[x], b = w.biomes[w.bAt[x]]; if (!b._i) { b._i = { top: ints(b.top), soil: ints(b.soil), snow: ints(['#8aa0c8', '#c8d8f0', '#ffffff', '#ffffff']) }; }
      var top = b._i.top, soil = b._i.soil, jTop = Math.min(CHH, CHTOP - gy);
      var snowy = b.snow && gy > b.snow + (V.noise2(x * .05, 1, s) - .5) * 22;
      for (var j = Math.max(0, jTop); j < CHH; j++) {
        var wy = CHTOP - j, d = gy - wy, v, c;
        if (d < b.topT + (V.noise2(x * .2, 4, s) > .6 ? 1 : 0)) { var tn = V.noise2(x * .12, wy * .3, s + 3); v = .95 - d / (b.topT + 1) * .55 + (tn - .5) * .5; if (d === 0) v = 1; c = tone(snowy ? b._i.snow : top, v, x, wy); }
        else {
          var fn = V.noise2(x * .07, wy * .09, s + 7) * .6 + V.noise2(x * .22, wy * .25, s + 9) * .4; v = .66 - Math.min(d, 200) / 200 * .38 + (fn - .5) * 1.0;
          if (((Math.floor(wy / 8 + V.noise2(x * .02, 3, s) * 4)) & 3) === 0) v -= .13;
          if (wy < -50) v *= 1 - clamp((-wy - 50) / 190, 0, .5);
          c = tone(snowy && d < 6 + (V.noise2(x * .1, wy * .1, s) * 6) ? b._i.snow : soil, v, x, wy);
        }
        u[j * cw + i] = c;
      }
    }
    g.putImageData(img, 0, 0); return cv;
  }
  function tone(arr, v, x, y) { var n = arr.length - 1, t = clamp(v, 0, 1) * n, i = t | 0; if (i >= n) return arr[n]; return (t - i) > V.bayer(x, y) ? arr[i + 1] : arr[i]; }
  Su.chunk = function (w, ci) { return w.chunks[ci] || (w.chunks[ci] = genChunk(w, ci)); };

  /* ---------- far parallax layers (each one wraps seamlessly) ---------- */
  var LAYER = [{ f: .1, h: 120, lift: 46 }, { f: .24, h: 128, lift: 28 }, { f: .46, h: 110, lift: 10 }];
  function buildLayer(w, li) {
    var L = LAYER[li], WW = w.WW, LW = Math.max(64, Math.round(WW * L.f)), LH = L.h, zero = LH - 34, cv = V.mk(LW, LH), g = cv.g, img = g.createImageData(LW, LH), u = new Uint32Array(img.data.buffer), s = w.seed1 + li * 31, per = Math.max(2, Math.round(LW / (70 + li * 25)));
    var lens = [.92, 1, 1.05], HA = new Float32Array(LW), CA = [], ZA = [], TA = [], BA = [];
    for (var x = 0; x < LW; x++) {
      var wx = Math.floor(x / L.f) % WW, b = w.biomes[w.bAt[wx]], type = b.skyline || 'hills', h;
      var n1 = V.pfbm1(x / LW * per, per, s, 3), n2 = V.pnoise1(x / LW * per * 3, per * 3, s + 5);
      switch (type) {
        case 'city': case 'ruin': { var blk = Math.floor(x / (7 + li * 3)), hh = V.hf(blk, s, li); h = (type === 'city' ? 16 : 10) + hh * hh * (type === 'city' ? 64 : 44) * (li === 2 ? .6 : 1) + (type === 'ruin' ? V.hf(x >> 2, s) * 8 : 0); if (V.hf(blk, s, 9) < .25) h *= .55; break; }
        case 'mesa': h = Math.round((8 + n1 * 50 + (n2 > .6 ? 20 : 0)) / 8) * 8 * (li === 2 ? .6 : 1) + 6; break;
        case 'sea': h = n1 > .82 ? (n1 - .8) * 170 : 2; break;
        case 'moon': h = 6 + n1 * 38 + Math.abs(n2 - .5) * 20; break;
        case 'ice': h = 8 + n1 * 50 + (1 - Math.abs(n2 * 2 - 1)) * 16; break;
        case 'volc': h = 6 + n1 * 30 + Math.max(0, 1 - Math.abs(((x * 1.3) % 90) - 45) / 22) * 34 * (n2 > .45 ? 1 : .3); break;
        case 'crystal': h = 8 + n1 * 28 + (V.hf(x >> 2, s, 3) > .55 ? V.hf(x >> 2, s, 4) * 30 : 0); break;
        case 'cloud': h = 6 + n1 * 34 + Math.abs(Math.sin(x * .16) * 8); break;
        case 'girder': h = (x % 22 < 4 ? 70 : 8) + (x % 66 < 8 ? 20 : 0); break;
        default: h = 10 + n1 * (li === 0 ? 62 : li === 1 ? 48 : 34) + (n2 - .5) * 10;
      }
      if (b.id === 'mountains' || b.id === 'glacier') h = h * 1.5 + 10;
      HA[x] = h; CA[x] = V.hex(b.far[li]); ZA[x] = V.hex(b.haze); TA[x] = type; BA[x] = b;
    }
    /* soften the borders between biomes: blend height and colour over a window */
    var R = 44 + li * 12, H2 = new Float32Array(LW), C2 = [], Z2 = [];
    for (x = 0; x < LW; x++) {
      var bl = BA[(x - R + LW) % LW], br = BA[(x + R) % LW];
      if (bl === BA[x] && br === BA[x]) { H2[x] = HA[x]; C2[x] = CA[x]; Z2[x] = ZA[x]; continue; }
      var sh = 0, sw = 0, cc0 = [0, 0, 0], zz0 = [0, 0, 0];
      for (var k = -R; k <= R; k++) { var xi = (x + k + LW) % LW, wk = 1 - Math.abs(k) / (R + 1); sh += HA[xi] * wk; sw += wk; for (var q = 0; q < 3; q++) { cc0[q] += CA[xi][q] * wk; zz0[q] += ZA[xi][q] * wk; } }
      var own = (TA[x] === 'city' || TA[x] === 'ruin' || TA[x] === 'girder') ? .55 : 0;
      H2[x] = HA[x] * own + (sh / sw) * (1 - own); C2[x] = [cc0[0] / sw, cc0[1] / sw, cc0[2] / sw]; Z2[x] = [zz0[0] / sw, zz0[1] / sw, zz0[2] / sw];
    }
    for (x = 0; x < LW; x++) {
      var b = BA[x], type = TA[x], col = C2[x], hz = Z2[x], h = clamp(Math.round(H2[x] * lens[li]), 3, zero - 1), top = zero - h;
      for (var y = top; y < LH; y++) {
        var d = y - top, v = .62 - d * .0045 + (V.hf(x, y, s) - .5) * .12 - (li * .04);
        if (d === 0 && type !== 'sea') v += .22; var kk = clamp(.82 + (v - .5) * .7, .5, 1.25), cc = [col[0] * kk | 0, col[1] * kk | 0, col[2] * kk | 0];
        if ((type === 'city' || type === 'ruin') && d > 3 && (x % 3 === 1) && (d % 5 === 2) && V.hf(x, y, s + 1) > (type === 'ruin' ? .8 : .45)) cc = type === 'city' ? [255, 226, 150] : [30, 28, 46];
        if (d > 0 && d < 3 && (b.id === 'mountains' || b.id === 'tundra' || b.id === 'glacier' || b.id === 'iceplain')) cc = [235, 242, 255];
        var mixk = clamp(d / (LH - top) * .6, 0, .5); if (mixk > V.bayer(x, y)) cc = [(cc[0] + hz[0]) / 2 | 0, (cc[1] + hz[1]) / 2 | 0, (cc[2] + hz[2]) / 2 | 0];
        u[y * LW + x] = 0xff000000 | (Math.min(255, cc[2]) << 16) | (Math.min(255, cc[1]) << 8) | Math.min(255, cc[0]);
      }
    }
    g.putImageData(img, 0, 0); cv.zero = zero; cv.LW = LW; return cv;
  }
  Su.layer = function (w, li) { return w.layers[li] || (w.layers[li] = buildLayer(w, li)); };

  var cloudCache = {};
  Su.cloudSprite = function (key, k) {
    var ck = key + k, c = cloudCache[ck]; if (c) return c; var pal = CLOUDPAL[key] || CLOUDPAL.earth, r = V.rng(k * 97 + 5), W = 40 + Math.floor(r() * 50), H = 14 + Math.floor(r() * 10), p = new S.Paint(W, H), n = 4 + Math.floor(r() * 4);
    for (var i = 0; i < n; i++) { var cx = W * (.18 + .64 * (i / (n - 1))), rx = W * (.14 + r() * .1), ry = H * (.3 + r() * .22); p.ell(cx, H * .62 - r() * H * .15, rx, ry, function (dx, dy, x, y) { return S.tone(pal, (1 - dy) * .55 + .25 - (y > H * .7 ? .25 : 0), x, y); }); }
    for (var x = 0; x < W; x++) { for (var y = Math.floor(H * .82); y < H; y++) { p.u[y * W + x] = 0; } }
    return (cloudCache[ck] = p.done());
  };
})();
