/* ============================================================================
   천하등용 guard.js — 오류 기록 · 갑작스러운 종료 감지 · 안전 모드 (2026-11-28)
   <head>에서 가장 먼저 불러온다(한·중 공용).
   - 오류와 "갑자기 꺼짐"을 이 폰에 기록한다(설정 → 오류 기록에서 보고 복사).
   - 직전 실행이 두 번 이상 갑자기 꺼졌으면 안전 모드: 화면 해상도·효과를 낮춰 실행.
   서버로 보내지 않는다(개인정보 없음). 기록은 최근 30줄만 둔다.
   ========================================================================== */
(function(){
'use strict';
var KEY='cheonha-diag',D;
try{D=JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch(e){D={};}
if(!Array.isArray(D.log))D.log=[];
var now=Date.now();
function save(){try{D.log=D.log.slice(-30);localStorage.setItem(KEY,JSON.stringify(D));}catch(e){}}
function add(m){D.log.push({t:Date.now(),m:String(m).slice(0,300)});save();}
// 직전 실행이 정상 종료(화면 닫힘·전환) 신호 없이 10분 안에 다시 열렸다면 = 갑자기 꺼짐
if(D.run&&!D.run.ok&&now-(D.run.t||0)<10*60e3){D.crash=(D.crash|0)+1;add('직전 실행이 갑자기 꺼짐 · 마지막 단계: '+(D.run.stage||'?'));}
else if(D.run&&D.run.ok)D.crash=0;
D.run={t:now,stage:'start',ok:0,v:''};
var forced=null;try{forced=localStorage.getItem('cheonha-safe');}catch(e){}
window.CH_SAFE=forced==='1'||(forced!=='0'&&(D.crash|0)>=2);
window.CH_DIAG={
  stage:function(s){D.run.stage=s;D.run.t=Date.now();save();},
  log:add,
  data:function(){return D;},
  text:function(){var ua=navigator.userAgent,lines=['천하등용 오류 기록 · '+new Date().toLocaleString(),'버전 '+(window.__verTxt||'?')+' · 안전 모드 '+(window.CH_SAFE?'켜짐':'꺼짐')+' · 연속 꺼짐 '+(D.crash|0),'기기 '+ua,'화면 '+screen.width+'x'+screen.height+' · 배율 '+(window.devicePixelRatio||1)+' · 홈 화면 앱 '+((navigator.standalone||matchMedia('(display-mode: standalone)').matches)?'예':'아니오'),''];
    for(var i=0;i<D.log.length;i++){var r=D.log[i];lines.push(new Date(r.t).toLocaleString()+'  '+r.m);}return lines.join('\n');},
  clear:function(){D.log=[];D.crash=0;save();},
  setSafe:function(on){try{localStorage.setItem('cheonha-safe',on?'1':'0');}catch(e){}}
};
addEventListener('error',function(e){add('오류: '+(e.message||e)+' @'+String(e.filename||'').split('/').pop()+':'+(e.lineno||0));});
addEventListener('unhandledrejection',function(e){var r=e.reason;add('오류(비동기): '+(r&&r.message||r));});
function ok(){D.run.ok=1;D.run.t=Date.now();save();}
addEventListener('pagehide',ok);
document.addEventListener('visibilitychange',function(){if(document.hidden)ok();else{D.run.ok=0;D.run.t=Date.now();save();}});
setInterval(function(){if(!document.hidden){D.run.t=Date.now();save();}},15000);
save();
})();
