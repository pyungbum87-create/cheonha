/* ============================================================================
   천하등용 v38 — 안전 모드 · 오류 기록 화면 (2026-11-28)
   guard.js(가장 먼저)가 기록을 모으고, 이 파일이 화면과 안전 모드를 붙인다. 한·중 공용.
   안전 모드: 화면 해상도 1배, 효과 낮음, 화면 흔들림 끔. 타이틀에 안내와 [정상 모드] 버튼.
   설정 → [오류 기록]: 기록 보기 · 복사 · 지우기 · 안전 모드 켜기/끄기.
   ========================================================================== */
(function(){
'use strict';
const ZH=document.documentElement.lang.startsWith('zh');
const T=(ko,zh)=>ZH?zh:ko;
const DG=window.CH_DIAG;if(!DG)return;
const SAFE=!!window.CH_SAFE;
DG.stage('ready '+(window.__verTxt||''));

/* 안전 모드: 캔버스 1배 해상도 + 효과 낮춤 */
if(SAFE){
  window.resize=(o=>function(){o.apply(this,arguments);if(K>1){K=1;CV.width=W;CV.height=H;bgCache=null;}})(resize);
  SAVE.opt.fx=Math.min(SAVE.opt.fx,0);SAVE.opt.shake=0;
  try{resize();}catch(e){}
  const t=document.getElementById('title');
  if(t){const n=document.createElement('div');n.style.cssText='position:absolute;left:50%;bottom:calc(14px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:3;background:rgba(40,20,10,.92);border:1px solid #f2c14e;border-radius:8px;padding:6px 10px;font-size:12.5px;color:#f6ead2;display:flex;gap:8px;align-items:center;white-space:nowrap';
    n.innerHTML=`<span>${T('안전 모드 · 화질과 효과를 낮췄어요','安全模式 · 已降低画质与特效')}</span>`;const b=document.createElement('button');b.className='btn';b.style.cssText='font-size:12px;padding:4px 10px;min-height:30px';b.textContent=T('정상 모드로','恢复正常');
    b.onclick=()=>{DG.setSafe(false);DG.clear();location.reload();};n.append(b);t.append(n);}
}

/* 단계 기록: 어디서 꺼졌는지 알기 위해 */
window.newGame=(o=>function(m){DG.stage('battle '+m);return o.apply(this,arguments);})(newGame);
window.toTitle=(o=>function(){DG.stage('title');return o.apply(this,arguments);})(toTitle);

/* 설정 → 오류 기록 */
function openDiag(){const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:95;background:rgba(10,6,3,.9);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box';
  o.innerHTML=`<div style="width:min(520px,96vw);max-height:90vh;display:flex;flex-direction:column;gap:8px;background:#2a1c11;border:2px solid #f2c14e;border-radius:14px;padding:12px;color:#f6ead2">
  <h3 style="margin:0;color:#f2c14e;font-size:18px">${T('오류 기록','错误记录')}</h3>
  <p style="margin:0;font-size:13px;opacity:.85">${T('문제가 생기면 [복사]를 눌러 베파에게 보내 주세요. 이 폰에만 저장돼요.','遇到问题时请点[复制]并发送。仅保存在本机。')}</p>
  <textarea readonly style="flex:1;min-height:220px;font-size:11px;background:#1a110a;color:#f6ead2;border:1px solid #6a4a2a;border-radius:6px"></textarea>
  <p class="m" style="margin:0;min-height:1em;font-size:13px;color:#9be0a0"></p><div class="r" style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center"></div></div>`;
  const ta=o.querySelector('textarea'),m=o.querySelector('.m'),r=o.querySelector('.r');ta.value=DG.text();
  const mk=(t,f)=>{const b=document.createElement('button');b.className='btn';b.style.cssText='font-size:14px;padding:7px 12px';b.textContent=t;b.onclick=f;r.append(b);};
  mk(T('복사','复制'),async()=>{try{await navigator.clipboard.writeText(ta.value);m.textContent=T('복사했어요','已复制');}catch(e){ta.select();try{document.execCommand('copy');m.textContent=T('복사했어요','已复制');}catch(_){m.textContent=T('글을 길게 눌러 복사해 주세요','请长按文字复制');}}});
  mk(T('지우기','清除'),()=>{DG.clear();ta.value=DG.text();m.textContent=T('지웠어요','已清除');});
  mk(SAFE?T('안전 모드 끄기','关闭安全模式'):T('안전 모드 켜기','开启安全模式'),()=>{DG.setSafe(!SAFE);location.reload();});
  mk(T('닫기','关闭'),()=>o.remove());document.body.append(o);}
{const back=document.getElementById('optBack');if(back){const b=document.createElement('button');b.className='btn';b.style.cssText='font-size:14px;padding:7px 14px;margin:4px auto;display:block';b.textContent=T('오류 기록','错误记录');b.onclick=openDiag;back.parentNode.insertBefore(b,back);}}
window.__v38={openDiag,SAFE};
})();
