/* The Void — story beats: crash intro, wreck repair, home boundary, universal-drive warp, admin teleports. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, Su = V.surface, S = V.spr, Pg = V.prog, TAU = V.TAU, clamp = V.clamp;
  var St = V.story = { cine: null, sc: null, rep: null, edgeT: 0 };
  var REPAIR = 8;
  St.REPAIR = REPAIR;
  function seenIntro() { try { return !!localStorage.getItem('void:intro'); } catch (e) { return false; } }
  function markIntro() { try { localStorage.setItem('void:intro', '1'); } catch (e) { } }
  St.seenIntro = seenIntro;
  function onEarthWreck(w) { return w && w.body.home && w.body.type === 'earth' && !Pg.story.repaired; }

  /* ---------- 1. crash: orbit entry cinematic, then the surface impact ---------- */
  St.startCrash = function () {
    Pg.newGame(); St.canSkip = seenIntro() || V.q.has('skipintro'); St.cine = { k: 'entry', t: 0 }; V.game.state = 'cine'; if (V.ui) V.ui.setState('cine');
    if (V.q.has('skipintro')) St.skip();
  };
  var limb = null;
  function limbCanvas(W, H) {
    if (limb && limb.width === W && limb.height === H) return limb; limb = V.mk(W, H); var g = limb.g, img = g.createImageData(W, H), u = new Uint32Array(img.data.buffer), R = W * 1.25, cx = W * .5, cy = H + R * .62, pk = S.pk;
    var OC = ['#0a1a4a', '#12307a', '#1a4aa0', '#2a6ac8'].map(pk), LD = ['#1a4a2a', '#2a6a3a', '#4a8a4a', '#8a9a5a'].map(pk), CL = pk('#e8f0ff'), CL2 = pk('#a8b8e0'), ATM = [pk('#4a8aff'), pk('#8ac0ff'), pk('#c8e0ff')];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy), e = R - d; if (e < -6) continue;
      if (e < 0) { if (V.bayer(x, y) < (e + 6) / 6 * .8) u[y * W + x] = ATM[e > -2 ? 2 : e > -4 ? 1 : 0]; continue; }
      var nx = dx / R, ny = dy / R, lt = clamp(.85 - (nx * .7 + ny * .2), 0, 1) * clamp(e / 30, .3, 1), n = V.noise2(x * .018 + 3, y * .03, 7), c = V.noise2(x * .03, y * .07, 11);
      var pal = n > .58 ? LD : OC, q = Math.min(3, Math.floor(lt * 3.99 + V.bayer(x, y) * .5)); var col = pal[q];
      if (c > .6 && lt > .2) col = c > .68 ? CL : CL2; if (e < 3) col = ATM[2]; u[y * W + x] = col;
    }
    g.putImageData(img, 0, 0); return limb;
  }
  var stars = null;
  function starBg(g, W, H, t, sp) { if (!stars) { stars = []; var r = V.rng(9); for (var i = 0; i < 160; i++) stars.push([r(), r(), r()]); } g.fillStyle = '#05020d'; g.fillRect(0, 0, W, H); for (var i = 0; i < stars.length; i++) { var s = stars[i], x = Math.round(((s[0] * W - t * sp * (10 + s[2] * 30)) % W + W) % W), y = Math.round(s[1] * H); g.fillStyle = s[2] > .8 ? '#ffffff' : s[2] > .4 ? '#8c90c8' : '#4a4478'; g.fillRect(x, y, 1, 1); } }
  function drawEntry(g, c) {
    var W = V.W, H = V.H, t = c.t, u = clamp(t / 4.2, 0, 1); starBg(g, W, H, t, 1 + u * 4); var L = limbCanvas(W, H), rise = Math.round((1 - u) * H * .25); g.drawImage(L, 0, rise);
    var sx = W * (.18 + u * .5), sy = H * (.18 + u * u * .55), ang = Math.atan2(H * .55 * 2 * u + .01, W * .5) + .1, heat = clamp((u - .2) / .5, 0, 1), sh = !V.reduced && u > .3 ? Math.round((Math.random() - .5) * heat * 3) : 0;
    /* plasma streak behind the ship */
    var len = Math.round(6 + heat * 46), cols = ['#ffffff', '#fff6b0', '#ffb030', '#ff6a2a', '#c04df0', '#4a1a6a'];
    for (var l = 0; l < len; l++) { var q = l / len, wd = Math.max(1, Math.round((1 - q) * (2 + heat * 4))), px = Math.round(sx - Math.cos(ang) * (l + 4)), py = Math.round(sy - Math.sin(ang) * (l + 4)); for (var k = -wd; k <= wd; k++) { if (V.bayer(px + k, py + l) < q * .9) continue; g.fillStyle = cols[Math.min(cols.length - 1, Math.floor(q * cols.length + Math.abs(k) / 3))]; g.fillRect(px - Math.round(Math.sin(ang) * k) + sh, py + Math.round(Math.cos(ang) * k) + sh, 1, 1); } }
    if (heat > .1) { g.fillStyle = (Math.floor(t * 20) & 1) ? '#fff6b0' : '#ffb030'; var hx = Math.round(sx + Math.cos(ang) * 8), hy = Math.round(sy + Math.sin(ang) * 8); for (var a = -2; a <= 2; a++) g.fillRect(hx + a + sh, hy - Math.abs(a) + 1 + sh, 1, 1); }
    var f = S.shipFrame(ang, 0), cc = S.SHIP_C; g.drawImage(f, Math.round(sx) - cc + sh, Math.round(sy) - cc + sh);
    /* sparking failure flickers */
    if (u > .45 && (Math.floor(t * 13) % 5) === 0) { g.fillStyle = '#7affe8'; g.fillRect(Math.round(sx) + 3 + sh, Math.round(sy) - 4 + sh, 1, 1); g.fillRect(Math.round(sx) + 4, Math.round(sy) - 5, 1, 1); }
    if (u > .9) V.dissolve(g, (u - .9) * 10, '#ffffff');
    drawSkipHint(g);
  }
  function drawSkipHint(g) { if (!St.canSkip) return; var W = V.W, H = V.H; V.glyph(g, 'skip', W - 10, H - 10, (Math.floor(V.time * 2) & 1) ? '#efe6ff' : '#8a7ab8', '#05020d'); }
  St.updateCine = function (dt) {
    var c = St.cine; if (!c) return; c.t += dt;
    if (St.canSkip && c.t > .3 && (V.anyPressed() || (V.mouse && V.mouse.pressed))) { St.skip(); return; }
    if (c.k === 'entry' && c.t > 4.4) { St.cine = null; var e = G.getBody('0,0:3'); V.game.startSurface(e, { crash: true }); V.game.fade = 1; V.game.fadeIn(.25); }
    else if (c.k === 'warp') updWarp(c, dt);
  };
  St.drawCine = function (g) { var c = St.cine; if (!c) return; if (c.k === 'entry') drawEntry(g, c); else if (c.k === 'warp') drawWarp(g, c); };
  /* surface phase: a burning streak hits the ground, the hatch pops, you climb out */
  Su.startCrash = function (w) { var sh = Su.ship, pl = Su.pl; Su.mode = 'crash'; pl.hidden = true; sh.open = 0; St.sc = { t: 0, hit: false }; Su.cam.x = sh.x - 80; Su.cam.y = Su.gAt(w, sh.x) + 70; };
  St.surfUpdate = function (w, dt) {
    var sc = St.sc, sh = Su.ship, gy = Su.gAt(w, sh.x);
    if (sc && Su.mode === 'crash') {
      sc.t += dt; var T0 = 1.5;
      if (sc.t < T0) { var u = sc.t / T0, fx = sh.x - 300 * (1 - u), fy = gy + 280 * (1 - u); sc.fx = fx; sc.fy = fy; if (Math.random() < dt * 60) Su.parts.push({ x: fx + (Math.random() - .5) * 4, y: fy + (Math.random() - .5) * 4, vx: -20, vy: 10, life: 0, max: 1.2 + Math.random(), col: Math.random() < .4 ? '#ff9030' : Math.random() < .5 ? '#5a5070' : '#8a80a0', g: -10, big: Math.random() < .5 }); }
      else if (!sc.hit) { sc.hit = true; Su.flash = 1; V.shake = V.reduced ? 0 : 1.4; Su.puff(sh.x, gy, 40, Su.groundCol(w, sh.x), 30, 40); Su.puff(sh.x, gy + 4, 18, '#ff9030', 16, 50); Su.puff(sh.x, gy + 4, 12, '#8a92b8', 20, 70); if (V.sfx) V.sfx('crash'); }
      else if (sc.t > T0 + 1.6) { Su.mode = 'play'; var pl = Su.pl; pl.hidden = false; pl.x = sh.x - 24; pl.y = gy; pl.face = -1; pl.vy = 60; Su.puff(sh.x - 10, gy + 10, 10, '#c9c2ea', 8, 30); Pg.story.crashed = true; markIntro(); St.sc = null; if (V.save) V.save.write(); }
    }
    if (onEarthWreck(w) && Su.mode !== 'crash' || (sc && sc.hit)) { if (Math.random() < dt * 14) Su.parts.push({ x: sh.x + 6 + (Math.random() - .5) * 6, y: gy + 16, vx: 6 + Math.random() * 6, vy: 14 + Math.random() * 8, life: 0, max: 2 + Math.random() * 1.5, col: Math.random() < .5 ? '#4a4460' : '#6a6480', g: -4, big: true }); if (Math.random() < dt * 6) Su.parts.push({ x: sh.x - 8, y: gy + 8, vx: 0, vy: 8, life: 0, max: .5, col: '#ff9030', g: 0 }); }
    var rp = St.rep; if (rp) { rp.t += dt; if (Math.random() < dt * 50) { var a = Math.random() * TAU; Su.parts.push({ x: sh.x + (Math.random() - .5) * 30, y: gy + 4 + Math.random() * 16, vx: Math.cos(a) * 40, vy: Math.sin(a) * 40 + 20, life: 0, max: .35, col: Math.random() < .5 ? '#ffffff' : '#7affe8', g: 60 }); } if (rp.t > 2.6) { St.rep = null; Pg.story.repaired = true; Su.puff(sh.x, gy + 10, 24, '#7affe8', 20, 30); V.game.toast('SHIP REPAIRED'); if (V.save) V.save.write(); } }
  };
  St.wreckHint = function (w, fh) { if (!onEarthWreck(w)) return undefined; if (St.rep) return null; if (fh && fh.kind === 'ship') return { ext: true, kind: 'wreck', x: fh.x, y: fh.y }; return fh; };
  St.repairAct = function (w) { if (St.rep) return; if ((Pg.res.scrap || 0) >= REPAIR) { Pg.res.scrap -= REPAIR; St.rep = { t: 0 }; if (V.sfx) V.sfx('repair'); } else { St.deny = .5; if (V.sfx) V.sfx('deny'); } };
  St.drawShipOverride = function (sg, w, cam, GY0, t) {
    var sc = St.sc; if (sc && !sc.hit) return true; if (!onEarthWreck(w) && !St.rep) return false; if (St.rep && Pg.story.repaired) return false;
    var sh = Su.ship, W = V.W, gy = Su.gAt(w, sh.x), sx = Math.round(Su.wdx(sh.x, cam.x, w.WW) + W / 2), top = Math.round(GY0 - (gy - cam.y)); if (sx < -60 || sx > W + 60) return true;
    var wk = S.wreckShip(); sg.drawImage(wk, sx - 20, top - 22);
    if (St.rep) { /* repaired ship dithers in over the wreck */ var k = clamp(St.rep.t / 2.6, 0, 1), ok = S.landedShip(false, Pg.shipTier()), tmp = St._tmp || (St._tmp = V.mk(34, 20)); tmp.g.clearRect(0, 0, 34, 20); tmp.g.drawImage(ok, 0, 0); var id = tmp.g.getImageData(0, 0, 34, 20), d = id.data; for (var i = 0; i < 34 * 20; i++) if (V.bayer(i % 34, (i / 34) | 0) > k) d[i * 4 + 3] = 0; tmp.g.putImageData(id, 0, 0); sg.drawImage(tmp, sx - 17, top - 20); }
    /* crater rim */
    sg.fillStyle = '#3a2a20'; sg.fillRect(sx - 22, top, 44, 1);
    return true;
  };
  St.drawSurfFx = function (g, w, cam, GY0, t) {
    var sc = St.sc, W = V.W, sh = Su.ship;
    if (sc && !sc.hit && sc.fx != null) { var fx = Math.round(Su.wdx(sc.fx, cam.x, w.WW) + W / 2), fy = Math.round(GY0 - (sc.fy - cam.y)); for (var r = 6; r >= 0; r--) { g.fillStyle = r > 4 ? '#c04df0' : r > 2 ? '#ff6a2a' : r > 0 ? '#ffd060' : '#ffffff'; for (var a = 0; a < 12; a++) { var aa = a / 12 * TAU; if (V.bayer(a, r) < .3 && r > 4) continue; g.fillRect(fx + Math.round(Math.cos(aa) * r) - Math.round(r * .8 * (aa > Math.PI ? 1 : 0)), fy + Math.round(Math.sin(aa) * r * .7), 1, 1); } } g.fillStyle = '#ffffff'; g.fillRect(fx - 1, fy - 1, 3, 3); }
    if (sc) drawSkipHint(g);
    if (onEarthWreck(w) && Su.mode === 'play' && !St.rep) {
      var sx = Math.round(Su.wdx(sh.x, cam.x, w.WW) + W / 2), sy = Math.round(GY0 - (Su.gAt(w, sh.x) - cam.y)) - 36, n = Math.min(REPAIR, Pg.res.scrap || 0), bw = REPAIR * 5 + 9, x0 = sx - (bw >> 1) + (St.deny > 0 ? Math.round(Math.sin(St.deny * 50) * 2) : 0); if (St.deny > 0) St.deny -= 1 / 60;
      if (sx > -40 && sx < W + 40) { g.fillStyle = '#140a2e'; g.fillRect(x0 - 1, sy - 1, bw + 2, 9); V.glyph(g, 'wrench', x0 + 1, sy + 1, n >= REPAIR ? '#7aff8a' : '#ffc070'); for (var i = 0; i < REPAIR; i++) { g.fillStyle = i < n ? Pg.RCOL.scrap : '#3a3060'; g.fillRect(x0 + 8 + i * 5, sy + 2, 4, 3); if (i < n) { g.fillStyle = '#ffffff'; g.fillRect(x0 + 8 + i * 5, sy + 2, 1, 1); } } }
    }
  };
  St.skip = function () {
    markIntro(); var c = St.cine;
    if (c && c.k === 'warp') { finishWarp(c); return; }
    St.cine = null; St.sc = null; Pg.story.crashed = true;
    if (V.game.state === 'cine' || !Su.cur) { var e = G.getBody('0,0:3'); V.game.startSurface(e, {}); }
    else if (Su.mode === 'crash') { Su.mode = 'play'; Su.pl.hidden = false; Su.pl.x = Su.ship.x - 24; Su.pl.y = Su.gAt(Su.cur, Su.pl.x); }
    V.game.fade = 0; V.game.fadeDir = 0; V.game.fading = false; if (V.save) V.save.write();
  };
  Pg.skipStory = function () { St.skip(); Pg.story.repaired = true; St.rep = null; if (Su.cur) Su.mode = 'play'; if (V.save) V.save.write(); };

  /* ---------- 2. home boundary, and the universal drive warp ---------- */
  Pg.onUniversal = function () { V.game.toast('UNIVERSAL DRIVE'); St.edgeT = 0; };
  St.spaceUpdate = function (dt) {
    var sh = V.space.ship, d = Math.hypot(sh.x, sh.y), E = G.HOME_EDGE; if (St.edgeT > 0) St.edgeT -= dt;
    if (d > E && V.space.mode === 'fly') {
      if (!Pg.has('universal')) { var ux = sh.x / d, uy = sh.y / d, over = d - E, vn = sh.vx * ux + sh.vy * uy, push = 120 + over * 1.6; sh.vx -= ux * push * dt; sh.vy -= uy * push * dt; if (vn > 0) { sh.vx -= ux * vn * Math.min(1, dt * 3); sh.vy -= uy * vn * Math.min(1, dt * 3); } if (over > 700) { sh.x = ux * (E + 700); sh.y = uy * (E + 700); } St.edgeT = 2; }
      else if (!Pg.story.warped && !St.cine) St.warpTo(null);
    }
  };
  St.drawSpaceFx = function (g) {
    if (St.edgeT <= 0) return; var W = V.W, sh = V.space.ship, d = Math.hypot(sh.x, sh.y) || 1, a = Math.min(1, St.edgeT), x = (W >> 1) - 9, y = 18;
    if (V.bayer(x, y) > a * 1.2) return; g.fillStyle = '#140a2e'; g.fillRect(x - 2, y - 2, 23, 9); V.glyph(g, 'warp', x, y, '#c04df0'); V.glyph(g, 'lock', x + 7, y, '#ff6a6a'); V.glyph(g, 'part', x + 14, y, Pg.RCOL.part);
    /* subtle ring of the heliopause around the screen edge in the outward direction */
    var ux = sh.x / d, uy = sh.y / d, cx = W / 2 + ux * (W / 2 - 4), cy = V.H / 2 + uy * (V.H / 2 - 4); g.fillStyle = '#c04df0'; for (var i = -14; i <= 14; i++) { if ((i + Math.floor(V.time * 8)) % 3) continue; g.fillRect(Math.round(cx - uy * i), Math.round(cy + ux * i), 1, 1); }
  };
  function pickWarpSystem(tx, ty) {
    if (tx != null) return { x: tx, y: ty };
    for (var k = 0; k < 12; k++) { var ci = 2 + (k % 4), cj = Math.floor(k / 4) - 1, c = G.genCell(ci, cj); G.updateCell(c, G.t); if (c.systems.length) { var s0 = c.systems[0]; return { x: s0.x + 700, y: s0.y - 260, sys: s0 }; } }
    return { x: G.CELL * 2.5, y: 0 };
  }
  St.warpTo = function (target, fast) {
    if (St.cine) return; var dest = pickWarpSystem(target ? target.x : null, target ? target.y : null); St.cine = { k: 'warp', t: 0, dest: dest, fast: !!fast, dur: fast ? 2.2 : 4.6 }; V.game.state = 'cine'; if (V.ui) V.ui.setState('cine'); if (V.sfx) V.sfx('warp');
  };
  St.warpNow = function () { if (V.game.state === 'surface') { var b = V.game.body; Su.leave(); V.space.enter({ launch: b, ang: -Math.PI / 2 }); V.space.mode = 'fly'; } St.warpTo(null); };
  function updWarp(c, dt) { if (c.t > c.dur) finishWarp(c); }
  function finishWarp(c) {
    var sh = V.space.ship, d = c.dest; St.cine = null; sh.x = d.x; sh.y = d.y; sh.vx = -60; sh.vy = 20; V.space.cam.x = sh.x; V.space.cam.y = sh.y; V.space.mode = 'fly'; V.space.flash = 1; V.space.flashCol = '#ffffff';
    V.game.state = 'space'; if (V.ui) V.ui.setState('space'); Pg.story.warped = true; markIntro(); V.game.toast('WARP'); if (V.save) V.save.write();
  }
  function drawWarp(g, c) {
    var W = V.W, H = V.H, t = c.t, D = c.dur, cx = W >> 1, cy = H >> 1, sp = t / D, spin = clamp(t / (D * .26), 0, 1), lines = clamp((t - D * .22) / (D * .5), 0, 1), burst = clamp((t - D * .74) / (D * .14), 0, 1), after = clamp((t - D * .88) / (D * .12), 0, 1);
    if (lines < .02) { V.space.draw(g, 0); V.dissolve(g, spin * .55, '#05020d'); } else { g.fillStyle = '#05020d'; g.fillRect(0, 0, W, H); }
    /* starlines: radial streaks lengthening with speed */
    var r = V.rng(77), n = 140, cols = ['#ffffff', '#c8ccff', '#c04df0', '#7affe8'];
    if (lines > 0) for (var i = 0; i < n; i++) { var a = r() * TAU, d0 = 4 + r() * Math.max(W, H) * .7, z = (d0 / (Math.max(W, H) * .7) + lines * 2.2 + r()) % 1, rad = 6 + z * z * Math.max(W, H) * .8, len = 1 + lines * lines * z * 50, col = cols[i % 4]; g.fillStyle = col; for (var l = 0; l < len; l++) { var q = l / len; if (V.bayer(i, l) < q * .7) continue; g.fillRect(Math.round(cx + Math.cos(a) * (rad - l)), Math.round(cy + Math.sin(a) * (rad - l)), 1, 1); } }
    /* the ship, shaking more as the drive spins up, rings glowing */
    var sh = V.space.ship, jit = V.reduced ? 0 : Math.round((Math.random() - .5) * spin * 2), f = S.shipFrame(sh.ang, Pg.shipTier()), cc = S.SHIP_C; if (burst < .8) { g.drawImage(f, cx - cc + jit, cy - cc + jit); var rr = Math.round(cc + 2 + spin * 4 + Math.sin(t * 20) * 1); g.fillStyle = (Math.floor(t * 16) & 1) ? '#c04df0' : '#7affe8'; for (var k = 0; k < 24; k++) { if (V.bayer(k, Math.floor(t * 10)) > spin) continue; var aa = k / 24 * TAU + t * 6; g.fillRect(Math.round(cx + Math.cos(aa) * rr), Math.round(cy + Math.sin(aa) * rr), 1, 1); } }
    if (burst > 0) { var br = Math.round(burst * Math.max(W, H)); g.fillStyle = '#ffffff'; for (var y = -br; y <= br; y += 1) { var hw = Math.round(Math.sqrt(Math.max(0, br * br - y * y))); if (cy + y < 0 || cy + y >= H) continue; g.fillRect(Math.max(0, cx - hw), cy + y, Math.min(W, hw * 2), 1); } }
    if (after > 0) V.dissolve(g, 1 - after, '#ffffff');
    if (St.canSkip !== false) drawSkipHint(g);
  }

  /* ---------- 3. admin teleports ---------- */
  Pg.teleport = function (kind) {
    if (kind === 'mega' && V.bhfx) { Pg.story.crashed = true; Pg.story.repaired = true; St.cine = null; St.sc = null; Pg.unlock('universal'); return V.bhfx.teleport(); }
    var g = V.game, f = null; Pg.story.crashed = true; Pg.story.repaired = true; St.cine = null; St.sc = null;
    if (kind === 'earth') f = { body: G.getBody('0,0:3') };
    else if (kind === 'system') { var d = pickWarpSystem(); Su.leave(); g.state = 'space'; V.space.enter({ pos: { x: d.x, y: d.y } }); if (V.ui) V.ui.setState('space'); Pg.story.warped = true; return; }
    else { var fx = 0, fy = 0, homeKinds = { mars: 1, jupiter: 1, saturn: 1, earth: 1 }; if (!homeKinds[kind]) { fx = G.CELL * 2; } f = G.find(kind === 'shard' ? 'shattered' : kind, fx, fy); }
    if (!f || !f.body) { g.toast('NOT FOUND'); return; }
    var b = f.body; if (kind === 'bh' || kind === 'dyson' && false) { Su.leave(); g.state = 'space'; V.space.enter({ pos: { x: b.x + b.r * 5, y: b.y - b.r * 3 } }); if (V.ui) V.ui.setState('space'); return; }
    if (b.isStar || b.landable === false) { Su.leave(); g.state = 'space'; V.space.enter({ pos: { x: b.x + b.r * 3, y: b.y } }); if (V.ui) V.ui.setState('space'); return; }
    G.updateCell(b.cell, G.t); V.space.ship.x = b.x + b.r + 60; V.space.ship.y = b.y; g.startSurface(b, {}); g.toast(G.nameOf(b), V.themeName(b));
  };
})();
