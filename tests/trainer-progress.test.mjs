import test from 'node:test';
import assert from 'node:assert/strict';
import {ELEMENTS} from '../dist/js/data.js';
import {createGame,createMon,makeBattle,takeTurn,settleBattle,saveEnvelope,readEnvelope,effectiveness} from '../dist/js/engine.js';
import {makeMap,nearest} from '../dist/js/world.js';

test('a real trainer victory records completion, persists and leaves the trainer available for a rematch',()=>{
 let g=createGame();g.party=[createMon('embercat_3',65)];const map=makeMap(0,'route'),trainer=map.objects.find(o=>o.action==='trainer');
 for(let n=1;n<=2;n++){
  const before=g;let b=makeBattle(g,[createMon('budfox',1)],{kind:'trainer',trainer:trainer.id});b=takeTurn(b,{type:'move',move:'spark'});assert.equal(b.outcome,'win');
  g=settleBattle(g,b).game;assert.equal(g.trainerWins[trainer.id],n);assert.equal(before.trainerWins[trainer.id]||0,n-1);
  g=readEnvelope(saveEnvelope(g));assert.equal(g.trainerWins[trainer.id],n);assert.equal(nearest(map,{...g,x:trainer.x,y:trainer.y+1})?.id,trainer.id);
 }
 const old=createGame();delete old.trainerWins;assert.deepEqual(readEnvelope(saveEnvelope(old)).trainerWins,{});
 for(const value of [null,[],{broken:-1},{broken:'yes'}])assert.throws(()=>readEnvelope(saveEnvelope({...g,trainerWins:value})));
});
test('affinity guidance is unambiguous while light and shade retain mutual advantage',()=>{
 for(const type of Object.values(ELEMENTS))assert.ok(type.strong.every(id=>!type.weak.includes(id)));
 assert.equal(effectiveness('shade','light'),1.6);assert.equal(effectiveness('light','shade'),1.6);
});
