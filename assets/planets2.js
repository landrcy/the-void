/* The Void — stars, black holes, exotic shapes (donut / cube / ringworld), stations, wrecks, nebulae, comets. */
(function () {
  'use strict';
  var V = window.VOID, TAU = V.TAU, P = V.planets;
  function pk(c) { return (255 << 24) | ((c[2] | 0) << 16) | ((c[1] | 0) << 8) | (c[0] | 0); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  /* ---------- generic z-buffer splat renderer ---------- */
  /* gen(emit) calls emit(x,y,z,nx,ny,nz,rgb) in view space (x right, y down, z toward viewer), units of pixels from the centre */
  P.splat = function (R, size, light, gen, ambient) {
    var cv = V.mk(size, size), g = cv.g, zb = new Float32Array(size * size).fill(-1e9), col = new Uint32Array(size * size), c0 = size / 2;
    var a = light ? light.ang : 0, el = .3, Lx = Math.cos(a) * Math.cos(el), Ly = Math.sin(a) * Math.cos(el), Lz = Math.sin(el), lc = light && light.col ? light.col : [255, 244, 224], hasL = !!light;
    gen(function (x, y, z, nx, ny, nz, c, emis) {
      var px = Math.floor(x + c0), py = Math.floor(y + c0); if (px < 0 || py < 0 || px >= size || py >= size) return; var k = py * size + px; if (z <= zb[k]) return; zb[k] = z;
      var dot = hasL ? nx * Lx + ny * Ly + nz * Lz : -1, v = (dot + .06) / .86; v = v < 0 ? 0 : v > 1 ? 1 : v; var lv = v * 3, li = lv | 0; if (lv - li > V.bayer(px, py)) li++; if (li > 3) li = 3;
      var f = [.14, .42, .76, 1.04][li], r, gg, b;
      if (li === 0) { r = c[0] * .15 + 9; gg = c[1] * .13 + 6; b = c[2] * .19 + 26; } else { r = c[0] * f * (li >= 2 ? lc[0] / 255 : 1) + (li === 1 ? 14 : 0); gg = c[1] * f * (li >= 2 ? lc[1] / 255 : 1) + (li === 1 ? 8 : 0); b = c[2] * f * (li >= 2 ? lc[2] / 255 : 1) + (li === 1 ? 30 : 0); }
      if (emis && li <= 1) { r = emis[0]; gg = emis[1]; b = emis[2]; }
      col[k] = pk([Math.min(255, r), Math.min(255, gg), Math.min(255, b)]);
    });
    var img = g.createImageData(size, size), u = new Uint32Array(img.data.buffer); for (var i = 0; i < col.length; i++) if (zb[i] > -1e8) u[i] = col[i];
    g.putImageData(img, 0, 0); cv.cx = c0; cv.cy = c0; return cv;
  };
  var TERR = ['ocean', 'earth', 'desertA', 'jungle'];
  function terrCol(b, x, y, z, s) {
    var lut = V.planets.lutOf(b.palKey && P.PAL[b.palKey] ? b.palKey : (b.type === 'cube' ? 'jungle' : 'ocean'));
    var h = clamp(V.fbm3(x * .09 + s, y * .09, z * .09, b.seed & 255, 4) * 300 - 20, 0, 255) | 0; return { c: lut[h], h: h };
  }
  P.lutOf = function (key) { var bands = P.PAL[key], lut = [], bi = 0; for (var h = 0; h < 256; h++) { while (h >= bands[bi][0] && bi < bands.length - 1) bi++; lut.push(V.hex(bands[bi][1])); } return lut; };

  P.renderShape = function (b, R, light) {
    var size = Math.ceil(R * 2.7) + 6, t = b.type, r = V.rng(b.seed + 3), rot = r() * TAU, tilt = .75 + r() * .45, ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(rot), sr = Math.sin(rot);
    return P.splat(R, size, light, function (emit) {
      function view(x, y, z, nx, ny, nz, c, em) {
        var x1 = x * cr - y * sr, y1 = x * sr + y * cr, nx1 = nx * cr - ny * sr, ny1 = nx * sr + ny * cr;
        emit(x1, y1 * ct - z * st, y1 * st + z * ct, nx1, ny1 * ct - nz * st, ny1 * st + nz * ct, c, em);
      }
      var i, j;
      if (t === 'donut') {
        var Rm = R * .72, rm = R * .30, n1 = Math.ceil(TAU * Rm * 2.2), n2 = Math.ceil(TAU * rm * 2.4);
        for (i = 0; i < n1; i++) { var th = i / n1 * TAU, cth = Math.cos(th), sth = Math.sin(th); for (j = 0; j < n2; j++) { var ph = j / n2 * TAU, cp = Math.cos(ph), sp = Math.sin(ph), rr = Rm + rm * cp, x = rr * cth, y = rr * sth, z = rm * sp, tc = terrCol(b, x, y, z, 1); view(x, y, z, cp * cth, cp * sth, sp, tc.c, (tc.h > 137 && tc.h < 200 && V.hf(i >> 1, j >> 1, b.seed) > .93) ? [255, 214, 120] : null); } }
      } else if (t === 'cube') {
        var n = Math.ceil(R * 2.6), A = R * .66, faces = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
        for (var f = 0; f < 6; f++) { var nn = faces[f]; for (i = 0; i < n; i++) for (j = 0; j < n; j++) { var u = (i / n * 2 - 1), v = (j / n * 2 - 1), x, y, z; if (nn[0]) { x = nn[0] * 1; y = u; z = v; } else if (nn[1]) { x = u; y = nn[1] * 1; z = v; } else { x = u; y = v; z = nn[2] * 1; } var bev = Math.max(Math.abs(u), Math.abs(v)); var tc = terrCol(b, x * A, y * A, z * A, 5), cc = tc.c; if (bev > .93) cc = [cc[0] * .6 + 60, cc[1] * .6 + 60, cc[2] * .6 + 70]; view(x * A, y * A, z * A, nn[0] * .85 + (nn[0] ? 0 : x * .4), nn[1] * .85 + (nn[1] ? 0 : y * .4), nn[2] * .85 + (nn[2] ? 0 : z * .4), cc, null); } }
      } else if (t === 'ringworld') {
        var Rr = R * .95, hw = R * .26, n3 = Math.ceil(TAU * Rr * 2.4), n4 = Math.ceil(hw * 2 * 2.4), lutA = P.lutOf('jungle'), lutB = P.lutOf('ocean');
        for (i = 0; i < n3; i++) { var th3 = i / n3 * TAU, c3 = Math.cos(th3), s3 = Math.sin(th3); for (j = 0; j < n4; j++) { var yy = (j / n4 * 2 - 1) * hw, x3 = Rr * c3, z3 = Rr * s3;
          /* inner surface (land + sea + lights) */
          var h = clamp(V.fbm2(i * .05, j * .12, b.seed, 4) * 300 - 20, 0, 255) | 0; var ic = lutB[h]; view(x3 * .985, yy, z3 * .985, -c3, 0, -s3, ic, (h > 137 && h < 210 && V.hf(i, j, b.seed) > .96) ? [255, 220, 130] : null);
          /* outer hull */
          var rib = (i % 9 < 1) ? 1.25 : 1, hc = 118 * rib; view(x3, yy, z3, c3, 0, s3, [hc, hc * 1.02, hc * 1.18], (j === 0 || j === n4 - 1) && V.hf(i, 0, b.seed) > .5 ? [150, 210, 255] : null); } }
        /* rim walls */
        for (i = 0; i < n3; i++) { var th4 = i / n3 * TAU, c4 = Math.cos(th4), s4 = Math.sin(th4); for (var sg = -1; sg <= 1; sg += 2) for (var q = 0; q < 6; q++) { var rd = Rr * (.985 + .015 * (q / 5)); view(rd * c4, sg * hw, rd * s4, 0, sg, 0, [150, 150, 175], null); } }
      }
    });
  };

  /* ---------- stations ---------- */
  P.renderStation = function (b, R, light) {
    var size = Math.ceil(R * 2.8) + 6, r = V.rng(b.seed + 11), rot = r() * TAU, tilt = .8 + r() * .4, ct = Math.cos(tilt), st = Math.sin(tilt), cr = Math.cos(rot), sr = Math.sin(rot), derelict = b.derelict;
    return P.splat(R, size, light, function (emit) {
      function view(x, y, z, nx, ny, nz, c, em) { var x1 = x * cr - y * sr, y1 = x * sr + y * cr, nx1 = nx * cr - ny * sr, ny1 = nx * sr + ny * cr; emit(x1, y1 * ct - z * st, y1 * st + z * ct, nx1, ny1 * ct - nz * st, ny1 * st + nz * ct, c, em); }
      var metal = [150, 156, 178], dark = [90, 96, 120], panel = derelict ? [60, 70, 90] : [50, 84, 170], i, j, k;
      var Rr = R * .62, rm = Math.max(.9, R * .07), n = Math.ceil(TAU * Rr * 2.4);
      for (i = 0; i < n; i++) { var th = i / n * TAU, c = Math.cos(th), s = Math.sin(th); for (j = 0; j < 6; j++) { var ph = j / 6 * TAU; var cp = Math.cos(ph), sp = Math.sin(ph); view((Rr + rm * cp) * c, (Rr + rm * cp) * s, rm * sp, cp * c, cp * s, sp, (i % 12 < 2) ? dark : metal, (!derelict && i % 18 === 5 && sp > .5) ? [255, 226, 140] : null); } }
      var nh = Math.ceil(R * 4); for (i = 0; i < nh; i++) for (j = 0; j < 8; j++) { var a = i / nh * TAU, bb = (j / 8 - .5) * Math.PI, rh = R * .15; var cz = Math.cos(bb); view(rh * cz * Math.cos(a), rh * cz * Math.sin(a), rh * Math.sin(bb) * 1.6, cz * Math.cos(a), cz * Math.sin(a), Math.sin(bb), metal, null); }
      for (k = 0; k < 4; k++) { var sa = k * Math.PI / 2 + .3; for (var l = 0; l < Math.ceil(Rr * 2); l++) { var rr = R * .12 + l / (Rr * 2) * (Rr - R * .12); view(Math.cos(sa) * rr, Math.sin(sa) * rr, 0, 0, 0, 1, dark, null); } }
      /* solar arrays along the hub axis */
      for (var sg = -1; sg <= 1; sg += 2) { var np = Math.ceil(R * .5) , w = R * .28; for (i = 0; i < Math.ceil(R * 1.3); i++) for (j = 0; j < np * 3; j++) { var x = sg * (R * .2 + i / 1.9), y = (j / (np * 3) - .5) * 2 * w * 1.8; if (Math.abs(x) > R * 1.2) continue; var gl = ((i % 4 === 0) || ((j % 5) === 0)); view(R * .02 + 0 * x, y, x * .9, 0, 0.7, .7, gl ? [150, 170, 230] : panel, null); } }
    });
  };

  /* ---------- wrecks (broken hulls) ---------- */
  P.renderWreck = function (b, R, light) {
    var size = Math.ceil(R * 2.4) + 6, cv = V.mk(size, size), g = cv.g, img = g.createImageData(size, size), u = new Uint32Array(img.data.buffer), r = V.rng(b.seed + 21), rot = b.rot || r() * TAU, ca = Math.cos(rot), sa = Math.sin(rot), c0 = size / 2;
    var L = light ? [Math.cos(light.ang), Math.sin(light.ang)] : [-1, -1], hasL = !!light;
    var len = R * 1.0, wid = R * (.22 + r() * .12), cut = .15 + r() * .45, ang = r() * .7 + .15;
    var pal = [[44, 48, 66], [78, 84, 108], [112, 120, 148], [160, 168, 196], [196, 204, 228]], rust = [[88, 52, 40], [130, 78, 52]];
    for (var j = 0; j < size; j++) for (var i = 0; i < size; i++) {
      var dx = i + .5 - c0, dy = j + .5 - c0, x = dx * ca + dy * sa, y = -dx * sa + dy * ca;
      var t = x / len; if (t < -1 || t > 1) continue;
      var half = wid * (t < .6 ? (1 - Math.pow(Math.abs(t - (-.15)) / 1.15, 2.2)) * 1.05 + .08 : (1 - t) / .4 * .45 + .0);
      var jag = (V.noise2(i * .35, j * .35, b.seed) - .5) * wid * .5; if (t > cut) { var cutm = (t - cut) * ang; if (y > -half + jag + cutm * len * .5 * (t - cut + .2) * 2) { /* broken-off */ } }
      var inside = Math.abs(y) < half + jag * .3; if (!inside) { /* fin pieces */ if (t > -.7 && t < -.35 && Math.abs(y) > half && Math.abs(y) < half + wid * 1.1 * (1 - (t + .7) / .35 * .7) && y > 0) inside = true; }
      /* hull break: the aft part is torn */
      if (t > cut + (V.noise2(y * .3 + 4, 0, b.seed + 2) - .5) * .25 && y > wid * .1 * Math.sin(t * 9 + b.seed)) inside = inside && (t < cut + .12 || y < 0);
      if (t > .78) inside = false;
      if (!inside) continue;
      var nrm = y / (half + .01), lam = hasL ? clamp(.55 + .45 * (-(nrm * (-sa * L[0] + ca * L[1]) * -1)) + .1 * (t + 1) * .5, 0, 1) : .25;
      lam = clamp(lam + (V.noise2(i * .5, j * .5, b.seed + 1) - .5) * .35, 0, 1);
      var lv = lam * 4.2, li = lv | 0; if (lv - li > V.bayer(i, j)) li++; li = Math.min(4, li); var col = pal[li];
      if (V.noise2(i * .22 + 8, j * .22, b.seed + 9) > .68) col = rust[li > 2 ? 1 : 0];
      if (Math.abs(y) < half * .35 && ((x * 2 | 0) % 7 === 0) && R > 8) col = [255, 220, 140];
      u[j * size + i] = pk(col);
    }
    g.putImageData(img, 0, 0); cv.cx = c0; cv.cy = c0; return cv;
  };

  /* ---------- stars ---------- */
  var STAR = {
    yellow: ['#ffffff', '#fff3b0', '#ffd45a', '#ffa530', '#ff7a20'], orange: ['#fff2d0', '#ffc878', '#ff9a3a', '#e8641c', '#a8380e'], red: ['#ffd0b0', '#ff8a60', '#e8502c', '#b82c1c', '#701810'],
    white: ['#ffffff', '#f4f8ff', '#cfe2ff', '#9ec2ff', '#6e96e8'], blue: ['#ffffff', '#e0f0ff', '#a8d2ff', '#6aa8ff', '#3c6ee0'], giant: ['#ffd8b0', '#ff9460', '#e0502c', '#a82818', '#5a1410'], neutron: ['#ffffff', '#f4f8ff', '#bfd8ff', '#8cb2ff', '#5a82e0']
  };
  P.STAR = STAR;
  P.renderStar = function (b, R) {
    var cols = STAR[b.skind || 'yellow'].map(V.hex), pad = Math.ceil(R * .9) + 3, size = Math.ceil(R * 2) + pad * 2, cv = V.mk(size, size), g = cv.g, img = g.createImageData(size, size), u = new Uint32Array(img.data.buffer), c0 = size / 2, giant = b.skind === 'giant';
    for (var j = 0; j < size; j++) for (var i = 0; i < size; i++) {
      var dx = i + .5 - c0, dy = j + .5 - c0, d = Math.sqrt(dx * dx + dy * dy), t = d / R;
      if (t <= 1) {
        var gran = giant ? V.fbm2(i * .12, j * .12, b.seed, 3) : V.fbm2(i * .35, j * .35, b.seed, 2); var v = (1 - t * t) * .72 + gran * (giant ? .55 : .22) - .1; if (giant) v = (1 - t * t) * .5 + gran * .6;
        var lv = (1 - clamp(v, 0, 1)) * 3.99, li = lv | 0; if (lv - li > V.bayer(i, j)) li++; u[j * size + i] = pk(cols[Math.min(4, li)]);
      } else if (d < R + pad) {
        var k = (d - R) / pad, pr = Math.pow(1 - k, 2.2) * (giant ? .85 : .7); if (V.bayer(i, j) < pr) u[j * size + i] = pk(cols[k < .35 ? 2 : k < .65 ? 3 : 4]);
      }
    }
    g.putImageData(img, 0, 0); cv.cx = c0; cv.cy = c0; return cv;
  };
  /* animated extras (corona sparkles, pulsar beams) drawn per frame */
  P.drawStar = function (ctx, b, x, y, R, t) {
    R = Math.max(1, Math.round(R)); var key = 'star:' + b.id + ':' + R, cv = P.get(Object.assign(b, {}), R, null, 'star'); /* placeholder, replaced below */
  };
  var starCache = new Map();
  P.starSprite = function (b, R) { var k = b.id + '|' + R, c = starCache.get(k); if (!c) { c = P.renderStar(b, R); starCache.set(k, c); if (starCache.size > 80) starCache.delete(starCache.keys().next().value); } return c; };
  P.drawStarAt = function (ctx, b, x, y, R, t) {
    x = Math.round(x); y = Math.round(y);
    if (R < 2) { ctx.fillStyle = STAR[b.skind || 'yellow'][1]; ctx.fillRect(x, y, 1, 1); if (R >= 1) ctx.fillRect(x - 1, y, 3, 1), ctx.fillRect(x, y - 1, 1, 3); return; }
    var Ri = Math.max(2, Math.round(R)), s = P.starSprite(b, Ri); ctx.drawImage(s, Math.round(x - s.cx), Math.round(y - s.cy));
    if (b.skind === 'neutron') {
      var n = 2, ang = t * (V.reduced ? .6 : 2.4) + b.seed, len = Math.min(V.W * .7, 70 + Ri * 6);
      for (var k = 0; k < 2; k++) { var a = ang + k * Math.PI; for (var l = 3; l < len; l++) { var px = Math.round(x + Math.cos(a) * l), py = Math.round(y + Math.sin(a) * l); var f = 1 - l / len; if (V.bayer(px, py) > f * 1.05) continue; ctx.fillStyle = f > .6 ? '#e8f4ff' : f > .3 ? '#8cb2ff' : '#4a6ad0'; ctx.fillRect(px, py, 1, 1); if (l < len * .5 && (l & 1)) { ctx.fillStyle = '#4a6ad0'; ctx.fillRect(px + (Math.abs(Math.sin(a)) > .5 ? 1 : 0), py + (Math.abs(Math.sin(a)) > .5 ? 0 : 1), 1, 1); } } }
    }
    /* corona sparkles */
    var cols = STAR[b.skind || 'yellow'], m = Math.min(10, 3 + (Ri >> 3));
    for (var q = 0; q < m; q++) { var aa = q * 2.4 + t * (V.reduced ? .05 : .15) * (1 + (q % 3)), rr = Ri + 1 + Math.abs(Math.sin(t * .8 + q * 1.7)) * Math.max(2, Ri * .22); ctx.fillStyle = cols[q % 3 + 1]; ctx.fillRect(Math.round(x + Math.cos(aa) * rr), Math.round(y + Math.sin(aa) * rr), 1, 1); }
  };

  /* ---------- black hole (live, region-limited) ---------- */
  var DISC = ['#0b0220', '#2a0a52', '#5a14a0', '#8e2bd6', '#c04df0', '#ff6fe0', '#ffd2f8', '#ffffff'].map(function (h) { return pk(V.hex(h)); });
  var bhCv = null, bhImg = null, bhU = null;
  P.drawHole = function (ctx, cx, cy, rb, t, lensOnly) {
    rb = Math.max(2, rb); var R = Math.ceil(rb * 2.7), S = R * 2 + 2, W = V.W, H = V.H;
    if (cx + R < 0 || cy + R < 0 || cx - R > W || cy - R > H) return;
    if (!bhCv || bhCv.width < S || bhCv.height < S) { bhCv = V.mk(Math.max(S, 64), Math.max(S, 64)); bhImg = null; }
    var g = bhCv.g, img = g.createImageData(S, S), u = new Uint32Array(img.data.buffer), c0 = R + 1;
    var spin = t * (V.reduced ? .12 : .3), tilt = .34, rin = rb * 1.12, rout = rb * 2.5, rl = rb * 1.42, BLACK = pk([0, 0, 0]), ix = Math.round(cx) - c0, iy = Math.round(cy) - c0;
    for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
      var dx = x + .5 - c0, dy = y + .5 - c0, r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx), front = dy > 0, rry = Math.sqrt(dx * dx + (dy / tilt) * (dy / tilt)), inDisc = rry >= rin && rry <= rout, dd = 0;
      if (inDisc) { var k = (rry - rin) / (rout - rin), ang = Math.atan2(dy / tilt, dx), arm = .5 + .5 * Math.sin(ang * 2 - spin * 2.2 + k * 7), fine = V.noise2(ang * 3 + spin * 3, k * 9, 3); dd = Math.pow(1 - k, .9) * (.5 + .5 * arm) * (.75 + .5 * fine) * (1.3 + .6 * -dx / rout) * 1.25; }
      var ringd = Math.abs(r - rl) / (rb * .34), lens = 0;
      if (ringd < 1 && r > rb) lens = Math.pow(1 - ringd, 1.4) * (.55 + .22 * Math.sin((th - spin * .7) * 2 + 1.0) + .25 * V.noise2(th * 2 + spin * 2, r * .3, 8)) * (.8 + .5 * Math.abs(dy) / (r + .01));
      var photon = (r >= rb - .3 && r < rb + .9);
      if (r < rb) { if (!(front && inDisc && dy > rb * .35)) { u[y * S + x] = BLACK; continue; } }
      var best = Math.max(dd * (front || r > rb ? 1 : 0), lens * 1.05); if (!front && r < rb * 1.02) best = lens;
      if (photon) best = Math.max(best, .78 + .12 * Math.sin(th * 2 + spin * 3));
      if (best > .04) { var lv = 1 + best * 7.4, li = lv | 0; if (lv - li > V.bayer(x + ix, y + iy)) li++; if (best < .12 && V.bayer(x + ix, y + iy) > best * 8) li = 0; if (li > 0) u[y * S + x] = DISC[Math.min(7, li)]; }
    }
    g.putImageData(img, 0, 0); ctx.drawImage(bhCv, 0, 0, S, S, ix, iy, S, S);
  };

  /* ---------- nebula (drawn 1:1, deep parallax) ---------- */
  P.renderNebula = function (n) {
    var S = n.size || 176, cv = V.mk(S, S), g = cv.g, img = g.createImageData(S, S), u = new Uint32Array(img.data.buffer), cols = n.cols.map(V.hex), s = n.seed, c0 = S / 2;
    for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) {
      var dx = (i - c0) / c0, dy = (j - c0) / c0, d = Math.sqrt(dx * dx + dy * dy); if (d > 1) continue;
      var wx = V.fbm2(i * .018, j * .018, s, 3) * 2.2, wy = V.fbm2(i * .018 + 9, j * .018 + 9, s + 4, 3) * 2.2;
      var v = V.fbm2(i * .03 + wx, j * .03 + wy, s + 9, 5), m = Math.pow(1 - d, 1.1); v = (v - .38) * 3.2 * m;
      if (v <= .04) continue; var lv = clamp(v, 0, 1) * 3.9, li = lv | 0; if (lv - li > V.bayer(i, j)) li++; li = Math.min(3, li); if (li < 1) continue;
      var c = cols[li - 1]; u[j * S + i] = pk(c);
    }
    g.putImageData(img, 0, 0);
    /* embedded stars */
    var r = V.rng(s + 1); for (var k = 0; k < 18; k++) { g.fillStyle = r() < .3 ? '#ffffff' : '#d9c8ff'; g.fillRect(Math.floor(c0 + (r() - .5) * S * .7), Math.floor(c0 + (r() - .5) * S * .7), 1, 1); }
    return cv;
  };

  /* ---------- comet ---------- */
  P.drawComet = function (ctx, b, x, y, R, t, dirx, diry, power) {
    var len = Math.min(V.W * .9, (60 + power * 150)), px = -diry, py = dirx;
    for (var l = 2; l < len; l++) {
      var f = 1 - l / len, wd = 1 + l * .11;
      for (var m = -1; m <= 1; m += 2) { /* ion tail (blue, straight) */
        for (var q = 0; q < wd; q += 1) { var off = q * m * (l > 6 ? 1 : .5); var qx = Math.round(x + dirx * l + px * off * .9), qy = Math.round(y + diry * l + py * off * .9); var hv = V.hf(qx, qy, Math.floor(t * 5) + (b.seed & 7)); if (hv > f * (1 - q / (wd + 1)) * 1.1) continue; ctx.fillStyle = f > .65 ? '#e8f4ff' : f > .35 ? '#7fc4ff' : '#3a62d0'; ctx.fillRect(qx, qy, 1, 1); }
      }
      /* dust tail (curved, warm) */
      var cx = x + dirx * l * .92 + px * l * l * .0009 * 8, cy = y + diry * l * .92 + py * l * l * .0009 * 8;
      for (var q2 = -wd; q2 <= wd; q2 += 2) { var ex = Math.round(cx + px * q2 * .7), ey = Math.round(cy + py * q2 * .7); if (V.hf(ex, ey, 9 + Math.floor(t * 3)) > f * .75 * (1 - Math.abs(q2) / (wd + 1))) continue; ctx.fillStyle = f > .5 ? '#ffe8b0' : '#c89850'; ctx.fillRect(ex, ey, 1, 1); }
    }
  };

  /* ---------- dispatcher: draw any body at screen position with screen radius R ---------- */
  P.drawBody = function (ctx, b, sx, sy, R, t, light) {
    var type = b.type;
    if (b.isStar) { P.drawStarAt(ctx, b, sx, sy, R, t); return; }
    if (type === 'bh') { P.drawHole(ctx, sx, sy, R, t); return; }
    if (R < 1.2) { ctx.fillStyle = b.dot || '#aaa'; ctx.fillRect(Math.round(sx), Math.round(sy), 1, 1); return; }
    var Ri = Math.max(2, Math.round(R));
    if (type === 'comet') { var dxx = sx - (light ? sx + Math.cos(light.ang) : sx), n = light ? [-Math.cos(light.ang), -Math.sin(light.ang)] : [1, 0]; var pw = clamp(light && light.k != null ? light.k : .5, .1, 1); P.drawComet(ctx, b, sx, sy, R, t, n[0], n[1], pw); }
    if (b.ring) {
      var c0 = P.get(b, Ri, light, 'ring0'), c1 = P.get(b, Ri, light, 'ring1'), pl = P.get(b, Ri, light);
      ctx.drawImage(c0, Math.round(sx - c0.cx), Math.round(sy - c0.cy)); ctx.drawImage(pl, Math.round(sx - pl.cx), Math.round(sy - pl.cy)); ctx.drawImage(c1, Math.round(sx - c1.cx), Math.round(sy - c1.cy));
    } else { var cv = P.get(b, Ri, light); ctx.drawImage(cv, Math.round(sx - cv.cx), Math.round(sy - cv.cy)); }
  };
})();
