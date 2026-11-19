// 새 데이터(data/*.json, careers.txt)를 게임 코드(src/game_src.html)의 DATA 구간에 넣는다.
// usage: node tools/gen_data.js   (nanse2 폴더에서)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
const people = rd('people.json'), scen = rd('scenarios.json'), legacy = rd('careers_legacy.json');
const errs = [];
const talks = Object.fromEntries(Object.entries(rd('talks.json')).filter(([k]) => !k.startsWith('_')));

// 경력: 기존 경력 + careers.txt (@는 기존 경력 앞에 붙이기)
const careers = {}, pre = {};
for (const line of fs.readFileSync(path.join(root, 'data', 'careers.txt'), 'utf8').split('\n')) {
  const t = line.trim(); if (!t || t.startsWith('#')) continue;
  const m = t.match(/^(@?)([a-z0-9_]+) (.+)$/); if (!m) { errs.push('경력 형식: ' + t); continue; }
  if (m[1]) pre[m[2]] = m[3]; else careers[m[2]] = m[3];
}
const facIds = new Set([...scen.factions.map(f => f[0]), 'free', 'local']);
const cityIds = new Set(rd('map_cities.json').map(c => c.id));

// 새 특성 → 기존 엔진의 특성 하나 (새 특성 체계가 엔진에 들어가기 전까지)
const TMAP = { ilgi: '맹장', yongmaeng: '맹장', gangye: '지장', ganpa: '지장', hwagye: '지장', dukmang: '인덕', chise: '인덕', chungjeol: '충의', gima: '기병', jangsu: '장수', susung: '강철' };
function oldTrait(p) {
  for (const t of p.traits) if (TMAP[t]) return TMAP[t];
  const s = p.stats; const top = Object.entries({ mu: s.mu, ji: s.ji, yong: s.yong, in: s.in }).sort((a, b) => b[1] - a[1])[0][0];
  return { mu: '맹장', ji: '지장', yong: '명장', in: '인덕' }[top];
}
const X = v => v * 5; // 1~20 → 엔진 내부 100점 척도
const rows = [], jeong = {}, newTraits = {}, equip = {};
for (const p of people) {
  // 새 경력(careers.txt)이 있으면 그것을 쓰고, 그 마지막 연도 뒤의 기존 경력(207·219·228 등)을 이어 붙인다.
  const lc = legacy[p.id] && legacy[p.id].career;
  let c = careers[p.id] || lc;
  if (!c) { errs.push('경력 없음: ' + p.id + ' ' + p.name); continue; }
  if (careers[p.id] && lc) { const last = Math.max(...careers[p.id].split('|').map(x => +x.split(' ')[0])); const tail = lc.split('|').filter(x => +x.split(' ')[0] > last); if (tail.length) c += '|' + tail.join('|'); }
  if (pre[p.id]) c = pre[p.id] + '|' + c;
  const parts = c.split('|').map(x => x.split(' '));
  parts.forEach(([y, f, ci]) => { if (!(+y >= 184)) errs.push(`${p.id} 연도 ${y}`); if (!facIds.has(f)) errs.push(`${p.id} 세력 ${f}`); if (!cityIds.has(ci)) errs.push(`${p.id} 성 ${ci}`); });
  parts.sort((a, b) => a[0] - b[0]);
  const ap = legacy[p.id] && legacy[p.id].ap;
  const row = [p.id, p.name, p.born, p.died || p.born + 60, X(p.stats.mu), X(p.stats.ji), X(p.stats.yong), X(p.stats.in), oldTrait(p), parts.map(x => x.join(' ')).join('|')];
  if (ap) row.push(ap);
  rows.push(row); jeong[p.id] = X(p.stats.jeong); newTraits[p.id] = p.traits;
  if (p.equip.weapon || p.equip.horse || p.equip.book) equip[p.id] = p.equip;
}
for (const id of Object.keys(careers)) if (!people.some(p => p.id === id)) errs.push('경력만 있고 인물 없음: ' + id);
for (const [y, S] of Object.entries(scen.scenarios)) for (const r of Object.values(S.rulers)) if (!people.some(p => p.id === r)) errs.push(`${y} 군주 없음 ${r}`);
if (errs.length) { console.log('오류 ' + errs.length + '건\n' + errs.join('\n')); process.exit(1); }

const TK = { '맹장':'a', '지장':'b', '명장':'c', '인덕':'d', '강철':'e', '충의':'f', '기병':'g', '장수':'h' };
const femaleSet = new Set(people.filter(p => p.sex === 'f').map(p => p.id));
for (const r of rows) if (r[1].includes(';') || r[9].includes(';')) { console.log('세미콜론 금지: ' + r[0]); process.exit(1); }
const block = `/*@@DATA_START@@*/
// 아래는 tools/gen_data.js 가 data/ 폴더에서 만든다. 직접 고치지 말 것.
const FAC_RAW = ${JSON.stringify(scen.factions)};
const SCEN = ${JSON.stringify(scen.scenarios)};
const SCEN_YEARS = Object.keys(SCEN).map(Number);
// 인물 압축 표기: id;이름;출생;사망;무용;지략;용병;인망;정무(1~20);특성;경력;등장연도;새특성(.구분);여성
const P_RAW = \`${rows.map(r => [r[0], r[1], r[2], r[3], r[4]/5, r[5]/5, r[6]/5, r[7]/5, jeong[r[0]]/5, TK[r[8]], r[9], r[10] || '', (newTraits[r[0]] || []).join('.'), femaleSet.has(r[0]) ? 1 : ''].join(';').replace(/;+$/, '')).join('\n')}\`;
const TKR = ${JSON.stringify(Object.fromEntries(Object.entries(TK).map(([k, v]) => [v, k])))};
const PEOPLE_DEF = [], JEONG = {}, TRAITS2 = {}, FEMALE = [];
for (const ln of P_RAW.split('\\n')){ const [id, n, b, d, m, i, l, c, g, t, car, ap, t2, fe] = ln.split(';'); const row = [id, n, +b, +d, m*5, i*5, l*5, c*5, TKR[t], car]; if (ap) row.push(+ap); PEOPLE_DEF.push(row); JEONG[id] = g*5; TRAITS2[id] = t2 ? t2.split('.') : []; if (fe) FEMALE.push(id); }
const EQUIP0 = ${JSON.stringify(equip)};
const LOOK2 = ${JSON.stringify(Object.fromEntries(Object.entries(rd('looks.json')).filter(([k]) => !k.startsWith('_'))))};
// 무기 종류(검 제외), 이름 있는 장비 [이름, 슬롯, {능력 보너스}]
const WPN = ${JSON.stringify(Object.fromEntries(people.filter(p => p.weaponType !== 'geom').map(p => [p.id, p.weaponType])))};
const GEAR = ${JSON.stringify(Object.fromEntries(rd('equipment.json').named.map(n => [n.id, [n.name, n.slot, n.bonus]])))};
// 그림 초상화가 있는 인물 (portraits/<id>.webp)
const PORTRAITS = ${JSON.stringify(fs.existsSync(path.join(root, 'portraits')) ? fs.readdirSync(path.join(root, 'portraits')).filter(f => f.endsWith('.webp')).map(f => f.replace('.webp', '')).sort() : [])};
const SCENES = ${JSON.stringify(fs.readdirSync(path.join(root, 'art')).filter(f => f.startsWith('s_')).map(f => f.slice(2).replace('.webp', '')))};
const GICON = ${JSON.stringify(fs.readdirSync(path.join(root, 'art')).filter(f => f.startsWith('g_')).map(f => f.slice(2).replace('.webp', '')))};
// 역사 사건(회귀자의 기억): [id, 연, 월, 이름, 성, 원작 결과, 관련 인물, 일기토, 대화 등장인물, 규모, a측 대표, b측 대표]
const HIST_EV = ${JSON.stringify([...rd('battles_184_200.json').battles, ...rd('battles_201_234.json').battles].map(b => [b.id, b.year, b.month, b.name, b.at, b.history, [...new Set([...(b.a ? b.a.leaders : []), ...(b.b ? b.b.leaders : [])])], b.duels || [], talks[b.id] ? [...new Set(talks[b.id].lines.map(l => l[0]).filter(Boolean))] : [], b.scale || '', b.a && b.a.leaders[0] || '', b.b && b.b.leaders[0] || '']))};
// 역사 사건 대화 연출: {id: {bg, lines:[[인물|null, 대사]]}}
const TALKS = ${JSON.stringify(talks)};
// 성격(대사 말투): uiri 의리 · sinjung 신중 · yongjang 용장 · gyohwal 교활 · onhwa 온화 · yasim 야심
const PERS = ${JSON.stringify(Object.fromEntries(people.filter(p => p.personality).map(p => [p.id, p.personality])))};
/*@@DATA_END@@*/
`;
const srcF = path.join(root, 'src', 'game_src.html');
let s = fs.readFileSync(srcF, 'utf8');
const a = s.indexOf('/*@@DATA_START@@*/'), b = s.indexOf('/*@@DATA_END@@*/');
if (a < 0 || b < 0) { console.log('DATA 표시를 찾지 못함'); process.exit(1); }
s = s.slice(0, a) + block.trimEnd() + s.slice(b + '/*@@DATA_END@@*/'.length);
fs.writeFileSync(srcF, s);
console.log(`넣음: 인물 ${rows.length}명, 시나리오 ${Object.keys(scen.scenarios).join('/')}, 세력 ${scen.factions.length}`);
