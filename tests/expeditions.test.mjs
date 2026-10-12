import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPEDITIONS} from '../dist/js/expedition-stories.js';
import {CHAPTERS,ITEMS,SPECIES} from '../dist/js/data.js';
import {advanceExpedition,expeditionProgress,currentExpeditionStage,EXPEDITION_SITES,expeditionScene} from '../dist/js/expedition-engine.js';
import {createGame,createMon,makeBattle,settleBattle,checkpointGame,saveEnvelope,readEnvelope} from '../dist/js/engine.js';
import {makeMap,canWalk,isGone,nearest} from '../dist/js/world.js';

function completeInput(stage){return {victory:true,choice:0,sequence:stage.answer};}
function journeyAt(expedition,step){const g=createGame();g.region=expedition.region;g.expeditions[expedition.id]={step,choices:Object.fromEntries(expedition.stages.slice(0,step).filter(s=>s.kind==='choice').map(s=>[s.id,0]))};g.bag.herb=10;g.bag.shard=10;return g;}

test('24 regional expeditions contain valid staged objectives, fair clues and complete rewards',()=>{
 assert.equal(EXPEDITIONS.length,24);assert.equal(EXPEDITIONS.reduce((n,e)=>n+e.stages.length,0),144);
 const ids=new Set();for(const e of EXPEDITIONS){assert.ok(!ids.has(e.id));ids.add(e.id);assert.ok(CHAPTERS[e.region]);assert.ok(e.stages.length>=5);assert.ok(e.stages.some(s=>s.kind==='battle'));assert.equal(new Set(e.stages.map(s=>s.id)).size,e.stages.length);
  for(const s of e.stages){assert.ok(EXPEDITION_SITES[s.site]);assert.ok(s.lines.length>=2);if(s.team)assert.ok(s.team.every(id=>SPECIES[id]));if(s.kind==='sequence'){assert.ok(s.clue.length>10);assert.deepEqual([...s.answer].sort(),s.symbols.map((_,i)=>i));}if(s.item)assert.ok(ITEMS[s.item]&&s.amount>0);if(s.choices)assert.ok(s.choices.length>=2&&s.choices.every(c=>c.reply.length>=2));}
  for(const [id,n] of Object.entries(e.reward.items))assert.ok(ITEMS[id]&&n>0);
 }
});

test('all 144 objectives remain reachable and individually interactable as characters move',()=>{
 for(const expedition of EXPEDITIONS)for(let step=0;step<expedition.stages.length;step++){
  const g=journeyAt(expedition,step),stage=expedition.stages[step];g.place=EXPEDITION_SITES[stage.site].place;
  const map=makeMap(g.region,g.place),start=g.place==='town'?[18,19]:[6,16],queue=[start],visited=new Set([start.join(',')]);
  while(queue.length){const [x,y]=queue.shift();for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(visited.has(key)||!canWalk(map,g,nx,ny))continue;visited.add(key);queue.push([nx,ny]);}}
  const target=map.objects.find(o=>o.expedition===expedition.id&&o.stage===step);assert.ok(target&&!isGone(g,target));
  const accessible=[...visited].some(key=>{const [x,y]=key.split(',').map(Number);return nearest(map,{...g,x,y})?.id===target.id;});assert.ok(accessible,`${expedition.id}/${stage.id} cannot be selected`);
  assert.equal(map.objects.filter(o=>o.expedition===expedition.id&&!isGone(g,o)).length,1);
 }
});

test('stages, choices, delivery and completion rewards survive every save boundary exactly once',()=>{
 for(const expedition of EXPEDITIONS){let g=journeyAt(expedition,0),gold=g.gold;for(const stage of expedition.stages){const before=JSON.stringify(g),result=advanceExpedition(g,expedition.id,stage.id,completeInput(stage));assert.equal(JSON.stringify(g),before);g=readEnvelope(saveEnvelope(result.game));assert.ok(g.expeditions[expedition.id].step>0);for(const scene of g.pendingScenes)assert.ok(expeditionScene(g,scene));g.pendingScenes=[];}
  assert.equal(g.flags[`fragment${expedition.region}-${expedition.fragment}`],true);assert.equal(g.gold,gold+expedition.reward.gold);const repeat=advanceExpedition(g,expedition.id,expedition.stages.at(-1).id,{});assert.equal(repeat.alreadyComplete,true);assert.deepEqual(repeat.game,g);
 }
});

test('wrong puzzle answers, insufficient materials and out-of-order stages cannot grant progress',()=>{
 for(const e of EXPEDITIONS)for(let i=0;i<e.stages.length;i++){const s=e.stages[i],g=journeyAt(e,i),before=JSON.stringify(g);assert.throws(()=>advanceExpedition(g,e.id,'missing',{}));if(['battle','choice','sequence'].includes(s.kind))assert.throws(()=>advanceExpedition(g,e.id,s.id,{}));assert.equal(JSON.stringify(g),before);if(s.kind==='delivery'){g.bag[s.item]=0;assert.throws(()=>advanceExpedition(g,e.id,s.id,{}));assert.equal(expeditionProgress(g,e.id).step,i);}}
});

test('expedition battle saves resume the correct objective; victory advances and defeat does not',()=>{
 const e=EXPEDITIONS[0],step=e.stages.findIndex(s=>s.kind==='battle'),stage=e.stages[step],g=journeyAt(e,step);g.place='route';
 const b=makeBattle(g,[createMon(stage.team[0],5)],{kind:'trainer',expedition:e.id,stage:stage.id});
 const resumed=readEnvelope(saveEnvelope(checkpointGame(g,b)));assert.equal(resumed.suspendedBattle.context.stage,stage.id);
 const bad=checkpointGame(g,b);bad.suspendedBattle.context.stage='missing';assert.throws(()=>readEnvelope(saveEnvelope(bad)));
 const win=settleBattle(g,{...b,outcome:'win'}).game;assert.equal(expeditionProgress(win,e.id).step,step+1);
 const loss=settleBattle(g,{...b,outcome:'lose'}).game;assert.equal(expeditionProgress(loss,e.id).step,step);assert.equal(loss.place,'town');
});

test('older fragment and badge saves remain completed without granting new rewards',()=>{
 const g=createGame(),e=EXPEDITIONS[0];delete g.expeditions;delete g.trackedExpedition;g.flags['fragment0-0']=true;const loaded=readEnvelope(saveEnvelope(g));assert.equal(currentExpeditionStage(loaded,e.id),null);assert.equal(advanceExpedition(loaded,e.id,'brief').game.gold,g.gold);
 for(const mutate of [g=>g.expeditions={invalid:{step:0,choices:{}}},g=>g.expeditions.exp0a={step:999,choices:{}},g=>g.expeditions.exp0a={step:0,choices:{sign:0}},g=>g.trackedExpedition='invalid']){const bad=createGame();mutate(bad);assert.throws(()=>readEnvelope(saveEnvelope(bad)));}
});
