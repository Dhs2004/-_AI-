import {FISHING_SPOTS,FISHING_LURES,FISHING_SIGNALS,FISHING_ACTIONS,fishingSpot} from './fishing-data.js';
import {CHAPTERS,SPECIES} from './data.js';
const copy=x=>JSON.parse(JSON.stringify(x));
const rng=s=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
export const freshFishing=()=>({active:null,catches:{},released:{},claimed:{},choices:{},grandClaimed:false});
export const fishingHere=(g,s)=>g.place==='route'&&g.region===s.region&&g.routeSector===s.sector;
export const fishingKnown=(g,s)=>g.region===s.region||g.badges.includes(s.region)||!!g.flags?.['entered'+s.region];
export function fishingProgress(game,id){const spot=fishingSpot(id);if(!spot)throw new Error('这处水岸尚未记录。');const catches=game.fishing?.catches?.[id]||{},count=spot.families.filter(f=>catches[f]>0).length,claimed=game.fishing?.claimed?.[id]===true;return {catches,count,claimed,ready:count===3&&!claimed&&!game.suspendedBattle};}
export function fishingRank(game){const count=FISHING_SPOTS.reduce((n,s)=>n+fishingProgress(game,s.id).count,0);return {count,rank:count>=24?3:count>=12?2:count>=4?1:0};}
function atSpot(game,id){const s=fishingSpot(id);if(!s||!fishingHere(game,s)||game.suspendedBattle)throw new Error('请到这处水岸，结束对战后再放下星浮。');return s;}
export function castFishing(game,id,lure='plain'){
 const spot=atSpot(game,id),bait=FISHING_LURES[lure];if(!bait)throw new Error('这份浮饵不存在。');if(game.fishing?.active)throw new Error('还有一条未收好的钓线。先继续它，或收起旧线。');
 if(!game.party.some(m=>m.hp>0))throw new Error('先让伙伴休息，再去认识水边的新朋友。');if(bait.item&&!(game.bag[bait.item]>0))throw new Error('这份浮饵的材料不够。');
 const randomState={seed:game.seed>>>0},weights=bait.weights,total=weights.reduce((a,b)=>a+b,0);let pick=rng(randomState)*total,index=0;while(index<2&&pick>=weights[index])pick-=weights[index++];
 const signals=Object.keys(FISHING_SIGNALS),signal=signals[Math.floor(rng(randomState)*signals.length)],level=CHAPTERS[spot.region].level+Math.floor(rng(randomState)*3);
 const active={spot:id,lure,family:spot.families[index],level,phase:'line',turn:0,progress:0,tension:2,mistakes:0,signal,seed:randomState.seed,limit:7+fishingRank(game).rank};
 const bag={...game.bag};if(bait.item)bag[bait.item]--;return {...game,bag,seed:randomState.seed,fishing:{...(game.fishing||freshFishing()),active}};
}
export function fishingTurn(game,action){
 const active=game.fishing?.active;if(!active||active.phase!=='line'||!FISHING_ACTIONS[action])throw new Error('现在没有可以调整的钓线。');atSpot(game,active.spot);
 const a=copy(active),signal=FISHING_SIGNALS[a.signal],correct=action===signal.answer;
 a.turn++;if(correct){a.progress+=2;a.tension+=signal.tension;}else{a.mistakes++;a.progress=Math.max(0,a.progress-1);a.tension+=action==='slack'?-2:action==='reel'?3:1;}a.tension=Math.max(0,a.tension);
 let message=correct?'你读懂了这阵水纹，星浮离岸又近了一些。':action==='slack'?'线松了下来，对方也游远了一点。':'水纹与你的动作错开了。先看看下一次鱼讯。';
 if(a.tension>=a.limit||a.turn>=12&&a.progress<8){message='那阵水纹暂时散去了。收好线，再试一次吧。';return {game:{...game,fishing:{...game.fishing,active:null}},result:'escaped',message};}
 if(a.progress>=8){a.progress=8;a.phase='landed';message=`${SPECIES[a.family].name} 顺着星浮游到了岸边。是否邀请它同行？`;}
 else{const signals=Object.keys(FISHING_SIGNALS);a.signal=signals[Math.floor(rng(a)*signals.length)];}
 const species=a.family+(a.level>=32?'_3':a.level>=16?'_2':''),seen=a.phase==='landed'&&!game.seen.includes(species)?[...game.seen,species]:game.seen;
 return {game:{...game,seen,seed:a.seed,fishing:{...game.fishing,active:a}},result:a.phase,message};
}
export function putAwayFishing(game){if(game.suspendedBattle||game.fishing?.active?.phase==='battle')throw new Error('请先完成这场水岸相遇。');return {...game,fishing:{...(game.fishing||freshFishing()),active:null}};}
export function releaseFishing(game){const a=game.fishing?.active;if(!a||a.phase!=='landed')throw new Error('还没有靠岸的潮灵。');atSpot(game,a.spot);const released={...game.fishing.released,[a.spot]:Math.min(9999,(game.fishing.released[a.spot]||0)+1)};return {...game,fishing:{...game.fishing,active:null,released}};}
export function fishingEncounter(game){
 const a=game.fishing?.active;if(!a||a.phase!=='landed')throw new Error('请先把星浮带回岸边。');const s=atSpot(game,a.spot);if(!game.party.some(m=>m.hp>0))throw new Error('请先为同行伙伴恢复生命。');
 const species=a.family+(a.level>=32?'_3':a.level>=16?'_2':'');
 return {game:{...game,fishing:{...game.fishing,active:{...a,phase:'battle'}}},species,level:a.level,context:{kind:'wild',name:s.name+' · 水岸相遇',fishingSpot:s.id}};
}
export function validateFishingBattle(b,g){
 const a=g.fishing?.active;if(!b.context?.fishingSpot){if(a?.phase==='battle')throw new Error('水岸相遇与存档中的对战不一致。');return;}
 const s=fishingSpot(b.context.fishingSpot);if(!s||!a||a.phase!=='battle'||a.spot!==s.id||b.context.kind!=='wild'||g.region!==s.region||g.place!=='route'||g.routeSector!==s.sector||b.enemies.length!==1||SPECIES[b.enemies[0].species]?.family!==a.family||b.enemies[0].level!==a.level||b.enemies[0].species!==a.family+(a.level>=32?'_3':a.level>=16?'_2':''))throw new Error('存档中的水岸对战损坏。');
}
export function settleFishing(game,battle){
 const id=battle.context?.fishingSpot;if(!id)return {game,message:null};
 if(!battle.outcome)throw new Error('水岸对战尚未结束。');
 const f=game.fishing,active=f?.active;if(!active||active.spot!==id||active.phase!=='battle')throw new Error('水岸结算记录不一致。');
 const catches=copy(f.catches);let message='这次水岸相遇结束了，星浮仍在原处等你。';
 if(battle.outcome==='capture'&&battle.caught){const family=SPECIES[battle.caught.species].family;if(family!==active.family)throw new Error('水岸伙伴与钓线记录不一致。');catches[id]??={};catches[id][family]=Math.min(9999,(catches[id][family]||0)+1);message=`水岸手册记下了「${SPECIES[family].name}」的同行约定。`;}
 return {game:{...game,fishing:{...f,active:null,catches}},message};
}
export function claimFishingRecord(game,id,choice){
 const s=fishingSpot(id),p=fishingProgress(game,id);if(p.claimed)return {game,alreadyClaimed:true};if(!p.ready||!Number.isInteger(choice)||!s.choices[choice])throw new Error('在这处水岸缔约三种伙伴后，再交换记录。');
 const gift={greatorb:2,coastfruit:4,seasalt:4};const all=FISHING_SPOTS.every(x=>x.id===id||game.fishing.claimed[x.id]);if(all&&!game.fishing.grandClaimed)gift.tidalCharm=1;
 if(Object.entries(gift).some(([key,n])=>(game.bag[key]||0)+n>9999))throw new Error('行囊已满，先为这份水岸纪念留出空间。');
 const bag={...game.bag};for(const [key,n] of Object.entries(gift))bag[key]=(bag[key]||0)+n;
 return {game:{...game,bag,fishing:{...game.fishing,claimed:{...game.fishing.claimed,[id]:true},choices:{...game.fishing.choices,[id]:choice},grandClaimed:game.fishing.grandClaimed||all}},gift,alreadyClaimed:false};
}
export function validateFishing(game){
 game.fishing??=freshFishing();const f=game.fishing;if(!f||typeof f!=='object'||Array.isArray(f))throw new Error('存档中的水岸手册损坏。');
 for(const key of ['catches','released','claimed','choices']){f[key]??={};if(!f[key]||typeof f[key]!=='object'||Array.isArray(f[key])||Object.keys(f[key]).some(id=>!fishingSpot(id)))throw new Error('存档中的水岸记录损坏。');}
 for(const [id,records] of Object.entries(f.catches))if(!records||typeof records!=='object'||Array.isArray(records)||!Object.entries(records).every(([family,n])=>fishingSpot(id).families.includes(family)&&Number.isInteger(n)&&n>=1&&n<=9999))throw new Error('存档中的水岸缔约记录损坏。');
 if(!Object.values(f.released).every(n=>Number.isInteger(n)&&n>=1&&n<=9999)||!Object.values(f.claimed).every(v=>v===true)||!Object.values(f.choices).every(n=>n===0||n===1))throw new Error('存档中的水岸故事损坏。');
 for(const s of FISHING_SPOTS)if(!!f.claimed[s.id]!==Number.isInteger(f.choices[s.id])||f.claimed[s.id]&&fishingProgress(game,s.id).count!==3)throw new Error('存档中的水岸答谢不一致。');
 f.grandClaimed??=false;if(typeof f.grandClaimed!=='boolean'||f.grandClaimed!==FISHING_SPOTS.every(s=>f.claimed[s.id]))throw new Error('存档中的水岸总记录损坏。');
 f.active??=null;const a=f.active;if(!a)return;const spot=fishingSpot(a.spot);
 if(!spot||!FISHING_LURES[a.lure]||!spot.families.includes(a.family)||!['line','landed','battle'].includes(a.phase)||!FISHING_SIGNALS[a.signal])throw new Error('存档中的钓线状态损坏。');
 for(const [k,min,max] of [['turn',0,12],['progress',0,8],['tension',0,9],['mistakes',0,12],['level',CHAPTERS[spot.region].level,CHAPTERS[spot.region].level+2],['limit',7,10],['seed',0,4294967295]])if(!Number.isInteger(a[k])||a[k]<min||a[k]>max)throw new Error('存档中的钓线数值损坏。');
 if(a.mistakes>a.turn||a.tension>=a.limit||a.phase==='line'&&(a.progress===8||a.turn>=12)||a.phase!=='line'&&a.progress!==8||a.phase==='battle'&&!game.suspendedBattle)throw new Error('存档中的钓线进度不一致。');
}
