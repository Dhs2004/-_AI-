import test from 'node:test';
import assert from 'node:assert/strict';
import {RELICS} from '../dist/js/relics.js';
import {applyRelicAction,initialRelicState,relicProgress,relicSolved,relicChoices,traceLight,restoredLetters} from '../dist/js/relic-engine.js';
import {createGame,saveEnvelope,readEnvelope} from '../dist/js/engine.js';
import {makeMap,canWalk} from '../dist/js/world.js';
import {ITEMS} from '../dist/js/data.js';

function actionsToSolve(r){
 const p=r.puzzle;
 if(p.type==='mirror'){
  for(let bits=0;bits<2**p.mirrors.length;bits++){const candidate=p.mirrors.map((_,i)=>(bits>>i)&1);if(relicSolved(r,candidate))return candidate.flatMap((v,i)=>v===p.initial[i]?[]:[i]);}
 }
 if(p.type==='lamps')return p.scramble;
 function visit(path){if(relicSolved(r,path))return path.slice(1);for(const n of relicChoices(r,path)){const result=visit([...path,n]);if(result)return result;}}
 return visit([p.start]);
}
const solve=(g,r)=>actionsToSolve(r).reduce((state,index)=>applyRelicAction(state,r.id,{type:'touch',index}).game,g);

test('eight restoration puzzles are reachable on final floors and every authored puzzle has a valid solution',()=>{
 const ids=new Set();for(const r of RELICS){
  assert.ok(!ids.has(r.id));ids.add(r.id);assert.ok(Object.keys(r.reward).every(k=>ITEMS[k]));assert.ok(r.letter.length>=4);
  const map=makeMap(r.region,'dungeon',3),o=map.objects.find(o=>o.relic===r.id);assert.ok(o&&o.text);const g=createGame(),queue=[map.entry],seen=new Set();
  for(let i=0;i<queue.length;i++){const {x,y}=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,key=xx+','+yy;if(seen.has(key)||!canWalk(map,g,xx,yy))continue;seen.add(key);queue.push({x:xx,y:yy});}}
  assert.ok(queue.some(p=>Math.hypot(p.x-o.x,p.y-o.y)<2.2),r.instrument);
  assert.equal(relicSolved(r,initialRelicState(r)),false);assert.ok(actionsToSolve(r)?.length,r.id+' has no solution');assert.equal(solve(g,r).relics[r.id].solved,true);
 }
});
test('partial instruments survive validated saves; restoration grants each reward exactly once and preserves source state',()=>{
 for(const r of RELICS){const original=createGame(),before=structuredClone(original),steps=actionsToSolve(r);let g=original;
  for(const index of steps){g=applyRelicAction(g,r.id,{type:'touch',index}).game;const restored=readEnvelope(saveEnvelope(g));assert.deepEqual(restored.relics,g.relics);g=restored;}
  assert.equal(g.relics[r.id].solved,true);for(const [id,n] of Object.entries(r.reward))assert.equal(g.bag[id],(original.bag[id]||0)+n);
  const replay=applyRelicAction(g,r.id,{type:'reset'});assert.equal(replay.solvedNow,false);assert.deepEqual(replay.game.bag,g.bag);assert.deepEqual(replay.game.relics,g.relics);assert.deepEqual(original,before);
 }
});
test('mirror solutions need every star as well as the exit, and rays stay bounded',()=>{
 const p={type:'mirror',width:3,height:3,source:[-1,1],target:[3,1],direction:[1,0],mirrors:[],stars:[[1,0]]};
 assert.equal(traceLight(p,[]).reached,true);assert.equal(relicSolved({puzzle:p},[]),false);
 for(const r of RELICS.filter(r=>r.puzzle.type==='mirror'))for(let bits=0;bits<2**r.puzzle.mirrors.length;bits++){
  const state=r.puzzle.mirrors.map((_,i)=>(bits>>i)&1),ray=traceLight(r.puzzle,state);assert.ok(ray.path.length<=r.puzzle.width*r.puzzle.height*4+2);
 }
});
test('weaving rejects disconnected/reused edges, allows undo, and resets only unsolved progress',()=>{
 const r=RELICS[1],start=createGame(),next=relicChoices(r,initialRelicState(r))[0];let g=applyRelicAction(start,r.id,{type:'touch',index:next}).game;
 assert.throws(()=>applyRelicAction(g,r.id,{type:'touch',index:r.puzzle.start}));assert.throws(()=>applyRelicAction(g,r.id,{type:'touch',index:999}));
 g=applyRelicAction(g,r.id,{type:'undo'}).game;assert.deepEqual(g.relics[r.id].state,[r.puzzle.start]);g=applyRelicAction(g,r.id,{type:'reset'}).game;assert.equal(g.relics[r.id].moves,0);assert.equal(g.relics[r.id].solved,false);
});
test('lamp crosses are reversible and old saves migrate; invalid solved or malformed instrument state is rejected',()=>{
 const g=createGame(),r=RELICS[2];delete g.relics;const migrated=readEnvelope(saveEnvelope(g));assert.deepEqual(migrated.relics,{});
 let a=applyRelicAction(migrated,r.id,{type:'touch',index:4}).game;a=applyRelicAction(a,r.id,{type:'touch',index:4}).game;assert.deepEqual(a.relics[r.id].state,initialRelicState(r));
 for(const edit of [p=>p.solved=true,p=>p.state.push(0),p=>p.state[0]=7,p=>p.moves=-1]){const bad=structuredClone(a);edit(bad.relics[r.id]);assert.throws(()=>readEnvelope(saveEnvelope(bad)));}
 const malformed=structuredClone(a);malformed.relics.unknown=malformed.relics[r.id];assert.throws(()=>readEnvelope(saveEnvelope(malformed)));
});
test('all eight letters remain readable across saves without increasing capped inventory beyond save capacity',()=>{
 let g=createGame();g.bag.greatorb=9999;for(const r of RELICS)g=solve(g,r);g=readEnvelope(saveEnvelope(g));assert.equal(restoredLetters(g).length,8);assert.equal(g.bag.greatorb,9999);
 for(const r of RELICS)assert.equal(relicProgress(g,r.id).solved,true);
});
