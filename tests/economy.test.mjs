import test from 'node:test';
import assert from 'node:assert/strict';
import {ITEMS} from '../dist/js/data.js';
import {createGame,saveEnvelope,readEnvelope} from '../dist/js/engine.js';
import {SHOP_STOCK,purchaseQuote,purchaseItem,craftQuote,craftItem} from '../dist/js/economy.js';

test('batch purchases charge the displayed total, preserve previous state and survive saves',()=>{
 const before=createGame(),quote=purchaseQuote(before,'potion',5),after=purchaseItem(before,'potion',5);
 assert.equal(quote.total,325);assert.equal(after.gold,225);assert.equal(after.bag.potion,13);assert.equal(before.gold,550);assert.equal(before.bag.potion,8);
 assert.deepEqual(readEnvelope(saveEnvelope(after)).bag,after.bag);assert.equal(readEnvelope(saveEnvelope(after)).gold,225);
});
test('craft batches consume all required ingredients exactly once and match displayed yield',()=>{
 const g=createGame();g.bag.herb=21;g.bag.shard=5;const q=craftQuote(g,'superpotion',5),after=craftItem(g,'superpotion',5);
 assert.equal(q.output,5);assert.equal(q.max,5);assert.equal(after.bag.superpotion,5);assert.equal(after.bag.herb,1);assert.equal(after.bag.shard,0);assert.equal(g.bag.herb,21);
 assert.throws(()=>craftItem(after,'superpotion',1));assert.equal(after.bag.herb,1);
 const pair=craftItem({...g,bag:{...g.bag,herb:10}},'potion',5);assert.equal(pair.bag.potion,g.bag.potion+10);assert.equal(pair.bag.herb,0);
});
test('insufficient funds/materials, invalid amounts and inventory overflow never mutate a game',()=>{
 const g=createGame(),snapshot=JSON.stringify(g);
 for(const count of [0,-1,1.5,100,NaN]){assert.throws(()=>purchaseItem(g,'potion',count));assert.throws(()=>craftItem(g,'potion',count));}
 assert.throws(()=>purchaseItem(g,'superpotion',5));assert.throws(()=>purchaseItem(g,'missing'));assert.throws(()=>craftItem(g,'missing'));assert.throws(()=>craftItem(g,'revive'));
 assert.equal(JSON.stringify(g),snapshot);
 const full={...g,gold:999999,bag:{...g.bag,potion:9998,herb:20}};
 assert.equal(purchaseQuote(full,'potion',5).ok,false);assert.equal(craftQuote(full,'potion',1).ok,false);assert.throws(()=>purchaseItem(full,'potion',5));assert.equal(full.bag.potion,9998);
});
test('depleted expedition materials can be replenished at their declared shop prices',()=>{
 let g=createGame();g.bag.herb=0;g.bag.shard=0;
 for(const id of ['herb','shard']){assert.ok(SHOP_STOCK.includes(id));const before=g.gold;g=purchaseItem(g,id,1);assert.equal(g.gold,before-ITEMS[id].price);assert.equal(g.bag[id],1);}
});
