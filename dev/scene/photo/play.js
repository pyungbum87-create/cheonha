/* Real-input playthrough of all stages on iPhone 13: solves every problem, finds the hidden item, takes the photo. */
const {chromium,devices}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'site'),shot=process.argv[2]||'/tmp';const paths=JSON.parse(fs.readFileSync(root+'/paths.json'));
const srv=http.createServer((q,r)=>{const p=q.url.split('?')[0];if(p==='/'){r.setHeader('content-type','text/html;charset=utf-8');r.end('<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>html{color-scheme:light}body{margin:0}[hidden]{display:none!important}</style></head><body>'+fs.readFileSync(root+'/photo.html','utf8')+'</body></html>');return;}try{r.end(fs.readFileSync(path.join(root,p)));}catch(e){r.statusCode=404;r.end();}}).listen(8148);
(async()=>{const b=await chromium.launch();const c=await b.newContext({...devices['iPhone 13'],deviceScaleFactor:1});const pg=await c.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));await pg.goto('http://localhost:8148/');await pg.waitForTimeout(1500);
const only=process.argv[3]?process.argv[3].split(',').map(Number):null;let fails=0;const imgs={};
for(let si=0;si<20;si++){if(only&&!only.includes(si+1))continue;await pg.evaluate(i=>__t.start(i),si);await pg.waitForTimeout(350);
 imgs['s'+(si+1)]=await pg.evaluate(()=>__t.pv());const box=await (await pg.$('#cv')).boundingBox();const SS=await pg.evaluate(()=>__t.SS());
 const idle=async()=>{for(let i=0;i<60;i++){if(await pg.evaluate(()=>__t.S.q.length===0&&__t.S.qw<=0&&__t.S.fly.length===0))break;await pg.waitForTimeout(100);}await pg.evaluate(()=>{__t.S.t=120;});};
 await idle();
 const pos=id=>pg.evaluate(id=>{const o=__t.L.objs.find(q=>q.id===id);const w=__t.view(o,__t.S.v,__t.S.tmp);return{x:w.x,y:w.y};},id);
 const slot=id=>pg.evaluate(i=>{const s=__t.slots().find(q=>q.id===i);return{x:s.x,y:s.y};},id);
 async function act(r){const p=await pos(r.t);const X=box.x+p.x*SS,Y=box.y+p.y*SS;if(r.on==='tap'){await pg.mouse.click(X,Y);}
  else if(r.on==='use'||r.on==='rub'){const s=await slot(r.tool);await pg.mouse.move(box.x+s.x,box.y+s.y);await pg.mouse.down();await pg.mouse.move(X,Y+34,{steps:6});if(r.on==='rub')for(let i=0;i<9;i++)await pg.mouse.move(X+(i%2?30:-30),Y+34,{steps:4});await pg.mouse.up();}
  else if(r.on==='drag'){await pg.mouse.move(X,Y);await pg.mouse.down();await pg.mouse.move(box.x+r.to[0]*SS,box.y+r.to[1]*SS,{steps:8});await pg.mouse.up();}
  else if(r.on==='swipe'){const D={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[r.dir];await pg.mouse.move(X,Y);await pg.mouse.down();await pg.mouse.move(X+D[0]*.1*SS,Y+D[1]*.1*SS,{steps:5});await pg.mouse.up();}
  else if(r.on==='hold'){await pg.mouse.move(X,Y);await pg.mouse.down();await pg.waitForTimeout(1350);await pg.mouse.up();}
  else if(r.on==='rot'){await pg.mouse.move(X,Y);await pg.mouse.down();await pg.mouse.move(X+r.goal/1.6*SS,Y,{steps:6});await pg.mouse.up();}
  await pg.waitForTimeout(90);await idle();}
 for(const ri of paths[si]){const r=await pg.evaluate(i=>{const r=__t.L.rules[i];return{on:r.on,t:r.t,tool:r.tool,dir:r.dir,to:r.to,goal:r.goal};},ri);await act(r);}
 const hr=await pg.evaluate(()=>{const r=__t.L.rules.find(r=>r.do.some(d=>d[0]==='found')&&__t.cond(r.if,__t.S.v)&&(()=>{const o=__t.L.objs.find(q=>q.id===r.t);return !o.show||__t.cond(o.show,__t.S.v);})());return r?{on:r.on,t:r.t}:null;});if(hr)await act(hr);
 const st=await pg.evaluate(()=>({m:__t.L.probs.map(p=>__t.S.v[p.id]?'0':'1').join(''),f:__t.S.found}));imgs['e'+(si+1)]=await pg.evaluate(()=>__t.pv());
 await pg.click('#shoot');await pg.waitForTimeout(1000);const l=await pg.evaluate(()=>__last);const ok=l.mask==='00000'&&st.f;if(!ok)fails++;console.log(si+1,ok?'OK':'FAIL',st.m,'found',st.f,l.title[0]);await pg.evaluate(()=>{document.getElementById('result').hidden=true;__t.goHome();});await pg.waitForTimeout(50);}
fs.writeFileSync(shot+'/imgs.json',JSON.stringify(imgs));console.log('fails',fails,'errors',errs.slice(0,5));await b.close();srv.close();})();
