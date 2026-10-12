import test from 'node:test';
import assert from 'node:assert/strict';
import {MOVES} from '../dist/js/data.js';
import {WARDEN_TACTICS,planEnemyAction,describeEnemyPlan} from '../dist/js/battle-ai.js';
import {createGame,createMon,makeBattle,takeTurn,estimateDamage,stats,moveList,random,clone,checkpointGame,readEnvelope,saveEnvelope} from '../dist/js/engine.js';
const plan=b=>planEnemyAction(b,{damage:estimateDamage,stats,moves:moveList,random});
function setup(player='embercat_2',enemy='mossdeer_2',level=20){const game=createGame();game.seed=4242;game.party=[createMon(player,level)];return {game,battle:makeBattle(game,[createMon(enemy,level)],{kind:'trainer',name:'意图测试'})};}

test('energy-empty high-level opponents guard instead of using an unlearned fallback move',()=>{
 const {battle}=setup('embercat_3','budfox_3',35);battle.enemies[0].energy=0;battle.enemyPlan=plan(battle);
 assert.ok(!moveList(battle.enemies[0]).includes('tackle'));assert.deepEqual(battle.enemyPlan.action,{type:'guard'});
 const turn=takeTurn(battle,{type:'guard'});assert.equal(turn.enemies[0].energy,2);assert.ok(turn.enemies[0].shield);assert.equal(turn.events.filter(e=>e.source===battle.enemies[0].uid&&e.kind==='attack').length,0);
});
test('the announced move is fixed before different player choices and survives save/resume',()=>{
 const {game,battle}=setup('embercat','sparrow',10),chosen=battle.enemyPlan;
 assert.equal(chosen.action.type,'move');
 const guarded=takeTurn(battle,{type:'guard'}),attacked=takeTurn(battle,{type:'move',move:'tackle'});
 for(const result of [guarded,attacked])assert.equal(result.events.find(e=>e.source===chosen.actor&&e.kind==='attack').move,chosen.action.move);
 const resumed=readEnvelope(saveEnvelope(checkpointGame(game,battle))).suspendedBattle;
 assert.deepEqual(resumed.enemyPlan,chosen);assert.equal(resumed.seed,battle.seed);assert.deepEqual(takeTurn(resumed,{type:'guard'}),guarded);
 assert.equal(describeEnemyPlan(chosen,battle).name,MOVES[chosen.action.move].name);
});
test('announced guard protects before a player attack',()=>{
 const {battle}=setup('embercat_3','budfox_3',35);battle.enemies[0].energy=0;battle.enemyPlan=plan(battle);
 const control=clone(battle);control.enemies[0].energy=5;control.enemyPlan.action={type:'move',move:'leaf'};
 const guarded=takeTurn(battle,{type:'move',move:'spark'}),open=takeTurn(control,{type:'move',move:'spark'});
 const playerDamage=b=>b.events.find(e=>e.source===battle.party[0].uid&&e.kind==='attack').damage;
 assert.ok(playerDamage(guarded)<playerDamage(open)*.65);
});
test('boss switching targets the incoming companion and has a cooldown',()=>{
 const game=createGame();game.region=6;game.seed=100;game.party=[createMon('tidefin_3',35)];
 const battle=makeBattle(game,[createMon('embercat_3',35),createMon('voltkit_3',35)],{kind:'boss'});
 assert.deepEqual(battle.enemyPlan.action,{type:'switch',index:1});
 const turn=takeTurn(battle,{type:'move',move:'splash'});assert.equal(turn.activeE,1);assert.equal(turn.lastEnemySwitch,1);assert.equal(turn.enemies[0].hp,battle.enemies[0].hp);assert.ok(turn.enemies[1].hp<battle.enemies[1].hp);assert.notEqual(turn.enemyPlan.action.type,'switch');
 assert.equal(turn.events.find(e=>e.source===battle.party[0].uid&&e.kind==='attack').target,battle.enemies[1].uid);
});
test('each warden has a distinct tactical profile and all planned actions are legal',()=>{
 assert.equal(WARDEN_TACTICS.length,8);assert.equal(new Set(WARDEN_TACTICS.map(t=>t.name)).size,8);
 for(let region=0;region<8;region++)for(const species of ['budfox_3','embercat_3','duskmoth_3','tidefin_3'])for(let energy=0;energy<=5;energy++){
  const game=createGame();game.region=region;game.party=[createMon('skydrake_3',40)];const b=makeBattle(game,[createMon(species,40)],{kind:'boss'});b.enemies[0].energy=energy;const chosen=plan(b).action;
  assert.ok(chosen.type==='guard'||chosen.type==='move');if(chosen.type==='move'){assert.ok(moveList(b.enemies[0]).includes(chosen.move));assert.ok(MOVES[chosen.move].cost<=energy);}
 }
});
test('old suspended battles receive a legal plan; corrupted plans cannot resume',()=>{
 const {game,battle}=setup();const old=clone(battle);delete old.enemyPlan;const migrated=readEnvelope(saveEnvelope(checkpointGame(game,old))).suspendedBattle;assert.ok(migrated.enemyPlan);
 for(const bad of [{actor:'wrong',action:{type:'guard'}},{actor:battle.enemies[0].uid,action:{type:'move',move:'missing'}},{actor:battle.enemies[0].uid,action:{type:'switch',index:0}}]){
  const broken={...battle,enemyPlan:bad};assert.throws(()=>readEnvelope(saveEnvelope(checkpointGame(game,broken))));
 }
});
test('recovery-heavy opponents return to attacking and preserve their tactical memory on resume',()=>{
 const {game,battle}=setup('embercat_3','mossdeer_3',38);battle.enemies[0].hp=Math.floor(stats(battle.enemies[0]).hp*.4);battle.enemyPlan=plan(battle);
 let next=battle,support=0,maxSupport=0,attacks=0;
 for(let i=0;i<24&&!next.outcome;i++){
  const action=next.enemyPlan.action,damaging=action.type==='move'&&MOVES[action.move].power;
  support=damaging?0:support+1;maxSupport=Math.max(maxSupport,support);attacks+=!!damaging;
  next=takeTurn(next,{type:'guard'});
  if(!next.outcome){const resumed=readEnvelope(saveEnvelope(checkpointGame(game,next))).suspendedBattle;assert.equal(resumed.enemySupportStreak,next.enemySupportStreak);assert.deepEqual(resumed.enemyPlan,next.enemyPlan);}
 }
 assert.ok(attacks>=4);assert.ok(maxSupport<=4,`recovery streak ${maxSupport}`);
 assert.throws(()=>readEnvelope(saveEnvelope(checkpointGame(game,{...battle,enemySupportStreak:99}))));
});
