# 8챕터 스테이지 블록 생성기
# 사용: python3 stages.py <config.js> k1 k2 ... k8
import sys, json
p = sys.argv[1]
K = [float(x) for x in sys.argv[2:10]]

THEMES = {
 'desert': "groundImg: 'desert', skyImg: 'assets/sky/sunset.jpg', skyTop: '#f3b06b', skyBottom: '#f7d49b', fog: '#efc08a', fogNear: 55, fogFar: 150,\n        light: [0.5, 0.9, 0.3], sky: '#fff1d6', ground: '#a8714a', ambient: 0.45,\n        groundCol: '#d9a066', ballast: '#8b6a4f', sleeper: '#5b4636', rail: '#aab2bf',\n        props: 'desert', weather: 'dust', rock: ['#c27a45', '#b06a3a', '#d48b52', '#9e5d33'], plant: '#5f8f3a',",
 'rest': "groundImg: 'rest', skyImg: 'assets/sky/sunset.jpg', skyTop: '#ff7e5f', skyBottom: '#ffc27a', fog: '#f2a27a', fogNear: 50, fogFar: 140,\n        light: [0.7, 0.6, 0.3], sky: '#ffd9b8', ground: '#8a5040', ambient: 0.5, spriteTint: [1.0, 0.9, 0.84],\n        groundCol: '#c98a5c', ballast: '#7a5a48', sleeper: '#4e3a2e', rail: '#b0a8a8',\n        props: 'desert', weather: 'dust', rock: ['#b0603a', '#a0502e', '#c4743f', '#8a4a2a'], plant: '#6a7a3a', groundTint: [1.0, 0.86, 0.8, 1],",
 'city': "groundImg: 'city', skyTop: '#1d2448', skyBottom: '#6a3f6e', fog: '#4a3a62', fogNear: 50, fogFar: 150,\n        light: [0.35, 0.85, 0.45], sky: '#c9d2ff', ground: '#5a4a6a', ambient: 0.62,\n        groundCol: '#565a68', ballast: '#3c3f4a', sleeper: '#3d3027', rail: '#9aa3b2',\n        props: 'city', weather: 'rain', spriteTint: [0.85, 0.85, 0.97], building: ['#5a6378', '#66708a', '#525a6e', '#6a5a78', '#586868'], neon: ['#ff4fa3', '#3df2ff', '#ffd23d', '#7dff6b'],",
 'neon': "groundImg: 'neon', skyTop: '#07061a', skyBottom: '#3a0d4a', fog: '#24103a', fogNear: 40, fogFar: 130,\n        light: [0.3, 0.8, 0.5], sky: '#ff9ad8', ground: '#2a1a3a', ambient: 0.66,\n        groundCol: '#3a3446', ballast: '#2a2632', sleeper: '#2e2420', rail: '#a99ac0',\n        props: 'city', weather: 'confetti', spriteTint: [0.95, 0.82, 1.0], building: ['#2e2a44', '#3a2e50', '#26303e', '#40284a', '#2a3a44'], neon: ['#ff3fa0', '#3df2ff', '#fff23d', '#b05cff', '#ff7a2a'], groundTint: [0.62, 0.55, 0.85, 1],",
 'bridge': "skyImg: 'assets/sky/sunset.jpg', skyTop: '#7fb2e5', skyBottom: '#f2d6b3', fog: '#c9c6c9', fogNear: 60, fogFar: 170,\n        light: [0.4, 0.9, 0.35], sky: '#eef6ff', ground: '#6a6a7a', ambient: 0.5,\n        groundCol: '#4a5560', ballast: '#5d636e', sleeper: '#4a3a2e', rail: '#b3bccb',\n        props: 'bridge', weather: 'wind', deck: [-11, 4], river: '#3f7fb0', cliff: ['#8a6a52', '#9a7a5a', '#7a5a46', '#a88a6a'], steel: '#8a4a3a',",
 'snow': "skyImg: 'assets/sky/snow.jpg', skyTop: '#8fa6c4', skyBottom: '#e6edf6', fog: '#dce5ef', fogNear: 40, fogFar: 130,\n        light: [0.4, 0.9, 0.35], sky: '#f4f8ff', ground: '#c8d2de', ambient: 0.62, spriteTint: [0.93, 0.97, 1.06],\n        groundCol: '#d8e0ea', ballast: '#9aa6b4', sleeper: '#5a4a40', rail: '#c4ccd8',\n        props: 'bridge', weather: 'snow', deck: [-11, 4], river: '#b8d4ea', cliff: ['#e8eef5', '#cdd7e2', '#b4c0ce', '#f4f7fb'], steel: '#4a5a7a', groundTex: 'snow',",
 'tunnel': "groundImg: 'tunnel', skyTop: '#0a0a12', skyBottom: '#2a0e14', fog: '#1a0e12', fogNear: 35, fogFar: 120,\n        light: [0.3, 0.9, 0.5], sky: '#ffb0a0', ground: '#2a1a20', ambient: 0.55,\n        groundCol: '#2e2b30', ballast: '#242226', sleeper: '#3a2e26', rail: '#8a8f9a',\n        props: 'tunnel', weather: 'sparks', spriteTint: [0.85, 0.74, 0.76], walls: [-12.5, 5.5], wall: '#3a3840', alarm: '#ff2a2a',",
 'lab': "groundImg: 'lab', skyTop: '#04120e', skyBottom: '#0e2e26', fog: '#0c221d', fogNear: 35, fogFar: 115,\n        light: [0.3, 0.9, 0.5], sky: '#a0ffd8', ground: '#16241f', ambient: 0.6,\n        groundCol: '#26332f', ballast: '#1d2724', sleeper: '#2e2a26', rail: '#9aa8a4',\n        props: 'tunnel', weather: 'sparks', spriteTint: [0.78, 0.95, 0.86], walls: [-12.5, 5.5], wall: '#2c3c3a', alarm: '#3dff9a', groundTint: [0.7, 0.95, 0.85, 1],",
}

# who: 0=잭 1=민호 2=소피
STAGES = [
 dict(id='desert', name='황폐한 사막 협곡', desc='출근 첫날. 사방에서 몰려오는 지각 좀비를 시원하게 쓸어버리자!', thumb='assets/stages/stage1.jpg', clearGold=150, theme='desert',
  intro=[(0,'여기는 둠스데이 익스프레스. 목적지는 지하 연구소, 백신이 거기 있다.'),(1,'저 오늘 입사 첫날인데요... 왜 무기가 전부 뚫어뻥이에요?'),(2,'마지막까지 문 연 가게가 철물점이었거든.'),(0,'전원 배치! 출근 시간이다!!')],
  outro=[(2,'거미 부장님 처치 완료... 근데 저 넥타이, 우리 회사 거 아니야?'),(0,'연료가 간당간당하다. 다음 휴게소에 들른다.')],
  bosses=('bujang','bujang')),
 dict(id='rest', name='해 질 녘 고속도로 휴게소', desc='연료와 호두과자를 구하러 들른 휴게소. 택배 좀비가 산더미처럼 몰려온다!', thumb='assets/stages/stage5.jpg', thumbFallback='assets/stages/stage1.jpg', clearGold=200, theme='rest',
  intro=[(1,'휴게소다! 호두과자... 호두과자 냄새가 나요!'),(2,'정신 차려. 저기 택배 상자 더미가... 움직이고 있어.'),(0,'연료만 넣고 바로 뜬다. 상자는 밟지 마라.')],
  outro=[(1,'호두과자 세 봉지 확보했어요! 하나는 제 거예요.'),(2,'무전이 잡혀. "본사 서버에... 백신 위치가..." 도심으로 가야 해.')],
  bosses=('bujang','taekbae')),
 dict(id='city', name='붕괴된 대도시', desc='비 내리는 본사 앞 도심. 빌딩 위에서 댄서들이 뛰어내린다!', thumb='assets/stages/stage2.jpg', clearGold=250, theme='city',
  intro=[(1,'도심이다... 저 사람들 전부 우리 회사 사람들이에요.'),(0,'월요일 아침 9시. 가장 위험한 시간대지.'),(2,'본사 서버실까지 버텨 줘. 내가 해킹할게!')],
  outro=[(2,'해킹 성공! 백신은 지하 연구소... 열쇠 카드는 이사님이 갖고 있대.'),(0,'과장님... 편히 퇴근하세요.')],
  bosses=('taekbae','gwajang')),
 dict(id='neon', name='네온 유흥가 (회식 2차)', desc='한밤의 회식 거리. 술 취한 과장 좀비들이 터지기 직전이다!', thumb='assets/stages/stage6.jpg', thumbFallback='assets/stages/stage2.jpg', clearGold=300, theme='neon',
  intro=[(1,'형... 여기 회식 2차 거리예요. 저 회식 진짜 싫어요.'),(0,'배 나온 분들 조심해. 가까이 오면 터진다.'),(2,'노래방 간판 너머에서 뭔가 큰 게 온다!')],
  outro=[(1,'3차는... 안 가도 되는 거죠?'),(2,'앞에 협곡 철교야. 이사님 신호가 거기서 잡혀.')],
  bosses=('gwajang','hwisik')),
 dict(id='bridge', name='아슬아슬 협곡 철교', desc='발밑은 천 길 낭떠러지. 좀비들이 다리 밑에서 기어 올라온다! (밀어서 떨어뜨리기 가능)', thumb='assets/stages/stage3.jpg', clearGold=350, theme='bridge',
  intro=[(2,'낡은 철교야. 떨어지면 그대로 끝이야.'),(1,'형! 좀비들이 다리 난간을 타고 기어 올라와요!'),(0,'폭발로 날려버려. 다리 밖으로 밀면 알아서 떨어진다.')],
  outro=[(2,'이사님 쓰러뜨렸어! 카드키... 반쪽밖에 없네?'),(0,'나머지 반쪽은 설산 너머 연수원에 있다더군.')],
  bosses=('hwisik','isa')),
 dict(id='snow', name='눈보라 설산 철교', desc='강제 워크숍이 열리는 설산. 눈보라 속에서 상무님이 기다린다!', thumb='assets/stages/stage7.jpg', thumbFallback='assets/stages/stage3.jpg', clearGold=400, theme='snow',
  intro=[(1,'추워요... 열차 창문이 얼었어요.'),(2,'저 위가 회사 연수원이야. 1박 2일 강제 워크숍...'),(0,'좀비가 돼서도 워크숍이라니. 끔찍하군.')],
  outro=[(0,'상무님의 카드키 반쪽 확보. 이제 완전한 열쇠다.'),(1,'다음은 터널이에요. 엄청 어두워요...')],
  bosses=('isa','sangmu')),
 dict(id='tunnel', name='암흑 터널', desc='비상등만 깜빡이는 긴 터널. 이사님이 다시 일어났다!', thumb='assets/stages/stage4.jpg', clearGold=450, theme='tunnel',
  intro=[(0,'터널이다. 비상등만 믿고 간다.'),(2,'잠깐... 저 거미 실루엣, 아까 쓰러뜨린 이사님이야!'),(1,'이사님은 원래 안 죽어요. 임기가 남았거든요.')],
  outro=[(2,'터널 끝이 보여! 연구소 입구야.'),(0,'카드키 준비. 마지막 출근이다.')],
  bosses=('sangmu','isa2')),
 dict(id='lab', name='지하 연구소 (사장실)', desc='초록 경보등이 번쩍이는 마지막 구간. 끝에서 사장님이 기다린다.', thumb='assets/stages/stage8.jpg', thumbFallback='assets/stages/stage4.jpg', clearGold=600, theme='lab',
  intro=[(2,'무전이 잡혀... "백신은... 사장실 금고에... 있다..."'),(1,'결국 사장님 만나러 가는 거네요...'),(0,'정시 퇴근을 위해서라면, 뭐든 한다!!')],
  outro=[(2,'백신 확보!! 우리가 해냈어!'),(1,'근데 형... 오늘 아직 월요일이에요.'),(0,'...내일도 출근이다. 열차 정비해 둬.')],
  bosses=('isa2','ceo')),
]
# 웨이브 모양 (모든 스테이지 7웨이브, 4번째=중간 보스, 7번째=최종 보스)
SHAPE = [1.0, 1.15, 1.35, 1.5, 1.8, 2.1, 2.4]
TIMES = [20, 24, 26, 26, 26, 28, 30]
MIX = {
 'desert': [{'office':1},{'office':0.8,'box':0.2},{'office':0.7,'box':0.2,'dancer':0.1},{'office':0.7,'box':0.3},{'office':0.55,'box':0.22,'dancer':0.13,'bomber':0.1},{'office':0.5,'box':0.2,'dancer':0.15,'riot':0.06,'bomber':0.09},{'office':0.5,'box':0.2,'dancer':0.15,'riot':0.08,'bomber':0.07}],
 'rest':   [{'office':0.6,'box':0.4},{'office':0.5,'box':0.4,'bomber':0.1},{'office':0.45,'box':0.4,'dancer':0.08,'bomber':0.07},{'office':0.5,'box':0.5},{'office':0.4,'box':0.4,'dancer':0.1,'bomber':0.1},{'office':0.38,'box':0.4,'dancer':0.1,'riot':0.04,'bomber':0.08},{'office':0.4,'box':0.4,'dancer':0.1,'bomber':0.1}],
 'city':   [{'office':0.8,'box':0.2},{'office':0.6,'box':0.2,'dancer':0.12,'bomber':0.08},{'office':0.5,'box':0.2,'dancer':0.18,'riot':0.05,'bomber':0.07},{'office':0.55,'box':0.2,'dancer':0.15,'bomber':0.1},{'office':0.45,'box':0.2,'dancer':0.2,'riot':0.08,'bomber':0.07},{'office':0.4,'box':0.2,'dancer':0.2,'riot':0.12,'bomber':0.08},{'office':0.4,'box':0.2,'dancer':0.15,'riot':0.15,'bomber':0.1}],
 'neon':   [{'office':0.7,'bomber':0.15,'dancer':0.15},{'office':0.55,'dancer':0.2,'bomber':0.25},{'office':0.45,'box':0.1,'dancer':0.2,'bomber':0.25},{'office':0.5,'dancer':0.2,'bomber':0.3},{'office':0.4,'box':0.1,'dancer':0.2,'riot':0.05,'bomber':0.25},{'office':0.35,'box':0.1,'dancer':0.2,'riot':0.1,'bomber':0.25},{'office':0.35,'box':0.1,'dancer':0.2,'riot':0.1,'bomber':0.25}],
 'bridge': [{'office':0.75,'box':0.25},{'office':0.55,'box':0.2,'dancer':0.15,'bomber':0.1},{'office':0.5,'box':0.2,'dancer':0.15,'riot':0.08,'bomber':0.07},{'office':0.55,'box':0.2,'dancer':0.15,'bomber':0.1},{'office':0.45,'box':0.2,'dancer':0.17,'riot':0.1,'bomber':0.08},{'office':0.4,'box':0.2,'dancer':0.18,'riot':0.14,'bomber':0.08},{'office':0.4,'box':0.2,'dancer':0.15,'riot':0.15,'bomber':0.1}],
 'snow':   [{'office':0.6,'box':0.25,'riot':0.15},{'office':0.5,'box':0.2,'dancer':0.1,'riot':0.2},{'office':0.45,'box':0.2,'dancer':0.1,'riot':0.18,'bomber':0.07},{'office':0.5,'box':0.2,'riot':0.2,'bomber':0.1},{'office':0.4,'box':0.2,'dancer':0.12,'riot':0.2,'bomber':0.08},{'office':0.36,'box':0.2,'dancer':0.14,'riot':0.22,'bomber':0.08},{'office':0.4,'box':0.2,'dancer':0.1,'riot':0.2,'bomber':0.1}],
 'tunnel': [{'office':0.7,'box':0.2,'bomber':0.1},{'office':0.5,'box':0.2,'dancer':0.15,'bomber':0.15},{'office':0.45,'box':0.2,'dancer':0.15,'riot':0.1,'bomber':0.1},{'office':0.5,'box':0.2,'dancer':0.15,'bomber':0.15},{'office':0.4,'box':0.2,'dancer':0.17,'riot':0.13,'bomber':0.1},{'office':0.38,'box':0.2,'dancer':0.17,'riot':0.15,'bomber':0.1},{'office':0.4,'box':0.2,'dancer':0.15,'riot':0.15,'bomber':0.1}],
 'lab':    [{'office':0.6,'box':0.2,'riot':0.1,'bomber':0.1},{'office':0.45,'box':0.2,'dancer':0.15,'riot':0.1,'bomber':0.1},{'office':0.4,'box':0.2,'dancer':0.15,'riot':0.15,'bomber':0.1},{'office':0.45,'box':0.2,'dancer':0.15,'riot':0.1,'bomber':0.1},{'office':0.36,'box':0.2,'dancer':0.17,'riot':0.17,'bomber':0.1},{'office':0.34,'box':0.2,'dancer':0.18,'riot':0.18,'bomber':0.1},{'office':0.4,'box':0.2,'dancer':0.15,'riot':0.15,'bomber':0.1}],
}
BOSS_BASE = {'bujang':1600,'taekbae':1900,'gwajang':2200,'hwisik':2400,'isa':2600,'sangmu':2900,'isa2':3200,'ceo':4200}

def js(v):
    return json.dumps(v, ensure_ascii=False).replace('"', "'")
def mixs(m): return '{ ' + ', '.join(f"{k}: {v}" for k, v in m.items()) + ' }'

out = ['  stages: [']
for si, s in enumerate(STAGES):
    k = K[si]; t = si / 7
    rate0 = 2.6 + 1.2 * t; hs0 = 22 + 16 * t
    rate = [rate0, rate0 + 0.6, rate0 + 1.2, rate0 + 0.2, rate0 + 1.8, rate0 + 2.4, rate0 + 1.0]
    hs = [hs0, hs0 + 6, hs0 + 10, hs0 + 8, hs0 + 18, hs0 + 24, hs0 + 18]
    hordes = [1, 1 if si == 0 else 2, 2, 1 if si == 0 else 2, 2 if si < 3 else 3, 2 if si == 0 else 3, 2]
    mid = 900 + 350 * k; fin = (1700 + 650 * k) * (1.15 if s['bosses'][1] == 'ceo' else 1)
    o = []
    o.append('    {')
    o.append(f"      id: '{s['id']}', name: '{s['name']}', desc: '{s['desc']}',")
    tf = f", thumbFallback: '{s['thumbFallback']}'" if s.get('thumbFallback') else ''
    o.append(f"      thumb: '{s['thumb']}'{tf}, clearGold: {s['clearGold']},")
    o.append('      intro: [')
    for w, tx in s['intro']: o.append(f"        {{ who: {w}, text: '{tx}' }},")
    o.append('      ],')
    o.append('      outro: [')
    for w, tx in s['outro']: o.append(f"        {{ who: {w}, text: '{tx}' }},")
    o.append('      ],')
    o.append('      theme: {\n        ' + THEMES[s['theme']] + '\n      },')
    o.append('      waves: [')
    for i in range(7):
        bs = ''
        if i == 3: b = s['bosses'][0]; bs = f", boss: '{b}', bossHp: {round(mid / BOSS_BASE[b], 2)}"
        if i == 6: b = s['bosses'][1]; bs = f", boss: '{b}', bossHp: {round(fin / BOSS_BASE[b], 2)}"
        o.append(f"        {{ time: {TIMES[i]}, rate: {round(rate[i], 1)}, hordes: {hordes[i]}, hordeSize: {round(hs[i])}, mix: {mixs(MIX[s['theme']][i])}, hp: {round(SHAPE[i] * k, 2)}{bs} }},")
    o.append('      ],')
    o.append('    },')
    out += o
out.append('  ],\n')
src = open(p).read()
a = src.index('  stages: [\n'); b = src.index('  /* ------------------------------------------------------------- 엔딩')
src = src[:a] + '\n'.join(out) + '\n' + src[b:]
open(p, 'w').write(src)
print('stages written', K)
