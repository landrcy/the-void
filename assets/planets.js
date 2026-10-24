/* The Void — planet / star / exotic body renderers. Everything is rendered into small offscreen canvases at INTEGER radii
   (nearest-sampled, dithered, limited ramps) and cached, so scaling with zoom never produces mixed pixel sizes. */
(function () {
  'use strict';
  var V = window.VOID, TAU = V.TAU, P = V.planets = {};
  function pk(c) { return (255 << 24) | ((c[2] | 0) << 16) | ((c[1] | 0) << 8) | (c[0] | 0); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }

  /* ---------- palettes: stepped bands (maxH, colour), dark -> light ---------- */
  var PAL = {
    earth: [[72, '#08225a'], [100, '#0d3a80'], [121, '#1a5db0'], [129, '#3f95d4'], [137, '#d9c98a'], [165, '#5aa24e'], [185, '#2f7a3d'], [205, '#cdac68'], [224, '#8a7d6a'], [256, '#f4f8ff']],
    ocean: [[70, '#071d52'], [105, '#0c3478'], [125, '#175aab'], [137, '#4aa0dc'], [143, '#e6d594'], [185, '#4ea74f'], [215, '#2b7340'], [240, '#9a9078'], [256, '#f6faff']],
    jungle: [[60, '#0f3a56'], [95, '#1f7a8c'], [110, '#64c2a8'], [130, '#2f8a3a'], [170, '#1f6a34'], [205, '#2b8a4a'], [235, '#145a2e'], [256, '#6fd08a']],
    desertA: [[40, '#5c2e1b'], [90, '#8d4a28'], [140, '#b86a38'], [190, '#d9904f'], [230, '#ebb676'], [256, '#f7d9a0']],
    desertB: [[40, '#6a2a30'], [90, '#97413a'], [140, '#c0614a'], [190, '#df8c66'], [230, '#f0b58e'], [256, '#fadcbd']],
    desertC: [[40, '#6b5a2a'], [90, '#977f3e'], [140, '#bf9f56'], [190, '#dcc078'], [230, '#ecd9a0'], [256, '#f7ecc6']],
    rockyG: [[40, '#26252b'], [90, '#443f4a'], [140, '#6a6470'], [190, '#908a96'], [230, '#b6b0b8'], [256, '#d8d2d6']],
    rockyB: [[40, '#2f211c'], [90, '#503630'], [140, '#785048'], [190, '#a07260'], [230, '#c89c84'], [256, '#e4c4ac']],
    rockyU: [[40, '#232a3a'], [90, '#3c4660'], [140, '#5e6a8a'], [190, '#8896b4'], [230, '#b0bcd6'], [256, '#d6deee']],
    iceA: [[50, '#41679a'], [100, '#6c97c6'], [150, '#a3c6e6'], [200, '#d1e6f6'], [256, '#f4faff']],
    iceB: [[50, '#3d4f98'], [100, '#6a7fc4'], [150, '#a0b0e6'], [200, '#d0d8f6'], [256, '#f2f4ff']],
    lava: [[60, '#18090f'], [100, '#2c1219'], [140, '#43202a'], [170, '#5a2c30'], [200, '#ff5a1c'], [230, '#ff9a2e'], [256, '#ffe27a']],
    crystalA: [[50, '#3b1b78'], [90, '#5f33b4'], [140, '#8f5ae0'], [190, '#c08cff'], [230, '#e6c4ff'], [256, '#ffffff']],
    crystalB: [[50, '#0e5560'], [90, '#16808a'], [140, '#2fb0b0'], [190, '#74e0d0'], [230, '#bff8ea'], [256, '#ffffff']],
    crystalC: [[50, '#7a1f4a'], [90, '#b02f72'], [140, '#e0569c'], [190, '#ff8cc0'], [230, '#ffc8e0'], [256, '#ffffff']],
    gasJ: [[40, '#6b3a22'], [80, '#9a5a30'], [120, '#c98a52'], [160, '#e8b886'], [200, '#f4dcb4'], [256, '#fff2da']],
    gasS: [[40, '#7a6a3a'], [80, '#a8955a'], [120, '#cfbd7e'], [160, '#e6d8a2'], [200, '#f4ecc8'], [256, '#fffbe6']],
    gasN: [[40, '#10307a'], [80, '#1d52b0'], [120, '#3b7fd8'], [160, '#6aa8ee'], [200, '#a6ccf8'], [256, '#e0f0ff']],
    gasP: [[40, '#4a2a7a'], [80, '#6e46a8'], [120, '#9a72cc'], [160, '#c4a0e6'], [200, '#e2caf6'], [256, '#f8eeff']],
    gasT: [[40, '#10504a'], [80, '#1a7a6e'], [120, '#36a898'], [160, '#72ccb8'], [200, '#b0ecdc'], [256, '#e6fff6']],
    venus: [[60, '#a8793a'], [110, '#cfa056'], [160, '#e6c27a'], [210, '#f4dea0'], [256, '#fff0c6']],
    jupiter: [[40, '#6b3a22'], [80, '#9a5a30'], [120, '#c98a52'], [160, '#e8b886'], [200, '#f4dcb4'], [238, '#fff2da'], [256, '#c4563a']],
    uranus: [[60, '#4aa8b4'], [120, '#6cc6d0'], [180, '#92dce2'], [230, '#b8eeee'], [256, '#e0ffff']],
    pluto: [[40, '#4a2e24'], [100, '#7e5236'], [150, '#a8805a'], [200, '#ceae86'], [256, '#f6ecdc']],
    io: [[40, '#5a3a14'], [100, '#a87e26'], [160, '#dcbc3c'], [210, '#eedc6a'], [256, '#fff8c0']],
    titan: [[60, '#7a4016'], [110, '#a8622a'], [160, '#c88238'], [210, '#e2a24c'], [256, '#f6cc7a']],
    moonG: [[40, '#2a2a32'], [90, '#45454f'], [140, '#6a6a76'], [190, '#908f9c'], [230, '#b4b3c0'], [256, '#d6d5df']]
  };
  var lutCache = {};
  function lutFor(key) {
    if (lutCache[key]) return lutCache[key]; var bands = PAL[key], lut = new Array(256), bi = 0;
    for (var h = 0; h < 256; h++) { while (h >= bands[bi][0] && bi < bands.length - 1) bi++; lut[h] = V.hex(bands[bi][1]); }
    return (lutCache[key] = lut);
  }
  P.PAL = PAL;

  /* ---------- surface map generation (equirectangular; unit-sphere noise = seamless) ---------- */
  var MW = 256, MH = 128;
  function smoothstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  P.mapFor = function (b) {
    if (b.map) return b.map;
    var type = b.type, seed = b.seed | 0, r = V.rng(seed), s = seed & 0xffff, Hh = new Uint8Array(MW * MH), C = new Uint8Array(MW * MH), E = new Uint8Array(MW * MH), D = null;
    var ox = r() * 50, oy = r() * 50, oz = r() * 50;
    var craters = [], i, j, k;
    var needCr = (type === 'rocky' || type === 'moon' || type === 'barren' || type === 'desert' || type === 'ice' || type === 'asteroid' || type === 'comet' || type === 'ruins');
    if (needCr) { var nc = type === 'asteroid' || type === 'comet' ? 14 : 34; for (k = 0; k < nc; k++) { var a = r() * TAU, z = r() * 2 - 1, q = Math.sqrt(1 - z * z), rad = (.05 + Math.pow(r(), 2.4) * .3); craters.push([Math.cos(a) * q, z, Math.sin(a) * q, rad]); } }
    var sites = null; if (type === 'crystal') { sites = []; for (k = 0; k < 46; k++) { var a2 = r() * TAU, z2 = r() * 2 - 1, q2 = Math.sqrt(1 - z2 * z2); sites.push([Math.cos(a2) * q2, z2, Math.sin(a2) * q2, r()]); } D = new Int8Array(MW * MH); }
    var storms = []; if (type === 'gas' || type === 'icegas') { var ns = 1 + (r() < .5 ? 1 : 0) + (r() < .3 ? 1 : 0); for (k = 0; k < ns; k++) storms.push({ lon: r() * TAU, lat: (r() * .9 - .45), rx: .15 + r() * .22, ry: .06 + r() * .06, sw: r() < .5 ? 1 : -1 }); }
    if (b.grs) storms = [{ lon: 1.2, lat: -.36, rx: .34, ry: .13, sw: 1, red: 1 }, { lon: 3.6, lat: -.6, rx: .1, ry: .04, sw: -1 }, { lon: 4.6, lat: -.6, rx: .09, ry: .04, sw: 1 }];
    if (b.darkSpot) storms = [{ lon: 2.2, lat: -.35, rx: .3, ry: .12, sw: 1, dark: 1 }];
    var bandsN = b.bandsN || (5 + Math.floor(r() * 9)), bandPh = r() * 9, cloudAmt = b.cloudAmt != null ? b.cloudAmt : 0, moistOff = r() * 40;
    for (j = 0; j < MH; j++) {
      var lat = (j + .5) / MH * Math.PI - Math.PI / 2, cl = Math.cos(lat), y = Math.sin(lat);
      for (i = 0; i < MW; i++) {
        var lon = (i + .5) / MW * TAU, x = cl * Math.cos(lon), z = cl * Math.sin(lon), idx = j * MW + i, h = 0, c = 0, e = 0;
        if (type === 'earth' || type === 'ocean' || type === 'jungle') {
          var el = V.fbm3(x * 1.5 + ox, y * 1.5 + oy, z * 1.5 + oz, s, 5) + .25 * V.fbm3(x * 5 + oz, y * 5 + ox, z * 5, s + 9, 3) * .6;
          var sea = type === 'ocean' ? .62 : type === 'jungle' ? .40 : .5;
          el += (Math.abs(y) > .86 ? (Math.abs(y) - .86) * 2.2 : 0);
          if (el < sea) { h = clamp((el / sea) * 128, 0, 129) | 0; }
          else {
            var mo = V.fbm3(x * 2.2 + moistOff, y * 2.2, z * 2.2 + moistOff, s + 3, 4), t = (el - sea) / (1 - sea);
            if (type === 'jungle') h = 138 + clamp(mo * 90 + t * 60, 0, 110) | 0;
            else if (t > .62 || Math.abs(y) > .9) h = t > .82 || Math.abs(y) > .93 ? 230 + ((t * 20) | 0) : 206 + ((t * 10) | 0);
            else if (mo < .42 && type === 'earth' && Math.abs(y) < .6) h = 186 + ((mo * 30) | 0);
            else if (mo > .55) h = 166 + ((mo * 18) | 0); else h = 138 + ((mo * 26) | 0);
            if (t < .035) h = 131 + ((t * 120) | 0);
          }
          var cn = V.fbm3(x * 2.6 + oy, y * 3.4 + oz, z * 2.6 + ox, s + 21, 5);
          var wob = V.noise3(x * 6, y * 6, z * 6, s + 5) * .25; c = clamp(((cn + wob) - (.64 - (b.cloudAmt != null ? b.cloudAmt : .35) * .16)) * 800, 0, 255);
          if (type === 'earth' && h >= 135 && h < 200) { var cn2 = V.hf((i >> 1) + 31, (j >> 1) + 7, s); if (cn2 > .985 && V.fbm3(x * 20, y * 20, z * 20, s + 4, 2) > .5) e = 255; if (V.noise3(x * 9 + 3, y * 9, z * 9, s + 8) > .74 && cn2 > .93) e = 255; }
          if (type === 'earth' && e === 0 && h >= 132 && h < 200 && V.hf(i, j, s + 77) > .992) e = 255;
          if (type === 'jungle') { if (V.hf(i >> 1, j >> 1, s + 3) > .99 && h > 138) e = 200; }
        } else if (type === 'desert' || type === 'venus') {
          var du = V.fbm3(x * 2 + ox, y * 2 + oy, z * 2 + oz, s, 4), rid = Math.abs(V.noise3(x * 4 + 5, y * 9, z * 4, s + 2) - .5) * 2;
          h = clamp((du * 220 + rid * 60 - 30), 0, 255) | 0; if (Math.abs(y) > .9) h = Math.max(h, 220);
          if (type === 'venus') { c = clamp((V.fbm3(x * 2 + oy + y * 3, y * 6, z * 2 + ox, s + 5, 4) - .35) * 700, 0, 255); h = clamp(V.fbm3(x * 2.5 + z, y * 8 + x * 2, z * 2.5, s, 3) * 255, 0, 255) | 0; }
          else c = clamp((V.fbm3(x * 3 + oy, y * 5, z * 3 + oz, s + 21, 4) - .64) * 500, 0, 255) * (b.cloudAmt || 0);
        } else if (type === 'rocky' || type === 'moon' || type === 'barren' || type === 'asteroid' || type === 'comet' || type === 'ruins') {
          var rk = V.fbm3(x * 2.3 + ox, y * 2.3 + oy, z * 2.3 + oz, s, 5); h = clamp(rk * 255 - 20 + (V.fbm3(x * 9, y * 9, z * 9, s + 4, 2) - .5) * 60, 0, 255);
          for (k = 0; k < craters.length; k++) {
            var cr = craters[k], dd = x * cr[0] + y * cr[1] + z * cr[2], ang = Math.acos(clamp(dd, -1, 1)), q = ang / cr[3];
            if (q < 1.25) { if (q < .86) h = h * .55 + 25 + q * 40; else if (q < 1.08) h = h + (1.08 - q) * 330 * (1 - Math.abs(q - .97) * 2); }
          }
          h = clamp(h, 0, 255) | 0;
        } else if (type === 'ice') {
          var ic = V.fbm3(x * 2.2 + ox, y * 2.2 + oy, z * 2.2 + oz, s, 4), cr2 = Math.abs(V.noise3(x * 5 + 2, y * 5, z * 5 + 9, s + 3) - .5);
          h = clamp(ic * 270 + 30, 0, 255); if (cr2 < .012) h = 12; if (Math.abs(y) > .92) h = 250;
          for (k = 0; k < craters.length; k += 2) { var cr3 = craters[k], d3 = x * cr3[0] + y * cr3[1] + z * cr3[2], a3 = Math.acos(clamp(d3, -1, 1)) / cr3[3]; if (a3 < .9) h = h * .5 + 90; }
          if (b.heart) { var hl = Math.atan2(Math.sin(lon - 4.7), Math.cos(lon - 4.7)), hy = lat - .05, hx = Math.abs(hl) * 1.1, hq = Math.pow(hx * hx + hy * hy - .12, 3) - hx * hx * hy * hy * hy * 1.4; if (hq < 0) h = 248 + ((V.hf(i, j, s) * 6) | 0); else if (Math.abs(hy) < .4 && V.fbm3(x * 3, y * 3, z * 3, s + 40, 3) < .4) h = 30 + (h >> 2); }
          h |= 0; c = clamp((V.fbm3(x * 3 + oy, y * 4, z * 3 + oz, s + 21, 4) - .66) * 500, 0, 255) * (b.cloudAmt || 0);
        } else if (type === 'lava') {
          var lv = Math.abs(V.fbm3(x * 2.6 + ox, y * 2.6 + oy, z * 2.6 + oz, s, 4) - .5), lv2 = V.fbm3(x * 4 + 9, y * 4, z * 4 + 4, s + 11, 3);
          if (lv < .035 || (lv < .06 && lv2 > .6)) { h = lv < .02 ? 240 : 210; e = 255; } else if (lv < .09) { h = 175; e = 90; } else h = 40 + ((lv2 * 130) | 0);
          c = clamp((V.fbm3(x * 2 + oy, y * 3, z * 2, s + 21, 4) - .6) * 500, 0, 255) * (b.cloudAmt || 0);
        } else if (type === 'crystal') {
          var bd = 9, b1 = 0, b2 = 9, bi = 0;
          for (k = 0; k < sites.length; k++) { var sd = 1 - (x * sites[k][0] + y * sites[k][1] + z * sites[k][2]); if (sd < b1 || k === 0) { b2 = b1 || 9; b1 = sd; bi = k; } else if (sd < b2) b2 = sd; }
          var edge = b2 - b1, sf = sites[bi][3]; h = clamp(60 + sf * 150 + V.noise3(x * 6, y * 6, z * 6, s) * 30, 0, 255) | 0; if (edge < .018) { h = 250; e = 200; }
          D[idx] = ((sf - .5) * 70) | 0;
        } else if (type === 'gas' || type === 'icegas') {
          var warp = V.fbm3(x * 2.2 + ox, y * 5 + oy, z * 2.2, s, 4) - .5, bl = lat / (Math.PI / 2) + warp * (type === 'icegas' ? .12 : .34);
          var bnd = Math.sin(bl * bandsN * 1.7 + bandPh) * .5 + Math.sin(bl * bandsN * .9 + bandPh * 2) * .3 + .5, tex = V.fbm3(x * 9, y * 22, z * 9, s + 7, 3);
          h = clamp(bnd * 190 + tex * 70, 0, 255) | 0;
          if (type === 'icegas') h = clamp(110 + (bnd - .5) * 70 + tex * 40, 0, 255) | 0;
          if (b.grs && h > 236) h = 236;
          for (k = 0; k < storms.length; k++) { var st = storms[k], dl = Math.atan2(Math.sin(lon - st.lon), Math.cos(lon - st.lon)) / st.rx, dla = (lat - st.lat) / st.ry, dr = dl * dl + dla * dla; if (dr < 1) { var sw = Math.atan2(dla, dl * st.sw) + dr * 5; if (st.red) { h = dr < .55 ? (dr < .2 || Math.sin(sw * 3) > -.3 ? 252 : 236) : dr > .85 ? 226 : 140; } else if (st.dark) { h = dr < .6 ? 8 : dr > .85 ? 250 : 40; } else { h = dr < .25 ? 235 : (Math.sin(sw * 2) > 0 ? 215 : 70); if (dr > .8) h = 60; } } }
        }
        Hh[idx] = h; C[idx] = c; E[idx] = e;
      }
    }
    return (b.map = { w: MW, h: MH, H: Hh, C: C, E: E, D: D });
  };

  /* ---------- sphere renderer ---------- */
  var SH = [[.14, .06], [.42, .26], [.76, .62], [1, 1]];
  function shadeTable(lut, light, nightTint) {
    var tab = new Uint32Array(256 * 4), lc = light && light.col ? light.col : [255, 244, 224];
    for (var h = 0; h < 256; h++) {
      var c = lut[h]; if (!c) continue;
      for (var l = 0; l < 4; l++) {
        var f = SH[l][0], o, r2, g2, b2;
        if (l === 0) { r2 = c[0] * .15 + 9; g2 = c[1] * .13 + 6; b2 = c[2] * .19 + 26; }
        else if (l === 1) { r2 = c[0] * .42 + 18 * (1 - .4); g2 = c[1] * .36 + 10; b2 = c[2] * .5 + 34; }
        else if (l === 2) { r2 = c[0] * .9 * (lc[0] / 255) ; g2 = c[1] * .9 * (lc[1] / 255); b2 = c[2] * .92 * (lc[2] / 255) + 6; }
        else { r2 = Math.min(255, c[0] * 1.14 * (lc[0] / 255) + 10); g2 = Math.min(255, c[1] * 1.14 * (lc[1] / 255) + 8); b2 = Math.min(255, c[2] * 1.12 * (lc[2] / 255) + 6); }
        tab[h * 4 + l] = pk([r2, g2, b2]);
      }
    }
    return tab;
  }
  function lightVec(light) { var a = light ? light.ang : 0, el = .3; return [Math.cos(a) * Math.cos(el), Math.sin(a) * Math.cos(el), Math.sin(el)]; }
  var cloudCache = {};
  function lutKey(b) {
    var t = b.type;
    if (t === 'earth') return 'earth'; if (t === 'ocean') return 'ocean'; if (t === 'jungle') return 'jungle';
    if (t === 'desert') return b.palKey || 'desertA'; if (t === 'venus') return b.palKey || 'venus';
    if (t === 'rocky' || t === 'barren') return b.palKey || 'rockyG'; if (t === 'moon' || t === 'asteroid' || t === 'comet' || t === 'ruins') return b.palKey || 'moonG';
    if (t === 'ice') return b.palKey || 'iceA'; if (t === 'lava') return b.palKey || 'lava'; if (t === 'crystal') return b.palKey || 'crystalA';
    if (t === 'gas' || t === 'icegas') return b.grs ? 'jupiter' : (b.palKey || 'gasJ'); return 'rockyG';
  }
  function haveAtm(b) { return b.atm || null; }

  /* renders a planet disc; opts: {win:{x0,y0,w,h}} for clipped big renders, outline: Float32Array(256) multipliers */
  P.renderSphere = function (b, R, light, opts) {
    opts = opts || {};
    var map = P.mapFor(b), lkey = lutKey(b), lut = lutFor(lkey), tab = shadeTable(lut, light), ctab = b._ctab || (b._ctab = shadeTable((function () { var l = []; for (var i = 0; i < 256; i++) l.push(b.type === 'lava' ? [120, 100, 100] : b.type === 'venus' ? (i >= 220 ? [255, 246, 220] : [240, 212, 150]) : (i >= 220 ? [252, 252, 255] : [220, 228, 244])); return l; })(), light));
    var pad = opts.pad == null ? 3 : opts.pad, D = Math.ceil(R * 2), size = D + pad * 2;
    var w0 = 0, h0 = 0, ww = size, hh = size, ccx = R + pad, ccy = R + pad;
    if (opts.win) { w0 = opts.win.x0; h0 = opts.win.y0; ww = opts.win.w; hh = opts.win.h; ccx = opts.win.cx; ccy = opts.win.cy; }
    var cv = V.mk(ww, hh), g = cv.g, img = g.createImageData(ww, hh), u = new Uint32Array(img.data.buffer);
    var L = lightVec(light), Lx = L[0], Ly = L[1], Lz = L[2], hasLight = !!light && light.k !== 0, amb = light ? 0 : 1;
    var tilt = b.tilt != null ? b.tilt : .35, ct = Math.cos(tilt), st = Math.sin(tilt), spin = b.spin || 0, H = map.H, C = map.C, E = map.E, Dm = map.D, mw = map.w, mh = map.h;
    var atm = b.atm ? V.hex(b.atm) : null, atmP = atm ? pk(atm) : 0, atmL = atm ? pk([Math.min(255, atm[0] + 50), Math.min(255, atm[1] + 50), Math.min(255, atm[2] + 40)]) : 0;
    var emisC = b.type === 'lava' ? pk([255, 150, 50]) : b.type === 'crystal' ? pk([255, 255, 255]) : pk([255, 214, 120]);
    var R2 = R * R, rimN = 1 - Math.min(.55, 2.6 / R), outline = opts.outline, elong = opts.elong || 1, ca = opts.rot ? Math.cos(opts.rot) : 1, sa = opts.rot ? Math.sin(opts.rot) : 0;
    var glint = (b.type === 'earth' || b.type === 'ocean') && hasLight, glintC = pk([236, 246, 255]);
    var cloudThr = 8, cloudOff = (b.cloudSpin || 0), is = 1 / (TAU), lf = light ? (light.k == null ? 1 : light.k) : 0;
    for (var j = 0; j < hh; j++) {
      for (var i = 0; i < ww; i++) {
        var dx = i + .5 - ccx + 0, dy = j + .5 - ccy + 0, d2, rl = R2, rim = 0, nx, ny, nz;
        if (outline) { var rx = dx * ca + dy * sa, ry = -dx * sa + dy * ca; rx /= elong; var an = Math.atan2(ry, rx); var oi = ((an / TAU + 1) % 1) * 256 | 0; var m = outline[oi]; rl = (R * m) * (R * m); d2 = rx * rx + ry * ry; if (d2 > rl) { continue; } var RR = R * m; nx = rx / RR; ny = ry / RR; }
        else { d2 = dx * dx + dy * dy; if (d2 > R2) { /* atmosphere glow ring */ if (atm && d2 <= (R + 2.6) * (R + 2.6) && hasLight) { var dd = Math.sqrt(d2) - R, dtl = (dx * Lx + dy * Ly) / (Math.sqrt(d2) * Math.sqrt(Lx * Lx + Ly * Ly) + 1e-6); var pr = (1 - dd / 2.6) * smoothstep(-.35, .5, dtl); if (pr > .02 && V.bayer(i + w0, j + h0) < pr * .85) u[j * ww + i] = dd < 1 ? atmL : atmP; } continue; } nx = dx / R; ny = dy / R; }
        var nzz = 1 - nx * nx - ny * ny; nz = nzz > 0 ? Math.sqrt(nzz) : 0;
        var yy = ny * ct + nz * st, zz = -ny * st + nz * ct, lat = Math.asin(yy > 1 ? 1 : yy < -1 ? -1 : yy), lon = Math.atan2(nx, zz) + spin;
        var mi = (((lon * is + 1.5) % 1) * mw) | 0, mj = ((lat / Math.PI + .5) * mh) | 0; if (mj >= mh) mj = mh - 1; var idx = mj * mw + mi;
        var dot = nx * Lx + ny * Ly + nz * Lz; if (Dm) dot += Dm[idx] / 255;
        var li;
        if (!hasLight) li = 0; else { var v = (dot + .06) / .86; v = v < 0 ? 0 : v > 1 ? 1 : v; var lv = v * 3.0 * (.4 + .6 * lf); li = lv | 0; if (lv - li > V.bayer(i + w0, j + h0)) li++; if (li > 3) li = 3; }
        var hv = H[idx], col;
        var cv2 = C[idx]; var cm = cv2 > 190 ? 1 : (cv2 > 50 && ((cv2 - 50) / 140 > V.bayer(i + w0 + 3, j + h0)) ? 1 : 0);
        if (cm) col = ctab[(cv2 > 235 ? 240 : 200) * 4 + li]; else col = tab[hv * 4 + li];
        if (!cm && li <= 1 && E[idx] > 120 && (b.type !== 'lava' ? true : true)) { if (b.type === 'lava') col = pk([255, 130 + (E[idx] >> 3), 40]); else if (E[idx] > 190 && (li === 0 || V.bayer(i + w0, j + h0) < .5)) col = emisC; }
        else if (!cm && b.type === 'lava' && E[idx] > 120) col = tab[hv * 4 + Math.max(li, 2)];
        if (b.type === 'crystal' && E[idx] > 120 && li >= 1) col = emisC;
        if (glint && !cm && hv < 129 && li === 3 && dot > .86 && V.bayer(i + w0, j + h0) < (dot - .86) * 9) col = glintC;
        if (atm && nz < 1 - rimN + .02 && li >= 1 && !cm) { if (V.bayer(i + w0, j + h0) < (li >= 2 ? .7 : .35)) col = atmP; }
        u[j * ww + i] = col;
      }
    }
    g.putImageData(img, 0, 0);
    cv.cx = ccx; cv.cy = ccy; cv.pad = pad;
    return cv;
  };

  /* ---------- rings ---------- */
  P.renderRing = function (b, R, light, front) {
    var rg = b.ring, rin = R * rg.in, rout = R * rg.out, sq = rg.sq, ang = rg.ang, W = Math.ceil(rout * 2.1) + 4, Hh = Math.ceil(rout * 2.1 * Math.max(sq, .25) + R * 2) + 4;
    var S = Math.ceil(rout * 2) + 6, cv = V.mk(S, S), g = cv.g, img = g.createImageData(S, S), u = new Uint32Array(img.data.buffer);
    var ca = Math.cos(-ang), sa = Math.sin(-ang), c0 = S / 2, cols = rg.cols.map(V.hex), nb = Math.floor((rout - rin) / 1.2) + 1, bands = new Float32Array(nb + 2), r = V.rng(b.seed + 51);
    for (var k = 0; k < bands.length; k++) bands[k] = r();
    var L = light ? [Math.cos(light.ang), Math.sin(light.ang)] : [1, 0];
    for (var j = 0; j < S; j++) for (var i = 0; i < S; i++) {
      var dx = i + .5 - c0, dy = j + .5 - c0, ex = dx * ca - dy * sa, ey = (dx * sa + dy * ca) / sq, rr = Math.sqrt(ex * ex + ey * ey);
      if (rr < rin || rr > rout) continue;
      var isFront = ey > 0; if (isFront !== front) continue;
      var rpx = dx * dx + dy * dy; if (!front && rpx < R * R) continue; /* hidden behind the planet */
      var k2 = (rr - rin) / (rout - rin), bi = Math.floor(k2 * nb), bv = bands[bi];
      if (bv < .18 || (k2 > .55 && k2 < .6)) continue; /* gaps (Cassini-like) */
      var ci = Math.min(cols.length - 1, Math.floor(bv * cols.length)), c = cols[ci];
      if (V.bayer(i, j) > .55 + bv * .6) { ci = Math.max(0, ci - 1); c = cols[ci]; }
      var shadow = false, dl = dx * L[0] + dy * L[1];
      if (light && dl < 0 && Math.abs(-dx * L[1] + dy * L[0]) < R * .98) shadow = true;
      var f = shadow ? .22 : 1; if (light && !shadow && dl > 0) f = .9 + .1 * (dl / rout);
      if (!light) f = .35;
      u[j * S + i] = pk([c[0] * f + (shadow ? 8 : 0), c[1] * f + (shadow ? 6 : 0), c[2] * f + (shadow ? 24 : 0)]);
    }
    g.putImageData(img, 0, 0); cv.cx = c0; cv.cy = c0; return cv;
  };

  /* ---------- asteroid outlines ---------- */
  P.outline = function (b) {
    if (b._ol) return b._ol; var o = new Float32Array(256), r = V.rng(b.seed + 5), p1 = r() * 9, p2 = r() * 9, a1 = .14 + r() * .12, a2 = .08 + r() * .08;
    for (var i = 0; i < 256; i++) { var a = i / 256 * TAU, cx = Math.cos(a), sy = Math.sin(a); o[i] = clamp(.84 + a1 * (V.noise2(cx * 1.6 + 5, sy * 1.6 + 5, b.seed) - .5) * 2 + a2 * (V.noise2(cx * 4 + 9, sy * 4 + 9, b.seed + 3) - .5) * 2, .5, 1.2); }
    return (b._ol = o);
  };

  /* ---------- cache: (body, integer radius, light bucket) -> canvas ---------- */
  var cache = new Map(), budget = 0;
  P.frameBudget = function (ms) { budget = ms; };
  function lightBucket(light) { return light ? (Math.round(((light.ang % TAU + TAU) % TAU) / TAU * 48) % 48) * 100 + Math.round((light.k == null ? 1 : light.k) * 4) : -1; }
  P.get = function (b, R, light, kind) {
    var key = b.id + '|' + R + '|' + lightBucket(light) + '|' + (kind || ''), c = cache.get(key);
    if (c) { c.t = V.frame; return c; }
    var old = b._last && b._last[kind || ''];
    if (old && budget <= 0 && R < 70) return old;
    var t0 = performance.now(), cv;
    var lg = light ? { ang: Math.round(((light.ang % TAU + TAU) % TAU) / TAU * 48) / 48 * TAU, col: light.col, k: light.k } : null;
    if (kind === 'ring0') cv = P.renderRing(b, R, lg, false); else if (kind === 'ring1') cv = P.renderRing(b, R, lg, true);
    else cv = P.renderBodyNow(b, R, lg);
    budget -= performance.now() - t0; cv.t = V.frame; cache.set(key, cv); (b._last = b._last || {})[kind || ''] = cv;
    if (cache.size > 420) { var drop = []; cache.forEach(function (v, k) { if (V.frame - v.t > 600) drop.push(k); }); drop.forEach(function (k) { cache.delete(k); }); if (cache.size > 700) cache.clear(); }
    return cv;
  };
  P.clearCache = function () { cache.clear(); };

  /* body-type dispatcher for cached rendering */
  P.renderBodyNow = function (b, R, light) {
    var t = b.type;
    if (t === 'asteroid' || t === 'comet' || t === 'ruins') return P.renderSphere(b, R, light, { outline: P.outline(b), elong: b.elong || 1.15, rot: b.rot || 0, pad: 3 });
    if (t === 'donut' || t === 'cube' || t === 'ringworld') return P.renderShape(b, R, light);
    if (t === 'station') return P.renderStation(b, R, light);
    if (t === 'dyson') return P.renderDyson(b, R, light);
    if (t === 'wreck') return P.renderWreck(b, R, light);
    return P.renderSphere(b, R, light, null);
  };
  P.dispose = function () { cache.clear(); };
})();
