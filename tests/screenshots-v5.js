// node tests/screenshots-v5.js [outdir] -> v5 colonization previews (default /workspace/preview/the-void/v5)
const pp = require(process.env.PUPPETEER || '/workspace/tools/node_modules/puppeteer-core');
const path = require('path'), fs = require('fs');
const ROOT = 'file://' + path.resolve(__dirname, '..', 'index.html'), OUT = process.argv[2] || '/workspace/preview/the-void/v5';
fs.mkdirSync(OUT, { recursive: true }); const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SAVE = (body) => `localStorage.setItem('void:v2',JSON.stringify({v:2,seed:20241,state:${body ? "'surface'" : "'space'"},body:'${body || ''}',ship:{x:700,y:-700,ang:0},prog:{res:{scrap:400,ore:400,crystal:200,tech:200,essence:100},parts:['ganymede'],up:['hull1','universal','colony','autodrill','megarig','drill2','scanner','dyson','cruiser'],story:{repaired:true,launched:true}}}));`;
const COL = (stage) => `(()=>{const V=VOID,C=V.colony,Su=V.surface,w=Su.cur,Pg=V.prog;C.build(w);const c=Pg.colonies[w.id];c.age=[5,60,200,420,900][${stage}];Su.pl.x=c.x-40;V.stepSim(1,60);return C.colStage(c)})()`;
const ORBIT = `(()=>{const V=VOID,C=V.colony,Su=V.surface,w=Su.cur,Pg=V.prog;C.build(w);const c=Pg.colonies[w.id];c.age=900;Su.pl.x=c.x;V.stepSim(.2,30);C.build(w);C.instantBuild();const id=w.id;V.game.state='space';const b=V.Gen.getBody(id);const s=V.space.ship;for(let i=0;i<40;i++){s.x=b.x+b.r*1.6;s.y=b.y+b.r*.2;s.vx=s.vy=0;V.space.cam.x=b.x+b.r*.6;V.space.cam.y=b.y;V.stepSim(1/30,30)}return [id,!!Pg.rigs[id]]})()`;
const DYS = (seg) => `(()=>{const V=VOID,Pg=V.prog,C=V.colony;const pb=V.Gen.getBody('0,0:3');const st=V.Gen.near(pb.x,pb.y,60000,[]).filter(b=>b.isStar&&b.sys&&b.sys.id==='0,0')[0];if(!st)return 'nostar';Pg.dysons[st.sys.id]={star:st.id,t:0,seg:${seg},prog:0};const s=V.space.ship;for(let i=0;i<40;i++){s.x=st.x+st.r*1.9;s.y=st.y+st.r*.3;s.vx=s.vy=0;V.space.cam.x=st.x+st.r*1.2;V.space.cam.y=st.y;V.stepSim(1/30,30)}return [st.sys.id,C.dyStage(Pg.dysons[st.sys.id])]})()`;
(async () => {
  const b = await pp.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
  const errs = [];
  async function shot(name, o, fn) {
    if (only && !only.test(name)) return;
    const p = await b.newPage(); await p.setViewport({ width: o.w || 1280, height: o.h || 800, isMobile: !!o.mobile, hasTouch: !!o.mobile, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(name + ': ' + e)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    const q = '?sim' + (o.mobile ? '&touch' : '');
    await p.goto(ROOT + q); await p.evaluate(SAVE(o.body)); await p.goto(ROOT + q); await sleep(300);
    await p.evaluate(`(()=>{const V=VOID;V.game.clicked=true;for(let i=0;i<20&&V.game.state==='title';i++)V.stepSim(.5,60);V.stepSim(1,60)})()`);
    const r = await p.evaluate(fn); await sleep(60);
    await p.screenshot({ path: path.join(OUT, name + '.png') }); await p.close(); console.log(name, JSON.stringify(r));
  }
  const E = '0,0:3';
  await shot('01-drilling', { body: E }, `(()=>{const V=VOID;V.virtualKeys(['x'],true);V.stepSim(3.5,60);return V.colony.depthAt(V.surface.cur,V.surface.pl.x)})()`);
  await shot('02-ore-glints', { body: E }, `(()=>{VOID.stepSim(2,60);return 1})()`);
  await shot('03-scanner-xray', { body: E }, `(()=>{const V=VOID;V.virtualKeys(['q'],true);V.stepSim(.05,60);V.virtualKeys(['q'],false);V.stepSim(.6,60);return V.colony.scanT})()`);
  await shot('04-hand-laser', { body: E }, `(()=>{const V=VOID,Su=V.surface,w=Su.cur;const d=V.world.pickups(w).filter(i=>i.dep)[0];if(d){Su.pl.x=d.x-30;Su.pl.face=1}V.stepSim(.3,60);V.virtualKeys(['f'],true);V.stepSim(.5,60);return !!d})()`);
  for (let s = 0; s <= 4; s++) await shot('05-colony-stage-' + s + '-' + ['outpost', 'settlement', 'town', 'city', 'arcology'][s], { body: E }, COL(s));
  await shot('06-autodrills', { body: E }, `(()=>{const V=VOID,C=V.colony,Su=V.surface,w=Su.cur;for(let i=0;i<3;i++){Su.pl.x+=60;V.stepSim(.1,30);C.build(w)}V.stepSim(1,60);return (V.prog.drills[w.id]||[]).length})()`);
  await shot('07-rig-surface', { body: E }, `(()=>{const V=VOID,C=V.colony,Su=V.surface,w=Su.cur,Pg=V.prog;C.build(w);const c=Pg.colonies[w.id];c.age=400;Su.pl.x=c.x;V.stepSim(.2,30);C.build(w);C.instantBuild();Su.pl.x=c.x+150;V.stepSim(1.5,60);return !!Pg.rigs[w.id]})()`);
  await shot('08-rig-from-orbit', { body: E }, ORBIT);
  [0, 12, 24, 36, 48].forEach((sg, i) => 0);
  for (const [i, sg] of [[0, 4], [1, 14], [2, 26], [3, 38], [4, 48]]) await shot('09-dyson-' + i + '-' + ['swarm', 'ring', 'lattice', 'shell', 'sphere'][i], {}, DYS(sg));
  await shot('10-map-colonies', { body: E }, `(()=>{const V=VOID,C=V.colony,Su=V.surface,w=Su.cur,Pg=V.prog;C.build(w);Pg.colonies[w.id].age=900;Pg.dysons['0,0']={star:'0,0',t:0,seg:30,prog:0};V.stepSim(.2,30);V.game.state='space';V.stepSim(.2,30);const GM=V.galmap,b=V.Gen.getBody(w.id);GM.open();GM.cx=b.x;GM.cy=b.y;GM.z=GM.zt=Math.log(8);V.stepSim(.5,60);return (Pg.soft||[]).filter(r=>/col|dys/.test(r.id)).map(r=>r.id)})()`);
  await shot('11-upgrades-colony', {}, `(()=>{const Pg=VOID.prog;Pg.toggle('up');Pg.upTab='colony';VOID.stepSim(.2,60);return Pg.upTab})()`);
  await shot('12-mobile-390-colony', { body: E, w: 390, h: 844, mobile: true }, COL(3));
  await shot('13-mobile-390-drill', { body: E, w: 390, h: 844, mobile: true }, `(()=>{const V=VOID;V.touch.d=1;V.stepSim(3,60);return V.colony.depthAt(V.surface.cur,V.surface.pl.x)})()`);
  await shot('14-mobile-390-dyson', { w: 390, h: 844, mobile: true }, DYS(48));
  await b.close(); console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no errors');
})();
