import {createMon,stats} from './engine.js';
import {TRIAL_CIRCUIT_ID,trialAt} from './trial-data.js';
export function trialEncounter(game,floor){
 if(!game.ending)throw new Error('点亮八盏星灯之后，才能启程试航。');
 if(game.region!==7||game.place!=='town')throw new Error('请回到最后驿站的星海试炼入口。');
 if(game.suspendedBattle)throw new Error('先完成正在进行的对战。');
 const stage=trialAt(floor);if(!stage||floor>(game.trial||0)+1)throw new Error('先完成前一站试航。');
 const enemies=stage.team.map((entry,index)=>{const mon=createMon(entry.species,Math.min(65,stage.level+index%3),game.seed+index);mon.equip=entry.equip;mon.hp=stats(mon).hp;if(entry.moves)mon.loadout=[...entry.moves];return mon;});
 return {enemies,context:{kind:'trial',circuit:TRIAL_CIRCUIT_ID,floor,name:`第 ${floor} 阶 · ${stage.guest}`}};
}
