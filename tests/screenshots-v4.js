// node tests/screenshots-v4.js [outdir] -> v4 previews: ship stages, fleet upgrades, admin, black holes before/after, the Maw (default /workspace/preview/the-void/v4)
const pp = require(process.env.PUPPETEER || '/workspace/tools/node_modules/puppeteer-core');
const path = require('path'), fs = require('fs');
const ROOT = 'file://' + path.resolve(__dirname, '..', 'index.html'), OUT = process.argv[2] || '/workspace/preview/the-void/v4';
fs.mkdirSync(OUT, { recursive: true }); const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SAVE = (body, up) => `localStorage.setItem('void:v2',JSON.stringify({v:2,seed:20241,state:${body?"'surface'":"'space'"},body:'${body||''}',ship:{x:700,y:-700,ang:0},prog:{res:{scrap:90,ore:90,crystal:40,tech:40,essence:20},parts:['ganymede'],up:${JSON.stringify(up||['hull1','universal'])},story:{repaired:true,launched:true}}}));`;
const BH = `(()=>{const V=VOID;V.prog.story.warped=true;V.prog.teleport('bh');V.prog.cheat.god=true;V.stepSim(.1,60);V.game.state='space';V.story&&(V.story.cine=null);const b=V.space.near.filter(q=>q.isBH&&!q.mega)[0];if(!b)return 'no bh';const s=V.space.ship;for(let i=0;i<50;i++){s.x=b.x+b.r*3.4;s.y=b.y-b.r*.5;s.vx=s.vy=0;V.space.cam.x=s.x;V.space.cam.y=s.y;V.stepSim(1/30,30)}return [b.id,V.game.state]})()`;
(async () => {
  const b = await pp.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
  const errs = [];
  async function shot(name, o, fn) {
    if (only && !only.test(name)) return;
    const p = await b.newPage(); await p.setViewport({ width: o.w || 1280, height: o.h || 800, isMobile: !!o.mobile, hasTouch: !!o.mobile, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(name + ': ' + e)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    const q = '?sim' + (o.q || '') + (o.mobile ? '&touch' : '');
    await p.goto(ROOT + q); await p.evaluate(SAVE(o.body, o.up)); await p.goto(ROOT + q); await sleep(300);
    await p.evaluate(`(()=>{const V=VOID;V.game.clicked=true;for(let i=0;i<20&&V.game.state==='title';i++)V.stepSim(.5,60);V.stepSim(1,60)})()`);
    const r = await p.evaluate(fn); await sleep(60);
    await p.screenshot({ path: path.join(OUT, name + '.png') }); await p.close(); console.log(name, JSON.stringify(r));
  }
  for (let s = 0; s <= 4; s++) await shot('stage-' + s + '-' + ['scout', 'frigate', 'cruiser', 'capital', 'mothership'][s], {}, `(()=>{const V=VOID;V.prog.setStage(${s});['engines','bubble','hangar','beams'].forEach(k=>${s}>=2&&V.prog.unlock(k));V.input.y=0;V.stepSim(1.5,60);return V.prog.shipStage()})()`);
  await shot('stage-4-landed', { body: '0,0:3' }, `(()=>{VOID.prog.setStage(4);VOID.stepSim(.5,60);return 4})()`);
  await shot('upgrades-fleet', {}, `(()=>{const Pg=VOID.prog;Pg.toggle('up');Pg.upTab='fleet';VOID.stepSim(.2,60);return Pg.upTab})()`);
  await shot('upgrades-fleet-390', { w: 390, h: 844, mobile: 1 }, `(()=>{const Pg=VOID.prog;Pg.toggle('up');Pg.upTab='fleet';VOID.stepSim(.2,60);return Pg.upTab})()`);
  await shot('admin-stages', {}, `(()=>{VOID.prog.toggle('admin');VOID.stepSim(.2,60);return VOID.prog.open})()`);
  await shot('bh-before', { q: '&oldbh' }, BH);
  await shot('bh-after', {}, BH);
  await shot('bh-before-390', { q: '&oldbh', w: 390, h: 844, mobile: 1 }, BH);
  await shot('bh-after-390', { w: 390, h: 844, mobile: 1 }, BH);
  await shot('mega-approach', { up: ['hull1', 'universal', 'capital'] }, `(()=>{const V=VOID;V.prog.setStage(3);V.prog.teleport('mega');V.prog.cheat.god=true;for(let i=0;i<60;i++){V.space.ship.vx=V.space.ship.vy=0;V.stepSim(1/30,30)}return V.bhfx.stats})()`);
  await shot('mega-approach-390', { w: 390, h: 844, mobile: 1 }, `(()=>{const V=VOID;V.prog.setStage(3);V.prog.teleport('mega');V.prog.cheat.god=true;for(let i=0;i<60;i++){V.space.ship.vx=V.space.ship.vy=0;V.stepSim(1/30,30)}return V.bhfx.stats})()`);
  await shot('mega-map', {}, `(()=>{const V=VOID,GM=V.galmap;GM.open();GM.cx=4.6e6;GM.cy=1.3e6;GM.z=GM.zt=Math.log(4000);V.stepSim(.5,60);const P=V.prog,S=V.S,r=(P.soft||[]).concat(P.regions).find(r=>r.id.indexOf('gmc:mega')===0);return r?r.id:'mark drawn'})()`);
  await shot('mega-through', {}, `(()=>{const V=VOID;V.prog.setStage(3);V.bhfx.horizon();V.stepSim(.6,60);return [V.prog.shipStage(),V.prog.story.mega]})()`);
  await b.close(); if (errs.length) { console.log('ERRORS', errs); process.exit(1); }
})();
