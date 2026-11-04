const {chromium,devices}=require('playwright');const O='/tmp/claude-0/-home-claude/ebb00a03-07b5-51d7-8a3d-281a8c6441fa/scratchpad/';
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({...devices['iPhone 13'],serviceWorkers:'block'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8768/');await p.waitForTimeout(900);await p.evaluate(()=>__sp.startLevel(1));await p.waitForTimeout(2900);await p.screenshot({path:O+'s2a.png'});
const r=await p.evaluate(async()=>{const S=__sp,w=ms=>new Promise(r=>setTimeout(r,ms));const at=(x,y)=>S.toS(x,y);
 const dr=async(x,y,X,Y)=>{let a=at(x,y);S.down(a.x,a.y);for(let k=1;k<=6;k++){a=at(x+(X-x)*k/6,y+(Y-y)*k/6);S.move(a.x,a.y);await w(16);}S.up();await w(300);};
 await dr(.20,.88,.40,.62);await dr(.63,.445,.40,.62);await dr(.885,.615,.78,.615);await dr(.885,.62,.40,.62);await dr(.70,.80,.82,.80);await dr(.70,.83,.40,.62);await w(600);return {done:[...S.P.done],won:S.P.won};});
await p.waitForTimeout(200);await p.screenshot({path:O+'s2b.png'});console.log(JSON.stringify(r),'errs',JSON.stringify(errs));await b.close();})();
