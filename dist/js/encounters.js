import {FAMILY_TECHNIQUES} from './technique-data.js';
import {CHAPTERS,SPECIES} from './data.js';
import {createMon,clamp,moveList} from './engine.js';

function teamAt(ids,level,seed,stagger=i=>i%2){return ids.map((id,i)=>{const mon=createMon(id,clamp(level+stagger(i),1,65),seed+i);if(mon.level>=22){mon.loadout=moveList(mon);mon.loadout[2]=FAMILY_TECHNIQUES[SPECIES[id].family][mon.level>=38&&i%2?1:0];}return mon;});}
export function expeditionTeam(region,stage,seed=1){return teamAt(stage.team,Math.max(2,CHAPTERS[region].level+(stage.levelOffset||0)),seed);}
export function dungeonTeam(region,depth,trainer,seed=1){return teamAt(trainer.team,Math.max(2,CHAPTERS[region].level+depth+1+(trainer.levelOffset||0)),seed);}
export function wardenTeam(region,{rematch=false,seed=1}={}){const c=CHAPTERS[region];return teamAt(c.boss,c.bossLevel+(rematch?8:0),seed,i=>i);}
export function outdoorTrainerTeam(region,index,seed=1){const c=CHAPTERS[region],team=[createMon(c.wild[index+1],c.level+2+index,seed)];if(region>1)team.push(createMon(c.wild[0],c.level,seed+1));return team;}
