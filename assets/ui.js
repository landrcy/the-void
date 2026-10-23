/* The Void — HTML pixel buttons (mute, map, new galaxy, fullscreen, title), touch pad, HUD and fps overlay. */
(function () {
  'use strict';
  var V = window.VOID, Q = V.q;
  var U = V.ui = { state: 'title', hintT: 0, fps: 0, fpsAcc: 0, fpsN: 0, showFps: Q.has('fps') };
  var ICONS = {
    sound: ['....1....', '...11....', '11111.1..', '11111..1.', '11111.11.', '11111..1.', '1111.1...', '...11....', '....1....'],
    mute: ['....1....', '...11....', '1111.....', '1111.1.1.', '1111..1..', '1111.1.1.', '1111.....', '...11....', '....1....'],
    map: ['...111...', '.11...11.', '1..111..1', '1.1...1.1', '1.1.1.1.1', '1.1..1..1', '1..11..1.', '.1.....1.', '..11111..'],
    dice: ['111111111', '1.......1', '1.1...1.1', '1.......1', '1...1...1', '1.......1', '1.1...1.1', '1.......1', '111111111'],
    full: ['111...111', '1.......1', '1.......1', '.........', '.........', '.........', '1.......1', '1.......1', '111...111'],
    home: ['....1....', '...111...', '..11111..', '.1111111.', '111111111', '.11...11.', '.11...11.', '.11...11.', '.11111111'],
    l: ['.........', '....1....', '...11....', '..111....', '.1111....', '..111....', '...11....', '....1....', '.........'],
    r: ['.........', '....1....', '....11...', '....111..', '....1111.', '....111..', '....11...', '....1....', '.........'],
    u: ['.........', '.........', '....1....', '...111...', '..11111..', '.1111111.', '.........', '.........', '.........'],
    d: ['.........', '.........', '.........', '.1111111.', '..11111..', '...111...', '....1....', '.........', '.........'],
    jump: ['.........', '...111...', '..1...1..', '.1.....1.', '.1.....1.', '.1111111.', '.1.....1.', '.1.....1.', '.........'],
    act: ['.........', '.1111111.', '.1.......', '.1.......', '.111111..', '.1.......', '.1.......', '.1111111.', '.........'],
    boost: ['.........', '.111111..', '.1.....1.', '.1.....1.', '.111111..', '.1.....1.', '.1.....1.', '.111111..', '.........']
  };
  function icon(name, fg, bg) { var rows = ICONS[name], c = V.mk(13, 13), g = c.g; g.fillStyle = '#05020d'; g.fillRect(0, 0, 13, 13); g.fillStyle = bg; g.fillRect(1, 1, 11, 11); g.fillStyle = '#05020d'; for (var y = 1; y < 12; y++) for (var x = 1; x < 12; x++) if (((x + y) & 1) === 0 && y > 9) g.fillRect(x, y, 1, 1); g.fillStyle = fg; for (y = 0; y < 9; y++) for (x = 0; x < 9; x++) if (rows[y][x] === '1') g.fillRect(x + 2, y + 2, 1, 1); return c; }
  var host, pad, btns = {};
  function mkBtn(parent, id, label, onClick) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn'; b.id = 'b-' + id; b.setAttribute('aria-label', label); b.title = label;
    b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); onClick(); b.blur(); });
    b.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    parent.appendChild(b); btns[id] = b; return b;
  }
  function paint(b, name, hot) { b.innerHTML = ''; var c = icon(name, hot ? '#05020d' : '#efe6ff', hot ? '#c04df0' : '#2a0f4d'); c.className = 'ico'; b.appendChild(c); }
  U.refresh = function () {
    var m = V.music && V.music.muted;
    paint(btns.mute, m ? 'mute' : 'sound', false); btns.mute.setAttribute('aria-pressed', m ? 'true' : 'false');
    btns.mute.title = (m ? 'Unmute music' : 'Mute music') + ' — ' + (V.music ? V.music.credit : '');
    paint(btns.map, 'map', V.space && V.space.mapOpen); paint(btns.dice, 'dice'); paint(btns.full, 'full'); paint(btns.home, 'home');
    ['dice', 'home'].forEach(function (k) { btns[k].hidden = U.state === 'title'; }); btns.map.hidden = U.state !== 'space';
    btns.full.hidden = !document.documentElement.requestFullscreen;
    if (pad) pad.hidden = !U.touchOn || U.state === 'title';
    if (pad) { pad.querySelector('#t-jump').hidden = U.state === 'space'; pad.querySelector('#t-boost').hidden = U.state !== 'space'; pad.querySelector('#t-u').hidden = U.state !== 'space'; }
  };
  U.onMapKey = function () { if (btns.map) { btns.map.classList.add('on'); setTimeout(function () { btns.map.classList.remove('on'); }, 300); } };
  function toggleMap() { if (U.state === 'space') { V.space.mapOpen = !V.space.mapOpen; U.refresh(); } else if (U.state === 'surface') U.onMapKey(); }
  function padBtn(id, key, ico) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'pbtn tbtn'; b.id = 't-' + id; b.setAttribute('aria-label', id); var c = icon(ico, '#efe6ff', '#2a0f4d'); c.className = 'ico'; b.appendChild(c);
    var on = function (e) { e.preventDefault(); e.stopPropagation(); V.touch[key] = 1; V.tPress(key); b.classList.add('on'); if (b.setPointerCapture && e.pointerId != null) try { b.setPointerCapture(e.pointerId); } catch (er) { } if (V.music) V.music.start(); };
    var off = function (e) { e.preventDefault(); V.touch[key] = 0; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off); b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    return b;
  }
  U.init = function () {
    host = document.getElementById('ui'); pad = document.getElementById('pad');
    mkBtn(host, 'mute', 'Mute music', function () { if (V.music) V.music.toggle(); U.refresh(); });
    mkBtn(host, 'map', 'Galaxy map (M)', toggleMap);
    mkBtn(host, 'dice', 'New random galaxy', function () { V.game.newGalaxy(); });
    mkBtn(host, 'full', 'Fullscreen', function () { var d = document; if (d.fullscreenElement) d.exitFullscreen(); else d.documentElement.requestFullscreen().catch(function () { }); });
    mkBtn(host, 'home', 'Back to title', function () { if (V.save) V.save.write(); V.game.toTitle(); });
    U.touchOn = Q.has('touch') || (window.matchMedia && matchMedia('(pointer: coarse)').matches);
    if (pad) {
      var L = document.createElement('div'), R = document.createElement('div'); L.className = 'side'; R.className = 'side';
      L.appendChild(padBtn('l', 'l', 'l')); L.appendChild(padBtn('r', 'r', 'r'));
      R.appendChild(padBtn('d', 'd', 'd')); R.appendChild(padBtn('u', 'u', 'u')); R.appendChild(padBtn('boost', 'boost', 'boost')); R.appendChild(padBtn('jump', 'jump', 'jump')); R.appendChild(padBtn('act', 'act', 'act'));
      pad.appendChild(L); pad.appendChild(R);
    }
    document.addEventListener('fullscreenchange', U.refresh);
    V.layoutListeners.push(U.refresh); U.refresh();
  };
  U.update = function (dt) {
    U.hintT += dt; if (V.music) V.music.update(dt);
    U.fps = Math.round(V.fps);
    var mo = !!(V.space && V.space.mapOpen); if (mo !== U.lastMap) { U.lastMap = mo; U.refresh(); }
  };
  /* wordless HUD: one icon+number counter, and key caps that fade after the first few seconds of the first walk / flight */
  var CAPS = { surface: [['left'], ['right'], ['space', 21], ['E']], space: [['left'], ['right'], ['up'], ['shift', 11], ['E'], ['M']] };
  function hintSeen(k) { try { return localStorage.getItem('void:hint-' + k) === '1'; } catch (e) { return false; } }
  U.setState = function (s) { U.state = s; U.hintT = 0; U.hintOn = (s === 'surface' || s === 'space') && !U.touchOn && (Q.has('hints') || !hintSeen(s)); U.refresh(); };
  U.draw = function (g) {
    var W = V.W, H = V.H, n = V.surface.discCount || 0;
    if (n > 0 && !(V.space && V.space.mapOpen)) { V.glyph(g, 'scan', 3, 3, '#7affe8', '#05020d'); V.text(g, n, 10, 3, '#efe6ff', '#05020d'); }
    var caps = CAPS[U.state];
    if (U.hintOn && caps && !(V.space && V.space.mapOpen)) {
      var T = 7, a = U.hintT < .6 ? U.hintT / .6 : U.hintT > T - 1.5 ? (T - U.hintT) / 1.5 : 1;
      if (U.hintT > T) { U.hintOn = false; try { localStorage.setItem('void:hint-' + U.state, '1'); } catch (e) { } return; }
      var tw = 0; caps.forEach(function (c) { tw += (c[1] || 9) + 2; }); var x = Math.round((W - tw) / 2), y = H - 14;
      for (var i = 0; i < caps.length; i++) { var cw = caps[i][1] || 9; if (!(a < 1 && V.bayer(i * 3, 1) > a)) V.keycap(g, x, y, caps[i][0], cw); x += cw + 2; }
    }
    if (U.showFps) { var f = 'FPS ' + U.fps; V.text(g, f, W - V.textW(f) - 3, H - 8, '#7affe8', '#05020d'); }
  };
  U.init();
})();
