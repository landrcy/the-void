/* The Void — zoomable galaxy map: system -> sector -> a huge pixel spiral galaxy. Pins, routes, autopilot and jumps. */
(function () {
  'use strict';
  var V = window.VOID, G = V.Gen, Pg = V.prog, Sp = V.space, TAU = V.TAU, clamp = V.clamp, M = V.mouse;
  var LMIN = Math.log(10), LMAX = Math.log(40000);
  var GM = V.galmap = { z: Math.log(40), zt: Math.log(40), cx: 0, cy: 0, sel: null, revealed: false, disc: {} };
  var SCOL = { yellow: '#ffe890', orange: '#ffb060', red: '#ff7a5a', white: '#e8f0ff', blue: '#9ac0ff', giant: '#ff8a4a', neutron: '#c8e8ff', bh: '#c04df0' };
  /* the galaxy: a fixed spiral with home in an outer arm */
  var GAL = { x: 4.6e6, y: 1.3e6, R: 7.5e6 }, pts = null;
  function galaxyPts() {
    if (pts) return pts; pts = []; var r = V.rng(4711), arms = 4, i;
    for (i = 0; i < 9000; i++) { var t = Math.pow(r(), .62), rad = t * GAL.R, arm = i % arms, th = arm / arms * TAU + Math.log(1 + rad / 4e5) * 1.9 + (r() - .5) * (.55 - t * .25), sc = (r() - .5) * GAL.R * .05 * (1 + t); var x = GAL.x + Math.cos(th) * rad + sc, y = GAL.y + Math.sin(th) * rad * .82 + (r() - .5) * GAL.R * .04; var col = t < .12 ? (r() < .5 ? '#fff4d0' : '#ffe0a0') : t < .3 ? (r() < .6 ? '#e8d0ff' : '#ffd8a8') : (r() < .25 ? '#c04df0' : r() < .5 ? '#6a70c8' : r() < .8 ? '#9ab0ff' : '#ffffff'); pts.push([x, y, col, r()]); }
    for (i = 0; i < 2200; i++) { var a = r() * TAU, d = Math.pow(r(), 2.4) * GAL.R * .22; pts.push([GAL.x + Math.cos(a) * d, GAL.y + Math.sin(a) * d * .82, r() < .6 ? '#fff8e0' : '#ffd890', 1]); }
    return pts;
  }
  GM.revealAll = function () { GM.revealed = !GM.revealed; Pg.cheat.reveal = GM.revealed; };
  GM.markCell = function (ci, cj) { var k = ci + ',' + cj; if (!GM.disc[k]) { GM.disc[k] = 1; Pg.cells = GM.disc; } };
  GM.open = function () { Sp.mapOpen = true; var sh = Sp.ship; GM.cx = sh.x; GM.cy = sh.y; GM.z = GM.zt = Math.log(Math.hypot(sh.x, sh.y) < G.HOME_EDGE ? 40 : 90); GM.sel = null; };
  GM.keys = function () {
    if (!Sp.mapOpen && (V.keyPressed('m') || V.keyPressed('Tab'))) { GM.open(); return; }
    if (!Sp.mapOpen) { var sh = Sp.ship; GM.markCell(G.cellIndex(sh.x), G.cellIndex(sh.y)); return; }
    if (V.keyPressed('m') || V.keyPressed('Tab') || V.keyPressed('Escape')) { Sp.mapOpen = false; return; }
    var s = Math.exp(GM.z), dt = 1 / 60, inp = V.input; GM.cx += inp.x * s * 220 * dt; GM.cy += inp.y * s * 220 * dt;
    if (V.keyPressed('=') || V.keyPressed('+')) zoom(-.7); if (V.keyPressed('-') || V.keyPressed('_')) zoom(.7);
    if (V.keyPressed('Enter') || V.input.actPressed) go();
  };
  function zoom(d) { GM.zt = clamp(GM.zt + d, LMIN, LMAX); }
  GM.zoom = zoom;
  function canJump(t) { var sh = Sp.ship, d = Math.hypot(t.x - sh.x, t.y - sh.y), cells = d / G.CELL; if (!Pg.has('universal')) return null; if (Pg.has('galaxy')) return 'galaxy'; if (Pg.has('hyper') && cells < 14) return 'hyper'; if (cells < 4.5 && !Pg.has('autopilot')) return 'warp'; return null; }
  function canAuto(t) { var sh = Sp.ship, d = Math.hypot(t.x - sh.x, t.y - sh.y); if (!Pg.has('autopilot')) return false; if (!Pg.has('universal') && Math.hypot(t.x, t.y) > G.HOME_EDGE) return false; return d < G.CELL * 4.5; }
  function go() { var t = GM.sel; if (!t) return; if (canAuto(t)) { Sp.auto = { x: t.x, y: t.y }; Sp.mapOpen = false; V.game.toast('AUTOPILOT'); return; } var j = canJump(t); if (j) { Sp.mapOpen = false; var dest = t; if (t.kind === 'point') { var ci = G.cellIndex(t.x), cj = G.cellIndex(t.y), best = null; for (var r = 0; r < 4 && !best; r++) for (var j2 = -r; j2 <= r; j2++) for (var i = -r; i <= r; i++) { var p = G.peek(ci + i, cj + j2); if (p && !best) best = p; } if (best) dest = { x: best.x + 700, y: best.y - 260 }; } else dest = { x: t.x + (t.r ? t.r + 400 : 700), y: t.y - 200 }; V.story.warpTo(dest, true); return; } GM.deny = .5; }
  GM.go = go;
  function toScreen(x, y, s) { return [Math.round((x - GM.cx) / s + V.W / 2), Math.round((y - GM.cy) / s + V.H / 2)]; }
  function cellPx(s) { return G.CELL / s; }
  GM.draw = function (g, dt) {
    dt = dt || 1 / 60; var W = V.W, H = V.H, sh = Sp.ship; GM.z += (GM.zt - GM.z) * (1 - Math.exp(-7 * dt)); var s = Math.exp(GM.z), i, j;
    /* mouse: wheel zoom about the cursor, drag pans, click selects */
    var cands = [];
    g.fillStyle = '#05020d'; g.fillRect(0, 0, W, H);
    var galA = clamp((Math.log(s) - Math.log(900)) / (Math.log(5000) - Math.log(900)), 0, 1), secA = clamp(1 - (Math.log(s) - Math.log(1800)) / (Math.log(6000) - Math.log(1800)), 0, 1) * clamp((Math.log(s) - Math.log(40)) / (Math.log(120) - Math.log(40)), 0, 1), sysA = clamp(1 - (Math.log(s) - Math.log(60)) / (Math.log(160) - Math.log(60)), 0, 1);
    /* galaxy layer */
    if (galA > 0) { var P = galaxyPts(); for (i = 0; i < P.length; i++) { var q = P[i], px = Math.round((q[0] - GM.cx) / s + W / 2), py = Math.round((q[1] - GM.cy) / s + H / 2); if (px < 0 || py < 0 || px >= W || py >= H) continue; if (V.bayer(px, py) > galA * (.55 + q[3] * .45)) continue; g.fillStyle = q[2]; g.fillRect(px, py, 1, 1); } }
    /* sector layer: one dot per star system */
    if (secA > 0) {
      var cp = cellPx(s), i0 = G.cellIndex(GM.cx - W / 2 * s), i1 = G.cellIndex(GM.cx + W / 2 * s), j0 = G.cellIndex(GM.cy - H / 2 * s), j1 = G.cellIndex(GM.cy + H / 2 * s), step = cp < 2 ? Math.ceil(2 / cp) : 1;
      if (cp > 10) { g.fillStyle = '#140c2c'; for (i = i0; i <= i1 + 1; i++) { var gx = Math.round((i * G.CELL - G.CELL / 2 - GM.cx) / s + W / 2); for (var yy = 0; yy < H; yy += 3) g.fillRect(gx, yy, 1, 1); } for (j = j0; j <= j1 + 1; j++) { var gy = Math.round((j * G.CELL - G.CELL / 2 - GM.cy) / s + H / 2); for (var xx = 0; xx < W; xx += 3) g.fillRect(xx, gy, 1, 1); } }
      for (j = j0; j <= j1; j += step) for (i = i0; i <= i1; i += step) {
        var p = G.peek(i, j); if (!p) continue; var sp = toScreen(p.x, p.y, s); if (sp[0] < 0 || sp[1] < 0 || sp[0] >= W || sp[1] >= H) continue; if (V.bayer(sp[0], sp[1]) > secA) continue;
        var known = GM.revealed || GM.disc[i + ',' + j] || (i === 0 && j === 0), col = p.form === 'bh' ? SCOL.bh : SCOL[p.skind] || '#ffffff';
        if (known) { g.fillStyle = col; g.fillRect(sp[0], sp[1], 1, 1); if (cp > 5) { g.fillRect(sp[0] - 1, sp[1], 3, 1); g.fillRect(sp[0], sp[1] - 1, 1, 3); } if (cp > 14) { g.fillStyle = '#ffffff'; g.fillRect(sp[0], sp[1], 1, 1); } }
        else { g.fillStyle = '#3a3460'; if (cp > 3 || V.bayer(i, j) < .5) g.fillRect(sp[0], sp[1], 1, 1); }
        if (cp > 4) cands.push({ x: p.x, y: p.y, sx: sp[0], sy: sp[1], kind: 'system', known: known });
      }
    }
    /* system layer: orbits + bodies */
    if (sysA > 0) {
      var cs = G.cellsNear(GM.cx, GM.cy, Math.max(W, H) * s * .6); for (var c = 0; c < cs.length; c++) { var cell = cs[c]; G.updateCell(cell, G.t);
        for (var b = 0; b < cell.bodies.length; b++) { var bd = cell.bodies[b]; if (bd.type === 'asteroid' && s > 25) continue; if (bd.type === 'dyson' && s > 25) continue; var bp = toScreen(bd.x, bd.y, s); if (bp[0] < -20 || bp[1] < -20 || bp[0] > W + 20 || bp[1] > H + 20) continue; if (V.bayer(bp[0], bp[1]) > sysA) continue;
          var o = bd.orbit; if (o && !o.parent && !bd.isStar && bd.type !== 'asteroid' && bd.type !== 'comet') { var oc = toScreen(o.ox, o.oy, s), orr = o.a / s; if (orr > 4 && orr < W * 2) { g.fillStyle = '#1e1640'; var n = Math.max(24, Math.round(orr * TAU / 5)); for (var k = 0; k < n; k++) { var a = k / n * TAU, ox = Math.round(oc[0] + Math.cos(a) * orr), oy = Math.round(oc[1] + Math.sin(a) * orr); if (ox >= 0 && oy >= 0 && ox < W && oy < H) g.fillRect(ox, oy, 1, 1); } } }
          var rp = Math.max(bd.isStar ? 2 : 1, Math.round(bd.r / s)); g.fillStyle = bd.isBH ? '#c04df0' : bd.dot || '#8888aa';
          if (rp <= 1) g.fillRect(bp[0], bp[1], 1, 1); else for (var yy2 = -rp; yy2 <= rp; yy2++) { var hw = Math.round(Math.sqrt(rp * rp - yy2 * yy2)); g.fillRect(bp[0] - hw, bp[1] + yy2, hw * 2 + 1, 1); }
          if (bd.ring && rp > 2) { g.fillStyle = '#c8b890'; g.fillRect(bp[0] - Math.round(rp * 2), bp[1], Math.round(rp * 4) + 1, 1); }
          if (bd.type !== 'asteroid') cands.push({ x: bd.x, y: bd.y, r: bd.r, sx: bp[0], sy: bp[1], kind: 'body', body: bd, known: true });
        } }
    }
    /* home boundary ring */
    if (!Pg.has('universal')) { var hc = toScreen(0, 0, s), hr = G.HOME_EDGE / s; if (hr > 3 && hr < W * 3) { g.fillStyle = '#5a2a8a'; var hn = Math.max(40, Math.round(hr * TAU / 3)); for (i = 0; i < hn; i++) { if (i % 2) continue; var ha = i / hn * TAU; g.fillRect(Math.round(hc[0] + Math.cos(ha) * hr), Math.round(hc[1] + Math.sin(ha) * hr), 1, 1); } } }
    /* route to the selection */
    var shp = toScreen(sh.x, sh.y, s);
    if (GM.sel) { var tp = toScreen(GM.sel.x, GM.sel.y, s), ok = canAuto(GM.sel) || canJump(GM.sel), L = Math.max(1, Math.hypot(tp[0] - shp[0], tp[1] - shp[1])); g.fillStyle = ok ? '#7affe8' : '#5a4a7a'; for (var l = 0; l < L; l += 2) { if (((l >> 1) + Math.floor(V.time * 8)) % 3 === 0) continue; var lx = Math.round(shp[0] + (tp[0] - shp[0]) * l / L), ly = Math.round(shp[1] + (tp[1] - shp[1]) * l / L); if (lx >= 0 && ly >= 0 && lx < W && ly < H) g.fillRect(lx, ly, 1, 1); } var bl = Math.floor(V.time * 3) & 1; g.fillStyle = '#ffffff'; g.fillRect(tp[0] - 3 - bl, tp[1] - 3 - bl, 2, 1); g.fillRect(tp[0] - 3 - bl, tp[1] - 3 - bl, 1, 2); g.fillRect(tp[0] + 2 + bl, tp[1] - 3 - bl, 2, 1); g.fillRect(tp[0] + 3 + bl, tp[1] - 3 - bl, 1, 2); g.fillRect(tp[0] - 3 - bl, tp[1] + 3 + bl, 2, 1); g.fillRect(tp[0] - 3 - bl, tp[1] + 2 + bl, 1, 2); g.fillRect(tp[0] + 2 + bl, tp[1] + 3 + bl, 2, 1); g.fillRect(tp[0] + 3 + bl, tp[1] + 2 + bl, 1, 2); }
    if (Sp.auto) { var ap = toScreen(Sp.auto.x, Sp.auto.y, s); V.glyph(g, 'auto', ap[0] - 2, ap[1] - 8, '#7affe8', '#05020d'); }
    /* pins, home, you */
    Pg.pins.forEach(function (p) { var pp = toScreen(p.x, p.y, s); if (pp[0] < 2 || pp[1] < 2 || pp[0] > W - 6 || pp[1] > H - 6) return; V.glyph(g, p.icon === 'pin' ? 'pin' : p.icon, pp[0] - 2, pp[1] - 6, '#ffe07a', '#05020d'); g.fillStyle = '#ffe07a'; g.fillRect(pp[0], pp[1], 1, 1); cands.push({ x: p.x, y: p.y, sx: pp[0], sy: pp[1], kind: 'pin', pin: p, known: true }); });
    var hm = toScreen(0, 0, s); if (hm[0] > 3 && hm[1] > 3 && hm[0] < W - 3 && hm[1] < H - 3 && s > 60) { g.fillStyle = '#c04df0'; g.fillRect(hm[0] - 2, hm[1] - 2, 5, 1); g.fillRect(hm[0] - 2, hm[1] + 2, 5, 1); g.fillRect(hm[0] - 2, hm[1] - 2, 1, 5); g.fillRect(hm[0] + 2, hm[1] - 2, 1, 5); }
    if (Math.floor(V.time * 3) % 3) { g.fillStyle = '#ffffff'; g.fillRect(shp[0] - 1, shp[1], 3, 1); g.fillRect(shp[0], shp[1] - 1, 1, 3); }
    /* scale bar: little dots, one per order of magnitude */
    var lvl = Math.round((GM.z - LMIN) / (LMAX - LMIN) * 6); for (i = 0; i <= 6; i++) { g.fillStyle = i === lvl ? '#efe6ff' : '#3a3060'; g.fillRect(W - 6, 20 + (6 - i) * 4, 2, 2); }
    V.glyph(g, 'planet', W - 9, 14, '#8a7ab8'); V.glyph(g, 'galaxy', W - 9, 50, '#8a7ab8');
    /* input */
    var overUI = Pg.hitTest && Pg.hitTest(M.x, M.y);
    if (M.wheel && !overUI) { var before = [(M.x - W / 2) * s + GM.cx, (M.y - H / 2) * s + GM.cy]; zoom(M.wheel > 0 ? .35 : -.35); GM.z = GM.zt; var s2 = Math.exp(GM.z); GM.cx = before[0] - (M.x - W / 2) * s2; GM.cy = before[1] - (M.y - H / 2) * s2; M.wheel = 0; }
    if (M.down && !overUI && (M.dragX || M.dragY)) { GM.cx -= M.dragX * s; GM.cy -= M.dragY * s; M.dragX = M.dragY = 0; }
    if (M.released && !overUI && M.moved < 4 && !M.consumed) { var best = null, bdist = 7; cands.forEach(function (c) { var d = Math.hypot(c.sx - M.x, c.sy - M.y); if (d < bdist) { bdist = d; best = c; } }); GM.sel = best || { x: (M.x - W / 2) * s + GM.cx, y: (M.y - H / 2) * s + GM.cy, kind: 'point' }; if (V.sfx) V.sfx('tick'); }
    /* icon buttons */
    var by = H - 13, bx = (W >> 1) - 46;
    Pg.iconBtn(g, 'gm:in', bx, by, 'plus', '#efe6ff', function () { zoom(-.8); }, 'ZOOM IN');
    Pg.iconBtn(g, 'gm:out', bx + 13, by, 'minus', '#efe6ff', function () { zoom(.8); }, 'ZOOM OUT');
    Pg.iconBtn(g, 'gm:ctr', bx + 26, by, 'center', '#efe6ff', function () { GM.cx = sh.x; GM.cy = sh.y; }, 'CENTER');
    Pg.iconBtn(g, 'gm:gal', bx + 39, by, 'galaxy', '#c8a8ff', function () { GM.zt = GM.zt > Math.log(3000) ? Math.log(40) : LMAX; if (GM.zt === LMAX) { GM.cx = GAL.x * .5; GM.cy = GAL.y * .5; } else { GM.cx = sh.x; GM.cy = sh.y; } }, 'GALAXY');
    var t = GM.sel, au = t && canAuto(t), jp = t && canJump(t), sx0 = bx + 56;
    if (t) {
      if (GM.deny > 0) { GM.deny -= dt; sx0 += Math.round(Math.sin(GM.deny * 60) * 2); }
      Pg.iconBtn(g, 'gm:go', sx0, by, au ? 'auto' : jp === 'galaxy' ? 'galaxy' : jp ? 'hyper' : 'lock', au || jp ? '#7affe8' : '#ff6a6a', go, au ? 'AUTOPILOT' : jp ? 'JUMP' : (Pg.has('universal') ? 'NEEDS HYPERSPACE' : 'NEEDS UNIVERSAL DRIVE'));
      var pinned = t.kind === 'pin'; Pg.iconBtn(g, 'gm:pin', sx0 + 13, by, pinned ? 'cross' : 'pin', '#ffe07a', function () { if (pinned) { Pg.pins.splice(Pg.pins.indexOf(t.pin), 1); GM.sel = null; } else { var p = Pg.pin(t.x, t.y, 'pin'); GM.sel = { x: p.x, y: p.y, kind: 'pin', pin: p }; } if (V.save) V.save.write(); }, pinned ? 'UNPIN' : 'PIN');
    }
    Pg.iconBtn(g, 'gm:x', W - 13, 2, 'close', '#efe6ff', function () { Sp.mapOpen = false; }, 'CLOSE');
    /* counters */
    var n1 = String(V.game.visitedCount), n2 = String(Object.keys(GM.disc).length), cx0 = 4; V.glyph(g, 'planet', cx0, 4, '#c04df0', '#05020d'); V.text(g, n1, cx0 + 7, 4, '#efe6ff', '#05020d'); cx0 += 7 + V.textW(n1) + 6; V.glyph(g, 'star', cx0, 4, '#ffe890', '#05020d'); V.text(g, n2, cx0 + 7, 4, '#efe6ff', '#05020d');
  };
})();
