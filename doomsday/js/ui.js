/* ==========================================================================
   ui.js — 화면(로딩·인트로·로비·보상·HUD·레벨업·결과·설정·안내서) 연결
   - 이미지 교체 규칙: HTML의 data-slot="이름" 요소는 config.assets.ui[이름] 파일이 있으면 그 이미지로 자동 교체
   - 화면에 보이는 모든 문구는 T()(사전 번역) 또는 L(한국어, 중국어)로 감싼다
   ========================================================================== */
window.DX = window.DX || {};
(function (DX) {
  'use strict';
  const C = DX.CONFIG, E = DX.E;
  const T = s => DX.T(s), L = (a, b) => DX.L(a, b);
  const $ = id => document.getElementById(id);
  const UI = DX.UI = {};
  const show = (el, on) => el.classList.toggle('hidden', !on);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- 이미지 슬롯 ---------------- */
  function loadSlots() {
    const ui = C.assets.ui;
    for (const key in ui) {
      if (key === 'logoZh') continue;
      const src = key === 'logo' && DX.lang() === 'zh' && ui.logoZh ? ui.logoZh : ui[key];
      const img = new Image();
      img.onload = () => {
        document.querySelectorAll('[data-slot="' + key + '"]').forEach(el => { el.style.backgroundImage = 'url("' + src + '")'; el.classList.add('has-img'); });
        if (key === 'lobbyBg') { $('lobby').style.backgroundImage = 'url("' + ui[key] + '")'; $('lobby').classList.add('has-bg'); }
        if (key === 'cardFrame') document.documentElement.style.setProperty('--card-img', 'url("' + ui[key] + '")');
      };
      img.src = src;
    }
  }
  UI.loadSlots = loadSlots;
  function iconHtml(src, emoji) {
    if (src) return '<img src="' + src + '" alt="" onerror="this.replaceWith(document.createTextNode(\'' + (emoji || '★') + '\'))">';
    return emoji || '★';
  }
  // 하늘: 색 그라데이션 + (있으면) 구름 그림. 그림은 스테이지 테마의 skyImg
  UI.setSky = function (top, bot, img) {
    const r = document.documentElement.style; r.setProperty('--sky-top', top); r.setProperty('--sky-bot', bot);
    r.setProperty('--sky-img', img ? 'url("' + new URL(img, location.href).href + '")' : 'none');   // 절대 주소로 (css 폴더 기준으로 잘못 찾던 문제)
  };

  /* ---------------- 알림 ---------------- */
  UI.toast = function (msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('app').appendChild(t); setTimeout(() => t.remove(), 1600); };
  const toast = UI.toast;
  UI.error = function (e) { const el = $('err'); el.textContent = L('오류: ', '错误：') + (e && e.message || e); show(el, true); setTimeout(() => show(el, false), 5000); };

  /* ---------------- 로딩 화면 ----------------
     그림을 다 받을 때까지 진행 막대 → 6초 넘으면 '느림' 안내 → 25초가 지나면 안전하게 넘어감(그림 없으면 기본 모델) */
  function runLoading(next) {
    const scr = $('loading'), bar = $('ldBar'), txt = $('ldTxt');
    let done = false;
    const t0 = performance.now();
    const set = p => { bar.style.width = Math.round(p * 100) + '%'; txt.textContent = L('불러오는 중... ', '加载中… ') + Math.round(p * 100) + '%'; };
    set(0);
    if (DX.SPR) DX.SPR.onProgress = set;
    const slow = setTimeout(() => { if (!done) show($('ldSlow'), true); }, 6000);
    const finish = (why) => {
      if (done) return; done = true; clearTimeout(slow); clearTimeout(safety);
      set(1);
      const ms = Math.round(performance.now() - t0);
      DX.track('load_done', { ms, why, fail: (DX.SPR && DX.SPR.failed) || 0, retry: (DX.SPR && DX.SPR.retries) || 0 });
      scr.classList.add('fade'); setTimeout(() => show(scr, false), 380);
      next();
      if (why === 'timeout' || (DX.SPR && !DX.SPR.ready)) setTimeout(() => toast(L('그림을 다 못 받았어요. 새로고침하면 다시 받아요', '图片未完全加载，刷新页面可重新加载')), 600);
    };
    const safety = setTimeout(() => finish('timeout'), 25000);
    (DX.loadP || Promise.resolve()).then(() => finish('ok'), () => finish('error'));
  }

  /* ---------------- 인트로 ---------------- */
  let storyIdx = 0;
  function showIntro() {
    storyIdx = 0; show($('intro'), true); show($('lobby'), false); renderStory();
  }
  function renderStory() {
    const s = C.story[storyIdx];
    $('storyImg').src = C.assets.story[s.img];
    $('storyText').textContent = T(s.text);
    show($('storyText'), !!C.storyCaption);
    const f = document.querySelector('.story-frame'); f.style.animation = 'none'; void f.offsetWidth; f.style.animation = '';
    $('storyDots').innerHTML = C.story.map((_, i) => '<i class="' + (i === storyIdx ? 'on' : '') + '"></i>').join('');
  }
  function endIntro() {
    DX.save.seenIntro = true; DX.persist(); show($('intro'), false);
    // 첫 실행: 설명 없이 바로 1스테이지로
    if (!DX.save.firstRunDone) { DX.save.firstRunDone = true; DX.persist(); DX.track('tutorial', { step: 'first_run' }); startStage(0); }
    else showLobby();
  }

  /* ---------------- 로비 ---------------- */
  let tab = 'stage';
  function showLobby() {
    show($('lobby'), true); show($('hud'), false);
    DX.dailyInit();
    refreshLobby();
    setTimeout(() => tip('lobby'), 350);
  }
  UI.showLobby = showLobby;
  function stageUnlocked(i) { return C.game.unlockAllStages || i === 0 || DX.save.cleared[C.stages[i - 1].id]; }
  function refreshLobby() {
    $('logoSub').textContent = T(C.game.subtitle);
    $('lobGold').textContent = DX.save.gold.toLocaleString();
    const sl = supplyLeft();
    $('supplyN').textContent = sl + '/' + C.ads.supplyPerDay;
    $('btnSupply').disabled = sl <= 0;
    const i = DX.save.stage || 0, st = C.stages[i];
    $('stName').textContent = (i + 1) + '. ' + T(st.name);
    $('stDesc').textContent = T(st.desc);
    const best = DX.save.best[st.id];
    $('stBest').textContent = L('최고 기록 : ', '最高纪录：') + (best ? 'WAVE ' + best + ' / ' + st.waves.length : '-');
    const th = $('stThumb');
    th.onerror = () => { if (st.thumbFallback && th.src.indexOf(st.thumbFallback) < 0) { th.src = st.thumbFallback; return; } th.onerror = null; th.src = C.assets.story[i % 2 === 0 ? 2 : 1]; };
    th.src = st.thumb || C.assets.story[2];
    $('stBadge').textContent = !stageUnlocked(i) ? T('🔒 잠김') : DX.save.cleared[st.id] ? 'CLEAR' : '';
    $('btnStart').disabled = !stageUnlocked(i);
    $('btnStart').style.opacity = stageUnlocked(i) ? 1 : 0.5;
    // 강화
    const M = C.meta;
    $('metaList').innerHTML = Object.keys(M).map(k => {
      const m = M[k], lv = DX.save.meta[k] || 0, max = lv >= m.max, cost = max ? 0 : DX.metaCost(k, lv);
      return '<div class="row"><div class="r-ico">' + m.icon + '</div><div class="r-main"><div class="r-name">' + esc(T(m.name)) + ' <small style="color:var(--gold)">Lv ' + lv + '/' + m.max + '</small></div><div class="r-desc">' + esc(T(m.desc)) + '</div></div>' +
        '<button class="r-btn" data-meta="' + k + '"' + (max || DX.save.gold < cost ? ' disabled' : '') + '>' + (max ? 'MAX' : '🪙 ' + cost) + '</button></div>';
    }).join('');
    renderReward();
    $('nextGoal').textContent = nextGoal();
    $('healthTxt').innerHTML = DX.lang() === 'zh' ? DX.HEALTH.map(esc).join('<br>') : '';
    $('verTxt').textContent = 'v' + C.game.version.replace(/^v/, '') + ' · ' + DX.BUILD;
  }
  // 지도 아래 '다음 목표' 한 줄
  function nextGoal() {
    if (DX.rewardDot()) return L('🎁 받을 보상이 있어요! [보상] 탭을 확인하세요', '🎁 有奖励可领取！请查看【奖励】');
    const idx = C.stages.findIndex(s => !DX.save.cleared[s.id]);
    if (idx < 0) return L('🏆 모든 스테이지 클리어! 최고 기록에 도전하세요', '🏆 已通关全部关卡！挑战最高纪录吧');
    const st = C.stages[idx], best = DX.save.best[st.id] || 0;
    const cheap = Object.keys(C.meta).filter(k => (DX.save.meta[k] || 0) < C.meta[k].max).map(k => DX.metaCost(k, DX.save.meta[k] || 0)).sort((a, b) => a - b)[0];
    if (best >= 5 && cheap && DX.save.gold >= cheap) return L('💪 골드로 [열차 강화]를 하면 ' + (idx + 1) + '스테이지가 쉬워져요', '💪 用金币【列车强化】后更容易通过第' + (idx + 1) + '关');
    return L('🎯 다음 목표: ' + (idx + 1) + '스테이지 클리어 (최고 WAVE ' + best + '/' + st.waves.length + ')', '🎯 下一个目标：通关第' + (idx + 1) + '关（最高 WAVE ' + best + '/' + st.waves.length + '）');
  }
  function setTab(t) {
    tab = t;
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    ['stage', 'meta', 'reward'].forEach(k => show($('tab-' + k), k === t));
    if (t !== 'stage') tip(t);
  }

  /* ---------------- 보상 탭: 7일 출석 + 일일 미션 3개 ---------------- */
  function renderReward() {
    DX.dailyInit();
    const s = DX.save, att = s.att, can = DX.attCan();
    const day = att.streak % 7;  // 오늘 받을 칸
    let h = '<div class="rw-head">' + L('7일 출석', '7日签到') + '</div><div class="att">' +
      DX.ATT.map((g, i) => '<div class="' + (i < day ? 'got' : i === day && can ? 'now' : '') + '">' + L((i + 1) + '일', '第' + (i + 1) + '天') + '<b>' + g + '</b></div>').join('') + '</div>';
    h += '<div class="row"><div class="r-ico">📅</div><div class="r-main"><div class="r-name">' + L('오늘 출석', '今日签到') + '</div><div class="r-desc">' + L('골드 ', '金币 ') + DX.ATT[day] + '</div></div><button class="r-btn" data-att="1"' + (can ? '' : ' disabled') + '>' + (can ? L('받기', '领取') : L('완료', '已领')) + '</button></div>';
    h += '<div class="rw-head">' + L('오늘의 미션', '今日任务') + '</div>';
    h += s.daily.m.map((m, j) => {
      const M = DX.MISSIONS[m.i], done = m.p >= M.goal;
      return '<div class="row"><div class="r-ico">' + (m.c ? '✅' : done ? '🎁' : '🎯') + '</div><div class="r-main"><div class="r-name">' + esc(L(M.name[0], M.name[1])) + '</div><div class="r-desc">' + m.p + ' / ' + M.goal + L(' · 골드 ', ' · 金币 ') + M.gold + '</div><div class="r-bar"><i style="width:' + (m.p / M.goal * 100) + '%"></i></div></div>' +
        '<button class="r-btn" data-mis="' + j + '"' + (done && !m.c ? '' : ' disabled') + '>' + (m.c ? L('완료', '已领') : L('받기', '领取')) + '</button></div>';
    }).join('');
    $('rewardList').innerHTML = h;
    show($('rewardDot'), DX.rewardDot());
  }

  /* ---------------- 처음 보는 화면 팁 (1회) ---------------- */
  function tip(key) {
    const s = DX.save; if (!DX.TIPS[key] || s.tips[key]) return;
    if ($('lobby').classList.contains('hidden') || !$('pause').classList.contains('hidden') || !$('guide').classList.contains('hidden')) return;
    s.tips[key] = true; DX.persist();
    $('tipBody').innerHTML = DX.TIPS[key].map(t => '<p>' + esc(L(t[0], t[1])) + '</p>').join('');
    show($('tip'), true);
  }

  /* ---------------- 작전 안내서 ---------------- */
  let gPage = 0;
  function openGuide() { gPage = 0; renderGuide(); show($('guide'), true); DX.track('guide_open', {}); }
  function renderGuide() {
    const g = DX.GUIDE[gPage];
    $('guideTitle').textContent = (gPage + 1) + '. ' + L(g.t[0], g.t[1]);
    $('guideBody').innerHTML = g.b.map(b => '<p>' + esc(L(b[0], b[1])) + '</p>').join('');
    $('guideDots').innerHTML = DX.GUIDE.map((_, i) => '<i class="' + (i === gPage ? 'on' : '') + '"></i>').join('');
    $('guidePrev').disabled = gPage === 0; $('guidePrev').style.opacity = gPage === 0 ? 0.4 : 1;
    $('guideNext').textContent = gPage === DX.GUIDE.length - 1 ? L('닫기', '关闭') : L('다음 ▶', '下一页 ▶');
  }

  /* ---------------- 손가락 안내 (첫 판, 눌러 보면 사라짐) ---------------- */
  let fingerKey = '';
  function finger(key, el) {
    const f = $('finger');
    if (!el) { if (fingerKey === key) { show(f, false); fingerKey = ''; } return; }
    const r = el.getBoundingClientRect(), a = $('app').getBoundingClientRect();
    f.style.left = (r.left - a.left + r.width / 2) + 'px'; f.style.top = (r.top - a.top + r.height / 2) + 'px';
    if (fingerKey !== key) { fingerKey = key; show(f, true); DX.track('tutorial', { step: 'hint_' + key }); }
  }
  function hintDone(key) { if (!DX.save.hints[key]) { DX.save.hints[key] = true; DX.persist(); DX.track('tutorial', { step: 'done_' + key }); } if (fingerKey === key) finger(key, null); }
  function updHints(G) {
    const h = DX.save.hints, play = DX.state === 'play';
    let want = '';
    if (play && !h.inv) { const m = Object.values(markEls)[0]; if (m) { finger('inv', m); want = 'inv'; } }
    if (!want && play && !h.ult && G.ult >= 1) { finger('ult', $('btnUlt')); want = 'ult'; }
    if (!want && play && !h.horn && G.hornCd <= 0 && G.hp / G.hpMax < 0.6) { finger('horn', $('btnHorn')); want = 'horn'; }
    if (!want && fingerKey) finger(fingerKey, null);
  }

  /* ---------------- 런 시작 / HUD ---------------- */
  let ownedKey = '';
  UI.onRunStart = function (G) {
    show($('lobby'), false); show($('hud'), true); show($('result'), false); show($('levelup'), false);
    show($('bossRow'), false); show($('combo'), false);
    $('camLabel').textContent = T(C.camera[DX.save.cam].label);
    ownedKey = '';
  };
  let lastCombo = 0;
  const markEls = {};
  function updMarks(G) {
    const box = $('invMarks');
    const want = {};
    if (G && G.inv && DX.state === 'play') {
      for (const k in G.inv) {
        const c = G.layout.cars[k]; if (!c) continue;
        const p = E.project(0, 3.6, c.cz); if (!p) continue;
        want[k] = 1;
        let el = markEls[k];
        if (!el) {
          el = markEls[k] = document.createElement('button'); el.className = 'inv-mark';
          el.addEventListener('pointerdown', ev => { ev.stopPropagation(); hintDone('inv'); DX.startFight(+k); });
          box.appendChild(el);
        }
        const left = Math.ceil(Math.max(0, C.invasion.autoClear - G.inv[k].t)), n = G.inv[k].n;
        el.innerHTML = L('🚨 침입! 터치<small>좀비 ' + n + '마리 · ' + left + '초</small>', '🚨 入侵！点击<small>僵尸 ' + n + ' 只 · ' + left + ' 秒</small>');
        el.style.left = p.x + 'px'; el.style.top = p.y + 'px';
      }
    }
    for (const k in markEls) if (!want[k]) { markEls[k].remove(); delete markEls[k]; }
  }
  // 보스 등장 컷인: 보스 그림이 옆에서 쓱 들어오고 이름·대사 크게
  UI.bossIntro = function (cfg) {
    const el = $('bossIntro'); if (!el) return;
    const cl = DX.SPR && DX.SPR.clean && DX.SPR.clean[cfg.art];
    $('biImg').src = cl ? cl.toDataURL() : (cfg.art && C.art[cfg.art] ? C.art[cfg.art].full : ''); $('biImg').style.filter = cfg.artTint ? 'sepia(0.3) hue-rotate(' + (cfg.artTint[2] > cfg.artTint[1] ? 230 : 70) + 'deg) saturate(1.4)' : '';
    $('biName').textContent = T(cfg.name); $('biQuote').textContent = cfg.quote ? '“' + T(cfg.quote) + '”' : '';
    el.classList.remove('hidden', 'go'); void el.offsetWidth; el.classList.add('go');
    clearTimeout(UI._biT); UI._biT = setTimeout(() => el.classList.add('hidden'), 1900);
    if (navigator.vibrate) try { navigator.vibrate([40, 60, 80]); } catch (e) {}
  };
  UI.frame = function (G, dt) {
    drawFx(G, dt);
    { const v = $('vignette'); if (v) { const hp = G ? G.hp / G.hpMax : 1; const low = G && hp < 0.3 && G.endT < 0; v.style.opacity = low ? (0.45 + Math.sin(performance.now() / 160) * 0.25) * (1 - hp / 0.3 * 0.6) : (G && G.hurt > 0 ? Math.min(0.5, G.hurt * 2) : 0); } }
    updMarks(G);
    if (!G) { if (fingerKey) finger(fingerKey, null); return; }
    updHints(G);
    const w = G.wave;
    $('hudWave').textContent = 'WAVE ' + Math.min(G.waveIdx + 1, G.stg.waves.length) + ' / ' + G.stg.waves.length;
    $('hudWaveBar').style.width = (w ? (w.boss ? (G.boss ? (1 - G.boss.hp / G.boss.maxHp) : 1) : Math.min(1, G.waveT / w.time)) * 100 : 0) + '%';
    $('hudGold').textContent = Math.floor(G.gold).toLocaleString();
    const hp = Math.max(0, G.hp / G.hpMax);
    $('hudHp').style.width = Math.min(100, hp * 100) + '%';
    $('hudHp').style.background = G.shield > 0 ? 'linear-gradient(180deg,#bffaff,#5ff3ff)' : hp < 0.3 ? 'linear-gradient(180deg,#ff8a8a,#ff3b3b)' : '';
    $('hudHpTxt').textContent = Math.ceil(G.hp) + ' / ' + Math.round(G.hpMax) + (G.shield > 0 ? '  🛡 ' + G.shield.toFixed(1) : '');
    $('hudLv').textContent = 'Lv ' + G.level;
    $('hudXp').style.width = Math.min(100, G.xp / G.xpNeed * 100) + '%';
    if (G.boss) $('bossHp').style.width = Math.max(0, G.boss.hp / G.boss.maxHp * 100) + '%';
    if (G.combo >= 10) {
      show($('combo'), true);
      if (G.combo !== lastCombo) { $('comboN').textContent = G.combo; const c = $('combo'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
    } else show($('combo'), false);
    lastCombo = G.combo;
    $('ultRing').style.strokeDashoffset = (276.5 * (1 - G.ult)).toFixed(1);
    $('btnUlt').classList.toggle('ready', G.ult >= 1);
    $('hornCd').textContent = G.hornCd > 0 ? Math.ceil(G.hornCd) : '';
    const key = JSON.stringify(G.weapons) + JSON.stringify(G.passives);
    if (key !== ownedKey) {
      ownedKey = key;
      let h = '';
      for (const id in G.weapons) { const wc = C.weapons[id], lv = G.weapons[id]; h += '<div class="w' + (lv >= 5 ? ' evo' : '') + '">' + iconHtml(lv >= 5 && wc.evoIcon ? wc.evoIcon : wc.icon, '🔫') + '<b>' + (lv >= 5 ? '★' : lv) + '</b></div>'; }
      for (const id in G.passives) h += '<div class="w">' + C.passives[id].icon + '<b>' + G.passives[id] + '</b></div>';
      $('owned').innerHTML = h;
    }
  };

  /* ---------------- 배너 ---------------- */
  let bannerTimer = 0;
  UI.banner = function (title, sub, type) {
    const b = $('banner');
    b.className = 'banner ' + (type || '');
    $('bTitle').textContent = T(title); $('bSub').textContent = T(sub || '');
    void b.offsetWidth;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => show(b, false), type === 'boss' ? 2600 : type === 'wave' ? 1300 : 1600);
  };
  UI.bossBar = function (on, name) { show($('bossRow'), on); if (name) $('bossName').textContent = T(name); };
  UI.comboPop = function (n) { if (n >= 100) UI.banner(n + ' COMBO!!', n >= 300 ? '미쳤다 이건...' : '골드 보너스 증가!', 'win'); };

  /* ---------------- 레벨업 ---------------- */
  UI.levelUp = function (cards, G) {
    UI.lastCards = cards;
    show($('levelup'), true);
    $('rerollN').textContent = L('(' + G.rerolls + '회 남음)', '（剩余' + G.rerolls + '次）');
    $('btnReroll').disabled = G.rerolls <= 0;
    const el = $('cards');
    el.innerHTML = '';
    cards.forEach(c => {
      const b = document.createElement('button');
      b.className = 'card' + (c.evo ? ' evo' : c.isNew ? ' new' : '');
      const frame = getComputedStyle(document.documentElement).getPropertyValue('--card-img');
      if (frame && frame.trim()) b.style.backgroundImage = frame;
      b.innerHTML = '<div class="c-ico">' + (c.icon ? iconHtml(c.icon, '🔫') : c.emoji) + '</div>' +
        '<div><div class="c-name">' + esc(T(c.name)) + '</div><div class="c-lv">' + (c.lv ? (c.evo ? T('★ 진화') : 'Lv ' + c.lv) : '') + '</div><div class="c-desc">' + esc(T(c.desc)) + '</div></div>' +
        (c.evo ? '<span class="c-tag">EVOLUTION</span>' : c.isNew ? '<span class="c-tag">NEW</span>' : '');
      let used = false;
      b.addEventListener('click', () => { if (used) return; used = true; DX.chooseCard(c); });
      el.appendChild(b);
    });
  };
  UI.hideLevelUp = function () { show($('levelup'), false); };

  /* ---------------- 보스 직전 보급 (선택형 광고) ---------------- */
  UI.bossSupply = function (bs) {
    $('bsHeal').textContent = L('열차 체력 ' + Math.round(bs.heal * 100) + '% 회복', '列车生命恢复 ' + Math.round(bs.heal * 100) + '%');
    $('bsShield').textContent = L('방어막 ' + bs.shield + '초', '护盾 ' + bs.shield + ' 秒');
    show($('bsUlt'), !!bs.ult);
    show($('bossSupply'), true);
  };

  /* ---------------- 결과 ---------------- */
  const wn = (k, d) => (C.weapons[k] && C.weapons[k].name) || d;
  const SRC_NAME = { mg: wn('mg', '기관총'), flame: '화염방사', tesla: wn('tesla', '테슬라 코일'), drone: wn('drone', '드론 폭탄'), cannon: wn('cannon', '캐논 터렛'), barrel: '드럼통', ult: C.ultimate.name, horn: C.horn.name, bomber: '회식 좀비 폭발', fall: '낭떠러지', misc: '기타' };
  let lastResult = null;
  UI.result = function (o) {
    const st = C.stages[o.stageIdx];
    if (o.win && !o._story) {
      o._story = true;
      const go = () => { if (o.final) showEnding(() => UI.result(o)); else UI.result(o); };
      if (st.outro && st.outro.length) { UI.dialogue(st.outro, '', go); return; }
      go(); return;
    }
    lastResult = o;
    show($('result'), true);
    const tot = Object.values(o.stats || {}).reduce((a, b) => a + b, 0) || 1;
    const top = Object.entries(o.stats || {}).filter(e => e[0] !== 'misc').sort((a, b) => b[1] - a[1]).slice(0, 5);
    const mx = top.length ? top[0][1] : 1;
    $('rDmg').innerHTML = top.map(e => '<div class="d"><span>' + esc(T(SRC_NAME[e[0]] || e[0])) + '</span><i style="width:' + Math.max(4, e[1] / mx * 150) + 'px"></i><b>' + Math.round(e[1] / tot * 100) + '%</b></div>').join('');
    const t = $('rTitle');
    t.textContent = T(o.win ? C.texts.victory : C.texts.defeat);
    t.classList.toggle('lose', !o.win);
    $('rSub').textContent = T(o.win ? C.texts.victorySub : C.texts.defeatSub);
    $('rStats').innerHTML = [['도달 웨이브', o.wave + (o.newBest ? ' ★' : '')], ['처치', o.kills.toLocaleString()], ['최대 콤보', o.maxCombo || 0], ['레벨', o.level]].map(s => '<div><b>' + s[1] + '</b><span>' + T(s[0]) + '</span></div>').join('');
    $('rGold').textContent = o.gold.toLocaleString();
    show($('btnRevive'), o.canRevive);
    show($('btnDouble'), C.ads.doubleGold);
  };

  /* ---------------- 떠다니는 글자 (데미지/퍽!) ---------------- */
  const fx = $('fx'), fctx = fx.getContext('2d');
  function drawFx(G, dt) {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    const w = fx.clientWidth, h = fx.clientHeight;
    if (fx.width !== Math.round(w * d) || fx.height !== Math.round(h * d)) { fx.width = Math.round(w * d); fx.height = Math.round(h * d); }
    fctx.setTransform(d, 0, 0, d, 0, 0);
    fctx.clearRect(0, 0, w, h);
    if (!G) return;
    fctx.textAlign = 'center'; fctx.textBaseline = 'middle'; fctx.lineJoin = 'round';
    for (const t of G.ftexts) {
      const p = E.project(t.x, t.y, t.z); if (!p) continue;
      const r = t.t / t.max;
      const sc = r < 0.15 ? 0.5 + r / 0.15 * 0.7 : 1.2 - Math.min(0.2, (r - 0.15));
      const size = Math.max(1, Math.round(t.size * sc * (t.big ? 1.2 : 1)));
      fctx.globalAlpha = Math.max(0, Math.min(1, (1 - r) * 2));
      if (t.dmg) {   // 데미지 숫자: 톡 튀었다가 위로
        const s2 = Math.round(t.size * (r < 0.12 ? 0.6 + r / 0.12 * 0.8 : 1.4 - Math.min(0.4, r * 0.6)));
        fctx.font = s2 + "px 'Black Han Sans', sans-serif"; fctx.lineWidth = Math.max(3, s2 / 4);
        fctx.strokeStyle = t.crit ? '#6a2a00' : '#1a1a22'; fctx.strokeText(t.txt, p.x, p.y - r * 18);
        fctx.fillStyle = t.col; fctx.fillText(t.txt, p.x, p.y - r * 18);
        continue;
      }
      fctx.font = size + "px 'Black Han Sans', 'Noto Sans SC', sans-serif";
      fctx.lineWidth = Math.max(3, size / 5);
      fctx.strokeStyle = '#11131a'; fctx.strokeText(t.txt, p.x, p.y);
      fctx.fillStyle = t.col; fctx.fillText(t.txt, p.x, p.y);
    }
    fctx.globalAlpha = 1;
  }

  /* ---------------- 대화 컷신 ---------------- */
  let dlg = null;
  UI.dialogue = function (lines, title, done) {
    dlg = { lines, i: 0, done };
    show($('dialog'), true);
    $('dlgStage').textContent = title || '';
    show($('dlgStage'), !!title);
    renderDlg();
  };
  function renderDlg() {
    const l = dlg.lines[dlg.i], sv = C.survivors[l.who] || C.survivors[0];
    $('dlgFace').src = sv.portrait; $('dlgName').textContent = T(sv.name); $('dlgText').textContent = T(l.text);
    const b = document.querySelector('.dlg-box'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = 'pop .2s';
  }
  function nextDlg(skip) {
    if (!dlg) return;
    dlg.i++;
    if (skip || dlg.i >= dlg.lines.length) { const d = dlg.done; dlg = null; show($('dialog'), false); if (d) d(); return; }
    DX.S.click(); renderDlg();
  }
  /* ---------------- 만화 컷 (챕터 시작) ---------------- */
  let cm = null;
  UI.comic = function (data, title, done) {
    cm = { d: data, i: 0, done, page: 0 };
    $('cmTitle').textContent = title || '';
    show($('comic'), true);
    $('cmPage').innerHTML = '';
    comicNext();
  };
  function comicPanel(p, k) {
    const d = cm.d, el = document.createElement('div');
    const side = k % 2 ? 'r' : 'l';
    el.className = 'cm-panel ' + side;
    const pos = d.pos || [0, 100, 50];
    el.style.backgroundImage = 'url("' + d.bg + '")';
    el.style.backgroundPosition = pos[k % pos.length] + '% 60%';
    if (d.zoom) el.style.backgroundSize = (d.zoom * 100) + '% auto';
    let h = d.tint ? '<div class="tint" style="background:' + d.tint + '"></div>' : '';
    if (p.cap) h += '<div class="cm-cap">' + esc(T(p.cap)) + '</div>';
    else {
      let face = '', name = '';
      if (typeof p.who === 'string' && p.who[0] === 'n') { const n = (C.comicNpc || [])[+p.who.slice(1)] || {}; face = n.face; name = n.name || ''; }
      else { const sv = C.survivors[p.who] || C.survivors[0]; face = sv.portrait; name = sv.name; }
      h += '<img class="face" src="' + face + '" alt=""><div class="cm-bub"><b>' + esc(T(name)) + '</b>' + esc(T(p.text)) + '</div>';
    }
    el.innerHTML = h;
    return el;
  }
  function comicNext(skip) {
    if (!cm) return;
    const P = cm.d.panels;
    if (skip || cm.i >= P.length) { const d = cm.done; cm = null; show($('comic'), false); if (d) d(); return; }
    const page = $('cmPage');
    if (page.children.length >= 3) page.innerHTML = '';
    page.appendChild(comicPanel(P[cm.i], cm.i));
    cm.i++;
    DX.S.click();
  }
  function showEnding(done) {
    const e = C.ending;
    $('endTitle').textContent = T(e.title); $('endSub').textContent = T(e.sub); $('endThanks').textContent = T(e.thanks);
    $('endFaces').innerHTML = C.survivors.map(s => '<img src="' + s.portrait + '" alt="">').join('');
    show($('ending'), true);
    $('btnEnd').onclick = () => { show($('ending'), false); done(); };
  }

  /* ---------------- 보상형 광고 ----------------
     ★ 광고 ID는 config.js 의 ads.unit 에 넣으면 끝. 비어 있으면 2초 테스트 광고.
     cb()는 광고를 '끝까지' 봤을 때만 호출. 중간에 닫으면 보상 없음. 강제 광고 없음. */
  let adObj = null, adCb = null, adFail = null, adKind = '', adWasPlaying = false;
  function realAd() {
    const API = DX.API, unit = C.ads.unit && C.ads.unit[DX.PLATFORM];
    if (!API || !unit || !API.createRewardedVideoAd) return null;
    if (!adObj) {
      adObj = API.createRewardedVideoAd({ adUnitId: unit });
      adObj.onClose(res => {
        const cb = adCb, fb = adFail; adCb = null; adFail = null; resumeAfterAd();
        if (res && res.isEnded === false) { toast(L('끝까지 봐야 보상을 받아요', '看完广告才能获得奖励')); if (fb) fb(); return; }
        DX.track('ad_reward', { kind: adKind }); if (cb) cb();
      });
      if (adObj.onError) adObj.onError(() => {});
    }
    return adObj;
  }
  function resumeAfterAd() { if (adWasPlaying && DX.state === 'paused') DX.state = 'play'; adWasPlaying = false; if (DX.Music) DX.Music.hidden = false; }
  // onFail(선택): 광고 실패·중간에 닫음 → 호출 (멈춘 화면을 풀어야 할 때 사용)
  DX.showAd = function (kind, cb, onFail) {
    adKind = kind; DX.track('ad_open', { kind });
    adWasPlaying = DX.state === 'play'; if (adWasPlaying) DX.state = 'paused';
    if (DX.Music) { DX.Music.hidden = true; DX.Music.stop(); }
    const ad = realAd();
    if (ad) {
      adCb = cb; adFail = onFail || null;
      ad.show().catch(() => ad.load().then(() => ad.show())).catch(() => {
        adCb = null; adFail = null; resumeAfterAd(); DX.track('ad_fail', { kind }); if (onFail) onFail();
        toast(L('광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요', '广告加载失败，请稍后再试'));
      });
      return;
    }
    // 테스트 광고 (ID가 없을 때)
    const scr = $('adScreen'); show(scr, true); show($('adFail'), false);
    let n = C.ads.testDuration; $('adCd').textContent = n;
    const iv = setInterval(() => {
      n--; $('adCd').textContent = Math.max(0, n);
      if (n <= 0) { clearInterval(iv); show(scr, false); resumeAfterAd(); DX.track('ad_reward', { kind }); cb(); }
    }, 1000);
  };
  function supplyLeft() { const s = DX.save.supply || (DX.save.supply = { day: '', n: 0 }); if (s.day !== DX.today()) { s.day = DX.today(); s.n = 0; } return Math.max(0, C.ads.supplyPerDay - s.n); }

  /* ---------------- 공유 ---------------- */
  function share(where) {
    const o = lastResult, st = o ? C.stages[o.stageIdx] : null;
    const text = o && o.win ? L(T(st.name) + ' 클리어! 좀비 ' + o.kills + '마리 처치. 너도 탈 수 있어?', '通关「' + T(st.name) + '」！击杀' + o.kills + '只僵尸，你也来试试？')
      : o ? L('WAVE ' + o.wave + '까지 버텼다... 정시 퇴근 열차에 탑승하라!', '坚持到了 WAVE ' + o.wave + '……快登上准点下班列车！')
      : L('좀비 사이로 정시 퇴근 열차가 달린다! 둠스데이 익스프레스', '僵尸堆里冲出准点下班列车！末日快车');
    const r = DX.share(text, where);
    if (r === 'copied') toast(L('공유 문구를 복사했어요', '分享文案已复制'));
  }

  /* ---------------- 일시정지 / 설정 ---------------- */
  let prevState = 'play', inLobbyPanel = false;
  function openPause(inLobby) {
    inLobbyPanel = inLobby;
    $('pauseTitle').textContent = inLobby ? T('설정') : T('일시정지');
    show($('btnQuit'), !inLobby); show($('btnIntro'), inLobby); show($('btnReset'), inLobby);
    $('btnResume').textContent = inLobby ? T('닫기') : T('계속하기');
    const s = DX.save;
    $('optMusic').checked = s.music; $('optSound').checked = s.sound; $('optShake').checked = s.shake; $('optVib').checked = s.vibrate;
    $('optMild').checked = !!s.mild; $('optLow').checked = s.quality === 'low';
    const rb = $('btnReset'); delete rb.dataset.sure; rb.textContent = T('저장 데이터 초기화');
    $('fpsTxt').textContent = 'FPS ' + Math.round(DX.fps || 0) + ' · v' + C.game.version.replace(/^v/, '') + ' · ' + DX.BUILD;
    show($('pause'), true);
  }
  UI.pauseGame = function () { if (DX.state !== 'play') return; prevState = 'play'; DX.state = 'paused'; openPause(false); };
  function relang() {
    DX.applyHtml();
    loadSlots();
    refreshLobby();
    if (!$('pause').classList.contains('hidden')) openPause(inLobbyPanel);
    if (DX.getG()) $('camLabel').textContent = T(C.camera[DX.save.cam].label);
  }

  /* ---------------- 이벤트 ---------------- */
  function startStage(i) {
    const st = C.stages[i];
    DX.save.seenStory = DX.save.seenStory || {};
    const cmc = C.comics && C.comics[st.id];
    if (cmc && !DX.save.seenStory[st.id]) {
      DX.save.seenStory[st.id] = true; DX.persist();
      show($('lobby'), false);
      UI.comic(cmc, 'CHAPTER ' + (i + 1) + ' · ' + T(st.name), () => DX.startRun(i));
    } else if (st.intro && st.intro.length && !DX.save.seenStory[st.id]) {
      DX.save.seenStory[st.id] = true; DX.persist();
      show($('lobby'), false);
      UI.dialogue(st.intro, 'STAGE ' + (i + 1) + ' · ' + T(st.name), () => DX.startRun(i));
    } else DX.startRun(i);
  }
  function backToLobby() { show($('hud'), false); showLobby(); }
  function bind() {
    const unlock = () => DX.S.init();
    document.addEventListener('pointerdown', unlock, { capture: true });
    $('intro').addEventListener('click', e => { if (e.target.id === 'storySkip') return; storyIdx++; DX.S.click(); if (storyIdx >= C.story.length) endIntro(); else renderStory(); });
    $('storySkip').addEventListener('click', e => { e.stopPropagation(); endIntro(); });
    document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { DX.S.click(); setTab(b.dataset.tab); }));
    $('stPrev').addEventListener('click', () => { DX.S.click(); DX.previewStage(((DX.save.stage || 0) - 1 + C.stages.length) % C.stages.length); refreshLobby(); });
    $('stNext').addEventListener('click', () => { DX.S.click(); DX.previewStage(((DX.save.stage || 0) + 1) % C.stages.length); refreshLobby(); });
    $('metaList').addEventListener('click', e => {
      const b = e.target.closest('[data-meta]'); if (!b || b.disabled) return;
      const k = b.dataset.meta, m = C.meta[k], lv = DX.save.meta[k] || 0;
      const cost = DX.metaCost(k, lv);
      if (lv >= m.max || DX.save.gold < cost) return;
      DX.save.gold -= cost; DX.save.meta[k] = lv + 1; DX.persist(); DX.S.level(); DX.vib('light'); refreshLobby(); toast(T(m.name) + ' Lv ' + (lv + 1) + '!');
      DX.track('meta_up', { k, lv: lv + 1 });
    });
    $('rewardList').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const s = DX.save;
      if (b.dataset.att) {
        if (!DX.attCan()) return;
        const g = DX.ATT[s.att.streak % 7];
        s.att.streak++; s.att.last = DX.today(); s.gold += g; DX.persist();
        toast(L('출석 보상! 골드 +', '签到奖励！金币 +') + g); DX.track('attend', { day: s.att.streak });
      } else if (b.dataset.mis != null) {
        const m = s.daily.m[+b.dataset.mis], M = DX.MISSIONS[m.i];
        if (m.c || m.p < M.goal) return;
        m.c = true; s.gold += M.gold; DX.persist();
        toast(L('미션 보상! 골드 +', '任务奖励！金币 +') + M.gold); DX.track('mission_claim', { k: M.k });
      }
      DX.S.level(); DX.vib('light'); refreshLobby();
    });
    $('btnStart').addEventListener('click', () => {
      const i = DX.save.stage || 0;
      if (!stageUnlocked(i)) return; DX.S.click();
      startStage(i);
    });
    $('comic').addEventListener('click', e => { if (e.target.id === 'cmSkip') { comicNext(true); return; } comicNext(false); });
    $('dialog').addEventListener('click', e => { if (e.target.id === 'dlgSkip') return; nextDlg(false); });
    $('dlgSkip').addEventListener('click', e => { e.stopPropagation(); nextDlg(true); });
    $('btnCam').addEventListener('click', () => { DX.S.click(); $('camLabel').textContent = T(DX.toggleCam()); });
    $('btnBsTake').addEventListener('click', () => { show($('bossSupply'), false); DX.showAd('boss_supply', () => DX.bossSupplyDone(true), () => DX.bossSupplyDone(false)); });
    $('btnBsSkip').addEventListener('click', () => { show($('bossSupply'), false); DX.track('boss_supply_skip', {}); DX.bossSupplyDone(false); });
    $('btnReroll').addEventListener('click', () => { const G = DX.getG(); if (!G || G.rerolls <= 0) return; DX.showAd('reroll', () => DX.rerollCards()); });
    $('btnSupply').addEventListener('click', () => {
      if (supplyLeft() <= 0) return;
      DX.showAd('supply', () => { DX.save.supply.n++; DX.save.gold += C.ads.supplyGold; DX.persist(); refreshLobby(); toast(L('보급 도착! 골드 +', '补给到达！金币 +') + C.ads.supplyGold); DX.S.level(); });
    });
    $('btnShare').addEventListener('click', () => { lastResult = null; share('lobby'); });
    $('btnShareR').addEventListener('click', () => share('result'));
    { const pos = e => { const r = $('fightCv').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      $('fight').addEventListener('pointerdown', e => { e.preventDefault(); const p = pos(e); DX.FIGHT.down(p[0], p[1]); });
      $('fight').addEventListener('pointermove', e => { const p = pos(e); DX.FIGHT.move(p[0], p[1]); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => $('fight').addEventListener(n, () => DX.FIGHT.up())); }
    { const pos = e => { const r = $('miniCv').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
      $('mini').addEventListener('pointerdown', e => { e.preventDefault(); const p = pos(e); DX.MINI.down(p[0], p[1]); }); }
    $('btnUlt').addEventListener('click', () => { const G = DX.getG(); if (G && G.ult >= 1) hintDone('ult'); if (!DX.useUltimate()) DX.S.click(); });
    $('btnHorn').addEventListener('click', () => { hintDone('horn'); if (!DX.useHorn()) DX.S.click(); });
    // 일시정지 / 설정
    $('btnPause').addEventListener('click', () => UI.pauseGame());
    $('btnSettings').addEventListener('click', () => openPause(true));
    $('btnResume').addEventListener('click', () => { show($('pause'), false); if (DX.state === 'paused') DX.state = prevState; });
    const opt = (id, fn) => $(id).addEventListener('change', e => { fn(e.target.checked); DX.persist(); });
    opt('optMusic', v => { DX.save.music = v; if (!v && DX.Music) DX.Music.stop(); });
    opt('optSound', v => { DX.save.sound = v; });
    opt('optShake', v => { DX.save.shake = v; });
    opt('optVib', v => { DX.save.vibrate = v; if (v) DX.vib('medium'); });
    opt('optMild', v => { DX.save.mild = v; });
    opt('optLow', v => { DX.save.qualityManual = true; DX.setQuality(v ? 'low' : 'high'); });
    $('btnLang').addEventListener('click', () => { const l = DX.lang() === 'zh' ? 'ko' : 'zh'; DX.setLang(l); DX.save.lang = l; DX.persist(); relang(); DX.track('lang', { l }); });
    $('btnGuide').addEventListener('click', openGuide);
    $('guidePrev').addEventListener('click', () => { if (gPage > 0) { gPage--; renderGuide(); } });
    $('guideNext').addEventListener('click', () => { if (gPage < DX.GUIDE.length - 1) { gPage++; renderGuide(); } else show($('guide'), false); });
    $('btnPrivacy').addEventListener('click', () => { $('privacyBody').textContent = L(DX.PRIVACY[0], DX.PRIVACY[1]); show($('privacy'), true); });
    $('privacyClose').addEventListener('click', () => show($('privacy'), false));
    $('tipClose').addEventListener('click', () => show($('tip'), false));
    $('btnQuit').addEventListener('click', () => { show($('pause'), false); DX.quitRun(); backToLobby(); });
    $('btnIntro').addEventListener('click', () => { show($('pause'), false); DX.save.seenStory = {}; DX.persist(); showIntro(); });
    $('btnReset').addEventListener('click', () => {
      const b = $('btnReset');
      if (b.dataset.sure) { DX.store.clear(); location.reload(); }
      else { b.dataset.sure = 1; b.textContent = T('정말 초기화? 한 번 더 누르세요'); }
    });
    // 결과
    $('btnRevive').addEventListener('click', () => { show($('result'), false); DX.showAd('revive', () => DX.revive()); });
    $('btnDouble').addEventListener('click', () => { show($('result'), false); DX.showAd('double', () => { toast(L('골드 2배 지급!', '金币翻倍到账！')); DX.finishRun(true); backToLobby(); }); });
    $('btnLobby').addEventListener('click', () => { show($('result'), false); DX.finishRun(false); backToLobby(); });
    window.addEventListener('keydown', e => { if (e.key === ' ') DX.useUltimate(); if (e.key === 'g') DX.useHorn(); });
    // 앱을 내리면 자동 일시정지·음악 정지·저장 / 돌아오면 일시정지 메뉴에서 재개
    document.addEventListener('visibilitychange', () => { if (document.hidden) DX.onAppHide(); else DX.onAppShow(); });
  }

  /* ---------------- 디버그 (?debug=1 일 때만) ---------------- */
  function debugHook() {
    if (!/[?&]debug=1/.test(location.search)) return;
    window.__bepaDebug = {
      lobby: () => { DX.quitRun(); backToLobby(); },
      run: i => { DX.save.seenStory = {}; C.stages.forEach(s => DX.save.seenStory[s.id] = true); DX.startRun(i || 0); },
      gold: n => { DX.save.gold = n; DX.persist(); refreshLobby(); },
      unlockAll: () => { C.stages.forEach(s => DX.save.cleared[s.id] = true); DX.persist(); refreshLobby(); },
      win: () => DX._dbg.end(true), lose: () => DX._dbg.end(false), boss: k => DX._dbg.boss(k || 'bujang'), invade: () => DX._dbg.inv(),
      ult: () => { const G = DX.getG(); if (G) G.ult = 1; }, pause: () => UI.pauseGame(),
      guide: openGuide, privacy: () => $('btnPrivacy').click(), tip: k => { DX.save.tips[k] = false; tip(k); }, tab: setTab,
      lang: l => { DX.setLang(l); DX.save.lang = l; relang(); }, track: () => DX.trackLog, save: () => DX.save,
    };
    console.log('[debug] window.__bepaDebug ready');
  }

  /* ---------------- 시작 ---------------- */
  function start() {
    DX.applyHtml();
    loadSlots();
    bind();
    debugHook();
    if (!DX.boot()) { document.body.innerHTML = '<div style="padding:30px;color:#fff;font-family:sans-serif">' + L('이 기기/브라우저는 WebGL2를 지원하지 않아요. 크롬 또는 사파리 최신 버전에서 열어주세요.', '当前设备/浏览器不支持 WebGL2，请使用最新版 Chrome 或 Safari 打开。') + '</div>'; return; }
    DX.track('launch', { lang: DX.lang(), pf: DX.PLATFORM, build: DX.BUILD });
    runLoading(() => {
      if (location.hash === '#autostart') { DX.save.seenIntro = true; DX.save.firstRunDone = true; DX.startRun(DX.save.stage || 0); return; }
      if (!DX.save.seenIntro) showIntro(); else showLobby();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.DX);
