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
  function starHtml(a) { return (a || [false, false, false]).map(v => v ? '★' : '<i class="off">★</i>').join(''); }
  function stageUnlocked(i) { return C.game.unlockAllStages || i === 0 || DX.save.cleared[C.stages[i - 1].id]; }
  /* ---------------- 꾸미기 (열차·생존자 외형) ---------------- */
  const SKIN_CAT = [['train', '🚂 열차'], ['jack', '잭'], ['minho', '민호'], ['sophie', '소피']];
  const probeOk = {};
  function probe(url) { if (!(url in probeOk) && DX.SPR.probe) { probeOk[url] = false; DX.SPR.probe(url).then(ok => { probeOk[url] = ok; }); } return probeOk[url]; }
  UI.probe = probe;
  function skinPortrait(nm, id) { return 'assets/portraits/skin_' + nm + '_' + id + '.png'; }
  // 대화·만화 얼굴: 꾸미기 옷 얼굴 그림이 있으면 그걸로
  function portraitOf(sv) {
    const id = DX.save.skin && DX.save.skin[sv.art];
    if (id && id !== 'base') { const u = skinPortrait(sv.art, id); if (probe(u)) return u; }
    return sv.portrait;
  }
  UI.portraitOf = portraitOf;
  function starCount() { let n = 0; const S = DX.save.stars || {}; for (const k in S) n += S[k].filter(Boolean).length; return n; }
  function codexDone() { const cx = DX.save.codex || {}; return Object.keys(C.zombies).every(k => (cx.z || {})[k]) && Object.keys(C.bosses).every(k => (cx.b || {})[k]); }
  // 얻는 방법: 별·출석·도감은 조건만 채우면 무료, 골드/보석은 구매, 이벤트는 그 달에만
  function skinOpen(cat, k) {
    if ((DX.save.skinOwned || {})[cat + ':' + k.id] || k.id === 'base') return true;
    if (k.need) { const st = C.stages[k.need - 1]; return !!(st && DX.save.cleared[st.id]); }
    if (k.stars) return starCount() >= k.stars;
    if (k.att) return (DX.save.attDays || 0) >= k.att;
    if (k.codex) return codexDone();
    return false;
  }
  function tintCss(t) { if (!t) return ''; const r = t[0], g = t[1], b = t[2], hue = r > g && r > b ? -25 : b > r && b > g ? 200 : g > r ? 90 : 0; return 'filter:sepia(.35) hue-rotate(' + hue + 'deg) saturate(1.5)'; }
  function renderSkins() {
    const S = C.skins || {}; DX.save.skin = DX.save.skin || {}; DX.save.skinOwned = DX.save.skinOwned || {};
    let h = '';
    for (const [cat, title] of SKIN_CAT) {
      const list = S[cat] || []; if (!list.length) continue;
      h += '<div class="skin-h">' + esc(T(title)) + '</div>';
      const cur = DX.save.skin[cat] || 'base';
      for (const k of list) {
        const open = skinOpen(cat, k), on = cur === k.id;
        let ico;
        if (cat === 'train') ico = '<span style="' + tintCss(k.tint) + '">🚂</span>';
        else { const sv = C.survivors.find(x => x.art === cat) || {}; const sp = k.id !== 'base' ? skinPortrait(cat, k.id) : sv.portrait; ico = '<img src="' + sp + '" style="' + (k.id !== 'base' && !probe(sp) ? tintCss(k.tint) : '') + '" onerror="this.onerror=null;this.src=\'' + sv.portrait + '\';this.setAttribute(\'style\',\'' + tintCss(k.tint) + '\')">'; }
        const month = new Date().getMonth() + 1;
        const btn = on ? '<button class="r-btn on" disabled>' + T('장착 중') + '</button>'
          : open ? '<button class="r-btn" data-skin="' + cat + ':' + k.id + '">' + T('장착') + '</button>'
          : k.need ? '<button class="r-btn" disabled>🔒 ' + k.need + T('장 클리어') + '</button>'
          : k.stars ? '<button class="r-btn" disabled>⭐ ' + starCount() + '/' + k.stars + '</button>'
          : k.att ? '<button class="r-btn" disabled>📅 ' + (DX.save.attDays || 0) + '/' + k.att + L('일', '天') + '</button>'
          : k.codex ? '<button class="r-btn" disabled>📖 ' + L('도감 완성', '图鉴完成') + '</button>'
          : k.month && k.month !== month ? '<button class="r-btn" disabled>🎄 ' + k.month + L('월 한정', '月限定') + '</button>'
          : k.gems ? '<button class="r-btn" data-skinbuy="' + cat + ':' + k.id + '"' + ((DX.save.gems || 0) < k.gems ? ' disabled' : '') + '>💎 ' + k.gems + '</button>'
          : '<button class="r-btn" data-skinbuy="' + cat + ':' + k.id + '"' + (DX.save.gold < k.cost ? ' disabled' : '') + '>🪙 ' + k.cost + '</button>';
        const gr = k.grade || (k.cost >= 2000 ? '영웅' : '희귀'), gi = { '일반': 1, '희귀': 2, '영웅': 3, '전설': 4 }[gr] || 2;
        h += '<div class="row"><div class="r-ico skin">' + ico + '</div><div class="r-main"><div class="r-name">' + esc(T(k.name)) + '<span class="grade g' + gi + '">' + T(gr) + '</span></div><div class="r-desc">' + (cat === 'train' ? T('열차 외형') : T('지붕 사수·대화 얼굴')) + '</div></div>' + btn + '</div>';
      }
    }
    $('skinList').innerHTML = h;
  }
  UI.renderSkins = renderSkins;
  function skinAction(e) {
    const b = e.target.closest('[data-skin],[data-skinbuy]'); if (!b) return;
    const [cat, id] = (b.dataset.skin || b.dataset.skinbuy).split(':');
    const k = (C.skins[cat] || []).find(x => x.id === id); if (!k) return;
    if (b.dataset.skinbuy) {
      if (k.gems) { if ((DX.save.gems || 0) < k.gems) return; DX.save.gems -= k.gems; }
      else { if (DX.save.gold < k.cost) return; DX.save.gold -= k.cost; }
      DX.save.skinOwned[cat + ':' + id] = true; DX.track('skin_buy', { cat, id }); DX.S.level();
      toast(T('구매 완료! ') + T(k.name));
    }
    DX.save.skin[cat] = id; if (id !== 'base') DX.save.skinOwned[cat + ':' + id] = true; DX.persist();
    if (cat !== 'train' && DX.SPR.refreshGunners) DX.SPR.refreshGunners();
    DX.S.click(); refreshLobby(); renderSkins();
  }
  // 정비소 강화 상한: 장 진행에 묶음 (2장까지 5단계, 4장까지 10단계 ...)
  function metaCap(k) { return Math.min(C.meta[k].max, 5 * (1 + Math.floor(DX.chapterCount() / 2))); }
  /* ---------------- 생존자 키우기 ---------------- */
  function heroCost(lv) { const H = C.heroes; return Math.round(H.costBase * Math.pow(H.costGrow, lv) / 5) * 5; }
  function renderHeroes() {
    const H = C.heroes, hs = DX.save.heroes = DX.save.heroes || {};
    $('heroList').innerHTML = H.list.map(h => {
      const joined = !h.join || DX.chapterCount() >= h.join, lv = hs[h.id] || 0, max = lv >= H.max, cost = heroCost(lv);
      const btn = !joined ? '<button class="r-btn" disabled>🔒 ' + h.join + L('장 클리어 후 합류', '章通关后加入') + '</button>' : '<button class="r-btn" data-hero="' + h.id + '"' + (max || DX.save.gold < cost ? ' disabled' : '') + '>' + (max ? 'MAX' : '🪙 ' + cost) + '</button>';
      return '<div class="row"><div class="r-ico skin"><img src="' + h.portrait + '" style="' + (joined ? '' : 'filter:grayscale(1) brightness(.5)') + '"></div><div class="r-main"><div class="r-name">' + esc(T(h.name)) + ' <small style="color:var(--gold)">Lv ' + lv + '/' + H.max + '</small></div><div class="r-desc">' + esc(T(h.desc)) + (lv ? ' (' + L('지금 ', '当前 ') + '+' + Math.round(lv * h.per * 100) + '%)' : '') + '</div></div>' + btn + '</div>';
    }).join('');
  }
  function refreshLobby() {
    // 첫 10판 개방: 정비소(2판째), 보상(9판째)
    { const m = document.querySelector('[data-tab=meta]'), r = document.querySelector('[data-tab=reward]');
      if (m) show(m, DX.unlocked('meta')); if (r) show(r, DX.unlocked('reward')); }
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
    { const ca = (C.chapterArt || {})[st.id]; if (ca && ca.thumb && DX.SPR.probe) DX.SPR.probe(ca.thumb).then(ok => { if (ok && (DX.save.stage || 0) === i) th.src = ca.thumb; }); }
    $('stBadge').innerHTML = !stageUnlocked(i) ? T('🔒 잠김') : DX.save.cleared[st.id] ? '<span class="stars">' + starHtml((DX.save.stars || {})[st.id]) + '</span>' : '';
    // 장 안 스테이지 5개
    { const done = DX.subDone(st.id), sel = Math.min((DX.save.subSel || {})[st.id] != null ? DX.save.subSel[st.id] : Math.min(4, done), Math.min(4, done));
      $('subRow').innerHTML = (C.subStages || []).map((ss, k) => '<button data-sub="' + k + '" class="' + (k < done ? 'done ' : '') + (k === sel ? 'on ' : '') + (k > done ? 'lock' : '') + '"><b>' + (i + 1) + '-' + (k + 1) + '</b></button>').join('');
      $('stBest').textContent = (i + 1) + '-' + (sel + 1) + ' · ' + T(C.subStages[sel].name) + (C.subStages[sel].type === 'rescue' ? ' 🚨' : sel === 4 ? ' 👹' : '') + (best ? '  |  ' + L('최고 ', '最高 ') + 'WAVE ' + best : '');
      show($('btnEndless'), DX.chapterCount() >= C.endless.unlockStage); $('btnEndless').textContent = '♾️ ' + L('무한 모드', '无尽模式') + (DX.save.endlessBest ? ' · ' + L('최고 ', '最高 ') + DX.save.endlessBest + L('웨이브', '波') : ''); }
    { const hb = document.querySelector('[data-tab=hero]'); if (hb) show(hb, DX.chapterCount() >= C.heroes.unlockStage); }
    $('btnStart').disabled = !stageUnlocked(i);
    $('btnStart').style.opacity = stageUnlocked(i) ? 1 : 0.5;
    // 강화
    const M = C.meta;
    $('metaList').innerHTML = Object.keys(M).map(k => {
      const m = M[k], lv = DX.save.meta[k] || 0, cap = metaCap(k), max = lv >= cap, cost = max ? 0 : DX.metaCost(k, lv);
      return '<div class="row"><div class="r-ico">' + m.icon + '</div><div class="r-main"><div class="r-name">' + esc(T(m.name)) + ' <small style="color:var(--gold)">Lv ' + lv + '/' + cap + '</small></div><div class="r-desc">' + esc(T(m.desc)) + (cap < m.max && lv >= cap ? ' · ' + L('다음 장을 깨면 상한 증가', '通关下一章提高上限') : '') + '</div></div>' +
        '<button class="r-btn" data-meta="' + k + '"' + (max || DX.save.gold < cost ? ' disabled' : '') + '>' + (lv >= m.max ? 'MAX' : max ? '🔒' : '🪙 ' + cost) + '</button></div>';
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
    ['stage', 'meta', 'reward', 'skin', 'hero'].forEach(k => show($('tab-' + k), k === t));
    if (t === 'skin') renderSkins();
    if (t === 'hero') renderHeroes();
    if (t !== 'stage') tip(t);
  }

  /* ---------------- 보상 탭: 7일 출석 + 일일 미션 3개 ---------------- */
  function idleGold() {
    const s = DX.save; if (!s.idleT) { s.idleT = Date.now(); DX.persist(); return 0; }
    const h = Math.min(C.idle.maxHours, (Date.now() - s.idleT) / 3600000);
    return Math.floor(h * (C.idle.perHourBase + C.idle.perStage * DX.chapterCount()));
  }
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
    // 방치 보상
    if (DX.chapterCount() >= C.idle.unlockStage) {
      const g = idleGold();
      h += '<div class="rw-head">' + L('방치 보상', '离线奖励') + '</div><div class="row"><div class="r-ico">⏳</div><div class="r-main"><div class="r-name">' + L('자리 비운 동안 쌓인 골드', '离开期间累积的金币') + '</div><div class="r-desc">🪙 ' + g + L(' (최대 ', '（最多 ') + C.idle.maxHours + L('시간)', '小时）') + '</div></div><button class="r-btn" data-idle="1"' + (g > 0 ? '' : ' disabled') + '>' + L('받기', '领取') + '</button><button class="r-btn" data-idle="2"' + (g > 0 ? '' : ' disabled') + '>📺 ×2</button></div>';
    }
    // 도감
    { const cx = s.codex || { z: {}, b: {}, c: {} }, nz = Object.keys(cx.z || {}).length, nb = Object.keys(cx.b || {}).length, nc = Object.keys(cx.c || {}).length, nr = Object.keys(s.reactions || {}).length;
      const tz = Object.keys(C.zombies).length, tb = Object.keys(C.bosses).length, tc = C.comicNpc.length + 1;
      const newN = s.codexNew || 0;
      h += '<div class="rw-head">' + L('도감', '图鉴') + '</div><div class="row"><div class="r-ico">📖</div><div class="r-main"><div class="r-name">' + L('좀비 ', '僵尸 ') + nz + '/' + tz + ' · ' + L('보스 ', '首领 ') + nb + '/' + tb + ' · ' + L('시민 ', '市民 ') + nc + '/' + tc + ' · ' + L('반응 ', '反应 ') + nr + '/5</div><div class="r-desc">' + L('새로 기록 ', '新记录 ') + newN + L('개 · 1개당 골드 ', '个 · 每个金币 ') + C.codex.reward + '</div></div><button class="r-btn" data-codex="1"' + (newN ? '' : ' disabled') + '>' + L('받기', '领取') + '</button></div>'; }
    h += '<div class="rw-head">💎 ' + L('보석 ', '宝石 ') + (s.gems || 0) + '</div>';
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
    // 보스 컷인 그림이 있으면 띠 전체를 그 그림으로
    const band = el.querySelector('.bi-band'), cut = cfg.cutin && probe(cfg.cutin);
    band.classList.toggle('cut', !!cut); band.style.backgroundImage = cut ? 'url("' + cfg.cutin + '")' : '';
    $('biImg').style.display = cut ? 'none' : '';
    el.classList.remove('hidden', 'go'); void el.offsetWidth; el.classList.add('go');
    clearTimeout(UI._biT); UI._biT = setTimeout(() => el.classList.add('hidden'), 1900);
    if (navigator.vibrate) try { navigator.vibrate([40, 60, 80]); } catch (e) {}
  };
  let skKey = null;
  UI.skillReady = function () {};
  /* ---------------- 구조 신호 (3초 안에 고르기, 안 고르면 구함) ---------------- */
  UI.prologueEnd = function (cb) {
    const el = $('banner');
    UI.banner(L('월요일 아침 8시 50분...', '周一早上8点50分...'), L('기관차 한 칸만 남았다. 그 열차를 다시 만든다!', '只剩一节火车头。重新打造那辆列车！'), 'wave');
    setTimeout(cb, 2600);
  };
  // 진화 컷인
  UI.evoCut = function (c) {
    const d = document.createElement('div'); d.className = 'evo-cut';
    d.innerHTML = '<div class="ec-band">' + (c.icon ? iconHtml(c.icon, c.emoji || '★') : (c.emoji || '★')) + '<div><b>' + L('진화!!', '进化！！') + '</b><span>' + esc(T(c.name)) + '</span></div></div>';
    document.body.appendChild(d); setTimeout(() => d.remove(), 1500);
  };
  // 칸 배치 고르기
  UI.askPlace = function (w, cb) {
    $('sigFace').src = w.icon || ''; $('sigName').textContent = T(w.name);
    $('sigLine').textContent = L('새 칸을 어디에 붙일까?', '新车厢接在哪里？');
    $('sigGo').textContent = L('기관차 바로 뒤 (쿨타임↓)', '火车头后面（冷却↓）'); $('sigSkip').textContent = L('맨 뒤 (침입 방어↑)', '最后面（防入侵↑）');
    $('signal').querySelector('.sig-head').textContent = L('🔧 칸 배치', '🔧 车厢配置');
    $('signal').querySelector('.sig-time').style.display = 'none';
    show($('signal'), true);
    const end = f => { show($('signal'), false); $('sigGo').textContent = L('멈추고 구한다', '停车救人'); $('sigSkip').textContent = L('지나친다', '开过去'); $('signal').querySelector('.sig-head').textContent = L('🚨 구조 신호!', '🚨 求救信号！'); $('signal').querySelector('.sig-time').style.display = ''; cb(f); };
    $('sigGo').onclick = () => { DX.S.click(); end(true); };
    $('sigSkip').onclick = () => { DX.S.click(); end(false); };
  };
  UI.rescueSignal = function (o, cb) {
    $('sigFace').src = o.face || ''; $('sigName').textContent = T(o.name || '');
    $('sigLine').textContent = T(o.line) + (o.n > 1 ? ' (' + o.n + L('명)', '人)') : '');
    show($('signal'), true);
    let done = false; const t0 = performance.now(), dur = (o.time || 3) * 1000;
    const end = go => { if (done) return; done = true; clearInterval(iv); show($('signal'), false); cb(go); };
    const iv = setInterval(() => { const r = 1 - (performance.now() - t0) / dur; $('sigBar').style.width = Math.max(0, r * 100) + '%'; if (r <= 0) end(true); }, 50);
    $('sigGo').onclick = () => { DX.S.click(); end(true); };
    $('sigSkip').onclick = () => { DX.S.click(); end(false); };
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
    // 액티브 스킬 버튼
    { const ids = DX.activeIds(), key2 = ids.join(',');
      if (key2 !== skKey) { skKey = key2; $('skillBar').innerHTML = ids.map(id => '<button class="sk" data-sk="' + id + '"><i class="fill"></i>' + iconHtml(C.weapons[id].icon, C.weapons[id].emoji) + '</button>').join(''); show($('btnAuto'), ids.length > 0); }
      for (const b of $('skillBar').children) { const v = G.sk[b.dataset.sk] || 0; b.firstChild.style.height = (v * 100).toFixed(0) + '%'; b.classList.toggle('ready', v >= 1); }
      $('btnAuto').classList.toggle('on', !!G.autoSkill);
      if (!DX.unlocked('autoBtn')) show($('btnAuto'), false);
      show($('skillBar'), !G.prologue && DX.unlocked('skillManual') || ids.length && !G.autoSkill); }
    show($('btnHorn'), DX.unlocked('horn') || !!G.prologue);
    $('ultRing').style.strokeDashoffset = (276.5 * (1 - G.ult)).toFixed(1);
    $('btnUlt').classList.toggle('ready', G.ult >= 1);
    $('hornCd').textContent = G.hornCd > 0 ? Math.ceil(G.hornCd) : '';
    const key = JSON.stringify(G.weapons) + JSON.stringify(G.passives);
    if (key !== ownedKey) {
      ownedKey = key;
      let h = '';
      for (const id in G.weapons) { const wc = C.weapons[id], lv = G.weapons[id]; h += '<div class="w' + (lv >= 5 ? ' evo' : '') + '">' + iconHtml(lv >= 5 && wc.evoIcon ? wc.evoIcon : wc.icon, wc.emoji || '🔫') + '<b>' + (lv >= 5 ? '★' : lv) + '</b></div>'; }
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
  UI.levelUp = function (cards, G, chest) {
    UI.lastCards = cards;
    show($('levelup'), true);
    { const t = $('levelup').querySelector('.lv-title, h2, .title'); if (t) { if (!t.dataset.orig) t.dataset.orig = t.textContent; t.textContent = chest ? L('🎁 보물상자!', '🎁 宝箱！') : t.dataset.orig; } }
    $('rerollN').textContent = L('(' + G.rerolls + '회 남음)', '（剩余' + G.rerolls + '次）');
    $('btnReroll').disabled = G.rerolls <= 0;
    const el = $('cards');
    el.innerHTML = '';
    cards.forEach(c => {
      const b = document.createElement('button');
      b.className = 'card' + (c.evo ? ' evo' : c.isNew ? ' new' : '');
      const frame = getComputedStyle(document.documentElement).getPropertyValue('--card-img');
      if (frame && frame.trim()) b.style.backgroundImage = frame;
      b.innerHTML = '<div class="c-ico">' + (c.icon ? iconHtml(c.icon, c.emoji || '🔫') : c.emoji) + '</div>' +
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
  const SRC_NAME = { mg: wn('mg', '기관총'), flame: '화염방사', tesla: wn('tesla', '테슬라 코일'), drone: wn('drone', '드론 폭탄'), cannon: wn('cannon', '캐논 터렛'), barrel: '드럼통', ult: C.ultimate.name, horn: C.horn.name, bomber: '회식 좀비 폭발', fall: '낭떠러지', misc: '기타', water: wn('water', '물대포'), freeze: wn('freeze', '냉동 컨테이너'), fan: wn('fan', '환풍기') };
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
    $('rStats').innerHTML = (o.stars ? '<div style="grid-column:1/-1"><b class="stars">' + starHtml(o.stars) + '</b><span>' + T('클리어 · 구조 성공 · 체력 50%') + (o.citizens ? ' · 🙋 ' + o.citizens : '') + '</span></div>' : '') + [['도달 웨이브', o.wave + (o.newBest ? ' ★' : '')], ['처치', o.kills.toLocaleString()], ['최대 콤보', o.maxCombo || 0], ['레벨', o.level]].map(s => '<div><b>' + s[1] + '</b><span>' + T(s[0]) + '</span></div>').join('');
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
    $('dlgFace').src = portraitOf(sv); $('dlgName').textContent = T(sv.name); $('dlgText').textContent = T(l.text);
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
  UI.comic = async function (data, title, done, stageId) {
    cm = { d: data, i: 0, done, page: 0, img: null, side: null, loading: true };
    $('cmTitle').textContent = title || '';
    show($('comic'), true);
    $('cmPage').innerHTML = '';
    // 챕터 그림 자리: 만화 그림 → 새 옆 배경 → 지금 배경 순서로
    const ca = (C.chapterArt || {})[stageId] || {}, my = cm;
    if (DX.SPR.probe) {
      if (ca.comic && await DX.SPR.probe(ca.comic)) my.img = ca.comic;
      else if (ca.side && ca.side !== data.bg && await DX.SPR.probe(ca.side)) my.side = ca.side;
    }
    if (cm === my) { cm.loading = false; comicNext(); }
  };
  function comicPanel(p, k) {
    const d = cm.d, el = document.createElement('div');
    const side = k % 2 ? 'r' : 'l';
    el.className = 'cm-panel ' + side;
    const pos = d.pos || [0, 100, 50];
    if (cm.img) {   // 3칸 만화 그림이 있으면 칸마다 한 칸씩 잘라서 배경으로
      el.style.backgroundImage = 'url("' + cm.img + '")'; el.style.backgroundSize = '300% 100%'; el.style.backgroundPosition = ((k % 3) * 50) + '% 50%';
    } else {
      el.style.backgroundImage = 'url("' + (cm.side || d.bg) + '")';
      el.style.backgroundPosition = pos[k % pos.length] + '% 60%';
      if (d.zoom && !cm.side) el.style.backgroundSize = (d.zoom * 100) + '% auto';
    }
    let h = d.tint && !cm.img && !cm.side ? '<div class="tint" style="background:' + d.tint + '"></div>' : '';
    if (p.cap) h += '<div class="cm-cap">' + esc(T(p.cap)) + '</div>';
    else {
      let face = '', name = '';
      if (typeof p.who === 'string' && p.who[0] === 'n') { const n = (C.comicNpc || [])[+p.who.slice(1)] || {}; face = n.face; name = n.name || ''; }
      else { const sv = C.survivors[p.who] || C.survivors[0]; face = portraitOf(sv); name = sv.name; }
      h += '<img class="face" src="' + face + '" alt=""><div class="cm-bub"><b>' + esc(T(name)) + '</b>' + esc(T(p.text)) + '</div>';
    }
    el.innerHTML = h;
    return el;
  }
  function comicNext(skip) {
    if (!cm || (cm.loading && !skip)) return;
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
    // 첫 판: 프롤로그(최강 열차 맛보기) 먼저
    if (i === 0 && C.prologue && C.prologue.on && !DX.save.prologueDone && !Object.keys(DX.save.cleared || {}).length) {
      show($('lobby'), false); show($('hud'), true);
      DX.startPrologue(() => { show($('hud'), false); startStage(0); });
      return;
    }
    const st = C.stages[i];
    DX.save.seenStory = DX.save.seenStory || {};
    const cmc = C.comics && C.comics[st.id];
    if (cmc && !DX.save.seenStory[st.id]) {
      DX.save.seenStory[st.id] = true; DX.persist();
      show($('lobby'), false);
      UI.comic(cmc, 'CHAPTER ' + (i + 1) + ' · ' + T(st.name), () => DX.startRun(i), st.id);
    } else if (st.intro && st.intro.length && !DX.save.seenStory[st.id]) {
      DX.save.seenStory[st.id] = true; DX.persist();
      show($('lobby'), false);
      UI.dialogue(st.intro, 'STAGE ' + (i + 1) + ' · ' + T(st.name), () => DX.startRun(i));
    } else DX.startRun(i);
  }
  function backToLobby() {
    show($('hud'), false); showLobby();
    // 장 클리어 컷: 구한 시민이 안전 칸에 + 다음 장 예고
    const cc = DX._clearCut; DX._clearCut = null;
    if (cc) {
      const last = cc.last, who = last && !last.dog ? 'n' + last.face : C.radio ? 'n' + C.radio.who : 0;
      const ch = C.comics[cc.id] || {};
      UI.comic({ bg: ch.bg || 'assets/story/ch1_side.jpg', pos: [50, 0, 100], panels: [
        { cap: L('구한 시민 ', '救出的市民 ') + cc.n + L('명이 안전 칸에 탔다!', '人登上了安全车厢！') },
        { who, text: cc.n ? L('살았다! 고마워요, 둠스데이 익스프레스!', '得救了！谢谢你，末日快车！') : L('...다음엔 꼭 우리도 태워 줘요', '...下次一定要带上我们') },
        { cap: T((C.nextTease || {})[cc.id] || '') },
      ] }, 'CLEAR!', () => showLobby(), cc.id);
      return;
    }
    // 처음 정비소가 열리면 바로 안내 / 같은 장에서 2번 연속 지면 장갑 강화 도움말
    if (DX.unlocked('meta') && !DX.save.metaGuided) { DX.save.metaGuided = true; DX.persist(); setTab('meta'); toast(L('정비소가 열렸어요! 열차를 강화하세요', '维修站开放了！强化列车吧')); }
    else if ((DX.save.loseRow || 0) >= 2) { DX.save.loseRow = 0; DX.persist(); setTab('meta'); toast(L('정비소에서 장갑을 올려보세요', '去维修站强化装甲吧')); }
  }
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
      if (lv >= metaCap(k) || DX.save.gold < cost) return;
      DX.save.gold -= cost; DX.save.meta[k] = lv + 1; DX.persist(); DX.S.level(); DX.vib('light'); refreshLobby(); toast(T(m.name) + ' Lv ' + (lv + 1) + '!');
      DX.track('meta_up', { k, lv: lv + 1 });
    });
    $('rewardList').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b || b.disabled) return;
      const s = DX.save;
      if (b.dataset.idle) {
        const g = idleGold(); if (!g) return;
        const give = m => { s.gold += g * m; s.idleT = Date.now(); DX.persist(); DX.S.level(); toast(L('방치 보상 골드 +', '离线奖励 金币 +') + g * m); refreshLobby(); };
        if (b.dataset.idle === '2') DX.showAd('idle', () => give(2)); else give(1);
        return;
      }
      if (b.dataset.codex) { const n = s.codexNew || 0; s.gold += n * C.codex.reward; s.codexNew = 0; DX.persist(); DX.S.level(); toast(L('도감 보상 골드 +', '图鉴奖励 金币 +') + n * C.codex.reward); refreshLobby(); return; }
      if (b.dataset.att) {
        if (!DX.attCan()) return;
        const g = DX.ATT[s.att.streak % 7];
        s.att.streak++; s.attDays = (s.attDays || 0) + 1; if (s.att.streak % 7 === 0) s.gems = (s.gems || 0) + C.gems.att7; s.att.last = DX.today(); s.gold += g; DX.persist();
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
    $('skinList').addEventListener('click', skinAction);
    $('heroList').addEventListener('click', e => {
      const b = e.target.closest('[data-hero]'); if (!b || b.disabled) return;
      const id = b.dataset.hero, lv = (DX.save.heroes || {})[id] || 0, cost = heroCost(lv);
      if (DX.save.gold < cost || lv >= C.heroes.max) return;
      DX.save.gold -= cost; DX.save.heroes[id] = lv + 1; DX.persist(); DX.S.level(); refreshLobby(); renderHeroes();
      DX.track('hero_up', { id, lv: lv + 1 });
    });
    $('subRow').addEventListener('click', e => {
      const b = e.target.closest('[data-sub]'); if (!b || b.classList.contains('lock')) return;
      const st = C.stages[DX.save.stage || 0]; DX.save.subSel = DX.save.subSel || {}; DX.save.subSel[st.id] = +b.dataset.sub; DX.persist(); DX.S.click(); refreshLobby();
    });
    $('btnEndless').addEventListener('click', () => { DX.S.click(); show($('lobby'), false); DX.startRun(C.stages.findIndex(s => s.id === C.endless.base), 0, true); });
    $('skillBar').addEventListener('pointerdown', e => { const b = e.target.closest('[data-sk]'); if (!b) return; e.stopPropagation(); e.preventDefault(); if (DX.castSkill(b.dataset.sk)) { b.classList.remove('ready'); try { navigator.vibrate && navigator.vibrate(25); } catch (e2) {} } });
    $('btnAuto').addEventListener('pointerdown', e => { e.stopPropagation(); const G = DX.getG && DX.getG(); DX.setAutoSkill(!(G && G.autoSkill)); DX.S.click(); toast(G && G.autoSkill ? L('자동 스킬 켬 (효율 80%)', '自动技能开启（效率80%）') : L('직접 누르면 100% + 타이밍 보너스!', '手动释放100% + 时机加成！')); });
    // 드래그 = 기관총 직접 조준 (게임 화면 빈 곳)
    { const isField = e => DX.state === 'play' && (e.target.id === 'gl' || e.target.id === 'fx' || e.target.id === 'hud' || e.target.id === 'vignette');
      let aiming = false;
      document.addEventListener('pointerdown', e => { if (!isField(e)) return; aiming = true; DX.aim(true, e.clientX, e.clientY); });
      document.addEventListener('pointermove', e => { if (aiming) DX.aim(true, e.clientX, e.clientY); });
      const up = () => { if (aiming) { aiming = false; DX.aim(false); } };
      document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up); }
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
    $('btnDouble').addEventListener('click', () => { const dd = new Date().toDateString(); const ad = DX.save.adDbl = DX.save.adDbl && DX.save.adDbl.d === dd ? DX.save.adDbl : { d: dd, n: 0 }; if (ad.n >= C.econ.adDoubleDay) { toast(L('오늘 광고 2배는 다 썼어요', '今日双倍次数已用完')); return; } ad.n++; show($('result'), false); DX.showAd('double', () => { toast(L('골드 2배 지급!', '金币翻倍到账！')); DX.finishRun(true); backToLobby(); }); });
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
      // 아직 없을 수도 있는 그림 자리 미리 확인 (보스 컷인·꾸미기 얼굴)
      for (const k in C.bosses) if (C.bosses[k].cutin) probe(C.bosses[k].cutin);
      C.survivors.forEach(sv => portraitOf(sv));
      if (location.hash === '#autostart') { DX.save.seenIntro = true; DX.save.firstRunDone = true; DX.startRun(DX.save.stage || 0); return; }
      if (!DX.save.seenIntro) showIntro(); else showLobby();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(window.DX);
