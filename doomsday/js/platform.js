/* ==========================================================================
   platform.js — 출시 기본 기능 (베파 표준 · 데드러시 V12 기준)
   빌드 번호 · 통계 · 진동 · 공유 · 배경음악 · 자동 저사양 · 일일 미션 · 출석 · 안내 · 개인정보
   위챗(wx) / 더우인(tt) / 웹 을 자동으로 구분해서 같은 코드로 동작
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const L = (a, b) => DX.L(a, b);
  const API = DX.API, PF = DX.PLATFORM;

  // ★ 빌드 번호 (월일-시분). 화면 아래에 표시 → 휴대폰에서 최신판인지 확인용
  DX.BUILD = '1113-1221';

  /* ---------------- 저장소 (위챗·더우인은 플랫폼 저장소, 웹은 localStorage) ---------------- */
  DX.store = {
    get(k) { try { if (API && API.getStorageSync) return API.getStorageSync(k) || null; return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { if (API && API.setStorageSync) API.setStorageSync(k, v); else localStorage.setItem(k, v); } catch (e) {} },
    clear() { try { if (API && API.clearStorageSync) API.clearStorageSync(); else localStorage.clear(); } catch (e) {} },
  };

  /* ---------------- 통계 ----------------
     위챗 reportEvent / 더우인 reportAnalytics. ★ 관리자 화면에 같은 이벤트 이름을 등록해야 집계됨 (README 참고) */
  const LOG = [];
  DX.track = function (ev, data) {
    data = data || {};
    try {
      LOG.push([ev, data]); if (LOG.length > 200) LOG.shift();
      if (API && PF === 'wx' && API.reportEvent) API.reportEvent(ev, data);
      else if (API && PF === 'tt' && API.reportAnalytics) API.reportAnalytics(ev, data);
      const s = DX.save; if (s) { s.statc = s.statc || {}; s.statc[ev] = (s.statc[ev] || 0) + 1; }
    } catch (e) {}
  };
  DX.trackLog = LOG;

  /* ---------------- 진동 (약·중·강·길게, 짧은 간격 제한) ---------------- */
  let vibT = 0;
  DX.vib = function (kind) {
    if (!DX.save || DX.save.vibrate === false) return;
    const now = Date.now(); if (kind === 'light' && now - vibT < 250) return; vibT = now;
    try {
      if (API && API.vibrateShort && kind !== 'long') API.vibrateShort({ type: kind === 'heavy' ? 'heavy' : kind === 'medium' ? 'medium' : 'light' });
      else if (API && API.vibrateLong && kind === 'long') API.vibrateLong();
      else if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 60 : kind === 'medium' ? 35 : kind === 'long' ? 200 : 15);
    } catch (e) {}
  };

  /* ---------------- 공유 ---------------- */
  DX.share = function (text, where) {
    DX.track('share', { where: where || '' });
    const title = text || L('출근길 좀비 떼를 뚫어뻥으로 막아라! 둠스데이 익스프레스', '用马桶塞挡住通勤尸潮！末日快车');
    try {
      if (API && API.shareAppMessage) { API.shareAppMessage({ title, imageUrl: 'assets/ui/share.jpg' }); return 'ok'; }
      if (navigator.share) { navigator.share({ title, text: title, url: location.href }).catch(() => {}); return 'ok'; }
      if (navigator.clipboard) { navigator.clipboard.writeText(title + ' ' + location.href).catch(() => {}); return 'copied'; }
    } catch (e) {}
    return 'none';
  };
  if (API && API.showShareMenu) { try { API.showShareMenu({ withShareTicket: true }); if (API.onShareAppMessage) API.onShareAppMessage(() => ({ title: L('출근길 좀비 떼를 뚫어뻥으로 막아라!', '用马桶塞挡住通勤尸潮！') })); } catch (e) {} }

  /* ---------------- 배경음악 (파일 없이 직접 합성, 끊김 없이 반복) ---------------- */
  const Music = DX.Music = { ctx: null, gain: null, timer: 0, step: 0, mode: '', next: 0 };
  Music.attach = function (ctx) { if (Music.ctx || !ctx) return; Music.ctx = ctx; Music.gain = ctx.createGain(); Music.gain.gain.value = 0.0; Music.gain.connect(ctx.destination); };
  const PAT = {
    lobby: { bpm: 96, bass: [45, 0, 45, 0, 52, 0, 50, 0, 48, 0, 48, 0, 43, 0, 47, 0], kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1], hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1], lead: [69, 0, 0, 72, 0, 0, 76, 0, 74, 0, 72, 0, 71, 0, 0, 0], vol: 0.06 },
    battle: { bpm: 138, bass: [40, 40, 52, 40, 40, 52, 43, 45, 40, 40, 52, 40, 47, 47, 45, 43], kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1], hat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1], lead: [76, 0, 79, 0, 76, 74, 0, 72, 74, 0, 76, 0, 79, 81, 79, 0], vol: 0.055 },
  };
  function note(f, t, d, type, v, dest) { const c = Music.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g); g.connect(dest); o.start(t); o.stop(t + d + 0.02); }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function tick() {
    const c = Music.ctx; if (!c || !Music.mode) return;
    const P = PAT[Music.mode], sd = 60 / P.bpm / 4;
    while (Music.next < c.currentTime + 0.2) {
      const i = Music.step % 16, t = Music.next;
      if (P.bass[i]) note(mtof(P.bass[i]), t, sd * 1.8, 'triangle', 0.5, Music.gain);
      if (P.kick[i]) note(110, t, 0.12, 'sine', 0.9, Music.gain);
      if (P.hat[i]) note(7000 + Math.random() * 500, t, 0.03, 'square', 0.06, Music.gain);
      if (P.lead[i] && (Music.step >> 4) % 2 === 1) note(mtof(P.lead[i]), t, sd * 1.6, 'square', 0.12, Music.gain);
      Music.next += sd; Music.step++;
    }
  }
  Music.play = function (mode) {
    const c = Music.ctx; if (!c) return;
    const on = DX.save && DX.save.music !== false && !Music.hidden;
    if (!on) mode = '';
    if (mode === Music.mode) return;
    Music.mode = mode;
    clearInterval(Music.timer);
    if (!mode) { Music.gain.gain.setTargetAtTime(0, c.currentTime, 0.2); return; }
    Music.gain.gain.setTargetAtTime(PAT[mode].vol, c.currentTime, 0.4);
    Music.next = c.currentTime + 0.1; Music.step = 0;
    Music.timer = setInterval(tick, 60);
  };
  Music.stop = function () { Music.play(''); };

  /* ---------------- 자동 저사양 전환 (2초 평균 45fps 미만이 2번 이어지면) ---------------- */
  let pAcc = 0, pN = 0, pBad = 0;
  DX.perf = function (dt) {
    const s = DX.save; if (!s || s.qualityManual || s.quality === 'low' || DX.state !== 'play') return;
    pAcc += dt; pN++;
    if (pAcc >= 2) {
      const fps = pN / pAcc; pAcc = 0; pN = 0;
      if (fps < 45) { if (++pBad >= 2) { DX.setQuality('low'); if (DX.UI) DX.UI.toast(L('저사양 모드 자동 적용', '已自动切换省电模式')); DX.track('perf_low', { fps: Math.round(fps) }); } }
      else pBad = 0;
    }
  };

  /* ---------------- 일일 미션 / 7일 출석 ---------------- */
  DX.MISSIONS = [
    { k: 'kill', goal: 300, name: ['좀비 300마리 처치', '击杀300只僵尸'], gold: 40 },
    { k: 'clear', goal: 1, name: ['스테이지 1회 클리어', '通关1次'], gold: 60 },
    { k: 'ult', goal: 3, name: ['대파 폭격 3회 사용', '使用大葱轰炸3次'], gold: 40 },
    { k: 'fight', goal: 2, name: ['실내 침입 2회 격퇴', '击退车厢入侵2次'], gold: 50 },
    { k: 'combo', goal: 300, name: ['300 콤보 달성', '达成300连击'], gold: 40 },
    { k: 'horn', goal: 3, name: ['비상 경적 3회 사용', '使用紧急鸣笛3次'], gold: 30 },
    { k: 'run', goal: 3, name: ['출발 3회', '出发3次'], gold: 30 },
    { k: 'boss', goal: 1, name: ['보스 1마리 처치', '击败1个BOSS'], gold: 50 },
  ];
  DX.ATT = [30, 40, 50, 60, 80, 100, 200];
  DX.today = function () { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  DX.dailyInit = function () {
    const s = DX.save, t = DX.today();
    if (s.daily && s.daily.day === t) return;
    let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) | 0;
    const pool = DX.MISSIONS.map((m, i) => i), pick = [];
    while (pick.length < 3 && pool.length) { h = (h * 1103515245 + 12345) | 0; pick.push(pool.splice(Math.abs(h) % pool.length, 1)[0]); }
    s.daily = { day: t, m: pick.map(i => ({ i, p: 0, c: false })) };
    DX.persist();
  };
  DX.mission = function (k, n, setMax) {
    const s = DX.save; if (!s) return; DX.dailyInit();
    for (const m of s.daily.m) {
      const M = DX.MISSIONS[m.i]; if (M.k !== k || m.c || m.p >= M.goal) continue;
      m.p = Math.min(M.goal, setMax ? Math.max(m.p, n) : m.p + (n || 1));
      if (m.p >= M.goal && DX.UI) DX.UI.toast(L('일일 미션 완료! ', '每日任务完成！') + (DX.lang() === 'zh' ? M.name[1] : M.name[0]));
    }
  };
  DX.attCan = () => !DX.save.att || DX.save.att.last !== DX.today();
  DX.rewardDot = function () {
    const s = DX.save; DX.dailyInit();
    if (DX.attCan()) return true;
    return s.daily.m.some(m => !m.c && m.p >= DX.MISSIONS[m.i].goal);
  };

  /* ---------------- 처방전: 처음 보는 화면 팁 (1회) ---------------- */
  DX.TIPS = {
    lobby: [['출발을 누르면 스테이지가 시작돼요. 좀비를 잡아 레벨업하고 카드를 골라 열차를 키우세요.', '点击出发开始关卡。击杀僵尸升级，选择卡牌强化列车。'], ['판이 끝나면 받은 골드로 [열차 강화]를 할 수 있어요.', '每局结束后可用金币进行【列车强化】。']],
    meta: [['강화는 한 단계마다 아주 조금씩 강해져요. 꾸준히 쌓으면 어려운 스테이지도 깰 수 있어요.', '每级强化提升很少，坚持积累就能通过困难关卡。']],
    reward: [['매일 미션 3개와 출석 보상이 있어요. 빨간 점이 보이면 받을 보상이 있다는 뜻이에요.', '每天有3个任务和签到奖励。看到红点就说明有奖励可领。']],
  };

  /* ---------------- 작전 안내서 (여러 페이지) ---------------- */
  DX.GUIDE = [
    { t: ['기본 흐름', '基本流程'], b: [['출발 → 좀비 처치 → 초록 구슬(경험치) → 레벨업 카드 선택 → 웨이브 10개 → 보스 → 클리어 → 골드로 열차 강화', '出发 → 击杀僵尸 → 绿色宝珠（经验） → 选择升级卡牌 → 10个波次 → BOSS → 通关 → 用金币强化列车'], ['좀비가 열차에 붙으면 체력이 줄어요. 체력이 0이 되면 실패예요.', '僵尸贴上列车会扣血，生命归零即失败。']] },
    { t: ['무기와 열차 칸', '武器与车厢'], b: [['레벨업 카드로 무기를 얻으면 열차에 칸이 하나씩 붙어요.', '通过升级卡牌获得武器，列车就会多一节车厢。'], ['무기는 Lv5가 되면 진화해서 훨씬 강해져요.', '武器到Lv5会进化，变得更强。']] },
    { t: ['버튼', '按钮'], b: [['🥬 대파 폭격: 좀비를 잡으면 충전돼요. 가득 차면 눌러서 하늘에서 대파를 떨어뜨려요.', '🥬 大葱轰炸：击杀僵尸充能，充满后点击从天降下大葱。'], ['📯 비상 경적: 열차 주변 좀비를 한 번에 밀쳐내요. 위험할 때 누르세요.', '📯 紧急鸣笛：一次性推开列车周围的僵尸，危险时使用。'], ['📷 카메라: 원거리/근거리를 바꿔요.', '📷 镜头：切换远景/近景。']] },
    { t: ['실내 침입', '车厢入侵'], b: [['🚨 표시가 뜨면 좀비가 칸 안으로 들어온 거예요. 그 칸의 무기가 멈춰요.', '出现🚨标志说明僵尸闯入车厢，该车厢武器会停止。'], ['표시를 누르고 화면을 연타해서 좀비를 창밖으로 날려버리세요. 성공하면 보상이 있어요.', '点击标志后连点屏幕，把僵尸打飞出窗外，成功有奖励。']] },
    { t: ['보상', '奖励'], b: [['매일 미션 3개 · 7일 출석 · 보급 상자(하루 3회)가 있어요.', '每天3个任务 · 7日签到 · 补给箱（每天3次）。'], ['광고는 원할 때만 봐요: 부활, 골드 2배, 카드 다시 뽑기, 보급 상자.', '广告只在你想看时播放：复活、金币翻倍、重新抽卡、补给箱。']] },
  ];

  /* ---------------- 개인정보 처리방침 ---------------- */
  DX.PRIVACY = [
    '1. 이 게임은 회원가입이 없으며, 개발자는 이름·전화번호·위치 같은 개인정보를 수집하지 않습니다.\n\n2. 게임 진행 기록(스테이지, 골드, 설정)은 이 기기 안에만 저장됩니다. 게임을 삭제하거나 저장 공간을 지우면 함께 지워집니다.\n\n3. 보상형 광고는 위챗·더우인 등 플랫폼이 제공합니다. 광고를 보여 주기 위해 플랫폼이 기기 정보를 처리할 수 있으며, 이는 각 플랫폼의 개인정보 정책을 따릅니다.\n\n4. 게임 개선을 위해 스테이지 시작·클리어·실패, 광고 시청 같은 익명 통계를 플랫폼 통계 기능으로 집계합니다. 개인을 식별하는 정보는 포함하지 않습니다.\n\n5. 공유 기능은 사용자가 직접 누를 때만 작동합니다.\n\n6. 문의: 게임 정보 페이지의 개발자 연락처로 보내 주세요.',
    '1. 本游戏无需注册，开发者不收集姓名、手机号、位置等个人信息。\n\n2. 游戏进度（关卡、金币、设置）仅保存在本设备中，删除游戏或清除缓存后将一并删除。\n\n3. 激励视频广告由微信/抖音等平台提供。为展示广告，平台可能处理设备信息，相关处理遵循各平台的隐私政策。\n\n4. 为改进游戏，我们通过平台统计功能汇总关卡开始/通关/失败、广告观看等匿名数据，不包含可识别个人身份的信息。\n\n5. 分享功能仅在用户主动点击时使用。\n\n6. 联系方式：请通过游戏资料页中的开发者联系方式与我们联系。'
  ];
  // 중국어 화면 「健康游戏忠告」
  DX.HEALTH = ['抵制不良游戏，拒绝盗版游戏。注意自我保护，谨防受骗上当。', '适度游戏益脑，沉迷游戏伤身。合理安排时间，享受健康生活。'];

  /* ---------------- 생명주기 (위챗·더우인) ---------------- */
  if (API && API.onHide) { try { API.onHide(() => { if (DX.onAppHide) DX.onAppHide(); }); API.onShow(() => { if (DX.onAppShow) DX.onAppShow(); }); } catch (e) {} }
  if (API && API.getUpdateManager) { try { const um = API.getUpdateManager(); um.onUpdateReady(() => { um.applyUpdate(); }); } catch (e) {} }
})(window.DX);
