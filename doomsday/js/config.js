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
    version: 'v0.17',
    unlockAllStages: true,      // 테스트용: true면 모든 스테이지 바로 플레이 가능 (출시 때 false)
    maxZombies: 320,            // 동시에 존재 가능한 최대 좀비 수 (폰이 느리면 줄이기)
    maxZombiesLow: 160,         // '저사양 모드'일 때 최대 좀비 수
    trainSpeed: 16,             // 열차 속도 (배경이 흘러가는 속도)
    artVersion: 'a1',           // 그림을 바꾸면 이 값을 올리고 _dev/bake.js 다시 실행 (안 맞으면 느린 방식으로 자동 전환)
    timeScale: 0.82,            // 게임 전체 속도 (1 = 원래, 낮을수록 느리고 글을 읽을 여유)
    textLife: 1.5,              // 화면 글자·알림이 떠 있는 시간 배율
    startGold: 100,             // 처음 시작할 때 주는 골드
  },

  /* ------------------------------------------------------------- 카메라 (인게임 원/근 전환)
     back=열차 뒤 거리, height=높이, grow=열차가 길어질 때 더 멀어지는 정도, aim/ahead=바라보는 지점, fov=화각 */
  camera: {
    far: { label: '원거리', back: 14, backGrow: 0.4, height: 18, grow: 0.35, aim: 0.6, ahead: 4, fov: 50 },
    near: { label: '근거리', back: 7, backGrow: 0.15, height: 12, grow: 0.15, aim: 0.15, ahead: 12, fov: 56 },   // 열차 뒤 위에서 앞을 내다보는 추격 시점
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
    // 보스 등장 직전 '보급 받기' (선택형 광고). perRun = 한 판에 몇 번까지, finalOnly = 마지막 보스 직전에만 (true면 1번)
    bossSupply: { on: true, perRun: 1, finalOnly: true, askBelow: 0.9, heal: 0.25, ult: false, shield: 3 },  // askBelow = 열차 체력이 이 비율 미만일 때만 물어봄
    // ★ 광고 단위 ID: 위챗/더우인 관리자 화면에서 받은 '보상형 영상 광고' ID를 넣으세요. 비어 있으면 2초 테스트 광고.
    unit: { wx: '', tt: '' },
  },

  /* -------------------------------------------------------------- 이미지
     파일을 같은 이름으로 덮어쓰면 자동 적용. 파일이 없으면 기본 디자인으로 표시됨. */
  assets: {
    ui: {
      logo: 'assets/ui/logo.png',              // 로비 상단 로고 (한국어, 투명 PNG)
      logoZh: 'assets/ui/logo_zh.png',         // 로비 상단 로고 (중국어)
      lobbyBg: 'assets/ui/lobby_bg.jpg',       // 로비 배경 (1080x1920) — 넣으면 3D 대신 그림 표시
      startButton: 'assets/ui/btn_start.png',  // 출발 버튼 (600x180)
      cardFrame: 'assets/ui/card_frame.png',   // 레벨업 카드 배경 (600x220)
      resultBg: 'assets/ui/result_bg.jpg',     // 결과 화면 배경
      ultimate: 'assets/ui/ultimate.png',      // 필살기(대파 폭격) 버튼 (256x256)
      horn: 'assets/ui/horn.png',              // 비상 경적 버튼 (256x256)
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
    jack: { full: 'assets/chars/jack_full.png', height: 1.55, face: 1 },   // 생존자 동작 그림 전체: assets/chars/jack, minho, sophie 폴더 (각 동작 4컷)
    dancer: { full: 'assets/chars/dancer_full.png', parts: 'assets/chars/dancer_parts.png', height: 2.6, face: 1 },
    riot: { full: 'assets/chars/riot_full.png', parts: 'assets/chars/riot_parts.png', height: 2.4, face: 1 },
    bujang: { full: 'assets/chars/bujang_full.png', height: 2.6, face: 1 },   // 거미 보스
    isa: { full: 'assets/chars/isa_full.png', height: 2.8, face: 1 },
    ceo: { full: 'assets/chars/ceo_full.png', height: 2.7, face: 1 },
    minho: { full: 'assets/chars/minho_back.png', height: 1.55, face: 1 },    // 지붕 사수 (뒷모습)
    sophie: { full: 'assets/chars/sophie_back.png', height: 1.55, face: 1 },
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
    // ↓ 새 칸 (그림 파일이 없으면 기관총 칸 그림 + 아래 carTint 색으로 대신 그림)
    water: { top: 'assets/train/car_water_top.png', side: 'assets/train/car_water_side.png' },
    freeze: { top: 'assets/train/car_freeze_top.png', side: 'assets/train/car_freeze_side.png' },
    fan: { top: 'assets/train/car_fan_top.png', side: 'assets/train/car_fan_side.png' },
    safe: { top: 'assets/train/car_safe_top.png', side: 'assets/train/car_safe_side.png', sideFallback: 'assets/train/extra/car_safe_a.png' },
  },
  carTint: { water: [0.7, 0.88, 1.25], freeze: [0.85, 1.0, 1.3], fan: [0.85, 1.12, 0.85], safe: [1.0, 1.08, 0.9] },

  /* ------------------------------------------------------------- 실내 침입 전투
     bg = 열차 내부 배경, 나머지 = 포즈 3개짜리 그림 (생존자: 준비/휘두르기/맞음, 좀비: 걷기/공격/날아감) */
  fightArt: {
    bg: 'assets/fight/car_inside.png',
    jack: 'assets/fight/jack_fight.png',
    office: 'assets/fight/office_fight.png',
    box: 'assets/fight/box_fight.png',
    bgEngine: 'assets/fight/engine_inside.png',   // 기관실 배경
    bgRoof: 'assets/fight/roof.jpg',              // 열차 지붕 배경
    minho: 'assets/fight/minho_fight.png',        // 생존자 포즈 3개 (준비/휘두르기/맞음, 오른쪽 보기)
    sophie: 'assets/fight/sophie_fight.png',
    dancer: 'assets/fight/dancer_fight.png',      // 좀비 포즈 3개 (걷기/공격/날아감, 왼쪽 보기)
    riot: 'assets/fight/riot_fight.png',          // 경찰: 가운데(공격) 포즈 = 방패 열린 모습
  },
  // 효과 그림 (게임 화면의 폭발·연기·불꽃·번개 등). 이름: 파일
  fxArt: {
    explosion: 'assets/fx/explosion.png', smoke: 'assets/fx/smoke.png', fireball: 'assets/fx/fireball.png', lightning: 'assets/fx/lightning.png',
    muzzle: 'assets/fx/muzzle.png', sonic: 'assets/fx/sonic.png', iceburst: 'assets/fx/iceburst.png', cloud_teal: 'assets/fx/cloud_teal.png',
    cloud_pink: 'assets/fx/cloud_pink.png', crate: 'assets/fx/crate.png', barrel: 'assets/fx/barrel.png', drone: 'assets/fx/drone.png',
    // ↓ 새 효과 (없으면 코드 효과로 대신): 물줄기·회오리·얼음 가시·수증기
    water: 'assets/fx/water.png', tornado: 'assets/fx/tornado.png', freeze: 'assets/fx/freeze.png', steam: 'assets/fx/steam.png',
  },
  // 프레임 애니메이션 그림 (assets/chars/anim/이름_키.png). w0~w3 = 걷기 4컷, a0 = 준비, a1 = 공격, a2 = 맞음, a3 = 쓰러짐
  // h = 걷기 첫 컷 대비 높이 비율 (자동 계산값)
  anim: {office: {w0: 1.0, w1: 1.021, w2: 0.949, w3: 0.99, a0: 0.786, a1: 0.838, a2: 0.91, a3: 0.791}, box: {w0: 1.0, w1: 1.052, w2: 1.033, w3: 1.036, a0: 0.857, a1: 0.95, a2: 0.96, a3: 0.86}, bomber: {w0: 1.0, w1: 0.995, w2: 0.949, w3: 0.986, a0: 0.804, a1: 0.928, a2: 0.93, a3: 0.817}, dancer: {w0: 1.0, w1: 1.018, w2: 0.977, w3: 1.013, a0: 0.879, a1: 0.97, a2: 0.962, a3: 0.862}, riot: {w0: 1.0, w1: 1.012, w2: 0.996, w3: 1.0, a0: 0.905, a1: 0.947, a2: 0.988, a3: 0.935}, bujang: {a0: 1.0, a1: 1.0, a2: 0.929, a3: 0.993}, isa: {a0: 1.0, a1: 1.017, a2: 0.971, a3: 0.998}, ceo: {a0: 1.0, a1: 0.99, a2: 0.948, a3: 1.132}},
  // 길가 소품 그림 (배경에 흩어 놓는 물건). 이름: 파일
  propArt: {
    wreck1: 'assets/props/wreck1.png', wreck2: 'assets/props/wreck2.png', police1: 'assets/props/police1.png', police2: 'assets/props/police2.png',
    crate: 'assets/props/crate.png', box: 'assets/props/box.png', sandbag: 'assets/props/sandbag.png', gas: 'assets/props/gas.png',
    barrel_siren: 'assets/props/barrel_siren.png', spikes: 'assets/props/spikes.png', bomber: 'assets/props/bomber.png',
    billboard: 'assets/props/billboard.png', watertower: 'assets/props/watertower.png', watchtower: 'assets/props/watchtower.png', barricade: 'assets/props/barricade.png',
    supplies: 'assets/props/supplies.png', jersey: 'assets/props/jersey.png', lamp_rest: 'assets/props/lamp_rest.png', shelter_rest: 'assets/props/shelter_rest.png',
    mapboard: 'assets/props/mapboard.png', vending: 'assets/props/vending.png', foodcart: 'assets/props/foodcart.png', bikes: 'assets/props/bikes.png',
    shelter_city: 'assets/props/shelter_city.png', lamp_city: 'assets/props/lamp_city.png', traffic: 'assets/props/traffic.png', billboard_city: 'assets/props/billboard_city.png',
    cones: 'assets/props/cones.png', utilbox: 'assets/props/utilbox.png',
  },
  // 포즈 그림이 아직 없을 때 전신 그림 1장으로 대신 씀 (flip = 좌우 뒤집기)
  fightFallback: {
    minho: { src: 'assets/chars/minho_full.png', flip: false },
    sophie: { src: 'assets/chars/sophie_full.png', flip: false },
    dancer: { src: 'assets/chars/dancer_full.png', flip: true },
    riot: { src: 'assets/chars/riot_full.png', flip: true },
  },
  /* ------------------------------------------------------------- 미니게임 (웨이브 사이 이벤트, js/mini.js)
     byStage: 스테이지 순서대로 [몇 번째 웨이브 시작 전, 종류]. 종류 = parcel(택배 쳐내기) / golf(골프공 받아치기) / rescue(시민 구출)
     웨이브 번호는 1부터. 4·7번째는 보스라서 2·3·5·6 중에 넣기
     bg: 스테이지별 배경 그림 (없으면 휴게소), tint: 배경 색 덧칠
     reward: 결과(0~1 비율)에 곱해서 지급 — gold(×스테이지 배율), heal(열차 체력 비율), ult(필살기 충전) */
  minigame: {
    on: true,
    // 스토리: 장마다 1번, 중간보스 다음(5번째 웨이브 전). 다시 하기: pool 중 무작위(직전 것 제외)
    byStage: [
      [[5, 'gates']], [[5, 'rescue']], [[5, 'sniper']], [[5, 'parcel']],
      [[5, 'rescue']], [[5, 'boiler', { hard: true }]], [[5, 'sniper', { dark: true }]], [[5, 'golf']],
    ],
    pool: [['gates', 'boiler', 'rescue'], ['rescue', 'gates', 'parcel'], ['sniper', 'gates', 'rescue'], ['parcel', 'golf', 'gates'],
      ['gates', 'rescue', 'sniper'], ['boiler', 'gates', 'sniper'], ['sniper', 'gates', 'parcel'], ['golf', 'gates', 'parcel']],
    // 미니게임 시작 대사 (게임 설명 말고 사건으로)
    lines: { gates: '갈림길이다! 좋은 문을 골라 화력을 키워!', boiler: '열차가 멈췄다! 좀비가 다가온다!', rescue: '사람들이 쫓기고 있어! 업고 뛰어!', sniper: '옥상의 사람들이 위험해! 엄호해!', parcel: '택배 폭탄이 날아온다! 받아쳐!', golf: '사장님이 골프채를 들었다!', hack: '문 암호를 풀어야 해!' },
    bg: ['assets/story/ch1_side.jpg', 'assets/story/ch2_side.jpg', 'assets/story/ch3_side.jpg', 'assets/story/ch3_side.jpg', 'assets/story/ch1_side.jpg', 'assets/story/ch1_side.jpg', 'assets/story/ch3_side.jpg', 'assets/story/ch3_side.jpg'],
    tint: [null, null, null, 'rgba(160,40,140,0.28)', 'rgba(60,40,20,0.25)', 'rgba(170,200,255,0.45)', 'rgba(0,0,0,0.45)', 'rgba(20,120,40,0.3)'],
    reward: { gold: 60, goldPerStage: 0.35, heal: 0.15, ult: 0.35 },
  },

  /* ------------------------------------------------------------- 만화 컷 (챕터 시작 때 1번, 스테이지 id 별)
     칸 하나 = { who, text } 또는 { cap: '해설 문구' }. who: 0 잭 / 1 민호 / 2 소피 / 'n숫자' = 시민 얼굴(npc 목록 순서)
     bg: 배경 그림, pos: 배경에서 보여줄 가로 위치들(%), tint: 색 덧칠. 한 화면에 3칸씩 */
  // 얼굴 순서 = 그림 주문서 citizens_faces.png 순서. job = 안전 칸 보너스 (jobs 참고)
  comicNpc: [
    { name: '인턴 이하나', face: 'assets/npc/face_0.png', job: 'scout' }, { name: '택배기사 박씨', face: 'assets/npc/face_1.png', job: 'gold' },
    { name: '편의점 알바', face: 'assets/npc/face_2.png', job: 'gold' }, { name: '휴게소 요리사', face: 'assets/npc/face_3.png', job: 'cook' },
    { name: '바텐더', face: 'assets/npc/face_4.png', job: 'ult' }, { name: '정비공', face: 'assets/npc/face_5.png', job: 'mech' },
    { name: '청소부 아주머니', face: 'assets/npc/face_6.png', job: 'guard' }, { name: '경비원 할아버지', face: 'assets/npc/face_7.png', job: 'guard' },
    { name: '부장님 비서', face: 'assets/npc/face_8.png', job: 'crit' }, { name: '연구원', face: 'assets/npc/face_9.png', job: 'scout' },
    { name: '버스 기사', face: 'assets/npc/face_10.png', job: 'mech' }, { name: '회사원 아저씨', face: 'assets/npc/face_11.png', job: 'gold' },
  ],
  // 시민 직업 보너스 (1명당, 같은 직업 3명 이상이면 ×2)
  jobs: {
    cook: { name: '요리사', desc: '웨이브마다 체력 회복', heal: 0.03 },
    gold: { name: '골드', desc: '골드 +', gold: 0.05 },
    mech: { name: '정비공', desc: '쿨타임 감소', haste: 0.04 },
    guard: { name: '경비', desc: '침입 방어', inv: 0.15 },
    ult: { name: '바텐더', desc: '필살기 충전 +', ult: 0.08 },
    crit: { name: '비서', desc: '치명타 +', crit: 0.03 },
    scout: { name: '정찰', desc: '경험치 +', xp: 0.05 },
  },

  comics: {
    desert: { bg: 'assets/story/ch1_side.jpg', pos: [0, 100, 30, 70], panels: [
      { cap: '좀비 사태 3일째. 회사는 사라졌다. 하지만 출근은 계속된다.' },
      { who: 'n10', text: '이 열차... 아직 달릴 수 있어요! 운전은 제가 해 봤어요!' },
      { who: 0, text: '목적지는 지하 연구소. 백신이 거기 있다.' },
      { who: 1, text: '저 오늘 입사 첫날인데요... 왜 무기가 전부 뚫어뻥이에요?' },
      { who: 2, text: '마지막까지 문 연 가게가 철물점이었거든.' },
      { who: 0, text: '전원 배치! 출근 시간이다!!' },
    ] },
    rest: { bg: 'assets/story/ch2_side.jpg', pos: [0, 100, 50, 25], panels: [
      { cap: '해 질 녘, 고속도로 휴게소.' },
      { who: 'n3', text: '호두과자를 굽는데 택배 상자들이 혼자 걸어와요!' },
      { who: 'n1', text: '그거... 제가 배송하던 물건이에요. 전부 착불로요.' },
      { who: 1, text: '호두과자... 아니, 사람부터 구해요!' },
      { who: 0, text: '시민 태우고 연료 넣는다. 날아오는 상자는 받아쳐!' },
    ] },
    city: { bg: 'assets/story/ch3_side.jpg', pos: [0, 100, 40, 70], panels: [
      { cap: '비 내리는 본사 앞 도심.' },
      { who: 'n8', text: '살려주세요! 빌딩 위에서 댄서들이 뛰어내려요!' },
      { who: 2, text: '본사 서버에 백신 단서가 있어. 내가 뚫을게.' },
      { who: 'n7', text: '사원증 없으면 못 들어가... 아, 이제 상관없나.' },
      { who: 0, text: '전원 돌격. 오늘은 야근 없다!' },
    ] },
    neon: { bg: 'assets/stages/stage6.jpg', zoom: 1.9, pos: [0, 100, 5, 95], panels: [
      { cap: '한밤의 회식 거리. 2차, 3차... 끝이 없다.' },
      { who: 'n4', text: '과장님들이 폭탄주를 드시더니... 진짜 폭탄이 됐어요!' },
      { who: 1, text: '저 회식 싫어서 입사 미뤘던 사람인데요...' },
      { who: 'n11', text: '사장님 골프공은 조심해요. 아주 매서워요.' },
      { who: 2, text: '골프공이면... 내 노트북으로 받아치면 되지.' },
    ] },
    bridge: { bg: 'assets/story/ch1_side.jpg', tint: 'rgba(60,30,10,0.25)', pos: [100, 0, 60, 20], panels: [
      { cap: '천 길 낭떠러지 위, 아슬아슬 협곡 철교.' },
      { who: 'n5', text: '다리가 흔들려요! 바퀴 볼트는 제가 조여 둘게요!' },
      { who: 2, text: '좀비가 다리 밑에서 기어 올라와. 밀어서 떨어뜨려!' },
      { who: 1, text: '저 고소공포증 있다고 면접 때 말했는데요!!' },
      { who: 0, text: '아래 보지 마. 앞만 봐.' },
    ] },
    snow: { bg: 'assets/stages/stage7.jpg', zoom: 1.9, pos: [0, 100, 5, 95], panels: [
      { cap: '눈보라 설산. 강제 워크숍 현장.' },
      { who: 'n6', text: '상무님이 스키 연수 가시더니 안 돌아오셨어요...' },
      { who: 1, text: '워크숍... 그 단어만 들어도 소름이...' },
      { who: 'n0', text: '(무전) 구조 신호 발견! 눈 속에 사람들이 있어요!' },
      { who: 0, text: '타라. 둠스데이 익스프레스는 정원이 없다.' },
    ] },
    tunnel: { bg: 'assets/story/ch3_side.jpg', tint: 'rgba(0,0,0,0.5)', pos: [0, 100, 50, 30], panels: [
      { cap: '비상등만 깜빡이는 암흑 터널.' },
      { who: 2, text: '무전이 다시 잡혀... 연구소까지 터널 하나 남았어.' },
      { who: 'n9', text: '(지직) 여기는 지하 연구소... 백신은... 사장실 금고에...' },
      { who: 1, text: '사장실이요? 그럼 결국 사장님을...' },
      { who: 0, text: '퇴사하러 간다. 다 같이.' },
    ] },
    lab: { bg: 'assets/stages/stage8.jpg', zoom: 1.9, pos: [0, 100, 5, 95], panels: [
      { cap: '지하 연구소. 마지막 출근.' },
      { who: 'n9', text: '자네들이 왔군! 그런데 사장님이 금고를 통째로 삼키셨네!' },
      { who: 2, text: '...그래서 사장님이 그렇게 커진 거구나.' },
      { who: 1, text: '연봉 동결은 못 참아요!!' },
      { who: 0, text: '전원 배치. 마지막 결재 받으러 간다!' },
    ] },
  },

  /* ------------------------------------------------------------- ★ 챕터 그림 자리 (스테이지 id 별)
     파일이 있으면 자동으로 그 그림을 쓰고, 없으면 지금 그림(또는 코드 그림)을 그대로 씀
     ground = 바닥(위에서 본 그림) / sky = 먼 풍경 / side = 옆 배경(만화·미니게임) / thumb = 스테이지 미리보기
     comic = 가로 3칸 만화 그림(말풍선 빈칸) / props = 길가 소품 6개 (assets/props/chN_p1~6.png)
     → 그림 넣기: _dev/import_art.py 가 파일 이름대로 알아서 이 자리에 넣어 줌 */
  chapterArt: {
    desert: { ground: 'assets/ground/ch1.jpg', sky: 'assets/sky/ch1.jpg', side: 'assets/story/ch1_side.jpg', thumb: 'assets/stages/ch1_thumb.jpg', comic: 'assets/story/comic_ch1.jpg', props: 'ch1' },
    rest: { ground: 'assets/ground/ch2.jpg', sky: 'assets/sky/ch2.jpg', side: 'assets/story/ch2_side.jpg', thumb: 'assets/stages/ch2_thumb.jpg', comic: 'assets/story/comic_ch2.jpg', props: 'ch2' },
    city: { ground: 'assets/ground/ch3.jpg', sky: 'assets/sky/ch3.jpg', side: 'assets/story/ch3_side.jpg', thumb: 'assets/stages/ch3_thumb.jpg', comic: 'assets/story/comic_ch3.jpg', props: 'ch3' },
    neon: { ground: 'assets/ground/ch4.jpg', sky: 'assets/sky/ch4.jpg', side: 'assets/story/ch4_side.jpg', thumb: 'assets/stages/ch4_thumb.jpg', comic: 'assets/story/comic_ch4.jpg', props: 'ch4' },
    bridge: { ground: 'assets/ground/ch5.jpg', sky: 'assets/sky/ch5.jpg', side: 'assets/story/ch5_side.jpg', thumb: 'assets/stages/ch5_thumb.jpg', comic: 'assets/story/comic_ch5.jpg', props: 'ch5' },   // 철교는 바닥이 낭떠러지라 ground 안 씀
    snow: { ground: 'assets/ground/ch6.jpg', sky: 'assets/sky/ch6.jpg', side: 'assets/story/ch6_side.jpg', thumb: 'assets/stages/ch6_thumb.jpg', comic: 'assets/story/comic_ch6.jpg', props: 'ch6' },
    tunnel: { ground: 'assets/ground/ch7.jpg', sky: 'assets/sky/ch7.jpg', side: 'assets/story/ch7_side.jpg', thumb: 'assets/stages/ch7_thumb.jpg', comic: 'assets/story/comic_ch7.jpg', props: 'ch7' },
    lab: { ground: 'assets/ground/ch8.jpg', sky: 'assets/sky/ch8.jpg', side: 'assets/story/ch8_side.jpg', thumb: 'assets/stages/ch8_thumb.jpg', comic: 'assets/story/comic_ch8.jpg', props: 'ch8' },
  },
  // 생존자 지붕 사수 동작 그림 (assets/chars/이름/top_동작_0~3.png). idle=대기, shoot=사격, react=맞음/환호/필살기
  gunnerAnims: ['top_idle', 'top_shoot', 'top_react'],

  /* ------------------------------------------------------------- 꾸미기 (로비 '꾸미기' 버튼)
     cost = 골드 가격, need = 이 장(번호)을 깨야 열림, stars = 별 개수, att = 출석 일수, codex = 좀비 도감 완성, month = 이 달에만 판매, gems = 보석 가격
     grade = 일반/희귀/영웅/전설 (능력치 없음, 모습만). tint = 그림이 아직 없을 때 대신 입히는 색
     열차: art = assets/train/skins/아이디_top.png, _side.png (기관차 모양 교체)
     생존자: assets/chars/skins/이름_아이디/top_동작_0~3.png + assets/portraits/skin_이름_아이디.png */
  skins: {
    train: [
      { id: 'base', name: '기본 둠스데이호', cost: 0, grade: '일반' },
      { id: 'subway', name: '통근 지하철', cost: 0, stars: 24, grade: '희귀', tint: [0.75, 1.1, 0.8] },
      { id: 'neon', name: '야근 네온 열차', cost: 2500, grade: '희귀', tint: [1.1, 0.75, 1.25] },
      { id: 'army', name: '좀비 퇴치 열차', cost: 0, codex: true, grade: '영웅', tint: [0.8, 0.95, 0.65] },
      { id: 'santa', name: '산타 열차', cost: 3000, month: 12, grade: '영웅', tint: [1.3, 0.7, 0.7] },
      { id: 'gold', name: '황금 열차', gems: 300, grade: '전설', tint: [1.3, 1.1, 0.55] },
    ],
    jack: [
      { id: 'base', name: '기본', cost: 0 },
      { id: 'delivery', name: '배달원', cost: 0, att: 7, grade: '희귀', tint: [1.15, 0.9, 0.7] },
      { id: 'suit', name: '정장 히어로', cost: 2000, tint: [0.75, 0.8, 1.1] },
      { id: 'santa', name: '산타', cost: 0, need: 6, tint: [1.3, 0.75, 0.75] },
    ],
    minho: [
      { id: 'base', name: '기본', cost: 0 },
      { id: 'fire', name: '소방관', cost: 1200, tint: [1.25, 0.85, 0.6] },
      { id: 'chef', name: '셰프', cost: 0, att: 30, grade: '영웅', tint: [1.15, 1.15, 1.15] },
      { id: 'ninja', name: '닌자', cost: 0, need: 5, tint: [0.6, 0.6, 0.75] },
    ],
    sophie: [
      { id: 'base', name: '기본', cost: 0 },
      { id: 'hacker', name: '해커 후드', cost: 1200, tint: [0.7, 1.15, 0.8] },
      { id: 'idol', name: '아이돌', cost: 2000, tint: [1.25, 0.85, 1.15] },
      { id: 'space', name: '우주복', cost: 0, need: 7, tint: [0.95, 1.05, 1.25] },
    ],
  },

  // 시민 구출 미니게임에서 구한 사람들이 타는 '안전 칸' — 1명당 보너스 (최대 maxPeople명까지)
  safeCar: { goldPer: 0.02, xpPer: 0.02, maxPeople: 12 },

  /* ------------------------------------------------------------- 구조 작전 (판 도중 구조 신호 → 멈춘다/지나친다)
     at = 몇 번째 웨이브 시작 전, decide = 고르는 시간(초, 안 고르면 구함)
     face = 시민 얼굴 번호(comicNpc), n = 구하는 사람 수, op = 작전 미니게임(rescue/sniper/boiler/hack/parcel), dog = 강아지
     처음 하는 장은 첫 번째 사연, 다시 하기는 무작위. 지나친 사람은 다음 장에서 좀비로 나타남 */
  rescueOps: {
    at: 3, decide: 3, slow: 0.35,
    byStage: {
      desert: [{ face: 0, n: 1, op: 'sniper', line: '폐차 지붕에 올라간 인턴이 손을 흔든다!', quote: '저 오늘 첫 출근이었는데요...' }],
      rest: [{ face: 1, n: 1, op: 'rescue', line: '휴게소 화장실에 택배기사가 갇혔다!', quote: '배송은... 끝까지 해야죠' },
        { face: 3, n: 1, op: 'rescue', line: '호두과자 가게 사장님이 쫓기고 있다!', quote: '호두과자는 제가 책임질게요!' }],
      city: [{ face: 8, n: 3, op: 'sniper', line: '본사 옥상에서 사무직 3명이 손을 흔든다!', quote: '부장님은 버리고 왔어요' }],
      neon: [{ face: 4, n: 2, op: 'rescue', line: '노래방에 회식팀이 갇혔다!', quote: '3차는 진짜 안 가요' }],
      bridge: [{ face: 10, n: 4, op: 'rescue', line: '철교 위에 통근 버스가 멈춰 있다!', quote: '다리가 무너지기 전에 다 건넜어요!' },
        { dog: true, n: 1, op: 'rescue', line: "다리 아래 강아지 '야근이'가 매달려 있다!", quote: '멍멍! (야근이가 안전 칸 마스코트가 됐다)' }],
      snow: [{ face: 5, n: 2, op: 'boiler', line: '눈 속에 워크숍 참가자들이 파묻혔다! 보일러 열로 녹이자!', quote: '상무님이 퇴사도 못 하게 했어요' }],
      tunnel: [{ face: 8, n: 1, op: 'sniper', dark: true, line: '어둠 속에서 부장님 비서가 부른다!', quote: '이사님 약점은 등 뒤예요!', bossWeak: true }],
      lab: [{ face: 9, n: 2, op: 'hack', line: '실험실 문 안에 연구원들이 갇혔다!', quote: '금고 비밀번호 앞자리는... 0, 4, 1!' }],
    },
  },
  // 안전 칸: 6명마다 한 칸 더. 침입 좀비가 노리면 시민이 도망가 보너스가 잠시 꺼짐(fleeT초)
  safeSeats: 6, safeFleeT: 25,
  // 보스 공통 2단계 (체력 50%) — 보스별 rage가 있으면 그걸 씀
  bossRage: { at: 0.5, speed: 1.2, scale: 1.08, throwMul: 0.8, quote: '이제부터 진짜 야근이다!!' },

  /* ------------------------------------------------------------- ★ 판 밖 성장 · 경제 (설계서 3단계)
     subStages: 장마다 스테이지 5개 = 일반 3 + 구조 작전 1 + 보스 1. waves = 그 장 웨이브 중 몇 개까지, gold = 클리어 골드 배율
     구조 작전 스테이지(type 'rescue')는 시작하자마자 구조 신호가 뜸. 장 클리어(다음 장 열림) = 5번째 */
  subStages: [
    { name: '출근길', waves: 3, gold: 0.35, hp: 0.85 },
    { name: '중간 점검', waves: 4, gold: 0.45, hp: 0.92 },
    { name: '야근 돌입', waves: 5, gold: 0.55, hp: 1.0 },
    { name: '구조 작전', waves: 3, gold: 0.5, hp: 0.9, type: 'rescue' },
    { name: '결재 (보스)', waves: 99, gold: 1.0, hp: 1.0 },
  ],
  // 스테이지 시작 무전 (인턴 이하나가 안내). {n} = 스테이지 번호
  radio: {
    who: 0,
    lines: ['다음 구조 신호를 찾고 있어요!', '좀비 떼가 몰려와요! 칸을 잘 지켜 주세요!', '이 근처에 사람이 있을지도 몰라요...', '부장님 무전은 무시하세요. 진짜로요.', '연료는 충분해요. 끝까지 가요!'],
    byStage: {
      desert: ['첫 출근 열차, 출발합니다!'], rest: ['휴게소 호두과자 냄새가 나요!'], city: ['본사 옥상에서 구조 신호가 잡혀요!'],
      neon: ['회식 노래가 들려요... 무서워요'], bridge: ['다리가 흔들려요! 빨리 건너요!'], snow: ['너무 추워요... 보일러 꼭 지켜 주세요'],
      tunnel: ['비상등만 보여요. 조명탄 준비!'], lab: ['사실... 사장님은 제 삼촌이에요. 꼭 막아 주세요!'],
    },
  },
  // 생존자 키우기 (2장 클리어 후 열림). 레벨당 효과, cost = 기본 가격 × grow^레벨. join = 이 장을 깨면 합류(새 동료, 그림은 나중에)
  heroes: {
    unlockStage: 2, max: 20, costBase: 150, costGrow: 1.16,
    list: [
      { id: 'jack', name: '잭', portrait: 'assets/portraits/survivor1.png', perk: 'mg', per: 0.03, desc: '기관총 피해 +3%' },
      { id: 'minho', name: '민호', portrait: 'assets/portraits/survivor2.png', perk: 'elem', per: 0.03, desc: '불·물·얼음·바람 피해 +3%' },
      { id: 'sophie', name: '소피', portrait: 'assets/portraits/survivor3.png', perk: 'cd', per: 0.02, desc: '스킬 쿨타임 -2%' },
      { id: 'hana', name: '인턴 이하나', portrait: 'assets/npc/face_0.png', perk: 'xp', per: 0.03, desc: '경험치 +3%, 구조 신호 정찰', join: 4 },
      { id: 'park', name: '은퇴 기관사 박 기장', portrait: 'assets/npc/face_10.png', perk: 'horn', per: 0.04, desc: '경적 쿨타임 -4%, 열차 체력 +1%', join: 6 },
    ],
  },
  // 칸 도감: 처음엔 기관총·화염만, 장을 깨면 새 무기 칸이 열림 (장 번호)
  weaponUnlock: { mg: 0, flame: 0, tesla: 1, drone: 2, barrel: 2, cannon: 3, water: 3, freeze: 5, fan: 6 },
  // 방치 보상 (3장 클리어 후): 자리 비운 동안 골드. 최대 maxHours시간분, 광고 보면 2배
  idle: { unlockStage: 3, perHourBase: 40, perStage: 25, maxHours: 8 },
  // 경제: 실패하면 번 골드의 failRate만, 광고 2배는 하루 adDoubleDay번
  econ: { failRate: 0.4, adDoubleDay: 3 },
  // 꾸미기 수집 보너스: 외형 every개마다 골드 +per (최대 max)
  skinBonus: { every: 3, per: 0.02, max: 0.10 },
  // 보석(희귀 화폐): 새 별 1개당 gemsPerStar, 출석 7일째 att7
  gems: { perStar: 3, att7: 10 },
  // 도감: 처음 본 좀비·보스·구한 시민·원소 반응마다 골드 reward
  codex: { reward: 30 },
  // 무한 모드 (8장 클리어 후): 웨이브가 끝없이, 점점 강하게. 기록 = 버틴 웨이브
  endless: { unlockStage: 8, base: 'lab', hpGrow: 0.18, rateGrow: 0.08, bossEvery: 5 },
  // 음악 파일 자리 (픽사베이에서 받은 곡을 이 이름으로 넣으면 자동 사용, 없으면 지금 소리)
  music: { lobby: 'assets/music/lobby.mp3', battle: 'assets/music/battle1.mp3', battle2: 'assets/music/battle2.mp3', boss: 'assets/music/boss.mp3', mini: 'assets/music/mini.mp3', win: 'assets/music/win.mp3', lose: 'assets/music/lose.mp3' },
  // 장 클리어 컷: 다음 장 예고 한 줄
  nextTease: { desert: '다음: 해 질 녘 고속도로 휴게소', rest: '다음: 비 내리는 본사 앞 도심', city: '다음: 한밤의 네온 유흥가', neon: '다음: 천 길 낭떠러지 협곡 철교', bridge: '다음: 눈보라 설산 워크숍', snow: '다음: 비상등만 깜빡이는 암흑 터널', tunnel: '다음: 지하 연구소와 사장실', lab: '1부 출근편 끝! 2부 야근편을 기다려 주세요' },

  invasion: {
    firstWave: 3,            // 몇 번째 웨이브부터 침입이 생기는지
    every: [25, 35],         // 침입 간격(초) 최소~최대
    count: [2, 3],           // 한 번에 들어오는 좀비 수
    dps: 1.2,                // 침입 좀비 1마리당 열차에 주는 초당 피해
    autoClear: 10,           // 이 시간(초) 동안 안 싸우면 생존자들이 알아서 쫓아냄 (보상 없음)
    fightTime: 14,           // 실내 전투 제한 시간
    hitsToKill: { office: 2, box: 3, dancer: 2, riot: 3 },  // 좀비별 필요한 타격 수 (경찰은 방패 열릴 때 2배 피해)
    // 전투 장면: fromStage = 몇 스테이지부터 나오는지, chance = 나올 확률(기관실은 기관차 칸이 침입당하면 무조건)
    scenes: {
      car: { title: '🚨 객차 침입! 연타로 쫓아내라', hint: '👆 화면 연타!!', bg: 'bg' },
      engine: { title: '🔥 기관실 습격! 양쪽을 막아라', hint: '👈 왼쪽 · 오른쪽 👉 터치!', bg: 'bgEngine', fromStage: 2 },
      roof: { title: '🌬️ 지붕 위 결투!', hint: '👆 연타! 경보 뜨면 손 떼!', bg: 'bgRoof', fromStage: 3, chance: 0.4 },
    },
    heroes: ['jack', 'minho', 'sophie'],   // 칸마다 싸우는 생존자 (fightArt 또는 fightFallback 에 있는 이름)
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
    { name: '민호', art: 'minho', portrait: 'assets/portraits/survivor2.png', jacket: '#4a3b2f', helmet: '#29c7ff', skin: '#e0b48e' },
    { name: '소피', art: 'sophie', portrait: 'assets/portraits/survivor3.png', jacket: '#5a2f45', helmet: '#ffd400', skin: '#f2c7a0' },
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
    dancer: { name: '킹받는 댄서', art: 'dancer', hp: 20, speed: 5.6, dps: 2.1, xp: 3, gold: 0.15, scale: 1.0, mass: 0.9, jumper: true,
      colors: { skin: '#86c95a', shirt: '#b04fe0', pants: '#ffffff', hair: '#2a1a10', eye: '#ffffff', pupil: '#111111' } },
    riot: { name: '방패 든 경찰 좀비', art: 'riot', hp: 70, speed: 3.6, dps: 3.4, xp: 6, gold: 0.3, scale: 1.35, mass: 3,
      colors: { skin: '#7fbf55', shirt: '#24324f', pants: '#1b2236', helmet: '#141b2b', visor: '#7fc8ff', shield: '#b8c4d4', eye: '#ffffff', pupil: '#111111' } },
    bomber: { name: '회식 끝난 과장', art: 'bomber', hp: 26, speed: 4.0, dps: 0, xp: 3, gold: 0.15, scale: 1.15, mass: 1.6,
      boom: { radius: 4.0, dmgZombie: 25, dmgTrain: 14 },   // 터질 때: 주변 좀비 피해 / 열차에 닿아 터지면 열차 피해
      colors: { skin: '#a7d86a', shirt: '#f0e6d0', pants: '#3a3a44', belly: '#c6f08a', tie: '#2e7d32', cheek: '#ff7b9c', eye: '#ffffff', pupil: '#111111' } },
  },

  /* ------------------------------------------------------------- 보스 (model: spider=거미형, giant=거대 인간형) */
  bosses: {
    bujang: { cutin: 'assets/ui/cutin_bujang.jpg', model: 'spider', proj: 'paper', art: 'bujang', name: '변이 거미 부장님', quote: '이거 오늘까지 해 와!', hp: 1600, speed: 2.4, dps: 15, xp: 60, gold: 40, scale: 3.0, summon: 'office',
      colors: { body: '#7a9a4a', spots: '#a3507d', skin: '#8fd05a', leg: '#5d3b6e', eye: '#ff2a2a', tie: '#1d3fbf' } },
    taekbae: { cutin: 'assets/ui/cutin_taekbae.jpg', model: 'giant', proj: 'crate', base: 'box', art: 'box', name: '택배 대장 (산더미 배송)', quote: '착불입니다~!!', hp: 1900, speed: 2.1, dps: 16, xp: 65, gold: 45, scale: 4.0, summon: 'box',
      colors: { skin: '#9ad466', shirt: '#3f6aa8', pants: '#33302a', box: '#c08a57', tape: '#e8d5a8', cap: '#2c5aa0', eye: '#ffffff', pupil: '#ff2222' } },
    gwajang: { cutin: 'assets/ui/cutin_gwajang.jpg', model: 'giant', proj: 'paper', base: 'office', art: 'office', name: '거대 과장님 (야근 47일째)', quote: '야근은 미덕이야~', hp: 2200, speed: 2.0, dps: 18, xp: 70, gold: 50, scale: 4.2, summon: 'bomber',
      colors: { skin: '#7cc94e', shirt: '#dfe6ee', pants: '#2d3446', tie: '#8e24aa', toast: '#e9b872', bag: '#4a3222', eye: '#ffffff', pupil: '#ff2222' } },
    hwisik: { cutin: 'assets/ui/cutin_hwisik.jpg', model: 'giant', proj: 'barrel', base: 'bomber', art: 'bomber', name: '회식 끝판왕 과장님', quote: '3차 가자아아!!', hp: 2400, speed: 1.9, dps: 19, xp: 75, gold: 55, scale: 4.4, summon: 'bomber',
      colors: { skin: '#a7d86a', shirt: '#f0e6d0', pants: '#3a3a44', belly: '#c6f08a', tie: '#2e7d32', cheek: '#ff7b9c', eye: '#ffffff', pupil: '#ff2222' } },
    isa: { cutin: 'assets/ui/cutin_isa.jpg', model: 'spider', proj: 'paper', art: 'isa', name: '독거미 이사님', quote: '이사회 결정이다.', hp: 2600, speed: 2.8, dps: 20, xp: 80, gold: 60, scale: 3.3, summon: 'dancer',
      colors: { body: '#5a3a7a', spots: '#ffcf3a', skin: '#9a7ad8', leg: '#2a1a3a', eye: '#3dff6b', tie: '#ffcf3a' } },
    sangmu: { cutin: 'assets/ui/cutin_sangmu.jpg', model: 'giant', proj: 'snow', base: 'office', art: 'office', artTint: [0.72, 0.84, 1.1], name: '스키 연수 간 상무님', quote: '워크숍은 강제 참석이다!', hp: 2900, speed: 2.0, dps: 22, xp: 90, gold: 70, scale: 4.6, summon: 'riot',
      colors: { skin: '#8fc4d8', shirt: '#2a5aa8', pants: '#1d2a44', tie: '#ff5a36', toast: '#e9b872', bag: '#4a3222', eye: '#ffffff', pupil: '#ff2222' } },
    isa2: { cutin: 'assets/ui/cutin_isa.jpg', model: 'spider', proj: 'paper', art: 'isa', artTint: [0.75, 1.0, 0.8], name: '독거미 이사님 (2차 변이)', quote: '퇴사는 허락 못 한다!', hp: 3200, speed: 3.0, dps: 24, xp: 100, gold: 80, scale: 3.6, summon: 'dancer',
      colors: { body: '#2a5a3a', spots: '#ffcf3a', skin: '#7ad89a', leg: '#1a3a2a', eye: '#ff3d3d', tie: '#ffcf3a' } },
    // rage = 체력이 at 아래로 떨어지면 분노 2단계 (빨라지고 커짐, 투척 간격 짧아짐, rageFrame 그림 사용)
    ceo: { rage: { at: 0.5, speed: 1.35, scale: 1.15, throwMul: 0.6, quote: '연봉 삭감이다!!!', frame: 'a3' }, cutin: 'assets/ui/cutin_ceo.jpg', model: 'giant', proj: 'golf', base: 'office', crown: true, art: 'ceo', name: '좀비 사장님 (최종 보스)', quote: '연봉 동결이다!!', hp: 4200, speed: 1.8, dps: 26, xp: 150, gold: 120, scale: 5.0, summon: 'riot',
      colors: { skin: '#6fb64a', shirt: '#1d1d24', pants: '#1d1d24', tie: '#ffcf3a', toast: '#ffd700', bag: '#7a5a20', eye: '#ffffff', pupil: '#ff2222' } },
  },


  /* ------------------------------------------------------------- 무기 (레벨업으로 획득, Lv1~5, Lv5는 '진화')
     배열은 [Lv1, Lv2, Lv3, Lv4, Lv5] 순서 */
  weapons: {
    mg: { evoWith: 'haste', name: '뚫어뻥 기관총', evoName: '황금 뚫어뻥 개틀링', icon: 'assets/icons/w_mg.png', car: 'gun',
      desc: ['생존자들이 뚫어뻥 탄을 연사', '사수 +1명 합류', '피해 증가, 관통 +1', '연사 속도 증가', '진화! 황금 개틀링 난사'],
      dmg: [10, 12, 14, 16, 20], rate: [0.30, 0.27, 0.24, 0.21, 0.15], shooters: [2, 3, 3, 3, 3], pierce: [0, 0, 1, 1, 2], range: 34 },
    flame: { evoWith: 'armor', name: '화염방사 칸', evoName: '플레임 스톰', icon: 'assets/icons/w_flame.png', car: 'flame',
      desc: ['열차 양옆으로 화염 분사', '화염 피해 증가', '사거리 증가', '피해 대폭 증가', '진화! 바닥에 불바다를 남김'],
      dps: [22, 28, 36, 44, 60], range: [9, 10, 11.5, 12.5, 15] },
    tesla: { evoWith: 'crit', name: '테슬라 코일', evoName: '테슬라 체인 스톰', icon: 'assets/icons/w_tesla.png', car: 'tesla',
      desc: ['번개가 좀비 사이를 연쇄', '연쇄 수 증가', '피해 증가', '발동 속도 증가', '진화! 번개가 두 줄기로'],
      cd: [2.0, 1.8, 1.6, 1.4, 1.0], chains: [8, 10, 12, 14, 20], dmg: [30, 36, 44, 52, 66], range: 22 },
    drone: { evoWith: 'magnet', name: '드론 폭탄', evoName: '드론 편대 폭격', icon: 'assets/icons/w_drone.png', car: 'drone',
      desc: ['드론이 좀비 떼에 폭탄 투하', '폭발 피해 증가', '드론 +1', '폭발 범위 증가', '진화! 드론 4대 편대'],
      drones: [1, 1, 2, 2, 4], cd: [2.0, 1.8, 1.7, 1.5, 1.1], dmg: [55, 65, 75, 85, 100], radius: [3.6, 3.9, 4.2, 4.7, 5.4] },
    cannon: { evoWith: 'power', name: '캐논 터렛', evoName: '쌍열 캐논', icon: 'assets/icons/w_cannon.png', car: 'cannon',
      desc: ['강력한 포탄으로 범위 피해', '피해 증가', '폭발 범위 증가', '연사 속도 증가', '진화! 포신 2개'],
      rate: [1.0, 0.9, 0.8, 0.7, 0.45], dmg: [60, 75, 90, 105, 130], splash: [3.0, 3.3, 3.6, 4.0, 4.6], range: 40 },
    barrel: { evoWith: 'greed', name: '드럼통 낙하', evoName: '드럼통 비', icon: 'assets/icons/w_barrel.png', car: null,
      desc: ['하늘에서 폭발 드럼통 낙하', '피해 증가', '드럼통 +1', '폭발 범위 증가', '진화! 드럼통 4개 연속 낙하'],
      cd: [5.5, 5.0, 5.0, 4.5, 3.2], count: [1, 1, 2, 2, 4], dmg: [70, 85, 100, 115, 145], radius: [4.2, 4.5, 4.8, 5.4, 6.2] },
    // ↓ 새 무기 3종 (그림이 없으면 기관총 칸 그림에 색만 입혀서 씀. 아이콘이 없으면 emoji)
    // ↓ 액티브 스킬 3종 (쿨타임이 차면 버튼이 번쩍 → 누르면 발동. 자동 모드에서는 알아서 쓰지만 효과 auto배)
    water: { active: true, name: '소방 물대포', evoName: '물회오리 물대포', icon: 'assets/icons/w_water.png', emoji: '💧', car: 'water', elem: '물',
      desc: ['굵은 물줄기로 밀어내고 적심 (젖음: 번개 감전·얼음 빙결·불 수증기)', '피해·밀어내기 증가', '물줄기 두 줄기!', '쿨타임 감소', '열차 주위를 도는 물회오리!'],
      cd: [12, 11, 10.5, 9, 8.5], dmg: [55, 70, 80, 95, 110], push: [16, 20, 22, 24, 26], range: 15, width: 3.4, wet: 6 },
    freeze: { active: true, name: '냉동 컨테이너', evoName: '얼음 가시 컨테이너', icon: 'assets/icons/w_ice.png', emoji: '❄️', car: 'freeze', elem: '얼음',
      desc: ['넓은 범위를 3초 얼림 (얼린 좀비를 총·폭발로 치면 산산조각)', '얼리는 시간 증가', '범위 1.5배!', '쿨타임 감소', '얼음 가시가 솟아 큰 피해!'],
      cd: [18, 17, 16, 14, 13], dmg: [20, 25, 30, 35, 120], radius: [9, 9, 13.5, 13.5, 14], freeze: [3, 3.6, 3.6, 4, 4], slow: 0.45 },
    fan: { active: true, name: '회오리 환풍기', evoName: '추적 회오리', icon: 'assets/icons/w_wind.png', emoji: '🌪️', car: 'fan', elem: '바람',
      desc: ['좀비를 한곳으로 빨아들이는 회오리 (불붙은 좀비가 들어가면 불회오리)', '회오리 피해 증가', '회오리 크기 두 배!', '쿨타임 감소', '회오리가 좀비를 따라다님!'],
      cd: [15, 14, 13.5, 12, 11], dps: [10, 13, 16, 19, 24], radius: [5, 5, 8, 8, 9], pull: [7, 8, 10, 10, 12], dur: [4, 4.5, 4.5, 5, 6], follow: [0, 0, 0, 0, 1] },
  },
  // 천천히 늘어나게: 새 무기 칸은 이 레벨부터 (2번째·3번째·4번째 무기), 액티브 스킬은 skillLv부터
  //   ramp = 판 시작 후 rampSec초 동안 좀비 수를 rampMin배 → 1배로 서서히
  growth: { newWeaponLv: [0, 3, 7, 12], skillLv: 6, rampSec: 100, rampMin: 0.45 },
  // 무기 조합: 두 무기를 함께 가지면 켜짐 (화면에 '조합 발동!' + 카드에 미리 표시)
  combos: [
    { id: 'oil', a: 'flame', b: 'barrel', name: '기름바다', desc: '드럼통 터진 자리에 불이 번짐' },
    { id: 'zapdrone', a: 'tesla', b: 'drone', name: '번개 드론', desc: '드론 폭탄이 연쇄 번개를 튀김' },
    { id: 'focus', a: 'cannon', b: 'mg', name: '집중포화', desc: '기관총에 맞은 좀비를 캐논이 자동 조준' },
    { id: 'plasma', a: 'flame', b: 'tesla', name: '플라즈마', desc: '불붙은 좀비에게 번개 피해 2배' },
    { id: 'support', a: 'drone', b: 'cannon', name: '지원 포격', desc: '드론이 터뜨린 곳에 캐논 포탄 추가 낙하' },
  ],
  comboFx: { oilT: 4, oilDps: 30, zapChain: 4, zapMul: 0.45, supportMul: 0.6 },
  // 칸 배치 보너스 (7판째부터 자리 고르기): 기관차 바로 뒤 = 쿨타임 감소, 맨 뒤 = 침입 막기
  placement: { frontHaste: 0.85, rearGuard: 0.5 },
  // 첫 10판 동안 하나씩 여는 순서 (판 번호). 이미 2장 이상 깬 사람은 전부 열림
  unlocks: { meta: 2, horn: 3, aim: 4, skillManual: 4, invasion: 5, combo: 6, place: 7, reward: 9, autoBtn: 10 },
  // 첫 판 프롤로그 (최초 1회): 황금 열차 최강 상태 → 사장님 골프공 → 기관차 하나로 시작
  prologue: { on: true, time: 18, wave: { time: 999, rate: 16, hordes: 0, hordeSize: 0, mix: { office: 0.6, box: 0.2, dancer: 0.2 }, hp: 0.5 } },
  // 액티브 스킬: 화면 아래 버튼 최대 max개. auto = 자동 모드 효율
  skills: { max: 3, auto: 0.8 },
  // 원소 반응 (젖음·얼음·불·바람이 만나면)
  combo: { shockMul: 2, shockChain: 8, shatterMul: 1.5, steamSlow: 2.5, steamRadius: 3, fireTornado: 0.35 },
  // 판 안 제한: 무기 칸 4개(기관총 포함), 보조템 4개, 진화 최대 2개 (진화 = 최고 레벨 + 짝 보조템 → 중간보스 보물상자에서)
  limits: { weapons: 4, passives: 4, evo: 2 },
  // 첫 레벨업 2번은 빨리 (몸풀기)
  xpEarly: [4, 7],

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
    hp: { name: '열차 장갑판', icon: '🛡️', desc: '열차 체력 +25 (5단계마다 열차 모습이 바뀜)', per: 25, max: 24, costBase: 60, costGrow: 1.13 },
    dmg: { name: '사격 훈련', icon: '🎯', desc: '모든 피해 +4%', per: 0.04, max: 20, costBase: 80, costGrow: 1.14 },
    xp: { name: '야간 자율학습', icon: '📚', desc: '경험치 +4%', per: 0.04, max: 20, costBase: 70, costGrow: 1.14 },
    magnet: { name: '자석 코팅', icon: '🧲', desc: '경험치 흡수 범위 +5%', per: 0.05, max: 20, costBase: 50, costGrow: 1.12 },
  },

  /* ------------------------------------------------------------- 스테이지 & 웨이브
     time=웨이브 시간(초), rate=초당 기본 스폰 수, hordes=좀비 떼 러시 횟수, hordeSize=러시 규모
     mix=좀비 비율, hp=체력 배수, boss=보스 이름(bosses 안의 키), bossHp=보스 체력 배수
     intro/outro: 스테이지 시작/클리어 대화 (who = survivors 순서 0,1,2) */
  stages: [
    {
      id: 'desert', name: '황폐한 사막 협곡', desc: '출근 첫날. 사방에서 몰려오는 지각 좀비를 시원하게 쓸어버리자!',
      thumb: 'assets/stages/stage1.jpg', clearGold: 150,
      intro: [
        { who: 0, text: '여기는 둠스데이 익스프레스. 목적지는 지하 연구소, 백신이 거기 있다.' },
        { who: 1, text: '저 오늘 입사 첫날인데요... 왜 무기가 전부 뚫어뻥이에요?' },
        { who: 2, text: '마지막까지 문 연 가게가 철물점이었거든.' },
        { who: 0, text: '전원 배치! 출근 시간이다!!' },
      ],
      outro: [
        { who: 2, text: '거미 부장님 처치 완료... 근데 저 넥타이, 우리 회사 거 아니야?' },
        { who: 0, text: '연료가 간당간당하다. 다음 휴게소에 들른다.' },
      ],
      theme: {
        skyImg: 'assets/sky/ch1.jpg', propKinds: ['billboard', 'watertower', 'watchtower', 'barricade', 'supplies', 'jersey', 'wreck1', 'wreck2', 'gas'], groundImg: 'desert', skyTop: '#f3b06b', skyBottom: '#f7d49b', fog: '#efc08a', fogNear: 55, fogFar: 150,
        light: [0.5, 0.9, 0.3], sky: '#fff1d6', ground: '#a8714a', ambient: 0.45,
        groundCol: '#d9a066', ballast: '#8b6a4f', sleeper: '#5b4636', rail: '#aab2bf',
        props: 'desert', weather: 'dust', rock: ['#c27a45', '#b06a3a', '#d48b52', '#9e5d33'], plant: '#5f8f3a',
      },
      waves: [
        { time: 20, rate: 2.6, hordes: 1, hordeSize: 22, mix: { office: 1 }, hp: 1.6 },
        { time: 24, rate: 3.2, hordes: 1, hordeSize: 28, mix: { office: 0.8, box: 0.2 }, hp: 1.84 },
        { time: 26, rate: 3.8, hordes: 2, hordeSize: 32, mix: { office: 0.7, box: 0.2, dancer: 0.1 }, hp: 2.16 },
        { time: 26, rate: 2.8, hordes: 1, hordeSize: 30, mix: { office: 0.7, box: 0.3 }, hp: 2.4, boss: 'bujang', bossHp: 0.91 },
        { time: 26, rate: 4.4, hordes: 2, hordeSize: 40, mix: { office: 0.55, box: 0.22, dancer: 0.13, bomber: 0.1 }, hp: 2.88 },
        { time: 28, rate: 5.0, hordes: 2, hordeSize: 46, mix: { office: 0.5, box: 0.2, dancer: 0.15, riot: 0.06, bomber: 0.09 }, hp: 3.36 },
        { time: 30, rate: 3.6, hordes: 2, hordeSize: 40, mix: { office: 0.5, box: 0.2, dancer: 0.15, riot: 0.08, bomber: 0.07 }, hp: 3.84, boss: 'bujang', bossHp: 1.71 },
      ],
    },
    {
      id: 'rest', name: '해 질 녘 고속도로 휴게소', desc: '연료와 호두과자를 구하러 들른 휴게소. 택배 좀비가 산더미처럼 몰려온다!',
      thumb: 'assets/stages/stage5.jpg', thumbFallback: 'assets/stages/stage1.jpg', clearGold: 200,
      intro: [
        { who: 1, text: '휴게소다! 호두과자... 호두과자 냄새가 나요!' },
        { who: 2, text: '정신 차려. 저기 택배 상자 더미가... 움직이고 있어.' },
        { who: 0, text: '연료만 넣고 바로 뜬다. 상자는 밟지 마라.' },
      ],
      outro: [
        { who: 1, text: '호두과자 세 봉지 확보했어요! 하나는 제 거예요.' },
        { who: 2, text: '무전이 잡혀. "본사 서버에... 백신 위치가..." 도심으로 가야 해.' },
      ],
      theme: {
        skyImg: 'assets/sky/ch2.jpg', propKinds: ['lamp_rest', 'shelter_rest', 'mapboard', 'vending', 'foodcart', 'bikes', 'wreck1', 'wreck2'], groundImg: 'rest', skyTop: '#ff7e5f', skyBottom: '#ffc27a', fog: '#f2a27a', fogNear: 50, fogFar: 140,
        light: [0.7, 0.6, 0.3], sky: '#ffd9b8', ground: '#8a5040', ambient: 0.5, spriteTint: [1.0, 0.9, 0.84],
        groundCol: '#c98a5c', ballast: '#7a5a48', sleeper: '#4e3a2e', rail: '#b0a8a8',
        props: 'desert', weather: 'dust', rock: ['#b0603a', '#a0502e', '#c4743f', '#8a4a2a'], plant: '#6a7a3a', groundTint: [1.0, 0.86, 0.8, 1],
      },
      waves: [
        { time: 20, rate: 2.8, hordes: 1, hordeSize: 24, mix: { office: 0.6, box: 0.4 }, hp: 3.6 },
        { time: 24, rate: 3.4, hordes: 2, hordeSize: 30, mix: { office: 0.5, box: 0.4, bomber: 0.1 }, hp: 4.14 },
        { time: 26, rate: 4.0, hordes: 2, hordeSize: 34, mix: { office: 0.45, box: 0.4, dancer: 0.08, bomber: 0.07 }, hp: 4.86 },
        { time: 26, rate: 3.0, hordes: 2, hordeSize: 32, mix: { office: 0.5, box: 0.5 }, hp: 5.4, boss: 'bujang', bossHp: 1.35 },
        { time: 26, rate: 4.6, hordes: 2, hordeSize: 42, mix: { office: 0.4, box: 0.4, dancer: 0.1, bomber: 0.1 }, hp: 6.48 },
        { time: 28, rate: 5.2, hordes: 3, hordeSize: 48, mix: { office: 0.38, box: 0.4, dancer: 0.1, riot: 0.04, bomber: 0.08 }, hp: 7.56 },
        { time: 30, rate: 3.8, hordes: 2, hordeSize: 42, mix: { office: 0.4, box: 0.4, dancer: 0.1, bomber: 0.1 }, hp: 8.64, boss: 'taekbae', bossHp: 2.13 },
      ],
    },
    {
      id: 'city', name: '붕괴된 대도시', desc: '비 내리는 본사 앞 도심. 빌딩 위에서 댄서들이 뛰어내린다!',
      thumb: 'assets/stages/stage2.jpg', clearGold: 250,
      intro: [
        { who: 1, text: '도심이다... 저 사람들 전부 우리 회사 사람들이에요.' },
        { who: 0, text: '월요일 아침 9시. 가장 위험한 시간대지.' },
        { who: 2, text: '본사 서버실까지 버텨 줘. 내가 해킹할게!' },
      ],
      outro: [
        { who: 2, text: '해킹 성공! 백신은 지하 연구소... 열쇠 카드는 이사님이 갖고 있대.' },
        { who: 0, text: '과장님... 편히 퇴근하세요.' },
      ],
      theme: {
        skyImg: 'assets/sky/ch3.jpg', propKinds: ['shelter_city', 'lamp_city', 'traffic', 'billboard_city', 'cones', 'utilbox', 'police1', 'police2', 'wreck1'], groundImg: 'city', skyTop: '#1d2448', skyBottom: '#6a3f6e', fog: '#4a3a62', fogNear: 50, fogFar: 150,
        light: [0.35, 0.85, 0.45], sky: '#c9d2ff', ground: '#5a4a6a', ambient: 0.62,
        groundCol: '#565a68', ballast: '#3c3f4a', sleeper: '#3d3027', rail: '#9aa3b2',
        props: 'city', weather: 'rain', spriteTint: [0.85, 0.85, 0.97], building: ['#5a6378', '#66708a', '#525a6e', '#6a5a78', '#586868'], neon: ['#ff4fa3', '#3df2ff', '#ffd23d', '#7dff6b'],
      },
      waves: [
        { time: 20, rate: 2.9, hordes: 1, hordeSize: 27, mix: { office: 0.8, box: 0.2 }, hp: 4.5 },
        { time: 24, rate: 3.5, hordes: 2, hordeSize: 33, mix: { office: 0.6, box: 0.2, dancer: 0.12, bomber: 0.08 }, hp: 5.17 },
        { time: 26, rate: 4.1, hordes: 2, hordeSize: 37, mix: { office: 0.5, box: 0.2, dancer: 0.18, riot: 0.05, bomber: 0.07 }, hp: 6.08 },
        { time: 26, rate: 3.1, hordes: 2, hordeSize: 35, mix: { office: 0.55, box: 0.2, dancer: 0.15, bomber: 0.1 }, hp: 6.75, boss: 'taekbae', bossHp: 1.3 },
        { time: 26, rate: 4.7, hordes: 2, hordeSize: 45, mix: { office: 0.45, box: 0.2, dancer: 0.2, riot: 0.08, bomber: 0.07 }, hp: 8.1 },
        { time: 28, rate: 5.3, hordes: 3, hordeSize: 51, mix: { office: 0.4, box: 0.2, dancer: 0.2, riot: 0.12, bomber: 0.08 }, hp: 9.45 },
        { time: 30, rate: 3.9, hordes: 2, hordeSize: 45, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 10.8, boss: 'gwajang', bossHp: 2.1 },
      ],
    },
    {
      id: 'neon', name: '네온 유흥가 (회식 2차)', desc: '한밤의 회식 거리. 술 취한 과장 좀비들이 터지기 직전이다!',
      thumb: 'assets/stages/stage6.jpg', thumbFallback: 'assets/stages/stage2.jpg', clearGold: 300,
      intro: [
        { who: 1, text: '형... 여기 회식 2차 거리예요. 저 회식 진짜 싫어요.' },
        { who: 0, text: '배 나온 분들 조심해. 가까이 오면 터진다.' },
        { who: 2, text: '노래방 간판 너머에서 뭔가 큰 게 온다!' },
      ],
      outro: [
        { who: 1, text: '3차는... 안 가도 되는 거죠?' },
        { who: 2, text: '앞에 협곡 철교야. 이사님 신호가 거기서 잡혀.' },
      ],
      theme: {
        groundImg: 'neon', skyTop: '#07061a', skyBottom: '#3a0d4a', fog: '#24103a', fogNear: 40, fogFar: 130,
        light: [0.3, 0.8, 0.5], sky: '#ff9ad8', ground: '#2a1a3a', ambient: 0.66,
        groundCol: '#3a3446', ballast: '#2a2632', sleeper: '#2e2420', rail: '#a99ac0',
        props: 'city', weather: 'confetti', spriteTint: [0.95, 0.82, 1.0], building: ['#2e2a44', '#3a2e50', '#26303e', '#40284a', '#2a3a44'], neon: ['#ff3fa0', '#3df2ff', '#fff23d', '#b05cff', '#ff7a2a'], groundTint: [0.62, 0.55, 0.85, 1],
      },
      waves: [
        { time: 20, rate: 3.1, hordes: 1, hordeSize: 29, mix: { office: 0.7, bomber: 0.15, dancer: 0.15 }, hp: 5.3 },
        { time: 24, rate: 3.7, hordes: 2, hordeSize: 35, mix: { office: 0.55, dancer: 0.2, bomber: 0.25 }, hp: 6.09 },
        { time: 26, rate: 4.3, hordes: 2, hordeSize: 39, mix: { office: 0.45, box: 0.1, dancer: 0.2, bomber: 0.25 }, hp: 7.16 },
        { time: 26, rate: 3.3, hordes: 2, hordeSize: 37, mix: { office: 0.5, dancer: 0.2, bomber: 0.3 }, hp: 7.95, boss: 'gwajang', bossHp: 1.25 },
        { time: 26, rate: 4.9, hordes: 3, hordeSize: 47, mix: { office: 0.4, box: 0.1, dancer: 0.2, riot: 0.05, bomber: 0.25 }, hp: 9.54 },
        { time: 28, rate: 5.5, hordes: 3, hordeSize: 53, mix: { office: 0.35, box: 0.1, dancer: 0.2, riot: 0.1, bomber: 0.25 }, hp: 11.13 },
        { time: 30, rate: 4.1, hordes: 2, hordeSize: 47, mix: { office: 0.35, box: 0.1, dancer: 0.2, riot: 0.1, bomber: 0.25 }, hp: 12.72, boss: 'hwisik', bossHp: 2.14 },
      ],
    },
    {
      id: 'bridge', name: '아슬아슬 협곡 철교', desc: '발밑은 천 길 낭떠러지. 좀비들이 다리 밑에서 기어 올라온다! (밀어서 떨어뜨리기 가능)',
      thumb: 'assets/stages/stage3.jpg', clearGold: 350,
      intro: [
        { who: 2, text: '낡은 철교야. 떨어지면 그대로 끝이야.' },
        { who: 1, text: '형! 좀비들이 다리 난간을 타고 기어 올라와요!' },
        { who: 0, text: '폭발로 날려버려. 다리 밖으로 밀면 알아서 떨어진다.' },
      ],
      outro: [
        { who: 2, text: '이사님 쓰러뜨렸어! 카드키... 반쪽밖에 없네?' },
        { who: 0, text: '나머지 반쪽은 설산 너머 연수원에 있다더군.' },
      ],
      theme: {
        skyImg: 'assets/sky/sunset.jpg', skyTop: '#7fb2e5', skyBottom: '#f2d6b3', fog: '#c9c6c9', fogNear: 60, fogFar: 170,
        light: [0.4, 0.9, 0.35], sky: '#eef6ff', ground: '#6a6a7a', ambient: 0.5,
        groundCol: '#4a5560', ballast: '#5d636e', sleeper: '#4a3a2e', rail: '#b3bccb',
        props: 'bridge', weather: 'wind', deck: [-11, 4], river: '#3f7fb0', cliff: ['#8a6a52', '#9a7a5a', '#7a5a46', '#a88a6a'], steel: '#8a4a3a',
      },
      waves: [
        { time: 20, rate: 3.3, hordes: 1, hordeSize: 31, mix: { office: 0.75, box: 0.25 }, hp: 7.0 },
        { time: 24, rate: 3.9, hordes: 2, hordeSize: 37, mix: { office: 0.55, box: 0.2, dancer: 0.15, bomber: 0.1 }, hp: 8.05 },
        { time: 26, rate: 4.5, hordes: 2, hordeSize: 41, mix: { office: 0.5, box: 0.2, dancer: 0.15, riot: 0.08, bomber: 0.07 }, hp: 9.45 },
        { time: 26, rate: 3.5, hordes: 2, hordeSize: 39, mix: { office: 0.55, box: 0.2, dancer: 0.15, bomber: 0.1 }, hp: 10.5, boss: 'hwisik', bossHp: 1.4 },
        { time: 26, rate: 5.1, hordes: 3, hordeSize: 49, mix: { office: 0.45, box: 0.2, dancer: 0.17, riot: 0.1, bomber: 0.08 }, hp: 12.6 },
        { time: 28, rate: 5.7, hordes: 3, hordeSize: 55, mix: { office: 0.4, box: 0.2, dancer: 0.18, riot: 0.14, bomber: 0.08 }, hp: 14.7 },
        { time: 30, rate: 4.3, hordes: 2, hordeSize: 49, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 16.8, boss: 'isa', bossHp: 2.4 },
      ],
    },
    {
      id: 'snow', name: '눈보라 설산 철교', desc: '강제 워크숍이 열리는 설산. 눈보라 속에서 상무님이 기다린다!',
      thumb: 'assets/stages/stage7.jpg', thumbFallback: 'assets/stages/stage3.jpg', clearGold: 400,
      intro: [
        { who: 1, text: '추워요... 열차 창문이 얼었어요.' },
        { who: 2, text: '저 위가 회사 연수원이야. 1박 2일 강제 워크숍...' },
        { who: 0, text: '좀비가 돼서도 워크숍이라니. 끔찍하군.' },
      ],
      outro: [
        { who: 0, text: '상무님의 카드키 반쪽 확보. 이제 완전한 열쇠다.' },
        { who: 1, text: '다음은 터널이에요. 엄청 어두워요...' },
      ],
      theme: {
        skyImg: 'assets/sky/snow.jpg', skyTop: '#8fa6c4', skyBottom: '#e6edf6', fog: '#dce5ef', fogNear: 40, fogFar: 130,
        light: [0.4, 0.9, 0.35], sky: '#f4f8ff', ground: '#c8d2de', ambient: 0.62, spriteTint: [0.93, 0.97, 1.06],
        groundCol: '#d8e0ea', ballast: '#9aa6b4', sleeper: '#5a4a40', rail: '#c4ccd8',
        props: 'bridge', weather: 'snow', deck: [-11, 4], river: '#b8d4ea', cliff: ['#e8eef5', '#cdd7e2', '#b4c0ce', '#f4f7fb'], steel: '#4a5a7a', groundTex: 'snow',
      },
      waves: [
        { time: 20, rate: 3.5, hordes: 1, hordeSize: 33, mix: { office: 0.6, box: 0.25, riot: 0.15 }, hp: 7.1 },
        { time: 24, rate: 4.1, hordes: 2, hordeSize: 39, mix: { office: 0.5, box: 0.2, dancer: 0.1, riot: 0.2 }, hp: 8.16 },
        { time: 26, rate: 4.7, hordes: 2, hordeSize: 43, mix: { office: 0.45, box: 0.2, dancer: 0.1, riot: 0.18, bomber: 0.07 }, hp: 9.59 },
        { time: 26, rate: 3.7, hordes: 2, hordeSize: 41, mix: { office: 0.5, box: 0.2, riot: 0.2, bomber: 0.1 }, hp: 10.65, boss: 'isa', bossHp: 1.3 },
        { time: 26, rate: 5.3, hordes: 3, hordeSize: 51, mix: { office: 0.4, box: 0.2, dancer: 0.12, riot: 0.2, bomber: 0.08 }, hp: 12.78 },
        { time: 28, rate: 5.9, hordes: 3, hordeSize: 57, mix: { office: 0.36, box: 0.2, dancer: 0.14, riot: 0.22, bomber: 0.08 }, hp: 14.91 },
        { time: 30, rate: 4.5, hordes: 2, hordeSize: 51, mix: { office: 0.4, box: 0.2, dancer: 0.1, riot: 0.2, bomber: 0.1 }, hp: 17.04, boss: 'sangmu', bossHp: 2.18 },
      ],
    },
    {
      id: 'tunnel', name: '암흑 터널', desc: '비상등만 깜빡이는 긴 터널. 이사님이 다시 일어났다!',
      thumb: 'assets/stages/stage4.jpg', clearGold: 450,
      intro: [
        { who: 0, text: '터널이다. 비상등만 믿고 간다.' },
        { who: 2, text: '잠깐... 저 거미 실루엣, 아까 쓰러뜨린 이사님이야!' },
        { who: 1, text: '이사님은 원래 안 죽어요. 임기가 남았거든요.' },
      ],
      outro: [
        { who: 2, text: '터널 끝이 보여! 연구소 입구야.' },
        { who: 0, text: '카드키 준비. 마지막 출근이다.' },
      ],
      theme: {
        groundImg: 'tunnel', skyTop: '#0a0a12', skyBottom: '#2a0e14', fog: '#1a0e12', fogNear: 35, fogFar: 120,
        light: [0.3, 0.9, 0.5], sky: '#ffb0a0', ground: '#2a1a20', ambient: 0.55,
        groundCol: '#2e2b30', ballast: '#242226', sleeper: '#3a2e26', rail: '#8a8f9a',
        props: 'tunnel', weather: 'sparks', spriteTint: [0.85, 0.74, 0.76], walls: [-12.5, 5.5], wall: '#3a3840', alarm: '#ff2a2a',
      },
      waves: [
        { time: 20, rate: 3.6, hordes: 1, hordeSize: 36, mix: { office: 0.7, box: 0.2, bomber: 0.1 }, hp: 8.0 },
        { time: 24, rate: 4.2, hordes: 2, hordeSize: 42, mix: { office: 0.5, box: 0.2, dancer: 0.15, bomber: 0.15 }, hp: 9.2 },
        { time: 26, rate: 4.8, hordes: 2, hordeSize: 46, mix: { office: 0.45, box: 0.2, dancer: 0.15, riot: 0.1, bomber: 0.1 }, hp: 10.8 },
        { time: 26, rate: 3.8, hordes: 2, hordeSize: 44, mix: { office: 0.5, box: 0.2, dancer: 0.15, bomber: 0.15 }, hp: 12.0, boss: 'sangmu', bossHp: 1.28 },
        { time: 26, rate: 5.4, hordes: 3, hordeSize: 54, mix: { office: 0.4, box: 0.2, dancer: 0.17, riot: 0.13, bomber: 0.1 }, hp: 14.4 },
        { time: 28, rate: 6.0, hordes: 3, hordeSize: 60, mix: { office: 0.38, box: 0.2, dancer: 0.17, riot: 0.15, bomber: 0.1 }, hp: 16.8 },
        { time: 30, rate: 4.6, hordes: 2, hordeSize: 54, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 19.2, boss: 'isa2', bossHp: 2.16 },
      ],
    },
    {
      id: 'lab', name: '지하 연구소 (사장실)', desc: '초록 경보등이 번쩍이는 마지막 구간. 끝에서 사장님이 기다린다.',
      thumb: 'assets/stages/stage8.jpg', thumbFallback: 'assets/stages/stage4.jpg', clearGold: 600,
      intro: [
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
        groundImg: 'lab', skyTop: '#04120e', skyBottom: '#0e2e26', fog: '#0c221d', fogNear: 35, fogFar: 115,
        light: [0.3, 0.9, 0.5], sky: '#a0ffd8', ground: '#16241f', ambient: 0.6,
        groundCol: '#26332f', ballast: '#1d2724', sleeper: '#2e2a26', rail: '#9aa8a4',
        props: 'tunnel', weather: 'sparks', spriteTint: [0.78, 0.95, 0.86], walls: [-12.5, 5.5], wall: '#2c3c3a', alarm: '#3dff9a', groundTint: [0.7, 0.95, 0.85, 1],
      },
      waves: [
        { time: 20, rate: 3.8, hordes: 1, hordeSize: 38, mix: { office: 0.6, box: 0.2, riot: 0.1, bomber: 0.1 }, hp: 8.4 },
        { time: 24, rate: 4.4, hordes: 2, hordeSize: 44, mix: { office: 0.45, box: 0.2, dancer: 0.15, riot: 0.1, bomber: 0.1 }, hp: 9.66 },
        { time: 26, rate: 5.0, hordes: 2, hordeSize: 48, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 11.34 },
        { time: 26, rate: 4.0, hordes: 2, hordeSize: 46, mix: { office: 0.45, box: 0.2, dancer: 0.15, riot: 0.1, bomber: 0.1 }, hp: 12.6, boss: 'isa2', bossHp: 1.2 },
        { time: 26, rate: 5.6, hordes: 3, hordeSize: 56, mix: { office: 0.36, box: 0.2, dancer: 0.17, riot: 0.17, bomber: 0.1 }, hp: 15.12 },
        { time: 28, rate: 6.2, hordes: 3, hordeSize: 62, mix: { office: 0.34, box: 0.2, dancer: 0.18, riot: 0.18, bomber: 0.1 }, hp: 17.64 },
        { time: 30, rate: 4.8, hordes: 2, hordeSize: 56, mix: { office: 0.4, box: 0.2, dancer: 0.15, riot: 0.15, bomber: 0.1 }, hp: 20.16, boss: 'ceo', bossHp: 1.96 },
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
