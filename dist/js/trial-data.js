// Authored postgame route: eight invitations, three distinct duels per port.
// Kept independent of the battle engine so weather, AI and saves share one contract.
export const TRIAL_CIRCUIT_ID='lantern-route-v1';
const mon=(family,equip=null,moves=null)=>({species:family+'_3',equip,moves});
export const TRIAL_CIRCUITS=[
 {
  id:'first-ferry',title:'第一班无灯渡船',region:0,weather:'clear',crest:'启航船票',
  summary:'灯重新亮了，渡船却还没有恢复。归帆邀请当年的学徒，先替第一批旅客试一段航路。',
  tactic:{name:'稳舵',desc:'以守势补充能量，再用廉价攻击维持航速。护盾不会替代持续进攻。',guard:1.2,heal:.85,status:.9,switch:1},
  stages:[
   {title:'一张不写终点的票',guest:'渡船学徒 · 青禾',role:'rival',team:[mon('sparrow','featherCharm'),mon('budfox'),mon('pebble','shellCharm')],hint:'风与岩能接替彼此不擅长的对局。注意风切的优先行动；用守势接住它，再安排有利属性。',before:[['青禾','我学了很久的航线，可真正有乘客的时候，还是会把缆绳系得太紧。'],['归帆','今天没有乘客着急。让青禾跟你走一段，她需要学会在别人面前犯一个小错。']],after:[['青禾','刚才我为了保护晴空信使，把磐山玄龟派得太晚了。我看见了，下一次会记得。'],['归帆','很好。能说清自己在哪里偏航，比把每一笔航线画得笔直更有用。']]},
   {title:'两副桨的拍子',guest:'修桨人 · 澄木',role:'merchant',team:[mon('pebble','harborCharm'),mon('tidefin','heartCharm'),mon('voltkit',null,['tackle','static','gust','thunder']),mon('budfox')],hint:'霆光月兔的跃击恢复额外能量；看见对方守势时，可以趁机轮换或蓄势。',before:[['澄木','青禾说她总担心自己慢了。我给她做了两副不同长度的桨。'],['阿汐','一副适合顶风，一副适合顺流？原来一起前进，也不必永远用同一个拍子。']],after:[['澄木','你没有催每一位伙伴都抢先出手。那段停顿，让下一次攻击正好赶上。'],['青禾','我想好了。第一班渡船不卖最快的承诺，只卖一定有人等你上船。']]},
   {title:'船尾留下的位置',guest:'航海人 · 归帆',role:'merchant',team:[mon('tidefin','shellCharm'),mon('mossdeer','heartCharm'),mon('sparrow','featherCharm'),mon('embercat','emberCharm')],hint:'千年森守的守势会恢复生命，但回合仍在流动。把火系攻击留给合适的入场时机。',before:[['归帆','我也要验一验这条航线。不是考你，是让孩子们看见，老船长也会输。'],['青禾','等你们打完，我就把最后一块踏板放下来。今天谁也不需要跳着上船。']],after:[['归帆','启航船票交给你。不是冠军的凭证，是第一位愿意陪我们试航的旅人的票根。'],['青禾','船尾的位置我留着。下一次经过，带新认识的伙伴坐一会儿吧。']]}
  ]
 },
 {
  id:'rain-post',title:'雨里没有湿透的信',region:1,weather:'rain',crest:'雨邮蜡印',
  summary:'镜湾的邮船要重开夜航。阿璃把三封收件人模糊的信放上桌，请你陪新邮差学会辨认风雨。',
  tactic:{name:'雨递',desc:'借雨天强化潮属性攻击，在不利对局中轮换；入场潮衣帮助接住来信。',guard:.9,heal:1,status:1.15,switch:1.4},
  stages:[
   {title:'墨迹之外的地址',guest:'见习邮差 · 阿璃',role:'scholar',team:[mon('tidefin','shellCharm'),mon('dewslime','heartCharm'),mon('sparrow','featherCharm')],hint:'雨天潮属性攻击增强、焰属性减弱。森属性能抵抗潮攻；镜潮之心会挡住第一次异常。',before:[['阿璃','第一封只剩下“每次下雨都会开门的那家”。我跑遍街道，发现有三家都开着门。'],['阿汐','那就先记下他们为什么开门。门牌被冲掉了，习惯也许还在。']],after:[['阿璃','卖伞的为了客人开门，修船的为了声音开门。第三家，是在等一只湿漉漉的晴空信使。'],['阿汐','你已经找到了。地址有时候不是一个地方，是一个人愿意等下去的理由。']]},
   {title:'别让雨替你回答',guest:'夜航报潮员 · 洄音',role:'healer',team:[mon('dewslime','shellCharm'),mon('voltkit','featherCharm'),mon('tidefin','harborCharm'),mon('duskmoth')],hint:'潮、雷与影交替会改变安全轮换对象。入眠或麻痹出现时，可以用净潮盐，或让其他伙伴接班。',before:[['洄音','第二封写着“如果你不想见我，就让这封信留在雨里”。这不是给邮差出的题。'],['阿璃','所以我该把信送到，让收件人自己决定，而不是替他猜一个答案。']],after:[['洄音','雨声再大，也不能替人说同意或拒绝。刚才你等到了行动预告，再决定谁出场。'],['阿璃','我会敲门。然后退开一点，留出一段可以选择的距离。']]},
   {title:'最后一封寄给邮船',guest:'镜湾领航 · 芦汀',role:'warden',team:[mon('tidefin','harborCharm'),mon('voltkit','emberCharm'),mon('mossdeer','shellCharm'),mon('dewslime','heartCharm'),mon('sparrow','featherCharm')],hint:'队伍会用森与雷掩护潮灵。查看下一回合的入场预告，避免把攻击交给已经离场的弱点。',before:[['芦汀','第三封没有收件人，只写“给还会再来的那条船”。你觉得该交给谁？'],['阿璃','交给每一班船。让人们知道，今天没等到，也还有下一次。']],after:[['芦汀','雨邮蜡印留在这张航图上。夜航恢复了，我们会把晚到的信也认真送完。'],['阿璃','第一封已经送到，第二封有人签收，第三封挂在船舱里。谢谢你陪我们走完雨路。']]}
  ]
 },
 {
  id:'kiln-table',title:'炉火边的第九把椅子',region:2,weather:'sun',crest:'余温瓷片',
  summary:'熔砂工坊决定重新办一场大家都能来的晚餐。旧学徒回来了，却不肯坐到师傅身边。',
  tactic:{name:'分火',desc:'利用晴日与灼伤施加压力，短暂防御后继续进攻，避免把炉火耗在等待里。',guard:.85,heal:.85,status:1.35,switch:.9},
  stages:[
   {title:'烧裂的第一只碗',guest:'烧陶学徒 · 小炽',role:'rival',team:[mon('cinder','shellCharm'),mon('embercat','emberCharm'),mon('pebble','heartCharm'),mon('glowbud')],hint:'烈日强化焰属性。岩属性攻击能对付赤砂堡垒；不要只依赖受到天气削弱的水攻。',before:[['小炽','我把碗烧裂了，师傅却让我拿去盛花。我以为她在安慰一个没用的学徒。'],['阿汐','也可能她真的缺一只花盆。先听她把话说完，再决定要不要生气。']],after:[['小炽','我一直盯着那道裂缝，没有看见花已经长出来了。刚才也是，只顾着补防御，错过了进攻。'],['阿汐','裂缝还在。只是你不必每次看见它，都重新判自己输一次。']]},
   {title:'把最大的火让开',guest:'掌勺人 · 焰婆',role:'healer',team:[mon('cinder','harborCharm'),mon('embercat','voyageCharm'),mon('glowbud','heartCharm'),mon('stonegolem','shellCharm')],hint:'赤霞焰王的高伤害带来反噬，拂晓圣莲擅长恢复。可以优先打断脆弱的攻击手，再应对支援。',before:[['焰婆','小炽以为做饭的人就不能上场。让他看看，掌握火候和掌握进退是同一双手的事。'],['小炽','我会看着。今天先不急着证明我已经比你厉害。']],after:[['焰婆','你把最猛烈的一击接住了，也没有把每一回合都烧干净。饭要熟，锅也得留着。'],['小炽','第九把椅子我修好了。师傅，今晚能不能让我坐在你旁边，问几个问题？']]},
   {title:'九只碗都盛上饭',guest:'工坊主持 · 铸遥',role:'warden',team:[mon('embercat','emberCharm'),mon('cinder','shellCharm'),mon('stonegolem','harborCharm'),mon('sunserpent','featherCharm'),mon('glowbud','heartCharm')],hint:'辉属性的黎明之约会自行净化异常。注意对方的伤害与恢复衔接，选择集中击倒一个目标。',before:[['铸遥','最后一场打完就开饭。我没有把胜负写进座位表，所以尽管认真来。'],['阿汐','太好了。我最怕有人输了以后，还要一个人站在门外等汤凉。']],after:[['铸遥','余温瓷片是从那只裂碗上修下来的。小炽说，想让你带走一块不会烫伤人的火。'],['焰婆','九只碗，九把椅子。饭不因为输赢少盛一勺，问题也不因为长大就不许再问。']]}
  ]
 },
 {
  id:'wind-relay',title:'把风交给下一双手',region:3,weather:'clear',crest:'接力风绳',
  summary:'巡风队的老领队要休假三天。三位接班人争论的不是谁更快，而是谁有资格发出返航的信号。',
  tactic:{name:'接风',desc:'重视先手与属性轮换，用下一位伙伴的安全入场换取反击位置。',guard:.9,heal:.9,status:1,switch:1.7},
  stages:[
   {title:'最快的人先停下',guest:'巡风信使 · 轻舟',role:'rival',team:[mon('sparrow','horizonCharm'),mon('skydrake','featherCharm'),mon('voltkit','featherCharm'),mon('nightwolf','emberCharm')],hint:'多个家族拥有优先风切。高速度不等于能抢过优先招式；雷与霜可以压制风属性。',before:[['轻舟','我总是最先到。所以返航信号当然该由我来发，不然谁知道前面有没有危险？'],['阿汐','最先到的人能看见前方。最后一个到的人，能看见有没有人掉队。']],after:[['轻舟','我只看见自己抵达，没有看见身后的队形散了。先手可以赢一回合，不能替所有人走完。'],['阿汐','你还是可以跑得很快。只是发信号以前，回一次头。']]},
   {title:'留在队尾的那个人',guest:'收绳员 · 远藤',role:'merchant',team:[mon('pebble','harborCharm'),mon('frostowl','shellCharm'),mon('sparrow','featherCharm'),mon('mossdeer','heartCharm'),mon('voltkit')],hint:'磐山玄龟速度慢但防御高。别用单一速度思路处理整队；调整属性，或利用对方守势蓄势。',before:[['远藤','我通常走在最后。轻舟说那是因为我慢，其实我在收别人忘记的绳结。'],['轻舟','你为什么从来没告诉我？'],['远藤','你每次问完就飞走了。']],after:[['远藤','这次你等我讲完了。我们可以约定：前面说风，后面说人，然后一起决定返航。'],['轻舟','好。我负责看前方，不再替整个队伍回答。']]},
   {title:'无人缺席的返航',guest:'巡风队长 · 岚柯',role:'warden',team:[mon('skydrake','voyageCharm'),mon('sparrow','featherCharm'),mon('frostowl','shellCharm'),mon('voltkit','emberCharm'),mon('pebble','heartCharm')],hint:'这支队伍擅长反复换位。对方宣布轮换时，可预判新目标的属性；连续换人也会失去攻击机会。',before:[['岚柯','三天后我会回来，但我希望那时你们已经不必等我点头。'],['轻舟','今天的信号由我和远藤一起发。你可以先把行李放下。']],after:[['岚柯','接力风绳上有三种结法，没有哪一种被盖住。队伍不是把大家系成同一个样子。'],['远藤','返航确认：前方无险，队尾无缺。我们全员到港。']]}
  ]
 },
 {
  id:'snow-watch',title:'长夜的第二班岗',region:4,weather:'snow',crest:'换岗雪签',
  summary:'雪原医院终于有人愿意接班。一直守夜的护士却睡不着，总觉得闭上眼就会错过呼唤。',
  tactic:{name:'换岗',desc:'借雪幕与有限恢复撑过压力，再由下一位伙伴接班；会寻找防守后的反击。',guard:1.2,heal:1.15,status:1.1,switch:1.2},
  stages:[
   {title:'交出去的一只铃',guest:'夜班护士 · 眠枝',role:'healer',team:[mon('frostowl','shellCharm'),mon('glowbud','heartCharm'),mon('mossdeer','harborCharm'),mon('dewslime')],hint:'雪天强化霜属性，极光夜巡也更耐打。焰和岩可以应对霜；光系恢复会净化异常。',before:[['眠枝','铃在床边响了很多年。我知道有人接班，还是会在每一次风声里坐起来。'],['阿汐','那今天先把铃交出去一会儿。不是永远，只是一场对战的时间。']],after:[['眠枝','我听见铃响了，也听见别人答应了。原来中间不一定需要我的声音。'],['阿汐','先记住这一次。信任别人接班，也可以像练招式那样慢慢学。']]},
   {title:'雪里两行脚印',guest:'担架队员 · 槐北',role:'rival',team:[mon('frostowl','heartCharm'),mon('pebble','shellCharm'),mon('nightwolf','featherCharm'),mon('glowbud','hearthCharm'),mon('embercat')],hint:'耐久伙伴与快速攻击手会交替。把恢复安排在安全意图出现时，避免一直补血却没有推进。',before:[['槐北','眠枝给了我一长串“如果”。如果风大，如果结冰，如果病人不肯说疼。'],['眠枝','对不起，我不是不信你。我只是以前每一次都只有自己。']],after:[['槐北','我接住了那些如果，也加上一个：如果你累了，就回去睡觉。'],['眠枝','这次的交班记录，我会把你的名字写在值守那一栏，不再写“临时代看”。']]},
   {title:'让守夜人也有梦',guest:'白眠医师 · 雪砚',role:'scholar',team:[mon('frostowl','harborCharm'),mon('mossdeer','heartCharm'),mon('glowbud','shellCharm'),mon('dewslime','hearthCharm'),mon('cinder','emberCharm'),mon('nightwolf')],hint:'这是恢复与耐久的考验。对方支持动作连续使用后会回到攻击；保留能够集中突破的属性组合。',before:[['雪砚','最后一场由我值班。眠枝，你可以观看，也可以先回房间。两种选择都算完成交班。'],['眠枝','我想看完。不过铃先放在你手里。']],after:[['雪砚','换岗雪签已经签好。上面不是某个人欠大家的时数，而是大家约好一起承担的夜晚。'],['眠枝','今晚我会试着睡一觉。如果梦里还听见铃声，就提醒自己：已经有人答应了。']]}
  ]
 },
 {
  id:'dream-return',title:'借来的梦要怎样归还',region:5,weather:'mist',crest:'归梦线轴',
  summary:'暮灯馆收到了几箱无主的梦。馆员发现，有些人已经长大，不再需要当年那一个愿望。',
  tactic:{name:'梦痕',desc:'利用入眠与中毒制造压力，以吸取维持节奏；轮换能够避开不利属性。',guard:.9,heal:.95,status:1.65,switch:1.1},
  stages:[
   {title:'不再合脚的舞鞋',guest:'梦册管理员 · 织夏',role:'scholar',team:[mon('duskmoth','shellCharm'),mon('nightwolf','featherCharm'),mon('dewslime','heartCharm'),mon('budfox','emberCharm')],hint:'迷雾强化影属性，永夜织梦会利用异常。镜潮之心的净影与净潮盐能给队伍争取窗口。',before:[['织夏','这双舞鞋在梦里被穿了十三年。今天收件人说，她已经想当木匠了。'],['阿汐','那就把鞋还给当年的她，也把今天的手留给木头。愿望不必终身不变才算认真。']],after:[['织夏','我把标签从“未实现”改成“已经走过”。她说这样听起来，终于像一段旅程了。'],['阿汐','我们也换过许多招式。学会新的东西，不等于以前的努力白费。']]},
   {title:'醒着才能做的梦',guest:'木匠 · 榆生',role:'merchant',team:[mon('stonegolem','harborCharm'),mon('duskmoth','heartCharm'),mon('glowbud','shellCharm'),mon('nightwolf','voyageCharm'),mon('voltkit')],hint:'对方混合岩、影与辉，单靠一个克制招式不够。黎明之约的攻击与净化可以同时处理压力。',before:[['榆生','我想给暮灯馆做一排抽屉，装那些已经不想继续的梦。不是扔掉，是收好。'],['织夏','那抽屉需要锁吗？'],['榆生','不用。以后想起来，随时还能看看。']],after:[['榆生','刚才每次换人，你都给退下来的伙伴留了位置。那就是我想做的抽屉。'],['织夏','馆里又多了一类收藏：不是遗憾，只是人已经走到了别的地方。']]},
   {title:'空出来的一格',guest:'暮灯馆长 · 暮弦',role:'warden',team:[mon('duskmoth','hearthCharm'),mon('nightwolf','emberCharm'),mon('sunserpent','featherCharm'),mon('dewslime','shellCharm'),mon('stonegolem','harborCharm'),mon('glowbud')],hint:'永夜织梦的吸取依赖伤害，防守或有利轮换能减弱其恢复。辉与影互相克制，出手时机同样重要。',before:[['暮弦','最上面那格一直空着。我以前以为是登记漏了，现在想，也许是给还没做过的梦。'],['阿汐','那今天别急着填满。空白也可以是一种准备。']],after:[['暮弦','归梦线轴送给你。剪断一根不再需要的线，不会让整块织物失去意义。'],['织夏','所有梦都找到合适的位置了。最上面还空着一格，我们决定明天再说。']]}
  ]
 },
 {
  id:'daylight-stage',title:'白昼也需要谢幕',region:6,weather:'sun',crest:'谢幕金叶',
  summary:'永昼广场要演一出有结尾的戏。习惯了永不熄灯的演员们，第一次讨论观众离开以后该做什么。',
  tactic:{name:'谢幕',desc:'用多种属性与快速轮换寻找舞台中央的位置；蓄势之后会尝试强力突破。',guard:.9,heal:1,status:1.1,switch:1.5},
  stages:[
   {title:'追光之外的侧台',guest:'灯光师 · 明穗',role:'scholar',team:[mon('sunserpent','featherCharm'),mon('embercat','voyageCharm'),mon('glowbud','heartCharm'),mon('sparrow','horizonCharm'),mon('pebble','shellCharm')],hint:'烈日下的焰王攻击危险；辉系可以净化异常。用岩系稳定承伤，再观察对方何时轮换。',before:[['明穗','我一直把灯追着主角，直到昨天才看见，侧台的人在黑暗里换了十九次布景。'],['阿汐','今天能给侧台也留一盏吗？不需要很亮，够他们看清彼此就好。']],after:[['明穗','你的替补也有自己的回合。不是只有最后打出一击的伙伴，才值得被看见。'],['阿汐','谢幕的时候，记得让搬布景的人也站到前面。']]},
   {title:'主角可以先退场',guest:'演员 · 晞白',role:'rival',team:[mon('sunserpent','voyageCharm'),mon('nightwolf','featherCharm'),mon('skydrake','emberCharm'),mon('glowbud','shellCharm'),mon('tidefin','harborCharm')],hint:'这支队伍有很强的入场节奏。夜航领主首次攻击会争取先机；对方换人时不妨重新评估下一击。',before:[['晞白','我演了太久的主角。只要我还站着，其他人就像必须接着演下去。'],['明穗','所以这一幕，由你先退场。把最亮的地方留给下一位。']],after:[['晞白','我退到侧台时，戏没有停。原来我不在正中间，也仍然属于这个故事。'],['明穗','你的名字还在节目单上。只是后面多了一行：今天也认真看了别人的演出。']]},
   {title:'掌声停下以后',guest:'永昼导演 · 照岚',role:'warden',team:[mon('sunserpent','heartCharm'),mon('embercat','emberCharm'),mon('skydrake','featherCharm'),mon('glowbud','shellCharm'),mon('nightwolf','voyageCharm'),mon('pebble','harborCharm')],hint:'六只伙伴有不同的抗性与速度。用全队应对；不要为了维持同一位主力而耗尽所有药品。',before:[['照岚','最后一幕没有台词。大家一起熄灯，再从同一扇门走出去。'],['阿汐','那我知道结尾怎么写了：散场以后，他们仍然是朋友。']],after:[['照岚','谢幕金叶从舞台边拾来。灯熄了，树还会长，明天也还可以排新的戏。'],['晞白','今天就到这里。谢谢各位，回家路上小心。']]}
  ]
 },
 {
  id:'star-home',title:'没有终点的归航',region:7,weather:'clear',crest:'群岛同行印',
  summary:'八份邀请的最后一封来自阿汐。归航不是回到从前，而是带着这些相遇，为明天留一条可以再走的路。',
  tactic:{name:'同航',desc:'混合各地的轮换、恢复与压制战术，让每位伙伴都能承担一段航程。',guard:1.05,heal:1,status:1.3,switch:1.45},
  stages:[
   {title:'把名字写在背面',guest:'星图抄写员 · 弥舟',role:'scholar',team:[mon('tidefin','harborCharm'),mon('sparrow','horizonCharm'),mon('frostowl','shellCharm'),mon('duskmoth','hearthCharm'),mon('voltkit','emberCharm'),mon('stonegolem','heartCharm')],hint:'天气平静，属性与特性成为关键。确认招式搭配能覆盖不同对手，低消耗招式可维持长战。',before:[['弥舟','航图正面已经写满岛名。我想把帮过这条航线的人，写到背面。'],['阿汐','别只写守灯人。也写学徒、收绳员、值夜班的人，还有做第九把椅子的那双手。']],after:[['弥舟','背面写满了，可翻过来仍是一张能用的航图。记住别人，不会让前路变轻或变重，只会更清楚。'],['阿汐','还差最后两行。一行给愿意同行的潮灵，一行给你。']]},
   {title:'再认真切磋一次',guest:'同行者 · 阿汐',role:'rival',team:[mon('budfox','heartCharm'),mon('embercat','voyageCharm'),mon('tidefin','harborCharm'),mon('voltkit',null,['tackle','static','gust','thunder']),mon('nightwolf','featherCharm'),mon('glowbud','shellCharm')],hint:'阿汐会把早期伙伴与后来学会的战术结合。保存能量、看清预告、适时轮换，比一味使用最强招式更可靠。',before:[['阿汐','最初我跟在你身边，怕你不知道该往哪里走。后来我发现，你也在等我说出自己的想法。'],['阿汐','所以这一场，不做提示你的旅伴了。我想作为一个认真训练过的人，请你全力以赴。']],after:[['阿汐','我有几步想得很好，也有几步走急了。谢谢你没有因为熟悉，就把这一场让给我。'],['阿汐','最后一封邀请，我们一起去收。然后找一家不用讨论世界命运的小店，好好吃顿饭。']]},
   {title:'把明天留给自己',guest:'引潮人 · 星遥',role:'warden',team:[mon('sunserpent','featherCharm'),mon('skydrake','voyageCharm'),mon('stonegolem','harborCharm'),mon('duskmoth','hearthCharm'),mon('tidefin','shellCharm'),mon('glowbud','heartCharm')],hint:'完整六人混合队伍考验持续作战。可以回候场营地恢复并调整护符；观察对方意图，逐一处理最危险的入场。',before:[['星遥','你修好的不只是灯。是人们终于愿意再次约定：明天在某个地方见。'],['阿汐','所以最后一次试航，不需要证明你能独自撑住一切。让伙伴们一起上吧。']],after:[['星遥','群岛同行印交给你。八条航线重新相连，来过的人，都在这里留下了一个可以再来的理由。'],['弥舟','航图背面终于写满了。我另外装订了几页空白，给以后认识的人。'],['阿汐','看，归帆的船开出来了。青禾在船头，远藤在收绳，眠枝靠着窗睡着了。'],['阿汐','这一次，没人需要我们立刻去拯救什么。我们可以先决定午饭吃什么。'],['旁白','你把启航船票、雨邮蜡印和一路收好的纪念物放进同一只口袋。海面依然很宽，但已经不是一片没有回音的海。'],['旁白','星海试航篇完。远海仍有新的切磋，也有随时可以回去的港口。']]}
  ]
 }
];
export const TRIAL_STAGES=TRIAL_CIRCUITS.flatMap((c,chapter)=>c.stages.map((stage,index)=>({...stage,floor:chapter*3+index+1,chapter,index,circuit:c.id,weather:stage.weather||c.weather,tactic:c.tactic,level:Math.min(65,52+Math.floor((chapter*3+index+1)/2))})));
export function trialAt(floor){
 if(!Number.isSafeInteger(floor)||floor<1)return null;
 const base=TRIAL_STAGES[(floor-1)%TRIAL_STAGES.length];
 return floor<=24?base:{...base,floor,title:'远海回航 · '+base.title,level:65,endless:true};
}
export function trialAfterScene(game,id){
 const match=/^trial-after:([1-9]\d*)$/.exec(id);if(!match)return null;const floor=Number(match[1]);
 return game.ending&&floor<=24&&floor<=(game.trial||0)?trialAt(floor)?.after:null;
}
export function trialReward(floor){
 const stage=trialAt(floor);if(!stage)return null;
 return {gold:floor*45,items:{greatorb:1,...(floor<=24&&floor%3===0?{superpotion:3,revive:1}:{}),...(floor===24?{revive:3}: {})},crest:floor<=24&&floor%3===0?TRIAL_CIRCUITS[stage.chapter].crest:null};
}
