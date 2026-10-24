/* The Void — progression: resources, upgrades, story flags, pins; in-canvas widgets (upgrade grid, admin panel, tooltips). */
(function () {
  'use strict';
  var V = window.VOID, Q = V.q, clamp = V.clamp;
  /* ---------- extra 5x5 glyphs (icons instead of words) ---------- */
  function gl(rows) { return rows.join(''); }
  V.addGlyphs({
    scrap: gl(['.111.', '1...1', '1.1.1', '1...1', '.111.']), crystal: gl(['..1..', '.111.', '.111.', '.111.', '..1..']), ore: gl(['..11.', '.1111', '11111', '1111.', '.11..']),
    tech: gl(['1.1.1', '11111', '1...1', '11111', '1.1.1']), essence: gl(['..1..', '1.1.1', '.111.', '1.1.1', '..1..']), part: gl(['1.1.1', '.111.', '11.11', '.111.', '1.1.1']),
    lock: gl(['.111.', '.1.1.', '11111', '11.11', '11111']), check: gl(['....1', '...1.', '1.1..', '.1...', '.....']), cross: gl(['1...1', '.1.1.', '..1..', '.1.1.', '1...1']),
    plus: gl(['..1..', '..1..', '11111', '..1..', '..1..']), minus: gl(['.....', '.....', '11111', '.....', '.....']), heart: gl(['.1.1.', '11111', '11111', '.111.', '..1..']),
    coin: gl(['.111.', '1.1.1', '1.1.1', '1.1.1', '.111.']), trade: gl(['...1.', '11111', '...1.', '.1...', '11111']), pin: gl(['.111.', '11.11', '.111.', '..1..', '..1..']),
    eye: gl(['.....', '.111.', '11.11', '.111.', '.....']), wrench: gl(['1...1', '11.11', '.111.', '..1..', '..1..']), warp: gl(['1.1.1', '.111.', '11111', '.111.', '1.1.1']),
    gear: gl(['.1.1.', '11111', '.1.1.', '.1.1.', '11.11']), shield: gl(['11111', '1...1', '1...1', '.1.1.', '..1..']), magnet: gl(['1...1', '1...1', '1...1', '1...1', '.111.']),
    auto: gl(['..1..', '.11..', '11111', '.11..', '..1..']), thrust: gl(['..1..', '.111.', '..1..', '.111.', '1.1.1']), brake: gl(['11111', '.....', '.111.', '.....', '..1..']),
    hyper: gl(['1...1', '11.11', '1.1.1', '11.11', '1...1']), surf: gl(['.111.', '1....', '1.11.', '1...1', '.111.']), cloak: gl(['1.1.1', '.1.1.', '1.1.1', '.1.1.', '1.1.1']),
    clock: gl(['.111.', '1.1.1', '1.11.', '1...1', '.111.']), laser: gl(['1....', '.1...', '..111', '.1...', '1....']), tractor: gl(['11111', '.111.', '.1.1.', '1...1', '..1..']),
    drone: gl(['1...1', '.111.', '.1.1.', '.111.', '1...1']), galaxy: gl(['.11..', '1..1.', '1.1.1', '.1..1', '..11.']), hull: gl(['..1..', '.111.', '11111', '1.1.1', '1...1']),
    jet: gl(['.1.1.', '.1.1.', '.1.1.', '1.1.1', '1...1']), dbl: gl(['..1..', '.1.1.', '..1..', '.1.1.', '1...1']), run: gl(['..11.', '.11..', '1.11.', '..1.1', '.1...']),
    o2: gl(['.111.', '1...1', '1.1.1', '1...1', '.111.']), heat: gl(['..1..', '.11..', '.111.', '11111', '.111.']), cold: gl(['1.1.1', '.111.', '11111', '.111.', '1.1.1']),
    visor: gl(['.111.', '11111', '1...1', '11111', '.....']), hook: gl(['..11.', '...1.', '...1.', '1..1.', '.11..']), tool: gl(['11...', '111..', '.111.', '..11.', '...11']),
    board: gl(['.....', '.....', '11111', '.1.1.', '.....']), talk: gl(['11111', '1...1', '11111', '.1...', '1....']), smile: gl(['.....', '.1.1.', '.....', '1...1', '.111.']),
    arrow: gl(['..1..', '...1.', '11111', '...1.', '..1..']), away: gl(['1.1..', '.1.1.', '..1.1', '.1.1.', '1.1..']), follow: gl(['1....', '11...', '111.1', '11...', '1....']),
    gift: gl(['.1.1.', '11111', '1.1.1', '11111', '11111']), quest: gl(['.111.', '1...1', '..11.', '.....', '..1..']), alien: gl(['.111.', '1.1.1', '11111', '.111.', '1...1']),
    person: gl(['..1..', '.111.', '..1..', '.1.1.', '.1.1.']), sun: gl(['1.1.1', '.111.', '11111', '.111.', '1.1.1']), rain: gl(['.111.', '11111', '.....', '1.1.1', '.1.1.']),
    snow: gl(['1.1.1', '.1.1.', '1.1.1', '.....', '1.1.1']), speed: gl(['1..1.', '.1..1', '..1..', '.1..1', '1..1.']), god: gl(['.111.', '1...1', '.111.', '..1..', '.111.']),
    inf: gl(['.....', '11.11', '1.1.1', '11.11', '.....']), skip: gl(['1.1..', '11.1.', '1.1.1', '11.1.', '1.1..']), tele: gl(['.1.1.', '1...1', '..1..', '1...1', '.1.1.']),
    reset: gl(['.111.', '1...1', '1..11', '1....', '.11..']), close: gl(['1...1', '.1.1.', '..1..', '.1.1.', '1...1']), center: gl(['..1..', '.....', '1.1.1', '.....', '..1..']),
    all: gl(['11111', '1.1.1', '11111', '1.1.1', '11111']), ring: gl(['.....', '11111', '1.1.1', '11111', '.....']), huge: gl(['11111', '11111', '11111', '11111', '11111']),
    dyson: gl(['1.1.1', '.....', '1.1.1', '.....', '1.1.1']), shard: gl(['1..1.', '.11..', '..1.1', '1.11.', '.1..1']), ocean: gl(['.111.', '1.1.1', '11.11', '1.1.1', '.111.']),
    up2: gl(['..1..', '.111.', '1.1.1', '..1..', '..1..'])
  });

  /* ---------- data ---------- */
  var RES = ['scrap', 'ore', 'crystal', 'tech', 'essence'];
  var RCOL = { scrap: '#c8c0e0', ore: '#d89a62', crystal: '#9af0ff', tech: '#7affa8', essence: '#ffb0f0', part: '#ffd060' };
  /* id, section, icon, cost, requires */
  var UP = [
    ['thrust', 'ship', 'thrust', { scrap: 6, ore: 4 }], ['brakes', 'ship', 'brake', { scrap: 4 }], ['shield', 'ship', 'shield', { scrap: 8, crystal: 3 }], ['scanner', 'ship', 'scan', { scrap: 4, crystal: 2 }],
    ['magnet', 'ship', 'magnet', { scrap: 6, tech: 1 }], ['autopilot', 'ship', 'auto', { scrap: 8, tech: 3 }], ['gear', 'ship', 'gear', { scrap: 10, ore: 6 }],
    ['universal', 'adv', 'warp', { scrap: 30, ore: 8, crystal: 10, tech: 6, part: 3 }], ['hyper', 'adv', 'hyper', { crystal: 12, tech: 8, essence: 2 }, ['universal']], ['bhsurf', 'adv', 'surf', { crystal: 6, essence: 4 }, ['universal']],
    ['cloak', 'adv', 'cloak', { tech: 10, essence: 2 }], ['timeslow', 'adv', 'clock', { crystal: 5, essence: 5 }], ['laser', 'adv', 'laser', { scrap: 12, tech: 4 }], ['tractor', 'adv', 'tractor', { ore: 6, tech: 6 }],
    ['drone', 'adv', 'drone', { scrap: 14, tech: 6 }], ['galaxy', 'adv', 'galaxy', { crystal: 14, tech: 14, essence: 10 }, ['hyper']],
    ['hull1', 'adv', 'hull', { scrap: 10, ore: 6 }], ['hull2', 'adv', 'hull', { crystal: 10, tech: 6 }, ['hull1']], ['hull3', 'adv', 'hull', { crystal: 12, essence: 8 }, ['hull2']],
    ['jetpack', 'suit', 'jet', { scrap: 8, ore: 4 }], ['dbljump', 'suit', 'dbl', { scrap: 5 }], ['run', 'suit', 'run', { scrap: 4, ore: 2 }], ['oxygen', 'suit', 'o2', { scrap: 6, crystal: 2 }],
    ['heat', 'suit', 'heat', { ore: 6, crystal: 3 }], ['cold', 'suit', 'cold', { ore: 6, crystal: 3 }], ['visor', 'suit', 'visor', { crystal: 4, tech: 2 }], ['grapple', 'suit', 'hook', { scrap: 8, ore: 3 }],
    ['multitool', 'suit', 'tool', { scrap: 6, tech: 2 }], ['rover', 'suit', 'board', { scrap: 12, tech: 4 }], ['translator', 'suit', 'talk', { tech: 5, essence: 1 }]
  ];
  var NAMES = { thrust: 'THRUST', brakes: 'BRAKES', shield: 'FUEL+SHIELD', scanner: 'SCANNER RANGE', magnet: 'CARGO MAGNET', autopilot: 'AUTOPILOT', gear: 'LANDING GEAR', universal: 'UNIVERSAL DRIVE', hyper: 'HYPERSPACE', bhsurf: 'HOLE SURFING', cloak: 'CLOAK', timeslow: 'TIME SLOW', laser: 'MINING LASER', tractor: 'TRACTOR BEAM', drone: 'DRONE', galaxy: 'GALAXY JUMP', hull1: 'HULL II', hull2: 'HULL III', hull3: 'HULL IV', jetpack: 'JETPACK', dbljump: 'DOUBLE JUMP', run: 'FAST RUN', oxygen: 'OXYGEN', heat: 'HEAT SUIT', cold: 'COLD SUIT', visor: 'SCAN VISOR', grapple: 'GRAPPLE', multitool: 'MULTITOOL', rover: 'HOVERBOARD', translator: 'TRANSLATOR' };
  var Pg = V.prog = { RES: RES, RCOL: RCOL, UP: UP, NAMES: NAMES, open: null, regions: [], hover: null, tip: null };
  Pg.byId = {}; UP.forEach(function (u) { Pg.byId[u[0]] = { id: u[0], sec: u[1], icon: u[2], cost: u[3], req: u[4] || [] }; });

  Pg.fresh = function (story) {
    Pg.res = { scrap: 0, ore: 0, crystal: 0, tech: 0, essence: 0 }; Pg.parts = {}; Pg.up = {}; Pg.got = {}; Pg.npc = {}; Pg.pins = []; Pg.seenAliens = {};
    Pg.story = story || { crashed: true, repaired: true, warped: false };
    Pg.cheat = { god: false, fuel: false }; Pg.fuel = 1;
  };
  Pg.fresh();
  Pg.newGame = function () { Pg.fresh({ crashed: false, repaired: false, warped: false }); };
  Pg.has = function (id) { return !!Pg.up[id]; };
  Pg.partCount = function () { return Object.keys(Pg.parts).length; };
  Pg.canAfford = function (id) { var u = Pg.byId[id], c = u.cost; for (var k in c) { if (k === 'part') { if (Pg.partCount() < c[k]) return false; } else if ((Pg.res[k] || 0) < c[k]) return false; } return true; };
  Pg.reqMet = function (id) { return Pg.byId[id].req.every(Pg.has); };
  Pg.gain = function (k, n, x, y) { if (k === 'part') return; Pg.res[k] = (Pg.res[k] || 0) + n; Pg.flashRes = Pg.flashRes || {}; Pg.flashRes[k] = 1; if (V.sfx) V.sfx('pick'); };
  Pg.spend = function (cost) { for (var k in cost) if (k !== 'part') Pg.res[k] -= cost[k]; };
  Pg.buy = function (id, free) {
    if (Pg.has(id)) return false; if (!free && (!Pg.canAfford(id) || !Pg.reqMet(id))) return false;
    if (!free) Pg.spend(Pg.byId[id].cost); Pg.up[id] = 1; Pg.flashUp = { id: id, t: 0 }; V.game.toast('UPGRADE', NAMES[id]);
    if (id === 'universal' && Pg.onUniversal) Pg.onUniversal(free);
    if (V.space && V.space.refreshShip) V.space.refreshShip(); if (V.save) V.save.write(); return true;
  };
  Pg.affordCost = function (c) { for (var k in c) if ((Pg.res[k] || 0) < c[k]) return false; return true; };
  Pg.unlock = function (id, on) { if (on === false) delete Pg.up[id]; else Pg.up[id] = 1; if (V.space && V.space.refreshShip) V.space.refreshShip(); };
  /* visible ship tier 0..4 and suit look */
  Pg.shipTier = function () { if (Q.get('tier') != null) return clamp(+Q.get('tier') | 0, 0, 4); return (Pg.has('hull1') ? 1 : 0) + (Pg.has('universal') ? 1 : 0) + (Pg.has('hull2') ? 1 : 0) + (Pg.has('hull3') ? 1 : 0); };
  Pg.suitKey = function () { return ['jetpack', 'visor', 'heat', 'cold', 'oxygen', 'grapple', 'multitool', 'translator', 'rover'].map(function (k) { return Pg.has(k) ? 1 : 0; }).join(''); };
  /* pins on the map */
  Pg.pin = function (x, y, icon, id) { for (var i = 0; i < Pg.pins.length; i++) if (Pg.pins[i].id === id && id) return Pg.pins[i]; var p = { x: Math.round(x), y: Math.round(y), icon: icon || 'pin', id: id || ('p' + Pg.pins.length + ':' + Math.round(x)) }; Pg.pins.push(p); return p; };

  /* ---------- save ---------- */
  Pg.getSave = function () { return { res: Pg.res, parts: Object.keys(Pg.parts), up: Object.keys(Pg.up), got: Object.keys(Pg.got), npc: Pg.npc, pins: Pg.pins, story: Pg.story, cheat: Pg.cheat }; };
  Pg.load = function (d) {
    Pg.fresh(d.story || { crashed: true, repaired: true });
    RES.forEach(function (k) { Pg.res[k] = +((d.res || {})[k]) || 0; });
    (d.parts || []).forEach(function (k) { Pg.parts[k] = 1; }); (d.up || []).forEach(function (k) { if (Pg.byId[k]) Pg.up[k] = 1; }); (d.got || []).forEach(function (k) { Pg.got[k] = 1; });
    Pg.npc = d.npc || {}; Pg.pins = (d.pins || []).filter(function (p) { return p && isFinite(p.x) && isFinite(p.y); }); Pg.cheat = d.cheat || { god: false, fuel: false };
  };

  /* ---------- in-canvas widgets ---------- */
  var M = V.mouse;
  Pg.btn = function (id, x, y, w, h, onClick, tip) { Pg.regions.push({ id: id, x: x, y: y, w: w, h: h, fn: onClick, tip: tip }); return M.has && M.x >= x && M.y >= y && M.x < x + w && M.y < y + h; };
  Pg.hitTest = function (mx, my) { for (var i = Pg.regions.length - 1; i >= 0; i--) { var r = Pg.regions[i]; if (mx >= r.x && my >= r.y && mx < r.x + r.w && my < r.y + r.h) return r; } return null; };
  V.uiHit = function () { return !!Pg.hitTest(M.x, M.y) || !!Pg.open; };
  Pg.handleInput = function () {
    var r = M.has ? Pg.hitTest(M.x, M.y) : null; Pg.hover = r;
    if (M.clicked && r) { M.consumed = true; if (r.fn) r.fn(); }
    if (M.long && r && r.tip) Pg.tipHold = { tip: r.tip, x: r.x, y: r.y, t: 1.6 };
  };
  Pg.panel = function (g, x, y, w, h) { g.fillStyle = '#05020d'; g.fillRect(x - 1, y - 1, w + 2, h + 2); g.fillStyle = '#12082a'; g.fillRect(x, y, w, h); g.fillStyle = '#6a3ab0'; g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); g.fillStyle = '#2a0f4d'; g.fillRect(x + 1, y + 1, w - 2, 1); };
  Pg.iconBtn = function (g, id, x, y, icon, col, onClick, tip, on, w) {
    w = w || 11; var hov = Pg.btn(id, x, y, w, 11, onClick, tip);
    g.fillStyle = on ? '#6a3ab0' : hov ? '#3a1a6a' : '#22103f'; g.fillRect(x, y, w, 11); g.fillStyle = on ? '#c04df0' : '#4a2a80'; g.fillRect(x, y, w, 1); g.fillStyle = '#0a0418'; g.fillRect(x, y + 10, w, 1);
    V.glyph(g, icon, x + ((w - 5) >> 1), y + 3, col || '#efe6ff', '#05020d'); return hov;
  };
  Pg.drawTip = function (g) {
    var tip = null, x = 0, y = 0; if (Pg.hover && Pg.hover.tip && !V.touchMode) { tip = Pg.hover.tip; x = M.x + 6; y = M.y + 8; }
    if (Pg.tipHold) { tip = Pg.tipHold.tip; x = Pg.tipHold.x; y = Pg.tipHold.y - 10; }
    if (!tip) return; var tw = V.textW(tip) + 6; x = clamp(x, 2, V.W - tw - 2); y = clamp(y, 2, V.H - 11);
    g.fillStyle = '#05020d'; g.fillRect(x - 1, y - 1, tw + 2, 11); g.fillStyle = '#2a0f4d'; g.fillRect(x, y, tw, 9); V.text(g, tip, x + 3, y + 2, '#efe6ff');
  };
  function costRow(g, cost, x, y, ok) {
    for (var k in cost) { var have = k === 'part' ? Pg.partCount() : Pg.res[k] || 0, enough = have >= cost[k]; V.glyph(g, k, x, y, RCOL[k], '#05020d'); V.text(g, cost[k], x + 6, y, enough ? '#efe6ff' : '#ff6a8a', '#05020d'); x += 7 + V.textW(cost[k]) + 3; }
    return x;
  }
  Pg.costRow = costRow;
  /* resource bar (top-left) */
  Pg.drawRes = function (g, x, y, compact) {
    for (var i = 0; i < RES.length; i++) { var k = RES[i], n = Pg.res[k] || 0; if (compact && !n) continue; if (Pg.softTip && V.tips) Pg.softTip('res:' + k, x - 1, y - 1, 8 + V.textW(n), 7, V.tips.res(k)); var fl = Pg.flashRes && Pg.flashRes[k] > 0; V.glyph(g, k, x, y, fl && (V.frame & 4) ? '#ffffff' : RCOL[k], '#05020d'); V.text(g, n, x + 6, y, '#efe6ff', '#05020d'); x += 8 + V.textW(n) + 3; }
    var pc = Pg.partCount(); if (pc || !compact) { if (Pg.softTip && V.tips) Pg.softTip('res:part', x - 1, y - 1, 8 + V.textW(pc), 7, V.tips.res('part')); V.glyph(g, 'part', x, y, RCOL.part, '#05020d'); V.text(g, pc + '', x + 6, y, '#efe6ff', '#05020d'); x += 8 + V.textW(pc) + 3; }
    return x;
  };

  /* ---------- upgrade screen: three icon grids ---------- */
  Pg.drawUpgrades = function (g) {
    var W = V.W, H = V.H, cols = 7, cw = 22, chh = 26, pw = cols * cw + 10, ph = 3 * 2 * chh + 40, x0 = (W - pw) >> 1, y0 = Math.max(4, (H - ph) >> 1);
    if (ph > H - 8) { chh = 22; ph = 3 * 2 * chh + 40; y0 = Math.max(2, (H - ph) >> 1); }
    V.dissolve(g, .7, '#05020d'); Pg.panel(g, x0, y0, pw, ph);
    V.glyph(g, 'up2', x0 + 5, y0 + 5, '#c04df0', '#05020d'); Pg.drawRes(g, x0 + 14, y0 + 5, false);
    Pg.iconBtn(g, 'upclose', x0 + pw - 14, y0 + 3, 'close', '#ff9ab0', function () { Pg.open = null; }, 'CLOSE');
    var secs = [['ship', 'ship'], ['adv', 'warp'], ['suit', 'person']], y = y0 + 18;
    secs.forEach(function (s) {
      var list = UP.filter(function (u) { return u[1] === s[0]; }); g.fillStyle = '#2a0f4d'; g.fillRect(x0 + 4, y, pw - 8, 1); V.glyph(g, s[1], x0 + 3, y + 3, '#7a5ab0', '#05020d');
      for (var i = 0; i < list.length; i++) {
        var id = list[i][0], u = Pg.byId[id], cx = x0 + 10 + (i % cols) * cw, cy = y + 3 + Math.floor(i / cols) * chh, own = Pg.has(id), ok = Pg.canAfford(id) && Pg.reqMet(id), lockd = !Pg.reqMet(id);
        var hov = Pg.btn('u:' + id, cx, cy, 20, chh - 2, (function (ii) { return function () { if (!Pg.has(ii) && Pg.buy(ii)) { Pg.buyFx = { id: ii, t: 0 }; } else Pg.denyT = { id: ii, t: .5 }; }; })(id), V.tips ? V.tips.upgrade(id) : NAMES[id]);
        g.fillStyle = own ? '#3a1a6a' : hov ? '#2a1450' : '#1a0c34'; g.fillRect(cx, cy, 20, 13); g.fillStyle = own ? '#c04df0' : ok ? '#7affe8' : '#3a2a60'; g.fillRect(cx, cy, 20, 1);
        var deny = Pg.denyT && Pg.denyT.id === id && Pg.denyT.t > 0, dx = deny ? Math.round(Math.sin(V.time * 60)) : 0;
        V.glyph(g, u.icon, cx + 7 + dx, cy + 4, own ? '#ffffff' : ok ? '#efe6ff' : '#7a6aa0', '#05020d');
        if (id.indexOf('hull') === 0) V.text(g, id.slice(4), cx + 15, cy + 2, '#c04df0');
        if (own) V.glyph(g, 'check', cx + 14, cy + 7, '#7affa8'); else if (lockd) V.glyph(g, 'lock', cx + 14, cy + 7, '#6a5a90');
        if (!own) { var keys = Object.keys(u.cost), yy = cy + 14; for (var k = 0; k < keys.length && k < 2; k++) { var rk = keys[k], have = rk === 'part' ? Pg.partCount() : Pg.res[rk] || 0; g.fillStyle = RCOL[rk]; g.fillRect(cx + 1 + k * 10, yy + 2, 2, 2); V.text(g, u.cost[rk], cx + 4 + k * 10, yy, have >= u.cost[rk] ? '#c8c0e0' : '#ff6a8a'); } if (keys.length > 2) { g.fillStyle = '#7a6aa0'; g.fillRect(cx + 19, yy + 4, 1, 1); } }
        if (Pg.buyFx && Pg.buyFx.id === id && Pg.buyFx.t < .8) { var rr = Math.round(Pg.buyFx.t * 30); g.fillStyle = '#ffffff'; for (var a = 0; a < 12; a++) g.fillRect(Math.round(cx + 10 + Math.cos(a / 12 * 6.28) * rr), Math.round(cy + 6 + Math.sin(a / 12 * 6.28) * rr * .6), 1, 1); }
      }
      y += Math.ceil(list.length / cols) * chh + 4;
    });
  };

  /* ---------- admin / cheat panel ---------- */
  Pg.admin = { tab: 0, spd: 1, tod: -1, wx: 0 };
  var TELE = [['earth', 'home'], ['mars', 'planet'], ['jupiter', 'gas'], ['saturn', 'ring'], ['ocean', 'ocean'], ['crystal', 'crystal'], ['lava', 'heat'], ['ice', 'cold'], ['huge', 'huge'], ['ringed', 'ring'], ['dyson', 'dyson'], ['shard', 'shard'], ['station', 'station'], ['ringworld', 'ruins'], ['bh', 'bh'], ['system', 'star']];
  var WXS = [null, 'rain', 'snow', 'dust', 'ash'];
  function slider(g, id, x, y, w, v, onSet, icon, tip) {
    V.glyph(g, icon, x, y + 1, '#c04df0', '#05020d'); var bx = x + 8, bw = w - 8; Pg.btn(id, bx, y, bw, 7, function () { onSet(clamp((M.x - bx) / (bw - 1), 0, 1)); }, tip);
    if (M.down && M.x >= bx && M.x < bx + bw && M.y >= y && M.y < y + 7) onSet(clamp((M.x - bx) / (bw - 1), 0, 1));
    g.fillStyle = '#2a0f4d'; g.fillRect(bx, y + 3, bw, 1); var kx = Math.round(bx + v * (bw - 1)); g.fillStyle = '#efe6ff'; g.fillRect(kx - 1, y + 1, 3, 5);
  }
  Pg.drawAdmin = function (g) {
    var W = V.W, H = V.H, pw = Math.min(W - 8, 196), ph = Math.min(H - 8, 150), x0 = (W - pw) >> 1, y0 = (H - ph) >> 1, A = Pg.admin, game = V.game;
    V.dissolve(g, .55, '#05020d'); Pg.panel(g, x0, y0, pw, ph);
    V.text(g, 'ADMIN', x0 + 5, y0 + 4, '#c04df0'); Pg.iconBtn(g, 'adclose', x0 + pw - 14, y0 + 2, 'close', '#ff9ab0', function () { Pg.open = null; }, 'CLOSE');
    var y = y0 + 15, x = x0 + 5;
    /* resources */
    V.text(g, 'ADD', x, y + 3, '#7a6aa0');
    RES.forEach(function (k, i) { Pg.iconBtn(g, 'ar:' + k, x + 16 + i * 14, y, k, RCOL[k], function () { Pg.gain(k, 10); }, '+10 ' + k.toUpperCase()); });
    Pg.iconBtn(g, 'ar:part', x + 16 + 5 * 14, y, 'part', RCOL.part, function () { var n = Pg.partCount(); Pg.parts['admin' + n] = 1; }, '+1 DRIVE PART');
    Pg.iconBtn(g, 'ar:all', x + 16 + 6 * 14, y, 'all', '#ffffff', function () { RES.forEach(function (k) { Pg.gain(k, 100); }); for (var i = 0; i < 3; i++) Pg.parts['admin' + i] = 1; }, '+100 ALL');
    y += 14; V.text(g, 'UPG', x, y + 3, '#7a6aa0');
    var ux = x + 16, uy = y; UP.forEach(function (u, i) { var id = u[0], cx = ux + (i % 15) * 11, cy = uy + Math.floor(i / 15) * 11; Pg.btn('au:' + id, cx, cy, 10, 10, function () { Pg.unlock(id, !Pg.has(id)); if (id === 'universal' && Pg.has(id) && Pg.onUniversal) Pg.onUniversal(true); }, V.tips ? V.tips.adminUp(id) : NAMES[id]); g.fillStyle = Pg.has(id) ? '#6a3ab0' : '#1a0c34'; g.fillRect(cx, cy, 10, 10); V.glyph(g, u[2], cx + 2, cy + 2, Pg.has(id) ? '#ffffff' : '#7a6aa0'); });
    Pg.iconBtn(g, 'au:all', x + pw - 26, y + 22, 'all', '#ffffff', function () { var all = UP.every(function (u) { return Pg.has(u[0]); }); UP.forEach(function (u) { Pg.unlock(u[0], !all); }); if (!all && Pg.onUniversal) Pg.onUniversal(true); }, 'ALL UPGRADES');
    y += 36;
    /* toggles */
    V.text(g, 'SET', x, y + 3, '#7a6aa0');
    Pg.iconBtn(g, 'at:god', x + 16, y, 'god', '#ffe070', function () { Pg.cheat.god = !Pg.cheat.god; }, 'GOD MODE', Pg.cheat.god);
    Pg.iconBtn(g, 'at:fuel', x + 30, y, 'inf', '#ffb060', function () { Pg.cheat.fuel = !Pg.cheat.fuel; }, 'INFINITE FUEL', Pg.cheat.fuel);
    Pg.iconBtn(g, 'at:skip', x + 44, y, 'skip', '#7affe8', function () { if (Pg.skipStory) Pg.skipStory(); }, 'SKIP CRASH+REPAIR', Pg.story.repaired);
    Pg.iconBtn(g, 'at:map', x + 58, y, 'eye', '#9af0ff', function () { if (V.galmap) V.galmap.revealAll(); }, 'REVEAL MAP', V.galmap && V.galmap.revealed);
    Pg.iconBtn(g, 'at:alien', x + 72, y, 'alien', '#a8ffd8', function () { if (V.aliens) V.aliens.adminSpawn(); }, 'SPAWN ALIEN SHIP');
    Pg.iconBtn(g, 'at:npc', x + 86, y, 'person', '#ffd0a0', function () { if (V.world) V.world.adminSpawn(); }, 'SPAWN INHABITANT');
    Pg.iconBtn(g, 'at:wx', x + 100, y, WXS[A.wx] ? WXS[A.wx] : 'sun', '#c8d8ff', function () { A.wx = (A.wx + 1) % WXS.length; if (V.world) V.world.setWeather(WXS[A.wx]); }, 'WEATHER');
    Pg.iconBtn(g, 'at:warp', x + 114, y, 'warp', '#ffffff', function () { Pg.unlock('universal'); Pg.open = null; if (V.story) V.story.warpNow(); }, 'WARP NOW');
    y += 15;
    slider(g, 'as:tod', x, y, 90, A.tod < 0 ? (V.surface.cur ? V.surface.cur.tod : .3) : A.tod, function (v) { A.tod = v; if (V.surface.cur) { V.surface.fixedTod = v; V.surface.cur.tod = v; } }, 'sun', 'TIME OF DAY');
    slider(g, 'as:spd', x + 96, y, 80, (Math.log(V.speed) / Math.log(2) + 2) / 4, function (v) { V.speed = +Math.pow(2, v * 4 - 2).toFixed(2); if (Math.abs(V.speed - 1) < .12) V.speed = 1; }, 'speed', 'GAME SPEED');
    V.text(g, 'X' + V.speed, x + 180, y + 1, '#7a6aa0');
    y += 12; V.text(g, 'GO', x, y + 3, '#7a6aa0');
    TELE.forEach(function (t, i) { var cx = x + 16 + (i % 12) * 14, cy = y + Math.floor(i / 12) * 13; Pg.iconBtn(g, 'ag:' + t[0], cx, cy, t[1], '#efe6ff', function () { if (Pg.teleport) Pg.teleport(t[0]); Pg.open = null; }, 'TO ' + t[0].toUpperCase()); });
  };

  /* ---------- input + per-frame ---------- */
  var taps = [];
  V.onPointerDown = function (m) { if (m.x < 20 && m.y < 20) { var now = performance.now(); taps.push(now); taps = taps.filter(function (t) { return now - t < 2500; }); if (taps.length >= 5) { taps = []; Pg.toggle('admin'); m.consumed = true; } } };
  Pg.toggle = function (k) { Pg.open = Pg.open === k ? null : k; if (Pg.open === 'up' && !Pg.story.repaired) Pg.open = null; if (V.ui) V.ui.refresh(); };
  Pg.update = function (dt) {
    if (V.keyPressed('l')) Pg.toggle('admin');
    if (V.keyPressed('u') && V.game.state !== 'title') Pg.toggle('up');
    if (Pg.open && V.keyPressed('Escape')) Pg.open = null;
    if (Pg.flashRes) for (var k in Pg.flashRes) Pg.flashRes[k] = Math.max(0, Pg.flashRes[k] - dt * 2);
    if (Pg.buyFx) Pg.buyFx.t += dt; if (Pg.denyT) Pg.denyT.t -= dt; if (Pg.tipHold && (Pg.tipHold.t -= dt) < 0) Pg.tipHold = null;
    Pg.handleInput();
  };
  Pg.beginFrame = function () { Pg.regions.length = 0; };
  Pg.drawOverlay = function (g) {
    if (Pg.open === 'up') Pg.drawUpgrades(g); else if (Pg.open === 'admin') Pg.drawAdmin(g);
    Pg.drawTip(g);
  };
  /* debug params */
  Pg.applyParams = function () {
    if (Q.get('res')) { var n = +Q.get('res') || 50; RES.forEach(function (k) { Pg.res[k] = n; }); for (var i = 0; i < 3; i++) Pg.parts['q' + i] = 1; }
    if (Q.get('up')) { var l = Q.get('up') === 'all' ? UP.map(function (u) { return u[0]; }) : Q.get('up').split(','); l.forEach(function (id) { if (Pg.byId[id]) Pg.up[id] = 1; }); }
    if (Q.get('speed')) V.speed = clamp(+Q.get('speed') || 1, .25, 4);
    if (Q.has('god')) Pg.cheat.god = true;
  };
})();
