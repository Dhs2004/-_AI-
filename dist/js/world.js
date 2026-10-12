import {CHAPTERS,SPECIES} from './data.js';
import {drawPerson,drawProp,drawTile,drawMonster} from './art.js';
import {SIDE_STORIES} from './stories.js';
import {drawIslandLandmark} from './landmarks.js';
import {DUNGEONS} from './dungeons.js';
import {adaptOutdoor} from './outdoor-engine.js';
import {RasterCache} from './raster-cache.js';
import {drawOutdoorBlock,drawOutdoorCanopies} from './outdoor-art.js';
import {expeditionObjects,expeditionObjectActive} from './expedition-engine.js';
import {adaptDungeon,gateIsOpen,runeValue,RUNE_SYMBOLS} from './dungeon-engine.js';
export const TILE=36,MAP_W=40,MAP_H=28;
const hash=(x,y,s=0)=>{let n=Math.imul(x+31,374761393)+Math.imul(y+19,668265263)+s*9127;n=(n^(n>>>13))>>>0;return ((Math.imul(n,1274126177)^(n>>>16))>>>0)/4294967295;};
export function makeMap(region,place,depth=0,sector=0){
 if(place==='route')return adaptOutdoor(region,sector);
 const chapter=CHAPTERS[region],objects=[];let n=0;
 if(place==='dungeon'){const floor=DUNGEONS[region].floors[depth],result=adaptDungeon(region,depth,chapter,floor);if(depth===0){const story=SIDE_STORIES.find(s=>s.region===region&&s.place==='dungeon');let point=null;for(let y=1;y<result.height-1&&!point;y++)for(let x=1;x<result.width-1;x++){if(Math.hypot(x-floor.entry.x,y-floor.entry.y)>5||Math.hypot(x-floor.entry.x,y-floor.entry.y)<2)continue;if(![[0,0],[1,0],[-1,0],[0,1],[0,-1]].every(([dx,dy])=>floor.layout[y+dy]?.[x+dx]==='.'))continue;if(result.objects.some(o=>Math.hypot(o.x-x,o.y-y)<2))continue;point={x,y};break;}if(story&&point)result.objects.push({id:story.id,kind:'person',...point,role:story.role,action:'side-story',story:story.id,label:story.giver});}return result;}
 const add=(kind,x,y,extra={})=>objects.push({id:`${region}-${place}-${n++}`,kind,x,y,...extra});
 if(place==='town'){
  add('house',18,8,{w:5,h:4,block:true,label:'航灯研究所'});add('clinic',10,12,{w:4,h:3,block:true,label:'潮灵诊所'});add('shop',27,12,{w:4,h:3,block:true,label:'星约杂货'});add('house',7,6,{w:4,h:3,block:true});add('house',30,5,{w:4,h:3,block:true});add('house',31,20,{w:4,h:3,block:true});
  add('well',19,16,{block:true,w:2,h:2});add('person',18,12,{role:'scholar',action:'story',label:region?'岛上的旅人':'洛珈博士'});add('person',11,15,{role:'healer',action:'heal',label:'潮灵护士 · 栀夏'});add('person',28,15,{role:'merchant',action:'shop',label:'星约杂货 · 松石'});add('person',16,19,{role:'rival',action:'companion',label:'阿汐'});
  add('person',8,20,{role:'merchant',action:'quest',quest:`herbs${region}`,label:'居民委托'});add('person',29,7,{role:'scholar',action:'quest',quest:`survey${region}`,label:'调查员 · 小苇'});add('person',26,20,{role:'warden',action:'quest',quest:`patrol${region}`,label:'巡岛人 · 弦'});
  add('sign',34,17,{action:'exit',to:'route',label:'前往 '+chapter.route});add('boat',21,25,{w:4,h:2});add('person',18,24,{role:'merchant',action:'travel',label:'航海人 · 归帆'});add('sign',20,20,{action:'craft',label:'潮灵工坊'});
  for(const [x,y] of [[14,10],[23,10],[13,18],[24,18],[16,23],[21,23]])add('lantern',x,y,{w:1,h:2});
  for(const [x,y] of [[4,12],[5,17],[35,11],[33,7],[7,23],[31,24]])add('flower',x,y);
  add('chest',5,21,{action:'chest',label:'海边的旧箱子',loot:{orb:3,potion:2}});
 }else if(place==='route'){
  add('sign',4,15,{action:'exit',to:'town',label:'返回 '+chapter.town});add('ruin',34,12,{w:4,h:4,block:true});add('portal',34,15,{action:'gate',to:'dungeon',label:'前往 '+chapter.dungeon});
  n+=3; // Preserve IDs of existing pickups after replacing the old fragment objects.
  add('person',15,15,{role:'rival',action:'trainer',trainer:0,label:'巡岛学徒 · 寻'});add('person',27,18,{role:'warden',action:'trainer',trainer:1,label:'潮灵游侠 · 远山'});add('person',18,23,{role:'healer',action:'rest',label:'营地旅人'});
  add('chest',32,6,{action:'chest',label:'风化的宝箱',loot:{greatorb:2,superpotion:2}});add('chest',7,23,{action:'chest',label:'树下的行囊',loot:{herb:4,shard:3}});
  for(const [x,y] of [[9,12],[13,20],[19,7],[24,11],[30,23],[6,8],[33,21],[16,9]])add('flower',x,y,{action:'resource',item:'herb',label:'月息草'});
  for(const [x,y] of [[8,19],[20,5],[30,13],[13,24]])add('crystal',x,y,{action:'resource',item:'shard',label:'潮晶碎片'});
 }else{
  add('portal',19,24,{action:'exit',to:'route',label:'返回 '+chapter.route});add('ruin',19,5,{w:6,h:5,block:true});add('person',19,10,{role:'warden',action:'boss',label:chapter.warden});
  add('crystal',16,7,{w:2,h:3});add('crystal',23,7,{w:2,h:3});add('chest',9,12,{action:'chest',label:'守灯人的补给',loot:{superpotion:3,revive:1}});add('chest',29,17,{action:'chest',label:'遗迹中的礼物',loot:{shard:5,heartCharm:1}});
  add('person',19,21,{role:'rival',action:'companion',label:'阿汐'});add('well',11,20,{action:'heal',label:'回忆之泉',w:2,h:2});
  for(const [x,y] of [[14,12],[25,12],[14,18],[25,18]])add('lantern',x,y,{h:2});
 }
 objects.push(...expeditionObjects(region,place));
 for(let y=3;y<MAP_H-3;y++)for(let x=3;x<MAP_W-3;x++){
  if(hash(x,y,region+(place==='route'?50:0))>.91&&Math.abs(y-16)>2&&Math.abs(x-19)>3&&!objects.some(o=>Math.hypot(o.x-x,o.y-y)<3)&&!(place==='town'&&y>20))add(region===4?'pine':'tree',x,y,{w:2,h:3,block:true});
 }
 for(const story of SIDE_STORIES.filter(s=>s.region===region&&s.place===place)){
  const [x,y]=place==='town'?[23,11]:place==='route'?[20,19]:[26,21];
  objects.push({id:story.id,kind:'person',x,y,role:story.role,action:'side-story',story:story.id,label:story.giver});
 }
 if(place==='town'){objects.push({id:'camp'+region,kind:'lantern',x:15,y:22,action:'campfire',label:'岸边的营火'});}
 if(region===7&&place==='town'){objects.push({id:'star-trial',kind:'portal',x:32,y:16,action:'trial',label:'星海试炼'});}
 return {region,place,chapter,objects,width:MAP_W,height:MAP_H};
}
export function tileKind(map,x,y){
 if(map.layout){const tile=map.layout[y]?.[x];if(map.outdoor&&tile==='.')return map.region===4?'snow':map.region===2?'sand':hash(x,y,map.region)>.7?'flowers':'grass';return {'#':'wall','.':'stone','~':'water','=':'wood',':':'path',',':'sand'}[tile]||'wall';}
 if(x<2||x>37||y<2||y>25)return map.place==='dungeon'?'stone':'water';
 if(map.place==='town'){
  if(y>=23)return x>=17&&x<=20?'wood':'water';
  if(y>=21)return 'sand';
  if(Math.abs(y-17)<2||Math.abs(x-19)<2||Math.abs(y-14)<1&&x>8&&x<30||y>=10&&y<=16&&(Math.abs(x-11)<2||Math.abs(x-28)<2))return 'path';
 }else if(map.place==='route'){
  if(Math.abs(y-(16+Math.sin(x*.25)*1.7))<1.6)return 'path';
  if((x<7&&y<9)||(x>31&&y>20))return 'water';
  if(hash(x,y,map.region)>.66)return 'flowers';
 }else{if(x<5||x>34||y<4||y>24)return 'water';return x>=17&&x<=21?'path':'stone';}
 return map.region===4?'snow':map.region===2?'sand':'grass';
}
export function isGone(g,o){return !!g.collected[o.id]||(o.action==='expedition'&&!expeditionObjectActive(g,o));}
export function canWalk(map,g,x,y){
 const tx=Math.round(x),ty=Math.round(y),border=map.layout?0:2;if(tx<border||tx>map.width-border-1||ty<border||ty>map.height-border-1||['water','wall'].includes(tileKind(map,tx,ty)))return false;
 for(const o of map.objects){if(isGone(g,o))continue;if(o.action==='seal'&&o.x===tx&&o.y===ty&&!gateIsOpen(g,o))return false;if(o.block){const w=o.w||1,h=o.h||1;if(tx>=o.x-Math.floor(w/2)&&tx<=o.x+Math.ceil(w/2)-1&&ty>=o.y-Math.floor(h/2)&&ty<=o.y)return false;}if(o.kind==='person'&&Math.abs(tx-o.x)<.4&&Math.abs(ty-o.y)<.4)return false;}
 return true;
}
export function nearest(map,g){return map.objects.filter(o=>o.action&&!isGone(g,o)&&Math.hypot(o.x-g.x,o.y-g.y)<2.2).sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y))[0]||null;}
export function camera(g,w,h,map={width:MAP_W,height:MAP_H}){return {x:Math.max(0,Math.min(map.width*TILE-w,g.x*TILE-w/2)),y:Math.max(0,Math.min(map.height*TILE-h,g.y*TILE-h/2))};}
const terrainCache=new RasterCache();
export const terrainCacheInfo=()=>terrainCache.info();
function terrainFor(map){
 const key=`${map.region}/${map.place}/${map.depth||0}/${map.sector||0}`;
 const cached=terrainCache.get(key);if(cached)return cached;
 const surface=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(map.width*TILE,map.height*TILE):Object.assign(document.createElement('canvas'),{width:map.width*TILE,height:map.height*TILE});
 const ctx=surface.getContext('2d'),left=0,right=map.width,top=0,bottom=map.height,time=0;
 for(let y=top;y<bottom;y++)for(let x=left;x<right;x++){
  const k=tileKind(map,x,y),px=x*TILE,py=y*TILE;
  const colors={wall:'#172b36',water:map.chapter.palette[3],grass:map.chapter.palette[0],path:map.chapter.palette[2],sand:map.region===4?'#bccacb':map.chapter.palette[2],snow:'#cfddd9',stone:map.place==='dungeon'?'#596471':'#7a8982',flowers:map.chapter.palette[0],wood:'#a58461'};
  ctx.fillStyle=colors[k];ctx.fillRect(px,py,TILE+1,TILE+1);
  const r=hash(x,y,map.region);if(k==='water'){
   ctx.fillStyle='#b2dee41c';ctx.fillRect(px+((r*31+time*5)%30),py+12,TILE*.4,2);ctx.fillRect(px+4,py+26,8,1);
  }else if(k==='grass'||k==='flowers'){
   ctx.fillStyle=map.chapter.palette[1]+'55';for(let i=0;i<3;i++){const xx=px+hash(x+i,y,2)*30,yy=py+hash(x,y+i,5)*31;ctx.fillRect(xx,yy,2,4);ctx.fillRect(xx+3,yy-2,2,3);}if(k==='flowers'){ctx.fillStyle=map.region===5?'#ad8fc1':'#d4d6a9';ctx.fillRect(px+9,py+13,3,3);ctx.fillStyle='#f2cc9166';ctx.fillRect(px+25,py+29,2,3);}
  }else if(k==='wall'&&map.outdoor){drawOutdoorBlock(ctx,map.region,px,py,TILE,r,{top:tileKind(map,x,y-1)!=='wall',bottom:tileKind(map,x,y+1)!=='wall',left:tileKind(map,x-1,y)!=='wall',right:tileKind(map,x+1,y)!=='wall'});}else if(k==='wall'){ctx.fillStyle='#223b49';ctx.fillRect(px,py,TILE,TILE-6);ctx.fillStyle='#38515a';ctx.fillRect(px+1,py+1,TILE-2,3);ctx.fillStyle='#0d202b';ctx.fillRect(px,py+TILE-6,TILE,6);if(hash(x,y,3)>.6){ctx.fillStyle='#52716a33';ctx.fillRect(px+5,py+8,11,2);}}else if(k==='path'||k==='sand'){ctx.fillStyle='#ffffff0b';ctx.fillRect(px+r*20,py+8,9,2);ctx.fillStyle='#33342117';ctx.fillRect(px+8,py+r*32,3,2);}
  else if(k==='stone'){ctx.strokeStyle='#172b361c';ctx.strokeRect(px+.5,py+.5,TILE,TILE);ctx.fillStyle='#e0dbbd14';ctx.fillRect(px+3,py+3,TILE-6,2);}
  else if(k==='wood'){ctx.fillStyle='#453e3933';ctx.fillRect(px,py+TILE-3,TILE,2);ctx.fillRect(px+TILE-2,py,2,TILE);ctx.fillStyle='#d0ba8844';ctx.fillRect(px+4,py+8,TILE-8,2);}
 }

 if(map.outdoor)drawOutdoorCanopies(ctx,map,TILE);

 // Shore foam and a darker bank give every island a readable coast.
 for(let y=2;y<map.height-2;y++)for(let x=2;x<map.width-2;x++){
  const k=tileKind(map,x,y);if(k==='water')continue;
  const px=x*TILE,py=y*TILE;
  for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]])if(tileKind(map,x+dx,y+dy)==='water'){
   ctx.fillStyle='#182f3d55';if(dx)ctx.fillRect(px+(dx>0?TILE-3:0),py,3,TILE);else ctx.fillRect(px,py+(dy>0?TILE-3:0),TILE,3);
   ctx.fillStyle='#d7e8c660';if(dx)ctx.fillRect(px+(dx>0?TILE+2:-4),py+3,2,TILE-6);else ctx.fillRect(px+3,py+(dy>0?TILE+2:-4),TILE-6,2);
  }
  if(k==='grass'||k==='flowers'||k==='snow'){
   const r=hash(x,y,42);ctx.fillStyle=r>.5?'#d9e4a50a':'#102a2b12';ctx.fillRect(px,py,TILE,TILE);
   if(r>.85){ctx.fillStyle=map.region===4?'#fff7e3':'#e8ce91';ctx.fillRect(px+8,py+22,2,2);ctx.fillRect(px+18,py+9,2,2);ctx.fillStyle='#8bb390';ctx.fillRect(px+9,py+24,1,3);}
  }
 }
 const water=[];for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(tileKind(map,x,y)==='water'&&hash(x,y)>.55)water.push([x,y]);return terrainCache.set(key,{surface,water});
}

export function drawWorld(ctx,w,h,map,g,time,{title=false,walking=false}={}){
 const cam=camera(g,w,h,map);ctx.fillStyle=map.chapter.palette[3];ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(-cam.x,-cam.y);
 const terrain=terrainFor(map);ctx.drawImage(terrain.surface,0,0);
 ctx.fillStyle='#badbe22c';for(const [x,y] of terrain.water){if(x*TILE<cam.x-TILE||x*TILE>cam.x+w||y*TILE<cam.y-TILE||y*TILE>cam.y+h)continue;const offset=(time*4+hash(x,y)*20)%20;ctx.fillRect(x*TILE+offset,y*TILE+18,9,1);}
 const drawables=map.objects.filter(o=>!isGone(g,o)&&o.x*TILE>cam.x-200&&o.x*TILE<cam.x+w+200&&o.y*TILE>cam.y-100&&o.y*TILE<cam.y+h+200).map(o=>({...o,sort:o.y}));
 if(!title){drawables.push({kind:'player',x:g.x,y:g.y,sort:g.y});if(g.party[0])drawables.push({kind:'follower',x:g.x-.8,y:g.y+.55,sort:g.y+.4});}
 drawables.sort((a,b)=>a.sort-b.sort);
 for(const o of drawables){
  const px=o.x*TILE+TILE/2,py=o.y*TILE+TILE/2;
  if(o.kind==='player'){drawPerson(ctx,px-25,py-38,50,{role:'player',direction:g.facing,facing:g.facing,walking,time});continue;}
  if(o.kind==='follower'){drawMonster(ctx,SPECIES[g.party[0].species],px-19,py-30,38,{time,flip:g.facing==='left'});continue;}
  if(o.kind==='person'){drawPerson(ctx,px-25,py-38,50,{role:o.role,time});}
  else{if(['house','clinic','shop','tree','pine','ruin'].includes(o.kind)){ctx.fillStyle='#102c2c24';ctx.beginPath();ctx.ellipse(px+10,py+10,(o.w||2)*18,12,0,0,Math.PI*2);ctx.fill();}let size=o.kind==='house'||o.kind==='clinic'||o.kind==='shop'?180:o.kind==='ruin'?230:o.kind==='tree'||o.kind==='pine'?96:o.kind==='boat'?150:o.kind==='well'?64:o.kind==='lantern'?64:o.kind==='portal'?90:46;
   if(o.kind==='ruin')drawIslandLandmark(ctx,map.region,px-size/2,py-size+18,size,time);else drawProp(ctx,o.kind,px-size/2,py-size+(o.kind==='house'||o.kind==='clinic'||o.kind==='shop'?25:18),size,{time,palette:map.chapter.palette,region:map.region,variant:(o.x*7+o.y)%3});
  }
  if(o.action==='rune'){ctx.fillStyle='#122731';ctx.fillRect(px-11,py-35,22,21);ctx.fillStyle=['#efd18c','#b9e6ef','#d1b4ef'][runeValue(g,o)];ctx.font='bold 14px serif';ctx.textAlign='center';ctx.fillText(RUNE_SYMBOLS[runeValue(g,o)],px,py-19);}
  if(o.action==='seal'&&!gateIsOpen(g,o)){ctx.fillStyle='#8db9ba99';ctx.fillRect(px-17,py-45,34,54);ctx.strokeStyle='#f4df95';ctx.strokeRect(px-15,py-43,30,50);}
  if(o.action&&!title){const near=Math.hypot(o.x-g.x,o.y-g.y)<2.2;ctx.fillStyle=o.action==='expedition'?'#f7dea1':near?'#f6e4b8':'#e7d7a59a';const yy=py-(o.kind==='person'?43:32)+Math.sin(time*2+o.x)*2;ctx.beginPath();ctx.moveTo(px,yy-4);ctx.lineTo(px+3,yy);ctx.lineTo(px,yy+4);ctx.lineTo(px-3,yy);ctx.closePath();if(g.trainerWins?.[o.id]||o.relic&&g.relics?.[o.relic]?.solved){ctx.strokeStyle='#91c9b2';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-4,yy);ctx.lineTo(px-1,yy+3);ctx.lineTo(px+5,yy-4);ctx.stroke();}else ctx.fill();if(o.action==='expedition'){ctx.strokeStyle='#f7dea166';ctx.lineWidth=1;ctx.strokeRect(px-7,yy-7,14,14);if(g.trackedExpedition===o.expedition){ctx.fillStyle='#f8e8b7';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('↓',px,yy-13);}}}
 }
 ctx.globalCompositeOperation='screen';for(const o of map.objects.filter(o=>o.kind==='lantern')){const x=o.x*TILE+18,y=o.y*TILE-5,gr=ctx.createRadialGradient(x,y,2,x,y,80);gr.addColorStop(0,'#e8b76b40');gr.addColorStop(1,'#e8b76b00');ctx.fillStyle=gr;ctx.fillRect(x-80,y-80,160,160);}ctx.globalCompositeOperation='source-over';ctx.restore();
 ctx.save();ctx.fillStyle=map.region===5||map.place==='dungeon'?'#11163024':title?'#112b3620':'#e7d39f05';ctx.fillRect(0,0,w,h);
 for(let i=0;i<18;i++){const x=(hash(i,2)*w+Math.sin(time*.2+i)*30+w)%w,y=(hash(i,5)*h-time*(map.chapter.weather==='snow'?-10:3)+h*100)%h;ctx.globalAlpha=.15+Math.sin(time+i)*.1;ctx.fillStyle=map.chapter.weather==='snow'?'#fff':'#fbe9a3';ctx.fillRect(x,y,i%3===0?3:2,2);}ctx.globalAlpha=1;
 if(map.chapter.weather==='rain'){ctx.strokeStyle='#d6eef133';ctx.lineWidth=1;for(let i=0;i<60;i++){const x=hash(i,8)*w,y=(hash(i,3)*h+time*230)%h;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+12);ctx.stroke();}}
 const vign=ctx.createRadialGradient(w*.5,h*.45,h*.15,w*.5,h*.5,h*.85);vign.addColorStop(0,'#07152100');vign.addColorStop(1,'#07152177');ctx.fillStyle=vign;ctx.fillRect(0,0,w,h);ctx.restore();return cam;
}
