/* The Void — game state machine: title -> surface <-> space. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, Su = V.surface, S = V.spr, Q = V.q;
  var game = V.game = { state: 'title', fade: 0, fadeDir: 0, fadeDur: 1, fadeCb: null, fading: false, toasts: [], body: null, started: false, discovered: 0 };
  V.reduced = Q.has('reduced') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (Q.get('reduced') === '0') V.reduced = false;
  var seed = Q.has('seed') ? (parseInt(Q.get('seed'), 10) || 0) : null;
  game.seed = seed;
  S.astro = S.astronaut(); S.shipFrames = S.ship();

  /* ---------- fades ---------- */
  game.fadeOut = function (dur, cb) { game.fadeDir = 1; game.fadeDur = Math.max(.01, dur); game.fadeCb = cb || null; game.fading = true; };
  game.fadeIn = function (dur, cb) { game.fadeDir = -1; game.fadeDur = Math.max(.01, dur); game.fadeCb = cb || null; game.fading = true; };
  function updFade(dt) {
    if (!game.fadeDir) return;
    game.fade += game.fadeDir * dt / game.fadeDur;
    if (game.fadeDir > 0 && game.fade >= 1) { game.fade = 1; game.fadeDir = 0; var cb = game.fadeCb; game.fadeCb = null; if (cb) cb(); if (!game.fadeDir && game.fade >= 1) game.fading = !!game.fadeCb || game.fading; }
    else if (game.fadeDir < 0 && game.fade <= 0) { game.fade = 0; game.fadeDir = 0; game.fading = false; var cb2 = game.fadeCb; game.fadeCb = null; if (cb2) cb2(); }
  }
  /* ---------- toasts (place names, discoveries) ---------- */
  game.toast = function (str, sub) { game.toasts.push({ str: str, sub: sub || '', t: 0 }); if (game.toasts.length > 3) game.toasts.shift(); var live = document.getElementById('live'); if (live) live.textContent = str + (sub ? ', ' + sub : ''); };

  /* ---------- discoveries / save ---------- */
  game.visited = {}; game.visitedCount = 0;
  game.markVisited = function (body) { if (!game.visited[body.id]) { game.visited[body.id] = 1; game.visitedCount++; return true; } return false; };
  Su.onDiscover = function (id, label) { game.discovered = Su.discCount; game.toast('SCANNED', label); if (V.sfx) V.sfx('scan'); if (V.save) V.save.write(); };
  game.onLanded = function (body) { if (game.markVisited(body)) game.toast('LANDED', G.nameOf(body)); else game.toast(G.nameOf(body)); if (V.save) V.save.write(); };

  /* ---------- transitions ---------- */
  function startSurface(body, opts) {
    game.state = 'surface'; game.body = body; Su.enter(body, opts || {}); game.markVisited(body); V.hooks.draw = drawFn; if (V.ui) V.ui.setState('surface');
  }
  game.startSurface = startSurface;
  game.land = function (body) { // called by space once the ship touches down
    game.fadeOut(.6, function () { startSurface(body, { arrive: true }); game.toast(G.nameOf(body), V.themeName ? V.themeName(body) : ''); game.fadeIn(.9); });
  };
  game.takeoff = function (body, ang) {
    Su.leave(); game.state = 'space'; V.space.enter({ launch: body, ang: ang * Math.PI * 2 }); if (V.ui) V.ui.setState('space'); game.fadeIn(.9); if (V.save) V.save.write();
  };
  game.toTitle = function () { game.fadeOut(.5, function () { game.state = 'title'; Su.leave(); if (V.space && V.space.leave) V.space.leave(); V.title.enter(); if (V.ui) V.ui.setState('title'); game.fadeIn(.6); }); };
  game.newGalaxy = function (s) {
    var ns = s != null ? s : ((Math.random() * 1e9) | 0); game.fadeOut(.5, function () { G.init(ns); game.seed = ns; Su.worlds = {}; Su.disc = {}; Su.discCount = 0; game.visited = {}; game.visitedCount = 0; game.discovered = 0; V.space.enter({ fresh: true }); game.state = 'space'; Su.leave(); if (V.ui) V.ui.setState('space'); if (V.save) V.save.write(); game.fadeIn(.8); });
  };
  function beginFromTitle() {
    if (game.started) return; game.started = true;
    V.title.start(function () {
      V.music && V.music.start(); game.fade = 1; game.fadeDir = 0;
      if (!(V.save && V.save.restore())) { var earth = G.getBody('0,0:3'); startSurface(earth, {}); game.toast('EARTH', 'HOME'); }
      game.fadeIn(1.4); game.started = false;
    });
  }
  game.begin = beginFromTitle;

  /* ---------- main loop hooks ---------- */
  function update(dt) {
    updFade(dt);
    if (V.shake > 0) V.shake = Math.max(0, V.shake - dt * 1.6);
    for (var i = game.toasts.length - 1; i >= 0; i--) { game.toasts[i].t += dt; if (game.toasts[i].t > 4.2) game.toasts.splice(i, 1); }
    if (game.state === 'title') {
      V.title.update(dt);
      if (!game.started && (V.anyPressed() || game.clicked)) { game.clicked = false; beginFromTitle(); if (V.music) V.music.start(); }
    } else if (game.state === 'surface') { Su.update(dt); if (V.keyPressed('m') && Su.mode === 'play' && V.ui && V.ui.onMapKey) V.ui.onMapKey(); }
    else if (game.state === 'space') { V.space.update(dt); }
    if (V.ui && V.ui.update) V.ui.update(dt);
    if (V.save && V.save.tick) V.save.tick(dt);
  }
  function drawToasts(g) {
    var W = V.W, y = 8;
    for (var i = 0; i < game.toasts.length; i++) {
      var t = game.toasts[i], a = t.t < .4 ? t.t / .4 : t.t > 3.4 ? 1 - (t.t - 3.4) / .8 : 1; if (a <= .05) continue;
      var tw = V.textW(t.str), sw = V.textW(t.sub);
      if (a < .99) { var skip = V.bayer(i, 0) > a; if (skip && a < .5) continue; }
      V.text(g, t.str, (W - tw >> 1), y, i === game.toasts.length - 1 ? '#efe6ff' : '#b090e0', '#1a0a3a'); y += 7;
      if (t.sub) { V.text(g, t.sub, (W - sw >> 1), y, '#c04df0', '#1a0a3a'); y += 7; }
      y += 3;
    }
  }
  var HINTLINE = null;
  function drawFn(g, dt) {
    var sh = V.shake > 0 && !V.reduced ? V.shake : 0, ox = 0, oy = 0;
    if (sh) { g.save(); ox = Math.round((Math.random() - .5) * 2 * sh * 2.2); oy = Math.round((Math.random() - .5) * 2 * sh * 2.2); g.translate(ox, oy); }
    if (game.state === 'title') V.title.draw(g, dt);
    else if (game.state === 'surface') { Su.draw(g, dt); Su.drawOverlay(g); }
    else if (game.state === 'space') V.space.draw(g, dt);
    if (sh) g.restore();
    /* toasts are screen-reader only (#live); the screen stays wordless */
    if (V.ui && V.ui.draw && game.state !== 'title') V.ui.draw(g, dt);
    if (game.fade > 0) V.dissolve(g, game.fade, '#05020d');
  }
  V.hooks.update = update; V.hooks.draw = drawFn;
  V.canvas.addEventListener('pointerdown', function () { if (game.state === 'title') game.clicked = true; });

  /* ---------- boot ---------- */
  function boot() {
    G.init(seed != null ? seed : 20241);
    var pk = Q.get('planet');
    if (pk && !V.save_skip) {
      var f = G.find(pk, 0, 0); if (f) { game.started = true; var b = f.body; V.title.active = false; startSurface(b, {}); game.fade = 0; if (V.music) V.music.armed = true; return; }
    }
    if (Q.has('space')) { game.state = 'space'; V.space.enter({ fresh: true, home: true }); if (V.ui) V.ui.setState('space'); return; }
    V.title.enter();
  }
  game.boot = boot;
})();
