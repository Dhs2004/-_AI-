import test from 'node:test';
import assert from 'node:assert/strict';
import {MOVES,SPECIES} from '../dist/js/data.js';
import {ADVANCED_MOVES,FAMILY_TECHNIQUES} from '../dist/js/technique-data.js';
import {moveLearnset,moveList,setMoveLoadout,validateLoadout,fillMoveSlots} from '../dist/js/moves.js';
import {moveBookMarkup} from '../dist/js/move-view.js';
import {createGame,createMon,makeBattle,takeTurn,estimateDamage,stats,saveEnvelope,readEnvelope,checkpointGame,settleBattle} from '../dist/js/engine.js';
import {createBattlePlayback} from '../dist/js/battle-playback.js';
import {wardenTeam,dungeonTeam} from '../dist/js/encounters.js';

function fixture(species,move,enemy='pebble_3',level=40){
 const game=createGame();game.seed=4149;game.party=[createMon(species,level),createMon('tidefin_3',40)];
 const selected=[move,...moveList(game.party[0]).filter(id=>id!==move)].slice(0,4);game.party[0].loadout=selected;
 const battle=makeBattle(game,[createMon(enemy,40)],{kind:'trainer',name:'进阶战技验证'});
 battle.enemyPlan={actor:battle.enemies[0].uid,action:{type:'move',move:moveList(battle.enemies[0])[0]}};
 return {game,battle};
}
const planned=(battle,action)=>({...battle,enemyPlan:{actor:battle.enemies[battle.activeE].uid,action}});
const attackBy=(next,uid)=>next.events.find(e=>e.kind==='attack'&&e.source===uid);

test('all families learn optional techniques at12/22/38 without displacing old automatic choices',()=>{
 assert.equal(Object.keys(ADVANCED_MOVES).length,10);
 for(const s of Object.values(SPECIES)){
  assert.equal(FAMILY_TECHNIQUES[s.family].length,2);
  for(const level of [11,12,21,22,37,38,65]){
   const mon=createMon(s.id,level),book=moveLearnset(mon);assert.equal(new Set(book.map(x=>x.id)).size,8);assert.ok(book.every(x=>MOVES[x.id]));
   assert.deepEqual(moveList(mon),book.filter(x=>x.level<=level&&x.tier!=='advanced').map(x=>x.id).slice(-4));
   for(const x of book.filter(x=>x.tier==='advanced')){const g=createGame();g.party=[mon];const chosen=[x.id,...moveList(mon).filter(id=>id!==x.id)].slice(0,4);if(x.level>level)assert.throws(()=>setMoveLoadout(g,mon.uid,chosen));else assert.doesNotThrow(()=>setMoveLoadout(g,mon.uid,chosen));}
  }
 }
 const m=createMon('budfox',12),html=moveBookMarkup(m,moveList(m),3,'auto',false);assert.match(html,/技能位置 4，可以选择/);assert.match(html,/Lv.12 领悟/);assert.deepEqual(fillMoveSlots(m,['tackle',undefined,'vine','leaf']),['tackle','mercy','vine','leaf']);assert.deepEqual(fillMoveSlots(m,['mercy','leaf','vine']),['mercy','leaf','vine','tackle']);
 for(let r=3;r<8;r++)for(const m of wardenTeam(r)){assert.doesNotThrow(()=>validateLoadout(m));assert.ok(moveList(m).some(id=>ADVANCED_MOVES[id]));}
 for(const m of dungeonTeam(4,2,{team:['frostowl_2','pebble_3']},5))assert.doesNotThrow(()=>validateLoadout(m));
});
test('mercy can leave exactly one HP, cannot trigger zero-damage recovery, and ongoing poison remains dangerous',()=>{
 const {battle}=fixture('embercat_3','mercy','budfox',65);battle.enemies[0].level=5;battle.enemies[0].hp=2;battle.enemies[0].battleTrait.firstAid=true;
 const next=takeTurn(planned(battle,{type:'guard'}),{type:'move',move:'mercy'});assert.equal(next.enemies[0].hp,1);assert.equal(attackBy(next,battle.party[0].uid).damage,1);assert.equal(next.outcome,null);
 next.enemies[0].battleTrait.firstAid=false;const again=takeTurn(planned(next,{type:'guard'}),{type:'move',move:'mercy'});assert.equal(again.enemies[0].hp,1);assert.equal(again.enemies[0].battleTrait.firstAid,false);
 const poisoned=structuredClone(battle);poisoned.enemies[0].status='poison';poisoned.enemies[0].statusTurns=2;assert.equal(takeTurn(planned(poisoned,{type:'guard'}),{type:'move',move:'mercy'}).outcome,'win');
});
test('shatter breaks a real guard before damage and its prediction ignores even golem shielding',()=>{
 const {battle}=fixture('stonegolem_3','shatter','stonegolem_3');const a=battle.party[0],target=battle.enemies[0];
 const bare=estimateDamage(a,target,'shatter');target.shield=3;assert.equal(estimateDamage(a,target,'shatter'),bare);assert.ok(estimateDamage(a,target,'stone')<bare*.6);
 const next=takeTurn(planned(battle,{type:'guard'}),{type:'move',move:'shatter'});assert.equal(next.enemies[0].shield,0);assert.ok(next.log.some(s=>s.includes('护盾被打碎')));assert.ok(attackBy(next,a.uid).damage>=bare*.9);
});
test('unravel acts with priority and strips focus, haste and regeneration without removing shield or poison',()=>{
 const {battle}=fixture('duskmoth_3','unravel','sparrow_3');const foe=battle.enemies[0];foe.focus=1;foe.haste=2;foe.regen=2;foe.shield=3;foe.status='poison';foe.statusTurns=3;foe.battleTrait.swift=false;
 const next=takeTurn(planned(battle,{type:'move',move:'focus'}),{type:'move',move:'unravel'});
 assert.equal(next.events[0].source,battle.party[0].uid);assert.equal(next.enemies[0].haste,0);assert.equal(next.enemies[0].regen,0);assert.equal(next.enemies[0].shield,2);assert.equal(next.enemies[0].status,'poison');
 // The opponent may set a NEW focus after the earlier dispel has resolved.
 assert.equal(next.enemies[0].focus,2);assert.ok(next.log.some(s=>s.includes('持续增益')));
});
test('regrowth heals three end turns, stays off fainted monsters and ends when switched out',()=>{
 const {battle}=fixture('mossdeer_3','regrowth');battle.party[0].hp=50;
 let next=takeTurn(planned(battle,{type:'guard'}),{type:'move',move:'regrowth'});const amount=Math.floor(stats(next.party[0]).hp*.08);assert.equal(next.party[0].hp,50+amount);assert.equal(next.party[0].regen,2);
 for(const left of [1,0]){next=takeTurn(planned(next,{type:'guard'}),{type:'guard'});assert.equal(next.party[0].regen,left);assert.equal(next.events.find(e=>e.move==='regrowth')?.amount,amount);}
 const active=structuredClone(battle);active.party[0].regen=2;const switched=takeTurn(planned(active,{type:'guard'}),{type:'switch',index:1});assert.equal(switched.party[0].regen,0);
 const doomed=structuredClone(battle);doomed.party[0].regen=2;doomed.party[0].haste=2;doomed.party[0].hp=1;doomed.party[0].status='poison';doomed.party[0].statusTurns=2;
 const loss=takeTurn(planned(doomed,{type:'guard'}),{type:'move',move:'leaf'});assert.equal(loss.party[0].hp,0);assert.equal(loss.party[0].regen,0);assert.equal(loss.party[0].haste,0);assert.equal(loss.events.some(e=>e.kind==='heal'&&e.move==='regrowth'),false);
});
test('tailstep grants exactly two later turns and alters actual order between otherwise ordinary attacks',()=>{
 const {battle}=fixture('kitesquid_3','tailstep','voltkit_3');battle.party[0].level=35;battle.party[0].loadout=['tailstep','tackle','gust','bubble'];
 let next=takeTurn(planned(battle,{type:'guard'}),{type:'move',move:'tailstep'});assert.equal(next.party[0].haste,2);
 const ordinary=structuredClone(next);ordinary.party[0].haste=0;
 const quick=takeTurn(planned(next,{type:'move',move:'static'}),{type:'move',move:'tackle'}),slow=takeTurn(planned(ordinary,{type:'move',move:'static'}),{type:'move',move:'tackle'});
 assert.equal(attackBy(quick,next.party[0].uid),quick.events[0]);assert.equal(slow.events[0].source,next.enemies[0].uid);assert.equal(quick.party[0].haste,1);
 next=takeTurn(planned(quick,{type:'guard'}),{type:'guard'});assert.equal(next.party[0].haste,0);
});
test('energy siphoning changes an already committed costly action into tackle on either side',()=>{
 const {battle}=fixture('clockmouse_3','siphon','stonegolem_3');battle.enemies[0].energy=3;
 const next=takeTurn(planned(battle,{type:'move',move:'quake'}),{type:'move',move:'siphon'});assert.equal(attackBy(next,battle.enemies[0].uid).move,'tackle');assert.equal(next.party[0].energy,4);assert.equal(next.enemies[0].energy,3);assert.ok(next.log.some(s=>s.includes('改用跃击')));
 const g=createGame();g.party=[createMon('stonegolem_3',40)];let b=makeBattle(g,[createMon('clockmouse_3',40)]);b.party[0].energy=3;b.enemies[0].loadout=['siphon','static','gust','thunder'];b=planned(b,{type:'move',move:'siphon'});
 const other=takeTurn(b,{type:'move',move:'quake'});assert.equal(attackBy(other,b.party[0].uid).move,'tackle');assert.equal(other.enemies[0].energy,4);
});
test('status finishers consume only their named conditions and team radiance cleanses bench members',()=>{
 for(const [species,move,status] of [['embercat_3','kindle','burn'],['frostowl_3','frostbite','root'],['frostowl_3','frostbite','shock']]){
  const {battle}=fixture(species,move),a=battle.party[0],e=battle.enemies[0],base=estimateDamage(a,e,move);e.status=status;e.statusTurns=4;assert.ok(estimateDamage(a,e,move)>=base*1.35);
  const next=takeTurn(planned(battle,{type:'guard'}),{type:'move',move});assert.equal(next.enemies[0].status,null);
 }
 const {battle}=fixture('glowbud_3','radiance');battle.party[0].status='burn';battle.party[0].statusTurns=3;battle.party[1].status='poison';battle.party[1].statusTurns=4;battle.party[1].hp=0;
 const next=takeTurn(planned(battle,{type:'guard'}),{type:'move',move:'radiance'});assert.ok(next.party.every(m=>!m.status));assert.equal(next.party[1].hp,0);
});
test('tide shelter, temporary effects, loadouts and playback state survive exact save/resume boundaries',()=>{
 const {game,battle}=fixture('tidefin_3','tideshelter');battle.party[0].hp=100;
 const next=takeTurn(planned(battle,{type:'guard'}),{type:'move',move:'tideshelter'});assert.equal(next.party[0].hp,100+Math.floor(stats(next.party[0]).hp*.18));assert.equal(next.party[0].shield,2);
 next.party[0].regen=2;next.party[0].haste=2;const restored=readEnvelope(saveEnvelope(checkpointGame(game,next))).suspendedBattle;
 assert.deepEqual(takeTurn(restored,{type:'guard'}),takeTurn(next,{type:'guard'}));
 const after=takeTurn(restored,{type:'guard'}),playback=createBattlePlayback(restored,after),last=playback.frames.at(-1).post;
 for(const side of ['party','enemies'])for(let i=0;i<after[side].length;i++)for(const field of ['hp','energy','regen','haste','shield','focus','status'])assert.equal(last[side][i][field],after[side][i][field]);
 for(const bad of [-1,4,1.5,'2']){const broken=structuredClone(next);broken.party[0].regen=bad;assert.throws(()=>readEnvelope(saveEnvelope(checkpointGame(game,broken))),/战技/);}
 after.outcome='win';const settled=settleBattle(game,after).game;assert.equal(settled.party[0].regen,undefined);assert.equal(settled.party[0].haste,undefined);
});
