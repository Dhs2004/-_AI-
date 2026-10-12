import {RELIC_TYPES} from './relics.js';
import {traceLight,relicChoices,weaveEdges} from './relic-engine.js';
const symbols='ABCDEFGHI';
const point=(p,x,y)=>[(x+1.5)*100/(p.width+2),(y+1.5)*100/(p.height+2)];
const line=(p,points)=>points.map(([x,y])=>point(p,x,y).join(',')).join(' ');
function mirrorBoard(p,state){
 const ray=traceLight(p,state),lit=new Set(ray.stars),[sx,sy]=point(p,...p.source),[tx,ty]=point(p,...p.target);
 let svg='';
 for(let x=0;x<p.width;x++)for(let y=0;y<p.height;y++){const [xx,yy]=point(p,x,y);svg+=`<circle cx="${xx}" cy="${yy}" r=".25" fill="#93b5b342"/>`;}
 svg+=`<polyline points="${line(p,ray.path)}" fill="none" stroke="#ead494" stroke-width="2.2" opacity=".12"/><polyline points="${line(p,ray.path)}" fill="none" stroke="#f3d990" stroke-width=".5" stroke-linejoin="round"/><circle cx="${sx}" cy="${sy}" r="1.5" fill="#f0d69a"/><circle cx="${tx}" cy="${ty}" r="2.3" fill="${ray.reached?'#c5dca5':'#162f3a'}" stroke="#9ebdb2" stroke-width=".4"/><text x="${sx}" y="${sy+6}" class="relic-svg-label">入</text><text x="${tx}" y="${ty+6}" class="relic-svg-label">出</text>`;
 for(const [i,s] of p.stars.entries()){const [x,y]=point(p,...s);svg+=`<text x="${x}" y="${y+1.8}" text-anchor="middle" font-size="5" fill="${lit.has(i)?'#ffdfa0':'#688b92'}">${lit.has(i)?'✦':'◇'}</text>`;}
 const controls=p.mirrors.map(([x,y],i)=>{const [xx,yy]=point(p,x,y);return `<button class="mirror-knob" style="left:${xx}%;top:${yy}%" data-relic-touch="${i}" aria-label="镜片 ${i+1}，斜面${state[i]?'向右下':'向右上'}，点击转向"><span>${state[i]?'&#92;':'/'}</span><small>${i+1}</small></button>`;}).join('');
 return {board:`<div class="instrument-board mirror-board" style="aspect-ratio:${p.width+2}/${p.height+2}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${svg}</svg>${controls}</div>`,status:`星标 ${ray.stars.length} / ${p.stars.length} 已照亮 · ${ray.reached?'光已抵达出口':ray.loop?'光束在仪器内回环':'出口等待光束'}`};
}
function lampsBoard(p,state){
 const target=`<div class="lamp-target" style="--lamps:${p.size}" role="img" aria-label="目标图案：${p.target.map((n,i)=>(i%p.size===0?'第'+(Math.floor(i/p.size)+1)+'行：':'')+(n?'亮':'暗')).join(' ')}">${p.target.map(n=>`<i class="${n?'lit':''}">${n?'·':''}</i>`).join('')}</div>`;
 const cells=state.map((n,i)=>`<button class="lamp-cell ${n?'lit':''}" data-relic-touch="${i}" aria-label="第 ${Math.floor(i/p.size)+1} 行第 ${i%p.size+1} 列，${n?'亮':'暗'}" aria-pressed="${!!n}"><span>${n?'✦':'◇'}</span><small>${i+1}</small></button>`).join('');
 return {board:`<div class="lamp-layout"><div class="lamp-matrix" style="--lamps:${p.size}" role="group" aria-label="联动灯阵">${cells}</div><aside>${target}<small>目标图案</small><p>${p.target.every(Boolean)?'点亮全部灯格':'四角留暗，其余点亮'}</p></aside></div>`,status:`${state.filter((n,i)=>n===p.target[i]).length} / ${state.length} 盏与目标一致`};
}
function weaveBoard(p,state){
 const edges=new Set(weaveEdges(state)),options=relicChoices({puzzle:p},state),end=state.at(-1);let svg='';
 for(const [a,b] of p.edges){const used=edges.has(a<b?a+':'+b:b+':'+a);svg+=`<polyline points="${line(p,[p.points[a],p.points[b]])}" fill="none" stroke="${used?'#f0d098':'#709195'}" stroke-width="${used?'.9':'.45'}" ${used?'':'stroke-dasharray="1.1 1.1"'} opacity="${used?1:.65}"/>`;}
 const controls=p.points.map(([x,y],i)=>{const [xx,yy]=point(p,x,y);return `<button class="star-node ${i===end?'current':''} ${i===p.start?'origin':''}" style="left:${xx}%;top:${yy}%" data-relic-touch="${i}" ${options.includes(i)?'':'disabled'} aria-label="星点 ${symbols[i]}${i===p.start?'，起点':''}${i===end?'，当前位置':''}"><span>${i===end?'✦':'·'}</span><small>${symbols[i]}</small></button>`;}).join('');
 return {board:`<div class="instrument-board weave-board" style="aspect-ratio:${p.width+2}/${p.height+2}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${svg}</svg>${controls}</div><div class="weave-route" aria-label="已走路线">${state.map(n=>symbols[n]).join(' → ')}</div>`,status:`已连接 ${state.length-1} / ${p.edges.length} 条线${!options.length&&state.length<=p.edges.length?' · 此处无路可走，可撤回重试':''}`};
}
export function relicMarkup(relic,progress,hint=false){
 const kind=RELIC_TYPES[relic.puzzle.type],render={mirror:mirrorBoard,lamps:lampsBoard,weave:weaveBoard}[relic.puzzle.type](relic.puzzle,progress.state);
 return `<div class="relic-intro"><span class="relic-crest" aria-hidden="true">✧</span><div><small>旧日仪器 · ${kind.name}</small><h3>${relic.subtitle}</h3><p>${kind.rule}</p></div></div><div class="relic-workspace">${render.board}<p class="relic-status" role="status">${render.status}</p></div><div class="relic-toolbar"><span>已操作 ${progress.moves} 次 · 自动保存</span><div>${relic.puzzle.type==='weave'?`<button class="secondary" id="relic-undo" ${progress.state.length>1?'':'disabled'}>撤回一步</button>`:''}<button class="text-button" id="relic-reset">重新开始</button><button class="text-button" id="relic-hint" aria-expanded="${hint}">${hint?'收起提示':'看看提示'}</button></div></div>${hint?`<div class="relic-hint">${relic.hints.map(h=>`<p>${h}</p>`).join('')}</div>`:''}<p class="relic-reward-note">修复后可读「${relic.name}」，并领取留下的旅行补给。没有操作次数限制。</p>`;
}
