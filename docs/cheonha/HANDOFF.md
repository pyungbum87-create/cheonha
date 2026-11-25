# 천하등용 인수인계 (2026-11-15, 빌드 v35 · 1125)

> v31: 진단 리포트 적용. 새 기능·밸런스는 `v31.js`(한·중 공용, BAL 표)에. 변경 내용은 V30_CHANGES.md 끝 'v31'.

## 기본
- 정식 주소(2026-11-15 통합): https://pyungbum87-create.github.io/cheonha/ (중국어 zh.html, 관문 돌파 legion.html / legion-zh.html). v18·v20·v28·v30sd는 삭제, 옛 /v30/ 주소는 루트로 자동 이동(옛 캐시 정리). 문서는 docs/cheonha/.
- 설계서: https://claude.ai/artifact/RS3tUSVDKMzfzN62VxtHVJ · 관문 돌파 설계서: https://claude.ai/artifact/Af3bNHEcSohDH6dYEb4oAr
- 변경 기록: V30_CHANGES.md (끝에 "보류 목록"), 관문 돌파 작업 규칙: LEGION_GUIDE.md(저장소 legion 폴더 기준 내용과 동일)
- 역할: 그림·사운드 = ChatGPT, 기획·코드·밸런스·검수·통합 = Claude("베파"). 사용자는 "대표님".

## 구조
- index.html / zh.html: 한·중 각각 한 파일 게임(640×360 캔버스 + HTML 메뉴). 기능 추가는 `document.getElementById('stGo').onclick=` 앞에 `window.fn=(o=>function(){...})(fn)` 덮어쓰기 블록으로. **ko/zh 항상 같이 수정.**
- sd/sdv.js: SD 전신 캐릭터 렌더(몸+무기, 공격 포즈 ATK 20명, 크기 보정 ASC). `?sd=0`으로 끔.
- legion_core.js(전투 계산, step/dmg/cast 밸런스 기준) / legion_ui.js(캔버스 화면). 증원군(출전3+증원3, 관문 5/15/30 해금), 자동/수동, 군략 카드 3종.
- platform.js: 통계 CH_TRACK + 보상형 광고 CH_AD (네 화면 공통, 미니게임 이식 때 이 파일만 교체). 실제 광고는 window.CHEONHA_REWARDED_AD.show({placement})→Promise<bool> 하나만 넣으면 전부 연결. ?stats=1 로 기기 통계 보기.
- legal.html / legal-zh.html: 약관·개인정보(·健康游戏忠告). 붉은 칸 = 출시 전 입력할 운영자 정보.
- sw.js(루트): 캐시 이름 `cheonha-main-N` (현재 8). 파일 바꾸면 N+1. 루트 파일과 art/·audio/·sd/만 다루고 다른 게임 폴더 요청은 통과시킴. 옛 천하등용 캐시(cheonha-·cheonhav30sd-·v28test·v20test)만 지움.
- audio/: bgm_menu·bgm_battle·bgm_boss·bgm_legion (사용자 제공 음원, battle_music·China Chinese Epic Music 출처 확인 필요).

## 검사 방법
로컬 `python3 -m http.server` + Playwright(iPhone 13 landscape, serviceWorkers:'block'). `window.__sg`(G, newGame, update, recruit, render…), 관문 돌파는 `game.debug`(openForm, startBattle, scr). 중국어판 한글 누락은 fillText 가로채기로 검사.

## 남은 일
- 🔴 출시 막는 것: 위챗·더우인 미니게임 이식(지금은 HTML 메뉴 구조 → 캔버스 전용 필요), 실제 광고 SDK 연결(자리는 platform.js로 통일 완료), 약관 붉은 칸 정보 입력, 음원 출처 2곡, 통계 외부 전송처 정하기(지금은 기기 저장만), 용량(전체 10.1MB, 첫 접속 본편 2.7MB. 미니게임 주 패키지 4MB → 음원·배경은 분할 패키지로).
- 결정(11-12): 한국판(웹) 먼저. 중국 미니게임은 판호·중국 운영사 필요 → 퍼블리셔 탐색과 캔버스 메뉴 구조 정리만 병행.
- 보류: 세로 모드, 쓰러진 장수 세로 그림자, 관문 돌파 군단 확장(최대 9군단), 쇼츠, 신규 장수 49명·30스테이지, 한·중 분리 빌드, 난이도별 밸런스(플레이 피드백 받아 D.curve 조정).
