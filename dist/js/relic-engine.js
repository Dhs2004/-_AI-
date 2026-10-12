import {RELICS,getRelic} from './relics.js';
const edgeKey=(a,b)=>a<b?a+':'+b:b+':'+a;
const cross=(cells,size,index)=>{const x=index%size,y=Math.floor(index/size);for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<size&&yy>=0&&yy<size)cells[yy*size+xx]^=1;}return cells;};
export function initialRelicState(relic){const p=relic.puzzle;if(p.type==='mirror')return p.initial.slice();if(p.type==='weave')return [p.start];const cells=p.target.slice();for(const index of p.scramble)cross(cells,p.size,index);return cells;}
export function relicProgress(game,id){const relic=getRelic(id);if(!relic)throw new Error('这台旧日仪器不存在。');return game.relics?.[id]||{state:initialRelicState(relic),moves:0,solved:false};}
export function traceLight(p,state){
 let [x,y]=p.source,[dx,dy]=p.direction;const path=[[x,y]],stars=new Set(),visited=new Set();
 for(let n=0;n<p.width*p.height*4+1;n++){
  x+=dx;y+=dy;path.push([x,y]);
  if(x<0||x>=p.width||y<0||y>=p.height)return {path,stars:[...stars],reached:x===p.target[0]&&y===p.target[1],loop:false};
  const key=[x,y,dx,dy].join(',');if(visited.has(key))return {path,stars:[...stars],reached:false,loop:true};visited.add(key);
  const star=p.stars.findIndex(s=>s[0]===x&&s[1]===y);if(star>=0)stars.add(star);
  const mirror=p.mirrors.findIndex(m=>m[0]===x&&m[1]===y);if(mirror>=0)[dx,dy]=state[mirror]?[dy,dx]:[-dy,-dx];
 }
 return {path,stars:[...stars],reached:false,loop:true};
}
export function weaveEdges(state){return state.slice(1).map((node,i)=>edgeKey(state[i],node));}
export function relicSolved(relic,state){const p=relic.puzzle;if(p.type==='mirror'){const ray=traceLight(p,state);return ray.reached&&ray.stars.length===p.stars.length;}if(p.type==='lamps')return state.every((n,i)=>n===p.target[i]);return state.length===p.edges.length+1;}
export function relicChoices(relic,state){const p=relic.puzzle;if(p.type!=='weave')return [];const end=state.at(-1),used=new Set(weaveEdges(state));return p.edges.flatMap(([a,b])=>a===end&&!used.has(edgeKey(a,b))?[b]:b===end&&!used.has(edgeKey(a,b))?[a]:[]);}
export function applyRelicAction(game,id,action){
 const relic=getRelic(id),old=relicProgress(game,id),p=relic.puzzle;
 if(old.solved)return {game,solvedNow:false};
 const state=old.state.slice();let moves=old.moves;
 if(action.type==='reset'){state.splice(0,state.length,...initialRelicState(relic));moves=0;}
 else if(action.type==='undo'&&p.type==='weave'){if(state.length<=1)return {game,solvedNow:false};state.pop();moves++;}
 else if(action.type==='touch'){
  const index=action.index;if(!Number.isInteger(index)||index<0)throw new Error('请选择仪器上的有效位置。');
  if(p.type==='mirror'){if(index>=p.mirrors.length)throw new Error('镜片不存在。');state[index]^=1;}
  else if(p.type==='lamps'){if(index>=p.size*p.size)throw new Error('灯格不存在。');cross(state,p.size,index);}
  else{if(!relicChoices(relic,state).includes(index))throw new Error('沿未走过的线，连接相邻星点。');state.push(index);}
  moves++;
 }else throw new Error('这台仪器不接受此操作。');
 const solved=relicSolved(relic,state),next={...game,relics:{...(game.relics||{}),[id]:{state,moves:Math.min(100000,moves),solved}}};
 if(solved){next.bag={...game.bag};for(const [item,n] of Object.entries(relic.reward))next.bag[item]=Math.min(9999,(next.bag[item]||0)+n);}
 return {game:next,solvedNow:solved};
}
export function validateRelics(game){
 game.relics??={};if(!game.relics||typeof game.relics!=='object'||Array.isArray(game.relics))throw new Error('存档中的回信记录损坏。');
 for(const [id,progress] of Object.entries(game.relics)){
  const relic=getRelic(id);if(!relic||!progress||!Array.isArray(progress.state)||!Number.isInteger(progress.moves)||progress.moves<0||progress.moves>100000||typeof progress.solved!=='boolean')throw new Error('存档中的旧日仪器损坏。');
  const p=relic.puzzle,s=progress.state;
  if(p.type==='weave'){
   if(s.length<1||s.length>p.edges.length+1||s[0]!==p.start||!s.every(n=>Number.isInteger(n)&&n>=0&&n<p.points.length))throw new Error('存档中的星图路线损坏。');
   const valid=new Set(p.edges.map(([a,b])=>edgeKey(a,b))),edges=weaveEdges(s);if(new Set(edges).size!==edges.length||!edges.every(e=>valid.has(e)))throw new Error('存档中的星图线段损坏。');
  }else if(s.length!==(p.type==='mirror'?p.mirrors.length:p.size*p.size)||!s.every(n=>n===0||n===1))throw new Error('存档中的仪器位置损坏。');
  if(progress.solved!==relicSolved(relic,s))throw new Error('存档中的修复结果不一致。');
 }
}
export const restoredLetters=game=>RELICS.filter(r=>game.relics?.[r.id]?.solved);
