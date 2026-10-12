import {CHAPTERS,ELEMENTS,SPECIES} from '../dist/js/data.js';
import {createGame,createMon,makeBattle} from '../dist/js/engine.js';
import {drawWorld,makeMap} from '../dist/js/world.js';
import {drawBattleScene} from '../dist/js/battle-view.js';
import {drawTitleVista} from '../dist/js/landmarks.js';
import {FrameMetrics} from '../dist/js/performance.js';
const $=s=>document.querySelector(s),canvas=$('#screen'),ctx=canvas.getContext('2d'),metrics=new FrameMetrics();
const scenarios=[{name:'标题 · 月下群岛',kind:'title'},...CHAPTERS.flatMap((c,region)=>[{name:c.town,kind:'town',region},{name:c.route,kind:'route',region},{name:c.dungeon+' · 第三层',kind:'dungeon',region}]),...Object.entries(ELEMENTS).map(([element,e],region)=>({name:e.name+'属性 · 连续对战特效',kind:'battle',region:region%8,element}))];
$('#scenario').innerHTML=scenarios.map((s,i)=>`<option value="${i}">${s.name}</option>`).join('');
let scene,map,game,fight,view,started=0,suite=false,index=0,rows=[],lastOutput=0;
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,+$('#quality').value);view={w:r.width,h:r.height,dpr};canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;metrics.reset();started=0;}
function load(i){index=i;scene=scenarios[i];$('#scenario').value=i;game=createGame('渲染测试');game.region=scene.region||0;game.collected={};game.party=[createMon('embercat_3',40)];map=makeMap(game.region,scene.kind==='dungeon'?'dungeon':scene.kind==='route'?'route':'town',2);game.x=map.entry?.x||19;game.y=map.entry?.y||16;
 const enemy=Object.values(SPECIES).find(s=>s.element===scene.element&&s.stage===3)||SPECIES.tidefin_3;fight=makeBattle(game,[createMon(enemy.id,40)],{kind:'trainer'});metrics.reset();started=0;
}
$('#scenario').onchange=()=>{suite=false;load(+$('#scenario').value);};$('#quality').onchange=resize;
$('#suite').onclick=()=>{rows=[];$('#results').innerHTML='';suite=true;load(0);};$('#battles').onclick=()=>{rows=[];$('#results').innerHTML='';suite=true;load(25);};$('#stop').onclick=()=>{suite=false;};
new ResizeObserver(resize).observe(canvas);document.addEventListener('visibilitychange',()=>{started=0;metrics.reset();});
function frame(ms){if(document.hidden){requestAnimationFrame(frame);return;}if(!started)started=ms;const start=performance.now(),t=ms/1000;
 if(scene.kind==='title')drawTitleVista(ctx,view.w,view.h,t);
 else if(scene.kind==='battle'){const period=t%1.2,event={kind:'attack',damage:37,element:scene.element,source:fight.party[0].uid,target:fight.enemies[0].uid};drawBattleScene(ctx,view.w,view.h,game,fight,t,{start:t-period,events:[event,{...event,source:event.target,target:event.source}],seed:19});}
 else{const x=game.x+Math.sin(t*.35)*2,y=game.y+Math.cos(t*.4);drawWorld(ctx,view.w,view.h,map,{...game,x,y},t,{walking:true});}
 if(ms-started>500)metrics.record(ms,performance.now()-start);
 if(ms-lastOutput>500){lastOutput=ms;const m=metrics.summary();$('#live').textContent=`${scene.name} · ${m.fps} FPS · P95 ${m.p95} ms · 绘制 ${m.draw} ms · ${m.samples} 帧 · DPR ${view.dpr}${suite?' · 轮测 '+(index+1)+' / '+scenarios.length:''}`;}
 if(suite&&ms-started>2600&&metrics.summary().samples>30){const m=metrics.summary();rows.push({...m,name:scene.name,width:canvas.width,height:canvas.height});$('#results').innerHTML=rows.map(r=>`<tr><td>${r.name}</td><td>${r.width} × ${r.height}</td><td>${r.fps}</td><td>${r.p95} ms</td><td>${r.draw} ms</td></tr>`).join('');if(index<scenarios.length-1)load(index+1);else{suite=false;$('#live').textContent='轮测完成 · '+rows.length+' 个场景';}}
 requestAnimationFrame(frame);
}
resize();load(0);requestAnimationFrame(frame);
