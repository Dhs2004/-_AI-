import {moveList,learnedMoves,validateLoadout} from './moves.js';
export {moveList,learnedMoves} from './moves.js';
import {planEnemyAction} from './battle-ai.js';
import {validateRelics} from './relic-engine.js';
import {freshTraitState,enterTrait,guardTrait,damagedTrait,acceptStatus,outgoingTrait,incomingTrait,shieldFactor,recoveryFactor,basicRecovery,traitPriority,attackedTrait,validateTraitState} from './abilities.js';
import {SPECIES,MOVES,ELEMENTS,ITEMS,CHAPTERS,SIDEQUESTS,VERSION,STATUS,WEATHER} from './data.js';
import {SIDE_STORIES} from './stories.js';
import {advanceExpedition,currentExpeditionStage,expeditionScene,validateExpeditions} from './expedition-engine.js';

export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const clone=x=>JSON.parse(JSON.stringify(x));
export function random(rng){rng.seed=(Math.imul(rng.seed,1664525)+1013904223)>>>0;return rng.seed/4294967296;}
export function stats(mon){
 const s=SPECIES[mon.species],l=mon.level,b=s.base;
 const out={hp:Math.floor(b[0]*1.4+l*5+16),atk:Math.floor(b[1]*.65+l*2.4),def:Math.floor(b[2]*.65+l*2.1),spd:Math.floor(b[3]*.7+l*1.8)};
 const e=ITEMS[mon.equip]?.equip;if(e)out[e]=Math.floor(out[e]*(e==='atk'?1.12:1.15));return out;
}
let serial=0;
export function createMon(species,level=5,seed=1){
 if(!SPECIES[species])throw new Error('Unknown species '+species);
 const mon={uid:`m${Date.now().toString(36)}${(++serial).toString(36)}${seed}`,species,level:clamp(level,1,65),xp:0,hp:0,energy:5,status:null,statusTurns:0,equip:null,bond:0};mon.hp=stats(mon).hp;return mon;
}
export function createGame(name='旅人',starter='budfox'){
 const mon=createMon(starter,5);return {version:VERSION,name:name.trim().slice(0,12)||'旅人',region:0,place:'town',x:18,y:19,facing:'down',party:[mon],reserve:[],bag:{potion:8,superpotion:0,revive:2,cure:3,orb:10,greatorb:0,herb:0,shard:0},gold:550,badges:[],flags:{intro:true},quest:{},collected:{},wins:{},trainerWins:{},seen:[starter],caught:[starter],steps:0,playtime:0,createdAt:Date.now(),lastSave:0,difficulty:'normal',sound:true,reduceMotion:false,battleSpeed:1,seed:(Date.now()>>>0),ending:false,trial:0,dungeonFloor:0,routeSector:0,runes:{},openGates:{},pendingScenes:[],suspendedBattle:null,relics:{},expeditions:{},trackedExpedition:null};
}
export function healParty(g){for(const m of g.party){m.hp=stats(m).hp;m.energy=5;m.status=null;m.statusTurns=0;}}
export function xpNeed(m){return 35+m.level*22;}
/** Level-relative rewards discourage trivial farming and help new team members
 * catch up. Existing level/XP totals are preserved when old saves are opened. */
export function battleExperience(mon,enemies,participated=true){
 const average=enemies.reduce((sum,m)=>sum+m.level,0)/enemies.length;
 const base=enemies.reduce((sum,m)=>sum+40+m.level*12,0)/Math.sqrt(enemies.length);
 const challenge=clamp(((average+8)/(mon.level+8))**2,.15,2.5);
 return Math.max(1,Math.floor(base*.45*challenge*(participated?1:.85)));
}
export function gainXP(mon,amount){
 const changes=[];const wasFainted=mon.hp<=0;mon.xp+=amount;
 while(mon.level<65&&mon.xp>=xpNeed(mon)){mon.xp-=xpNeed(mon);const old=stats(mon).hp,previousSkills=learnedMoves(mon);mon.level++;mon.hp+=stats(mon).hp-old;changes.push(`${SPECIES[mon.species].name} 升到了 ${mon.level} 级！`);
  const species=SPECIES[mon.species];if(species.evolve&&mon.level>=species.evolveAt){const oldHP=stats(mon).hp;mon.species=species.evolve;mon.hp+=stats(mon).hp-oldHP;changes.push(`${species.name} 进化为 ${SPECIES[mon.species].name}！`);}
  for(const key of learnedMoves(mon))if(!previousSkills.includes(key))changes.push(`${SPECIES[mon.species].name} 领悟了「${MOVES[key].name}」，可在技能记忆中调整。`);
 }
 if(mon.level===65)mon.xp=0;if(wasFainted)mon.hp=0;return changes;
}
export function effectiveness(element,target){if(!element)return 1;return ELEMENTS[element].strong.includes(target)?1.6:ELEMENTS[element].weak.includes(target)?.7:1;}
export function makeBattle(g,enemy,context={}){
 const b={party:clone(g.party),enemies:clone(enemy),activeP:g.party.findIndex(m=>m.hp>0),activeE:0,turn:0,weather:CHAPTERS[g.region].weather,seed:g.seed>>>0,log:[],history:[],outcome:null,caught:null,inventory:clone(g.bag),context:{kind:'wild',region:g.region,...context}};
 if(b.activeP<0)throw new Error('No healthy companion');
 b.participants=[b.party[b.activeP].uid];b.enemySupportStreak=0;
 for(const m of [...b.party,...b.enemies]){m.energy=5;m.shield=0;m.focus=0;m.statusTurns=m.status?2:0;m.battleTrait=freshTraitState();}
 b.log=[context.kind==='boss'||context.kind==='trainer'?`${context.name} 向你发起挑战！`:`野生的 ${SPECIES[b.enemies[0].species].name} 出现了！`];enterTrait(b,b.party[b.activeP]);enterTrait(b,b.enemies[b.activeE]);b.enemyPlan=prepareEnemyPlan(b);return b;
}
function log(b,t){b.log.push(t);}
function roll(b,p){return random(b)<p;}
function maxhp(m){return stats(m).hp;}
function monName(m){return SPECIES[m.species].name;}
function speed(m){return stats(m).spd*(m.status==='shock'?.55:m.status==='root'?.65:1);}
function weatherBoost(element,weather){if(weather==='rain')return element==='tide'?1.25:element==='ember'?.8:1;if(weather==='sun')return element==='ember'?1.25:element==='tide'?.8:1;if(weather==='snow'&&element==='frost'||weather==='sand'&&element==='stone'||weather==='mist'&&element==='shade')return 1.2;return 1;}
export function estimateDamage(a,d,move,weather='clear'){
 const m=MOVES[move];if(!m||!m.power)return 0;
 return Math.max(1,Math.floor(((a.level*.4+2)*m.power*stats(a).atk/stats(d).def/18+3)*effectiveness(m.element,SPECIES[d.species].element)*(m.element===SPECIES[a.species].element?1.2:1)*weatherBoost(m.element,weather)*(a.focus?1.45:1)*shieldFactor(d)*(a.status==='burn'?.85:1)*outgoingTrait(a,d,m,maxhp(d))*incomingTrait(d,weather,maxhp(d))));
}
function prepareEnemyPlan(b){return planEnemyAction(b,{damage:estimateDamage,stats,moves:moveList,random});}
function enemyAction(b,action){
 if(action.type==='switch'){
  b.events.push({kind:'switch',source:b.enemies[b.activeE].uid,target:b.enemies[action.index].uid,element:SPECIES[b.enemies[action.index].species].element});
  b.activeE=action.index;b.lastEnemySwitch=b.turn;
  log(b,`对方调整了阵容，派出 ${monName(b.enemies[b.activeE])}！`);enterTrait(b,b.enemies[b.activeE]);return;
 }
 const actor=b.enemies[b.activeE];
 if(action.type==='guard'){
  actor.energy=Math.min(5,actor.energy+2);actor.shield=Math.max(actor.shield||0,2);
  b.events.push({kind:'buff',source:actor.uid,target:actor.uid,element:'light'});
  log(b,`${monName(actor)} 稳住阵脚，回复 2 点能量并获得护盾。`);guardTrait(b,actor,maxhp(actor));return;
 }
 hit(b,actor,b.party[b.activeP],action.move);
}
function hit(b,actor,target,key){
 if(actor.hp<=0||target.hp<=0)return;
 if(actor.status==='sleep'){actor.statusTurns--;if(actor.statusTurns>0){log(b,`${monName(actor)} 还在梦中。`);actor.energy=Math.min(5,actor.energy+1);return;}actor.status=null;log(b,`${monName(actor)} 醒来了。`);}
 if(actor.status==='shock'&&roll(b,.12)){log(b,`${monName(actor)} 因麻痹无法行动。`);return;}
 const move=MOVES[key],event={kind:move.heal?'heal':move.shield||move.boost?'buff':'attack',source:actor.uid,target:move.heal||move.shield||move.boost?actor.uid:target.uid,element:move.element||'light',move:key};b.events.push(event);actor.energy=clamp(actor.energy-move.cost+(move.cost===0?(key==='tackle'?basicRecovery(actor):1):0),0,5);log(b,`${monName(actor)} 使用了「${move.name}」！`);
 if(move.power){const crit=roll(b,.075);let dmg=Math.round(estimateDamage(actor,target,key,b.weather)*(.92+random(b)*.16)*(crit?1.45:1));dmg=Math.min(target.hp,dmg);target.hp-=dmg;actor.focus=0;event.damage=dmg;event.critical=crit;
  const eff=effectiveness(move.element,SPECIES[target.species].element);log(b,`${crit?'会心一击！':''}${eff>1?'属性克制！':eff<1?'效果有所减弱。':''}造成 ${dmg} 点伤害。`);
  damagedTrait(b,target,maxhp(target));attackedTrait(b,actor,move);
  if(move.drain){const amount=Math.min(maxhp(actor)-actor.hp,Math.ceil(dmg*move.drain));actor.hp+=amount;b.events.push({kind:'heal',source:actor.uid,target:actor.uid,element:move.element,amount,move:key});log(b,`${monName(actor)} 吸取了 ${amount} 点生命。`);}
  if(move.recoil){const damage=Math.min(actor.hp-1,Math.ceil(maxhp(actor)*move.recoil));actor.hp-=damage;b.events.push({kind:'recoil',source:actor.uid,target:actor.uid,element:move.element,damage,move:key});log(b,`${monName(actor)} 因反噬损失 ${damage} 点生命。`);}
 }
 if(move.heal){const amount=Math.min(maxhp(actor)-actor.hp,Math.floor(maxhp(actor)*move.heal*recoveryFactor(actor)));actor.hp+=amount;event.amount=amount;log(b,`${monName(actor)} 恢复了 ${amount} 点生命。`);}
 if(move.shield)actor.shield=move.shield+1;if(move.boost)actor.focus=move.boost;
 if(move.cleanse){actor.status=null;actor.statusTurns=0;}
 if(move.status&&target.hp>0&&!target.status&&roll(b,move.chance)&&acceptStatus(b,target,move.status)){target.status=move.status;target.statusTurns=move.status==='sleep'?2:4;log(b,`${monName(target)} 陷入${{burn:'灼伤',poison:'中毒',sleep:'入眠',shock:'麻痹',root:'缠绕'}[move.status]}！`);}
}
function tick(b,m){
 if(m.hp<=0)return;
 if(m.status==='burn'||m.status==='poison'){const loss=Math.min(m.hp,Math.max(1,Math.floor(maxhp(m)*(m.status==='poison'?.09:.06))));m.hp-=loss;b.events.push({kind:'status',source:m.uid,target:m.uid,element:SPECIES[m.species].element,damage:loss,status:m.status});log(b,`${monName(m)} 因${m.status==='poison'?'中毒':'灼伤'}损失 ${loss} 点生命。`);}
 if(m.status&&m.status!=='sleep'){m.statusTurns--;if(m.statusTurns<=0){m.status=null;log(b,`${monName(m)} 从异常状态中恢复了。`);}}
 if(m.shield)m.shield--;
}
function checkEnd(b){
 const p=b.party[b.activeP],e=b.enemies[b.activeE];
 if(e.hp<=0){b.events.push({kind:'faint',source:e.uid,target:e.uid,element:SPECIES[e.species].element});log(b,`${monName(e)} 倒下了。`);const next=b.enemies.findIndex(m=>m.hp>0);if(next<0)b.outcome='win';else{b.events.push({kind:'switch',source:e.uid,target:b.enemies[next].uid,element:SPECIES[b.enemies[next].species].element});b.activeE=next;log(b,`对方派出了 ${monName(b.enemies[next])}！`);enterTrait(b,b.enemies[next]);}}
 if(p.hp<=0){b.events.push({kind:'faint',source:p.uid,target:p.uid,element:SPECIES[p.species].element});log(b,`${monName(p)} 倒下了。`);const next=b.party.findIndex(m=>m.hp>0);if(next<0)b.outcome='lose';else{b.events.push({kind:'switch',source:p.uid,target:b.party[next].uid,element:SPECIES[b.party[next].species].element});b.activeP=next;if(!b.participants.includes(b.party[next].uid))b.participants.push(b.party[next].uid);log(b,`上吧，${monName(b.party[next])}！`);enterTrait(b,b.party[next]);}}
}
export function takeTurn(original,action){
 if(original.outcome)return original;
 const b=clone(original),p=b.party[b.activeP],e=b.enemies[b.activeE];b.log=[];b.events=[];
 const invalid=msg=>({...original,error:msg});
 if(action.type==='move'&&(!moveList(p).includes(action.move)||MOVES[action.move].cost>p.energy))return invalid('能量不足，或这只潮灵尚未掌握此技能。');
 if(action.type==='switch'&&(!b.party[action.index]||action.index===b.activeP||b.party[action.index].hp<=0))return invalid('请选择另一只可以战斗的潮灵。');
 if(action.type==='item'&&(!ITEMS[action.item]||!b.inventory[action.item]))return invalid('背包里没有这件道具。');
 if(action.type==='capture'&&(b.context.kind!=='wild'||!ITEMS[action.item]?.catch||!b.inventory[action.item]))return invalid('现在无法使用这枚星约石。');
 if(action.type==='run'&&b.context.kind!=='wild')return invalid('这是一场约定好的对战，不能离开。');
 if(!['move','guard','switch','item','capture','run'].includes(action.type))return invalid('未知指令。');
 b.participants??=[p.uid];const enemyPlan=b.enemyPlan||prepareEnemyPlan(b),opponentAction=enemyPlan.action;b.turn++;delete b.error;
 b.enemySupportStreak=opponentAction.type==='guard'||opponentAction.type==='move'&&!MOVES[opponentAction.move].power?(b.enemySupportStreak||0)+1:0;
 if(action.type==='capture'){
  b.events.push({kind:'capture',source:p.uid,target:e.uid,element:'light'});
  b.inventory[action.item]--;const hpRate=e.hp/maxhp(e),rarity=SPECIES[e.species].rarity;const chance=clamp((.22+.62*(1-hpRate)+(e.status?.12:0))*ITEMS[action.item].catch/Math.sqrt(rarity),.08,.96);
  log(b,`你举起了${ITEMS[action.item].name}。星光缓缓围住${monName(e)}……`);
  if(roll(b,chance)){b.caught=clone(e);b.caught.status=null;b.caught.statusTurns=0;b.caught.hp=Math.max(1,b.caught.hp);b.outcome='capture';log(b,`缔约成功！${monName(e)} 愿意与你同行。`);}else{log(b,'星光散开了，再让它了解你一些吧。');enemyAction(b,opponentAction);}
 }else if(action.type==='run'){
  if(roll(b,.8)||b.turn>=3){b.outcome='run';log(b,'你们平安回到了小路上。');}else{log(b,'一时没找到离开的空隙。');enemyAction(b,opponentAction);}
 }else if(action.type==='switch'){b.events.push({kind:'switch',source:p.uid,target:b.party[action.index].uid,element:SPECIES[b.party[action.index].species].element});b.activeP=action.index;if(!b.participants.includes(b.party[b.activeP].uid))b.participants.push(b.party[b.activeP].uid);log(b,`辛苦了！${monName(b.party[b.activeP])}，拜托你了！`);enterTrait(b,b.party[b.activeP]);enemyAction(b,opponentAction);
 }else if(action.type==='guard'){b.events.push({kind:'buff',source:p.uid,target:p.uid,element:'light'});p.energy=Math.min(5,p.energy+2);p.shield=Math.max(p.shield,2);log(b,`${monName(p)} 稳住阵脚，回复 2 点能量并获得护盾。`);guardTrait(b,p,maxhp(p));enemyAction(b,opponentAction);
 }else if(action.type==='item'){
  const item=ITEMS[action.item],target=b.party[action.target??b.activeP];if(!target)return invalid('请选择道具的目标。');const previousHP=target.hp;
  if(item.revive){if(target.hp>0)return invalid('这只潮灵还没有倒下。');target.hp=Math.ceil(maxhp(target)*.5);target.status=null;}
  else if(item.heal){if(target.hp<=0)return invalid('需要先用回声种唤醒它。');if(target.hp>=maxhp(target))return invalid('它的生命已经恢复满了。');target.hp=Math.min(maxhp(target),target.hp+item.heal);}
  else if(item.cleanse){if(!target.status)return invalid('它没有异常状态。');target.status=null;}else return invalid('这件道具不能在战斗中使用。');
  b.events.push({kind:'heal',source:p.uid,target:target.uid,element:'moss',amount:target.hp-previousHP,item:action.item});b.inventory[action.item]--;log(b,`对 ${monName(target)} 使用了${item.name}。`);enemyAction(b,opponentAction);
 }else if(opponentAction.type!=='move'){
  enemyAction(b,opponentAction);hit(b,p,b.enemies[b.activeE],action.move);
 }else{
  const enemyMove=opponentAction.move;
  const pPriority=(MOVES[action.move].priority||0)+traitPriority(p,MOVES[action.move]),ePriority=(MOVES[enemyMove].priority||0)+traitPriority(e,MOVES[enemyMove]);
  const first=pPriority>ePriority||(pPriority===ePriority&&speed(p)>=speed(e));
  if(first){hit(b,p,e,action.move);hit(b,e,p,enemyMove);}else{hit(b,e,p,enemyMove);hit(b,p,e,action.move);}
 }
 if(!b.outcome){tick(b,b.party[b.activeP]);tick(b,b.enemies[b.activeE]);checkEnd(b);}
 if(b.enemies[b.activeE].uid!==e.uid)b.enemySupportStreak=0;
 if(!b.outcome)b.enemyPlan=prepareEnemyPlan(b);else b.enemyPlan=null;
 b.history=[...b.history,...b.log].slice(-80);return b;
}
export function settleBattle(game,b){
 let g=clone(game);g.party=clone(b.party);g.bag=clone(b.inventory);g.seed=b.seed;const events=[];
 for(const m of g.party){delete m.shield;delete m.focus;delete m.battleTrait;m.energy=5;}
 for(const m of b.enemies)if(!g.seen.includes(m.species))g.seen.push(m.species);
 if(b.outcome==='win'||b.outcome==='capture'){
  const participants=new Set(b.participants||[b.party[b.activeP].uid]);g.gold+=b.context.kind==='boss'?350+g.region*220:35+b.enemies[0].level*7;
  for(const m of g.party){events.push(...gainXP(m,battleExperience(m,b.enemies,participants.has(m.uid))));m.bond=Math.min(100,m.bond+1);}
  g.wins[g.region]=(g.wins[g.region]||0)+1;
  if(b.outcome==='win'&&b.context.trainer){g.trainerWins??={};g.trainerWins[b.context.trainer]=Math.min(9999,(g.trainerWins[b.context.trainer]||0)+1);}
  if(b.caught){const caught=clone(b.caught);delete caught.shield;delete caught.focus;delete caught.battleTrait;caught.energy=5;if(g.party.length<6)g.party.push(caught);else g.reserve.push(caught);if(!g.caught.includes(caught.species))g.caught.push(caught.species);events.push(`${SPECIES[caught.species].name} 已加入${g.party.length>=6&&g.reserve.some(m=>m.uid===caught.uid)?'潮灵驿站':'队伍'}。`);}
  for(const m of g.party)if(!g.caught.includes(m.species))g.caught.push(m.species);
  if(b.context.kind==='boss'&&!g.badges.includes(g.region)){g.badges.push(g.region);g.flags['won'+g.region]=true;events.push(`获得${CHAPTERS[g.region].reward}！`);g.pendingScenes??=[];g.pendingScenes.push('after'+g.region);if(g.region===7){g.ending=true;g.pendingScenes.push('ending');}}
  if(b.context.expedition&&b.outcome==='win'){const result=advanceExpedition(g,b.context.expedition,b.context.stage,{victory:true});g=result.game;events.push('地区冒险有了新的进展，查看手记中的下一站。');}
  if(b.context.kind==='trial'){g.trial=Math.max(g.trial||0,b.context.floor);g.gold+=b.context.floor*45;g.bag.greatorb=(g.bag.greatorb||0)+1;events.push(`星海试炼第 ${b.context.floor} 阶完成。获得辉光星约石与额外星砂。`);}
 }else if(b.outcome==='lose'){g.gold=Math.max(0,g.gold-Math.min(150,Math.floor(g.gold*.08)));healParty(g);g.place='town';g.dungeonFloor=0;g.routeSector=0;g.x=18;g.y=19;events.push('阿汐带你们回到了镇上的潮灵诊所。休息后再试一次吧。');}
 return {game:g,events};
}
export function questReady(g,q){
 if(q.kind==='deliver')return (g.bag[q.item]||0)>=q.need;
 if(q.kind==='capture')return g.caught.some(id=>SPECIES[id]?.family===SPECIES[q.species].family);
 return (g.wins[q.region]||0)>=q.need;
}
export function completeStory(game,id,index){
 const story=SIDE_STORIES.find(s=>s.id===id);
 if(!story||!Number.isInteger(index)||!story.choices[index])throw new Error('这段故事的选项不存在。');
 const g=clone(game);g.stories??={};
 if(g.stories[id]!==undefined)return {game:g,choice:story.choices[g.stories[id]],alreadyComplete:true};
 const choice=story.choices[index];g.stories[id]=index;g.gold+=choice.reward.gold;
 for(const [item,n] of Object.entries(choice.reward.items))g.bag[item]=(g.bag[item]||0)+n;
 return {game:g,choice,alreadyComplete:false};
}

/** Persist only a fully resolved, nonterminal turn. Rewards are in game after
 * terminal settlement, so an ended encounter must never be resumed/rewarded twice. */
export function checkpointGame(game,battle){
 return {...game,suspendedBattle:battle&&!battle.outcome?clone(battle):null};
}
function validateBattleMon(mon){
 if(!mon||!SPECIES[mon.species]||!Number.isInteger(mon.level)||mon.level<1||mon.level>65||typeof mon.uid!=='string'||!mon.uid||mon.uid.length>120)throw new Error('存档中的对战潮灵无效。');
 for(const field of ['hp','xp','energy'])if(!Number.isFinite(mon[field]))throw new Error('存档中的对战数值损坏。');
 if(mon.hp<0||mon.hp>stats(mon).hp||mon.xp<0||!Number.isInteger(mon.energy)||mon.energy<0||mon.energy>5)throw new Error('存档中的对战数值超出范围。');
 if(mon.status!==null&&mon.status!==undefined&&!STATUS[mon.status])throw new Error('存档中的异常状态不存在。');
 for(const field of ['shield','focus','statusTurns'])if(mon[field]!==undefined&&(!Number.isFinite(mon[field])||mon[field]<0||mon[field]>20))throw new Error('存档中的临时战斗状态损坏。');
 validateTraitState(mon.battleTrait);validateLoadout(mon);return mon;
}
export function validateSuspendedBattle(input,game){
 if(!input||typeof input!=='object'||Array.isArray(input)||input.outcome)throw new Error('存档中的对战已经结束或无法读取。');
 const battle=clone(input);
 if(!Array.isArray(battle.party)||battle.party.length!==game.party.length||!Array.isArray(battle.enemies)||battle.enemies.length<1||battle.enemies.length>6)throw new Error('存档中的对战队伍损坏。');
 const ids=new Set();
 for(const mon of [...battle.party,...battle.enemies]){validateBattleMon(mon);if(ids.has(mon.uid))throw new Error('存档中的对战伙伴重复。');ids.add(mon.uid);}
 for(let i=0;i<game.party.length;i++)if(battle.party[i].uid!==game.party[i].uid||battle.party[i].species!==game.party[i].species||battle.party[i].level!==game.party[i].level)throw new Error('对战队伍与旅途存档不一致。');
 for(let i=0;i<game.party.length;i++)if(moveList(battle.party[i]).join(',')!==moveList(game.party[i]).join(','))throw new Error('对战技能与旅途伙伴的搭配不一致。');
 if(!Number.isInteger(battle.activeP)||!Number.isInteger(battle.activeE)||!battle.party[battle.activeP]?.hp||!battle.enemies[battle.activeE]?.hp)throw new Error('存档中的出战伙伴无效。');
 battle.participants??=[battle.party[battle.activeP].uid];
 if(!Array.isArray(battle.participants)||!battle.participants.length||battle.participants.length>battle.party.length||new Set(battle.participants).size!==battle.participants.length||!battle.participants.includes(battle.party[battle.activeP].uid)||!battle.participants.every(id=>battle.party.some(m=>m.uid===id)))throw new Error('存档中的参战记录损坏。');
 if(!Number.isInteger(battle.turn)||battle.turn<0||battle.turn>100000||!Number.isInteger(battle.seed)||battle.seed<0||battle.seed>4294967295||!WEATHER[battle.weather])throw new Error('存档中的对战回合损坏。');
 if(!battle.context||!['wild','trainer','boss','trial'].includes(battle.context.kind)||battle.context.region!==game.region)throw new Error('存档中的对战地点损坏。');
 if(battle.context.expedition){const stage=currentExpeditionStage(game,battle.context.expedition);if(battle.context.kind!=='trainer'||stage?.id!==battle.context.stage||stage.kind!=='battle')throw new Error('存档中的冒险对战不一致。');}
 if(!battle.inventory||typeof battle.inventory!=='object'||Array.isArray(battle.inventory))throw new Error('存档中的对战背包损坏。');
 for(const [id,count] of Object.entries(battle.inventory))if(!ITEMS[id]||!Number.isInteger(count)||count<0||count>9999)throw new Error('存档中的对战道具损坏。');
 for(const field of ['log','history']){if(!Array.isArray(battle[field])||!battle[field].every(s=>typeof s==='string'&&s.length<=1000))throw new Error('存档中的对战记录损坏。');battle[field]=battle[field].slice(field==='log'?-30:-80);}
 if(battle.context.kind==='trial'&&(!Number.isInteger(battle.context.floor)||battle.context.floor<1))throw new Error('存档中的试炼层数损坏。');
 if(battle.lastEnemySwitch!==undefined&&(!Number.isInteger(battle.lastEnemySwitch)||battle.lastEnemySwitch<0||battle.lastEnemySwitch>battle.turn))throw new Error('存档中的对手轮换记录损坏。');
 battle.enemySupportStreak??=0;
 if(!Number.isInteger(battle.enemySupportStreak)||battle.enemySupportStreak<0||battle.enemySupportStreak>battle.turn)throw new Error('存档中的对手战术记录损坏。');
 if(battle.enemyPlan){
  const plan=battle.enemyPlan,actor=battle.enemies[battle.activeE],action=plan.action;
  if(plan.actor!==actor.uid||!action||!['move','guard','switch'].includes(action.type))throw new Error('存档中的对手意图损坏。');
  if(action.type==='move'&&(!moveList(actor).includes(action.move)||MOVES[action.move].cost>actor.energy))throw new Error('存档中的对手技能无效。');
  if(action.type==='switch'&&(!Number.isInteger(action.index)||action.index===battle.activeE||!battle.enemies[action.index]?.hp))throw new Error('存档中的对手轮换无效。');
 }else battle.enemyPlan=prepareEnemyPlan(battle);
 battle.context.name=String(battle.context.name||'').slice(0,100);battle.outcome=null;battle.caught=null;delete battle.events;delete battle.error;
 return battle;
}
export function validateSave(input){
 if(!input||typeof input!=='object'||!Array.isArray(input.party)||!input.party.length||input.party.length>6||!input.bag||!Array.isArray(input.badges))throw new Error('存档结构不完整。');
 const g=clone(input);if(!Number.isInteger(g.region)||g.region<0||g.region>7)throw new Error('存档地图不存在。');
 if(!['town','route','dungeon'].includes(g.place))throw new Error('存档地点不存在。');
 if(g.reserve!==undefined&&!Array.isArray(g.reserve))throw new Error('存档驿站数据损坏。');
 for(const m of [...g.party,...(g.reserve||[])]){if(!m||!SPECIES[m.species]||!Number.isInteger(m.level)||m.level<1||m.level>65||!Number.isFinite(m.hp)||!Number.isFinite(m.xp))throw new Error('存档潮灵数据损坏。');m.hp=clamp(m.hp,0,stats(m).hp);m.energy=5;validateLoadout(m);}
 if(!Number.isFinite(g.gold)||g.gold<0||!g.badges.every(n=>Number.isInteger(n)&&n>=0&&n<=7))throw new Error('存档进度损坏。');
 g.name=String(g.name||'旅人').slice(0,12);g.x=Math.round(clamp(Number.isFinite(g.x)?g.x:18,1,g.place==='dungeon'?46:g.place==='route'?54:37));g.y=Math.round(clamp(Number.isFinite(g.y)?g.y:19,1,g.place==='dungeon'?30:g.place==='route'?36:25));
 for(const id of Object.keys(g.bag)){if(!ITEMS[id])delete g.bag[id];else g.bag[id]=clamp(Math.floor(Number(g.bag[id])||0),0,9999);}
 g.routeSector??=0;if(!Number.isInteger(g.routeSector)||g.routeSector<0||g.routeSector>2)throw new Error('存档户外分区损坏。');
 g.dungeonFloor??=0;g.runes??={};g.openGates??={};if(!Number.isInteger(g.dungeonFloor)||g.dungeonFloor<0||g.dungeonFloor>3)throw new Error('存档地牢层数损坏。');g.reserve??=[];g.flags??={};g.quest??={};g.collected??={};g.wins??={};g.seen??=[];g.caught??=[];g.playtime??=0;g.steps??=0;g.seed??=1;
 for(const field of ['flags','quest','collected','wins','runes','openGates'])if(!g[field]||typeof g[field]!=='object'||Array.isArray(g[field]))throw new Error('存档进度字段损坏。');
 if(g.trainerWins===undefined)g.trainerWins={};
 if(!g.trainerWins||typeof g.trainerWins!=='object'||Array.isArray(g.trainerWins)||!Object.entries(g.trainerWins).every(([id,n])=>id.length>0&&id.length<=120&&Number.isInteger(n)&&n>=1&&n<=9999))throw new Error('存档切磋记录损坏。');
 for(const field of ['seen','caught'])if(!Array.isArray(g[field])||!g[field].every(id=>typeof id==='string'&&SPECIES[id]))throw new Error('存档图鉴数据损坏。');
 if(!Object.values(g.runes).every(n=>Number.isInteger(n)&&n>=0&&n<=2)||!Object.values(g.openGates).every(v=>typeof v==='boolean'))throw new Error('存档机关状态损坏。');
 if(g.stories!==undefined){if(!g.stories||typeof g.stories!=='object'||Array.isArray(g.stories))throw new Error('存档故事记录损坏。');for(const [id,index] of Object.entries(g.stories)){const story=SIDE_STORIES.find(s=>s.id===id);if(!story||!Number.isInteger(index)||!story.choices[index])throw new Error('存档故事选择损坏。');}}
 validateExpeditions(g);
 validateRelics(g);
 if(g.pendingScenes!==undefined&&(!Array.isArray(g.pendingScenes)||g.pendingScenes.length>18||!g.pendingScenes.every(id=>typeof id==='string'&&(/^(intro[0-7]|after[0-7]|ending)$/.test(id)||expeditionScene(g,id)))))throw new Error('存档中的剧情记录损坏。');
 g.pendingScenes??=[];g.battleSpeed=g.battleSpeed===2?2:1;
 if(g.suspendedBattle)g.suspendedBattle=validateSuspendedBattle(g.suspendedBattle,g);else g.suspendedBattle=null;
 if(!Number.isFinite(g.playtime)||g.playtime<0)g.playtime=0;if(!Number.isInteger(g.steps)||g.steps<0)g.steps=0;g.seed=Number.isFinite(g.seed)?g.seed>>>0:1;g.version=VERSION;return g;
}
export function saveEnvelope(g){return JSON.stringify({format:'starfall-save',schema:1,savedAt:new Date().toISOString(),game:g},null,2);}
export function readEnvelope(text){const parsed=JSON.parse(text);if(parsed.format!=='starfall-save'||parsed.schema!==1)throw new Error('这不是受支持的星潮纪行存档。');return validateSave(parsed.game);}
