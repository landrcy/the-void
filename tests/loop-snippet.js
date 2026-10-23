(()=>{const V=VOID,g=V.game,Su=V.surface,log=[];const st=()=>g.state+'/'+(Su.mode||'')+'/'+(V.space.mode||'');
g.clicked=true;for(let i=0;i<20&&g.state==="title";i++)V.stepSim(.5,60);V.stepSim(2,60);log.push('after start '+st()+' body '+(g.body&&g.body.id));
// walk toward ship
const sx=Su.ship.x;log.push('pl '+Math.round(Su.pl.x)+' ship '+Math.round(sx)+' hint '+(Su.hint&&Su.hint.kind));
let k=Su.pl.x<sx?'ArrowRight':'ArrowLeft';for(let i=0;i<400&&!(Su.hint&&Su.hint.kind==='ship');i++){V.virtualKeys([k],true);V.stepSim(1/60,60);}V.virtualKeys([k],false);
log.push('hint '+(Su.hint&&Su.hint.kind));V.virtualKeys(['e'],true);V.stepSim(1/60,60);V.virtualKeys(['e'],false);
for(let i=0;i<20&&g.state==='surface';i++)V.stepSim(.5,60);log.push('after board '+st());V.stepSim(4,60);log.push('space '+st()+' pos '+Math.round(V.space.ship.x)+','+Math.round(V.space.ship.y)+' hint '+JSON.stringify(V.space.hint&&V.space.hint.body&&V.space.hint.body.id));
const mars=VOID.Gen.getBody('0,0:6');VOID.Gen.updateCell(mars.cell,VOID.Gen.t);const sh=V.space.ship;sh.x=mars.x+mars.r+14;sh.y=mars.y;sh.vx=sh.vy=0;V.stepSim(.2,60);log.push('near mars hint '+(V.space.hint&&V.space.hint.id));V.virtualKeys(['e'],true);V.stepSim(1/60,60);V.virtualKeys(['e'],false);for(let i=0;i<20&&g.state==='space';i++)V.stepSim(.5,60);log.push('after land '+st()+' '+(g.body&&g.body.id));V.stepSim(6,60);log.push('surface '+st());V.virtualKeys(['ArrowLeft'],true);V.stepSim(2,60);V.virtualKeys(['ArrowLeft'],false);
V.save.write();log.push('save '+localStorage.getItem('void:v1').slice(0,160));return log;})()
