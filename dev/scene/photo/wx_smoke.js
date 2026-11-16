/* Runs the WeChat/Douyin package against a pretend `wx` (or `tt`) object: boot, touch, stage, photo, story pack, music pack, hide/show. */
const {chromium}=require('playwright');const http=require('http'),fs=require('fs'),path=require('path');
const name=process.argv[2]||'wx',port=+process.argv[3]||8500,root=path.join(__dirname,'canvas',name);
const page=`<!doctype html><meta charset=utf-8><body style="margin:0"><script>
window.LOG={sub:[],ev:[],audio:[],vib:0,store:{},share:0};let first1=true;const HH={};
window.${name}={createCanvas(){const c=document.createElement('canvas');if(first1){first1=false;c.style.cssText='position:fixed;left:0;top:0;width:390px;height:844px';document.body.appendChild(c);}return c;},
 createImage(){return new Image();},getSystemInfoSync(){return{windowWidth:390,windowHeight:844,pixelRatio:2,language:'zh_CN',statusBarHeight:44,safeArea:{top:47}};},
 getStorageSync(k){return LOG.store[k]||'';},setStorageSync(k,v){LOG.store[k]=v;},removeStorageSync(k){delete LOG.store[k];},
 onTouchStart(f){HH.s=f;},onTouchMove(f){HH.m=f;},onTouchEnd(f){HH.e=f;},onTouchCancel(f){HH.c=f;},onHide(f){HH.hide=f;},onShow(f){HH.show=f;},
 loadSubpackage(o){LOG.sub.push(o.name);setTimeout(o.success,50);},reportEvent(n,d){LOG.ev.push(n);},vibrateShort(){LOG.vib++;},
 createInnerAudioContext(){const a={loop:false,volume:1,play(){LOG.audio.push('play '+a.src);},pause(){LOG.audio.push('pause '+a.src);}};return a;},
 createWebAudioContext(){return new AudioContext();},showShareMenu(){},onShareAppMessage(){},shareAppMessage(){LOG.share++;},getUpdateManager(){return{onUpdateReady(){}};}};
window.touch=(k,x,y)=>HH[k]&&HH[k]({touches:k==='e'?[]:[{clientX:x,clientY:y}],changedTouches:[{clientX:x,clientY:y}]});window.HH=HH;
</script><script src="game.js"></script>`;
const srv=http.createServer((q,r)=>{const p=q.url.split('?')[0];if(p==='/'){r.setHeader('content-type','text/html;charset=utf-8');r.end(page);return;}try{r.end(fs.readFileSync(path.join(root,p)));}catch(e){r.statusCode=404;r.end();}}).listen(port);
(async()=>{const b=await chromium.launch();const pg=await b.newPage({viewport:{width:390,height:844}});const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await pg.goto('http://localhost:'+port+'/');await pg.waitForTimeout(1200);const shot=process.argv[4];
const tapAt=async(x,y)=>{await pg.evaluate(([x,y])=>{touch('s',x,y);touch('e',x,y);},[x,y]);await pg.waitForTimeout(250);};
// intro: the "next" button sits at the lower right of the card; press it 4 times
for(let i=0;i<4;i++)await tapAt(250,560);if(shot)await pg.screenshot({path:shot+'/'+name+'_home.png'});
await tapAt(100,200);await pg.waitForTimeout(3200);if(shot)await pg.screenshot({path:shot+'/'+name+'_play.png'});
await tapAt(220,700);await pg.waitForTimeout(1800);if(shot)await pg.screenshot({path:shot+'/'+name+'_result.png'});
await pg.evaluate(()=>{HH.hide();HH.show();});await pg.waitForTimeout(300);
const L=await pg.evaluate(()=>({sub:LOG.sub,ev:LOG.ev,audio:LOG.audio,vib:LOG.vib,saved:Object.keys(LOG.store),alb:JSON.parse(LOG.store['tt-photo-v2']||'{}').alb}));
console.log(name,JSON.stringify(L));console.log('errors',errs);await b.close();srv.close();})();
