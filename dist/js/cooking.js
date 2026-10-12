import {mealFor} from './cooking-data.js';
import {SPECIES} from './data.js';
import {recordBattleState} from './techniques.js';

export const recipeVisited=(game,r)=>game.region===r.region||game.badges.includes(r.region)||game.flags?.['entered'+r.region]===true;
export const recipeLearned=(game,id)=>Number.isInteger(game.cookingLessons?.[id]);
export function learnRecipe(game,id,choice){
 const recipe=mealFor(id);if(!recipe||!Number.isInteger(choice)||!recipe.choices[choice])throw new Error('请选择食谱里的一个回应。');
 if(recipeLearned(game,id))return {game,alreadyLearned:true,reply:recipe.choices[game.cookingLessons[id]].reply};
 if(game.suspendedBattle||game.place!=='town'||game.region!==recipe.region)throw new Error('请在这座岛的城镇，向料理人请教食谱。');
 if((game.bag[id]||0)>=9999)throw new Error('背包已满，请先为试吃餐盒留出空间。');
 return {game:{...game,bag:{...game.bag,[id]:(game.bag[id]||0)+1},cookingLessons:{...game.cookingLessons,[id]:choice}},alreadyLearned:false,reply:recipe.choices[choice].reply};
}
export function cookingQuote(game,id,count=1){
 const recipe=mealFor(id);if(!recipe||!Number.isInteger(count)||count<1||count>99)throw new Error('请选择有效的食谱和制作份数。');
 const materials=Object.entries(recipe.needs).map(([id,n])=>({id,owned:game.bag[id]||0,need:n*count})),owned=game.bag[id]||0;
 const max=Math.max(0,Math.min(99,9999-owned,...Object.entries(recipe.needs).map(([id,n])=>Math.floor((game.bag[id]||0)/n))));
 const reason=game.suspendedBattle?'对战结束后再生火。':!recipeLearned(game,id)?'尚未学会这份食谱。':owned+count>9999?'背包已放不下餐盒。':materials.some(m=>m.owned<m.need)?'食材还不够。':null;
 return {id,count,materials,owned,max,ok:!reason,reason};
}
export function cookMeal(game,id,count=1){
 const q=cookingQuote(game,id,count);if(!q.ok)throw new Error(q.reason);
 const bag={...game.bag,[id]:q.owned+count};for(const m of q.materials)bag[m.id]-=m.need;return {...game,bag};
}
export function packMeal(game,id){
 if(game.suspendedBattle)throw new Error('对战结束后再调整餐盒。');
 if(id!==null&&(!mealFor(id)||!(game.bag[id]>0)))throw new Error('请先做好一份料理，再装进餐盒。');
 return {...game,packedMeal:id};
}
export function prepareMeal(game,battle){
 const recipe=mealFor(game.packedMeal);battle.meal=null;
 if(!recipe||!(battle.inventory[recipe.id]>0))return;
 battle.inventory[recipe.id]--;battle.meal={id:recipe.id,entered:[],wards:[]};
 battle.log.push(`你们分享了「${recipe.name}」，消耗 1 份餐盒。${recipe.desc}`);
}
export function enterMeal(battle,mon){
 const meal=battle.meal,recipe=mealFor(meal?.id);if(!recipe||!battle.party.includes(mon)||meal.entered.includes(mon.uid))return;
 meal.entered.push(mon.uid);
 const key={shield:'shield',focus:'focus',haste:'haste',regen:'regen'}[recipe.effect];if(!key)return;
 mon[key]=Math.max(mon[key]||0,{shield:2,focus:1,haste:2,regen:3}[key]);
 battle.log.push(`${SPECIES[mon.species].name} · ${recipe.name}：${recipe.tag}生效。`);
 const event={kind:'buff',source:mon.uid,target:mon.uid,element:'moss',item:recipe.id};recordBattleState(event,mon);battle.events?.push(event);
}
export function acceptMealStatus(battle,mon){
 if(mealFor(battle.meal?.id)?.effect!=='ward'||!battle.party.includes(mon)||battle.meal.wards.includes(mon.uid))return true;
 battle.meal.wards.push(mon.uid);battle.log.push(`${SPECIES[mon.species].name} 的苔梦清露茶抵消了这次异常，护佑已经用完。`);return false;
}
export const mealCaptureFactor=battle=>mealFor(battle.meal?.id)?.effect==='capture'?1.18:1;
export const mealHealingFactor=(battle,mon)=>mealFor(battle.meal?.id)?.effect==='healing'&&battle.party.includes(mon)?1.2:1;
export const mealExperienceFactor=battle=>mealFor(battle.meal?.id)?.effect==='experience'?1.1:1;
export function validateCooking(game){
 game.cookingLessons??={};game.packedMeal??=null;
 if(!game.cookingLessons||typeof game.cookingLessons!=='object'||Array.isArray(game.cookingLessons)||!Object.entries(game.cookingLessons).every(([id,c])=>mealFor(id)&&Number.isInteger(c)&&c>=0&&c<2))throw new Error('存档中的露营食谱损坏。');
 if(game.packedMeal!==null&&(!mealFor(game.packedMeal)||!(game.bag[game.packedMeal]>0)))throw new Error('存档中的待用餐盒损坏。');
}
export function validateBattleMeal(battle,game){
 if(battle.meal===undefined)battle.meal=null;
 const meal=battle.meal;if(!meal){if(game.packedMeal)throw new Error('存档中的对战餐盒与行囊不一致。');return;}
 if(!mealFor(meal.id)||meal.id!==game.packedMeal||battle.inventory[meal.id]!==game.bag[meal.id]-1)throw new Error('存档中的对战餐盒数量损坏。');
 for(const key of ['entered','wards'])if(!Array.isArray(meal[key])||meal[key].length>battle.party.length||new Set(meal[key]).size!==meal[key].length||!meal[key].every(id=>battle.party.some(m=>m.uid===id)))throw new Error('存档中的料理生效记录损坏。');
 if(!meal.entered.includes(battle.party[battle.activeP].uid)||meal.wards.some(id=>!meal.entered.includes(id))||meal.wards.length&&mealFor(meal.id).effect!=='ward')throw new Error('存档中的料理护佑记录损坏。');
}
