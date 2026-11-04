/* ============================== SOUND: synthesized effects + recorded original music ============================== */
const AU={c:null,m:null,sfxG:null,bgmG:null,nb:null};
function auInit(){try{if(AU.c){if(AU.c.state!=='running')AU.c.resume();return;}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  AU.c=new AC();AU.m=AU.c.createGain();AU.m.gain.value=.9;AU.m.connect(AU.c.destination);
  AU.sfxG=AU.c.createGain();AU.sfxG.connect(AU.m);AU.bgmG=AU.c.createGain();AU.bgmG.gain.value=.0001;AU.bgmG.connect(AU.m);
  const len=AU.c.sampleRate*.5,b=AU.c.createBuffer(1,len,AU.c.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;AU.nb=b;
  applySound();}catch(e){AU.c=null;}}
const mtof=m=>440*Math.pow(2,(m-69)/12);
function env(g,t,a,peak,dec){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+dec);}
function osc(type,f,t,dur,peak,out,glide,att){const c=AU.c,o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(glide)o.frequency.exponentialRampToValueAtTime(glide,t+dur*.7);
  env(g,t,att||.004,peak,dur);o.connect(g);g.connect(out);o.start(t);o.stop(t+dur+.05);}
function nz(t,dur,peak,f,type,out,q){const c=AU.c,s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain();s.buffer=AU.nb;fl.type=type||'highpass';fl.frequency.value=f||6000;if(q)fl.Q.value=q;env(g,t,.003,peak,dur);s.connect(fl);fl.connect(g);g.connect(out);s.start(t);s.stop(t+dur+.05);}
function bell(m,t,v,out,dur){const f=mtof(m);osc('sine',f,t,dur||.9,v,out);osc('sine',f*2,t,(dur||.9)*.5,v*.3,out);osc('triangle',f*4,t,.05,v*.1,out);}
const PENTA=[0,2,4,7,9];
function sfx(n,arg){if(!AU.c||!SAVE.opt.sfx)return;try{const t=AU.c.currentTime+.004,o=AU.sfxG;switch(n){
  case 'good':{const k=Math.min(9,(arg||1)-1);[0,4,7].forEach((d,i)=>bell(72+PENTA[k%5]+12*Math.floor(k/5)+d,t+i*.05,.13,o,.6));nz(t,.25,.04,7000,'highpass',o);break;}
  case 'nope':osc('triangle',300,t,.12,.12,o,200);osc('triangle',240,t+.08,.12,.1,o,160);break;
  case 'egg':osc('sine',700,t,.08,.1,o,1100);osc('sine',900,t+.08,.1,.08,o,1300);break;
  case 'pick':osc('sine',500,t,.06,.1,o,800);break;
  case 'sweep':nz(t,.12,.08,2500,'bandpass',o,1.5);break;
  case 'whoosh':nz(t,.4,.12,1200,'bandpass',o,.8);osc('sine',200,t,.4,.1,o,700);break;
  case 'ring':for(let i=0;i<6;i++)osc('square',1800,t+i*.06,.04,.025,o);break;
  case 'yawn':osc('sine',300,t,.5,.12,o,180);break;
  case 'fire':nz(t,.6,.1,900,'lowpass',o);osc('sine',90,t,.3,.15,o,60);break;
  case 'hint':[84,88,91].forEach((m,i)=>bell(m,t+i*.07,.1,o,.5));break;
  case 'start':[72,76,79,84].forEach((m,i)=>bell(m,t+i*.08,.12,o,.6));break;
  case 'win':[72,76,79,84,88,91,96].forEach((m,i)=>bell(m,t+i*.08,.15,o,1));nz(t+.5,.6,.05,6000,'highpass',o);break;
  case 'over':[67,64,62,55].forEach((m,i)=>osc('triangle',mtof(m),t+i*.15,.28,.13,o,mtof(m)*.97));break;
  case 'btn':osc('sine',660,t,.06,.12,o,880);break;
  case 'boom':osc('sine',110,t,.4,.3,o,50);nz(t,.5,.14,2500,'lowpass',o);for(let i=0;i<8;i++)nz(t+.15+i*.05,.08,.05,6000,'highpass',o);break;
  case 'pump':osc('sine',300+Math.random()*80,t,.08,.08,o,600);break;
  case 'water':nz(t,.5,.16,1200,'bandpass',o,.6);osc('sine',500,t,.2,.05,o,200);break;
  case 'reward':[84,88,91,96].forEach((m,i)=>bell(m,t+i*.09,.14,o,.7));break;
}}catch(e){}}
// ---------- recorded tracks (original, made for this game): loaded once, looped gaplessly, crossfaded ----------
const MUSIC={buf:{},loading:{},err:{},next:{},src:null,g:null,cur:null,want:null};
function loadTrack(n){if(MUSIC.buf[n]||MUSIC.loading[n]||!AU.c||Date.now()<(MUSIC.next[n]||0))return;MUSIC.loading[n]=1;
  fetch('music/'+n+'.mp4?'+VER,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('http '+r.status);return r.arrayBuffer();})
   .then(ab=>new Promise((res,rej)=>{const p=AU.c.decodeAudioData(ab,res,rej);if(p&&p.catch)p.catch(rej);}))
   .then(b=>{MUSIC.buf[n]=b;MUSIC.loading[n]=0;MUSIC.err[n]=0;if(MUSIC.want===n)musicSync(true);})
   .catch(()=>{const k=(MUSIC.err[n]||0)+1,wait=Math.min(30,Math.pow(2,k))*1000;MUSIC.err[n]=k;MUSIC.next[n]=Date.now()+wait;MUSIC.loading[n]=0;setTimeout(()=>loadTrack(n),wait+50);});}
function musicStop(){if(MUSIC.src){const s=MUSIC.src,g=MUSIC.g;try{g.gain.setTargetAtTime(.0001,AU.c.currentTime,.2);s.stop(AU.c.currentTime+1);}catch(e){}MUSIC.src=null;MUSIC.g=null;}MUSIC.cur=null;}
function musicSync(force){if(!AU.c)return;const want=scr==='play'?'bgm-play':'bgm-menu';MUSIC.want=want;
  if(!SAVE.opt.bgm||document.hidden){musicStop();return;}
  AU.bgmG.gain.setTargetAtTime(.7,AU.c.currentTime,.1);
  if(MUSIC.cur===want&&MUSIC.src&&!force)return;
  const b=MUSIC.buf[want];if(!b){loadTrack(want);return;}
  if(MUSIC.cur===want&&MUSIC.src)return;
  if(MUSIC.src){const s=MUSIC.src,g=MUSIC.g;g.gain.setTargetAtTime(.0001,AU.c.currentTime,.25);try{s.stop(AU.c.currentTime+1.2);}catch(e){}}
  const s=AU.c.createBufferSource(),g=AU.c.createGain();s.buffer=b;s.loop=true;g.gain.setValueAtTime(.0001,AU.c.currentTime);g.gain.setTargetAtTime(.8,AU.c.currentTime,.35);
  s.connect(g);g.connect(AU.bgmG);s.start();MUSIC.src=s;MUSIC.g=g;MUSIC.cur=want;
  for(const n of ['bgm-menu','bgm-play'])loadTrack(n);}
function applySound(){if(!AU.c)return;AU.sfxG.gain.value=SAVE.opt.sfx?1:0;musicSync();}
