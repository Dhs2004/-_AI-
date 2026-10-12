import {SPECIES,MOVES,ITEMS,STATUS} from './data.js';
import {stats} from './engine.js';
import {abilityFor} from './abilities.js';

const copyScene=b=>({party:b.party.map(m=>({...m})),enemies:b.enemies.map(m=>({...m})),activeP:b.activeP,activeE:b.activeE});
const findMon=(b,uid)=>b.party.find(m=>m.uid===uid)||b.enemies.find(m=>m.uid===uid);

export function eventCaption(event,battle){
 const actor=findMon(battle,event.source),target=findMon(battle,event.target),name=actor?SPECIES[actor.species].name:'潮灵',recipient=target?SPECIES[target.species].name:'伙伴';
 if(event.kind==='switch')return `${battle.party.includes(target)?'我方':'对方'}轮换 · ${recipient} 入场`;
 if(event.kind==='faint')return `${recipient} 暂时退场`;
 if(event.kind==='capture')return `向 ${recipient} 发出同行的邀请`;
 if(event.kind==='recoil')return `${recipient} · 反噬 −${event.damage}`;
 if(event.kind==='status')return `${recipient} · ${STATUS[event.status]} −${event.damage}`;
 if(event.item)return `${recipient} · ${ITEMS[event.item].name}${event.amount?' +'+event.amount:''}`;
 if(event.trait)return `${name} · ${abilityFor(actor).name}${event.amount?' +'+event.amount:''}`;
 if(event.move)return `${name} · ${MOVES[event.move].name}${event.critical?' · 会心':''}${event.damage?' −'+event.damage:event.amount?' +'+event.amount:''}`;
 if(event.kind==='buff')return `${name} · 守势`;
 return `${recipient} · 恢复${event.amount?' +'+event.amount:''}`;
}

/** Visual-only frames. Combat is resolved once; playback never rolls RNG or settles rewards. */
export function createBattlePlayback(before,after,speed=1,start=0){
 let scene=copyScene(before);
 const frames=(after.events||[]).map(event=>{
  if(event.kind==='switch'){
   const p=scene.party.findIndex(m=>m.uid===event.target),e=scene.enemies.findIndex(m=>m.uid===event.target);
   if(p>=0)scene.activeP=p;else if(e>=0)scene.activeE=e;
  }
  const pre=copyScene(scene),target=findMon(scene,event.target);
  if(target){
   if(event.damage)target.hp=Math.max(0,target.hp-event.damage);
   if(event.amount)target.hp=Math.min(stats(target).hp,target.hp+event.amount);
  }
  for(const change of event.changes||[]){const mon=findMon(scene,change.uid);if(mon)Object.assign(mon,change);}
  return {pre,post:copyScene(scene),caption:eventCaption(event,before)};
 });
 const slice=speed===2?.24:.48;
 return {start,events:after.events||[],frames,seed:after.seed,slice,duration:frames.length*slice+.08,scene:copyScene(before),phase:-1};
}

export function playbackFrame(playback,now){
 const elapsed=Math.max(0,now-playback.start),index=Math.min(playback.frames.length-1,Math.floor(elapsed/playback.slice));
 if(index<0)return null;
 const progress=Math.min(1,(elapsed-index*playback.slice)/playback.slice),impact=progress>=.4,frame=playback.frames[index];
 return {index,progress,phase:index*2+Number(impact),scene:impact?frame.post:frame.pre,caption:frame.caption};
}
