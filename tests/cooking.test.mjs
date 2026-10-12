import test from 'node:test';
import assert from 'node:assert/strict';
import {MEALS,INGREDIENTS} from '../dist/js/cooking-data.js';
import {ITEMS,MOVES} from '../dist/js/data.js';
import {learnRecipe,recipeLearned,cookingQuote,cookMeal,packMeal,mealCaptureFactor} from '../dist/js/cooking.js';
import {cookingMarkup,cookingLessonMarkup} from '../dist/js/cooking-view.js';
import {purchaseItem,SHOP_STOCK} from '../dist/js/economy.js';
import {createGame,createMon,makeBattle,takeTurn,stats,moveList,random,battleExperience,settleBattle,checkpointGame,saveEnvelope,readEnvelope} from '../dist/js/engine.js';
import {createBattlePlayback} from '../dist/js/battle-playback.js';
import {drawItemIcon} from '../dist/js/item-icons.js';
const planned=(b,action)=>({...b,enemyPlan:{actor:b.enemies[b.activeE].uid,action}});
const guard=b=>planned(b,{type:'guard'});
function setup(id,species='stonegolem_3',enemy='pebble_3'){
 let game=createGame();game.seed=4149;game.party=[createMon(species,40),createMon('frostotter_3',40)];game.bag[id]=3;game=packMeal(game,id);
 return {game,battle:makeBattle(game,[createMon(enemy,40)],{kind:'trainer',name:'餐盒验证'})};
}

test('eight island lessons grant one sample once; choices survive saves and unseen islands stay hidden',()=>{
 assert.equal(MEALS.length,8);let game=createGame();
 assert.doesNotMatch(cookingMarkup(game),/归航星屑糕|灯下慢炖/);
 for(const r of MEALS){
  game.region=r.region;game.flags['entered'+r.region]=true;
  for(const c of [0,1]){const before=structuredClone(game),result=learnRecipe(before,r.id,c);assert.equal(before.cookingLessons[r.id],undefined);assert.equal(result.game.bag[r.id],1);assert.equal(recipeLearned(result.game,r.id),true);const restored=readEnvelope(saveEnvelope(result.game));assert.equal(restored.cookingLessons[r.id],c);assert.match(cookingLessonMarkup(restored,r.id),new RegExp(r.choices[c].reply));assert.deepEqual(learnRecipe(restored,r.id,1-c).game,restored);}
  game=learnRecipe(game,r.id,0).game;
 }
 assert.equal(Object.keys(game.cookingLessons).length,8);
 const fresh=createGame(),full={...fresh,bag:{...fresh.bag,fruitparcel:9999}};assert.throws(()=>learnRecipe(full,'fruitparcel',0),/背包/);assert.equal(full.cookingLessons.fruitparcel,undefined);
 assert.throws(()=>learnRecipe(fresh,'starcake',0),/城镇/);assert.throws(()=>learnRecipe({...fresh,place:'route'},'fruitparcel',0));assert.throws(()=>learnRecipe(fresh,'fruitparcel',2));
});
test('food shopping, recipe costs and batches are exact, atomic and cannot exceed inventory capacity',()=>{
 let game=createGame();game.gold=10000;
 for(const [id,item] of Object.entries(INGREDIENTS)){assert.ok(SHOP_STOCK.includes(id));const before=game.gold;game=purchaseItem(game,id,5);assert.equal(before-game.gold,item.price*5);}
 for(const r of MEALS){
  const g={...game,region:r.region,cookingLessons:{[r.id]:0},bag:{...game.bag,...Object.fromEntries(Object.keys(r.needs).map(k=>[k,20]))}},snap=JSON.stringify(g),q=cookingQuote(g,r.id,3),made=cookMeal(g,r.id,3);
  assert.equal(q.ok,true);assert.equal(made.bag[r.id],3);assert.equal(JSON.stringify(g),snap);for(const [id,n] of Object.entries(r.needs))assert.equal(made.bag[id],20-n*3);
  assert.throws(()=>cookMeal({...g,bag:{...g.bag,[r.id]:9998}},r.id,3));assert.throws(()=>cookMeal({...g,cookingLessons:{}},r.id));
  assert.throws(()=>purchaseItem(game,r.id));
 }
 for(const n of [0,-1,100,1.5,NaN])assert.throws(()=>cookMeal(game,'fruitparcel',n));
});
test('packing does not consume; opening, suspend, resume and all outcomes consume exactly one meal',()=>{
 for(const outcome of ['win','capture','run','lose']){
  const {game,battle}=setup('harborbread'),original=JSON.stringify(game);assert.equal(game.bag.harborbread,3);assert.equal(battle.inventory.harborbread,2);assert.equal(JSON.stringify(game),original);
  const restored=readEnvelope(saveEnvelope(checkpointGame(game,battle)));assert.equal(restored.bag.harborbread,3);assert.equal(restored.suspendedBattle.inventory.harborbread,2);
  const after=takeTurn(guard(restored.suspendedBattle),{type:'guard'});assert.equal(after.inventory.harborbread,2);after.outcome=outcome;
  const settled=settleBattle(restored,after).game;assert.equal(settled.bag.harborbread,2);assert.equal(settled.packedMeal,null);assert.equal(makeBattle(settled,[createMon('pebble',5)]).meal,null);
  assert.throws(()=>packMeal(restored,null),/对战/);assert.throws(()=>cookMeal(restored,'harborbread'),/对战/);
 }
 const {game}=setup('fruitparcel');assert.equal(packMeal(game,null).bag.fruitparcel,3);assert.throws(()=>packMeal(createGame(),'fruitparcel'));
});
test('first-entry shield, focus, haste and regeneration affect both initial and replacement allies only once',()=>{
 for(const [id,field,start] of [['harborbread','shield',2],['embertoast','focus',1],['windcracker','haste',2],['snowbroth','regen',3]]){
  const {battle}=setup(id);assert.equal(battle.party[0][field],start);assert.equal(battle.party[1][field],0);assert.equal(battle.enemies[0][field],0);
  let next=takeTurn(guard(battle),{type:'switch',index:1});assert.ok(next.party[1][field]>0);assert.equal(next.meal.entered.length,2);
  next.party[0][field]=0;next=takeTurn(guard(next),{type:'switch',index:0});assert.equal(next.party[0][field],0);assert.equal(next.meal.entered.length,2);
  const doomed=structuredClone(battle);doomed.party[0].hp=1;doomed.party[0].status='poison';doomed.party[0].statusTurns=3;
  const replacement=takeTurn(guard(doomed),{type:'guard'});assert.equal(replacement.activeP,1);assert.equal(replacement.party[0].hp,0);assert.equal(replacement.party[1][field],start);
  const playback=createBattlePlayback(battle,takeTurn(guard(battle),{type:'switch',index:1}));assert.equal(playback.frames.at(-1).post.party[1][field],takeTurn(guard(battle),{type:'switch',index:1}).party[1][field]);
 }
 const {battle}=setup('snowbroth');battle.party[0].hp=60;const amount=Math.floor(stats(battle.party[0]).hp*.08);let next=battle;
 for(const left of [2,1,0]){next=takeTurn(guard(next),{type:'guard'});assert.equal(next.party[0].regen,left);}assert.equal(next.party[0].hp,60+amount*3);
});
test('meal haste changes actual initiative and focus is consumed by the first real attack',()=>{
 const {battle}=setup('windcracker','frostotter_3','voltkit_3');const ordinary=structuredClone(battle);ordinary.party[0].haste=0;
 const boosted=takeTurn(planned(battle,{type:'move',move:'static'}),{type:'move',move:'splash'}),normal=takeTurn(planned(ordinary,{type:'move',move:'static'}),{type:'move',move:'splash'});
 assert.equal(boosted.events[0].source,battle.party[0].uid);assert.equal(normal.events[0].source,battle.enemies[0].uid);
 const focused=setup('embertoast').battle;assert.equal(takeTurn(guard(focused),{type:'move',move:'stone'}).party[0].focus,0);
});
test('tea blocks one new status per ally after innate immunities, persists on switch and cannot cure existing status',()=>{
 for(const species of ['pebble_3','dewslime_3']){
  const {battle}=setup('mossbrew',species,'duskmoth_3');battle.enemies[0].loadout=['venom','shadow','bubble','nightmare'];
  let next=takeTurn(planned(battle,{type:'move',move:'venom'}),{type:'guard'});assert.equal(next.party[0].status,null);
  assert.equal(next.meal.wards.length,species==='dewslime_3'?0:1);
  if(species==='dewslime_3'){next=takeTurn(planned(next,{type:'move',move:'venom'}),{type:'guard'});assert.equal(next.party[0].status,null);assert.equal(next.meal.wards.length,1);}
  next.enemies[0].energy=5;next=takeTurn(planned(next,{type:'move',move:'venom'}),{type:'guard'});assert.equal(next.party[0].status,'poison');
  next=takeTurn(guard(next),{type:'switch',index:1});assert.equal(next.meal.wards.length,1);
 }
 const {game}=setup('mossbrew');game.party[0].status='burn';assert.equal(makeBattle(game,[createMon('pebble_3',40)]).party[0].status,'burn');
 // Force a successful 20% burn roll. Fire immunity must keep the food ward unused.
 const {battle}=setup('mossbrew','cinder_3','embercat_3');let seed;
 for(let i=1;i<10000;i++){const rng={seed:i};random(rng);random(rng);if(random(rng)<.2){seed=i;break;}}
 battle.seed=seed;const next=takeTurn(planned(battle,{type:'move',move:'spark'}),{type:'guard'});assert.equal(next.meal.wards.length,0);assert.match(next.log.join(' '),/容纳了这次灼伤/);
});
test('healing meals amplify only friendly active heals and medicine, while experience adds ten percent',()=>{
 const {battle}=setup('lanternstew','glowbud_3');battle.party[0].hp=1;
 const healed=takeTurn(guard(battle),{type:'move',move:'wish'});assert.equal(healed.party[0].hp,1+Math.floor(stats(battle.party[0]).hp*.42*1.2*1.2));
 const medicated=takeTurn(guard(battle),{type:'item',item:'potion'});assert.equal(medicated.party[0].hp,67);
 const fainted=structuredClone(battle);fainted.party[1].hp=0;assert.equal(takeTurn(guard(fainted),{type:'item',item:'revive',target:1}).party[1].hp,Math.ceil(stats(fainted.party[1]).hp*.5));
 const foe=structuredClone(battle);foe.enemies=[createMon('glowbud_3',40)];foe.enemies[0].hp=1;foe.activeE=0;const enemyHeals=takeTurn(planned(foe,{type:'move',move:'wish'}),{type:'guard'});assert.equal(enemyHeals.enemies[0].hp,1+Math.floor(stats(foe.enemies[0]).hp*.42*1.2));
 const {game,battle:xp}=setup('starcake');xp.outcome='win';const settled=settleBattle(game,xp).game;for(let i=0;i<2;i++)assert.equal(settled.party[i].xp,Math.floor(battleExperience(xp.party[i],xp.enemies,i===0)*1.1));
});
test('capture food respects the probability cap and changes an actual catch in the expected interval',()=>{
 const {game}=setup('fruitparcel');const meal=makeBattle(game,[createMon('pebble_3',40)]),plain=structuredClone(meal);plain.meal=null;meal.enemies[0].hp=plain.enemies[0].hp=Math.floor(stats(meal.enemies[0]).hp*.5);
 assert.equal(mealCaptureFactor(meal),1.18);const base=.22+.62*(1-meal.enemies[0].hp/stats(meal.enemies[0]).hp);
 let chosen;for(let seed=1;seed<10000;seed++){const roll=random({seed});if(roll>base&&roll<base*1.18){chosen=seed;break;}}assert.ok(chosen);meal.seed=plain.seed=chosen;
 assert.equal(takeTurn(guard(meal),{type:'capture',item:'orb'}).outcome,'capture');assert.notEqual(takeTurn(guard(plain),{type:'capture',item:'orb'}).outcome,'capture');
 meal.inventory.greatorb=1;meal.enemies[0].hp=1;let high;for(let seed=1;seed<100000;seed++)if(random({seed})>.96){high=seed;break;}meal.seed=high;
 assert.notEqual(takeTurn(guard(meal),{type:'capture',item:'greatorb'}).outcome,'capture');
});
test('meal state resumes identically, old saves migrate, and corrupt counts or repeated IDs are rejected',()=>{
 const {game,battle}=setup('snowbroth');const next=takeTurn(guard(battle),{type:'switch',index:1}),restored=readEnvelope(saveEnvelope(checkpointGame(game,next)));
 assert.deepEqual(takeTurn(restored.suspendedBattle,{type:'guard'}),takeTurn(next,{type:'guard'}));
 for(const corrupt of [b=>b.meal.entered.push(b.meal.entered[0]),b=>b.meal.wards.push('unknown'),b=>b.inventory.snowbroth++,b=>b.meal.id='missing',b=>b.meal=null]){const b=structuredClone(next);corrupt(b);assert.throws(()=>readEnvelope(saveEnvelope(checkpointGame(game,b))),/餐盒|料理/);}
 const old=createGame();delete old.cookingLessons;delete old.packedMeal;const olderBattle=makeBattle(old,[createMon('pebble',5)]);delete olderBattle.meal;const migrated=readEnvelope(saveEnvelope(checkpointGame(old,olderBattle)));assert.deepEqual(migrated.cookingLessons,{});assert.equal(migrated.packedMeal,null);assert.equal(migrated.suspendedBattle.meal,null);
});
test('all ingredient and dish icons draw bounded original pixels without allocating a canvas',()=>{
 const runs=[],ctx={save(){},restore(){},translate(){},scale(){},fillRect(x,y,w,h){runs.push([x,y,w,h]);assert.ok(x>=0&&y>=0&&x+w<=32&&y+h<=32);}};
 for(const id of [...Object.keys(INGREDIENTS),...MEALS.map(r=>r.id)]){runs.length=0;assert.equal(drawItemIcon(ctx,id),true);assert.ok(runs.length>10,id);}
});
