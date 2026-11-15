/* =========================================================
   컬러 스튜디오 – 아바타 (SVG 오리지널 일러스트) v2
   심사위원 그림체(갈색 외곽선, 애니풍 눈, 파스텔)에 맞춘 버전
   ========================================================= */
export const HAIRSTYLES = [
  {k:"longstraight", n:"롱 스트레이트", g:"f", back:"long",     locks:"long",     bangs:"part"},
  {k:"longwave",     n:"롱 웨이브",     g:"f", back:"long",     locks:"long",     bangs:"curtain", wave:1},
  {k:"bob",          n:"턱선 단발",     g:"f", back:"bob",      locks:"bob",      bangs:"part"},
  {k:"seebob",       n:"시스루뱅 단발", g:"f", back:"bob",      locks:"bob",      bangs:"see"},
  {k:"layered",      n:"어깨 레이어드", g:"f", back:"shoulder", locks:"shoulder", bangs:"side",  wave:1},
  {k:"hush",         n:"허쉬컷",        g:"f", back:"shoulder", locks:"shoulder", bangs:"see",   wave:1},
  {k:"curtainlong",  n:"커튼뱅 롱",     g:"f", back:"long",     locks:"long",     bangs:"curtain"},
  {k:"hippie",       n:"히피펌",        g:"f", back:"long",     locks:"long",     bangs:"curtain", wave:2},
  {k:"halfup",       n:"반묶음",        g:"f", back:"long",     locks:"long",     bangs:"part",  bun:"half"},
  {k:"bun",          n:"똥머리",        g:"f", back:"none",     locks:"none",     bangs:"see",   bun:"top"},
  {k:"pony",         n:"포니테일",      g:"f", back:"pony",     locks:"none",     bangs:"see"},
  {k:"pixie",        n:"숏컷",          g:"u", back:"none",     locks:"none",     bangs:"side",  sides:"tight"},
  {k:"wolf",         n:"울프컷",        g:"u", back:"bob",      locks:"bob",      bangs:"dandy", sides:"tight"},
  {k:"dandy",        n:"댄디컷",        g:"m", back:"none",     locks:"none",     bangs:"dandy"},
  {k:"twoblock",     n:"투블럭",        g:"m", back:"none",     locks:"none",     bangs:"dandy", sides:"twoblock"},
  {k:"comma",        n:"쉼표머리",      g:"m", back:"none",     locks:"none",     bangs:"comma", sides:"twoblock"},
  {k:"gareuma",      n:"가르마펌",      g:"m", back:"none",     locks:"none",     bangs:"curtainShort"},
  {k:"leaf",         n:"리프컷",        g:"m", back:"none",     locks:"none",     bangs:"curtain", sides:"twoblock"},
  {k:"up",           n:"애즈펌(올림)",  g:"m", back:"none",     locks:"none",     bangs:"up",    sides:"tight"},
  {k:"crop",         n:"크롭컷",        g:"m", back:"none",     locks:"none",     bangs:"crop",  sides:"twoblock"},
  {k:"buzz",         n:"버즈컷",        g:"m", back:"none",     locks:"none",     bangs:"buzz",  sides:"tight"},
  {k:"longmen",      n:"남자 장발",     g:"m", back:"shoulder", locks:"shoulder", bangs:"curtain"},
];
export const TOPS = [
  {k:"tee",n:"티셔츠"},{k:"stripe",n:"스트라이프 티"},{k:"shirt",n:"셔츠"},{k:"tie",n:"셔츠+타이"},{k:"knit",n:"터틀넥 니트"},
  {k:"cardigan",n:"카디건"},{k:"hoodie",n:"후드티"},{k:"blazer",n:"블레이저"},{k:"coat",n:"트렌치코트"},{k:"velvet",n:"벨벳 수트",hidden:true},
];
export const ACCS = [
  {k:"glasses",n:"동그란 안경",ic:"👓"},{k:"sun",n:"선글라스",ic:"🕶️"},{k:"earring",n:"진주 귀걸이",ic:"🦪"},{k:"necklace",n:"목걸이",ic:"📿"},
  {k:"hairpin",n:"헤어핀",ic:"📎"},{k:"scarf",n:"스카프",ic:"🧣"},{k:"beret",n:"베레모",ic:"🧶"},{k:"beanie",n:"비니",ic:"🧢"},
  {k:"cap",n:"볼캡",ic:"🧢"},{k:"headphones",n:"헤드폰",ic:"🎧"},
  {k:"headband",n:"진주 헤드밴드",ic:"👑",hidden:true},{k:"silkscarf",n:"실크 스카프",ic:"🎀",hidden:true},
];
export const HATS = ["beret","beanie","cap"];

function hx(h){ return [parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; }
function toHex(r,g,b){ return "#"+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,"0")).join(""); }
export function shade(h, f){ const [r,g,b]=hx(h); return f>=0 ? toHex(r+(255-r)*f, g+(255-g)*f, b+(255-b)*f) : toHex(r*(1+f), g*(1+f), b*(1+f)); }
export function lum(h){ const [r,g,b]=hx(h); return (0.299*r+0.587*g+0.114*b)/255; }

function cr(points, step=5){
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

function backHair(type, wave){
  if (type==="none"||type==="pony") return `M114,212 C102,108 156,80 200,80 C244,80 298,108 286,212 C270,228 130,228 114,212Z`;
  const by={bob:304, shoulder:372, long:448}[type], hwB={bob:92, shoulder:106, long:114}[type] + (wave===2?14:0);
  const right = cr([[288,190],[294,240],[200+hwB-(type==="bob"?4:0),by-40],[200+hwB,by]]);
  const R = wave ? wv(right, wave===2?11:7, wave===2?9:13) : right;
  const bottom=[]; for (let x=200+hwB; x>=200-hwB; x-=6){ const u=(x-200)/hwB;
    bottom.push([x, by + (wave? (wave===2?11:7)*Math.abs(Math.sin(x/(wave===2?8:11))) : (type==="bob"? -6*(1-u*u) : 3*Math.abs(Math.sin(x/7))))]); }
  const L = R.map(([x,y])=>[400-x,y]).reverse();
  const top = cr([[112,190],[118,120],[160,82],[200,78],[240,82],[282,120],[288,190]]);
  return poly([...top, ...R, ...bottom, ...L]);
}
function ponytail(){ return poly(cr([[262,118],[300,140],[318,200],[310,280],[296,340],[282,360],[276,330],[288,270],[290,200],[268,150]],4)); }
function bunPath(kind){ return kind==="top"
  ? `M200,30 C228,30 242,50 238,72 C234,92 166,92 162,72 C158,50 172,30 200,30Z`
  : `M200,64 C218,64 228,76 225,90 C222,102 178,102 175,90 C172,76 182,64 200,64Z`; }
function locks(type, wave){
  if (type==="none") return "";
  const by={bob:304, shoulder:370, long:446}[type];
  const mk = s => {
    const inner = type==="bob" ? cr([[200+s*62,132],[200+s*72,190],[200+s*72,250],[200+s*62,296],[200+s*54,by]])
                               : cr([[200+s*62,132],[200+s*72,190],[200+s*72,250],[200+s*70,300],[200+s*66,by]]);
    const outer = type==="bob" ? cr([[200+s*90,150],[200+s*93,220],[200+s*91,280],[200+s*84,by]])
                               : cr([[200+s*90,150],[200+s*95,230],[200+s*100,300],[200+s*(104+(wave===2?12:0)),by]]);
    let I=inner, O=outer;
    if (wave){ const a=wave===2?10:6, p=wave===2?9:13; I=wv(I,a,p,s); O=wv(O,a+1,p,s); }
    const tip=[]; const a=I[I.length-1], b=O[O.length-1];
    for (let k=0;k<=6;k++){ const t=k/6; tip.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t + (k%2?6:0)]); }
    return poly([...I, ...tip, ...O.reverse()]);
  };
  return mk(-1)+mk(1);
}
function crown(sides, tall){
  const t = tall ? 64 : sides==="tight" ? 90 : 84, w = sides==="normal" ? 0 : 5, b = sides==="normal"?200:186;
  return `M${114+w},${b} C${106+w},108 156,${t} 200,${t} C244,${t} ${294-w},108 ${286-w},${b} L${274-w},${b} C272,152 248,132 200,132 C152,132 128,152 ${126+w},${b}Z`;
}
function bangs(type){
  const jag=(x0,x1,y,amp,step)=>{ const p=[]; for(let x=x0;x>=x1;x-=step){ const i=Math.round((x0-x)/step); p.push([x, y + (i%2?amp:0)]); } return p; };
  switch(type){
    case "part": return `M126,196 C122,150 146,124 172,122 C152,138 140,160 134,198Z M168,122 C232,116 276,138 274,196 C262,160 232,140 176,136Z`;
    case "see": { let s=`M126,190 C124,140 160,116 200,116 C240,116 276,140 274,190 C262,150 236,140 200,140 C164,140 138,150 126,190Z`;
      for (let x=142;x<=260;x+=13){ const len=34+((x*7)%9); s+=`M${x-7},134 L${x+6},134 L${x+1},${140+len} Z`; } return s; }
    case "side": { const top=cr([[126,196],[124,146],[160,116],[206,116],[248,122],[276,146],[274,190]]);
      const b=cr([[274,190],[256,170],[230,162],[196,158],[164,170],[140,186],[126,196]]); return poly([...top, ...b]); }
    case "curtain": return `M200,120 C158,120 124,144 122,200 C126,214 132,224 138,230 C138,190 160,150 200,134 C240,150 262,190 262,230 C268,224 274,214 278,200 C276,144 242,120 200,120Z`;
    case "curtainShort": return `M200,118 C158,118 124,142 122,196 C128,198 134,196 140,190 C150,160 172,140 198,132 L202,132 C228,140 250,160 260,190 C266,196 272,198 278,196 C276,142 242,118 200,118Z`;
    case "dandy": { const top=cr([[126,188],[124,142],[160,114],[200,112],[242,114],[276,142],[274,188]]);
      const b=[]; for(let x=274;x>=126;x-=7){ const i=Math.round((274-x)/7); b.push([x, 168+8*Math.sin((x-120)/48)+(i%2?5:0)]); } return poly([...top, ...b]); }
    case "comma": { const top=cr([[126,190],[124,144],[160,114],[204,112],[246,116],[276,144],[274,186]]);
      const b=cr([[274,186],[264,196],[252,198],[246,186],[250,174],[236,166],[200,164],[166,170],[142,182],[126,190]]); return poly([...top, ...b]); }
    case "up": return `M128,186 C126,140 150,118 172,112 C160,88 186,62 220,64 C258,68 280,98 272,140 C276,158 276,172 274,186 C266,150 246,132 214,128 C190,124 160,132 140,160 C134,168 130,176 128,186Z`;
    case "crop": { const top=cr([[126,186],[126,140],[160,114],[200,110],[240,114],[274,140],[274,186]]); return poly([...top, ...jag(274,126,150,4,6)]); }
    case "buzz": return `M128,186 C126,142 160,118 200,118 C240,118 274,142 272,186 L266,186 C264,152 244,136 200,136 C156,136 136,152 134,186Z`;
  }
  return "";
}
function strands(type){
  const L = {
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

const BODY = "M38,480 C46,404 104,358 172,340 L228,340 C296,358 354,404 362,480Z";
function topSVG(type, col, id){
  const dark = shade(col,-0.2), line = shade(col,-0.42), light=shade(col,0.18);
  const inner = lum(col)>0.6 ? "#3a3a42" : "#f6f3ee";
  const st = `stroke="${line}" stroke-width="2.4" stroke-linejoin="round"`;
  const body = `<path d="${BODY}" fill="${col}" ${st}/>
    <path d="M44,480 C52,410 104,366 168,346 C130,372 104,420 98,480Z" fill="${dark}" opacity=".3"/>
    <path d="M300,400 C320,420 334,450 340,480" stroke="${light}" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round"/>`;
  const neckline = `<path d="M170,340 C182,366 218,366 230,340" fill="none" stroke="${line}" stroke-width="4" stroke-linecap="round"/>`;
  switch(type){
    case "tee": return body+neckline;
    case "stripe": { const sc = lum(col)>0.7 ? "#2b3a67" : "#f7f5f0";
      let s=`<clipPath id="${id}st"><path d="${BODY}"/></clipPath>`+body+`<g clip-path="url(#${id}st)">`;
      for (let y=372;y<480;y+=22) s+=`<rect x="30" y="${y}" width="340" height="9" fill="${sc}" opacity=".9"/>`;
      return s+`</g>`+neckline; }
    case "velvet":
      return `<linearGradient id="${id}v" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${shade(col,0.25)}"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="${shade(col,-0.35)}"/></linearGradient>
        <path d="${BODY}" fill="url(#${id}v)" ${st}/><path d="M172,340 L200,424 L228,340Z" fill="#f6f3ee"/>
        <path d="M172,340 L200,424 L184,434 L148,362Z" fill="${shade(col,-0.3)}" ${st}/><path d="M228,340 L200,424 L216,434 L252,362Z" fill="${shade(col,-0.3)}" ${st}/>
        <circle cx="160" cy="400" r="9" fill="#f3e3a6" stroke="#b9953c" stroke-width="2"/><circle cx="160" cy="400" r="3.5" fill="#fff"/>
        <path d="M110,430 Q150,400 172,436" stroke="#fff" stroke-width="6" fill="none" opacity=".25"/>`;
    case "shirt": case "tie": {
      let s = body+`<path d="M200,372 L200,480" stroke="${line}" stroke-width="2.5"/>`+
        [400,430,460].map(y=>`<circle cx="207" cy="${y}" r="3" fill="${line}"/>`).join("")+
        `<path d="M170,334 L200,372 L184,392 L156,350Z" fill="${shade(col,0.12)}" ${st}/><path d="M230,334 L200,372 L216,392 L244,350Z" fill="${shade(col,0.12)}" ${st}/>`;
      if (type==="tie"){ const tc = lum(col)>0.55 ? "#26355c" : "#8e2a35";
        s += `<path d="M192,368 L208,368 L205,384 L195,384Z" fill="${shade(tc,-0.2)}"/><path d="M195,384 L205,384 L213,466 L200,480 L187,466Z" fill="${tc}" stroke="${shade(tc,-0.4)}" stroke-width="2"/>`; }
      return s; }
    case "knit": {
      let s = `<path d="M174,296 L226,296 L230,346 C214,354 186,354 170,346Z" fill="${col}" ${st}/>`+body+
        `<path d="M168,338 C180,352 220,352 232,338 L230,350 C214,360 186,360 170,350Z" fill="${dark}"/>`;
      for (let x=180;x<=222;x+=7) s+=`<path d="M${x},300 L${x},344" stroke="${dark}" stroke-width="2" opacity=".55"/>`;
      return s; }
    case "cardigan":
      return body+`<path d="M176,340 L200,440 L224,340 C214,360 186,360 176,340Z" fill="${inner}"/>
        <path d="M176,340 L200,440 M224,340 L200,440" stroke="${line}" stroke-width="3"/>
        ${[400,425,450,474].map(y=>`<circle cx="203" cy="${y}" r="4" fill="${shade(col,0.4)}" stroke="${line}" stroke-width="1.5"/>`).join("")}`;
    case "hoodie":
      return `<path d="M136,352 C140,312 260,312 264,352 C246,372 154,372 136,352Z" fill="${dark}" ${st}/>`+body+
        `<path d="M168,342 C182,372 218,372 232,342" fill="${shade(col,-0.1)}" stroke="${line}" stroke-width="3"/>
         <path d="M188,364 L184,420 M212,364 L216,420" stroke="#f2f0ec" stroke-width="4" stroke-linecap="round"/>
         <path d="M110,440 L290,440 L280,480 L120,480Z" fill="${dark}" opacity=".25"/>`;
    case "blazer":
      return body+`<path d="M172,340 L200,424 L228,340Z" fill="${inner}"/>
        <path d="M172,340 L200,424 L184,434 L148,362Z" fill="${dark}" ${st}/><path d="M228,340 L200,424 L216,434 L252,362Z" fill="${dark}" ${st}/>
        <circle cx="200" cy="452" r="4" fill="${line}"/>`;
    case "coat":
      return body+`<path d="M174,340 L200,410 L226,340Z" fill="${inner}"/>
        <path d="M174,340 L200,410 L178,440 L136,360Z" fill="${light}" ${st}/><path d="M226,340 L200,410 L222,440 L264,360Z" fill="${light}" ${st}/>
        <rect x="60" y="452" width="280" height="14" fill="${dark}" ${st}/><rect x="190" y="448" width="22" height="22" rx="3" fill="none" stroke="${line}" stroke-width="3"/>
        ${[388,418].map(y=>`<circle cx="226" cy="${y}" r="4" fill="${line}"/><circle cx="246" cy="${y}" r="4" fill="${line}"/>`).join("")}`;
  }
  return body;
}

function eye(cx, cy, id, irisId, g){
  const w=`M${cx-17},${cy} C${cx-12},${cy-12} ${cx+12},${cy-12} ${cx+17},${cy-1} C${cx+12},${cy+9} ${cx-12},${cy+9} ${cx-17},${cy}Z`;
  const L=cx<200;
  return `<clipPath id="${id}"><path d="${w}"/></clipPath><path d="${w}" fill="#fff"/>
  <g clip-path="url(#${id})"><ellipse cx="${cx}" cy="${cy+1}" rx="10" ry="12" fill="url(#${irisId})"/><ellipse cx="${cx}" cy="${cy+2}" rx="4.2" ry="5.5" fill="#2a1a12"/></g>
  <circle cx="${cx+3.5}" cy="${cy-4}" r="3.4" fill="#fff"/><circle cx="${cx-3.5}" cy="${cy+5}" r="1.6" fill="#fff" opacity=".85"/>
  <path d="M${cx-18},${cy+1} C${cx-12},${cy-13} ${cx+12},${cy-14} ${cx+19},${cy-3}" stroke="#3b2a22" stroke-width="${g==="f"?4.4:3.6}" fill="none" stroke-linecap="round"/>
  ${g==="f"?`<path d="M${L?cx-17:cx+18},${cy-1} l${L?-6:6},-5" stroke="#3b2a22" stroke-width="3" stroke-linecap="round"/>`:""}
  <path d="M${cx-11},${cy+8} Q${cx},${cy+12} ${cx+11},${cy+7}" stroke="#7a5444" stroke-width="1.4" fill="none" opacity=".6"/>`;
}
function faceSVG(skin, hairC, gender, id){
  const OL="#7a5242", sk2 = shade(skin,-0.12), brow = shade(hairC,-0.1), m=gender==="m";
  return `<radialGradient id="${id}i" cx=".5" cy=".35" r=".7"><stop offset="0" stop-color="#a8774f"/><stop offset=".6" stop-color="#6e4630"/><stop offset="1" stop-color="#3b2418"/></radialGradient>
  <path d="M178,276 L178,346 C190,356 210,356 222,346 L222,276Z" fill="${sk2}" stroke="${OL}" stroke-width="2"/>
  <path d="M178,290 Q200,306 222,290 L222,302 Q200,316 178,302Z" fill="${shade(skin,-0.22)}" opacity=".5"/>
  <ellipse cx="125" cy="210" rx="11" ry="17" fill="${skin}" stroke="${OL}" stroke-width="2"/><ellipse cx="275" cy="210" rx="11" ry="17" fill="${skin}" stroke="${OL}" stroke-width="2"/>
  <path d="M125,190 C125,120 275,120 275,190 C275,252 246,302 200,306 C154,302 125,252 125,190Z" fill="${skin}" stroke="${OL}" stroke-width="2.4"/>
  <path d="M154,${m?184:186} Q168,${m?178:180} 184,186" stroke="${brow}" stroke-width="${m?5:3.6}" fill="none" stroke-linecap="round"/>
  <path d="M216,186 Q232,${m?178:180} 246,${m?184:186}" stroke="${brow}" stroke-width="${m?5:3.6}" fill="none" stroke-linecap="round"/>
  ${eye(168,212,id+"e1",id+"i",gender)}${eye(232,212,id+"e2",id+"i",gender)}
  <path d="M201,236 q3,6 -3,8" stroke="${shade(skin,-0.3)}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse cx="150" cy="246" rx="15" ry="8" fill="#f28c8c" opacity=".25"/><ellipse cx="250" cy="246" rx="15" ry="8" fill="#f28c8c" opacity=".25"/>
  <path d="M142,248 l5,-6 M150,248 l5,-6 M242,248 l5,-6 M250,248 l5,-6" stroke="#e7807e" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>
  ${gender==="f"?`<path d="M189,264 Q200,272 211,264 Q200,276 189,264Z" fill="#e88c8c"/>`:""}
  <path d="M187,263 Q200,271 213,263" stroke="#b5615f" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
}

function accNeck(accs){
  let s="";
  if (accs.has("necklace")) s+=`<path d="M180,318 Q200,346 220,318" stroke="#d6b45a" stroke-width="2.6" fill="none"/><path d="M200,334 l6,8 l-6,8 l-6,-8Z" fill="#f3e3a6" stroke="#b9953c" stroke-width="1.5"/>`;
  if (accs.has("scarf")||accs.has("silkscarf")){
    const silk=accs.has("silkscarf"), c1=silk?"#f3d9e6":"#c0473f", c2=silk?"#cfe3f5":"#9c3530";
    s+=`<path d="M172,300 Q200,324 228,300 L232,326 Q200,350 168,326Z" fill="${c1}" stroke="${shade(c1,-0.4)}" stroke-width="2"/>
      <path d="M206,330 L226,392 L208,398 L196,336Z" fill="${c2}" stroke="${shade(c2,-0.4)}" stroke-width="2"/>
      ${silk?`<path d="M176,312 Q200,332 226,312" stroke="#f6e7a6" stroke-width="3" fill="none"/><path d="M210,350 L218,380" stroke="#f6e7a6" stroke-width="3"/>`:`<path d="M180,318 Q200,336 222,318" stroke="#e8d9c4" stroke-width="2" fill="none" stroke-dasharray="4 4"/>`}`;
  }
  return s;
}
function accFace(accs){
  let s="";
  if (accs.has("earring")) s+=`<circle cx="123" cy="234" r="6" fill="#f6f1e7" stroke="#cfc4ae" stroke-width="1.5"/><circle cx="277" cy="234" r="6" fill="#f6f1e7" stroke="#cfc4ae" stroke-width="1.5"/>`;
  if (accs.has("glasses")) s+=`<g fill="rgba(220,235,255,.16)" stroke="#9a7a3a" stroke-width="3.2"><circle cx="168" cy="212" r="22"/><circle cx="232" cy="212" r="22"/></g>
    <path d="M190,208 Q200,201 210,208 M146,208 L126,202 M254,208 L274,202" stroke="#9a7a3a" stroke-width="3.2" fill="none"/>`;
  if (accs.has("sun")) s+=`<g stroke="#1b1b1f" stroke-width="3.5"><rect x="142" y="198" width="52" height="34" rx="14" fill="#25222a"/><rect x="206" y="198" width="52" height="34" rx="14" fill="#25222a"/></g>
    <path d="M194,210 Q200,205 206,210 M142,206 L126,200 M258,206 L274,200" stroke="#1b1b1f" stroke-width="3.5" fill="none"/>
    <path d="M152,206 l12,-4 M216,206 l12,-4" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`;
  return s;
}
function accHair(accs){
  let s="";
  if (accs.has("hairpin")) s+=`<g transform="rotate(-25 150 140)"><rect x="132" y="134" width="36" height="7" rx="3.5" fill="#f2b8c6" stroke="#b5677c" stroke-width="1.5"/><rect x="138" y="146" width="30" height="6" rx="3" fill="#f6e3a3" stroke="#b9953c" stroke-width="1.5"/></g>`;
  if (accs.has("headband")){ s+=`<path d="M122,150 C130,100 270,100 278,150" stroke="#f3eee4" stroke-width="12" fill="none" stroke-linecap="round"/>`;
    for (let i=0;i<=10;i++){ const t=i/10, x=122+156*t, y=150-50*Math.sin(Math.PI*t); s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="#fbf8f2" stroke="#d4cbb8" stroke-width="1.5"/><circle cx="${(x-2).toFixed(1)}" cy="${(y-2).toFixed(1)}" r="2" fill="#fff"/>`; } }
  if (accs.has("headphones")) s+=`<path d="M118,206 C108,90 292,90 282,206" stroke="#2b2d36" stroke-width="12" fill="none" stroke-linecap="round"/>
    <rect x="104" y="188" width="28" height="48" rx="12" fill="#3a3d48" stroke="#1d1f26" stroke-width="2"/><rect x="268" y="188" width="28" height="48" rx="12" fill="#3a3d48" stroke="#1d1f26" stroke-width="2"/>`;
  if (accs.has("beret")) s+=`<g transform="rotate(-9 200 96)"><ellipse cx="196" cy="96" rx="98" ry="38" fill="#8e2430" stroke="#5d1520" stroke-width="2.5"/><ellipse cx="196" cy="88" rx="80" ry="22" fill="#a8323f" opacity=".6"/>
    <path d="M118,116 Q196,134 276,116" stroke="#5d1520" stroke-width="7" fill="none" stroke-linecap="round"/><ellipse cx="190" cy="58" rx="6" ry="9" fill="#6d1a25"/></g>`;
  if (accs.has("beanie")) s+=`<path d="M112,150 C108,70 160,48 200,48 C240,48 292,70 288,150Z" fill="#3a4a6b" stroke="#22304a" stroke-width="2.5"/>
    <path d="M108,150 L292,150 L292,128 L108,128Z" fill="#2c3a57" stroke="#22304a" stroke-width="2"/>${[120,140,160,180,200,220,240,260,280].map(x=>`<path d="M${x},130 L${x},148" stroke="#22304a" stroke-width="3"/>`).join("")}
    <circle cx="200" cy="44" r="16" fill="#e8e3da" stroke="#bdb5a6" stroke-width="2"/>`;
  if (accs.has("cap")) s+=`<path d="M112,150 C110,72 160,54 200,54 C240,54 290,72 288,150Z" fill="#e9e3d6" stroke="#8d8370" stroke-width="2.5"/>
    <path d="M200,54 L200,150" stroke="#c9c0ad" stroke-width="2"/><circle cx="200" cy="56" r="6" fill="#c9c0ad"/>
    <path d="M108,148 Q200,132 292,148 Q296,170 200,176 Q104,170 108,148Z" fill="#d9d1c0" stroke="#8d8370" stroke-width="2.5"/>`;
  return s;
}

let seq=0;
export function avatarSVG({skin="#f2cfb3", hair="dandy", hairColor="#3e2a20", top="tee", topColor="#f4f2ee", accs=new Set(), gender="n", bg=null, size=null, view="0 0 400 480"}){
  const H = HAIRSTYLES.find(h=>h.k===hair) || HAIRSTYLES[0];
  const hc = hairColor, hd = shade(hc,-0.32), hl = shade(hc,0.3);
  const id = "a"+(++seq).toString(36);
  const grad = `<linearGradient id="${id}h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hl}"/><stop offset=".45" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc,-0.22)}"/></linearGradient>`;
  const fill = `fill="url(#${id}h)" stroke="${hd}" stroke-width="2.4" stroke-linejoin="round"`;
  const twoblock = H.sides==="twoblock" ? `<path d="M120,150 C118,175 120,200 124,214 L132,214 C130,196 130,172 134,150Z M280,150 C282,175 280,200 276,214 L268,214 C270,196 270,172 266,150Z" fill="${hd}" opacity=".55"/>` : "";
  const hatOn = HATS.some(k=>accs.has(k));
  const shine = hatOn ? "" : `<path d="M146,112 Q200,94 254,112" stroke="${hl}" stroke-width="9" fill="none" stroke-linecap="round" opacity=".55"/>
    <path d="M160,108 l6,10 M184,101 l4,11 M214,101 l-3,11 M240,107 l-5,10" stroke="${hl}" stroke-width="3" opacity=".6" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${view}"${size?` width="${size}" height="${size*1.2}"`:""}>
  <defs>${grad}</defs>
  ${bg?`<rect width="400" height="480" fill="${bg}"/>`:""}
  ${H.back==="pony" ? `<path d="${ponytail()}" ${fill}/>` : ""}
  ${H.bun ? `<path d="${bunPath(H.bun)}" ${fill}/>` : ""}
  <path d="${backHair(H.back, H.wave)}" ${fill}/>
  ${topSVG(top, topColor, id)}
  ${faceSVG(skin, hc, gender, id)}
  ${accNeck(accs)}${accFace(accs)}
  <path d="${crown(H.sides||"normal", H.bangs==="up")}" ${fill}/>
  ${twoblock}
  <path d="${bangs(H.bangs)}" ${fill}/>
  <path d="${strands(H.bangs)}" stroke="${hd}" stroke-width="2.2" fill="none" stroke-linecap="round" opacity=".55"/>
  <path d="${locks(H.locks, H.wave)}" ${fill}/>
  ${shine}
  ${H.back==="pony" ? `<circle cx="276" cy="128" r="7" fill="#e06a4f"/>` : ""}
  ${accHair(accs)}
</svg>`;
}
