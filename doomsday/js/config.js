/* ==========================================================================
   config.js — ★ 게임 밸런스 · 문구 · 시나리오 · 색상 · 이미지 경로를 전부 여기서 수정 ★
   - 숫자만 바꾸고 저장 → 새로고침하면 바로 반영
   - 문법 주의: 쉼표(,)와 따옴표('')만 지우지 않으면 됨
   - 챗GPT/제미나이에게 "이 config.js에서 ○○를 바꿔줘. 수정된 파일 전체를 줘" 라고 통째로 붙여넣어도 됨
   ========================================================================== */
window.DX = window.DX || {};
DX.CONFIG = {

  /* ------------------------------------------------------------------ 기본 */
  game: {
    title: 'DOOMSDAY EXPRESS',
    subtitle: '둠스데이 익스프레스 : 병맛 에디션',
    version: 'v0.5',
    unlockAllStages: true,      // 테스트용: true면 모든 스테이지 바로 플레이 가능 (출시 때 false)
    maxZombies: 320,            // 동시에 존재 가능한 최대 좀비 수 (폰이 느리면 줄이기)
    maxZombiesLow: 160,         // '저사양 모드'일 때 최대 좀비 수
    trainSpeed: 16,             // 열차 속도 (배경이 흘러가는 속도)
    startGold: 100,             // 처음 시작할 때 주는 골드
  },

  /* ------------------------------------------------------------- 카메라 (인게임 원/근 전환)
     back=열차 뒤 거리, height=높이, grow=열차가 길어질 때 더 멀어지는 정도, aim/ahead=바라보는 지점, fov=화각 */
  camera: {
    far: { label: '원거리', back: 14, backGrow: 0.4, height: 18, grow: 0.35, aim: 0.6, ahead: 4, fov: 50 },
    near: { label: '근거리', back: -4, backGrow: 0.0, height: 8.5, grow: 0.05, aim: 0.35, ahead: 16, fov: 62 },
  },

  /* ------------------------------------------------------------- 광고 (보상형 동영상만 사용, 유료결제 없음)
     실제 광고 연결은 ui.js 의 DX.showAd 함수 한 곳만 바꾸면 됨 (위챗/더우인 예시 주석 있음) */
  ads: {
    testDuration: 2,            // 테스트용 가짜 광고 길이(초)
    revive: true,               // 패배 시 '광고 보고 부활' (판당 1회)
    doubleGold: true,           // 결과 화면 '광고 보고 골드 2배'
    rerollPerRun: 2,            // 레벨업 카드 '광고 보고 다시 뽑기' 판당 횟수
    supplyGold: 40,             // 로비 '보급 상자' 광고 1회당 골드
    supplyPerDay: 3,            // 보급 상자 하루 횟수
    // ★ 광고 단위 ID: 위챗/더우인 관리자 화면에서 받은 '보상형 영상 광고' ID를 넣으세요. 비어 있으면 2초 테스트 광고.
    unit: { wx: '', tt: '' },
  },

  /* -------------------------------------------------------------- 이미지
     파일을 같은 이름으로 덮어쓰면 자동 적용. 파일이 없으면 기본 디자인으로 표시됨. */
  assets: {
    ui: {
      logo: 'assets/ui/logo.png',              // 로비 상단 로고 (800x400, 투명 PNG)
      lobbyBg: 'assets/ui/lobby_bg.jpg',       // 로비 배경 (1080x1920) — 넣으면 3D 대신 그림 표시
      startButton: 'assets/ui/btn_start.png',  // 출발 버튼 (600x180)
      cardFrame: 'assets/ui/card_frame.png',   // 레벨업 카드 배경 (600x220)
      resultBg: 'assets/ui/result_bg.jpg',     // 결과 화면 배경
      ultimate: 'assets/ui/ultimate.png',      // 필살기(대파 폭격) 버튼 (256x256)
      coin: 'assets/ui/coin.png',              // 골드 아이콘 (64x64)
    },
    story: ['assets/story/story1.jpg', 'assets/story/story2.jpg', 'assets/story/story3.jpg'],
  },

  /* ------------------------------------------------------------- 그림 캐릭터 (2.5D)
     full  = 완성 그림 (달리는 모습), parts = 부품 분리 시트 (죽을 때 부품이 흩어짐)
     같은 파일명으로 덮어쓰면 자동 적용. 흰 배경도 자동 제거, 부품도 자동 분리됨
     height = 게임 속 키, face = 그림이 보는 방향 (1 = 오른쪽, -1 = 왼쪽)
     새 캐릭터 추가: 여기 한 줄 추가 → 아래 zombies / bosses / survivors 의 art 에 이름 적기 */
  art: {
    office: { full: 'assets/chars/office_full.png', parts: 'assets/chars/office_parts.png', height: 2.6, face: 1 },
    box: { full: 'assets/chars/box_full.png', parts: 'assets/chars/box_parts.png', height: 2.6, face: 1 },
    bomber: { full: 'assets/chars/bomber_full.png', parts: 'assets/chars/bomber_parts.png', height: 2.8, face: 1 },
    jack: { full: 'assets/chars/jack_full.png', parts: 'assets/chars/jack_parts.png', height: 1.55, face: 1 },
  },

  /* ------------------------------------------------------------- 열차 그림
     top = 위에서 본 그림, side = 옆에서 본 그림 (오른쪽이 앞). 같은 이름으로 덮어쓰면 자동 적용 */
  trainArt: {
    engine: { top: 'assets/train/train_engine_top.png', side: 'assets/train/train_engine_side.png' },
    gun: { top: 'assets/train/car_gun_top.png', side: 'assets/train/car_gun_side.png' },
    flame: { top: 'assets/train/car_flame_top.png', side: 'assets/train/car_flame_side.png' },
    tesla: { top: 'assets/train/car_tesla_top.png', side: 'assets/train/car_tesla_side.png' },
    drone: { top: 'assets/train/car_drone_top.png', side: 'assets/train/car_drone_side.png' },
    cannon: { top: 'assets/train/car_cannon_top.png', side: 'assets/train/car_cannon_side.png' },
  },

  /* ------------------------------------------------------------- 실내 침입 전투
     bg = 열차 내부 배경, 나머지 = 포즈 3개짜리 그림 (생존자: 준비/휘두르기/맞음, 좀비: 걷기/공격/날아감) */
  fightArt: {
    bg: 'assets/fight/car_inside.png',
    jack: 'assets/fight/jack_fight.png',
    office: 'assets/fight/office_fight.png',
    box: 'assets/fight/box_fight.png',
  },
  invasion: {
    firstWave: 3,            // 몇 번째 웨이브부터 침입이 생기는지
    every: [25, 35],         // 침입 간격(초) 최소~최대
    count: [2, 3],           // 한 번에 들어오는 좀비 수
    dps: 1.2,                // 침입 좀비 1마리당 열차에 주는 초당 피해
    autoClear: 10,           // 이 시간(초) 동안 안 싸우면 생존자들이 알아서 쫓아냄 (보상 없음)
    fightTime: 12,           // 실내 전투 제한 시간
    hitsToKill: { office: 2, box: 3 },  // 좀비별 필요한 타격 수
    reward: { gold: 6, ult: 0.25, heal: 0.05 },  // 격퇴 보상 (골드, 필살기 충전, 체력 회복 비율)
    failDamage: 0.06,        // 실패 시 열차 최대체력 대비 피해
  },

  /* ------------------------------------------------------------ 인트로 (게임 첫 실행 시)
     storyCaption: 이미지 아래에 글자를 표시할지 (그림 안에 글자가 이미 있으면 false) */
  storyCaption: true,
  story: [
    { img: 0, text: '인류의 실수, 바이러스 유출...' },
    { img: 1, text: '출근길 직장인들이 전부 좀비가 되었다...' },
    { img: 2, text: '달리는 열차만이 마지막 희망! (정시 도착 필수)' },
  ],

  /* ------------------------------------------------------------- 생존자 (열차 위 사수 + 대화 캐릭터) */
  survivors: [
    { name: '잭', art: 'jack', portrait: 'assets/portraits/survivor1.png', jacket: '#2b3a55', helmet: '#ff5a36', skin: '#c99872' },
    { name: '민호', art: 'jack', portrait: 'assets/portraits/survivor2.png', jacket: '#4a3b2f', helmet: '#29c7ff', skin: '#e0b48e' },
    { name: '소피', art: 'jack', portrait: 'assets/portraits/survivor3.png', jacket: '#5a2f45', helmet: '#ffd400', skin: '#f2c7a0' },
  ],

  /* ------------------------------------------------------------- 열차 */
  train: {
    baseHp: 700,
    colors: { body: '#a99b77', dark: '#2f3238', trim: '#6e6450', wood: '#7a5236', stripe: '#ffc400', window: '#9fe6ff' },
  },

  /* ------------------------------------------------------------- 좀비
     hp=체력, speed=이동속도, dps=열차에 붙었을 때 초당 피해, xp=경험치, gold=처치 골드(소수 가능) */
  zombies: {
    office: { name: '지각한 직장인', art: 'office', hp: 14, speed: 6.4, dps: 1.25, xp: 1, gold: 0.08, scale: 1.0, mass: 1,
      colors: { skin: '#8fd05a', shirt: '#eef1f6', pants: '#2d3446', tie: '#d62839', toast: '#e9b872', bag: '#4a3222', eye: '#ffffff', pupil: '#111111' } },
    box: { name: '택배 왔습니다', art: 'box', hp: 12, armor: 22, speed: 4.6, dps: 1.5, xp: 2, gold: 0.1, scale: 1.0, mass: 1.2,
      colors: { skin: '#9ad466', shirt: '#3f6aa8', pants: '#33302a', box: '#c08a57', tape: '#e8d5a8', cap: '#2c5aa0', eye: '#ffffff', pupil: '#111111' } },
    dancer: { name: '킹받는 댄서', hp: 20, speed: 5.6, dps: 2.1, xp: 3, gold: 0.15, scale: 1.0, mass: 0.9, jumper: true,
      colors: { skin: '#86c95a', shirt: '#b04fe0', pants: '#ffffff', hair: '#2a1a10', eye: '#ffffff', pupil: '#111111' } },
    riot: { name: '방패 든 경찰 좀비', hp: 70, speed: 3.6, dps: 3.4, xp: 6, gold: 0.3, scale: 1.35, mass: 3,
      colors: { skin: '#7fbf55', shirt: '#24324f', pants: '#1b2236', helmet: '#141b2b', visor: '#7fc8ff', shield: '#b8c4d4', eye: '#ffffff', pupil: '#111111' } },
    bomber: { name: '회식 끝난 과장', art: 'bomber', hp: 26, speed: 4.0, dps: 0, xp: 3, gold: 0.15, scale: 1.15, mass: 1.6,
      boom: { radius: 4.0, dmgZombie: 25, dmgTrain: 14 },   // 터질 때: 주변 좀비 피해 / 열차에 닿아 터지면 열차 피해
      colors: { skin: '#a7d86a', shirt: '#f0e6d0', pants: '#3a3a44', belly: '#c6f08a', tie: '#2e7d32', cheek: '#ff7b9c', eye: '#ffffff', pupil: '#111111' } },
  },

  /* ------------------------------------------------------------- 보스 (model: spider=거미형, giant=거대 인간형) */
  bosses: {
    bujang: { model: 'spider', name: '변이 거미 부장님', hp: 1600, speed: 2.4, dps: 15, xp: 60, gold: 40, scale: 3.0, summon: 'office',
      colors: { body: '#7a9a4a', spots: '#a3507d', skin: '#8fd05a', leg: '#5d3b6e', eye: '#ff2a2a', tie: '#1d3fbf' } },
    gwajang: { model: 'giant', base: 'office', art: 'office', name: '거대 과장님 (야근 47일째)', hp: 2200, speed: 2.0, dps: 18, xp: 70, gold: 50, scale: 4.2, summon: 'bomber',
      colors: { skin: '#7cc94e', shirt: '#dfe6ee', pants: '#2d3446', tie: '#8e24aa', toast: '#e9b872', bag: '#4a3222', eye: '#ffffff', pupil: '#ff2222' } },
    isa: { model: 'spider', name: '독거미 이사님', hp: 2600, speed: 2.8, dps: 20, xp: 80, gold: 60, scale: 3.3, summon: 'dancer',
      colors: { body: '#5a3a7a', spots: '#ffcf3a', skin: '#9a7ad8', leg: '#2a1a3a', eye: '#3dff6b', tie: '#ffcf3a' } },
    ceo: { model: 'giant', base: 'office', crown: true, art: 'bomber', artTint: [1, 0.85, 0.7], name: '좀비 사장님 (최종 보스)', hp: 4200, speed: 1.8, dps: 26, xp: 150, gold: 120, scale: 5.0, summon: 'riot',
      colors: { skin: '#6fb64a', shirt: '#1d1d24', pants: '#1d1d24', tie: '#ffcf3a', toast: '#ffd700', bag: '#7a5a20', eye: '#ffffff', pupil: '#ff2222' } },
  },

  /* ------------------------------------------------------------- 무기 (레벨업으로 획득, Lv1~5, Lv5는 '진화')
     배열은 [Lv1, Lv2, Lv3, Lv4, Lv5] 순서 */
  weapons: {
    mg: { name: '뚫어뻥 기관총', evoName: '황금 뚫어뻥 개틀링', icon: 'assets/icons/machinegun.png', car: 'gun',
      desc: ['생존자들이 뚫어뻥 탄을 연사', '사수 +1명 합류', '피해 증가, 관통 +1', '연사 속도 증가', '진화! 황금 개틀링 난사'],
      dmg: [10, 12, 14, 16, 20], rate: [0.30, 0.27, 0.24, 0.21, 0.15], shooters: [2, 3, 3, 3, 3], pierce: [0, 0, 1, 1, 2], range: 34 },
    flame: { name: '화염방사 칸', evoName: '플레임 스톰', icon: 'assets/icons/flamethrower.png', evoIcon: 'assets/icons/flame.png', car: 'flame',
      desc: ['열차 양옆으로 화염 분사', '화염 피해 증가', '사거리 증가', '피해 대폭 증가', '진화! 바닥에 불바다를 남김'],
      dps: [22, 28, 36, 44, 60], range: [9, 10, 11.5, 12.5, 15] },
    tesla: { name: '테슬라 코일', evoName: '테슬라 체인 스톰', icon: 'assets/icons/coil.png', evoIcon: 'assets/icons/tesla.png', car: 'tesla',
      desc: ['번개가 좀비 사이를 연쇄', '연쇄 수 증가', '피해 증가', '발동 속도 증가', '진화! 번개가 두 줄기로'],
      cd: [2.0, 1.8, 1.6, 1.4, 1.0], chains: [8, 10, 12, 14, 20], dmg: [30, 36, 44, 52, 66], range: 22 },
    drone: { name: '드론 폭탄', evoName: '드론 편대 폭격', icon: 'assets/icons/drone.png', car: 'drone',
      desc: ['드론이 좀비 떼에 폭탄 투하', '폭발 피해 증가', '드론 +1', '폭발 범위 증가', '진화! 드론 4대 편대'],
      drones: [1, 1, 2, 2, 4], cd: [2.0, 1.8, 1.7, 1.5, 1.1], dmg: [55, 65, 75, 85, 100], radius: [3.6, 3.9, 4.2, 4.7, 5.4] },
    cannon: { name: '캐논 터렛', evoName: '쌍열 캐논', icon: 'assets/icons/turret.png', car: 'cannon',
      desc: ['강력한 포탄으로 범위 피해', '피해 증가', '폭발 범위 증가', '연사 속도 증가', '진화! 포신 2개'],
      rate: [1.0, 0.9, 0.8, 0.7, 0.45], dmg: [60, 75, 90, 105, 130], splash: [3.0, 3.3, 3.6, 4.0, 4.6], range: 40 },
    barrel: { name: '드럼통 낙하', evoName: '드럼통 비', icon: 'assets/icons/barrel.png', car: null,
      desc: ['하늘에서 폭발 드럼통 낙하', '피해 증가', '드럼통 +1', '폭발 범위 증가', '진화! 드럼통 4개 연속 낙하'],
      cd: [5.5, 5.0, 5.0, 4.5, 3.2], count: [1, 1, 2, 2, 4], dmg: [70, 85, 100, 115, 145], radius: [4.2, 4.5, 4.8, 5.4, 6.2] },
  },

  /* ------------------------------------------------------------- 패시브 (Lv1~5) */
  passives: {
    power: { name: '근육 단백질', icon: '💪', desc: '모든 피해 +12%', per: 0.12 },
    haste: { name: '에너지 드링크', icon: '⚡', desc: '공격·쿨타임 속도 +8%', per: 0.08 },
    armor: { name: '덕테이프 장갑', icon: '🛡️', desc: '열차 최대 체력 +15%, 30% 회복', per: 0.15 },
    magnet: { name: '냉장고 자석', icon: '🧲', desc: '경험치 흡수 범위 +35%', per: 0.35 },
    crit: { name: '럭키 양말', icon: '🧦', desc: '치명타 확률 +8% (피해 2배)', per: 0.08 },
    greed: { name: '부장님 법카', icon: '💳', desc: '골드 획득 +20%', per: 0.20 },
  },

  /* ------------------------------------------------------------- 레벨업 */
  xpNeed: function (lv) { return Math.floor(5 + lv * 4 + lv * lv * 0.4); },
  magnetRange: 7,

  /* ------------------------------------------------------------- 필살기 / 비상 경적 */
  ultimate: { name: '대파 폭격', killsToCharge: 120, count: 6, dmg: 260, radius: 7.5 },
  // 비상 경적 (수동 버튼): 열차 주변 좀비를 밀쳐내고 기절시킴
  horn: { name: '비상 경적', cd: 35, radius: 8, force: 16, dmg: 20, stun: 1.2, shield: 2 },
  emergency: { hpRatio: 0.3, shieldTime: 8 },  // 체력 30% 이하 → 자동 방어막 (판당 1회)

  /* ------------------------------------------------------------- 로비 영구 강화 (골드로 구매)
     레벨당 효과는 아주 작게, 대신 단계가 많음. 가격 = costBase × costGrow^현재레벨 */
  meta: {
    hp: { name: '열차 장갑판', icon: '🛡️', desc: '열차 체력 +12', per: 12, max: 30, costBase: 60, costGrow: 1.13 },
    dmg: { name: '사격 훈련', icon: '🎯', desc: '모든 피해 +1.5%', per: 0.015, max: 30, costBase: 80, costGrow: 1.14 },
    xp: { name: '야간 자율학습', icon: '📚', desc: '경험치 +2%', per: 0.02, max: 20, costBase: 70, costGrow: 1.14 },
    magnet: { name: '자석 코팅', icon: '🧲', desc: '경험치 흡수 범위 +3%', per: 0.03, max: 20, costBase: 50, costGrow: 1.12 },
  },

  /* ------------------------------------------------------------- 스테이지 & 웨이브
     time=웨이브 시간(초), rate=초당 기본 스폰 수, hordes=좀비 떼 러시 횟수, hordeSize=러시 규모
     mix=좀비 비율, hp=체력 배수, boss=보스 이름(bosses 안의 키), bossHp=보스 체력 배수
     intro/outro: 스테이지 시작/클리어 대화 (who = survivors 순서 0,1,2) */
  stages: [
    {
      id: 'desert', name: '황폐한 사막 협곡', desc: '탁 트인 사막. 사방에서 몰려오는 좀비를 시원하게 쓸어버리자!',
      thumb: 'assets/stages/stage1.jpg', clearGold: 150,
      intro: [
        { who: 0, text: '여기는 둠스데이 익스프레스. 목적지는 지하 연구소, 백신이 거기 있다.' },
        { who: 1, text: '근데 형... 왜 무기가 전부 뚫어뻥이에요?' },
        { who: 2, text: '마지막까지 문 연 가게가 철물점이었거든.' },
        { who: 0, text: '전원 배치! 출근 시간이다!!' },
      ],
      outro: [
        { who: 2, text: '거미 부장님 처치 완료... 근데 저 넥타이, 우리 회사 거 아니야?' },
        { who: 1, text: '앞에 도시가 보여요. 월요일 아침의 도시...' },
      ],
      theme: {
        skyTop: '#f3b06b', skyBottom: '#f7d49b', fog: '#efc08a', fogNear: 55, fogFar: 150,
        light: [0.5, 0.9, 0.3], sky: '#fff1d6', ground: '#a8714a', ambient: 0.45,
        groundCol: '#d9a066', ballast: '#8b6a4f', sleeper: '#5b4636', rail: '#aab2bf',
        props: 'desert', weather: 'dust', rock: ['#c27a45', '#b06a3a', '#d48b52', '#9e5d33'], plant: '#5f8f3a',
      },
      waves: [
        { time: 24, rate: 2.2, hordes: 1, hordeSize: 20, mix: { office: 1 }, hp: 1.0 },
        { time: 28, rate: 2.8, hordes: 1, hordeSize: 26, mix: { office: 0.8, box: 0.2 }, hp: 1.1 },
        { time: 30, rate: 3.2, hordes: 2, hordeSize: 30, mix: { office: 0.7, box: 0.2, dancer: 0.1 }, hp: 1.2 },
        { time: 34, rate: 3.8, hordes: 2, hordeSize: 38, mix: { office: 0.6, box: 0.2, dancer: 0.12, bomber: 0.08 }, hp: 1.55 },
        { time: 30, rate: 2.6, hordes: 1, hordeSize: 30, mix: { office: 0.7, box: 0.3 }, hp: 1.72, boss: 'bujang', bossHp: 1.0 },
        { time: 34, rate: 4.4, hordes: 2, hordeSize: 46, mix: { office: 0.5, box: 0.25, dancer: 0.12, riot: 0.06, bomber: 0.07 }, hp: 2.15 },
        { time: 38, rate: 5.0, hordes: 3, hordeSize: 50, mix: { office: 0.5, box: 0.2, dancer: 0.15, riot: 0.08, bomber: 0.07 }, hp: 2.46 },
        { time: 40, rate: 5.6, hordes: 3, hordeSize: 58, mix: { office: 0.45, box: 0.2, dancer: 0.15, riot: 0.12, bomber: 0.08 }, hp: 2.85 },
        { time: 42, rate: 6.2, hordes: 3, hordeSize: 66, mix: { office: 0.42, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.08 }, hp: 3.22 },
        { time: 40, rate: 4.0, hordes: 2, hordeSize: 50, mix: { office: 0.5, box: 0.2, dancer: 0.15, riot: 0.15 }, hp: 3.54, boss: 'bujang', bossHp: 2.6 },
      ],
    },
    {
      id: 'city', name: '붕괴된 대도시', desc: '비 내리는 폐허 도심. 빌딩 위에서 댄서들이 뛰어내린다!',
      thumb: 'assets/stages/stage2.jpg', clearGold: 220,
      intro: [
        { who: 1, text: '도심이다... 저 사람들 전부 우리 회사 사람들이에요.' },
        { who: 0, text: '월요일 아침 9시. 가장 위험한 시간대지.' },
        { who: 2, text: '빌딩 위를 봐! 댄서들이 뛰어내린다! 머리 조심!' },
        { who: 1, text: '저 배 나온 분은... 회식 끝난 과장님이다! 가까이 오면 터져요!' },
      ],
      outro: [
        { who: 0, text: '과장님... 편히 퇴근하세요.' },
        { who: 2, text: '다음은 협곡 철교야. 낡아서 언제 무너질지 몰라.' },
      ],
      theme: {
        skyTop: '#1d2448', skyBottom: '#6a3f6e', fog: '#4a3a62', fogNear: 50, fogFar: 150,
        light: [0.35, 0.85, 0.45], sky: '#c9d2ff', ground: '#5a4a6a', ambient: 0.62,
        groundCol: '#565a68', ballast: '#3c3f4a', sleeper: '#3d3027', rail: '#9aa3b2',
        props: 'city', weather: 'rain', spriteTint: [0.85, 0.85, 0.97], building: ['#5a6378', '#66708a', '#525a6e', '#6a5a78', '#586868'], neon: ['#ff4fa3', '#3df2ff', '#ffd23d', '#7dff6b'],
      },
      waves: [
        { time: 26, rate: 3.0, hordes: 1, hordeSize: 30, mix: { office: 0.8, box: 0.2 }, hp: 1.3 },
        { time: 30, rate: 3.6, hordes: 2, hordeSize: 36, mix: { office: 0.6, box: 0.2, dancer: 0.12, bomber: 0.08 }, hp: 1.5 },
        { time: 32, rate: 4.2, hordes: 2, hordeSize: 42, mix: { office: 0.5, box: 0.2, dancer: 0.18, riot: 0.05, bomber: 0.07 }, hp: 1.75 },
        { time: 36, rate: 4.8, hordes: 2, hordeSize: 50, mix: { office: 0.45, box: 0.2, dancer: 0.2, riot: 0.08, bomber: 0.07 }, hp: 2.2 },
        { time: 30, rate: 3.4, hordes: 2, hordeSize: 40, mix: { office: 0.55, box: 0.2, dancer: 0.15, bomber: 0.1 }, hp: 2.35, boss: 'bujang', bossHp: 1.6 },
        { time: 36, rate: 5.4, hordes: 3, hordeSize: 56, mix: { office: 0.4, box: 0.2, dancer: 0.2, riot: 0.12, bomber: 0.08 }, hp: 2.7 },
        { time: 40, rate: 6.0, hordes: 3, hordeSize: 62, mix: { office: 0.4, box: 0.2, dancer: 0.17, riot: 0.15, bomber: 0.08 }, hp: 3.0 },
        { time: 42, rate: 6.6, hordes: 3, hordeSize: 70, mix: { office: 0.36, box: 0.2, dancer: 0.18, riot: 0.18, bomber: 0.08 }, hp: 3.35 },
        { time: 44, rate: 7.2, hordes: 4, hordeSize: 76, mix: { office: 0.36, box: 0.2, dancer: 0.18, riot: 0.18, bomber: 0.08 }, hp: 3.8 },
        { time: 40, rate: 5.0, hordes: 3, hordeSize: 60, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 4.25, boss: 'gwajang', bossHp: 2.6 },
      ],
    },
    {
      id: 'bridge', name: '아슬아슬 협곡 철교', desc: '발밑은 천 길 낭떠러지. 좀비들이 다리 밑에서 기어 올라온다! (밀어서 떨어뜨리기 가능)',
      thumb: 'assets/stages/stage3.jpg', clearGold: 300,
      intro: [
        { who: 2, text: '낡은 철교야. 떨어지면 그대로 끝이야.' },
        { who: 1, text: '형! 좀비들이 다리 난간을 타고 기어 올라와요!' },
        { who: 0, text: '폭발로 날려버려. 다리 밖으로 밀면 알아서 떨어진다.' },
        { who: 2, text: '...방금 떨어진 거 이사님 아니었어?' },
      ],
      outro: [
        { who: 0, text: '이사님까지 정리됐군. 이제 남은 건 터널뿐이다.' },
        { who: 1, text: '터널 끝에 연구소가 있대요. 그리고... 사장실도요.' },
      ],
      theme: {
        skyTop: '#7fb2e5', skyBottom: '#f2d6b3', fog: '#c9c6c9', fogNear: 60, fogFar: 170,
        light: [0.4, 0.9, 0.35], sky: '#eef6ff', ground: '#6a6a7a', ambient: 0.5,
        groundCol: '#4a5560', ballast: '#5d636e', sleeper: '#4a3a2e', rail: '#b3bccb',
        props: 'bridge', weather: 'wind', deck: [-11, 4], river: '#3f7fb0', cliff: ['#8a6a52', '#9a7a5a', '#7a5a46', '#a88a6a'], steel: '#8a4a3a',
      },
      waves: [
        { time: 26, rate: 3.2, hordes: 1, hordeSize: 32, mix: { office: 0.75, box: 0.25 }, hp: 1.3 },
        { time: 30, rate: 3.8, hordes: 2, hordeSize: 38, mix: { office: 0.55, box: 0.2, dancer: 0.15, bomber: 0.1 }, hp: 1.55 },
        { time: 32, rate: 4.4, hordes: 2, hordeSize: 44, mix: { office: 0.5, box: 0.2, dancer: 0.15, riot: 0.08, bomber: 0.07 }, hp: 1.85 },
        { time: 36, rate: 5.0, hordes: 2, hordeSize: 52, mix: { office: 0.45, box: 0.2, dancer: 0.17, riot: 0.1, bomber: 0.08 }, hp: 2.3 },
        { time: 30, rate: 3.6, hordes: 2, hordeSize: 42, mix: { office: 0.55, box: 0.2, dancer: 0.15, bomber: 0.1 }, hp: 3.1, boss: 'gwajang', bossHp: 1.6 },
        { time: 36, rate: 5.6, hordes: 3, hordeSize: 58, mix: { office: 0.4, box: 0.2, dancer: 0.18, riot: 0.14, bomber: 0.08 }, hp: 3.5 },
        { time: 40, rate: 6.2, hordes: 3, hordeSize: 64, mix: { office: 0.38, box: 0.2, dancer: 0.18, riot: 0.16, bomber: 0.08 }, hp: 3.9 },
        { time: 42, rate: 6.8, hordes: 3, hordeSize: 72, mix: { office: 0.35, box: 0.2, dancer: 0.18, riot: 0.18, bomber: 0.09 }, hp: 4.4 },
        { time: 44, rate: 7.4, hordes: 4, hordeSize: 78, mix: { office: 0.35, box: 0.2, dancer: 0.18, riot: 0.18, bomber: 0.09 }, hp: 4.9 },
        { time: 40, rate: 5.2, hordes: 3, hordeSize: 62, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 5.4, boss: 'isa', bossHp: 2.4 },
      ],
    },
    {
      id: 'tunnel', name: '암흑 터널 & 지하 연구소', desc: '비상등만 깜빡이는 마지막 구간. 끝에서 최종 보스가 기다린다.',
      thumb: 'assets/stages/stage4.jpg', clearGold: 450,
      intro: [
        { who: 0, text: '터널이다. 비상등만 믿고 간다.' },
        { who: 2, text: '무전이 잡혀... "백신은... 사장실 금고에... 있다..."' },
        { who: 1, text: '결국 사장님 만나러 가는 거네요...' },
        { who: 0, text: '정시 퇴근을 위해서라면, 뭐든 한다!!' },
      ],
      outro: [
        { who: 2, text: '백신 확보!! 우리가 해냈어!' },
        { who: 1, text: '근데 형... 오늘 아직 월요일이에요.' },
        { who: 0, text: '...내일도 출근이다. 열차 정비해 둬.' },
      ],
      theme: {
        skyTop: '#0a0a12', skyBottom: '#2a0e14', fog: '#1a0e12', fogNear: 35, fogFar: 120,
        light: [0.3, 0.9, 0.5], sky: '#ffb0a0', ground: '#2a1a20', ambient: 0.55,
        groundCol: '#2e2b30', ballast: '#242226', sleeper: '#3a2e26', rail: '#8a8f9a',
        props: 'tunnel', weather: 'sparks', spriteTint: [0.85, 0.74, 0.76], walls: [-12.5, 5.5], wall: '#3a3840', alarm: '#ff2a2a',
      },
      waves: [
        { time: 26, rate: 3.4, hordes: 1, hordeSize: 34, mix: { office: 0.7, box: 0.2, bomber: 0.1 }, hp: 1.5 },
        { time: 30, rate: 4.0, hordes: 2, hordeSize: 40, mix: { office: 0.5, box: 0.2, dancer: 0.15, bomber: 0.15 }, hp: 1.8 },
        { time: 32, rate: 4.6, hordes: 2, hordeSize: 46, mix: { office: 0.45, box: 0.2, dancer: 0.15, riot: 0.1, bomber: 0.1 }, hp: 2.15 },
        { time: 36, rate: 5.2, hordes: 3, hordeSize: 52, mix: { office: 0.4, box: 0.2, dancer: 0.17, riot: 0.13, bomber: 0.1 }, hp: 2.7 },
        { time: 30, rate: 3.8, hordes: 2, hordeSize: 44, mix: { office: 0.5, box: 0.2, dancer: 0.15, bomber: 0.15 }, hp: 4.1, boss: 'isa', bossHp: 1.8 },
        { time: 36, rate: 5.8, hordes: 3, hordeSize: 60, mix: { office: 0.38, box: 0.2, dancer: 0.17, riot: 0.15, bomber: 0.1 }, hp: 4.6 },
        { time: 40, rate: 6.4, hordes: 3, hordeSize: 66, mix: { office: 0.36, box: 0.2, dancer: 0.17, riot: 0.17, bomber: 0.1 }, hp: 5.1 },
        { time: 42, rate: 7.0, hordes: 4, hordeSize: 72, mix: { office: 0.34, box: 0.2, dancer: 0.18, riot: 0.18, bomber: 0.1 }, hp: 5.7 },
        { time: 44, rate: 7.6, hordes: 4, hordeSize: 80, mix: { office: 0.34, box: 0.2, dancer: 0.18, riot: 0.18, bomber: 0.1 }, hp: 6.3 },
        { time: 40, rate: 5.4, hordes: 3, hordeSize: 64, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 7.0, boss: 'ceo', bossHp: 2.2 },
      ],
    },
  ],

  /* ------------------------------------------------------------- 엔딩 (마지막 스테이지 클리어 후) */
  ending: { title: 'THE END...?', sub: '백신은 확보했다. 하지만 내일도 출근이다.', thanks: '플레이해 주셔서 감사합니다!' },

  /* ------------------------------------------------------------- 문구 */
  texts: {
    killPops: ['퍽!', '콰직!', '꽥!', '뿅!', '퇴근!', '으악 지각!', '반차!'],
    waveSubs: ['지각한 직장인들이 몰려온다!', '택배 왔습니다~ (열차 위 배송)', '킹받는 댄서 출몰 주의', '월요일 아침 8시 59분', '오늘도 출근길은 전쟁이다'],
    hordeAlert: '좀비 떼 접근!!',
    bossAlert: 'WARNING · 보스 출현',
    emergency: '비상 장갑 작동!',
    defeat: '열차가 멈췄다...',
    defeatSub: '오늘도 지각 확정',
    victory: 'STAGE CLEAR!',
    victorySub: '정시 도착 성공 (기적)',
    bomberPops: ['꺼억~', '회식 2차!', '부장님 건배!'],
  },
};
