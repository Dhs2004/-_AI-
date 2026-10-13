import {canWalk,isGone,nearest} from './world.js';
import {gateIsOpen} from './dungeon-engine.js';

export const CHART_GROUPS={
 story:{name:'人物与故事',symbol:'◇',color:'#f2d598'},
 service:{name:'补给与休息',symbol:'+',color:'#9cd7b4'},
 exit:{name:'道路与出口',symbol:'↗',color:'#badde1'},
 challenge:{name:'切磋与守灯人',symbol:'⚔',color:'#e7a996'},
 discovery:{name:'见闻与行囊',symbol:'•',color:'#bcb5e2'},
 mechanism:{name:'遗迹机关',symbol:'✦',color:'#d7c298'}
};
const GROUP_FOR_ACTION={fishing:'discovery','ecology-trace':'discovery',expedition:'story',story:'story',companion:'story',quest:'story','side-story':'story',heal:'service',rest:'service',campfire:'service',craft:'service',shop:'service',travel:'exit',exit:'exit','outdoor-exit':'exit',gate:'exit',stairs:'exit',trainer:'challenge','dungeon-trainer':'challenge',boss:'challenge',trial:'challenge',chest:'discovery',resource:'discovery','dungeon-lore':'discovery','outdoor-lore':'discovery',relic:'mechanism',rune:'mechanism',seal:'mechanism'};

// One traversal per open chart. Walking and the animation loop never rebuild this field.
export function navigationField(map,game){
 const count=map.width*map.height,walkable=new Uint8Array(count),distance=new Int32Array(count).fill(-1),parent=new Int32Array(count).fill(-1),queue=new Int32Array(count);
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)walkable[y*map.width+x]=canWalk(map,game,x,y)?1:0;
 const start=game.y*map.width+game.x;
 if(!Number.isInteger(start)||game.x<0||game.y<0||game.x>=map.width||game.y>=map.height)return {map,game,walkable,distance,parent,start:-1};
 distance[start]=0;queue[0]=start;let head=0,tail=1;
 while(head<tail){const index=queue[head++],x=index%map.width,y=Math.floor(index/map.width);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=map.width||ny>=map.height)continue;const next=ny*map.width+nx;if(!walkable[next]||distance[next]>=0)continue;distance[next]=distance[index]+1;parent[next]=index;queue[tail++]=next;}}
 return {map,game,walkable,distance,parent,start};
}
export function pathFromField(field,x,y){
 const {map,distance,parent,start}=field;if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=map.width||y>=map.height)return null;
 let index=y*map.width+x;if(start<0||distance[index]<0)return null;const path=[];
 while(index!==start){path.push([index%map.width,Math.floor(index/map.width)]);index=parent[index];}return path.reverse();
}
export function pathToObject(field,object){
 if(isGone(field.game,object))return null;
 const candidates=[];
 for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
  if(Math.hypot(dx,dy)>=2.2)continue;const x=object.x+dx,y=object.y+dy,path=pathFromField(field,x,y);if(!path)continue;
  // End where E actually selects this object, not a neighbouring NPC or rune.
  if(nearest(field.map,{...field.game,x,y})?.id!==object.id)continue;
  candidates.push({path,proximity:Math.hypot(dx,dy)});
 }
 candidates.sort((a,b)=>a.path.length-b.path.length||a.proximity-b.proximity);return candidates[0]?.path??null;
}
export function chartMarkers(map,game){
 return map.objects.filter(o=>GROUP_FOR_ACTION[o.action]&&!isGone(game,o)).map(o=>{
  const group=GROUP_FOR_ACTION[o.action];let status='';
  if(o.action==='fishing'&&game.fishing?.claimed?.[o.spot])status='水岸记录已交换';
  if(o.action==='ecology-trace'&&game.ecologyTraces?.[o.family])status='踪迹已读懂';
  if(game.trainerWins?.[o.id])status='已切磋';
  if(o.relic&&game.relics?.[o.relic]?.solved)status='已修复';
  if(o.action==='seal')status=gateIsOpen(game,o)?'封门已开启':'封门尚未开启';
  if(o.action==='boss'&&game.badges.includes(game.region))status='星灯已点亮';
  if(o.action==='side-story'&&game.stories?.[o.story]!==undefined)status='回忆已收好';
  if(o.action==='quest'&&game.quest[o.quest]==='done')status='委托已完成';
  return {...o,group,status,tracked:o.action==='expedition'&&o.expedition===game.trackedExpedition};
 }).sort((a,b)=>Number(b.tracked)-Number(a.tracked)||Object.keys(CHART_GROUPS).indexOf(a.group)-Object.keys(CHART_GROUPS).indexOf(b.group));
}
