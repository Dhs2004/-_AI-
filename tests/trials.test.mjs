import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES,ITEMS,WEATHER} from '../dist/js/data.js';
import {createGame,createMon,healParty,makeBattle,takeTurn,settleBattle,stats,moveList,estimateDamage,checkpointGame,readEnvelope,saveEnvelope} from '../dist/js/engine.js';
import {validateLoadout} from '../dist/js/moves.js';
import {TRIAL_CIRCUIT_ID,TRIAL_CIRCUITS,TRIAL_STAGES,trialAt,trialAfterScene,trialReward} from '../dist/js/trial-data.js';
import {trialEncounter} from '../dist/js/trial-engine.js';
import {tacticForBattle} from '../dist/js/battle-ai.js';
import {trialMarkup} from '../dist/js/trial-view.js';
function ready(floor=1){const g=createGame('远海旅人','voltkit');Object.assign(g,{region:7,place:'town',ending:true,badges:[0,1,2,3,4,5,6,7],trial:floor-1});g.party=['voltkit_3','budfox_3','tidefin_3','cinder_3','sunserpent_3','nightwolf_3'].map(id=>createMon(id,65));return g;}
function start(g,floor){const e=trialEncounter(g,floor);return makeBattle(g,e.enemies,e.context);}
function finishFixture(g,floor){
 // A nearly finished match isolates settlement; full-strength pacing is studied separately.
 g=structuredClone(g);healParty(g);const encounter=trialEncounter(g,floor);encounter.enemies.forEach((m,i)=>m.hp=i?0:1);let b=makeBattle(g,encounter.enemies,encounter.context);
 for(let turn=0;turn<8&&!b.outcome;turn++){const actor=b.party[b.activeP],target=b.enemies[b.activeE],move=moveList(actor).find(k=>estimateDamage(actor,target,k,b.weather)>0);b=takeTurn(b,{type:'move',move});}
 assert.equal(b.outcome,'win');return settleBattle(g,b).game;
}

test('eight authored invitations cover24 legal, distinct duels and complete character arcs',()=>{
 assert.equal(TRIAL_CIRCUITS.length,8);assert.equal(TRIAL_STAGES.length,24);assert.equal(new Set(TRIAL_STAGES.map(s=>s.title)).size,24);assert.equal(new Set(TRIAL_CIRCUITS.map(c=>c.crest)).size,8);
 for(const stage of TRIAL_STAGES){assert.ok(WEATHER[stage.weather]);assert.ok(stage.before.length>=2&&stage.after.length>=2);assert.ok(stage.hint.length>25);for(const [who,line] of [...stage.before,...stage.after])assert.ok(who&&line);const g=ready(stage.floor),encounter=trialEncounter(g,stage.floor);assert.ok(encounter.enemies.length>=3&&encounter.enemies.length<=6);for(const mon of encounter.enemies){assert.ok(SPECIES[mon.species]);assert.ok(!mon.equip||ITEMS[mon.equip]?.equip);assert.equal(mon.hp,stats(mon).hp);validateLoadout(mon);assert.equal(moveList(mon).length,4);}}
});

test('new trial weather and tactical profiles are committed and resume deterministically for every stage',()=>{
 for(const {floor,weather,tactic} of TRIAL_STAGES){const g=ready(floor);let b=start(g,floor);assert.equal(b.weather,weather);assert.equal(tacticForBattle(b).name,tactic.name);assert.match(b.log[0],/发起挑战/);assert.doesNotMatch(b.log[0],/野生/);b=takeTurn(b,{type:'guard'});const resumed=readEnvelope(saveEnvelope(checkpointGame(g,b))).suspendedBattle;assert.deepEqual(resumed.enemyPlan,b.enemyPlan);assert.deepEqual(takeTurn(resumed,{type:'guard'}),takeTurn(b,{type:'guard'}));}
 const rainy=start(ready(4),4),a=rainy.enemies[0],d=rainy.party[0];assert.ok(estimateDamage(a,d,'splash','rain')>estimateDamage(a,d,'splash','clear'));
});

test('first-win settlement fixtures preserve all24 scenes and milestones across saves without repeat rewards',()=>{
 let g=ready();for(let floor=1;floor<=24;floor++){g=finishFixture(g,floor);assert.equal(g.trial,floor);assert.ok(g.pendingScenes.includes('trial-after:'+floor));g=readEnvelope(saveEnvelope(g));assert.deepEqual(trialAfterScene(g,'trial-after:'+floor),trialAt(floor).after);assert.ok(trialReward(floor));g.pendingScenes=[];}
 assert.equal(g.bag.greatorb,24);assert.equal(g.bag.superpotion,24);assert.equal(g.bag.revive,12);assert.equal(TRIAL_CIRCUITS.filter((c,i)=>g.trial>=(i+1)*3).length,8);
 const before={bag:structuredClone(g.bag),gold:g.gold};g=finishFixture(g,24);assert.deepEqual(g.bag,before.bag);assert.equal(g.gold-before.gold,35+trialAt(24).level*7);assert.deepEqual(g.pendingScenes,[]);assert.equal(g.trial,24);
 const html=trialMarkup(g,24);assert.match(html,/群岛同行印/);assert.match(html,/重读赛后回声/);assert.match(html,/重赛不重复领取/);
});

test('trial gates, forged opponents/weather and pending scenes cannot bypass progression or corrupt resumes',()=>{
 const g=ready(4),before=JSON.stringify(g);for(const floor of [0,5,NaN,1.5])assert.throws(()=>trialEncounter(g,floor));assert.equal(JSON.stringify(g),before);
 assert.throws(()=>trialEncounter({...g,ending:false},4));assert.throws(()=>trialEncounter({...g,region:0},4));assert.throws(()=>trialEncounter({...g,suspendedBattle:{}},4));
 const b=start(g,4);for(const mutate of [x=>x.suspendedBattle.weather='snow',x=>x.suspendedBattle.context.circuit='unknown',x=>x.suspendedBattle.context.floor=5,x=>x.suspendedBattle.enemies[0].equip='emberCharm',x=>x.suspendedBattle.enemies[0].species='budfox_3',x=>x.pendingScenes=['trial-after:5'],x=>x.trial=-1]){const bad=checkpointGame(g,b);mutate(bad);assert.throws(()=>readEnvelope(saveEnvelope(bad)));}
 assert.equal(trialAfterScene(g,'trial-after:24'),null);assert.equal(trialAfterScene(g,'trial-after:03'),null);
});

test('legacy trial records and suspended teams remain usable; distant waves continue beyond24',()=>{
 const g=ready(36),b=makeBattle(g,[createMon('embercat_3',60)],{kind:'trial',floor:36,name:'旧版星海试炼'});const legacy=readEnvelope(saveEnvelope(checkpointGame(g,b)));assert.equal(legacy.trial,35);assert.equal(legacy.suspendedBattle.enemies.length,1);assert.equal(legacy.suspendedBattle.weather,b.weather);assert.equal(tacticForBattle(legacy.suspendedBattle),null);
 legacy.suspendedBattle=null;const next=start(legacy,36);assert.ok(next.enemies.length>=3);assert.ok(next.enemies.every(m=>m.level===65));assert.equal(trialAt(36).endless,true);
 const old=ready();delete old.trial;assert.equal(readEnvelope(saveEnvelope(old)).trial,0);assert.equal(trialAt(-1),null);assert.equal(trialAt(1.2),null);
});

test('a loss leaves invitation progress unchanged and capped first rewards remain valid saves',()=>{
 const g=ready(6),b=start(g,6);b.outcome='lose';const lost=settleBattle(g,b).game;assert.equal(lost.trial,5);assert.deepEqual(lost.pendingScenes,[]);assert.ok(lost.party.every(m=>m.hp===stats(m).hp));
 Object.assign(g.bag,{superpotion:9999,revive:9999,greatorb:9999});const won=readEnvelope(saveEnvelope(finishFixture(g,6)));assert.equal(won.bag.superpotion,9999);assert.equal(won.bag.revive,9999);assert.equal(won.bag.greatorb,9999);
});
