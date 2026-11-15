/* =========================================================
   컬러 스튜디오 – 아바타 그리기 (SVG, 원본 일러스트)
   avatarSVG({skin, hair, hairColor, top, topColor, accs:Set, gender, bg})
   좌표계: viewBox 0 0 400 480, 얼굴 중심 x=200
   ========================================================= */

export const HAIRSTYLES = [
  // k, 이름, 성향(f/m/u), 구성
  {k:"longstraight", n:"롱 스트레이트", g:"f", back:"long",     locks:"long",     bangs:"part"},
  {k:"longwave",     n:"롱 웨이브",     g:"f", back:"long",     locks:"long",     bangs:"curtain", wave:true},
  {k:"bob",          n:"턱선 단발",     g:"f", back:"bob",      locks:"bob",      bangs:"part"},
  {k:"seebob",       n:"시스루뱅 단발", g:"f", back:"bob",      locks:"bob",      bangs:"see"},
  {k:"layered",      n:"어깨 레이어드", g:"f", back:"shoulder", locks:"shoulder", bangs:"side",  wave:true},
  {k:"curtainlong",  n:"커튼뱅 롱",     g:"f", back:"long",     locks:"long",     bangs:"curtain"},
  {k:"pony",         n:"포니테일",      g:"f", back:"pony",     locks:"none",     bangs:"see"},
  {k:"pixie",        n:"숏컷",          g:"u", back:"none",     locks:"none",     bangs:"side",  sides:"tight"},
  {k:"dandy",        n:"댄디컷",        g:"m", back:"none",     locks:"none",     bangs:"dandy"},
  {k:"twoblock",     n:"투블럭",        g:"m", back:"none",     locks:"none",     bangs:"dandy", sides:"twoblock"},
  {k:"comma",        n:"쉼표머리",      g:"m", back:"none",     locks:"none",     bangs:"comma", sides:"twoblock"},
  {k:"gareuma",      n:"가르마펌",      g:"m", back:"none",     locks:"none",     bangs:"curtainShort"},
  {k:"up",           n:"애즈펌(올림)",  g:"m", back:"none",     locks:"none",     bangs:"up",    sides:"tight"},
  {k:"crop",         n:"크롭컷",        g:"m", back:"none",     locks:"none",     bangs:"crop",  sides:"twoblock"},
  {k:"longmen",      n:"남자 장발",     g:"m", back:"shoulder", locks:"shoulder", bangs:"curtain"},
];
export const TOPS = [
  {k:"tee",    n:"티셔츠"},
  {k:"shirt",  n:"셔츠"},
  {k:"tie",    n:"셔츠+타이"},
  {k:"knit",   n:"터틀넥 니트"},
  {k:"hoodie", n:"후드티"},
  {k:"blazer", n:"블레이저"},
];
export const ACCS = [
  {k:"glasses", n:"동그란 안경"},
  {k:"beret",   n:"베레모"},
  {k:"beanie",  n:"비니"},
  {k:"earring", n:"진주 귀걸이"},
];

/* ---------- 색 유틸 ---------- */
function hx(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function toHex(r,g,b){ return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join(""); }
export function shade(h, f){ const [r,g,b]=hx(h); return f>=0 ? toHex(r+(255-r)*f, g+(255-g)*f, b+(255-b)*f) : toHex(r*(1+f), g*(1+f), b*(1+f)); }
export function lum(h){ const [r,g,b]=hx(h); return (0.299*r+0.587*g+0.114*b)/255; }

/* ---------- 곡선 유틸 ---------- */
function cr(points, step=5){ // Catmull-Rom 표본점
  const out=[];
  for (let i=0;i<points.length-1;i++){
    const p0=points[Math.max(0,i-1)], p1=points[i], p2=points[i+1], p3=points[Math.min(points.length-1,i+2)];
    const len=Math.hypot(p2[0]-p1[0],p2[1]-p1[1]), n=Math.max(2,Math.ceil(len/step));
    for (let j=0;j<n;j++){ const t=j/n, t2=t*t, t3=t2*t;
      out.push([0,1].map(k=>0.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3))); }
  }
  out.push(points[points.length-1]); return out;
}
const poly = pts => "M"+pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join("L")+"Z";
const wv = (pts, amp, per, phase=0) => pts.map(([x,y])=>[x+amp*Math.sin(y/per+phase), y]);

/* ---------- 머리 뒷부분 ---------- */
function backHair(type, wave){
  if (type==="none"||type==="pony") return `M114,212 C102,108 156,80 200,80 C244,80 298,108 286,212 C270,228 130,228 114,212Z`;
  const by={bob:304, shoulder:372, long:448}[type], hwB={bob:92, shoulder:106, long:114}[type];
  const right = cr([[288,190],[294,240],[200+hwB-(type==="bob"?4:0),by-40],[200+hwB,by]]);
  let R = wave ? wv(right, 7, 13) : right;
  const bottom=[]; for (let x=200+hwB; x>=200-hwB; x-=6){ const u=(x-200)/hwB;
    bottom.push([x, by + (wave? 7*Math.abs(Math.sin(x/11)) : (type==="bob"? -6*(1-u*u) : 3*Math.abs(Math.sin(x/7))))]); }
  const L = R.map(([x,y])=>[400-x,y]).reverse();
  const top = cr([[112,190],[118,120],[160,82],[200,78],[240,82],[282,120],[288,190]]);
  return poly([...top, ...R, ...bottom, ...L]);
}
function ponytail(){
  const p=cr([[262,118],[300,140],[318,200],[310,280],[296,340],[282,360],[276,330],[288,270],[290,200],[268,150]],4);
  return poly(p);
}

/* ---------- 옆머리(얼굴 옆으로 내려오는 부분, 앞 레이어) ---------- */
function locks(type, wave){
  if (type==="none") return "";
  const by={bob:304, shoulder:370, long:446}[type];
  const mk = s => {
    const inner = type==="bob"
      ? cr([[200+s*62,132],[200+s*72,190],[200+s*72,250],[200+s*62,296],[200+s*54,by]])
      : cr([[200+s*62,132],[200+s*72,190],[200+s*72,250],[200+s*70,300],[200+s*66,by]]);
    const outer = type==="bob"
      ? cr([[200+s*90,150],[200+s*93,220],[200+s*91,280],[200+s*84,by]])
      : cr([[200+s*90,150],[200+s*95,230],[200+s*100,300],[200+s*104,by]]);
    let I=inner, O=outer;
    if (wave){ I=wv(I,6,13,s); O=wv(O,7,13,s); }
    const tip=[]; const a=I[I.length-1], b=O[O.length-1];
    for (let k=0;k<=6;k++){ const t=k/6; tip.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t + (k%2?6:0)]); }
    return poly([...I, ...tip, ...O.reverse()]);
  };
  return mk(-1)+mk(1);
}

/* ---------- 정수리(앞 레이어 띠) ---------- */
function crown(sides, tall){
  const t = tall ? 64 : 84;
  const w = sides==="normal" ? 0 : 5;
  return `M${114+w},${sides==="normal"?200:186} C${106+w},108 156,${t} 200,${t} C244,${t} ${294-w},108 ${286-w},${sides==="normal"?200:186}
          L${274-w},${sides==="normal"?200:186} C272,152 248,132 200,132 C152,132 128,152 ${126+w},${sides==="normal"?200:186}Z`;
}

/* ---------- 앞머리 ---------- */
function bangs(type){
  const jag=(x0,x1,y,amp,step,y2)=>{ const p=[]; for(let x=x0;x>=x1;x-=step){ const i=Math.round((x0-x)/step); p.push([x, (y2? y+(y2-y)*((x0-x)/(x0-x1)) : y) + (i%2?amp:0)]); } return p; };
  switch(type){
    case "part": return `M126,196 C122,150 146,124 172,122 C152,138 140,160 134,198Z M168,122 C232,116 276,138 274,196 C262,160 232,140 176,136Z`;
    case "full": { const top=cr([[126,186],[126,140],[160,116],[200,114],[240,116],[274,140],[274,186]]);
      return poly([...top, ...jag(274,126,178,6,8)]); }
    case "see": { let s=`M126,190 C124,140 160,116 200,116 C240,116 276,140 274,190 C262,150 236,140 200,140 C164,140 138,150 126,190Z`;
      for (let x=140;x<=262;x+=10){ const len=36+((x*7)%9); s+=`M${x-6},134 L${x+5},134 L${x+1},${140+len} Z`; }
      return s; }
    case "side": { const top=cr([[126,196],[124,146],[160,116],[206,116],[248,122],[276,146],[274,190]]);
      const b=cr([[274,190],[256,170],[230,162],[196,158],[164,170],[140,186],[126,196]]);
      return poly([...top, ...b]); }
    case "curtain": return `M200,120 C158,120 124,144 122,200 C126,214 132,224 138,230 C138,190 160,150 200,134 C240,150 262,190 262,230 C268,224 274,214 278,200 C276,144 242,120 200,120Z`;
    case "curtainShort": return `M200,118 C158,118 124,142 122,196 C128,198 134,196 140,190 C150,160 172,140 198,132 L202,132 C228,140 250,160 260,190 C266,196 272,198 278,196 C276,142 242,118 200,118Z`;
    case "dandy": { const top=cr([[126,188],[124,142],[160,114],[200,112],[242,114],[276,142],[274,188]]);
      const b=[]; for(let x=274;x>=126;x-=7){ const i=Math.round((274-x)/7); b.push([x, 168+8*Math.sin((x-120)/48)+(i%2?5:0)]); }
      return poly([...top, ...b]); }
    case "comma": { const top=cr([[126,190],[124,144],[160,114],[204,112],[246,116],[276,144],[274,186]]);
      const b=cr([[274,186],[264,196],[252,198],[246,186],[250,174],[236,166],[200,164],[166,170],[142,182],[126,190]]);
      return poly([...top, ...b]); }
    case "up": return `M128,186 C126,140 150,118 172,112 C160,88 186,62 220,64 C258,68 280,98 272,140 C276,158 276,172 274,186 C266,150 246,132 214,128 C190,124 160,132 140,160 C134,168 130,176 128,186Z`;
    case "crop": { const top=cr([[126,186],[126,140],[160,114],[200,110],[240,114],[274,140],[274,186]]);
      return poly([...top, ...jag(274,126,150,4,6)]); }
  }
  return "";
}

/* ---------- 머리결 선 ---------- */
function strands(type){
  const L = {
    full:[[160,122,150,172],[186,118,180,174],[214,118,220,174],[240,122,250,172]],
    side:[[176,122,150,176],[204,120,184,162],[230,124,214,160],[254,132,246,166]],
    dandy:[[160,120,154,166],[186,116,184,170],[214,116,218,172],[240,120,248,168]],
    comma:[[170,120,160,170],[200,116,198,166],[228,120,240,170],[252,130,262,186]],
    curtain:[[196,124,150,170],[190,126,136,206],[204,124,250,170],[210,126,264,206]],
    curtainShort:[[194,124,152,168],[206,124,248,168]],
    up:[[150,140,170,104],[176,124,196,76],[204,122,236,74],[232,124,262,100]],
    crop:[[160,118,158,148],[186,114,186,148],[214,114,214,148],[240,118,242,148]],
    part:[[172,124,140,180],[186,124,236,140],[200,122,260,160]],
    see:[[170,120,168,136],[230,120,232,136]],
  }[type]||[];
  return L.map(([x0,y0,x1,y1])=>`M${x0},${y0} Q${(x0+x1)/2+6},${(y0+y1)/2} ${x1},${y1}`).join(" ");
}

/* ---------- 상의 ---------- */
function topSVG(type, col, skin){
  const dark = shade(col,-0.22), line = shade(col,-0.35);
  const inner = lum(col)>0.6 ? "#2b2b31" : "#f4f2ee";
  const body = `<path d="M38,480 C46,404 104,358 172,340 L228,340 C296,358 354,404 362,480Z" fill="${col}"/>
    <path d="M38,480 C46,404 104,358 172,340 L182,340 C130,370 100,420 96,480Z" fill="${dark}" opacity=".35"/>`;
  switch(type){
    case "tee": return body+`<path d="M170,340 C182,366 218,366 230,340" fill="none" stroke="${line}" stroke-width="5" stroke-linecap="round"/>`;
    case "shirt": case "tie": {
      let s = body+`<path d="M200,372 L200,480" stroke="${line}" stroke-width="2.5"/>`+
        [400,430,460].map(y=>`<circle cx="207" cy="${y}" r="3" fill="${line}"/>`).join("")+
        `<path d="M170,334 L200,372 L184,392 L156,350Z" fill="${shade(col,0.12)}" stroke="${line}" stroke-width="2"/>
         <path d="M230,334 L200,372 L216,392 L244,350Z" fill="${shade(col,0.12)}" stroke="${line}" stroke-width="2"/>`;
      if (type==="tie"){ const tc = lum(col)>0.55 ? "#26355c" : "#8e2a35";
        s += `<path d="M192,368 L208,368 L205,384 L195,384Z" fill="${shade(tc,-0.2)}"/><path d="M195,384 L205,384 L213,466 L200,480 L187,466Z" fill="${tc}"/>`; }
      return s; }
    case "knit": {
      let s = `<path d="M174,296 L226,296 L230,346 C214,354 186,354 170,346Z" fill="${col}"/>`+body;
      s += `<path d="M168,338 C180,352 220,352 232,338 L230,350 C214,360 186,360 170,350Z" fill="${dark}"/>`;
      for (let x=180;x<=222;x+=7) s+=`<path d="M${x},300 L${x},344" stroke="${dark}" stroke-width="2" opacity=".55"/>`;
      for (let x=70;x<=340;x+=16) s+=`<path d="M${x},${x<200?470-(200-x)*0.5:470-(x-200)*0.5} L${x},480" stroke="${dark}" stroke-width="2" opacity=".25"/>`;
      return s; }
    case "hoodie":
      return `<path d="M136,352 C140,312 260,312 264,352 C246,372 154,372 136,352Z" fill="${dark}"/>`+body+
        `<path d="M168,342 C182,372 218,372 232,342" fill="${shade(col,-0.1)}" stroke="${line}" stroke-width="3"/>
         <path d="M188,364 L184,420 M212,364 L216,420" stroke="#f2f0ec" stroke-width="4" stroke-linecap="round"/>
         <path d="M110,440 L290,440 L280,480 L120,480Z" fill="${dark}" opacity=".25"/>`;
    case "blazer":
      return body+`<path d="M172,340 L200,424 L228,340Z" fill="${inner}"/>
        <path d="M172,340 L200,424 L184,434 L148,362Z" fill="${dark}"/><path d="M228,340 L200,424 L216,434 L252,362Z" fill="${dark}"/>
        <circle cx="200" cy="452" r="4" fill="${line}"/>`;
  }
  return body;
}

/* ---------- 얼굴 ---------- */
function faceSVG(skin, hairC, gender){
  const sk2 = shade(skin,-0.12), brow = shade(hairC,-0.15), lips = "#d97a7a";
  const lash = gender==="f" ? `<path d="M156,198 L151,193 M180,198 L185,193 M220,198 L215,193 M244,198 L249,193" stroke="#2a2420" stroke-width="2.5" stroke-linecap="round"/>` : "";
  return `
  <path d="M178,276 L178,346 C190,356 210,356 222,346 L222,276Z" fill="${sk2}"/>
  <ellipse cx="124" cy="208" rx="13" ry="19" fill="${sk2}"/><ellipse cx="276" cy="208" rx="13" ry="19" fill="${sk2}"/>
  <path d="M125,190 C125,120 275,120 275,190 C275,252 246,302 200,306 C154,302 125,252 125,190Z" fill="${skin}"/>
  <path d="M152,184 Q168,${gender==="m"?176:178} 184,183" stroke="${brow}" stroke-width="${gender==="m"?6:4.5}" fill="none" stroke-linecap="round"/>
  <path d="M216,183 Q232,${gender==="m"?176:178} 248,184" stroke="${brow}" stroke-width="${gender==="m"?6:4.5}" fill="none" stroke-linecap="round"/>
  <ellipse cx="168" cy="207" rx="8" ry="10" fill="#2a2420"/><ellipse cx="232" cy="207" rx="8" ry="10" fill="#2a2420"/>
  <circle cx="171" cy="203" r="3" fill="#fff"/><circle cx="235" cy="203" r="3" fill="#fff"/>
  ${lash}
  <path d="M198,226 Q202,240 196,244" stroke="${sk2}" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="152" cy="244" rx="15" ry="8" fill="#f08080" opacity=".22"/><ellipse cx="248" cy="244" rx="15" ry="8" fill="#f08080" opacity=".22"/>
  <path d="M184,262 Q200,276 216,262" stroke="${lips}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
}

/* ---------- 소품 ---------- */
function accFront(accs){
  let s="";
  if (accs.has("earring")) s+=`<circle cx="122" cy="232" r="6" fill="#f6f1e7" stroke="#d8cfbd" stroke-width="1.5"/><circle cx="278" cy="232" r="6" fill="#f6f1e7" stroke="#d8cfbd" stroke-width="1.5"/>`;
  if (accs.has("glasses")) s+=`<g fill="rgba(220,235,255,.18)" stroke="#2a2522" stroke-width="4"><circle cx="168" cy="208" r="21"/><circle cx="232" cy="208" r="21"/></g>
    <path d="M189,204 Q200,197 211,204 M147,204 L126,198 M253,204 L274,198" stroke="#2a2522" stroke-width="4" fill="none"/>`;
  return s;
}
function accHat(accs){
  let s="";
  if (accs.has("beret")) s+=`<g transform="rotate(-9 200 96)"><ellipse cx="196" cy="96" rx="98" ry="38" fill="#8e2430"/><ellipse cx="196" cy="88" rx="80" ry="22" fill="#a8323f" opacity=".6"/>
    <path d="M118,116 Q196,134 276,116" stroke="#5d1520" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="190" cy="58" rx="6" ry="9" fill="#6d1a25"/></g>`;
  if (accs.has("beanie")) s+=`<path d="M112,150 C108,70 160,48 200,48 C240,48 292,70 288,150Z" fill="#3a4a6b"/>
    <path d="M108,150 L292,150 L292,128 L108,128Z" fill="#2c3a57"/>${[120,140,160,180,200,220,240,260,280].map(x=>`<path d="M${x},130 L${x},148" stroke="#22304a" stroke-width="3"/>`).join("")}
    <circle cx="200" cy="44" r="16" fill="#e8e3da"/>`;
  return s;
}

/* ---------- 조립 ---------- */
export function avatarSVG({skin="#f2cfb3", hair="dandy", hairColor="#3e2a20", top="tee", topColor="#f4f2ee", accs=new Set(), gender="n", bg=null, size=null, view="0 0 400 480"}){
  const H = HAIRSTYLES.find(h=>h.k===hair) || HAIRSTYLES[0];
  const hc = hairColor, hd = shade(hc,-0.25), hl = shade(hc,0.28);
  const gid = "g"+Math.random().toString(36).slice(2,8);
  const grad = `<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hl}"/><stop offset=".45" stop-color="${hc}"/><stop offset="1" stop-color="${hd}"/></linearGradient>`;
  const fill = `fill="url(#${gid})" stroke="${hd}" stroke-width="2.2" stroke-linejoin="round" stroke-opacity=".7"`;
  const twoblock = H.sides==="twoblock" ? `<path d="M120,150 C118,175 120,200 124,214 L132,214 C130,196 130,172 134,150Z M280,150 C282,175 280,200 276,214 L268,214 C270,196 270,172 266,150Z" fill="${hd}" opacity=".55"/>` : "";
  const shine = `<path d="M150,104 Q200,86 250,104" stroke="${hl}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".55"/>`;
  const hatOn = accs.has("beret")||accs.has("beanie");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}"${size?` width="${size}" height="${size*1.2}"`:""}>
  <defs>${grad}</defs>
  ${bg?`<rect width="400" height="480" fill="${bg}"/>`:""}
  ${H.back==="pony" ? `<path d="${ponytail()}" ${fill}/>` : ""}
  <path d="${backHair(H.back, H.wave)}" ${fill}/>
  ${topSVG(top, topColor, skin)}
  ${faceSVG(skin, hc, gender)}
  ${accFront(accs)}
  <path d="${crown(H.sides||"normal", H.bangs==="up")}" ${fill}/>
  ${twoblock}
  <path d="${bangs(H.bangs)}" ${fill}/>
  <path d="${strands(H.bangs)}" stroke="${hd}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>
  <path d="${locks(H.locks, H.wave)}" ${fill}/>
  ${hatOn?"":shine}
  ${H.back==="pony" ? `<circle cx="276" cy="128" r="7" fill="#e06a4f"/>` : ""}
  ${accHat(accs)}
</svg>`;
}
