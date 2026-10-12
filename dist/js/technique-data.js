// Advanced techniques are optional choices for the four-slot move loadout.
// Basic automatic loadouts stay usable for returning players and old battles.
export const ADVANCED_MOVES={
 mercy:{name:'留星一触',element:null,power:45,cost:1,nonlethal:true,role:'缔约辅助',desc:'这次攻击至少留下对手 1 点生命，便于缔约。之后的中毒、灼伤仍可能使它倒下。'},
 shatter:{name:'碎潮断甲',element:'stone',power:60,cost:2,breakShield:true,role:'破盾',desc:'先打碎对手的护盾，再造成伤害。适合回应守势与屏障；没有护盾时是普通攻击。'},
 unravel:{name:'空白回音',element:'shade',power:45,cost:2,priority:1,dispel:true,role:'驱散增益',desc:'优先攻击，清除对手的蓄势、疾风与春芽。不会清除护盾或异常状态。'},
 regrowth:{name:'春芽守候',element:'moss',power:0,cost:2,regen:3,role:'持续恢复',desc:'从本回合末起，连续 3 回合恢复最大生命的 8%。换下场或被驱散时结束；不能唤醒倒下的伙伴。'},
 tailstep:{name:'逐风步',element:'wind',power:50,cost:2,haste:2,role:'争取先手',desc:'攻击后，接下来 2 回合速度提高 40%。换下场或被驱散时结束；优先招式仍按优先度行动。'},
 siphon:{name:'断潮音',element:'volt',power:45,cost:2,sapEnergy:1,role:'能量控制',desc:'命中后抽取对手至多 1 点能量，补给自身。若对手因此无法支付本回合技能，改用跃击。'},
 kindle:{name:'引燃残响',element:'ember',power:70,cost:3,consumeStatus:['burn'],role:'灼伤连携',desc:'对已灼伤的对手伤害提高 40%，随后解除其灼伤。可以用持续伤害换取此刻的爆发。'},
 frostbite:{name:'霜华解印',element:'frost',power:65,cost:3,consumeStatus:['root','shock'],role:'减速连携',desc:'对缠绕或麻痹的对手伤害提高 40%，随后解除该异常。对普通目标没有额外增幅。'},
 tideshelter:{name:'海息回环',element:'tide',power:0,cost:3,heal:.18,shield:2,role:'恢复与防护',desc:'恢复自身 18% 生命，并获得持续 2 回合的护盾。破盾招式仍可打碎这层保护。'},
 radiance:{name:'晨光净域',element:'light',power:55,cost:2,teamCleanse:true,role:'全队净化',desc:'攻击后，清除同行队伍所有伙伴的异常状态，包括暂未出场者。不会恢复生命或唤醒倒下者。'}
};

// Every family has a middle-game tool and a later tactical alternative.
export const FAMILY_TECHNIQUES={
 budfox:['regrowth','unravel'],embercat:['kindle','shatter'],tidefin:['tideshelter','radiance'],
 mossdeer:['regrowth','tideshelter'],sparrow:['tailstep','unravel'],pebble:['shatter','regrowth'],
 voltkit:['siphon','tailstep'],frostowl:['frostbite','radiance'],duskmoth:['unravel','regrowth'],
 glowbud:['radiance','tideshelter'],cinder:['shatter','kindle'],dewslime:['tideshelter','siphon'],
 nightwolf:['unravel','frostbite'],stonegolem:['shatter','unravel'],skydrake:['tailstep','kindle'],
 sunserpent:['radiance','siphon'],frostotter:['regrowth','frostbite'],kitesquid:['tailstep','tideshelter'],
 glassbeetle:['shatter','radiance'],clockmouse:['siphon','tailstep']
};
