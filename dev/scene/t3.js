const {chromium,devices}=require('playwright');const O='/tmp/claude-0/-home-claude/ebb00a03-07b5-51d7-8a3d-281a8c6441fa/scratchpad/';
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({...devices['iPhone 13'],serviceWorkers:'block'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8768/');await p.waitForTimeout(900);await p.evaluate(()=>__sp.startLevel(2));await p.waitForTimeout(2900);await p.screenshot({path:O+'s3a.png'});
const r=await p.evaluate(async()=>{const S=__sp,w=ms=>new Promise(r=>setTimeout(r,ms));const at=(x,y)=>S.toS(x,y);
 const sw=async(x,y,dx,dy)=>{let a=at(x,y);S.down(a.x,a.y);for(let k=1;k<=5;k++){a=at(x+dx*k/5,y+dy*k/5);S.move(a.x,a.y);await w(16);}S.up();await w(250);};
 await sw(.343,.335,-.1,0);await sw(.44,.565,.1,0);await sw(.837,.322,0,-.1);await sw(.76,.57,0,.1);
 const a=at(.885,.70);S.down(a.x,a.y);S.up();await w(500);return [...S.P.done];});
await p.waitForTimeout(300);await p.screenshot({path:O+'s3b.png'});console.log(JSON.stringify(r),'errs',JSON.stringify(errs));await b.close();})();
