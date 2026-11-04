/* 천하등용 SD 전장 시범 (SDV). Drawing only: slot positions, hit boxes, combat and save data are untouched.
   Hooks in index.html / zh.html: buildBG() calls SDV.pad() per slot, the slot loop calls SDV.unit() before drawToken().
   Off switch: ?sd=0 in the URL (or localStorage 'cheonha-sd' = '0').                                                    */
(function(){
'use strict';
let on=true;try{if(/[?&]sd=0/.test(location.search)||localStorage.getItem('cheonha-sd')==='0')on=false;}catch(e){}
const BASE='sd/';
/* per general: hand = grip point on the body image (512 space), grip = grip point on the weapon image (512 space),
   rest = weapon angle at rest (deg, 0 = pointing right), move = attack motion, fx = effect image                     */
const CH={
 gwanu:{hand:[340,300],grip:[236,222],rest:-58,move:'slash',fx:'fx_slash',ws:.9},
 joun:{hand:[330,312],grip:[214,229],rest:-18,move:'thrust',fx:'fx_thrust',ws:.85},
 hwangchung:{hand:[398,288],grip:[300,255],rest:0,move:'shoot',fx:'fx_arrow_trail',ws:.62},
 jegal:{hand:[372,306],grip:[150,256],rest:-62,move:'fan',fx:'fx_fan_wind',ws:.55},
 jojo:{hand:[420,310],grip:[112,256],rest:-45,move:'slash',fx:'fx_slash',ws:.62},
 samaui:{hand:[408,310],grip:[120,256],rest:-60,move:'fan',fx:'fx_fan_wind',ws:.55},
 heojeo:{hand:[416,318],grip:[176,256],rest:-40,move:'slash',fx:'fx_slash',ws:.62},
 jangbi:{hand:[350,300],grip:[150,244],rest:-18,move:'thrust',fx:'fx_thrust',ws:.82},
 sonchaek:{hand:[328,300],grip:[140,244],rest:-18,move:'thrust',fx:'fx_thrust',ws:.8},
 juyu:{hand:[410,298],grip:[110,240],rest:-45,move:'slash',fx:'fx_slash',ws:.6},
 yukson:{hand:[398,298],grip:[120,240],rest:-45,move:'slash',fx:'fx_slash',ws:.58},
 yeopo:{hand:[350,308],grip:[160,256],rest:-50,move:'slash',fx:'fx_slash',ws:.8},
 dongtak:{hand:[434,308],grip:[112,254],rest:-40,move:'slash',fx:'fx_slash',ws:.62},
 wonso:{hand:[422,308],grip:[85,256],rest:-45,move:'slash',fx:'fx_slash',ws:.6}};
/* shared weapons (512 space): used by generals without their own weapon image, chosen from the game's own weapon type */
const SW={spear:{img:'sd_w_spear',grip:[160,242],rest:-18,move:'thrust',fx:'fx_thrust',ws:.8},
 sword:{img:'sd_w_sword',grip:[92,254],rest:-45,move:'slash',fx:'fx_slash',ws:.6},
 glaive:{img:'sd_w_glaive',grip:[140,268],rest:-55,move:'slash',fx:'fx_slash',ws:.8},
 halberd:{img:'sd_w_halberd',grip:[140,266],rest:-50,move:'slash',fx:'fx_slash',ws:.8},
 mace:{img:'sd_w_mace',grip:[140,256],rest:-40,move:'slash',fx:'fx_slash',ws:.62},
 bow:{img:'sd_w_bow',grip:[256,214],rest:90,move:'shoot',fx:'fx_arrow_trail',ws:.55},
 fan:{img:'sd_w_fan',grip:[120,276],rest:-60,move:'fan',fx:'fx_fan_wind',ws:.55},
 scroll:{img:'sd_w_scroll',grip:[256,256],rest:-20,move:'fan',fx:'fx_fan_wind',ws:.45},
 twin:{img:'sd_w_twin',grip:[256,300],rest:-10,move:'slash',fx:'fx_slash',ws:.55}};
const WMAP={spear:'spear',blade:'sword',glaive:'glaive',smash:'mace',bow:'bow',crossbow:'bow',talisman:'scroll',fan:'fan',petal:'fan'};
const GEN2={ugeum:0,akjin:0,join:0,gwanpyeong:0,seoseo:0,madae:0,jeongbo:0,hwanggae:0,handang:0,hwaung:0,gosun:0,jingung:0,hahudon:0,jangryo:'halberd',sunuk:0,yubi:'twin',macho:0,bangtong:0,songwon:0,gamnyeong:0,taesaja:0,yeomong:0,anryang:0,munchu:0,choseon:0};
const ALIAS={m_gwanu:'gwanu',m_joun:'joun',m_jegal:'jegal',m_jojo:'jojo',m_sonchaek:'sonchaek',m_yeopo:'yeopo',m_jangbi:'jangbi',m_samaui:'samaui',m_juyu:'juyu',m_wonso:'wonso'};
const IMG={};let ready=false;
/* soldiers hold their weapon in the drawing: body-only motion */
const SOL={w_sp:'thrust',s_sp:'thrust',o_sp:'thrust',q_sp:'thrust',w_ar:'shoot',s_ar:'shoot',o_ar:'shoot',q_ar:'shoot'};
const MYTH=['m_gwanu','m_jegal','m_jojo','m_sonchaek','m_yeopo','m_joun','m_jangbi','m_samaui','m_juyu','m_wonso'],FACFX=['fx_wei','fx_shu','fx_wu','fx_qun'];
const names=['pad_1','pad_2','pad_3','decor','fx_slash','fx_thrust','fx_arrow_trail','fx_fan_wind','fx_mythic_aura'].concat(FACFX,Object.keys(SOL).map(k=>'sd_'+k+'_body'),MYTH.map(k=>'sd_'+k+'_body'),...Object.keys(CH).map(k=>['sd_'+k+'_body','sd_'+k+'_weapon']),Object.keys(GEN2).map(k=>'sd_'+k+'_body'),Object.values(SW).map(w=>w.img));
let left=names.length;
function done(){if(--left>0)return;ready=true;try{bgCache=null;}catch(e){}}
if(on)names.forEach(n=>{const im=new Image();im.onload=()=>{IMG[n]=im;done();};im.onerror=done;im.src=BASE+n+'.webp';});
const R=Math.PI/180,ease=q=>q<.5?2*q*q:1-Math.pow(-2*q+2,2)/2;
const rnd=i=>{const s=Math.sin(i*127.1+311.7)*43758.5453;return s-Math.floor(s);};
/* ---- empty slot → small stone/straw platform (drawn once into the cached background) ---- */
function pad(g,x,y,i){if(!on||!ready)return false;const p=IMG['pad_'+(1+i%3)];if(!p)return false;
  g.save();g.translate(x+(rnd(i)-.5)*4,y+6+(rnd(i+9)-.5)*3);g.rotate((rnd(i+3)-.5)*.12);
  g.globalAlpha=.92;g.drawImage(p,-30,-22,60,45);g.restore();
  const dc=IMG.decor;if(dc&&rnd(i+21)<.45){const k=Math.floor(rnd(i+5)*8),cw=dc.width/4,chh=dc.height/2,dx=x+(rnd(i+7)<.5?-1:1)*27,dy=y+(rnd(i+8)<.5?-1:1)*25;
    g.globalAlpha=.85;g.drawImage(dc,(k%4)*cw,Math.floor(k/4)*chh,cw,chh,dx-9,dy-9,18,18);g.globalAlpha=1;}
  return true;}
/* ---- a general standing on his slot ---- */
const GRC=['#9b958a','#c47a3a','#dfe6ef','#f2c14e','#ff5a3a'];
function unit(ctx,u,x,y){if(!on||!ready)return false;const id=ALIAS[u.d.id]||u.d.id;let c=CH[id],wpn;
  if(c)wpn=IMG['sd_'+id+'_weapon'];else if(id in GEN2){const w=SW[GEN2[id]||WMAP[u.wp]||'sword'];if(!w)return false;
    c=u._sdc||(u._sdc=Object.assign({hand:/thrust|slash/.test(w.move)&&w.ws>.7?[350,304]:[410,300]},w));wpn=IMG[w.img];}
  else if(SOL[id]){c=u._sdc||(u._sdc={solo:1,move:SOL[id],fx:SOL[id]==='shoot'?'fx_arrow_trail':'fx_thrust',rest:0,hand:[430,300]});}
  else return false;
  const body=IMG['sd_'+u.d.id+'_body']||IMG['sd_'+id+'_body'];if(!body||(!wpn&&!c.solo))return false;
  const now=performance.now()/1000,s=u._sd||(u._sd={a:null,t:9,face:1,ph:Math.random()*6});
  if(u.anim&&u.anim!==s.a){s.a=u.anim;s.t=0;if(Math.abs(u.anim.nx)>.25)s.face=u.anim.nx<0?-1:1;s.nx=u.anim.nx;s.ny=u.anim.ny;}
  const dt=Math.min(.05,s.last?now-s.last:0);s.last=now;s.t+=dt;
  const D=.5,q=Math.min(1,s.t/D),act=s.t<D,mythic=u.d.g>=4;
  // grade glow on the pad under the feet
  ctx.save();ctx.globalAlpha=.55;ctx.fillStyle=GRC[u.d.g]||GRC[1];ctx.beginPath();ctx.ellipse(x,y+19,19,6,0,0,7);ctx.fill();
  ctx.globalAlpha=.35;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(x,y+19,14,4,0,0,7);ctx.fill();ctx.restore();
  // body: breathing, lean into the strike, squash on impact
  let bx=0,lean=0,sx=1,sy=1+Math.sin(now*3+s.ph)*.018,wa=c.rest,wx=0,wy=0,fxA=0;
  if(act){const p1=q<.35?ease(q/.35):1,p2=q<.35?0:ease(Math.min(1,(q-.35)/.3)),back=q>.65?ease((q-.65)/.35):0;
    if(c.move==='slash'){wa=c.rest-55*p1+120*p2-65*back;lean=(-5*p1+10*p2-5*back);bx=-2*p1+6*p2-4*back;fxA=q>.35&&q<.8?1-(q-.35)/.45:0;}
    else if(c.move==='thrust'){wa=c.rest+8*p2-8*back;wx=-7*p1+20*p2-13*back;lean=-3*p1+7*p2-4*back;bx=-2*p1+5*p2-3*back;fxA=q>.4&&q<.8?1-(q-.4)/.4:0;}
    else if(c.move==='shoot'){wx=-3*p1+3*p2;lean=-4*p1+4*p2;bx=-3*p1+3*p2;fxA=q>.35&&q<.75?1-(q-.35)/.4:0;}
    else{wa=c.rest-25*p1+85*p2-60*back;lean=-3*p1+6*p2-3*back;fxA=q>.35&&q<.85?1-(q-.35)/.5:0;}
    if(q>.35&&q<.5){sx=1.06;sy=.95;}}
  const BS=56*(u.d.g>=4?1.1:u.d.g>=3?1.04:c.solo?.86:1),k=BS/512,f=s.face;       // body drawn 76×76 logical, feet on the pad
  if(mythic&&IMG.fx_mythic_aura){ctx.save();ctx.globalAlpha=.55+.25*Math.sin(now*4+s.ph);ctx.drawImage(IMG.fx_mythic_aura,x-30,y-18,60,60);ctx.restore();}
  ctx.save();ctx.translate(x+bx*f,y+20);ctx.scale(f,1);ctx.rotate(lean*R);ctx.scale(sx,sy);
  if(u.d.g>=3){const gr=ctx.createRadialGradient(0,-BS*.42,4,0,-BS*.42,BS*.5);gr.addColorStop(0,mythic?'rgba(255,170,60,.55)':'rgba(255,214,90,.32)');gr.addColorStop(1,'rgba(255,200,80,0)');ctx.globalAlpha=.75+.25*Math.sin(now*(mythic?5:3)+s.ph);ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(0,-BS*.42,BS*.5,BS*.56,0,0,7);ctx.fill();ctx.globalAlpha=1;}
  ctx.drawImage(body,-BS/2,-BS*.93,BS,BS);
  // weapon: rotates around the hand
  const hx=(c.hand[0]-256)*k,hy=c.hand[1]*k-BS*.93,ws=k*c.ws;
  if(wpn){ctx.save();ctx.translate(hx+wx,hy+wy);ctx.rotate(wa*R);ctx.drawImage(wpn,-c.grip[0]*ws,-c.grip[1]*ws,512*ws,512*ws);ctx.restore();}
  // effect in front of the weapon
  const fx=(u.d.g>=3&&c.move!=='shoot'&&IMG[FACFX[u.d.f]])||IMG[c.fx];if(fx&&fxA>0){ctx.globalAlpha=Math.min(1,fxA*1.6);const fs=c.move==='shoot'?44:c.move==='thrust'?46:54;
    ctx.drawImage(fx,hx+(c.move==='slash'?2:14),hy-fs/2-(c.move==='slash'?6:0),fs,fs);ctx.globalAlpha=1;}
  ctx.restore();
  return true;}
window.SDV={pad,unit,get on(){return on;},CH};
})();
