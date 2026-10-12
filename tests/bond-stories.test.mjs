import test from 'node:test';
import assert from 'node:assert/strict';
import {BOND_CHRONICLES,BOND_REQUIREMENTS} from '../dist/js/bond-stories.js';
import {bondStatus,bondChapter,completeBondChapter,bondReward} from '../dist/js/bond-engine.js';
import {SPECIES,ITEMS} from '../dist/js/data.js';
import {createGame,createMon,saveEnvelope,readEnvelope,makeBattle,settleBattle,gainXP} from '../dist/js/engine.js';

test('every lineage has three complete branching stories, distinct choices and valid keepsakes',()=>{
 const families=Object.values(SPECIES).filter(s=>s.stage===1).map(s=>s.family);
 assert.deepEqual(Object.keys(BOND_CHRONICLES).sort(),families.sort());
 const titles=[];
 for(const [family,story] of Object.entries(BOND_CHRONICLES)){
  assert.equal(story.chapters.length,3);assert.equal(story.gifts.length,2);assert.notEqual(...story.gifts);assert.ok(story.gifts.every(id=>ITEMS[id]?.modifiers));
  for(const [i,c] of story.chapters.entries()){titles.push(c.title);assert.ok(c.lines.length>=3);assert.equal(c.choices.length,2);assert.ok(c.lines.every(([who,line])=>typeof who==='string'&&who&&typeof line==='string'&&line.trim()));
   for(const [j,choice] of c.choices.entries()){assert.ok(choice.reply.length>=2);assert.ok(choice.memory.length>=12);for(const id of Object.keys(bondReward(family,i,j)))assert.ok(ITEMS[id]);}
  }
  assert.equal(story.chapters[2].echo.length,2);assert.notEqual(...story.chapters[2].echo);
 }
 assert.equal(new Set(titles).size,Object.keys(BOND_CHRONICLES).length*3);
});

test('all family branches survive every save boundary and grant rewards only once',()=>{
 for(const family of Object.keys(BOND_CHRONICLES))for(const choice of [0,1]){
  let g=createGame();g.party=[createMon(family,15)];g.party[0].bond=100;g.badges=[0,1,2,3];
  for(let i=0;i<3;i++){
   const before=JSON.stringify(g),result=completeBondChapter(g,family,i,choice);assert.equal(JSON.stringify(g),before);assert.equal(result.alreadyComplete,false);
   for(const [id,n] of Object.entries(bondReward(family,i,choice)))assert.equal(result.game.bag[id],(g.bag[id]||0)+n);
   g=readEnvelope(saveEnvelope(result.game));assert.equal(bondChapter(g,family,i).selected,choice);
   assert.deepEqual(completeBondChapter(g,family,i,1-choice).game,g);
  }
  assert.equal(bondStatus(g,family).complete,true);assert.equal(bondChapter(g,family,2).lines[0][1],BOND_CHRONICLES[family].chapters[2].echo[choice]);
  gainXP(g.party[0],500);assert.equal(SPECIES[g.party[0].species].family,family);assert.equal(bondStatus(g,family).complete,true);
 }
});

test('shared family progress follows evolved and reserve companions, and real victories unlock milestones',()=>{
 const g=createGame();g.party[0].bond=7;g.reserve=[createMon('budfox_3',35)];g.reserve[0].bond=6;
 assert.equal(bondStatus(g,'budfox').ready,false);const b=makeBattle(g,[createMon('pebble',2)]);b.outcome='win';
 let next=settleBattle(g,b).game;assert.equal(bondStatus(next,'budfox').ready,true);next=completeBondChapter(next,'budfox',0,0).game;
 next.party[0].bond=23;next.reserve[0].bond=24;next.badges=[0];assert.equal(bondStatus(next,'budfox').ready,false);
 next.badges.push(1);assert.equal(bondStatus(next,'budfox').ready,true);assert.equal(bondStatus(next,'budfox').mon.uid,next.reserve[0].uid);
 next=completeBondChapter(next,'budfox',1,1).game;assert.throws(()=>completeBondChapter(next,'budfox',2,0));
 next.reserve[0].bond=48;next.badges=[0,1,2,3];assert.equal(bondStatus(next,'budfox').ready,true);
});

test('missing milestones, forged choices, malformed saves and battle-time collection cannot grant progress',()=>{
 const g=createGame();assert.throws(()=>completeBondChapter(g,'budfox',0,0));assert.throws(()=>bondChapter(g,'budfox',2));
 g.party[0].bond=100;g.badges=[0,1,2,3];assert.throws(()=>completeBondChapter(g,'budfox',1,0));assert.throws(()=>completeBondChapter(g,'budfox',0,7));
 g.suspendedBattle=makeBattle(g,[createMon('pebble',2)]);assert.throws(()=>completeBondChapter(g,'budfox',0,0));g.suspendedBattle=null;
 for(const stories of [[],{missing:[0]},{budfox:[2]},{budfox:[0,1,0,1]},{budfox:'0'}])assert.throws(()=>readEnvelope(saveEnvelope({...g,bondStories:stories})));
 const old={...g};delete old.bondStories;delete old.party[0].bond;assert.deepEqual(readEnvelope(saveEnvelope(old)).bondStories,{});
});
