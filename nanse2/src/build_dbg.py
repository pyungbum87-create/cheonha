import sys
src=open('spliced.html',encoding='utf8').read()
inj="globalThis.__D = {get G(){return G;}, set G(v){G=v;}, newGame, beginRaise, buildSiege, makeAnim, runAnim, render, city, chooseUnit, playerTactic, duel, save, setUnit, aiUnit, createArmy, person, me, fight, META:()=>META, pxFight, pxDuel, VW, VH, inkBg, figSprite, paFig, paOk, PA_MAN, runMelee, pxAssault, pxWallTop, pxSiege, paTrek, paShip, paUiDraw, figSprite2: figSprite, blitFig, paReady};\n"
marker="} else { renderTitle(); storageGuard(); }"
assert marker in src
open('dbg.html','w',encoding='utf8').write(src.replace(marker, marker+"\n"+inj,1))
