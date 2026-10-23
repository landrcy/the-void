/* The Void — local save (localStorage 'void:v1'): galaxy seed, place, discoveries. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, Su = V.surface, KEY = 'void:v1';
  var Sv = V.save = { acc: 0 };
  Sv.data = function () {
    var g = V.game; if (!g || g.state === 'title') return null;
    var d = { v: 1, seed: G.seed, t: +G.t.toFixed(2), state: g.state, visited: Object.keys(g.visited), disc: Object.keys(Su.disc), seen: Object.keys(V.space.seen), at: Date.now() };
    if (g.state === 'surface' && Su.cur) { d.body = Su.cur.id; d.surf = Su.getSave(); if (Su.mode !== 'play') d.surf = null; }
    else if (g.state === 'space') d.ship = V.space.getSave();
    return d;
  };
  Sv.write = function () { var d = Sv.data(); if (!d) return false; try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } };
  Sv.read = function () { try { var s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } };
  Sv.clear = function () { try { localStorage.removeItem(KEY); } catch (e) { } };
  Sv.canResume = function () { var d = Sv.read(); if (!d || d.v !== 1) return false; if (V.game.seed != null && d.seed !== V.game.seed) return false; return true; };
  Sv.tick = function (dt) { Sv.acc += dt; if (Sv.acc > 5) { Sv.acc = 0; Sv.write(); } };
  /* rebuild the game from a save; returns true when it did */
  Sv.restore = function () {
    if (!Sv.canResume() || V.q.has('fresh')) return false; var d = Sv.read(), g = V.game;
    G.init(d.seed); G.t = d.t || 0; g.seed = d.seed;
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
