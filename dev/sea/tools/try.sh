#!/bin/bash
# 값 바꿔 보기: bash tools/try.sh HPK HPA BUDK BUDCAP  (표본 판만)
cd "$(dirname "$0")/.."
sed -i "s/^const HPK=.*;   /const HPK=$1,HPA=$2,BUDK=$3,BUDCAP=$4;   /" src/data.js
for s in good mid weak; do echo -n "$s: "; for i in 0 2 4 7 9 12 14 17 19 23 26 29 33 36 39 42 44 47 49; do timeout 60 node tools/bot.js $i $s; done | python3 -c "
import sys,json
r=[json.loads(l) for l in sys.stdin]
print(' '.join(f\"{d['si']+1}:{'W' if d['state']=='win' else 'L'}{d['stars']}\" for d in r),'| win',sum(d['state']=='win' for d in r),'/',len(r))"; done
