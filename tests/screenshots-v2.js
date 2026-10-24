// node tests/screenshots-v2.js [outdir] -> v2 preview set (default /workspace/preview/the-void/v2)
const pp = require(process.env.PUPPETEER || '/workspace/tools/node_modules/puppeteer-core');
const path = require('path'), fs = require('fs');
const ROOT = 'file://' + path.resolve(__dirname, '..', 'index.html'), OUT = process.argv[2] || '/workspace/preview/the-void/v2';
fs.mkdirSync(OUT, { recursive: true }); const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await pp.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
  const errs = [];
  async function shot(name, q, js, o = {}) {
    if (only && !only.test(name)) return;
    const p = await b.newPage(); await p.setViewport({ width: o.w || 1280, height: o.h || 800, isMobile: !!o.mobile, hasTouch: !!o.mobile, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(name + ': ' + e)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    await p.goto(ROOT + '?' + q); await sleep(400);
    if (o.pre) await p.evaluate(o.pre);
    let r; if (js) r = await p.evaluate(js); if (o.mouse) { await p.mouse.move(o.mouse[0], o.mouse[1]); await sleep(150); await p.evaluate('VOID.stepSim(.1,60)'); }
    await sleep(80); await p.screenshot({ path: path.join(OUT, name + '.png') }); await p.close(); console.log(name, r !== undefined ? JSON.stringify(r) : '');
  }
  const ST = `const V=VOID,g=V.game,Su=V.surface,Pg=V.prog;localStorage.clear();g.clicked=true;for(let i=0;i<20&&g.state==='title';i++)V.stepSim(.5,60);`;
  const space = (kind, k = 4, ang = 0) => `(()=>{const V=VOID,G=V.Gen;V.prog.up.universal=1;V.prog.story.warped=true;const f=G.find('${kind}',G.CELL*2,0);if(!f)return 'none';const b=f.body;G.updateCell(b.cell,G.t);const s=V.space.ship;s.x=b.x+b.r*${k}*Math.cos(${ang});s.y=b.y+b.r*${k}*Math.sin(${ang});s.vx=s.vy=0;V.space.cam.x=s.x;V.space.cam.y=s.y;V.stepSim(1.5,60);return b.id+' '+b.type+' r'+b.r;})()`;
  for (const [w, h, m, sfx] of [[1280, 800, 0, ''], [1920, 1080, 0, '-1920'], [390, 844, 1, '-390']]) {
    const o = { w, h, mobile: !!m };
    await shot('title' + sfx, 'sim', `(()=>{localStorage.setItem('void:v2',JSON.stringify({v:2,seed:20241,state:'surface',body:'0,0:3',surf:{x:10}}));VOID.stepSim(3,60)})()`, o);
    await shot('cine-entry' + sfx, 'sim&fresh', `(()=>{${ST}VOID.stepSim(2.4,60)})()`, o);
    await shot('crash-impact' + sfx, 'sim&fresh', `(()=>{${ST}for(let i=0;i<30&&g.state==='cine';i++)V.stepSim(.5,60);V.stepSim(1.62,60)})()`, o);
    await shot('wreck-scrap' + sfx, 'sim&fresh&day', `(()=>{${ST}for(let i=0;i<30&&g.state==='cine';i++)V.stepSim(.5,60);V.stepSim(3.5,60);Pg.res.scrap=5;V.stepSim(.2,60)})()`, o);
    await shot('space-home' + sfx, 'sim&space&res=12', `VOID.stepSim(2,60)`, o);
    await shot('upgrades' + sfx, 'sim&planet=earth&res=40&up=thrust,gear,run,visor', `(()=>{VOID.prog.story.repaired=true;VOID.prog.toggle('up');VOID.stepSim(.5,60)})()`, Object.assign({ mouse: [w / 2, h / 2 - 20] }, o));
    await shot('admin' + sfx, 'sim&planet=earth', `(()=>{VOID.prog.toggle('admin');VOID.stepSim(.5,60)})()`, o);
    await shot('map-system' + sfx, 'sim&space', `(()=>{VOID.galmap.open();VOID.stepSim(1.5,60)})()`, o);
  }
  await shot('map-sector', 'sim&space&up=all', `(()=>{const M=VOID.galmap;M.revealAll();M.open();M.zt=M.z=Math.log(400);VOID.stepSim(1.5,60)})()`);
  await shot('map-galaxy', 'sim&space', `(()=>{const M=VOID.galmap;M.revealAll();M.open();M.zt=M.z=Math.log(30000);VOID.stepSim(1.5,60)})()`);
  await shot('boundary', 'sim&space', `(()=>{const s=VOID.space.ship;s.x=VOID.Gen.HOME_EDGE+200;s.y=300;s.vx=120;s.ang=0;VOID.virtualKeys(['ArrowUp'],true);VOID.stepSim(1.5,60)})()`);
  await shot('warp', 'sim&space&up=universal', `(()=>{VOID.story.warpTo(null);VOID.stepSim(2.6,60)})()`);
  await shot('warp-arrive', 'sim&space&up=universal', `(()=>{VOID.story.warpTo(null);VOID.stepSim(6,60)})()`);
  for (const k of ['huge', 'hugegas', 'dyson', 'ringworld', 'shattered', 'multiring']) await shot('body-' + k, 'sim&space&god', space(k, k === 'dyson' ? 2.2 : /huge/.test(k) ? 1.25 : k === 'ringworld' ? 1.1 : 2.6, -.6));
  await shot('surface-huge', 'sim&planet=huge&day', `VOID.stepSim(3,60)`);
  for (let i = 0; i < 4; i++) await shot('alien-' + i, 'sim&space', `(()=>{const s=VOID.space.ship;s.x=2600;s.y=5200;s.vx=s.vy=0;s.ang=0;for(let j=0;j<=${i};j++)VOID.aliens.adminSpawn();VOID.aliens.extra.splice(0,VOID.aliens.extra.length-1);const e=VOID.aliens.extra[0];e.x=e.hx=s.x+110;e.y=e.hy=s.y-20;if(e.kind==='mother'){e.t=0;e.hx=s.x+130-200;e.hy=s.y-40;}VOID.stepSim(1.2,60);return e.kind})()`);
  await shot('npc-europa', 'sim&planet=europa&up=translator', `(()=>{const V=VOID,Su=V.surface;V.stepSim(2,60);const n=V.world.npcs(Su.cur);if(!n.length)return 'no npc';Su.pl.x=n[0].x-14;V.stepSim(.5,60);V.virtualKeys(['e'],true);V.stepSim(1/60,60);V.virtualKeys(['e'],false);V.stepSim(.6,60);return n.map(x=>x.k)})()`);
  await shot('npc-mars', 'sim&planet=mars', `(()=>{const V=VOID,Su=V.surface;V.stepSim(2,60);const n=V.world.npcs(Su.cur);if(!n.length)return 'no npc';Su.pl.x=n[0].x-14;V.stepSim(.5,60);V.virtualKeys(['e'],true);V.stepSim(1/60,60);V.virtualKeys(['e'],false);V.stepSim(.6,60);return n.map(x=>x.k)})()`);
  await shot('suit-full', 'sim&planet=earth&day&up=all&tier=4', `(()=>{const V=VOID,Su=V.surface;V.stepSim(2,60);Su.pl.x=Su.ship.x-30;V.stepSim(.4,60)})()`);
  await shot('ship-tiers', 'sim&space&up=all', `(()=>{VOID.stepSim(1.5,60)})()`);
  await shot('scan-pulse', 'sim&space&up=scanner', `(()=>{VOID.stepSim(1,60);VOID.space.pulseReq=true;VOID.stepSim(.35,60)})()`);
  await shot('surface-mobile-390', 'sim&planet=earth&day&res=5', `VOID.stepSim(2,60)`, { w: 390, h: 844, mobile: true });
  await b.close(); console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no errors');
})();
