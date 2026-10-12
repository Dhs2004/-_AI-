import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createMon,makeBattle,takeTurn} from '../dist/js/engine.js';
test('animation events follow real initiative, record actual damage and suppress attacks after fainting',()=>{
 const game=createGame();game.seed=7;game.party=[createMon('budfox',1)];game.party[0].hp=1;
 const enemy=createMon('sparrow_3',65),before=makeBattle(game,[enemy],{kind:'trainer'}),after=takeTurn(before,{type:'move',move:'tackle'});
 assert.equal(after.outcome,'lose');assert.equal(after.events[0].source,enemy.uid);assert.equal(after.events[0].target,game.party[0].uid);assert.equal(after.events[0].damage,1);
 assert.equal(after.events.filter(e=>e.kind==='attack').length,1);assert.equal(after.events.at(-1).kind,'faint');assert.equal(before.party[0].hp,1);
});
test('switch, guard and capture effects reference the correct visible participants',()=>{
 const game=createGame();game.seed=9;game.party.push(createMon('tidefin',8));const before=makeBattle(game,[createMon('embercat',5)]);
 const switched=takeTurn(before,{type:'switch',index:1});assert.equal(switched.events[0].target,game.party[1].uid);
 const guarded=takeTurn(before,{type:'guard'});assert.equal(guarded.events[0].kind,'buff');assert.equal(guarded.events[0].target,game.party[0].uid);
 const captured=takeTurn(before,{type:'capture',item:'orb'});assert.equal(captured.events[0].kind,'capture');assert.equal(captured.events[0].target,before.enemies[0].uid);
});
