/** A bounded pixel atlas: hundreds of sprites share one drawing surface. */
export class SpriteCache {
 constructor(capacity,{size=64,columns=16,makeCanvas}={}){
  this.capacity=capacity;this.size=size;this.columns=columns;this.entries=new Map();this.keys=[];this.cursor=0;
  this.makeCanvas=makeCanvas||((w,h)=>{
   if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
   if(typeof document!=='undefined')return Object.assign(document.createElement('canvas'),{width:w,height:h});
   return null;
  });
 }
 get(key,draw){
  const cached=this.entries.get(key);if(cached)return cached;
  if(!this.surface){this.surface=this.makeCanvas(this.columns*this.size,Math.ceil(this.capacity/this.columns)*this.size);if(!this.surface)return null;this.context=this.surface.getContext('2d');}
  const slot=this.cursor,indexX=slot%this.columns*this.size,indexY=Math.floor(slot/this.columns)*this.size,ctx=this.context;
  // Reuse only an evicted slot, and clip drawing to prevent neighboring sprites
  // from being touched by outlines which extend beyond the 64px art grid.
  const oldKey=this.keys[slot];if(oldKey!==undefined)this.entries.delete(oldKey);
  ctx.save();try{ctx.setTransform(1,0,0,1,indexX,indexY);ctx.clearRect(0,0,this.size,this.size);ctx.beginPath();ctx.rect(0,0,this.size,this.size);ctx.clip();ctx.imageSmoothingEnabled=false;draw(ctx);}finally{ctx.restore();}
  const sprite={surface:this.surface,x:indexX,y:indexY,size:this.size};
  this.entries.set(key,sprite);this.keys[slot]=key;this.cursor=(slot+1)%this.capacity;
  return sprite;
 }
}
