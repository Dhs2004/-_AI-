import {fileURLToPath} from 'node:url';
import {SPECIES} from '../dist/js/data.js';
import {clone,healParty,makeBattle,takeTurn,settleBattle,saveEnvelope,readEnvelope,checkpointGame} from '../dist/js/engine.js';
import {purchaseQuote,purchaseItem,craftQuote,craftItem} from '../dist/js/economy.js';
import {trialEncounter} from '../dist/js/trial-engine.js';
import {trialAt} from '../dist/js/trial-data.js';
import {runCampaign} from './campaign-study.mjs';
import {studyAction} from './combat-study.mjs';

/** Carry an actual campaign result into the postgame without assigning new
 * creatures, levels, currency or supplies. Clinic/waiting camp is free in game.
 * Travel, reading, discovery and human decision time are not simulated. */
export function continueTrials(initial,{maxAttempts=4,maxTurns=360,adaptAfterLoss=false}={}){
 let game=readEnvelope(saveEnvelope(clone(initial)));
 if(!game.ending)throw new Error('A completed campaign is required.');
 const party=()=>game.party.map(m=>({family:SPECIES[m.species].family,level:m.level,xp:m.xp,equip:m.equip}));
 const start={gold:game.gold,bag:{...game.bag},party:party()};
 const purchases=[],crafts=[],records=[];let blocked=null;
 const remember=()=>{game.pendingScenes=[];game.suspendedBattle=null;game=readEnvelope(saveEnvelope(game));};
 const supply=()=>{
  // Town shop visits are assumed between attempts, at published prices.
  for(const [id,target] of [['superpotion',6],['revive',2]]){
   const count=Math.min(Math.max(0,target-(game.bag[id]||0)),craftQuote(game,id).max);
   if(count){game=craftItem(game,id,count);crafts.push({beforeFloor:game.trial+1,id,count});}
  }
  for(const [id,target] of [['cure',4],['superpotion',6],['revive',2]]){
   const count=Math.min(Math.max(0,target-(game.bag[id]||0)),purchaseQuote(game,id).max);
   if(count){const quote=purchaseQuote(game,id,count);game=purchaseItem(game,id,count);purchases.push({beforeFloor:game.trial+1,id,count,cost:quote.total});}
  }
 };
 for(let floor=game.trial+1;floor<=24;floor++){
  let won=false;
  for(let attempt=1;attempt<=maxAttempts;attempt++){
   game.region=7;game.place='town';game.routeSector=0;game.dungeonFloor=0;
   remember();healParty(game);supply();
   const before={gold:game.gold,bag:{...game.bag},party:party()};
   const encounter=trialEncounter(game,floor);let battle=makeBattle(game,encounter.enemies,encounter.context),lastSwitch=-5;
   const adaptive=!adaptAfterLoss||attempt%2===1;
   for(let n=0;n<maxTurns&&!battle.outcome;n++){
    const action=studyAction(battle,{adaptive,lastSwitch});if(action.type==='switch')lastSwitch=battle.turn;
    const next=takeTurn(battle,action);if(next.error)throw new Error(next.error);battle=next;
    if(!battle.outcome&&n%11===0)battle=readEnvelope(saveEnvelope(checkpointGame(game,battle))).suspendedBattle;
   }
   const consumed=Object.fromEntries(Object.entries(before.bag).filter(([id,n])=>n>(battle.inventory[id]||0)).map(([id,n])=>[id,n-(battle.inventory[id]||0)]));
   if(battle.outcome){game=settleBattle(game,battle).game;remember();}
   records.push({floor,title:trialAt(floor).title,attempt,policy:adaptive?'adaptive':'attack-only',outcome:battle.outcome||'turn-limit',turns:battle.turn,before,consumed,after:{gold:game.gold,bag:{...game.bag},party:party()}});
   if(battle.outcome==='win'){won=true;break;}
   if(!battle.outcome){blocked={floor,reason:'turn-limit'};break;}
  }
  if(!won){blocked??={floor,reason:'attempt-limit'};break;}
 }
 return {completed:game.trial===24,trial:game.trial,blocked,start,finish:{gold:game.gold,bag:{...game.bag},party:party()},purchases,crafts,records,game};
}

export function journeyStudy(seeds=[100,8019,15938,23857,31776,39695]){
 const rows=[];
 for(const seed of seeds){
  const campaign=runCampaign({seed});
  const base={seed,campaign:{ending:campaign.ending,blocked:campaign.blocked,battles:campaign.battles,turns:campaign.turns,usage:campaign.usage}};
  if(!campaign.ending){rows.push(base);continue;}
  for(const adaptAfterLoss of [false,true]){
   const {game,records,...result}=continueTrials(campaign.game,{adaptAfterLoss});
   rows.push({...base,policy:adaptAfterLoss?'alternate-after-loss':'adaptive',...result,battles:records.length,turns:records.reduce((n,r)=>n+r.turns,0),losses:records.filter(r=>r.outcome==='lose').length,longestBattle:Math.max(...records.map(r=>r.turns)),records});
  }
 }
 return {assumptions:[
  'Campaign starts from one level-5 budfox and actual initial inventory, carrying actual captures, XP, currency and items.',
  'Inherits campaign-study assumptions: eight scheduled wild encounters per island, all optional trainers/caches/stories, known puzzles, free clinic between outdoor tasks; no relic or bond-story rewards.',
  'Exact finishing campaign party is carried into 24 trials. No new creatures, equipment, experience or money assigned; no repeated low-tier trial farming.',
  'Free candidate camp healing and visits to final-town shop between attempts. Crafting consumes carried materials; medicine purchases consume carried gold at published prices.',
  'Up to four attempts per stage. Comparison policy uses attack-only on even-numbered attempts; neither policy is optimal play.',
  'No walking, reading, discovery, human decision time or duration estimate. Failures and turn limits remain failures.'
 ],rows};
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(journeyStudy(process.argv.includes('--one')?[100]:undefined),null,2));
