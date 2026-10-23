/* The Void — surface worlds, part 2: critter catalogue and the renderer. */
(function () {
  'use strict';
  var V = window.VOID, S = V.spr, D = V.decor, P = V.planets, TAU = V.TAU, Su = V.surface, clamp = V.clamp, smooth = V.smooth, wdx = Su.wdx;
  /* ---------- critters ---------- */
  var spriteCache = {};
  function flipped(c) { if (c._f) return c._f; var f = V.mk(c.width, c.height); f.g.translate(c.width, 0); f.g.scale(-1, 1); f.g.drawImage(c, 0, 0); return (c._f = f); }
  Su.flipped = flipped;
  function framesOf(key, mk) { return spriteCache[key] || (spriteCache[key] = mk()); }
  var AN = [['#6a5040', '#9a7a5a', '#d8c0a0', '#f0e8dc'], ['#4a4a52', '#7a7a86', '#b8b8c4', '#e8e8f0'], ['#8a8a92', '#c0c0c8', '#e8e8f0', '#ffffff']];
  function quadv(o) { return function (v) { return framesOf(o.k + v, function () { var oo = Object.assign({}, o); if (o.cols) oo.col = o.cols[v % o.cols.length]; return S.quad(V.rng(v + 1), oo); }); }; }
  var CR = Su.CR = {
    rabbit: { mode: 'walk', spd: 24, flee: 1, hop: 1, scan: 'RABBIT', frames: quadv({ k: 'rab', len: 8, h: 5, legH: 3, ear: 4, tail: 1, belly: 1, cols: AN }) },
    deer: { mode: 'walk', spd: 20, flee: 1, scan: 'DEER', frames: quadv({ k: 'deer', len: 14, h: 6, legH: 6, neck: 4, ear: 2, horn: 3, cols: [['#6a4a2a', '#a07a46', '#d8b078', '#f0e0c0'], ['#5a4a3a', '#8a7258', '#c0a888', '#e8dcc8']] }) },
    fox: { mode: 'walk', spd: 30, flee: 1, scan: 'FOX', frames: quadv({ k: 'fox', len: 10, h: 5, legH: 4, ear: 3, tail: 1, tailCol: '#fff0e0', cols: [['#7a3010', '#c05a20', '#f09050', '#fff0e0'], ['#4a5a6a', '#8a9aaa', '#c8d4e0', '#ffffff']] }) },
    goat: { mode: 'walk', spd: 18, flee: 0, scan: 'MOUNTAIN GOAT', frames: quadv({ k: 'goat', len: 10, h: 6, legH: 4, horn: 4, ear: 1, cols: [['#8a8a92', '#c0c0c8', '#e8e8f0', '#ffffff']] }) },
    camel: { mode: 'walk', spd: 14, flee: 0, scan: 'CAMEL', frames: quadv({ k: 'camel', len: 13, h: 6, legH: 6, hump: 2, neck: 5, cols: [['#a07a40', '#d0a860', '#ecd090', '#f8e8b8']] }) },
    lizard: { mode: 'walk', spd: 28, flee: 1, scan: 'LIZARD', frames: quadv({ k: 'liz', len: 10, h: 3, legH: 1, tail: 1, cols: [['#4a5a2a', '#8aa04a', '#d0e07a', '#f0ffb0'], ['#6a3a2a', '#b06a3a', '#e8a868', '#fff0c8']] }) },
    strider: { mode: 'walk', spd: 16, flee: 1, scan: 'STRIDER', glow: '#c070ff', frames: quadv({ k: 'strider', len: 8, h: 4, legH: 9, neck: 3, ear: 3, cols: [['#2a1a5a', '#6a3ab0', '#b078f0', '#f0d0ff']] }) },
    penguin: { mode: 'walk', spd: 14, flee: 0, scan: 'PENGUIN', frames: function () { return framesOf('peng', function () { return S.penguin(); }); } },
    crab: { mode: 'walk', spd: 20, flee: 1, scan: 'CRAB', frames: function (v) { return framesOf('crab' + (v % 2), function () { return S.bug(v % 2 ? ['#a03a2a', '#e0603a', '#ffa078'] : ['#a05a2a', '#e09a4a', '#ffd098']); }); } },
    beetle: { mode: 'walk', spd: 12, flee: 0, scan: 'BEETLE', frames: function (v) { return framesOf('beet' + (v % 3), function () { return S.bug([['#1a4a3a', '#2aa080', '#8affd8'], ['#3a1a6a', '#7a3ae0', '#d0a0ff'], ['#4a3a1a', '#a08030', '#f0d070']][v % 3]); }); } },
    butterfly: { mode: 'fly', low: 1, spd: 10, scan: 'BUTTERFLY', frames: function (v) { return framesOf('bf' + (v % 3), function () { return S.butterfly([['#c04df0', '#ffb0e0'], ['#f0a020', '#fff0a0'], ['#2a8af0', '#a0e0ff']][v % 3]); }); } },
    moth: { mode: 'fly', low: 1, spd: 8, scan: 'GLOW MOTH', glow: '#a0e8ff', frames: function (v) { return framesOf('moth' + (v % 2), function () { return S.butterfly([['#7ad0e8', '#e0ffff'], ['#d09aff', '#fff0ff']][v % 2]); }); } },
    bird: { mode: 'fly', spd: 24, scan: 'SONGBIRD', frames: function (v) { return framesOf('bird' + (v % 3), function () { return S.bird([['#3a5a9a', '#7aa0e0', '#d8e8ff'], ['#9a3a2a', '#e0705a', '#ffd0c0'], ['#5a5a6a', '#9a9aaa', '#e0e0ea']][v % 3]); }); } },
    parrot: { mode: 'fly', spd: 22, scan: 'PARROT', frames: function (v) { return framesOf('par' + (v % 2), function () { return S.bird([['#1a8a2a', '#ff3a3a', '#ffd23a'], ['#2a4ac8', '#ffcf2a', '#ff7a2a']][v % 2]); }); } },
    eagle: { mode: 'fly', spd: 30, high: 1, scan: 'EAGLE', frames: function () { return framesOf('eagle', function () { return S.bird(['#3a2a1a', '#7a5a3a', '#f0e8d8']); }); } },
    crow: { mode: 'fly', spd: 20, scan: 'CROW', frames: function () { return framesOf('crow', function () { return S.bird(['#0a0a14', '#2a2a3a', '#5a5a6a']); }); } },
    vulture: { mode: 'fly', spd: 18, high: 1, scan: 'VULTURE', frames: function () { return framesOf('vult', function () { return S.bird(['#2a1a14', '#5a4030', '#e0a090']); }); } },
    seagull: { mode: 'fly', spd: 24, scan: 'SEAGULL', frames: function () { return framesOf('gull', function () { return S.bird(['#8a96b0', '#e8eef8', '#ffffff']); }); } },
    drone: { mode: 'fly', hover: 1, spd: 14, scan: 'DRONE', glow: '#ff5050', frames: function () { return framesOf('drone', function () { var p = new S.Paint(9, 5); p.rect(1, 1, 7, 2, '#8a8aa4'); p.rect(2, 3, 5, 1, '#4a4a62'); p.rect(0, 0, 3, 1, '#c8c8dc'); p.rect(6, 0, 3, 1, '#c8c8dc'); p.set(4, 2, '#ff5050'); var a = p.done(); var q = new S.Paint(9, 5); q.rect(1, 1, 7, 2, '#8a8aa4'); q.rect(2, 3, 5, 1, '#4a4a62'); q.rect(1, 0, 2, 1, '#c8c8dc'); q.rect(6, 0, 2, 1, '#c8c8dc'); q.set(4, 2, '#5aff7a'); return [a, q.done()]; }); } },
    fish: { mode: 'swim', spd: 20, scan: 'REEF FISH', frames: function (v) { return framesOf('fish' + (v % 3), function () { return S.fish([['#2a5a8a', '#4aa0d0', '#c8f0ff'], ['#a04a1a', '#f08a2a', '#ffe0a0'], ['#5a2a8a', '#b070e0', '#f0d8ff']][v % 3], 6 + (v % 3) * 2); }); } },
    jellyfish: { mode: 'float', swimOnly: 1, spd: 5, scan: 'MOON JELLY', glow: '#e090ff', frames: function () { return framesOf('jelly', function () { return S.jelly(['#a04df0', '#e090ff', '#ffe0ff']); }); } },
    whale: { mode: 'swim', big: 1, spd: 9, scan: 'BLUE WHALE', frames: function () { return framesOf('whale', function () { return [S.whale()]; }); } },
    firefly: { mode: 'float', night: 1, spd: 5, scan: 'FIREFLY', glow: '#d8ff6a', frames: function () { return framesOf('ff', function () { return [S.orb('#d8ff6a', 1)]; }); } },
    orb: { mode: 'float', spd: 4, scan: 'LIGHT SPORE', glow: '#c8a0ff', frames: function (v) { return framesOf('orb' + (v % 3), function () { return [S.orb(['#c8a0ff', '#7affe8', '#ffb0e0'][v % 3], 2)]; }); } },
    ember: { mode: 'float', spd: 6, rise: 1, scan: 'FIRE SPRITE', glow: '#ff9a30', frames: function () { return framesOf('ember', function () { return [S.orb('#ff9a30', 1)]; }); } },
    skyray: { mode: 'fly', spd: 14, high: 1, scan: 'SKY RAY', frames: function () { return framesOf('ray', function () { var out = []; for (var f = 0; f < 2; f++) { var p = new S.Paint(30, 12); p.poly([[15, 3], [29, 5 + f * 2], [15, 9], [1, 5 + f * 2]], function (x, y) { return S.tone(['#3a2a5a', '#7a5aa0', '#c8a8e8'], 1 - (y - 3) / 6 * .7, x, y); }); p.line(15, 8, 8, 11, '#3a2a5a'); out.push(p.done()); } return out; }); } }
  };

  /* ---------- sky ---------- */
  var skyCv = null, skyKey = '', starList = null, starKey = '';
  function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function skyState(w) { var elev = Math.sin(TAU * (w.tod - .25)), dayF = smooth(clamp((elev + .12) / .42, 0, 1)); return { elev: elev, dayF: dayF, warm: Math.exp(-(elev * elev) / .04) * (1 - Math.abs(elev) * .3), nf: 1 - dayF }; }
  Su.skyState = skyState;
  function drawSky(g, w, st, GY0) {
    var W = V.W, H = V.H;
    if (w.skyKey === 'none') { g.fillStyle = '#010103'; g.fillRect(0, 0, W, H); return; }
    var oc = Math.round(w.wx.amt * 6) / 6, asc = Math.round((Su.ascent || 0) * 14) / 14, key = w.id + '|' + Math.round(w.tod * 90) + '|' + oc + '|' + asc + '|' + W + 'x' + H;
    if (key !== skyKey || !skyCv) {
      skyKey = key; if (!skyCv || skyCv.width !== W || skyCv.height !== H) skyCv = V.mk(W, H);
      var sk = w.sky, dt = V.hex(sk.day[0]), dh = V.hex(sk.day[1]), nt = V.hex(sk.night[0]), nh = V.hex(sk.night[1]), ut = V.hex(sk.dusk[0]), uh = V.hex(sk.dusk[1]);
      var top = mix3(nt, dt, st.dayF), hor = mix3(nh, dh, st.dayF); top = mix3(top, ut, st.warm * .7); hor = mix3(hor, uh, st.warm * .85);
      if (oc > 0) { var gr = [118 * (.25 + st.dayF * .75), 124 * (.25 + st.dayF * .75), 140 * (.3 + st.dayF * .7)]; top = mix3(top, gr, oc * .6); hor = mix3(hor, gr, oc * .6); }
      if (asc > 0) { top = mix3(top, [2, 2, 8], asc); hor = mix3(hor, [5, 4, 14], asc * .92); }
      var g2 = skyCv.g, img = g2.createImageData(W, H), u = new Uint32Array(img.data.buffer), hy = GY0 + 6, step = 14;
      for (var y = 0; y < H; y++) { var t = Math.pow(clamp(y / hy, 0, 1), 1.35), c = mix3(top, hor, t); for (var x = 0; x < W; x++) { var b = V.bayer(x, y); var r = Math.min(255, (Math.floor(c[0] / step + b) * step) | 0), gg = Math.min(255, (Math.floor(c[1] / step + b) * step) | 0), bb = Math.min(255, (Math.floor(c[2] / step + b) * step) | 0); u[y * W + x] = 0xff000000 | (bb << 16) | (gg << 8) | r; } }
      g2.putImageData(img, 0, 0);
    }
    g.drawImage(skyCv, 0, 0);
  }
  function drawStars(g, w, st, cam, GY0, t) {
    var W = V.W, H = V.H, vis = w.airless ? 1 : Math.max(st.nf * (1 - w.wx.amt * .8), Su.ascent || 0); if (vis < .05) return;
    var key = W + 'x' + H; if (!starList || starKey !== key) { starKey = key; starList = []; var r = V.rng(9); for (var i = 0; i < Math.round(W * H / 170); i++) starList.push([Math.floor(r() * W), Math.floor(r() * (GY0 + 6)), r(), r() * 7]); }
    var sx0 = Math.floor(cam.x * .03);
    for (var i = 0; i < starList.length; i++) { var s = starList[i]; if (s[2] > vis * 1.05) continue; var x = ((s[0] - sx0) % W + W) % W, tw = Math.sin(t * 2 + s[3]); if (V.reduced) tw = 1; if (s[2] > .93 && tw < -.3) continue; g.fillStyle = s[2] < .12 ? '#fff' : s[2] < .5 ? '#b8c4ff' : '#7a86c0'; g.fillRect(x, s[1], 1, 1); if (s[2] < .03) { g.fillRect(x - 1, s[1], 1, 1); g.fillRect(x + 1, s[1], 1, 1); g.fillRect(x, s[1] - 1, 1, 1); g.fillRect(x, s[1] + 1, 1, 1); } }
  }
  var moonCv = null;
  function moonSprite() { if (moonCv) return moonCv; var p = new S.Paint(17, 17), pal = ['#7a7a96', '#b0b0c8', '#e4e4f0', '#ffffff']; S.ball(p, 8.5, 8.5, 8, pal, -.5, -.5); [[5, 6], [10, 5], [9, 10], [6, 11], [11, 9]].forEach(function (c) { p.set(c[0], c[1], '#8a8aa6'); p.set(c[0] + 1, c[1], '#8a8aa6'); }); return (moonCv = p.done()); }
  function drawCelestials(g, w, st, cam, GY0, t, body) {
    var W = V.W, H = V.H, hy = GY0 - 6;
    var ang = TAU * (w.tod - .25), sx = Math.round(W / 2 - Math.cos(ang) * (W * .52 + 14)), sy = Math.round(hy - Math.sin(ang) * (hy * .88)), oc = w.wx.amt;
    if (w.skyKey !== 'none' || true) {
      if (st.elev > -.2 && oc < .75) { var star = body.star || { skind: 'yellow', id: 'sunx', seed: 1, tint: [255, 244, 220], r: 40 }; var sr = body.home ? 10 : clamp(11 - (body.sys && body.sys.hz ? body.star ? Math.hypot(body.star.x - body.x, body.star.y - body.y) / 700 : 3 : 3), 5, 12); if (w.skyKey === 'lava') sr = 14; if (body.star && body.star.skind === 'giant') sr = 18; if (!body.star) sr = 3; P.drawStarAt(g, star, sx, sy, Math.round(sr), t); }
      if (body.home && st.elev < .15) { var mc = moonSprite(), ma = ang + Math.PI; g.drawImage(mc, Math.round(W / 2 - Math.cos(ma) * (W * .52 + 14) - 8), Math.round(hy - Math.sin(ma) * hy * .88 - 8)); }
    }
    if (body.moonOf && (w.airless || st.nf > .3)) { var par = body.moonOf, R = clamp(Math.round(par.r * .6), 16, 38); var lt = P.get && { ang: ang + Math.PI * (1 - Math.cos(ang) > 0 ? 0 : 1), col: [255, 244, 220], k: .9 }; P.drawBody(g, par, Math.round(W * .74), Math.round(Math.max(R * (par.ring ? .9 : 1) + 8, hy * .38)), R, t, { ang: -.6, col: [255, 244, 224], k: .95 }); }
    else if (body.rogue === undefined && body.sys && body.star && !body.isStar && !w.airless) { /* nothing */ }
    if (w.th.ringarch) { /* the ringworld's far side arches overhead */ g.fillStyle = '#10243a'; var ay = Math.round(hy * .12); g.fillRect(0, ay, W, 3); g.fillStyle = '#3a7a5a'; g.fillRect(0, ay + 3, W, 4); g.fillStyle = '#5ab0e0'; for (var x = 0; x < W; x += 7) g.fillRect(x, ay + 5, 3, 1); g.fillStyle = '#1a3a5a'; g.fillRect(0, ay + 7, W, 2); }
  }
  function drawAurora(g, w, st, cam, GY0, t) {
    var W = V.W, vis = st.nf; if (vis < .4) return; var seed = w.seed1;
    for (var x = 0; x < W; x++) { var wx = x + cam.x * .05, a = V.noise2(wx * .012, t * .08, seed), top = GY0 * (.12 + .25 * V.noise2(wx * .01, 3, seed)) + Math.sin(wx * .04 + t * .5) * 5, hgt = 28 + a * 60; for (var y = 0; y < hgt; y += 1) { var v = 1 - y / hgt, yy = Math.round(top + y); if (v * vis * (.7 + .3 * Math.sin(wx * .3 + t)) > V.bayer(x, yy) * 1.25) { g.fillStyle = v > .7 ? '#a8ffd8' : v > .4 ? '#3ae0a0' : (y > hgt * .85 ? '#7a3ae0' : '#2a9a7a'); g.fillRect(x, yy, 1, 1); } } }
  }

  /* ---------- scene composition ---------- */
  var scene = null, waterPats = {};
  function waterPat(g, key, col, dens) { var k = key + dens; if (waterPats[k]) return waterPats[k]; var c = V.mk(4, 4), cg = c.g; cg.fillStyle = col; for (var y = 0; y < 4; y++) for (var x = 0; x < 4; x++) if (V.B8[(y * 2) * 8 + x * 2] < dens) cg.fillRect(x, y, 1, 1); return (waterPats[k] = g.createPattern(c, 'repeat')); }
  Su.items = []; var vis = [];
  function drawItem(sg, it, w, cam, GY0, back, t) {
    var W = V.W, sx = wdx(it.x, cam.x, w.WW) + W / 2; if (sx < -60 || sx > W + 60) return;
    var key = it.kind + (back ? 'b' : 'f') + it.b.id; if (!it._sp || it._k !== key) { var pal = back ? (it.b._hz || (it.b._hz = Object.assign({}, it.b.pal, hazeAll(it.b.pal, it.b.haze, .35)))) : it.b.pal; it._sp = D.make(it.kind, it.seed, pal, key); it._k = key; }
    var sp = it._sp, c = sp.c; if (sp.c2 === undefined) sp.c2 = null; if (sp.frames) c = sp.frames[Math.floor(t * 1.6 + it.x * .05) & 1];
    var dx = Math.round(sx - sp.w / 2), dy = Math.round(GY0 - (it.y - cam.y) - sp.h + (back ? 2 : 1)); sg.drawImage(c, dx, dy);
    if (it.kind === 'lighthouse' && Su.curSky && Su.curSky.nf > .3) { /* sweeping beam, drawn as dither pixels on top later */ }
  }
  function hazeAll(pal, col, t) { var o = {}; for (var k in pal) { var v = pal[k]; o[k] = Array.isArray(v) ? v.map(function (c) { return V.mixs(c, col, t); }) : (typeof v === 'string' && v[0] === '#' ? V.mixs(v, col, t) : v); } return o; }

  Su.draw = function (g, dt) {
    var w = Su.cur; if (!w) { g.fillStyle = '#05020d'; g.fillRect(0, 0, V.W, V.H); return; }
    var W = V.W, H = V.H, GY0 = Math.round(H * .66), cam = Su.cam, t = V.time, body = w.body, st = skyState(w); Su.curSky = st;
    if (!scene || scene.width !== W || scene.height !== H) scene = V.mk(W, H);
    var sg = scene.g; sg.clearRect(0, 0, W, H);
    var cb = w.biomes[w.bAt[Math.floor(((Su.pl.x % w.WW) + w.WW) % w.WW)]];
    /* sky (opaque, drawn straight to the screen) */
    drawSky(g, w, st, GY0); drawStars(g, w, st, cam, GY0, t);
    if (cb.aurora && !w.airless) drawAurora(g, w, st, cam, GY0, t);
    drawCelestials(g, w, st, cam, GY0, t, body); if (Su.rareDraw) Su.rareDraw(g, w, st, cam, GY0, t);
    /* ascent darkening for lift-off */
    /* clouds */
    var CW = Math.max(W + 180, 760);
    for (var i = 0; i < w.clouds.length; i++) { var c = w.clouds[i], sp = Su.cloudSprite(w.skyKey, c.k), cx = (((c.x + t * c.sp - cam.x * .06 + Su.windOff) % CW) + CW) % CW - 90, cy = Math.round(GY0 * (c.y) + 4 - cam.y * .02); sg.drawImage(sp, Math.round(cx), cy); }
    /* parallax hills */
    for (var li = 0; li < 3; li++) {
      var L = Su.LAYER[li], lc = Su.layer(w, li), zl = Math.round(GY0 + cam.y * L.f - L.lift), dy = zl - lc.zero, off = Math.floor(cam.x * L.f), lx = ((off - Math.floor(W / 2)) % lc.LW + lc.LW) % lc.LW;
      for (var xx = -lx; xx < W; xx += lc.LW) sg.drawImage(lc, xx, dy);
      var bot = dy + lc.height; if (bot < H) { var b0 = w.biomes[w.bAt[Math.floor(cam.x) % w.WW]]; sg.fillStyle = V.css(V.mixc(b0.far[li], b0.haze, .12)); sg.fillRect(0, bot, W, H - bot); }
    }
    /* ground chunks */
    var CHTOP = 260, nCh = Math.ceil(w.WW / 128), camC = Math.floor(cam.x), c0 = Math.floor((camC - W / 2 - 128) / 128), gyTop = Math.round(GY0 - (CHTOP - cam.y));
    sg.fillStyle = V.css(V.hex(cb.soil[0])); sg.fillRect(0, gyTop + 380, W, Math.max(0, H - gyTop - 380));
    for (var ci = c0; ci <= c0 + Math.ceil(W / 128) + 2; ci++) { var idx = ((ci % nCh) + nCh) % nCh, cx2 = Math.round(wdx(idx * 128, cam.x, w.WW) + W / 2); if (cx2 + 128 < 0 || cx2 > W) continue; sg.drawImage(Su.chunk(w, idx), cx2, gyTop); }
    /* decor (back) */
    var items = w.items, n = items.length;
    for (i = 0; i < n; i++) if (items[i].z === 0) drawItem(sg, items[i], w, cam, GY0, true, t);
    /* ship */
    Su.drawShip(sg, w, cam, GY0, t);
    /* critters */
    Su.drawCritters(sg, w, cam, GY0, t);
    for (i = 0; i < n; i++) if (items[i].z === 1) drawItem(sg, items[i], w, cam, GY0, false, t);
    Su.drawPlayer(sg, w, cam, GY0, t);
    Su.drawParts(sg, w, cam, GY0, t);
    /* liquid (dithered overlay so everything beneath stays visible) */
    if (w.wl > -999) Su.drawLiquid(sg, w, cam, GY0, t);
    /* grade the whole scene uniformly: night, dusk, overcast (still hard palette-less colour per pixel) */
    var nt = cb.nightTint != null ? cb.nightTint : 1, ao = Su.ascent || 0;
    sg.globalCompositeOperation = 'source-atop';
    if (st.nf * nt > .02) { sg.fillStyle = 'rgba(12,16,66,' + (.62 * st.nf * nt).toFixed(3) + ')'; sg.fillRect(0, 0, W, H); }
    if (st.warm > .02 && w.skyKey !== 'none' && w.skyKey !== 'lava') { sg.fillStyle = 'rgba(255,120,60,' + (.2 * st.warm * (st.dayF > .05 ? 1 : .3)).toFixed(3) + ')'; sg.fillRect(0, 0, W, H); }
    if (w.wx.amt > .02) { sg.fillStyle = 'rgba(70,84,110,' + (.3 * w.wx.amt).toFixed(3) + ')'; sg.fillRect(0, 0, W, H); }
    sg.globalCompositeOperation = 'source-over';
    g.drawImage(scene, 0, 0);
    Su.drawLights(g, w, cam, GY0, t, st, cb);
    Su.drawWeather(g, w, cam, GY0, t, st);
    if (Su.flash > 0) { V.dissolve(g, Su.flash * .6, '#ffffff'); }
  };
  Su.LAYER = [{ f: .1, lift: 46 }, { f: .24, lift: 28 }, { f: .46, lift: 10 }];
})();
