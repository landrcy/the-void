/* The Void — seeded galaxy generation. The galaxy is an infinite grid of 9000-unit cells; each cell is generated lazily
   (and deterministically) from hash(seed, cx, cy). Cell (0,0) is always the calm home system with Earth. */
(function () {
  'use strict';
  var V = window.VOID, TAU = V.TAU, G = V.Gen = { seed: 1, CELL: 9000, cells: new Map(), t: 0 };
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  G.init = function (seed) { G.seed = seed | 0; G.cells.clear(); G.byId = {}; if (V.planets) V.planets.clearCache(); };
  G.cellIndex = function (x) { return Math.floor((x + G.CELL / 2) / G.CELL); };

  var STARK = {
    yellow: { r: [58, 80], L: 1, tint: [255, 244, 220], dot: '#ffe27a' }, orange: { r: [48, 66], L: .55, tint: [255, 218, 170], dot: '#ffaa55' },
    red: { r: [32, 48], L: .12, tint: [255, 176, 140], dot: '#ff6a4a' }, white: { r: [62, 84], L: 3.5, tint: [240, 246, 255], dot: '#e8f0ff' },
    blue: { r: [88, 116], L: 16, tint: [205, 226, 255], dot: '#9fc4ff' }, giant: { r: [170, 250], L: 40, tint: [255, 190, 150], dot: '#ff6a40' },
    neutron: { r: [6, 8], L: .3, tint: [215, 230, 255], dot: '#cfe0ff' }
  };
  G.STARK = STARK;

  var PALKEYS = {
    desert: ['desertA', 'desertB', 'desertC'], rocky: ['rockyG', 'rockyB', 'rockyU'], ice: ['iceA', 'iceB'], crystal: ['crystalA', 'crystalB', 'crystalC'],
    gas: ['gasJ', 'gasS', 'gasP', 'gasT'], icegas: ['gasN', 'gasP', 'gasT'], moon: ['moonG', 'rockyB', 'rockyU'], barren: ['rockyG', 'rockyB']
  };
  var ATM = { earth: '#8fc4ff', ocean: '#7fb8ff', jungle: '#9fe0c8', desert: '#f0b070', ice: '#b0dcff', lava: '#ff7a3a', venus: '#ffd890', gas: null };
  var RINGCOLS = [['#6b5a46', '#a8957a', '#d6c3a0', '#efe3c6'], ['#4a5a7a', '#7f93b8', '#b6c8e6', '#e0ecfa'], ['#6a4a6a', '#a07aa0', '#d0a8d0', '#f0d8f0'], ['#5a5a5a', '#8a8a90', '#b6b6c0', '#e0e0ea']];

  function mkBody(cell, sys, list, o) {
    o.id = cell.cx + ',' + cell.cy + ':' + list.length; o.cell = cell; o.sys = sys; o.idx = list.length; list.push(o);
    o.isStar = !!o.isStar; o.x = o.x || 0; o.y = o.y || 0; G.byId[o.id] = o; return o;
  }
  function orbitOf(parent, a, T, ph, e, w, ox, oy) { return { parent: parent || null, a: a, T: T, ph: ph, e: e || 0, w: w || 0, ox: ox || 0, oy: oy || 0 }; }
  function dotOf(b) { var pal = b.palKey ? V.planets.PAL[b.palKey] : null; if (b.type === 'earth' || b.type === 'ocean') return '#2f7fd0'; if (b.type === 'jungle') return '#2f8a3a'; if (b.type === 'lava') return '#ff6a2a'; if (b.type === 'venus') return '#e6c27a'; if (pal) return pal[2][1]; return '#9a96a0'; }
  function giantR(r, type) { return type === 'gas' ? 70 + r() * 80 : type === 'icegas' ? 46 + r() * 40 : 0; }

  function makePlanet(cell, sys, list, r, a, q, star, forced) {
    var type, w;
    var roll = r();
    if (forced) type = forced;
    else if (q < .45) type = roll < .5 ? 'lava' : roll < .8 ? 'rocky' : 'venus';
    else if (q < .8) type = roll < .38 ? 'desert' : roll < .62 ? 'rocky' : roll < .72 ? 'lava' : 'venus';
    else if (q < 1.45) type = roll < .26 ? 'ocean' : roll < .5 ? 'jungle' : roll < .68 ? 'desert' : roll < .86 ? 'rocky' : roll < .93 ? 'crystal' : 'ice';
    else if (q < 2.6) type = roll < .2 ? 'desert' : roll < .38 ? 'rocky' : roll < .62 ? 'ice' : roll < .8 ? 'gas' : roll < .88 ? 'icegas' : 'crystal';
    else type = roll < .34 ? 'ice' : roll < .6 ? 'gas' : roll < .82 ? 'icegas' : roll < .92 ? 'rocky' : 'crystal';
    var rad = giantR(r, type) || (14 + r() * 38);
    if (type === 'crystal') rad = 16 + r() * 22; if (type === 'venus') rad = 24 + r() * 22;
    var b = mkBody(cell, sys, list, { type: type, seed: Math.floor(r() * 1e9), r: rad, orbit: orbitOf(null, a, 600 + a * (.7 + r() * .6) * 1.1 + r() * 800, r() * TAU, 0, 0, sys.x, sys.y), tilt: .15 + r() * .5, spin: r() * TAU, landable: true, cloudAmt: 0, star: star });
    var pk = PALKEYS[type]; if (pk) b.palKey = V.pick(r, pk);
    b.atm = ATM[type] || null;
    if (type === 'desert') { b.atm = r() < .5 ? ATM.desert : null; b.cloudAmt = r() < .4 ? .25 : 0; }
    if (type === 'ocean' || type === 'jungle') b.cloudAmt = .35 + r() * .4;
    if (type === 'ice') { b.atm = r() < .5 ? ATM.ice : null; b.cloudAmt = r() < .5 ? .3 : 0; }
    if (type === 'lava') { b.atm = r() < .4 ? ATM.lava : null; b.cloudAmt = r() < .5 ? .3 : 0; }
    if (type === 'gas' || type === 'icegas') { b.atm = type === 'gas' ? '#e8c89a' : '#8fb8ff'; if (b.palKey === 'gasP') b.atm = '#c8a0e8'; if (b.palKey === 'gasT') b.atm = '#80e0c8'; if (b.palKey === 'gasS') b.atm = '#e8dca0'; }
    var ringP = (type === 'gas' || type === 'icegas') ? .38 : .04;
    if (r() < ringP) { b.ring = { in: 1.35 + r() * .3, out: 2.0 + r() * .7, sq: .2 + r() * .22, ang: (r() - .5) * 1.1, cols: V.pick(r, RINGCOLS) }; }
    b.dot = dotOf(b); b.surf = type;
    /* moons */
    var nm = type === 'gas' ? Math.floor(r() * 4.5) : type === 'icegas' ? Math.floor(r() * 3.5) : rad > 28 ? Math.floor(r() * 2.6) : (r() < .25 ? 1 : 0);
    var ma = rad * (b.ring ? b.ring.out + .8 : 2.1);
    for (var m = 0; m < nm; m++) {
      var mt = r() < .5 ? 'moon' : r() < .5 ? 'ice' : r() < .3 ? 'lava' : 'rocky', mr = 5 + r() * 8; ma += mr * 2 + 10 + r() * 30;
      var mb = mkBody(cell, sys, list, { type: mt, seed: Math.floor(r() * 1e9), r: mr, moonOf: b, orbit: orbitOf(b, ma, 40 + ma * .9 + r() * 60, r() * TAU), tilt: r() * .4, spin: r() * TAU, landable: true, star: star });
      mb.palKey = mt === 'moon' ? V.pick(r, PALKEYS.moon) : mt === 'ice' ? V.pick(r, PALKEYS.ice) : mt === 'rocky' ? V.pick(r, PALKEYS.rocky) : null; mb.dot = dotOf(mb); mb.surf = mt === 'moon' ? 'moon' : mt;
    }
    return b;
  }

  function beltAndExtras(cell, sys, list, r, aMin, aMax, star, rich) {
    if (r() < (rich ? .7 : .38)) {
      var ab = aMin + r() * (aMax - aMin), n = 16 + Math.floor(r() * 18), wd = 60 + r() * 120;
      for (var i = 0; i < n; i++) { var rr = 2.4 + Math.pow(r(), 2.2) * 8, bb = mkBody(cell, sys, list, { type: 'asteroid', seed: Math.floor(r() * 1e9), r: rr, orbit: orbitOf(null, ab + (r() - .5) * wd * 2, 1400 + ab * 2 + r() * 300, r() * TAU, 0, 0, sys.x, sys.y), elong: 1 + r() * .5, rot: r() * TAU, spin: r() * TAU, tilt: r() * .5, landable: true, star: star, palKey: V.pick(r, ['moonG', 'rockyB', 'rockyG', 'rockyU']), dot: '#8a8590' }); bb.surf = 'asteroid'; }
    }
    if (r() < .34) { var cb = mkBody(cell, sys, list, { type: 'comet', seed: Math.floor(r() * 1e9), r: 4 + r() * 4, orbit: orbitOf(null, 2300 + r() * 900, 1000 + r() * 800, r() * TAU, .82, r() * TAU, sys.x, sys.y), elong: 1.2, rot: r() * TAU, spin: r() * TAU, tilt: .3, landable: true, star: star, palKey: 'iceA', dot: '#cfe6ff', surf: 'comet' }); }
  }

  function makeStar(cell, sys, list, kind, r, parentOrbit) {
    var K = STARK[kind], b = mkBody(cell, sys, list, { type: 'star', isStar: true, skind: kind, seed: Math.floor(r() * 1e9), r: K.r[0] + r() * (K.r[1] - K.r[0]), orbit: parentOrbit || null, landable: false, dot: K.dot, tint: K.tint, L: K.L, x: sys.x, y: sys.y, surf: 'star' });
    return b;
  }

  function nebulaFor(cell, r, x, y) {
    var PALS = [['#1a0a38', '#3a1670', '#6a2eb0'], ['#0a2a40', '#10507a', '#2a8cc0'], ['#380a28', '#701850', '#c0388a'], ['#2a1a0a', '#6a3a12', '#c07a2a'], ['#0a3030', '#14605a', '#30b0a0'], ['#240a40', '#4a1a78', '#e05aa0']];
    return { x: x, y: y, seed: Math.floor(r() * 1e9), cols: V.pick(r, PALS), size: 150 + Math.floor(r() * 60), par: .28 + r() * .12 };
  }

  G.genCell = function (cx, cy) {
    var key = cx + ',' + cy, c = G.cells.get(key); if (c) return c;
    var r = V.rng(V.hash(G.seed, cx, cy, 9)), C = G.CELL, ox = cx * C, oy = cy * C;
    c = { cx: cx, cy: cy, key: key, bodies: [], systems: [], nebulae: [], marks: [], frame: -1 };
    var home = (cx === 0 && cy === 0), ring1 = Math.max(Math.abs(cx), Math.abs(cy)) <= 1;
    var roll = home ? 0 : r(); if (ring1 && !home && roll > .64 && roll < .84) roll = r() * .5;
    var list = c.bodies, sys, star;
    function newSys(kind, x, y) { sys = { cx: cx, cy: cy, x: x, y: y, kind: kind, stars: [], cell: c, id: cx + ',' + cy, hz: 1100, tint: [255, 244, 220] }; c.systems.push(sys); return sys; }
    if (home) { genHome(c, newSys('home', 0, 0), list, r); }
    else if (roll < .87) {
      var x = ox + (r() - .5) * 2000, y = oy + (r() - .5) * 2000, kind, mul = 1;
      var rr = r(), skind = rr < .38 ? 'yellow' : rr < .55 ? 'orange' : rr < .76 ? 'red' : rr < .9 ? 'white' : 'blue';
      var form = roll < .50 ? 'single' : roll < .63 ? 'binary' : roll < .67 ? 'ternary' : roll < .72 ? 'giant' : roll < .77 ? 'neutron' : roll < .81 ? 'bh' : 'single';
      if (form === 'single' || form === 'binary' || form === 'ternary') {
        newSys(form, x, y); var sk = STARK[skind]; sys.hz = 1100 * Math.sqrt(sk.L); sys.hz = clamp(sys.hz, 420, 3200); sys.tint = sk.tint;
        if (form === 'single') { star = makeStar(c, sys, list, skind, r); sys.stars.push(star); }
        else {
          var sk2 = V.pick(r, ['yellow', 'orange', 'red', 'white']), d = 150 + r() * 130, T = 70 + r() * 70, ph = r() * TAU, sa = makeStar(c, sys, list, skind, r, orbitOf(null, d * .4, T, ph, 0, 0, x, y)), sb = makeStar(c, sys, list, sk2, r, orbitOf(null, d * .6, T, ph + Math.PI, 0, 0, x, y)); sys.stars.push(sa, sb);
          sa.r *= .85; sb.r *= .8;
          if (form === 'ternary') { var sc = makeStar(c, sys, list, V.pick(r, ['red', 'orange']), r, orbitOf(null, d * 2.3, T * 3.4, r() * TAU, 0, 0, x, y)); sc.r *= .6; sys.stars.push(sc); }
          sys.hz = clamp(1100 * Math.sqrt(sk.L + STARK[sk2].L * .6) * 1.0, 700, 3200);
          star = sa;
        }
        var np = 2 + Math.floor(r() * 6), a = (form === 'single' ? 340 : 760) * (.8 + r() * .5) * Math.max(.6, Math.sqrt(sk.L) * .9), last = a, mxa = 4000;
        for (var i = 0; i < np && a < mxa; i++) { makePlanet(c, sys, list, r, a, a / sys.hz, star); last = a; a *= 1.42 + r() * .5; }
        beltAndExtras(c, sys, list, r, 600, Math.min(last + 300, 3600), star, true);
        if (r() < .22) genStation(c, sys, list, r, star);
      } else if (form === 'giant') {
        newSys('giant', x, y); sys.hz = 3800; sys.tint = STARK.giant.tint; star = makeStar(c, sys, list, 'giant', r); sys.stars.push(star);
        var ng = 2 + Math.floor(r() * 3), a2 = 1300 + r() * 500; for (i = 0; i < ng; i++) { makePlanet(c, sys, list, r, a2, 1, star, V.pick(r, ['lava', 'rocky', 'desert', 'gas', 'ice'])); a2 *= 1.4 + r() * .3; }
        beltAndExtras(c, sys, list, r, 1000, 2600, star, false);
      } else if (form === 'neutron') {
        newSys('pulsar', x, y); sys.hz = 900; sys.tint = STARK.neutron.tint; star = makeStar(c, sys, list, 'neutron', r); sys.stars.push(star);
        var nd = 1 + Math.floor(r() * 3), a3 = 420 + r() * 300; for (i = 0; i < nd; i++) { makePlanet(c, sys, list, r, a3, 2, star, V.pick(r, ['rocky', 'ice', 'crystal', 'rocky'])); a3 *= 1.6 + r() * .5; }
        beltAndExtras(c, sys, list, r, 500, 2000, star, true); genWrecks(c, sys, list, r, star, 1 + Math.floor(r() * 3));
      } else {
        newSys('bh', x, y); sys.hz = 2400; sys.tint = [226, 200, 255];
        var bh = mkBody(c, sys, list, { type: 'bh', isBH: true, seed: Math.floor(r() * 1e9), r: 26 + r() * 20, landable: false, x: x, y: y, dot: '#c04df0', surf: 'bh' }); bh.isStar = false; bh.mass = bh.r * bh.r * 150; sys.stars.push(bh); star = bh; sys.bh = bh;
        var nrd = 5 + Math.floor(r() * 4), a4 = 700; for (i = 0; i < nrd; i++) { genRuin(c, sys, list, r, a4 + r() * 300, star); a4 += 340 + r() * 220; }
        genWrecks(c, sys, list, r, star, 2 + Math.floor(r() * 3)); beltAndExtras(c, sys, list, r, 1300, 2200, star, true);
      }
    }
    /* nebula backdrop */
    if (r() < (home ? .5 : .46) || roll > .82) { var nb = nebulaFor(c, r, ox + (r() - .5) * C * .8, oy + (r() - .5) * C * .8); c.nebulae.push(nb); if (!home && roll > .86 && roll < .93) { c.marks.push('nebula'); } }
    /* scatter objects */
    var ns = Math.floor(r() * 3.2);
    for (var k = 0; k < ns; k++) {
      var tries = 0, px, py; do { px = ox + (r() - .5) * C * .9; py = oy + (r() - .5) * C * .9; tries++; } while (tries < 8 && c.systems.length && Math.hypot(px - c.systems[0].x, py - c.systems[0].y) < 3600);
      genScatter(c, list, r, px, py, home);
    }
    if (!home && r() < .06) c.marks.push('whale'); if (!home && r() < .05) c.marks.push('ghost'); if (r() < .06) c.marks.push('monolith');
    c.whaleSeed = Math.floor(r() * 1e9);
    G.cells.set(key, c); if (G.cells.size > 60) { var it = G.cells.keys().next().value; var old = G.cells.get(it); if (old) old.bodies.forEach(function (b) { delete G.byId[b.id]; }); G.cells.delete(it); }
    G.updateCell(c, G.t);
    return c;
  };
  function sysOf(c, x, y, lightAng) { return { cx: c.cx, cy: c.cy, x: x, y: y, kind: 'lone', stars: [], cell: c, id: c.cx + ',' + c.cy + ':lone', hz: 1, tint: [210, 220, 255], lone: true }; }
  function genScatter(c, list, r, x, y, home) {
    var sys = sysOf(c, x, y), roll = r(), b, i;
    if (roll < .17) { b = mkBody(c, sys, list, { type: V.pick(r, ['rocky', 'ice', 'desert', 'crystal']), seed: Math.floor(r() * 1e9), r: 14 + r() * 24, cx: x, cy: y, orbit: null, tilt: .3, spin: r() * TAU, landable: true, rogue: true }); b.palKey = V.pick(r, PALKEYS[b.type] || ['rockyG']); b.surf = b.type; b.dot = dotOf(b); }
    else if (roll < .34) { var n = 22 + Math.floor(r() * 24), rad = 420 + r() * 520; for (i = 0; i < n; i++) { var a = r() * TAU, d = Math.sqrt(r()) * rad; var rr = 2.4 + Math.pow(r(), 2.6) * 12, bb = mkBody(c, sys, list, { type: 'asteroid', seed: Math.floor(r() * 1e9), r: rr, cx: x + Math.cos(a) * d, cy: y + Math.sin(a) * d * .7, orbit: null, elong: 1 + r() * .5, rot: r() * TAU, tilt: r() * .5, spin: r() * TAU, landable: true, palKey: V.pick(r, ['moonG', 'rockyB', 'rockyG']), dot: '#8a8590', rogue: true }); bb.surf = 'asteroid'; } }
    else if (roll < .47) genWrecks(c, sys, list, r, null, 1, x, y);
    else if (roll < .58) { b = mkBody(c, sys, list, { type: 'station', seed: Math.floor(r() * 1e9), r: 15 + r() * 10, cx: x, cy: y, orbit: null, landable: true, derelict: r() < .6, rogue: true, dot: '#9aa0b8', surf: 'station' }); }
    else if (roll < .72) genRuin(c, sys, list, r, 0, null, x, y);
    else if (roll < .82) { var et = V.pick(r, ['donut', 'cube', 'donut', 'cube', 'ringworld']); b = mkBody(c, sys, list, { type: et, seed: Math.floor(r() * 1e9), r: et === 'ringworld' ? 80 + r() * 30 : 38 + r() * 24, cx: x, cy: y, orbit: null, landable: true, rogue: true, dot: '#7aa0c0', surf: et, palKey: et === 'cube' ? 'jungle' : 'ocean' }); }
    else if (roll < .92) { b = mkBody(c, sys, list, { type: 'crystal', seed: Math.floor(r() * 1e9), r: 20 + r() * 28, cx: x, cy: y, orbit: null, tilt: .3, spin: r() * TAU, landable: true, rogue: true, palKey: V.pick(r, PALKEYS.crystal), surf: 'crystal' }); b.dot = dotOf(b); }
    else { b = mkBody(c, sys, list, { type: 'comet', seed: Math.floor(r() * 1e9), r: 5 + r() * 5, cx: x, cy: y, orbit: null, rogue: true, elong: 1.2, rot: r() * TAU, landable: true, palKey: 'iceA', dot: '#cfe6ff', surf: 'comet', drift: [(r() - .5) * 30, (r() - .5) * 30] }); }
  }
  function genWrecks(c, sys, list, r, star, n, x, y) {
    for (var i = 0; i < n; i++) { var a = r() * TAU, d = star ? 500 + r() * 2200 : i * 60 + r() * 50, b = mkBody(c, sys, list, { type: 'wreck', seed: Math.floor(r() * 1e9), r: 14 + r() * 16, cx: x, cy: y, orbit: star ? orbitOf(null, d, 1500 + d * 2, a, 0, 0, sys.x, sys.y) : null, rot: r() * TAU, landable: true, rogue: !star, dot: '#6a7090', surf: 'wreck', star: star }); if (!star) { b.cx = x + Math.cos(a) * i * 90; b.cy = y + Math.sin(a) * i * 90; } }
  }
  function genRuin(c, sys, list, r, a, star, x, y) {
    var b = mkBody(c, sys, list, { type: 'ruins', seed: Math.floor(r() * 1e9), r: 10 + r() * 16, cx: x, cy: y, orbit: star ? orbitOf(null, a, 1800 + a * 2, r() * TAU, 0, 0, sys.x, sys.y) : null, elong: 1.35 + r() * .4, rot: r() * TAU, landable: true, rogue: !star, palKey: V.pick(r, ['rockyU', 'rockyB', 'moonG', 'desertC']), dot: '#8a8aa0', surf: 'ruins', star: star, tilt: .3, spin: r() * TAU });
  }
  function genStation(c, sys, list, r, star) {
    var host = null; for (var i = list.length - 1; i >= 0; i--) if (list[i].type !== 'star' && list[i].type !== 'asteroid' && list[i].type !== 'comet' && !list[i].moonOf && list[i].r > 20) { host = list[i]; break; }
    if (host) mkBody(c, sys, list, { type: 'station', seed: Math.floor(r() * 1e9), r: 12 + r() * 6, orbit: orbitOf(host, host.r * 2.0 + 24, 70 + r() * 30, r() * TAU), landable: true, derelict: r() < .35, dot: '#aab0c8', surf: 'station', star: star });
  }

  function genHome(c, sys, list, r) {
    sys.hz = 1100; sys.tint = STARK.yellow.tint; sys.home = true;
    var star = mkBody(c, sys, list, { type: 'star', isStar: true, skind: 'yellow', seed: 1001, r: 66, orbit: null, landable: false, dot: '#ffe27a', tint: STARK.yellow.tint, L: 1, x: 0, y: 0, surf: 'star' }); sys.stars.push(star);
    function pl(type, rad, a, T, ph, opts) { var b = mkBody(c, sys, list, Object.assign({ type: type, seed: 5000 + list.length * 31, r: rad, orbit: orbitOf(null, a, T, ph, 0, 0, 0, 0), tilt: .3, spin: 1 + list.length, landable: true, star: star }, opts || {})); b.dot = dotOf(b); b.surf = type; return b; }
    var mer = pl('rocky', 14, 430, 520, 1.2, { palKey: 'rockyG' });
    var ven = pl('venus', 27, 700, 900, 4.1, { atm: '#ffd890', cloudAmt: 1 });
    var earth = pl('earth', 46, 1100, 1500, 5.2, { atm: '#8fc4ff', cloudAmt: .45, tilt: .41, home: true, seed: 20241, spin: 2.2 });
    mkBody(c, sys, list, { type: 'moon', seed: 777, r: 12, moonOf: earth, orbit: orbitOf(earth, 112, 150, .4), tilt: .1, spin: 0, landable: true, palKey: 'moonG', dot: '#b0afb8', surf: 'moon', star: star });
    mkBody(c, sys, list, { type: 'station', seed: 4242, r: 13, orbit: orbitOf(earth, 70, 75, 2.0), landable: true, derelict: false, dot: '#aab0c8', surf: 'station', star: star });
    var mars = pl('desert', 24, 1560, 2300, 2.6, { palKey: 'desertB', atm: '#e0a080', cloudAmt: .1 });
    mkBody(c, sys, list, { type: 'moon', seed: 31, r: 5, moonOf: mars, orbit: orbitOf(mars, 52, 40, 1), landable: true, palKey: 'moonG', dot: '#8a8590', surf: 'moon', star: star });
    mkBody(c, sys, list, { type: 'moon', seed: 32, r: 4, moonOf: mars, orbit: orbitOf(mars, 80, 66, 3.8), landable: true, palKey: 'rockyB', dot: '#8a7060', surf: 'moon', star: star });
    /* belt */
    var rb = V.rng(88); for (var i = 0; i < 34; i++) { var rr = 2.4 + Math.pow(rb(), 2.2) * 7; var bb = mkBody(c, sys, list, { type: 'asteroid', seed: Math.floor(rb() * 1e9), r: rr, orbit: orbitOf(null, 2060 + (rb() - .5) * 280, 3200 + rb() * 300, rb() * TAU, 0, 0, 0, 0), elong: 1 + rb() * .5, rot: rb() * TAU, spin: rb() * TAU, tilt: .3, landable: true, star: star, palKey: V.pick(rb, ['moonG', 'rockyB', 'rockyG']), dot: '#8a8590', surf: 'asteroid' }); }
    var jup = pl('gas', 98, 2800, 4200, .3, { palKey: 'gasJ', atm: '#e8c89a', tilt: .1 });
    [[11, 210, 90, 0], [9, 270, 140, 2], [13, 340, 210, 4.2]].forEach(function (m, i) { var mb = mkBody(c, sys, list, { type: i === 1 ? 'ice' : 'moon', seed: 9000 + i, r: m[0], moonOf: jup, orbit: orbitOf(jup, m[1] + 60, m[2], m[3]), landable: true, palKey: i === 1 ? 'iceA' : (i === 0 ? 'rockyB' : 'moonG'), star: star }); mb.dot = dotOf(mb); mb.surf = mb.type === 'ice' ? 'ice' : 'moon'; });
    var sat = pl('gas', 78, 3550, 5800, 3.4, { palKey: 'gasS', atm: '#e8dca0', tilt: .45 }); sat.ring = { in: 1.4, out: 2.5, sq: .3, ang: -.35, cols: RINGCOLS[0] };
    [[8, 260, 120, 1], [10, 330, 190, 3.3]].forEach(function (m, i) { var mb = mkBody(c, sys, list, { type: i ? 'ice' : 'moon', seed: 9100 + i, r: m[0], moonOf: sat, orbit: orbitOf(sat, m[1], m[2], m[3]), landable: true, palKey: i ? 'iceB' : 'moonG', star: star }); mb.dot = dotOf(mb); mb.surf = mb.type; });
    mkBody(c, sys, list, { type: 'comet', seed: 4040, r: 6, orbit: orbitOf(null, 3000, 1500, 2.2, .84, 1.1, 0, 0), elong: 1.2, rot: 1, tilt: .3, landable: true, star: star, palKey: 'iceA', dot: '#cfe6ff', surf: 'comet' });
  }

  /* ---------- positions ---------- */
  G.pos = function (b, t) {
    var o = b.orbit; if (!o) { if (b.drift) { b.x = b.cx + b.drift[0] * t; b.y = b.cy + b.drift[1] * t; } else { b.x = b.cx != null ? b.cx : b.x; b.y = b.cy != null ? b.cy : b.y; } return; }
    var bx, by; if (o.parent) { bx = o.parent.x; by = o.parent.y; } else { bx = o.ox; by = o.oy; }
    var M = o.ph + TAU * t / o.T, x, y;
    if (o.e > 0) { var E = M; for (var i = 0; i < 5; i++) E = M + o.e * Math.sin(E); var px = o.a * (Math.cos(E) - o.e), py = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E), cw = Math.cos(o.w), sw = Math.sin(o.w); x = px * cw - py * sw; y = px * sw + py * cw; }
    else { x = Math.cos(M) * o.a; y = Math.sin(M) * o.a; }
    b.x = bx + x; b.y = by + y;
  };
  G.updateCell = function (c, t) { if (c.frame === V.frame && c.tt === t) return; c.frame = V.frame; c.tt = t; for (var i = 0; i < c.bodies.length; i++) G.pos(c.bodies[i], t); };
  /* cells around (x,y) within `range` world units; positions refreshed */
  G.near = function (x, y, range, out) {
    out = out || []; out.length = 0; var C = G.CELL, i0 = G.cellIndex(x - range), i1 = G.cellIndex(x + range), j0 = G.cellIndex(y - range), j1 = G.cellIndex(y + range);
    for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) { var c = G.genCell(i, j); G.updateCell(c, G.t); for (var k = 0; k < c.bodies.length; k++) out.push(c.bodies[k]); }
    return out;
  };
  G.cellsNear = function (x, y, range) { var out = [], i0 = G.cellIndex(x - range), i1 = G.cellIndex(x + range), j0 = G.cellIndex(y - range), j1 = G.cellIndex(y + range); for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) out.push(G.genCell(i, j)); return out; };
  G.getBody = function (id) { if (G.byId[id]) return G.byId[id]; var m = /^(-?\d+),(-?\d+):/.exec(id); if (m) { G.genCell(+m[1], +m[2]); return G.byId[id] || null; } return null; };
  /* light for a body: direction toward its star, colour, intensity */
  G.light = function (b) {
    var st = b.star; if (!st) { var h = V.hash(G.seed, b.seed | 0, 3) / 4294967296 * TAU; return { ang: h, col: [190, 200, 255], k: .34 }; }
    var dx = st.x - b.x, dy = st.y - b.y, d = Math.hypot(dx, dy), k = clamp(1.1 - .22 * d / Math.max(600, b.sys.hz), .5, 1);
    return { ang: Math.atan2(dy, dx), col: b.sys.tint, k: k, d: d };
  };
  /* find the nearest body/feature of a named kind (for ?planet=) */
  G.find = function (kind, fx, fy) {
    var best = null, bd = 1e18;
    for (var ring = 0; ring <= 14; ring++) {
      for (var j = -ring; j <= ring; j++) for (var i = -ring; i <= ring; i++) { if (Math.max(Math.abs(i), Math.abs(j)) !== ring) continue; var c = G.genCell(i, j); G.updateCell(c, G.t);
        for (var k = 0; k < c.bodies.length; k++) { var b = c.bodies[k]; if (matchKind(b, kind)) { var d = Math.hypot(b.x - fx, b.y - fy); if (d < bd) { bd = d; best = { x: b.x, y: b.y, body: b }; } } }
        if (kind === 'nebula' && c.nebulae.length) { var n = c.nebulae[0], dn = Math.hypot(n.x - fx, n.y - fy); if (dn < bd) { bd = dn; best = { x: n.x, y: n.y, nebula: n }; } } }
      if (best && ring >= 2) break;
    }
    return best;
  };
  function matchKind(b, k) {
    switch (k) { case 'ringed': return !!b.ring; case 'gasgiant': case 'gas': return b.type === 'gas' || b.type === 'icegas'; case 'binary': return b.isStar && b.sys.kind === 'binary'; case 'ternary': return b.isStar && b.sys.kind === 'ternary';
      case 'pulsar': case 'neutron': return b.skind === 'neutron'; case 'blackhole': case 'bh': return b.type === 'bh'; case 'redgiant': case 'giant': return b.skind === 'giant'; case 'star': return b.isStar; case 'moons': return !!b.moonOf; case 'moon': return b.type === 'moon'; default: return b.type === k; }
  }
  var SYL = ['ka', 'zo', 'ri', 'mu', 'xe', 'lan', 'dor', 'vi', 'sa', 'tho', 'ne', 'pyr', 'al', 'ix', 'or', 'en', 'ul', 'ta', 'mi', 'qua', 'bel', 'cy', 'dra', 'fe', 'gor', 'hu', 'jo', 'ky'];
  var HOMEN = ['SOL', 'MERCURY', 'VENUS', 'EARTH', 'LUNA', 'ORBITAL', 'MARS', 'PHOBOS', 'DEIMOS'];
  G.nameOf = function (b) {
    if (b.sys && b.sys.home) { if (b.isStar) return 'SOL'; var hn = { 1: 'MERCURY', 2: 'VENUS', 3: 'EARTH', 4: 'LUNA', 5: 'ORBITAL', 6: 'MARS', 7: 'PHOBOS', 8: 'DEIMOS' }[b.idx]; if (hn) return hn; if (b.type === 'gas') return b.ring ? 'SATURN' : 'JUPITER'; if (b.type === 'comet') return 'HALLEY'; if (b.type === 'asteroid') return 'CERES BELT'; if (b.moonOf) return b.moonOf.ring ? 'TITAN' : 'EUROPA'; }
    var r = V.rng(V.hash(b.seed | 0, 55, 1)), n = 2 + (r() < .5 ? 1 : 0), s = ''; for (var i = 0; i < n; i++) s += V.pick(r, SYL);
    var suffix = b.moonOf ? ' ' + 'I'.repeat(1 + (b.idx % 3)) : (b.sys && b.sys.kind !== 'lone' && !b.isStar ? ' ' + (1 + (b.idx % 9)) : '');
    if (b.type === 'asteroid') suffix = '-' + (100 + Math.floor(r() * 899)); if (b.type === 'bh') s = 'SINGULARITY'; if (b.type === 'wreck') s = 'WRECK ' + s; if (b.type === 'station') s = (b.derelict ? 'DERELICT ' : 'STATION ') + s; if (b.type === 'ruins') s = 'RUINS OF ' + s;
    return s.toUpperCase() + suffix;
  };
  /* deterministic signature of generation, for tests */
  G.signature = function (seed, n) { var old = G.seed; G.init(seed); var s = 0; n = n || 2; for (var j = -n; j <= n; j++) for (var i = -n; i <= n; i++) { var c = G.genCell(i, j); s = V.hash(s, c.bodies.length, c.nebulae.length, c.systems.length); for (var k = 0; k < c.bodies.length; k++) { var b = c.bodies[k]; s = V.hash(s, b.seed | 0, Math.round(b.r * 100), b.type.length); } } return s; };
})();
