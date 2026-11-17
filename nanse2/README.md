# 난세일생 2 (nanse2)

난세일생 2. 기존 난세일생(`../nanse/src`) 코드를 가져와 새 데이터·새 규칙으로 개조한다. 기존 게임은 `../nanse/`에 그대로 있다.

테스트 주소: https://pyungbum87-create.github.io/cheonha/nanse2/
설계서: 난세일생 게임 설계서 (claude.ai Docs)

## 지금 있는 것 (2026-11-17)

| 파일 | 내용 |
| --- | --- |
| `data/stats.json` | 자체 능력치 체계 (1~20 척도, 무용·용병·지략·정무·인망), 특성 16종, 성격 6종, 무기 종류 |
| `data/equipment.json` | 이름 있는 장비 19종 (연의에 나오는 것만) + 일반 장비 등급 |
| `data/people/*.csv` | 장수·인물 원본 (세력별). 여기를 고치고 아래 명령으로 다시 만든다 |
| `data/people.json` | 위 CSV를 합쳐 검증한 결과 (304명) |
| `data/battles_184_200.json` | 황건적의 난(184) ~ 관도대전(200) 전투·사건 47건, 일기토 48회, 역사 분기 33개 |
| `data/map_cities.json` | 기존 난세일생 지도의 성 47개와 연결 |

## 다시 만들기와 검사

```
node tools/build_people.js data/people data/stats.json data/equipment.json data/people.json
node tools/check_battles.js data/battles_184_200.json data/people.json data/map_cities.json
node tools/similarity.js ../nanse/index.html data/people.json   # 기존(코에이와 비슷한) 수치와 겹침 정도
```

## 원칙

- 코에이 시리즈의 능력치 수치·항목·그림·UI·보물 이름을 쓰지 않는다.
- 역사는 삼국지연의 원작 기준, 대사와 설명은 직접 쓴다.
- 연도에 `est=e` 표시가 있는 인물은 생몰년이 추정값이다.

## 게임 빌드

```
node tools/gen_data.js                 # data/ → src/game_src.html 의 DATA 구간
ESBUILD=<esbuild 경로> bash src/rebuild.sh   # 데이터 넣기 + 전투 그림 합치기 + 압축 → src/min.html
cp src/min.html index.html             # 배포
node tools/sim.js 40 300               # 화면 없이 40판 × 최대 300개월 자동 진행, 튕김 검사
node tools/era_check.js                # 184년 시작 → 190년 시대 전환 확인
```

- 능력치는 화면에 1~20으로 보이고, 엔진 내부는 ×5 한 100점 척도로 계산한다(기존 공식 유지).
- 정무는 태수 자동 내정(개발도)에 쓰인다.
- 184년에 시작한 판은 190년 1월에 군웅할거로 넘어간다(eraShift190). 그 전에는 통일 판정이 없다.
- 저장 키는 `nanse5-*` (기존 난세일생 `nanse4-*`와 섞이지 않음).

## 2026-11-17 추가된 것

- 시작 시점 7개(184·190·196·200·207·219·228) — 평생 플레이. 새 경력 뒤에 기존 경력(207 이후)을 이어 붙인다.
- 회귀자: 시작 화면 첫 탭. 이름·신분(무명/장수/군주)·특기 선택. 역사 일치도(판도 비교)와 기억(憶 버튼). 다른 인물은 역사 수명대로 죽고, 회귀자는 기억으로 운명을 바꿀 수 있다(기억 속 그날 사건).
- 역사 사건(data/battles_184_200.json)이 그 달에 흘러가고, 사건에 묶인 죽음은 그 달에 일어난다. 184년 황건 전투는 원작대로 끝난다(역사의 흐름).
- 난이도 5단계(천명 추가), 전략 AI: 약한 세력·고립된 성 노리기, 병력 집중, 계략(유언비어·화계·이간), 강대 세력에 맞선 동맹.
- 광고 보상: 처지별 금액(군주 수입·장수 계급), 난이도별 하루 상한.
- 초상화: 세력색 배경·수묵 산, 겹옷깃·금테, 여성 머리 모양(twin·crownF), 새 인물 생김새(data/looks.json), 이름 있는 여성 인물 표시.
- 용량: 인물 데이터 압축 표기(P_RAW). 압축본 약 368KB, gzip 약 131KB.
- 검사 도구: tools/reg_check.js(회귀자 일치도), tools/gallery.js(초상화 모아 보기).
