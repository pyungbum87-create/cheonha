#!/bin/bash
# 봇 3종으로 범위(기본 전체)를 돌려 한 줄 요약.  bash tools/sum.sh [all|0-9] 
cd "$(dirname "$0")/.."
for s in good mid weak; do echo "$s"; timeout 600 node tools/bot.js ${1:-all} $s | python3 -c "
import sys,json
r=[json.loads(l) for l in sys.stdin]
for a in range(0,len(r),10):print(' '.join(f\"{d['si']+1}:{'W' if d['state']=='win' else 'L'}{d['stars']}\" for d in r[a:a+10]))
print('win',sum(d['state']=='win' for d in r),'/',len(r),'avg stars',round(sum(d['stars'] for d in r)/len(r),2))"; done
