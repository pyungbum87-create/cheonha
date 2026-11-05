# 团团小镇闹哄哄 — 사진 소동 모드 (20단계)

언제든 촬영할 수 있고, 남긴 문제가 사진에 그대로 남는 새 방식. 공개 게임 `/scene/` 과 분리되어 있다.

- `src/stages.js` 단계 데이터 (문제 5개, 그림, 규칙, 대사). 단계 추가는 여기만 고친다.
- `src/engine.html` 화면과 엔진 (규칙 실행, 사진, 사진첩, 기념관)
- `art/` 이 모드 전용 그림. 나머지는 `../art/` 재사용
- `build.py` → `site/` 생성 (`site/` 는 커밋하지 않음)

## 검사
```
python3 build.py
node qa.js                 # 그림 키, 대상, 32개 사진 도달, 제목 중복
node play.js <저장폴더>      # iPhone 13 실제 터치로 20단계 완주
```
규칙: 문제 5개는 서로 막으면 안 된다(32조합 모두 가능). 반전은 `tw` 플래그로 한 번만 실패시키고 두 번째에 성공시킨다.
광고 없음. `TEST_OPEN_ALL` 은 시험용 전체 개방이다.

## 음악 기록 (임시)
| 파일 | 곡 | 작곡가 | 출처 | 받은 날짜 | 비고 |
|---|---|---|---|---|---|
| `music/menu.mp3` | Childish Magic (ID 530140) | shanghaistoneman | pixabay.com/music | 2026-11-04 | 목록에 AI 표시. 곡 페이지 주소와 라이선스 화면 저장 필요 |
| `music/play.mp3` | Playful Flute Strings (ID 602299) | JorisVermeer | pixabay.com/music | 2026-11-04 | 곡 페이지 주소와 라이선스 화면 저장 필요 |

## 난이도
`src/stages.js` 끝의 `diff`, `time`, `gate`(친구 찾기), `under`(가려진 물건), `decoy`(방해물)로 조절한다. 1단계만 쉽고 이후 힌트·자동 흔들림·허용 범위가 줄어든다.

## 광고
`src/engine.html` 의 `adAdapter` 만 위챗(`wx`)·더우인(`tt`) 광고로 바꾸면 된다. 지금은 시험용 가짜 광고다.
보상형 우선, 전면 광고는 `INTERSTITIAL_ON=false`. 광고 없이도 사진 저장과 다음 단계는 항상 가능. 연령 확인 전에는 `adAdapter.allowed()` 를 false 로 둔다.
