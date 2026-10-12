import {FAMILY_TECHNIQUES} from './technique-data.js';
import {MOVES,SPECIES} from './data.js';

export function moveLearnset(mon){
 const species=SPECIES[mon.species];if(!species)throw new Error('这位伙伴的技能记录不存在。');
 return [{id:'tackle',level:1},...species.moves.map((id,i)=>({id,level:[1,9,18,27][i]})),{id:'mercy',level:12,tier:'advanced'},...FAMILY_TECHNIQUES[species.family].map((id,i)=>({id,level:[22,38][i],tier:'advanced'}))].sort((a,b)=>a.level-b.level);
}
export const learnedMoves=mon=>moveLearnset(mon).filter(m=>m.level<=mon.level).map(m=>m.id);
export function fillMoveSlots(mon,draft){
 const pool=learnedMoves(mon),selected=draft.slice(0,4),count=Math.min(4,pool.length);
 for(let i=0;i<count;i++)if(!selected[i])selected[i]=pool.find(id=>!selected.includes(id));
 return selected;
}
export function moveList(mon){
 const learned=learnedMoves(mon);
 if(!mon.loadout)return moveLearnset(mon).filter(m=>m.level<=mon.level&&m.tier!=='advanced').map(m=>m.id).slice(-4);
 // Keep the chosen order. Before four slots are available, newly learned moves
 // fill empty slots without discarding any selected technique.
 return [...new Set([...mon.loadout,...moveLearnset(mon).filter(m=>m.level<=mon.level&&m.tier!=='advanced').map(m=>m.id)])].slice(0,4);
}
export function validateLoadout(mon){
 if(mon.loadout===undefined||mon.loadout===null)return;
 const selected=mon.loadout,learned=learnedMoves(mon);
 if(!Array.isArray(selected)||selected.length<1||selected.length>4||new Set(selected).size!==selected.length||!selected.every(k=>typeof k==='string'&&MOVES[k]&&learned.includes(k)))throw new Error('存档中的技能搭配无效。');
}
export function setMoveLoadout(game,uid,selected){
 if(game.suspendedBattle)throw new Error('请在这场对战结束后调整技能。');
 if(selected!==null&&!Array.isArray(selected))throw new Error('请选择技能，或恢复自动搭配。');
 const group=game.party.some(m=>m.uid===uid)?'party':game.reserve?.some(m=>m.uid===uid)?'reserve':null;
 if(!group)throw new Error('没有找到这位同行伙伴。');
 const mon=game[group].find(m=>m.uid===uid),candidate={...mon,loadout:selected===null?null:Array.isArray(selected)?selected.slice():selected};
 validateLoadout(candidate);
 if(selected!==null&&selected.length!==Math.min(4,learnedMoves(mon).length))throw new Error('请为每个已经开放的位置选择一个技能。');
 return {...game,[group]:game[group].map(m=>m.uid===uid?candidate:m)};
}
