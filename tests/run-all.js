// The Void — automated checks. Usage: node tests/run-all.js   (needs puppeteer-core + Chrome; see README)
// Prints a JSON report and exits non-zero on failure.
const pp = require(process.env.PUPPETEER || '/workspace/tools/node_modules/puppeteer-core');
const fs = require('fs'), path = require('path');
const ROOT = 'file://' + path.resolve(__dirname, '..', 'index.html');
const CHROME = process.env.CHROME || '/usr/bin/google-chrome';
const res = []; let fail = 0;
const ok = (name, pass, info) => { res.push({ name, pass, info }); if (!pass) fail++; console.log((pass ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await pp.launch({ executablePath: CHROME, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'], headless: 'new' });
  async function page(q, w = 1280, h = 800, opts = {}) {
    const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
    if (opts.reduced) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    p.errs = []; p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); }); p.on('pageerror', e => p.errs.push(String(e)));
    p.on('requestfailed', r => p.errs.push('requestfailed ' + r.url()));
    await p.goto(ROOT + (q ? '?' + q : '')); await sleep(opts.wait || 500); return p;
  }
  // 1+2: console errors and horizontal overflow at three widths, in several states
  for (const [w, h, mob] of [[1280, 800], [1920, 1080], [390, 844, 1]]) for (const q of ['', 'planet=earth', 'space', 'planet=ocean', 'space&map', 'planet=earth&admin', 'planet=earth&upgrades']) {
    const p = await page(q, w, h, { mobile: mob, wait: 1500 });
    if (q === '') { await p.mouse.click(w / 2, h / 2); await sleep(3500); }
    if (q.includes('map')) { await p.evaluate(() => VOID.galmap.open()); await sleep(600); for (let i = 0; i < 6; i++) { await p.mouse.move(w / 2, h / 2); await p.mouse.wheel({ deltaY: 400 }); await sleep(120); } await p.mouse.click(w / 2 + 20, h / 2 + 10); await sleep(300); }
    if (q.includes('admin')) { await p.keyboard.press('KeyL'); await sleep(500); }
    if (q.includes('upgrades')) { await p.evaluate(() => { VOID.prog.story.repaired = true; VOID.prog.toggle('up'); }); await sleep(500); await p.mouse.move(w / 2, h / 2); await sleep(300); }
    const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, bw: document.body.scrollWidth }));
    ok(`no console errors ${w}px ?${q}`, p.errs.length === 0, p.errs.slice(0, 3));
    ok(`no horizontal overflow ${w}px ?${q}`, ov.sw <= ov.iw && ov.bw <= ov.iw, ov); await p.close();
  }
  // 3: frame rate in title, Earth, space, gas giant and black hole (real requestAnimationFrame)
  const fpsCases = { title: '', earth: 'planet=earth', space: 'space', gas: 'planet=gas', blackhole: 'space&bh' };
  for (const k in fpsCases) {
    const p = await page(fpsCases[k], 1280, 800, { wait: 800 });
    if (k === 'blackhole') await p.evaluate(() => { const f = VOID.Gen.find('bh', 0, 0), s = VOID.space.ship, bh = f.body; s.x = bh.x + bh.r * 4.5; s.y = bh.y; s.vx = 0; s.vy = 0; });
    await sleep(1200); const f = await p.evaluate(() => new Promise(r => { let n = 0, t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else r({ fps: +(n / ((performance.now() - t0) / 1000)).toFixed(1), core: +VOID.fps.toFixed(1), state: VOID.game.state }); })(); }));
    ok(`fps ${k}`, f.fps >= 50, f); await p.close();
  }
  // 4: determinism per seed — galaxy contents and a rendered surface frame
  const det = async (seed) => { const p = await page('sim&seed=' + seed + '&planet=desert'); const r = await p.evaluate(() => { const G = VOID.Gen; const cells = []; for (let x = -2; x <= 2; x++) for (let y = -2; y <= 2; y++) { const c = G.genCell(x, y); cells.push(JSON.stringify((c.systems || []).map(s => [Math.round(s.x), Math.round(s.y), (s.bodies || []).map(b => b.type + ':' + b.r)]))); } VOID.stepSim(3, 60); const d = VOID.ctx.getImageData(0, 0, VOID.W, VOID.H).data; let h = 0; for (let i = 0; i < d.length; i += 4) h = (h * 31 + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) >>> 0; let ch = 0; const s = cells.join('|'); for (let i = 0; i < s.length; i++) ch = (ch * 31 + s.charCodeAt(i)) >>> 0; return { cells: ch, frame: h, body: VOID.surface.cur.id }; }); await p.close(); return r; };
  const a1 = await det(777), a2 = await det(777), a3 = await det(778);
  ok('determinism: same seed -> same galaxy', a1.cells === a2.cells, [a1.cells, a2.cells]);
  ok('determinism: different seed -> different galaxy', a1.cells !== a3.cells, [a1.cells, a3.cells]);
  ok('determinism: same seed -> same world id', a1.body === a2.body, [a1.body, a2.body]);
  // 5: frame-rate independence (walk 2 s and thrust 2 s at 30/60/144 simulated fps)
  const indep = {};
  for (const fps of [30, 60, 144]) {
    const p = await page('sim&planet=earth&day'); indep[fps] = await p.evaluate((fps) => { const V = VOID, pl = V.surface.pl; V.stepSim(1, 60); const x0 = pl.x; V.virtualKeys(['ArrowRight'], true); V.stepSim(2, fps); V.virtualKeys(['ArrowRight'], false); const walk = pl.x - x0; return { walk: +walk.toFixed(2) }; }, fps); await p.close();
    const q = await page('sim&space'); Object.assign(indep[fps], await q.evaluate((fps) => { const V = VOID, s = V.space.ship; V.stepSim(.5, 60); s.x = 4000; s.y = 4000; s.vx = s.vy = 0; s.ang = 0; const x0 = s.x; V.virtualKeys(['ArrowUp'], true); V.stepSim(2, fps); V.virtualKeys(['ArrowUp'], false); return { thrust: +(s.x - x0).toFixed(2) }; }, fps)); await q.close();
  }
  const rel = (k) => { const v = [30, 60, 144].map(f => indep[f][k]); const m = Math.max(...v), n = Math.min(...v); return (m - n) / Math.max(1e-6, Math.abs(m)); };
  ok('fps independence: walking distance within 3%', rel('walk') < .03, indep);
  ok('fps independence: thrust distance within 3%', rel('thrust') < .03, indep);
  // 6: reduced motion
  { const p = await page('planet=earth', 1280, 800, { reduced: true, wait: 1500 }); const r = await p.evaluate(() => ({ reduced: VOID.reduced })); ok('prefers-reduced-motion honoured', r.reduced === true && p.errs.length === 0, r); await p.close(); }
  // 7: land/takeoff loop (home system)  7b: full story loop  8: save/load
  { const p = await page('sim&fresh&seed=20241&nocrash'); await p.evaluate(() => localStorage.clear()); const log = await p.evaluate(fs.readFileSync(path.join(__dirname, 'loop-snippet.js'), 'utf8').replace(/void:v1/g, 'void:v2'));
    const pass = log.some(l => /^after board space/.test(l)) && log.some(l => /^near mars hint 0,0:6/.test(l)) && log.some(l => /^surface surface\/play/.test(l));
    ok('land/takeoff loop: Earth -> board -> launch -> space -> land Mars -> walk', pass && p.errs.length === 0, log.slice(0, 8)); await p.close(); }
  { const p = await page('sim&fresh&seed=20241'); await p.evaluate(() => localStorage.clear()); const log = await p.evaluate(fs.readFileSync(path.join(__dirname, 'loop2-snippet.js'), 'utf8'));
    const has = (re) => log.some(l => re.test(l));
    const pass = has(/^crash surface\/crash/) && has(/^hint wreck/) && has(/^repaired true/) && has(/^launch space/) && has(/^buy true has true/) && has(/^warp cine/) && has(/^arrived space/) && /home false/.test(log[log.length - 1]) && /^landed surface/.test(log[log.length - 1]);
    ok('full loop: crash -> scrap -> repair -> launch -> solar system -> universal drive -> warp -> land on a generated world', pass && p.errs.length === 0, log);
    const saved = await p.evaluate(() => { VOID.prog.res.ore = 77; VOID.save.write(); return JSON.parse(localStorage.getItem('void:v2')); }); await p.close();
    const q = await page('sim&seed=20241'); const r = await q.evaluate(() => { const V = VOID; V.game.clicked = true; for (let i = 0; i < 20 && V.game.state === 'title'; i++) V.stepSim(.5, 60); V.stepSim(1, 60); return { state: V.game.state, body: V.surface.cur && V.surface.cur.id, x: Math.round(V.surface.pl.x), visited: V.game.visitedCount, ore: V.prog.res.ore, uni: V.prog.has('universal'), repaired: V.prog.story.repaired }; });
    ok('save/load: resumes on the saved world and spot with progression', r.state === 'surface' && r.body === saved.body && Math.abs(r.x - saved.surf.x) < 40 && r.visited >= 2 && r.ore === 77 && r.uni && r.repaired, { saved: { body: saved.body, x: saved.surf && saved.surf.x }, loaded: r }); await q.close(); }
  // 9: v1 save migrates; reset clears
  { const p = await page('sim&seed=20241'); const r = await p.evaluate(() => { localStorage.clear(); localStorage.setItem('void:v1', JSON.stringify({ v: 1, seed: 20241, state: 'surface', body: '0,0:6', surf: { x: 300 }, visited: ['0,0:3', '0,0:6'] })); return 1; }); await p.close();
    const q = await page('sim&seed=20241'); const m = await q.evaluate(() => { const V = VOID; V.game.clicked = true; for (let i = 0; i < 20 && V.game.state === 'title'; i++) V.stepSim(.5, 60); V.stepSim(1, 60); const o = { state: V.game.state, body: V.surface.cur && V.surface.cur.id, repaired: V.prog.story.repaired }; V.save.clear(); o.cleared = !localStorage.getItem('void:v1') && !localStorage.getItem('void:v2'); return o; });
    ok('save migration v1 -> v2, and reset clears', m.state === 'surface' && m.body === '0,0:6' && m.repaired && m.cleared && q.errs.length === 0, m); await q.close(); }
  // 10: crash intro is skippable after first view
  { const p0 = await page('sim'); await p0.evaluate(() => { localStorage.clear(); localStorage.setItem('void:intro', '1'); }); await p0.close();
    const p = await page('sim&fresh'); const r = await p.evaluate(() => { const V = VOID; V.game.clicked = true; for (let i = 0; i < 20 && V.game.state === 'title'; i++) V.stepSim(.5, 60); V.stepSim(.6, 60); const a = V.game.state; V.virtualKeys([' '], true); V.stepSim(1 / 60, 60); V.virtualKeys([' '], false); V.stepSim(.5, 60); return { before: a, after: V.game.state, mode: V.surface.mode }; });
    ok('crash cinematic can be skipped', r.before === 'cine' && r.after === 'surface', r); await p.close(); }
  // site size
  const du = (d) => fs.readdirSync(d, { withFileTypes: true }).reduce((s, e) => s + (e.isDirectory() ? du(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size), 0);
  const size = du(path.resolve(__dirname, '..')); ok('site size under 8 MB', size < 8 * 1024 * 1024, (size / 1048576).toFixed(2) + ' MB');
  await b.close(); fs.writeFileSync(path.join(__dirname, 'last-report.json'), JSON.stringify(res, null, 1));
  console.log(`\n${res.length - fail}/${res.length} passed`); process.exit(fail ? 1 : 0);
})();
