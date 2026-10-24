/* The Void — colonisation. Early game: a hand mining laser (F) on ore veins and rock, and a hand drill (hold Down / X)
   that cuts a visible shaft through layered crust; ore pockets glint at the surface and show up on the scanner (Q).
   Mid game: colonies that grow visibly in five stages, auto-drills that pump ore while you are away.
   Late game: planet-scale rigs seen from orbit and on the map, and Dyson swarms that assemble segment by segment
   into a full sphere, pouring energy into the top upgrades. Everything is dt-based; offline progress is capped. */
(function () {
  'use strict';
  var V = window.VOID, Pg = V.prog, Su = V.surface, G = V.Gen, TAU = V.TAU, clamp = V.clamp, wdx = Su.wdx, RCOL = Pg.RCOL;
  var C = V.colony = { scanT: 0, dr: { on: false, a: 0 }, las: null, awayMsg: null };
  function gl(r) { return r.join(''); }
  V.addGlyphs({
    energy: gl(['..11.', '.11..', '11111', '..11.', '.11..']), drill: gl(['.111.', '.111.', '.111.', '..1..', '..1..']), adrill: gl(['..1..', '.1.1.', '.111.', '1.1.1', '..1..']),
    bit: gl(['11111', '.111.', '.111.', '..1..', '..1..']), rig: gl(['..1..', '.111.', '..1..', '.111.', '11111']), sphere: gl(['.111.', '1.1.1', '11111', '1.1.1', '.111.']),
    forge: gl(['1...1', '11.11', '11111', '.111.', '.111.']), nova: gl(['..1..', '..1..', '11111', '..1..', '1.1.1']), lift: gl(['..1..', '.111.', '..1..', '..1..', '.111.']),
    colo: gl(['..1..', '.111.', '11111', '1.1.1', '11111']), build: gl(['111..', '1.1..', '11111', '..1.1', '..111']), instant: gl(['..11.', '.11..', '1111.', '..11.', '.11..'])
  });
  Pg.RES.push('energy'); RCOL.energy = '#ffe07a';
  /* ---------- upgrades: the colony tab ---------- */
  var ADD = [
    ['drill2', 'colony', 'bit', { ore: 8, crystal: 3 }, []], ['autodrill', 'colony', 'adrill', { scrap: 12, ore: 8 }, []],
    ['megarig', 'colony', 'rig', { ore: 60, crystal: 30, tech: 40 }, ['colony']],
    ['forge', 'colony2', 'forge', { energy: 300, tech: 40 }, ['dyson']], ['nova', 'colony2', 'nova', { energy: 900, crystal: 60 }, ['forge']], ['lifter', 'colony2', 'lift', { energy: 2500, essence: 60 }, ['nova']]
  ];
  var NM = { drill2: 'DIAMOND BIT', autodrill: 'AUTO-DRILL', megarig: 'PLANET RIG', forge: 'STELLAR FORGE', nova: 'NOVA DRIVE', lifter: 'STAR LIFTER', colony: 'COLONY POD', dyson: 'DYSON MODULE' };
  var UD = {
    drill2: 'Hand drill digs 2.5x faster and twice as deep, into the rich lower crust.',
    autodrill: 'Press B on a world to set down an auto-drill (6 scrap, 4 ore). It pumps that world\u2019s ore, even while you are away.',
    colony: 'Press B (or K) on a world to found a colony (10 scrap, 10 ore). It grows from outpost to arcology and sends ore, crystal and tech.',
    megarig: 'Press B at a town-sized colony to raise a planet-scale rig (40 ore, 20 tech). Seen from orbit; huge passive output.',
    dyson: 'Press B (or K) near the star of a colonised system to seed a Dyson swarm (20 tech, 10 crystal, 10 essence). It assembles into a sphere and makes energy.',
    forge: 'Stellar forge: star energy turns into tech and crystal every second.', nova: 'Nova drive: thrust +50% and fuel never runs out.', lifter: 'Star lifter: colonies grow 3x faster and planet rigs make double.'
  };
  ADD.forEach(function (u) { Pg.UP.push(u); Pg.byId[u[0]] = { id: u[0], sec: u[1], icon: u[2], cost: u[3], req: u[4] }; });
  /* the colony pod and Dyson module move to the colony tab, a little earlier in the game */
  Pg.UP.forEach(function (u) { if (u[0] === 'colony') { u[1] = 'colony'; u[3] = { scrap: 30, ore: 20, tech: 10 }; u[4] = ['universal']; } if (u[0] === 'dyson') { u[1] = 'colony2'; u[4] = ['colony', 'cruiser']; } });
  ['colony', 'dyson'].forEach(function (id) { var u = Pg.UP.filter(function (q) { return q[0] === id; })[0]; Pg.byId[id] = { id: id, sec: u[1], icon: u[2], cost: u[3], req: u[4] }; });
  for (var k in NM) Pg.NAMES[k] = NM[k];
  if (V.tips) { for (k in UD) V.tips.UD[k] = UD[k]; V.tips.SEC.colony = 'Colony'; V.tips.SEC.colony2 = 'Star power'; var tr0 = V.tips.res; V.tips.res = function (k) { if (k === 'energy') return function () { var r = C.rates(); return { t: 'Energy', d: 'Star power from Dyson swarms. Buys the top upgrades.', s: 'You have ' + Math.floor(Pg.res.energy || 0) + (r.energy ? ' (+' + r.energy.toFixed(1) + '/s)' : ''), sc: 'dim', n: [] }; }; return tr0(k); }; }

  /* ---------- state + safe save migration ---------- */
  function reset() { Pg.digs = {}; Pg.drills = {}; Pg.rigs = {}; Pg.colLast = Date.now(); C.bank = {}; }
  reset();
  var fresh0 = Pg.fresh; Pg.fresh = function (st) { fresh0(st); reset(); };
  var gs0 = Pg.getSave; Pg.getSave = function () { var d = gs0(); Pg.colLast = Date.now(); d.colv = 2; d.digs = Pg.digs; d.drills = Pg.drills; d.rigs = Pg.rigs; d.colLast = Pg.colLast; return d; };
  var ld0 = Pg.load; Pg.load = function (d) {
    ld0(d); var ok = function (o) { return o && typeof o === 'object' && !Array.isArray(o) ? o : {}; };
    Pg.digs = ok(d.digs); Pg.drills = ok(d.drills); Pg.rigs = ok(d.rigs); Pg.colonies = ok(Pg.colonies); Pg.dysons = ok(Pg.dysons);
    for (var id in Pg.drills) if (!Array.isArray(Pg.drills[id])) delete Pg.drills[id];
    /* v1 colonies ({sys,name,t}) and swarms ({star,t}) gain growth fields */
    for (id in Pg.colonies) { var c = Pg.colonies[id]; if (!c || typeof c !== 'object') { delete Pg.colonies[id]; continue; } if (!(c.age >= 0)) c.age = 0; if (c.x == null) c.x = null; }
    for (id in Pg.dysons) { var s = Pg.dysons[id]; if (!s || typeof s !== 'object' || !s.star) { delete Pg.dysons[id]; continue; } if (!(s.seg >= 0)) s.seg = 0; if (!(s.prog >= 0)) s.prog = 0; }
    for (id in Pg.rigs) { var r = Pg.rigs[id]; if (!r || typeof r !== 'object') delete Pg.rigs[id]; else if (!(r.age >= 0)) r.age = 0; }
    C.bank = {};
    var last = +d.colLast, el = last > 0 ? (Date.now() - last) / 1000 : 0; Pg.colLast = Date.now();
    if (el > 5 && (Object.keys(Pg.colonies).length || Object.keys(Pg.drills).length || Object.keys(Pg.dysons).length)) C.offline(el);
  };
  var OFF_CAP = 8 * 3600;
  C.offline = function (secs) { C._offGain = {};
    secs = clamp(secs, 0, OFF_CAP); var before = Object.assign({}, Pg.res), step = 30, n = Math.ceil(secs / step);
    for (var i = 0; i < n; i++) tick(Math.min(step, secs - i * step), true);
    var gains = {}; for (var k in Pg.res) { var dlt = Math.floor((Pg.res[k] || 0) - (before[k] || 0)); if (dlt > 0) gains[k] = dlt; }
    C.away = { secs: Math.round(secs), gains: gains }; C.awayMsg = 1; return C.away;
  };

  /* ---------- bodies: ore tables and crust strata ---------- */
  function kindOf(b) { var t = b && b.type; if (!b) return 'rock'; if (b.home && t === 'earth') return 'earth'; if (t === 'lava' || b.io) return 'lava'; if (t === 'ice' || t === 'icegas') return 'ice'; if (t === 'crystal') return 'crystal'; if (t === 'wreck' || t === 'station' || t === 'dyson' || t === 'ruins') return 'metal'; if (t === 'desert' || t === 'mars') return 'desert'; return 'rock'; }
  var TABLE = { earth: { top: ['ore', 'scrap'], deep: ['ore', 'crystal'] }, lava: { top: ['ore', 'ore'], deep: ['crystal', 'essence'] }, ice: { top: ['crystal', 'ore'], deep: ['essence', 'crystal'] }, crystal: { top: ['crystal', 'crystal'], deep: ['essence'] },
    metal: { top: ['scrap', 'tech'], deep: ['tech', 'essence'] }, desert: { top: ['ore', 'scrap'], deep: ['crystal', 'tech'] }, rock: { top: ['ore', 'scrap'], deep: ['crystal', 'tech'] } };
  var STRATA = { earth: ['#5a3a26', '#6a5a4a', '#4a3a4e', '#2c1c30'], lava: ['#3a2622', '#5a2a1e', '#7a2a12', '#c8481a'], ice: ['#c8d8f0', '#8aa0c8', '#5a6a9a', '#2a3a6a'], crystal: ['#4a3a6a', '#3a2a5a', '#5a3a90', '#2a1a4a'],
    metal: ['#4a4a5a', '#3a3a4a', '#5a4a3a', '#2a2a36'], desert: ['#b88a52', '#946446', '#6a4436', '#3a2a2a'], rock: ['#5a4a46', '#4a3e4a', '#3a3040', '#241c2e'] };
  var LAYER = [0, 10, 28, 60];
  function layerAt(d) { return d >= LAYER[3] ? 3 : d >= LAYER[2] ? 2 : d >= LAYER[1] ? 1 : 0; }
  C.kindOf = kindOf; C.table = function (b) { return TABLE[kindOf(b)]; };
  function bodyOf(wid) { return G.getBody(wid); }
  var tcache = {}; function tableId(wid) { return tcache[wid] || (tcache[wid] = C.table(bodyOf(wid))); }
  function okX(w, x) { return !(w.wl > -999 && Su.gAt(w, x) < w.wl - 1); }
  function norm(w, x) { x %= w.WW; return x < 0 ? x + w.WW : x; }
  C.pockets = function (w) {
    if (w._pockets) return w._pockets; var r = V.rng(V.hash(w.seed | 0, 4242)), L = [], T = C.table(w.body), n = 34 + (w.body.huge ? 16 : 0);
    for (var i = 0; i < n; i++) {
      var near = i < 6, x = near ? w.spawnX + (i % 2 ? 1 : -1) * (50 + i * 28 + r() * 20) : i < n / 2 ? w.spawnX + (r() - .5) * 2600 : r() * w.WW; x = Math.round(norm(w, x));
      for (var t = 0; t < 6 && !okX(w, x); t++) x = norm(w, x + 41); if (!okX(w, x)) continue;
      var d = near ? 6 + r() * 14 : 6 + Math.pow(r(), 1.25) * 112, deep = d > LAYER[2], kk = (deep ? T.deep : T.top)[Math.floor(r() * (deep ? T.deep : T.top).length)];
      L.push({ id: w.id + '@' + i, x: x, d: Math.round(d), k: kk, n: 2 + Math.floor(r() * 3) + (deep ? 3 : 0) + (d > LAYER[3] ? 4 : 0), sz: 3 + Math.floor(r() * 3), ph: r() * 10 });
    }
    return (w._pockets = L);
  };

  /* ---------- holes ---------- */
  var CW = 4;
  function holes(w) { return Pg.digs[w.id] || (Pg.digs[w.id] = {}); }
  function maxDepth() { return Pg.has('drill2') ? 124 : 62; }
  C.dig = function (w, x, amt) {
    var H = holes(w), ci = Math.floor(norm(w, x) / CW), md = maxDepth(), hit = false;
    [[0, 1], [-1, .7], [1, .7]].forEach(function (q) { var c = ci + q[0], cur = H[c] || 0, nd = Math.min(md - (q[0] ? 2 : 0), cur + amt * q[1]); if (nd > cur) { H[c] = Math.round(nd * 10) / 10; } else if (!q[0] && cur >= md) hit = true; });
    var d = H[ci] || 0, P = C.pockets(w), got = null;
    for (var i = 0; i < P.length; i++) { var p = P[i]; if (Pg.got[p.id]) continue; if (Math.abs(wdx(p.x, ci * CW + 2, w.WW)) <= p.sz + 3 && d >= p.d - p.sz) { got = p; break; } }
    if (got) {
      Pg.got[got.id] = 1; Pg.gain(got.k, got.n); var gy = Su.gAt(w, got.x); for (var j = 0; j < Math.min(got.n, 5); j++) Su.floats.push({ x: got.x + j * 6 - 12, y: gy + 16, t: -j * .08, icon: got.k });
      Su.puff(x, gy + 4, 14, RCOL[got.k] || '#fff', 8, 34); if (V.sfx) V.sfx('dig', { gap: .05 }); C.lastOre = got; if (V.save) V.save.write();
    }
    return { depth: d, hit: hit, got: got };
  };
  C.depthAt = function (w, x) { return holes(w)[Math.floor(norm(w, x) / CW)] || 0; };

  /* ---------- structures ---------- */
  var CST = [0, 45, 150, 360, 720], SNM = ['OUTPOST', 'SETTLEMENT', 'TOWN', 'CITY', 'ARCOLOGY'];
  C.STAGE_NAMES = SNM; C.STAGE_T = CST;
  C.colStage = function (c) { var s = 0; for (var i = 0; i < 5; i++) if (c.age >= CST[i]) s = i; return s; };
  C.colFrac = function (c) { var s = C.colStage(c); return s >= 4 ? 1 : (c.age - CST[s]) / (CST[s + 1] - CST[s]); };
  var DST = [0, 12, 24, 36, 48], DNM = ['SWARM', 'RING', 'LATTICE', 'SHELL', 'SPHERE'];
  C.DSTAGE_NAMES = DNM;
  C.dyStage = function (d) { var s = 0; for (var i = 0; i < 5; i++) if (d.seg >= DST[i]) s = i; return s; };
  var RIG_T = 45;
  function colonisedCount(sid) { var n = 0; for (var k in Pg.colonies) if (Pg.colonies[k].sys === sid) n++; return n; }
  C.rates = function () {
    var o = {}, lift = Pg.has('lifter') ? 2 : 1; function add(k, v) { o[k] = (o[k] || 0) + v; }
    for (var wid in Pg.drills) { var T = tableId(wid); Pg.drills[wid].forEach(function () { add(T.top[0], 1 / 18); }); }
    for (wid in Pg.colonies) { var s = C.colStage(Pg.colonies[wid]); add('ore', .03 * (s + 1)); add('crystal', .02 * (s + 1)); if (s >= 2) add('tech', .015 * s); if (s >= 4) add('essence', .01); }
    for (wid in Pg.rigs) { var r = Pg.rigs[wid]; if (r.age < RIG_T) continue; var T2 = tableId(wid); add(T2.top[0], .25 * lift); T2.deep.forEach(function (k) { add(k, .25 * lift / T2.deep.length); }); add('tech', .05 * lift); }
    for (var sid in Pg.dysons) { var d = Pg.dysons[sid]; add('energy', d.seg * .5 + (d.seg >= 48 ? 12 : 0)); add('essence', d.seg * .002); }
    if (Pg.has('forge') && (Pg.res.energy || 0) > 0) { add('tech', .2); add('crystal', .2); }
    return o;
  };
  var OCAP = { energy: 4000 };
  function tick(dt, offline) {
    var grow = Pg.has('lifter') ? 3 : 1, game = V.game, here = game && game.state === 'surface' && game.body ? game.body.id : null, id;
    for (id in Pg.colonies) { var c = Pg.colonies[id], s0 = C.colStage(c); c.age += dt * grow; var s1 = C.colStage(c); if (s1 !== s0 && !offline) { if (game) game.toast('COLONY ' + SNM[s1], c.name); if (V.sfx && here === id) V.sfx('build', { gap: 0 }); } }
    for (id in Pg.rigs) { var r = Pg.rigs[id], was = r.age < RIG_T; r.age += dt; if (was && r.age >= RIG_T && !offline) { if (game) game.toast('PLANET RIG ONLINE'); if (V.sfx) V.sfx('tier', { gap: 0 }); } }
    for (id in Pg.dysons) { var d = Pg.dysons[id], ds0 = C.dyStage(d), per = 10 / (1 + .5 * colonisedCount(id)); d.prog = (d.prog || 0) + dt / per; var added = 0;
      while (d.prog >= 1 && d.seg < 48) { d.prog -= 1; d.seg++; added++; } if (d.seg >= 48) d.prog = 0;
      if (added && !offline) { C.segFx = { id: id, t: 0 }; if (V.sfx && C.nearDyson === id) V.sfx('seg', { gap: .3 }); var ds1 = C.dyStage(d); if (ds1 !== ds0) { if (game) game.toast('DYSON ' + DNM[ds1]); if (V.sfx) V.sfx('dyson', { gap: 0 }); } } }
    var R = C.rates(), bank = C.bank, mul = offline ? .5 : 1;
    for (var k in R) { bank[k] = (bank[k] || 0) + R[k] * dt * mul; if (bank[k] >= 1) { var n = Math.floor(bank[k]); bank[k] -= n; if (offline && (C._offGain = C._offGain || {}, (C._offGain[k] || 0) >= (k === "energy" ? 20000 : 600))) continue; Pg.res[k] = (Pg.res[k] || 0) + n; if (offline) C._offGain[k] = (C._offGain[k] || 0) + n; else { Pg.flashRes = Pg.flashRes || {}; Pg.flashRes[k] = 1; } } }
  }
  C.tick = tick;
  C.instantBuild = function () { for (var id in Pg.colonies) Pg.colonies[id].age = Math.max(Pg.colonies[id].age, CST[4] + 1); for (id in Pg.rigs) Pg.rigs[id].age = RIG_T + 1; for (id in Pg.dysons) { Pg.dysons[id].seg = 48; Pg.dysons[id].prog = 0; } if (V.sfx) V.sfx('dyson', { gap: 0 }); };
  C.grant = function () { ['colony', 'dyson', 'drill2', 'autodrill', 'megarig', 'universal', 'cruiser', 'frigate', 'laser'].forEach(function (k) { Pg.unlock(k); }); };

  /* building actions (B, K or the touch build button) */
  function say(a, b) { if (V.game) V.game.toast(a, b); }
  function deny(a) { say(a); if (V.sfx) V.sfx('deny'); }
  function pay(cost) { if (!Pg.affordCost(cost)) { var need = []; for (var k in cost) if ((Pg.res[k] || 0) < cost[k]) need.push(cost[k] + ' ' + k.toUpperCase()); deny('NEED ' + need.join(' ')); return false; } Pg.spend(cost); return true; }
  C.build = function (w) {
    var pl = Su.pl, x = norm(w, pl.x), col = Pg.colonies[w.id], b = w.body;
    if (Pg.has('colony') && !col) { if (!pay({ scrap: 10, ore: 10 })) return 'deny'; Pg.colonies[w.id] = { sys: b.sys ? b.sys.id : null, name: G.nameOf(b), t: Math.round(G.t || 0), x: Math.round(x), age: 0 }; say('COLONY FOUNDED', G.nameOf(b)); if (V.sfx) V.sfx('build', { gap: 0 }); Su.puff(x, Su.gAt(w, x) + 4, 24, '#ffe07a', 30, 30); if (V.save) V.save.write(); return 'colony'; }
    if (col && col.x == null) col.x = Math.round(w.spawnX + 120);
    if (col && Pg.has('megarig') && !Pg.rigs[w.id] && Math.abs(wdx(x, col.x, w.WW)) < 120) { if (C.colStage(col) < 2) { deny('COLONY MUST BE A TOWN'); return 'deny'; } if (!pay({ ore: 40, tech: 20 })) return 'deny'; Pg.rigs[w.id] = { x: Math.round(norm(w, col.x + 230)), age: 0 }; say('PLANET RIG'); if (V.sfx) V.sfx('build', { gap: 0 }); if (V.save) V.save.write(); return 'rig'; }
    if (Pg.has('autodrill')) { var L = Pg.drills[w.id] || (Pg.drills[w.id] = []); if (L.length >= 8) { deny('DRILLS FULL'); return 'deny'; } if (L.some(function (q) { return Math.abs(wdx(q.x, x, w.WW)) < 22; })) { deny('TOO CLOSE'); return 'deny'; } if (!okX(w, x)) { deny('NOT HERE'); return 'deny'; } if (!pay({ scrap: 6, ore: 4 })) return 'deny'; L.push({ x: Math.round(x), t: Math.round(G.t || 0) }); say('AUTO-DRILL'); if (V.sfx) V.sfx('build', { gap: 0 }); Su.puff(x, Su.gAt(w, x) + 3, 12, '#c8c0e0', 10, 20); if (V.save) V.save.write(); return 'drill'; }
    deny('NEEDS AUTO-DRILL'); return 'deny';
  };
  C.buildSpace = function () {
    var F = V.fleet, st = F && F.nearStar(); if (!Pg.has('dyson')) return deny('NEEDS DYSON MODULE'); if (!st) return deny('FLY NEAR A STAR');
    var sid = st.sys.id; if (Pg.dysons[sid]) return deny('SWARM HERE'); if (!colonisedCount(sid)) return deny('COLONISE THIS SYSTEM FIRST');
    if (!pay({ tech: 20, crystal: 10, essence: 10 })) return; Pg.dysons[sid] = { star: st.id, t: Math.round(G.t || 0), seg: 0, prog: 0 }; say('DYSON SWARM'); if (V.sfx) V.sfx('dyson', { gap: 0 }); if (V.save) V.save.write(); return 'dyson';
  };

  /* ---------- per frame ---------- */
  var tb = 0;
  var pu0 = Pg.update; Pg.update = function (dt) {
    pu0(dt); var g = V.game; if (!g || g.state === 'title') return;
    tick(dt, false);
    if (C.awayMsg && g.state !== 'cine') { C.awayMsg = null; var a = C.away, parts = []; for (var k in a.gains) parts.push('+' + a.gains[k] + ' ' + k.toUpperCase()); if (parts.length) { g.toast('WHILE AWAY', parts.slice(0, 3).join(' ')); if (V.sfx) V.sfx('pickup2', { gap: 0 }); } }
    var tbn = V.touch.build ? 1 : 0, bp = (V.keyPressed('b') || V.keyPressed('k') || (tbn && !tb)) && !Pg.open; tb = tbn;
    if (bp) { if (g.state === 'surface' && Su.mode === 'play' && Su.cur) C.build(Su.cur); else if (g.state === 'space') C.buildSpace(); }
    if (g.state === 'space') { if (Pg.has('nova')) Pg.fuel = 1; var F = V.fleet, st = F && F.nearStar(); C.nearDyson = st && Pg.dysons[st.sys.id] ? st.sys.id : null; if (C.nearDyson && V.sfx) V.sfx.loop('hum', .5); } else C.nearDyson = null;
    if (C.scanT > 0) C.scanT -= dt;
    if (C.segFx) { C.segFx.t += dt; if (C.segFx.t > 1) C.segFx = null; }
    if (g.state === 'surface' && Su.cur && V.sfx) { var w = Su.cur, c = Pg.colonies[w.id], near = 0; if (c && c.x != null) near = 1 - clamp(Math.abs(wdx(c.x, Su.pl.x, w.WW)) / 320, 0, 1); var r = Pg.rigs[w.id]; if (r) near = Math.max(near, 1 - clamp(Math.abs(wdx(r.x, Su.pl.x, w.WW)) / 420, 0, 1)); if (near > .02) V.sfx.loop('hum', near); }
  };
  /* surface: drill + hand laser, glints, scanner x-ray */
  var pre0 = Su.preUpdate; Su.preUpdate = function (w, dt) {
    pre0(w, dt); var pl = Su.pl, play = Su.mode === 'play' && !Pg.open, Wd = V.world;
    if (Pg.colonies[w.id] && Pg.colonies[w.id].x == null) Pg.colonies[w.id].x = Math.round(norm(w, w.spawnX + 120));
    if (play && (V.keyPressed('q') || (Wd && Wd.pulse && Wd.pulse.t < dt * 1.5))) C.scanT = 7;
    var DR = C.dr, want = play && pl.ground && !pl.swim && (V.keyDown('x') || V.input.y > 0) && !V.input.x;
    DR.on = !!want;
    if (want) { var sp = Pg.has('drill2') ? 36 : 14, r = C.dig(w, pl.x, sp * dt); DR.depth = r.depth; DR.a += dt; if (V.sfx) V.sfx.loop('drill', r.hit ? .5 : 1);
      if (Math.random() < dt * 24) { var gy = Su.gAt(w, pl.x), st = STRATA[kindOf(w.body)][layerAt(r.depth)]; Su.puff(pl.x + (Math.random() - .5) * 6, gy + 2, 1, st, 10, 30); }
      if (r.hit && !DR.warned) { DR.warned = true; deny(Pg.has('drill2') ? 'BEDROCK' : 'NEEDS DIAMOND BIT'); } }
    else DR.warned = false;
    /* hand mining laser: F (or the touch laser button) cuts ore veins and rock */
    var lasOn = play && (V.keyDown('f') || V.touch.laser) && !want; C.las = null;
    if (lasOn) {
      var reach = Pg.has('beams') ? 150 : Pg.has('laser') ? 100 : 60, L = Wd ? Wd.pickups(w) : [], best = null, bd = reach;
      for (var i = 0; i < L.length; i++) { var it = L[i]; if (!it.dep || Pg.got[it.id]) continue; var dx = wdx(it.x, pl.x, w.WW); if (dx * pl.face < -4) continue; if (Math.abs(dx) < bd) { bd = Math.abs(dx); best = it; } }
      if (best) { best._las = (best._las || 0) + dt / (Pg.has('multitool') ? .35 : .9); C.las = { x: best.x, y: Su.gAt(w, best.x) + 4, dep: best };
        if (best._las >= 1) { Pg.got[best.id] = 1; Pg.gain(best.k, 2); var by = Su.gAt(w, best.x); Su.floats.push({ x: best.x, y: by + 14, t: 0, icon: best.k }); Su.floats.push({ x: best.x + 6, y: by + 14, t: -.1, icon: best.k }); Su.puff(best.x, by + 3, 14, RCOL[best.k], 8, 30); if (V.sfx) V.sfx('mine'); if (V.save) V.save.write(); } }
      else { var tx = pl.x + pl.face * 22; C.dig(w, tx, 9 * dt); C.las = { x: tx, y: Su.gAt(w, tx) - C.depthAt(w, tx) + 1, rock: 1 }; }
      if (V.sfx) V.sfx.loop('laser', .8);
      if (Math.random() < dt * 30) Su.puff(C.las.x, C.las.y, 1, '#ffb0f0', 6, 20);
    }
  };

  /* ---------- drawing on the surface ---------- */
  var HULL = '#c9c2ea', SHADE = '#8a82b0', DARK = '#4a4470', DEEP = '#2a2448', WIN = '#ffe07a', GLASS = '#7affe8', BEAC = '#ff5a7a';
  function fr(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function sxOf(w, cam, x) { return Math.round(wdx(x, cam.x, w.WW) + V.W / 2); }
  function syOf(w, cam, GY0, x) { return Math.round(GY0 - (Su.gAt(w, x) - cam.y)); }
  function drawHoles(g, w, cam, GY0, t) {
    var H = holes(w), K = kindOf(w.body), ST = STRATA[K], W = V.W, c0 = Math.floor(norm(w, cam.x - W / 2 - 8) / CW), n = Math.ceil(W / CW) + 4, nc = Math.ceil(w.WW / CW);
    for (var i = 0; i < n; i++) {
      var ci = (c0 + i) % nc, d = H[ci]; if (!d) continue; var x = ci * CW, sx = sxOf(w, cam, x), gy = syOf(w, cam, GY0, x + 2), dd = Math.round(d);
      for (var y = 0; y < dd; y++) { var L = layerAt(y); g.fillStyle = y < 2 ? DEEP : (V.bayer(sx, gy + y) < .25 ? ST[L] : '#0a0612'); g.fillRect(sx, gy + y, CW, 1); }
      g.fillStyle = '#05020d'; g.fillRect(sx + 1, gy + 2, CW - 2, Math.max(0, dd - 3));
      var lh = H[(ci - 1 + nc) % nc] || 0, rh = H[(ci + 1) % nc] || 0;
      for (y = 0; y < dd; y++) { var c = ST[layerAt(y)]; if (lh < y + 1) { g.fillStyle = c; g.fillRect(sx, gy + y, 1, 1); } if (rh < y + 1) { g.fillStyle = c; g.fillRect(sx + CW - 1, gy + y, 1, 1); } }
      if (dd > 2) { g.fillStyle = ST[layerAt(dd)]; g.fillRect(sx, gy + dd - 1, CW, 1); }
      if (!lh) { fr(g, sx - 2, gy - 1, 2, 1, ST[0]); fr(g, sx - 1, gy - 2, 1, 1, ST[1]); } if (!rh) { fr(g, sx + CW, gy - 1, 2, 1, ST[0]); fr(g, sx + CW, gy - 2, 1, 1, ST[1]); }
    }
  }
  function drawPockets(g, w, cam, GY0, t) {
    var P = C.pockets(w), W = V.W, pl = Su.pl, scan = C.scanT > 0, sa = clamp(C.scanT / 1.5, 0, 1);
    for (var i = 0; i < P.length; i++) {
      var p = P[i]; if (Pg.got[p.id]) continue; var sx = sxOf(w, cam, p.x); if (sx < -10 || sx > W + 10) continue; var gy = syOf(w, cam, GY0, p.x), col = RCOL[p.k] || '#fff';
      /* shallow pockets glint at the surface; a fleck of colour is always in the soil */
      if (p.d < 36) { fr(g, sx, gy + 1, 1, 1, col); var ph = (t * .45 + p.ph) % 1; if (ph < .16) { var a = ph < .08 ? 2 : 1; fr(g, sx - a, gy - 2, a * 2 + 1, 1, '#ffffff'); fr(g, sx, gy - 2 - a, 1, a * 2 + 1, '#ffffff'); fr(g, sx, gy - 2, 1, 1, col); } }
      var dep = C.depthAt(w, p.x), seen = dep > 0 && Math.abs(dep - p.d) < p.sz + 8;
      if ((scan && Math.abs(wdx(p.x, pl.x, w.WW)) < (Pg.has('scanner') ? 420 : 240)) || seen) {
        var cy = gy + p.d, r = p.sz;
        for (var yy = -r; yy <= r; yy++) for (var xx = -r - 1; xx <= r + 1; xx++) { var q = (xx * xx) / ((r + 1) * (r + 1)) + (yy * yy) / (r * r); if (q > 1) continue; var edge = q > .55; if (!edge && V.bayer(sx + xx, cy + yy) > (seen ? .8 : .45 * sa)) continue; g.fillStyle = edge ? col : (V.bayer(xx + 9, yy) < .2 ? '#ffffff' : col); if (edge && V.bayer(sx + xx + Math.floor(t * 8), cy + yy) > .6 * sa + (seen ? .4 : 0)) continue; g.fillRect(sx + xx, cy + yy, 1, 1); }
        if (scan) for (yy = 2; yy < p.d - r; yy += 3) fr(g, sx, gy + yy, 1, 1, col);
      }
    }
  }
  function drawVeins(g, w, cam, GY0, t) {
    if (!V.world) return; var L = V.world.pickups(w), W = V.W;
    for (var i = 0; i < L.length; i++) { var it = L[i]; if (!it.dep || Pg.got[it.id]) continue; var sx = sxOf(w, cam, it.x); if (sx < -20 || sx > W + 20) continue; var gy = syOf(w, cam, GY0, it.x), col = RCOL[it.k];
      for (var k = 0; k < 4; k++) { var ox = Math.round(Math.sin(k * 2.1 + it.ph) * 6), len = 6 + k * 3; for (var j = 0; j < len; j++) { if (V.bayer(j, k) > .7) continue; fr(g, sx + ox + Math.round(j * .5 * (k % 2 ? 1 : -1)), gy + 3 + j, 1, 1, k === 0 ? '#ffffff' : col); } } }
  }
  function drawDrillTool(g, w, cam, GY0, t) {
    var pl = Su.pl, sx = sxOf(w, cam, pl.x), gy = syOf(w, cam, GY0, pl.x);
    if (C.dr.on) { var d = Math.max(3, Math.round(C.depthAt(w, pl.x))); fr(g, sx - 1, gy - 6, 3, 6, SHADE); fr(g, sx, gy, 1, d - 2, '#c8c0e0'); var f = Math.floor(t * 20) % 2; fr(g, sx - 1, gy + d - 3, 3, 2, f ? '#ffe07a' : '#ffffff'); fr(g, sx - (f ? 1 : 0), gy + d - 1, 1, 1, '#ffb060'); }
    var L = C.las; if (L) { var hx = sx + pl.face * 4, hy = Math.round(GY0 - (pl.y + 9 - cam.y)), tx = sxOf(w, cam, L.x), ty = Math.round(GY0 - (Su.gAt(w, L.x) - cam.y)) + (L.rock ? Math.round(C.depthAt(w, L.x)) - 1 : -3), n = Math.max(Math.abs(tx - hx), Math.abs(ty - hy)), fl = Math.floor(t * 30);
      for (var i = 0; i <= n; i++) { var x = Math.round(hx + (tx - hx) * i / n), y = Math.round(hy + (ty - hy) * i / n); fr(g, x, y, 1, 1, (i + fl) % 3 ? '#ff8ae8' : '#ffffff'); }
      fr(g, tx - 1, ty - 1, 3, 3, fl % 2 ? '#ffffff' : '#ff8ae8'); if (L.dep && L.dep._las) { var p = clamp(L.dep._las, 0, 1); fr(g, tx - 8, ty - 30, 17, 3, '#140a2e'); fr(g, tx - 7, ty - 29, Math.round(15 * p), 1, RCOL[L.dep.k]); } }
  }
  /* buildings: a fixed layout around the colony, each piece appears at its stage (and rises on scaffolding just before) */
  var LAYOUT = [
    [0, 'pod', 0, 10, 12], [-16, 'dome', 0, 9], [14, 'solar', 0, 12, 6],
    [-38, 'dome', 1, 13], [30, 'hab', 1, 18, 10], [-60, 'hab', 1, 14, 8], [50, 'solar', 1, 14, 7],
    [70, 'tower', 2, 10, 44], [-86, 'green', 2, 26, 12], [-108, 'tower', 2, 8, 34], [94, 'dome', 2, 15],
    [118, 'tower', 3, 12, 72], [-134, 'tower', 3, 12, 62], [140, 'tower', 3, 8, 52], [-156, 'tower', 3, 10, 84], [168, 'pad', 3, 30, 4],
    [-4, 'spire', 4, 22, 150], [-196, 'tower', 4, 14, 100], [206, 'dome', 4, 26]
  ];
  C.LAYOUT = LAYOUT;
  function winLit(x, y, t) { return V.bayer(x * 3 + 1, y * 5 + Math.floor(t * .3 + x)) < .6; }
  function drawPiece(g, k, bx, by, a, b, t, frac, night) {
    /* frac 0..1: 1 = complete; less = scaffold rising */
    if (frac < 1) { var hh = k === 'dome' ? a : k === 'spire' || k === 'tower' ? b : b || 8, ww = k === 'dome' ? a * 2 : a, top = Math.round(hh * Math.max(.1, frac));
      for (var y = 0; y < top; y++) for (var x = 0; x <= ww; x++) { if (x % 4 && y % 4 && (x + y) % 4) continue; fr(g, bx - (ww >> 1) + x, by - y, 1, 1, '#ffb060'); }
      fr(g, bx + (ww >> 1) + 3, by - top - 10, 1, top + 10, '#ffd060'); fr(g, bx - (ww >> 1), by - top - 10, (ww >> 1) + 4, 1, '#ffd060'); fr(g, bx - (ww >> 1), by - top - 9, 1, 3 + Math.round(Math.sin(t * 2) * 2), '#c8c0e0'); if (Math.floor(t * 2) % 2) fr(g, bx + (ww >> 1) + 3, by - top - 11, 1, 1, BEAC); return; }
    if (k === 'pod') { fr(g, bx - 5, by - 12, 10, 12, HULL); fr(g, bx - 5, by - 12, 10, 2, '#ffffff'); fr(g, bx + 3, by - 12, 2, 12, SHADE); fr(g, bx - 2, by - 8, 3, 3, GLASS); fr(g, bx - 7, by - 2, 2, 2, DARK); fr(g, bx + 5, by - 2, 2, 2, DARK); fr(g, bx, by - 20, 1, 8, SHADE); if (Math.floor(t * 1.5) % 2) fr(g, bx, by - 21, 1, 1, BEAC); return; }
    if (k === 'dome') { var r = a; for (var yy = 0; yy <= r; yy++) { var hw = Math.round(Math.sqrt(r * r - yy * yy)); for (var xx = -hw; xx <= hw; xx++) { var e = Math.abs(xx) >= hw - 1 || yy >= r - 1; g.fillStyle = e ? HULL : (V.bayer(bx + xx, by - yy) < .35 ? '#c8fff4' : (xx + yy) % 5 ? '#3aa0a0' : GLASS); g.fillRect(bx + xx, by - yy, 1, 1); } }
      fr(g, bx - r, by, r * 2 + 1, 2, SHADE); if (night) { fr(g, bx - 2, by - 3, 5, 2, WIN); } fr(g, bx - (r >> 1), by - r + 2, 2, 1, '#ffffff'); return; }
    if (k === 'hab') { fr(g, bx - (a >> 1), by - b, a, b, HULL); fr(g, bx - (a >> 1), by - b, a, 1, '#ffffff'); fr(g, bx - (a >> 1), by - 2, a, 2, SHADE); for (var i = 2; i < a - 2; i += 4) fr(g, bx - (a >> 1) + i, by - b + 3, 2, 2, night || winLit(i, b, t) ? WIN : DARK); fr(g, bx + (a >> 1), by - (b >> 1), 6, 2, SHADE); return; }
    if (k === 'solar') { fr(g, bx, by - b, 1, b, SHADE); for (i = 0; i < a; i += 3) fr(g, bx - (a >> 1) + i, by - b - 2, 2, 3, i % 2 ? '#3a5aa0' : '#5a7ad0'); fr(g, bx - (a >> 1), by - b - 3, a, 1, '#9ac0ff'); return; }
    if (k === 'green') { for (yy = 0; yy < b; yy++) for (xx = 0; xx < a; xx++) { var arch = yy > b - 3 - Math.abs(xx - a / 2) * .3; if (arch) continue; g.fillStyle = xx % 6 === 0 || yy === 0 ? HULL : V.bayer(xx, yy) < .5 ? '#4ad078' : '#2a8a4a'; g.fillRect(bx - (a >> 1) + xx, by - yy, 1, 1); } return; }
    if (k === 'tower' || k === 'spire') {
      var w2 = a, top2 = by - b; fr(g, bx - (w2 >> 1), top2, w2, b, k === 'spire' ? '#b0a8d8' : HULL); fr(g, bx + (w2 >> 1) - 2, top2, 2, b, SHADE); fr(g, bx - (w2 >> 1), top2, 1, b, '#ffffff');
      for (yy = 4; yy < b - 3; yy += 4) for (xx = 2; xx < w2 - 3; xx += 3) fr(g, bx - (w2 >> 1) + xx, top2 + yy, 1, 2, night || winLit(xx, yy, t) ? WIN : DARK);
      if (k === 'spire') { for (var ring = 0; ring < 4; ring++) { var ry = top2 + 18 + ring * 32, rw = w2 + 20 - ring * 3; fr(g, bx - (rw >> 1), ry, rw, 3, SHADE); fr(g, bx - (rw >> 1), ry, rw, 1, '#ffffff'); for (xx = 0; xx < rw; xx += 4) if ((xx + Math.floor(t * 6)) % 8 < 4) fr(g, bx - (rw >> 1) + xx, ry + 1, 1, 1, GLASS); }
        fr(g, bx - 3, top2 - 14, 6, 14, '#e8e4ff'); fr(g, bx - 1, top2 - 30, 2, 16, SHADE); var on = Math.floor(t * 1.2) % 2; fr(g, bx - 1, top2 - 32, 2, 2, on ? '#ffffff' : BEAC); if (on) { fr(g, bx - 4, top2 - 31, 8, 1, '#ffb0c0'); } return; }
      fr(g, bx - 1, top2 - 6, 2, 6, SHADE); if (Math.floor(t + bx) % 2) fr(g, bx - 1, top2 - 7, 2, 1, BEAC); return; }
    if (k === 'pad') { fr(g, bx - (a >> 1), by - 3, a, 3, DARK); fr(g, bx - (a >> 1), by - 3, a, 1, SHADE); for (i = 0; i < a; i += 5) fr(g, bx - (a >> 1) + i, by - 4, 1, 1, Math.floor(t * 3 + i) % 3 ? '#7affa8' : '#ffffff'); }
  }
  function nightOf(w) { var e = Math.sin(TAU * ((w.tod || 0) - .25)); return e < 0; }
  C.drawColony = function (g, w, cam, GY0, t, c) {
    var s = C.colStage(c), fr2 = C.colFrac(c), night = nightOf(w), W = V.W, cx = sxOf(w, cam, c.x);
    if (cx < -260 || cx > W + 260) return;
    for (var i = 0; i < LAYOUT.length; i++) { var L = LAYOUT[i], ps = L[2]; if (ps > s + 1) continue; var x = norm(w, c.x + L[0]), bx = sxOf(w, cam, x), by = syOf(w, cam, GY0, x); if (bx < -40 || bx > W + 40) continue;
      fr(g, bx - ((L[1] === 'dome' ? L[3] * 2 : L[3]) >> 1) - 1, by, (L[1] === 'dome' ? L[3] * 2 : L[3]) + 2, 8, DEEP); /* foundations */
      drawPiece(g, L[1], bx, by, L[3], L[4], t, ps <= s ? 1 : fr2, night); }
    /* pipes between neighbours */
    var gy = syOf(w, cam, GY0, c.x); fr(g, cx - Math.min(200, 20 + s * 45), gy - 1, Math.min(400, 40 + s * 90), 1, SHADE);
    if (Pg.softTip && Math.abs(cx - W / 2) < W) Pg.softTip('col:' + w.id, cx - 30 - s * 30, gy - 40 - s * 20, 60 + s * 60, 40 + s * 20, function () { return { t: 'Colony: ' + SNM[s], d: c.name + ' grows over time and sends resources.', s: s < 4 ? Math.round(fr2 * 100) + '% to ' + SNM[s + 1] : 'Fully grown', sc: 'go', n: [Pg.has('megarig') && !Pg.rigs[w.id] ? (s >= 2 ? 'B: raise a planet rig here' : 'Grow to a town for a planet rig') : ''].filter(Boolean) }; });
  };
  C.drawDrill = function (g, w, cam, GY0, t, d, i) {
    var bx = sxOf(w, cam, d.x); if (bx < -20 || bx > V.W + 20) return; var by = syOf(w, cam, GY0, d.x), ph = Math.sin(t * 4 + i), up = Math.round(ph * 3);
    fr(g, bx - 1, by, 2, 12, '#3a3050'); fr(g, bx, by + 2, 1, 10, '#c8c0e0');
    for (var y = 0; y < 28; y++) { var hw = Math.round(6 - y * .18); fr(g, bx - hw, by - y, 1, 1, SHADE); fr(g, bx + hw, by - y, 1, 1, SHADE); if (y % 5 === 0) fr(g, bx - hw, by - y, hw * 2 + 1, 1, DARK); }
    fr(g, bx - 1, by - 22 + up, 3, 12, HULL); fr(g, bx - 4, by - 30, 9, 3, HULL); fr(g, bx - 4, by - 30, 9, 1, '#ffffff'); fr(g, bx - 8, by - 4, 16, 4, DARK); fr(g, bx - 8, by - 4, 16, 1, SHADE); fr(g, bx + 5, by - 3, 2, 1, (Math.floor(t * 2 + i) % 2) ? '#7affa8' : '#2a5a4a');
    if (ph > .9 && Math.random() < .3) Su.puff(d.x + 2, Su.gAt(w, d.x) + 2, 1, '#c8c0e0', 4, 14);
    if (Pg.softTip) Pg.softTip('adr:' + w.id + i, bx - 8, by - 31, 17, 33, function () { var T = C.table(w.body); return { t: 'Auto-drill', d: 'Pumps ' + T.top[0] + ' from the crust, even while you are away.', s: '1 every 18 s', sc: 'go', n: [] }; });
  };
  C.drawRig = function (g, w, cam, GY0, t, r) {
    var bx = sxOf(w, cam, r.x); if (bx < -120 || bx > V.W + 120) return; var by = syOf(w, cam, GY0, r.x), done = r.age >= RIG_T, fr2 = clamp(r.age / RIG_T, 0, 1), H = 190, top = by - Math.round(H * (done ? 1 : fr2));
    /* drill column into the crust with a molten core */
    for (var y = 0; y < 70; y++) { fr(g, bx - 5, by + y, 10, 1, y % 6 < 3 ? '#3a3050' : '#2a2440'); } fr(g, bx - 2, by, 4, 70, '#8a82b0'); var hot = Math.floor(t * 6) % 2; fr(g, bx - 6, by + 66, 12, 5, hot ? '#ff9a50' : '#ffe0a0');
    /* the lattice tower */
    for (y = 0; by - y > top; y++) { var hw = Math.round(28 - y * .12); fr(g, bx - hw, by - y, 2, 1, SHADE); fr(g, bx + hw - 1, by - y, 2, 1, SHADE); if (y % 12 === 0) fr(g, bx - hw, by - y, hw * 2, 1, DARK); if (y % 12 < 6) { var k = (y % 12) / 6; fr(g, Math.round(bx - hw + k * hw * 2), by - y, 1, 1, DARK); } }
    if (!done) { fr(g, bx + 30, top - 20, 1, by - top + 20, '#ffd060'); fr(g, bx - 30, top - 20, 62, 1, '#ffd060'); return; }
    fr(g, bx - 8, top, 16, H, HULL); fr(g, bx + 4, top, 4, H, SHADE); fr(g, bx - 8, top, 1, H, '#ffffff');
    for (var ring = 0; ring < 5; ring++) { var ry = top + 16 + ring * 34, rw = 70 - ring * 8; fr(g, bx - (rw >> 1), ry, rw, 4, DARK); fr(g, bx - (rw >> 1), ry, rw, 1, SHADE); for (var x = 0; x < rw; x += 5) fr(g, bx - (rw >> 1) + x, ry + 2, 2, 1, Math.floor(t * 4 + x / 5 + ring) % 3 ? WIN : '#ffffff'); }
    var a = Math.sin(t * .8) * 18; fr(g, bx, top + 50, Math.round(a + 26), 2, SHADE); fr(g, bx + Math.round(a + 24), top + 50, 2, 20, SHADE);
    fr(g, bx - 2, top - 24, 4, 24, '#e8e4ff'); var on = Math.floor(t * 1.4) % 2; fr(g, bx - 2, top - 26, 4, 2, on ? '#ffffff' : BEAC); if (on) fr(g, bx - 8, top - 25, 16, 1, '#ffb0c0');
    for (y = top - 26; y > 0; y -= 2) if (V.bayer(bx, y + Math.floor(t * 20)) < .5) fr(g, bx, y, 1, 1, GLASS);
    if (Pg.softTip) Pg.softTip('rig:' + w.id, bx - 30, top - 26, 60, H + 26, function () { return { t: 'Planet rig', d: 'Planet-scale rig. Seen from orbit and on the map.', s: 'Huge passive output', sc: 'go', n: [] }; });
  };
  var dc0 = Su.drawCritters; Su.drawCritters = function (sg, w, cam, GY0, t) {
    drawVeins(sg, w, cam, GY0, t); drawHoles(sg, w, cam, GY0, t); drawPockets(sg, w, cam, GY0, t);
    var c = Pg.colonies[w.id]; if (c && c.x != null) C.drawColony(sg, w, cam, GY0, t, c);
    var r = Pg.rigs[w.id]; if (r) C.drawRig(sg, w, cam, GY0, t, r);
    (Pg.drills[w.id] || []).forEach(function (d, i) { C.drawDrill(sg, w, cam, GY0, t, d, i); });
    dc0(sg, w, cam, GY0, t);
    drawDrillTool(sg, w, cam, GY0, t);
  };

  /* ---------- space: colonies and rigs seen from orbit ---------- */
  var P = V.planets, db0 = P.drawBody;
  P.drawBody = function (ctx, b, sx, sy, R, t, light) {
    var r = db0.apply(this, arguments); if (!b || !b.id) return r;
    var c = Pg.colonies[b.id], rig = Pg.rigs[b.id]; if (!c && !rig) return r;
    var s = c ? C.colStage(c) : 0, n = c ? 4 + s * 6 : 0;
    for (var i = 0; i < n; i++) { var a = 1.9 + (i * 2.399) % 1.6, rr = R * (.55 + (i * .37) % .4), x = Math.round(sx + Math.cos(a) * rr), y = Math.round(sy + Math.sin(a) * rr); if (V.bayer(i, Math.floor(t * 2)) > .85) continue; ctx.fillStyle = i % 4 ? '#ffe07a' : '#ffffff'; ctx.fillRect(x, y, 1, 1); }
    if (rig) { var done = rig.age >= RIG_T, Hh = Math.round((R * .55 + 8) * (done ? 1 : clamp(rig.age / RIG_T, .1, 1))), tx = Math.round(sx), ty = Math.round(sy - R);
      ctx.fillStyle = '#8a82b0'; ctx.fillRect(tx - 2, ty - Hh, 1, Hh); ctx.fillRect(tx + 2, ty - Hh, 1, Hh); ctx.fillStyle = '#c9c2ea'; ctx.fillRect(tx - 1, ty - Hh, 3, Hh); for (var k = 4; k < Hh; k += 5) { ctx.fillStyle = '#ffe07a'; ctx.fillRect(tx - 3, ty - k, 7, 1); }
      if (done) { ctx.fillStyle = Math.floor(t * 1.4) % 2 ? '#ffffff' : '#ff5a7a'; ctx.fillRect(tx - 1, ty - Hh - 2, 3, 2); for (var y = ty - Hh - 3; y > ty - Hh - 60; y -= 2) if (V.bayer(tx, y + Math.floor(t * 20)) < .5) { ctx.fillStyle = '#7affe8'; ctx.fillRect(tx, y, 1, 1); } } }
    return r;
  };

  /* ---------- Dyson swarms: swarm -> ring -> lattice -> shell -> sphere ---------- */
  var shellC = {};
  function shellCanvas(R, seg, q) {
    var key = R + '|' + seg + '|' + q; if (shellC[key]) return shellC[key]; for (var kk in shellC) delete shellC[kk];
    var RR = Math.round(R * 1.32), S = RR * 2 + 1, cv = V.mk(S, S), g = cv.g, img = g.createImageData(S, S), u = new Uint32Array(img.data.buffer), cover = clamp((seg - 36) / 12, 0, 1), full = seg >= 48;
    function pk(h) { var c = V.hex(h); return (255 << 24) | (c[2] << 16) | (c[1] << 8) | c[0]; }
    var PAN = pk('#3a2a1e'), PAN2 = pk('#5a4028'), EDGE = pk('#ffd060'), HOT = pk('#ffffff'), SEAM = pk('#ff9a50');
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var dx = (x - RR) / RR, dy = (y - RR) / RR, d2 = dx * dx + dy * dy; if (d2 > 1) continue; var z = Math.sqrt(1 - d2), lon = Math.atan2(dx, z) + q * .05, lat = Math.asin(clamp(dy, -1, 1));
      var cu = Math.floor(lon / .26), cvv = Math.floor(lat / .26), h = ((cu * 73856093) ^ (cvv * 19349663)) >>> 0, have = (h % 1000) / 1000 < cover || full;
      var fu = lon / .26 - cu, fv = lat / .26 - cvv, edge = fu < .14 || fv < .14;
      if (!have) continue; u[y * S + x] = edge ? (full && (h + q) % 5 === 0 ? HOT : full ? SEAM : EDGE) : (V.bayer(x, y) < z * .6 ? PAN2 : PAN);
    }
    g.putImageData(img, 0, 0); shellC[key] = cv; return cv;
  }
  function ell(g, bx, by, R, ry, rot, frac, col, t, star, dens) {
    var n = Math.round(R * 6 * frac), ca = Math.cos(rot), sa = Math.sin(rot);
    for (var i = 0; i < n; i++) { var a = i / (R * 6) * TAU + t * .08, x0 = Math.cos(a) * R, y0 = Math.sin(a) * ry, x = bx + x0 * ca - y0 * sa, y = by + x0 * sa + y0 * ca; if (y0 < 0 && Math.hypot(x - bx, y - by) < star) continue; if (dens && V.bayer(i, 3) > dens) continue; g.fillStyle = i % 9 === 0 ? '#ffffff' : col; g.fillRect(Math.round(x), Math.round(y), i % 3 ? 1 : 2, 1); }
  }
  C.drawDysons = function (g, cx, cy, t) {
    var W = V.W, H = V.H;
    for (var id in Pg.dysons) {
      var d = Pg.dysons[id], b = G.getBody(d.star); if (!b) continue; var bx = Math.round(b.x - cx + W / 2), by = Math.round(b.y - cy + H / 2), R = b.r, ext = R * 2.2; if (bx + ext < 0 || bx - ext > W || by + ext < 0 || by - ext > H) continue;
      var seg = d.seg, st = C.dyStage(d);
      /* swarm collectors: always present, more with every segment */
      var nS = 30 + seg * 5; for (var i = 0; i < nS; i++) { var a = i * 2.399 + t * (.05 + (i % 5) * .015), rr = R * (1.5 + (i % 7) * .07), tilt = .25 + (i % 4) * .22, x = Math.round(bx + Math.cos(a) * rr), y = Math.round(by + Math.sin(a) * rr * tilt); if (Math.sin(a) < 0 && Math.hypot(x - bx, y - by) < R) continue; g.fillStyle = i % 11 === 0 ? '#ffffff' : '#ffe07a'; g.fillRect(x, y, 2, 1); }
      if (seg > 12 || st >= 1) ell(g, bx, by, R * 1.6, R * .42, 0, clamp((seg - 12) / 12, 0, 1), '#ffd060', t, R, 0);
      if (seg > 24) { var f = clamp((seg - 24) / 12, 0, 1); ell(g, bx, by, R * 1.42, R * 1.42 * .35, 1.05, f, '#ffb060', t, R, 0); ell(g, bx, by, R * 1.42, R * 1.42 * .35, -1.05, f, '#ffb060', t, R, 0); ell(g, bx, by, R * 1.42, R * 1.42, 0, f, '#ffb060', t, 0, .5); }
      if (seg > 36) { var cv = shellCanvas(Math.round(R), seg, Math.floor(t * 2) % 120); g.drawImage(cv, bx - (cv.width >> 1), by - (cv.height >> 1)); }
      if (seg >= 48) { var pulse = .5 + .5 * Math.sin(t * 2); for (i = 0; i < 4; i++) { var aa = i / 4 * TAU + t * .3, L = R * (2 + pulse * .3); for (var k = R * 1.35; k < L; k += 2) { g.fillStyle = k % 4 ? '#ffe07a' : '#ffffff'; g.fillRect(Math.round(bx + Math.cos(aa) * k), Math.round(by + Math.sin(aa) * k * .5), 1, 1); } } }
      /* construction drones carrying the next segment */
      if (seg < 48) for (i = 0; i < 3; i++) { var p = ((t * .35 + i / 3) % 1), a2 = i * 2.1 + seg, x2 = Math.round(bx + Math.cos(a2) * R * (2.1 - p * .7)), y2 = Math.round(by + Math.sin(a2) * R * (2.1 - p * .7) * .6); g.fillStyle = '#c9c2ea'; g.fillRect(x2 - 1, y2, 3, 1); g.fillStyle = '#ffe07a'; g.fillRect(x2, y2 - 1, 1, 1); }
      if (C.segFx && C.segFx.id === id) { var e = C.segFx.t; g.fillStyle = '#ffffff'; for (i = 0; i < 16; i++) { var a3 = i / 16 * TAU; g.fillRect(Math.round(bx + Math.cos(a3) * R * (1.3 + e)), Math.round(by + Math.sin(a3) * R * (1.3 + e) * .5), 1, 1); } }
      if (Pg.softTip) Pg.softTip('dys:' + id, bx - R * 1.6, by - R * 1.4, R * 3.2, R * 2.8, (function (d) { return function () { var s2 = C.dyStage(d); return { t: 'Dyson ' + DNM[s2], d: 'Assembles segment by segment around the star.', s: d.seg + ' of 48 segments', sc: 'go', n: ['+' + (d.seg * .5 + (d.seg >= 48 ? 12 : 0)).toFixed(1) + ' energy/s'] }; }; })(d));
    }
  };

  /* ---------- galaxy map: owned colonies, rigs and swarms ---------- */
  C.mapMark = function (g, s, cands, toScreen) {
    var W = V.W, H = V.H, t = V.time;
    for (var id in Pg.colonies) { var b = G.getBody(id); if (!b) continue; var p = toScreen(b.x, b.y, s); if (p[0] < -4 || p[1] < -4 || p[0] > W + 4 || p[1] > H + 4) continue; var rig = !!Pg.rigs[id];
      g.fillStyle = '#05020d'; g.fillRect(p[0] - 3, p[1] - 3, 7, 7); V.glyph(g, rig ? 'rig' : 'colo', p[0] - 2, p[1] - 2, rig ? '#7affe8' : '#ffe07a'); if (rig && Math.floor(t * 2) % 2) { g.fillStyle = '#ff5a7a'; g.fillRect(p[0], p[1] - 4, 1, 1); }
      cands.push({ x: b.x, y: b.y, sx: p[0], sy: p[1], kind: 'col', id: id, known: true }); }
    for (id in Pg.dysons) { var d = Pg.dysons[id], sb = G.getBody(d.star); if (!sb) continue; var q = toScreen(sb.x, sb.y, s); if (q[0] < -8 || q[1] < -8 || q[0] > W + 8 || q[1] > H + 8) continue; var rr = 5, n = 16, have = Math.round(n * d.seg / 48);
      for (var i = 0; i < n; i++) { var a = i / n * TAU + t * .4; g.fillStyle = i < have ? '#ffe07a' : '#4a3a20'; g.fillRect(Math.round(q[0] + Math.cos(a) * rr), Math.round(q[1] + Math.sin(a) * rr), 1, 1); }
      cands.push({ x: sb.x, y: sb.y, sx: q[0], sy: q[1], kind: 'dys', id: id, known: true }); }
  };
  C.tip = function (c) {
    if (c.kind === 'dys') { var d = Pg.dysons[c.id], s = C.dyStage(d); return { t: 'Dyson ' + DNM[s], d: 'Your swarm around this star.', s: d.seg + ' of 48 segments', sc: 'go', n: ['+' + (d.seg * .5 + (d.seg >= 48 ? 12 : 0)).toFixed(1) + ' energy/s'] }; }
    var col = Pg.colonies[c.id], st = C.colStage(col), r = Pg.rigs[c.id], dn = (Pg.drills[c.id] || []).length;
    return { t: col.name, d: 'Colony: ' + SNM[st] + (r ? ', planet rig' : '') + (dn ? ', ' + dn + ' drills' : ''), s: 'Yours', sc: 'go', n: ['Click, then Jump or Autopilot.'] };
  };

  /* ---------- admin row ---------- */
  C.adminRow = function (g, x, y) {
    Pg.iconBtn(g, 'ac:grant', x, y, 'colo', '#ffe07a', C.grant, 'GRANT COLONY UPGRADES');
    Pg.iconBtn(g, 'ac:here', x + 14, y, 'build', '#ffe07a', function () { var gm = V.game; if (gm.state === 'surface' && Su.cur) { C.grant(); var r0 = Pg.res; Pg.gain('scrap', 40); Pg.gain('ore', 80); Pg.gain('tech', 30); C.build(Su.cur); if (Pg.colonies[Su.cur.id]) { Pg.colonies[Su.cur.id].age = CST[3] + 1; C.build(Su.cur); C.build(Su.cur); } } else if (gm.state === 'space') { C.grant(); Pg.gain('tech', 30); Pg.gain('crystal', 20); Pg.gain('essence', 20); var st = V.fleet.nearStar(); if (st && !colonisedCount(st.sys.id)) Pg.colonies['admin:' + st.sys.id] = { sys: st.sys.id, name: 'OUTPOST', t: 0, x: 0, age: 0 }; C.buildSpace(); } }, 'BUILD HERE');
    Pg.iconBtn(g, 'ac:instant', x + 28, y, 'instant', '#7affe8', C.instantBuild, 'INSTANT-BUILD ALL');
    Pg.iconBtn(g, 'ac:energy', x + 42, y, 'energy', '#ffe07a', function () { Pg.gain('energy', 1000); }, '+1000 ENERGY');
  };
  /* admin colonies keyed 'admin:sys' are not real bodies: keep them out of map + orbit lookups */
  var gb0 = G.getBody; G.getBody = function (id) { if (typeof id === 'string' && id.indexOf('admin:') === 0) return null; return gb0(id); };
})();
