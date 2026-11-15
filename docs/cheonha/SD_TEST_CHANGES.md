# 천하등용 v29 + SD 장수 시범 (sdtest)

## 변경 파일
- 신규 `sd/sdv.js` — SD 장수·발판 그리기 모듈 (그리기 전용)
- 신규 `sd/*.webp` 15개 — 장수 몸 4, 무기 4, 효과 4, 발판 3, 바닥 장식 시트 1 (총 약 210KB)
- `index.html`, `zh.html` — 각 3줄만 추가/변경
  1. `<script src="sd/sdv.js">` 1줄
  2. buildBG() 칸 그리기 반복문: `if(window.SDV&&SDV.pad(g,x,y,i))continue;` (네모 칸 → 발판)
  3. 장수 그리기: `(window.SDV&&SDV.unit(ctx,u,x,y))||drawToken(...)` (SD 그림 있는 장수만 전신, 나머지는 기존 초상화)
- `sw.js` — 캐시 이름 `cheonha-v30-sdtest`

## 변경하지 않은 것
slotXY / slotAt(터치 판정), 전투·합성·난이도 계산, 저장(cheonha-save), 관문 돌파 파일 전부, 기존 그림 아틀라스.

## 끄기
주소 뒤에 `?sd=0` → 기존 화면 그대로. (localStorage `cheonha-sd`=`0`도 동일)

## 모션 조정값 (sd/sdv.js 의 CH 표)
hand = 몸 그림(512 기준)에서 손 위치, grip = 무기 그림에서 손잡이 위치, rest = 평소 무기 각도, move = slash/thrust/shoot/fan, ws = 무기 크기 배율.
새 장수 추가 = 그림 2장(sd_<id>_body/weapon.webp) + CH 표 1줄.

## 2차 (전설 10명 추가)
- sd/*.webp 20개 추가 (조조·사마의·허저·장비·손책·주유·육손·여포·동탁·원소 몸+무기). sd 폴더 합계 약 440KB
- sdv.js: 14명 손 위치·무기 손잡이·모션 등록, 신화 6명(m_*)은 전설 그림 재사용
- 크기 72 → 64px (전설 1.04배, 신화 1.1배), 전설 금빛 오라 / 신화 주황 오라(맥동)
- index.html / zh.html / sw.js 추가 변경 없음

## 3차 (전원 SD)
- 무장 12, 병졸 8(무기 포함 한 장, 몸 모션만, 0.86배), 신화 각성 6, 진영 효과 4 + 신화 오라 추가 → 게임의 모든 장수 SD
- 전설·신화 공격 효과 = 진영 효과(위 은청 / 촉 비취 / 오 화염 / 군웅 자주), 신화는 발밑 금빛 오라
- sw.js: 캐시 이름 cheonhav30sd-2, 자기 캐시만 정리(본 게임 v18 저장본 보호)
- sd 폴더 합계 약 1.3MB (90개)
