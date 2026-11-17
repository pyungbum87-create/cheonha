# 난세일생 원본 소스 (압축 전)

- `nanse_full.html` : 압축 전 완성본. 이 파일 하나로 바로 실행됨. 고칠 때는 보통 이것을 보면 된다.
- `game_src.html` : 게임 본체. `/*@@INK@@*/` 자리에 전투 그림 코드가 들어간다.
- `ink1.js` `ink2.js` `ink3.js` : 수묵 전투 화면(배경·인물·효과, 전투·일기토 그리기).
- `rebuild.sh` : game_src.html + ink1~3.js → spliced.html(=nanse_full.html) → dbg.html(시험용) → min.html(배포용 압축본).
- `minify.py` : esbuild로 압축(`ESBUILD` 환경변수로 esbuild 경로 지정). 버전 번호(월일-시분)도 여기서 넣는다.

배포: min.html을 `nanse/index.html`로 복사.
