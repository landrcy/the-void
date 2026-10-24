// node tests/screenshots-v3.js [outdir] -> v3 tooltip previews (default /workspace/preview/the-void/v3)
const pp = require(process.env.PUPPETEER || '/workspace/tools/node_modules/puppeteer-core');
const path = require('path'), fs = require('fs');
const ROOT = 'file://' + path.resolve(__dirname, '..', 'index.html'), OUT = process.argv[2] || '/workspace/preview/the-void/v3';
fs.mkdirSync(OUT, { recursive: true }); const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SAVE = (body) => `localStorage.setItem('void:v2',JSON.stringify({v:2,seed:20241,state:${body?"'surface'":"'space'"},body:'${body||''}',ship:{x:700,y:-700,ang:0},prog:{res:{scrap:9,ore:30,crystal:2,tech:1,essence:0},parts:['ganymede'],up:['hull1'],story:{repaired:true,launched:true}}}));`;
// returns page-px centre of the first region (clickable or soft) whose id starts with pre
const FIND = pre => `(()=>{const Pg=VOID.prog,S=VOID.S,a=Pg.regions.concat(Pg.soft||[]);const r=a.find(r=>r.id.indexOf('${pre}')===0);return r?[(r.x+r.w/2)*S,(r.y+r.h/2)*S,r.id]:null})()`;
(async () => {
  const b = await pp.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
  const errs = [];
  async function shot(name, o, fn) {
    if (only && !only.test(name)) return;
    const p = await b.newPage(); await p.setViewport({ width: o.w || 1280, height: o.h || 800, isMobile: !!o.mobile, hasTouch: !!o.mobile, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(name + ': ' + e)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    await p.goto(ROOT + '?sim'); await p.evaluate(SAVE(o.body)); await p.goto(ROOT + '?sim' + (o.mobile ? '&touch' : '')); await sleep(300);
    await p.evaluate(`(()=>{const V=VOID;V.game.clicked=true;for(let i=0;i<20&&V.game.state==='title';i++)V.stepSim(.5,60);V.stepSim(1,60)})()`);
    const r = await fn(p); await p.evaluate('VOID.stepSim(.05,60)'); await p.evaluate('VOID.stepSim(.7,60)'); await sleep(60);
    const vis = await p.evaluate(`(()=>{const t=document.getElementById('tip');if(!t||t.hidden)return null;const q=t.getBoundingClientRect();return {txt:t.innerText.replace(/\\n/g,' | '),x:q.left|0,y:q.top|0,r:q.right|0,b:q.bottom|0}})()`);
    await p.screenshot({ path: path.join(OUT, name + '.png') }); await p.close(); console.log(name, JSON.stringify(r), JSON.stringify(vis));
  }
  const hover = async (p, pre, pre2) => { if (pre2) await p.evaluate(pre2); await p.evaluate('VOID.stepSim(.1,60)'); const c = await p.evaluate(FIND(pre)); if (!c) return 'no ' + pre; await p.mouse.move(c[0], c[1]); await sleep(50); await p.evaluate('VOID.stepSim(.1,60)'); return c[2]; };
  const UP = `VOID.prog.toggle('up')`;
  await shot('upgrade-1280', {body:'0,0:3'}, p => hover(p, 'u:hull2', UP));
  // 390: what a long-press produces (Pg.tipHold on the pressed region)
  await shot('upgrade-390', { body:'0,0:3', w: 390, h: 844, mobile: 1 }, async p => { await p.evaluate(UP); await p.evaluate('VOID.stepSim(.1,60)'); return p.evaluate(`(()=>{const Pg=VOID.prog,r=Pg.regions.find(r=>r.id.indexOf('u:shield')===0);Pg.tipHold={id:r.id,r:r,t:3};return r.id})()`); });
  await shot('upgrade-390-locked', { body:'0,0:3', w: 390, h: 844, mobile: 1 }, async p => { await p.evaluate(UP); await p.evaluate('VOID.stepSim(.1,60)'); return p.evaluate(`(()=>{const Pg=VOID.prog,a=Pg.regions.filter(r=>r.id.indexOf('u:')===0),r=a[a.length-1];Pg.tipHold={id:r.id,r:r,t:3};return r.id})()`); });
  await shot('hud-fuel', {}, p => hover(p, 'hud:fuel', 'VOID.prog.fuel=.55'));
  await shot('hud-res', {}, p => hover(p, 'res:ore'));
  await shot('hud-button-up', {body:'0,0:3'}, async p => { const q = await p.$('#b-up').then(e => e.boundingBox()); await p.mouse.move(q.x + q.width / 2, q.y + q.height / 2); await sleep(50); return 'b-map'; });
  // real touch long-press on the Upgrades button (held while the shot is taken)
  await shot('hud-button-390', { body: '0,0:3', w: 390, h: 844, mobile: 1 }, async p => { const q = await p.$('#b-up').then(e => e.boundingBox()); await p.touchscreen.touchStart(q.x + q.width / 2, q.y + q.height / 2); await sleep(650); return 'b-up long-press'; });
  await shot('map-pin', {}, p => hover(p, 'gmc:pin', `(()=>{const V=VOID,sh=V.space.ship;V.prog.pin(sh.x+900,sh.y-500,'pin');V.galmap.open();V.stepSim(.8,60)})()`));
  await shot('map-system', {}, p => hover(p, 'gmc:body', `(()=>{VOID.galmap.open();VOID.stepSim(.8,60)})()`));
  const TRADE = kind => async p => p.evaluate(`(()=>{VOID.stepSim(4,60);const V=VOID,Wd=V.world,Su=V.surface,w=Su.cur;let n=Wd.npcs(w).find(n=>n.kind==='${kind}');for(let i=0;!n&&i<8;i++){Wd.adminSpawn();n=Wd.npcs(w).find(n=>n.kind==='${kind}')}if(!n)return 'none '+Wd.npcs(w).map(n=>n.kind);Su.pl.x=n.x-14;V.stepSim(.2,60);Wd.talk(w,n);V.stepSim(.3,60);return n.kind})()`);
  await shot('trade-mechanic', { body: '0,0:6' }, TRADE('mechanic'));
  await shot('trade-robot', { body: '0,0:6' }, TRADE('robot'));
  await shot('trade-mechanic-390', { body: '0,0:6', w: 390, h: 844, mobile: 1 }, TRADE('mechanic'));
  await b.close(); if (errs.length) { console.log('ERRORS', errs); process.exit(1); }
})();
