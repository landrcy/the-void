/* The Void — ship growth path (scout -> frigate -> cruiser -> capital ship -> mothership), the "fleet" upgrade tab,
   colonies and Dyson swarms. Stage sprites are pixel grids built from hand-placed modules (hull, wings, engine banks,
   lights, turrets, hangars, outboard pods, saucer ring) and pre-rotated into crisp frames. */
(function () {
  'use strict';
  var V = window.VOID, Pg = V.prog, S = V.spr, Q = V.q, TAU = V.TAU, clamp = V.clamp;
  function gl(r) { return r.join(''); }
  V.addGlyphs({
    frig: gl(['..1..', '.111.', '11111', '.1.1.', '.....']), cruis: gl(['..1..', '.111.', '11111', '11111', '1.1.1']), capi: gl(['.111.', '11111', '1.1.1', '11111', '1.1.1']), moth: gl(['.111.', '1...1', '11111', '1...1', '.111.']),
    eng: gl(['111..', '111.1', '111..', '111.1', '111..']), core: gl(['.111.', '11.11', '1.1.1', '11.11', '.111.']), hang: gl(['11111', '1...1', '1.1.1', '1...1', '11111']), cargo: gl(['11111', '1.1.1', '11111', '1.1.1', '11111']),
    bub: gl(['.111.', '1...1', '1.1.1', '1...1', '.111.']), defl: gl(['1...1', '.1.1.', '..1..', '.1.1.', '1...1']), beams: gl(['1....', '.11..', '1.111', '.11..', '1....']), refi: gl(['1.1.1', '11111', '.111.', '..1..', '.111.']),
    pod: gl(['..1..', '.111.', '1.1.1', '11111', '.1.1.']), dysn: gl(['1.1.1', '.111.', '11.11', '.111.', '1.1.1']), fleet: gl(['1...1', '11.11', '.111.', '..1..', '.....']), tabs: gl(['11.11', '11.11', '.....', '11.11', '11.11']),
    mega: gl(['1.1.1', '.111.', '11.11', '.111.', '1.1.1'])
  });
  /* id, section, icon, cost, requires */
  var ADD = [
    ['frigate', 'fleet', 'frig', { scrap: 40, ore: 20, tech: 10 }, ['universal']], ['cruiser', 'fleet', 'cruis', { ore: 40, crystal: 25, tech: 25 }, ['frigate']],
    ['capital', 'fleet', 'capi', { crystal: 45, tech: 50, essence: 15 }, ['cruiser']], ['mothership', 'fleet', 'moth', { crystal: 80, tech: 90, essence: 40 }, ['capital']],
    ['engines', 'fleet', 'eng', { scrap: 20, ore: 15 }, ['frigate']], ['warp1', 'fleet', 'core', { crystal: 12, tech: 8 }, ['universal']], ['warp2', 'fleet', 'core', { crystal: 25, tech: 20, essence: 5 }, ['warp1', 'cruiser']],
    ['warp3', 'fleet', 'core', { crystal: 40, tech: 40, essence: 20 }, ['warp2', 'capital']],
    ['cargo', 'fleet2', 'cargo', { scrap: 25, ore: 10 }, ['frigate']], ['bubble', 'fleet2', 'bub', { crystal: 20, essence: 4 }, ['frigate']], ['deflector', 'fleet2', 'defl', { ore: 20, tech: 12 }, ['frigate']],
    ['hangar', 'fleet2', 'hang', { scrap: 30, tech: 15 }, ['cruiser']], ['beams', 'fleet2', 'beams', { ore: 20, tech: 15 }, ['laser', 'cruiser']], ['refinery', 'fleet2', 'refi', { scrap: 30, ore: 20, tech: 10 }, ['cruiser']],
    ['colony', 'fleet2', 'pod', { scrap: 40, tech: 20, essence: 10 }, ['capital']], ['dyson', 'fleet2', 'dysn', { crystal: 60, tech: 60, essence: 30 }, ['colony', 'mothership']]
  ];
  var NM = { frigate: 'FRIGATE HULL', cruiser: 'CRUISER HULL', capital: 'CAPITAL SHIP', mothership: 'MOTHERSHIP', engines: 'ENGINE BANKS', warp1: 'WARP CORE I', warp2: 'WARP CORE II', warp3: 'WARP CORE III', cargo: 'CARGO HOLDS', bubble: 'SHIELD BUBBLE', deflector: 'DEFLECTOR', hangar: 'DRONE HANGAR', beams: 'BEAM ARRAY', refinery: 'REFINERY', colony: 'COLONY POD', dyson: 'DYSON MODULE' };
  var UD = {
    frigate: 'Stage II: the ship grows into a frigate with wings, twin engines and running lights. Thrust +8%.', cruiser: 'Stage III: a cruiser with turrets, side hangars and a long spine. Thrust +16%.',
    capital: 'Stage IV: a capital ship with outboard pods, bridge tower and five engine banks. Thrust +24%.', mothership: 'Stage V: a mothership-scale vessel with a lit saucer ring. Thrust +32%, fuel regen x2.',
    engines: 'Extra engine banks: thrust +30%.', warp1: 'Boost burns 40% less fuel.', warp2: 'Boost top speed +50%.', warp3: 'Fuel refills 3x faster and the galaxy map can jump anywhere.',
    cargo: 'Every pickup gives 50% more.', bubble: 'A visible shield bubble: stars no longer burn you, crystal escorts cannot nudge you.', deflector: 'Black hole pull is halved; bumps are shrugged off.',
    hangar: 'Launches three mini-drones that fetch loot within a wide radius.', beams: 'Mining beam array: laser reach x2 and three beams.', refinery: 'Every 15 s turns 6 scrap into 1 tech and 6 ore into 1 crystal.',
    colony: 'On a landed world press K to found a colony (10 scrap). Colonies send ore, crystal and tech over time.', dyson: 'In space near the star of a colonised system press K to build a Dyson swarm (10 tech, 5 essence). Swarms send essence.'
  };
  ADD.forEach(function (u) { Pg.UP.push(u); Pg.NAMES[u[0]] = NM[u[0]]; Pg.byId[u[0]] = { id: u[0], sec: u[1], icon: u[2], cost: u[3], req: u[4] || [] }; });
  if (V.tips && V.tips.UD) { for (var k in UD) V.tips.UD[k] = UD[k]; V.tips.SEC.fleet = 'Ship growth'; V.tips.SEC.fleet2 = 'Ship module'; }
  Pg.FLEET_UD = UD;
  var STAGES = ['frigate', 'cruiser', 'capital', 'mothership'], SNAME = ['SCOUT', 'FRIGATE', 'CRUISER', 'CAPITAL SHIP', 'MOTHERSHIP'];
  Pg.STAGE_NAMES = SNAME;
  Pg.shipStage = function () { if (Q.get('stage') != null) return clamp(+Q.get('stage') | 0, 0, 4); var n = 0; for (var i = 0; i < 4; i++) if (Pg.has(STAGES[i])) n = i + 1; return n; };
  Pg.setStage = function (s) { STAGES.forEach(function (id, i) { Pg.unlock(id, i < s); }); if (s > 0) Pg.unlock('universal'); V.game && V.game.toast && V.game.toast(SNAME[s]); };
  Pg.colonies = {}; Pg.dysons = {};
  var fresh0 = Pg.fresh; Pg.fresh = function (st) { fresh0(st); Pg.colonies = {}; Pg.dysons = {}; };
  var gs0 = Pg.getSave; Pg.getSave = function () { var d = gs0(); d.colonies = Pg.colonies; d.dysons = Pg.dysons; return d; };
  var ld0 = Pg.load; Pg.load = function (d) { ld0(d); Pg.colonies = d.colonies || {}; Pg.dysons = d.dysons || {}; };
  var gain0 = Pg.gain; Pg.gain = function (k, n, x, y) { if (Pg.has('cargo') && Pg.open !== 'admin') n = Math.ceil(n * 1.5); return gain0(k, n, x, y); };

  /* ---------- stage sprites ---------- */
  var LEN = [0, 24, 34, 48, 68], HW = [0, 6, 8, 12, 18];
  var grids = {};
  function grid(s) {
    if (grids[s]) return grids[s];
    var L = LEN[s], Wd = HW[s], H = Wd * 2 + 1, g = new Array(L * H).fill(null), lights = [];
    function set(u, v, c) { u = Math.round(u); v = Math.round(v); if (u < 0 || u >= L || v < -Wd || v > Wd) return; g[(v + Wd) * L + u] = c; }
    function get(u, v) { return g[(v + Wd) * L + u]; }
    var body = Wd * (s >= 3 ? .42 : .5);
    for (var u = 0; u < L; u++) {
      var t = u / (L - 1), hw = t > .72 ? body * (1 - t) / .28 + .8 : body, ww = (t > .1 && t < .62) ? Wd * (1 - (t - .1) / .52 * .6) : 0;
      if (s === 4) ww = Math.max(ww, t > .2 && t < .7 ? Wd * .7 : 0);
      for (var v = -Wd; v <= Wd; v++) {
        var av = Math.abs(v), c = null;
        if (av <= hw) { c = av >= hw - .9 ? '#4a3d78' : v < -.5 ? '#c9c2ea' : v > .5 ? '#8a82b8' : '#efeaff'; if (u % 6 === 0 && av < hw - 1) c = '#5a4c8a'; }
        else if (av <= ww) { c = av >= ww - 1 ? '#c04df0' : v < 0 ? '#9a8ac8' : '#6b5c9a'; if (u % 5 === 0) c = '#4a3d78'; }
        if (c) set(u, v, c);
      }
    }
    /* spine and cockpit */
    if (s >= 2) for (u = 3; u < L * .7; u++) set(u, 0, '#c04df0');
    for (u = Math.round(L * .78); u <= Math.round(L * .86); u++) { set(u, -1, '#bff4ff'); set(u, 0, '#bff4ff'); set(u, 1, '#6fd0f0'); }
    /* saucer ring (mothership) */
    if (s === 4) for (u = 0; u < L; u++) for (v = -Wd; v <= Wd; v++) { var e = Math.pow((u - L * .45) / (L * .44), 2) + Math.pow(v / (Wd + .4), 2); if (e > .8 && e <= 1) { set(u, v, (u + v) % 5 === 0 ? '#7affe8' : '#6b5c9a'); if ((u * 7 + v * 3) % 11 === 0) lights.push([u, v, '#ff8ae8']); } }
    /* outboard pods + struts (capital, mothership) */
    if (s >= 3) [-1, 1].forEach(function (sd) { var pv = sd * (Wd - 2); for (u = Math.round(L * .18); u < L * .56; u++) for (var q = -1; q <= 1; q++) set(u, pv + q, q === 0 ? '#efeaff' : '#8a82b8'); for (var q2 = 0; q2 < 6; q2++) set(L * .3 + q2 % 2, sd * (body + q2), '#4a3d78'); lights.push([Math.round(L * .56), pv, sd < 0 ? '#ff6a8a' : '#7affe8']); set(L * .56, pv, '#ffffff'); });
    /* bridge tower */
    if (s >= 3) for (u = Math.round(L * .58); u < L * .68; u++) for (v = -2; v <= 2; v++) set(u, v, Math.abs(v) === 2 ? '#4a3d78' : u % 2 ? '#e8e0ff' : '#7affe8');
    if (s === 4) for (u = Math.round(L * .38); u < L * .52; u++) for (v = -3; v <= 3; v++) if (Math.pow((u - L * .45) / (L * .07), 2) + v * v / 10 <= 1) set(u, v, v < 0 ? '#ffffff' : '#ff8ae8');
    /* hangars */
    if (s >= 2) [-1, 1].forEach(function (sd) { var hv = sd * Math.max(2, Math.round(body) - 1); for (u = Math.round(L * .36); u < L * .36 + 3 + s; u++) { set(u, hv, '#120a26'); set(u, hv + sd, '#7affe8'); } });
    /* turrets */
    if (s >= 2) { var tus = s === 2 ? [.25, .6] : s === 3 ? [.22, .4, .52, .72] : [.15, .3, .62, .74, .82]; tus.forEach(function (tt, i) { var tu = Math.round(L * tt), tv = (i % 2 ? 1 : -1) * 2; set(tu, tv, '#e8b440'); set(tu + 1, tv, '#e8b440'); set(tu, tv + (tv > 0 ? 1 : -1), '#a07a20'); set(tu + 2, tv, '#fff0a0'); }); }
    /* engine banks */
    var nE = [0, 2, 3, 5, 7][s], span = Math.max(body, (s >= 3 ? Wd - 3 : body + 1));
    for (var k = 0; k < nE; k++) { var ev = Math.round(nE === 1 ? 0 : -span + k * (2 * span) / (nE - 1)); for (u = 0; u < 3; u++) { set(u, ev, u === 0 ? '#ffb030' : '#2a2048'); if (s >= 2) set(u, ev + (ev >= 0 ? 1 : -1), '#2a2048'); } }
    /* running lights along the edges */
    for (u = 4; u < L * .7; u += 7) [-1, 1].forEach(function (sd) { for (var vv = Wd; vv > 0; vv--) if (get(u, sd * vv)) { lights.push([u, sd * vv, sd < 0 ? '#ff6a8a' : '#7affe8']); break; } });
    lights.forEach(function (l) { set(l[0], l[1], l[2]); });
    return (grids[s] = { L: L, Wd: Wd, g: g, lights: lights, get: function (u, v) { return (u < 0 || u >= L || v < -Wd || v > Wd) ? null : g[(v + Wd) * L + u]; } });
  }
  var frames = {}, N = 32;
  S.stageC = function (s) { var G0 = grid(s); return Math.ceil(Math.hypot(G0.L / 2, G0.Wd)) + 1; };
  function mkFrames(s, blink) {
    var G0 = grid(s), c = S.stageC(s), D = 2 * c + 1, uc = (G0.L - 1) / 2, out = [], lmap = {};
    if (blink) G0.lights.forEach(function (l) { lmap[l[0] + ',' + l[1]] = '#ffffff'; });
    for (var f = 0; f < N; f++) {
      var a = f / N * TAU, ca = Math.cos(a), sa = Math.sin(a), cv = V.mk(D, D), img = cv.g.createImageData(D, D), d = img.data;
      for (var y = 0; y < D; y++) for (var x = 0; x < D; x++) {
        var dx = x - c, dy = y - c, u = Math.round(dx * ca + dy * sa + uc), v = Math.round(-dx * sa + dy * ca), col = G0.get(u, v); if (!col) continue;
        if (blink && lmap[u + ',' + v]) col = lmap[u + ',' + v]; var h = V.hex(col), i = (y * D + x) * 4; d[i] = h[0]; d[i + 1] = h[1]; d[i + 2] = h[2]; d[i + 3] = 255;
      }
      cv.g.putImageData(img, 0, 0); out.push(cv);
    }
    return out;
  }
  S.stageFrame = function (ang, s, t) { var b = (Math.floor((t || 0) * 1.6) & 1), key = s + ':' + b; var set = frames[key] || (frames[key] = mkFrames(s, b)); return set[Math.round(((ang % TAU + TAU) % TAU) / TAU * N) % N]; };
  S.stageRear = function (s) { return LEN[s] / 2; };
  S.stageEngines = function (s) { var G0 = grid(s), out = []; for (var v = -G0.Wd; v <= G0.Wd; v++) if (G0.get(0, v) === '#ffb030') out.push(v); return out; };
  /* side view on the ground: nose right, hatch left of centre */
  var side = {}, HS = [0, 14, 18, 24, 32];
  var land0 = S.landedShip;
  S.landedShip = function (open, tier) {
    var s = Pg.shipStage(); if (!s) return land0(open, tier); var key = s + ':' + (open ? 1 : 0); if (side[key]) return side[key];
    var L = LEN[s] + 4, Hh = HS[s], cv = V.mk(L, Hh), g = cv.g, base = Hh - 5, bh = Math.round(Hh * .5);
    function px(x, y, c) { g.fillStyle = c; g.fillRect(x, y, 1, 1); }
    for (var x = 0; x < L; x++) {
      var t = x / (L - 1), top = Math.round(base - (t > .75 ? bh * (1 - t) / .25 + 1 : t < .06 ? bh * .6 : bh));
      for (var y = top; y <= base; y++) { var k = (y - top) / Math.max(1, base - top), c = k < .2 ? '#efeaff' : k < .55 ? '#c9c2ea' : k < .85 ? '#8a82b8' : '#4a3d78'; if (x % 6 === 0 && k > .15) c = '#6b5c9a'; px(x, y, c); }
      if (x % 3 === 0 && x > 3 && t < .72) px(x, Math.round(base - bh * .45), '#7affe8');
    }
    g.fillStyle = '#c04df0'; g.fillRect(2, base - 1, L - 6, 1);
    g.fillStyle = '#bff4ff'; g.fillRect(Math.round(L * .78), Math.round(base - bh * .8), Math.max(3, s + 1), 2);
    for (var e = 0; e < Math.min(4, s + 1); e++) { g.fillStyle = '#2a2048'; g.fillRect(0, base - 2 - e * 3, 3, 2); px(0, base - 2 - e * 3, '#ffb030'); }
    if (s >= 2) [.25, .6].forEach(function (tt) { var tx = Math.round(L * tt), ty = Math.round(base - bh) - 1; g.fillStyle = '#e8b440'; g.fillRect(tx, ty, 3, 2); px(tx + 3, ty, '#fff0a0'); });
    if (s >= 3) { var bx = Math.round(L * .58); g.fillStyle = '#8a82b8'; g.fillRect(bx, Math.round(base - bh) - 4, 6, 4); g.fillStyle = '#7affe8'; g.fillRect(bx + 1, Math.round(base - bh) - 3, 4, 1); }
    if (s === 4) { var dx0 = Math.round(L * .4); g.fillStyle = '#ff8ae8'; g.fillRect(dx0, Math.round(base - bh) - 3, 8, 3); g.fillStyle = '#ffffff'; g.fillRect(dx0 + 2, Math.round(base - bh) - 4, 4, 1); g.fillStyle = '#6b5c9a'; g.fillRect(4, Math.round(base - bh * .2), L - 8, 1); }
    for (x = 4; x < L * .7; x += 7) px(x, Math.round(base - bh) + 1, x % 2 ? '#ff6a8a' : '#7affe8');
    /* legs */
    g.fillStyle = '#6b5c9a'; [.15, .5, .85].forEach(function (lt) { var lx = Math.round(L * lt); g.fillRect(lx, base + 1, 1, 3); g.fillRect(lx - 2, base + 4, 5, 1); });
    /* hatch */
    var hx = Math.round(L / 2 - 8); if (open) { g.fillStyle = '#120a26'; g.fillRect(hx, base - 6, 4, 6); g.fillStyle = '#9a8ac8'; g.fillRect(hx, base, 7, 1); } else { g.fillStyle = '#6b5c9a'; g.fillRect(hx, base - 6, 4, 6); }
    return (side[key] = cv);
  };

  /* ---------- per-frame: refinery, hangar drones, colonies, Dyson swarms ---------- */
  var F = V.fleet = { refT: 0, hangT: 0, colT: 0, drones: [] };
  function sysOfBody(b) { return b && b.sys ? b.sys.id : null; }
  var upd0 = Pg.update;
  Pg.update = function (dt) {
    upd0(dt); var g = V.game; if (!g || g.state === 'title') return;
    if (Pg.has('refinery')) { F.refT += dt; if (F.refT > 15) { F.refT = 0; var did = false; if ((Pg.res.scrap || 0) >= 6) { Pg.res.scrap -= 6; Pg.gain('tech', 1); did = true; } if ((Pg.res.ore || 0) >= 6) { Pg.res.ore -= 6; Pg.gain('crystal', 1); did = true; } if (did && V.sfx) V.sfx('pickup2'); } }
    var nc = Object.keys(Pg.colonies).length, nd = Object.keys(Pg.dysons).length;
    if (!V.colony && (nc || nd)) { F.colT += dt; if (F.colT > 30) { F.colT = 0; if (nc) { Pg.gain('ore', Math.min(20, nc)); Pg.gain('crystal', Math.min(20, nc)); Pg.gain('tech', Math.max(1, nc >> 1)); } if (nd) Pg.gain('essence', Math.min(30, nd * 2)); } }
    /* K: found a colony / build a Dyson swarm */
    if (!V.colony && V.keyPressed('k') && !Pg.open) {
      if (g.state === 'surface' && V.surface.mode === 'play' && g.body) {
        var b = g.body; if (!Pg.has('colony')) g.toast('NEEDS COLONY POD'); else if (Pg.colonies[b.id]) g.toast('COLONY HERE'); else if ((Pg.res.scrap || 0) < 10) { g.toast('NEED 10 SCRAP'); if (V.sfx) V.sfx('deny'); }
        else { Pg.res.scrap -= 10; Pg.colonies[b.id] = { sys: sysOfBody(b), name: V.Gen.nameOf(b), t: Math.round(V.Gen.t) }; g.toast('COLONY FOUNDED', V.Gen.nameOf(b)); if (V.sfx) V.sfx('repaired'); if (V.save) V.save.write(); }
      } else if (g.state === 'space') {
        var st = nearStar(); if (!Pg.has('dyson')) g.toast('NEEDS DYSON MODULE'); else if (!st) g.toast('FLY NEAR A STAR');
        else if (Pg.dysons[st.sys.id]) g.toast('SWARM HERE'); else if (!colonised(st.sys.id)) g.toast('COLONISE THIS SYSTEM FIRST');
        else if ((Pg.res.tech || 0) < 10 || (Pg.res.essence || 0) < 5) { g.toast('NEED 10 TECH 5 ESSENCE'); if (V.sfx) V.sfx('deny'); }
        else { Pg.res.tech -= 10; Pg.res.essence -= 5; Pg.dysons[st.sys.id] = { star: st.id, t: Math.round(V.Gen.t) }; g.toast('DYSON SWARM'); if (V.sfx) V.sfx('tier'); if (V.save) V.save.write(); }
      }
    }
    if (g.state === 'space' && Pg.has('hangar') && V.aliens) {
      F.hangT += dt; var sh = V.space.ship, A = V.aliens;
      if (F.hangT > 1.2) { F.hangT = 0; var best = null, bd = 900; (A.drops || []).forEach(function (it) { var d = Math.hypot(it.x - sh.x, it.y - sh.y); if (d < bd) { bd = d; best = it; } }); if (best) { F.drones.push({ x: sh.x, y: sh.y, tx: best.x, ty: best.y, it: best, t: 0 }); } }
      for (var i = F.drones.length - 1; i >= 0; i--) { var dr = F.drones[i]; dr.t += dt; var k = Math.min(1, dr.t / .8); dr.x = sh.x + (dr.tx - sh.x) * Math.sin(k * Math.PI); dr.y = sh.y + (dr.ty - sh.y) * Math.sin(k * Math.PI);
        if (dr.t > .4 && dr.it && A.drops.indexOf(dr.it) >= 0) { A.drops.splice(A.drops.indexOf(dr.it), 1); Pg.gain(dr.it.k, dr.it.n || 1); A.fx && A.fx.push({ x: dr.tx, y: dr.ty, t: 0, k: dr.it.k }); dr.it = null; }
        if (dr.t > .8) F.drones.splice(i, 1); }
    }
  };
  function colonised(sid) { for (var k in Pg.colonies) if (Pg.colonies[k].sys === sid) return true; return false; }
  function nearStar() { var sh = V.space.ship, out = V.Gen.near(sh.x, sh.y, 1600, []), best = null, bd = 1e9; out.forEach(function (b) { if (!b.isStar) return; var d = Math.hypot(b.x - sh.x, b.y - sh.y) - b.r; if (d < 900 && d < bd) { bd = d; best = b; } }); return best; }
  F.nearStar = nearStar;

  /* ---------- space overlays: shield bubble, hangar drones, Dyson swarms ---------- */
  F.drawSpace = function (g, cx, cy, t) {
    var W = V.W, H = V.H, Sp = V.space, sh = Sp.ship, sx = Math.round(sh.x - cx + W / 2), sy = Math.round(sh.y - cy + H / 2), s = Pg.shipStage();
    /* Dyson swarms */
    if (V.colony) V.colony.drawDysons(g, cx, cy, t); else for (var id in Pg.dysons) { var b = V.Gen.getBody(Pg.dysons[id].star); if (!b) continue; var bx = b.x - cx + W / 2, by = b.y - cy + H / 2, R = b.r * 1.9; if (bx + R < 0 || bx - R > W || by + R < 0 || by - R > H) continue;
      for (var i = 0; i < 90; i++) { var a = i / 90 * TAU + t * (.05 + (i % 3) * .02), rr = R * (.85 + (i % 4) * .06), x = Math.round(bx + Math.cos(a) * rr), y = Math.round(by + Math.sin(a) * rr * (.45 + (i % 2) * .5)); g.fillStyle = i % 7 === 0 ? '#ffffff' : '#ffe07a'; g.fillRect(x, y, 1, 1); } }
    if (Sp.mode === 'transit') return;
    if (Pg.has('bubble') && !Sp.cloak) { var br = (s ? S.stageC(s) : S.SHIP_C) + 4, n = Math.round(br * 5); g.fillStyle = '#7affe8'; for (i = 0; i < n; i++) { if (V.bayer(i, Math.floor(t * 8)) < .55) continue; var aa = i / n * TAU; g.fillRect(Math.round(sx + Math.cos(aa) * br), Math.round(sy + Math.sin(aa) * br), 1, 1); } }
    var F2 = F.drones; for (i = 0; i < F2.length; i++) { var dx = Math.round(F2[i].x - cx + W / 2), dy = Math.round(F2[i].y - cy + H / 2); g.fillStyle = '#c9c2ea'; g.fillRect(dx - 1, dy, 3, 1); g.fillStyle = '#7affe8'; g.fillRect(dx, dy - 1, 1, 1); }
    if (Pg.has('hangar') && !F2.length) for (i = 0; i < 3; i++) { var a2 = t * 1.3 + i * TAU / 3, r2 = (s ? S.stageC(s) : S.SHIP_C) + 7; g.fillStyle = '#c9c2ea'; g.fillRect(Math.round(sx + Math.cos(a2) * r2), Math.round(sy + Math.sin(a2) * r2), 2, 1); }
  };
})();
