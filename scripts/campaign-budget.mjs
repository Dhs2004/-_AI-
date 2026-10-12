import {fileURLToPath} from 'node:url';
import {CHAPTERS} from '../dist/js/data.js';
import {DUNGEONS} from '../dist/js/dungeons.js';
import {EXPEDITIONS} from '../dist/js/expedition-stories.js';
import {createMon,gainXP,battleExperience} from '../dist/js/engine.js';
import {expeditionTeam,dungeonTeam,wardenTeam,outdoorTrainerTeam} from '../dist/js/encounters.js';

export function chapterEncounters(region,{outdoor=false}={}){
 const rows=EXPEDITIONS.filter(e=>e.region===region).flatMap(e=>e.stages.filter(s=>s.kind==='battle').map(s=>({name:s.title,kind:'expedition',team:expeditionTeam(region,s)})));
 if(outdoor)for(let n=0;n<2;n++)rows.push({name:'巡岛训练师 '+n,kind:'trainer',team:outdoorTrainerTeam(region,n)});
 for(const [depth,floor] of DUNGEONS[region].floors.entries())for(const trainer of floor.objects.filter(o=>o.kind==='trainer'))rows.push({name:trainer.label,kind:'trainer',team:dungeonTeam(region,depth,trainer)});
 rows.push({name:CHAPTERS[region].warden,kind:'boss',team:wardenTeam(region)});return rows;
}
export function campaignBudget({outdoor=false,wildPerChapter=0,legacy=false}={}){
 const party=[createMon('budfox',5),createMon('tidefin',5)],rows=[];
 for(const chapter of CHAPTERS){
  const encounters=chapterEncounters(chapter.id,{outdoor});
  for(let n=0;n<wildPerChapter;n++)encounters.splice(Math.min(n,encounters.length-1),0,{name:'可选野生缔约',kind:'wild',team:[createMon(chapter.wild[n%chapter.wild.length],chapter.level+2)]});
  let beforeBoss;
  for(const encounter of encounters){
   if(encounter.kind==='boss')beforeBoss=party.map(m=>m.level);
   for(const [i,mon] of party.entries()){
    const oldReward=encounter.team.reduce((sum,m)=>sum+40+m.level*12,0)/Math.sqrt(encounter.team.length)*(i?.55:1);
    gainXP(mon,legacy?Math.floor(oldReward):battleExperience(mon,encounter.team,i===0));
   }
  }
  rows.push({chapter:chapter.id+1,battles:encounters.length,beforeBoss,afterBoss:party.map(m=>m.level),boss:chapter.bossLevel});
 }
 return rows;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 console.log('XP budget only: assumes each listed battle is won once. Not a difficulty or duration playtest.');
 for(const [name,options] of [['Published 0.2 reward formula',{legacy:true}],['Fixed story and dungeon battles',{}],['With outdoor trainers and 8 wild battles per island',{outdoor:true,wildPerChapter:8}]]){
  console.log('\n'+name);console.table(campaignBudget(options).map(r=>({chapter:r.chapter,battles:r.battles,leader:r.beforeBoss[0],bench:r.beforeBoss[1],boss:r.boss,after:r.afterBoss.join('/')})));
 }
}
