import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createMon,makeBattle,takeTurn,settleBattle,battleExperience,checkpointGame,saveEnvelope,readEnvelope,clone} from '../dist/js/engine.js';
import {campaignBudget} from '../scripts/campaign-budget.mjs';

test('fixed campaign experience keeps leaders near authored boss levels and bench useful',()=>{
 const rows=campaignBudget();
 for(const row of rows){assert.ok(Math.abs(row.beforeBoss[0]-row.boss)<=3,JSON.stringify(row));assert.ok(row.beforeBoss[0]-row.beforeBoss[1]<=4);}
 const optional=campaignBudget({outdoor:true,wildPerChapter:8});
 assert.ok(optional.at(-1).afterBoss[0]<62,'optional exploration should not reach the cap before the ending');
});
test('level-relative XP helps new companions catch up and decreases for trivial encounters',()=>{
 const enemy=[createMon('embercat_2',20)],low=createMon('budfox',10),matched=createMon('budfox_2',20),high=createMon('budfox_3',40);
 assert.ok(battleExperience(low,enemy)>battleExperience(matched,enemy));assert.ok(battleExperience(high,enemy)<battleExperience(matched,enemy)/2);
 assert.ok(battleExperience(matched,enemy,false)>=battleExperience(matched,enemy)*.8);
});
test('all participating companions get full XP, including the previous active member',()=>{
 const g=createGame();g.party=[createMon('budfox',5),createMon('tidefin',5),createMon('pebble',5)];
 const initial=makeBattle(g,[createMon('embercat',5)]),switched=takeTurn(initial,{type:'switch',index:1});
 assert.deepEqual(switched.participants,g.party.slice(0,2).map(m=>m.uid));assert.deepEqual(initial.participants,[g.party[0].uid]);
 switched.outcome='win';const result=settleBattle(g,switched).game;
 assert.equal(result.party[0].xp,result.party[1].xp);assert.ok(result.party[2].xp<result.party[0].xp);
});
test('participation resumes safely, old battles migrate and forged members are rejected',()=>{
 const g=createGame();g.party.push(createMon('tidefin',5));const b=takeTurn(makeBattle(g,[createMon('embercat',5)]),{type:'switch',index:1});
 const resume=readEnvelope(saveEnvelope(checkpointGame(g,b)));assert.deepEqual(resume.suspendedBattle.participants,b.participants);
 const legacy=clone(b);delete legacy.participants;assert.deepEqual(readEnvelope(saveEnvelope(checkpointGame(g,legacy))).suspendedBattle.participants,[b.party[1].uid]);
 for(const participants of [[],[b.enemies[0].uid],[b.party[0].uid,b.party[0].uid]]){const bad={...b,participants};assert.throws(()=>readEnvelope(saveEnvelope(checkpointGame(g,bad))));}
});
