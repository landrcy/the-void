// usage: node tests/_run.js "<query>" out.png [js-to-eval-before-shot] [w] [h] [simSeconds]
const pp=require('/workspace/tools/node_modules/puppeteer-core');
(async()=>{
 const [q,out,js,w,h]=[process.argv[2],process.argv[3],process.argv[4]||'',+process.argv[5]||1280,+process.argv[6]||800];
 const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu','--use-gl=swiftshader'],headless:'new'});
 const p=await b.newPage();await p.setViewport({width:w,height:h});
 const errs=[];p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});p.on('pageerror',e=>errs.push(String(e)));
 await p.goto('file:///workspace/the-void/index.html?'+q);await new Promise(r=>setTimeout(r,800));
 if(js){const r=await p.evaluate(js);if(r!==undefined)console.log(JSON.stringify(r));}
 await p.screenshot({path:out});await b.close();console.log(out,errs.join('\n')||'ok');
})();
