export const RUNE_SYMBOLS=['日','月','星'];
export function runeValue(game,rune){const value=game.runes?.[rune.id];return Number.isInteger(value)?value:rune.initial||0;}
export function gateIsOpen(game,gate){return !!game.openGates?.[gate.id]||gate.requires.every(r=>(game.runes?.[r.rune]||0)===r.value);}
export function turnRune(game,rune,gates=[]){
 const next={...game,runes:{...(game.runes||{})},openGates:{...(game.openGates||{})}};
 next.runes[rune.id]=(runeValue(game,rune)+1)%3;
 const opened=[];for(const gate of gates)if(!next.openGates[gate.id]&&gateIsOpen(next,gate)){next.openGates[gate.id]=true;opened.push(gate.id);}
 return {game:next,value:next.runes[rune.id],opened};
}
export function adaptDungeon(region,depth,chapter,floor){
 const kindMap={cache:'chest',lore:'sign',trainer:'person',rune:'crystal',gate:'portal',heal:'well'};
 const actionMap={cache:'chest',lore:'dungeon-lore',trainer:'dungeon-trainer',rune:'rune',gate:'seal',heal:'heal'};
 const objects=floor.objects.map(o=>({...o,sourceKind:o.kind,kind:kindMap[o.kind],action:actionMap[o.kind],role:o.kind==='trainer'?'warden':undefined}));
 objects.push({id:`stairs-${region}-${depth}-entry`,kind:'portal',x:floor.entry.x,y:floor.entry.y,action:'stairs',direction:'back',label:depth?'返回上一层':'离开遗迹'});
 objects.push(depth<3?{id:`stairs-${region}-${depth}-exit`,kind:'portal',x:floor.exit.x,y:floor.exit.y,action:'stairs',direction:'forward',label:'通往下一层'}:{id:`warden-${region}`,kind:'person',x:floor.exit.x,y:floor.exit.y,role:'warden',action:'boss',label:chapter.warden});
 return {region,place:'dungeon',chapter,depth,floorName:floor.name,layout:floor.layout,width:floor.layout[0].length,height:floor.layout.length,entry:floor.entry,exit:floor.exit,objects};
}
export function rawDungeonWalkable(floor,x,y){return ['.','='].includes(floor.layout[y]?.[x]);}
