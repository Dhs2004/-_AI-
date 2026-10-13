import test from 'node:test';
import assert from 'node:assert/strict';
import {FISHING_SPOTS,FISHING_SIGNALS,FISHING_LURES} from '../dist/js/fishing-data.js';
import {castFishing,fishingTurn,fishingEncounter,putAwayFishing,releaseFishing,claimFishingRecord,fishingProgress,fishingRank} from '../dist/js/fishing.js';
import {fishingMarkup,fishingNotebookMarkup,fishingRecordMarkup} from '../dist/js/fishing-view.js';
import {createGame,createMon,makeBattle,takeTurn,settleBattle,checkpointGame,saveEnvelope,readEnvelope,healParty,stats} from '../dist/js/engine.js';
import {makeMap,nearest} from '../dist/js/world.js';
import {navigationField,pathToObject,chartMarkers} from '../dist/js/navigation.js';
import {SPECIES,ITEMS} from '../dist/js/data.js';
const at=s=>Object.assign(createGame(),{region:s.region,place:'route',routeSector:s.sector});
function landed(g,s,lure='plain'){
 g=castFishing(g,s.id,lure);while(g.fishing.active?.phase==='line')g=fishingTurn(g,FISHING_SIGNALS[g.fishing.active.signal].answer).game;assert.equal(g.fishing.active?.phase,'landed');return g;
}

test('eight shoreline posts are chart-selectable near water and their species, story branches and rewards are valid',()=>{
 for(const s of FISHING_SPOTS){
  const g=at(s),map=makeMap(s.region,'route',0,s.sector);Object.assign(g,map.entry);
  const marker=chartMarkers(map,g).find(o=>o.id===s.id);assert.ok(marker);assert.equal(marker.group,'discovery');const path=pathToObject(navigationField(map,g),marker);assert.ok(path);const [x,y]=path.at(-1)||[g.x,g.y];assert.equal(nearest(map,{...g,x,y}).id,s.id);
  assert.ok(Array.from({length:7},(_,i)=>i-3).some(dy=>Array.from({length:7},(_,i)=>i-3).some(dx=>map.layout[marker.y+dy]?.[marker.x+dx]==='~')));
  assert.equal(new Set(s.families).size,3);assert.ok(s.families.every(id=>SPECIES[id]));assert.equal(s.opening.length,3);assert.equal(s.choices.length,2);assert.ok(s.choices.every(c=>c.reply.length>20));
 }
 assert.ok(ITEMS.tidalCharm.equip);const equipped=stats({...createMon('pebble_3',40),equip:'tidalCharm'});assert.deepEqual(Object.keys(equipped),['hp','atk','def','spd']);assert.ok(Object.values(equipped).every(Number.isFinite));assert.doesNotMatch(fishingNotebookMarkup(createGame()),/旧街泄水渠|星潮退去的浅海/);
});
test('casts consume their selected ingredient once, remain immutable and can be resumed between every signal',()=>{
 for(const [lure,bait] of Object.entries(FISHING_LURES))for(const s of FISHING_SPOTS){
  let g=at(s);g.bag.herb=4;g.bag.coastfruit=5;g.seed=79;const original=structuredClone(g);g=castFishing(g,s.id,lure);assert.deepEqual(original.fishing.active,null);if(bait.item)assert.equal(g.bag[bait.item],original.bag[bait.item]-1);
  for(let i=0;i<4;i++){const restored=readEnvelope(saveEnvelope(g)),action=FISHING_SIGNALS[g.fishing.active.signal].answer;assert.deepEqual(fishingTurn(restored,action),fishingTurn(g,action));g=fishingTurn(g,action).game;}
  assert.equal(g.fishing.active.phase,'landed');assert.equal(g.fishing.active.progress,8);assert.equal(g.fishing.active.turn,4);if(bait.item)assert.equal(g.bag[bait.item],original.bag[bait.item]-1);assert.ok(g.seen.includes(g.fishing.active.family+(g.fishing.active.level>=32?'_3':g.fishing.active.level>=16?'_2':'')));
  assert.throws(()=>castFishing(g,s.id,lure),/钓线/);assert.equal(releaseFishing(g).fishing.released[s.id],1);assert.equal(fishingProgress(releaseFishing(g),s.id).count,0);
 }
});
test('tension, missed signals, cancellation, location and exhausted ingredients cannot produce a free encounter',()=>{
 const s=FISHING_SPOTS[0],g=at(s);assert.throws(()=>castFishing({...g,place:'town'},s.id));assert.throws(()=>castFishing(g,s.id,'leaf'));assert.throws(()=>castFishing({...g,suspendedBattle:{}},s.id));
 let failed=castFishing(g,s.id);let turns=0;while(failed.fishing.active&&turns++<12){const signal=failed.fishing.active.signal;failed=fishingTurn(failed,signal==='dive'?'reel':'wait').game;}assert.equal(failed.fishing.active,null);assert.throws(()=>fishingEncounter(failed));assert.equal(fishingProgress(failed,s.id).count,0);
 let active=castFishing(g,s.id);const cancelled=putAwayFishing(active);assert.equal(cancelled.fishing.active,null);assert.ok(active.fishing.active);assert.throws(()=>fishingTurn({...active,routeSector:2},'reel'));assert.throws(()=>fishingTurn(active,'missing'));
 const view=fishingMarkup(active,s.id);assert.match(view,/不用抢按/);assert.match(view,/钓线张力/);
});
test('leaf and fruit lures favor exactly their declared companion over a deterministic sample',()=>{
 const s=FISHING_SPOTS[1],totals={};for(const lure of Object.keys(FISHING_LURES)){const counts=[0,0,0];for(let seed=1;seed<=3000;seed++){const g=at(s);g.seed=Math.imul(seed,2654435761)>>>0;g.bag.herb=1;g.bag.coastfruit=1;counts[s.families.indexOf(castFishing(g,s.id,lure).fishing.active.family)]++;}totals[lure]=counts;}
 assert.ok(totals.leaf[1]>totals.leaf[0]*3);assert.ok(totals.fruit[2]>totals.fruit[0]*3);for(const n of totals.plain)assert.ok(n>950&&n<1050);
});
test('all 24 water contracts use actual wild capture and stable battle resume, then unlock one-time story gifts',()=>{
 let game=createGame();game.party=[createMon('cinder_3',65)];game.party[0].loadout=['mercy','tackle','spark','shell'];game.bag.greatorb=500;game.bag.superpotion=50;
 for(const s of FISHING_SPOTS){
  Object.assign(game,{region:s.region,place:'route',routeSector:s.sector});
  for(const family of s.families){
   healParty(game);let cast;
   for(let seed=1;seed<10000;seed++){const candidate={...game,seed};if(castFishing(candidate,s.id).fishing.active.family===family){cast=landed(candidate,s);break;}}assert.ok(cast);
   const encounter=fishingEncounter(cast);let b=makeBattle(encounter.game,[createMon(encounter.species,encounter.level)],encounter.context);game=encounter.game;
   const saved=readEnvelope(saveEnvelope(checkpointGame(game,b)));assert.equal(saved.suspendedBattle.context.fishingSpot,s.id);assert.throws(()=>putAwayFishing(saved));
   const first=takeTurn(b,{type:'move',move:'mercy'});assert.deepEqual(takeTurn(saved.suspendedBattle,{type:'move',move:'mercy'}),first);b=first;
   for(let n=0;n<30&&!b.outcome;n++){const p=b.party[b.activeP];b=takeTurn(b,p.hp<stats(p).hp*.3&&b.inventory.superpotion?{type:'item',item:'superpotion'}:{type:'capture',item:'greatorb'});}
   assert.equal(b.outcome,'capture',family);game=checkpointGame(settleBattle(game,b).game,b);assert.equal(game.fishing.active,null);assert.equal(game.fishing.catches[s.id][family],1);assert.ok(fishingProgress(game,s.id).count>0);
   game=readEnvelope(saveEnvelope(game));
  }
  assert.equal(fishingProgress(game,s.id).ready,true);const full={...game,bag:{...game.bag,coastfruit:9999}};assert.throws(()=>claimFishingRecord(full,s.id,0),/行囊/);assert.equal(full.fishing.claimed[s.id],undefined);
  const before=game.bag.greatorb,result=claimFishingRecord(game,s.id,s.region%2);game=result.game;assert.equal(game.bag.greatorb,before+2);assert.equal(fishingProgress(game,s.id).claimed,true);assert.match(fishingRecordMarkup(game,s.id),/你当时说/);assert.strictEqual(claimFishingRecord(game,s.id,1).game,game);game=readEnvelope(saveEnvelope(game));
 }
 assert.equal(game.fishing.grandClaimed,true);assert.equal(game.bag.tidalCharm,1);assert.equal(fishingRank(game).rank,3);assert.equal(fishingRank(game).count,24);
});
test('run, defeat and ordinary victory clear the line without claiming capture, and unrelated battles preserve it',()=>{
 const s=FISHING_SPOTS[0];for(const outcome of ['run','lose','win']){const g=landed(at(s),s),next=fishingEncounter(g),b=makeBattle(next.game,[createMon(next.species,next.level)],next.context);b.outcome=outcome;const result=settleBattle(next.game,b).game;assert.equal(result.fishing.active,null);assert.equal(fishingProgress(result,s.id).count,0);}
 const active=castFishing(at(s),s.id),b=makeBattle(active,[createMon('pebble',5)]);b.outcome='run';assert.deepEqual(settleBattle(active,b).game.fishing.active,active.fishing.active);
});
test('legacy saves migrate and malformed fishing records or mismatched battle identities cannot resume',()=>{
 const g=createGame();delete g.fishing;assert.equal(readEnvelope(saveEnvelope(g)).fishing.active,null);
 const s=FISHING_SPOTS[0],line=castFishing(at(s),s.id);
 for(const corrupt of [x=>x.fishing.active.turn=13,x=>x.fishing.active.phase='battle',x=>x.fishing.active.family='sunserpent',x=>x.fishing.active.tension=7,x=>x.fishing.claimed.float0=true,x=>x.fishing.catches.float0={tidefin:0},x=>x.fishing.grandClaimed=true]){const broken=structuredClone(line);corrupt(broken);assert.throws(()=>readEnvelope(saveEnvelope(broken)),/水岸|钓线/);}
 const ready=fishingEncounter(landed(at(s),s)),battle=makeBattle(ready.game,[createMon(ready.species,ready.level)],ready.context);battle.context.fishingSpot='float1';assert.throws(()=>readEnvelope(saveEnvelope(checkpointGame(ready.game,battle))),/水岸/);
});
