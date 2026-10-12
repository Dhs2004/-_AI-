import {TRIAL_CIRCUIT_ID,trialAt} from './trial-data.js';
import {MOVES,SPECIES} from './data.js';
import {recoveryFactor} from './abilities.js';

export const WARDEN_TACTICS=[
 {name:'守灯',desc:'以守势接住第一轮攻势，再寻找反击机会。',guard:1.25,heal:1,status:1,switch:0.8},
 {name:'镜流',desc:'珍惜每一层潮衣，在不利的属性之间寻找退路。',guard:1,heal:1.15,status:1,switch:1.25},
 {name:'锻火',desc:'先留下灼伤，再用余烬扩大伤害。',guard:.8,heal:.85,status:1.3,switch:.85},
 {name:'巡风',desc:'利用先手和轮换，为下一位伙伴争取机会。',guard:.9,heal:.9,status:1,switch:1.3},
 {name:'长夜',desc:'利用雪幕与恢复，保留穿过长夜的力量。',guard:1.2,heal:1.3,status:1,switch:1},
 {name:'织梦',desc:'先施加异常，再追逐留在对手身上的梦痕。',guard:1,heal:1.1,status:1.6,switch:1},
 {name:'永昼',desc:'用不同属性轮换，寻找当前队伍的薄弱处。',guard:1,heal:1,status:1.2,switch:1.5},
 {name:'归星',desc:'让每位伙伴的特性、恢复和入场时机彼此呼应。',guard:1.15,heal:1.2,status:1.2,switch:1.25}
];
const plain={guard:1,heal:1,status:1,switch:1};
export function tacticForBattle(b){return b.context.kind==='boss'?WARDEN_TACTICS[b.context.region]:b.context.kind==='trial'&&b.context.circuit===TRIAL_CIRCUIT_ID?trialAt(b.context.floor)?.tactic:null;}

/** Plans are committed before the player's next choice. This function never
 * receives a player action; it uses only the state visible between turns. */
export function planEnemyAction(b,{damage,stats,moves,random}){
 const actor=b.enemies[b.activeE],target=b.party[b.activeP],style=tacticForBattle(b)||plain;
 const maxHP=stats(actor).hp,missing=maxHP-actor.hp;
 const attacks=(mon,foe)=>moves(mon).filter(k=>MOVES[k].power).map(k=>({key:k,value:damage(mon,foe,k,b.weather),cost:MOVES[k].cost}));
 const available=attacks(actor,target),strongest=Math.max(1,...available.map(m=>m.value));
 const incoming=Math.max(1,...attacks(target,actor).filter(m=>m.cost<=target.energy).map(m=>m.value));
 // Recovery is preparation for the next attack. Reduce its value after two
 // consecutive support turns so healing/shield loops do not replace combat.
 const supportFactor=1/(1+Math.max(0,(b.enemySupportStreak||0)-1)*1.5);
 const choices=[];
 for(const key of moves(actor)){
  const move=MOVES[key];if(move.cost>actor.energy)continue;
  let score=damage(actor,target,key,b.weather);
  if(move.heal)score=Math.min(missing,maxHP*move.heal*recoveryFactor(actor))*style.heal;
  if(move.shield&&!actor.shield)score+=incoming*1.05*style.guard;
  if(move.boost&&!actor.focus)score+=strongest*.45+(actor.energy<3?strongest*.4:0);
  if(move.status&&!target.status)score+=stats(target).hp*(move.status==='poison'?.2:move.status==='sleep'?.16:.1)*move.chance*style.status;
  if(move.cleanse&&actor.status)score+=maxHP*.12;
  if(move.drain)score+=Math.min(missing,score*move.drain)*.8;
  // Finishing a foe is more valuable than restoring health or conserving energy.
  if(move.power&&score>=target.hp)score+=maxHP*.35;
  if(move.cost===0&&actor.energy<3)score+=strongest*.14;
  if(actor.focus&&move.power)score+=strongest*.08;
  if(!move.power)score*=supportFactor;
  choices.push({action:{type:'move',move:key},score:score+random(b)*3});
 }
 const guardGain=Math.min(SPECIES[actor.species].family==='clockmouse'?3:2,5-actor.energy),deer=SPECIES[actor.species].family==='mossdeer';
 let guardScore=(actor.shield?incoming*.1:incoming*.4)*style.guard+guardGain*strongest*.23;
 if(deer)guardScore+=Math.min(missing,maxHP*.08);
 if(b.context.kind==='boss'&&b.context.region===0&&b.turn===0)guardScore+=incoming*.8;
 if(actor.energy===0&&!moves(actor).some(k=>MOVES[k].cost===0))guardScore+=strongest;
 const openingWard=b.context.kind==='boss'&&b.context.region===0&&b.turn===0;
 if(actor.energy<=3||(deer&&missing>maxHP*.35)||openingWard)choices.push({action:{type:'guard'},score:guardScore*supportFactor});
 if(b.context.kind!=='wild'&&b.turn-(b.lastEnemySwitch??-4)>=3){
  for(const [index,candidate] of b.enemies.entries()){
   if(index===b.activeE||candidate.hp<=0)continue;
   const theirDamage=Math.max(1,...attacks(candidate,target).filter(m=>m.cost<=candidate.energy).map(m=>m.value));
   const theirIncoming=Math.max(1,...attacks(target,candidate).filter(m=>m.cost<=target.energy).map(m=>m.value));
   const safeArrival=SPECIES[candidate.species].family==='tidefin'?theirIncoming*.55:theirIncoming;
   if(candidate.hp<=safeArrival||theirIncoming>=incoming&&theirDamage<=strongest)continue;
   const score=(theirDamage*.5+Math.max(0,incoming-theirIncoming)*1.2-safeArrival*.5)*style.switch;
   choices.push({action:{type:'switch',index},score});
  }
 }
 choices.sort((a,c)=>c.score-a.score);
 return {actor:actor.uid,action:choices[0].action};
}
export function describeEnemyPlan(plan,b){
 if(!plan)return null;
 const action=plan.action;
 if(action.type==='guard')return {name:'稳住阵脚',detail:'准备守势 · 回复能量并减轻伤害',element:null,icon:'◇'};
 if(action.type==='switch'){const mon=b.enemies[action.index];return {name:'准备轮换',detail:'将派出 '+SPECIES[mon.species].name,element:SPECIES[mon.species].element,icon:'⇄'};}
 const move=MOVES[action.move];return {name:move.name,detail:move.heal?'准备恢复生命':move.shield?'准备展开护盾':move.boost?'准备蓄势':move.status?'准备攻击 · 可能附加异常':'准备发动攻击',element:move.element,icon:move.heal?'✚':move.power?'↗':'✧'};
}
