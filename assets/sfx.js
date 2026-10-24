/* The Void — sound effects: real CC0 samples (see assets/sfx/CREDITS.txt), Web Audio buffers preloaded,
   mixed under the music, muted with the music button, throttled, loops ramp in/out with time constants (frame-rate independent).
   V.sfx(name, {vol, rate}) plays a one-shot; V.sfx.loop(name, level) holds a loop (call every frame, 0 = fade out).
   Most events are picked up by a small state watcher so game code stays untouched. ?nosfx disables. */
(function () {
  'use strict';
  var V = window.VOID;
  var LIST = ['step1', 'step2', 'step3', 'jump', 'land', 'thud', 'jet', 'thrust', 'laser', 'laserOn', 'mine', 'pickup', 'pickup2', 'part', 'board', 'exit', 'takeoff', 'touchdown', 'crash', 'rumble', 'repair', 'repaired', 'buy', 'deny', 'tier', 'open', 'close', 'tick', 'click', 'toggleOn', 'toggleOff', 'scan', 'discover', 'mapOpen', 'mapClose', 'zoom', 'select', 'warp', 'warpHum', 'arrive', 'trade', 'tradeFail', 'blip1', 'blip2', 'blip3', 'alien', 'flyby', 'warn', 'lowfuel', 'hot', 'whoosh', 'cloak', 'slow', 'board2', 'grapple', 'auto', 'deep', 'drill', 'dig', 'build', 'hum', 'seg', 'dyson'];
  var LOOPS = { jet: 1, thrust: 1, laser: 1, deep: 1, drill: 1, hum: 1 }, RATE = { deep: .55 };
  /* per-sound mix (0..1, multiplied by MASTER) and minimum repeat gap in seconds */
  var MIX = { step1: .22, step2: .22, step3: .22, jump: .3, land: .35, thud: .45, jet: .3, thrust: .32, laser: .25, laserOn: .3, mine: .35, pickup: .45, pickup2: .4, part: .55, board: .5, exit: .5, takeoff: .5, touchdown: .5, crash: .8, rumble: .7, repair: .5, repaired: .55, buy: .55, deny: .4, tier: .6, open: .35, close: .35, tick: .12, click: .3, toggleOn: .35, toggleOff: .35, scan: .45, discover: .5, mapOpen: .4, mapClose: .35, zoom: .18, select: .3, warp: .6, warpHum: .55, arrive: .6, trade: .5, tradeFail: .4, blip1: .25, blip2: .25, blip3: .25, alien: .3, flyby: .35, warn: .35, lowfuel: .35, hot: .35, whoosh: .55, cloak: .4, slow: .4, board2: .35, grapple: .35, auto: .4, deep: .55, drill: .28, dig: .5, build: .5, hum: .22, seg: .3, dyson: .5 };
  var GAP = { step1: .12, step2: .12, step3: .12, tick: .07, zoom: .09, pickup: .07, pickup2: .07, mine: .18, blip1: .12, blip2: .12, blip3: .12, deny: .2, tradeFail: .25, land: .15, warn: 4, lowfuel: 6, flyby: 10, alien: 3, scan: .2 };
  var MASTER = .5;
  var S = { buffers: {}, loaded: 0, total: LIST.length, ctx: null, master: null, last: {}, loops: {}, log: [], errors: [], ready: false, disabled: V.q && V.q.has && V.q.has('nosfx'), MIX: MIX, LIST: LIST };
  function muted() { return !!(V.music && V.music.muted); }
  function now() { return performance.now() / 1000; }
  function ctxOk() {
    if (S.ctx || S.disabled) return S.ctx;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    try { S.ctx = new AC(); S.master = S.ctx.createGain(); S.master.gain.value = muted() ? 0 : MASTER; S.master.connect(S.ctx.destination); } catch (e) { S.errors.push(String(e)); S.ctx = null; }
    return S.ctx;
  }
  function decode(name, ab) {
    var c = ctxOk(); if (!c) return;
    var done = function (buf) { S.buffers[name] = buf; S.loaded++; if (S.loaded === S.total) S.ready = true; };
    var fail = function (e) { S.errors.push(name + ': ' + (e && e.message || e)); S.loaded++; };
    try { var p = c.decodeAudioData(ab, done, fail); if (p && p.catch) p.catch(fail); } catch (e) { fail(e); }
  }
  function b64(s) { var bin = atob(s), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
  S.load = function () {
    if (S.disabled || S.loading || !ctxOk()) return; S.loading = true;
    if (location.protocol === 'file:') { /* fetch is blocked on file://: use the generated base64 bundle */
      var sc = document.createElement('script'); sc.src = 'assets/sfx/sfx-data.js';
      sc.onload = function () { var D = window.VOID_SFX_DATA || {}; LIST.forEach(function (n) { if (D[n]) decode(n, b64(D[n])); else S.loaded++; }); };
      document.head.appendChild(sc); return;
    }
    var ext = (new Audio()).canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3';
    LIST.forEach(function (n) { fetch('assets/sfx/' + n + '.' + ext).then(function (r) { return r.arrayBuffer(); }).then(function (ab) { decode(n, ab); }).catch(function (e) { S.errors.push(n + ': ' + e); S.loaded++; }); });
  };
  S.unlock = function () { var c = ctxOk(); if (c && c.state === 'suspended' && c.resume) c.resume().catch(function () { }); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, S.unlock, { capture: true, passive: true }); });

  function play(name, o) {
    o = o || {}; var t = now(), gap = o.gap != null ? o.gap : (GAP[name] || .05);
    if (S.last[name] && t - S.last[name] < gap) return false; S.last[name] = t;
    S.log.push(name); if (S.log.length > 200) S.log.shift();
    var c = S.ctx, buf = S.buffers[name]; if (!c || !buf || muted() || c.state !== 'running') return true;
    try {
      var src = c.createBufferSource(), g = c.createGain(); src.buffer = buf; src.playbackRate.value = (o.rate || 1) * (o.jitter ? 1 + (Math.random() - .5) * o.jitter : 1);
      g.gain.value = (MIX[name] || .4) * (o.vol != null ? o.vol : 1); src.connect(g); g.connect(S.master); src.start();
    } catch (e) { S.errors.push(String(e)); }
    return true;
  }
  V.sfx = function (name, o) { return play(name, o); };
  for (var k in S) V.sfx[k] = S[k];
  V.sfx.state = S;
  /* loops: level is held for this frame; S.tick ramps toward it and stops the source cleanly at 0 */
  V.sfx.loop = function (name, level) { var L = S.loops[name] || (S.loops[name] = { want: 0, src: null, gain: null, on: false }); L.want = Math.max(L.want, level || 0); };
  function tickLoops() {
    var c = S.ctx;
    for (var n in S.loops) {
      var L = S.loops[n], want = muted() ? 0 : L.want; L.level = L.want; L.want = 0;
      if (!c || !S.buffers[n] || c.state !== 'running') continue;
      if (want > 0 && !L.src) {
        var src = c.createBufferSource(), g = c.createGain(); src.buffer = S.buffers[n]; src.loop = true; if (RATE[n]) src.playbackRate.value = RATE[n]; g.gain.value = 0; src.connect(g); g.connect(S.master); src.start(); L.src = src; L.gain = g;
        if (S.log[S.log.length - 1] !== n + ':loop') S.log.push(n + ':loop');
      }
      if (L.src) {
        var tgt = want * (MIX[n] || .3); L.gain.gain.setTargetAtTime(tgt, c.currentTime, want > 0 ? .06 : .09);
        if (want <= 0) { L.off = (L.off || 0) + 1; if (L.gain.gain.value < .002 || L.off > 90) { try { L.src.stop(); } catch (e) { } L.src.disconnect(); L.src = null; L.off = 0; } } else L.off = 0;
      }
    }
  }
  function tickMaster() { if (!S.master || !S.ctx) return; var m = muted(); if (m !== S._m) { S._m = m; var gg = S.master.gain; if (gg.cancelScheduledValues) gg.cancelScheduledValues(0); gg.value = m ? 0 : MASTER; } }
  document.addEventListener('visibilitychange', function () { if (!S.ctx) return; if (document.hidden) S.ctx.suspend && S.ctx.suspend(); else S.unlock(); });

  /* ---------- event watcher ---------- */
  var P = {}, stepAcc = 0, stepI = 0;
  function sumRes() { var r = V.prog && V.prog.res, s = 0; if (r) for (var k in r) s += +r[k] || 0; return s; }
  function watch(dt) {
    var g = V.game, Su = V.surface, Sp = V.space, Pg = V.prog, St = V.story, A = V.aliens, Wd = V.world, T = V.title; if (!g) return;
    var st = g.state, sm = Su && Su.mode, pl = Su && Su.pl;
    /* title */
    if (T && T.outing && !P.tOut) play('whoosh');
    P.tOut = T && T.outing;
    /* crash entry cinematic */
    var ck = St && St.cine && St.cine.k; if (ck === 'entry' && P.ck !== 'entry') play('rumble', { vol: .6 }); if (ck === 'warp' && P.ck !== 'warp') play('warpHum');
    if (P.ck === 'warp' && ck !== 'warp' && st === 'space') play('arrive');
    P.ck = ck;
    /* surface */
    if (st === 'surface' && pl) {
      if (sm !== P.sm) {
        if (sm === 'board') play('board');
        else if (sm === 'lift') play('takeoff');
        else if (sm === 'play' && P.sm === 'arrive') { play('touchdown'); play('exit', { vol: .8 }); }
      }
      if (sm === 'play' && !pl.hidden) {
        if (pl.ground && P.ground === false) { play('land', { vol: Math.min(1, .5 + Math.abs(P.vy || 0) / 300) }); stepAcc = 0; }
        if (!pl.ground && P.ground && pl.vy > 40) play('jump', { jitter: .06 });
        if (pl.ground && !pl.swim && Math.abs(pl.vx) > 8) { stepAcc += Math.abs(pl.vx) * dt; if (stepAcc > 15) { stepAcc = 0; stepI = (stepI + 1) % 3; play('step' + (stepI + 1), { jitter: .1, vol: Wd && Wd.boardOn ? .4 : 1 }); } }
        if (pl.jetOn > 0) V.sfx.loop('jet', 1);
      }
      P.ground = pl.ground; P.vy = pl.vy;
      if (Wd) { if (Wd.boardOn !== P.boardOn && P.boardOn != null) play('board2'); P.boardOn = Wd.boardOn; if (Wd.grap && !P.grap) play('grapple'); P.grap = !!Wd.grap;
        var bb = Wd.bubble; if (bb && bb !== P.bub) play('blip' + (1 + (Math.random() * 3 | 0)), { jitter: .15 }); P.bub = bb; }
    } else { P.ground = undefined; }
    P.sm = sm;
    /* space */
    if (st === 'space' && Sp) {
      var sh = Sp.ship;
      if (Sp.mode !== P.spm) { if (Sp.mode === 'landing') play('select', { vol: .8 }); if (Sp.mode === 'transit') play('warp'); P.spm = Sp.mode; }
      if (sh.thr && Sp.mode !== 'transit') V.sfx.loop('thrust', sh.boostT > 0 ? 1 : .6);
      if (A && A.laser) { V.sfx.loop('laser', 1); if (!P.laser) play('laserOn'); }
      P.laser = !!(A && A.laser);
      if (Sp.mapOpen !== P.map && P.map != null) play(Sp.mapOpen ? 'mapOpen' : 'mapClose'); P.map = Sp.mapOpen;
      if (Sp.mapOpen && V.galmap) { var zt = V.galmap.zt; if (P.zt != null && Math.abs(zt - P.zt) > 1e-4) play('zoom'); P.zt = zt; } else P.zt = null;
      if (Sp.cloak !== P.cloak && P.cloak != null) play('cloak'); P.cloak = Sp.cloak;
      if (Sp.slow !== P.slow && P.slow != null) play('slow'); P.slow = Sp.slow;
      if (A) { var hl = A.hail; if (hl && hl !== P.hail && !hl.ok) play('blip' + (1 + (Math.random() * 3 | 0)), { jitter: .15 }); P.hail = hl;
        var L = A.cur || []; for (var i = 0; i < L.length; i++) { var e = L[i]; if (e.d < 320 && !(e._sfxNear)) { e._sfxNear = 1; play('flyby'); } else if (e.d > 600) e._sfxNear = 0; } }
      if (St && St.edgeT > 0 && !(P.edge > 0)) play('warn'); P.edge = St ? St.edgeT : 0;
      if (Pg && !Pg.cheat.fuel) { if (Pg.fuel < .2 && P.fuel >= .2) play('lowfuel'); P.fuel = Pg.fuel; }
    } else { P.spm = null; P.map = null; P.laser = false; }
    /* progression */
    if (Pg) {
      if (Pg.open !== P.open) { if (Pg.open) play('open'); else if (P.open) play('close'); P.open = Pg.open; }
      if (Pg.buyFx && Pg.buyFx !== P.buyFx) play('buy'); P.buyFx = Pg.buyFx;
      if (Pg.denyT && Pg.denyT !== P.denyT) play('deny'); P.denyT = Pg.denyT;
      var tier = (Pg.shipTier ? Pg.shipTier() : 0) + (Pg.shipStage ? Pg.shipStage() * 10 : 0); if (P.tier != null && tier > P.tier) play('tier'); P.tier = tier;
      var r = sumRes(); if (P.res != null && r > P.res && st !== 'title') play(A && A.laser ? 'mine' : 'pickup', { jitter: .12 }); P.res = r;
      var np = Pg.parts ? Object.keys(Pg.parts).length : 0; if (P.parts != null && np > P.parts) play('part'); P.parts = np;
      if (Pg.story && Pg.story.repaired && P.rep === false) play('repaired'); P.rep = Pg.story ? !!Pg.story.repaired : null;
      /* hover tooltip tick */
      var hid = Pg.hover && Pg.hover.id; if (hid && hid !== P.hid) play('tick'); P.hid = hid;
    }
    if (St && St.rep) V.sfx.loop('jet', 0);
  }
  /* toasts that carry their own sound */
  var TOAST = { 'ALIEN SIGNAL': 'alien', 'DRIVE PART': null, 'UNIVERSAL DRIVE': 'tier', 'AUTOPILOT': 'auto', 'ARRIVED': 'auto', 'TOO HOT': 'hot', 'NOT FOUND': 'deny', 'IN SPACE': 'deny', 'LAND FIRST': 'deny', 'SPACETIME TRANSIT': 'arrive', 'LANDED': 'discover' };
  function hookToast() { var g = V.game; if (!g || g._sfxToast) return; var o = g.toast; g.toast = function (s, sub) { var n = TOAST[s]; if (n) play(n); return o.apply(this, arguments); }; g._sfxToast = 1; }
  /* clicks: canvas UI regions (admin toggles get a switch sound) and the HTML buttons */
  function hookClicks() {
    V.canvas && V.canvas.addEventListener('pointerdown', function () { var Pg = V.prog, h = Pg && Pg.hover; if (!h) return; var id = h.id || ''; if (/^a[tgr]?:/.test(id) || Pg.open === 'admin') play(S._tg = !S._tg ? 'toggleOn' : 'toggleOff'); else if (id.indexOf('u:') !== 0) play('click'); });
    var ui = document.getElementById('ui'); if (ui) { ui.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('button')) play('click'); }, true); ui.addEventListener('pointerover', function (e) { var b = e.target.closest && e.target.closest('button'); if (b && b !== S._hb) { S._hb = b; play('tick'); } }); }
  }
  V.sfx.watch = watch;
  V.sfx.update = function (dt) { if (S.disabled) return; try { watch(dt); tickLoops(); tickMaster(); } catch (e) { S.errors.push(String(e && e.stack || e)); } };
  V.sfx.credit = 'Sound effects: Kenney.nl Sci-Fi, Interface, Impact and Digital Audio packs (CC0)';
  function init() {
    hookToast(); hookClicks();
    var up = V.hooks.update; V.hooks.update = function (dt) { up(dt); V.sfx.update(dt); };
    S.load();
  }
  V.sfx.init = init;
})();
