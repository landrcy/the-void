/* The Void — surface worlds, part 3: the astronaut, the ship, critters, weather, events. */
(function () {
  'use strict';
  var V = window.VOID, S = V.spr, D = V.decor, G = V.Gen, TAU = V.TAU, Su = V.surface, clamp = V.clamp, wdx = Su.wdx, W2 = function () { return V.W / 2; };
  Su.cam = { x: 0, y: 0 }; Su.pl = { x: 0, y: 0, vx: 0, vy: 0, face: 1, ground: true, swim: false, coyote: 0, jbuf: 0, hidden: false, anim: 0, moving: false };
  Su.ship = { x: 0, open: 0, alt: 0, vy: 0, lit: 0 }; Su.mode = 'none'; Su.windOff = 0; Su.flash = 0; Su.ascent = 0; Su.parts = []; Su.floats = []; Su.disc = {}; Su.discCount = 0; Su.hint = null; Su.fixedTod = null;
  var rr = V.rng(777);
  function gAt(w, x) { var i = Math.floor(x) % w.WW; if (i < 0) i += w.WW; return w.gh[i]; }
  Su.gAt = gAt;
  function biomeAt(w, x) { var i = Math.floor(x) % w.WW; if (i < 0) i += w.WW; return w.biomes[w.bAt[i]]; }
  Su.biomeAt = biomeAt;
  function norm(w, x) { x %= w.WW; return x < 0 ? x + w.WW : x; }

  /* ---------- enter ---------- */
  Su.enter = function (body, o) {
    o = o || {}; var w = Su.getWorld(body); Su.cur = w; var sh = Su.ship; Su.fixedTod = null;
    var spX = w.shipX != null ? w.shipX : (w.shipX = w.spawnX);
    sh.x = spX; sh.open = 0; sh.alt = 0; sh.vy = 0; sh.lit = 0; Su.parts.length = 0; Su.floats.length = 0; Su.ascent = 0; Su.flash = 0; Su.hint = null; Su.quest = null;
    var pl = Su.pl; pl.vx = pl.vy = 0; pl.face = -1; pl.hidden = false; pl.ground = true; pl.swim = false; pl.coyote = pl.jbuf = 0; pl.t0 = 0;
    if (V.q.has('night')) { Su.fixedTod = 0; w.tod = 0; } else if (V.q.has('day')) { Su.fixedTod = .3; w.tod = .3; }
    var cam = Su.cam;
    if (o.crash && Su.startCrash) { Su.startCrash(w, o); }
    else if (o.arrive) { Su.mode = 'arrive'; sh.alt = 360; sh.vy = 0; pl.hidden = true; pl.x = spX; pl.y = gAt(w, spX); Su.ascent = 0; }
    else if (o.resume) { Su.mode = 'play'; pl.x = o.resume.x; pl.y = Math.max(o.resume.y, gAt(w, o.resume.x)); if (o.resume.tod != null) w.tod = o.resume.tod; sh.open = 1; }
    else { Su.mode = 'play'; pl.x = spX + (o.dx != null ? o.dx : -34); pl.y = gAt(w, pl.x); sh.open = 1; }
    cam.x = (Su.mode === 'arrive' ? spX : pl.x); cam.y = gAt(w, cam.x) + (Su.mode === 'arrive' ? 60 : 8);
    w.wx.on = 0; w.wx.amt = 0; w.partsW = null; V.shake = 0;
    for (var i = 0; i < w.critters.length; i++) { var c = w.critters[i]; if (c.y0 == null) c.y0 = c.y; }
    Su.enterT = 0;
    // chunks near the camera are generated up front so the first frame does not hitch
    var nCh = Math.ceil(w.WW / 128), c0 = Math.floor(cam.x / 128); for (var k = -3; k <= 4; k++) Su.chunk(w, (((c0 + k) % nCh) + nCh) % nCh); for (var li = 0; li < 3; li++) Su.layer(w, li);
    Su.landed = true;
    w.critters.forEach(function (c) { if (Su.disc['c:' + c.type + ':' + w.id]) c.scanned = true; }); w.items.forEach(function (it) { if (it.scan && Su.disc['m:' + w.id]) it.scanned = true; });
  };
  Su.isHint = function (h) { return !!h; };
  Su.leave = function () { Su.cur = null; Su.mode = 'none'; };
  Su.setTod = function (t) { if (Su.cur) Su.cur.tod = t; };

  /* ---------- particles / floating text ---------- */
  function puff(x, y, n, col, spread, up) { for (var i = 0; i < n; i++) { var a = rr() * TAU; Su.parts.push({ x: x + (rr() - .5) * spread, y: y, vx: Math.cos(a) * spread * 1.6 * rr(), vy: (up == null ? 18 : up) * rr() + Math.abs(Math.sin(a)) * 14, life: 0, max: .5 + rr() * .7, col: col, g: 40 }); } }
  Su.puff = puff;
  Su.discover = function (id, label, bonus) { if (Su.disc[id]) return false; Su.disc[id] = 1; Su.discCount++; if (Su.onDiscover) Su.onDiscover(id, label); return true; };
  function scanFx(x, y, col) { for (var i = 0; i < 14; i++) { var a = i / 14 * TAU; Su.parts.push({ x: x, y: y, vx: Math.cos(a) * 34, vy: Math.sin(a) * 34, life: 0, max: .7, col: i % 2 ? '#ffffff' : (col || '#c04df0'), g: 0, drag: 3 }); } }

  /* ---------- player ---------- */
  var GRAV_EXTRA = 1.0, NOMODS = { run: 1, jump: 1, dbl: false, jet: false, board: false };
  Su.mods = NOMODS;
  function stepPlayer(w, dt, ctl) {
    var pl = Su.pl, g = w.g, inx = ctl ? V.input.x : 0, jump = ctl && V.input.jump, md = Su.mods || NOMODS;
    var depth = w.wl - pl.y, swim = depth > 7 && w.wl > -999; pl.swim = swim;
    var acc = swim ? 260 : (pl.ground ? 700 : 340), sp = (swim ? 34 : (w.airless || g < 220 ? 58 : 62)) * (swim ? 1 : md.run * (md.board ? 2.1 : 1));
    if (pl.ground && !ctl) inx = 0;
    var tv = inx * sp; pl.vx += clamp(tv - pl.vx, -acc * dt, acc * dt); if (inx) pl.face = inx > 0 ? 1 : -1;
    if (ctl && V.input.jumpPressed) pl.jbuf = .14; pl.jbuf = Math.max(0, pl.jbuf - dt); pl.coyote = pl.ground ? .1 : Math.max(0, pl.coyote - dt);
    var jv = Math.sqrt(2 * g * 30 * (w.airless ? 1.45 : 1)); if (jv > 230) jv = 230; if (jv < 70) jv = 70; jv *= md.jump;
    if (swim) {
      var targ = jump ? 40 : -16; if (ctl && V.input.y < 0) targ = -34; pl.vy += (targ - pl.vy) * Math.min(1, 3.5 * dt); if (depth < 15 && jump && pl.jbuf > 0) { pl.vy = Math.max(pl.vy, 110); pl.jbuf = 0; }
    } else {
      if (pl.ground) { pl.dblUsed = false; pl.jetF = 1.4; }
      if (pl.jbuf > 0 && pl.coyote > 0) { pl.vy = jv; pl.jbuf = 0; pl.coyote = 0; pl.ground = false; }
      else if (pl.jbuf > 0 && md.dbl && !pl.dblUsed && !pl.ground) { pl.vy = jv * .9; pl.jbuf = 0; pl.dblUsed = true; puff(pl.x, pl.y, 6, '#e8f0ff', 6, -10); }
      if (md.jet && jump && !pl.ground && pl.vy < 60 && pl.jetF > 0 && (pl.dblUsed || !md.dbl || pl.vy < 0)) { pl.vy = Math.min(80, pl.vy + 900 * dt); pl.jetF -= dt; pl.jetOn = .1; if (Math.random() < dt * 40) puff(pl.x - pl.face * 3, pl.y + 3, 1, '#ffb040', 2, -30); }
      pl.vy -= g * dt; if (pl.vy > 0 && !jump) pl.vy -= g * dt * GRAV_EXTRA; if (pl.vy < -420) pl.vy = -420;
    }
    // horizontal with step-up
    var nx = pl.x + pl.vx * dt, hg = gAt(w, nx + (pl.vx > 0 ? 2 : -2));
    if (hg - pl.y > (md.board ? 5 : 2.6)) { pl.vx = 0; nx = pl.x; }
    pl.x = nx;
    var ny = pl.y + pl.vy * dt, gy = gAt(w, pl.x);
    if (pl.ground && !swim && pl.vy <= 0 && pl.y - gy < 6 && pl.y - gy >= -3) { ny = gy; pl.vy = 0; }
    if (ny <= gy) { if (!pl.ground && pl.vy < -190 && Su.onThud) Su.onThud(-pl.vy); if (!pl.ground && pl.vy < -60) puff(pl.x, gy, 4, Su.groundCol(w, pl.x), 8, 10); ny = gy; if (pl.vy < 0) pl.vy = 0; pl.ground = true; } else pl.ground = false;
    pl.y = ny; pl.x = norm(w, pl.x);
    if (md.board && w.wl > -999 && pl.y < w.wl && !jump && ctl) { pl.y = w.wl; pl.vy = Math.max(0, pl.vy); pl.ground = true; pl.swim = false; }
    if (w.liquid === 'lava' && w.wl - pl.y > 3 && w.wl > -999 && !(V.prog && V.prog.cheat.god)) Su.burn();
  }
  Su.groundCol = function (w, x) { var b = biomeAt(w, x); return b.pal && b.pal.dust ? b.pal.dust : V.css(V.hex(b.top[2] || b.top[1])); };
  Su.burn = function () { if (Su.mode !== 'play' || Su.burning) return; Su.burning = true; var pl = Su.pl; puff(pl.x, pl.y + 6, 16, '#ff9030', 10, 40); V.game.fadeOut(.5, function () { var w = Su.cur; pl.x = Su.ship.x - 34; pl.y = gAt(w, pl.x); pl.vx = pl.vy = 0; Su.burning = false; V.game.fadeIn(.6); }); };

  /* ---------- interaction ---------- */
  function findHint(w) {
    var pl = Su.pl, sh = Su.ship, best = null, bd = 1e9;
    if (Su.mode !== 'play') return null;
    var dxs = wdx(sh.x, pl.x, w.WW), sY = gAt(w, sh.x);
    if (Math.abs(dxs) < 30 && Math.abs(pl.y - sY) < 24) { best = { kind: 'ship', x: sh.x, y: sY + 30, d: Math.abs(dxs) - 8 }; bd = best.d; }
    for (var i = 0; i < w.critters.length; i++) { var c = w.critters[i]; if (c.scanned || c.def.night && false) continue; var dx = wdx(c.x, pl.x, w.WW), dy = (c.cy != null ? c.cy : c.y) - pl.y; if (Math.abs(dx) < 22 && Math.abs(dy) < 30 && !(c.def.mode === 'swim' && !pl.swim && c.def.big)) { var d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = { kind: 'critter', ref: c, x: c.x, y: (c.cy != null ? c.cy : c.y) + (c.sh || 8) + 6 }; } } }
    for (i = 0; i < w.items.length; i++) { var it = w.items[i]; if (!it.scan || it.scanned) continue; var dx2 = wdx(it.x, pl.x, w.WW); if (Math.abs(dx2) < 26 && Math.abs(it.y - pl.y) < 30) { var d2 = Math.abs(dx2); if (d2 < bd) { bd = d2; var sp = it._sp; best = { kind: 'item', ref: it, x: it.x, y: it.y + (sp ? sp.h : 30) + 6 }; } } }
    return best;
  }
  function act(w) {
    var h = Su.hint; if (!h) return;
    if (h.kind === 'ship') { Su.mode = 'board'; Su.boardT = 0; Su.hint = null; return; }
    if (h.kind === 'critter') { var c = h.ref; w.critters.forEach(function (o) { if (o.type === c.type) o.scanned = true; }); scanFx(c.x, c.y + 8, c.def.glow); Su.floats.push({ x: c.x, y: c.y + 24, t: 0, str: c.def.scan }); Su.discover('c:' + c.type + ':' + w.id, c.def.scan); }
    else if (h.kind === 'item') { var it = h.ref; it.scanned = true; scanFx(it.x, it.y + 20, '#7affe8'); Su.floats.push({ x: it.x, y: it.y + 52, t: 0, str: 'MONOLITH' }); Su.discover('m:' + w.id, 'MONOLITH'); if (Su.onMonolith) Su.onMonolith(); }
  }

  /* ---------- critters ---------- */
  function updCritters(w, dt, t) {
    var pl = Su.pl, st = Su.curSky || Su.skyState(w), n = w.critters.length, WW = w.WW;
    for (var i = 0; i < n; i++) {
      var c = w.critters[i], d = c.def, dxp = wdx(c.x, pl.x, WW); if (Math.abs(dxp) > 700) { continue; }
      c.t -= dt; var seg = c.seg, m = d.mode;
      if (m === 'walk') {
        var runaway = d.flee && Math.abs(dxp) < 46 && !pl.hidden && Math.abs(pl.y - c.y) < 40;
        if (runaway) { c.dir = dxp > 0 ? 1 : -1; c.st = 1; c.t = .5; } else if (c.t < 0) { c.st = c.st ? 0 : (rr() < .8 ? 1 : 0); c.dir = rr() < .5 ? -1 : 1; c.t = c.st ? 1.5 + rr() * 3 : 1 + rr() * 3.5; }
        if (c.st) { var sp = d.spd * (runaway ? 2.2 : 1) * (d.hop ? (.4 + .9 * Math.abs(Math.sin(t * 8 + c.ph))) : 1), nx = norm(w, c.x + c.dir * sp * dt), ng = gAt(w, nx);
          var lx = c.x - seg.x0, bad = Math.abs(ng - c.y) > 3 || ng < w.wl - 2 || w.biomes[w.bAt[Math.floor(nx)]] !== seg.b || nx < seg.x0 + 20 || nx > seg.x1 - 20;
          if (bad) { c.dir = -c.dir; c.t = 1 + rr() * 2; } else c.x = nx; }
        c.y = gAt(w, c.x); c.cy = c.y + (d.hop && c.st ? Math.abs(Math.sin(t * 8 + c.ph)) * 3 : 0); c.sh = 8;
      } else if (m === 'fly') {
        var sp2 = d.spd, ax = c.dir * sp2 * dt * (d.low ? (.5 + .5 * Math.sin(t * .6 + c.ph)) : 1); if (d.hover) ax *= (.3 + .7 * (Math.sin(t * .4 + c.ph) > 0 ? 1 : 0)); c.x = norm(w, c.x + ax);
        if (c.t < 0) { c.dir = -c.dir; c.t = 4 + rr() * 8; }
        var off = wdx(c.x, (seg.x0 + seg.x1) / 2, WW); if (Math.abs(off) > seg.w / 2 + 260) c.dir = off > 0 ? -1 : 1;
        var gy = gAt(w, c.x), base = Math.max(gy, w.wl > -999 ? w.wl : gy);
        c.cy = base + (d.low ? 8 + 16 * (.5 + .5 * Math.sin(t * .9 + c.ph * 2)) + Math.sin(t * 7 + c.ph) * 1.4 : (d.high ? 110 + c.alt * .6 : 36 + c.alt * .8) + Math.sin(t * 1.4 + c.ph) * 9); c.y = gy; c.sh = 4;
      } else if (m === 'swim') {
        var big = d.big, wd = w.wl - gAt(w, c.x); c.x = norm(w, c.x + c.dir * d.spd * dt);
        var ng2 = gAt(w, norm(w, c.x + c.dir * 14)); if (ng2 > w.wl - 12 || c.t < 0) { if (ng2 > w.wl - 12) c.x = norm(w, c.x - c.dir * d.spd * dt * 2); c.dir = -c.dir; c.t = 4 + rr() * 8; c.ty = rr(); }
        var lo = gAt(w, c.x) + (big ? 22 : 5), hi = w.wl - (big ? 24 : 9); if (hi < lo) hi = lo; c.ty = c.ty == null ? rr() : c.ty; c.cy = c.cy == null ? lo : c.cy; c.cy += (lo + (hi - lo) * (.5 + .5 * Math.sin(t * .3 + c.ph + c.ty * 6)) - c.cy) * Math.min(1, dt * .9); c.sh = 4; c.y = gAt(w, c.x);
      } else if (m === 'float') {
        c.x = norm(w, c.x + Math.sin(t * .31 + c.ph) * d.spd * dt * 1.4); var g0 = gAt(w, c.x);
        if (d.swimOnly) { var lo2 = g0 + 16, hi2 = w.wl - 12; c.cy = lo2 + Math.max(4, hi2 - lo2) * (.5 + .5 * Math.sin(t * .22 + c.ph)); }
        else if (d.rise) { c.rt = ((c.rt == null ? c.ph : c.rt) + dt * .4) % 6; c.cy = g0 + 6 + c.rt * 14; }
        else c.cy = g0 + (d.night ? 6 : 12) + c.alt * .45 + Math.sin(t * .8 + c.ph) * 7 + Math.sin(t * 1.9 + c.ph) * 2; c.y = g0; c.sh = 4;
      }
    }
  }
  Su.drawCritters = function (sg, w, cam, GY0, t) {
    var W = V.W, st = Su.curSky, pl = Su.pl;
    for (var i = 0; i < w.critters.length; i++) {
      var c = w.critters[i], d = c.def, sx = wdx(c.x, cam.x, w.WW) + W / 2; if (sx < -50 || sx > W + 50) continue;
      if (d.night && st.nf < .25 && !w.airless) continue; var fr = d.frames(c.v), cv, wlk = d.mode === 'walk';
      if (fr.length === 1) cv = fr[0]; else if (wlk) cv = c.st ? fr[Math.floor(t * (c.def.hop ? 8 : 6) + c.ph) % fr.length] : fr[0]; else cv = fr[Math.floor(t * (d.mode === 'fly' ? 9 : 4) + c.ph) % fr.length];
      var face = c.dir; if (d.type === 'bird') face = c.dir; if (face < 0) cv = Su.flipped(cv);
      var cy = c.cy != null ? c.cy : c.y, dy = Math.round(GY0 - (cy - cam.y) - cv.height + (wlk ? 0 : cv.height / 2)), dx = Math.round(sx - cv.width / 2);
      if (!wlk && d.mode !== 'fly') { /* floaters and swimmers are centred */ }
      sg.drawImage(cv, dx, dy);
      if (c.scanned && d.glow === undefined) { /* nothing */ }
    }
  };
  /* ---------- player / ship drawing ---------- */
  Su.drawPlayer = function (sg, w, cam, GY0, t) {
    var pl = Su.pl; if (pl.hidden) return; var sk = V.prog ? V.prog.suitKey() : '', fr = sk.indexOf('1') >= 0 ? S.suitFrames(sk) : S.astro, W = V.W, f;
    var moving = Math.abs(pl.vx) > 8 && pl.ground;
    if (pl.swim) f = fr.fall; else if (!pl.ground) f = pl.vy > 10 ? fr.jump : fr.fall; else if (moving) f = fr['w' + (Math.floor(pl.anim * 1.0) & 3)]; else f = (Math.floor(t * .7) % 5 === 0 && (t % 1.43) < .25) ? fr.idle2 : fr.idle;
    if (pl.face < 0) f = Su.flipped(f);
    var sx = Math.round(wdx(pl.x, cam.x, w.WW) + W / 2), sy = Math.round(GY0 - (pl.y - cam.y)), bob = pl.swim ? Math.round(Math.sin(t * 3)) : 0;
    sg.drawImage(f, sx - 5, sy - 15 + bob);
  };
  var flameCols = ['#fff6b0', '#ffb030', '#e0501a', '#8a2a2a'];
  function drawFlame(sg, x, y, len, t, wid) {
    var fl = Math.floor(t * 30) % 3;
    for (var j = 0; j < len; j++) { var k = j / len, hw = Math.max(0, Math.round(wid * (1 - k * .8))), col = k < .2 ? flameCols[0] : k < .5 ? flameCols[1] : k < .8 ? flameCols[2] : flameCols[3]; if (V.bayer(j + fl, x) > 1 - k * .9 && j > 2) continue; sg.fillStyle = col; sg.fillRect(x - hw, y + j, hw * 2 + 1, 1); }
  }
  Su.drawShip = function (sg, w, cam, GY0, t) {
    var sh = Su.ship, W = V.W, gy = gAt(w, sh.x), sx = Math.round(wdx(sh.x, cam.x, w.WW) + W / 2), spr = S.landedShip(sh.open > .5, V.prog ? V.prog.shipTier() : 0), top = Math.round(GY0 - (gy + sh.alt - cam.y) - 20);
    if (sx < -60 || sx > W + 60) return; sg.drawImage(spr, sx - (spr.width >> 1), top + 20 - spr.height);
    if (sh.open > .02 && sh.open < .98) { sg.fillStyle = '#10082a'; }
    if (sh.flame > 0) { drawFlame(sg, sx, top + 19, Math.round(5 + sh.flame * 18), t, 2); drawFlame(sg, sx - 9, top + 18, Math.round(3 + sh.flame * 9), t + .1, 1); drawFlame(sg, sx + 9, top + 18, Math.round(3 + sh.flame * 9), t + .2, 1); }
  };
  Su.drawParts = function (sg, w, cam, GY0, t) {
    var W = V.W, P = Su.parts;
    for (var i = 0; i < P.length; i++) { var p = P[i], k = p.life / p.max; if (k > 1) continue; var sx = Math.round(wdx(p.x, cam.x, w.WW) + W / 2), sy = Math.round(GY0 - (p.y - cam.y)); if (k > .7 && V.bayer(sx, sy) < (k - .7) * 3.3) continue; sg.fillStyle = p.col; sg.fillRect(sx, sy, p.big ? 2 : 1, p.big ? 2 : 1); }
  };
  /* ---------- liquid ---------- */
  var colBuf = null;
  Su.drawLiquid = function (sg, w, cam, GY0, t) {
    var W = V.W, H = V.H, wlY = Math.round(GY0 - (w.wl - cam.y)); if (wlY > H + 4) return;
    if (!colBuf || colBuf.length !== W) colBuf = new Int16Array(W);
    var any = false, x0 = Math.floor(cam.x) - (W >> 1);
    for (var sx = 0; sx < W; sx++) { var gy = gAt(w, x0 + sx); colBuf[sx] = gy < w.wl ? Math.round(GY0 - (gy - cam.y)) : -9999; if (gy < w.wl) any = true; }
    if (!any) return;
    var cb = biomeAt(w, cam.x), lq = Su.LQ[(cb.liquid || w.liquid)] || Su.LQ.water, L = lq;
    var bands = [[0, 12, L.a, .5], [12, 40, L.b, .58], [40, 9999, L.c, .66]];
    for (var bi = 0; bi < bands.length; bi++) {
      var b = bands[bi]; sg.fillStyle = waterPatC(sg, L.key + bi, b[2], b[3]);
      for (sx = 0; sx < W; sx++) { var gs = colBuf[sx]; if (gs === -9999) continue; var ya = wlY + b[0], yb = Math.min(gs, wlY + b[1], H); if (yb > ya) sg.fillRect(sx, ya, 1, yb - ya); }
    }
    var wavePhase = V.reduced ? 0 : t * 2.2;
    for (sx = 0; sx < W; sx++) { if (colBuf[sx] === -9999) continue; var wv = Math.round(Math.sin((x0 + sx) * .28 + wavePhase) * .6 + Math.sin((x0 + sx) * .11 - wavePhase * .6) * .5); sg.fillStyle = L.surf; sg.fillRect(sx, wlY + wv, 1, 1); if (((x0 + sx + Math.floor(t * 3)) * 7) % 11 === 0) { sg.fillStyle = L.spark; sg.fillRect(sx, wlY + 2 + wv, 1, 1); } }
  };
  var patC = {};
  function waterPatC(g, key, col, dens) { if (patC[key]) return patC[key]; var c = V.mk(8, 8), cg = c.g; cg.fillStyle = col; for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) if (V.B8[y * 8 + x] < dens) cg.fillRect(x, y, 1, 1); return (patC[key] = g.createPattern(c, 'repeat')); }
  /* ---------- lights ---------- */
  Su.drawLights = function (g, w, cam, GY0, t, st, cb) {
    var W = V.W, night = st.nf, i, gs;
    if (night < .2 && !cb.glow) return;
    for (i = 0; i < w.items.length; i++) {
      var it = w.items[i]; if (!it._sp || !it._sp.glowC) continue; var sx = wdx(it.x, cam.x, w.WW) + W / 2; if (sx < -80 || sx > W + 80) continue;
      if (it.b.glow) { /* always-on glow in luminous biomes */ } else if (night < .25) continue;
      var sp = it._sp, dx = Math.round(sx - sp.w / 2), dy = Math.round(GY0 - (it.y - cam.y) - sp.h + 1);
      for (var k = 0; k < sp.glowC.length; k++) { var q = sp.glowC[k], gl = q.c; g.drawImage(gl, dx + q.x - q.r, dy + q.y - q.r); }
    }
    for (i = 0; i < w.critters.length; i++) {
      var c = w.critters[i], d = c.def; if (!d.glow) continue; if (d.night && night < .25 && !w.airless) continue; var sx2 = wdx(c.x, cam.x, w.WW) + W / 2; if (sx2 < -30 || sx2 > W + 30) continue;
      if (night < .25 && !cb.glow && !d.night) continue; var cy = c.cy != null ? c.cy : c.y, pulse = d.night ? .6 + .4 * Math.sin(t * 2.3 + c.ph * 3) : 1; if (pulse < .5) continue;
      g.drawImage(D.glowSprite(d.glow, d.night ? 5 : 7), Math.round(sx2) - (d.night ? 5 : 7), Math.round(GY0 - (cy - cam.y)) - (d.night ? 5 : 7) - 2);
    }
        var sh = Su.ship; if (night > .3 || sh.flame > 0) { var shx = Math.round(wdx(sh.x, cam.x, w.WW) + W / 2), shy = Math.round(GY0 - (gAt(w, sh.x) + sh.alt - cam.y)); if (sh.flame > 0) g.drawImage(D.glowSprite('#ff9a40', 30), shx - 30, shy - 2); else g.drawImage(D.glowSprite('#ffd070', 8), shx - 8, shy - 14); }
  };
  /* ---------- weather ---------- */
  var WPAR = null;
  function updWeather(w, dt, cb) {
    var wx = w.wx, type = cb.weather || null, ambient = type === 'ash' || type === 'spores';
    if (wx.type !== type) { wx.on = 0; if (wx.amt < .03) { wx.type = type; wx.amt = 0; } }
    else if (!type || w.airless) wx.on = 0; else if (ambient) wx.on = 1;
    else { w.weatherT -= dt; if (w.weatherT < 0) { if (wx.on) { wx.on = 0; w.weatherT = 50 + rr() * 90; } else { wx.on = 1; w.weatherT = 30 + rr() * 50; } } }
    wx.amt += (wx.on - wx.amt) * V.ease(.35, dt); if (wx.on === 0 && wx.amt < .01) wx.amt = 0;
    if (V.q.get('weather') && cb.weather) { wx.type = cb.weather; wx.on = 1; wx.amt = Math.min(1, wx.amt + dt); }
  }
  Su.drawWeather = function (g, w, cam, GY0, t, st) {
    var wx = w.wx; if (!wx.type || wx.amt < .02) return; var W = V.W, H = V.H, type = wx.type, N = 220;
    if (!WPAR || WPAR.W !== W || WPAR.H !== H) { WPAR = { W: W, H: H, p: [] }; var r = V.rng(5); for (var i = 0; i < 400; i++) WPAR.p.push([r() * W, r() * H, r(), r()]); }
    var cnt = Math.round(Math.min(WPAR.p.length, (type === 'ash' || type === 'spores' ? 130 : (type === 'dust' ? 160 : N * 1.6)) * wx.amt)), P = WPAR.p, cx = cam.x, cyv = cam.y, tm = V.reduced ? 0 : t;
    for (var i = 0; i < cnt; i++) {
      var p = P[i], x, y;
      if (type === 'rain') { x = ((p[0] - tm * 60 - cx * .8) % W + W) % W; y = ((p[1] + tm * (230 + p[2] * 60)) % H + H) % H; g.fillStyle = '#9ab8e8'; g.fillRect(Math.round(x), Math.round(y), 1, 3); if (p[3] > .9) { g.fillStyle = '#d8e8ff'; g.fillRect(Math.round(x), Math.round(y), 1, 1); } }
      else if (type === 'snow') { x = ((p[0] + Math.sin(tm * .8 + p[1]) * 6 - tm * 6 - cx * .8) % W + W) % W; y = ((p[1] + tm * (14 + p[2] * 22)) % H + H) % H; g.fillStyle = p[3] > .75 ? '#ffffff' : '#c8d8f0'; g.fillRect(Math.round(x), Math.round(y), 1, 1); if (p[3] > .93) g.fillRect(Math.round(x) + 1, Math.round(y), 1, 1); }
      else if (type === 'dust') { x = ((p[0] - tm * (110 + p[2] * 70) - cx) % W + W) % W; y = ((p[1] * .3 + H * .55 + Math.sin(tm + p[0]) * 3) % H); g.fillStyle = p[3] > .5 ? '#e0b878' : '#c8985a'; g.fillRect(Math.round(x), Math.round(y + p[2] * H * .3), 3, 1); }
      else if (type === 'ash') { x = ((p[0] + Math.sin(tm * .7 + p[1]) * 8 - cx * .9) % W + W) % W; y = (((p[1] - tm * (10 + p[2] * 14)) % H) + H) % H; g.fillStyle = p[3] > .8 ? '#ff9a30' : (p[3] > .4 ? '#7a6a6a' : '#3a3030'); g.fillRect(Math.round(x), Math.round(y), 1, 1); }
      else if (type === 'spores') { x = ((p[0] + Math.sin(tm * .5 + p[1]) * 10 - cx * .9) % W + W) % W; y = (((p[1] - tm * (5 + p[2] * 7)) % H) + H) % H; var tw = .5 + .5 * Math.sin(tm * 2 + p[0]); if (tw > .35) { g.fillStyle = p[3] > .5 ? '#c8a0ff' : '#7affe8'; g.fillRect(Math.round(x), Math.round(y), 1, 1); } }
    }
    if (type === 'rain' && wx.amt > .5 && (Math.floor(tm * 0.6 + 3) % 9 === 0) && (tm * 0.6) % 1 < .12) { g.fillStyle = 'rgba(210,225,255,.16)'; g.fillRect(0, 0, W, H); }
  };
  /* ---------- rare events ---------- */
  Su.rareDraw = function (g, w, st, cam, GY0, t) {
    var ev = w.rare.ev; if (!ev) return; var W = V.W, k = ev.t / ev.dur, hy = GY0 - 6;
    if (ev.kind === 'meteor') { var x = ev.x0 + ev.vx * ev.t, y = ev.y0 + ev.vy * ev.t; for (var i = 0; i < 12; i++) { var q = i / 12, px = Math.round(x - ev.vx * q * .09), py = Math.round(y - ev.vy * q * .09); if (i > 2 && V.bayer(px, py) < q * .9) continue; g.fillStyle = i === 0 ? '#ffffff' : i < 4 ? '#ffe8b0' : i < 8 ? '#ff9a50' : '#a04a60'; g.fillRect(px, py, 1, 1); } }
    else if (ev.kind === 'ufo') { var ux = Math.round(-30 + (W + 60) * (ev.dir > 0 ? k : 1 - k)), uy = Math.round(hy * .3 + Math.sin(ev.t * 1.7) * 3); var c = Su.ufoSprite(Math.floor(ev.t * 4) & 3); g.drawImage(c, ux - 12, uy); if (ev.beam && k > .45 && k < .6) { g.fillStyle = '#a8ffd8'; for (var yy = uy + 8; yy < GY0 + 20; yy++) { var hw = 3 + (yy - uy) * .12; for (var xx = -hw; xx <= hw; xx += 1) if (V.bayer(ux + xx, yy) < .35) g.fillRect(Math.round(ux + xx), yy, 1, 1); } } }
  };
  var ufoC = {};
  Su.ufoSprite = function (f) { if (ufoC[f]) return ufoC[f]; var p = new S.Paint(25, 9); p.ell(12, 5, 12, 3, function (x, y) { return S.tone(['#4a4a6a', '#8a8aa8', '#d0d0e8', '#ffffff'], .5 - (y - 5) / 8, x, y); }); p.ell(12, 3, 6, 3, function (x, y) { return S.tone(['#2a6a7a', '#5ad0e0', '#c8ffff'], .8 - (y - 3) / 4, x, y); }); for (var i = 0; i < 4; i++) p.set(4 + i * 5 + ((i + f) & 1 ? 0 : 0), 6, ((i + f) & 3) === 0 ? '#ffe040' : '#ff5a30'); return (ufoC[f] = p.done()); };
  function updRare(w, dt, st) {
    var R = w.rare; if (R.ev) { R.ev.t += dt; if (R.ev.kind === 'whale') { var e = R.ev, u = e.t / e.dur; if (u >= 1) R.ev = null; else { var h = 44 * 4 * u * (1 - u), wx = e.x + e.vx * e.t; if (!e.s0 && u > .05) { e.s0 = 1; puff(wx, w.wl, 14, '#d8f0ff', 14, 36); } if (!e.s1 && u > .94) { e.s1 = 1; puff(wx, w.wl, 14, '#d8f0ff', 14, 36); } e.wy = w.wl - 10 + h; e.wx = wx; e.wa = u; } } else if (R.ev.t >= R.ev.dur) R.ev = null; return; }
    R.t -= dt; if (R.t > 0) return; R.t = 30 + rr() * 50; var pl = Su.pl, W = V.W;
    var night = st.nf > .6 || w.airless, roll = rr();
    if (night && roll < .6) { var dir = rr() < .5 ? -1 : 1; R.ev = { kind: 'meteor', t: 0, dur: .9, x0: dir > 0 ? rr() * W * .4 : W * .6 + rr() * W * .4, y0: 4 + rr() * 30, vx: dir * (110 + rr() * 80), vy: 70 + rr() * 50 }; }
    else if (night && w.body.home && roll < .8) R.ev = { kind: 'ufo', t: 0, dur: 14, dir: rr() < .5 ? -1 : 1, beam: rr() < .5 };
    else if (w.wl > -999 && w.liquid === 'water' && w.biomes.some(function (b) { return b.id === 'sea' || b.id === 'isle'; }) && gAt(w, pl.x) < w.wl - 30 && roll < .8) { var wd = rr() < .5 ? -1 : 1; R.ev = { kind: 'whale', t: 0, dur: 2.6, x: pl.x + wd * -50, vx: wd * 38, wa: 0, wy: w.wl - 10, wx: pl.x, dir: wd }; }
    else if (!night && roll < .35) R.ev = { kind: 'meteor', t: 0, dur: .01, x0: -999, vx: 0, y0: 0, vy: 0 };
  }
  var whaleDraw = Su.drawCritters;
  Su.drawCritters = function (sg, w, cam, GY0, t) {
    whaleDraw(sg, w, cam, GY0, t);
    var ev = w.rare.ev; if (ev && ev.kind === 'whale' && ev.wx != null) { var sx = Math.round(wdx(ev.wx, cam.x, w.WW) + V.W / 2), c = S.whale(); if (ev.dir < 0) c = Su.flipped(c); sg.drawImage(c, sx - (c.width >> 1), Math.round(GY0 - (ev.wy - cam.y)) - (c.height >> 1)); }
  };
  /* ---------- main update ---------- */
  var acc = 0;
  Su.update = function (dt) {
    var w = Su.cur; if (!w) return; var pl = Su.pl, sh = Su.ship, cam = Su.cam, t = V.time;
    var st = Su.curSky = Su.skyState(w); Su.enterT += dt;
    if (Su.fixedTod != null) w.tod = Su.fixedTod; else w.tod = (w.tod + dt / w.dayLen) % 1;
    Su.windOff += dt * 3;
    var cb = biomeAt(w, pl.x); Su.curBiome = cb; updWeather(w, dt, cb); updRare(w, dt, st); updCritters(w, dt, t);
    if (Su.flash > 0) Su.flash = Math.max(0, Su.flash - dt * 2);
    var ctl = Su.mode === 'play' && !(V.game && V.game.fading) && !(V.prog && V.prog.open);
    if (Su.preUpdate) Su.preUpdate(w, dt);
    if (Su.mode === 'arrive') {
      var v = clamp(sh.alt * 1.15, 24, 210); sh.alt -= v * dt; sh.flame = clamp(sh.alt / 60, .35, 1) * (sh.alt > 0 ? 1 : 0); Su.ascent = clamp(sh.alt / 320, 0, 1) * .85;
      if (sh.alt <= 0) { sh.alt = 0; sh.flame = 0; Su.mode = 'hatch'; Su.hatchT = 0; Su.ascent = 0; var gc = Su.groundCol(w, sh.x); puff(sh.x, gAt(w, sh.x), 26, gc, 26, 22); V.shake = Math.max(V.shake || 0, .5); }
    } else if (Su.mode === 'hatch') { Su.hatchT += dt; sh.open = clamp((Su.hatchT - .25) / .5, 0, 1); if (Su.hatchT > .95) { Su.mode = 'play'; pl.hidden = false; pl.x = sh.x - 8; pl.y = gAt(w, pl.x); pl.face = -1; sh.open = 1; if (V.game && V.game.onLanded) V.game.onLanded(w.body); } }
    else if (Su.mode === 'board') {
      Su.boardT += dt; pl.face = wdx(sh.x - 8, pl.x, w.WW) > 0 ? 1 : -1; var dx = wdx(sh.x - 8, pl.x, w.WW); pl.vx = 0;
      if (Math.abs(dx) > 1.5) { pl.x = norm(w, pl.x + Math.sign(dx) * Math.min(Math.abs(dx), 64 * dt)); pl.y = gAt(w, pl.x); pl.anim += dt * 10; pl.ground = true; pl.vy = 0; }
      else { pl.hidden = true; sh.open = Math.max(0, sh.open - dt * 2.2); if (sh.open <= 0) { Su.mode = 'lift'; Su.liftT = 0; sh.vy = 0; if (V.game && V.game.onBoard) V.game.onBoard(); } }
    } else if (Su.mode === 'lift') {
      Su.liftT += dt; if (Su.liftT < .8) { sh.flame = Su.liftT / .8 * .6; V.shake = Math.max(V.shake || 0, .25 + Su.liftT * .25); if (Math.random() < dt * 40) puff(sh.x, gAt(w, sh.x), 2, Su.groundCol(w, sh.x), 14, 16); } else { sh.vy += (60 + (sh.alt * .5)) * dt * 1.4; sh.alt += sh.vy * dt; sh.flame = 1; Su.ascent = clamp(sh.alt / 700, 0, 1); }
      if (sh.alt > 760 && !Su.leaving) { Su.leaving = true; var body = w.body; V.game.fadeOut(.7, function () { Su.leaving = false; V.game.takeoff(body, sh.x / w.WW); }); }
    }
    if (ctl) {
      acc += dt; var h = 1 / 120, n = 0; if (acc > .1) acc = .1; while (acc >= h && n < 20) { stepPlayer(w, h, true); acc -= h; n++; }
      pl.moving = Math.abs(pl.vx) > 8 && pl.ground; if (pl.moving) pl.anim += dt * (Math.abs(pl.vx) / 62) * 9;
      var fh = findHint(w); Su.hint = Su.extHint ? Su.extHint(w, fh) : fh; if (V.input.actPressed) { if (Su.hint && Su.hint.ext) Su.extAct(w, Su.hint); else act(w); }
    } else if (Su.mode === 'play') { stepPlayer(w, dt, false); Su.hint = null; }
    else Su.hint = null;
    // particles
    var P = Su.parts; for (var i = P.length - 1; i >= 0; i--) { var p = P[i]; p.life += dt; if (p.life > p.max) { P[i] = P[P.length - 1]; P.pop(); continue; } p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy -= p.g * dt * .5; if (p.drag) { var d = Math.exp(-p.drag * dt); p.vx *= d; p.vy *= d; } }
    var F = Su.floats; for (i = F.length - 1; i >= 0; i--) { F[i].t += dt; if (F[i].t > 2.4) F.splice(i, 1); }
    // camera
    var tx, ty;
    if (Su.mode === 'play' || Su.mode === 'board') { tx = pl.x + pl.face * 14; ty = pl.y + 14; var gy = gAt(w, pl.x); if (!pl.swim) ty = Math.max(ty, gy + 14); }
    else { tx = sh.x; ty = gAt(w, sh.x) + 36 + sh.alt * (Su.mode === 'lift' ? .9 : .6); }
    var k = 1 - Math.exp(-(Su.mode === 'lift' ? 8 : 5.5) * dt); cam.x = norm(w, cam.x + wdx(tx, cam.x, w.WW) * k); cam.y += (ty - cam.y) * (1 - Math.exp(-4.5 * dt));
    if (Su.enterT < .02) { cam.x = norm(w, tx); cam.y = ty; }
  };
  /* ---------- overlay: key hint + scan labels ---------- */
  Su.drawOverlay = function (g) {
    var w = Su.cur; if (!w) return; var W = V.W, H = V.H, GY0 = Math.round(H * .66), cam = Su.cam, t = V.time;
    var h = Su.hint;
    if (h) { var sx = Math.round(wdx(h.x, cam.x, w.WW) + W / 2), sy = Math.round(GY0 - (h.y - cam.y)) - 14 - (Math.floor(t * 3) % 2); if (V.touch) { /* touch uses the on-screen button */ } g.fillStyle = '#0e0624'; g.fillRect(sx - 6, sy - 6, 13, 13); g.fillStyle = '#c04df0'; g.fillRect(sx - 6, sy - 6, 13, 1); g.fillRect(sx - 6, sy + 6, 13, 1); g.fillRect(sx - 6, sy - 6, 1, 13); g.fillRect(sx + 6, sy - 6, 1, 13); V.text(g, 'E', sx - 1, sy - 2, '#ffffff'); }
    for (var i = 0; i < Su.floats.length; i++) { var f = Su.floats[i], u = f.t / 2.4, fx = Math.round(wdx(f.x, cam.x, w.WW) + W / 2), fy = Math.round(GY0 - (f.y - cam.y) - Math.min(1, u * 3) * 12); if (u > .8 && V.bayer(fx, fy) < (u - .8) * 5) continue; V.glyph(g, f.icon || 'scan', fx - 2, fy, '#7affe8', '#1a0a3a'); }
  };
  Su.getSave = function () { var pl = Su.pl, w = Su.cur; return w ? { id: w.id, x: Math.round(pl.x), y: Math.round(pl.y), tod: +w.tod.toFixed(3) } : null; };
})();
