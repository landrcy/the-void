/* The Void — peaceful alien ships (mothership, drone swarm, crystalline vessel, derelict ark), space loot, laser, tractor, drone, autopilot. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, S = V.spr, Pg = V.prog, Sp = V.space, TAU = V.TAU, clamp = V.clamp;
  var A = V.aliens = { list: [], extra: [], hail: null, loot: {}, picked: 0 };
  var KINDS = ['mother', 'swarm', 'crystal', 'ark'];
  A.KINDS = KINDS;
  /* ---------- deterministic placement ---------- */
  var cellA = {};
  function cellAlien(ci, cj) {
    var key = ci + ',' + cj; if (key in cellA) return cellA[key]; cellA[key] = null; if (Math.max(Math.abs(ci), Math.abs(cj)) < 1) return null;
    var r = V.rng(V.hash(G.seed, ci * 7 + 3, cj * 13 + 5, 313)); if (r() > .12) return null; var c = G.genCell(ci, cj); G.updateCell(c, G.t); var s = c.systems[0]; var bx = s ? s.x : (ci + .5) * G.CELL, by = s ? s.y : (cj + .5) * G.CELL, a = r() * TAU, d = 1500 + r() * 1200;
    return (cellA[key] = mk(KINDS[Math.floor(r() * 4)], bx + Math.cos(a) * d, by + Math.sin(a) * d, 'c' + key, r));
  }
  function mk(kind, x, y, id, r) { r = r || Math.random; return { kind: kind, x: x, y: y, hx: x, hy: y, vx: 0, vy: 0, id: id, t: r() * 10, ang: r() * TAU, st: 0, cacheA: r() * TAU }; }
  A.adminSpawn = function () {
    var sh = Sp.ship; if (V.game.state !== 'space') { V.game.toast('IN SPACE'); return; } A.spawnI = ((A.spawnI == null ? -1 : A.spawnI) + 1) % 4;
    var a = sh.ang, e = mk(KINDS[A.spawnI], sh.x + Math.cos(a) * 240, sh.y + Math.sin(a) * 240, 'adm' + Date.now()); A.extra.push(e); if (A.extra.length > 4) A.extra.shift(); return e.kind;
  };
  function active() { var sh = Sp.ship, ci = G.cellIndex(sh.x), cj = G.cellIndex(sh.y), L = []; for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) { var e = cellAlien(ci + i, cj + j); if (e) L.push(e); } return L.concat(A.extra); }
  /* ---------- loot that floats in space ---------- */
  function cellLoot(ci, cj) {
    var key = ci + ',' + cj; if (A.loot[key]) return A.loot[key]; var r = V.rng(V.hash(G.seed, ci, cj, 7771)), L = [], i;
    function add(k, x, y) { L.push({ id: 'sl:' + key + ':' + L.length, k: k, x: x, y: y, ph: r() * TAU }); }
    if (ci === 0 && cj === 0) {
      var e = G.getBody('0,0:3'); var ea = e ? Math.hypot(e.x, e.y) : 1500; for (i = 0; i < 10; i++) { var a = r() * TAU; add(i % 3 ? 'scrap' : 'tech', Math.cos(a) * (ea + (r() - .5) * 260), Math.sin(a) * (ea + (r() - .5) * 260)); }
      for (i = 0; i < 14; i++) { var a2 = r() * TAU, d2 = 2050 + r() * 160; add(r() < .6 ? 'ore' : 'scrap', Math.cos(a2) * d2, Math.sin(a2) * d2); }
      for (i = 0; i < 10; i++) { var a3 = r() * TAU, d3 = 6150 + r() * 800; add(r() < .5 ? 'crystal' : 'ore', Math.cos(a3) * d3, Math.sin(a3) * d3); }
      for (i = 0; i < 6; i++) { var a4 = r() * TAU, d4 = 3000 + r() * 2800; add('scrap', Math.cos(a4) * d4, Math.sin(a4) * d4); }
    } else {
      var c = G.genCell(ci, cj), s = c.systems[0]; if (s) { var n = 4 + Math.floor(r() * 6); for (i = 0; i < n; i++) { var a5 = r() * TAU, d5 = 600 + r() * 2600; add(V.pick(r, ['scrap', 'scrap', 'ore', 'crystal', 'tech', 'essence']), s.x + Math.cos(a5) * d5, s.y + Math.sin(a5) * d5); } }
    }
    return (A.loot[key] = L);
  }
  function nearLoot() { var sh = Sp.ship, ci = G.cellIndex(sh.x), cj = G.cellIndex(sh.y), L = []; for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) { var l = cellLoot(ci + i, cj + j); for (var k = 0; k < l.length; k++) if (!Pg.got[l[k].id]) L.push(l[k]); } return L.concat(A.drops); }
  A.drops = [];
  A.nearLoot = nearLoot;

  /* ---------- update ---------- */
  A.update = function (dt, ctl) {
    var sh = Sp.ship, L = active(), i, inp = V.input; A.cur = L; A.hint = null;
    for (i = 0; i < L.length; i++) {
      var e = L[i], dx = sh.x - e.x, dy = sh.y - e.y, d = Math.hypot(dx, dy) || 1; e.t += dt; e.d = d;
      if (e.kind === 'mother') { e.x = e.hx + Math.cos(e.t * .03) * 200; e.y = e.hy + Math.sin(e.t * .03) * 120; }
      else if (e.kind === 'ark') { e.x = e.hx + e.t * 2; e.ang = .2 + Math.sin(e.t * .05) * .05; }
      else if (e.kind === 'swarm') { if (e.st === 1) { var tx = e.hx + Math.cos(e.cacheA) * 2600, ty = e.hy + Math.sin(e.cacheA) * 2600, ex = tx - e.x, ey = ty - e.y, ed = Math.hypot(ex, ey); var want = d > 420 ? 0 : 150; if (ed > 30) { e.x += ex / ed * want * dt; e.y += ey / ed * want * dt; } else { e.st = 2; dropCache(e); } } else if (e.st === 0) { e.x = e.hx + Math.cos(e.t * .2) * 60; e.y = e.hy + Math.sin(e.t * .2) * 60; } }
      else if (e.kind === 'crystal') {
        e.ang += dt * .4; var hd = Math.hypot(sh.x - e.hx, sh.y - e.hy), cloaked = Sp.cloak && Pg.has('cloak');
        if (hd < 700 && !cloaked) { /* escort: glide alongside and nudge you outward, never attack */ e.esc = Math.min(1, (e.esc || 0) + dt); var ux = (sh.x - e.hx) / (hd || 1), uy = (sh.y - e.hy) / (hd || 1), px = sh.x - uy * 60 - ux * 30, py = sh.y + ux * 60 - uy * 30; e.x += (px - e.x) * Math.min(1, dt * 1.5); e.y += (py - e.y) * Math.min(1, dt * 1.5); sh.vx += ux * 140 * dt; sh.vy += uy * 140 * dt; }
        else { e.esc = Math.max(0, (e.esc || 0) - dt * .5); e.x += (e.hx - e.x) * Math.min(1, dt * .4); e.y += (e.hy - e.y) * Math.min(1, dt * .4); }
      }
      if (!Pg.seenAliens[e.id] && d < 600) { Pg.seenAliens[e.id] = 1; V.game.toast('ALIEN SIGNAL'); }
      if (ctl && d < (e.kind === 'mother' || e.kind === 'ark' ? 150 : 110) && e.kind !== 'crystal' && (!A.hint || d < A.hint.d)) A.hint = { e: e, d: d };
    }
    if (A.hail && (A.hail.e.d > 260 || A.hail.t > 10)) A.hail = null; if (A.hail) { A.hail.t += dt; if (A.hail.deny > 0) A.hail.deny -= dt; }
    if (A.hint && ctl && inp.actPressed) { hail(A.hint.e); }
    /* loot: collect, magnet / tractor pull, drone fetch */
    var LL = nearLoot(), pull = Pg.has('tractor') ? 170 : Pg.has('magnet') ? 80 : 0;
    for (i = 0; i < LL.length; i++) { var it = LL[i], lx = sh.x - it.x, ly = sh.y - it.y, ld = Math.hypot(lx, ly); if (ld < 16) { take(it); continue; } if (pull && ld < pull) { var k = Math.min(1, dt * 3 * (1 - ld / pull) + dt); it.x += lx * k; it.y += ly * k; } }
    if (Pg.has('drone')) { var dr = A.drone || (A.drone = { x: sh.x, y: sh.y, tgt: null }); if (!dr.tgt || Pg.got[dr.tgt.id]) { dr.tgt = null; var bd = 300; for (i = 0; i < LL.length; i++) { var q = Math.hypot(LL[i].x - sh.x, LL[i].y - sh.y); if (q < bd && q > 16) { bd = q; dr.tgt = LL[i]; } } } var gx = dr.tgt ? dr.tgt.x : sh.x - Math.cos(sh.ang) * 16, gy = dr.tgt ? dr.tgt.y : sh.y - Math.sin(sh.ang) * 16, ddx = gx - dr.x, ddy = gy - dr.y, dd = Math.hypot(ddx, ddy) || 1, vv = Math.min(dd, 260 * dt); dr.x += ddx / dd * vv; dr.y += ddy / dd * vv; if (dr.tgt && dd < 5) { take(dr.tgt); dr.tgt = null; } }
    /* mining laser on asteroids */
    A.laser = ctl && Pg.has('laser') && (V.keyDown('f') || !!A.touchLaser);
    if (A.laser) { A.lasT = (A.lasT || 0) + dt; var hit = null, hd2 = 170; Sp.near.forEach(function (b) { if (b.type !== 'asteroid') return; var bx = b.x - sh.x, by = b.y - sh.y, along = bx * Math.cos(sh.ang) + by * Math.sin(sh.ang), perp = Math.abs(-bx * Math.sin(sh.ang) + by * Math.cos(sh.ang)); if (along > 0 && along < hd2 && perp < b.r + 2) { hd2 = along; hit = b; } }); A.lasLen = hit ? hd2 - hit.r * .6 : 170; A.lasHit = hit; if (hit) { hit._mine = (hit._mine || 0) + dt; if (hit._mine > 1.2) { hit._mine = 0; var cnt = (Pg.got['las:' + hit.id] || 0); if (cnt < 3) { Pg.got['las:' + hit.id] = cnt + 1; A.drops.push({ id: 'dr' + (A.picked++) + ':' + hit.id, k: hit.shard ? 'crystal' : 'ore', x: hit.x + (Math.random() - .5) * hit.r, y: hit.y + (Math.random() - .5) * hit.r, ph: 0, drop: 1 }); } } } }
    else A.lasHit = null;
    /* autopilot toward the map target */
    var au = Sp.auto; if (au && ctl) { if (inp.x || inp.y) { Sp.auto = null; } else { var ax = au.x - sh.x, ay = au.y - sh.y, ad = Math.hypot(ax, ay); if (ad < 380) { Sp.auto = null; V.game.toast('ARRIVED'); } else { var want2 = Math.atan2(ay, ax), df = ((want2 - sh.ang + Math.PI * 3) % TAU) - Math.PI; sh.ang += clamp(df, -3 * dt, 3 * dt); var spd = Math.hypot(sh.vx, sh.vy), tgtV = Math.min(900, ad * .6); if (Math.abs(df) < .4 && spd < tgtV) { sh.vx += Math.cos(sh.ang) * 420 * dt; sh.vy += Math.sin(sh.ang) * 420 * dt; sh.thr = 1; } else { var kk = Math.exp(-1.5 * dt); sh.vx *= kk; sh.vy *= kk; } } } }
  };
  function take(it) { if (it.drop) A.drops.splice(A.drops.indexOf(it), 1); else Pg.got[it.id] = 1; if (it.k === 'part') Pg.parts[it.id] = 1; else Pg.gain(it.k, it.n || 1); A.fx.push({ x: it.x, y: it.y, t: 0, k: it.k }); }
  A.fx = [];
  function dropCache(e) { var n = { id: 'cache:' + e.id, k: 'tech', n: 3, x: e.x, y: e.y, ph: 0, drop: 1 }, m = { id: 'cache2:' + e.id, k: 'essence', n: 2, x: e.x + 8, y: e.y - 4, ph: 1, drop: 1 }; if (!Pg.got[n.id]) { Pg.got[n.id] = 1; A.drops.push(n, m); } V.game.toast('CACHE'); }
  var MOFFERS = [[{ ore: 5 }, 'crystal', 3], [{ crystal: 4 }, 'essence', 2], [{ scrap: 10 }, 'tech', 3]];
  function hail(e) {
    var h = A.hail; if (h && h.e === e && h.act) { if (!h.cost || Pg.affordCost(h.cost)) { h.act(); A.hail = null; hail(e); A.hail.ok = .5; if (V.save) V.save.write(); } else h.deny = .4; return; }
    var s = Pg.npc[e.id] || (Pg.npc[e.id] = {}), d = { e: e, t: 0, icons: [], words: '' };
    if (e.kind === 'mother') { var o = MOFFERS[(s.k || 0) % 3]; for (var k in o[0]) d.icons.push({ g: k, n: o[0][k], c: Pg.RCOL[k] }); d.icons.push({ g: 'trade', c: '#ffe07a' }, { g: o[1], n: o[2], c: Pg.RCOL[o[1]] }); d.words = 'WELCOME TRAVELER'; d.cost = o[0]; d.gain = {}; d.gain[o[1]] = o[2]; d.desc = 'Trade with the mothership. The offer changes after each deal.'; d.act = function () { Pg.spend(o[0]); Pg.gain(o[1], o[2]); s.k = (s.k || 0) + 1; }; }
    else if (e.kind === 'swarm') { if (e.st === 0 && !Pg.got['cache:' + e.id]) { d.icons = [{ g: 'follow', c: '#7affe8' }, { g: 'gift', c: '#ffe07a' }]; d.words = 'FOLLOW US'; d.desc = 'Follow the swarm to a cache. It is pinned on your map.'; d.gain = { tech: 3, essence: 2 }; e.st = 1; var tx = e.hx + Math.cos(e.cacheA) * 2600, ty = e.hy + Math.sin(e.cacheA) * 2600; Pg.pin(tx, ty, 'gift', 'cache:' + e.id); } else { d.icons = [{ g: 'smile' }, { g: 'heart', c: '#ff8ae8' }]; d.words = 'BZZ'; d.desc = 'The swarm is leading you, or already did.'; } }
    else if (e.kind === 'ark') { if (!Pg.got['ark:' + e.id]) { d.icons = [{ g: 'wrench', c: '#ffc070' }, { g: 'scrap', n: 6, c: Pg.RCOL.scrap }, { g: 'tech', n: 2, c: Pg.RCOL.tech }, { g: 'part', n: 1, c: Pg.RCOL.part }]; d.words = 'SILENT. EMPTY'; d.desc = 'Salvage the empty ark, once.'; d.gain = { scrap: 6, tech: 2, part: 1 }; d.act = function () { Pg.got['ark:' + e.id] = 1; Pg.gain('scrap', 6); Pg.gain('tech', 2); Pg.parts['ark:' + e.id] = 1; V.game.toast('SALVAGE'); }; } else { d.icons = [{ g: 'check', c: '#7aff8a' }]; d.words = 'NOTHING LEFT'; d.desc = 'Already salvaged.'; } }
    A.hail = d;
  }
  /* ---------- sprites ---------- */
  var spC = {};
  function sprite(kind, f) {
    var key = kind + f; if (spC[key]) return spC[key]; var p, i;
    if (kind === 'mother') { p = new S.Paint(72, 30); p.ell(36, 16, 35, 10, function (dx, dy, x, y) { return S.tone(['#1a1a3a', '#3a3a6a', '#6a6aa0', '#a8a8d8'], .65 - dy * .5 - dx * .1, x, y); }); p.ell(36, 10, 14, 8, function (dx, dy, x, y) { return S.tone(['#2a4a6a', '#4a8ab0', '#8ad8f0', '#e0ffff'], .8 - dy * .6, x, y); }); for (i = 0; i < 14; i++) p.set(6 + i * 4.6, 19, (i + f) % 3 === 0 ? '#ffe07a' : '#7affe8'); p.rect(30, 25, 12, 2, '#c04df0'); p.rect(33, 26, 6, 2, '#ff8ae8'); }
    else if (kind === 'ark') { p = new S.Paint(96, 26); p.poly([[0, 12], [10, 3], [80, 2], [95, 9], [95, 17], [80, 23], [10, 22]], function (x, y) { return V.hf(x >> 2, y >> 2, 5) < .12 ? null : S.tone(['#141022', '#2a2440', '#4a4060', '#6a6080'], .55 - (y - 12) / 30 + (V.hf(x >> 3, y >> 2, 2) - .5) * .3, x, y); }); for (i = 0; i < 9; i++) p.rect(14 + i * 8, 7, 3, 2, (i * 7 + f) % 11 === 0 ? '#ff9030' : '#241e36'); p.rect(85, 10, 9, 6, '#3a3058'); p.set(90, 12, f ? '#ff4a4a' : '#5a1a1a'); }
    else if (kind === 'crystal') { p = new S.Paint(31, 31); var pts = []; for (i = 0; i < 6; i++) { var a = i / 6 * TAU + f * .2, rr = i % 2 ? 9 : 15; pts.push([15.5 + Math.cos(a) * rr, 15.5 + Math.sin(a) * rr]); } p.poly(pts, function (x, y) { var u = ((x - 15.5) * .6 + (y - 15.5) * -.8) / 15; return S.tone(['#2a4a8a', '#4a8ad8', '#9af0ff', '#ffffff'], .55 + u * .5, x, y); }); p.ell(15.5, 15.5, 3, 3, '#ff8ae8'); p.set(15, 15, '#ffffff'); }
    else { p = new S.Paint(4, 4); p.rect(1, 0, 2, 4, '#8ad8a8'); p.rect(0, 1, 4, 2, '#8ad8a8'); p.set(1, 1, f ? '#ffffff' : '#7affe8'); }
    return (spC[key] = p.done());
  }
  var lootC = {};
  function lootSprite(k) { if (lootC[k]) return lootC[k]; var p = new S.Paint(7, 7), col = Pg.RCOL[k] || '#fff'; p.rect(1, 1, 5, 5, '#2a2050'); p.rect(2, 2, 3, 3, col); p.set(1, 1, '#8a82b8'); p.set(5, 5, '#141022'); p.set(3, 0, col); p.set(3, 6, col); return (lootC[k] = p.done()); }
  /* ---------- drawing ---------- */
  A.draw = function (g, cx, cy) {
    var W = V.W, H = V.H, t = V.time, i, sh = Sp.ship;
    var LL = nearLoot(); for (i = 0; i < LL.length; i++) { var it = LL[i], x = Math.round(it.x - cx + W / 2), y = Math.round(it.y - cy + H / 2 + Math.sin(t * 2 + it.ph) * 1.5); if (x < -8 || y < -8 || x > W + 8 || y > H + 8) continue; g.drawImage(lootSprite(it.k), x - 3, y - 3); if ((Math.floor(t * 3 + it.ph) & 3) === 0) { g.fillStyle = '#ffffff'; g.fillRect(x + 2, y - 3, 1, 1); } }
    var L = A.cur || []; for (i = 0; i < L.length; i++) { var e = L[i], ex = Math.round(e.x - cx + W / 2), ey = Math.round(e.y - cy + H / 2), f = Math.floor(t * 2) & 1;
      if (e.kind === 'swarm') { for (var k = 0; k < 9; k++) { var a = k / 9 * TAU + t * (1 + k % 3 * .3), r = 10 + (k % 3) * 6 + Math.sin(t * 2 + k) * 2, sx = ex + Math.round(Math.cos(a) * r), sy = ey + Math.round(Math.sin(a) * r * .7); if (sx < -6 || sy < -6 || sx > W + 6 || sy > H + 6) continue; g.drawImage(sprite('swarm', (k + f) & 1), sx - 2, sy - 2); } continue; }
      var sp = sprite(e.kind, e.kind === 'crystal' ? Math.floor(t * 3) % 6 : f); if (ex + sp.width < 0 || ex - sp.width > W || ey + sp.height < 0 || ey - sp.height > H) continue;
      var bob = e.kind === 'mother' ? Math.round(Math.sin(t * .8) * 2) : 0; g.drawImage(sp, ex - (sp.width >> 1), ey - (sp.height >> 1) + bob);
      if (e.kind === 'mother' && (Math.floor(t * 1.5) & 1)) { g.fillStyle = '#7affe8'; for (var b = 0; b < 3; b++) g.fillRect(ex - 1 + b, ey + 16 + b * 2, 1, 1); }
      if (e.kind === 'crystal' && e.esc > .3) bubble(g, ex, ey - 20, [{ g: 'away', c: '#9af0ff' }], '', null, 0, 'al:' + e.id, 'crystal', { desc: 'A territorial crystal vessel. It escorts you away from its space, never attacks.', n: ['Cloak makes it ignore you.'] });
    }
    if (A.drone) { var dx = Math.round(A.drone.x - cx + W / 2), dy = Math.round(A.drone.y - cy + H / 2); g.fillStyle = '#c8c8d8'; g.fillRect(dx - 1, dy, 3, 1); g.fillRect(dx, dy - 1, 1, 3); g.fillStyle = (Math.floor(t * 8) & 1) ? '#7affe8' : '#ffffff'; g.fillRect(dx, dy, 1, 1); }
    if (A.laser) { var lx = W / 2 + (sh.x - cx), ly = H / 2 + (sh.y - cy), n = Math.round(A.lasLen); for (var l = 12; l < n; l++) { if (V.bayer(l, Math.floor(t * 30)) < .2) continue; g.fillStyle = l % 3 ? '#ff4a8a' : '#ffffff'; g.fillRect(Math.round(lx + Math.cos(sh.ang) * l), Math.round(ly + Math.sin(sh.ang) * l), 1, 1); } if (A.lasHit) { var hx = Math.round(lx + Math.cos(sh.ang) * n), hy = Math.round(ly + Math.sin(sh.ang) * n); g.fillStyle = '#ffd060'; g.fillRect(hx - 1 + (Math.random() * 3 | 0), hy - 1 + (Math.random() * 3 | 0), 1, 1); } }
    for (i = A.fx.length - 1; i >= 0; i--) { var fx = A.fx[i]; fx.t += 1 / 60; if (fx.t > 1.2) { A.fx.splice(i, 1); continue; } V.glyph(g, fx.k, Math.round(fx.x - cx + W / 2) - 2, Math.round(fx.y - cy + H / 2 - fx.t * 14) - 2, Pg.RCOL[fx.k] || '#fff', '#05020d'); }
    if (A.hint && !A.hail && Sp.keyBox) { var he = A.hint.e, hx2 = Math.round(he.x - cx + W / 2), hy2 = Math.round(he.y - cy + H / 2) - (he.kind === 'mother' ? 26 : he.kind === 'ark' ? 22 : 24) - (Math.floor(t * 3) % 2); Sp.keyBox(g, hx2, hy2, 'E'); V.glyph(g, 'talk', hx2 + 9, hy2 - 2, '#7affe8', '#05020d'); }
    if (V.tips && Pg.softTip) for (i = 0; i < L.length; i++) { var e3 = L[i], q3 = sprite(e3.kind === 'swarm' ? 'mother' : e3.kind, 0), ex3 = Math.round(e3.x - cx + W / 2), ey3 = Math.round(e3.y - cy + H / 2); if (ex3 < -40 || ex3 > W + 40 || ey3 < -40 || ey3 > H + 40) continue; Pg.softTip('alien:' + e3.id, ex3 - (q3.width >> 1), ey3 - (q3.height >> 1), q3.width, q3.height, V.tips.alien(e3)); }
    if (A.hail) { var hh = A.hail, e2 = hh.e; bubble(g, Math.round(e2.x - cx + W / 2), Math.round(e2.y - cy + H / 2) - (e2.kind === 'mother' ? 22 : e2.kind === 'ark' ? 18 : 22), hh.icons, hh.words, hh.act ? (!hh.cost || Pg.affordCost(hh.cost)) : null, hh.deny, 'al:' + e2.id, e2.kind, hh); }
  };
  function bubble(g, sx, sy, toks, words, can, deny, tid, kind, dd) {
    var W = V.W, wid = 4, i; for (i = 0; i < toks.length; i++) wid += 6 + (toks[i].n ? V.textW(String(toks[i].n)) + 1 : 0);
    var tr = Pg.has('translator') && words, tw = tr ? V.textW(words) + 4 : 0, bw = Math.max(wid + (can != null ? 15 : 0), tw), bh = tr ? 17 : 10, sh = deny > 0 ? Math.round(Math.sin(deny * 60) * 2) : 0, x0 = clamp(sx - (bw >> 1), 2, W - bw - 2) + sh, y0 = sy - bh;
    g.fillStyle = '#9af0ff'; g.fillRect(x0 - 1, y0 - 1, bw + 2, bh + 2); g.fillStyle = '#0a1428'; g.fillRect(x0, y0, bw, bh); g.fillStyle = '#9af0ff'; g.fillRect(sx - 1, y0 + bh + 1, 3, 1); g.fillRect(sx, y0 + bh + 2, 1, 1);
    var x = x0 + 3; for (i = 0; i < toks.length; i++) { var tk = toks[i]; V.glyph(g, tk.g, x, y0 + 3, tk.c || '#efe6ff'); x += 6; if (tk.n) { V.text(g, String(tk.n), x - 1, y0 + 4, '#efe6ff'); x += V.textW(String(tk.n)) + 1; } }
    if (can != null) { var kx = x0 + bw - 12; V.glyph(g, can ? 'check' : 'cross', kx + 6, y0 + 3, can ? '#7aff8a' : '#ff6a6a'); if (can) V.text(g, 'E', kx, y0 + 3, '#ffffff'); }
    if (tr) V.text(g, words, x0 + 2, y0 + 11, '#a8f0d8');
    if (tid && V.tips) V.tips.bubbleAt(tid, x0 - 1, y0 - 1, bw + 2, bh + 4, kind, dd);
  }
  A.bubble = bubble;
  /* markers for aliens you have seen */
  A.markerList = function () { return (A.cur || []).filter(function (e) { return Pg.seenAliens[e.id] || e.d < 2400; }); };
})();
