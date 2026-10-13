import {FISHING_SPOTS} from './fishing-data.js';
import {HABITATS} from './ecology.js';
import {CHAPTERS} from './data.js';
import {OUTDOOR_AREAS} from './outdoor-areas.js';
import {expeditionObjects} from './expedition-engine.js';
import {SIDE_STORIES} from './stories.js';

const WALKABLE=new Set(['.',':','=',',']);
export function outdoorArea(region,sector=0){return OUTDOOR_AREAS[region].areas[sector];}
export function outdoorSite(region,site){
 const area=OUTDOOR_AREAS[region].areas.find(a=>a.sites[site]);
 return area?{...area.sites[site],sector:area.id,name:area.name}:null;
}
export function adaptOutdoor(region,sector=0){
 const area=outdoorArea(region,sector),chapter=CHAPTERS[region],objects=[];
 const add=(kind,x,y,extra={})=>objects.push({kind,x,y,...extra});
 for(const [i,exit] of area.exits.entries())add(exit.to==='dungeon'?'portal':'sign',exit.x,exit.y,{id:`out${region}-${sector}-exit${i}`,action:exit.to==='dungeon'?'gate':'outdoor-exit',to:exit.to,label:exit.label});
 for(const [i,landmark] of area.landmarks.entries()){
  const dimensions=landmark.kind==='ruin'?{w:4,h:4,block:true}:['tree','pine'].includes(landmark.kind)?{w:2,h:3,block:true}:{};
  add(landmark.kind,landmark.x,landmark.y,{id:`out${region}-${sector}-art${i}`,...dimensions});
 }
 objects.push(...expeditionObjects(region,'route',sector));
 // Fixed authored terrain is authoritative; extra services never occupy a corridor.
 function place(kind,preferred,extra,shore=false){
  const candidates=[];
  for(let y=2;y<area.layout.length-2;y++)for(let x=2;x<area.layout[0].length-2;x++){
   if(![[0,0],[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>WALKABLE.has(area.layout[y+dy]?.[x+dx])))continue;
   if(objects.some(o=>Math.abs(o.x-x)<(o.block?3:2)&&Math.abs(o.y-y)<(o.block?3:2)))continue;
   if(shore&&!Array.from({length:7},(_,i)=>i-3).some(dy=>Array.from({length:7},(_,i)=>i-3).some(dx=>area.layout[y+dy]?.[x+dx]==='~')))continue;
   candidates.push({x,y,d:Math.hypot(preferred.x-x,preferred.y-y)});
  }
  candidates.sort((a,b)=>a.d-b.d);const point=candidates[0];
  if(!point)throw new Error('户外地图缺少安全放置空间：'+area.name);
  add(kind,point.x,point.y,extra);
 }
 for(const [i,lore] of area.lore.entries())place('sign',lore,{id:`out${region}-${sector}-lore${i}`,action:'outdoor-lore',label:lore.title,text:lore.text});
 for(const [i,cache] of area.caches.entries())place('chest',cache,{id:sector===0?`${region}-route-${9+i}`:`out${region}-${sector}-cache${i}`,action:'chest',label:'旅途中的旧行囊',loot:sector===0?(i?{herb:4,shard:3}:{greatorb:2,superpotion:2}):i?{shard:2,orb:1}:{potion:2,herb:1}});
 if(sector===0){
  const camp=area.sites['route-camp'];place('person',{x:camp.x,y:camp.y+3},{id:`${region}-route-8`,role:'healer',action:'rest',label:'营地旅人'});
  const story=SIDE_STORIES.find(s=>s.region===region&&s.place==='route');place('person',{x:camp.x-5,y:camp.y-2},{id:story.id,role:story.role,action:'side-story',story:story.id,label:story.giver});
 }
 if(sector<2)place('person',{x:area.entry.x+7,y:area.entry.y-4},{id:`${region}-route-${6+sector}`,role:sector?'warden':'rival',action:'trainer',trainer:sector,label:sector?'潮灵游侠 · 远山':'巡岛学徒 · 寻'});
 for(let i=0;i<12;i++)if(i%3===sector){const item=i<8?'herb':'shard';place(item==='herb'?'flower':'crystal',{x:7+(i*13)%43,y:5+(i*7)%28},{id:`${region}-route-${11+i}`,action:'resource',item,label:item==='herb'?'月息草':'潮晶碎片'});}
 for(const h of HABITATS.filter(h=>h.region===region&&h.sector===sector))place(h.kind,h.point,{id:'ecology-'+h.family,action:'ecology-trace',family:h.family,label:'潮灵踪迹 · '+h.title});
 for(const s of FISHING_SPOTS.filter(s=>s.region===region&&s.sector===sector))place('sign',s.preferred,{id:s.id,action:'fishing',spot:s.id,label:'星浮水岸 · '+s.name},true);
 return {region,place:'route',sector,outdoor:true,chapter,objects,layout:area.layout,width:56,height:38,entry:area.entry,floorName:area.name};
}
