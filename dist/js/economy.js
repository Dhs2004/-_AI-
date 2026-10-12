import {ITEMS,RECIPES} from './data.js';

export const SHOP_GROUPS={
 medicine:{name:'药品',icon:'✚',items:['potion','superpotion','revive','cure']},
 pact:{name:'缔约',icon:'◈',items:['orb','greatorb']},
 charm:{name:'护符',icon:'♢',items:['emberCharm','shellCharm','featherCharm','heartCharm']},
 food:{name:'食材',icon:'▱',items:['coastfruit','oatflour','warmspice','seasalt']},
 material:{name:'素材',icon:'❧',items:['herb','shard']}
};
export const SHOP_STOCK=Object.values(SHOP_GROUPS).flatMap(group=>group.items);
const capacity=9999;
function quantity(n){if(!Number.isInteger(n)||n<1||n>99)throw new Error('每次请选择 1–99 份。');return n;}
export function purchaseQuote(game,id,count=1){
 quantity(count);if(!SHOP_STOCK.includes(id))throw new Error('杂货铺没有这件商品。');
 const total=ITEMS[id].price*count,owned=game.bag[id]||0;
 const max=Math.max(0,Math.min(99,Math.floor(game.gold/ITEMS[id].price),capacity-owned));
 const reason=owned+count>capacity?'背包已放不下这些物品。':game.gold<total?`还差 ${total-game.gold} 星砂。`:null;
 return {id,count,total,owned,max,ok:!reason,reason};
}
export function purchaseItem(game,id,count=1){
 const quote=purchaseQuote(game,id,count);if(!quote.ok)throw new Error(quote.reason);
 return {...game,gold:game.gold-quote.total,bag:{...game.bag,[id]:quote.owned+count}};
}
export function craftQuote(game,id,batches=1){
 quantity(batches);const recipe=RECIPES.find(r=>r.id===id);if(!recipe)throw new Error('这份配方不存在。');
 const materials=Object.entries(recipe.needs).map(([item,n])=>({id:item,owned:game.bag[item]||0,need:n*batches}));
 const output=recipe.count*batches,owned=game.bag[id]||0;
 const max=Math.max(0,Math.min(99,Math.floor((capacity-owned)/recipe.count),...Object.entries(recipe.needs).map(([item,n])=>Math.floor((game.bag[item]||0)/n))));
 const reason=owned+output>capacity?'背包已放不下成品。':materials.some(m=>m.owned<m.need)?'所需素材还不够。':null;
 return {id,batches,output,materials,owned,max,ok:!reason,reason};
}
export function craftItem(game,id,batches=1){
 const quote=craftQuote(game,id,batches);if(!quote.ok)throw new Error(quote.reason);
 const bag={...game.bag,[id]:quote.owned+quote.output};for(const material of quote.materials)bag[material.id]-=material.need;
 return {...game,bag};
}
