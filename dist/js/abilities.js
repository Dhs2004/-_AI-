import {SPECIES} from './data.js';

export const ABILITIES={
 frostotter:{name:'霜绒',icon:'❄',desc:'受到潮属性或霜属性攻击时，伤害降低 20%。'},
 kitesquid:{name:'轻帆',icon:'↟',desc:'使用具有优先行动效果的攻击招式时，伤害提高 18%。'},
 glassbeetle:{name:'折光',icon:'◇',desc:'受到辉属性或雷属性攻击时，伤害降低 20%。'},
 clockmouse:{name:'续拍',icon:'◷',desc:'采取守势时，额外恢复 1 点能量，总共恢复 3 点。'},
 budfox:{name:'回芽',icon:'❧',desc:'每场战斗首次受到攻击后，若生命降至一半以下且仍能战斗，恢复最大生命的 12%。'},
 embercat:{name:'余烬',icon:'♨',desc:'使用焰属性技能攻击灼伤的对手时，伤害提高 20%。'},
 tidefin:{name:'潮衣',icon:'≈',desc:'每次入场时获得护盾，降低当前回合受到的伤害。'},
 mossdeer:{name:'苔息',icon:'❦',desc:'采取守势时，额外恢复最大生命的 8%。'},
 sparrow:{name:'先声',icon:'↟',desc:'每次入场后的第一次攻击，行动优先度提高 1。'},
 pebble:{name:'整岩',icon:'⬡',desc:'生命全满时，受到的攻击伤害降低 25%。'},
 voltkit:{name:'蓄电',icon:'ϟ',desc:'使用跃击时恢复 2 点能量，而非通常的 1 点。'},
 frostowl:{name:'雪幕',icon:'❄',desc:'在飞雪天气中，受到的攻击伤害降低 15%。'},
 duskmoth:{name:'梦痕',icon:'☾',desc:'攻击处于异常状态的对手时，伤害提高 20%。'},
 glowbud:{name:'暖灯',icon:'✧',desc:'自身恢复类技能的治疗量提高 20%，不影响药品。'},
 cinder:{name:'炉心',icon:'◉',desc:'不会被新施加的灼伤影响。'},
 dewslime:{name:'净影',icon:'◇',desc:'每场战斗可以抵消一次新施加的异常状态。'},
 nightwolf:{name:'追月',icon:'◒',desc:'攻击生命不超过三分之一的对手时，伤害提高 25%。'},
 stonegolem:{name:'古垣',icon:'▥',desc:'自身护盾将攻击伤害降低 60%，而非通常的 45%。'},
 skydrake:{name:'启航',icon:'↗',desc:'每场战斗首次入场时蓄势，下一次攻击伤害提高 45%。'},
 sunserpent:{name:'星循',icon:'✦',desc:'每使用三次消耗能量的攻击技能，恢复 1 点能量。'}
};
export const abilityFor=mon=>ABILITIES[SPECIES[mon.species]?.family];
const family=mon=>SPECIES[mon.species].family;
export const freshTraitState=()=>({firstAid:false,veilUsed:false,swift:false,awakened:false,cycle:0});
function state(mon){return mon.battleTrait??=(freshTraitState());}
function announce(b,mon,message){b.log.push(`${SPECIES[mon.species].name} · ${abilityFor(mon).name}：${message}`);}
function heal(b,mon,maxHP,fraction){
 const amount=Math.min(maxHP-mon.hp,Math.max(1,Math.floor(maxHP*fraction)));
 if(!amount||mon.hp<=0)return;
 mon.hp+=amount;announce(b,mon,`恢复了 ${amount} 点生命。`);
 b.events?.push({kind:'heal',source:mon.uid,target:mon.uid,element:SPECIES[mon.species].element,amount,trait:true});
}
export function enterTrait(b,mon){
 const trait=state(mon),id=family(mon);
 if(id==='tidefin'){mon.shield=Math.max(mon.shield||0,1);announce(b,mon,'水流织成了入场护盾。');}
 if(id==='sparrow')trait.swift=true;
 if(id==='skydrake'&&!trait.awakened){trait.awakened=true;mon.focus=Math.max(mon.focus||0,1);announce(b,mon,'蓄好了下一击的风。');}
}
export function guardTrait(b,mon,maxHP){if(family(mon)==='mossdeer')heal(b,mon,maxHP,.08);if(family(mon)==='clockmouse'){const before=mon.energy;mon.energy=Math.min(5,mon.energy+1);if(mon.energy>before)announce(b,mon,'稳住节拍，额外回复 1 点能量。');}}
export function damagedTrait(b,mon,maxHP){
 if(family(mon)==='budfox'&&mon.hp>0&&mon.hp<=maxHP*.5&&!state(mon).firstAid){state(mon).firstAid=true;heal(b,mon,maxHP,.12);}
}
export function acceptStatus(b,mon,status){
 if(family(mon)==='cinder'&&status==='burn'){announce(b,mon,'炉火容纳了这次灼伤。');return false;}
 if(family(mon)==='dewslime'&&!state(mon).veilUsed){state(mon).veilUsed=true;announce(b,mon,'净影抵消了这次异常。');return false;}
 return true;
}
export function outgoingTrait(mon,target,move,maxTargetHP){
 const id=family(mon);
 if(id==='kitesquid'&&move.priority>0)return 1.18;
 if(id==='embercat'&&move.element==='ember'&&target.status==='burn')return 1.2;
 if(id==='duskmoth'&&target.status)return 1.2;
 if(id==='nightwolf'&&target.hp<=maxTargetHP/3)return 1.25;
 return 1;
}
export function incomingTrait(mon,weather,maxHP,move=null){const id=family(mon);let result=1;if(id==='pebble'&&mon.hp===maxHP)result*=.75;if(id==='frostowl'&&weather==='snow')result*=.85;if(id==='frostotter'&&['tide','frost'].includes(move?.element))result*=.8;if(id==='glassbeetle'&&['light','volt'].includes(move?.element))result*=.8;return result;}
export const shieldFactor=mon=>mon.shield?(family(mon)==='stonegolem'?.4:.55):1;
export const recoveryFactor=mon=>family(mon)==='glowbud'?1.2:1;
export const basicRecovery=mon=>family(mon)==='voltkit'?2:1;
export const traitPriority=(mon,move)=>family(mon)==='sparrow'&&mon.battleTrait?.swift&&move.power?1:0;
export function attackedTrait(b,mon,move){
 state(mon).swift=false;
 if(family(mon)==='sunserpent'&&move.cost>0){
  state(mon).cycle=(state(mon).cycle+1)%3;
  if(!state(mon).cycle){mon.energy=Math.min(5,mon.energy+1);announce(b,mon,'三道星光交汇，回复 1 点能量。');}
 }
}
export function validateTraitState(input){
 if(input===undefined)return;
 if(!input||typeof input!=='object'||Array.isArray(input)||!['firstAid','veilUsed','swift','awakened'].every(k=>typeof input[k]==='boolean')||!Number.isInteger(input.cycle)||input.cycle<0||input.cycle>2)throw new Error('存档中的潮灵特性状态损坏。');
}
