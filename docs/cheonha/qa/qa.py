"""천하등용 출시 전 점검 (Chrome + WebKit)
사용: 저장소 상위 폴더를 http://localhost:8765/ 로 띄운 뒤  python3 qa.py  [결과 폴더]
필요: playwright(chromium), selenium + WebKitWebDriver(apt webkit2gtk-driver) + Xvfb
점검: 한·중 타이틀/전투 오류, 세로 화면 안에 맞음, 아이폰 홈 화면 앱(여백 늦게 생김), 배경이 비었을 때,
      중국 시간대 언어 이동, 오프라인 실행, 안전 모드, 3분 플레이 메모리 증가, WebKit 엔진 전투
"""
import asyncio,os,sys,json,time,subprocess
from playwright.async_api import async_playwright
B='http://localhost:8765/cheonha/';OUT=sys.argv[1] if len(sys.argv)>1 else 'qa_out';os.makedirs(OUT,exist_ok=True)
FIT="(()=>{const a=document.getElementById('app').getBoundingClientRect(),c=document.getElementById('cv').getBoundingClientRect();return c.top>=a.top-1&&c.bottom<=a.bottom+1&&c.width<=a.width+1})()"
R=[]
def rec(name,ok,info=''):R.append((name,ok,info));print(('PASS ' if ok else 'FAIL ')+name,info,flush=True)
async def chrome():
  async with async_playwright() as p:
    b=await p.chromium.launch()
    for page in ['index.html','zh.html']:
      ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,service_workers='block');pg=await ctx.new_page();errs=[]
      pg.on('pageerror',lambda e:errs.append(str(e)))
      await pg.goto(B+page);await pg.wait_for_timeout(2500);await pg.screenshot(path=f'{OUT}/title_{page}.png')
      await pg.click('#mEnd');await pg.wait_for_timeout(1500)
      await pg.evaluate("G.gold=400;for(let i=0;i<8;i++)recruit()");await pg.wait_for_timeout(2500)
      await pg.screenshot(path=f'{OUT}/battle_{page}.png')
      rec(f'{page} 오류 없음',not errs,'; '.join(errs[:2]));rec(f'{page} 화면 안에 맞음',await pg.evaluate(FIT))
      await ctx.close()
    # 아이폰 홈 화면 앱: 처음엔 여백 없음 → 나중에 여백 생김(resize 이벤트 없음)
    ctx=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=3,service_workers='block')
    await ctx.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const s=document.createElement('style');s.id='ni';s.textContent='#app{top:0!important;bottom:0!important}';document.head.append(s)})")
    pg=await ctx.new_page();await pg.goto(B+'index.html');await pg.wait_for_timeout(3000)
    await pg.evaluate("document.getElementById('ni').remove();const a=document.getElementById('app');a.style.top='47px';a.style.bottom='34px'");await pg.wait_for_timeout(800)
    await pg.click('#mEnd');await pg.wait_for_timeout(1200);rec('홈 화면 앱 여백이 늦게 생겨도 맞음',await pg.evaluate(FIT));await ctx.close()
    # 배경 그림이 비었을 때 화면이 겹쳐 쌓이지 않음
    ctx=await b.new_context(viewport={'width':390,'height':844},service_workers='block');pg=await ctx.new_page();await pg.goto(B+'index.html');await pg.wait_for_timeout(2000)
    await pg.click('#mEnd');await pg.wait_for_timeout(800)
    await pg.evaluate("const ob=buildBG;buildBG=function(){const c=ob();const g=c.getContext('2d');g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,c.width,c.height);c.bad=1;return c};bgCache=null")
    await pg.wait_for_timeout(1000)
    px=await pg.evaluate("(()=>{const c=document.getElementById('cv'),d=c.getContext('2d').getImageData(c.width>>1,c.height>>1,1,1).data;return d[3]})()")
    rec('배경이 비어도 전장이 그려짐',px==255);await ctx.close()
    # 중국 시간대: 저장된 언어 없으면 중국어판으로 한 번만 이동
    ctx=await b.new_context(locale='ko-KR',timezone_id='Asia/Shanghai');pg=await ctx.new_page();navs=[]
    pg.on('framenavigated',lambda f:navs.append(f.url) if f==pg.main_frame else None)
    await pg.goto(B+'index.html');await pg.wait_for_timeout(3000);rec('중국 시간대 언어 이동 반복 없음',len(navs)<=2,str(len(navs)));await ctx.close()
    # 오프라인
    ctx=await b.new_context(viewport={'width':390,'height':844});pg=await ctx.new_page();await pg.goto(B+'index.html');await pg.wait_for_timeout(4000)
    await pg.reload();await pg.wait_for_timeout(2000);await ctx.set_offline(True);await pg.reload();await pg.wait_for_timeout(2500)
    ok=await pg.evaluate("typeof newGame==='function'");rec('오프라인 실행',ok);await ctx.close()
    # 안전 모드: 두 번 갑자기 꺼진 기록 → 안전 모드
    ctx=await b.new_context(viewport={'width':390,'height':844},service_workers='block');pg=await ctx.new_page()
    await ctx.add_init_script("if(!sessionStorage.getItem('qa')){sessionStorage.setItem('qa',1);localStorage.setItem('cheonha-diag',JSON.stringify({crash:1,log:[],run:{t:Date.now(),stage:'battle end',ok:0}}))}")
    await pg.goto(B+'index.html');await pg.wait_for_timeout(2500)
    rec('갑자기 꺼짐 2번 → 안전 모드',await pg.evaluate("window.CH_SAFE===true&&K===1"),await pg.evaluate("CH_DIAG.text().split('\\n').slice(-1)[0]"))
    await pg.screenshot(path=f'{OUT}/safe_title.png');await ctx.close()
    # 3분 플레이 메모리(캔버스 캐시) 증가
    ctx=await b.new_context(viewport={'width':390,'height':844},service_workers='block');pg=await ctx.new_page();await pg.goto(B+'index.html');await pg.wait_for_timeout(2000)
    await pg.evaluate("SAVE.tut31=1;SAVE.fl31=1;SAVE.intro={end:1,scn:1};newGame('end');G.speed=3;__v32.S.auto=true")
    for i in range(18):
      await pg.evaluate("G.gold+=400;while(G.gold>=30&&freeSlot()>=0)recruit();for(let i=0;i<24;i++){if(G.slots[i]&&mergeOptions(i))doMerge(i);if(G.choice){placeUnit(G.choice.opts[0],G.choice.slot);G.choice=null;}}G.walls=99")
      await pg.wait_for_timeout(10000)
    mb=await pg.evaluate("(()=>{let p=0;for(const k in MSC)p+=MSC[k].width*MSC[k].height;for(const k in TOKC)p+=TOKC[k].width*TOKC[k].height;return Math.round(p*4/1e6)})()")
    rec('3분 플레이 캔버스 캐시 20MB 이하',mb<=20,f'{mb}MB, {await pg.evaluate("G.round")}라운드');await ctx.close()
    await b.close()
def webkit():
  try:
    from selenium import webdriver
    from selenium.webdriver.webkitgtk.options import Options
    from selenium.webdriver.webkitgtk.service import Service
    import glob
    if not subprocess.run(['pgrep','Xvfb'],capture_output=True).stdout:subprocess.Popen(['Xvfb',':99','-screen','0','1280x1024x24'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);time.sleep(1)
    os.environ['DISPLAY']=':99';o=Options();o.binary_location=glob.glob('/usr/lib/*/webkit*/MiniBrowser')[0];o.add_argument('--automation')
    d=webdriver.WebKitGTK(options=o,service=Service('/usr/bin/WebKitWebDriver'));d.set_window_size(390,844)
    for page in ['index.html','zh.html']:
      d.get(B+page);time.sleep(4);d.execute_script("window.__e=[];addEventListener('error',e=>__e.push(e.message))")
      d.execute_script("document.getElementById('mEnd').click()");time.sleep(3)
      d.execute_script("G.gold=400;for(let i=0;i<8;i++)recruit()");time.sleep(5);d.save_screenshot(f'{OUT}/webkit_{page}.png')
      e=d.execute_script("return __e.concat((CH_DIAG.data().log||[]).filter(r=>/오류/.test(r.m)).map(r=>r.m))")
      rec(f'WebKit {page} 전투 오류 없음',not e and d.execute_script("return G&&G.slots.filter(Boolean).length>0"),'; '.join(e[:2]))
    d.quit()
  except Exception as ex:rec('WebKit 점검 실행',False,str(ex)[:200])
asyncio.run(chrome());webkit()
bad=[r for r in R if not r[1]];print(f'\n결과: {len(R)-len(bad)}/{len(R)} 통과');json.dump(R,open(f'{OUT}/result.json','w'),ensure_ascii=False)
sys.exit(1 if bad else 0)
