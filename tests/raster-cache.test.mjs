import test from 'node:test';
import assert from 'node:assert/strict';
import {RasterCache} from '../dist/js/raster-cache.js';
const surface=()=>({surface:{width:100,height:100},water:[]});
test('terrain cache bounds retained pixels and releases evicted drawing buffers',()=>{
 const cache=new RasterCache({maxEntries:3,maxPixels:20000}),a=surface(),b=surface(),c=surface();
 cache.set('a',a);cache.set('b',b);assert.equal(cache.get('a'),a);cache.set('c',c);
 assert.equal(cache.get('b'),null);assert.deepEqual(b.surface,{width:0,height:0});assert.equal(cache.get('a'),a);assert.equal(cache.info().pixels,20000);
 for(let n=0;n<100;n++)cache.set('map'+n,surface());
 assert.equal(cache.info().entries,2);assert.equal(cache.info().pixels,20000);assert.deepEqual(a.surface,{width:0,height:0});
 assert.throws(()=>cache.set('large',{surface:{width:200,height:200}}),RangeError);assert.equal(cache.info().pixels,20000);
});
test('terrain cache also respects entry limits with small surfaces',()=>{
 const cache=new RasterCache({maxEntries:1,maxPixels:100000});const a=surface();cache.set('a',a);cache.set('b',surface());assert.equal(cache.info().entries,1);assert.equal(a.surface.width,0);
});
