// Original island recipes. Data stays independent of battle and UI modules.
export const INGREDIENTS={
 coastfruit:{name:'潮红果',icon:'●',price:25,desc:'酸甜的海岸果实。可在露营食谱中制作料理。',material:true},
 oatflour:{name:'风磨麦粉',icon:'▱',price:30,desc:'风车磨出的细麦粉，适合面包与旅途点心。',material:true},
 warmspice:{name:'暖星香料',icon:'✦',price:45,desc:'带一点温热辛香的种子，炖汤和烤物都用得上。',material:true},
 seasalt:{name:'银滩食盐',icon:'◇',price:20,desc:'用于调味的细盐，可与其他食材一起烹调。',material:true}
};
export const MEALS=[
 {id:'fruitparcel',region:0,name:'潮果小包',tag:'同行邀请',effect:'capture',desc:'下一场对战若为野生相遇，缔约成功率乘以 1.18，最高仍为 96%。',needs:{coastfruit:2,oatflour:1},color:'#dca8a0',chef:'果摊阿榆',companion:'budfox',title:'给不敢靠近的小客人',
  story:['阿榆把一只缺了角的小包放在石阶上。芽芽狐闻了闻，却只往前挪了半步。','「从前我总举着食物追它，觉得追上就能交朋友。后来才知道，它不是不饿，是还没决定要不要相信我。」','她把剩下的果子交给你：「做一份能带走的吧。邀请要留出退路，等待也得有耐心。」'],
  choices:[{text:'把小包放下，退开一点。',reply:'你们坐回摊边。过了好一会儿，芽芽狐叼走小包，又把一片完整的叶子放在原处。阿榆笑着说，这就是它的回信。'},{text:'先掰开自己的那一份。',reply:'你坐在石阶另一端，慢慢吃起果子。芽芽狐终于凑近来，学着你咬了一小口。阿榆把这个笨拙的开头记进了食谱。'}]},
 {id:'harborbread',region:1,name:'镜湾盐面包',tag:'入场护盾',effect:'shield',desc:'下一场对战，每位伙伴首次上场时获得 2 回合护盾；不会与已有护盾叠加。',needs:{oatflour:2,seasalt:1},color:'#dfbf89',chef:'面包师澄叔',companion:'tidefin',title:'裂开也能托住热气',
  story:['澄叔的面包架上，整齐摆着几只表皮裂开的面包。他的学徒正想把它们撤掉。','「镜湾的人最近很怕看到裂缝。」他敲敲面包壳，「可没有这道口子，热气会把里面挤坏。」','泡泡鳍用水圈托住刚出炉的面包。澄叔请你替学徒想一个摆放办法。'],
  choices:[{text:'把裂口朝上，让人看见里面。',reply:'学徒切开第一只面包，麦香填满了小店。今天的招牌写着：外壳挡风，里面留软。'},{text:'给每只面包画一条小航线。',reply:'裂口成了海湾，焦边成了码头。学徒给面包取了不同的港口名字，终于不再把它们藏在架子后面。'}]},
 {id:'embertoast',region:2,name:'炉边暖星烤饼',tag:'首击蓄势',effect:'focus',desc:'下一场对战，每位伙伴首次上场时蓄势，下一次攻击伤害提高 45%；不叠加蓄势。',needs:{oatflour:2,warmspice:1},color:'#e5a275',chef:'灶工小炭',companion:'cinder',title:'总是烤焦的那一面',
  story:['小炭的烤饼一面金黄，另一面乌黑。熔砂蟹一直举着左钳，像是在等什么口令。','「师傅以前喊一声，我就翻面。现在他去修远处的灶了，我却总在等那声喊。」','你看见炉沿刻着浅浅的三道线。原来每一炉，小炭都在偷偷记录自己的火候。'],
  choices:[{text:'按你记下的火候试一次。',reply:'小炭盯着第三道线，第一次自己喊了翻面。熔砂蟹双钳一转，烤饼稳稳落回铁盘。这个时刻没有烤焦。'},{text:'让熔砂蟹也报一次火候。',reply:'蟹钳轻敲炉沿，发出清脆的三声。小炭听懂了，笑着应了一声。原来帮手早就有自己的办法。'}]},
 {id:'windcracker',region:3,name:'顺风薄脆',tag:'入场疾风',effect:'haste',desc:'下一场对战，每位伙伴首次上场起 2 回合速度提高 40%。退场后结束，不会再次触发。',needs:{oatflour:2,coastfruit:1},color:'#a3c8af',chef:'送餐员轻舟',companion:'kitesquid',title:'晚到的那一袋',
  story:['轻舟把一袋薄脆吊在风铃下，纸帆鱿正在给纸袋折出一个小把手。','「大家都说送餐越快越好。可我刚才等了一位走得慢的老人，最后一袋已经不热了。」','风吹过，袋子里传来清脆的响声。薄薄的饼就算凉下来，也有另一种好吃。'],
  choices:[{text:'给这份薄脆写上等候的故事。',reply:'收餐的人看完纸条，多拿了一只杯子。「下次把那位老人也请来。」轻舟第一次觉得，停下的时间也送到了。'},{text:'留一袋，等轻舟送完一起吃。',reply:'最后一趟回来，轻舟发现炉边还留着位置。纸帆鱿把空袋折成风铃，替你们记住这一阵不赶时间的风。'}]},
 {id:'snowbroth',region:4,name:'雪夜暖石汤',tag:'入场春芽',effect:'regen',desc:'下一场对战，每位伙伴首次上场后，在 3 次回合末恢复最大生命的 8%。退场后结束。',needs:{herb:2,warmspice:1,seasalt:1},color:'#b4d4d8',chef:'守灶人冬盏',companion:'frostotter',title:'为守夜的人留一碗',
  story:['冬盏在每只碗底画了一颗星，唯独自己的碗被倒扣在桌角。雪沫獭把一块暖石推到那只碗边。','「守夜的人要先照顾别人嘛。」她说完，又替门口的汤锅添了一次水。','名单上的人都已经喝过汤。炉火小了一些，你们听见她肚子轻轻响了一声。'],
  choices:[{text:'把她的碗翻过来。',reply:'你盛好最后一碗，把星星藏进热汤里。冬盏捧着碗坐下，雪沫獭这才把暖石抱回怀中。今夜终于没有漏掉谁。'},{text:'提议轮流看着汤锅。',reply:'你接过勺子，冬盏终于能坐下吃饭。她在名单底下添了一行：下一班，也请记得喊醒我喝汤。'}]},
 {id:'mossbrew',region:5,name:'苔梦清露茶',tag:'一次护佑',effect:'ward',desc:'下一场对战，每位伙伴各抵消一次新施加的异常。先结算家族免疫；不解除已有异常。',needs:{herb:2,coastfruit:1,seasalt:1},color:'#a5bf9c',chef:'采茶人叶眠',companion:'dewslime',title:'不必倒映所有心事',
  story:['露珠团的身体里挤着好几张疲惫的倒影。叶眠请它帮客人照镜子，它却把每一个叹息都留下了。','「它以为认真倾听，就是替别人把难过全部记住。」叶眠把新茶倒进浅杯，水面很快平静下来。','她请你带着露珠团，想一个结束今天工作的办法。'],
  choices:[{text:'一起向每一位客人道晚安。',reply:'说过晚安的倒影慢慢散去。露珠团没有失去那些朋友，只是在清亮的身体里，终于又看见了自己。'},{text:'在杯边立一块打烊的小牌。',reply:'牌子写着：明天还会认真听。客人们轻轻点头，露珠团安心钻到茶杯旁休息。叶眠把这个办法留在食谱的空白处。'}]},
 {id:'lanternstew',region:6,name:'灯下慢炖',tag:'疗愈增幅',effect:'healing',desc:'下一场对战，我方主动回复技能与回复药的治疗量提高 20%。不影响复苏、吸血和回合末恢复。',needs:{herb:2,warmspice:2,seasalt:1},color:'#e4c38c',chef:'夜班厨师陆禾',companion:'glowbud',title:'让汤重新煮一会儿',
  story:['陆禾的汤锅每隔几分钟就被人掀开。大家都问还要多久，只有灯盏花安静地照着炉火。','「这里的人曾习惯一切停在最好的时候。可炖汤的每一分钟，都不是成品的那一分钟。」','锅里的麦粒渐渐变软。陆禾把勺子递给你，请你替等候的人说一句话。'],
  choices:[{text:'告诉他们汤正在发生的变化。',reply:'你说麦粒在吸水，香料在散开。有人第一次凑近听见咕嘟声，决定把催促换成摆碗。'},{text:'邀请大家一起准备桌子。',reply:'等待的人搬来长凳，擦净灯罩。等汤端上桌，已经没有谁只是等着被照顾的客人。陆禾也坐下吃了一口。'}]},
 {id:'starcake',region:7,name:'归航星屑糕',tag:'成长记忆',effect:'experience',desc:'下一场胜利或缔约后，原队伍得到的战斗经验提高 10%。逃离或落败也会消耗餐盒。',needs:{coastfruit:2,oatflour:2,warmspice:1},color:'#c6b4df',chef:'驿站烘焙师南枝',companion:'sunserpent',title:'食谱最后的空白',
  story:['南枝把一摞旧食谱摊在桌上。每一页都有不同岛屿的油渍，最后一页却干干净净。','「以前我想把最好的配方写在这里。等了很久，却一直觉得，还能再改一点。」','星鳞蛇用尾尖碰了碰纸页。南枝望着你带来的行囊，问这一页应当从哪里开始。'],
  choices:[{text:'先写下今天同行的人。',reply:'名字写满了页首，配方只剩短短几行。南枝觉得刚好：以后再做这份糕，最先想起的会是一起分它的人。'},{text:'留一点空白给下一次旅途。',reply:'你们写下今天用过的食材，把页脚留空。南枝把小糕装好：「路上如果发现新的味道，记得回来告诉我。」'}]}
];
export const mealFor=id=>MEALS.find(r=>r.id===id);
export const MEAL_ITEMS=Object.fromEntries(MEALS.map(r=>[r.id,{name:r.name,icon:'▱',price:0,meal:true,desc:r.desc}]));
