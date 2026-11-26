// 화면 자동 점검: 여러 화면 크기로 모든 화면을 돌며 잘림·넘침·작은 터치 영역·가려진 버튼·깨진 그림·오류를 찾는다.
// usage: node tools/ui_audit.js [index.html 경로] [--shots]
const path = require('path'), fs = require('fs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const FILE = path.resolve(process.argv.slice(2).find(a => !a.startsWith('--')) || path.join(__dirname, '..', 'index.html')), SHOTS = process.argv.includes('--shots');
const VPS = [['폰', 390, 844], ['작은폰', 360, 640], ['가로', 844, 390]];
const MIN_TAP = 40;   // 애플 44pt, 구글 48dp 권장. 40 미만은 실패, 44 미만은 주의
async function check(p){
  return p.evaluate((MIN_TAP) => {
    const vw = innerWidth, vh = innerHeight, out = { over: [], clip: [], tap: [], cover: [], img: [], docOver: 0 };
    const de = document.scrollingElement; if (de.scrollWidth > vw + 1) out.docOver = de.scrollWidth - vw;
    const vis = e => { const s = getComputedStyle(e); if (s.display==='none' || s.visibility==='hidden' || +s.opacity===0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    const inHScroll = e => { for (let a = e.parentElement; a; a = a.parentElement){ const s = getComputedStyle(a); if ((s.overflowX==='auto' || s.overflowX==='scroll') && a.scrollWidth > a.clientWidth) return true; if (a.classList && (a.classList.contains('mapscroll') || a.classList.contains('map'))) return true; } return false; };
    const name = e => (e.id ? '#'+e.id : e.tagName.toLowerCase() + (e.className && typeof e.className==='string' ? '.'+e.className.trim().split(/\s+/).slice(0,2).join('.') : '')) + ' "' + (e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,18) + '"';
    // 맨 위에 떠 있는 층(시트·대화·모달)만 본다
    const layers = [...document.querySelectorAll('.talk, .sheet-bg, .modal, .cpanel')].filter(vis);
    const root = layers.length ? layers[layers.length-1] : document.body;
    for (const e of root.querySelectorAll('*')){
      if (!vis(e) || e.closest('svg') || e.classList.contains('tk-blur')) continue;
      const r = e.getBoundingClientRect();
      if ((r.right > vw + 1 || r.left < -1) && !inHScroll(e) && !e.closest('.tbgrid')) out.over.push(name(e) + ` (${Math.round(r.left)}~${Math.round(r.right)})`);
      const s = getComputedStyle(e);
      if (e.children.length===0 && (e.innerText||'').trim() && e.scrollWidth > e.clientWidth + 2 && (s.overflow==='hidden' || s.overflowX==='hidden') && s.textOverflow!=='ellipsis') out.clip.push(name(e));
      if (e.matches('button, a[href], input, select, [data-act], [data-sheet], [data-person], [data-tkc]') && !e.disabled){
        if ((r.height < MIN_TAP || r.width < MIN_TAP) && !e.closest('.tbgrid') && !e.closest('.map')) out.tap.push(name(e) + ` ${Math.round(r.width)}×${Math.round(r.height)}`);
        const cx = Math.min(vw-1, Math.max(0, r.left + r.width/2)), cy = Math.min(vh-1, Math.max(0, r.top + r.height/2));
        if (r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw){ const t = document.elementFromPoint(cx, cy); if (t && t!==e && !e.contains(t) && !t.contains(e) && !t.closest('.cu-foot')) out.cover.push(name(e) + ' ← ' + name(t)); }
      }
      if (e.tagName==='IMG' && e.complete && e.naturalWidth===0) out.img.push(e.getAttribute('src'));
    }
    return out;
  }, MIN_TAP);
}
const clean = p => p.evaluate(() => document.querySelectorAll('.sheet-bg.tip, .tipsheet, #tut').forEach(x => x.remove()));
async function newGame(p, year, tab, id){
  await p.goto('file://' + FILE + '?dbg=1'); await p.waitForTimeout(700);
  await p.getByText(year + '년', { exact: true }).click(); await p.locator(`[data-ttab="${tab}"]`).click().catch(() => {});
  await p.locator(`[data-pick="${id}"]`).click(); await p.locator('#go').click(); await p.waitForTimeout(500);
  await p.evaluate(() => { document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); });
}
const prep = js => async p => { await p.evaluate(js); await p.waitForTimeout(250); };
const SCENES = [
  ['타이틀', async p => { await p.goto('file://' + FILE + '?dbg=1'); await p.waitForTimeout(700); }],
  ['타이틀·회귀자', async p => { await p.locator('[data-ttab="reg"]').click().catch(() => {}); await p.waitForTimeout(200); }],
  ['타이틀·군주 선택창', async p => { await p.getByText('200년', { exact: true }).click(); await p.locator('[data-ttab="ruler"]').click().catch(() => {}); await p.locator('[data-pick="cao"]').click(); await p.waitForTimeout(250); }],
  ['내 장수 만들기', async p => { await p.goto('file://' + FILE + '?dbg=1'); await p.waitForTimeout(600); await p.locator('#btnCu').click(); await p.waitForTimeout(200); await p.locator('#cuNew').click(); await p.waitForTimeout(250); }],
  ['지도(군주)', async p => { await newGame(p, 200, 'ruler', 'cao'); await p.evaluate(() => { D.G.talks = []; D.render(); }); }],
  ['평정(군주)', prep(() => { D.G.talks = []; D.queueCouncil(true); const T = D.G.talks[0]; if (T) T.i = T.lines.length - 1; D.render(); })],
  ['역사 대화', prep(() => { D.G.talks = []; D.talkQ({ title:'208년 11월 · 적벽', bg:'s_b208_chibi', lines:[['zhouyu','지금이다! 불을 놓아라! 강 위의 배들이 한꺼번에 타오른다.'],['cao','어째서 바람이…']] }); D.render(); })],
  ['도시(내 성)', prep(() => { D.G.talks = []; D.G.view = 'map'; D.G.sel = D.G.city; D.G.panel = true; D.render(); })],
  ['도시(적 성)', prep(() => { const c = Object.values(D.G.cities).find(c => c.owner && c.owner!==D.G.pfac && D.city(D.G.city).adj.includes(c.id)) || Object.values(D.G.cities).find(c => c.owner && c.owner!==D.G.pfac); D.G.sel = c.id; D.G.panel = true; D.render(); })],
  ['군단', prep(() => { D.G.sel = null; D.G.panel = false; D.G.view = 'army'; D.render(); })],
  ['인물', prep(() => { D.G.view = 'people'; D.render(); })],
  ['인물 상세', prep(() => { document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); document.querySelector('.rcard').click(); })],
  ['가문', prep(() => { document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); D.G.view = 'family'; D.render(); })],
  ['출진 계획', prep(() => { D.G.view = 'map'; D.render(); const c = Object.values(D.G.cities).find(c => c.owner && c.owner!==D.G.pfac && D.city(D.G.city).adj.includes(c.id)); D.openSheet('war', c && c.id); })],
  ['계략', prep(() => { document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); const c = Object.values(D.G.cities).find(c => c.owner && c.owner!==D.G.pfac); D.openSheet('plot', c.id); })],
  ['내정 방침', prep(() => { document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); D.openSheet('policy'); })],
  ['메뉴', async p => { await p.evaluate(() => document.querySelectorAll('.sheet-bg').forEach(x => x.remove())); await p.locator('#menuBtn').click(); await p.waitForTimeout(250); }],
  ['설정', async p => { await p.evaluate(() => document.querySelectorAll('.sheet-bg').forEach(x => x.remove())); await p.locator('#menuBtn').click(); await p.waitForTimeout(200); await p.locator('#mSet').click(); await p.waitForTimeout(250); }],
  ['전선', async p => { await p.evaluate(() => { document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); D.G.view = 'map'; D.render(); }); const f = p.locator('[data-front]').first(); if (await f.count()) { await f.click(); await p.waitForTimeout(250); } }],
  ['전투 포진', prep(() => { document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); const t = Object.values(D.G.cities).find(c => c.owner && c.owner!==D.G.pfac && D.city(D.G.city).adj.includes(c.id)); D.G.troops = 9000; D.beginRaise(t.id); D.G.talks = []; D.render(); })],
  ['전장 지휘', prep(() => { D.tbStart(); D.G.talks = []; D.render(); })],
  ['일기토', prep(() => { const B = D.G.battle; if (!B) return; B.tb = null; B.done = false; B.stage = null; const t = D.city(B.to); B.def.gid = B.def.gid || 'xuchu'; D.duelStart(B); D.G.talks = []; D.render(); document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); })],
  ['열전', prep(() => { D.G.battle = null; D.G.phase = 'act'; D.taleStart('zy'); D.G.talks = []; D.render(); document.querySelectorAll('.sheet-bg').forEach(x => x.remove()); })],
  ['열전 끝', prep(() => { const B = D.G.battle; if (B && B.tale){ B.tale.done = 'win'; B.tale.reward = '처음 완수 · 옥 +8'; } D.render(); })],
  ['포로', prep(() => { document.querySelector('#taleClose') && document.querySelector('#taleClose').click(); D.G.battle = null; D.G.phase = 'act'; const f = Object.keys(D.G.facs).find(f => f!==D.G.pfac && D.G.facs[f].alive); D.jailStart(f); D.G.talks = []; D.render(); })],
  ['월간 보고', prep(() => { D.G.battle = null; D.G.phase = 'report'; D.G.scene = 'b200_guandu'; D.G.talks = []; D.render(); })],
  ['지도(장수)', async p => { await newGame(p, 200, 'shu', 'zhaoyun'); await p.evaluate(() => { D.G.talks = []; D.render(); }); }],
  ['평정(장수)', prep(() => { D.G.talks = []; D.queueCouncil(true); const T = D.G.talks[0]; if (T) T.i = T.lines.length - 1; D.render(); })],
  ['알현', prep(() => { D.G.talks = []; D.render(); D.openSheet('audience'); })],
];
(async () => {
  const b = await chromium.launch(); let total = { over:0, clip:0, tap:0, tapWarn:0, cover:0, img:0, err:0, docOver:0 };
  const report = [];
  for (const [vn, w, h] of VPS){
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.setDefaultTimeout(4000);
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
    for (const [sn, fn] of SCENES){
      errs.length = 0;
      try { await fn(p); } catch (e) { report.push(`[${vn}] ${sn}: 준비 실패 ${e.message.split('\n')[0].slice(0,90)}`); continue; }
      const r = await check(p);
      if (SHOTS) await p.screenshot({ path: `/tmp/audit_${vn}_${sn.replace(/[^\w가-힣]/g,'_')}.png` });
      const tapFail = r.tap.filter(t => { const m = t.match(/(\d+)×(\d+)$/); return m && Math.min(+m[1], +m[2]) < MIN_TAP; });
      const issues = [];
      if (r.docOver) issues.push(`화면 가로 넘침 ${r.docOver}px`);
      if (r.over.length) issues.push(`화면 밖으로 나감 ${r.over.length}: ${r.over.slice(0,3).join(' | ')}`);
      if (r.clip.length) issues.push(`글자 잘림 ${r.clip.length}: ${r.clip.slice(0,3).join(' | ')}`);
      if (tapFail.length) issues.push(`작은 버튼 ${tapFail.length}: ${tapFail.slice(0,4).join(' | ')}`);
      if (r.cover.length) issues.push(`가려진 버튼 ${r.cover.length}: ${r.cover.slice(0,2).join(' | ')}`);
      if (r.img.length) issues.push(`깨진 그림 ${r.img.length}: ${r.img.slice(0,3).join(' ')}`);
      if (errs.length) issues.push(`오류 ${errs.length}: ${errs[0].slice(0,120)}`);
      total.over += r.over.length; total.clip += r.clip.length; total.tap += tapFail.length; total.cover += r.cover.length; total.img += r.img.length; total.err += errs.length; total.docOver += r.docOver ? 1 : 0;
      report.push(`[${vn}] ${sn}: ${issues.length ? issues.join(' / ') : '이상 없음'}`);
    }
    await p.close();
  }
  await b.close();
  console.log(report.join('\n'));
  console.log('\n합계', JSON.stringify(total));
})();
