/* 천하등용 공통 플랫폼 층 (v30.2)
   - CH_TRACK(ev, props): 통계. 기기 안에 최근 400건 저장 + 외부 전송 자리(CHEONHA_TRACK_SINK, gtag)
   - CH_AD.rewarded(placement, {group, cap}) -> Promise<boolean>: 보상형 광고. 끝까지 본 경우만 true
     실제 광고 연결: window.CHEONHA_REWARDED_AD = { show({placement}) -> Promise<boolean> } 하나만 넣으면
     시나리오·끝없는 전장(index/zh)과 관문 돌파(legion) 모두 그 광고를 씀.
   - 미니게임 이식 때는 이 파일만 플랫폼용(wx/tt)으로 바꾸면 됨.
   - 주소 끝에 ?stats=1 을 붙이면 이 기기의 통계 요약을 화면에 띄움(검수용). */
(function(root){
  'use strict';
  const ZH=/^zh/i.test(document.documentElement.lang||'');
  const T=(k,z)=>ZH?z:k;
  const BUILD='v30.2';
  const KEY='cheonha_track_v1',MAX=400;
  const PAGE=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'').replace(/-zh$/,'')==='legion'?'legion':'main';
  const ls={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
  let uid=ls.get('cheonha_uid');if(!uid){uid='u'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);ls.set('cheonha_uid',uid);}
  const sid=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  let buf;try{buf=JSON.parse(ls.get(KEY))||[];}catch(e){buf=[];}
  let dirty=0;const flush=()=>{if(!dirty)return;dirty=0;if(buf.length>MAX)buf=buf.slice(-MAX);ls.set(KEY,JSON.stringify(buf));};
  setInterval(flush,4000);

  function track(ev,p){
    const e=Object.assign({ev,t:Date.now(),sid,uid,lang:ZH?'zh':'ko',page:PAGE,build:BUILD},p||{});
    buf.push(e);dirty=1;if(/_end$|^ad_/.test(ev))flush();
    try{if(typeof root.CHEONHA_TRACK_SINK==='function')root.CHEONHA_TRACK_SINK(e);}catch(x){}
    try{if(typeof root.gtag==='function')root.gtag('event',ev,Object.assign({lang:e.lang,page:PAGE,build:BUILD},p||{}));}catch(x){}
    return e;
  }
  function summary(){flush();
    const out={events:buf.length,count:{},modes:{},ads:{offer:0,done:0,fail:0,cancel:0},sessions:0,avgSessionSec:0};
    let sd=0,sn=0;
    for(const e of buf){out.count[e.ev]=(out.count[e.ev]|0)+1;
      if(e.ev==='game_end'||e.ev==='legion_end'){const m=e.ev==='legion_end'?'legion':e.mode+(e.mode==='scn'?'#'+e.scn+'/'+e.tier:'');const o=out.modes[m]||(out.modes[m]={plays:0,wins:0,rounds:0,sec:0});o.plays++;if(e.win)o.wins++;o.rounds+=e.round||e.n||0;o.sec+=e.dur||0;}
      if(e.ev==='ad_offer')out.ads.offer++;if(e.ev==='ad_reward')out.ads.done++;if(e.ev==='ad_fail')out.ads.fail++;if(e.ev==='ad_cancel')out.ads.cancel++;
      if(e.ev==='session_end'){sd+=e.dur||0;sn++;}}
    for(const k in out.modes){const o=out.modes[k];o.winRate=Math.round(o.wins/o.plays*100)+'%';o.avgRound=+(o.rounds/o.plays).toFixed(1);o.avgSec=Math.round(o.sec/o.plays);delete o.rounds;delete o.sec;}
    out.sessions=sn;out.avgSessionSec=sn?Math.round(sd/sn):0;return out;}
  track.summary=summary;track.all=()=>{flush();return buf.slice();};track.clear=()=>{buf=[];dirty=1;flush();};
  root.CH_TRACK=track;

  // 세션: 화면이 보이는 시간만 더함
  let shown=document.visibilityState!=='hidden'?Date.now():0,acc=0,ended=0;
  const standalone=!!(root.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
  track('session_start',{ref:document.referrer?'1':'0',standalone,w:innerWidth,h:innerHeight});
  document.addEventListener('visibilitychange',()=>{if(ended)return;if(document.visibilityState==='hidden'){if(shown){acc+=Date.now()-shown;shown=0;}track('session_pause',{dur:Math.round(acc/1000)});flush();}else shown=Date.now();});
  addEventListener('pagehide',()=>{if(ended)return;ended=1;if(shown){acc+=Date.now()-shown;shown=0;}track('session_end',{dur:Math.round(acc/1000)});flush();});

  /* ---------------- 보상형 광고 ---------------- */
  const provider=()=>root.CHEONHA_REWARDED_AD&&typeof root.CHEONHA_REWARDED_AD.show==='function'?root.CHEONHA_REWARDED_AD:null;
  const today=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();};
  function used(group){let o;try{o=JSON.parse(ls.get('cheonha_adcap_'+group))||{};}catch(e){o={};}return o.d===today()?o.n|0:0;}
  function use(group){ls.set('cheonha_adcap_'+group,JSON.stringify({d:today(),n:used(group)+1}));}
  let busy=false;
  function css(){if(document.getElementById('chAdCss'))return;const s=document.createElement('style');s.id='chAdCss';
    s.textContent='#chAd{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);font-family:system-ui,sans-serif}#chAd .bx{width:min(340px,86vw);background:#2a1c11;border:2px solid #f2c14e;border-radius:14px;padding:16px;color:#fff2d8;text-align:center}#chAd b{display:block;color:#f2c14e;font-size:17px;margin-bottom:6px}#chAd p{font-size:13px;line-height:1.45;margin:6px 0 12px;opacity:.9}#chAd button{display:block;width:100%;margin:6px 0;padding:10px;border-radius:9px;border:1px solid #8a6a3a;background:#3a2716;color:#fff2d8;font-size:14px}#chAd button.go{background:#a8312a;border-color:#f2c14e}';document.head.append(s);}
  function box(title,desc,btns){css();return new Promise(res=>{const w=document.createElement('div');w.id='chAd';
    w.innerHTML='<div class="bx"><b></b><p></p></div>';w.querySelector('b').textContent=title;w.querySelector('p').textContent=desc;
    const bx=w.firstChild;btns.forEach(([t,v,cls])=>{const b=document.createElement('button');b.textContent=t;if(cls)b.className=cls;b.onclick=e=>{e.stopPropagation();w.remove();res(v);};bx.append(b);});
    ['pointerdown','pointerup','touchstart','touchend'].forEach(k=>w.addEventListener(k,e=>e.stopPropagation()));document.body.append(w);});}
  async function rewarded(placement,o){o=o||{};const group=o.group||placement,cap=o.cap||0;
    if(busy)return false;
    if(cap&&used(group)>=cap){track('ad_capped',{placement});await box(T('오늘 광고 보상 끝','今日奖励已领完'),T('오늘 받을 수 있는 광고 보상을 모두 받았어요. 내일 다시 받을 수 있어요.','今天的广告奖励次数已用完，明天再来吧。'),[[T('확인','确定'),0,'go']]);return false;}
    track('ad_offer',{placement});busy=true;
    try{const pv=provider();let ok;
      if(pv){try{ok=(await pv.show({placement}))===true;}catch(e){track('ad_fail',{placement,err:String(e&&e.message||e).slice(0,60)});
          await box(T('광고를 불러오지 못했어요','广告加载失败'),T('잠시 후 다시 시도해 주세요.','请稍后再试。'),[[T('확인','确定'),0,'go']]);return false;}}
      else ok=await box(T('테스트 모드 · 실제 광고 아님','测试模式 · 非真实广告'),T('브라우저 시연입니다. 끝까지 보면 보상을, 중간에 닫으면 보상 없음을 시험할 수 있어요.','浏览器演示：看完领奖励，中途关闭则无奖励。')+(cap?T(' (오늘 남은 횟수 ',' (今日剩余 ')+(cap-used(group))+'/'+cap+')':''),
          [[T('테스트: 끝까지 시청','测试：看完'),true,'go'],[T('테스트: 중간에 종료','测试：中途关闭'),false],[T('나중에','以后再说'),null]]);
      if(ok===null){track('ad_cancel',{placement});return false;}
      if(ok){if(cap)use(group);track('ad_reward',{placement,real:!!pv});return true;}
      track('ad_skip',{placement});return false;
    }finally{busy=false;}}
  root.CH_AD={rewarded,provider,used,isReal:()=>!!provider()};

  // 검수용 통계 보기
  if(/[?&]stats=1/.test(location.search))addEventListener('load',()=>setTimeout(()=>{const s=summary(),w=document.createElement('pre');
    w.style.cssText='position:fixed;inset:8px;z-index:9998;overflow:auto;background:#000d;color:#9f9;font:11px/1.35 monospace;padding:10px;border:1px solid #9f9;border-radius:8px;white-space:pre-wrap';
    w.textContent=T('이 기기 통계 (탭하면 닫기)\n','本机统计（点按关闭）\n')+JSON.stringify(s,null,1);w.onclick=()=>w.remove();document.body.append(w);},800));
})(window);
