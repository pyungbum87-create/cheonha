const {chromium,devices}=require('playwright');const O='/tmp/claude-0/-home-claude/ebb00a03-07b5-51d7-8a3d-281a8c6441fa/scratchpad/';
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({...devices['iPhone 13'],serviceWorkers:'block'})).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
await p.goto('http://localhost:8768/');await p.waitForTimeout(1500);const res=[];
for(let L=0;L<10;L++){await p.evaluate(l=>__sp.startLevel(l),L);await p.waitForTimeout(2900);
  if([3,4,5,8,9].includes(L))await p.screenshot({path:O+`a${L+1}.png`});
  const r=await p.evaluate(async()=>{const S=__sp,P=S.P,w=ms=>new Promise(r=>setTimeout(r,ms)),at=(x,y)=>S.toS(x,y);
    const pos=o=>[o.x+(o.mx||0),o.y+(o.my||0)];
    const path=async(pts,step=16)=>{let a=at(...pts[0]);S.down(a.x,a.y);for(let i=1;i<pts.length;i++){const[x0,y0]=pts[i-1],[x1,y1]=pts[i];for(let k=1;k<=5;k++){a=at(x0+(x1-x0)*k/5,y0+(y1-y0)*k/5);S.move(a.x,a.y);await w(step);}}S.up();await w(250);};
    for(let guard=0;guard<40&&P.done.size<P.L.tasks.length;guard++){
      const t=P.L.tasks.find(t=>!P.done.has(t.id)&&(!t.needs||P.done.has(t.needs)));if(!t)break;const o=P.objs[t.obj];const[x,y]=pos(o);
      if(t.kind==='tap'){const a=at(x,y);S.down(a.x,a.y);S.up();await w(250);}
      else if(t.kind==='hold'){const a=at(x,y);S.down(a.x,a.y);await w((t.dur||1.2)*1000+300);if(S.P.drag)S.up();await w(200);}
      else if(t.kind==='swipe'){const D={up:[0,-.12],down:[0,.12],left:[-.12,0],right:[.12,0]}[t.dir];await path([[x,y],[x+D[0],y+D[1]]]);}
      else if(t.kind==='drag'){const tg=(Array.isArray(t.to)?t.to.find(g=>!P.used.has(g)):t.to);await path([[x,y],[tg.x,tg.y]]);}
      else if(t.kind==='rub'){const im=document.createElement('canvas');const hd=t.head||[-.01/o.w,.38];const ART_h=o.w*1.0;
        const pts=[[x,y]];for(let k=0;k<4;k++)for(const s of P.dirt[t.id]){if(s.a<=0)continue;const ih=(window.__img||0);pts.push([s.x-hd[0]*o.w,s.y-hd[1]*(o.w*1.1)]);}await path(pts.length>1?pts:[[x,y],[x,y]]);}
    }
    await w(400);return{level:P.L.id,done:P.done.size,of:P.L.tasks.length};});
  await p.waitForTimeout(2600);if([3,4,5,8,9].includes(L))await p.screenshot({path:O+`b${L+1}.png`});res.push(r);}
console.log(JSON.stringify(res),'errs',JSON.stringify(errs.slice(0,5)));await b.close();})();
