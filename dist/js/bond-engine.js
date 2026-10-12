import {SPECIES} from './data.js';
import {BOND_CHRONICLES,BOND_REQUIREMENTS} from './bond-stories.js';

export function bondStatus(game,family){
 const story=BOND_CHRONICLES[family];if(!story)throw new Error('这段同行故事不存在。');
 const companions=[...game.party,...(game.reserve||[])].filter(m=>SPECIES[m.species]?.family===family).sort((a,b)=>(b.bond||0)-(a.bond||0));
 const mon=companions[0]||null,choices=game.bondStories?.[family]||[],step=choices.length,requirement=BOND_REQUIREMENTS[step]||null;
 const bond=mon?.bond||0,badges=new Set(game.badges).size;
 const ready=!!mon&&!!requirement&&bond>=requirement.bond&&badges>=requirement.badges&&!game.suspendedBattle;
 return {family,mon,bond,badges,choices,step,requirement,ready,complete:step===3};
}
export function bondChapter(game,family,index){
 const status=bondStatus(game,family),chapter=BOND_CHRONICLES[family].chapters[index];
 if(!chapter||index>status.step||index===status.step&&!status.ready)throw new Error('这段故事还没有来到。');
 const echo=chapter.echo?.[status.choices[1]];
 return {...chapter,lines:echo?[['旁白',echo],...chapter.lines]:chapter.lines,selected:status.choices[index],index,family};
}
export function bondReward(family,index,choice){
 return index===0?{superpotion:1,herb:2}:index===1?{superpotion:2,greatorb:1}:{[BOND_CHRONICLES[family].gifts[choice]]:1};
}
export function completeBondChapter(game,family,index,choice){
 if(!Number.isInteger(index)||index<0||index>2||!Number.isInteger(choice)||choice<0||choice>1)throw new Error('这段故事的回应不存在。');
 const status=bondStatus(game,family);
 if(index<status.step)return {game,alreadyComplete:true,choice:status.choices[index],received:{}};
 if(game.suspendedBattle)throw new Error('请在这场对战结束后，再和伙伴慢慢聊。');
 if(index!==status.step||!status.ready)throw new Error('还需要更多共同的旅途，才能继续这段故事。');
 const reward=bondReward(family,index,choice),bag={...game.bag},received={};
 for(const [id,n] of Object.entries(reward)){const count=Math.min(n,Math.max(0,9999-(bag[id]||0)));bag[id]=(bag[id]||0)+count;received[id]=count;}
 const next={...game,bag,bondStories:{...(game.bondStories||{}),[family]:[...status.choices,choice]}};
 return {game:next,alreadyComplete:false,choice,received};
}
export function validateBondStories(game){
 game.bondStories??={};const stories=game.bondStories;
 if(!stories||typeof stories!=='object'||Array.isArray(stories))throw new Error('存档中的同行故事损坏。');
 for(const [family,choices] of Object.entries(stories))if(!Object.hasOwn(BOND_CHRONICLES,family)||!Array.isArray(choices)||choices.length>3||!choices.every(n=>Number.isInteger(n)&&n>=0&&n<=1))throw new Error('存档中的同行回应损坏。');
}
