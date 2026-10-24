/* The Void — local save (localStorage 'void:v2', migrates 'void:v1'): seed, place, discoveries, resources, upgrades, story. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, Su = V.surface, KEY = 'void:v2', OLD = 'void:v1';
  var Sv = V.save = { acc: 0 };
  Sv.data = function () {
    var g = V.game; if (!g || g.state === 'title') return null;
    var d = { v: 2, prog: V.prog ? V.prog.getSave() : null, seed: G.seed, t: +G.t.toFixed(2), state: g.state, visited: Object.keys(g.visited), disc: Object.keys(Su.disc), seen: Object.keys(V.space.seen), at: Date.now() };
    if (g.state === 'surface' && Su.cur) { d.body = Su.cur.id; d.surf = Su.getSave(); if (Su.mode !== 'play') d.surf = null; }
    else if (g.state === 'space' && V.space.mode !== 'fly') d.ship = V.space.getSave();
    else if (g.state === 'space') d.ship = V.space.getSave();
    return d;
  };
  Sv.write = function () { var d = Sv.data(); if (!d) return false; try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } };
  Sv.read = function () {
    try { var s = localStorage.getItem(KEY); if (s) { var d = JSON.parse(s); return d && d.v === 2 ? d : null; }
      var o = localStorage.getItem(OLD); if (!o) return null; var d1 = JSON.parse(o); if (!d1 || d1.v !== 1) return null;
      /* v1 -> v2: keep the place and discoveries; the crash story counts as done, no resources yet */
      d1.v = 2; d1.migrated = 1; d1.prog = { story: { crashed: true, repaired: true, warped: false } }; return d1;
    } catch (e) { return null; } };
  Sv.clear = function () { try { localStorage.removeItem(KEY); localStorage.removeItem(OLD); } catch (e) { } };
  Sv.has = function () { return !!Sv.read(); };
  Sv.canResume = function () { var d = Sv.read(); if (!d || d.v !== 2) return false; if (V.game.seed != null && d.seed !== V.game.seed) return false; return true; };
  Sv.tick = function (dt) { Sv.acc += dt; if (Sv.acc > 5) { Sv.acc = 0; Sv.write(); } };
  /* rebuild the game from a save; returns true when it did */
  Sv.restore = function () {
    if (!Sv.canResume() || V.q.has('fresh')) return false; var d = Sv.read(), g = V.game;
    G.init(d.seed); G.t = d.t || 0; g.seed = d.seed; if (V.prog) { if (d.prog) V.prog.load(d.prog); else V.prog.fresh(); }
    g.visited = {}; (d.visited || []).forEach(function (id) { g.visited[id] = 1; }); g.visitedCount = (d.visited || []).length;
    Su.disc = {}; (d.disc || []).forEach(function (id) { Su.disc[id] = 1; }); Su.discCount = (d.disc || []).length; g.discovered = Su.discCount;
    V.space.seen = {}; (d.seen || []).forEach(function (id) { V.space.seen[id] = 1; }); V.space.seenCount = (d.seen || []).length;
    if (d.state === 'surface' && d.body) { var b = G.getBody(d.body); if (b) { g.startSurface(b, d.surf ? { resume: d.surf } : {}); markScanned(); return true; } }
    if (d.state === 'space' && d.ship) { g.state = 'space'; V.space.enter({ pos: d.ship }); if (V.ui) V.ui.setState('space'); return true; }
    var e = G.getBody('0,0:3'); g.startSurface(e, {}); return true;
  };
  function markScanned() { var w = Su.cur; if (!w) return; w.critters.forEach(function (c) { if (Su.disc['c:' + c.type + ':' + w.id]) c.scanned = true; }); w.items.forEach(function (it) { if (it.scan && Su.disc['m:' + w.id]) it.scanned = true; }); }
  Sv.markScanned = markScanned;
})();
