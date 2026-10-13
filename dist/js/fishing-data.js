// The star float has no hook. It invites curious shoreline companions.
export const FISHING_LURES={
 plain:{name:'星浮',item:null,desc:'可反复使用。三位水岸伙伴各有相同的出现机会。',weights:[1,1,1]},
 leaf:{name:'草叶浮饵',item:'herb',desc:'消耗 1 份月息草，更容易遇见手册中第二位伙伴。',weights:[1,4,1]},
 fruit:{name:'果香浮饵',item:'coastfruit',desc:'消耗 1 个潮红果，更容易遇见手册中第三位伙伴。',weights:[1,1,4]}
};
export const FISHING_SIGNALS={
 dive:{name:'浮标急沉',hint:'线忽然绷紧。给它一点余地，等这股冲劲过去。',symbol:'↓',answer:'slack',tension:-2},
 approach:{name:'水纹靠近',hint:'它正顺着水纹靠岸。轻轻收线，把距离再缩短一点。',symbol:'≈',answer:'reel',tension:1},
 wave:{name:'浪头涌起',hint:'浪把浮标托得很高。先稳住，别把浪头当作鱼讯。',symbol:'∿',answer:'wait',tension:0}
};
export const FISHING_ACTIONS={reel:{name:'轻轻收线',detail:'靠近时收线；急沉时硬拉会增加张力。'},slack:{name:'松一点线',detail:'降低张力；过早放松会让距离拉远。'},wait:{name:'稳住等待',detail:'让浪头过去；平静时久等会错过靠近。'}};
export const FISHING_SPOTS=[
 {id:'float0',region:0,sector:0,name:'旧栈桥的星浮',angler:'补网人 · 潮伯',preferred:{x:26,y:19},families:['tidefin','dewslime','cinder'],color:'#92c6b8',
  opening:['潮伯的浮标下面没有鱼钩，只有一小片磨圆的贝壳。「它们肯靠近，比带走什么更难得。」','他过去总嫌徒弟的结打得慢。船出过一次事后，才发现正是那个慢结，在风浪里多撑了一会儿。','「急的时候放一点，近的时候收一点。你试试，我也再学一遍不催人。」'],
  ending:'三位伙伴都来过栈桥了。潮伯在网边添了三种颜色的线，给没来得及学会的从容，留了一个新的开头。',
  choices:[{text:'把最慢的那种结再教我一次。',reply:'潮伯没有说「看好了」，而是把线头放进你掌心。「来，我们一起慢一点。」'},{text:'邀请他的徒弟来看看新网。',reply:'徒弟带着自己的浮标来了。两个人没有比谁更快，只聊了聊今天的潮水。'}]},
 {id:'float1',region:1,sector:1,name:'倒影湾的浅汀',angler:'寻镜人 · 青澄',preferred:{x:29,y:24},families:['dewslime','kitesquid','glassbeetle'],color:'#99bccd',
  opening:['青澄从水里捞起一枚旧镜框，把完好的镜片留在岸上。「我以前总想捞回一个更好的自己。」','露珠团从框里钻过去，纸帆鱿在另一边展开触腕，谁也没有停下来挑自己的倒影。','青澄把空镜框靠在芦苇边：「今天试着看看镜子外面吧。」'],
  ending:'水岸手册上多了三位新朋友。青澄把空镜框挂起来，框住每天都不一样的水面。',
  choices:[{text:'给这扇小窗起名叫今天。',reply:'她在框边写下日期，却没有给以后留框线。「明天也许更宽一些。」'},{text:'把自己的倒影也画在旁边。',reply:'青澄画得有点歪，却没有擦掉。倒影里的她和纸上的她，都笑了起来。'}]},
 {id:'float2',region:2,sector:2,name:'余温出海口',angler:'熄炉工 · 红砾',preferred:{x:24,y:24},families:['cinder','pebble','glassbeetle'],color:'#dab28c',
  opening:['炉水冷却后，红砾沿着出海口搭了几块平石。小潮灵们会在石缝里交换捡来的亮片。','「我只会造需要很大力气的东西。」他看着一枚小小的浮标，「这么轻的，大概不适合我。」','你发现他捏着线的手，比说话轻得多。今天的水也已经不烫了。'],
  ending:'三种脚印留在平石上。红砾把旧炉门的铰链改成了小小的收线轮，没有一处毛刺。',
  choices:[{text:'请他给收线轮刻上自己的名字。',reply:'红砾刻了很小的「砾」。他第一次觉得，名字不必放在最大的那件作品上。'},{text:'把小潮灵捡来的亮片嵌进去。',reply:'旧铁轮转起来，闪出三点不同的光。红砾说，原来轻巧的东西，也能装下许多人的力气。'}]},
 {id:'float3',region:3,sector:2,name:'浮钟下的回水湾',angler:'停步信使 · 铃央',preferred:{x:21,y:23},families:['kitesquid','voltkit','clockmouse'],color:'#b1ccb0',
  opening:['铃央把邮袋放在膝上，听浮标上的小铃铛响。「今天所有信都送完了，我却不知道手该放在哪里。」','齿铃鼠敲着岸边空罐，两声之间留了一段安静。没有新的收件人，也没有必须赶上的整点。','「那就把这一会儿，寄给水面吧。」铃央终于解开了鞋带。'],
  ending:'三位水岸伙伴都认识了铃声。铃央的空邮袋里，装进了今天慢慢捡起的几片云影。',
  choices:[{text:'把安静也写进今天的投递记录。',reply:'记录最后一栏写着：一段无人催促的时间，已送达。铃央认真盖了章。'},{text:'让铃铛只在有风的时候响。',reply:'铃央取下报时的小齿轮。风有自己的时刻，今天她愿意等它。'}]},
 {id:'float4',region:4,sector:1,name:'浮冰间的呼吸口',angler:'冰岸记录员 · 芦白',preferred:{x:27,y:22},families:['frostotter','tidefin','frostowl'],color:'#b9d7df',
  opening:['芦白在冰边画圈，提醒过路人别堵住水下的呼吸口。「我以前只记气温，没记过谁在这里生活。」','雪沫獭推来一块圆石，雪羽鸮站在不远处的木桩上。冰面之下，偶尔传来泡泡鳍低低的歌声。','她把记录本翻到新页：「数字后面，也该留一点名字的位置。」'],
  ending:'三种名字写进了记录本。芦白看见，最冷的那张表格上，也可以有谁等着谁回家的路线。',
  choices:[{text:'把暖石的位置也画下来。',reply:'点点暖石连成一条短短的归途。芦白在图例里写：不踩住，不搬走，给后来者留着。'},{text:'记下它们每天到来的声音。',reply:'纸上出现了咕噜、轻鸣和水花的形状。芦白说，这是她写过最不安静的一场雪。'}]},
 {id:'float5',region:5,sector:0,name:'菌灯照着的深潭',angler:'失眠木匠 · 榫眠',preferred:{x:23,y:19},families:['dewslime','duskmoth','mossdeer'],color:'#a7baa2',
  opening:['榫眠为深潭做了一张窄凳，自己却一直站着。「我怕坐下来，就会想起还没修完的东西。」','暮灯蛾停在凳背，露珠团贴着凳脚。苔角鹿把一枝带叶的树枝搁在最空的那一端。','水里的浮标没有催他完工。你们先把凳子上的木屑拂掉了。'],
  ending:'三位伙伴轮流来过深潭。凳子还没有刷最后一层漆，却已经接住了许多个疲惫的晚上。',
  choices:[{text:'请他试试凳子是否坐得舒服。',reply:'榫眠坐下，长长呼出一口气。「合格。」他说。那是他今天第一次不想再改一处。'},{text:'在凳边添一盏给夜归人的灯。',reply:'灯没有照着工具箱，而是照着凳子。榫眠明白，有些作品是为了让人暂时什么都不做。'}]},
 {id:'float6',region:6,sector:1,name:'旧街泄水渠',angler:'退班巡检 · 灯川',preferred:{x:25,y:23},families:['voltkit','glassbeetle','stonegolem'],color:'#d6c596',
  opening:['灯川总在水渠的格栅旁停下，怕有东西被旧机器卷进去。他已经换班，却忘了把警哨收起来。','灯花兔沿着干燥的渠边跳过，棱砂甲虫把光投到水面，石芽偶正在慢慢扶正一块台阶。','「原来不只有我在照看这里。」灯川把哨子放进口袋，伸手接过了浮标。'],
  ending:'三位伙伴都留下了清晰的水岸记录。灯川画了一张大家分担巡看的小表，第一次把自己的休息也列在里面。',
  choices:[{text:'给休息那一格画一轮月亮。',reply:'灯川把月亮涂得很圆。「这一班也要好好完成。」他笑着说。'},{text:'把小表交给下一班巡检。',reply:'接班人补上自己的名字，灯川没有再折回来检查。水渠里的光，仍然安安稳稳地流着。'}]},
 {id:'float7',region:7,sector:2,name:'星潮退去的浅海',angler:'归航观察者 · 汀迟',preferred:{x:24,y:22},families:['tidefin','sunserpent','skydrake'],color:'#bcb4d6',
  opening:['汀迟曾替每艘离港的船记下回来日期，后来本子上有太多没有填完的空格。','「我不想再让谁的名字，只剩一个没能抵达的日子。」他把旧本子翻到背面，画下水面第一圈涟漪。','星浮轻轻落下，远处有翅膀掠过海。他开始记录今天来了谁。'],
  ending:'最后一处水岸的三位伙伴都已缔约。汀迟把八岛记录摊在沙滩上，发现它们连起的，是许多仍在继续的生活。',
  choices:[{text:'在最后一页写下下一次相见。',reply:'你们没有写日期。汀迟合上本子：「等你带着新的故事来，这一页就能继续。」'},{text:'把空白留给后来观察的人。',reply:'本子装进防潮的小匣，旁边留了一支削好的笔。汀迟说，今天终于有一件没写完的事，让他期待起来。'}]}
];
export const fishingSpot=id=>FISHING_SPOTS.find(s=>s.id===id);
export const FISHING_CHARM={name:'澄潮结',icon:'♢',price:0,desc:'完成八岛水岸记录的纪念。佩戴后生命、防御提高 10%，速度降低 5%。',equip:true,modifiers:{hp:1.1,def:1.1,spd:.95}};
