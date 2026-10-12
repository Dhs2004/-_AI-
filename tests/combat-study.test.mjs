import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTERS,SPECIES} from '../dist/js/data.js';
import {studyParty,runBossStudy} from '../scripts/combat-study.mjs';

test('boss study uses attainable families and its prepared party can win each boss without stalled sampled battles',()=>{
 for(let region=0;region<8;region++){
  const available=new Set(['budfox',...CHAPTERS.slice(0,region+1).flatMap(c=>c.wild)]),options={adaptive:true,roster:'support',equipment:true,exploring:true};
  for(const mon of studyParty(region,options))assert.ok(available.has(SPECIES[mon.species].family));
  const results=Array.from({length:10},(_,n)=>runBossStudy(region,100+n*7919,options));
  assert.ok(results.some(r=>r.outcome==='win'),`chapter ${region+1}: no sampled victory`);
  assert.ok(results.every(r=>r.outcome!=='stalled'),`chapter ${region+1}: stalled encounter`);
 }
});
