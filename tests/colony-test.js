// node tests/colony-test.js -> colonization systems: drilling, laser, colonies, rigs, offline, migration, dyson, map, 390px
const pp = require(process.env.PUPPETEER || '/workspace/tools/node_modules/puppeteer-core');
const path = require('path');
const ROOT = 'file://' + path.resolve(__dirname, '..', 'index.html');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SAVE = (body, prog) => `localStorage.setItem('void:v2',JSON.stringify({v:2,seed:20241,state:${body ? "'surface'" : "'space'"},body:'${body || ''}',ship:{x:700,y:-700,ang:0},prog:${JSON.stringify(Object.assign({ res: { scrap: 200, ore: 200, crystal: 90, tech: 90, essence: 40 }, parts: ['ganymede'], up: ['hull1', 'universal'], story: { repaired: true, launched: true } }, prog || {}))}}));`;
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m); } };
(async () => {
  const b = await pp.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
  async function page(o) {
    const p = await b.newPage(); p.errs = [];
    await p.setViewport({ width: o.w || 1280, height: o.h || 800, isMobile: !!o.mobile, hasTouch: !!o.mobile });
    p.on('pageerror', e => p.errs.push('' + e)); p.on('console', m => { if (m.type() === 'error') p.errs.push(m.text()); });
    const q = '?sim' + (o.mobile ? '&touch' : '');
    await p.goto(ROOT + q); await p.evaluate(SAVE(o.body, o.prog)); await p.goto(ROOT + q); await sleep(200);
    await p.evaluate(`(()=>{const V=VOID;V.game.clicked=true;for(let i=0;i<20&&V.game.state==='title';i++)V.stepSim(.5,60);V.stepSim(1,60)})()`);
    return p;
  }
  // 1 drilling + pockets + laser
  let p = await page({ body: '0,0:3' });
  let r = await p.evaluate(`(()=>{const V=VOID,C=V.colony,Su=V.surface,w=Su.cur,Pg=V.prog;const out={st:V.game.state,kind:C.table(V.Gen.getBody(w.id)).kind};
    out.pk=C.pockets(w).length;const ore0=JSON.stringify(Pg.res);
    V.virtualKeys(['x'],true);V.stepSim(3,60);V.virtualKeys(['x'],false);
    out.depth=C.depthAt(w,Su.pl.x);
    const pk=C.pockets(w)[0];for(let i=0;i<80;i++)C.dig(w,pk.x,4);out.got=JSON.stringify(Pg.res)!==ore0;
    const dp=V.world.pickups(w).filter(i=>i.dep&&!Pg.got[i.id])[0];out.dep=!!dp;if(dp){Su.pl.x=dp.x-10;Su.pl.face=1;Su.pl.y=Su.gAt(w,Su.pl.x)}const r0=JSON.stringify(Pg.res);V.virtualKeys(['f'],true);V.stepSim(4,60);V.virtualKeys(['f'],false);out.las=JSON.stringify(Pg.res)!==r0;
    return out})()`);
  console.log('drill', JSON.stringify(r));
  ok(r.st === 'surface', 'on surface'); ok(r.pk >= 20, 'pockets'); ok(r.depth > 0, 'drill digs hole'); ok(r.got, 'pocket reward'); ok(r.las, 'laser mines vein');
  // 2 colony grows, autodrill produces, rig
  r = await p.evaluate(`(()=>{const V=VOID,C=V.colony,Su=V.surface,w=Su.cur,Pg=V.prog;['colony','autodrill','megarig'].forEach(k=>Pg.up[k]=1);
    C.build(w);const c=Pg.colonies[w.id];const out={col:!!c};const st=[];for(let i=0;i<8;i++){V.stepSim(100,10);st.push(C.colStage(c))}out.st=st;
    Su.pl.x+=400;V.stepSim(.1,30);const nd0=(Pg.drills[w.id]||[]).length;C.build(w);out.drill=(Pg.drills[w.id]||[]).length-nd0;
    Su.pl.x=c.x;C.build(w);out.rig=!!Pg.rigs[w.id];out.rates=C.rates();return out})()`);
  console.log('colony', JSON.stringify(r));
  ok(r.col, 'colony founded'); ok(r.st[r.st.length - 1] === 4, 'colony reaches arcology'); ok(r.drill === 1, 'auto-drill placed'); ok(r.rig, 'rig built');
  ok(Object.keys(r.rates).length >= 3, 'passive rates');
  ok(p.errs.length === 0, 'no errors surface: ' + p.errs.slice(0, 3)); await p.close();
  // 3 migration + offline cap
  const now = Date.now();
  p = await page({ prog: { up: ['hull1', 'universal', 'colony', 'dyson', 'cruiser'], colonies: { '0,0:3': { sys: '0,0', name: 'OLD', t: 0 } }, dysons: { '0,0': { star: '0,0', t: 0 } }, colLast: now - 3 * 864e5 } });
  r = await p.evaluate(`(()=>{const V=VOID,Pg=V.prog,C=V.colony;const c=Pg.colonies['0,0:3'],d=Pg.dysons['0,0'];return {age:c&&typeof c.age,seg:d&&typeof d.seg,away:C.away||null,res:Pg.res}})()`);
  console.log('migrate', JSON.stringify(r));
  ok(r.age === 'number' && r.seg === 'number', 'migration adds fields');
  r = await p.evaluate(`(()=>{const V=VOID,Pg=V.prog,C=V.colony;const a=JSON.parse(JSON.stringify(Pg.res));C.offline(1e7);const g={};for(const k in Pg.res)g[k]=(Pg.res[k]||0)-(a[k]||0);return g})()`);
  console.log('offline', JSON.stringify(r)); ok(Object.keys(r).every(k => k === 'energy' || (k === 'energy' ? r[k] <= 20001 : r[k] <= 601)), 'offline capped');
  // 4 dyson assembles + energy + upgrades
  r = await p.evaluate(`(()=>{const V=VOID,Pg=V.prog,C=V.colony,d=Pg.dysons['0,0'];for(let i=0;i<30;i++)V.stepSim(20,5);const e0=Pg.res.energy||0;V.stepSim(10,10);
    const o={seg:d.seg,stage:C.dyStage(d),de:(Pg.res.energy||0)-e0};Pg.res.energy=5000;Pg.res.tech=500;Pg.res.crystal=500;Pg.res.essence=500;
    o.buy=['forge','nova','lifter'].map(id=>{try{Pg.buy(id)}catch(e){return 'x'+e}return Pg.has(id)});return o})()`);
  console.log('dyson', JSON.stringify(r)); ok(r.seg === 48 && r.stage === 4, 'dyson complete'); ok(r.de > 50, 'dyson energy'); ok(r.buy.every(x => x === true), 'energy upgrades buyable');
  r = await p.evaluate(`(()=>{const V=VOID;V.prog.toggle&&V.prog.toggle('map');V.stepSim(.3,60);const g=V.galmap||V.map;return !!g})()`);
  ok(p.errs.length === 0, 'no errors space/map: ' + p.errs.slice(0, 3)); await p.close();
  // 5 390px
  p = await page({ body: '0,0:3', w: 390, h: 844, mobile: true, prog: { up: ['hull1', 'universal', 'colony'] } });
  await p.evaluate(`(()=>{const V=VOID;V.touch.build=1;V.stepSim(.1,30);V.touch.build=0;V.touch.d=1;V.stepSim(2,30);V.touch.d=0;V.touch.laser=1;V.stepSim(2,30);V.touch.laser=0;V.prog.toggle&&V.prog.toggle('up');V.prog.upTab='colony';V.stepSim(.3,30)})()`);
  ok(p.errs.length === 0, 'no errors 390: ' + p.errs.slice(0, 3)); await p.close();
  await b.close(); console.log(`colony tests: ${pass} pass, ${fail} fail`); process.exit(fail ? 1 : 0);
})();
