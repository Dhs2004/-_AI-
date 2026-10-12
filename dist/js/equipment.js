import {ITEMS} from './data.js';
import {stats} from './engine.js';

export function equipCompanion(game,uid,item=null){
 if(game.suspendedBattle)throw new Error('请在对战结束后调整护符。');
 const side=game.party.some(m=>m.uid===uid)?'party':'reserve',mon=game[side]?.find(m=>m.uid===uid);
 if(!mon)throw new Error('这位伙伴不在队伍或驿站中。');
 if(mon.equip===item)return game;
 if(item!==null&&(!ITEMS[item]?.equip||!(game.bag[item]>0)))throw new Error('背包里没有这枚护符。');
 const bag={...game.bag};if(mon.equip){if((bag[mon.equip]||0)>=9999)throw new Error('背包放不下取回的护符。');bag[mon.equip]=(bag[mon.equip]||0)+1;}
 if(item)bag[item]--;
 const next={...mon,equip:item};
 // Keep the health proportion on BOTH equip and removal; cycling cannot heal.
 next.hp=mon.hp>0?Math.max(1,Math.min(stats(next).hp,Math.floor(mon.hp*stats(next).hp/stats(mon).hp))):0;
 return {...game,bag,[side]:game[side].map(m=>m.uid===uid?next:m)};
}
