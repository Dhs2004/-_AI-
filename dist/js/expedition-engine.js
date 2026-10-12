import {EXPEDITIONS} from './expedition-stories.js';

const byId = new Map(EXPEDITIONS.map(expedition => [expedition.id, expedition]));
export const getExpedition = id => byId.get(id);
export const STAGE_KINDS = {talk:'交谈',inspect:'调查',battle:'对战',sequence:'解谜',delivery:'交付',choice:'选择'};
export const EXPEDITION_SITES = {
  'town-harbor': {place:'town',name:'港口岸边',points:[[17,22],[20,22],[23,22]]},
  'town-square': {place:'town',name:'镇中广场',points:[[16,15],[22,15],[15,17]]},
  'town-workshop': {place:'town',name:'工坊附近',points:[[22,19],[24,20],[23,17]]},
  'route-north': {place:'route',name:'原野北坡',points:[[11,7],[15,8],[23,6]]},
  'route-east': {place:'route',name:'原野东侧',points:[[28,9],[31,10],[29,12]]},
  'route-west': {place:'route',name:'原野西湾',points:[[8,10],[10,11],[9,14]]},
  'route-south': {place:'route',name:'原野南岸',points:[[23,22],[26,23],[14,24]]},
  'route-camp': {place:'route',name:'原野营地',points:[[16,21],[20,22],[21,24]]},
};

export function expeditionProgress(game, id) {
  const expedition = byId.get(id);
  if (!expedition) return null;
  if (game.expeditions?.[id]) return game.expeditions[id];
  // Previously collected fragments stay valid when an older journey is imported.
  const legacy = !!game.flags?.[`fragment${expedition.region}-${expedition.fragment}`] || game.badges?.includes(expedition.region);
  return {step:legacy ? expedition.stages.length : 0, choices:{}, ...(legacy ? {legacy:true} : {})};
}
export function currentExpeditionStage(game,id) {
  const expedition = byId.get(id), progress = expeditionProgress(game,id);
  return expedition?.stages[progress?.step] || null;
}
export function expeditionObjects(region,place) {
  return EXPEDITIONS.filter(e=>e.region===region).flatMap(expedition=>expedition.stages.flatMap((stage,index)=>{
    const site=EXPEDITION_SITES[stage.site];
    if(site.place!==place)return [];
    const [x,y]=site.points[expedition.fragment];
    return [{id:`${expedition.id}-${stage.id}`,kind:['inspect','sequence'].includes(stage.kind)?'sign':'person',x,y,role:expedition.role,action:'expedition',expedition:expedition.id,stage:index,label:`${STAGE_KINDS[stage.kind]} · ${stage.title}`}];
  }));
}
export function expeditionObjectActive(game,object) {
  const expedition=byId.get(object.expedition),progress=expeditionProgress(game,object.expedition);
  return progress && object.stage===Math.min(progress.step,expedition.stages.length-1);
}
export function expeditionScene(game,id) {
  const [kind,expId,stageId]=id.split(':'),expedition=byId.get(expId);
  if(!expedition)return null;
  if(kind==='exp-end')return expedition.ending;
  if(kind==='exp-choice'){
    const stage=expedition.stages.find(s=>s.id===stageId);
    return stage?.choices?.[game.expeditions?.[expId]?.choices?.[stageId]]?.reply || null;
  }
  return null;
}

/** One atomic checkpoint owns stage progress, consumed materials and rewards. */
export function advanceExpedition(game,id,stageId,input={}) {
  const expedition=byId.get(id),progress=expeditionProgress(game,id);
  if(!expedition)throw new Error('这段冒险不存在。');
  if(progress.step>=expedition.stages.length)return {game,alreadyComplete:true,completed:true};
  const stage=expedition.stages[progress.step];
  if(game.region!==expedition.region||stage.id!==stageId)throw new Error('请先完成手记中记录的当前目标。');
  if(stage.kind==='battle'&&!input.victory)throw new Error('需要先完成这场对战。');
  if(stage.kind==='sequence'&&(!Array.isArray(input.sequence)||input.sequence.length!==stage.answer.length||!stage.answer.every((n,i)=>n===input.sequence[i])))throw new Error(stage.failure);
  if(stage.kind==='choice'&&(!Number.isInteger(input.choice)||!stage.choices[input.choice]))throw new Error('请选择你的回应。');
  if(stage.kind==='delivery'&&(game.bag[stage.item]||0)<stage.amount)throw new Error('背包里的素材还不够。');
  const next=JSON.parse(JSON.stringify(game));next.expeditions??={};next.pendingScenes??=[];
  next.expeditions[id]={step:progress.step+1,choices:{...progress.choices}};
  if(stage.kind==='delivery')next.bag[stage.item]-=stage.amount;
  if(stage.kind==='choice'){
    next.expeditions[id].choices[stage.id]=input.choice;
    next.pendingScenes.push(`exp-choice:${id}:${stage.id}`);
  }
  const completed=progress.step+1===expedition.stages.length;
  if(completed){
    next.flags[`fragment${expedition.region}-${expedition.fragment}`]=true;
    next.gold+=expedition.reward.gold;
    for(const [item,count] of Object.entries(expedition.reward.items))next.bag[item]=(next.bag[item]||0)+count;
    next.bag.shard=(next.bag.shard||0)+1;
    next.pendingScenes.push(`exp-end:${id}`);
    if(next.trackedExpedition===id)next.trackedExpedition=null;
  }else next.trackedExpedition=id;
  return {game:next,completed,stage,expedition};
}

export function validateExpeditions(game) {
  game.expeditions??={};game.trackedExpedition??=null;
  if(typeof game.expeditions!=='object'||Array.isArray(game.expeditions)||!game.expeditions)throw new Error('存档冒险记录损坏。');
  for(const [id,progress] of Object.entries(game.expeditions)){
    const expedition=byId.get(id);
    if(!expedition||!progress||!Number.isInteger(progress.step)||progress.step<0||progress.step>expedition.stages.length||!progress.choices||typeof progress.choices!=='object'||Array.isArray(progress.choices))throw new Error('存档冒险阶段损坏。');
    for(const [stageId,index] of Object.entries(progress.choices)){
      const stageIndex=expedition.stages.findIndex(s=>s.id===stageId),stage=expedition.stages[stageIndex];
      if(stageIndex>=progress.step||!Number.isInteger(index)||!stage?.choices?.[index])throw new Error('存档冒险选择损坏。');
    }
    if(progress.step===expedition.stages.length)game.flags[`fragment${expedition.region}-${expedition.fragment}`]=true;
  }
  if(game.trackedExpedition!==null&&!byId.has(game.trackedExpedition))throw new Error('存档追踪目标不存在。');
}
