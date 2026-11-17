// 새 데이터(data/*.json, careers.txt)를 게임 코드(src/game_src.html)의 DATA 구간에 넣는다.
// usage: node tools/gen_data.js   (nanse2 폴더에서)
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const rd = f => JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8'));
const people = rd('people.json'), scen = rd('scenarios.json'), legacy = rd('careers_legacy.json');
const errs = [];

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
  let c = careers[p.id] || (legacy[p.id] && legacy[p.id].career);
  if (!c) { errs.push('경력 없음: ' + p.id + ' ' + p.name); continue; }
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

const block = `/*@@DATA_START@@*/
// 아래는 tools/gen_data.js 가 data/ 폴더에서 만든다. 직접 고치지 말 것.
const FAC_RAW = ${JSON.stringify(scen.factions)};
const SCEN = ${JSON.stringify(scen.scenarios)};
const SCEN_YEARS = Object.keys(SCEN).map(Number);
// id, 이름, 출생, 사망, 무용, 지략, 용병, 인망(내부 100점 척도 = 1~20 × 5), 특성, 경력, 등장연도
const PEOPLE_DEF = [
${rows.map(r => '  ' + JSON.stringify(r)).join(',\n')}
];
const JEONG = ${JSON.stringify(jeong)};
const TRAITS2 = ${JSON.stringify(newTraits)};
const EQUIP0 = ${JSON.stringify(equip)};
/*@@DATA_END@@*/
`;
const srcF = path.join(root, 'src', 'game_src.html');
let s = fs.readFileSync(srcF, 'utf8');
const a = s.indexOf('/*@@DATA_START@@*/'), b = s.indexOf('/*@@DATA_END@@*/');
if (a < 0 || b < 0) { console.log('DATA 표시를 찾지 못함'); process.exit(1); }
s = s.slice(0, a) + block.trimEnd() + s.slice(b + '/*@@DATA_END@@*/'.length);
fs.writeFileSync(srcF, s);
console.log(`넣음: 인물 ${rows.length}명, 시나리오 ${Object.keys(scen.scenarios).join('/')}, 세력 ${scen.factions.length}`);
