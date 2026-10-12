import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createMon,stats,makeBattle,takeTurn,estimateDamage,saveEnvelope,readEnvelope} from '../dist/js/engine.js';
import {equipCompanion} from '../dist/js/equipment.js';
import {ITEMS} from '../dist/js/data.js';

test('keepsakes trade real combat stats while preserving legacy charm effects',()=>{
 const mon=createMon('embercat_3',35),base=stats(mon),target=createMon('mossdeer_3',35);
 assert.equal(stats({...mon,equip:'emberCharm'}).atk,Math.floor(base.atk*1.12));assert.equal(stats({...mon,equip:'heartCharm'}).hp,Math.floor(base.hp*1.15));
 for(const id of ['voyageCharm','harborCharm','hearthCharm','horizonCharm']){const values=Object.values(ITEMS[id].modifiers);assert.ok(values.some(n=>n>1));assert.ok(values.some(n=>n<1));}
 const damage=estimateDamage(mon,target,'spark');assert.ok(estimateDamage({...mon,equip:'voyageCharm'},target,'spark')>damage);assert.ok(estimateDamage({...mon,equip:'hearthCharm'},target,'spark')<damage);
 assert.ok(stats({...mon,equip:'horizonCharm'}).spd>base.spd);assert.ok(stats({...mon,equip:'horizonCharm'}).hp<base.hp);
 const g=createGame();g.party=[mon];g.party[0].equip='harborCharm';const before=makeBattle(g,[target]);assert.equal(stats(before.party[0]).def,stats({...mon,equip:'harborCharm'}).def);assert.ok(takeTurn(before,{type:'guard'}).party[0].hp<=before.party[0].hp);
});

test('equipment transfers are atomic, survive saves and cannot turn equip/remove cycling into healing',()=>{
 let g=createGame();g.party[0].hp=31;g.bag.heartCharm=1;g.bag.horizonCharm=1;const uid=g.party[0].uid,original=JSON.stringify(g);
 const equipped=equipCompanion(g,uid,'heartCharm');assert.equal(JSON.stringify(g),original);assert.equal(equipped.bag.heartCharm,0);
 g=readEnvelope(saveEnvelope(equipped));assert.equal(g.party[0].equip,'heartCharm');g=equipCompanion(g,uid,null);assert.ok(g.party[0].hp<=31);assert.equal(g.bag.heartCharm,1);
 const start=g.party[0].hp;for(let i=0;i<20;i++){g=equipCompanion(g,uid,'heartCharm');g=equipCompanion(g,uid,'horizonCharm');g=equipCompanion(g,uid,null);}assert.ok(g.party[0].hp<=start);assert.ok(g.party[0].hp>0);assert.equal(g.bag.heartCharm,1);assert.equal(g.bag.horizonCharm,1);
 g.party[0].hp=0;g=equipCompanion(g,uid,'heartCharm');assert.equal(g.party[0].hp,0);
});

test('reserve equipment works and invalid changes cannot consume or duplicate inventory',()=>{
 const g=createGame();g.reserve=[createMon('pebble',8)];g.bag.shellCharm=1;const id=g.reserve[0].uid;
 const next=equipCompanion(g,id,'shellCharm');assert.equal(next.reserve[0].equip,'shellCharm');assert.equal(next.bag.shellCharm,0);assert.equal(g.reserve[0].equip,null);assert.equal(equipCompanion(next,id,'shellCharm'),next);
 for(const [uid,item] of [[id,'potion'],[id,'heartCharm'],['missing','shellCharm']])assert.throws(()=>equipCompanion(g,uid,item));
 const capped={...next,bag:{...next.bag,shellCharm:9999}};assert.throws(()=>equipCompanion(capped,id,null));assert.equal(capped.reserve[0].equip,'shellCharm');
 g.suspendedBattle=makeBattle(g,[createMon('pebble',2)]);assert.throws(()=>equipCompanion(g,id,'shellCharm'));
});
