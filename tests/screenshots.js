// node tests/screenshots.js [outdir]  -> renders the preview set (default /workspace/preview/the-void)
const pp = require(process.env.PUPPETEER || '/workspace/tools/node_modules/puppeteer-core');
const path = require('path'), fs = require('fs');
const ROOT = 'file://' + path.resolve(__dirname, '..', 'index.html'), OUT = process.argv[2] || '/workspace/preview/the-void';
fs.mkdirSync(OUT, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await pp.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', args: ['--no-sandbox'], headless: 'new' });
  const errs = [];
  async function shot(name, q, js, o = {}) {
    const p = await b.newPage(); await p.setViewport({ width: o.w || 1280, height: o.h || 800, isMobile: !!o.mobile, hasTouch: !!o.mobile, deviceScaleFactor: 1 });
    p.on('pageerror', e => errs.push(name + ': ' + e)); p.on('console', m => { if (m.type() === 'error') errs.push(name + ': ' + m.text()); });
    await p.goto(ROOT + '?' + q); await sleep(400);
    if (js) await p.evaluate(js); if (o.hideUi) await p.evaluate(() => { document.getElementById('ui').style.display = 'none'; });
    await sleep(80); await p.screenshot({ path: path.join(OUT, name + '.png') }); await p.close(); console.log(name);
  }
  const startEarth = `(()=>{const V=VOID;V.game.clicked=true;for(let i=0;i<20&&V.game.state==='title';i++)V.stepSim(.5,60);V.stepSim(2.5,60);})()`;
  await shot('title', 'sim&fresh', 'VOID.stepSim(4,60)');
  await shot('earth-day', 'sim&fresh&day', startEarth);
  await shot('earth-night', 'sim&fresh&night', startEarth);
  await shot('astronaut-ship', 'sim&fresh&day', startEarth + ';(()=>{const V=VOID,Su=V.surface;Su.pl.x=Su.ship.x-22;V.stepSim(.5,60);})()');
  const toLaunch = (t) => startEarth + `;(()=>{const V=VOID,Su=V.surface;Su.pl.x=Su.ship.x-14;V.stepSim(.3,60);V.virtualKeys(['e'],true);V.stepSim(1/60,60);V.virtualKeys(['e'],false);V.stepSim(${t},60);})()`;
  await shot('launch', 'sim&fresh&day', toLaunch(2.3));
  await shot('transition-1-board', 'sim&fresh&day', toLaunch(.5));
  await shot('transition-2-liftoff', 'sim&fresh&day', toLaunch(3.4));
  await shot('transition-3-fade', 'sim&fresh&day', toLaunch(4.6));
  await shot('transition-4-space-launch', 'sim&fresh&day', toLaunch(5.6));
  await shot('transition-5-landing', 'sim&fresh&space', `(()=>{const V=VOID,G=V.Gen,m=G.getBody('0,0:6');G.updateCell(m.cell,G.t);const s=V.space.ship;V.stepSim(.2,60);s.x=m.x+m.r+14;s.y=m.y;s.vx=s.vy=0;V.stepSim(.2,60);V.virtualKeys(['e'],true);V.stepSim(1/60,60);V.virtualKeys(['e'],false);V.stepSim(.9,60);})()`);
  await shot('transition-6-arrive', 'sim&fresh&space', `(()=>{const V=VOID,G=V.Gen,m=G.getBody('0,0:6');G.updateCell(m.cell,G.t);const s=V.space.ship;V.stepSim(.2,60);s.x=m.x+m.r+14;s.y=m.y;s.vx=s.vy=0;V.stepSim(.2,60);V.virtualKeys(['e'],true);V.stepSim(1/60,60);V.virtualKeys(['e'],false);for(let i=0;i<30&&V.game.state==='space';i++)V.stepSim(.1,60);V.stepSim(2.2,60);})()`);
  await shot('space-home-system', 'sim&fresh&space', `(()=>{const V=VOID;V.stepSim(.3,60);const G=V.Gen,e=G.getBody('0,0:3');G.updateCell(e.cell,G.t);const s=V.space.ship;s.x=e.x-140;s.y=e.y+40;s.vx=s.vy=0;s.ang=-0.3;V.stepSim(.6,60);})()`);
  await shot('space-far', 'sim&fresh&space', `(()=>{const V=VOID,G=V.Gen;const f=G.find('gas',5,3);const s=V.space.ship;V.stepSim(.2,60);s.x=f.body.x+f.body.r+60;s.y=f.body.y+30;s.vx=0;s.vy=0;V.stepSim(1.5,60);})()`);
  await shot('space-blackhole', 'sim&fresh&space', `(()=>{const V=VOID,G=V.Gen;const f=G.find('bh',0,0);G.updateCell(f.body.cell,G.t);const s=V.space.ship;V.stepSim(.2,60);s.x=f.body.x+f.body.r*5;s.y=f.body.y-f.body.r*2;s.vx=0;s.vy=0;V.stepSim(.4,60);})()`);
  await shot('space-map', 'sim&fresh&space', `(()=>{const V=VOID;V.stepSim(.3,60);V.space.mapOpen=true;V.stepSim(.2,60);})()`);
  for (const k of ['desert', 'lava', 'ice', 'crystal', 'gas', 'moon', 'jungle', 'ocean', 'venus', 'asteroid', 'station', 'ruins']) await shot('surface-' + k, 'sim&day&planet=' + k, 'VOID.stepSim(2.5,60)');
  await shot('surface-weather-night', 'sim&night&weather&planet=jungle', 'VOID.stepSim(3,60)');
  await shot('mobile-title', 'sim&fresh', 'VOID.stepSim(4,60)', { w: 390, h: 844, mobile: 1 });
  await shot('mobile-earth', 'sim&fresh&day&touch', startEarth, { w: 390, h: 844, mobile: 1 });
  await shot('mobile-landscape', 'sim&fresh&day&touch', startEarth, { w: 844, h: 390, mobile: 1 });
  await shot('og-src', 'sim&fresh', 'VOID.stepSim(4,60)', { w: 1200, h: 630, hideUi: 1 });
  fs.copyFileSync(path.join(OUT, 'og-src.png'), path.resolve(__dirname, '..', 'assets', 'og.png'));
  await b.close(); console.log(errs.length ? 'ERRORS\n' + errs.join('\n') : 'no errors');
})();
