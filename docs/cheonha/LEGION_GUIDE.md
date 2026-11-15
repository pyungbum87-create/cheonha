# 관문 돌파 (军团征战) — ChatGPT 작업 가이드

## 파일 구조 (건드리는 범위)
| 파일 | 내용 | ChatGPT가 손대도 되는가 |
|---|---|---|
| `legion_core.js` | 규칙·데이터 표·관문 생성기·전투 계산·저장. DOM/canvas 없음 | **데이터 표(D.*)만** 수정·추가 |
| `legion_ui.js` | canvas 전용 화면 (640×360). 그림은 전부 `art(key)`로 요청 | 그림 키 추가, 배치 미세조정 |
| `art/legion/*.webp` | 새 그림 넣는 곳. 파일명 = 그림 키 | **자유롭게 추가** |
| `index.html`, `zh.html` | 기존 랜덤 디펜스 | 관문 돌파 작업 중엔 수정 금지 |

규칙: 전투 계산(step/dmg/cast)은 바꾸지 말 것(밸런스 시뮬레이션 기준). 한국어(ko)·중국어(zh) 텍스트는 항상 둘 다 넣을 것.

## 그림 넣는 법 (코드 수정 없음)
`art/legion/<키>.webp` 파일을 넣으면 자동으로 쓰이고, 없으면 코드가 대신 그립니다.

| 키 | 크기(px) | 설명 |
|---|---|---|
| `bg_plain` `bg_gate` `bg_castle` `bg_river` `bg_mountain` `bg_forest` | 640×260 | 전장 윗부분(하늘·성문·풍경). 아래쪽은 땅으로 이어지게 |
| `ground` | 640×140 | 전장 땅 (y=220부터 그려짐) |
| `map_bg` | 640×360 | 관문 목록 화면 배경 |
| `sol_inf_ally` `sol_cav_ally` `sol_arc_ally` `sol_str_ally` | 48×48 | 아군 병사 1명 (창/기/궁/책사). 오른쪽을 봄, 발이 아래 가운데 |
| `sol_inf_foe` … `sol_str_foe` | 48×48 | 적 병사 1명 (오른쪽을 보게 그리면 코드가 뒤집음) |
| `flag_0`~`flag_3` | 40×56 | 위·촉·오·군웅 깃발 |
| `vs` | 64×64 | 상단 VS 문양 |
| `aura` | 160×140 | 스킬 쓸 때 부대 뒤 금빛 기운 |
| `shield` | 160×140 | 방어 버프 보호막 |
| `fx_hit` `fx_heal` `fx_arrow`(32×12) | 128×128 | 공통 효과 |
| `fx_<스킬id>` 예: `fx_qinglong` `fx_eastwind` | 256×256 | 스킬별 폭발 효과 (선택) |
| `type_inf` `type_cav` `type_arc` `type_str` | 64×64 | 병종 아이콘 |
| `gate_node` `gate_boss` `gate_lock` | 96×96 | 지도 관문 아이콘 |
| `star` `star_off` | 32×32 | 별 |
| `frame_0`~`frame_4` | 128×128 | 등급별 초상화 테두리(가운데 투명) |

배경은 투명 webp, 품질 80 이하 권장 (위챗 미니게임 용량: 전체 패키지 4MB 제한 → 관문 그림은 분할 로딩 예정).
⚠ 다른 게임 스크린샷·그림을 그대로 쓰거나 베끼지 말 것 (저작권). 분위기만 참고.

## 내용 늘리는 법 (legion_core.js 데이터 표에 한 줄 추가)
- **진형** `D.forms`: `{unlock:관문번호, n:{ko,zh}, d:{ko,zh}, slots:[{col:0|1,y:0~1}×3], mods:[...]}`
- **조합 효과** `D.syn`: `need`는 `{faction,count}` / `{ids:[...]}` / `{any:[...],count}` / `{types:{cav:3}}` / `{distinct:3}`
- **전장 조건** `D.traits`: `{unlock, n, d, mods:[{side:'ally'|'enemy'|'both', who, stat, mul}]}`
- **스킬** `D.skills` + 장수 연결 `D.genSkill`
- **병종** `D.types` (`beats`로 상성 지정) — 새 병종 추가 시 병사 그림 키도 추가
- **장(챕터)** `D.chapters`: 이름 + 배경 키. 목록이 끝나면 Ⅱ, Ⅲ회차로 반복 → 관문 수 무제한
- **난이도 곡선** `D.curve` 한 곳에서 조절 (lvPerGate, bossLv, 보상 등)

`mods` 문법: `who` = all / front / back / ranged / melee / inf·cav·arc·str / `id:gwanu` / `faction:1`, `stat` = atk / hp / taken(받는 피해) / spd / gauge(기력) / skill(스킬 위력), `mul` = 배율.

## 반복 플레이 구조
- 첫 돌파 이후 같은 관문은 **매일 조건·적 구성이 바뀜**(정벌), 별 3개(승리/병력 50%↑/전원 생존) 도전
- 10관문마다 보스: **플레이어의 직전 편성을 읽고 상성 병종으로 바꿔 나옴** → 편성을 바꿔야 함
- 적도 조합 효과를 받음 → 조합 대 조합 싸움
