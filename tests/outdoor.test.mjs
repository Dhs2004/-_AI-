import test from 'node:test';
import assert from 'node:assert/strict';
import {OUTDOOR_AREAS} from '../dist/js/outdoor-areas.js';
import {makeMap,canWalk,nearest,isGone} from '../dist/js/world.js';
import {outdoorSite} from '../dist/js/outdoor-engine.js';
import {createGame,saveEnvelope,readEnvelope} from '../dist/js/engine.js';

test('24 distinct outdoor areas connect bidirectionally, preserving safe entrances and quest clearings',()=>{
 const layouts=new Set();
 for(let r=0;r<8;r++)for(const a of OUTDOOR_AREAS[r].areas){assert.equal(a.layout.length,38);assert.ok(a.layout.every(row=>row.length===56&&/^[#~.:=,]+$/.test(row)));layouts.add(a.layout.join(''));
  for(const exit of a.exits){if(typeof exit.to==='number')assert.ok(OUTDOOR_AREAS[r].areas[exit.to].exits.some(e=>e.to===a.id));assert.ok(['.',':','=',','].includes(a.layout[exit.y][exit.x]));}
  for(const [id,site] of Object.entries(a.sites)){assert.equal(outdoorSite(r,id).sector,a.id);for(let y=site.y-2;y<=site.y+2;y++)for(let x=site.x-3;x<=site.x+3;x++)assert.ok(['.',':','=',','].includes(a.layout[y][x]));}
 }
 assert.equal(layouts.size,24);
});

test('runtime outdoor additions remain reachable and do not repeat pickup identities across areas',()=>{
 for(let r=0;r<8;r++){
  const ids=new Set(),g=createGame();g.region=r;g.place='route';
  for(let sector=0;sector<3;sector++){
   const map=makeMap(r,'route',0,sector),queue=[[map.entry.x,map.entry.y]],seen=new Set([queue[0].join(',')]);g.routeSector=sector;assert.ok(canWalk(map,g,...queue[0]));
   for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(seen.has(key)||!canWalk(map,g,nx,ny))continue;seen.add(key);queue.push([nx,ny]);}}
   for(const object of map.objects){assert.ok(!ids.has(object.id),object.id);ids.add(object.id);if(!object.action||isGone(g,object))continue;assert.ok(queue.some(([x,y])=>nearest(map,{...g,x,y})?.id===object.id),`${r}/${sector}/${object.id} cannot be selected`);}
  }
  for(let i=9;i<=22;i++)assert.ok(ids.has(`${r}-route-${i}`),'legacy pickup identity '+i);
 }
});

test('larger route coordinates and area identities round-trip through saves; malformed areas are rejected',()=>{
 const g=createGame();g.place='route';g.routeSector=2;g.x=49;g.y=33;const restored=readEnvelope(saveEnvelope(g));assert.equal(restored.routeSector,2);assert.equal(restored.x,49);assert.equal(restored.y,33);
 delete g.routeSector;assert.equal(readEnvelope(saveEnvelope(g)).routeSector,0);
 for(const sector of [-1,3,1.5,'1']){g.routeSector=sector;assert.throws(()=>readEnvelope(saveEnvelope(g)));}
});
