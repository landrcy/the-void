/* The Void — readable tooltips: one DOM panel (VT323, high contrast, pixel border) for every icon.
   Sources: mouse hover (after a short delay), touch long-press, keyboard focus (arrow keys in panels, Tab on HTML buttons).
   Tips are strings or functions returning { t: title, d: one-line description, s: state, sc: state colour, c: cost, gv: gain, n: [notes] }. */
(function () {
  'use strict';
  var V = window.VOID, Pg = V.prog, M = V.mouse, RCOL = Pg.RCOL, T = V.tips = {};
  var RN = { scrap: 'Scrap', ore: 'Ore', crystal: 'Crystal', tech: 'Tech', essence: 'Essence', part: 'Drive part' };
  var RD = { scrap: 'Salvaged metal. Lies around wrecks and in the belts.', ore: 'Raw metal. Hold E on a deposit, or laser asteroids.', crystal: 'Glowing crystal from deposits and asteroids.', tech: 'Circuitry. Trade with robots, merchants and motherships.', essence: 'Rare light. Gifts from glowing beings and drone swarms.', part: 'Universal Drive part.' };
  var PARTN = 'Parts: Ganymede, Titan, the Mars mechanic, derelict arks.';
  var UD = {
    thrust: 'Engines push 35% harder.', brakes: 'Stop much faster with Down / S.', shield: 'Double fuel tank, and bumps no longer shake you.', scanner: 'Scanner pulse (Q) reaches more than twice as far.',
    magnet: 'Loot drifts to you from further away.', autopilot: 'Pick a target on the map and the ship flies itself.', gear: 'Lets you land on gas giants and huge worlds.',
    universal: 'Leave the solar system: warp past the boundary into the universe.', hyper: 'Jump up to 14 sectors from the galaxy map.', bhsurf: 'Slingshot around black holes. Hold S to fall through.',
    cloak: 'C hides the ship. Crystal escorts stop nudging you.', timeslow: 'T slows the universe around you.', laser: 'Hold F to mine ore and crystal from asteroids.', tractor: 'Pulls loot in from far away.',
    drone: 'A small drone flies out and fetches nearby loot.', galaxy: 'Jump anywhere in the galaxy from the map.', hull1: 'Cosmetic hull: side pods.', hull2: 'Cosmetic hull: a glowing warp ring.', hull3: 'Cosmetic hull: crystal plating.',
    jetpack: 'Hold Space in the air to fly for a moment.', dbljump: 'Jump once more in mid-air.', run: 'Walk and run faster.', oxygen: 'Breathe on airless worlds with no timer.',
    heat: 'Walk on burning worlds with no timer.', cold: 'Walk on frozen worlds with no timer.', visor: 'Cosmetic: a gold sun visor for the suit.', grapple: 'G swings a hook up onto ledges.',
    multitool: 'Mine 3x faster for double yield.', rover: 'R rides a hoverboard over water, lava and steps.', translator: 'Bubbles also show what inhabitants mean.'
  };
  var SEC = { ship: 'Ship upgrade', adv: 'Advanced ship upgrade', suit: 'Suit upgrade' }; T.UD = UD; T.SEC = SEC;
  T.upgrade = function (id) {
    return function () {
      var u = Pg.byId[id], own = Pg.has(id), req = Pg.reqMet(id), ok = Pg.canAfford(id), o = { t: Pg.NAMES[id], d: UD[id] || '', n: [] }, lvl = id.indexOf('hull') === 0 ? 'Tier ' + (+id.slice(4) + 1) + ' of 4' : SEC[u.sec || u[1]] || '';
      if (own) { o.s = 'Owned' + (lvl ? ' · ' + lvl : ''); o.sc = 'ok'; }
      else if (!req) { o.s = 'Locked · ' + lvl; o.sc = 'bad'; o.n.push('Needs ' + (u.req || []).map(function (r) { return Pg.NAMES[r]; }).join(', ') + ' first.'); }
      else if (ok) { o.s = 'Ready to build · ' + lvl; o.sc = 'go'; }
      else { o.s = 'Not built · ' + lvl; o.sc = 'dim'; }
      if (!own) o.c = u.cost;
      if (!own && u.cost.part) o.n.push(PARTN);
      if (!own && req) o.n.push(ok ? 'Click or Enter to build.' : 'Need ' + Object.keys(u.cost).filter(function (k) { return (k === 'part' ? Pg.partCount() : Pg.res[k] || 0) < u.cost[k]; }).map(function (k) { return (u.cost[k] - (k === 'part' ? Pg.partCount() : Pg.res[k] || 0)) + ' more ' + (RN[k] || k); }).join(', ') + '.');
      return o;
    };
  };

  T.adminUp = function (id) { var f = T.upgrade(id); return function () { var o = f(); o.c = null; o.n = ['Admin: click to ' + (Pg.has(id) ? 'remove' : 'grant') + ' for free.']; return o; }; };
  var TELN = { earth: 'Earth', mars: 'Mars', jupiter: 'Jupiter', saturn: 'Saturn', ocean: 'an ocean world', crystal: 'a crystal world', lava: 'a lava world', ice: 'an ice world', huge: 'a huge planet', ringed: 'a ringed planet', dyson: 'a Dyson swarm', shard: 'a shattered planet', station: 'a station', ringworld: 'a ringworld', bh: 'a black hole', system: 'a random new system' };
  /* fixed descriptions by region id (admin, map, title, panels) */
  T.desc = {
    upclose: { t: 'Close', d: 'Close the upgrade screen (U or Esc).' }, adclose: { t: 'Close', d: 'Close the admin panel (L or Esc).' },
    'ar:all': { t: '+100 of everything', d: 'Adds 100 of each resource and all 3 drive parts.', n: ['Admin'] }, 'ar:part': { t: '+1 drive part', d: 'Adds one Universal Drive part.', n: ['Admin'] },
    'au:all': { t: 'All upgrades', d: 'Grant every upgrade, or remove them all if you have them.', n: ['Admin'] },
    'at:god': function () { return { t: 'God mode', d: 'No hazards, no heat, no damage.', s: Pg.cheat.god ? 'On' : 'Off', sc: Pg.cheat.god ? 'ok' : 'dim', n: ['Admin'] }; },
    'at:fuel': function () { return { t: 'Infinite fuel', d: 'Boost as long as you like.', s: Pg.cheat.fuel ? 'On' : 'Off', sc: Pg.cheat.fuel ? 'ok' : 'dim', n: ['Admin'] }; },
    'at:skip': function () { return { t: 'Skip story', d: 'Skip the crash and repair; the ship is ready.', s: Pg.story.repaired ? 'Done' : 'Not done', sc: Pg.story.repaired ? 'ok' : 'dim', n: ['Admin'] }; },
    'at:map': { t: 'Reveal map', d: 'Marks every nearby system as discovered.', n: ['Admin'] }, 'at:alien': { t: 'Spawn alien ship', d: 'Mothership, swarm, crystal or ark, in turn. In space only.', n: ['Admin'] },
    'at:npc': { t: 'Spawn inhabitant', d: 'Places an inhabitant next to you. On foot only.', n: ['Admin'] }, 'at:wx': { t: 'Weather', d: 'Cycle clear, rain, snow, dust and ash.', n: ['Admin'] },
    'at:warp': { t: 'Warp now', d: 'Grants the Universal Drive and warps to a new system.', n: ['Admin'] },
    'as:tod': { t: 'Time of day', d: 'Drag to set the sun on this world.', n: ['Admin'] }, 'as:spd': function () { return { t: 'Game speed', d: 'Drag from quarter speed to 4x.', s: 'Now x' + V.speed, sc: 'dim', n: ['Admin'] }; },
    'gm:in': { t: 'Zoom in', d: 'Closer: galaxy, sector, system. Also + or the mouse wheel.' }, 'gm:out': { t: 'Zoom out', d: 'Further: system, sector, galaxy. Also - or the mouse wheel.' },
    'gm:ctr': { t: 'Center', d: 'Center the map on your ship.' }, 'gm:gal': { t: 'Galaxy view', d: 'Toggle between the whole spiral galaxy and your ship.' }, 'gm:x': { t: 'Close map', d: 'Back to flying (M, Tab or Esc).' },
    'gm:pin': function () { var t = V.galmap && V.galmap.sel; return t && t.kind === 'pin' ? { t: 'Remove pin', d: 'Take this pin off the map and HUD.' } : { t: 'Pin', d: 'Mark this spot. Pins show on the map and at the screen edge.' }; },
    'title:reset': { t: 'Reset save', d: 'Start over from the crash. Asks to confirm.' }, 'title:yes': { t: 'Yes, reset', d: 'Erase all progress.', sc: 'bad', s: 'Cannot be undone' }, 'title:no': { t: 'Keep save', d: 'Cancel the reset.' }
  };
  for (var tk in TELN) T.desc['ag:' + tk] = { t: 'Teleport', d: 'Go to ' + TELN[tk] + ' right away.', n: ['Admin'] };
  ['scrap', 'ore', 'crystal', 'tech', 'essence'].forEach(function (k) { T.desc['ar:' + k] = function () { return { t: '+10 ' + RN[k], d: RD[k], s: 'You have ' + (Pg.res[k] || 0), sc: 'dim', n: ['Admin'] }; }; });
  T.desc['gm:go'] = function () {
    var t = V.galmap && V.galmap.sel; if (!t) return null; var info = V.galmap.canInfo ? V.galmap.canInfo(t) : {}, o = { t: 'Go', n: [] };
    if (info.auto) { o.t = 'Autopilot'; o.d = 'The ship flies itself to the selection.'; o.s = 'Ready'; o.sc = 'go'; }
    else if (info.jump) { o.t = info.jump === 'galaxy' ? 'Galaxy jump' : info.jump === 'hyper' ? 'Hyperspace jump' : 'Warp'; o.d = 'Jump straight to the selection.'; o.s = 'Ready'; o.sc = 'go'; }
    else { o.d = 'Travel to the selection.'; o.s = 'Locked'; o.sc = 'bad'; o.n.push(Pg.has('universal') ? 'Needs Autopilot for close targets, or Hyperspace for far ones.' : 'Needs the Universal Drive to leave home.'); }
    return o;
  };

  var KN = { villager: 'Villager', nomad: 'Nomad', robot: 'Robot', glow: 'Glowing being', merchant: 'Merchant', sage: 'Sage', mechanic: 'Mechanic', mother: 'Mothership', swarm: 'Drone swarm', ark: 'Derelict ark', crystal: 'Crystalline vessel' };
  var KD = { mother: 'A peaceful trading ship. Fly close and press E to hail.', swarm: 'Friendly drones. Hail them and they lead you to a cache.', ark: 'An abandoned ark. Press E nearby to salvage it.', crystal: 'Territorial but peaceful. It escorts you out of its space.' };
  T.talkTip = function (kind, dd) {
    var o = { t: KN[kind] || 'Stranger', d: dd.desc || '', n: (dd.n || []).slice() };
    if (dd.act) { var can = !dd.cost || Pg.affordCost(dd.cost); o.s = can ? 'Press E again to accept' : 'Not enough to trade'; o.sc = can ? 'go' : 'bad'; }
    if (dd.cost) { o.c = dd.cost; o.cl = 'Give'; } if (dd.gain && Object.keys(dd.gain).length) { o.gv = dd.gain; o.gl = 'Get'; }
    if (kind !== 'crystal' && !Pg.has('translator')) o.n.push('The Translator upgrade adds their words.');
    return o;
  };
  T.bubble = null;
  T.bubbleAt = function (id, x, y, w, h, kind, dd) { var r = { id: 'bub:' + id, x: x, y: y, w: w, h: h, tip: function () { return T.talkTip(kind, dd); } }; Pg.soft.push(Object.assign({ soft: 1 }, r)); if (kind !== 'crystal') T.bubble = r; };
  T.alien = function (e) { return function () { return { t: KN[e.kind], d: KD[e.kind], s: Math.round(e.d || 0) < 160 && e.kind !== 'crystal' ? 'In range: press E' : 'Fly closer to interact', sc: 'dim', n: e.kind === 'crystal' ? ['Cloak makes it ignore you.'] : [] }; }; };
  T.res = function (k) { return function () { var n = k === 'part' ? Pg.partCount() : Pg.res[k] || 0; return { t: RN[k], d: RD[k], s: 'You have ' + n + (k === 'part' ? ' of 3' : ''), sc: 'dim', n: k === 'part' ? [PARTN] : [] }; }; };
  T.cost = function (c) { return c; };
  /* soft (hover-only) regions: never consume clicks */
  Pg.soft = [];
  Pg.softTip = function (id, x, y, w, h, tip) { Pg.soft.push({ id: id, x: x, y: y, w: w, h: h, tip: tip, soft: 1 }); };
  var bf = Pg.beginFrame; Pg.beginFrame = function () { bf(); Pg.soft.length = 0; T.bubble = null; };
  function softAt(x, y) { for (var i = Pg.soft.length - 1; i >= 0; i--) { var r = Pg.soft[i]; if (x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h) return r; } return null; }
  /* long-press also on soft regions */
  var hi = Pg.handleInput; Pg.handleInput = function () { hi(); if (M.long) { var r = Pg.hitTest(M.x, M.y) || softAt(M.x, M.y); if (r && r.tip) Pg.tipHold = { id: r.id, r: r, t: 3 }; } if (M.pressed && Pg.tipHold && Pg.tipHold.t < 2.9) Pg.tipHold = null; };
  /* keyboard focus inside the upgrade / admin panels: arrows move, Enter / Space activates */
  T.focus = null; T.kbd = false;
  function panelRegions() { return Pg.regions.filter(function (r) { return r.tip; }); }
  T.keys = function () {
    if (!Pg.open) { T.focus = null; return; }
    var dirs = [['ArrowLeft', -1, 0], ['ArrowRight', 1, 0], ['ArrowUp', 0, -1], ['ArrowDown', 0, 1], ['a', -1, 0], ['d', 1, 0], ['w', 0, -1], ['s', 0, 1]], L = panelRegions(); if (!L.length) return;
    var cur = T.focus && L.filter(function (r) { return r.id === T.focus; })[0];
    dirs.forEach(function (dd) {
      if (!V.keyPressed(dd[0])) return; T.kbd = true; if (!cur) { cur = L.filter(function (r) { return /^(u:|ar:)/.test(r.id); })[0] || L[0]; T.focus = cur.id; return; }
      var cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2, best = null, bs = 1e9;
      L.forEach(function (r) { if (r === cur) return; var dx = r.x + r.w / 2 - cx, dy = r.y + r.h / 2 - cy, along = dx * dd[1] + dy * dd[2], perp = Math.abs(dx * dd[2]) + Math.abs(dy * dd[1]); if (along <= 1) return; var sc = along + perp * 2.5; if (sc < bs) { bs = sc; best = r; } });
      if (best) { cur = best; T.focus = best.id; }
    });
    if (cur && T.kbd && (V.keyPressed('Enter') || V.keyPressed(' ')) && cur.fn) cur.fn();
  };
  var pu = Pg.update; Pg.update = function (dt) { T.keys(); pu(dt); if (M.moved > 2 || M.pressed) T.kbd = false; };
  /* focus ring drawn on the canvas */
  T.drawFocus = function (g) { if (!T.kbd || !T.focus || !Pg.open) return; var r = Pg.regions.filter(function (q) { return q.id === T.focus; })[0]; if (!r) return; g.fillStyle = '#ffffff'; g.fillRect(r.x - 1, r.y - 1, r.w + 2, 1); g.fillRect(r.x - 1, r.y + r.h, r.w + 2, 1); g.fillRect(r.x - 1, r.y, 1, r.h); g.fillRect(r.x + r.w, r.y, 1, r.h); };

  /* ---------- the DOM panel ---------- */
  var el = document.createElement('div'); el.id = 'tip'; el.setAttribute('role', 'tooltip'); el.hidden = true; document.body.appendChild(el);
  var icoC = {};
  function ico(k) { if (icoC[k]) return icoC[k]; var c = document.createElement('canvas'); c.width = c.height = 7; V.glyph(c.getContext('2d'), k, 0, 1, RCOL[k] || '#efe6ff', '#05020d'); return (icoC[k] = c.toDataURL()); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function costHtml(c, gain) { var h = ''; for (var k in c) { var have = k === 'part' ? Pg.partCount() : Pg.res[k] || 0, ok = gain || have >= c[k]; h += '<span class="tc' + (ok ? '' : ' no') + '"><img alt="" src="' + ico(k) + '">' + c[k] + '<i>' + RN[k] + (gain ? '' : ' (' + have + ')') + '</i></span>'; } return h; }
  function html(o) {
    if (typeof o === 'string') o = { t: o };
    var h = '<b>' + esc(o.t) + '</b>'; if (o.d) h += '<p>' + esc(o.d) + '</p>'; if (o.s) h += '<p class="st ' + (o.sc || '') + '">' + esc(o.s) + '</p>';
    if (o.c && Object.keys(o.c).length) h += '<div class="row"><em>' + (o.cl || 'Cost') + '</em>' + costHtml(o.c) + '</div>';
    if (o.gv) h += '<div class="row"><em>' + (o.gl || 'Get') + '</em>' + costHtml(o.gv, true) + '</div>';
    (o.n || []).forEach(function (n) { h += '<p class="nt">' + esc(n) + '</p>'; }); return h;
  }
  T.html = html;
  var shownKey = null, candKey = null, candT = 0, lastHtml = '', graceT = 0, lastRect = null, domTip = null;
  /* HTML buttons (top-right, touch pad) hand their tip in here on hover / focus */
  T.dom = function (key, tip, btn) { domTip = tip ? { id: key, tip: tip, el: btn, kb: btn && btn.matches && btn.matches(':focus-visible') } : (domTip && domTip.id === key ? null : domTip); };
  T.update = function (dt) {
    var src = null, rect = null, delay = .35, S = V.S;
    if (Pg.tipHold) { src = Pg.tipHold.r; delay = 0; }
    else if (T.kbd && T.focus && Pg.open) { src = Pg.regions.filter(function (r) { return r.id === T.focus; })[0]; delay = .12; }
    else if (domTip) { src = domTip; delay = domTip.kb ? .12 : .35; }
    else if (M.has && !V.touchMode && !M.down) { src = Pg.hitTest(M.x, M.y) || softAt(M.x, M.y); if (src && src.soft && Pg.open && src.id.indexOf('res:') !== 0) src = null; if (src && !src.tip) src = null; }
    if (!src && T.bubble && !Pg.open) { src = T.bubble; delay = .5; }
    if (src && src.el) { var b = src.el.getBoundingClientRect(); rect = { x: b.left, y: b.top, w: b.width, h: b.height }; }
    else if (src) rect = { x: src.x * S, y: src.y * S, w: src.w * S, h: src.h * S };
    var key = src ? src.id : null;
    if (key !== candKey) { candKey = key; candT = 0; } else candT += dt;
    if (key && (candT >= delay || (shownKey && key !== shownKey && candT >= .06))) { var tip = T.desc[key] || src.tip; tip = typeof tip === 'function' ? tip() : tip; if (tip) { shownKey = key; graceT = .12; show(html(tip), rect); return; } }
    if (!key || key !== shownKey) { graceT -= dt; if (graceT <= 0 && shownKey) { shownKey = null; el.hidden = true; lastHtml = ''; } }
  };
  function show(h, r) {
    if (!isFinite(r.x + r.y + r.w + r.h)) return;
    if (h !== lastHtml) { el.innerHTML = h; lastHtml = h; }
    if (el.hidden) el.hidden = false;
    var vw = innerWidth, vh = innerHeight, pad = 6, tw = el.offsetWidth, th = el.offsetHeight, gap = 6;
    var x = r.x + r.w / 2 - tw / 2, y = r.y + r.h + gap;
    if (y + th > vh - pad) y = r.y - th - gap;
    if (y < pad) { y = Math.max(pad, Math.min(vh - th - pad, r.y + r.h / 2 - th / 2)); x = r.x + r.w + gap; if (x + tw > vw - pad) x = r.x - tw - gap; }
    x = Math.max(pad, Math.min(vw - tw - pad, x));
    var L = Math.round(x) + 'px', Tp = Math.round(y) + 'px'; if (el.style.left !== L) el.style.left = L; if (el.style.top !== Tp) el.style.top = Tp;
  }
  T.visible = function () { return !el.hidden; };
  T.hide = function () { shownKey = null; candKey = null; el.hidden = true; lastHtml = ''; domTip = null; };
  /* replace the old canvas tooltip */
  var lastT = 0, lastST = -1, SIM = V.q && V.q.has('sim'); Pg.drawTip = function (g) { var now = performance.now(), dt = SIM ? (lastST < 0 ? 1 / 60 : Math.max(1 / 60, Math.min(1, V.time - lastST))) : lastT ? Math.min(.1, (now - lastT) / 1000) : 1 / 60; lastT = now; lastST = V.time; T.drawFocus(g); T.update(dt); };
})();
