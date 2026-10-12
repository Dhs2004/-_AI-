import test from 'node:test';
import assert from 'node:assert/strict';
import {SpriteCache} from '../dist/js/sprite-cache.js';
test('sprite atlases allocate one surface, bound memory, and never repaint cached entries',()=>{
 let surfaces=0,draws=0;const operations=[],ctx={save(){operations.push('save');},restore(){operations.push('restore');},setTransform(...args){operations.push(['transform',...args]);},clearRect(...args){operations.push(['clear',...args]);},beginPath(){},rect(){},clip(){operations.push('clip');}};
 const cache=new SpriteCache(4,{columns:2,makeCanvas(w,h){surfaces++;assert.equal(w,128);assert.equal(h,128);return {getContext:()=>ctx};}}),draw=()=>{draws++;operations.push('draw');};
 const first=cache.get('a',draw);assert.strictEqual(cache.get('a',draw),first);assert.equal(draws,1);
 const b=cache.get('b',draw),c=cache.get('c',draw);assert.deepEqual([b.x,b.y,c.x,c.y],[64,0,0,64]);
 cache.get('d',draw);const recycled=cache.get('e',draw);assert.deepEqual([recycled.x,recycled.y],[first.x,first.y]);assert.equal(cache.entries.has('a'),false);assert.equal(cache.entries.size,4);assert.equal(surfaces,1);
 for(let i=0;i<1000;i++)cache.get('new'+i,draw);assert.equal(surfaces,1);assert.equal(cache.entries.size,4);
 assert.equal(operations.filter(o=>o==='save').length,operations.filter(o=>o==='restore').length);assert.ok(operations.indexOf('clip')<operations.indexOf('draw'));
});
