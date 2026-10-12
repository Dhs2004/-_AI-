import {createGame,createMon,saveEnvelope,makeBattle,stats,estimateDamage,moveList,random} from '../dist/js/engine.js';
import {planEnemyAction} from '../dist/js/battle-ai.js';
import {outdoorSite} from '../dist/js/outdoor-engine.js';
import {getExpedition,EXPEDITION_SITES} from '../dist/js/expedition-engine.js';
import {makeMap,canWalk} from '../dist/js/world.js';
const frame=document.querySelector('iframe'),select=document.querySelector('select');
document.querySelector('#load').onclick=()=>{
 const type=select.value,g=createGame('测试旅人','embercat');g.sound=false;g.seed=4149;g.flags.entered0=true;g.party.push(createMon('tidefin',8),createMon('budfox',8));g.bag.superpotion=12;g.bag.greatorb=12;g.party[1].hp=0;
 if(type.startsWith('intent-')){
  g.region=6;g.flags.entered6=true;g.party=[createMon(type==='intent-switch'?'tidefin_3':'embercat_3',35)];
  g.suspendedBattle=makeBattle(g,(type==='intent-switch'?['embercat_3','voltkit_3']:['budfox_3']).map(id=>createMon(id,35)),{kind:'boss',name:type==='intent-switch'?'对手轮换练习':'对手守势练习'});
  if(type==='intent-guard'){g.suspendedBattle.enemies[0].energy=0;g.suspendedBattle.enemyPlan=planEnemyAction(g.suspendedBattle,{damage:estimateDamage,stats,moves:moveList,random});}
 }else if(type==='traits'){
  g.region=4;g.flags.entered4=true;g.party=['mossdeer_2','tidefin_2','dewslime_2','voltkit_2','skydrake_2','sunserpent_2'].map(id=>createMon(id,24));g.party[0].hp=Math.floor(stats(g.party[0]).hp*.5);
  g.suspendedBattle=makeBattle(g,['embercat_2','frostowl_2','stonegolem_2'].map(id=>createMon(id,20)),{kind:'trainer',name:'潮灵特性练习'});
 }else if(type.startsWith('outdoor-')){
  g.place='route';g.routeSector=type==='outdoor-crossing'?0:2;for(let i=0;i<3;i++)g.flags['fragment0-'+i]=true;
  const map=makeMap(0,'route',0,g.routeSector),o=map.objects.find(o=>type==='outdoor-crossing'?o.action==='outdoor-exit'&&o.to===1:o.action==='gate');
  for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]])if(canWalk(map,g,o.x+dx,o.y+dy)){g.x=o.x+dx;g.y=o.y+dy;break;}
 }else if(type.startsWith('exp-')){
  const e=getExpedition(type==='exp-delivery'?'exp0b':'exp0a'),step={'exp-start':0,'exp-puzzle':2,'exp-choice':4,'exp-delivery':4,'exp-end':5}[type];
  g.expeditions[e.id]={step,choices:{}};for(const stage of e.stages.slice(0,step))if(stage.kind==='choice')g.expeditions[e.id].choices[stage.id]=0;
  g.place=EXPEDITION_SITES[e.stages[step].site].place;g.trackedExpedition=e.id;g.bag.herb=1;
  g.routeSector=outdoorSite(0,e.stages[step].site)?.sector||0;
  const map=makeMap(0,g.place,0,g.routeSector),o=map.objects.find(o=>o.expedition===e.id&&o.stage===step);
  for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]])if(canWalk(map,g,o.x+dx,o.y+dy)){g.x=o.x+dx;g.y=o.y+dy;break;}
 }else if(type==='after-boss'){g.badges=[0];g.pendingScenes=['after0'];g.flags['won0']=true;g.gold=900;}
 else if(type!=='new'){
  g.place=type==='story'?'town':type==='trainer'?'route':'dungeon';g.dungeonFloor=type==='boss'?3:0;
  if(g.place==='dungeon')for(let i=0;i<3;i++)g.flags['fragment0-'+i]=true;
  const map=makeMap(0,g.place,g.dungeonFloor),object=map.objects.find(o=>o.action==={trainer:'trainer',dungeon:'rune',boss:'boss',story:'side-story'}[type]);
  const offsets=[[0,1],[1,0],[-1,0],[0,-1],[1,1]];for(const [dx,dy] of offsets)if(canWalk(map,g,object.x+dx,object.y+dy)){g.x=object.x+dx;g.y=object.y+dy;break;}
  if(type==='boss')g.party=g.party.map(m=>createMon(m.species,12));
 }
 const button=document.querySelector('#load');button.disabled=true;
 frame.onload=()=>{frame.onload=null;
  if(type==='new')localStorage.removeItem('starfall-save-v1');else localStorage.setItem('starfall-save-v1',saveEnvelope(g));
  localStorage.removeItem('starfall-save-backup-v1');frame.src='../dist/index.html?fixture='+type;button.disabled=false;
  document.querySelector('#status').textContent='已载入 '+select.selectedOptions[0].textContent+' · 点击游戏中的继续旅程。';
 };
 // Let the old game's pagehide save finish before staging the new fixture.
 frame.src='about:blank';
};
