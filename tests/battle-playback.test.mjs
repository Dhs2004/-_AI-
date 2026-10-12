import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createMon,makeBattle,takeTurn,stats,saveEnvelope,readEnvelope,checkpointGame} from '../dist/js/engine.js';
import {createBattlePlayback,playbackFrame} from '../dist/js/battle-playback.js';

function assertHealth(before,after){
 const original=JSON.stringify(before),result=JSON.stringify(after),playback=createBattlePlayback(before,after);
 const last=playback.frames.at(-1)?.post||playback.scene;
 for(const side of ['party','enemies'])assert.deepEqual(last[side].map(m=>m.hp),after[side].map(m=>m.hp),`${side}: ${after.log.join(' / ')}`);
 assert.equal(last.activeP,after.activeP);assert.equal(last.activeE,after.activeE);
 assert.equal(JSON.stringify(before),original);assert.equal(JSON.stringify(after),result);
 return playback;
}
function fixture(species){
 const game=createGame();game.seed=6213;game.party=[createMon(species,35),createMon('tidefin_3',35)];game.party[0].hp=Math.floor(stats(game.party[0]).hp*.65);
 return {game,battle:makeBattle(game,[createMon('mossdeer_3',40),createMon('pebble_3',35)],{kind:'trainer',name:'逐项反馈'})};
}

test('visual HP frames reconcile real damage, drains, recoil, trait recovery, guard and ongoing status',()=>{
 const cases=[['embercat_3',{type:'move',move:'phoenix'}],['duskmoth_3',{type:'move',move:'nightmare'}],['mossdeer_3',{type:'guard'}],['budfox_3',{type:'move',move:'bloom'}]];
 for(const [species,action] of cases){const {battle}=fixture(species);battle.party[0].status='poison';battle.party[0].statusTurns=4;const after=takeTurn(battle,action);assert.equal(after.error,undefined);assertHealth(battle,after);assert.ok(after.events.some(e=>e.kind==='status'));}
 const {battle}=fixture('budfox_3');battle.party[0].hp=Math.floor(stats(battle.party[0]).hp*.45);assertHealth(battle,takeTurn(battle,{type:'guard'}));
});

test('bench items, switching, fainting and replacements target the correct recipient in playback',()=>{
 const {battle}=fixture('embercat_3');battle.party[1].hp=0;
 const restored=takeTurn(battle,{type:'item',item:'revive',target:1}),revive=restored.events.find(e=>e.item==='revive');
 assert.equal(revive.target,battle.party[1].uid);assert.equal(revive.amount,Math.ceil(stats(battle.party[1]).hp*.5));assertHealth(battle,restored);
 const switched=takeTurn(restored,{type:'switch',index:1}),playback=assertHealth(restored,switched);assert.equal(playback.frames[0].pre.activeP,1);assert.match(playback.frames[0].caption,/我方轮换/);
 const g=createGame();g.party=[createMon('embercat_3',65),createMon('budfox',2)];const b=makeBattle(g,[createMon('pebble',1),createMon('tidefin_3',35)]);b.enemies[0].hp=1;
 const next=takeTurn(b,{type:'move',move:'flare'}),p=assertHealth(b,next);assert.equal(p.frames.at(-1).post.activeE,1);assert.ok(next.events.some(e=>e.kind==='faint'));assert.ok(next.events.some(e=>e.kind==='switch'));
});

test('normal and fast presentation have identical combat, captions and frames at matching phases',()=>{
 const {battle}=fixture('mossdeer_3'),next=takeTurn(battle,{type:'guard'}),slow=createBattlePlayback(battle,next,1,10),fast=createBattlePlayback(battle,next,2,10);
 assert.equal((slow.duration-.08)/(fast.duration-.08),2);assert.deepEqual(slow.frames,fast.frames);assert.equal(slow.seed,fast.seed);
 for(const phase of [.1,.45,1.1,1.6])assert.deepEqual(playbackFrame(slow,10+phase*.48)?.scene,playbackFrame(fast,10+phase*.24)?.scene);
 assert.equal(playbackFrame(slow,10+.1).scene.party[0].hp,battle.party[0].hp);
 assert.ok(playbackFrame(slow,10+999).index<slow.frames.length);
 assert.equal(playbackFrame(createBattlePlayback(battle,{...next,events:[]}),1),null);
});

test('speed preference survives battle saves and older or malformed settings default safely',()=>{
 const {game,battle}=fixture('embercat_3');game.battleSpeed=2;const restored=readEnvelope(saveEnvelope(checkpointGame(game,battle)));
 assert.equal(restored.battleSpeed,2);assert.deepEqual(takeTurn(restored.suspendedBattle,{type:'guard'}).party,takeTurn(battle,{type:'guard'}).party);
 for(const value of [undefined,0,-2,'2',null,{},999]){game.battleSpeed=value;assert.equal(readEnvelope(saveEnvelope(game)).battleSpeed,1);}
});
