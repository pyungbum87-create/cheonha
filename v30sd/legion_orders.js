/* Tactical orders: data-only extensions. Legion calculation functions remain UNMODIFIED. */
(function(root){'use strict';
const C=root.LEGION_CORE;
const cards=[
 {id:'charge',trait:'command_charge',n:{ko:'선봉 돌격',zh:'先锋突击'},d:{ko:'근접 공격력 +12%',zh:'近战攻击+12%'},icon:'⚔',mods:[{side:'ally',who:'melee',stat:'atk',mul:1.12}]},
 {id:'guard',trait:'command_guard',n:{ko:'철벽 방진',zh:'铁壁方阵'},d:{ko:'선봉 받는 피해 -15%',zh:'前锋受伤-15%'},icon:'▣',mods:[{side:'ally',who:'front',stat:'taken',mul:.85}]},
 {id:'strategy',trait:'command_strategy',n:{ko:'책략 집중',zh:'奇谋集策'},d:{ko:'책사 스킬 위력 +22%',zh:'谋士技能威力+22%'},icon:'✦',mods:[{side:'ally',who:'str',stat:'skill',mul:1.22}]},
 {id:'support',trait:'command_support',n:{ko:'후방 지원',zh:'后方支援'},d:{ko:'원거리 기력 충전 +17%',zh:'远程蓄力+17%'},icon:'➶',mods:[{side:'ally',who:'ranged',stat:'gauge',mul:1.17}]}
];
for(const card of cards)C.D.traits[card.trait]={unlock:1e9,n:card.n,d:card.d,mods:card.mods};
root.LEGION_ORDERS=Object.freeze(cards);
})(typeof window!=='undefined'?window:typeof GameGlobal!=='undefined'?GameGlobal:globalThis);
