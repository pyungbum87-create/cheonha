/* Real-touch playthrough of the canvas build on iPhone 13: every problem, hidden item, photo, result buttons.
   Also checks that Chinese mode draws no Korean. Usage: node play_canvas.js [port] [stage list] */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'canvas/web'),port=+process.argv[2]||8400;const paths=JSON.parse(fs.readFileSync(__dirname+'/site/paths.json'));
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';try{const b=fs.readFileSync(path.join(root,p));if(p.endsWith('.html'))r.setHeader('content-type','text/html;charset=utf-8');r.end(b);}catch(e){r.statusCode=404;r.end();}}).listen(port);
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],deviceScaleFactor:1});const pg=await c.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text());});
await pg.addInitScript(()=>{window.__ko=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(s){if(/[가-힣]/.test(s)&&window.__ko.length<20)window.__ko.push(s);return f.apply(this,arguments);};});
await pg.goto('http://localhost:'+port+'/?all=1&lang=zh');await pg.waitForTimeout(1200);
const tap=async id=>{const p=await pg.evaluate(i=>__t.btn(i),id);if(!p)return false;await pg.mouse.click(p.x,p.y);await pg.waitForTimeout(120);return true;};
for(let i=0;i<4;i++)await tap('inNext');
const only=process.argv[3]?process.argv[3].split(',').map(Number):null;let fails=0;
for(let si=0;si<20;si++){if(only&&!only.includes(si+1))continue;
 let opened=false;for(let n=0;n<14&&!opened;n++){opened=await tap('lv'+si);if(!opened){await pg.mouse.move(195,520);await pg.mouse.down();await pg.mouse.move(195,400,{steps:5});await pg.mouse.up();await pg.waitForTimeout(80);}}
 if(!opened){console.log('could not reach card',si+1);fails++;await pg.evaluate(i=>__t.start(i),si);}
 for(let i=0;i<80;i++){if(await pg.evaluate(i=>__t.S&&__t.L&&__t.L.id===i+1&&__t.S.cardT<=0,si))break;await pg.waitForTimeout(100);}
 const idle=async()=>{for(let i=0;i<60;i++){if(await pg.evaluate(()=>__t.S.q.length===0&&__t.S.qw<=0&&__t.S.fly.length===0))break;await pg.waitForTimeout(100);}await pg.evaluate(()=>{__t.S.t=120;});};
 if(!await pg.evaluate(()=>!!__t.S)){console.log('not started',si+1,await pg.evaluate(()=>JSON.stringify({M:__t.M,ids:__t.ids().slice(0,12),ev:__t.TR.slice(-4)})));}
 await idle();const SS=await pg.evaluate(()=>__t.SS());
 const cl=(x,y)=>pg.evaluate(([x,y])=>__t.client(x,y),[x,y]);
 const pos=async id=>{const p=await pg.evaluate(id=>{const o=__t.L.objs.find(q=>q.id===id);const w=__t.view(o,__t.S.v,__t.S.tmp);return{x:w.x,y:w.y};},id);return cl(p.x*SS,p.y*SS);};
 const slot=async id=>{const s=await pg.evaluate(i=>{const s=__t.slots().find(q=>q.id===i);return{x:s.x,y:s.y};},id);return cl(s.x,s.y);};
 const k=await pg.evaluate(()=>__t.client(1,0).x-__t.client(0,0).x);
 async function act(r){const P=await pos(r.t),X=P.x,Y=P.y,u=SS*k;if(r.on==='tap'){await pg.mouse.click(X,Y);}
  else if(r.on==='use'||r.on==='rub'){const s=await slot(r.tool);await pg.mouse.move(s.x,s.y);await pg.mouse.down();await pg.mouse.move(X,Y+34*k,{steps:6});if(r.on==='rub')for(let i=0;i<9;i++)await pg.mouse.move(X+(i%2?30:-30),Y+34*k,{steps:4});await pg.mouse.up();}
  else if(r.on==='drag'){const T=await cl(r.to[0]*SS,r.to[1]*SS);await pg.mouse.move(X,Y);await pg.mouse.down();await pg.mouse.move(T.x,T.y,{steps:8});await pg.mouse.up();}
  else if(r.on==='swipe'){const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[r.dir];await pg.mouse.move(X,Y);await pg.mouse.down();await pg.mouse.move(X+D[0]*.1*u,Y+D[1]*.1*u,{steps:5});await pg.mouse.up();}
  else if(r.on==='hold'){await pg.mouse.move(X,Y);await pg.mouse.down();await pg.waitForTimeout(1350);await pg.mouse.up();}
  else if(r.on==='rot'){await pg.mouse.move(X,Y);await pg.mouse.down();await pg.mouse.move(X+r.goal/1.6*u,Y,{steps:6});await pg.mouse.up();}
  await pg.waitForTimeout(90);await idle();}
 for(const ri of paths[si]){const r=await pg.evaluate(i=>{const r=__t.L.rules[i];return{on:r.on,t:r.t,tool:r.tool,dir:r.dir,to:r.to,goal:r.goal};},ri);await act(r);}
 const hr=await pg.evaluate(()=>{const r=__t.L.rules.find(r=>r.do.some(d=>d[0]==='found')&&__t.cond(r.if,__t.S.v)&&(()=>{const o=__t.L.objs.find(q=>q.id===r.t);return !o.show||__t.cond(o.show,__t.S.v);})());return r?{on:r.on,t:r.t}:null;});if(hr)await act(hr);
 const st=await pg.evaluate(()=>({m:__t.L.probs.map(p=>__t.S.v[p.id]?'0':'1').join(''),f:__t.S.found,left:__t.L.extra.filter(p=>!__t.S.v[p.id]).length}));
 await tap('shoot');await pg.waitForTimeout(1100);const l=await pg.evaluate(()=>__t.LAST);const ok=l&&l.stage===si+1&&l.mask==='00000'&&st.f&&st.left===0;
 await pg.waitForTimeout(2300);let story=await pg.evaluate(()=>__t.M.includes('story'));let n=0;while(await pg.evaluate(()=>__t.M.includes('story'))&&n++<6)await tap('stNext');
 const back=await pg.evaluate(()=>__t.M.join(','));if(!ok||!story||back!=='result')fails++;console.log(si+1,ok&&story&&back==='result'?'OK':'FAIL',st.m,'left',st.left,'found',st.f,'story',story,'modals',back,l&&l.title[0]);
 await pg.evaluate(()=>__t.goHome());await pg.waitForTimeout(150);if(await pg.evaluate(()=>__t.M.includes('sign')))await tap('signGet');
}
await tap('toHall');await pg.waitForTimeout(800);const hall=await pg.evaluate(()=>__t.M.join(','));await tap('hallBack');
const ko=await pg.evaluate(()=>window.__ko);console.log('fails',fails,'| hall',hall,'| korean drawn in zh mode:',ko.length,ko.slice(0,5),'| errors',errs.slice(0,5));await b.close();srv.close();})();
