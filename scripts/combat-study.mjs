import {fileURLToPath} from 'node:url';
import {CHAPTERS,ITEMS,MOVES,SPECIES} from '../dist/js/data.js';
import {createGame,createMon,makeBattle,takeTurn,estimateDamage,stats,moveList} from '../dist/js/engine.js';
import {recoveryFactor,traitPriority} from '../dist/js/abilities.js';
import {wardenTeam} from '../dist/js/encounters.js';
import {campaignBudget} from './campaign-budget.mjs';

const evolved=(family,level)=>family+(level>=32?'_3':level>=16?'_2':'');
export function studyParty(region,{roster='journey',equipment=false,exploring=false}={}){
 const available=new Set(['budfox',...CHAPTERS.slice(0,region+1).flatMap(c=>c.wild)]),families=[];
 const priority=roster==='support'?['budfox','duskmoth','sunserpent','stonegolem','tidefin','embercat','glowbud','voltkit','dewslime','pebble','sparrow']:['budfox','tidefin','dewslime','embercat','cinder','voltkit','pebble','nightwolf','glowbud','sparrow','frostowl'];
 // Two attainable rosters with different utility. No inaccessible species or
 // extra levels are assigned; exploring uses the separate optional XP budget.
 for(const family of priority){
  if(!available.has(family)||families.some(f=>SPECIES[f].element===SPECIES[family].element))continue;
  families.push(family);if(families.length===6)break;
 }
 const budget=campaignBudget(exploring?{outdoor:true,wildPerChapter:8}:{} )[region].beforeBoss;
 return families.map((family,i)=>{const level=i?budget[1]:budget[0],mon=createMon(evolved(family,level),level);if(equipment)mon.equip='shellCharm';mon.hp=stats(mon).hp;return mon;});
}
const speed=m=>stats(m).spd*(m.status==='shock'?.55:m.status==='root'?.65:1);
function first(a,move,d,enemyMove){const p=(MOVES[move].priority||0)+traitPriority(a,MOVES[move]),q=(MOVES[enemyMove].priority||0)+traitPriority(d,MOVES[enemyMove]);return p>q||p===q&&speed(a)>=speed(d);}
export function studyAction(b,{adaptive=false,lastSwitch=-5}={}){
 const mon=b.party[b.activeP],planned=b.enemyPlan?.action;
 const foe=planned?.type==='switch'?b.enemies[planned.index]:b.enemies[b.activeE];
 const target=planned?.type==='guard'?{...foe,shield:Math.max(foe.shield||0,2)}:foe;
 const attacks=m=>moveList(m).filter(k=>MOVES[k].power&&MOVES[k].cost<=m.energy).map(move=>{
  const def=planned?.type==='move'&&MOVES[planned.move].shield&&!first(m,move,foe,planned.move)?{...target,shield:3}:target;
  const damage=estimateDamage(m,def,move,b.weather),skill=MOVES[move];
  let score=damage/(1+skill.cost*.55);
  if(damage>=foe.hp)score+=foe.hp*2;
  if(skill.status&&!foe.status&&SPECIES[foe.species].family!=='dewslime')score+=stats(foe).hp*(skill.status==='poison'?.2:skill.status==='sleep'?.1:.04)*skill.chance;
  if(skill.drain)score+=Math.min(stats(m).hp-m.hp,damage*skill.drain)*.75;
  if(skill.cleanse&&m.status)score+=stats(m).hp*.1;
  return {move,damage,score};
 }).sort((a,c)=>adaptive?c.score-a.score:c.damage-a.damage);
 const options=attacks(mon),best=options[0];
 if(!adaptive)return best?{type:'move',move:best.move}:{type:'guard'};
 const incoming=m=>planned?.type==='move'?estimateDamage(foe,m,planned.move,b.weather):0;
 const futureThreat=m=>Math.max(1,...moveList(foe).filter(k=>MOVES[k].power).map(k=>estimateDamage(foe,m,k,b.weather)));
 const threat=incoming(mon),max=stats(mon).hp;
 const finish=options.find(o=>o.damage>=foe.hp&&(planned?.type!=='move'||first(mon,o.move,foe,planned.move)||mon.hp>threat*1.12));
 if(finish&&mon.status!=='sleep')return {type:'move',move:finish.move};
 const healing=moveList(mon).find(k=>MOVES[k].heal&&MOVES[k].cost<=mon.energy);
 if(healing){const amount=max*MOVES[healing].heal*recoveryFactor(mon),safe=planned?.type!=='move'||first(mon,healing,foe,planned.move)||mon.hp>threat*1.12;
  if(mon.hp<max*.62&&max-mon.hp>amount*.8&&amount>threat*1.1&&safe)return {type:'move',move:healing};
 }
 if(mon.status&&b.inventory.cure&&mon.hp>threat*1.2&&(mon.status==='sleep'||['poison','burn'].includes(mon.status)&&mon.statusTurns>=2))return {type:'item',item:'cure'};
 if(mon.hp<max*.42){
  const item=['superpotion','potion'].find(k=>b.inventory[k]&&Math.min(ITEMS[k].heal,max-mon.hp)>Math.max(threat*1.1,max*.16));
  if(item&&mon.hp+ITEMS[item].heal>threat*1.2)return {type:'item',item};
 }
 if(b.turn-lastSwitch>=3){
  const currentValue=(best?.damage||1)/Math.max(15,futureThreat(mon));
  const candidates=b.party.map((m,index)=>({m,index,attack:attacks(m)[0]?.damage||1,threat:incoming(m),future:futureThreat(m)})).filter(c=>c.index!==b.activeP&&c.m.hp>Math.max(c.threat*1.2,stats(c.m).hp*.2));
  candidates.sort((a,c)=>c.attack/Math.max(15,c.future)-a.attack/Math.max(15,a.future));const candidate=candidates[0];
  if(candidate&&(candidate.attack/Math.max(15,candidate.future)>currentValue*1.8||mon.hp<threat*1.1&&candidate.threat<threat*.8))return {type:'switch',index:candidate.index};
 }
 // Preserve focus for a paid strike and use empty-energy turns to recover.
 if(planned?.type==='guard'&&moveList(mon).includes('focus')&&!mon.focus&&mon.energy>=2&&mon.energy<5)return {type:'move',move:'focus'};
 return best?{type:'move',move:best.move}:{type:'guard'};
}
export function runBossStudy(region,seed,{adaptive=false,maxTurns=180,roster='journey',equipment=false,exploring=false,trace=false}={}){
 const g=createGame();g.region=region;g.seed=seed;g.party=studyParty(region,{roster,equipment,exploring});g.bag={potion:3,superpotion:2,revive:0,cure:2,orb:0};
 let b=makeBattle(g,wardenTeam(region),{kind:'boss',name:CHAPTERS[region].warden}),lastSwitch=-5,guards=0,switches=0;const history=[];
 for(let n=0;n<maxTurns&&!b.outcome;n++){
  const action=studyAction(b,{adaptive,lastSwitch});if(action.type==='switch')lastSwitch=b.turn;
  guards+=b.enemyPlan?.action.type==='guard';switches+=b.enemyPlan?.action.type==='switch';
  if(trace)history.push({turn:b.turn,player:b.party[b.activeP].species,hp:b.party[b.activeP].hp,energy:b.party[b.activeP].energy,enemy:b.enemies[b.activeE].species,enemyHP:b.enemies[b.activeE].hp,plan:b.enemyPlan.action,action});
  const next=takeTurn(b,action);if(next.error)throw new Error(next.error);b=next;
 }
 return {region,seed,outcome:b.outcome||'stalled',turns:b.turn,guards,switches,healthy:b.party.filter(m=>m.hp>0).length,potions:5-b.inventory.potion-b.inventory.superpotion,cures:2-b.inventory.cure,...trace?{history}: {}};
}
export const STUDY_CASES=[{name:'attack-only',adaptive:false},{name:'adaptive',adaptive:true},{name:'support + defense gear',adaptive:true,roster:'support',equipment:true},{name:'support + exploration',adaptive:true,roster:'support',equipment:true,exploring:true}];
export function combatStudy(count=30){
 const rows=[];
 for(const options of STUDY_CASES)for(let region=0;region<8;region++){
  const results=Array.from({length:count},(_,i)=>runBossStudy(region,100+i*7919,options));
  rows.push({policy:options.name,chapter:region+1,party:studyParty(region,options).map(m=>m.level).join('/'),wins:results.filter(r=>r.outcome==='win').length,runs:count,stalled:results.filter(r=>r.outcome==='stalled').length,meanTurns:+(results.reduce((n,r)=>n+r.turns,0)/count).toFixed(1),meanGuards:+(results.reduce((n,r)=>n+r.guards,0)/count).toFixed(1),meanItems:+(results.reduce((n,r)=>n+r.potions+r.cures,0)/count).toFixed(1)});
 }
 return rows;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 console.log('Isolated boss study: attainable species, XP-budget levels, fully healed party, 5 healing + 2 cleansing items, no revives. Gear cases assign six purchasable defense charms; their acquisition is not simulated. Exploration case assumes two outdoor trainer + eight wild wins per island. Not a campaign or duration playtest.');
 console.table(combatStudy());
}
