cd "$(dirname "$0")" && node ../tools/gen_data.js && python3 - <<'P'
s=open('game_src.html',encoding='utf8').read()
ink=open('ink1.js',encoding='utf8').read()+'\n'+open('ink2.js',encoding='utf8').read()+'\n'+open('ink3.js',encoding='utf8').read()+'\n'+open('ink4.js',encoding='utf8').read()
assert '/*@@INK@@*/' in s
open('spliced.html','w',encoding='utf8').write(s.replace('/*@@INK@@*/',ink))
P
python3 build_dbg.py
python3 $(dirname "$0")/minify.py $(dirname "$0")/spliced.html $(dirname "$0")/min.html
