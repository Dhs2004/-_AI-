import {SPECIES,ELEMENTS} from './data.js';
import {drawMonster} from './art.js';
import {drawBattleEffect} from './effects.js';
import {drawBattleBackdrop} from './battle-backdrops.js';

export function drawBattleScene(ctx,w,h,game,fight,t,effect=null){
 drawBattleBackdrop(ctx,game.region,w,h,t);ctx.save();
 const enemyX=w*(w<600?.76:.72),enemyY=h*.38,playerX=w*(w<600?.24:.28),playerY=h*.63,scale=w<600?.68:1;
 for(const [x,y,s] of [[enemyX,enemyY,1],[playerX,playerY,1.3]]){ctx.fillStyle='#162b3944';ctx.beginPath();ctx.ellipse(x,y+20,112*scale*s,24*scale*s,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#bcd6b955';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+17,108*scale*s,21*scale*s,0,0,Math.PI*2);ctx.stroke();}
 const e=fight.enemies[fight.activeE],p=fight.party[fight.activeP];
 const elapsed=effect?Math.max(0,t-effect.start):0,slice=.48,index=effect?Math.min(effect.events.length-1,Math.floor(elapsed/slice)):0,event=effect?.events[index],progress=Math.min(1,(elapsed-index*slice)/slice);
 const pose=uid=>{if(!event)return {dx:0,dy:0};if(event.kind==='attack'&&event.source===uid)return {dx:Math.sin(Math.min(1,progress*2)*Math.PI)*(uid===p.uid?12:-12)*scale,dy:0};if(event.kind==='attack'&&event.target===uid&&progress>.35&&progress<.8)return {dx:Math.sin(progress*55)*(1-progress)*8*scale,dy:0};return {dx:0,dy:0};};
 const ep=pose(e.uid),pp=pose(p.uid);
 drawMonster(ctx,SPECIES[e.species],enemyX-112*scale+ep.dx,enemyY-177*scale+ep.dy,224*scale,{time:t,flip:true,emotion:e.hp===0?'sad':'battle'});drawMonster(ctx,SPECIES[p.species],playerX-130*scale+pp.dx,playerY-207*scale+pp.dy,260*scale,{time:t,back:true,emotion:p.hp===0?'sad':'battle'});
 if(event){const isEnemy=uid=>fight.enemies.some(m=>m.uid===uid),point=uid=>isEnemy(uid)?{x:enemyX,y:enemyY-80*scale}:{x:playerX,y:playerY-95*scale};
  drawBattleEffect(ctx,{...event,from:point(event.source),to:point(event.target),size:scale,seed:effect.seed+index},progress);
  if((event.damage||event.amount)&&progress>.38){const target=point(event.target),rise=(progress-.38)*50;ctx.save();ctx.globalAlpha=Math.min(1,(1-progress)*5);ctx.textAlign='center';ctx.font=`700 ${event.critical?28:23}px system-ui`;ctx.lineWidth=4;ctx.strokeStyle='#12232c';ctx.fillStyle=event.amount?'#abe2b3':event.critical?'#ffe3a0':ELEMENTS[event.element]?.color||'#fff2d4';const label=event.amount?'+'+event.amount:'−'+event.damage;ctx.strokeText(label,target.x,target.y+20*scale-rise*.7);ctx.fillText(label,target.x,target.y+20*scale-rise*.7);ctx.restore();}
 }
 ctx.restore();}

