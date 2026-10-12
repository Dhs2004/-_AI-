import test from 'node:test';
import assert from 'node:assert/strict';
import {DUNGEONS} from '../dist/js/dungeons.js';
import {gateIsOpen,turnRune,rawDungeonWalkable,adaptDungeon} from '../dist/js/dungeon-engine.js';
import {CHAPTERS,SPECIES,ITEMS} from '../dist/js/data.js';
import {makeMap,canWalk} from '../dist/js/world.js';
import {createGame,readEnvelope,saveEnvelope} from '../dist/js/engine.js';

function flood(floor,blocked=[]){const q=[floor.entry],seen=new Set([`${floor.entry.x},${floor.entry.y}`]),walls=new Set(blocked.map(o=>`${o.x},${o.y}`));while(q.length){const {x,y}=q.shift();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(seen.has(key)||walls.has(key)||!rawDungeonWalkable(floor,nx,ny))continue;seen.add(key);q.push({x:nx,y:ny});}}return seen;}
test('32 authored floors have valid dimensions, unique objects, species, items and proper entries',()=>{assert.equal(DUNGEONS.length,8);const ids=new Set();for(const d of DUNGEONS){assert.equal(d.floors.length,4);for(const f of d.floors){assert.equal(f.layout.length,32);assert.ok(f.layout.every(row=>row.length===48&&/^[#.~=]+$/.test(row)));assert.ok(rawDungeonWalkable(f,f.entry.x,f.entry.y));assert.ok(rawDungeonWalkable(f,f.exit.x,f.exit.y));for(const o of f.objects){assert.ok(!ids.has(o.id),o.id);ids.add(o.id);assert.ok(rawDungeonWalkable(f,o.x,o.y),o.id);if(o.team)for(const id of o.team)assert.ok(SPECIES[id],id);if(o.loot)for(const id of Object.keys(o.loot))assert.ok(ITEMS[id],id);}}}});
test('each lock requires the puzzle; all its clues/runes are reachable before unlocking',()=>{for(const d of DUNGEONS)for(const f of d.floors){const gates=f.objects.filter(o=>o.kind==='gate'),locked=flood(f,gates),unlocked=flood(f);const exit=`${f.exit.x},${f.exit.y}`;assert.ok(unlocked.has(exit),f.name+' never reaches exit');if(gates.length){assert.ok(!locked.has(exit),f.name+' bypasses gate');for(const o of f.objects.filter(o=>['rune','lore'].includes(o.kind)))assert.ok(locked.has(`${o.x},${o.y}`),o.id+' cannot be read before gate');}}});
test('NPCs and objects do not create accidental corridor deadlocks',()=>{for(const d of DUNGEONS)for(const f of d.floors){const reachable=flood(f,f.objects.filter(o=>o.kind!=='gate'));assert.ok(reachable.has(`${f.exit.x},${f.exit.y}`),f.name);for(const o of f.objects){assert.ok([...reachable].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-o.x,y-o.y)<2.2;}),o.id);}}});
test('all 24 rune combinations are solvable, gates latch open and input state stays untouched',()=>{for(const d of DUNGEONS)for(const f of d.floors){const gates=f.objects.filter(o=>o.kind==='gate');if(!gates.length)continue;const initial={runes:{},openGates:{}},gate=gates[0];let state=initial;assert.equal(gateIsOpen(state,gate),false);for(const r of gate.requires){const rune=f.objects.find(o=>o.id===r.rune);assert.ok(rune);for(let n=0;n<r.value;n++)state=turnRune(state,rune,gates).game;}assert.equal(gateIsOpen(state,gate),true);assert.equal(state.openGates[gate.id],true);const changed=turnRune(state,f.objects.find(o=>o.kind==='rune'),gates).game;assert.equal(gateIsOpen(changed,gate),true);assert.deepEqual(initial,{runes:{},openGates:{}});}});
test('dungeon adaptor places stairs, and only final floor gets the warden',()=>{for(const d of DUNGEONS)for(let depth=0;depth<4;depth++){const map=adaptDungeon(d.region,depth,CHAPTERS[d.region],d.floors[depth]);assert.equal(map.width,48);assert.equal(map.height,32);assert.equal(map.objects.filter(o=>o.action==='boss').length,depth===3?1:0);assert.equal(map.objects.filter(o=>o.action==='stairs').length,depth===3?1:2);}});

function runtimeFlood(map,game){
 const queue=[map.entry],seen=new Set([`${map.entry.x},${map.entry.y}`]);
 for(let i=0;i<queue.length;i++){const {x,y}=queue[i];for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(seen.has(key)||!canWalk(map,game,nx,ny))continue;seen.add(key);queue.push({x:nx,y:ny});}}
 return seen;
}
function canInteractFrom(seen,o){return [...seen].some(k=>{const [x,y]=k.split(',').map(Number);return Math.hypot(x-o.x,y-o.y)<2.2;});}
test('all 32 runtime maps preserve puzzle locks, reachability and safe return stairs with story NPCs',()=>{
 for(let region=0;region<8;region++)for(let depth=0;depth<4;depth++){
  const map=makeMap(region,'dungeon',depth);let game=createGame();game.region=region;game.place='dungeon';game.dungeonFloor=depth;
  assert.ok(canWalk(map,game,map.entry.x,map.entry.y),`${map.floorName} entry`);
  const locked=runtimeFlood(map,game),gates=map.objects.filter(o=>o.action==='seal');
  if(depth===0)assert.equal(map.objects.filter(o=>o.action==='side-story').length,1);
  for(const o of map.objects.filter(o=>['rune','dungeon-lore','side-story'].includes(o.action)))assert.ok(canInteractFrom(locked,o),`${o.id} not reachable before gate`);
  if(gates.length)assert.ok(!locked.has(`${map.exit.x},${map.exit.y}`),`${map.floorName} bypass`);
  for(const gate of gates)for(const requirement of gate.requires){const rune=map.objects.find(o=>o.id===requirement.rune);while((game.runes[rune.id]||0)!==requirement.value)game=turnRune(game,rune,gates).game;}
  const opened=runtimeFlood(map,game);
  for(const o of map.objects.filter(o=>o.action))assert.ok(canInteractFrom(opened,o),`${o.id} blocked at runtime`);
  if(depth<3)assert.ok(opened.has(`${map.exit.x},${map.exit.y}`),`${map.floorName} return spawn`);
  game.x=map.entry.x;game.y=map.entry.y;const restored=readEnvelope(saveEnvelope(game));
  assert.deepEqual(restored.runes,game.runes);assert.deepEqual(restored.openGates,game.openGates);
  assert.equal(restored.dungeonFloor,depth);assert.ok(canWalk(makeMap(region,'dungeon',depth),restored,restored.x,restored.y));
 }
});
