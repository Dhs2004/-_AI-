import {CHAPTERS,SPECIES} from './data.js';
import {OUTDOOR_AREAS} from './outdoor-areas.js';

export const HABITATS=[
 {family:'kitesquid',region:1,sector:2,kind:'sign',point:{x:39,y:23},title:'逆风漂来的纸船',observer:'采风人 · 叶笺',
  intro:'我原以为有人把信丢进了河里，追到长堤才发现，那些白色折角会自己转弯。请替我看看，是谁在给风写信。',
  clue:'堤边的旧信笺全朝上游折着角。每当风从背后吹来，水洼里的小纸帆就躲进芦苇；只有逆着风的那一只，还留在原处。',
  choices:['向水面大声打招呼','把落叶折成迎风的小帆','追着纸影跑过长堤'],answer:1,
  retry:'纸影又缩回了芦苇。再看看那些折角朝着哪一边。',arrival:'落叶帆稳稳停住。纸帆鱿从水面舒展开来，触腕轻轻碰了碰你的作品，像是在回信。',
  ending:'原来它学会的每一种折法，都来自一座不同的港口。这次它终于有了愿意一起远行的收信人。',reward:{greatorb:3,featherCharm:1}},
 {family:'glassbeetle',region:2,sector:1,kind:'crystal',point:{x:33,y:24},title:'灰烬中的彩色缺口',observer:'磨镜学徒 · 砂禾',
  intro:'工坊送来的废玻璃一夜少了半筐，却多出一串彩虹。我想知道捡走碎片的小客人，究竟在拼什么。',
  clue:'灰烬上排列着红、黄、蓝三种玻璃。它们并不相碰，却在阳光下投出一条连贯的彩带。最后一片的影子被枯叶遮住了。',
  choices:['把玻璃全堆到一起','把最亮的碎片举到眼前','移开遮光的枯叶'],answer:2,
  retry:'细小的足迹停住了。那些碎片似乎在等一道连起来的光。',arrival:'彩带接上了缺口。棱砂甲虫从灰堆里钻出，背甲的颜色依次亮起，把你的影子也收进了图案。',
  ending:'它没有把裂缝抹掉，而是让光从裂缝经过。工坊准备为这样的背甲留一扇永远开着的小窗。',reward:{greatorb:3,shellCharm:1}},
 {family:'clockmouse',region:3,sector:2,kind:'sign',point:{x:37,y:16},title:'钟声之间的小脚步',observer:'见习报时员 · 点点',
  intro:'大家都在听整点的钟声，只有我听见两声之间还有小小的脚步。它好像在等一个总是迟到的人。',
  clue:'报时庭里传出“两短、一停”的轻响。石阶上的爪印每隔两步便并在一起，旁边还有一串更小、更慢的足迹。',
  choices:['轻敲两下，再留一拍安静','不停地敲出同样的两声','顺着脚印快速追过去'],answer:0,
  retry:'小脚步暂时躲到了钟座背后。脚印之间那段空白，也许也是节拍的一部分。',arrival:'安静的一拍里，齿铃鼠探出头，等身后的小伙伴跟上。它摇响尾尖，邀请你一起试试这个节拍。',
  ending:'它把最准确的报时留给钟，把多出来的一拍留给朋友。原来慢一点，也能让大家准时抵达。',reward:{greatorb:3,emberCharm:1}},
 {family:'frostotter',region:4,sector:1,kind:'crystal',point:{x:21,y:25},title:'冰面上的暖石圈',observer:'雪原记录员 · 冬禾',
  intro:'冰湖每隔一段就有一块不结霜的小石头。我量过温度，发现最暖的那块，总在最矮的脚印旁边。',
  clue:'一圈光滑的暖石围着浅浅的冰洞，石圈外留了一个空位。旁边的便笺写着：“不打碎浮冰，不堵住回家的洞，给后来者留一处歇脚。”',
  choices:['敲开冰洞让湖水流出来','把旁边的圆石放在空位','把石圈堆高，堵住风口'],answer:1,
  retry:'冰洞里只有水纹。留给后来者的空位，或许正在等一块合适的石头。',arrival:'圆石刚好填上空位。雪沫獭抱着另一块暖石浮出水面，把它推到你的脚边，才安心爬上冰岸。',
  ending:'最后一块暖石终于留给了它自己。记录本上写着：照顾同伴，也包括让自己好好休息。',reward:{greatorb:3,heartCharm:1}}
];
export const habitatFor=family=>HABITATS.find(h=>h.family===family);
export const habitatName=h=>`${CHAPTERS[h.region].island} · ${OUTDOOR_AREAS[h.region].areas[h.sector].name}`;
export function speciesHabitats(family){
 return [...CHAPTERS.filter(c=>c.wild.some(id=>SPECIES[id].family===family)).map(c=>c.route),...HABITATS.filter(h=>h.family===family).map(habitatName)];
}
// Original residents keep equal weights. New residents are one ninth of the
// pool only in their authored outdoor sector; dungeon pools remain unchanged.
export function wildPool(region,place='route',sector=0){
 const residents=CHAPTERS[region].wild;
 const newcomers=place==='route'?HABITATS.filter(h=>h.region===region&&h.sector===sector).map(h=>h.family):[];
 return newcomers.length?[...residents,...residents,...newcomers]:residents;
}
export function ecologyStatus(game,family){
 const h=habitatFor(family);if(!h)throw new Error('这处栖息地尚未记录。');
 const owned=[...(game.caught||[]),...game.party.map(m=>m.species),...(game.reserve||[]).map(m=>m.species)].filter(id=>SPECIES[id]?.family===family);
 const traced=game.ecologyTraces?.[family]===true,caught=owned.length>0,grown=owned.some(id=>SPECIES[id].stage===3),seen=caught||(game.seen||[]).some(id=>SPECIES[id]?.family===family);
 const claimed=game.ecologyRewards?.[family]===true,complete=traced&&caught&&grown;
 return {traced,seen,caught,grown,claimed,complete,ready:complete&&!claimed&&!game.suspendedBattle,steps:Number(traced)+Number(caught)+Number(grown)};
}
export function resolveEcologyTrace(game,family,choice){
 const h=habitatFor(family);if(!h||!Number.isInteger(choice)||!h.choices[choice])throw new Error('请重新观察这处踪迹。');
 if(game.suspendedBattle||game.place!=='route'||game.region!==h.region||game.routeSector!==h.sector)throw new Error('请到手帐记录的栖息地，再观察这处踪迹。');
 if(choice!==h.answer)return {game,found:false,message:h.retry};
 return {game:{...game,ecologyTraces:{...game.ecologyTraces,[family]:true}},found:true,message:h.arrival,species:family,level:CHAPTERS[h.region].level};
}
export function claimEcologyReward(game,family){
 const h=habitatFor(family),status=ecologyStatus(game,family);
 if(status.claimed)return {game,received:{},alreadyClaimed:true};
 if(!status.ready)throw new Error('找到踪迹、与这个家族缔约，并认识最终成长形态后，再来交换记录。');
 if(Object.entries(h.reward).some(([id,n])=>(game.bag[id]||0)+n>9999))throw new Error('行囊已满。先为这份补给留些空间，再来领取。');
 const bag={...game.bag};for(const [id,n] of Object.entries(h.reward))bag[id]=(bag[id]||0)+n;
 return {game:{...game,bag,ecologyRewards:{...game.ecologyRewards,[family]:true}},received:{...h.reward},alreadyClaimed:false};
}
export function validateEcology(game){
 for(const field of ['ecologyTraces','ecologyRewards']){
  game[field]??={};const records=game[field];
  if(!records||typeof records!=='object'||Array.isArray(records)||!Object.entries(records).every(([family,value])=>habitatFor(family)&&typeof value==='boolean'))throw new Error('存档中的生态记录损坏。');
 }
}
