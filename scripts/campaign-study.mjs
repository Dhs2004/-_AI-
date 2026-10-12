import {ADVANCED_MOVES} from '../dist/js/technique-data.js';
import {fileURLToPath} from 'node:url';
import {CHAPTERS,ITEMS,MOVES,SPECIES} from '../dist/js/data.js';
import {EXPEDITIONS} from '../dist/js/expedition-stories.js';
import {SIDE_STORIES} from '../dist/js/stories.js';
import {createGame,createMon,makeBattle,takeTurn,settleBattle,stats,moveList,estimateDamage,random,healParty,completeStory,saveEnvelope,readEnvelope,checkpointGame} from '../dist/js/engine.js';
import {makeMap} from '../dist/js/world.js';
import {turnRune,runeValue} from '../dist/js/dungeon-engine.js';
import {advanceExpedition,EXPEDITION_SITES} from '../dist/js/expedition-engine.js';
import {outdoorSite} from '../dist/js/outdoor-engine.js';
import {expeditionTeam,dungeonTeam,outdoorTrainerTeam,wardenTeam} from '../dist/js/encounters.js';
import {purchaseItem,purchaseQuote,craftItem,craftQuote} from '../dist/js/economy.js';
import {studyAction} from './combat-study.mjs';

const preferences=['budfox','duskmoth','sunserpent','stonegolem','tidefin','embercat','glowbud','voltkit','dewslime','pebble','sparrow'];
const evolved=(family,level)=>family+(level>=32?'_3':level>=16?'_2':'');
/** Ordered economic replay, not a browser/human playthrough. All party members,
 * XP, items and currency carry forward. Scheduled wild encounters replace travel
 * RNG; movement time and puzzle discovery are deliberately not simulated. */
export function runCampaign({seed=100,trainers=true,loot=true,sideStories=true,maxRetries=3,maxTurns=360,adaptive=true,trace=false}={}){
 let game=createGame('旅程研究');game.seed=seed;const original=game.party[0].uid;
 const records=[],chapters=[],usage={purchased:0,crafted:0,items:0,clinicRetreats:0,captures:0,advancedEnemyCasts:{}};let blockedBattle=null;
 const remember=()=>{game.pendingScenes=[];game.suspendedBattle=null;game=readEnvelope(saveEnvelope(game));};
 const rest=()=>healParty(game);
 function chooseParty(){
  const all=[...game.party,...game.reserve],selected=[];
  for(const family of preferences){
   if(selected.length===6)break;
   const mon=all.filter(m=>SPECIES[m.species].family===family).sort((a,b)=>a.uid===original?-1:b.uid===original?1:b.level-a.level)[0];
   if(mon&&!selected.some(m=>SPECIES[m.species].element===SPECIES[mon.species].element))selected.push(mon);
  }
  game.party=selected;game.reserve=all.filter(m=>!selected.some(p=>p.uid===m.uid));
 }
 function collect(map){
  if(!loot)return;
  for(const o of map.objects){
   if(game.collected[o.id]||!['chest','resource'].includes(o.action))continue;
   const contents=o.action==='chest'?o.loot:{[o.item]:1+Math.floor(random(game)*2)};
   for(const [id,count] of Object.entries(contents))game.bag[id]=(game.bag[id]||0)+count;
   game.collected[o.id]=true;
  }
 }
 function story(place){
  if(!sideStories)return;
  for(const s of SIDE_STORIES.filter(s=>s.region===game.region&&s.place===place))if(game.stories?.[s.id]===undefined)game=completeStory(game,s.id,0).game;
 }
 function supply(){
  // Crafts and purchases consume carried resources; no free stock is injected.
  for(const [id,target] of [['superpotion',6],['revive',2],['greatorb',5]]){
   const count=Math.min(Math.max(0,target-(game.bag[id]||0)),craftQuote(game,id).max);
   if(count){game=craftItem(game,id,count);usage.crafted+=count;}
  }
  for(const [id,target] of [['orb',8],['cure',3],['superpotion',4],['revive',2]]){
   const count=Math.min(Math.max(0,target-(game.bag[id]||0)),purchaseQuote(game,id).max);
   if(count){game=purchaseItem(game,id,count);usage.purchased+=count;}
  }
  for(const mon of game.party)if(!mon.equip&&purchaseQuote(game,'shellCharm').ok){game=purchaseItem(game,'shellCharm');game.bag.shellCharm--;game.party.find(m=>m.uid===mon.uid).equip='shellCharm';usage.purchased++;}
 }
 function fieldCare(){
  for(const mon of game.party){
   if(mon.hp<=0&&game.bag.revive){game.bag.revive--;mon.hp=Math.ceil(stats(mon).hp*.5);mon.status=null;usage.items++;}
   for(const item of ['superpotion','potion'])while(mon.hp>0&&mon.hp<stats(mon).hp*.7&&game.bag[item]>0){mon.hp=Math.min(stats(mon).hp,mon.hp+ITEMS[item].heal);game.bag[item]--;usage.items++;}
   if(mon.status&&game.bag.cure){mon.status=null;game.bag.cure--;usage.items++;}
  }
  if(!game.party.some(m=>m.hp>0)){usage.clinicRetreats++;rest();}
 }
 function captureAction(b,lastSwitch){
  const p=b.party[b.activeP],e=b.enemies[b.activeE],normal=studyAction(b,{adaptive:true,lastSwitch});
  if(normal.type==='item'||normal.type==='move'&&MOVES[normal.move].heal&&p.hp<stats(p).hp*.4)return normal;
  const attacks=moveList(p).filter(k=>MOVES[k].power&&MOVES[k].cost<=p.energy).map(move=>({move,damage:estimateDamage(p,e,move,b.weather)})).filter(m=>m.damage*1.5<e.hp).sort((a,c)=>c.damage-a.damage);
  const item=b.inventory.greatorb?'greatorb':b.inventory.orb?'orb':null;
  if(item&&(e.hp<stats(e).hp*.5||!attacks.length))return {type:'capture',item};
  return attacks.length?{type:'move',move:attacks[0].move}:normal;
 }
 function battle(team,context,{capture=false,retries=maxRetries}={}){
  for(let attempt=0;attempt<retries;attempt++){
   fieldCare();let b=makeBattle(game,team,context),lastSwitch=-5;const initialItems=Object.values(b.inventory).reduce((n,x)=>n+x,0),history=[];
   for(let n=0;n<maxTurns&&!b.outcome;n++){
    const action=capture?captureAction(b,lastSwitch):studyAction(b,{adaptive,lastSwitch});if(action.type==='switch')lastSwitch=b.turn;
    if(trace)history.push({turn:b.turn,player:b.party[b.activeP].species,hp:b.party[b.activeP].hp,energy:b.party[b.activeP].energy,status:b.party[b.activeP].status,enemy:b.enemies[b.activeE].species,enemyHP:b.enemies[b.activeE].hp,enemyEnergy:b.enemies[b.activeE].energy,enemyStatus:b.enemies[b.activeE].status,plan:b.enemyPlan?.action,action});
    const planned=b.enemyPlan?.action,actor=b.enemies[b.activeE].uid;
    b=takeTurn(b,action);if(b.error)throw new Error(b.error);
    if(planned?.type==='move'&&ADVANCED_MOVES[planned.move]&&b.events.some(e=>e.source===actor&&e.move===planned.move))usage.advancedEnemyCasts[planned.move]=(usage.advancedEnemyCasts[planned.move]||0)+1;
    if(!b.outcome&&n%7===0)b=readEnvelope(saveEnvelope(checkpointGame(game,b))).suspendedBattle;
   }
   records.push({region:game.region,kind:context.kind,name:context.name||SPECIES[team[0].species].name,attempt:attempt+1,outcome:b.outcome||'turn-limit',turns:b.turn});
   usage.items+=initialItems-Object.values(b.inventory).reduce((n,x)=>n+x,0);
   if(!b.outcome){blockedBattle={battle:b,...trace?{history}:{}};return false;}
   game=settleBattle(game,b).game;remember();if(b.outcome==='capture'){usage.captures++;chooseParty();}
   if(b.outcome==='win'||b.outcome==='capture')return true;
   if(b.outcome==='lose'){usage.clinicRetreats++;game.place=context.kind==='wild'?'route':'dungeon';}
  }
  return false;
 }
 let blocked=null;
 for(let region=0;region<8&&!blocked;region++){
  if(region>0&&!game.badges.includes(region-1))throw new Error('Attempted locked island');
  game.region=region;game.place='town';game.routeSector=0;game.dungeonFloor=0;game.x=18;game.y=19;game.flags['entered'+region]=true;rest();collect(makeMap(region,'town'));story('town');
  // Outdoor caches and materials are collected once. The replay assumes their
  // discovery; it does not use their count to infer gameplay duration.
  for(let sector=0;sector<3;sector++)collect(makeMap(region,'route',0,sector));story('route');supply();
  game.place='route';
  for(let n=0;n<8;n++){
   const family=CHAPTERS[region].wild[n%CHAPTERS[region].wild.length],level=CHAPTERS[region].level+Math.floor(random(game)*4),have=[...game.party,...game.reserve].some(m=>SPECIES[m.species].family===family);
   const desired=preferences.includes(family)&&!have;rest();battle([createMon(evolved(family,level),level,game.seed)],{kind:'wild'},{capture:desired,retries:1});if(blockedBattle){blocked='wild:'+region+':'+n;break;}
  }
  if(blocked)break;
  rest();supply();
  for(const expedition of EXPEDITIONS.filter(e=>e.region===region)){
   for(const stage of expedition.stages){
    game.place=EXPEDITION_SITES[stage.site].place;game.routeSector=outdoorSite(region,stage.site)?.sector||0;
    if(stage.kind==='battle'){
     // Free clinic/camp recovery between outdoor tasks; travel cost is excluded.
     rest();if(!battle(expeditionTeam(region,stage),{kind:'trainer',name:stage.title,expedition:expedition.id,stage:stage.id})){blocked=expedition.id+'/'+stage.id;break;}
    }else{
     if(stage.kind==='delivery'&&(game.bag[stage.item]||0)<stage.amount){const needed=stage.amount-(game.bag[stage.item]||0);if(purchaseQuote(game,stage.item,needed).ok){game=purchaseItem(game,stage.item,needed);usage.purchased+=needed;}else{blocked='delivery:'+stage.id;break;}}
     game=advanceExpedition(game,expedition.id,stage.id,{choice:0,sequence:stage.answer}).game;remember();
    }
   }
   if(blocked)break;
  }
  if(blocked)break;
  if(trainers)for(let i=0;i<2;i++){rest();const o=makeMap(region,'route',0,i===0?0:1).objects.find(o=>o.action==='trainer'&&o.trainer===i);battle(outdoorTrainerTeam(region,i),{kind:'trainer',name:'巡岛切磋',trainer:o?.id});if(blockedBattle){blocked='outdoor:'+region+':'+i;break;}}
  if(blocked)break;
  supply();rest();game.place='dungeon';const begin=records.length;
  for(let depth=0;depth<4;depth++){
   game.dungeonFloor=depth;const map=makeMap(region,'dungeon',depth);game.x=map.entry.x;game.y=map.entry.y;
   const gates=map.objects.filter(o=>o.action==='seal');for(const gate of gates)for(const requirement of gate.requires){const rune=map.objects.find(o=>o.id===requirement.rune);while(runeValue(game,rune)!==requirement.value)game=turnRune(game,rune,gates).game;}
   collect(map);if(depth===0)story('dungeon');if(map.objects.some(o=>o.action==='heal'))rest();
   if(trainers)for(const trainer of map.objects.filter(o=>o.action==='dungeon-trainer'))if(!battle(dungeonTeam(region,depth,trainer),{kind:'trainer',name:trainer.label,trainer:trainer.id})){blocked=trainer.id;break;}
   if(blocked)break;
  }
  if(blocked)break;
  const beforeBoss=game.party.map(m=>m.level);rest();
  if(!battle(wardenTeam(region),{kind:'boss',name:CHAPTERS[region].warden})){blocked='boss:'+region;break;}
  chapters.push({chapter:region+1,levels:beforeBoss.join('/'),gold:game.gold,party:game.party.map(m=>SPECIES[m.species].family).join('/'),dungeonBattles:records.length-begin,items:usage.items,losses:records.filter(r=>r.outcome==='lose').length});remember();
 }
 return {seed,conditions:{trainers,loot,sideStories,maxRetries,maxTurns,adaptive},ending:game.ending,blocked,chapters,usage,battles:records.length,turns:records.reduce((n,r)=>n+r.turns,0),turnLimited:records.filter(r=>r.outcome==='turn-limit').length,records,game,...blockedBattle?{blockedBattle}:{}};
}

export const CAMPAIGN_CASES=[{name:'explorer'},{name:'skip-trainers',trainers:false},{name:'no-field-loot',loot:false},{name:'no-optional-stories',sideStories:false}];
export function campaignStudy(seeds=[100,8019,15938,23857,31776,39695]){
 const rows=[];
 for(const options of CAMPAIGN_CASES)for(const seed of seeds){const result=runCampaign({...options,seed}),{game,records,blockedBattle,...rest}=result;rows.push({case:options.name,...rest,longestBattle:records.reduce((a,b)=>a.turns>b.turns?a:b),finalGold:game.gold,finalEquipment:game.party.map(m=>m.equip)});}
 return {description:"Ordered actual-engine economic replay. Not a browser/human playthrough or duration validation.",assumptions:["Starts with one level-5 budfox and createGame inventory. Party, XP, currency and stock carry forward.", "Eight scheduled wild encounters per island, two from each local family; real capture probabilities and battle outcomes.", "Assumes outdoor caches and optional stories are discovered; first story branches chosen. Optional relic instruments added in 0.6 are NOT solved or rewarded by this replay.", "Free clinic/camp recovery between outdoor fights; dungeon damage carries through inventory, defeat retreats or final-floor spring.", "Known rune/sequence puzzle answers supplied. No walking, random encounter frequency, puzzle discovery or human strategy timing simulated.", "180-turn diagnostic caps in earlier work were not proof of a deadlock. Current cap360; failures are reported, never assigned wins."],seeds,rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--matrix'))console.log(JSON.stringify(campaignStudy(),null,2));else{
 const result=runCampaign();console.log('Ordered campaign economy replay: no movement/puzzle discovery or human playtime simulation. Outdoor clinic/camp recovery; dungeon carries damage until items, defeat retreat or final-floor spring. All encounters use real engine outcomes; caches/optional stories assumed discovered, wild encounters scheduled.');
 console.table(result.chapters);const {game,records,chapters,blockedBattle,...summary}=result;console.log(summary);if(result.blocked)console.log(records.slice(-8));
}
}
