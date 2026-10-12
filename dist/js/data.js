export const VERSION = '0.10.0';
export const ELEMENTS = {
  moss:{name:'森',color:'#8fd59a',weak:['ember','frost'],strong:['tide','stone']},
  ember:{name:'焰',color:'#ffa076',weak:['tide','stone'],strong:['moss','frost']},
  tide:{name:'潮',color:'#7fd8eb',weak:['moss','volt'],strong:['ember','stone']},
  volt:{name:'雷',color:'#f4d97f',weak:['stone'],strong:['tide','wind']},
  stone:{name:'岩',color:'#c8ad8c',weak:['tide','moss'],strong:['volt','ember']},
  frost:{name:'霜',color:'#b4e8f4',weak:['ember','stone'],strong:['moss','wind']},
  shade:{name:'影',color:'#beabea',weak:[],strong:['light']},
  light:{name:'辉',color:'#f5e9b3',weak:[],strong:['shade']},
  wind:{name:'风',color:'#a1d9bc',weak:['volt','frost'],strong:['moss']}
};

export const MOVES = {
  tackle:{name:'跃击',element:null,power:35,cost:0,desc:'基础攻击，回复 1 点能量。'},
  leaf:{name:'叶刃',element:'moss',power:52,cost:1,desc:'飞旋的叶片斩击对手。'},
  vine:{name:'缚根',element:'moss',power:38,cost:2,status:'root',chance:.65,desc:'65% 概率缠绕，降低速度。'},
  bloom:{name:'春日回响',element:'moss',power:0,cost:3,heal:.34,desc:'恢复自身 34% 生命。'},
  forest:{name:'万叶归途',element:'moss',power:95,cost:4,desc:'让森林的意志汇聚一击。'},
  spark:{name:'星火',element:'ember',power:50,cost:1,status:'burn',chance:.2,desc:'20% 概率灼伤。'},
  flare:{name:'燎原',element:'ember',power:73,cost:3,status:'burn',chance:.45,desc:'45% 概率灼伤。'},
  phoenix:{name:'不熄之焰',element:'ember',power:105,cost:4,recoil:.12,desc:'威力极高，自身承受少量反噬。'},
  splash:{name:'潮涌',element:'tide',power:52,cost:1,desc:'水流冲击；雨天威力提升。'},
  bubble:{name:'深海泡影',element:'tide',power:40,cost:2,status:'sleep',chance:.35,desc:'35% 概率让对手入眠。'},
  tsunami:{name:'白鲸之歌',element:'tide',power:92,cost:4,desc:'唤醒深海的古老歌声。'},
  static:{name:'电弧',element:'volt',power:50,cost:1,status:'shock',chance:.2,desc:'20% 概率麻痹，降低速度。'},
  thunder:{name:'雷鸣断章',element:'volt',power:86,cost:3,status:'shock',chance:.35,desc:'35% 概率麻痹。'},
  stone:{name:'碎岩',element:'stone',power:55,cost:1,desc:'投掷坚硬岩块。'},
  quake:{name:'地脉震荡',element:'stone',power:87,cost:3,desc:'在沙暴天气中获得增幅。'},
  shell:{name:'山岳屏障',element:'stone',power:0,cost:2,shield:3,desc:'获得持续 3 回合的护盾。'},
  chill:{name:'霜羽',element:'frost',power:50,cost:1,status:'root',chance:.25,desc:'25% 概率减速。'},
  blizzard:{name:'极夜雪',element:'frost',power:86,cost:3,status:'sleep',chance:.2,desc:'20% 概率冻结入眠。'},
  shadow:{name:'月影',element:'shade',power:52,cost:1,desc:'以静谧的月影攻击。'},
  nightmare:{name:'失落的梦',element:'shade',power:70,cost:3,drain:.35,desc:'吸取伤害的 35% 为生命。'},
  eclipse:{name:'无声日蚀',element:'shade',power:100,cost:4,desc:'黑暗暂时吞没一切。'},
  glint:{name:'微光',element:'light',power:50,cost:1,desc:'记忆凝结成温暖的光。'},
  dawn:{name:'黎明之约',element:'light',power:85,cost:3,cleanse:true,desc:'攻击并净化自己的异常状态。'},
  wish:{name:'心灯',element:'light',power:0,cost:3,heal:.42,cleanse:true,desc:'恢复 42% 生命并净化异常。'},
  gust:{name:'风切',element:'wind',power:48,cost:1,priority:1,desc:'优先行动的轻盈一击。'},
  cyclone:{name:'天穹回旋',element:'wind',power:85,cost:3,desc:'卷起群岛间流动的长风。'},
  venom:{name:'荧毒',element:'moss',power:25,cost:2,status:'poison',chance:1,desc:'使对手中毒，持续损失生命。'},
  focus:{name:'共鸣',element:null,power:0,cost:0,boost:2,desc:'蓄势，下一次攻击威力提升。'}
};

const lines = [
 ['budfox','芽芽狐','森尾灵狐','万叶灵君','moss','fox', [42,45,40,54], '尾尖的嫩芽会朝着主人的愿望生长。它不喜欢谎言，却总愿意再相信一次。'],
 ['embercat','炭绒猫','烛焰灵猫','赤霞焰王','ember','cat',[40,56,37,49],'蜷起来像一团余烬。老人说，只要它还在呼噜，家里的灯就不会熄灭。'],
 ['tidefin','泡泡鳍','织潮鲸','沧海长歌','tide','whale',[55,43,47,35],'在退潮的水洼里学会唱歌，长大后会带着每一滴水的记忆游向远海。'],
 ['mossdeer','苔角鹿','翠冠鹿','千年森守','moss','deer',[48,40,52,43],'鹿角上长出的苔藓是一片微缩森林。有时候还能找到迷路的小鸟。'],
 ['sparrow','风铃雀','逐风羽','晴空信使','wind','bird',[35,45,34,65],'曾替失去航线的信使送信。它从不弄丢任何一封未拆的信。'],
 ['pebble','卵石龟','岩背龟','磐山玄龟','stone','turtle',[55,39,65,24],'背甲上记录的年轮来自岩层。有人从中读出了很久以前的潮汐。'],
 ['voltkit','灯花兔','鸣雷兔','霆光月兔','volt','rabbit',[39,54,35,60],'雷雨前会把耳朵叠成一顶帽子。喜欢偷喝甜茶，讨厌铜制的勺子。'],
 ['frostowl','雪羽鸮','霜月鸮','极光夜巡','frost','owl',[43,50,40,49],'总在最冷的夜里醒来，替疲惫的守灯人看守最后一束火光。'],
 ['duskmoth','暮灯蛾','梦织蛾','永夜织梦','shade','moth',[40,54,40,52],'翅膀上的眼睛不属于它自己，而是它替别人保管的一个美梦。'],
 ['glowbud','灯盏花','晨曦花','拂晓圣莲','light','flower',[48,40,49,34],'花瓣闭合时保存着白天的阳光。出海的人会带一朵放在船头。'],
 ['cinder','熔砂蟹','炉心蟹','赤砂堡垒','ember','crab',[50,50,59,24],'在火山口最安静的地方筑巢。两只钳子分别用来战斗和做饭。'],
 ['dewslime','露珠团','澄心灵','镜潮之心','tide','slime',[62,35,40,30],'清晨的露水聚成了身体。它可以记住一个人的倒影一整年。'],
 ['nightwolf','墨月狼','逐月狼','夜航领主','shade','wolf',[43,58,38,55],'在迷雾里为同伴引路。嚎叫听起来很孤独，实际上是在报平安。'],
 ['stonegolem','石芽偶','古垣卫','群山的记忆','stone','golem',[61,52,64,20],'被遗忘的城墙醒来后，第一件事是寻找曾在墙边种花的人。'],
 ['skydrake','岚角幼龙','巡空龙','九霄青岚','wind','dragon',[44,53,41,52],'相信天上的每一朵云都是一座岛。它正认真地为这些岛屿命名。'],
 ['sunserpent','星鳞蛇','曜纹灵蛇','星海循光','light','serpent',[44,55,43,50],'星辰落海时诞生的潮灵。它的鳞片里偶尔会出现尚未发生的黎明。']
];
const moveTrees={moss:['leaf','vine','bloom','forest'],ember:['spark','flare','focus','phoenix'],tide:['splash','bubble','bloom','tsunami'],volt:['static','focus','gust','thunder'],stone:['stone','shell','focus','quake'],frost:['chill','shell','wish','blizzard'],shade:['shadow','nightmare','focus','eclipse'],light:['glint','wish','focus','dawn'],wind:['gust','focus','leaf','cyclone']};
const familyMoves={
 mossdeer:['leaf','shell','bloom','forest'],
 duskmoth:['shadow','bubble','venom','nightmare'],
 cinder:['spark','shell','flare','phoenix'],
 dewslime:['splash','wish','bubble','tsunami'],
 nightwolf:['shadow','gust','focus','eclipse'],
 skydrake:['gust','spark','focus','cyclone'],
 sunserpent:['glint','static','wish','dawn']
};
export const SPECIES={};
for(const [family,a,b,c,element,shape,base,lore] of lines){
  [a,b,c].forEach((name,i)=>{const id=family+(i?'_'+(i+1):'');SPECIES[id]={id,family,name,element,shape,stage:i+1,base:base.map(n=>n+i*22),lore,moves:familyMoves[family]||moveTrees[element],evolve:i<2?family+'_'+(i+2):null,evolveAt:i===0?16:32,rarity:['skydrake','sunserpent'].includes(family)?3:1};});
}
export const STARTERS=['budfox','embercat','tidefin'];
export const ITEMS={
  potion:{name:'晨露药',icon:'✚',price:65,desc:'恢复一只潮灵 55 点生命。',heal:55},
  superpotion:{name:'月露药',icon:'✚',price:180,desc:'恢复一只潮灵 160 点生命。',heal:160},
  revive:{name:'回声种',icon:'✦',price:360,desc:'唤醒倒下的潮灵并恢复一半生命。',revive:true},
  cure:{name:'净潮盐',icon:'◇',price:80,desc:'解除所有异常状态。',cleanse:true},
  orb:{name:'星约石',icon:'◈',price:95,desc:'与野生潮灵缔约。对手生命越少，成功率越高。',catch:1},
  greatorb:{name:'辉光星约石',icon:'◈',price:260,desc:'成功率更高的缔约石。',catch:1.65},
  herb:{name:'月息草',icon:'❧',price:20,desc:'生长在星潮附近的药草。可用于调配药剂。',material:true},
  shard:{name:'潮晶碎片',icon:'◆',price:35,desc:'带着记忆残响的晶体。可用于合成星约石。',material:true},
  emberCharm:{name:'炉火坠',icon:'♢',price:450,desc:'携带后攻击提高 12%。',equip:'atk'},
  shellCharm:{name:'海螺护符',icon:'♢',price:450,desc:'携带后防御提高 15%。',equip:'def'},
  featherCharm:{name:'顺风羽',icon:'♢',price:450,desc:'携带后速度提高 15%。',equip:'spd'},
  heartCharm:{name:'心灯吊坠',icon:'♢',price:600,desc:'携带后最大生命提高 15%。',equip:'hp'},
  voyageCharm:{name:'同行小帆',icon:'♢',price:0,desc:'攻击提高 18%，防御降低 8%。来自与潮灵共同走过的故事。',equip:true,modifiers:{atk:1.18,def:.92}},
  harborCharm:{name:'系泊绳结',icon:'♢',price:0,desc:'防御提高 20%，速度降低 12%。来自与潮灵共同走过的故事。',equip:true,modifiers:{def:1.2,spd:.88}},
  hearthCharm:{name:'掌心暖灯',icon:'♢',price:0,desc:'最大生命提高 18%，攻击降低 8%。来自与潮灵共同走过的故事。',equip:true,modifiers:{hp:1.18,atk:.92}},
  horizonCharm:{name:'望远鳞镜',icon:'♢',price:0,desc:'速度提高 22%，最大生命降低 8%。来自与潮灵共同走过的故事。',equip:true,modifiers:{spd:1.22,hp:.92}}
};
export const RECIPES=[{id:'potion',needs:{herb:2},count:2},{id:'superpotion',needs:{herb:4,shard:1},count:1},{id:'orb',needs:{shard:2},count:2},{id:'greatorb',needs:{shard:4,herb:1},count:1},{id:'revive',needs:{herb:5,shard:3},count:1}];
export const STATUS={burn:'灼伤',poison:'中毒',sleep:'入眠',shock:'麻痹',root:'缠绕'};
export const WEATHER={clear:{name:'晴',icon:'☀'},rain:{name:'细雨',icon:'☂'},sun:{name:'炽阳',icon:'☀'},snow:{name:'飞雪',icon:'❄'},mist:{name:'月雾',icon:'☾'},sand:{name:'风沙',icon:'◌'}};

export const CHAPTERS=[
 {id:0,name:'风从旧港来',island:'眠潮岛',town:'灯穗港',route:'风信草原',dungeon:'归潮灯塔',element:'moss',weather:'clear',level:5,bossLevel:9,warden:'守灯人 · 岚婆',boss:['mossdeer','pebble'],wild:['budfox','sparrow','dewslime','pebble'],palette:['#376b5a','#99b875','#dcbd82','#386a7d'],intro:[['阿汐','你终于醒了。我在旧船坞找到你的时候，海面上全是发光的星屑。'],['阿汐','你一直攥着这枚坏掉的罗盘。背面只有一句话：“若你忘记了归途，就去寻找八盏灯。”'],['洛珈博士','星潮会带来潮灵，也会带走记忆。昨夜，港口有十七个人忘记了同一个名字。'],['洛珈博士','我不知道罗盘属于谁。但它已经选择与你同行。先去岸边找引航员浮葵吧；港口需要帮助，手记会替你记住每一站。']],problem:'归潮灯塔熄灭了，港口的人开始遗忘离乡的亲人。',task:'帮助引航员、修堤工与镇上的店主，找回 3 枚灯芯碎片，再去归潮灯塔寻找岚婆。',before:[['岚婆','我守了这座灯塔四十二年。现在我记得每一艘船，却想不起送我第一盏灯的人。'],['岚婆','我不能把灯交给一个只会命令潮灵的人。让我看见，你们为什么愿意一起走。']],after:[['岚婆','是啊……叫一个名字的时候，有人会回头。这就是值得守护的记忆。'],['阿汐','第一盏灯亮了！罗盘的指针也在动。它指向了北方的镜湾。'],['岚婆','带上这枚灯印。若下一次我连你也忘记，请再来讲一次今天的故事。']],reward:'归潮灯印',lore:'这里的灯从不照向岸上，只照向还没回家的人。'},
 {id:1,name:'倒影里的陌生人',island:'镜湾岛',town:'玻璃汀',route:'回声湿地',dungeon:'镜湖档案馆',element:'tide',weather:'rain',level:11,bossLevel:15,warden:'档案师 · 白露',boss:['dewslime_2','tidefin_2'],wild:['tidefin','dewslime','voltkit','mossdeer'],palette:['#426d6e','#91b8ae','#b6cbd0','#426a8c'],intro:[['白露','欢迎来到镜湾。请先写下自己的名字……什么？你也想不起来？'],['阿汐','这里所有的镜子，都映出了和主人不一样的脸。'],['白露','星潮把被舍弃的记忆送回来了。可惜人们不总是愿意认领。']],problem:'档案馆的记忆镜开始互换每个人的过去。',task:'调查倒影的证词、照料雨中的物品与名字，找回 3 片真实镜页，修复档案馆的索引。',before:[['白露','这是一份失踪者名册。你的罗盘纹章，出现在二十年前的记录里。'],['白露','但真相不是礼物。我想知道，你愿不愿意承受它的重量。']],after:[['白露','二十年前，星灯计划试图把整片群岛的记忆存进海里。负责人叫“闻舟”。'],['阿汐','闻舟……为什么我听到这个名字，会觉得难过？'],['白露','档案写着他已经死了。可上个月，有人用他的笔迹借走了一本书。']],reward:'明镜灯印',lore:'真实未必令人快乐，但失去真实的幸福没有倒影。'},
 {id:2,name:'熄不灭的信',island:'赤炉岛',town:'炭火集',route:'落烬山道',dungeon:'无声熔炉',element:'ember',weather:'sun',level:17,bossLevel:21,warden:'铸灯师 · 赫砂',boss:['cinder_2','embercat_2','pebble_2'],wild:['embercat','cinder','stonegolem','nightwolf'],palette:['#69544d','#b58062','#c9a47b','#625b79'],intro:[['赫砂','这座炉子烧的不是煤，是寄不出去的信。每封信都在重复最后一句话。'],['阿汐','“对不起，我没能回来。”这里的人到底在等谁？'],['赫砂','我们曾为了星灯计划建造一座熔炉。它造出了奇迹，也吞掉了整支船队。']],problem:'旧熔炉重燃，未寄出的信件困住了镇民。',task:'参与邮路修缮、炭火集备餐与烟道救援，找回 3 封旧信，带给熔炉中的铸灯师。',before:[['赫砂','我锻造过一百种武器，却没学会修好一句迟到的道歉。'],['赫砂','如果火焰只是为了毁掉过去，那么我绝不会让你带走它。']],after:[['赫砂','我们终于可以把信寄出去了。即使收信的人已经不在，写信的人仍然需要向前走。'],['阿汐','闻舟当年想救那支船队。他把自己的记忆分成了八份。'],['赫砂','还有一个人活着回来。星灯议会的首席，祁曜。小心他。']],reward:'炉心灯印',lore:'总有一封信，不为抵达，只为告别。'},
 {id:3,name:'被风偷走的明天',island:'悬钟岛',town:'风栖驿',route:'巡空栈道',dungeon:'停摆钟庭',element:'wind',weather:'clear',level:23,bossLevel:27,warden:'巡风使 · 弥歌',boss:['sparrow_2','skydrake_2','voltkit_2'],wild:['sparrow','skydrake','voltkit','glowbud'],palette:['#568a81','#b9d29d','#d8d0a1','#6ca5af'],intro:[['弥歌','请别看钟。这里所有的钟都慢了一天，但人们已经开始记得明天。'],['阿汐','有人说，明天我会从这里消失。你相信这种预言吗？'],['弥歌','风带来的是可能，不是命令。我想看看你们会选择哪一条路。']],problem:'悬钟将未来的片段送进梦里，驿站陷入恐慌。',task:'与驿站居民重新丈量风、钟影与明天，取回 3 枚钟羽，重新校准大钟。',before:[['弥歌','我看见过你输了的未来，也看见过你赢了的未来。'],['弥歌','但我还没见过这一刻。来吧，给风一个新的答案。']],after:[['阿汐','那个预言没有发生。原来未来真的可以改变。'],['弥歌','阿汐，你并不属于过去，也不属于未来。你是一个尚未被完成的愿望。'],['阿汐','那我更应该亲自走到最后。我想知道，是谁许下了我。']],reward:'长风灯印',lore:'钟记录已经过去的时间，风负责尚未抵达的故事。'},
 {id:4,name:'雪原没有回声',island:'白眠岛',town:'雪棉镇',route:'沉星雪原',dungeon:'长夜观测所',element:'frost',weather:'snow',level:29,bossLevel:33,warden:'观星人 · 陆凛',boss:['frostowl_2','pebble_3','tidefin_3'],wild:['frostowl','nightwolf','pebble','sunserpent'],palette:['#77989e','#c2d7d2','#e2e6db','#7297ae'],intro:[['陆凛','星星不会忘记。但它们的光走到这里，需要很久。'],['阿汐','观测所里有一张照片。闻舟、祁曜，还有一个小女孩。她和我长得一模一样。'],['陆凛','那是闻舟的女儿。船难发生的那天，是她十岁的生日。']],problem:'观测所被困在同一个雪夜，任何声音都会被吞没。',task:'完成雪原救援、星镜观测与轮班守灯，找回 3 块星轨晶片，让观测所听见黎明。',before:[['陆凛','祁曜认为，只要把所有人的记忆固定下来，就不会再有人失去所爱。'],['陆凛','你呢？如果胜利意味着必须告别，你还会战斗吗？']],after:[['阿汐','所以我不是那个小女孩。我只是他记忆里，没能长大的她。'],['陆凛','你记得今天的风，记得你的旅伴。这些都不是从谁那里借来的。'],['阿汐','那我就是阿汐。我想继续走下去，用自己的名字。']],reward:'极夜灯印',lore:'雪会覆盖足迹，但不会让走过的人消失。'},
 {id:5,name:'深林替你保密',island:'苔梦岛',town:'青苔里',route:'无名深林',dungeon:'树心剧场',element:'shade',weather:'mist',level:35,bossLevel:39,warden:'守梦者 · 鹿隐',boss:['duskmoth_3','mossdeer_3','nightwolf_3'],wild:['duskmoth','mossdeer','nightwolf','glowbud'],palette:['#324d53','#698f79','#a6a784','#455369'],intro:[['鹿隐','每一个不肯说出口的秘密，都会在森林里长成一棵树。'],['阿汐','这棵树的年轮里……是你。你在船上，站在闻舟身边。'],['鹿隐','你不是失忆的旅人。你是闻舟留给未来的最后一位见证者。']],problem:'树心剧场在重演船难，失落的记忆正侵入现实。',task:'帮助菌灯、替补演员与叶笺邮路，收好 3 枚记忆种子，进入最后一场演出。',before:[['鹿隐','当年你答应他，等星灯重新亮起，就亲手关掉它。'],['鹿隐','人会改变心意。你必须用现在的自己，再做一次选择。']],after:[['旅人','我记起来了。我是星灯计划的领航员。那天，是我决定让船驶进星潮。'],['阿汐','你一直背着这份自责吗？那就让我陪你一起背一小段。'],['鹿隐','祁曜已经启动永昼装置。他要让群岛停留在最幸福的那个瞬间。']],reward:'森梦灯印',lore:'秘密若从不见光，就会把守护它的人也变成树。'},
 {id:6,name:'永昼城的囚徒',island:'曜都岛',town:'曦光城',route:'断桥旧街',dungeon:'永昼议事厅',element:'volt',weather:'sun',level:41,bossLevel:45,warden:'星灯首席 · 祁曜',boss:['voltkit_3','stonegolem_3','embercat_3','sunserpent_3'],wild:['voltkit','stonegolem','sunserpent','cinder'],palette:['#646878','#d1bc88','#e4d2a0','#667d99'],intro:[['祁曜','欢迎回家，领航员。每个人都曾求我留住一个瞬间。如今我终于做到了。'],['阿汐','可街上的人一直在说同一句话。他们连悲伤的权利都没有了。'],['祁曜','悲伤不是权利，是错误。我不打算让那场船难再发生一次。']],problem:'永昼装置冻结了整座城市，所有笑容都不再变化。',task:'为旧街安排休息、比赛与回家的路，取得 3 枚配电芯，关闭议事厅的屏障。',before:[['祁曜','如果当时我足够强，就不需要听见最后那一声求救。'],['祁曜','你要夺走这份宁静，就先证明，活着比幸福更重要。']],after:[['祁曜','原来……我一直想留住的，是一个能原谅自己的瞬间。'],['阿汐','停止并不会让伤口愈合。我们一起去见他，好吗？'],['祁曜','最后的灯，在没有被地图记录的地方。闻舟还在那里，等着潮退。']],reward:'永昼灯印',lore:'一座没有夜晚的城市，也失去了等待黎明的理由。'},
 {id:7,name:'归还群星的人',island:'归零岛',town:'最后驿站',route:'星海岸',dungeon:'群星之井',element:'light',weather:'mist',level:47,bossLevel:52,warden:'最后的守灯人 · 闻舟',boss:['sunserpent_3','skydrake_3','tidefin_3','duskmoth_3','glowbud_3'],wild:['sunserpent','skydrake','glowbud','duskmoth'],palette:['#44496d','#8e9db3','#cfc5aa','#4b5b8d'],intro:[['闻舟','你们走得真远。阿汐，原来你已经这么高了。'],['阿汐','我不是你记得的那个她。但如果你愿意，我可以讲讲路上发生的事。'],['闻舟','好。可是先让我看看，是什么把你们带到了这里。']],problem:'八盏星灯的记忆汇集于此，世界必须重新开始流动。',task:'与岸边的人准备船帆、路标与出发前的演练，收好 3 枚归航星屑，让八枚灯印回应彼此。',before:[['闻舟','我曾以为，记得一个人，就是永远不放手。'],['闻舟','后来我把整个世界都变成了不愿醒来的梦。请帮我，叫醒它。']],after:[['闻舟','原来告别并不是忘记。谢谢你，把她没能见过的世界带了回来。'],['阿汐','我会继续旅行。我会难过，也会快乐，会记得你，也会认识新的人。'],['闻舟','那就去吧。灯是为了让人出发，不是为了把人留在身边。']],reward:'归星灯印',lore:'我们终将归还借来的光，然后带着自己的名字出发。'}
];
export const SIDEQUESTS = CHAPTERS.flatMap((c,i)=>[
 {id:`herbs${i}`,region:i,name:['给奶奶的药','雨中的花茶','炉边的晚餐','风栖来信','雪地急救','睡不着的树','城里的第一夜','最后一杯茶'][i],giver:['渔娘·小满','茶师·蒲雨','厨师·阿炎','邮差·风笛','医生·絮雪','园丁·青枝','店主·槐序','旅店主·朝生'][i],kind:'deliver',item:'herb',need:3+i,reward:200+i*130,text:['奶奶总说自己不疼了，可我听见她夜里叹气。能帮我带三株月息草吗？','镜湖的水越来越冷。我想泡一壶能让人暖和起来的茶。','大家在等一顿普通的晚餐，像船队出发前那样。','我在送信的路上摔伤了翅膀伙伴，它还坚持要出发。','观测所送来了几个冻伤的旅人，药草已经不够了。','树梦见自己变成了鸟。我需要药草帮它睡个好觉。','城里终于有了夜晚。我想用热汤欢迎它。','不管明天会怎样，总得先给旅人泡好今天的茶。'][i]},
 {id:`survey${i}`,region:i,name:['草原小小观察家','雨声图鉴','谁住在火山里','顺风的朋友','极夜来客','梦的形状','寻找城里的潮灵','星海最后一页'][i],giver:'调查员·小苇',kind:'capture',species:c.wild[1],need:1,reward:280+i*150,text:`我在编写${c.island}的生态笔记。能缔约一只${SPECIES[c.wild[1]].name}，让我近距离观察吗？我不会带走它。`},
 {id:`patrol${i}`,region:i,name:['旧路的挑战者','镜边切磋','炉心试炼','天空竞技','雪原守夜','林间演武','黎明前的决斗','给未来的练习'][i],giver:'巡岛人·弦',kind:'battles',need:4+i,reward:350+i*180,text:'你与潮灵在一起时，眼神会变得不一样。完成本岛的几场野外战斗，再来告诉我你们学到了什么。'}
]);
export const ENDING=[['阿汐','后来，群岛迎来了很普通的一个清晨。灯塔的光熄灭了，因为太阳已经升起。'],['阿汐','岚婆又忘了几个名字，但她总记得给路过的人倒一杯茶。白露把空白页装订进了新的档案。'],['阿汐','赫砂开始铸造锅子，弥歌不再提前读明天的信。陆凛第一次睡过了日出。'],['阿汐','祁曜拆掉了永昼装置，开了一间修钟的小店。他说，走慢一点也没有关系。'],['阿汐','而我，决定从现在开始写日记。第一页写着：今天，我和你，出发去看一片从未见过的海。'],['系统','主线完结 · 群星归潮。通关后的群岛已开放：守灯人重赛、潮灵全图鉴、未完成的委托，以及星海无尽试炼。你的旅程仍在继续。']];
