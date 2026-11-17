# 그림 프롬프트 v3 (ChatGPT 용 · 50판 · 이야기 · 가게 성장 반영)

콘셉트: **간식으로 배불려 돌려보내기** · 그림체 **"가" 선명한 만화풍** (굵은 밤색 외곽선)

## 쓰는 법
1. **1번(가게 기본 6종)이 기준 그림**이다. 2번부터는 항상 **1번 결과 그림을 같이 올리고** 프롬프트를 붙여 넣는다.
2. 한 장에 여러 개가 들어 있어도 된다. 받은 그림을 그대로 주면 베파가 잘라서 이름을 붙여 넣는다.
3. **움직임·효과·그림자는 게임이 만든다.** 그림은 정면을 보고 가만히 선 모습 한 장이면 된다(프롬프트에 넣어 둠).
4. 급한 순서: **1 → 2(가게 성장 6장) → 3 → 4 → 5 → 6 → 7 → 8**. 1~3번만 있어도 게임 화면이 크게 달라진다. 없는 그림은 지금처럼 코드 그림이 대신 나온다.
5. 총 **21장** (1 + 6 + 2 + 1 + 5 + 1 + 5).

## 통일 규격 (그림·효과·동작이 한 벌로 보이게)
| 항목 | 규칙 |
|---|---|
| 자세 | 정면을 보고 가만히 선 좌우 대칭. 움직임 선·잔상·바닥 그림자 없음 |
| 선과 빛 | 굵은 밤색 외곽선, 2단 명암 + 윤기 하이라이트, 빛은 왼쪽 위 |
| 색 | 가게는 따뜻한 색(빨강·크림·나무색), 손님은 시원한 바다색 → 한눈에 편이 갈린다 |
| 가게 성장 | 같은 가게가 **1단계 소박 → 2단계 등롱 줄 → 3단계 금테·큰 간판 → 새 메뉴(화려, 대표 간식이 지붕 위에 크게)** 로 자란다. 뼈대·색은 그대로 두고 장식만 늘어야 같은 가게로 보인다 |
| 효과 | 날아가는 간식·터지는 효과는 코드가 같은 재료로 그린다(단계가 오르면 간식이 커지고, 새 메뉴는 색이 바뀜). 그림에 효과를 넣지 않는다 |
| 특기 | 부풀기·숨기·투명·뛰기는 같은 그림을 늘이고 줄이고 흐리게 해서 보여 준다. 특기용 그림은 받지 않는다 |
| 금지 | 글자·숫자·워터마크, 실제 상표, 다른 게임 캐릭터, 대포·총 |

---

## 1. 간식 가게 기본 6종 (기준 그림 · 1단계)
```
Sprite sheet for a mobile tower-defense game, 3 columns x 2 rows, six separate night-market food stall towers evenly spaced on a plain pure white background, no text, no numbers, no watermark.
Style: chunky casual strategy game art, three-quarter top-down view, thick dark-brown outline, clean cel shading with a glossy highlight, bright saturated candy colors, big readable silhouettes, cute and cozy.
Each stall stands upright and still, symmetric, no motion lines, no ground shadow, the whole stall visible with its base at the bottom. These are the small, humble starter versions: simple wooden cart, plain striped cloth awning, no lanterns, no gold.
Each tower is a tiny Chinese night-market food stall that serves its own food, with no cannons or guns:
1) a stack of bamboo steamers with the lid popping open, hot steamed buns inside (red-and-cream awning)
2) a shaved-ice stand with a hand-crank ice machine (sky-blue-and-white awning)
3) a red popcorn cart with popcorn spilling over the top (red-and-yellow awning)
4) a tea stall with a big copper kettle and one small paper lantern (green-and-cream awning)
5) a candied-hawthorn (tanghulu) stall with skewers standing in a rack (pink-and-white awning)
6) a sticky rice-cake stall with a wooden mortar and white rice cakes (beige-and-brown awning)
```
→ 넣는 이름: `tw_tt_1, tw_didi_1, tw_peng_1, tw_shan_1, tw_dun_1, tw_zhuo_1`

## 2. 가게 성장 6장 (가게마다 한 장 · 1번 그림을 같이 올리고)
아래 **공통 틀**에 가게별 4줄만 바꿔 넣어 6번 만든다. 한 장에 4칸: 2단계, 3단계, 새 메뉴 A, 새 메뉴 B.

**공통 틀**
```
Same art style as the attached reference image. Sprite sheet, 2 columns x 2 rows, four upgraded versions of ONE food stall (the [STALL] from the reference), evenly spaced on a plain pure white background, no text, no numbers, no watermark. Three-quarter top-down view, thick dark-brown outline, cel shading with glossy highlight. Each stands upright and still, symmetric, no motion lines, no ground shadow, whole stall visible, all four drawn at the same size.
Keep the same cart shape and the same awning colors as the reference so it is clearly the same stall growing up; only add decoration and make the food more impressive.
1) Level 2: the same stall, tidier, with a string of small red paper lanterns along the awning and a few more [FOOD] on display.
2) Level 3: bigger and proud, gold trim on the awning edge, a round wooden signboard with a simple [FOOD] picture (no letters), two lantern strings, a tall pile of [FOOD].
3) Special menu A: [BRANCH A]
4) Special menu B: [BRANCH B]
Both special versions are the grandest: golden awning edge, glowing lanterns, and the signature food shown huge on top of the roof.
```

**가게별로 바꿔 넣을 4줄**

2-1 만두 찜통 → `tw_tt_2, tw_tt_3, tw_tt_king, tw_tt_twin`
```
[STALL] = bamboo steamer bun stall (number 1)
[FOOD] = steamed buns
[BRANCH A] = "King Bun": one giant steamed bun as big as the roof, sitting in a huge bamboo steamer with steam puffing out.
[BRANCH B] = "Twin Steamer": two tall towers of bamboo steamers side by side, both lids popping open with buns.
```
2-2 빙수 가게 → `tw_didi_2, tw_didi_3, tw_didi_ice, tw_didi_jet`
```
[STALL] = shaved-ice stand (number 2)
[FOOD] = bowls of shaved ice
[BRANCH A] = "Red Bean Ice": a giant mountain of shaved ice in a bowl on the roof, topped with red beans and a cherry, frosty icicles on the awning.
[BRANCH B] = "Slush Fountain": a big clear slush machine with a wide spout like a fountain nozzle, swirling blue-and-white slush inside.
```
2-3 팝콘 수레 → `tw_peng_2, tw_peng_3, tw_peng_dragon, tw_peng_star`
```
[STALL] = red popcorn cart (number 3)
[FOOD] = popcorn
[BRANCH A] = "Spicy Popcorn": popcorn glowing warm red-orange, a big red chili pepper ornament on the roof, a little heat shimmer.
[BRANCH B] = "Caramel Popcorn": shiny golden-brown caramel popcorn overflowing, a big dripping caramel pot on the roof with star-shaped sparkles.
```
2-4 등롱 찻집 → `tw_shan_2, tw_shan_3, tw_shan_rainbow, tw_shan_moon`
```
[STALL] = copper-kettle tea stall (number 4)
[FOOD] = tea cups
[BRANCH A] = "Flower Tea": a big glass teapot on the roof with colorful flowers floating inside, pastel petals decorating the awning.
[BRANCH B] = "Dark Pu-erh": a big dark clay teapot on the roof, deep brown and gold colors, a round moon-shaped lantern glowing beside it.
```
2-5 탕후루 가게 → `tw_dun_2, tw_dun_3, tw_dun_smash, tw_dun_double`
```
[STALL] = candied-hawthorn (tanghulu) stall (number 5)
[FOOD] = glossy red candied-fruit skewers
[BRANCH A] = "Giant Skewer": one enormous tanghulu skewer taller than the stall standing on the roof like a flagpole, with huge shiny red fruits.
[BRANCH B] = "Twin Skewers": two big crossed tanghulu skewers on the roof, one red hawthorn and one green grape, glossy sugar shine.
```
2-6 찹쌀떡 가게 → `tw_zhuo_2, tw_zhuo_3, tw_zhuo_express, tw_zhuo_parcel`
```
[STALL] = sticky rice-cake stall (number 6)
[FOOD] = white rice cakes
[BRANCH A] = "Famous Shop": the stall covered in award ribbons and gold medals with no letters, a little velvet queue rope in front, extra lanterns, a gold star ornament on the roof.
[BRANCH B] = "Giant Rice Cake": one huge soft round white rice cake on the roof, stretchy and gooey, dusted with powder, a big wooden mallet leaning on it.
```

## 3. 배고픈 바다 손님 10종 + 배부른 모습 (2장)
**3-1 배고픈 모습** → `en_crab, en_jelly, en_fish, en_puffer, en_hermit, en_octo, en_gull, en_turtle, en_elite, en_shrimp`
```
Same art style as the attached reference image. Sprite sheet, 5 columns x 2 rows, ten separate hungry sea creatures evenly spaced on a plain pure white background, no text, no numbers, no watermark. Three-quarter top-down view, each one standing still in a neutral symmetric pose facing the viewer (the game animates them), whole body visible, no motion lines, no ground shadow, looking hungry with sparkling eyes and a little drool, mischievous but cute, not scary, thick dark-brown outline, cel shading, cool sea colors.
1) small orange crab  2) pale-blue jellyfish  3) blue flying fish with wing fins  4) yellow pufferfish with tiny spikes  5) hermit crab in a big spiral shell
6) lavender octopus with an ink drop on its lips  7) white seagull with wings spread wide  8) green sea turtle with a red bandana  9) tough red crab wearing a silver bucket as a helmet  10) tiny pink shrimp with long whiskers
```
**3-2 배불러서 돌아가는 모습 (3-1 결과를 같이 올리고)** → `en_<이름>_full`
```
Same ten sea creatures as the attached image, same order, same art style and same sizes. Sprite sheet, 5 columns x 2 rows on a plain pure white background, no text, no watermark. Now each one is happily full: round bulging belly, eyes closed in a big satisfied smile, rosy cheeks, a tiny crumb near the mouth. Standing still, neutral symmetric pose facing the viewer, no motion lines, no ground shadow.
```

## 4. 구역 보스 5종 (구역마다 10번째 판에 등장)
→ `boss_kingcrab, boss_octoboss, boss_whale, boss_pirate, boss_dragon`
```
Same art style as the attached reference image. Sprite sheet, 3 columns x 2 rows (last cell empty), five large boss sea creatures on a plain pure white background, no text, no watermark. Three-quarter top-down view, standing still in a neutral symmetric pose facing the viewer, whole body visible, no motion lines, no ground shadow, very hungry and greedy looking but adorable, not scary, very detailed, thick dark-brown outline.
1) a huge king crab with a small gold crown, holding a fork and a spoon in its claws
2) a giant purple octopus with a tiny crown, each tentacle holding an empty bowl
3) a big round whale shark with white spots and a wide open hungry mouth
4) a big pirate sea turtle with a plain black pirate hat and an eye patch, carrying a sack for snacks
5) a chubby baby sea-dragon prince, teal scales, small antlers, a tiny gold crown, a napkin bib around the neck, teary hungry eyes, holding an empty rice bowl
```

## 5. 전투 배경 5장 (구역마다 한 장 · 길은 게임이 그리므로 가운데를 비운다)
한 번에 한 장씩, 마지막 줄 `Scene:` 만 바꿔서 5번 만든다. → `bg_1 ~ bg_5`
```
Same art style as the attached reference image. Mobile game battlefield background, vertical 9:16, top-down view, soft painterly cel shading, no characters, no path, no road, no text, no watermark.
Layout from top to bottom: the top 15% is shallow sea with gentle foam at the shoreline; the middle 70% is a wide EMPTY flat ground with only tiny details (keep it clean and low-contrast, food stalls and a path will be drawn on top); the bottom 15% is the wooden boardwalk of a seaside night market with red lanterns. Decorations only along the left and right edges.
Scene: sunny golden sand beach with palm trees and striped parasols at the edges.
```
| 파일 | 구역 | Scene 줄 |
|---|---|---|
| bg_1 | 금빛 모래사장 | `Scene: sunny golden sand beach with palm trees and striped parasols at the edges.` |
| bg_2 | 갯바위 골목 | `Scene: late-afternoon rocky shore, flat grey-brown stone ground with tide pools, barnacle rocks and fishing nets at the edges.` |
| bg_3 | 산호초 정원 | `Scene: bright shallow lagoon, pale turquoise sandbar ground, pink and orange coral and sea anemones at the edges.` |
| bg_4 | 해적섬 부두 | `Scene: sunset pirate island dock, warm orange light, weathered sandy ground, barrels, anchors, rope and a small wrecked rowboat at the edges.` |
| bg_5 | 용궁 문턱 | `Scene: moonlit night shore in front of an undersea dragon palace gate, deep blue-purple ground with glowing pearls, jade pillars and glowing lanterns at the edges.` |

## 6. 자리·문·아이콘 (1장)
→ `ic_spot, ic_gate, ic_bun, ic_coin, ic_star, ic_wave, ic_melon, ic_lock`
```
Same art style as the attached reference image. Game UI icon sheet, 4 columns x 2 rows, eight separate objects evenly spaced on a plain pure white background, no text, no numbers, no watermark, thick dark-brown outline, cel shading, glossy highlight, each centered and the same size.
1) an empty stall plot: a round woven straw mat on sand with a tiny wooden peg sign (top-down view)
2) a night-market entrance gate: red wooden arch with two lanterns and a basket of steamed buns under it
3) one steamed bun (life icon)  4) a gold coin with a plain shell emblem  5) a gold star
6) a big curling ocean wave  7) a whole striped watermelon  8) a padlock
```

## 7. 이야기 그림 5장 (선택 · 구역 시작 화면과 스토어 소개용)
한 번에 한 장씩. **퇀퇀 캐릭터 그림(tuantuan)도 같이 올린다.**
```
Same art style as the attached reference images. Story illustration for a mobile game, square 1:1, thick dark-brown outline, cel shading, warm and funny mood, no text, no watermark. The round bun-chef mascot from the attached image is the hero.
Scene: [아래 한 줄]
```
| 파일 | Scene 줄 |
|---|---|
| st_1 | `Opening day of a beach night market: the bun chef lifts a steamer lid, a delicious smell trail drifts to the sea, and hungry little crabs and jellyfish peek out of the waves with sparkling eyes.` |
| st_2 | `A narrow rocky alley of food stalls crowded with picky pufferfish and playful octopuses squirting ink, the bun chef wiping ink off a lantern and laughing.` |
| st_3 | `A coral garden where seagulls swoop from the sky toward snack stalls while a big friendly whale shark whispers a secret to the bun chef.` |
| st_4 | `A pirate island dock at sunset: a pirate sea turtle sneaks away with a whole snack cart on its back, and the bun chef offers it a warm bun instead.` |
| st_5 | `In front of an undersea dragon palace gate at night, a chubby baby sea-dragon prince with a bib cries from hunger, and the bun chef arrives with a tray stacked with every snack.` |

## 8. 스토어용 (출시 직전에)
```
Same art style as the attached reference images. Mobile game key art, vertical 9:16, no text, no watermark. A lively seaside night market at dusk with six cute food stalls (steamed buns, shaved ice, popcorn, tea, candied fruit skewers, rice cakes) and red lanterns. A crowd of hungry cute sea creatures (crabs, jellyfish, octopus, pufferfish, sea turtle, seagull) marches up from the sea along a sandy path, while the round bun-chef mascot stands in front cheerfully tossing a steamed bun. Some creatures in the foreground are already full with round bellies and happy faces. Leave the top 25% as calm sky for a title.
```
아이콘(1:1): 위 그림에서 "퇀퇀이 만두를 내밀고, 꽃게 한 마리가 입을 벌린" 부분만 크게.

---

## 받은 뒤 베파가 하는 일
배경 지우기 → 같은 크기 틀·발끝 위치 맞추기 → 이름 붙여 `dev/beach/art/` 에 넣기 → 화면에서 외곽선 굵기·채도가 튀는 장은 다시 요청.
가게는 단계별 그림이 일부만 있어도 된다(없는 단계는 가장 가까운 아래 단계 그림에 코드 장식이 붙는다).
