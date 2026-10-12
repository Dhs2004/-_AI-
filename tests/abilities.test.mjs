import test from 'node:test';
import assert from 'node:assert/strict';
import {SPECIES} from '../dist/js/data.js';
import {ABILITIES,abilityFor,incomingTrait,outgoingTrait} from '../dist/js/abilities.js';
import {createGame,createMon,stats,makeBattle,takeTurn,settleBattle,estimateDamage,clone,checkpointGame,saveEnvelope,readEnvelope} from '../dist/js/engine.js';
function fight(species,level=20,enemy='pebble',enemyLevel=3){const g=createGame();g.seed=10;g.party=[createMon(species,level)];return {g,b:makeBattle(g,[createMon(enemy,enemyLevel)])};}

test('every creature retains its family trait through all three evolution forms',()=>{assert.equal(Object.keys(ABILITIES).length,new Set(Object.values(SPECIES).map(s=>s.family)).size);for(const mon of Object.values(SPECIES)){assert.ok(abilityFor({species:mon.id})?.desc);assert.equal(abilityFor({species:mon.id}),ABILITIES[mon.family]);}});
test('budfox survives a threshold hit with one recovery per battle, never recovers after knockout',()=>{
 const {g,b}=fight('budfox',20,'embercat',1);b.party[0].hp=Math.floor(stats(b.party[0]).hp*.5);
 const first=takeTurn(b,{type:'guard'});assert.equal(first.party[0].battleTrait.firstAid,true);assert.equal(first.events.filter(e=>e.kind==='heal').length,1);assert.equal(b.party[0].battleTrait.firstAid,false);
 const second=takeTurn(first,{type:'guard'});assert.equal(second.events.filter(e=>e.kind==='heal').length,0);
 const restored=readEnvelope(saveEnvelope(checkpointGame(g,first)));assert.equal(restored.suspendedBattle.party[0].battleTrait.firstAid,true);
 const doomed=clone(b);doomed.party[0].hp=1;const loss=takeTurn(doomed,{type:'guard'});assert.equal(loss.outcome,'lose');assert.equal(loss.events.filter(e=>e.kind==='heal').length,0);
});
test('tidefin entry ward absorbs a real hit and expires after its first turn',()=>{
 const {b}=fight('tidefin',20,'embercat',5);b.party[0].hp=stats(b.party[0]).hp;const bare=clone(b);bare.party[0].shield=0;
 const warded=takeTurn(b,{type:'move',move:'tackle'}),unwarded=takeTurn(bare,{type:'move',move:'tackle'});
 assert.ok(warded.party[0].hp>unwarded.party[0].hp);assert.equal(warded.party[0].shield,0);
});
test('mossdeer guard recovers health; voltkit only doubles basic attack energy',()=>{
 const deer=fight('mossdeer').b;deer.party[0].hp=50;const guarded=takeTurn(deer,{type:'guard'});assert.ok(guarded.events.some(e=>e.kind==='heal'&&e.amount===Math.floor(stats(deer.party[0]).hp*.08)));
 const rabbit=fight('voltkit').b;rabbit.party[0].energy=0;
 assert.equal(takeTurn(rabbit,{type:'move',move:'tackle'}).party[0].energy,2);assert.equal(takeTurn(rabbit,{type:'move',move:'focus'}).party[0].energy,1);
});
test('first-attack priority changes real initiative and is consumed by an attack',()=>{
 const {b}=fight('sparrow',10,'sparrow',5);b.enemies[0].battleTrait.swift=false;
 const ordinary=clone(b);ordinary.party[0].battleTrait.swift=false;
 const quick=takeTurn(b,{type:'move',move:'tackle'}),slow=takeTurn(ordinary,{type:'move',move:'tackle'});
 assert.equal(quick.events.find(e=>e.kind==='attack').source,b.party[0].uid);assert.equal(slow.events.find(e=>e.kind==='attack').source,b.enemies[0].uid);assert.equal(quick.party[0].battleTrait.swift,false);
});
test('attack traits respond to the target condition and defensive traits to full HP or snow',()=>{
 const target=createMon('mossdeer',20),cat=createMon('embercat',20),moth=createMon('duskmoth',20),wolf=createMon('nightwolf',20);
 const emberBase=estimateDamage(cat,target,'spark'),shadowBase=estimateDamage(moth,target,'shadow');target.status='burn';assert.ok(estimateDamage(cat,target,'spark')>=emberBase*1.15);assert.ok(estimateDamage(moth,target,'shadow')>=shadowBase*1.15);
 target.status=null;const full=estimateDamage(wolf,target,'shadow');target.hp=10;assert.ok(estimateDamage(wolf,target,'shadow')>=full*1.2);
 const turtle=createMon('pebble',20),first=estimateDamage(cat,turtle,'spark');turtle.hp--;assert.ok(estimateDamage(cat,turtle,'spark')>first*1.2);
 const owl=createMon('frostowl',20);assert.ok(estimateDamage(cat,owl,'tackle','snow')<estimateDamage(cat,owl,'tackle'));
 const golem=createMon('stonegolem',20);const base=estimateDamage(cat,golem,'spark');golem.shield=1;assert.ok(estimateDamage(cat,golem,'spark')<=base*.42);
});
test('glowbud amplifies healing skills without changing item healing',()=>{
 const {b}=fight('glowbud',20);b.party[0].hp=20;const max=stats(b.party[0]).hp;
 const skill=takeTurn(b,{type:'move',move:'wish'});assert.equal(skill.events.find(e=>e.kind==='heal').amount,Math.floor(max*.42*1.2));
 const item=takeTurn(b,{type:'item',item:'potion'});const damage=item.events.filter(e=>e.target===b.party[0].uid&&e.kind==='attack').reduce((s,e)=>s+(e.damage||0),0);assert.equal(item.party[0].hp,75-damage);
});
test('cinder blocks burns and dewslime spends its one-status veil through actual attacks',()=>{
 let foundBurn=false,foundVeil=false;
 for(let seed=1;seed<=60;seed++){
  for(const id of ['cinder','dewslime']){const {b}=fight(id,40,'embercat_2',20);b.seed=seed;const next=takeTurn(b,{type:'guard'});
   if(next.log.some(l=>l.includes('炉火容纳'))){foundBurn=true;assert.notEqual(next.party[0].status,'burn');}
   if(next.log.some(l=>l.includes('净影抵消'))){foundVeil=true;assert.equal(next.party[0].battleTrait.veilUsed,true);assert.equal(next.party[0].status,null);const spent=clone(b);spent.party[0].battleTrait.veilUsed=true;assert.equal(takeTurn(spent,{type:'guard'}).party[0].status,'burn');}
  }
 }
 assert.ok(foundBurn&&foundVeil);
});
test('skydrake first-entry focus is not refreshed by repeated switches; sunserpent refunds every third paid attack',()=>{
 const {g,b}=fight('skydrake',20,'stonegolem_3',10);g.party.push(createMon('tidefin',20));const start=makeBattle(g,b.enemies);assert.equal(start.party[0].focus,1);
 let next=takeTurn(start,{type:'move',move:'gust'});assert.equal(next.party[0].focus,0);next=takeTurn(next,{type:'switch',index:1});assert.equal(next.activeP,1);next=takeTurn(next,{type:'switch',index:0});assert.equal(next.activeP,0);assert.equal(next.error,undefined);assert.equal(next.party[0].focus,0);
 let serpent=fight('sunserpent',20,'stonegolem_3',10).b;
 for(let i=0;i<3;i++)serpent=takeTurn(serpent,{type:'move',move:'glint'});
 assert.equal(serpent.party[0].energy,3);assert.equal(serpent.party[0].battleTrait.cycle,0);assert.ok(serpent.log.some(l=>l.includes('三道星光')));
});
test('battle-only trait counters are validated, preserved on suspend and removed on settlement',()=>{
 const {g,b}=fight('dewslime');b.party[0].battleTrait.veilUsed=true;const restored=readEnvelope(saveEnvelope(checkpointGame(g,b)));assert.deepEqual(restored.suspendedBattle.party[0].battleTrait,b.party[0].battleTrait);
 for(const bad of [{cycle:99},{...b.party[0].battleTrait,swift:'yes'},null]){const broken=clone(b);broken.party[0].battleTrait=bad;assert.throws(()=>readEnvelope(saveEnvelope(checkpointGame(g,broken))));}
 b.outcome='win';assert.equal(settleBattle(g,b).game.party[0].battleTrait,undefined);const legacy=clone(b);delete legacy.party[0].battleTrait;delete legacy.outcome;assert.doesNotThrow(()=>readEnvelope(saveEnvelope(checkpointGame(g,legacy))));
});

test('coastal defenses select attack elements and the light sail only amplifies priority attacks',()=>{
 for(const id of ['frostotter','frostotter_2','frostotter_3','glassbeetle','glassbeetle_2','glassbeetle_3']){
  const mon=createMon(id,30),resists=id.startsWith('frostotter')?['tide','frost']:['light','volt'];
  for(const element of ['moss','ember','tide','frost','stone','light','volt',null])assert.equal(incomingTrait(mon,'clear',stats(mon).hp,{element}),resists.includes(element)?.8:1);
 }
 const squid=createMon('kitesquid_2',30),target=createMon('pebble_2',30);target.hp--;
 assert.equal(outgoingTrait(squid,target,{priority:1},stats(target).hp),1.18);assert.equal(outgoingTrait(squid,target,{priority:0},stats(target).hp),1);
 const g=createGame();g.party=[squid];g.seed=9;const b=makeBattle(g,[target]);const expected=estimateDamage(b.party[0],b.enemies[0],'gust');
 const next=takeTurn(b,{type:'move',move:'gust'}),event=next.events.find(e=>e.kind==='attack'&&e.source===squid.uid);
 assert.ok(event.damage>=Math.floor(expected*.92)&&event.damage<=Math.ceil(expected*1.08));
});
test('clockmouse recovers three guard energy on either team, capped at five after suspend',()=>{
 const {g,b}=fight('clockmouse_2',25,'clockmouse_2',25);b.party[0].energy=0;b.enemies[0].energy=0;b.enemyPlan={actor:b.enemies[0].uid,action:{type:'guard'},label:'守势',reason:'恢复能量'};
 const next=takeTurn(b,{type:'guard'});assert.equal(next.party[0].energy,3);assert.equal(next.enemies[0].energy,3);assert.ok(next.log.some(l=>l.includes('续拍')));
 const restored=readEnvelope(saveEnvelope(checkpointGame(g,next))).suspendedBattle;
 const again=takeTurn(restored,{type:'guard'});assert.equal(again.party[0].energy,5);
});
