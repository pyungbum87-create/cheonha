/* ---------- 언어(한국어/简体中文) + 이모지 대체 ----------
   중국어는 화면 글자를 번역 사전(i18n_zh.js)으로 바꿔 보여 준다. 사전은 중국어일 때만 받는다.
   자동 선택: 저장된 선택 → 브라우저 언어 zh → 중국·홍콩·대만 시간대 → 한국어
   🪙 등 새 이모지가 깨지는 기기(☒)에서는 비슷한 이모지로 바꾼다. */
(function(){
  let L=null; try{ L=localStorage.getItem("cs_lang"); }catch(e){}
  if (!L){ const nl=(navigator.language||"").toLowerCase(); let tz=""; try{ tz=Intl.DateTimeFormat().resolvedOptions().timeZone||""; }catch(e){}
    L = /^zh/.test(nl) || /Shanghai|Chongqing|Harbin|Urumqi|Hong_Kong|Macau|Taipei/.test(tz) ? "zh" : "ko"; }
  window.LANG=L; const root=document.documentElement; root.lang = L==="zh" ? "zh-CN" : "ko";
  window.setLang = l=>{ try{ localStorage.setItem("cs_lang",l); }catch(e){} location.reload(); };

  const emojiOK = e=>{ try{ const c=document.createElement("canvas"); c.width=c.height=24; const g=c.getContext("2d"); g.textBaseline="top"; g.font="18px sans-serif"; g.fillText(e,0,0);
    const d=g.getImageData(0,0,24,24).data; for (let i=0;i<d.length;i+=4) if (d[i+3]>60 && (Math.abs(d[i]-d[i+1])>25 || Math.abs(d[i+1]-d[i+2])>25)) return true; return false; }catch(e){ return true; } };
  const EMO={}; if (!emojiOK("🪙")) EMO["🪙"]="💰"; if (!emojiOK("🪞")) EMO["🪞"]="🔍";

  let DICT={}, RX=null;
  const build=()=>{ const keys=[...Object.keys(DICT), ...Object.keys(EMO)].sort((a,b)=>b.length-a.length);
    RX = keys.length ? new RegExp(keys.map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|"),"g") : null; };
  const tr = t => (!RX || !t || !/[가-힣\u{1FA99}\u{1FA9E}]/u.test(t)) ? t : t.replace(RX, m => m in DICT ? DICT[m] : EMO[m]);
  window.TR = tr;
  const walk = n=>{
    if (n.nodeType===3){ const v=tr(n.nodeValue); if (v!==n.nodeValue) n.nodeValue=v; return; }
    if (n.nodeType!==1 || n.tagName==="SCRIPT" || n.tagName==="STYLE") return;
    for (const a of ["placeholder","title","aria-label"]) if (n.hasAttribute(a)){ const o=n.getAttribute(a), v=tr(o); if (v!==o) n.setAttribute(a,v); }
    for (const c of n.childNodes) walk(c);
  };
  // 그림 카드(캔버스) 글자, 공유 문구도 번역
  const P=CanvasRenderingContext2D.prototype, ft=P.fillText, mt=P.measureText;
  P.fillText=function(t,...a){ return ft.call(this, tr(String(t)), ...a); };
  P.measureText=function(t){ return mt.call(this, tr(String(t))); };
  if (navigator.share){ const sh=navigator.share.bind(navigator); navigator.share=o=>sh({...o, title:tr(o.title), text:tr(o.text)}); }
  if (navigator.clipboard && navigator.clipboard.writeText){ const wt=navigator.clipboard.writeText.bind(navigator.clipboard); navigator.clipboard.writeText=t=>wt(tr(t)); }

  let started=false;
  const start=()=>{ if (started) return; started=true; build(); if (RX){ walk(document.body); document.title=tr(document.title);
      new MutationObserver(ms=>{ for (const m of ms){ if (m.type==="characterData") walk(m.target); else m.addedNodes.forEach(walk); } })
        .observe(document.body,{childList:true,subtree:true,characterData:true}); }
    root.classList.remove("zhload"); };
  const whenReady=f=>{ if (document.body) f(); else addEventListener("DOMContentLoaded",f); };
  if (L==="zh"){
    root.classList.add("zhload"); setTimeout(()=>root.classList.remove("zhload"),3000);
    const s=document.createElement("script"); s.src="i18n_zh.js?v=15";
    s.onload=()=>{ DICT=window.ZH||{}; whenReady(start); }; s.onerror=()=>whenReady(start);
    document.head.appendChild(s);
  } else whenReady(start);
})();
