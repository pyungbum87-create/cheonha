# 심해 신전 수비대 · 그림 프롬프트 (A안: 생물발광 심해 판타지 + 기갑 수호대)

기준 그림: `ref/style_A_main.png`(디자인 시트), `ref/style_A_screen.png`(게임 화면). 2026-11-17 받은 그림 23장(배경·바위섬·신전·동굴·영웅·수호탑 5종 1단계 + 산호 2·거품 3·해파리 4단계·적 10종)이 `art/` 에 들어가 있다. 원본은 `ref/raw/`(저장소에는 안 올림).

## 공통 규칙 (모든 프롬프트 끝에 붙이기)
```
Style: semi-realistic painterly fantasy mobile game art, bioluminescent deep sea, white-gold armor and gold trim accents, purple abyss corruption for enemies, high detail, crisp readable silhouette, mature mid-core look, not cute, not chibi. Single object only, centered, full body visible, isolated on a plain flat solid light gray background, no floor shadow, no text, no logo, no watermark.
```
- 한 장에 하나만. 배경은 **단색 밝은 회색**(투명 PNG로 내보낼 수 있으면 그게 제일 좋음)
- 수호탑·영웅: 위에서 비스듬히 본 시점(3/4 top-down) · 적: 옆모습(오른쪽을 봄)
- 1024×1024 정사각형(배경만 9:16)
- 받은 그림은 `tools/cutout.py` 로 배경을 지우고 아래 파일 이름으로 `art/` 에 넣으면 코드 그림 대신 자동으로 쓰인다

## 1. 영웅
| 파일 | 프롬프트 |
|---|---|
| `hero_guard` | Armored deep-sea mech guardian hero, sleek white and gold plated armor, glowing cyan visor and chest gem, translucent teal scarf fins flowing, holding a large gold anchor weapon with a cyan gem, heroic adult proportions, 3/4 top-down view facing right, standing ready pose. |

## 2. 수호탑 (단계마다 한 장, 같은 팔각 금테 받침대 + 삼지창 문양)
받침대 공통: `on an octagonal dark stone base with gold trim and a glowing gold trident emblem on the front, small corals at the base`
단계 문구: 1 = `simple and compact` · 2 = `upgraded, more gold trim, brighter glow` · 3 = `grand, tall, ornate gold crown ornament, strong glow` · 4 = `awakened legendary form, radiant aura, floating rune rings, most powerful look`

| 파일 | 프롬프트 (끝에 받침대 + 단계 문구) |
|---|---|
| `tw_coral_1`~`4` | Coral spike shooter defense tower, sharp orange crystal coral spikes ready to fire, warm orange glow |
| `tw_bubble_1`~`4` | Glass bubble orb defense tower, a large clear glass sphere full of cyan bubbles held by gold claws, cyan glow |
| `tw_jelly_1`~`4` | Jellyfish lighthouse defense tower, a glowing translucent jellyfish bell on top of a small lighthouse, yellow electric lightning crackling |
| `tw_conch_1`~`4` | Giant conch shell cannon defense tower, pearly peach spiral shell with a brass cannon mouth, pearls |
| `tw_rune_1`~`4` | Rune lantern shrine defense tower, small pagoda-roof lantern with a glowing purple crystal inside, purple crystals around |

## 3. 적 (모두 옆모습, 오른쪽을 봄, 보라색 심연 발광)
| 파일 | 프롬프트 |
|---|---|
| `en_minnow` | A small school of shadow minnows, dark slender fish with glowing purple eyes and fins |
| `en_crab` | Armored abyss crab, dark spiked carapace with purple glowing cracks, big claws |
| `en_eel` | Electric abyss eel, long dark serpent body, purple lightning crackling along it, open fanged jaw |
| `en_ray` | Shadow manta ray, translucent dark wings with purple glowing veins, long whip tail |
| `en_angler` | Lantern anglerfish, dark body, huge fanged mouth, glowing green-yellow lure light |
| `en_squid` | Ink squid, dark purple squid with glowing purple suckers, ink cloud trailing |
| `en_horseshoe` | Horseshoe crab, dark armored dome shell with gold-edged plates, long spike tail |
| `en_turtle` | Rock-shell abyss turtle, shell made of dark rocks with purple crystals growing from it, heavy and slow |
| `en_elite` | Abyss seahorse knight, armored dark seahorse holding a long spear, purple fins, small crown helm |
| `en_boss` | Abyss anglerfish king boss, gigantic dark anglerfish with a gold crown, rows of huge fangs, glowing purple lure orb, armored gold plates, menacing |

## 4. 지도
| 파일 | 프롬프트 |
|---|---|
| `bg_area1` | Vertical 9:16 empty underwater background for a top-down mobile game, open deep ocean seen from above, soft sandy seafloor far below, scattered dark rocks, kelp and glowing corals only along the left and right edges, god rays from the top, dark teal palette, the center left mostly open and calm. No islands, no buildings, no path, no creatures, no text. |
| `islet` | Small floating rock islet seen from 3/4 top-down, flat mossy top with a glowing gold hexagonal trident rune build marker in the middle, jagged rock underside, small glowing corals on the edges. |
| `temple_gate` | Ancient underwater temple gate, white stone and gold, tall arch with a glowing golden trident door, steps in front, cyan glow, 3/4 top-down view. |
| `abyss_rift` | Swirling purple abyss rift portal seen from above, dark vortex with purple lightning, used as an enemy spawn point. |

## 그림이 오면
1. `python3 tools/cutout.py 받은그림.png art/파일이름.png` (단색 배경을 지우고 빛 번짐은 반투명으로 살림)
2. `python3 build.py` → `site/` 를 저장소 `/sea/` 에 복사
3. 수호탑 2~4단계 그림이 없으면 1단계 그림을 키우고 왕관·빛을 코드로 얹는다. 배경·바위섬·신전·동굴 그림이 없으면 코드 그림을 쓴다
