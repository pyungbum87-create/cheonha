/* ---------- 사진 보정 (내 사진 표시·공유 카드용) ----------
   기기 안에서만 처리. 진단(컬러 월드컵) 화면은 색 판단이 정확해야 해서 원본을 그대로 쓴다.
   level 0 원본 / 1 자연스럽게 / 2 화사하게
   - 피부: 가장자리를 살리는 부드럽게 하기(잡티·모공), 다크서클 밝히기
   - 톤: 전체 살짝 화사하게 + 피부는 조금 더
   - 형태: 눈 살짝 키우기, 턱선 살짝 갸름하게 (얼굴 랜드마크 기준 국소 변형)
   얼굴 랜드마크는 MediaPipe Face Landmarker 478점(픽셀 좌표). */
(function(root){
  const BEAUTY = [null,
    {sm:0.75, lift:0.05, sk:0.07, eye:0.07, jaw:0.024, ue:0.30},
    {sm:0.95, lift:0.09, sk:0.12, eye:0.12, jaw:0.040, ue:0.50}];
  const JAW_R=[132,58,172,136,150,149,176], JAW_L=[361,288,397,365,379,378,400];
  const ss=(a,b,v)=>{ let t=(v-a)/(b-a); t=t<0?0:t>1?1:t; return t*t*(3-2*t); };
  function blur(a,w,h,r){   // 상자 흐림(가로·세로), 제자리
    const tmp=new Float32Array(a.length), d=2*r+1;
    for(let y=0;y<h;y++){ let s=0,row=y*w; for(let x=-r;x<=r;x++) s+=a[row+Math.min(w-1,Math.max(0,x))];
      for(let x=0;x<w;x++){ tmp[row+x]=s/d; s+=a[row+Math.min(w-1,x+r+1)]-a[row+Math.max(0,x-r)]; } }
    for(let x=0;x<w;x++){ let s=0; for(let y=-r;y<=r;y++) s+=tmp[Math.min(h-1,Math.max(0,y))*w+x];
      for(let y=0;y<h;y++){ a[y*w+x]=s/d; s+=tmp[Math.min(h-1,y+r+1)*w+x]-tmp[Math.max(0,y-r)*w+x]; } }
  }
  // img: {data,width,height}, lm: [{x,y}] 픽셀 좌표, skinM: 얼굴 피부 마스크(0~1, 없으면 랜드마크 타원)
  function beautifyData(img, lm, skinM, level){
    const o=BEAUTY[level|0], w=img.width, h=img.height, src=img.data, N=w*h;
    if (!o || !lm || lm.length<468) return new Uint8ClampedArray(src);
    const P=i=>lm[i], D=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
    const Wf=D(P(234),P(454)); if (!(Wf>8)) return new Uint8ClampedArray(src);
    const eyes=[[33,133,159,145],[263,362,386,374]].map(([a,b,t,u])=>({x:(P(a).x+P(b).x)/2, y:(P(t).y+P(u).y)/2, w:D(P(a),P(b))}));
    const mouth={x:(P(61).x+P(291).x)/2, y:(P(13).y+P(14).y)/2, w:D(P(61),P(291))};
    const brows=[105,334].map(i=>P(i)), nose=P(4);
    const fc={x:(P(234).x+P(454).x)/2, y:(P(10).y+P(152).y)/2}, fry=D(P(10),P(152))/2*1.08, frx=Wf/2*1.02;
    // 작업 범위(얼굴 주변)
    const bx0=Math.max(0,Math.floor(fc.x-Wf*0.95)), bx1=Math.min(w,Math.ceil(fc.x+Wf*0.95));
    const by0=Math.max(0,Math.floor(fc.y-fry*1.5)), by1=Math.min(h,Math.ceil(fc.y+fry*1.45));

    // 1) 피부 마스크 (눈·눈썹·입 보호)
    const m=new Float32Array(N);
    for (let y=by0;y<by1;y++) for (let x=bx0;x<bx1;x++){
      const i=y*w+x;
      let v = skinM ? skinM[i] : 1-ss(0.85,1.0,Math.hypot((x-fc.x)/frx,(y-fc.y)/fry));
      if (v<0.02) continue;
      for (const e of eyes){ const d=Math.hypot((x-e.x)/(e.w*0.85),(y-e.y)/(e.w*0.55)); if (d<1.4) v*=ss(0.9,1.4,d); }
      for (const b of brows){ const d=Math.hypot((x-b.x)/(Wf*0.17),(y-b.y)/(Wf*0.06)); if (d<1.4) v*=ss(0.9,1.4,d); }
      { const d=Math.hypot((x-mouth.x)/(mouth.w*0.56),(y-mouth.y)/(mouth.w*0.28)); if (d<1.25) v*=ss(0.92,1.25,d); }
      m[i]=v;
    }
    // 2) 부드럽게 (가장자리 보존: 밝기 차이가 크면 덜 섞음)
    const r=Math.max(2,Math.round(Wf/42)), ch=[0,1,2].map(()=>new Float32Array(N));
    for (let i=0;i<N;i++){ const p=i*4; ch[0][i]=src[p]; ch[1][i]=src[p+1]; ch[2][i]=src[p+2]; }
    for (const c of ch){ blur(c,w,h,r); blur(c,w,h,r); }
    const out=new Float32Array(N*3);
    for (let i=0;i<N;i++){ const p=i*4; out[i*3]=src[p]; out[i*3+1]=src[p+1]; out[i*3+2]=src[p+2]; }
    for (let y=by0;y<by1;y++) for (let x=bx0;x<bx1;x++){
      const i=y*w+x; if (m[i]<0.02) continue;
      const p=i*4, Lo=0.299*src[p]+0.587*src[p+1]+0.114*src[p+2], Lb=0.299*ch[0][i]+0.587*ch[1][i]+0.114*ch[2][i];
      const dl=(Lo-Lb)/(Lo<Lb?95:30),   // 주변보다 어두운 점(잡티)은 더 지우고, 밝은 경계는 살림
            a=m[i]*o.sm*Math.exp(-dl*dl)*0.92;
      // 다크서클: 눈 아래 타원을 살짝 밝게
      let ue=0; for (const e of eyes){ const d=Math.hypot((x-e.x)/(e.w*0.62),(y-(e.y+e.w*0.5))/(e.w*0.30)); if (d<1) ue=Math.max(ue,(1-d*d)); }
      const lift=ue*o.ue*m[i]*14;
      for (let k=0;k<3;k++) out[i*3+k]+= (ch[k][i]-out[i*3+k])*a + lift;
    }
    // 3) 톤: 전체 살짝 + 피부 조금 더 화사하게 (x + t·x(1-x))
    for (let i=0;i<N;i++){
      const t=o.lift+o.sk*m[i];
      for (let k=0;k<3;k++){ let v=out[i*3+k]/255; v=v+t*v*(1-v); out[i*3+k]=v*255; }
    }
    // 4) 형태: 눈 키우기 + 턱선 갸름하게 (역방향 매핑 + 양선형 보간)
    const jaws=[...JAW_R,...JAW_L].map(i=>{ const j=P(i), dx=nose.x-j.x, dy=nose.y-j.y, L=Math.hypot(dx,dy)||1;
      return {x:j.x, y:j.y, vx:dx/L*o.jaw*Wf, vy:dy/L*o.jaw*Wf}; });
    const Rj=Wf*0.2, Re=eyes.map(e=>e.w*1.3);
    const res=new Uint8ClampedArray(src.length);
    const samp=(sx,sy,k)=>{ sx=Math.max(0,Math.min(w-1.001,sx)); sy=Math.max(0,Math.min(h-1.001,sy));
      const x0=sx|0, y0=sy|0, fx=sx-x0, fy=sy-y0, i0=(y0*w+x0)*3, i1=i0+w*3;
      return (out[i0+k]*(1-fx)+out[i0+3+k]*fx)*(1-fy)+(out[i1+k]*(1-fx)+out[i1+3+k]*fx)*fy; };
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){
      const i=y*w+x, p=i*4;
      let sx=x, sy=y;
      if (x>=bx0 && x<bx1 && y>=by0 && y<by1){
        eyes.forEach((e,n)=>{ const d=Math.hypot(x-e.x,y-e.y); if (d<Re[n]){ const q=1-(d/Re[n])**2, k=o.eye*q*q; sx+=(e.x-x)*k; sy+=(e.y-y)*k; } });
        for (const j of jaws){ const d=Math.hypot(x-j.x,y-j.y); if (d<Rj){ const q=1-(d/Rj)**2, f=q*q; sx-=j.vx*f; sy-=j.vy*f; } }
      }
      if (sx===x && sy===y){ res[p]=out[i*3]; res[p+1]=out[i*3+1]; res[p+2]=out[i*3+2]; }
      else { res[p]=samp(sx,sy,0); res[p+1]=samp(sx,sy,1); res[p+2]=samp(sx,sy,2); }
      res[p+3]=src[p+3];
    }
    return res;
  }
  root.BEAUTY=BEAUTY; root.beautifyData=beautifyData;
  if (typeof module!=="undefined") module.exports={beautifyData,BEAUTY};
})(typeof window!=="undefined"?window:globalThis);
