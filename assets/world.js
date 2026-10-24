/* The Void — surface gameplay layer: pickups, deposits, inhabitants with pictogram speech, hazards, scanner pulse, compass. */
(function () {
  'use strict';
  var V = window.VOID, Su = V.surface, S = V.spr, G = V.Gen, Pg = V.prog, TAU = V.TAU, clamp = V.clamp, wdx = Su.wdx, gAt = Su.gAt;
  var Wd = V.world = { bubble: null, pulse: null, haz: { k: null, v: 1 }, mine: null, forceWx: null };
  var RCOL = Pg.RCOL;

  /* ---------- deterministic pickups per world ---------- */
  function hazardOf(b) { if (b.type === 'lava' || b.type === 'venus' || b.io || b.name === 'MERCURY' || b.name === 'VENUS') return 'heat'; if (b.type === 'ice' || b.type === 'icegas' || b.type === 'comet' || b.palKey === 'pluto' || b.name === 'TRITON') return 'cold'; return null; }
  Wd.hazardOf = function (w) { var h = hazardOf(w.body); if (h) return h; return w.airless ? 'o2' : null; };
  function okX(w, x) { return !(w.wl > -999 && gAt(w, x) < w.wl - 1); }
  Wd.pickups = function (w) {
    if (w._pk) return w._pk; var b = w.body, r = V.rng(V.hash(w.seed | 0, 991)), L = [], WW = w.WW, sx = w.spawnX, i;
    function add(k, x, dep) { x = ((Math.round(x) % WW) + WW) % WW; for (var t = 0; t < 8 && !okX(w, x); t++) x = (x + 37) % WW; L.push({ id: w.id + '#' + L.length, k: k, x: x, dep: !!dep, ph: r() * TAU }); }
    if (b.home && b.type === 'earth') { for (i = 0; i < 14; i++) add('scrap', sx + (i % 2 ? 1 : -1) * (60 + i * 34 + r() * 20)); add('ore', sx + 520, true); add('crystal', sx - 610, true); }
    else {
      var t = b.type, table = t === 'crystal' ? ['crystal', 'crystal', 'essence', 'ore'] : t === 'wreck' || t === 'station' || t === 'dyson' ? ['scrap', 'scrap', 'tech', 'tech'] : t === 'ruins' ? ['tech', 'essence', 'scrap'] : t === 'lava' ? ['ore', 'ore', 'crystal', 'scrap'] : t === 'ice' || t === 'icegas' ? ['crystal', 'ore', 'scrap'] : t === 'gas' ? ['essence', 'crystal', 'scrap'] : ['scrap', 'ore', 'ore', 'crystal', 'scrap', 'tech'];
      var n = 7 + Math.floor(r() * 6) + (b.huge ? 8 : 0);
      for (i = 0; i < n; i++) { var k = table[Math.floor(r() * table.length)], x = i < n / 2 ? sx + (r() - .5) * 1400 : r() * WW; add(k, x, k === 'ore' || k === 'crystal'); }
      if (r() < .3 || b.home) add('essence', sx + (r() < .5 ? -1 : 1) * (300 + r() * 600));
      if (b.name === 'GANYMEDE') add('part', sx + 180); if (b.name === 'TITAN') add('part', sx - 220);
    }
    return (w._pk = L);
  };
  /* ---------- inhabitants ---------- */
  var KINDS = ['villager', 'nomad', 'robot', 'glow', 'merchant', 'sage', 'mechanic'];
  Wd.KINDS = KINDS;
  Wd.npcs = function (w) {
    if (w._npc) return w._npc; var b = w.body, r = V.rng(V.hash(w.seed | 0, 4417)), L = [], huts = [], sx = w.spawnX, WW = w.WW;
    function add(kind, x, home) { x = ((Math.round(x) % WW) + WW) % WW; for (var t = 0; t < 8 && !okX(w, x); t++) x = (x + 41) % WW; L.push({ id: w.id + '@' + L.length, kind: kind, x: x, hx: x, dir: r() < .5 ? -1 : 1, t: r() * 5, hue: Math.floor(r() * 6), ph: r() * TAU, home: home }); }
    var fixed = { ORBITAL: ['merchant'], MARS: ['mechanic'], TITAN: ['sage'], EUROPA: ['glow', 'glow', 'glow'] }[b.name];
    if (fixed) fixed.forEach(function (k, i) { add(k, sx + 90 + i * 26); });
    else if (!b.home && !b.isStar && b.landable !== false && r() < .45) {
      var roll = r(), base = sx + (r() < .5 ? -1 : 1) * (240 + r() * 500);
      if (roll < .4 && !w.airless) { var nh = 2 + Math.floor(r() * 3); for (var i = 0; i < nh; i++) { var hx = base + i * 46; huts.push({ x: ((Math.round(hx) % WW) + WW) % WW, v: Math.floor(r() * 3) }); add('villager', hx + 20, hx); } if (r() < .5) add('merchant', base - 40); }
      else if (roll < .55) { add('nomad', base); add('nomad', base + 18); }
      else if (roll < .72) { add('robot', base); add('robot', base + 30); if (r() < .4) add('mechanic', base + 60); }
      else if (roll < .86) { for (var j = 0; j < 4; j++) add('glow', base + j * 22); }
      else add('sage', base);
    }
    w._huts = huts; return (w._npc = L);
  };
  Wd.adminSpawn = function () {
    var w = Su.cur; if (!w) { V.game.toast('LAND FIRST'); return false; } Wd.npcs(w); Wd.spawnI = ((Wd.spawnI || 0) + 1) % KINDS.length;
    var k = KINDS[Wd.spawnI], x = Su.pl.x + 30 * Su.pl.face; w._npc.push({ id: w.id + '@a' + w._npc.length, kind: k, x: x, hx: x, dir: 1, t: 0, hue: Wd.spawnI % 6, ph: 0 }); return k;
  };
  Wd.setWeather = function (k) { Wd.forceWx = k; };

  /* ---------- sprites ---------- */
  var SKIN = ['#e8b898', '#c8906a', '#8a5a3a', '#a8d8a8', '#b8a8e8', '#e8d878'], ROBE = ['#c04df0', '#3a8ad8', '#d8603a', '#4ab888', '#e8b440', '#8a6ad8'], spc = {};
  function npcSprite(kind, hue, f) {
    var key = kind + hue + f; if (spc[key]) return spc[key]; var p = new S.Paint(13, 16), sk = SKIN[hue], rb = ROBE[hue], dk = '#1a0a3a', leg = f ? 1 : 0;
    function legs(c) { p.rect(4 + leg, 13, 1, 3, c); p.rect(7 - leg, 13, 1, 3, c); }
    if (kind === 'robot' || kind === 'mechanic') {
      var bc = kind === 'mechanic' ? ['#8a4a1a', '#e07a2a', '#ffc070'] : ['#4a4f70', '#8a92b8', '#d0d8f0'];
      p.rect(6, 0, 1, 2, bc[2]); p.set(6, 0, kind === 'mechanic' ? '#ffd040' : '#ff4a6a'); p.rect(3, 2, 7, 5, bc[1]); p.rect(3, 2, 7, 1, bc[2]); p.rect(4, 4, 5, 1, dk); p.set(5 + (f ? 1 : 0), 4, '#7affe8'); p.set(7 + (f ? 1 : 0), 4, '#7affe8');
      p.rect(2, 7, 9, 6, bc[0]); p.rect(3, 8, 7, 4, bc[1]); p.set(6, 9, '#7affe8'); p.rect(1, 8, 1, 4, bc[1]); p.rect(11, 8, 1, 4, bc[1]); legs(bc[0]);
      if (kind === 'mechanic') { p.rect(12, 6, 1, 4, '#c8c8d8'); p.rect(11, 5, 2, 1, '#c8c8d8'); }
    } else if (kind === 'glow') {
      var gc = ['#7affe8', '#ff8ae8', '#ffe07a', '#8ab8ff', '#a8ff8a', '#ffffff'][hue];
      p.ell(6.5, 6 + (f ? 1 : 0), 4, 5, function (dx, dy, x, y) { var d = dx * dx + dy * dy; return d < .25 ? '#ffffff' : d < .6 ? gc : V.bayer(x, y) < .5 ? gc : null; });
      for (var i = 0; i < 4; i++) p.set(4 + i * 2, 12 + ((i + f) & 1) * 2, gc); p.set(5, 5 + f, dk); p.set(8, 5 + f, dk);
    } else {
      var hood = kind === 'nomad', sage = kind === 'sage', merch = kind === 'merchant';
      p.ell(6.5, 4, 3, 3, sk); p.set(5, 4, dk); p.set(8, 4, dk); p.set(6, 6, V.mixc ? '#8a4a3a' : dk);
      if (hood) { p.rect(3, 0, 7, 2, '#8a6a4a'); p.rect(3, 1, 1, 5, '#8a6a4a'); p.rect(9, 1, 1, 5, '#8a6a4a'); p.rect(0, 7, 3, 5, '#6a4a2a'); }
      if (merch) { p.rect(1, 1, 11, 1, '#e8b440'); p.rect(4, 0, 5, 1, '#e8b440'); p.rect(10, 9, 3, 3, '#a86a2a'); p.set(11, 10, '#ffe040'); }
      if (sage) { p.rect(3, 0, 7, 2, '#efe6ff'); p.rect(0, 0, 1, 14, '#a88a5a'); p.set(0, 0, '#ffe07a'); p.set(1, 0, '#ffe07a'); p.rect(5, 7, 3, 3, '#efe6ff'); }
      var top = 7; p.rect(3, top, 7, 6, sage ? '#6a3ab8' : rb); p.rect(3, top, 7, 1, '#ffffff22' === 0 ? rb : (sage ? '#8a5ad8' : rb)); p.rect(2, top + 1, 1, 4, sk); p.rect(10, top + 1, 1, 4, sk);
      if (sage) p.rect(3, 12, 7, 2, '#6a3ab8'); else legs(hood ? '#6a4a2a' : '#4a3d78');
    }
    return (spc[key] = p.done());
  }
  var hutC = {};
  function hutSprite(v, theme) { var key = v + theme; if (hutC[key]) return hutC[key]; var p = new S.Paint(26, 17), wall = [['#8a6a4a', '#b8946a', '#e0c08a'], ['#6a6a8a', '#9a9ab8', '#d0d0e8'], ['#7a4a6a', '#b07a9a', '#e8b8d0']][v];
    p.ell(13, 16, 12, 13, function (dx, dy, x, y) { return y > 16 ? null : S.tone(wall, .7 - dx * .4 - dy * .2, x, y); }); p.rect(10, 9, 6, 8, '#1a0a3a'); p.ell(13, 10, 3, 2, '#1a0a3a'); p.rect(4, 8, 3, 2, '#ffd070'); p.rect(19, 8, 3, 2, '#ffd070'); p.rect(12, 1, 2, 3, wall[0]); return (hutC[key] = p.done()); }
  var pkC = {};
  function pickSprite(k, dep, f) {
    var key = k + (dep ? 'd' : '') + f; if (pkC[key]) return pkC[key]; var col = RCOL[k] || '#ffffff', p;
    if (dep) { p = new S.Paint(13, 9); p.ell(6.5, 9, 6.5, 6, function (dx, dy, x, y) { return y > 8 ? null : S.tone(['#2a2440', '#4a4468', '#6a6490'], .6 - dx * .3 - dy * .3, x, y); }); var sp = [[3, 5], [6, 3], [9, 4], [5, 7], [8, 6]]; sp.forEach(function (q, i) { p.set(q[0], q[1], (i + f) % 3 ? col : '#ffffff'); if (k === 'crystal') p.set(q[0], q[1] - 1, col); }); }
    else { p = new S.Paint(7, 7); var mid = '#1a0a3a';
      if (k === 'scrap') { p.rect(1, 2, 5, 3, '#8a92b8'); p.rect(2, 1, 2, 1, '#c8d0f0'); p.set(5, 4, '#ff9030'); p.set(1, 5, '#4a4f70'); p.set(3, 3, mid); }
      else if (k === 'tech') { p.rect(1, 1, 5, 5, '#2a5a4a'); p.rect(2, 2, 3, 3, '#4ab888'); p.set(3, 3, f ? '#ffffff' : '#7affe8'); p.set(0, 2, '#c8c8d8'); p.set(6, 4, '#c8c8d8'); }
      else if (k === 'essence') { p.ell(3.5, 3.5, 3, 3, function (dx, dy) { var d = dx * dx + dy * dy; return d < .3 ? '#ffffff' : d < .7 ? col : null; }); }
      else if (k === 'part') { p.rect(1, 1, 5, 5, '#e8b440'); p.rect(2, 2, 3, 3, '#8a4a1a'); p.set(3, 3, '#ffe07a'); p.set(3, 0, '#e8b440'); p.set(3, 6, '#e8b440'); p.set(0, 3, '#e8b440'); p.set(6, 3, '#e8b440'); }
      else { p.ell(3.5, 3.5, 3, 3, col); }
    }
    return (pkC[key] = p.done());
  }

  /* ---------- dialogue: tokens are icons, words show with the translator ---------- */
  function T(g, n, c) { return { g: g, n: n, c: c }; }
  function npcState(n) { return Pg.npc[n.id] || (Pg.npc[n.id] = {}); }
  function nearestUngot(w, x) { var L = Wd.pickups(w), best = null, bd = 1e9; for (var i = 0; i < L.length; i++) { if (Pg.got[L[i].id]) continue; var d = Math.abs(wdx(L[i].x, x, w.WW)); if (d < bd) { bd = d; best = L[i]; } } return best; }
  var OFFERS = [[{ scrap: 5 }, 'crystal', 2], [{ crystal: 3 }, 'tech', 1], [{ ore: 4 }, 'scrap', 3], [{ tech: 2 }, 'essence', 1]];
  function costTok(c) { var o = []; for (var k in c) o.push(T(k, c[k], RCOL[k])); return o; }
  Wd.dialogue = function (w, n) {
    var s = npcState(n), d = { icons: [], words: '', act: null, done: false };
    switch (n.kind) {
      case 'villager':
        if (s.q === 2) { d.icons = [T('smile'), T('heart', 0, '#ff6a8a')]; d.words = 'FRIEND'; break; }
        d.icons = [T('quest', 0, '#ffe07a')].concat([T('crystal', 3, RCOL.crystal), T('arrow'), T('tech', 2, RCOL.tech)]); d.words = 'BRING CRYSTALS';
        d.cost = { crystal: 3 }; d.act = function () { Pg.spend({ crystal: 3 }); give(w, n, 'tech', 2); s.q = 2; }; break;
      case 'nomad':
        if (s.g) { var nu = nearestUngot(w, n.x); d.icons = [T('arrow', 0, '#7affe8'), nu ? T(nu.k, 0, RCOL[nu.k]) : T('smile')]; d.words = nu ? 'THAT WAY' : 'SAFE PATHS'; if (nu) { nu.reveal = 30; d.point = nu; } break; }
        d.icons = [T('smile'), T('gift', 0, '#ffe07a'), T('ore', 2, RCOL.ore)]; d.words = 'WE WANDER. TAKE'; d.act = function () { give(w, n, 'ore', 2); s.g = 1; }; break;
      case 'robot':
        d.icons = [T('scrap', 4, RCOL.scrap), T('trade', 0, '#ffe07a'), T('tech', 1, RCOL.tech)]; d.words = 'BEEP. TRADE'; d.cost = { scrap: 4 }; d.act = function () { Pg.spend({ scrap: 4 }); give(w, n, 'tech', 1); }; break;
      case 'glow':
        if (s.g) { d.icons = [T('heart', 0, '#ff8ae8'), T('star', 0, '#ffe07a')]; d.words = 'WE ARE LIGHT'; break; }
        d.icons = [T('essence', 1, RCOL.essence), T('heart', 0, '#ff8ae8')]; d.words = 'A GIFT OF LIGHT'; d.act = function () { give(w, n, 'essence', 1); s.g = 1; }; break;
      case 'merchant':
        var o = OFFERS[(s.k || 0) % OFFERS.length]; d.icons = costTok(o[0]).concat([T('trade', 0, '#ffe07a'), T(o[1], o[2], RCOL[o[1]])]); d.words = 'FAIR TRADE'; d.cost = o[0];
        d.act = function () { Pg.spend(o[0]); give(w, n, o[1], o[2]); s.k = (s.k || 0) + 1; }; break;
      case 'sage':
        if (s.g) { d.icons = [T('eye', 0, '#c8a8ff'), T('pin', 0, '#ffe07a')]; d.words = 'FOLLOW THE PIN'; break; }
        d.icons = [T('eye', 0, '#c8a8ff'), T('bh', 0, '#c04df0'), T('pin', 0, '#ffe07a')]; d.words = 'SEEK THE DARK STAR';
        d.act = function () { var bx = w.body.x, by = w.body.y, f = G.find('bh', bx + G.CELL * 2, by) || G.find('ringworld', bx + G.CELL * 2, by); if (f) { Pg.pin(f.body.x, f.body.y, 'bh', 'sage:' + f.body.id); V.game.toast('PINNED'); } s.g = 1; if (V.save) V.save.write(); }; break;
      case 'mechanic':
        if (s.g) { d.icons = [T('wrench', 0, '#ffc070'), T('smile')]; d.words = 'FLY SAFE'; break; }
        var hasPart = w.body.mars; d.icons = [T('wrench', 0, '#ffc070'), hasPart ? T('part', 0, RCOL.part) : T('up2', 0, '#7affe8')]; d.words = hasPart ? 'A DRIVE PART' : 'FREE TUNE UP';
        d.act = function () { if (hasPart) { Pg.parts['mars'] = 1; Su.floats.push({ x: n.x, y: gAt(w, n.x) + 22, t: 0, icon: 'part' }); } else { var free = Pg.UP.filter(function (u) { return u[1] !== 'adv' && !Pg.has(u[0]); }); if (free.length) { Pg.unlock(free[0][0]); Su.floats.push({ x: n.x, y: gAt(w, n.x) + 22, t: 0, icon: free[0][2] }); } } s.g = 1; if (V.save) V.save.write(); }; break;
    }
    return d;
  };
  function give(w, n, k, c) { Pg.gain(k, c); for (var i = 0; i < Math.min(c, 4); i++) Su.floats.push({ x: n.x + i * 6 - 6, y: gAt(w, n.x) + 20 + i * 4, t: -i * .12, icon: k }); if (V.save) V.save.write(); }
  Wd.talk = function (w, n) {
    var b = Wd.bubble;
    if (b && b.npc === n && b.d.act) { if (!b.d.cost || Pg.affordCost(b.d.cost)) { b.d.act(); b.d = Wd.dialogue(w, n); b.t = 0; b.ok = .5; if (V.sfx) V.sfx('scan'); } else { b.deny = .4; } return; }
    Wd.bubble = { npc: n, d: Wd.dialogue(w, n), t: 0 }; n.talkT = 4;
  };

  /* ---------- per-frame update (runs before the player step) ---------- */
  var REACH = 12;
  Su.preUpdate = function (w, dt) {
    var pl = Su.pl, play = Su.mode === 'play';
    if (V.story && V.story.surfUpdate) V.story.surfUpdate(w, dt);
    Su.mods = { run: Pg.has('run') ? 1.5 : 1, jump: 1, dbl: Pg.has('dbljump'), jet: Pg.has('jetpack'), board: Pg.has('rover') && Wd.boardOn };
    if (Wd.forceWx) { w.wx.type = Wd.forceWx === 'clear' ? null : Wd.forceWx; w.wx.on = Wd.forceWx === 'clear' ? 0 : 1; w.wx.amt = Wd.forceWx === 'clear' ? Math.max(0, w.wx.amt - dt) : Math.min(1, w.wx.amt + dt * .5); w.weatherT = 999; }
    var L = Wd.pickups(w), N = Wd.npcs(w), mag = (Pg.has('magnet') ? 46 : 0);
    /* pickups */
    for (var i = 0; i < L.length; i++) {
      var it = L[i]; if (Pg.got[it.id]) continue; if (it.reveal > 0) it.reveal -= dt;
      if (it.dep || !play) continue; var dx = wdx(it.x, pl.x, w.WW), gy = gAt(w, it.x), dy = pl.y - gy;
      if (mag && Math.abs(dx) < mag && Math.abs(dy) < 30) { it.x = ((it.x - Math.sign(dx) * Math.min(Math.abs(dx), 90 * dt)) % w.WW + w.WW) % w.WW; dx = wdx(it.x, pl.x, w.WW); }
      if (Math.abs(dx) < 7 && dy > -6 && dy < 14) collect(w, it);
    }
    /* mining: hold E on a deposit */
    var h = Su.hint; if (Wd.mine && (!h || h.ref !== Wd.mine.ref || !V.input.act)) Wd.mine = null;
    if (play && h && h.ext && h.kind === 'dep' && V.input.act) { if (!Wd.mine) Wd.mine = { ref: h.ref, p: 0 }; var need = Pg.has('multitool') ? .3 : 1; Wd.mine.p += dt / need; if (Math.random() < dt * 30) Su.puff(h.ref.x + (Math.random() - .5) * 8, gAt(w, h.ref.x) + 4, 1, RCOL[h.ref.k], 6, 26); if (Wd.mine.p >= 1) { var it2 = h.ref, nmul = Pg.has('multitool') ? 2 : 1; Pg.got[it2.id] = 1; give(w, it2, it2.k, (it2.k === 'ore' ? 3 : 2) * nmul); Su.puff(it2.x, gAt(w, it2.x) + 3, 14, RCOL[it2.k], 10, 30); Wd.mine = null; } }
    /* inhabitants wander, then turn to face you */
    for (i = 0; i < N.length; i++) {
      var n = N[i], d2 = wdx(pl.x, n.x, w.WW); n.t += dt; if (n.talkT > 0) n.talkT -= dt;
      if (Math.abs(d2) < 34 && play) { n.face = d2 > 0 ? 1 : -1; n.walk = 0; }
      else { var span = n.kind === 'nomad' ? 260 : n.kind === 'glow' ? 50 : 70, sp = n.kind === 'robot' ? 10 : n.kind === 'glow' ? 7 : 12; if (Math.sin(n.t * .4 + n.ph) > -.2) { var nx = n.x + n.dir * sp * dt, off = wdx(nx, n.hx, w.WW); if (Math.abs(off) > span || !okX(w, nx)) n.dir = -n.dir; else n.x = ((nx % w.WW) + w.WW) % w.WW; n.walk = 1; n.face = n.dir; } else n.walk = 0; }
    }
    var bb = Wd.bubble; if (bb) { bb.t += dt; if (bb.ok > 0) bb.ok -= dt; if (bb.deny > 0) bb.deny -= dt; if (Math.abs(wdx(pl.x, bb.npc.x, w.WW)) > 46 || bb.t > 12 || !play) Wd.bubble = null; }
    /* hazards: heat, cold, or air run down away from the ship */
    var hk = Wd.hazardOf(w), hz = Wd.haz; if (hz.w !== w.id) { hz.w = w.id; hz.v = 1; } hz.k = hk;
    var immune = !hk || Pg.cheat.god || (hk === 'heat' && Pg.has('heat')) || (hk === 'cold' && Pg.has('cold')) || (hk === 'o2' && Pg.has('oxygen'));
    if (play && !immune) { var away = Math.abs(wdx(pl.x, Su.ship.x, w.WW)) > 60; hz.v = clamp(hz.v + (away ? -dt / 75 : dt / 3), 0, 1); if (hz.v <= 0 && !Su.burning) { hz.v = 1; Su.burn(); } } else hz.v = Math.min(1, hz.v + dt / 2);
    /* scanner pulse */
    if (play && (V.keyPressed('q') || Wd.pulseReq)) { Wd.pulseReq = false; Wd.pulse = { t: 0, x: pl.x, y: pl.y }; if (V.sfx) V.sfx('scan'); var rng = Pg.has('scanner') ? 2400 : 900; L.forEach(function (q) { if (!Pg.got[q.id] && Math.abs(wdx(q.x, pl.x, w.WW)) < rng) q.reveal = 20; }); N.forEach(function (q) { if (Math.abs(wdx(q.x, pl.x, w.WW)) < rng) q.reveal = 20; }); }
    if (Wd.pulse) { Wd.pulse.t += dt; if (Wd.pulse.t > 1.6) Wd.pulse = null; }
    N.forEach(function (q) { if (q.reveal > 0) q.reveal -= dt; });
    if (V.keyPressed('r') && Pg.has('rover') && play) Wd.boardOn = !Wd.boardOn;
    /* grapple: G pulls you to the next ledge ahead */
    if (V.keyPressed('g') && Pg.has('grapple') && play) { var best = null; for (var s = 10; s < 90; s += 3) { var gx = pl.x + pl.face * s, gh = gAt(w, gx); if (gh - pl.y > 8) { best = { x: gx, y: gh }; break; } } if (best) { Wd.grap = { x: best.x, y: best.y, t: 0 }; pl.vy = Math.min(230, (best.y - pl.y) * 4 + 120); pl.vx = pl.face * 70; pl.ground = false; } }
    if (Wd.grap) { Wd.grap.t += dt; if (Wd.grap.t > .4) Wd.grap = null; }
  };
  function collect(w, it) {
    Pg.got[it.id] = 1; if (it.k === 'part') { Pg.parts[it.id] = 1; V.game.toast('DRIVE PART'); } else Pg.gain(it.k, it.k === 'scrap' ? 1 : 1);
    Su.floats.push({ x: it.x, y: gAt(w, it.x) + 14, t: 0, icon: it.k }); Su.puff(it.x, gAt(w, it.x) + 3, 8, RCOL[it.k] || '#ffffff', 6, 26); if (V.save) V.save.write();
  }
  /* hints: deposits, inhabitants, the wreck */
  Su.extHint = function (w, fh) {
    var pl = Su.pl, best = null, bd = 1e9, L = Wd.pickups(w), N = Wd.npcs(w), i, d;
    if (V.story && V.story.wreckHint) { var wh = V.story.wreckHint(w, fh); if (wh !== undefined) fh = wh; }
    for (i = 0; i < N.length; i++) { d = Math.abs(wdx(N[i].x, pl.x, w.WW)); if (d < 20 && d < bd) { bd = d; best = { ext: true, kind: 'npc', ref: N[i], x: N[i].x, y: gAt(w, N[i].x) + 16 }; } }
    for (i = 0; i < L.length; i++) { if (!L[i].dep || Pg.got[L[i].id]) continue; d = Math.abs(wdx(L[i].x, pl.x, w.WW)); if (d < REACH && d < bd) { bd = d; best = { ext: true, kind: 'dep', ref: L[i], x: L[i].x, y: gAt(w, L[i].x) + 6 }; } }
    if (best && (!fh || bd < Math.abs(wdx(fh.x != null ? fh.x : pl.x, pl.x, w.WW)))) return best; return fh || best;
  };
  Su.extAct = function (w, h) { if (h.kind === 'npc') Wd.talk(w, h.ref); else if (h.kind === 'wreck' && V.story) V.story.repairAct(w); };

  /* ---------- drawing ---------- */
  var oldCrit = Su.drawCritters;
  Su.drawCritters = function (sg, w, cam, GY0, t) {
    var W = V.W, i, L = Wd.pickups(w), N = Wd.npcs(w), huts = w._huts || [];
    for (i = 0; i < huts.length; i++) { var hu = huts[i], hs = Math.round(wdx(hu.x, cam.x, w.WW) + W / 2); if (hs < -30 || hs > W + 30) continue; sg.drawImage(hutSprite(hu.v, 0), hs - 13, Math.round(GY0 - (gAt(w, hu.x) - cam.y)) - 16); }
    oldCrit(sg, w, cam, GY0, t);
    for (i = 0; i < L.length; i++) { var it = L[i]; if (Pg.got[it.id]) continue; var sx = Math.round(wdx(it.x, cam.x, w.WW) + W / 2); if (sx < -10 || sx > W + 10) continue; var gy = Math.round(GY0 - (gAt(w, it.x) - cam.y)), f = Math.floor(t * 2 + it.ph) & 1;
      if (it.dep) { sg.drawImage(pickSprite(it.k, true, f), sx - 6, gy - 8); }
      else { var bob = Math.round(Math.sin(t * 2.4 + it.ph) * 1.5); sg.drawImage(pickSprite(it.k, false, f), sx - 3, gy - 10 + bob); if (f && it.k !== 'scrap') { sg.fillStyle = '#ffffff'; sg.fillRect(sx + 2, gy - 11 + bob, 1, 1); } } }
    for (i = 0; i < N.length; i++) { var n = N[i], nx = Math.round(wdx(n.x, cam.x, w.WW) + W / 2); if (nx < -14 || nx > W + 14) continue; var ny = Math.round(GY0 - (gAt(w, n.x) - cam.y)), fr = n.walk ? Math.floor(n.t * 6) & 1 : 0, spr = npcSprite(n.kind, n.hue, n.kind === 'glow' ? Math.floor(n.t * 2) & 1 : fr); if ((n.face || 1) < 0) spr = Su.flipped(spr);
      var lift = n.kind === 'glow' ? 4 + Math.round(Math.sin(n.t * 1.6 + n.ph) * 2) : 0; sg.drawImage(spr, nx - 6, ny - 16 - lift); }
  };
  var oldShip = Su.drawShip;
  Su.drawShip = function (sg, w, cam, GY0, t) { if (V.story && V.story.drawShipOverride && V.story.drawShipOverride(sg, w, cam, GY0, t)) return; oldShip(sg, w, cam, GY0, t); };
  var oldPl = Su.drawPlayer;
  Su.drawPlayer = function (sg, w, cam, GY0, t) {
    var pl = Su.pl; oldPl(sg, w, cam, GY0, t); if (pl.hidden) return; var W = V.W, sx = Math.round(wdx(pl.x, cam.x, w.WW) + W / 2), sy = Math.round(GY0 - (pl.y - cam.y));
    if (Su.mods.board) { sg.fillStyle = '#4a3d78'; sg.fillRect(sx - 6, sy, 13, 1); sg.fillStyle = '#c04df0'; sg.fillRect(sx - 5, sy + 1, 11, 1); sg.fillStyle = (Math.floor(t * 8) & 1) ? '#7affe8' : '#3ab0c8'; sg.fillRect(sx - 4, sy + 2, 2, 1); sg.fillRect(sx + 3, sy + 2, 2, 1); }
    if (pl.jetOn > 0) { pl.jetOn -= 1 / 60; var bx = sx - pl.face * 4; sg.fillStyle = '#ffd060'; sg.fillRect(bx, sy - 4, 1, 2); sg.fillStyle = '#ff7a30'; sg.fillRect(bx, sy - 2, 1, 1 + (Math.floor(t * 20) & 1)); }
    if (Wd.grap) { var gx = Math.round(wdx(Wd.grap.x, cam.x, w.WW) + W / 2), gy = Math.round(GY0 - (Wd.grap.y - cam.y)); sg.fillStyle = '#c8c8d8'; var n = 16; for (var i = 0; i <= n; i++) sg.fillRect(Math.round(sx + (gx - sx) * i / n), Math.round(sy - 8 + (gy - sy + 8) * i / n), 1, 1); }
  };
  function drawBubble(g, w, b, cam, GY0, t) {
    var W = V.W, n = b.npc, d = b.d, sx = Math.round(wdx(n.x, cam.x, w.WW) + W / 2), sy = Math.round(GY0 - (gAt(w, n.x) - cam.y)) - 26;
    var toks = d.icons, wid = 4, i; for (i = 0; i < toks.length; i++) wid += 6 + (toks[i].n ? V.textW(String(toks[i].n)) + 1 : 0);
    var tr = Pg.has('translator') && d.words, tw = tr ? V.textW(d.words) + 4 : 0, can = d.act && (!d.cost || Pg.affordCost(d.cost)), bw = Math.max(wid + (d.act ? 15 : 0), tw), bh = tr ? 17 : 10, shake = b.deny > 0 ? Math.round(Math.sin(b.deny * 60) * 2) : 0;
    var x0 = clamp(sx - (bw >> 1), 2, W - bw - 2) + shake, y0 = sy - bh, grow = Math.min(1, b.t * 6); if (grow < 1 && V.bayer(x0, y0) > grow) return;
    g.fillStyle = '#efe6ff'; g.fillRect(x0 - 1, y0 - 1, bw + 2, bh + 2); g.fillStyle = '#140a2e'; g.fillRect(x0, y0, bw, bh); g.fillStyle = '#efe6ff'; g.fillRect(sx - 1, y0 + bh + 1, 3, 1); g.fillRect(sx, y0 + bh + 2, 1, 1);
    var x = x0 + 3; for (i = 0; i < toks.length; i++) { var tk = toks[i], ci = tk.c || '#efe6ff'; V.glyph(g, tk.g, x, y0 + 3, ci); x += 6; if (tk.n) { V.text(g, String(tk.n), x - 1, y0 + 4, '#efe6ff'); x += V.textW(String(tk.n)) + 1; } }
    if (d.act) { var kx = x0 + bw - 12; V.glyph(g, can ? 'check' : 'cross', kx + 6, y0 + 3, can ? '#7aff8a' : '#ff6a6a'); if (can) V.text(g, 'E', kx, y0 + 3, '#ffffff'); }
    if (tr) V.text(g, d.words, x0 + 2, y0 + 11, '#a8f0d8');
    if (b.ok > 0) { g.fillStyle = '#7aff8a'; g.fillRect(x0, y0 + bh - 1, Math.round(bw * b.ok * 2), 1); }
  }
  var oldOv = Su.drawOverlay;
  Su.drawOverlay = function (g) {
    var w = Su.cur; if (!w) return; var W = V.W, H = V.H, GY0 = Math.round(H * .66), cam = Su.cam, t = V.time, pl = Su.pl, i;
    /* scanner pulse ring (pixel circle) */
    if (Wd.pulse) { var p = Wd.pulse, R = p.t * W * .8, px = Math.round(wdx(p.x, cam.x, w.WW) + W / 2), py = Math.round(GY0 - (p.y + 6 - cam.y)), nseg = Math.max(30, R * 1.2 | 0), fade = 1 - p.t / 1.6; g.fillStyle = '#7affe8'; for (i = 0; i < nseg; i++) { var a = i / nseg * TAU; if (V.bayer(i, 3) > fade) continue; g.fillRect(Math.round(px + Math.cos(a) * R), Math.round(py + Math.sin(a) * R * .5), 1, 1); } }
    if (V.story && V.story.drawSurfFx) V.story.drawSurfFx(g, w, cam, GY0, t);
    oldOv(g);
    if (Wd.mine) { var mh = Wd.mine.ref, mx = Math.round(wdx(mh.x, cam.x, w.WW) + W / 2), my = Math.round(GY0 - (gAt(w, mh.x) - cam.y)) - 30; g.fillStyle = '#140a2e'; g.fillRect(mx - 8, my, 17, 3); g.fillStyle = RCOL[mh.k]; g.fillRect(mx - 7, my + 1, Math.round(15 * Wd.mine.p), 1); }
    if (Wd.bubble && Su.mode === 'play') drawBubble(g, w, Wd.bubble, cam, GY0, t);
    /* edge markers for revealed pickups/inhabitants + the ship */
    var marks = [], L = Wd.pickups(w), N = Wd.npcs(w);
    for (i = 0; i < L.length; i++) if (L[i].reveal > 0 && !Pg.got[L[i].id]) marks.push([L[i].x, L[i].k, RCOL[L[i].k]]);
    for (i = 0; i < N.length; i++) if (N[i].reveal > 0) marks.push([N[i].x, 'person', '#ffe07a']);
    if (Su.mode === 'play') marks.push([Su.ship.x, 'ship', '#c04df0', 1]);
    var lcount = 0, rcount = 0;
    for (i = 0; i < marks.length; i++) { var m = marks[i], dx = wdx(m[0], cam.x, w.WW), sx2 = Math.round(dx + W / 2);
      if (sx2 > 4 && sx2 < W - 4) { if (!m[3] && L.length) { var my2 = Math.round(GY0 - (gAt(w, m[0]) - cam.y)) - 20 - (Math.floor(t * 3 + i) % 2); if (my2 > 4 && my2 < H) { V.glyph(g, 'down', sx2 - 2, my2, m[2], '#05020d'); } } continue; }
      var left = dx < 0, yy = 24 + (left ? lcount++ : rcount++) * 8; if (yy > H - 30) continue; var gx2 = left ? 3 : W - 14; V.glyph(g, left ? 'left' : 'right', left ? gx2 : gx2 + 6, yy, m[2], '#05020d'); V.glyph(g, m[1], left ? gx2 + 6 : gx2, yy, m[2], '#05020d'); }
    /* hazard meter */
    var hz = Wd.haz; if (hz.k && hz.v < .999) { var hx = 4, hy = H - 12, col = hz.k === 'heat' ? '#ff7a30' : hz.k === 'cold' ? '#7ac8ff' : '#7affe8', lw = 24; if (V.touch) hy = 30; V.glyph(g, hz.k, hx, hy, col, '#05020d'); g.fillStyle = '#140a2e'; g.fillRect(hx + 7, hy + 1, lw + 2, 3); g.fillStyle = hz.v < .25 && (Math.floor(t * 4) & 1) ? '#ff4a4a' : col; g.fillRect(hx + 8, hy + 2, Math.round(lw * hz.v), 1); }
  };
})();
