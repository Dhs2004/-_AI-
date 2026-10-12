import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTERS,SPECIES,ITEMS} from '../dist/js/data.js';
import {HABITATS,habitatName,wildPool,speciesHabitats,resolveEcologyTrace,ecologyStatus,claimEcologyReward} from '../dist/js/ecology.js';
import {ecologyMarkup,ecologyEntryMarkup,ecologyTraceMarkup} from '../dist/js/ecology-view.js';
import {createGame,createMon,saveEnvelope,readEnvelope,makeBattle,takeTurn,settleBattle,checkpointGame,gainXP} from '../dist/js/engine.js';
import {makeMap} from '../dist/js/world.js';
import {navigationField,pathToObject,chartMarkers} from '../dist/js/navigation.js';
const locate=h=>Object.assign(createGame(),{region:h.region,place:'route',routeSector:h.sector});

test('all new habitats have selectable chart traces and preserve quest residents and dex numbers',()=>{
 assert.deepEqual(Object.keys(SPECIES).slice(45,48),['sunserpent','sunserpent_2','sunserpent_3']);
 for(let r=0;r<8;r++)for(let sector=0;sector<3;sector++){
  const h=HABITATS.find(h=>h.region===r&&h.sector===sector),pool=wildPool(r,'route',sector);
  assert.deepEqual(wildPool(r,'dungeon',sector),CHAPTERS[r].wild);
  if(!h){assert.deepEqual(pool,CHAPTERS[r].wild);continue;}
  assert.equal(pool.length,9);assert.equal(pool.filter(id=>id===h.family).length,1);
  for(const resident of CHAPTERS[r].wild)assert.equal(pool.filter(id=>id===resident).length,2);
  const g=locate(h),map=makeMap(r,'route',0,sector);Object.assign(g,map.entry);
  const trace=chartMarkers(map,g).find(o=>o.family===h.family);assert.ok(trace);assert.equal(trace.group,'discovery');assert.ok(pathToObject(navigationField(map,g),trace));
  assert.ok(speciesHabitats(h.family).includes(habitatName(h)));assert.ok(Object.keys(h.reward).every(id=>ITEMS[id]));
 }
});
test('trace clues only resolve in their habitat; incorrect replies and reads never grant encounters or resources',()=>{
 for(const h of HABITATS){
  const g=locate(h),before=structuredClone(g);
  for(let choice=0;choice<3;choice++)if(choice!==h.answer){const result=resolveEcologyTrace(g,h.family,choice);assert.equal(result.found,false);assert.strictEqual(result.game,g);assert.equal(result.species,undefined);}
  assert.throws(()=>resolveEcologyTrace({...g,place:'town'},h.family,h.answer));assert.throws(()=>resolveEcologyTrace({...g,routeSector:(h.sector+1)%3},h.family,h.answer));assert.throws(()=>resolveEcologyTrace({...g,suspendedBattle:{}},h.family,h.answer));
  const result=resolveEcologyTrace(g,h.family,h.answer);assert.ok(result.found);assert.equal(result.species,h.family);assert.equal(result.level,CHAPTERS[h.region].level);assert.ok(result.game.ecologyTraces[h.family]);
  assert.deepEqual(result.game.bag,g.bag);assert.equal(result.game.gold,g.gold);assert.deepEqual(g,before);
  assert.match(ecologyTraceMarkup(result.game,h.family),/再回应一次/);assert.equal(resolveEcologyTrace(result.game,h.family,h.answer).species,h.family);
 }
});
test('new families can be captured through real battles, suspended safely and grown to final form',()=>{
 for(const h of HABITATS){
  let g=locate(h);g.party=[createMon('tidefin_3',50)];g.bag.greatorb=20;
  g=resolveEcologyTrace(g,h.family,h.answer).game;
  let b=makeBattle(g,[createMon(h.family,CHAPTERS[h.region].level)]);b.enemies[0].hp=1;
  g=readEnvelope(saveEnvelope(checkpointGame(g,b)));assert.ok(g.ecologyTraces[h.family]);assert.equal(g.suspendedBattle.enemies[0].species,h.family);
  b=g.suspendedBattle;for(let i=0;i<20&&!b.outcome;i++)b=takeTurn(b,{type:'capture',item:'greatorb'});
  assert.equal(b.outcome,'capture');g=checkpointGame(settleBattle(g,b).game,b);
  assert.ok(ecologyStatus(g,h.family).caught);assert.equal(ecologyStatus(g,h.family).grown,false);assert.ok(g.bag.greatorb<20);
  const mon=g.party.find(m=>SPECIES[m.species].family===h.family);gainXP(mon,40000);assert.equal(mon.species,h.family+'_3');
  const stored=readEnvelope(saveEnvelope(g));assert.ok(ecologyStatus(stored,h.family).complete);
 }
});
test('survey rewards are one-time and atomic at inventory limits, and reserve partners count',()=>{
 for(const h of HABITATS){
  let g=locate(h);assert.throws(()=>claimEcologyReward(g,h.family));g.ecologyTraces[h.family]=true;g.reserve=[createMon(h.family+'_3',40)];
  assert.ok(ecologyStatus(g,h.family).ready);const key=Object.keys(h.reward)[0],before=structuredClone(g);g.bag[key]=9999;
  assert.throws(()=>claimEcologyReward(g,h.family),/行囊/);assert.equal(g.ecologyRewards[h.family],undefined);
  g=before;const snapshot=structuredClone(g),result=claimEcologyReward(g,h.family);assert.deepEqual(result.received,h.reward);assert.deepEqual(g,snapshot);
  const restored=readEnvelope(saveEnvelope(result.game));const repeated=claimEcologyReward(restored,h.family);assert.strictEqual(repeated.game,restored);assert.deepEqual(repeated.received,{});
  assert.equal(ecologyStatus(restored,h.family).claimed,true);assert.match(ecologyEntryMarkup(restored,h.family),/已经领取/);
  const copy=structuredClone(restored);ecologyMarkup(restored);ecologyEntryMarkup(restored,h.family);assert.deepEqual(restored,copy);
 }
});
test('old saves receive empty ecology state and malformed records cannot enter the game',()=>{
 const g=createGame();delete g.ecologyTraces;delete g.ecologyRewards;const restored=readEnvelope(saveEnvelope(g));assert.deepEqual(restored.ecologyTraces,{});assert.deepEqual(restored.ecologyRewards,{});
 for(const field of ['ecologyTraces','ecologyRewards'])for(const bad of [[],5,{ghost:true},{kitesquid:1}])assert.throws(()=>readEnvelope(saveEnvelope({...g,[field]:bad})),/生态/);
});
