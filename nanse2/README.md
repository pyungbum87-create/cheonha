# 난세일생 2 (nanse2)

난세일생을 새 구조로 다시 만드는 작업 폴더. 기존 게임은 `../nanse/`에 그대로 있다.
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
