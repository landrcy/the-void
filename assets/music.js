/* The Void — music: two real CC0 recordings (see assets/music/CREDITS.txt), cross-faded, fade-in, remembered mute, paused when the tab is hidden. */
(function () {
  'use strict';
  var V = window.VOID, KEY = 'void:mute';
  var TRACKS = [{ f: 'persistence', name: 'Persistence', by: 'cinameng (James Gargette)', url: 'https://opengameart.org/content/persistence' }, { f: 'forest', name: 'Cathedral in the forest (ambient loop)', by: 'congusbongus', url: 'https://opengameart.org/content/cathedral-in-the-forest-ambient-loop' }];
  var M = V.music = { tracks: TRACKS, idx: 0, els: [], vols: [0, 0], targets: [0, 0], cur: 0, started: false, muted: false, level: .6, blocked: false };
  try { M.muted = localStorage.getItem(KEY) === '1'; } catch (e) { }
  var ext = (function () { var a = document.createElement('audio'); return a.canPlayType && a.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'mp3'; })();
  function mk(i) { var a = new Audio(); a.preload = 'auto'; a.src = 'assets/music/' + TRACKS[i].f + '.' + ext; a.volume = 0; a.loop = false; return a; }
  function playEl(a) { var p = a.play(); if (p && p.catch) p.catch(function () { M.blocked = true; }); }
  M.start = function () {
    if (V.q.has('nomusic')) return;
    if (M.started) { if (M.blocked) { M.blocked = false; if (!M.muted) playEl(M.els[M.cur]); } return; }
    M.started = true; M.els = [mk(0), mk(1)]; M.cur = 0; M.vols = [0, 0]; M.targets = [M.muted ? 0 : M.level, 0];
    if (!M.muted) playEl(M.els[0]);
  };
  M.setMuted = function (m) { M.muted = !!m; try { localStorage.setItem(KEY, m ? '1' : '0'); } catch (e) { } if (!M.started) return; if (m) { M.targets = [0, 0]; } else { M.targets[M.cur] = M.level; M.targets[1 - M.cur] = 0; playEl(M.els[M.cur]); } if (V.ui && V.ui.refresh) V.ui.refresh(); };
  M.toggle = function () { M.setMuted(!M.muted); if (!M.started && !M.muted) M.start(); };
  /* called every frame (from the UI); volumes ease so starts, stops and track changes always fade */
  M.update = function (dt) {
    if (!M.started) return; var a = M.els[M.cur];
    if (!M.muted && a.duration && a.currentTime > a.duration - 9) { var n = 1 - M.cur, b = M.els[n]; b.currentTime = 0; playEl(b); M.targets[M.cur] = 0; M.targets[n] = M.level; M.cur = n; }
    for (var i = 0; i < 2; i++) { var el = M.els[i], tv = M.targets[i], v = M.vols[i]; var rate = tv > v ? dt / 5 : dt / 3; v = tv > v ? Math.min(tv, v + rate) : Math.max(tv, v - rate); M.vols[i] = v; el.volume = Math.max(0, Math.min(1, v)); if (v <= 0 && tv <= 0 && !el.paused) el.pause(); }
  };
  document.addEventListener('visibilitychange', function () { if (!M.started) return; if (document.hidden) { M.els.forEach(function (e) { e.pause(); }); } else if (!M.muted) { playEl(M.els[M.cur]); if (M.vols[1 - M.cur] > 0) playEl(M.els[1 - M.cur]); } });
  function unblock() { if (M.started && M.blocked) M.start(); }
  addEventListener('pointerdown', unblock); addEventListener('keydown', unblock);
  M.credit = 'Music: "Persistence" by cinameng (CC0) and "Cathedral in the forest" by congusbongus (CC0), via OpenGameArt.org';
})();
