import {navigationField,pathFromField,pathToObject,chartMarkers} from './navigation.js';
import {chartMarkup,selectedChartMarkup,drawLocalChart} from './chart-view.js';
import {BOND_CHRONICLES} from './bond-stories.js';
import {bondStatus,bondChapter,completeBondChapter} from './bond-engine.js';
import {bondIndexMarkup,bondFamilyMarkup,bondReaderMarkup} from './bond-view.js';
import {equipCompanion} from './equipment.js';
import {createBattlePlayback,playbackFrame} from './battle-playback.js';
import {moveLearnset,setMoveLoadout} from './moves.js';
import {moveBookMarkup,moveDescription} from './move-view.js';
import {RELICS,getRelic} from './relics.js';
import {applyRelicAction,relicProgress,restoredLetters} from './relic-engine.js';
import {relicMarkup} from './relic-view.js';
import {drawItemIcon} from './item-icons.js';
import {SHOP_GROUPS,SHOP_STOCK,purchaseQuote,purchaseItem,craftQuote,craftItem} from './economy.js';
import {describeEnemyPlan,WARDEN_TACTICS} from './battle-ai.js';
import {abilityFor} from './abilities.js';
import {expeditionTeam,dungeonTeam,wardenTeam,outdoorTrainerTeam} from './encounters.js';
import {VERSION,ELEMENTS,MOVES,SPECIES,STARTERS,ITEMS,RECIPES,STATUS,WEATHER,CHAPTERS,SIDEQUESTS,ENDING} from './data.js';
import {clamp,clone,random,stats,moveList,createMon,createGame,healParty,makeBattle,takeTurn,settleBattle,questReady,saveEnvelope,readEnvelope,xpNeed,effectiveness,completeStory,checkpointGame} from './engine.js';
import {makeMap,TILE,drawWorld,nearest,canWalk,camera,tileKind} from './world.js';
import {drawMonster,drawPerson,drawProp} from './art.js';
import {SIDE_STORIES,CAMPFIRE_TALKS} from './stories.js';
import {FrameMetrics,easePosition} from './performance.js';
import {drawTitleVista} from './landmarks.js';
import {drawBattleScene} from './battle-view.js';
import {turnRune,gateIsOpen,runeValue,RUNE_SYMBOLS} from './dungeon-engine.js';
import {EXPEDITIONS} from './expedition-stories.js';
import {outdoorSite,outdoorArea} from './outdoor-engine.js';
import {getExpedition,expeditionProgress,currentExpeditionStage,advanceExpedition,expeditionScene,EXPEDITION_SITES,STAGE_KINDS} from './expedition-engine.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canvas=$('#world'),ctx=canvas.getContext('2d');
const SAVE='starfall-save-v1',BACKUP='starfall-save-backup-v1';
let game=null,map=null,fight=null,dialogue=null,modalType='',modalLastFocus=null,frameTime=0,lastFrame=0,moveCooldown=0,walkingUntil=0,toastTimer,zoneTimer,lastInteraction='',heldKeys=new Set(),pathQueue=[],lastStepCount=0,battleMenu='root',soundContext=null,musicTimer=null,musicStep=0,lastSaveTick=0;
let view={w:1200,h:760,dpr:1},battlePanelHeight=0,chartObserver=null;
const metrics=new FrameMetrics();let visualPlayer={x:18,y:19},lastMetricsUpdate=0,battleEffect=null,pendingBattle=null,renderDirty=true;
const titleGame={region:0,place:'town',x:21,y:16,party:[],collected:{},facing:'down'},titleMap=makeMap(0,'town');
let savedText=null;
try{savedText=localStorage.getItem(SAVE)||localStorage.getItem(BACKUP);if(savedText)readEnvelope(savedText);}catch(e){try{savedText=localStorage.getItem(BACKUP);if(savedText)readEnvelope(savedText);}catch{savedText=null;}}
if(savedText)$('#continue-button').classList.remove('hidden');
const typeTag=id=>`<span class="type-tag" style="color:${ELEMENTS[id].color}">${ELEMENTS[id].name}属性</span>`;
const monCanvas=(id,size=120)=>`<canvas width="${size*2}" height="${size*2}" style="width:${size}px;height:${size}px" data-species="${id}"></canvas>`;
const itemCanvas=(id,size=32)=>`<canvas class="item-sprite" width="32" height="32" style="width:${size}px;height:${size}px" data-item="${id}" aria-hidden="true"></canvas>`;
function paintMonCanvases(){for(const c of $$('canvas[data-item]'))if(!c.dataset.painted){drawItemIcon(c.getContext('2d'),c.dataset.item);c.dataset.painted='true';}for(const c of $$('canvas[data-species]')){const cc=c.getContext('2d');cc.clearRect(0,0,c.width,c.height);drawMonster(cc,SPECIES[c.dataset.species],0,0,c.width,{time:frameTime});}for(const c of $$('canvas[data-person]')){drawPerson(c.getContext('2d'),0,0,c.width,{role:c.dataset.person,time:0});}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.add('hidden'),3800);}
function resize(){document.body.dataset.quality=game?.quality||'high';const r=$('#stage').getBoundingClientRect();view={w:r.width,h:r.height,dpr:Math.min(devicePixelRatio||1,game?.quality==='performance'?1:game?.quality==='balanced'?1.5:2)};canvas.width=Math.round(view.w*view.dpr);canvas.height=Math.round(view.h*view.dpr);ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.imageSmoothingEnabled=false;renderDirty=true;}
new ResizeObserver(resize).observe($('#stage'));
new ResizeObserver(entries=>{const height=entries[0].borderBoxSize?.[0]?.blockSize||entries[0].target.getBoundingClientRect().height;if(height>0&&height!==battlePanelHeight){battlePanelHeight=height;$('#battle-screen').style.setProperty('--battle-panel-height',height+'px');renderDirty=true;}}).observe($('.battle-dialog'));

function save(notify=false){if(!game)return;try{game=checkpointGame(game,fight);game.lastSave=Date.now();const previous=localStorage.getItem(SAVE);if(previous)localStorage.setItem(BACKUP,previous);localStorage.setItem(SAVE,saveEnvelope(game));$('#save-indicator').textContent='已保存 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});if(notify)toast('旅途已保存。');}catch{toast('浏览器存储空间不足，请在设置中导出存档。');}}
function startGame(g){game=g;updateControlHints();visualPlayer={x:game.x,y:game.y};resize();metrics.reset();map=makeMap(game.region,game.place,game.dungeonFloor||0,game.routeSector||0);if(!canWalk(map,game,game.x,game.y)&&map.entry){game.x=map.entry.x;game.y=map.entry.y;visualPlayer={x:game.x,y:game.y};}fight=null;pendingBattle=null;battleEffect=null;dialogue=null;$('#dialogue').classList.add('hidden');heldKeys.clear();pathQueue=[];$('#title-screen').classList.add('hidden');$('#world-ui').classList.remove('hidden');$('#game-nav').classList.remove('hidden');$('#mobile-controls').classList.remove('hidden');$('#battle-screen').classList.add('hidden');$('#sound-button').textContent=game.sound?'♫':'♩';updateHUD();canvas.focus();announceZone();if(game.sound)startMusic();if(game.suspendedBattle)enterBattle(clone(game.suspendedBattle));else playPendingScenes();}
function announceZone(){const c=CHAPTERS[game.region];$('#zone-toast').innerHTML=escape(map.floorName||c[game.place])+`<small>${escape(c.island)} · ${escape(c.name)}</small>`;$('#zone-toast').classList.remove('hidden');clearTimeout(zoneTimer);zoneTimer=setTimeout(()=>$('#zone-toast').classList.add('hidden'),2600);}
function updateHUD(){if(!game)return;const ch=CHAPTERS[game.region];$('#chapter-label').textContent=`第 ${game.region+1} 章 · ${ch.name}`;$('#place-name').textContent=map.floorName||ch[game.place];$('#weather-label').textContent=WEATHER[ch.weather].icon+' '+WEATHER[ch.weather].name;$('#region-label').textContent=ch.island;$('#gold-label').textContent=game.gold.toLocaleString();$('#badge-label').textContent=`✧ ${game.badges.length} / 8`;
 const fragments=fragmentCount();$('#quest-pin').innerHTML=game.badges.includes(game.region)?`<b>✦ ${escape(ch.reward)}已点亮</b>${game.region<7?'前往港口，与航海人对话，启程去下一座岛。':'星潮已经退去。还可以完成委托，探索图鉴，挑战守灯人。'}`:`<b>✦ ${escape(ch.name)}</b>${escape(ch.task)}<br><span style="color:var(--gold)">已收集 ${fragments} / 3</span>`;
 if(fragments===3&&!game.badges.includes(game.region))$('#quest-pin').innerHTML=`<b>✦ 三份记忆已经找回</b>前往${escape(outdoorArea(game.region,2).name)}，进入${escape(ch.dungeon)}，寻找${escape(ch.warden)}。`;
 const tracked=trackedExpedition(),stage=tracked&&currentExpeditionStage(game,tracked.id);
 if(stage&&!game.badges.includes(game.region))$('#quest-pin').innerHTML=`<b>✦ ${escape(tracked.title)}</b>${escape(stage.title)}<br><span class="quest-destination">⌖ ${escape(stage.site.startsWith('route-')?outdoorSite(game.region,stage.site).name:EXPEDITION_SITES[stage.site].name)} · ${fragmentCount()} / 3 份记忆</span>`;
 if(game.place==='dungeon'&&!game.badges.includes(game.region))$('#quest-pin').innerHTML=`<b>✦ ${escape(ch.dungeon)} · 第 ${(game.dungeonFloor||0)+1} / 4 层</b>${game.dungeonFloor===3?'寻找守灯人。也可以修复这一层的旧日仪器，读一封留下的信。':'阅读石碑线索，调整日、月、星符柱，打开通往下一层的封门。'}`;
 $('#party-dock').innerHTML=game.party.map((m,i)=>`<button class="mini-mon" data-mon="${i}" aria-label="${escape(SPECIES[m.species].name)}，${m.level}级，生命${m.hp}"><span class="mini-level">${m.level}</span><canvas width="104" height="96" data-species="${m.species}"></canvas><div class="mini-hp"><i style="width:${m.hp/stats(m).hp*100}%;background:${m.hp===0?'#b57474':'#83c9b9'}"></i></div></button>`).join('');paintMonCanvases();$$('[data-mon]').forEach(el=>el.onclick=()=>openMon(game.party[+el.dataset.mon]));}
function fragmentCount(){return [0,1,2].filter(i=>game.flags[`fragment${game.region}-${i}`]).length;}

function openModal(title,html,type='generic',eyebrow='旅途的一部分'){
 chartObserver?.disconnect();chartObserver=null;
 heldKeys.clear();pathQueue=[];if($('#modal').classList.contains('hidden'))modalLastFocus=document.activeElement;modalType=type;$('#modal').dataset.panel=type;$('#modal-title').textContent=title;$('#modal-eyebrow').textContent=eyebrow;$('#modal-content').innerHTML=html;$('#modal').classList.remove('hidden');$('#modal-close').focus();paintMonCanvases();$('.modal-panel').scrollTop=0;}
function closeModal(){chartObserver?.disconnect();chartObserver=null;metrics.reset();renderDirty=true;if(modalType==='starter'&&!game){$('#modal').classList.add('hidden');modalType='';return;}$('#modal').classList.add('hidden');modalType='';if(modalLastFocus?.isConnected)modalLastFocus.focus();else canvas.focus();}
$('#modal-close').onclick=closeModal;$('#modal').onclick=e=>{if(e.target===$('#modal'))closeModal();};
function beginNew(){openModal('选择与你同行的潮灵',`<p class="section-note">故事开始于一个名字，和一次愿意同行的约定。三位伙伴拥有不同的属性，旅途中还会遇到更多潮灵。</p><label class="eyebrow" for="traveler-name">你希望大家怎样称呼你？</label><input id="traveler-name" class="name-input" maxlength="12" placeholder="旅人" value="旅人"><div class="grid starter-grid">${STARTERS.map(id=>`<button class="card starter-card" data-starter="${id}">${monCanvas(id,140)}${typeTag(SPECIES[id].element)}<h3>${SPECIES[id].name}</h3><p>${SPECIES[id].lore}</p><div class="move-chip">${id==='budfox'?'恢复与牵制':id==='embercat'?'爆发与灼伤':'耐久与控场'}</div></button>`).join('')}</div>`,'starter','第一份约定');$$('[data-starter]').forEach(b=>b.onclick=()=>{const g=createGame($('#traveler-name').value,b.dataset.starter);g.flags['entered0']=true;g.pendingScenes=['intro0'];closeModal();startGame(g);save();});}
$('#new-button').onclick=()=>{if(savedText)openModal('开始新的旅程',`<p class="section-note">新的旅途会覆盖浏览器中的当前存档。可以先导出旧存档，随时再回来。</p><div class="card-actions"><button id="backup-start">导出旧存档</button><button id="confirm-start">开始新旅程</button></div>`,'new-confirm');else return beginNew();$('#backup-start').onclick=()=>downloadSave(savedText);$('#confirm-start').onclick=beginNew;};
$('#continue-button').onclick=()=>{try{startGame(readEnvelope(savedText));toast('欢迎回来，'+game.name+'。');}catch(e){toast('读取失败：'+e.message);}};
function downloadSave(text=saveEnvelope(game)){if(!text)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:'application/json'}));a.download='星潮纪行-旅途存档-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
$('#import-title').onclick=()=>$('#save-file').click();$('#save-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2e6)throw new Error('存档文件过大。');const imported=readEnvelope(await f.text());if(game){openModal('载入这段旅程？',`<p class="section-note">将载入 ${escape(imported.name)} 的旅程：${CHAPTERS[imported.region].island}，${imported.badges.length} 枚灯印。当前存档会自动保留一份备份。</p><button class="primary" id="confirm-import">载入存档</button>`);$('#confirm-import').onclick=()=>{save();closeModal();startGame(imported);save();};}else{startGame(imported);save();}}catch(err){toast('存档无法读取：'+err.message);}e.target.value='';};

function playPendingScenes(){
 if(!game?.pendingScenes?.length||fight||dialogue)return;
 const id=game.pendingScenes[0],lines=id.startsWith('exp-')?expeditionScene(game,id):id==='ending'?ENDING:id.startsWith('intro')?CHAPTERS[+id.slice(5)].intro:CHAPTERS[+id.slice(5)].after;
 showDialogue(lines,()=>{if(game.pendingScenes[0]===id)game.pendingScenes.shift();save();if(game.pendingScenes.length)playPendingScenes();else if(id==='intro0')toast('使用 WASD / 方向键移动。靠近人物或发光物体，按 E 互动。');else if(id==='ending')toast('主线完结。感谢你陪伴这段旅途。');else if(id.startsWith('exp-end:'))openExpeditionComplete(id.split(':')[1]);},id.startsWith('exp-')?getExpedition(id.split(':')[1]).role:undefined);
}
function openExpeditionComplete(id){
 const expedition=getExpedition(id);
 openModal('一段记忆，妥善收好',`<div class="expedition-complete"><div class="completion-crest">✧</div><span class="eyebrow">地区冒险完成</span><h3>${escape(expedition.title)}</h3><p>${escape(expedition.ending[0][1])}</p><div class="completion-loot"><span><b>✦</b>记忆碎片 × 1</span><span><b>◈</b>${expedition.reward.gold} 星砂</span>${Object.entries(expedition.reward.items).map(([item,n])=>`<span>${itemCanvas(item,24)}${ITEMS[item].name} × ${n}</span>`).join('')}</div><small>本岛已找回 ${fragmentCount()} / 3 份记忆 · 进度已自动保存</small><div class="card-actions"><button class="primary" id="completion-next">继续旅程 →</button><button class="secondary" id="completion-journal">查看旅途手记</button></div></div>`,'expedition-complete',CHAPTERS[game.region].island);
 $('#completion-next').onclick=closeModal;$('#completion-journal').onclick=openJournal;sfx('get');
}
function trackedExpedition(){
 const regional=EXPEDITIONS.filter(e=>e.region===game.region&&currentExpeditionStage(game,e.id));
 return regional.find(e=>e.id===game.trackedExpedition)||regional.find(e=>expeditionProgress(game,e.id).step>0)||regional[0];
}
function expeditionLocation(stage){const site=EXPEDITION_SITES[stage.site],area=outdoorSite(game.region,stage.site);return `${area?area.name:CHAPTERS[game.region][site.place]} · ${site.name}`;}
function expeditionCard(expedition){
 const progress=expeditionProgress(game,expedition.id),stage=currentExpeditionStage(game,expedition.id),done=!stage;
 return `<button class="expedition-card ${done?'complete':''}" data-expedition="${expedition.id}"><span class="expedition-portrait"><canvas width="96" height="96" data-person="${expedition.role}"></canvas></span><span class="expedition-copy"><small>${done?'✧ 记忆已找回':`主线冒险 · ${progress.step} / ${expedition.stages.length}`}</small><strong>${escape(expedition.title)}</strong><span>${escape(stage?stage.title:expedition.giver)}</span><span class="expedition-progress"><i style="width:${progress.step/expedition.stages.length*100}%"></i></span><em>${stage?escape(stage.site.startsWith('route-')?outdoorSite(game.region,stage.site).name:EXPEDITION_SITES[stage.site].name):'感谢你停下来倾听'}</em></span><span class="expedition-arrow">↗</span></button>`;
}
function bindExpeditionCards(){$$('[data-expedition]').forEach(b=>b.onclick=()=>openExpedition(b.dataset.expedition));}
function openAreaMap(sector=game.routeSector||0){
 const area=outdoorArea(game.region,sector),ch=CHAPTERS[game.region];
 const objectives=EXPEDITIONS.filter(e=>e.region===game.region).flatMap(e=>{const stage=currentExpeditionStage(game,e.id),site=stage&&outdoorSite(game.region,stage.site);return site?.sector===sector?[{expedition:e,stage,x:site.x+(e.fragment-1)*2,y:site.y}]:[];});
 openModal(ch.island+' · 地区航图',`<div class="area-tabs">${[0,1,2].map(i=>`<button data-area="${i}" class="${i===sector?'active':''}"><small>0${i+1}</small>${escape(outdoorArea(game.region,i).name)}</button>`).join('')}</div><div class="area-map-frame"><canvas id="area-map" width="672" height="456" role="img" aria-label="${escape(area.name)}地图：金色菱形代表当前任务，编号代表出口，白色圆点代表你的位置。"></canvas><div class="map-key"><span>◇ 当前目标</span><span>○ 你的位置</span><span>1–${area.exits.length} 分区出口</span></div></div><div class="map-exits">${area.exits.map((exit,i)=>`<div><b>${i+1}</b><span>${escape(exit.label)}</span></div>`).join('')}</div>${objectives.length?`<div class="journal-heading"><h3>这一带的故事</h3></div><div class="area-objectives">${objectives.map(o=>`<button data-area-quest="${o.expedition.id}"><span>◇</span><div><strong>${escape(o.stage.title)}</strong><small>${escape(o.expedition.title)}</small></div><b>↗</b></button>`).join('')}</div>`:'<p class="section-note">这一带暂时没有正在追踪的地区冒险，仍可以寻找当地的见闻与补给。</p>'}<div class="card-actions"><button class="secondary" id="back-island-map">群岛航线</button><button class="primary" id="close-area-map">回到旅途 →</button></div>`,'area-map','溪流、桥梁与归途');
 const c=$('#area-map'),cx=c.getContext('2d'),size=12;cx.imageSmoothingEnabled=false;
 const colors={'~':ch.palette[3],'.':ch.palette[0],':':ch.palette[2],'=':'#bc956b',',':'#b5a080','#':'#182e35'};
 for(let y=0;y<38;y++)for(let x=0;x<56;x++){cx.fillStyle=colors[area.layout[y][x]];cx.fillRect(x*size,y*size,size,size);}
 cx.strokeStyle='#f0ddaa35';cx.lineWidth=1;for(let x=0;x<56;x+=7){cx.beginPath();cx.moveTo(x*size,0);cx.lineTo(x*size,456);cx.stroke();}for(let y=0;y<38;y+=7){cx.beginPath();cx.moveTo(0,y*size);cx.lineTo(672,y*size);cx.stroke();}
 for(const [i,exit] of area.exits.entries()){const x=(exit.x+.5)*size,y=(exit.y+.5)*size;cx.fillStyle='#112831';cx.beginPath();cx.arc(x,y,12,0,Math.PI*2);cx.fill();cx.strokeStyle='#f1d798';cx.stroke();cx.fillStyle='#f1d798';cx.font='bold 13px sans-serif';cx.textAlign='center';cx.fillText(String(i+1),x,y+5);}
 for(const objective of objectives){const x=(objective.x+.5)*size,y=(objective.y+.5)*size;cx.fillStyle='#f1d798';cx.strokeStyle='#132d34';cx.lineWidth=2;cx.beginPath();cx.moveTo(x,y-9);cx.lineTo(x+8,y);cx.lineTo(x,y+9);cx.lineTo(x-8,y);cx.closePath();cx.fill();cx.stroke();}
 if(game.place==='route'&&game.routeSector===sector){const x=(game.x+.5)*size,y=(game.y+.5)*size;cx.fillStyle='#fff7e0';cx.strokeStyle='#18333c';cx.lineWidth=3;cx.beginPath();cx.arc(x,y,6,0,Math.PI*2);cx.fill();cx.stroke();}
 $$('[data-area]').forEach(b=>b.onclick=()=>openAreaMap(+b.dataset.area));$$('[data-area-quest]').forEach(b=>b.onclick=()=>openExpedition(b.dataset.areaQuest));$('#back-island-map').onclick=openMap;$('#close-area-map').onclick=closeModal;
}
function openExpedition(id){
 const expedition=getExpedition(id),progress=expeditionProgress(game,id),stage=currentExpeditionStage(game,id);
 const reward=Object.entries(expedition.reward.items).map(([item,n])=>`${ITEMS[item].name} × ${n}`).join(' · ');
 openModal(expedition.title,`<div class="expedition-heading"><canvas width="112" height="112" data-person="${expedition.role}"></canvas><div><span class="eyebrow">${escape(expedition.giver)}</span><p>${escape(expedition.summary)}</p></div></div>${stage?`<div class="expedition-objective"><small>下一站 · ${STAGE_KINDS[stage.kind]}</small><h3>${escape(stage.title)}</h3><p>⌖ ${escape(expeditionLocation(stage))}</p><button class="primary" id="track-expedition">在旅途中追踪 →</button>${stage.site.startsWith('route-')?'<button class="secondary" id="expedition-area-map">查看目的地地图</button>':''}</div>`:'<div class="expedition-objective"><small>✧ 已完成</small><h3>这座岛的记忆，已经妥善收好。</h3></div>'}<ol class="expedition-timeline">${expedition.stages.map((s,i)=>`<li class="${i<progress.step?'done':i===progress.step?'current':''}"><span>${i<progress.step?'✓':String(i+1).padStart(2,'0')}</span><div><b>${i<=progress.step?escape(s.title):'尚未走到的故事'}</b><small>${i<=progress.step?escape(EXPEDITION_SITES[s.site].name):'继续当前目标后揭晓'}${progress.choices[s.id]!==undefined?' · '+escape(s.choices[progress.choices[s.id]].label):''}</small></div></li>`).join('')}</ol><div class="expedition-reward">完成后 · ${expedition.reward.gold} 星砂 · ${escape(reward)} · 记忆碎片 × 1</div><button class="secondary" id="expedition-journal">返回旅途手记</button>`,'expedition','三份记忆 · 一盏星灯');
 if($('#track-expedition'))$('#track-expedition').onclick=()=>{game.trackedExpedition=id;save();updateHUD();closeModal();toast('已追踪：'+stage.title+' · '+EXPEDITION_SITES[stage.site].name);};
 if($('#expedition-area-map'))$('#expedition-area-map').onclick=()=>openAreaMap(outdoorSite(game.region,stage.site).sector);
 $('#expedition-journal').onclick=openJournal;
}
function finishExpeditionStage(expedition,stage,input={}){
 try{
  const result=advanceExpedition(game,expedition.id,stage.id,input);game=result.game;lastInteraction='';renderDirty=true;save();updateHUD();
  if(game.pendingScenes.length)playPendingScenes();
  else toast(result.completed?'记忆碎片已经收好。':'下一站：'+currentExpeditionStage(game,expedition.id).title);
 }catch(error){toast(error.message);}
}
function interactExpedition(id){
 const expedition=getExpedition(id),stage=currentExpeditionStage(game,id);
 if(!stage)return showDialogue(expedition.ending);
 game.trackedExpedition=id;save();updateHUD();
 showDialogue(stage.lines,()=>{
  if(stage.kind==='battle'){
   startBattle(expeditionTeam(game.region,stage,game.seed),{kind:'trainer',name:expedition.giver+' · '+stage.title,expedition:id,stage:stage.id});
  }else if(stage.kind==='sequence')openSequence(expedition,stage);
  else if(stage.kind==='choice'){
   openModal(stage.title,`<p class="section-note">${escape(stage.lines[stage.lines.length-1][1])}</p><div class="expedition-choices">${stage.choices.map((choice,i)=>`<button data-exp-choice="${i}"><span>${String(i+1).padStart(2,'0')}</span>${escape(choice.label)}<b>→</b></button>`).join('')}</div>`,'expedition-choice',expedition.title);
   $$('[data-exp-choice]').forEach(b=>b.onclick=()=>{closeModal();finishExpeditionStage(expedition,stage,{choice:+b.dataset.expChoice});});
  }else if(stage.kind==='delivery'){
   const count=game.bag[stage.item]||0;
   openModal(stage.title,`<div class="expedition-objective"><small>需要的素材</small><h3>${ITEMS[stage.item].name} × ${stage.amount}</h3><p>背包持有 ${count} 份。${count<stage.amount?'可以在原野采集，也可以到杂货铺补充。':'这些材料会用于当地的修缮与照料。'}</p><button class="primary" id="exp-deliver" ${count<stage.amount?'disabled':''}>交付素材 →</button></div>`,'expedition-delivery',expedition.giver);
   $('#exp-deliver').onclick=()=>{closeModal();finishExpeditionStage(expedition,stage);};
  }else finishExpeditionStage(expedition,stage);
 },expedition.role);
}
function openSequence(expedition,stage){
 let sequence=[];
 openModal(stage.title,`<p class="section-note">按你推理出的顺序选择。选错可以撤回，不会消耗道具。</p><div class="sequence-slots" id="sequence-slots" aria-live="polite"></div><div class="sequence-options">${stage.symbols.map((symbol,i)=>`<button data-symbol="${i}">${escape(symbol)}</button>`).join('')}</div><p class="sequence-feedback" id="sequence-feedback" role="status"></p><details class="sequence-clue"><summary>查看现场线索</summary><p>${escape(stage.clue)}</p></details><div class="card-actions"><button class="secondary" id="sequence-undo">撤回一步</button><button class="primary" id="sequence-confirm">确认顺序 →</button></div>`,'expedition-puzzle',expedition.title);
 const refresh=()=>{
  $('#sequence-slots').innerHTML=stage.symbols.map((_,i)=>`<span class="${sequence[i]===undefined?'empty':''}"><small>${String(i+1).padStart(2,'0')}</small>${sequence[i]===undefined?'等待选择':escape(stage.symbols[sequence[i]])}</span>`).join('');
  $$('[data-symbol]').forEach(b=>b.disabled=sequence.includes(+b.dataset.symbol));$('#sequence-confirm').disabled=sequence.length!==stage.answer.length;$('#sequence-undo').disabled=!sequence.length;
 };
 $$('[data-symbol]').forEach(b=>b.onclick=()=>{sequence.push(+b.dataset.symbol);$('#sequence-feedback').textContent='';refresh();});
 $('#sequence-undo').onclick=()=>{sequence.pop();$('#sequence-feedback').textContent='';refresh();};
 $('#sequence-confirm').onclick=()=>{
  if(!stage.answer.every((n,i)=>n===sequence[i])){$('#sequence-feedback').textContent=stage.failure;return;}
  closeModal();finishExpeditionStage(expedition,stage,{sequence});toast(stage.success);
 };
 refresh();
}
function showDialogue(lines,done,role){dialogue={lines,index:0,done,role};heldKeys.clear();pathQueue=[];$('#dialogue').classList.remove('hidden');renderDialogue();}
function renderDialogue(){const [speaker,text]=dialogue.lines[dialogue.index];$('#speaker').textContent=speaker==='旅人'?game.name:speaker;$('#dialogue-text').textContent=text;const pc=$('#portrait-canvas'),cx=pc.getContext('2d');cx.clearRect(0,0,96,96);drawPerson(cx,0,0,96,{role:speaker==='阿汐'?'rival':speaker.includes('博士')?'scholar':speaker==='旅人'?'player':dialogue.role||'warden',time:frameTime});$('#dialogue-next').focus();sfx('talk');}
function nextDialogue(){if(!dialogue)return;dialogue.index++;if(dialogue.index>=dialogue.lines.length){const done=dialogue.done;dialogue=null;$('#dialogue').classList.add('hidden');canvas.focus();if(done)done();}else renderDialogue();}
$('#dialogue-next').onclick=nextDialogue;$('#dialogue').onclick=e=>{if(e.target.closest('button'))return;nextDialogue();};
function transition(place,region=game.region,depth=0,fromExit=false,sector=null){
 if(!game)return;const previous=game.place,previousSector=game.routeSector||0;game.place=place;game.region=region;game.dungeonFloor=place==='dungeon'?clamp(depth,0,3):0;
 if(place==='route')game.routeSector=sector??(previous==='dungeon'?2:0);else if(place==='town')game.routeSector=0;
 map=makeMap(region,place,game.dungeonFloor,game.routeSector);
 if(map.entry){const arrival=place==='route'?map.objects.find(o=>(o.action==='outdoor-exit'||o.action==='gate')&&o.to===(previous==='route'?previousSector:previous)):null;const point=arrival||(fromExit?map.exit:map.entry);game.x=point.x;game.y=point.y;}
 else{game.x=place==='route'?(previous==='dungeon'?33:6):18;game.y=place==='route'?16:19;}
 visualPlayer={x:game.x,y:game.y};heldKeys.clear();pathQueue=[];moveCooldown=.3;lastInteraction=null;$('#interact-prompt').classList.add('hidden');save();updateHUD();announceZone();
 if(place==='town'&&!game.flags['entered'+region]){game.flags['entered'+region]=true;(game.pendingScenes??=[]).push('intro'+region);save();playPendingScenes();}
}
function grant(loot){for(const [id,count] of Object.entries(loot))game.bag[id]=(game.bag[id]||0)+count;save();updateHUD();toast(Object.entries(loot).map(([id,n])=>`${ITEMS[id].name} × ${n}`).join('，'));sfx('get');}
function interact(){if(!game||fight||modalType)return;if(dialogue){nextDialogue();return;}const o=nearest(map,game);if(!o)return;const ch=CHAPTERS[game.region];
 switch(o.action){
  case 'exit':transition(o.to);break;
  case 'expedition':interactExpedition(o.expedition);break;
  case 'outdoor-exit':if(typeof o.to==='number')transition('route',game.region,0,false,o.to);else transition(o.to);break;
  case 'outdoor-lore':showDialogue([[o.label,o.text]]);break;
  case 'stairs':if(o.direction==='back'){if(game.dungeonFloor===0)transition('route');else transition('dungeon',game.region,game.dungeonFloor-1,true);}else transition('dungeon',game.region,game.dungeonFloor+1);break;
  case 'rune':{const result=turnRune(game,o,map.objects.filter(x=>x.action==='seal'));game=result.game;save();sfx('get');toast(`${o.label} → ${RUNE_SYMBOLS[result.value]}${result.opened.length?'。远处的封门打开了！':''}`);break;}
  case 'seal':showDialogue([['古老的封门',gateIsOpen(game,o)?'符柱已经回应彼此。前方的路向你敞开。':'三枚符印尚未同时点亮。附近的石碑，记着符柱应该呈现的模样。']]);break;
  case 'dungeon-lore':showDialogue([[o.label,o.text]]);break;
  case 'relic':openRelic(o.relic);break;
  case 'dungeon-trainer':{const team=dungeonTeam(game.region,map.depth||0,o,game.seed);showDialogue([[o.label,game.trainerWins?.[o.id]?'又见面了。要再切磋一次，试试新的搭配吗？':'在走到更高的地方之前，让我们用一场对战交换旅途的见闻。']],()=>startBattle(team,{kind:'trainer',name:o.label,trainer:o.id}));break;}
  case 'gate':if(fragmentCount()<3)showDialogue([['阿汐',`通往${ch.dungeon}的门还没有回应。我们需要找到全部 3 份碎片，现在有 ${fragmentCount()} 份。`]]);else transition('dungeon');break;
  case 'story':showDialogue(game.badges.includes(game.region)?[['旅人',ch.lore],['阿汐','下一次相遇的时候，我们又会带来怎样的故事呢？']]:game.region===0?[['洛珈博士','与潮灵相处的第一课，是学会等待。战斗时用「守势」恢复能量，不必每回合都进攻。'],['洛珈博士',ch.task],['洛珈博士','生命不足就回来找栀夏，她会免费照顾你的伙伴。留意头顶金色标记的居民。他们遇见的问题，与灯芯碎片有关。手记会替你记下下一站。']]:[[ch.warden,ch.problem],['阿汐',ch.task]]);break;
  case 'heal':case 'rest':healParty(game);save();updateHUD();sfx('heal');showDialogue([[o.action==='heal'?'栀夏':'营地旅人','辛苦了。把伙伴交给我，稍稍歇一会儿吧。'],['系统','全队生命、能量和异常状态已恢复。']]);break;
  case 'side-story':openSideStory(o.story);break;
  case 'campfire':healParty(game);save();updateHUD();openCamp();break;
  case 'trial':openTrial();break;
  case 'shop':openShop();break;
  case 'craft':openCraft();break;
  case 'travel':openMap();break;
  case 'quest':openQuest(o.quest);break;
  case 'resource':game.collected[o.id]=true;grant({[o.item]:1+Math.floor(random(game)*2)});break;
  case 'chest':game.collected[o.id]=true;grant(o.loot);break;
  case 'companion':showDialogue([['阿汐',game.badges.includes(game.region)?ch.lore:fragmentCount()===3?'准备好了吗？无论前面有什么，我们一起去见它。':'我以前以为，旅行就是一直向前走。现在发现，偶尔停下来听人说话，也会遇见很远的地方。'],['阿汐',game.party.length===1?'只有一个伙伴会有点辛苦。遇到野生潮灵时，先削弱它，再用星约石缔约吧。':'你看，大家越来越信任你了。我们已经不是刚离开港口时的样子了。']]);break;
  case 'trainer':{const team=outdoorTrainerTeam(game.region,o.trainer,game.seed);showDialogue([[o.label,game.trainerWins?.[o.id]?'记得我们上次的切磋吗？带着新的想法再来一场吧。':'在路上相遇，也是一种缘分。来一场认真的切磋吧！']],()=>startBattle(team,{kind:'trainer',name:o.label,trainer:o.id}));break;}
  case 'boss':if(fragmentCount()<3)showDialogue([[ch.warden,'灯印还没有被唤醒。先找回路上失落的三份记忆吧。']]);else showDialogue(game.badges.includes(game.region)?[[ch.warden,'又见面了。让我们看看，这段旅途让彼此成长了多少。']]:ch.before,()=>{const rematch=game.badges.includes(game.region);startBattle(wardenTeam(game.region,{rematch,seed:game.seed}),{kind:'boss',name:ch.warden,first:!rematch});});break;
 }
}

function openParty(){openModal('同行的伙伴',`<div class="party-story-link"><div><small>同行纪事</small><p>16 个家族，48 段只属于你们的路。</p></div><button class="secondary" id="party-bonds">看看伙伴的故事 →</button></div><p class="section-note">最多 6 只潮灵同行。领队会跟随你探索。驿站里的伙伴会耐心等你来接它们。</p><div class="grid">${game.party.map((m,i)=>`<div class="card">${monCanvas(m.species)}${typeTag(SPECIES[m.species].element)}<h3>${SPECIES[m.species].name} <small>Lv.${m.level}</small></h3>${hpHTML(m)}<p>${ITEMS[m.equip]?.name||'未佩戴护符'} · 默契 ${m.bond||0}</p><div class="card-actions"><button data-detail="${i}">详细资料</button><button data-lead="${i}" ${i===0?'disabled':''}>设为领队</button><button data-store="${i}" ${game.party.length===1?'disabled':''}>送往驿站</button></div></div>`).join('')}</div><h3 style="margin:24px 0 8px;font-family:var(--serif)">潮灵驿站 · ${game.reserve.length} 位伙伴</h3>${game.reserve.length?`<div class="grid">${game.reserve.map((m,i)=>`<div class="card">${monCanvas(m.species,90)}<h3>${SPECIES[m.species].name} Lv.${m.level}</h3><button class="text-button" data-reserve-detail="${i}">详细资料</button><button class="secondary" data-withdraw="${i}" ${game.party.length>=6?'disabled':''}>加入队伍</button></div>`).join('')}</div>`:'<p class="section-note">队伍满员后，新缔约的潮灵会来到这里。</p>'}`,'party');
 $('#party-bonds').onclick=()=>openBondIndex();$$('[data-reserve-detail]').forEach(b=>b.onclick=()=>openMon(game.reserve[+b.dataset.reserveDetail]));$$('[data-detail]').forEach(b=>b.onclick=()=>openMon(game.party[+b.dataset.detail]));$$('[data-lead]').forEach(b=>b.onclick=()=>{const m=game.party.splice(+b.dataset.lead,1)[0];game.party.unshift(m);save();updateHUD();openParty();});$$('[data-store]').forEach(b=>b.onclick=()=>{if(game.party.length<=1)return;game.reserve.push(game.party.splice(+b.dataset.store,1)[0]);save();updateHUD();openParty();});$$('[data-withdraw]').forEach(b=>b.onclick=()=>{if(game.party.length>=6)return;game.party.push(game.reserve.splice(+b.dataset.withdraw,1)[0]);save();updateHUD();openParty();});}
function hpHTML(m,showStatus=true){return `<div class="hp-bar"><span style="width:${m.hp/stats(m).hp*100}%;background:${m.hp/stats(m).hp<.25?'#d58d7e':'#89c8ac'}"></span></div><div class="hp-meta"><span>${showStatus?(m.hp<=0?'失去战斗能力':STATUS[m.status]||'状态良好'):'生命'}</span><span>${m.hp} / ${stats(m).hp} HP</span></div>`;}
function traitCard(m){const ability=abilityFor(m);return `<div class="trait-card"><span>${ability.icon}</span><div><small>家族特性</small><h3>${ability.name}</h3><p>${ability.desc}</p></div></div>`;}
function openTrait(m){openModal(SPECIES[m.species].name+' · '+abilityFor(m).name,traitCard(m)+`<p class="section-note">同一家族进化后会保留这项特性。对手也会运用自己的特性，选择合适的技能、入场时机与伙伴来应对。</p>`,'trait','每一种陪伴，都有自己的力量');}
function openMon(m){const s=SPECIES[m.species],v=stats(m);openModal(s.name,`<div style="display:flex;gap:25px;align-items:center;flex-wrap:wrap"><div>${monCanvas(m.species,190)}</div><div style="flex:1;min-width:200px">${typeTag(s.element)}<h3 style="margin:14px 0;font-family:var(--serif)">Lv.${m.level} · 第 ${s.stage} 阶形态</h3><p class="section-note">${s.lore}</p>${hpHTML(m)}<div class="stats-grid">${Object.entries(v).map(([k,n])=>`<span>${{hp:'生命',atk:'攻击',def:'防御',spd:'速度'}[k]}<b>${n}</b></span>`).join('')}</div></div></div><p class="section-note" style="margin-top:20px">成长 ${m.xp} / ${xpNeed(m)} · ${s.evolve?`到达 ${s.evolveAt} 级将进化为 ${SPECIES[s.evolve].name}`:'已经成长为最终形态'} · 默契 ${m.bond||0}</p>${traitCard(m)}${moveList(m).map(k=>`<div class="card-row"><div class="item-icon" style="color:${ELEMENTS[MOVES[k].element]?.color||'#ddd'}">✧</div><div class="grow"><h3>${MOVES[k].name} <small style="color:var(--gold)">能量 ${MOVES[k].cost}</small></h3><p>${moveDescription(m,k)} ${MOVES[k].power?'威力 '+MOVES[k].power:''}</p></div></div>`).join('')}<div class="card-actions"><button id="move-memory">技能记忆</button><button id="equip-mon">佩戴护符</button><button id="mon-bond-story">同行纪事</button><button id="back-party">返回队伍</button></div>`,'mon');$('#back-party').onclick=openParty;$('#move-memory').onclick=()=>openMoveBook(m.uid);$('#equip-mon').onclick=()=>openEquipment(m.uid);$('#mon-bond-story').onclick=()=>openBondFamily(s.family);}
function openBag(){openModal('旅行背包',`<div class="tab-row"><button id="bag-craft">调配与合成</button><span style="margin-left:auto;color:var(--gold);padding:8px">◈ ${game.gold} 星砂</span></div>${Object.entries(ITEMS).filter(([id])=>game.bag[id]>0).map(([id,item])=>`<div class="card-row"><div class="item-icon">${itemCanvas(id)}</div><div class="grow"><h3>${item.name}</h3><p>${item.desc}</p></div><span class="count">× ${game.bag[id]}</span>${item.heal||item.cleanse||item.revive?`<button class="secondary" data-use="${id}">使用</button>`:''}</div>`).join('')}`,'bag');$('#bag-craft').onclick=openCraft;$$('[data-use]').forEach(b=>b.onclick=()=>chooseItemTarget(b.dataset.use));}
function itemCanTarget(item,mon){return item.revive?mon.hp<=0:item.heal?mon.hp>0&&mon.hp<stats(mon).hp:item.cleanse?!!mon.status:false;}
function chooseItemTarget(id,inBattle=false){const party=inBattle?fight.party:game.party;openModal('使用'+ITEMS[id].name,`<p class="section-note">${ITEMS[id].desc}</p>${party.map((m,i)=>`<div class="card-row">${monCanvas(m.species,64)}<div class="grow"><h3>${SPECIES[m.species].name}</h3>${hpHTML(m)}</div><button class="secondary" data-target="${i}" ${itemCanTarget(ITEMS[id],m)?'':'disabled'}>选择</button></div>`).join('')}`,'target');$$('[data-target]').forEach(b=>b.onclick=()=>{const idx=+b.dataset.target;if(inBattle){closeModal();battleAction({type:'item',item:id,target:idx});return;}const m=game.party[idx],item=ITEMS[id];if(!game.bag[id])return toast('这件道具已经用完了。');if(item.revive){if(m.hp>0)return toast('伙伴还没有倒下，不需要使用。');m.hp=Math.ceil(stats(m).hp*.5);m.status=null;}else if(item.heal){if(m.hp===0)return toast('请先使用回声种唤醒伙伴。');if(m.hp===stats(m).hp)return toast('生命已经恢复满了。');m.hp=Math.min(stats(m).hp,m.hp+item.heal);}else if(item.cleanse){if(!m.status)return toast('伙伴没有异常状态。');m.status=null;}game.bag[id]--;save();updateHUD();sfx('heal');toast('使用成功。');openBag();});}
function supplyQuantity(count,label){return `<div class="supply-quantity"><span>${label}</span><div role="group" aria-label="${label}">${[1,5,10].map(n=>`<button data-supply-count="${n}" aria-pressed="${n===count}" class="${n===count?'active':''}">${n}</button>`).join('')}</div><small>选择本次${label}</small></div>`;}
function openCraft(batches=1){
 if(![1,5,10].includes(batches))batches=1;
 openModal('潮灵工坊',`<div class="supply-intro"><span class="supply-emblem">❧</span><div><small>把沿途的收获，变成下一段路的底气</small><h3>一草一晶，皆有回响</h3><p>每组配方会产出标注数量。素材不足时，可在原野采集或到杂货铺补充。</p></div></div>${supplyQuantity(batches,'合成组数')}<div class="supply-grid">${RECIPES.map(r=>{const q=craftQuote(game,r.id,batches);return `<article class="supply-card"><div class="supply-card-head"><span>${itemCanvas(r.id)}</span><div><small>每组 ${r.count} 份 · 最多可做 ${q.max} 组</small><h3>${ITEMS[r.id].name}</h3></div><b>× ${q.output}</b></div><p>${ITEMS[r.id].desc}</p><div class="recipe-materials"><small>素材 · 持有 / 本次需要</small>${q.materials.map(m=>`<span class="${m.owned<m.need?'missing':''}"><i class="ingredient-name">${itemCanvas(m.id,24)} ${ITEMS[m.id].name}</i><b>${m.owned} / ${m.need}</b></span>`).join('')}</div><div class="supply-card-foot"><small>现有成品 ${q.owned} 份</small><button class="secondary" data-recipe="${r.id}" ${q.ok?'':'disabled'} aria-label="合成 ${ITEMS[r.id].name} ${q.output} 份">${q.ok?`调配 ${q.output} 份 →`:q.reason}</button></div></article>`;}).join('')}</div>`,'craft','随身配方 · 旅途补给');
 $$('[data-supply-count]').forEach(b=>b.onclick=()=>openCraft(+b.dataset.supplyCount));
 $$('[data-recipe]').forEach(b=>b.onclick=()=>{try{const id=b.dataset.recipe,q=craftQuote(game,id,batches);game=craftItem(game,id,batches);save();updateHUD();sfx('get');openCraft(batches);toast(`调配完成：${ITEMS[id].name} × ${q.output}`);}catch(error){toast(error.message);}});
}
function openShop(category='all',count=1){
 if(category!=='all'&&!SHOP_GROUPS[category])category='all';
 const stock=category==='all'?SHOP_STOCK:SHOP_GROUPS[category].items;
 openModal('星约杂货',`<div class="supply-intro shop-intro"><canvas width="96" height="96" data-person="merchant" aria-label="店主松石"></canvas><div><small>松石的杂货铺</small><h3>为下一段旅途，备好行囊</h3><p>「药品、星约石，还有刚收来的月息草。出发前，再看看背包吧。」</p></div><strong class="supply-wallet">◈ ${game.gold}<small>可用星砂</small></strong></div><div class="supply-categories" role="group" aria-label="商品分类"><button data-shop-category="all" aria-pressed="${category==='all'}" class="${category==='all'?'active':''}">全部</button>${Object.entries(SHOP_GROUPS).map(([id,group])=>`<button data-shop-category="${id}" aria-pressed="${category===id}" class="${category===id?'active':''}">${group.icon} ${group.name}</button>`).join('')}</div>${supplyQuantity(count,'购买数量')}<div class="supply-grid">${stock.map(id=>{const item=ITEMS[id],q=purchaseQuote(game,id,count);return `<article class="supply-card"><div class="supply-card-head"><span>${itemCanvas(id)}</span><div><small>单份 ◈ ${item.price}</small><h3>${item.name}</h3></div><b>× ${count}</b></div><p>${item.desc}</p><div class="supply-card-foot"><div><strong>◈ ${q.total}</strong><small>总价 · 已有 ${q.owned} 份</small></div><button class="secondary" data-buy="${id}" ${q.ok?'':'disabled'} aria-label="购买 ${item.name} ${count} 份，总价 ${q.total} 星砂">${q.ok?'收入行囊 →':q.reason}</button></div></article>`;}).join('')}</div>`,'shop','灯穗商会 · 群岛通行');
 $$('[data-shop-category]').forEach(b=>b.onclick=()=>openShop(b.dataset.shopCategory,count));
 $$('[data-supply-count]').forEach(b=>b.onclick=()=>openShop(category,+b.dataset.supplyCount));
 $$('[data-buy]').forEach(b=>b.onclick=()=>{try{const id=b.dataset.buy;game=purchaseItem(game,id,count);save();updateHUD();sfx('get');openShop(category,count);toast(`已装入行囊：${ITEMS[id].name} × ${count}`);}catch(error){toast(error.message);}});
}

function openLocalChart(){
 if(!game||fight||dialogue)return;
 const markers=chartMarkers(map,game),field=navigationField(map,game);let filter='all',selected=null,route=null;
 openModal((map.floorName||map.chapter[map.place])+' · 随身航图',chartMarkup(map,game,markers),'local-chart','看清方向，慢慢出发');
 const draw=()=>drawLocalChart($('#local-chart').getContext('2d'),map,game,markers,{selected,path:route,filter,walkable:field.walkable});draw();chartObserver=new ResizeObserver(draw);chartObserver.observe($('#local-chart'));
 $$('[data-chart-target]').forEach(button=>button.onclick=()=>{
  selected=button.dataset.chartTarget;const marker=markers.find(m=>m.id===selected);route=pathToObject(field,marker);
  $$('[data-chart-target]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  $('#chart-selected').innerHTML=selectedChartMarkup(marker,route);draw();
  $('#chart-go').onclick=()=>{if(route===null)return;const steps=route.map(p=>[...p]);closeModal();pathQueue=steps;canvas.focus();toast(steps.length?'正前往：'+marker.label+'。方向键可停止寻路。':'已经在附近，按 E / 互动继续。');};
 });
 $$('[data-chart-filter]').forEach(button=>button.onclick=()=>{filter=button.dataset.chartFilter;$$('[data-chart-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});$$('[data-chart-target]').forEach(b=>b.hidden=filter!=='all'&&b.dataset.chartGroup!==filter);draw();});
 $('#chart-islands').onclick=openMap;$('#chart-close').onclick=closeModal;
}
function openMap(){openModal('群岛航图',`<button class="region-map-link" id="open-local-chart"><span>⌖</span><div><strong>当前位置 · 随身航图</strong><small>查看附近人物、补给与出口，选择步行路线</small></div><b>→</b></button><button class="region-map-link" id="open-region-map"><span>⌘</span><div><strong>${CHAPTERS[game.region].island} · 地区航图</strong><small>查看三个户外分区、当前目标与出口</small></div><b>→</b></button><p class="section-note">点亮一座岛的星灯，即可沿着罗盘指引前往下一座岛。已抵达的群岛可随时自由往返。</p><div class="map-grid">${CHAPTERS.map((c,i)=>{const unlocked=i===0||game.badges.includes(i-1);return `<div class="island-card ${!unlocked?'locked':''}"><span class="island-number">0${i+1}</span><h3>${c.island} ${game.badges.includes(i)?'✧':''}</h3><p>${c.name}<br>野生潮灵 Lv.${c.level}–${c.level+3}</p><button class="secondary" data-travel="${i}" ${!unlocked?'disabled':''}>${!unlocked?'航线尚未点亮':i===game.region?'返回本岛港口':'启程前往'}</button></div>`;}).join('')}</div>`,'map','沿着星灯，去往更远的地方');$('#open-local-chart').onclick=openLocalChart;$('#open-region-map').onclick=()=>openAreaMap();$$('[data-travel]').forEach(b=>b.onclick=()=>{const region=+b.dataset.travel;if(region>0&&!game.badges.includes(region-1))return;closeModal();transition('town',region);});}
function openQuest(id){const q=SIDEQUESTS.find(q=>q.id===id);const state=game.quest[id],ready=questReady(game,q);openModal(q.name,`<span class="eyebrow">${q.giver} · ${CHAPTERS[q.region].island}</span><p class="section-note" style="margin-top:18px">“${q.text}”</p><div class="quest-card"><h3>${q.kind==='deliver'?`交付 ${ITEMS[q.item].name} × ${q.need}`:q.kind==='capture'?`缔约 ${SPECIES[q.species].name}`:`在本岛赢得 ${q.need} 场战斗`}</h3><p>${q.kind==='deliver'?`持有 ${game.bag[q.item]||0}`:q.kind==='capture'?ready?'已经认识这位伙伴':'尚未缔约':`已完成 ${game.wins[q.region]||0} / ${q.need}`}</p><small>报酬：${q.reward} 星砂 · 辉光星约石 × 1</small></div><button class="primary" id="quest-button" ${state==='done'?'disabled':''}>${state==='done'?'委托已完成':!state?'接受委托':ready?'交付并领取报酬':'继续寻找'}</button>`,'quest');$('#quest-button').onclick=()=>{if(!state){game.quest[id]='active';save();openQuest(id);return;}if(!ready){closeModal();return;}if(state==='done')return;if(q.kind==='deliver')game.bag[q.item]-=q.need;game.quest[id]='done';game.gold+=q.reward;grant({greatorb:1});showDialogue([[q.giver,'谢谢你。不是每一件小事都会写进传说，但它们真的改变了我的今天。']]);closeModal();};}
function openJournal(){
 const ch=CHAPTERS[game.region],quests=SIDEQUESTS.filter(q=>q.region===game.region||game.quest[q.id]);
 openModal('旅途手记',`<div class="tab-row"><button id="open-memories">路上拾起的故事 · ${Object.keys(game.stories||{}).length}</button><button id="open-letters">群岛回信 · ${restoredLetters(game).length} / 8</button></div><div class="journal-chapter"><span class="eyebrow">第 ${game.region+1} 章 · ${escape(ch.island)}</span><h3>${escape(ch.name)}</h3><p>${escape(ch.problem)}</p><span class="journal-seal">${game.badges.includes(game.region)?'✧ 星灯已经点亮':fragmentCount()+' / 3 份记忆'}</span></div><div class="journal-heading"><h3>这座岛的三份记忆</h3><small>与人相遇，让星灯重新亮起</small></div><div class="expedition-grid">${EXPEDITIONS.filter(e=>e.region===game.region).map(expeditionCard).join('')}</div><div class="journal-heading"><h3>居民委托</h3><small>旅途中的小小帮助</small></div>${quests.map(q=>`<button class="quest-card" style="display:block;width:100%;text-align:left" data-openquest="${q.id}"><small>${CHAPTERS[q.region].island} · ${game.quest[q.id]==='done'?'已完成':game.quest[q.id]?'进行中':'可接受'}</small><h3>${q.name}</h3><p>${q.text}</p></button>`).join('')}<div class="journal-heading"><h3>已经点亮的灯</h3></div>${game.badges.map(i=>`<div class="quest-card"><h3>✧ ${CHAPTERS[i].reward}</h3><p>${CHAPTERS[i].lore}</p></div>`).join('')||'<p class="section-note">你的第一盏灯，正在等你。</p>'}`,'journal','每一次停留，都有回声');
 $$('[data-openquest]').forEach(b=>b.onclick=()=>openQuest(b.dataset.openquest));$('#open-memories').onclick=openMemories;$('#open-letters').onclick=openLetters;bindExpeditionCards();
}
function openDex(element='all'){const ids=Object.keys(SPECIES).filter(id=>element==='all'||SPECIES[id].element===element);openModal('潮灵图鉴',`<p class="section-note">已相遇 ${new Set([...game.seen,...game.caught]).size} / ${Object.keys(SPECIES).length} · 已缔约 ${game.caught.length}。每一个小小的生命，都有自己的故事。</p><div class="tab-row"><button data-element="all" class="${element==='all'?'active':''}">全部</button>${Object.keys(ELEMENTS).map(e=>`<button data-element="${e}" class="${element===e?'active':''}">${ELEMENTS[e].name}</button>`).join('')}</div><div class="dex-grid">${ids.map(id=>{const known=game.caught.includes(id)||game.seen.includes(id);return `<button class="dex-cell ${known?'':'unknown'}" data-dex="${id}"><small>No.${String(Object.keys(SPECIES).indexOf(id)+1).padStart(3,'0')} ${game.caught.includes(id)?'✦':''}</small>${monCanvas(id,100)}<p>${known?SPECIES[id].name:'尚未相遇'}</p></button>`;}).join('')}</div>`,'dex');$$('[data-element]').forEach(b=>b.onclick=()=>openDex(b.dataset.element));$$('[data-dex]').forEach(b=>b.onclick=()=>{const s=SPECIES[b.dataset.dex];if(!game.caught.includes(s.id)&&!game.seen.includes(s.id))return toast('继续探索，未来也许会遇见它。');const locations=CHAPTERS.filter(c=>c.wild.some(id=>SPECIES[id].family===s.family)).map(c=>c.route).join('、');openModal(s.name,`${monCanvas(s.id,210)}<div style="text-align:center">${typeTag(s.element)}<p class="section-note" style="margin:20px">${s.lore}</p>${traitCard({species:s.id})}<p class="section-note">栖息地：${locations||'需要通过进化认识它'}<br>${s.stage>1?'此形态主要由伙伴成长进化而来。':''}</p></div>`,'dex-entry');});}

function openSideStory(id){
 const story=SIDE_STORIES.find(s=>s.id===id);if(!story)return;
 game.stories??={};game.flags['met-'+id]=true;
 if(game.stories[id]!==undefined){const choice=story.choices[game.stories[id]];showDialogue([...story.epilogue,['旅途手记',choice.memory]]);return;}
 showDialogue(story.opening,()=>{
  openModal(story.title,`<p class="section-note">${escape(story.hook)}</p><div class="grid" style="grid-template-columns:1fr 1fr">${story.choices.map((choice,i)=>`<button class="card starter-card" data-story-choice="${i}"><span class="eyebrow">${i===0?'一种回应':'另一种回应'}</span><h3>${escape(choice.label)}</h3><p>用自己的方式回应这段相遇。</p></button>`).join('')}</div>`,'story-choice',story.giver);
  $$('[data-story-choice]').forEach(button=>button.onclick=()=>{
   if(game.stories[id]!==undefined)return;
   const index=+button.dataset.storyChoice,result=completeStory(game,id,index),choice=result.choice;game=result.game;
   closeModal();save();updateHUD();showDialogue([...choice.reply,...story.epilogue,['旅途手记',choice.memory]],()=>{sfx('get');toast(`相遇已记入手记。获得 ${choice.reward.gold} 星砂与旅途补给。`);});
  });
 });
}
function openMemories(){const completed=game.stories||{};openModal('路上拾起的故事',`<p class="section-note">已留下 ${Object.keys(completed).length} / ${SIDE_STORIES.length} 段回忆。有些问题没有标准答案，但每一次认真回应都会留下痕迹。</p>${SIDE_STORIES.filter(s=>s.region<=game.region||game.badges.includes(s.region)).map(s=>{const choice=s.choices[completed[s.id]];return `<div class="quest-card"><small>${CHAPTERS[s.region].island} · ${CHAPTERS[s.region][s.place]} · ${choice?'已完成':'等待相遇'}</small><h3>${s.title}</h3><p>${choice?escape(choice.memory):escape(s.hook)}</p><p>${s.giver}</p>${choice?`<button class="text-button" data-reread="${s.id}">重读这段回忆 →</button>`:''}</div>`;}).join('')}`,'memories','人与人之间，也会亮起一盏灯');$$('[data-reread]').forEach(b=>b.onclick=()=>{closeModal();openSideStory(b.dataset.reread);});}
function openTrial(){if(!game.ending){showDialogue([['遥远的声音','当八盏星灯都获得回应时，群星将为你开放新的航路。']]);return;}
 const floor=(game.trial||0)+1,level=Math.min(65,52+Math.floor(floor/2));openModal('星海试炼',`<div class="results-summary"><div class="big-star">✦</div><h3>第 ${floor} 阶 · 未知的海</h3><p>潮灵等级 ${level}–${Math.min(65,level+2)}。<br>连续挑战不同属性的队伍，检验一路积累的默契。<br>当前纪录：${game.trial||0} 阶。胜利后可自由休息，再来继续。</p><button class="primary" id="begin-trial">回应群星的挑战 →</button></div>`,'trial');$('#begin-trial').onclick=()=>{const families=Object.values(SPECIES).filter(s=>s.stage===3),team=[];for(let i=0;i<Math.min(6,3+Math.floor(floor/4));i++){const s=families[(floor*3+i*5)%families.length];team.push(createMon(s.id,Math.min(65,level+i%3),game.seed+i));}closeModal();startBattle(team,{kind:'trial',name:`星海试炼 · 第 ${floor} 阶`,floor});};
}

function enterBattle(battle){
 fight=battle;pendingBattle=null;battleEffect=null;battleEvents=[];battleMenu='root';
 updateControlHints('battle');
 $('#battle-screen').classList.remove('animating');$('#battle-actions').removeAttribute('aria-busy');heldKeys.clear();pathQueue=[];
 $('#world-ui').classList.add('hidden');$('#mobile-controls').classList.add('hidden');$('#battle-screen').classList.remove('hidden');$('#game-nav').classList.add('hidden');
 renderBattle();
}
function startBattle(enemies,context){
 if(!game.party.some(m=>m.hp>0)){healParty(game);save();updateHUD();return toast('伙伴们需要休息，阿汐已经为全队恢复了状态。');}
 save();const battle=makeBattle(game,enemies,context);
 for(const m of enemies)if(!game.seen.includes(m.species))game.seen.push(m.species);
 enterBattle(battle);save();sfx('battle');
}
function renderBattleStatus(p,e){
 const statusHTML=m=>`<div class="status-title"><strong>${SPECIES[m.species].name}</strong><small>Lv.${m.level}</small></div>${typeTag(SPECIES[m.species].element)}<button class="trait-chip" data-trait="${m.uid}" aria-label="查看${SPECIES[m.species].name}的${abilityFor(m).name}特性">${abilityFor(m).icon} ${abilityFor(m).name}</button>${m.status?`<span class="status-tag">${STATUS[m.status]}</span>`:''}${hpHTML(m,false)}<div class="energy-dots" title="能量 ${m.energy}/5">${'◆'.repeat(m.energy)}<span style="opacity:.2">${'◇'.repeat(5-m.energy)}</span>${m.shield?'<small class="battle-buff">◇ 护盾</small>':''}${m.focus?'<small class="battle-buff focused">✧ 蓄势</small>':''}</div>`;
 for(const [id,m] of [['enemy-status',e],['player-status',p]]){const box=$('#'+id);if(box.dataset.uid!==m.uid||!pendingBattle){box.innerHTML=statusHTML(m);box.dataset.uid=m.uid;}else{const ratio=m.hp/stats(m).hp,bar=box.querySelector('.hp-bar span');bar.style.width=ratio*100+'%';bar.style.background=ratio<.25?'#d58d7e':'#89c8ac';box.querySelector('.hp-meta span:last-child').textContent=m.hp+' / '+stats(m).hp+' HP';}}$$('[data-trait]').forEach(button=>button.onclick=()=>{if(!pendingBattle)openTrait(button.dataset.trait===p.uid?p:e);});
}
function renderBattle(){if(!fight)return;const scene=battleEffect?.scene||fight,p=scene.party[scene.activeP],e=scene.enemies[scene.activeE];$('#battle-location').textContent=fight.context.name||CHAPTERS[game.region][game.place]+' · 野生相遇';$('#battle-weather').textContent=WEATHER[fight.weather].icon+' '+WEATHER[fight.weather].name;$('#turn-label').textContent=fight.outcome?'这场相遇的结尾':`第 ${fight.turn+1} 回合 · 你们的选择`;
 const intent=describeEnemyPlan(fight.enemyPlan,fight),intentButton=$('#enemy-intent');intentButton.classList.toggle('hidden',!intent||!!fight.outcome);intentButton.disabled=!!pendingBattle;
 if(intent){intentButton.innerHTML=`<span class="intent-icon">${intent.icon}</span><span>对方意图</span><strong>${intent.name}</strong><small>${intent.detail}</small>`;intentButton.style.setProperty('--intent-color',ELEMENTS[intent.element]?.color||'#d8ccab');intentButton.onclick=()=>{if(pendingBattle)return;const tactic=fight.context.kind==='boss'?WARDEN_TACTICS[game.region]:null;openModal(intent.name,`<div class="intent-detail"><span>${intent.icon}</span><h3>${intent.detail}</h3><p>${tactic?`守灯人战术 · ${tactic.name}<br>${tactic.desc}`:'对手已经准备好这次行动。根据意图选择守势、换人或进攻。'}</p></div><p class="section-note">守势和轮换会先于普通攻击进行。对手不会在你选择指令后改变这次意图。</p>`,'intent','观察，也是一种力量');};}
 renderBattleStatus(p,e);
 $('#battle-speed').textContent=game.battleSpeed===2?'2×':'1×';$('#battle-speed').setAttribute('aria-label',`战斗演出速度 ${game.battleSpeed===2?2:1} 倍，点击切换`);$('#battle-speed').disabled=!!pendingBattle;$('#battle-record').disabled=!!pendingBattle;$('#battle-move-help').disabled=!!pendingBattle||!!fight.outcome;
 $('#battle-log').innerHTML=fight.log.map(l=>`<p>${escape(l)}</p>`).join('');$('#battle-log').scrollTop=$('#battle-log').scrollHeight;
 let html='';
 if(fight.outcome){html=`<button class="attack-button" id="battle-finish" style="grid-column:1/-1;text-align:center">${fight.outcome==='win'?'战斗胜利 · 继续旅程':fight.outcome==='capture'?'新的约定 · 欢迎伙伴':fight.outcome==='lose'?'返回诊所 · 重新出发':'平安离开 · 继续探索'} →</button>`;}
 else if(battleMenu==='moves'){html=moveList(p).map((key,i)=>{const m=MOVES[key],target=fight.enemyPlan?.action.type==='switch'?fight.enemies[fight.enemyPlan.action.index]:e,eff=m.power?effectiveness(m.element,SPECIES[target.species].element):1;return `<button data-move="${key}" ${m.cost>p.energy?'disabled':''} style="border-left:3px solid ${ELEMENTS[m.element]?.color||'#c5cbbb'}">${i+1}. ${m.name}<small>◆ ${m.cost}　${m.power?'威力 '+m.power:'辅助'}${eff>1?' · 克制':eff<1?' · 抵抗':''}</small><span class="battle-move-desc">${moveDescription(p,key)}</span></button>`;}).join('')+'<button class="battle-back" data-battle-menu="root">返回指令</button>';}
 else if(battleMenu==='bag'){html=['potion','superpotion','revive','cure'].filter(id=>fight.inventory[id]>0).map(id=>`<button data-battle-item="${id}">${ITEMS[id].name}<small>持有 ${fight.inventory[id]} · ${ITEMS[id].desc}</small></button>`).join('')+'<button class="battle-back" data-battle-menu="root">返回指令</button>';}
 else if(battleMenu==='capture'){html=['orb','greatorb'].map(id=>`<button data-capture="${id}" ${!fight.inventory[id]?'disabled':''}>${ITEMS[id].name}<small>持有 ${fight.inventory[id]||0} · 生命越低越易缔约</small></button>`).join('')+'<button class="battle-back" data-battle-menu="root">返回指令</button>';}
 else if(battleMenu==='switch'){html=fight.party.map((m,i)=>`<button data-switch="${i}" ${i===fight.activeP||m.hp===0?'disabled':''}>${SPECIES[m.species].name}<small>Lv.${m.level}<br>${m.hp}/${stats(m).hp} HP</small></button>`).join('')+'<button class="battle-back" data-battle-menu="root">返回指令</button>';}
 else{html='<button class="attack-button" data-battle-menu="moves">1. 技能 <small style="color:#39594f">选择潮灵的行动</small></button><button data-action="guard">2. 守势 <small>能量 +2 · 受到伤害降低</small></button><button data-battle-menu="switch">3. 换人 <small>让其他伙伴加入战斗</small></button><button data-battle-menu="bag">4. 道具 <small>恢复、唤醒与净化</small></button>'+(fight.context.kind==='wild'?'<button data-battle-menu="capture">缔约 <small>让新伙伴认识你</small></button><button data-action="run">离开 <small>尝试退出野生战斗</small></button>':'');}
 $('#battle-actions').dataset.menu=battleMenu;$('#battle-actions').innerHTML=html;$$('[data-battle-menu]').forEach(b=>b.onclick=()=>{if(!pendingBattle){battleMenu=b.dataset.battleMenu;renderBattle();}});$$('[data-move]').forEach(b=>b.onclick=()=>battleAction({type:'move',move:b.dataset.move}));$$('[data-action]').forEach(b=>b.onclick=()=>battleAction({type:b.dataset.action}));$$('[data-capture]').forEach(b=>b.onclick=()=>battleAction({type:'capture',item:b.dataset.capture}));$$('[data-switch]').forEach(b=>b.onclick=()=>battleAction({type:'switch',index:+b.dataset.switch}));$$('[data-battle-item]').forEach(b=>b.onclick=()=>chooseItemTarget(b.dataset.battleItem,true));if($('#battle-finish'))$('#battle-finish').onclick=finishBattle;
}
let battleEvents=[];
function updateBattlePlayback(){
 const sample=playbackFrame(battleEffect,frameTime);if(!sample||sample.phase===battleEffect.phase)return;
 $('#turn-label').textContent=`第 ${fight.turn+1} 回合 · 行动展开`;
 battleEffect.phase=sample.phase;battleEffect.scene=sample.scene;
 renderBattleStatus(sample.scene.party[sample.scene.activeP],sample.scene.enemies[sample.scene.activeE]);
 const ribbon=$('#enemy-intent');ribbon.classList.remove('hidden');ribbon.innerHTML=`<span class="intent-icon">✧</span><span>行动 ${sample.index+1} / ${battleEffect.events.length}</span><strong>${escape(sample.caption)}</strong>`;
 ribbon.style.setProperty('--intent-color','#ead5a0');
}
$('#battle-speed').onclick=()=>{if(pendingBattle)return;game.battleSpeed=game.battleSpeed===2?1:2;save();renderBattle();};
$('#battle-move-help').onclick=()=>{
 if(!fight||pendingBattle||fight.outcome)return;const mon=fight.party[fight.activeP];
 openModal('招式说明',`<p class="section-note">${SPECIES[mon.species].name} · 当前能量 ${mon.energy} / 5</p>${moveList(mon).map(id=>{const move=MOVES[id];return `<div class="card-row"><div class="item-icon" style="color:${ELEMENTS[move.element]?.color||'#e6d1a7'}">✧</div><div class="grow"><h3>${move.name} <small>◆ ${move.cost}${move.power?' · 威力 '+move.power:' · 辅助'}</small></h3><p>${moveDescription(mon,id)}</p></div></div>`;}).join('')}<p class="section-note" style="margin:18px 0">先看对手的意图，再决定行动。属性、天气、护盾、蓄势与家族特性都会影响伤害。</p><button class="secondary" id="moves-help-return">返回战斗</button>`,'battle-moves','熟悉伙伴，才有默契');
 $('#moves-help-return').onclick=closeModal;
};
$('#battle-record').onclick=()=>{
 if(!fight||pendingBattle)return;
 const lines=fight.history.length?[...fight.history,...(fight.outcome?battleEvents:[])]:fight.log;
 openModal('战况回顾',`<p class="section-note">${escape(fight.context.name||'野外相遇')} · 已完成 ${fight.turn} 回合 · 保留最近 80 条行动记录</p><ol class="battle-record-list">${lines.slice(-80).map(line=>`<li>${escape(line)}</li>`).join('')}</ol><button class="secondary" id="record-return">返回战斗</button>`,'battle-record','读懂每一次交锋');
 $('#record-return').onclick=closeModal;
};
function commitBattleTurn(){
 if(!pendingBattle)return;fight=pendingBattle;pendingBattle=null;battleEffect=null;$('#battle-screen').classList.remove('animating');$('#battle-actions').removeAttribute('aria-busy');battleMenu='root';
 if(fight.outcome){const result=settleBattle(game,fight);game=result.game;fight.party=clone(game.party);battleEvents=result.events;fight.log=[...fight.log,...battleEvents];save();if(['win','capture'].includes(fight.outcome))sfx('win');}else save();renderBattle();
}
function battleAction(action){
 if(pendingBattle)return;const next=takeTurn(fight,action);if(next.error)return toast(next.error);
 pendingBattle=next;const events=next.events||[];battleEffect=createBattlePlayback(fight,next,game.battleSpeed,frameTime);
 renderBattle();
 $('#battle-screen').classList.add('animating');$('#battle-actions').setAttribute('aria-busy','true');for(const button of $$('#battle-actions button'))button.disabled=true;sfx('hit');
 if(game.reduceMotion||!events.length)commitBattleTurn();else updateBattlePlayback();
}

function finishBattle(){if(!fight?.outcome)return;fight=null;updateControlHints();visualPlayer={x:game.x,y:game.y};map=makeMap(game.region,game.place,game.dungeonFloor||0,game.routeSector||0);$('#battle-screen').classList.add('hidden');$('#world-ui').classList.remove('hidden');$('#game-nav').classList.remove('hidden');$('#mobile-controls').classList.remove('hidden');updateHUD();save();moveCooldown=.7;lastStepCount=game.steps;canvas.focus();
 if(game.pendingScenes?.length)playPendingScenes();
 else if(battleEvents.length)toast(battleEvents[battleEvents.length-1]);}
function drawBattle(t){const displayed=battleEffect?{...fight,...battleEffect.scene}:fight;drawBattleScene(ctx,view.w,view.h,game,displayed,t,game.reduceMotion?null:battleEffect,battlePanelHeight);}

function openSettings(){if(pendingBattle)return;openModal('旅途设置',game?`<div class="settings-row"><div><h3>保存进度</h3><p>探索与每回合结束时自动存档，可以恢复尚未结束的战斗。</p></div><button class="secondary" id="manual-save">立即保存</button></div><div class="settings-row"><div><h3>存档文件</h3><p>换设备或清理浏览器前，先导出你的旅程。</p></div><div class="card-actions"><button id="export-save">导出存档</button><button id="import-save">导入存档</button></div></div><div class="settings-row"><div><h3>旅途旋律</h3><p>轻柔的原创合成旋律与战斗音效。</p></div><button class="secondary" id="toggle-sound">${game.sound?'已开启':'已关闭'}</button></div><div class="settings-row"><div><h3>画面质量</h3><p id="live-performance">正在测量实际帧率</p></div><select id="quality-select" class="quality-select"><option value="high" ${!game.quality||game.quality==='high'?'selected':''}>精细 · Retina</option><option value="balanced" ${game.quality==='balanced'?'selected':''}>均衡</option><option value="performance" ${game.quality==='performance'?'selected':''}>流畅优先</option></select></div><div class="settings-row"><div><h3>减少动态效果</h3><p>减弱飘动与角色动画。</p></div><button class="secondary" id="toggle-motion">${game.reduceMotion?'已开启':'已关闭'}</button></div><div class="settings-row"><div><h3>旅程记录</h3><p>游戏时间 ${Math.floor(game.playtime/3600)} 小时 ${Math.floor(game.playtime/60)%60} 分钟 · 步数 ${game.steps} · 版本 ${VERSION}</p></div></div><div class="card-actions"><button id="return-title">保存并返回标题</button></div>`:`<p class="section-note">开始旅程后，这里可以保存进度、导出存档和调整声音。</p><button class="secondary" id="settings-import">导入存档</button>`,'settings');if(!game){$('#settings-import').onclick=()=>$('#save-file').click();return;}$('#quality-select').onchange=e=>{game.quality=e.target.value;resize();metrics.reset();save();};$('#manual-save').onclick=()=>save(true);$('#export-save').onclick=()=>downloadSave();$('#import-save').onclick=()=>$('#save-file').click();$('#toggle-sound').onclick=()=>{toggleSound();openSettings();};$('#toggle-motion').onclick=()=>{game.reduceMotion=!game.reduceMotion;save();openSettings();};$('#return-title').onclick=()=>{save();savedText=saveEnvelope(game);closeModal();stopMusic();game=null;fight=null;dialogue=null;updateControlHints('title');$('#title-screen').classList.remove('hidden');$('#continue-button').classList.remove('hidden');for(const id of ['world-ui','game-nav','battle-screen','dialogue','mobile-controls'])$('#'+id).classList.add('hidden');};}
function updateControlHints(mode='world'){$('#footer-hint').innerHTML=mode==='battle'?'<kbd>1–4</kbd> 选择指令 <kbd>Esc</kbd> 返回指令 · 回合结束自动保存':mode==='title'?'原创潮灵冒险 · 支持本机存档与导出':'<kbd>WASD</kbd> 移动 <kbd>E</kbd> 互动 <kbd>J</kbd> 手记 <kbd>Shift</kbd> 奔跑';canvas.setAttribute('aria-label',mode==='battle'?'战斗场景：使用 1 至 4 选择指令，回合结束自动保存':'游戏地图：使用方向键或 WASD 移动，E 或空格互动');}
function openHelp(){if(pendingBattle)return;openModal('给第一次启程的你',`<div class="help-grid"><div><b>探索</b>WASD / 方向键移动，Shift 奔跑。点击地图也会自动寻路。K / 随身航图显示当前区域的地点；选择目标后可预览步行路线，方向键可停止。抵达后仍需主动互动。靠近人物或发光物体，按 E / 空格互动。</div><div><b>战斗</b>每只潮灵有 5 点能量。技能消耗能量，跃击回复 1 点。守势回复 2 点，并暂时降低伤害。高等级潮灵可在队伍的技能记忆中重新携带跃击。灯花兔家族使用跃击回复 2 点能量。</div><div><b>演出与回顾</b>战斗顶部的 1× / 2× 可切换演出速度。血条按每次命中、恢复与持续伤害变化；战况回顾可重读最近 80 条记录。减少动态效果会直接显示回合结果。</div><div><b>观察意图</b>对方在你选择前已经决定行动，预告不会因你的指令改变。点击预告查看战术说明；对方守势或轮换时可以恢复、蓄势或调整队伍。</div><div><b>技能搭配</b>队伍 → 详细资料 → 技能记忆，可以从已学会的技能中选择四招并调整顺序。手动搭配会保留选择，恢复自动搭配则随升级更新。只能在对战结束后调整。</div><div><b>潮灵特性</b>16 个家族各有一种特性，进化后仍保留。点击战斗状态栏上的特性名，或在队伍、图鉴中查看。护盾减伤，蓄势增强下一次攻击。</div><div><b>缔约</b>野外战斗中先削弱对手，再选择缔约。状态异常会提升成功率。队伍最多 6 只，其余进入驿站。</div><div><b>同行纪事</b>每场胜利让同行队伍的默契增加 1。在队伍资料或港口营火查看伙伴故事。默契达到 8、24、48 并取得相应灯印后，可读三段分支故事，收下不同的纪念护符。进化与驿站不会丢失这些回忆。</div><div><b>成长</b>胜利后全队获得经验，每位参战伙伴都获得完整份额。等级较低的伙伴成长更快，挑战较弱的对手收获较少。16、32 级进化，9、18、27 级习得新技能。</div><div><b>探索目标</b>每座岛有三段地区冒险。交谈、调查、解谜与对战后找回记忆碎片。手记可以追踪下一站，并打开地区航图查看出口和目标。收齐三份后进入遗迹挑战守灯人，点亮星灯，开放下一条航线。</div><div><b>休息与存档</b>港口诊所免费治疗。移动和战斗后会自动保存。设置中可导出 JSON 存档，防止浏览器清理。</div></div><h3 style="margin:24px 0 12px;font-family:var(--serif)">属性克制 · 攻击获得 1.6 倍效果</h3><div class="help-grid">${Object.entries(ELEMENTS).map(([id,e])=>`<div><b style="color:${e.color}">${e.name}属性</b>克制 ${e.strong.map(x=>ELEMENTS[x].name).join('、')}${e.weak.length?'<br>攻击 '+e.weak.map(x=>ELEMENTS[x].name).join('、')+' 时效果减弱':' · 相互克制'}</div>`).join('')}</div><p class="section-note" style="margin-top:20px">天气会增强对应属性。灼伤降低攻击并持续损伤；中毒持续损伤；麻痹与缠绕降低速度；入眠会短暂无法行动。换人也会消耗一个回合。</p>`,'help');}
$('#local-chart-shortcut').onclick=openLocalChart;$('#settings-button').onclick=openSettings;$('#help-button').onclick=openHelp;$('#battle-help').onclick=openHelp;$('#journal-shortcut').onclick=()=>game&&openJournal();$('#home-mark').onclick=e=>{e.preventDefault();openSettings();};
const menus={party:openParty,bag:openBag,map:openMap,journal:openJournal,dex:openDex};$$('[data-menu]').forEach(b=>b.onclick=()=>{if(game&&!fight&&!dialogue)menus[b.dataset.menu]();});

function startMusic(){if(!game?.sound||document.hidden)return;try{soundContext??=new(window.AudioContext||window.webkitAudioContext)();soundContext.resume();if(musicTimer)return;const notes=[60,67,72,76,74,67,64,69,72,79,76,67,62,69,74,77];musicTimer=setInterval(()=>{if(!game?.sound)return;const n=notes[musicStep++%notes.length]-(fight?12:0);tone(n,.45,.022,'sine');if(musicStep%4===1)tone(n-12,1.65,.012,'triangle');},fight?340:540);}catch{}}
function stopMusic(){if(musicTimer)clearInterval(musicTimer);musicTimer=null;}
function tone(midi,duration=.1,volume=.03,type='sine'){if(!soundContext||!game?.sound)return;const o=soundContext.createOscillator(),gain=soundContext.createGain(),now=soundContext.currentTime;o.type=type;o.frequency.value=440*2**((midi-69)/12);gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.015);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);o.connect(gain);gain.connect(soundContext.destination);o.start(now);o.stop(now+duration+.03);}
function sfx(kind){const sequence={talk:[76],get:[72,79,84],heal:[60,67,72,79],hit:[43,40],win:[67,72,76,79,84],battle:[48,55,60]}[kind]||[70];sequence.forEach((n,i)=>setTimeout(()=>tone(n,kind==='talk'?.06:.18,kind==='talk'?.015:.04,'triangle'),i*65));}
function toggleSound(){if(!game)return toast('开始旅程后可以开启音乐。');game.sound=!game.sound;$('#sound-button').textContent=game.sound?'♫':'♩';if(game.sound)startMusic();else stopMusic();save();}
$('#sound-button').onclick=toggleSound;

function move(dx,dy){if(!game||fight||dialogue||modalType)return false;game.facing=dx>0?'right':dx<0?'left':dy>0?'down':'up';const x=game.x+dx,y=game.y+dy;if(!canWalk(map,game,x,y))return false;game.x=x;game.y=y;game.steps++;walkingUntil=frameTime+.2;
 if(['route','dungeon'].includes(game.place)&&game.steps-lastStepCount>12&&['grass','flowers','snow','sand','stone'].includes(tileKind(map,x,y))&&random(game)<(game.place==='dungeon'?.035:.075)){lastStepCount=game.steps;const ch=CHAPTERS[game.region],ids=ch.wild,id=ids[Math.floor(random(game)*ids.length)],level=ch.level+(game.place==='dungeon'?game.dungeonFloor:0)+Math.floor(random(game)*4);let species=id;if(level>=32)species=id+'_3';else if(level>=16)species=id+'_2';startBattle([createMon(species,level,game.seed)],{kind:'wild'});}
 if(game.steps%20===0&&!fight)save();return true;}
function routeTo(tx,ty){const route=pathFromField(navigationField(map,game),tx,ty);if(route)pathQueue=route;}
canvas.addEventListener('pointerdown',e=>{if(!game||fight||dialogue||modalType)return;const rect=canvas.getBoundingClientRect(),cam=camera({...game,x:visualPlayer.x,y:visualPlayer.y},view.w,view.h,map),tx=Math.floor((e.clientX-rect.left+cam.x)/TILE),ty=Math.floor((e.clientY-rect.top+cam.y)/TILE);const near=map.objects.find(o=>o.action&&Math.hypot(o.x-tx,o.y-ty)<1.5);if(near&&Math.hypot(near.x-game.x,near.y-game.y)<2.2)return interact();if(!canWalk(map,game,tx,ty)){for(const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]])if(canWalk(map,game,tx+dx,ty+dy)){routeTo(tx+dx,ty+dy);return;}}else routeTo(tx,ty);canvas.focus();});
document.addEventListener('keydown',e=>{
 if(e.target.matches('input,textarea,select'))return;const key=e.key.toLowerCase();
 if(key==='escape'){e.preventDefault();if(modalType)closeModal();else if(fight&&!pendingBattle){battleMenu='root';renderBattle();}else if(game&&!dialogue)openSettings();return;}
 if(modalType)return;
 if(['arrowup','arrowdown','arrowleft','arrowright',' ','w','a','s','d'].includes(key))e.preventDefault();
 if(dialogue){if(['e',' ','enter'].includes(key)){e.preventDefault();if(!e.repeat)nextDialogue();}return;}
 if(fight){if(!e.repeat&&/^[1-4]$/.test(key))$('#battle-actions').querySelectorAll('button:not(.battle-back)')[+key-1]?.click();return;}
 if(!game)return;
 if(!e.repeat){if(key==='e'||key===' '){interact();return;}if(key==='k'){openLocalChart();return;}const shortcut={p:'party',b:'bag',m:'map',j:'journal',l:'dex'}[key];if(shortcut){menus[shortcut]();return;}}
 heldKeys.add(key);pathQueue=[];
});
document.addEventListener('keyup',e=>heldKeys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>heldKeys.clear());
$$('[data-dir]').forEach(b=>{const key={up:'w',down:'s',left:'a',right:'d'}[b.dataset.dir];b.onpointerdown=e=>{e.preventDefault();pathQueue=[];heldKeys.add(key);b.setPointerCapture(e.pointerId);};b.onpointerup=()=>heldKeys.delete(key);b.onpointercancel=()=>heldKeys.delete(key);});$('#touch-interact').onclick=interact;$('#interact-prompt').onclick=interact;
document.addEventListener('visibilitychange',()=>{heldKeys.clear();metrics.reset();if(document.hidden){save();stopMusic();}else if(game?.sound)startMusic();});window.addEventListener('pagehide',()=>save());
function loop(ms){if(document.hidden){lastFrame=ms;requestAnimationFrame(loop);return;}const drawStart=performance.now();const dt=Math.min((ms-lastFrame)/1000,.05);lastFrame=ms;frameTime=ms/1000;moveCooldown-=dt;
 if(game&&!document.hidden){if(modalType!=='settings')game.playtime+=dt;if(frameTime-lastSaveTick>45&&!fight){lastSaveTick=frameTime;save();}}
 if(game&&!fight&&!dialogue&&!modalType){
  if(moveCooldown<=0){let dx=0,dy=0;if(heldKeys.has('w')||heldKeys.has('arrowup'))dy=-1;else if(heldKeys.has('s')||heldKeys.has('arrowdown'))dy=1;else if(heldKeys.has('a')||heldKeys.has('arrowleft'))dx=-1;else if(heldKeys.has('d')||heldKeys.has('arrowright'))dx=1;else if(pathQueue.length){const [x,y]=pathQueue.shift();dx=x-game.x;dy=y-game.y;}if(dx||dy){move(dx,dy);moveCooldown=heldKeys.has('shift')?.085:.15;}}
  const o=nearest(map,game),label=o?(o.action==='expedition'&&!currentExpeditionStage(game,o.expedition)?'回访 · '+getExpedition(o.expedition).giver:(game.trainerWins?.[o.id]?'已切磋 · ':o.relic&&game.relics?.[o.relic]?.solved?'已修复 · ':'')+o.label)+(o.action==='rune'?' · '+RUNE_SYMBOLS[runeValue(game,o)]:''):'',key=(o?.id||'')+label;if(key!==lastInteraction){lastInteraction=key;$('#interact-prompt').classList.toggle('hidden',!o);if(o){$('#interact-prompt').innerHTML='<kbd>E</kbd>'+escape(label);$('#interact-prompt').setAttribute('aria-label','互动：'+label);}}
 }
 if(game){visualPlayer.x=game.reduceMotion?game.x:easePosition(visualPlayer.x,game.x,dt);visualPlayer.y=game.reduceMotion?game.y:easePosition(visualPlayer.y,game.y,dt);}
 if(pendingBattle){updateBattlePlayback();if(frameTime-battleEffect.start>=battleEffect.duration)commitBattleTurn();}
 const t=game?.reduceMotion?0:frameTime;if(!modalType||renderDirty){if(!game)drawTitleVista(ctx,view.w,view.h,t);else if(fight)drawBattle(t);else drawWorld(ctx,view.w,view.h,map,{...game,x:visualPlayer.x,y:visualPlayer.y},t,{walking:frameTime<walkingUntil});renderDirty=false;}
 if(!modalType)metrics.record(ms,performance.now()-drawStart);if(frameTime-lastMetricsUpdate>1){lastMetricsUpdate=frameTime;const m=metrics.summary();$('#perf-indicator').textContent=modalType?'画面暂停':m.fps?`${m.fps} FPS · ${game?.quality==='performance'?'流畅':game?.quality==='balanced'?'均衡':'精细'}`:'测量帧率中';$('#perf-indicator').title=`实际采样 ${m.samples} 帧 · 绘制 ${m.draw} ms · P95 帧间隔 ${m.p95} ms`;if($('#live-performance'))$('#live-performance').textContent=`画面已暂停 · 最近 ${m.fps} FPS · 绘制 ${m.draw} ms · P95 ${m.p95} ms`; }requestAnimationFrame(loop);
}
resize();requestAnimationFrame(loop);

function openRelic(id){
 const relic=getRelic(id);if(relicProgress(game,id).solved)return openLetter(id);
 let hint=false;
 const note=map.objects.find(o=>o.relic===id)?.text,content=()=>relicMarkup(relic,relicProgress(game,id),hint)+(note?`<details class="relic-original"><summary>仪器旁的旧笔记</summary><p>${escape(note)}</p></details>`:'');
 openModal(relic.instrument,content(),'relic',CHAPTERS[relic.region].island+' · 群岛回信');
 function repaint(focus){$('#modal-content').innerHTML=content();bind();if(focus){const next=$(focus);if(next&&!next.disabled)next.focus();else ($('#modal-content [data-relic-touch]:not(:disabled)')||$('#relic-undo')||$('#relic-reset'))?.focus();}}
 function act(action,focus){try{const result=applyRelicAction(game,id,action);game=result.game;save();if(result.solvedNow){updateHUD();sfx('get');openLetter(id,true);}else{sfx('click');repaint(focus);}}catch(error){toast(error.message);}}
 function bind(){
  $$('[data-relic-touch]').forEach(b=>b.onclick=()=>act({type:'touch',index:+b.dataset.relicTouch},`[data-relic-touch="${b.dataset.relicTouch}"]`));
  $('#relic-reset').onclick=()=>act({type:'reset'},'#relic-reset');
  if($('#relic-undo'))$('#relic-undo').onclick=()=>act({type:'undo'},'#relic-undo');
  $('#relic-hint').onclick=()=>{hint=!hint;repaint('#relic-hint');};
 }
 bind();
}
function openLetter(id,fresh=false){
 const relic=getRelic(id);if(!relicProgress(game,id).solved)return;
 openModal('群岛回信',`<article class="letter-paper"><small>${CHAPTERS[relic.region].island} · ${fresh?'刚刚修复的记忆':'收在手记中的信'}</small><h3>${relic.name}</h3>${relic.letter.map(p=>`<p>${escape(p)}</p>`).join('')}<p class="letter-signature">—— ${relic.sender}</p></article><p class="letter-reply">${escape(relic.reply)}</p>${fresh?`<div class="letter-reward"><small>已收下补给</small>${Object.entries(relic.reward).map(([id,n])=>`<span>${itemCanvas(id,24)}${ITEMS[id].name} × ${n}</span>`).join('')}</div>`:''}<div class="card-actions"><button class="primary" id="letter-return">继续旅程 →</button><button class="secondary" id="letter-notebook">查看全部回信</button></div>`,'letter','每个人，都曾为明天留下一句话');
 $('#letter-return').onclick=closeModal;$('#letter-notebook').onclick=openLetters;
}
function openLetters(){
 const count=restoredLetters(game).length,unlocked=Math.min(7,Math.max(game.region,0,...game.badges.map(i=>i+1)));
 openModal('群岛回信',`<div class="relic-notebook-summary"><span class="eyebrow">旧日仪器 · 已修复 ${count} / 8</span><h3>八座岛，八种走向明天的办法</h3><p>每座遗迹的第四层，都有一台保存回信的旧仪器。解开折光镜、联动灯阵或一笔星图，即可读信并收下旅行补给。中途离开也会保留修复进度。</p>${count===8&&game.ending?'<p class="letter-reply">阿汐把八封信装进同一个信袋。它们没有变成新的命令，也没有替谁决定未来。你们把信袋放进船舱，给还没遇见的人留出一个位置。</p>':''}</div><div class="letter-index">${RELICS.map(r=>{const progress=game.relics?.[r.id],known=r.region<=unlocked;return `<article class="${!known?'unreached':progress?.solved?'restored':''}"><small>${known?CHAPTERS[r.region].island:'尚未抵达'} · ${progress?.solved?'✧ 已收好':progress?'修复中':'等待发现'}</small><h3>${known?r.name:'海的另一边'}</h3><p>${known?CHAPTERS[r.region].dungeon+' · 第四层<br>'+r.instrument:'沿着星灯指引的航线，继续走下去。'}</p>${progress?.solved?`<button class="text-button" data-letter="${r.id}">重读 ${r.sender} 的信 →</button>`:''}</article>`;}).join('')}</div><div class="card-actions"><button class="secondary" id="letters-journal">返回旅途手记</button></div>`,'letters','未寄出的信，也会有人认真读完');
 $$('[data-letter]').forEach(b=>b.onclick=()=>openLetter(b.dataset.letter));$('#letters-journal').onclick=openJournal;
}

function openMoveBook(uid){
 if(fight)return toast('请在这场对战结束后调整技能。');
 const current=()=>[...game.party,...game.reserve].find(m=>m.uid===uid);let draft=moveList(current()).slice(),slot=0,mode=current().loadout?'manual':'auto';
 const changed=()=>mode!==(current().loadout?'manual':'auto')||draft.join(',')!==moveList(current()).join(',');
 const content=()=>moveBookMarkup(current(),draft,slot,mode,changed());
 openModal('技能记忆',content(),'moves','学会的招式，都还记得');
 function redraw(focus){$('#modal-content').innerHTML=content();paintMonCanvases();bind();if(focus){const target=$(focus);if(target&&!target.disabled)target.focus();else $(`[data-move-slot="${slot}"]`).focus();}}
 function bind(){
  $$('[data-move-slot]').forEach(b=>b.onclick=()=>{slot=+b.dataset.moveSlot;redraw(`[data-move-slot="${slot}"]`);});
  $$('[data-learned-move]').forEach(b=>b.onclick=()=>{const id=b.dataset.learnedMove,index=draft.indexOf(id);if(index>=0)[draft[slot],draft[index]]=[draft[index],draft[slot]];else draft[slot]=id;mode='manual';redraw(`[data-move-slot="${slot}"]`);});
  $('#auto-loadout').onclick=()=>{draft=moveLearnset(current()).filter(m=>m.level<=current().level).map(m=>m.id).slice(-4);mode='auto';redraw('#auto-loadout');};
  $('#cancel-loadout').onclick=()=>openMon(current());
  $('#save-loadout').onclick=()=>{try{game=setMoveLoadout(game,uid,mode==='auto'?null:draft);save();updateHUD();toast('已记好这次出发的技能搭配。');openMon(current());}catch(error){toast(error.message);}};
 }
 bind();
}

function openBondIndex(filter='owned'){
 openModal('同行纪事',bondIndexMarkup(game,filter),'bond-index','把相处的日子，慢慢读成故事');
 $$('[data-bond-filter]').forEach(b=>b.onclick=()=>openBondIndex(b.dataset.bondFilter));
 $$('[data-bond-family]').forEach(b=>b.onclick=()=>openBondFamily(b.dataset.bondFamily));
}
function openBondFamily(family){
 openModal(BOND_CHRONICLES[family].title,bondFamilyMarkup(game,family),'bond-family','每一位伙伴，都有自己的来路');
 $$('[data-bond-chapter]').forEach(b=>b.onclick=()=>openBondReader(family,+b.dataset.bondChapter));
 $('#bond-index-back').onclick=()=>openBondIndex();$('#bond-party-back').onclick=openParty;
}
function openBondReader(family,index){
 try{const chapter=bondChapter(game,family,index);openModal(chapter.title,bondReaderMarkup(game,family,index),'bond-reader','共同走过，才会记得');
  $$('[data-bond-choice]').forEach(b=>b.onclick=()=>{
   try{const result=completeBondChapter(game,family,index,+b.dataset.bondChoice);game=result.game;save();updateHUD();if(!result.alreadyComplete)sfx('get');openBondReader(family,index);}catch(error){toast(error.message);}
  });
  if($('#bond-reader-back'))$('#bond-reader-back').onclick=()=>openBondFamily(family);
 }catch(error){toast(error.message);}
}
function openCamp(){
 const ready=Object.keys(BOND_CHRONICLES).filter(f=>bondStatus(game,f).ready).length;
 openModal('岸边的营火',`<div class="camp-intro"><span>✦</span><small>${CHAPTERS[game.region].town} · 今晚的停靠处</small><h3>火还暖着，<br>可以慢慢说。</h3><p>同行伙伴已经恢复生命与状态。卸下行囊，听听阿汐和潮灵在想什么。</p></div><div class="camp-options"><button id="camp-bonds"><strong>和潮灵坐一会儿</strong><small>${ready?'有 '+ready+' 个家族的故事可以继续':'查看同行纪事与默契进度'}</small></button><button id="camp-talk"><strong>听阿汐说说今天</strong><small>${game.badges.includes(game.region)?'星灯点亮后的营火夜话':'还未点亮的星灯，也有人一起等'}</small></button></div><button class="text-button" id="camp-leave">收好行囊，继续旅途 →</button>`,'camp','给走了一天的人留一点火');
 $('#camp-bonds').onclick=()=>openBondIndex(ready?'ready':'owned');$('#camp-leave').onclick=closeModal;
 $('#camp-talk').onclick=()=>{closeModal();showDialogue(game.badges.includes(game.region)?CAMPFIRE_TALKS[game.region]:[['阿汐','星灯还没点亮，我们也可以坐一会儿。不是所有休息都要等事情做完。'],['阿汐','伙伴们已经恢复好了。你想想下一站，我来看看水烧开了没有。']],openCamp);};
}
function openEquipment(uid){
 const mon=[...game.party,...game.reserve].find(m=>m.uid===uid);if(!mon)return;
 const current=stats(mon),labels={hp:'生命',atk:'攻击',def:'防御',spd:'速度'};
 const options=[...new Set([...Object.keys(ITEMS).filter(id=>ITEMS[id].equip&&game.bag[id]>0),mon.equip].filter(Boolean))];
 const preview=item=>Object.entries(stats({...mon,equip:item})).map(([key,value])=>{const diff=value-current[key];return `<span>${labels[key]}<b>${value}</b><small class="${diff>0?'positive':diff<0?'negative':''}">${diff>0?'+':''}${diff||'—'}</small></span>`;}).join('');
 openModal('选择同行护符',`<div class="equipment-intro">${monCanvas(mon.species,108)}<div><small>${SPECIES[mon.species].name} · Lv.${mon.level}</small><h3>当前佩戴 · ${ITEMS[mon.equip]?.name||'未佩戴'}</h3><p>每位伙伴携带一枚护符。更换后归还原物，当前生命按比例调整。下方显示更换后的数值与变化。</p></div></div><div class="equipment-grid">${options.map(id=>`<article class="equipment-card ${id===mon.equip?'equipped':''}"><div class="equipment-title">${itemCanvas(id,40)}<div><h3>${ITEMS[id].name}</h3><small>${id===mon.equip?'正在佩戴':'背包持有 '+game.bag[id]}</small></div></div><p>${ITEMS[id].desc}</p><div class="equipment-stats">${preview(id)}</div><button class="secondary" data-equip="${id}" ${id===mon.equip?'disabled':''}>${id===mon.equip?'已佩戴':'换上这枚护符'}</button></article>`).join('')||'<p class="section-note">还没有护符。杂货店出售常用护符，同行故事会留下特别的纪念物。</p>'}</div>${mon.equip?`<div class="equipment-remove"><div class="equipment-stats">${preview(null)}</div><button class="secondary" id="unequip">取下护符</button></div>`:''}<button class="text-button" id="equipment-back">返回伙伴资料 →</button>`,'equipment','带上合适的纪念，再走一段路');
 function apply(item){try{game=equipCompanion(game,uid,item);save();updateHUD();openEquipment(uid);}catch(error){toast(error.message);}}
 $$('[data-equip]').forEach(b=>b.onclick=()=>apply(b.dataset.equip));if($('#unequip'))$('#unequip').onclick=()=>apply(null);
 $('#equipment-back').onclick=()=>openMon([...game.party,...game.reserve].find(m=>m.uid===uid));
}
