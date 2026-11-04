# 团团小镇闹哄哄 (퇀퇀 동네 소동) — 개발용 원본

- 공개 주소: https://pyungbum87-create.github.io/cheonha/scene/
- 기획서: https://claude.ai/artifact/7TLYyyspJSrHSdp6xNiueb · 시리즈 설계서: https://claude.ai/artifact/4iYUuvcCRffqksrTfJ2C4Q

## 구조
- `src/game.js` 게임 전체 (LEVELS 표에 단계 추가: objs = 그림·위치, tasks = 할 일(tap·drag·swipe·rub·hold), eggs = 숨은 말풍선)
- `src/shell.html` 화면 틀·CSS, `src/audio.js` 효과음
- `art/*.webp` 그림 (파일명 = 코드의 img 키), `music/` BGM
- `build.py` → `site/` 생성 (한 장짜리 HTML + 그림 + 오프라인 sw.js). 버전은 game.js 의 `const VER`
- `tools_cut.py` ChatGPT 스티커 시트 → 물건별 투명 webp 자르기

## 올리기
`python3 build.py` → `site/` 내용을 저장소 `/scene/` 에 그대로 복사 → 커밋·푸시. `dev/scene/site` 는 올리지 않는다.

## 검사
`site/` 를 로컬 서버로 띄우고 Playwright(iPhone 13 세로)로 `__sp.startLevel(i)` 후 단계의 tasks 를 순서대로 자동 수행 → 10단계 전부 완료·오류 0 확인 (2026-11-04).
주의: swipe 로 옮겨진 물건은 애니메이션 중 `o.mx/o.my` 만큼 떨어져 있으니 자동 검사 좌표에 더해 줄 것.
