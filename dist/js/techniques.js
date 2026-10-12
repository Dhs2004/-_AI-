import {SPECIES} from './data.js';

export const techniqueDamage=(move,target)=>move.consumeStatus?.includes(target.status)?1.4:1;
export const techniqueSpeed=mon=>mon.haste>0?1.4:1;
export function leaveTechniques(mon){mon.regen=0;mon.haste=0;}
export function battleState(mon){return {uid:mon.uid,energy:mon.energy,status:mon.status||null,statusTurns:mon.statusTurns||0,shield:mon.shield||0,focus:mon.focus||0,regen:mon.regen||0,haste:mon.haste||0};}
export function recordBattleState(event,...monsters){event.changes=monsters.map(battleState);}
export function applyTechniques(b,actor,target,move,event){
 const name=SPECIES[actor.species].name,other=SPECIES[target.species].name;
 const changed=[actor,target];
 if(move.dispel){const active=target.focus||target.regen||target.haste;target.focus=0;target.regen=0;target.haste=0;if(active)b.log.push(`${other} 的蓄势与持续增益被空白回音带走了。`);}
 if(move.consumeStatus?.includes(target.status)){target.status=null;target.statusTurns=0;b.log.push(`${other} 的异常化作了这一击的残响，随后散去。`);}
 if(move.sapEnergy&&target.hp>0){const amount=Math.min(move.sapEnergy,target.energy);target.energy-=amount;const gain=Math.min(amount,5-actor.energy);actor.energy+=gain;b.log.push(`${name} 抽取了 ${amount} 点能量，自身回复 ${gain} 点。`);}
 if(move.regen){actor.regen=move.regen;b.log.push(`${name} 身边萌起新芽，将在回合末持续恢复。`);}
 if(move.haste){actor.haste=move.haste+1;b.log.push(`${name} 顺着风加快了脚步，接下来 ${move.haste} 回合速度提高。`);}
 if(move.teamCleanse){const team=b.party.includes(actor)?b.party:b.enemies;let count=0;for(const mon of team){if(mon.status)count++;mon.status=null;mon.statusTurns=0;if(!changed.includes(mon))changed.push(mon);}b.log.push(`晨光洗去了同行队伍 ${count} 位伙伴的异常。`);}
 recordBattleState(event,...changed);
}
export function tickTechniques(b,mon,maxHP){
 if(mon.regen>0){
  mon.regen--;
  if(mon.hp>0){const amount=Math.min(maxHP-mon.hp,Math.max(1,Math.floor(maxHP*.08)));mon.hp+=amount;if(amount){const event={kind:'heal',source:mon.uid,target:mon.uid,element:'moss',amount,move:'regrowth'};b.events.push(event);recordBattleState(event,mon);b.log.push(`${SPECIES[mon.species].name} 的春芽恢复了 ${amount} 点生命。`);}}
 }
 if(mon.haste>0)mon.haste--;
}
export function validateTechniques(mon){for(const key of ['regen','haste'])if(mon[key]!==undefined&&(!Number.isInteger(mon[key])||mon[key]<0||mon[key]>3))throw new Error('存档中的进阶战技状态损坏。');}
