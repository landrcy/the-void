// node tests/_multi.js prefix "q1|js1" "q2|js2" ...  -> preview/the-void/<prefix>-<i>.png
const pp=require('/workspace/tools/node_modules/puppeteer-core');
(async()=>{
 const pre=process.argv[2], items=process.argv.slice(3), W=+process.env.W||1280,H=+process.env.H||800;
 const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu','--autoplay-policy=no-user-gesture-required'],headless:'new',ignoreDefaultArgs:['--mute-audio']});
 for(let i=0;i<items.length;i++){let [q,js,name]=items[i].split('|');if(js&&js[0]==='@')js=require('fs').readFileSync(js.slice(1),'utf8');
  const p=await b.newPage();await p.setViewport({width:W,height:H});
  const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(String(e)));
  await p.goto('file:///workspace/the-void/index.html?'+q);await new Promise(r=>setTimeout(r,600));
  let r;try{r=await p.evaluate(js||'0');}catch(e){errs.push(String(e))}
  const out=`/workspace/preview/the-void/${name||pre+'-'+i}.png`;await p.screenshot({path:out});
  console.log(out,r!==undefined?JSON.stringify(r):'',errs.filter(e=>!/favicon|ERR_FILE/.test(e)).join(' ; ')||'ok');await p.close();}
 await b.close();})();
