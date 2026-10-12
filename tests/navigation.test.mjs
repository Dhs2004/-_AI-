import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../dist/js/engine.js';
import {makeMap,canWalk,nearest} from '../dist/js/world.js';
import {navigationField,pathFromField,pathToObject,chartMarkers} from '../dist/js/navigation.js';
import {chartMarkup,selectedChartMarkup} from '../dist/js/chart-view.js';
import {turnRune} from '../dist/js/dungeon-engine.js';

function located(region,place,depth=0,sector=0){
 const game=createGame('航图测试','budfox');Object.assign(game,{region,place,dungeonFloor:depth,routeSector:sector});
 const map=makeMap(region,place,depth,sector);Object.assign(game,map.entry||{x:18,y:19});return {map,game};
}
function checkRoute(map,game,path){let [x,y]=[game.x,game.y];for(const [nx,ny] of path){assert.equal(Math.abs(nx-x)+Math.abs(ny-y),1);assert.ok(canWalk(map,game,nx,ny));[x,y]=[nx,ny];}}

test('all64 area charts use legal paths that end at the selected real interaction',()=>{
 let maps=0,reachable=0,blocked=0;
 for(let region=0;region<8;region++)for(const [place,count] of [['town',1],['route',3],['dungeon',4]])for(let index=0;index<count;index++){
  const {map,game}=located(region,place,place==='dungeon'?index:0,place==='route'?index:0),field=navigationField(map,game);maps++;
  assert.deepEqual(pathFromField(field,game.x,game.y),[]);
  for(const marker of chartMarkers(map,game)){
   const path=pathToObject(field,marker);if(path===null){blocked++;continue;}reachable++;checkRoute(map,game,path);
   const [x,y]=path.at(-1)||[game.x,game.y];assert.equal(nearest(map,{...game,x,y})?.id,marker.id);
   assert.equal(field.distance[y*map.width+x],path.length);
  }
 }
 assert.equal(maps,64);assert.ok(reachable>500);assert.ok(blocked>0,'sealed parts must not be treated as reachable');
});

test('closed dungeon gates block routes and their real rune solution unlocks them',()=>{
 const {map,game}=located(0,'dungeon');const exit=map.objects.find(o=>o.action==='stairs'&&o.direction==='forward');
 assert.equal(pathToObject(navigationField(map,game),exit),null);
 let solved=game;for(const gate of map.objects.filter(o=>o.action==='seal'))for(const requirement of gate.requires){const rune=map.objects.find(o=>o.id===requirement.rune);while((solved.runes[rune.id]||0)!==requirement.value)solved=turnRune(solved,rune,map.objects.filter(o=>o.action==='seal')).game;}
 const path=pathToObject(navigationField(map,solved),exit);assert.ok(path?.length);checkRoute(map,solved,path);
 assert.equal(chartMarkers(map,solved).find(m=>m.action==='seal').status,'封门已开启');
});

test('chart tracks actual pickups, story stages and completion without mutating saves',()=>{
 const {map,game}=located(0,'town'),before=JSON.stringify(game),initial=chartMarkers(map,game);
 assert.equal(JSON.stringify(game),before);assert.ok(initial.some(m=>m.action==='campfire'));assert.ok(initial.some(m=>m.action==='expedition'));
 const chest=initial.find(m=>m.action==='chest');game.collected[chest.id]=true;assert.ok(!chartMarkers(map,game).some(m=>m.id===chest.id));assert.equal(pathToObject(navigationField(map,game),chest),null);
 const story=initial.find(m=>m.action==='side-story');game.stories={[story.story]:0};assert.equal(chartMarkers(map,game).find(m=>m.id===story.id).status,'回忆已收好');
 const expedition=initial.find(m=>m.action==='expedition');game.trackedExpedition=expedition.expedition;assert.equal(chartMarkers(map,game)[0].id,expedition.id);
 const html=chartMarkup(map,game,chartMarkers(map,game));assert.match(html,/随身地图/);assert.match(html,/data-chart-filter/);assert.match(html,/不会自动拾取/);
 assert.match(selectedChartMarkup(chest,null),/disabled/);assert.match(selectedChartMarkup(chest,[]),/已经来到附近/);
});

test('blocked and invalid cells have no route; adjacent services require no extra walking',()=>{
 const {map,game}=located(0,'town');Object.assign(game,{x:11,y:16});const field=navigationField(map,game),healer=map.objects.find(o=>o.action==='heal');
 assert.deepEqual(pathToObject(field,healer),[]);
 for(const [x,y] of [[-1,1],[map.width,5],[2,-1],[5,map.height],[2.5,3],[NaN,1],[0,0],[healer.x,healer.y]])assert.equal(pathFromField(field,x,y),null);
 const route=pathFromField(field,18,17);assert.ok(route.length);checkRoute(map,game,route);
});
