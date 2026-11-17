# 그림 프롬프트 (ChatGPT 용 · 콘셉트: 간식으로 배불려 돌려보내기 · 그림체 "가" 선명한 만화풍)

**쓰는 법**
1. 1번 결과(가게 6종)가 기준 그림이다. 2번부터는 **1번 결과 그림을 같이 올리고** 붙여 넣는다.
2. 한 장에 여러 개가 들어 있어도 된다. 번호만 알려 주면 베파가 잘라서 넣는다.
3. **움직임은 게임이 만든다.** 그림은 가만히 서 있는 모습 한 장이면 된다. 그래서 모든 그림은 정면을 보고 똑바로 선 좌우 대칭 자세, 움직임 선·잔상·바닥 그림자 없이 그린다(프롬프트에 넣어 둠).
4. 넣는 이름(베파가 처리): 가게 `tw_tt, tw_didi, tw_peng, tw_shan, tw_dun, tw_zhuo` · 손님 `en_crab …` · 보스 `boss_kingcrab …` · 배경 `bg_1 ~ bg_5`. `dev/beach/art/` 에 이 이름의 webp 가 있으면 코드 그림 대신 자동으로 쓰인다.

## 통일 규격 (그림·효과·동작이 한 벌로 보이게)
| 항목 | 규칙 |
|---|---|
| 자세 | 정면을 보고 가만히 선 좌우 대칭. 움직임 선·잔상·바닥 그림자 없음 (움직임과 그림자는 게임이 붙인다) |
| 선과 빛 | 굵은 밤색 외곽선, 2단 명암 + 윤기 하이라이트, 빛은 왼쪽 위 |
| 색 | 가게는 따뜻한 색(빨강·크림·나무색), 손님은 시원한 바다색 위주 → 한눈에 편이 갈린다 |
| 받은 뒤 베파가 하는 일 | 배경 지우기, 같은 크기 틀에 맞추고 발끝 위치 맞추기, 외곽선 굵기·채도가 튀는 장은 다시 요청 |
| 효과 | 전부 같은 재료(고리·번쩍임·연기·하트·별가루)와 같은 색 표로 코드가 그린다. 그림에 효과를 그려 넣지 않는다 |
| 특기 표현 | 부풀기·숨기·투명·뛰기 같은 특기는 같은 그림 한 장을 늘이고 줄이고 흐리게 해서 보여 준다. 특기용 그림을 따로 받지 않으므로 그림체가 어긋날 일이 없다 |

## 1. 간식 가게 6종 (기준 그림)
```
Sprite sheet for a mobile tower-defense game, 3 columns x 2 rows, six separate night-market food stall towers evenly spaced on a plain pure white background, no text, no numbers, no watermark.
Style: chunky casual strategy game art, three-quarter top-down view, thick dark-brown outline, clean cel shading with a glossy highlight, bright saturated candy colors, big readable silhouettes, cute and cozy.
Each stall stands upright and still, symmetric, no motion lines, no ground shadow, the whole stall visible with its base at the bottom.
Each tower is a tiny Chinese night-market food stall that launches its own food, with no cannons or guns:
1) a stack of bamboo steamers with the lid popping open, flinging hot steamed buns
2) a shaved-ice stand with a hand-crank ice machine, spraying icy slush
3) a red popcorn cart with popcorn bursting out like fireworks
4) a tea stall with a big copper kettle and a red paper lantern, shooting a warm beam of steam
5) a candied-hawthorn (tanghulu) stall with a skewer crossbow made of bamboo
6) a sticky rice-cake stall tossing gooey white rice cakes
```

## 2. 배고픈 바다 손님 10종
```
Same art style as the attached reference image. Sprite sheet, 5 columns x 2 rows, ten separate hungry sea creatures evenly spaced on a plain pure white background, no text, no numbers, no watermark. Three-quarter top-down view, each one standing still in a neutral symmetric pose facing the viewer (the game animates them), whole body visible, no motion lines, no ground shadow, looking hungry with sparkling eyes and a little drool, mischievous but cute, not scary, thick dark-brown outline, cel shading, saturated colors.
1) small orange crab  2) pale-blue jellyfish  3) blue flying fish with wing fins  4) yellow pufferfish with tiny spikes  5) hermit crab in a big spiral shell
6) lavender octopus with an ink drop on its lips  7) white seagull with wings spread wide  8) green sea turtle with a red bandana  9) tough red crab wearing a silver bucket helmet  10) tiny pink shrimp with long whiskers (already in the game)
```

## 2-2. 배불러서 돌아가는 모습 (2번 결과 그림을 같이 올리고)
```
Same ten sea creatures as the attached image, same order, same art style and same sizes. Sprite sheet, 5 columns x 2 rows on a plain pure white background, no text, no watermark. Now each one is happily full: round bulging belly, eyes closed in a big satisfied smile, rosy cheeks, a tiny crumb near the mouth. Standing still, neutral symmetric pose facing the viewer, no motion lines, no ground shadow.
```

## 3. 대식가 보스 4종
```
Same art style as the attached reference image. Sprite sheet, 2 columns x 2 rows, four large boss sea creatures on a plain pure white background, no text, no watermark. Three-quarter top-down view, standing still in a neutral symmetric pose facing the viewer, whole body visible, no motion lines, no ground shadow, very hungry and greedy looking but adorable, not scary, very detailed, thick dark-brown outline.
1) a huge king crab with a small gold crown, holding a fork and knife in its claws
2) a giant purple octopus with a tiny crown, each tentacle holding an empty bowl
3) a big round whale shark with white spots and a wide open hungry mouth
4) a big pirate sea turtle with a black pirate hat and an eye patch, carrying a sack for stolen snacks
```

## 4. 전투 배경 5장 (길은 게임이 그리므로 가운데를 비운다)
한 번에 한 장씩, 마지막 줄의 Scene 만 바꿔서 5번 만든다.
```
Same art style as the attached reference image. Mobile game battlefield background, vertical 9:16, top-down view, soft painterly cel shading, no characters, no path, no road, no text, no watermark.
Layout from top to bottom: the top 15% is shallow sea with gentle foam at the shoreline; the middle 70% is a wide EMPTY flat sand area with only tiny details like shells and pebbles (keep it clean, food stalls and a path will be drawn on top); the bottom 15% is the wooden boardwalk of a seaside night market with red lanterns. Decorations only along the left and right edges.
Scene: sunny golden beach with palm trees and striped parasols at the edges.
```
- 2장: `Scene: grey tidal rock shore with tide pools and mossy rocks at the edges.`
- 3장: `Scene: turquoise coral reef beach with pink corals and starfish at the edges.`
- 4장: `Scene: pirate island at sunset, barrels, a torn sail and a treasure chest at the edges, warm orange light.`
- 5장: `Scene: mystical dragon-palace shore at dusk, glowing red lanterns and pearl shells at the edges, cool blue light.`

## 5. 자리·대문·아이콘 9개
```
Same art style as the attached reference image. Sprite sheet, 3 columns x 3 rows on a plain pure white background, no text, no watermark, bold glossy game art with thick dark-brown outline.
1) an empty round sand build-spot with a small wooden sign  2) a night-market town gate with two red lantern towers and a wooden arch  3) gold coin
4) a white steamed bun with a cute face  5) gold star  6) big ocean wave  7) a whole watermelon  8) green upgrade arrow  9) gift box
```

우선순위: 1 → 2 → 3 → 4 → 5. 이미 만든 "가" 그림(가게 6종)이 있으면 그것부터 보내 주면 된다.
