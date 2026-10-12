import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../dist/js/data.js';
import {moveLearnset,learnedMoves,moveList,setMoveLoadout} from '../dist/js/moves.js';
import {createGame,createMon,makeBattle,takeTurn,gainXP,xpNeed,saveEnvelope,readEnvelope,checkpointGame,settleBattle} from '../dist/js/engine.js';

test('old automatic choices remain identical at every learning boundary for all families',()=>{
 for(const id of Object.keys(SPECIES))for(const level of [5,8,9,17,18,26,27,32,65]){
  const mon=createMon(id,level),tree=SPECIES[id].moves,old=['tackle',tree[0],...(level>=9?[tree[1]]:[]),...(level>=18?[tree[2]]:[]),...(level>=27?[tree[3]]:[])].slice(-4);
  assert.deepEqual(moveList(mon),old);assert.equal(moveLearnset(mon).length,8);assert.ok(learnedMoves(mon).includes('tackle'));
 }
});
test('high-level selected tackle uses voltkit energy trait and the same loadout survives battle save/resume',()=>{
 let g=createGame();g.seed=4242;g.party=[createMon('voltkit_3',35)];const uid=g.party[0].uid,original=structuredClone(g),selected=['tackle','static','gust','thunder'];
 g=setMoveLoadout(g,uid,selected);assert.deepEqual(original.party[0].loadout,undefined);assert.deepEqual(moveList(g.party[0]),selected);
 let b=makeBattle(g,[createMon('pebble_3',35)],{kind:'trainer',name:'技能记忆验证'});b.party[0].energy=0;b=takeTurn(b,{type:'move',move:'tackle'});assert.equal(b.error,undefined);assert.equal(b.party[0].energy,2);
 const restored=readEnvelope(saveEnvelope(checkpointGame(g,b)));assert.deepEqual(moveList(restored.suspendedBattle.party[0]),selected);assert.deepEqual(takeTurn(restored.suspendedBattle,{type:'guard'}),takeTurn(b,{type:'guard'}));
 assert.throws(()=>setMoveLoadout(restored,uid,['static','focus','gust','thunder']),/对战结束/);
 b.outcome='win';const settled=settleBattle(g,b).game;assert.deepEqual(settled.party[0].loadout,selected);
});
test('manual choices survive new learning/evolution while empty early slots gain newly learned moves',()=>{
 const mon=createMon('voltkit_2',26);mon.loadout=['tackle','static','focus','gust'];
 const changes=gainXP(mon,xpNeed(mon));assert.equal(mon.level,27);assert.ok(changes.some(s=>s.includes('雷鸣断章')));assert.deepEqual(moveList(mon),['tackle','static','focus','gust']);
 while(mon.level<32)gainXP(mon,xpNeed(mon));assert.equal(mon.species,'voltkit_3');assert.deepEqual(moveList(mon),['tackle','static','focus','gust']);
 const early=createMon('budfox',8);early.loadout=['leaf','tackle'];gainXP(early,xpNeed(early));assert.deepEqual(moveList(early),['leaf','tackle','vine']);
});
test('invalid skills, duplicates, empty/incomplete choices and inconsistent battle configurations cannot be saved',()=>{
 const g=createGame(),uid=g.party[0].uid;
 for(const selected of [[],['tackle'],['tackle','tackle'],['tackle','thunder'],['tackle','leaf','vine','bloom','forest'],undefined,{}])assert.throws(()=>setMoveLoadout(g,uid,selected));
 for(const selected of [[],['tackle','tackle'],['thunder'],['bogus'],{}]){const bad=structuredClone(g);bad.party[0].loadout=selected;assert.throws(()=>readEnvelope(saveEnvelope(bad)));}
 let prepared=createGame();prepared.party=[createMon('voltkit_3',35)];prepared=setMoveLoadout(prepared,prepared.party[0].uid,['tackle','static','gust','thunder']);
 const b=makeBattle(prepared,[createMon('pebble_3',35)]),bad=checkpointGame(prepared,b);bad.suspendedBattle.party[0].loadout=['static','focus','gust','thunder'];assert.throws(()=>readEnvelope(saveEnvelope(bad)),/搭配不一致/);
});
test('automatic reset and reserve edits preserve unrelated party state and old saves require no migration changes',()=>{
 let g=createGame();g.reserve=[createMon('voltkit_3',35)];const original=structuredClone(g),uid=g.reserve[0].uid;
 g=setMoveLoadout(g,uid,['tackle','static','gust','thunder']);assert.deepEqual(g.party,original.party);assert.equal(original.reserve[0].loadout,undefined);
 g=setMoveLoadout(g,uid,null);assert.deepEqual(moveList(g.reserve[0]),['static','focus','gust','thunder']);const restored=readEnvelope(saveEnvelope(g));assert.deepEqual(restored.reserve[0].loadout,null);assert.deepEqual(moveList(restored.party[0]),['tackle','leaf']);
});
