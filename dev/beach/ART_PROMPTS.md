# 1차 그림 프롬프트 (ChatGPT 용)

**쓰는 법**
1. 저장소의 `dev/beach/art/tuantuan.webp` (퇀퇀 기본 그림)을 **참고 이미지로 같이 올리고** "이 그림과 같은 그림체로" 라고 말한 뒤 아래 프롬프트를 붙인다.
2. 캐릭터·적은 한 장에 하나, 정사각형 1:1, 순백색 배경, 몸 전체, 글자 없음. 배경은 세로 9:16.
3. 파일 이름은 표의 이름으로 보내 주면 바로 넣는다 (예: `en_crab.png`).
4. 다른 게임·애니메이션·작가 이름은 넣지 않는다.

**공통 문구 (모든 캐릭터·적 프롬프트 맨 앞에 그대로)**
```
Cute chubby 2.5D game character art for a mobile game, soft rounded shapes like a squishy toy, gentle cel shading with soft gradients and a glossy highlight, thick warm dark-brown outline, rosy pink blush cheeks, small shiny black dot eyes with a white sparkle, tiny happy mouth, warm pastel palette (cream, peach, soft mint, sky blue) with chili-red accents, friendly and safe for young children, single subject centered, full body, isolated on a plain pure white background, no ground shadow, no text, no watermark, high detail, clean edges
```

## 적 (위에서 아래로 내려오므로 모두 정면을 보고 아래를 향해 걸어오는 모습)
| 파일 | 대상 설명 (공통 문구 뒤에 붙임) |
|---|---|
| en_crab | Subject: a baby crab sea-monster, round coral-orange body, two small raised claws, six tiny legs, mischievous grin, seen from the front slightly from above, cute not scary |
| en_jelly | Subject: a tiny jellyfish, translucent pale-blue dome with a soft inner glow, four short wavy tentacles, sleepy happy face, floating, cute not scary |
| en_puffer | Subject: a small yellow pufferfish, round body with tiny soft spikes, puffed cheeks, surprised round mouth, seen from the front, cute not scary |
| en_puffer_big | Subject: the same yellow pufferfish as the reference but fully inflated like a balloon, spikes sticking out, cheeks very full, holding its breath, cute not scary |
| en_fish | Subject: a small blue flying fish leaping forward toward the viewer, wide wing-like fins spread, sparkling water drops, cheeky smile, cute not scary |
| en_hermit | Subject: a hermit crab peeking out of a big spiral sand-colored seashell, small coral-red body and tiny claws, shy stubborn face, seen from the front, cute not scary |
| en_octo | Subject: a small lavender octopus, round head, short curly legs, puckered mouth ready to squirt ink, a tiny ink drop on its lips, cute not scary |
| en_gull | Subject: a chubby white seagull flying toward the viewer with wings spread wide, orange beak, cheeky determined eyebrows, seen from the front slightly from above, cute not scary |
| en_elite | Subject: a sturdy crab sea-monster wearing a silver bucket as a helmet, darker red shell, bigger claws, determined eyebrows, seen from the front, cute not scary |

## 보스 (크게 쓰므로 더 꼼꼼하게)
| 파일 | 대상 설명 |
|---|---|
| boss_kingcrab | Subject: a huge round king crab boss, bright red-orange shell, a small gold crown, two giant claws raised, grumpy but adorable face, seen from the front, cute not scary |
| boss_octo | Subject: a giant purple octopus boss, big round head with a tiny gold crown, eight thick curly tentacles spread wide, mischievous grin, seen from the front, cute not scary |
| boss_whale | Subject: a big round whale shark boss, blue back with white spots, white belly, tiny eyes far apart, wide gentle grumpy mouth, a small water spout on top, seen from the front, cute not scary |

## 지도 조각 (타워 디펜스는 길을 코드로 그리므로, 통짜 배경 대신 조각을 받는다)
모두 위에서 비스듬히 내려다본 모습, 한 장에 하나, 순백색 배경, 그림자 없음.
| 파일 | 대상 설명 (공통 문구의 character 를 game prop 으로 바꿔 앞에 붙임) |
|---|---|
| base_1 ~ base_4 | Subject: a round sandcastle turret platform seen from a three-quarter top view, empty flat top for a character to stand on. Make four versions that grow: (1) a low simple sand mound ring, (2) taller with small crenellations, (3) two tiers with a small red flag, (4) grand with golden trim, shells and two flags |
| gate | Subject: a cute sandcastle town gate seen from the front, two round towers with red flags, wooden arched door in the middle, seashell decorations |
| deco_palm, deco_parasol, deco_rock, deco_coral, deco_barrel, deco_lantern | Subject: a single beach decoration seen from a three-quarter top view: (1) a small palm tree, (2) a red-and-white striped beach parasol with a towel, (3) a smooth grey rock with a little moss, (4) a pink coral cluster, (5) a wooden barrel, (6) a red paper lantern on a short post. Make one image per item |
| tex_sand, tex_sea | Subject: a seamless tileable texture, flat top view, no objects: (1) warm fine beach sand with tiny shells, (2) shallow turquoise sea water with soft light ripples |

## 영웅 포즈 (각 영웅의 기본 그림을 참고 이미지로 올리고)
| 파일 | 대상 설명 |
|---|---|
| tt_atk | Subject: the same steamed-bun character as the reference, throwing a hot steamed bun forward with one arm, leaning forward, cheerful shout |
| didi_atk | Subject: the same water-drop character as the reference, flicking water droplets forward with both hands, playful grin |
| peng_atk | Subject: the same firework kid as the reference, launching a small firework rocket upward from a tube, sparks, excited face |
| shan_atk | Subject: the same lantern spirit as the reference, glowing brightly and shooting a warm beam of light upward, eyes closed with effort |
| dun_atk | Subject: the same baby panda as the reference, swinging the ping-pong paddle in a strong smash, headband flying |
| zhuo_atk | Subject: the same sparrow mail carrier as the reference, tossing an envelope forward from the red mail bag, wings spread |

우선순위: 적 9종 → 보스 3종 → 타워 받침 4단계와 대문 → 꾸밈 조각 → 영웅 포즈. 적 한두 장만 먼저 보내 주면 그림체부터 같이 확인한다.
