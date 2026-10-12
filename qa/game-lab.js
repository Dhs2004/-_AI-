import {createGame,createMon,saveEnvelope} from '../dist/js/engine.js';
import {makeMap,canWalk} from '../dist/js/world.js';
const frame=document.querySelector('iframe'),select=document.querySelector('select');
document.querySelector('#load').onclick=()=>{
 const type=select.value,g=createGame('测试旅人','embercat');g.sound=false;g.seed=4149;g.flags.entered0=true;g.party.push(createMon('tidefin',8),createMon('budfox',8));g.bag.superpotion=12;g.bag.greatorb=12;g.party[1].hp=0;
 if(type!=='new'){
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
