/** Bound large raster surfaces explicitly instead of waiting for a GC cycle. */
export class RasterCache {
 constructor({maxEntries=3,maxPixels=6000000}={}){this.maxEntries=maxEntries;this.maxPixels=maxPixels;this.entries=new Map();this.pixels=0;this.hits=0;this.misses=0;}
 get(key){const entry=this.entries.get(key);if(!entry){this.misses++;return null;}this.hits++;this.entries.delete(key);this.entries.set(key,entry);return entry.value;}
 set(key,value){
  const pixels=value.surface.width*value.surface.height;
  if(pixels>this.maxPixels)throw new RangeError('Raster exceeds the cache pixel budget.');
  if(this.entries.has(key))this.release(key);
  while(this.entries.size>=this.maxEntries||this.pixels+pixels>this.maxPixels)this.release(this.entries.keys().next().value);
  this.entries.set(key,{value,pixels});this.pixels+=pixels;return value;
 }
 release(key){const entry=this.entries.get(key);if(!entry)return;this.entries.delete(key);this.pixels-=entry.pixels;entry.value.surface.width=0;entry.value.surface.height=0;}
 info(){return {entries:this.entries.size,pixels:this.pixels,hits:this.hits,misses:this.misses};}
}
