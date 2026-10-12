import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,createMon,saveEnvelope,readEnvelope,makeBattle} from '../dist/js/engine.js';
import {CHAPTERS} from '../dist/js/data.js';
import {EXPEDITIONS} from '../dist/js/expedition-stories.js';
import {advanceExpedition} from '../dist/js/expedition-engine.js';
import {chapterVisited,chapterJournal,journeyNext,journeySummary,expeditionRecollection} from '../dist/js/journey.js';
import {journeyMarkup,recollectionMarkup,recollectionPageMarkup,sceneReaderMarkup} from '../dist/js/journey-view.js';

test('chapter archive protects unopened islands and unread main-story conclusions',()=>{
 const g=createGame();g.pendingScenes=['intro0'];
 assert.equal(chapterJournal(g,0).scenes.length,0);
 for(let region=1;region<8;region++)assert.equal(chapterJournal(g,region),null);
 assert.equal(chapterVisited(g,-1),false);assert.equal(chapterVisited(g,8),false);
 g.pendingScenes=[];assert.deepEqual(chapterJournal(g,0).scenes.map(s=>s.id),['intro0']);
 g.flags.faced0=true;assert.deepEqual(chapterJournal(g,0).scenes.map(s=>s.id),['intro0','before0']);
 g.badges=[0];g.pendingScenes=['after0'];assert.ok(!chapterJournal(g,0).scenes.some(s=>s.id==='after0'));
 g.pendingScenes=[];assert.ok(chapterJournal(g,0).scenes.some(s=>s.id==='after0'));
 g.region=7;g.flags.entered7=true;g.ending=true;g.badges=[0,1,2,3,4,5,6,7];g.pendingScenes=['ending'];
 assert.ok(!chapterJournal(g,7).scenes.some(s=>s.id==='ending'));
 assert.ok(!chapterJournal(g,7).recap.includes('普通的清晨'));
 g.pendingScenes=[];assert.ok(chapterJournal(g,7).scenes.some(s=>s.id==='ending'));
});

test('all 144 expedition stages replay only completed text and chosen replies without rewards',()=>{
 for(const e of EXPEDITIONS){
  let g=createGame();g.region=e.region;g.flags['entered'+e.region]=true;
  assert.equal(expeditionRecollection(g,e.id),null);
  for(const [index,stage] of e.stages.entries()){
   if(stage.kind==='delivery')g.bag[stage.item]=stage.amount;
   g=advanceExpedition(g,e.id,stage.id,{victory:true,choice:1,sequence:stage.answer}).game;
   const before=JSON.stringify(g),book=expeditionRecollection(g,e.id);
   assert.equal(book.sections.length,index+1);
   assert.equal(JSON.stringify(g),before);
   const page=book.sections[index];assert.deepEqual(page.lines,stage.lines);
   if(stage.kind==='choice'){
    assert.equal(page.choice.label,stage.choices[1].label);assert.deepEqual(page.choice.reply,[]);
    g.pendingScenes=[];assert.deepEqual(expeditionRecollection(g,e.id).sections[index].choice.reply,stage.choices[1].reply);
   }
   if(index===e.stages.length-1){assert.deepEqual(book.ending,[]);g.pendingScenes=[];assert.deepEqual(expeditionRecollection(g,e.id).ending,e.ending);}
   const saved=readEnvelope(saveEnvelope(g));assert.deepEqual(expeditionRecollection(saved,e.id),expeditionRecollection(g,e.id));
  }
 }
});

test('legacy memory fragments do not invent previous branch choices or grant inventory',()=>{
 const g=createGame();g.badges=[0];const e=EXPEDITIONS[0],before=JSON.stringify(g),book=expeditionRecollection(g,e.id);
 assert.equal(book.legacy,true);assert.equal(book.sections.length,e.stages.length);
 assert.ok(book.sections.filter(s=>s.kind==='choice').every(s=>s.legacyChoice&&s.choice===null));
 assert.equal(JSON.stringify(g),before);
 assert.equal(expeditionRecollection(g,'missing'),null);
 assert.equal(expeditionRecollection(g,'exp7a'),null);
});

test('continuation summary points to actual dialogue, battle, expedition, dungeon and trial state',()=>{
 const g=createGame();assert.equal(journeyNext(g).id,'exp0a');
 g.expeditions.exp0b={step:1,choices:{}};g.trackedExpedition='exp0b';assert.equal(journeyNext(g).id,'exp0b');
 g.pendingScenes=['intro0'];assert.equal(journeyNext(g).kind,'scene');
 g.suspendedBattle=makeBattle(g,[createMon('tidefin',5)],{kind:'wild'});assert.equal(journeyNext(g).kind,'battle');
 delete g.suspendedBattle;g.pendingScenes=[];for(let n=0;n<3;n++)g.flags['fragment0-'+n]=true;
 assert.equal(journeyNext(g).kind,'warden');g.place='dungeon';g.dungeonFloor=2;assert.match(journeyNext(g).title,/第 3 层/);
 g.badges=[0];assert.equal(journeyNext(g).region,1);
 g.region=7;g.place='town';g.ending=true;g.trial=4;assert.equal(journeyNext(g).floor,5);
 g.trial=24;assert.equal(journeyNext(g).kind,'free');
 g.playtime=5*3600+23*60;g.reserve=[createMon('budfox_2',16),createMon('tidefin',5)];
 const summary=journeySummary(g);assert.equal(summary.time,'5 小时 23 分钟');assert.equal(summary.families,2);assert.equal(summary.companions,3);
});

test('archive rendering escapes user text and excludes future stages and unchosen responses',()=>{
 const g=createGame('<img onload=');g.region=0;
 const html=journeyMarkup(g);assert.ok(html.includes('&lt;img'));assert.ok(!html.includes(CHAPTERS[7].name));
 assert.equal(journeyMarkup(g,7),'');
 const e=EXPEDITIONS[0],choiceIndex=e.stages.findIndex(s=>s.kind==='choice'),stage=e.stages[choiceIndex];
 g.expeditions[e.id]={step:choiceIndex+1,choices:{[stage.id]:1}};
 const before=JSON.stringify(g),book=expeditionRecollection(g,e.id),page=recollectionPageMarkup(book,choiceIndex);
 assert.ok(page.includes(stage.choices[1].label));assert.ok(!page.includes(stage.choices[0].label));
 assert.ok(!recollectionMarkup(g,e.id).includes(e.stages[choiceIndex+1].title));
 assert.ok(sceneReaderMarkup(chapterJournal(g,0).scenes[0],CHAPTERS[0]).includes('初次抵达'));
 assert.equal(JSON.stringify(g),before);
});
