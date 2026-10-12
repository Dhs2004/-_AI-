import {HABITATS} from '../dist/js/ecology.js';
import {createGame,createMon,saveEnvelope,makeBattle,stats,estimateDamage,moveList,random} from '../dist/js/engine.js';
import {planEnemyAction} from '../dist/js/battle-ai.js';
import {outdoorSite} from '../dist/js/outdoor-engine.js';
import {getExpedition,EXPEDITION_SITES} from '../dist/js/expedition-engine.js';
import {makeMap,canWalk} from '../dist/js/world.js';
const frame=document.querySelector('iframe'),select=document.querySelector('select');
document.querySelector('#load').onclick=()=>{
 const type=select.value,g=createGame('测试旅人','embercat');g.sound=false;g.seed=4149;g.flags.entered0=true;g.party.push(createMon('tidefin',8),createMon('budfox',8));g.bag.superpotion=12;g.bag.greatorb=12;g.party[1].hp=0;
 if(type.startsWith('technique-')){
  g.party=[createMon('budfox',12)];
  if(type!=='technique-memory'){
   const setups={
    'technique-shatter':{player:'stonegolem_3',moves:['shatter','stone','shell','quake'],enemy:'stonegolem_3',action:{type:'guard'}},
    'technique-energy':{player:'clockmouse_3',moves:['siphon','static','shell','thunder'],enemy:'stonegolem_3',action:{type:'move',move:'quake'}},
    'technique-regen':{player:'budfox_3',moves:['regrowth','leaf','bloom','unravel'],enemy:'glowbud_3',action:{type:'move',move:'wish'}}
   },s=setups[type];
   g.party=[createMon(s.player,40),createMon('kitesquid_3',40)];g.party[0].loadout=s.moves;g.party[1].loadout=['tailstep','gust','tideshelter','cyclone'];
   if(type==='technique-regen')g.party[0].hp=80;
   const b=makeBattle(g,[createMon(s.enemy,40)],{kind:'trainer',name:select.selectedOptions[0].textContent});b.enemies[0].energy=3;
   if(type==='technique-regen')b.enemies[0].hp=Math.floor(stats(b.enemies[0]).hp*.5);
   b.enemyPlan={actor:b.enemies[0].uid,action:s.action};g.suspendedBattle=b;g.battleSpeed=2;
  }
 }else if(type.startsWith('ecology')){
  const h=HABITATS.find(h=>h.family===(type==='ecology-snow'?'frostotter':'kitesquid'));
  g.region=h.region;g.place='route';g.routeSector=h.sector;g.badges=Array.from({length:h.region},(_,i)=>i);g.flags['entered'+h.region]=true;
  g.party=[createMon('tidefin_2',30),createMon('clockmouse_2',30)];g.bag.greatorb=12;g.battleSpeed=2;
  const map=makeMap(h.region,'route',0,h.sector),o=map.objects.find(o=>o.family===h.family);g.x=o.x;g.y=o.y+1;
  if(type==='ecology-reward'){for(const h of HABITATS){g.ecologyTraces[h.family]=true;g.reserve.push(createMon(h.family+'_3',40));g.caught.push(h.family+'_3');}}
 }else if(type==='journey'){
  g.region=1;g.place='route';g.routeSector=1;g.x=26;g.y=27;g.badges=[0];g.flags.entered1=true;g.playtime=5*3600+23*60;g.gold=1840;
  const e=getExpedition('exp0a');g.expeditions[e.id]={step:e.stages.length,choices:{}};for(const stage of e.stages)if(stage.kind==='choice')g.expeditions[e.id].choices[stage.id]=1;
  g.expeditions.exp1a={step:2,choices:{}};g.trackedExpedition='exp1a';
 }else if(type==='trial-route'){g.region=7;g.flags.entered7=true;g.ending=true;g.badges=[0,1,2,3,4,5,6,7];g.trial=3;g.x=32;g.y=17;g.party=['voltkit_3','budfox_3','tidefin_3','cinder_3','sunserpent_3','nightwolf_3'].map(id=>createMon(id,65));g.party[0].hp=Math.floor(stats(g.party[0]).hp*.4);g.bag.superpotion=18;g.bag.cure=12;}else if(type==='bond-stories'){
  g.region=4;g.flags.entered4=true;g.badges=[0,1,2,3];g.x=15;g.y=23;g.party=[createMon('budfox_2',30),createMon('embercat_2',30),createMon('voltkit_2',30)];g.party.forEach((m,i)=>m.bond=[48,23,7][i]);g.party[0].hp=Math.floor(stats(g.party[0]).hp*.5);g.reserve=[createMon('tidefin_3',40)];g.reserve[0].bond=60;g.bag.heartCharm=1;g.bag.harborCharm=1;g.bag.hearthCharm=1;g.bag.horizonCharm=1;
 }else if(type==='move-book'){
  g.party=[createMon('voltkit_3',35),createMon('budfox',8)];g.place='route';const o=makeMap(0,'route').objects.find(o=>o.action==='trainer');g.x=o.x;g.y=o.y+1;
 }else if(type.startsWith('relic-')){
  g.region={'relic-mirror':0,'relic-weave':1,'relic-lamps':2,'relic-night':6}[type];g.place='dungeon';g.dungeonFloor=3;
  const map=makeMap(g.region,'dungeon',3),o=map.objects.find(o=>o.action==='relic');
  for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]])if(canWalk(map,g,o.x+dx,o.y+dy)){g.x=o.x+dx;g.y=o.y+dy;break;}
 }else if(type==='supply'){
  g.bag.herb=12;g.bag.shard=6;g.x=28;g.y=16;
 }else if(type==='trainer-progress'){
  g.place='route';g.party=[createMon('embercat_3',40)];const o=makeMap(0,'route').objects.find(o=>o.action==='trainer');g.x=o.x;g.y=o.y+1;
 }else if(type.startsWith('intent-')){
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
