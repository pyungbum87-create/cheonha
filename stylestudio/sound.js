/* ---------- 소리: 효과음(코드로 합성, 파일 없음) + 배경음악(audio/ 폴더 파일) ----------
   배경음악 파일을 audio/ 에 넣으면 자동 재생된다. 없으면 효과음만 나온다.
     audio/bgm_salon.mp3   로비·살롱·게임
     audio/bgm_story.mp3   스토리 장면
     audio/bgm_award.mp3   어워드·결승
     audio/bgm_diag.mp3    퍼스널컬러 진단
   모바일은 첫 터치 뒤에만 소리가 날 수 있어서, 첫 터치 때 오디오를 깨운다.
   음소거 상태는 localStorage 'cs_sound' (sfx/bgm 각각) */
(function(){
  let st={sfx:true,bgm:true}; try{ Object.assign(st, JSON.parse(localStorage.getItem("cs_sound")||"{}")); }catch(e){}
  const save=()=>{ try{ localStorage.setItem("cs_sound",JSON.stringify(st)); }catch(e){} };
  let ctx=null, master=null;
  function ac(){ if (!ctx){ const C=window.AudioContext||window.webkitAudioContext; if (!C) return null; ctx=new C(); master=ctx.createGain(); master.gain.value=0.5; master.connect(ctx.destination); }
    if (ctx.state==="suspended") ctx.resume(); return ctx; }
  // 음 하나: 주파수, 시작(초), 길이, 파형, 크기
  function tone(f, t0, dur, type="sine", vol=0.3, slide=0){
    const c=ac(); if (!c) return; const t=c.currentTime+t0, o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(f,t); if (slide) o.frequency.exponentialRampToValueAtTime(f*slide, t+dur);
    g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(vol,t+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t+dur+0.05);
  }
  function noise(t0, dur, vol=0.15, hp=3000){
    const c=ac(); if (!c) return; const n=Math.floor(c.sampleRate*dur), b=c.createBuffer(1,n,c.sampleRate), d=b.getChannelData(0);
    for (let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
    const s=c.createBufferSource(), f=c.createBiquadFilter(), g=c.createGain(); s.buffer=b; f.type="highpass"; f.frequency.value=hp; g.gain.value=vol;
    s.connect(f); f.connect(g); g.connect(master); s.start(c.currentTime+t0);
  }
  const N=(m)=>440*Math.pow(2,(m-69)/12);   // MIDI → Hz
  const SFX={
    tap:   ()=>tone(1300,0,0.05,"triangle",0.12),
    pick:  ()=>{ tone(N(84),0,0.07,"sine",0.18); tone(N(91),0.035,0.08,"sine",0.12); },
    coin:  ()=>{ tone(N(88),0,0.08,"square",0.08); tone(N(95),0.07,0.22,"square",0.08); },
    buy:   ()=>{ noise(0,0.08,0.12,5000); tone(N(91),0.04,0.1,"triangle",0.2); tone(N(96),0.12,0.25,"triangle",0.2); },
    page:  ()=>noise(0,0.12,0.06,2000),
    good:  ()=>[72,76,79,84].forEach((m,i)=>tone(N(m),i*0.08,0.25,"triangle",0.2)),
    great: ()=>{ [72,76,79,84,88].forEach((m,i)=>tone(N(m),i*0.07,0.3,"triangle",0.22)); [84,88,91].forEach(m=>tone(N(m),0.4,0.7,"sine",0.12)); noise(0.38,0.4,0.05,7000); },
    meh:   ()=>[67,64].forEach((m,i)=>tone(N(m),i*0.12,0.22,"triangle",0.16)),
    bad:   ()=>{ tone(N(60),0,0.25,"sawtooth",0.07,0.8); tone(N(55),0.18,0.4,"sawtooth",0.07,0.8); },
    level: ()=>[67,72,76,79,84,79,84].forEach((m,i)=>tone(N(m),i*0.09,0.22,"square",0.07)),
    trophy:()=>{ [60,64,67,72].forEach(m=>tone(N(m),0,1.2,"triangle",0.1)); [79,84,88,91,96].forEach((m,i)=>tone(N(m),0.15+i*0.09,0.5,"sine",0.15)); noise(0.1,1.0,0.05,6000); },
    unlock:()=>{ [76,83,88].forEach((m,i)=>tone(N(m),i*0.1,0.35,"sine",0.18)); noise(0.2,0.5,0.04,8000); },
    tick:  ()=>tone(1800,0,0.03,"square",0.05),
  };
  // 배경음악
  const bgmEl=new Audio(); bgmEl.loop=true; bgmEl.volume=0.32; bgmEl.preload="none";
  let want=null, have={}, unlocked=false;
  function bgm(name){
    want=name; if (!st.bgm || !unlocked){ return; }
    const src=`audio/bgm_${name}.mp3`;
    if (have[name]===false) { bgmEl.pause(); return; }
    if (bgmEl.dataset.n===name && !bgmEl.paused) return;
    bgmEl.dataset.n=name; bgmEl.src=src;
    bgmEl.play().then(()=>{ have[name]=true; }).catch(()=>{});
  }
  bgmEl.addEventListener("error",()=>{ if (bgmEl.dataset.n) have[bgmEl.dataset.n]=false; });
  function wake(){ if (unlocked) return; unlocked=true; ac(); if (want) bgm(want); }
  ["pointerdown","touchstart","keydown"].forEach(e=>addEventListener(e,wake,{once:false,passive:true,capture:true}));
  // 버튼 누르면 톡
  addEventListener("click",e=>{ if (!st.sfx) return; const b=e.target.closest&&e.target.closest("button,.thumb,figure[data-b],.chip"); if (b) SFX.tap(); },true);
  const play=n=>{ if (!st.sfx) return; try{ ac(); (SFX[n]||SFX.tap)(); }catch(e){} };
  // 음소거 버튼 (오른쪽 위)
  function ui(){
    const b=document.createElement("button"); b.id="sndBtn"; b.setAttribute("aria-label","소리 설정");
    const draw=()=>{ b.textContent = st.sfx||st.bgm ? (st.bgm?"🔊":"🔉") : "🔇"; };
    b.style.cssText="position:fixed;left:8px;bottom:calc(8px + env(safe-area-inset-bottom));z-index:85;width:34px;height:34px;opacity:.75;border-radius:50%;border:none;background:rgba(255,255,255,.85);box-shadow:0 2px 8px rgba(0,0,0,.15);font-size:16px;cursor:pointer";
    b.onclick=e=>{ e.stopPropagation();   // 켜짐 → 음악만 끔 → 모두 끔 → 켜짐
      if (st.sfx&&st.bgm){ st.bgm=false; bgmEl.pause(); } else if (st.sfx){ st.sfx=false; } else { st.sfx=st.bgm=true; if (want) bgm(want); }
      save(); draw(); if (window.toast) window.toast(st.sfx&&st.bgm?"🔊 소리 켜짐":st.sfx?"🔉 배경음악 끔 (효과음만)":"🔇 소리 끔"); };
    draw(); document.body.appendChild(b);
  }
  if (document.body) ui(); else addEventListener("DOMContentLoaded",ui);
  window.SND={play, bgm, state:()=>({...st})};
})();
