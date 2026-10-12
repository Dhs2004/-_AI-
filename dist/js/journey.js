import {CHAPTERS,ENDING,SIDEQUESTS,SPECIES} from './data.js';
import {EXPEDITIONS} from './expedition-stories.js';
import {expeditionProgress,currentExpeditionStage,EXPEDITION_SITES} from './expedition-engine.js';
import {outdoorArea,outdoorSite} from './outdoor-engine.js';
import {trialAt} from './trial-data.js';

// Recaps reveal only the chapter opening or the conclusion already reached.
const RECAPS=[
 ['你在旧船坞醒来，手里握着一枚失灵的罗盘。阿汐陪你走进灯穗港：十七个人忘记了同一个名字，第一盏星灯正在等人重新点亮。','你们帮港口重新认出归途，也让岚婆记起：叫出一个名字时，会有人回头。第一枚灯印让罗盘再次转动，指向北方的镜湾。'],
 ['镜湾的倒影不再像它的主人。白露请你们替人认领那些被舍弃的记忆，在档案与镜面之间，寻找陌生面孔的来处。','白露找到了星灯计划的记录：闻舟曾想把群岛的记忆存进海里。档案说他已经死去，一本最近借走的书却留下了他的笔迹。'],
 ['旧熔炉烧着寄不出去的信，镇民被最后一句道歉困在原地。铸灯师赫砂提起那支没能返航的船队，也提起星灯计划的代价。','未寄出的信终于可以启程。你们知道闻舟把记忆分成了八份，想救回船队；赫砂提醒你们，星灯首席祁曜也从当年的灾难中活了下来。'],
 ['风带来了明天的片段，钟却慢了一天。有人预言阿汐会消失，弥歌请你们亲自走一遍：可能发生的事，是否一定要发生？','预言没有实现。弥歌说，阿汐是一个尚未完成的愿望；她决定不让这句话替自己写下结局，要亲自找到许愿的人。'],
 ['观测所里，一张旧照片把阿汐与闻舟的女儿连在了一起。陆凛守着迟来的星光，你们沿雪原寻找那段被光照得太慢的往事。','阿汐明白自己来自闻舟未能放下的记忆，也明白今天的风与旅伴并非借来。她选择以自己的名字继续旅行。'],
 ['苔梦岛的树木保守着秘密，树心剧场却在重演船难。年轮中出现了你站在闻舟身边的样子，遗忘正一点点松开手。','你想起自己是星灯计划的领航员，曾决定驶进星潮。阿汐愿意陪你分担自责，而祁曜已经让永昼装置开始运转。'],
 ['永昼城停在最幸福的一瞬，街上的人说着同样的话。祁曜想免去一切悲伤，你们要让这座城重新拥有自己的明天。','永昼装置停了下来。祁曜终于承认，他想留下的是能够原谅自己的瞬间。最后一盏灯的航线随之出现，闻舟还在尽头等待。'],
 ['归零岛汇聚了八盏星灯的记忆。阿汐以现在的自己与闻舟相见，你们整理船帆、路标与出发的勇气，准备把借来的光还给群星。','闻舟终于愿意放手，阿汐也带着自己的名字走向新的相遇。告别没有抹去曾经同行的日子，世界重新流动，群岛迎来普通的清晨。']
];
export const journeyTime=seconds=>{const minutes=Math.floor(Math.max(0,seconds||0)/60);return `${Math.floor(minutes/60)} 小时 ${minutes%60} 分钟`;};
export function chapterVisited(game,region){return Number.isInteger(region)&&region>=0&&region<8&&(region===game.region||!!game.flags?.['entered'+region]||game.badges.includes(region));}
const pending=(game,id)=>game.pendingScenes?.includes(id);
export function journeyNext(game){
 const chapter=CHAPTERS[game.region],battle=game.suspendedBattle;
 if(battle)return {kind:'battle',title:`继续第 ${battle.turn+1} 回合`,detail:battle.context.name||'与野生潮灵的相遇'};
 if(game.pendingScenes?.length)return {kind:'scene',title:'听完尚未说完的话',detail:'继续旅程后，会接上已经保存的剧情。'};
 if(game.ending){const stage=trialAt((game.trial||0)+1);return game.trial<24?{kind:'trial',title:`第 ${stage.floor} 阶试航 · ${stage.title}`,detail:'最后驿站 · 星海试炼',floor:stage.floor}:{kind:'free',title:'带着新的伙伴，再看一遍群岛',detail:'可以继续远海试航、同行纪事与未完成的委托。'};}
 if(game.badges.includes(game.region))return {kind:'travel',title:`启程前往${CHAPTERS[Math.min(7,game.region+1)].island}`,detail:'群岛航图可以选择已经开放的航线。',region:Math.min(7,game.region+1)};
 const fragments=[0,1,2].filter(i=>game.flags?.[`fragment${game.region}-${i}`]).length;
 if(fragments===3)return {kind:'warden',title:game.place==='dungeon'?`${chapter.dungeon} · 第 ${(game.dungeonFloor||0)+1} 层`:`前往${chapter.dungeon}`,detail:game.place==='dungeon'&&game.dungeonFloor<3?'阅读石碑并调整符柱，打开下一层封门。':`三份记忆已找回，寻找${chapter.warden}。`};
 const list=EXPEDITIONS.filter(e=>e.region===game.region&&currentExpeditionStage(game,e.id));
 const expedition=list.find(e=>e.id===game.trackedExpedition)||list.find(e=>expeditionProgress(game,e.id).step>0)||list[0];
 if(expedition){const stage=currentExpeditionStage(game,expedition.id),site=EXPEDITION_SITES[stage.site],area=outdoorSite(game.region,stage.site);return {kind:'expedition',id:expedition.id,title:stage.title,detail:`${expedition.giver} · ${area?.name||chapter[site.place]} · ${site.name}`};}
 return {kind:'explore',title:'寻找这座岛的记忆',detail:chapter.task};
}
export function journeySummary(game){
 const chapter=CHAPTERS[game.region],location=game.place==='route'?outdoorArea(game.region,game.routeSector||0).name:game.place==='dungeon'?`${chapter.dungeon} · 第 ${(game.dungeonFloor||0)+1} 层`:chapter.town;
 return {name:game.name,region:game.region,island:chapter.island,location,time:journeyTime(game.playtime),next:journeyNext(game),badges:new Set(game.badges).size,
  memories:EXPEDITIONS.filter(e=>expeditionProgress(game,e.id).step===e.stages.length).length,
  quests:SIDEQUESTS.filter(q=>game.quest[q.id]==='done').length,
  families:new Set([...game.party,...game.reserve].map(m=>SPECIES[m.species].family)).size,
  companions:game.party.length+game.reserve.length,trial:Math.min(24,game.trial||0),
  chapters:CHAPTERS.map(c=>({id:c.id,visited:chapterVisited(game,c.id),complete:game.badges.includes(c.id)}))};
}
export function chapterJournal(game,region){
 if(!chapterVisited(game,region))return null;
 const chapter=CHAPTERS[region],won=game.badges.includes(region),introRead=!pending(game,'intro'+region),afterRead=won&&!pending(game,'after'+region);
 const scenes=[];
 if(introRead)scenes.push({id:'intro'+region,title:'初次抵达',role:'companion',lines:chapter.intro});
 if(won||game.flags?.['faced'+region]||game.suspendedBattle?.context.kind==='boss'&&game.suspendedBattle.context.region===region)scenes.push({id:'before'+region,title:'灯前的约定',role:'warden',lines:chapter.before});
 if(afterRead)scenes.push({id:'after'+region,title:'星灯亮起之后',role:'warden',lines:chapter.after});
 if(region===7&&game.ending&&!pending(game,'ending'))scenes.push({id:'ending',title:'群星归潮',role:'companion',lines:ENDING});
 return {chapter,won,recap:afterRead&&!(region===7&&pending(game,'ending'))?RECAPS[region][1]:introRead?RECAPS[region][0]:'这一段相遇还没有说完。继续旅程，听完他们的话，再把故事收进手记。',scenes,
  expeditions:EXPEDITIONS.filter(e=>e.region===region).map(e=>{const progress=expeditionProgress(game,e.id);return {id:e.id,title:e.title,giver:e.giver,role:e.role,step:progress.step,total:e.stages.length,legacy:!!progress.legacy};})};
}
/** Pure reader: selects completed scenes and the player's own responses only.
 * It never advances a stage, marks a scene read or awards items. */
export function expeditionRecollection(game,id){
 const expedition=EXPEDITIONS.find(e=>e.id===id);
 if(!expedition||!chapterVisited(game,expedition.region))return null;
 const progress=expeditionProgress(game,id);if(!progress.step)return null;
 const sections=expedition.stages.slice(0,progress.step).map((stage,index)=>{
  const selected=stage.choices?.[progress.choices[stage.id]],replyRead=!pending(game,`exp-choice:${id}:${stage.id}`);
  return {id:stage.id,number:index+1,title:stage.title,kind:stage.kind,lines:stage.lines,choice:selected?{label:selected.label,reply:replyRead?selected.reply:[],unread:!replyRead}:null,
   legacyChoice:progress.legacy&&stage.kind==='choice',success:stage.kind==='sequence'?stage.success:null};
 });
 const ending=progress.step===expedition.stages.length&&!pending(game,'exp-end:'+id)?expedition.ending:[];
 return {id,region:expedition.region,title:expedition.title,giver:expedition.giver,role:expedition.role,legacy:!!progress.legacy,sections,ending};
}
