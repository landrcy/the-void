const pp=require('/workspace/tools/node_modules/puppeteer-core');
module.exports=async function(url,out,{w=1280,h=800,wait=1500,steps=null,js=null,dpr=1}={}){
 const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-gpu'],headless:'new'});
 const p=await b.newPage();await p.setViewport({width:w,height:h,deviceScaleFactor:dpr});
 const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push(String(e)));
 await p.goto(url);await new Promise(r=>setTimeout(r,wait));
 if(js)await p.evaluate(js);
 await p.screenshot({path:out});await b.close();console.log(out,errs.join('\n')||'ok');};
