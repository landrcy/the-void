/* The Void — space flight: starfield, ship, gravity, landing, black holes, map, rare events. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, P = V.planets, S = V.spr, D = V.decor, TAU = V.TAU, clamp = V.clamp;
  var Sp = V.space = { ship: { x: 0, y: 0, vx: 0, vy: 0, ang: -Math.PI / 2, thr: 0, boostT: 0 }, cam: { x: 0, y: 0, lx: 0, ly: 0 }, mode: 'fly', seen: {}, seenCount: 0, near: [], hint: null, mapOpen: false, events: [], evT: 40, flash: 0, flashCol: '#ffffff', transits: 0 };
  var NAMES = { earth: 'GARDEN WORLD', ocean: 'OCEAN WORLD', jungle: 'JUNGLE WORLD', desert: 'DESERT WORLD', rocky: 'ROCKY WORLD', moon: 'MOON', ice: 'ICE WORLD', lava: 'LAVA WORLD', crystal: 'CRYSTAL WORLD', gas: 'GAS GIANT', icegas: 'ICE GIANT', venus: 'CLOUD WORLD', asteroid: 'ASTEROID', comet: 'COMET', ruins: 'ANCIENT RUINS', station: 'SPACE STATION', wreck: 'SHIP WRECK', donut: 'TORUS WORLD', cube: 'CUBE WORLD', ringworld: 'RINGWORLD', star: 'STAR', bh: 'BLACK HOLE' };
  V.themeName = function (b) { if (b.home && b.type === 'earth') return 'HOME'; if (b.isStar) return ({ yellow: 'YELLOW STAR', orange: 'ORANGE STAR', red: 'RED DWARF', white: 'WHITE STAR', blue: 'BLUE GIANT', giant: 'RED GIANT', neutron: 'PULSAR' })[b.skind] || 'STAR'; if (b.moonOf && b.type !== 'moon') return (NAMES[b.type] || '') + ' MOON'; return NAMES[b.type] || b.type.toUpperCase(); };
  var rr = V.rng(4242);

  /* ---------- starfield: three tiled parallax layers, pixel-pure ---------- */
  var layers = null;
  function buildStars() {
    layers = []; var defs = [{ n: 120, f: .04, cols: ['#3a3460', '#4a4478', '#6a6098'] }, { n: 70, f: .12, cols: ['#6a70a8', '#8c90c8', '#b8bce8'] }, { n: 34, f: .3, cols: ['#c8ccff', '#ffffff', '#ffe8c8', '#c8e0ff'] }];
    defs.forEach(function (d, i) { var T = 256, c = V.mk(T, T), g = c.g, r = V.rng(77 + i); for (var k = 0; k < d.n; k++) { var x = r() * T | 0, y = r() * T | 0; g.fillStyle = V.pick(r, d.cols); g.fillRect(x, y, 1, 1); if (i === 2 && r() < .2) { g.globalAlpha = 1; g.fillStyle = d.cols[0]; g.fillRect(x - 1, y, 1, 1); g.fillRect(x + 1, y, 1, 1); g.fillRect(x, y - 1, 1, 1); g.fillRect(x, y + 1, 1, 1); g.fillStyle = '#ffffff'; g.fillRect(x, y, 1, 1); } }
      c.f = d.f; layers.push(c); });
  }
  /* ---------- enter / leave ---------- */
  Sp.enter = function (o) {
    o = o || {}; var sh = Sp.ship; Sp.mode = 'fly'; Sp.hint = null; Sp.mapOpen = false; Sp.flash = 0; Sp.events.length = 0; Sp.evT = 25 + rr() * 30; Sp.lastNear = null; Sp.active = true;
    if (o.launch) { var b = o.launch, a = o.ang != null ? o.ang : -Math.PI / 2; G.updateCell(b.cell, G.t); sh.x = b.x; sh.y = b.y; sh.ang = a; sh.vx = Math.cos(a) * 70; sh.vy = Math.sin(a) * 70; Sp.mode = 'launch'; Sp.modeT = 0; Sp.launchBody = b; Sp.lastNear = b; if (!Sp.seen[b.id]) { Sp.seen[b.id] = 1; Sp.seenCount++; } }
    else if (o.pos) { sh.x = o.pos.x; sh.y = o.pos.y; sh.vx = sh.vy = 0; sh.ang = o.pos.ang || -Math.PI / 2; }
    else { var e = G.getBody('0,0:3'); G.updateCell(e.cell, G.t); sh.x = e.x + e.r + 70; sh.y = e.y - 30; sh.vx = sh.vy = 0; sh.ang = -Math.PI / 2; }
    Sp.cam.x = sh.x; Sp.cam.y = sh.y; Sp.cam.lx = Sp.cam.ly = 0;
  };
  Sp.leave = function () { Sp.active = false; };
  Sp.refreshShip = function () { };
  Sp.getSave = function () { var s = Sp.ship; return { x: Math.round(s.x), y: Math.round(s.y), ang: +s.ang.toFixed(2) }; };

  /* ---------- physics ---------- */
  function massOf(b) { if (b.isBH) return b.mass * 2.6; if (b.isStar) return b.r * b.r * 26; return b.r * b.r * 5; }
  var near = [];
  function nearBodies() { G.near(Sp.ship.x, Sp.ship.y, 2600, near); return near; }
  function step(dt, ctl) {
    var sh = Sp.ship, inp = V.input, Pg = V.prog, canBoost = Pg.cheat.fuel || Pg.fuel > 0, boosting = ctl && inp.boost && inp.y < 0 && canBoost;
    if (ctl) {
      var turn = inp.x; sh.ang += turn * 3.4 * dt;
      var thr = inp.y < 0 ? 1 : 0; sh.thr = thr; if (boosting) { sh.boostT += dt; if (!Pg.cheat.fuel) Pg.fuel = Math.max(0, Pg.fuel - dt / (Pg.has('shield') ? 14 : 7) * (Pg.has('warp1') ? .6 : 1)); } else { sh.boostT = Math.max(0, sh.boostT - dt * 3); Pg.fuel = Math.min(1, Pg.fuel + dt / 10 * (Pg.has('warp3') ? 3 : 1) * (Pg.has('mothership') ? 2 : 1)); }
      var a = (thr ? (boosting ? 560 + Math.min(sh.boostT, 3) * 300 : 210) : 0) * (Pg.has('thrust') ? 1.35 : 1) * (Pg.has('engines') ? 1.3 : 1) * (Pg.has('nova') ? 1.5 : 1) * (1 + .08 * (Pg.shipStage ? Pg.shipStage() : 0));
      sh.vx += Math.cos(sh.ang) * a * dt; sh.vy += Math.sin(sh.ang) * a * dt;
      if (inp.y > 0) { var k = Math.exp(-(Pg.has('brakes') ? 5.5 : 2.4) * dt); sh.vx *= k; sh.vy *= k; }
    } else sh.thr = 0;
    var sp = Math.hypot(sh.vx, sh.vy), cap = sh.boostT > 0 ? (520 + Math.min(sh.boostT, 3) * 560) * (Pg.has('warp2') ? 1.5 : 1) : 260;
    var drag = Math.exp(-(sp > cap ? 1.6 : .12) * dt); sh.vx *= drag; sh.vy *= drag;
    /* gravity: gentle, capped */
    var list = near;
    for (var i = 0; i < list.length; i++) {
      var b = list[i], dx = b.x - sh.x, dy = b.y - sh.y, d2 = dx * dx + dy * dy; if (d2 > 1600 * 1600) continue; var d = Math.sqrt(d2) || 1;
      var acc = Math.min(massOf(b) / (d2 + b.r * b.r * 2), b.isBH ? (b.mega ? 900 : 520) : 140) * (b.isBH && V.prog.has('deflector') ? .5 : 1); sh.vx += dx / d * acc * dt; sh.vy += dy / d * acc * dt;
      if (Sp.mode === 'fly' || Sp.mode === 'launch') {
        if (b.isBH) { if (d < b.r * 1.7 && V.prog.has('bhsurf') && !(ctl && inp.y > 0)) { if (!b._surfT || G.t - b._surfT > 3) { b._surfT = G.t; var tx = -dy / d, ty = dx / d, sgn = (sh.vx * tx + sh.vy * ty) >= 0 ? 1 : -1, v0 = Math.max(600, Math.hypot(sh.vx, sh.vy) * 1.8); sh.vx = tx * sgn * v0 + (-dx / d) * 200; sh.vy = ty * sgn * v0 + (-dy / d) * 200; sh.boostT = 2; Sp.flash = .4; Sp.flashCol = '#c04df0'; V.game.toast('SLINGSHOT'); } continue; } if (d < b.r * .8) Sp.transit(b); continue; }
        var rr2 = b.r * (b.elong ? Math.max(1, b.elong) * .85 : 1) + (b.isStar ? 10 : 4); if (b.ring) rr2 = b.r + 4;
        if (d < rr2 && !(Sp.mode === 'launch' && b === Sp.launchBody)) {
          var nx = -dx / d, ny = -dy / d; sh.x = b.x + nx * rr2; sh.y = b.y + ny * rr2; var vn = sh.vx * nx + sh.vy * ny; if (vn < 0) { sh.vx -= vn * 1.5 * nx; sh.vy -= vn * 1.5 * ny; if (-vn > 120 && !V.prog.has('shield')) V.shake = Math.min(1.2, -vn / 300); }
          if (b.isStar && !Sp.hotMsg && !V.prog.cheat.god && !V.prog.has('bubble')) { Sp.hotMsg = 1; V.game.toast('TOO HOT'); Sp.flash = .5; Sp.flashCol = '#ffb060'; setTimeout(function () { Sp.hotMsg = 0; }, 4000); }
        }
      }
    }
    sh.x += sh.vx * dt; sh.y += sh.vy * dt;
  }
  Sp.transit = function (bh) {
    if (Sp.mode === 'transit') return; Sp.mode = 'transit'; Sp.modeT = 0; Sp.transits++; var sh = Sp.ship; Sp.fromBH = bh;
    V.game.fadeOut(1.1, function () {
      var r = V.rng(V.hash(G.seed, Sp.transits, bh.seed | 0)), cx, cy, tries = 0, star = null;
      do { var a = r() * TAU, dist = 9 + Math.floor(r() * 24); cx = Math.round(G.cellIndex(sh.x) + Math.cos(a) * dist); cy = Math.round(G.cellIndex(sh.y) + Math.sin(a) * dist); var c = G.genCell(cx, cy); G.updateCell(c, G.t); star = c.systems.length ? c.systems[0] : null; tries++; } while (!star && tries < 30);
      var px = star ? star.x : cx * G.CELL, py = star ? star.y : cy * G.CELL, off = star ? 900 : 0; sh.x = px + off; sh.y = py - off * .3; sh.vx = -80; sh.vy = 30; Sp.cam.x = sh.x; Sp.cam.y = sh.y; Sp.mode = 'fly'; Sp.flash = 1; Sp.flashCol = '#ffffff';
      V.game.toast('SPACETIME TRANSIT', Math.abs(cx) + ' ' + Math.abs(cy)); V.game.fadeIn(.8);
    });
  };

  /* ---------- update ---------- */
  var acc = 0;
  Sp.update = function (dt) {
    var sh = Sp.ship, inp = V.input, Pg = V.prog; G.t += dt * (Sp.slow ? .35 : 1); nearBodies(); Sp.near = near;
    if (V.galmap) V.galmap.keys(); else { if (V.keyPressed('m') || V.keyPressed('Tab')) Sp.mapOpen = !Sp.mapOpen; if (V.keyPressed('Escape')) Sp.mapOpen = false; }
    var ctl = (Sp.mode === 'fly') && !V.game.fading && !Sp.mapOpen && !Pg.open;
    if (ctl && V.keyPressed('c') && Pg.has('cloak')) { Sp.cloak = !Sp.cloak; V.game.toast(Sp.cloak ? 'CLOAK' : 'UNCLOAK'); }
    if (ctl && V.keyPressed('t') && Pg.has('timeslow')) Sp.slow = !Sp.slow;
    if (ctl && (V.keyPressed('q') || Sp.pulseReq)) { Sp.pulseReq = false; Sp.pulse = { t: 0 }; if (V.sfx) V.sfx('scan'); var rng = Pg.has('scanner') ? 9000 : 4200; G.near(sh.x, sh.y, rng, far); far.forEach(function (b) { if (b.type === 'asteroid') return; b._ping = G.t; if (!Sp.seen[b.id] && Math.hypot(b.x - sh.x, b.y - sh.y) < rng) { Sp.seen[b.id] = 1; Sp.seenCount++; } }); if (V.sfx) V.sfx('scan'); }
    if (Sp.pulse) { Sp.pulse.t += dt; if (Sp.pulse.t > 2.5) Sp.pulse = null; }
    if (V.aliens) V.aliens.update(dt, ctl); if (V.story) V.story.spaceUpdate(dt);
    if (Sp.mode === 'launch') { Sp.modeT += dt; var lb = Sp.launchBody; var k = Math.min(1, Sp.modeT / 1.4); if (Sp.modeT < 1.4) { var d0 = lb.r * k * 1.25 + 4; sh.x = lb.x + Math.cos(sh.ang) * d0; sh.y = lb.y + Math.sin(sh.ang) * d0; sh.thr = 1; sh.vx = Math.cos(sh.ang) * 90; sh.vy = Math.sin(sh.ang) * 90; } else { Sp.mode = 'fly'; } }
    else if (Sp.mode === 'landing') {
      Sp.modeT += dt; var b = Sp.target, u = Math.min(1, Sp.modeT / 1.5), e = u * u * (3 - 2 * u), dx = sh.x0 - b.x, dy = sh.y0 - b.y, d = Math.hypot(dx, dy) || 1;
      var dd = d * (1 - e) + (b.r * .2) * e; sh.x = b.x + dx / d * dd; sh.y = b.y + dy / d * dd; var want = Math.atan2(-dy, -dx), df = ((want - sh.ang + Math.PI * 3) % TAU) - Math.PI; sh.ang += df * Math.min(1, dt * 6); sh.thr = u < .7 ? 1 : 0;
      if (u >= 1 && !Sp.landFired) { Sp.landFired = true; V.game.land(b); }
    }
    if (Sp.mode === 'fly' || Sp.mode === 'launch') { acc += dt; var h = 1 / 120, n = 0; if (acc > .1) acc = .1; while (acc >= h && n < 20) { step(h, ctl); acc -= h; n++; } }
    if (Sp.flash > 0) Sp.flash = Math.max(0, Sp.flash - dt * 1.6);
    /* nearest landable body + first sightings */
    Sp.hint = null; var best = null, bd = 1e9;
    for (var i = 0; i < near.length; i++) {
      var b2 = near[i], dx2 = b2.x - sh.x, dy2 = b2.y - sh.y, d2 = Math.hypot(dx2, dy2), edge = d2 - b2.r * (b2.ring ? 1 : (b2.elong || 1));
      if (!Sp.seen[b2.id] && edge < Math.max(110, b2.r * 1.8) && b2.type !== 'asteroid') { Sp.seen[b2.id] = 1; Sp.seenCount++; V.game.toast(G.nameOf(b2), V.themeName(b2)); }
      if (b2.landable !== false && !b2.isStar && !b2.isBH && edge < 46 + b2.r * .3 && edge < bd) { bd = edge; best = b2; }
    }
    var needGear = best && !Pg.has('gear') && (best.type === 'gas' || best.type === 'icegas' || best.huge); Sp.needGear = needGear;
    if (best && ctl && !(V.aliens && V.aliens.hint)) { Sp.hint = best; if (inp.actPressed && needGear) { Sp.gearDeny = .5; } else if (inp.actPressed) { Sp.mode = 'landing'; Sp.modeT = 0; Sp.target = best; sh.x0 = sh.x; sh.y0 = sh.y; Sp.landFired = false; sh.vx = sh.vy = 0; } }
    /* camera with a little look-ahead */
    var cam = Sp.cam, lk = 1 - Math.exp(-2.5 * dt), lim = Math.min(V.W, V.H) * .22;
    cam.lx += (clamp(sh.vx * .25, -lim, lim) - cam.lx) * lk; cam.ly += (clamp(sh.vy * .25, -lim, lim) - cam.ly) * lk;
    if (Sp.mode === 'landing') { var tb = Sp.target; cam.x += (tb.x - cam.x) * (1 - Math.exp(-3 * dt)); cam.y += (tb.y - cam.y) * (1 - Math.exp(-3 * dt)); }
    else { cam.x = sh.x + cam.lx; cam.y = sh.y + cam.ly; }
    updEvents(dt);
  };

  /* ---------- rare events: space whales, meteor swarms, a ghost ship ---------- */
  var whaleCv = null;
  function spaceWhale() { if (whaleCv) return whaleCv; var src = S.whale(), c = V.mk(src.width, src.height), g = c.g; g.drawImage(src, 0, 0); var img = g.getImageData(0, 0, c.width, c.height), d = img.data; for (var i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue; var l = (d[i] * .3 + d[i + 1] * .5 + d[i + 2] * .2) / 255, pal = [[26, 10, 58], [74, 30, 130], [140, 70, 210], [200, 150, 255], [255, 230, 255]], q = pal[Math.min(4, Math.floor(l * 5))]; d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2]; d[i + 3] = 255; } g.putImageData(img, 0, 0); return (whaleCv = c); }
  function updEvents(dt) {
    var E = Sp.events; for (var i = E.length - 1; i >= 0; i--) { var e = E[i]; e.t += dt; e.x += e.vx * dt; e.y += e.vy * dt; if (e.t > e.dur) E.splice(i, 1); }
    Sp.evT -= dt; if (Sp.evT > 0 || Sp.mode !== 'fly') return; Sp.evT = 45 + rr() * 70;
    var sh = Sp.ship, c = G.genCell(G.cellIndex(sh.x), G.cellIndex(sh.y)), roll = rr(), side = rr() < .5 ? -1 : 1;
    var whaleBias = c.marks.indexOf('whale') >= 0 ? .6 : .22;
    if (roll < whaleBias) E.push({ kind: 'whale', t: 0, dur: 26, x: sh.x - side * (V.W * .8), y: sh.y + (rr() - .5) * V.H * .6, vx: side * 34, vy: (rr() - .5) * 6 });
    else if (roll < whaleBias + .4) { for (var k = 0; k < 14; k++) E.push({ kind: 'meteor', t: -k * .25 * rr(), dur: 3, x: sh.x - side * V.W * (.6 + rr() * .4), y: sh.y - V.H * (.5 + rr() * .3), vx: side * (220 + rr() * 80), vy: 140 + rr() * 60 }); }
    else E.push({ kind: 'ghost', t: 0, dur: 18, x: sh.x - side * V.W * .7, y: sh.y + (rr() - .5) * V.H * .5, vx: side * 50, vy: 0, ang: side > 0 ? 0 : Math.PI });
  }

  /* ---------- drawing ---------- */
  var nebCache = {};
  function drawStarfield(g, cam) {
    if (!layers) buildStars(); var W = V.W, H = V.H;
    g.fillStyle = '#05020d'; g.fillRect(0, 0, W, H);
    for (var i = 0; i < layers.length; i++) { var L = layers[i], T = 256, ox = (((-cam.x * L.f) % T) + T) % T, oy = (((-cam.y * L.f) % T) + T) % T; ox = Math.round(ox) - T; oy = Math.round(oy) - T; for (var y = oy; y < H; y += T) for (var x = ox; x < W; x += T) g.drawImage(L, x, y); }
    /* warp streaks when boosting hard */
    var sh = Sp.ship, sp = Math.hypot(sh.vx, sh.vy); if (sp > 700 && !V.reduced) { var n = Math.min(60, (sp - 700) / 12 | 0), r = V.rng(V.frame), ux = -sh.vx / sp, uy = -sh.vy / sp, L2 = Math.min(26, (sp - 700) / 40); g.fillStyle = '#b8bce8'; for (var k = 0; k < n; k++) { var x0 = r() * W, y0 = r() * H; for (var l = 0; l < L2; l++) if (V.bayer(l, k) < 1 - l / L2) g.fillRect(Math.round(x0 + ux * l), Math.round(y0 + uy * l), 1, 1); } }
  }
  function drawNebulae(g, cam) {
    var W = V.W, H = V.H, cs = G.cellsNear(cam.x, cam.y, 6000);
    for (var i = 0; i < cs.length; i++) { var c = cs[i]; for (var k = 0; k < c.nebulae.length; k++) { var n = c.nebulae[k], f = .55, sx = Math.round((n.x - cam.x) * f + W / 2), sy = Math.round((n.y - cam.y) * f + H / 2), cv = nebCache[n.seed + ':' + G.seed] || (nebCache[n.seed + ':' + G.seed] = P.renderNebula(n)); if (sx + cv.width / 2 < 0 || sx - cv.width / 2 > W || sy + cv.height / 2 < 0 || sy - cv.height / 2 > H) continue; g.drawImage(cv, sx - (cv.width >> 1), sy - (cv.height >> 1)); } }
  }
  function drawOrbits(g, cam) {
    var W = V.W, H = V.H, sh = Sp.ship, sys = null, bd = 1e9;
    for (var i = 0; i < near.length; i++) { var b = near[i]; if (!b.isStar && !b.isBH) continue; var d = Math.hypot(b.x - sh.x, b.y - sh.y); if (d < bd) { bd = d; sys = b.sys; } }
    if (!sys || bd > 5200) return; g.fillStyle = '#1e1640';
    for (i = 0; i < near.length; i++) { var p = near[i]; if (p.sys !== sys || !p.orbit || p.orbit.parent || p.type === 'asteroid' || p.isStar || p.orbit.e > 0) continue; var o = p.orbit, cx = o.ox - cam.x + W / 2, cy = o.oy - cam.y + H / 2, n = Math.max(40, Math.round(o.a * TAU / 7)); for (var k = 0; k < n; k++) { var a = k / n * TAU, x = Math.round(cx + Math.cos(a) * o.a), y = Math.round(cy + Math.sin(a) * o.a); if (x >= 0 && y >= 0 && x < W && y < H) g.fillRect(x, y, 1, 1); } }
  }
  function drawShip(g, sx, sy, t) {
    var sh = Sp.ship, stg = V.prog.shipStage ? V.prog.shipStage() : 0, f = stg ? S.stageFrame(sh.ang, stg, t) : S.shipFrame(sh.ang, V.prog.shipTier()), c = stg ? S.stageC(stg) : S.SHIP_C, rear = stg ? S.stageRear(stg) : c;
    if (sh.thr) { var bx = sx - Math.cos(sh.ang) * (rear - 1), by = sy - Math.sin(sh.ang) * (rear - 1), len = 4 + (sh.boostT > 0 ? 6 : 0) + stg * 2 + (Math.floor(t * 30) % 3); var cols = ['#fff6b0', '#ffb030', '#e0501a', '#8a2a8a']; for (var l = 0; l < len; l++) { var q = l / len, px = Math.round(bx - Math.cos(sh.ang) * l), py = Math.round(by - Math.sin(sh.ang) * l); if (l > 1 && V.bayer(px, py) < q * .8) continue; g.fillStyle = cols[Math.min(3, Math.floor(q * 4))]; g.fillRect(px, py, 1, 1); if (q < .4) { g.fillRect(px + Math.round(Math.sin(sh.ang)), py - Math.round(Math.cos(sh.ang)), 1, 1); g.fillRect(px - Math.round(Math.sin(sh.ang)), py + Math.round(Math.cos(sh.ang)), 1, 1); } } }
    if (Sp.cloak) { var cv = Sp._clk || (Sp._clk = V.mk(c * 2 + 1, c * 2 + 1)); cv.g.clearRect(0, 0, cv.width, cv.height); cv.g.drawImage(f, 0, 0); var id = cv.g.getImageData(0, 0, cv.width, cv.height), d = id.data; for (var i = 0; i < d.length; i += 4) { var px = (i >> 2) % cv.width, py = ((i >> 2) / cv.width) | 0; if (V.bayer(px + V.frame, py) < .6) d[i + 3] = 0; else { d[i] = d[i] * .5 + 60; d[i + 1] = d[i + 1] * .5 + 110; d[i + 2] = d[i + 2] * .5 + 120; } } cv.g.putImageData(id, 0, 0); f = cv; }
    g.drawImage(f, Math.round(sx) - c, Math.round(sy) - c); if (V.bhfx) V.bhfx.shipFx(g, f, sx, sy, c);
    if (V.prog.shipTier() >= 4 && !Sp.cloak) { g.fillStyle = (Math.floor(t * 6) & 1) ? '#ff8ae8' : '#9af0ff'; for (var k2 = 0; k2 < 3; k2++) { var aa = t * 2 + k2 * TAU / 3, rr = c + 2; g.fillRect(Math.round(sx + Math.cos(aa) * rr), Math.round(sy + Math.sin(aa) * rr), 1, 1); } }
  }
  Sp.draw = function (g, dt) {
    var W = V.W, H = V.H, cam = Sp.cam, t = V.time, sh = Sp.ship; P.frameBudget(6);
    var cx = Math.round(cam.x), cy = Math.round(cam.y);
    drawStarfield(g, cam); drawNebulae(g, cam); drawOrbits(g, { x: cx, y: cy });
    /* events behind the bodies */
    for (var i = 0; i < Sp.events.length; i++) { var e = Sp.events[i], ex = Math.round(e.x - cx + W / 2), ey = Math.round(e.y - cy + H / 2); if (e.kind === 'whale') { var wc = spaceWhale(), fl = e.vx < 0 ? V.surface.flipped(wc) : wc; var bob = Math.round(Math.sin(e.t * .8) * 3); g.drawImage(fl, ex - (wc.width >> 1), ey - (wc.height >> 1) + bob); for (var k = 0; k < 10; k++) { var px = ex - Math.sign(e.vx) * (wc.width / 2 + k * 3), py = ey + Math.round(Math.sin(e.t * 2 + k) * 2) + bob; if ((k + V.frame) % 3 === 0) continue; g.fillStyle = k < 4 ? '#c8a0ff' : '#6a3ab0'; g.fillRect(px, py, 1, 1); } } else if (e.kind === 'ghost') { var gf = S.shipFrame(e.ang), cc = S.SHIP_C, ph = Math.sin(e.t * 3) > -.3; if (ph) { g.save(); g.globalCompositeOperation = 'source-over'; V.dissolve(g, 0, '#000'); g.drawImage(gf, ex - cc, ey - cc); g.restore(); g.fillStyle = '#05020d'; for (var yy = -cc; yy <= cc; yy += 2) g.fillRect(ex - cc, ey + yy + (Math.floor(e.t * 8) & 1), cc * 2 + 1, 1); } } else if (e.kind === 'meteor' && e.t > 0) { for (var l = 0; l < 9; l++) { var mx = Math.round(ex - e.vx * l * .012), my = Math.round(ey - e.vy * l * .012); if (l > 1 && V.bayer(mx, my) < l / 9) continue; g.fillStyle = l === 0 ? '#ffffff' : l < 4 ? '#ffd8a0' : '#a04a6a'; g.fillRect(mx, my, 1, 1); } } }
    /* bodies, back to front: comets/asteroids, then the rest */
    var drawn = 0, shipDrawn = false, hideShip = (Sp.mode === 'landing' && Sp.modeT > 1.0) || (Sp.mode === 'launch' && Sp.modeT < .5);
    var shipUnder = (Sp.mode === 'landing' && Sp.modeT > .75) || (Sp.mode === 'launch' && Sp.modeT < .9), underBody = Sp.mode === 'landing' ? Sp.target : Sp.launchBody;
    var list = near.slice().sort(function (a, b) { return (a.isStar ? 0 : 1) - (b.isStar ? 0 : 1) || a.r - b.r; });
    for (i = 0; i < list.length; i++) {
      var b = list[i], sx = b.x - cx + W / 2, sy = b.y - cy + H / 2, ext = b.isStar ? b.r * 2.4 + 20 : b.ring ? b.r * (b.ring.out + .2) : b.isBH ? b.r * 4 : b.r * 1.6 + (b.type === 'comet' ? 80 : 4);
      if (sx + ext < 0 || sx - ext > W || sy + ext < 0 || sy - ext > H) continue;
      if (shipUnder && b === underBody && !shipDrawn) { shipDrawn = true; if (!hideShip) drawShip(g, sh.x - cx + W / 2, sh.y - cy + H / 2, t); }
      P.drawBody(g, b, Math.round(sx), Math.round(sy), b.r, t, G.light(b)); drawn++;
    }
    if (!shipDrawn && !hideShip) drawShip(g, sh.x - cx + W / 2, sh.y - cy + H / 2, t);
    Sp.drawnCount = drawn;
    if (V.aliens) V.aliens.draw(g, cx, cy);
    if (V.fleet) V.fleet.drawSpace(g, cx, cy, t);
    if (Sp.pulse && !V.reduced) { var pr = Sp.pulse.t * Math.max(W, H) * .6, pn = Math.max(40, pr * 5.5 | 0), pf = 1 - Sp.pulse.t / 2.5; g.fillStyle = '#7affe8'; for (var pi = 0; pi < pn; pi++) { if (V.bayer(pi, 5) > pf) continue; var pa = pi / pn * TAU; g.fillRect(Math.round(W / 2 + (sh.x - cx) + Math.cos(pa) * pr), Math.round(H / 2 + (sh.y - cy) + Math.sin(pa) * pr), 1, 1); } }
    /* landing hint */
    if (Sp.hint) { var hb = Sp.hint, hx = Math.round(hb.x - cx + W / 2), hy = Math.round(hb.y - cy + H / 2 - hb.r * (hb.elong || 1) - 14) - (Math.floor(t * 3) % 2); if (hy < 8) hy = 8; if (Sp.needGear) { if (Sp.gearDeny > 0) { Sp.gearDeny -= dt || 1 / 60; hx += Math.round(Math.sin(Sp.gearDeny * 60) * 2); } V.glyph(g, 'gear', hx - 6, hy - 2, '#ffc070', '#05020d'); V.glyph(g, 'lock', hx + 1, hy - 2, '#ff6a6a', '#05020d'); } else { keyBox(g, hx, hy, 'E'); V.glyph(g, 'down', hx - 2, hy + 8, '#c04df0', '#05020d'); } }
    drawMarkers(g, cx, cy);
    if (V.story) V.story.drawSpaceFx(g);
    if (Sp.mapOpen) { if (V.galmap) V.galmap.draw(g, dt); else Sp.drawMap(g); }
    if (Sp.flash > 0) V.dissolve(g, Sp.flash, Sp.flashCol);
  };
  function keyBox(g, x, y, ch) { g.fillStyle = '#0e0624'; g.fillRect(x - 6, y - 6, 13, 13); g.fillStyle = '#c04df0'; g.fillRect(x - 6, y - 6, 13, 1); g.fillRect(x - 6, y + 6, 13, 1); g.fillRect(x - 6, y - 6, 1, 13); g.fillRect(x + 6, y - 6, 1, 13); V.text(g, ch, x - 1, y - 2, '#ffffff'); }
  Sp.keyBox = keyBox;
  function glyphOf(b) { if (b.isStar) return 'star'; if (b.isBH) return 'bh'; if (b.moonOf) return 'moon'; var t = b.type; if (t === 'gas' || t === 'icegas') return 'gas'; if (t === 'station' || t === 'wreck' || t === 'ruins' || t === 'comet') return t; return 'planet'; }
  Sp.glyphOf = glyphOf;
  /* edge markers for nearby worlds off screen, and home */
  var far = [];
  function drawMarkers(g, cx, cy) {
    var W = V.W, H = V.H, sh = Sp.ship, m = 6, list = [];
    var MR = Sp.pulse || V.prog.has('scanner') ? 9000 : 4200; G.near(sh.x, sh.y, MR, far);
    for (var i = 0; i < far.length; i++) { var b = far[i]; if (b.type === 'asteroid' || (b.moonOf && !b.isStar)) continue; var sx = b.x - cx, sy = b.y - cy; if (Math.abs(sx) < W / 2 + b.r && Math.abs(sy) < H / 2 + b.r) continue; var d = Math.hypot(sx, sy); if (d > MR) continue; if (d > 4200 && !(b._ping && G.t - b._ping < 20)) continue; list.push([d, b, sx, sy]); }
    list.sort(function (a, b) { return a[0] - b[0]; }); list = list.slice(0, 10);
    var home = G.getBody('0,0:3'); if (home) { var hx = home.x - cx, hy = home.y - cy; if (Math.abs(hx) > W / 2 || Math.abs(hy) > H / 2) list.push([Math.hypot(hx, hy), home, hx, hy, 1]); }
    V.prog.pins.forEach(function (p) { var px2 = p.x - cx, py2 = p.y - cy; if (Math.abs(px2) > W / 2 || Math.abs(py2) > H / 2) list.push([Math.hypot(px2, py2), { dot: '#ffe07a', pin: p.icon }, px2, py2, 2]); else { var qx = Math.round(W / 2 + px2), qy = Math.round(H / 2 + py2) - 8 - (Math.floor(V.time * 3) % 2); V.glyph(g, 'pin', qx - 2, qy, '#ffe07a', '#05020d'); } });
    if (Sp.auto) { var ax = Sp.auto.x - cx, ay = Sp.auto.y - cy; if (Math.abs(ax) > W / 2 || Math.abs(ay) > H / 2) list.push([Math.hypot(ax, ay), { dot: '#7affe8', pin: 'auto' }, ax, ay, 2]); }
    if (V.aliens) V.aliens.markerList().forEach(function (e) { var ex = e.x - cx, ey = e.y - cy; if (Math.abs(ex) > W / 2 || Math.abs(ey) > H / 2) list.push([Math.hypot(ex, ey), { dot: '#a8ffd8', pin: 'alien' }, ex, ey, 2]); });
    for (i = 0; i < list.length; i++) {
      var it = list[i], b2 = it[1], ax = it[2], ay = it[3], k = Math.min((W / 2 - m) / Math.abs(ax || 1e-6), (H / 2 - m) / Math.abs(ay || 1e-6)), px = Math.round(W / 2 + ax * k), py = Math.round(H / 2 + ay * k);
      var col = it[4] === 1 ? '#c04df0' : (b2.dot || '#8888aa'), big = b2.isStar || b2.isBH || it[4];
      if (it[0] > 2600 && !it[4] && V.bayer(px, py) > .5) continue;
      var dl = Math.hypot(ax, ay) || 1, ux = ax / dl, uy = ay / dl, gx = Math.round(px - ux * 6), gy = Math.round(py - uy * 6);
      gx = clamp(gx, 4, W - 5); gy = clamp(gy, 4, H - 5);
      V.glyph(g, it[4] === 1 ? 'home' : it[4] === 2 ? b2.pin : glyphOf(b2), gx - 2, gy - 2, col, '#05020d');
      var tx = Math.round(gx + ux * 5), ty = Math.round(gy + uy * 5), qx = Math.round(-uy), qy = Math.round(ux); g.fillStyle = '#05020d'; g.fillRect(tx, ty, 1, 1); g.fillStyle = col; g.fillRect(tx, ty, 1, 1); g.fillRect(Math.round(gx + ux * 4) + qx, Math.round(gy + uy * 4) + qy, 1, 1); g.fillRect(Math.round(gx + ux * 4) - qx, Math.round(gy + uy * 4) - qy, 1, 1);
    }
  }
  /* ---------- galaxy map ---------- */
  Sp.drawMap = function (g) {
    var W = V.W, H = V.H, sh = Sp.ship; V.dissolve(g, .86, '#05020d');
    var R = 4, C = G.CELL, cs = Math.floor(Math.min(W - 16, H - 30) / (R * 2 + 1)), scale = cs / C, ox = Math.round(W / 2), oy = Math.round(H / 2 + 6), ci = G.cellIndex(sh.x), cj = G.cellIndex(sh.y);
    g.fillStyle = '#1a1036'; for (var k = -R; k <= R + 1; k++) { var gx = Math.round(ox + ((ci + k - .5) * C - sh.x) * scale), gy = Math.round(oy + ((cj + k - .5) * C - sh.y) * scale); for (var q = oy - (R + .5) * cs; q < oy + (R + .5) * cs; q += 2) { g.fillRect(gx, Math.round(q), 1, 1); g.fillRect(Math.round(ox - (R + .5) * cs + (q - (oy - (R + .5) * cs))), gy, 1, 1); } }
    for (var j = -R; j <= R; j++) for (var i = -R; i <= R; i++) {
      var c = G.genCell(ci + i, cj + j); G.updateCell(c, G.t);
      for (var n = 0; n < c.nebulae.length; n++) { var nb = c.nebulae[n], nx = Math.round(ox + (nb.x - sh.x) * scale), ny = Math.round(oy + (nb.y - sh.y) * scale), rad = Math.max(3, Math.round((nb.size || 176) / .55 * scale * .5)); g.fillStyle = nb.cols[2] || '#4a2a7a'; for (var yy = -rad; yy <= rad; yy++) for (var xx = -rad; xx <= rad; xx++) if (xx * xx + yy * yy < rad * rad && V.bayer(nx + xx, ny + yy) < .22) g.fillRect(nx + xx, ny + yy, 1, 1); }
      for (n = 0; n < c.bodies.length; n++) { var b = c.bodies[n]; if (b.type === 'asteroid' || b.moonOf) continue; var bx = Math.round(ox + (b.x - sh.x) * scale), by = Math.round(oy + (b.y - sh.y) * scale); if (bx < 1 || by < 1 || bx >= W - 1 || by >= H - 1) continue; g.fillStyle = b.dot || '#8888aa'; if (b.isStar) { g.fillRect(bx - 1, by, 3, 1); g.fillRect(bx, by - 1, 1, 3); } else if (b.isBH) { g.fillStyle = '#c04df0'; g.fillRect(bx - 1, by - 1, 3, 1); g.fillRect(bx - 1, by + 1, 3, 1); g.fillRect(bx - 1, by, 1, 1); g.fillRect(bx + 1, by, 1, 1); } else { g.fillRect(bx, by, 1, 1); } if (V.game.visited[b.id]) { g.fillStyle = '#efe6ff'; g.fillRect(bx, by - 2, 1, 1); } }
    }
    var home = G.getBody('0,0:3'); if (home) { var hx = Math.round(ox + (home.x - sh.x) * scale), hy = Math.round(oy + (home.y - sh.y) * scale); if (hx > 4 && hy > 10 && hx < W - 4 && hy < H - 4) { g.fillStyle = '#c04df0'; g.fillRect(hx - 2, hy - 2, 5, 1); g.fillRect(hx - 2, hy + 2, 5, 1); g.fillRect(hx - 2, hy - 2, 1, 5); g.fillRect(hx + 2, hy - 2, 1, 5); } }
    if (Math.floor(V.time * 3) % 3) { g.fillStyle = '#ffffff'; g.fillRect(ox - 1, oy, 3, 1); g.fillRect(ox, oy - 1, 1, 3); }
    
    var n1 = String(V.game.visitedCount), n2 = String(V.surface.discCount), bx = (W - (V.textW(n1) + V.textW(n2) + 22)) >> 1; V.glyph(g, 'planet', bx, H - 9, '#c04df0', '#05020d'); V.text(g, n1, bx + 7, H - 9, '#efe6ff', '#05020d'); bx += 7 + V.textW(n1) + 8; V.glyph(g, 'scan', bx, H - 9, '#7affe8', '#05020d'); V.text(g, n2, bx + 7, H - 9, '#efe6ff', '#05020d');
  };
})();
