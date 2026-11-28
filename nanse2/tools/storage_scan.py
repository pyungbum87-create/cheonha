# 같은 주소(pyungbum87-create.github.io)의 모든 게임 저장 공간 점검: 전체 삭제·훑어 지우기·저장 이름 충돌을 찾는다.
# usage: cd cheonha 저장소 맨 위 && python3 nanse2/tools/storage_scan.py
import re, subprocess, collections, json, os
files = subprocess.run(['git','ls-files'],capture_output=True,text=True).stdout.split('\n')
files = [f for f in files if re.search(r'\.(html|js)$', f) and not f.startswith('dev/') and not f.endswith('sw.js')]
keys = collections.defaultdict(set); risky = []; dyn = collections.defaultdict(list); idb = collections.defaultdict(set)
for f in files:
    try: s = open(f, encoding='utf8', errors='ignore').read()
    except: continue
    if 'localStorage' not in s and 'indexedDB' not in s and 'Storage' not in s: continue
    game = f.split('/')[0] if '/' in f else '(root)'
    for m in re.finditer(r'localStorage\.clear\(\)|sessionStorage\.clear\(\)|clearStorageSync|deleteDatabase', s):
        risky.append((game, f, s[max(0,m.start()-120):m.end()+40].replace('\n',' ')))
    for m in re.finditer(r'Object\.keys\(localStorage\)|localStorage\.key\(|for\s*\(\s*(?:const|let|var)\s+\w+\s+in\s+localStorage|localStorage\.length', s):
        risky.append((game, f, 'SCAN: ' + s[max(0,m.start()-80):m.end()+160].replace('\n',' ')))
    for m in re.finditer(r'(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*([\'"`])([^\'"`]+)\1', s):
        keys[m.group(2)].add(game)
    for m in re.finditer(r'(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*([A-Za-z_$][\w.$]*(?:\s*\+[^,)]*)?)', s):
        dyn[game].append(m.group(1)[:40])
    for m in re.finditer(r'localStorage\[([\'"])([^\'"]+)\1\]', s): keys[m.group(2)].add(game)
    for m in re.finditer(r'indexedDB\.open\(\s*([\'"`])([^\'"`]+)\1', s): idb[m.group(2)].add(game)
print('== 위험(전체 삭제/훑어 지우기) ==')
for g,f,t in risky: print(g, f, '::', t[:330]); print()
print('== 여러 게임이 같이 쓰는 저장 이름 ==')
for k,g in sorted(keys.items()):
    if len(g)>1: print(repr(k), sorted(g))
print('== 게임별 고정 저장 이름 ==')
by = collections.defaultdict(list)
for k,g in keys.items():
    for x in g: by[x].append(k)
for g in sorted(by): print(g, sorted(by[g])[:12], '…' if len(by[g])>12 else '')
print('== 변수로 된 저장 이름(직접 확인 필요) ==')
for g in sorted(dyn): print(g, sorted(set(dyn[g]))[:10])
print('== IndexedDB ==', dict((k, sorted(v)) for k,v in idb.items()))
