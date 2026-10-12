import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createMon,makeBattle,takeTurn,checkpointGame,saveEnvelope,readEnvelope,settleBattle,stats} from '../dist/js/engine.js';
test('suspended battles preserve turn, HP, energy, inventory, status and deterministic next actions',()=>{
 const game=createGame();game.seed=4242;game.party.push(createMon('tidefin',8));game.party[0].hp=40;
 let battle=makeBattle(game,[createMon('pebble',12)],{kind:'trainer',name:'保存测试'});
 battle=takeTurn(battle,{type:'item',item:'potion',target:0});battle=takeTurn(battle,{type:'switch',index:1});
 const restored=readEnvelope(saveEnvelope(checkpointGame(game,battle))),resumed=restored.suspendedBattle;
 assert.equal(resumed.turn,2);assert.equal(resumed.activeP,1);assert.equal(resumed.inventory.potion,game.bag.potion-1);
 assert.deepEqual(resumed.party,battle.party);assert.deepEqual(resumed.enemies,battle.enemies);assert.equal(resumed.seed,battle.seed);
 const next=takeTurn(battle,{type:'guard'}),afterResume=takeTurn(resumed,{type:'guard'});
 for(const field of ['party','enemies','seed','turn','log','events','outcome','inventory'])assert.deepEqual(afterResume[field],next[field],field);
 assert.equal(game.suspendedBattle,null);
});
test('finished battles save rewards once and retain unread chapter scenes through reload',()=>{
 const game=createGame(),battle=makeBattle(game,[createMon('pebble',5)],{kind:'boss',first:true});battle.outcome='win';
 const settled=settleBattle(game,battle).game,checkpoint=checkpointGame(settled,battle),resumed=readEnvelope(saveEnvelope(checkpoint));
 assert.equal(resumed.suspendedBattle,null);assert.deepEqual(resumed.badges,[0]);assert.deepEqual(resumed.pendingScenes,['after0']);assert.equal(resumed.gold,settled.gold);
});
test('invalid suspended battle inputs are rejected before the renderer can use them',()=>{
 const game=createGame(),battle=makeBattle(game,[createMon('pebble',5)]);
 const changes=[b=>b.activeP=9,b=>b.activeE=-1,b=>b.party[0].energy=99,b=>b.enemies[0].hp=stats(b.enemies[0]).hp+1,b=>b.party[0].hp=0,b=>b.party[0].uid='different',b=>b.weather='impossible',b=>b.context.region=7,b=>b.inventory.potion=-1,b=>b.turn=-1,b=>b.enemies=[]];
 for(const mutate of changes){const candidate=checkpointGame(game,battle);mutate(candidate.suspendedBattle);assert.throws(()=>readEnvelope(saveEnvelope(candidate)));}
 const malformed=checkpointGame(game,battle);malformed.pendingScenes=['arbitrary-script'];assert.throws(()=>readEnvelope(saveEnvelope(malformed)));
});
