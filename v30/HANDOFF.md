# 천하등용 v30 인수인계 (2026-11-12, 빌드 v30.1 · 1112-0050)

## 기본
- 테스트 주소: https://pyungbum87-create.github.io/cheonha/v30/index.html (중국어 zh.html, 관문 돌파 legion.html / legion-zh.html)
- 설계서: https://claude.ai/artifact/RS3tUSVDKMzfzN62VxtHVJ · 관문 돌파 설계서: https://claude.ai/artifact/Af3bNHEcSohDH6dYEb4oAr
- 변경 기록: V30_CHANGES.md (끝에 "보류 목록"), 관문 돌파 작업 규칙: LEGION_GUIDE.md(저장소 legion 폴더 기준 내용과 동일)
- 역할: 그림·사운드 = ChatGPT, 기획·코드·밸런스·검수·통합 = Claude("베파"). 사용자는 "대표님".

## 구조
- index.html / zh.html: 한·중 각각 한 파일 게임(640×360 캔버스 + HTML 메뉴). 기능 추가는 `document.getElementById('stGo').onclick=` 앞에 `window.fn=(o=>function(){...})(fn)` 덮어쓰기 블록으로. **ko/zh 항상 같이 수정.**
- sd/sdv.js: SD 전신 캐릭터 렌더(몸+무기, 공격 포즈 ATK 20명, 크기 보정 ASC). `?sd=0`으로 끔.
- legion_core.js(전투 계산, step/dmg/cast 밸런스 기준) / legion_ui.js(캔버스 화면). 증원군(출전3+증원3, 관문 5/15/30 해금), 자동/수동, 군략 카드 3종.
- sw.js: 캐시 이름 `cheonhav30sd-N` (현재 20). 파일 바꾸면 N+1. 자기 접두어 캐시만 지움(루트 v18 보호).
- audio/: bgm_menu·bgm_battle·bgm_boss·bgm_legion (사용자 제공 음원, battle_music·China Chinese Epic Music 출처 확인 필요).

## 검사 방법
로컬 `python3 -m http.server` + Playwright(iPhone 13 landscape, serviceWorkers:'block'). `window.__sg`(G, newGame, update, recruit, render…), 관문 돌파는 `game.debug`(openForm, startBattle, scr). 중국어판 한글 누락은 fillText 가로채기로 검사.

## 남은 일
- 🔴 출시 막는 것: 위챗·더우인 미니게임 이식(지금은 HTML 메뉴 구조 → 캔버스 전용 필요), 실제 광고 연결(CHEONHA_REWARDED_AD 자리만, 관문 돌파 광고 자리 없음), 健康游戏忠告·개인정보 처리방침·이용약관, 음원 출처 2곡, 통계(track) 없음, 용량(전체 15MB, 미니게임 주 패키지 4MB → 분할).
- 결정 대기: 미니게임 이식 먼저 vs 한국판(웹/앱) 먼저.
- 보류: 세로 모드, 쓰러진 장수 세로 그림자, 관문 돌파 군단 확장(최대 9군단), 쇼츠, 신규 장수 49명·30스테이지, 한·중 분리 빌드, 난이도별 밸런스(플레이 피드백 받아 D.curve 조정).
