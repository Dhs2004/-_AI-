/** Rolling real frame measurements. No fabricated FPS or timer-based estimate. */
export class FrameMetrics {
 constructor(){this.frames=[];this.lastStamp=0;this.started=0;}
 reset(){this.frames=[];this.lastStamp=0;this.started=0;}
 record(stamp,cost){
  if(this.lastStamp&&stamp>this.lastStamp)this.frames.push({interval:stamp-this.lastStamp,cost});
  this.lastStamp=stamp;while(this.frames.length>180)this.frames.shift();
 }
 summary(){
  if(this.frames.length<2)return {fps:0,p95:0,draw:0,samples:this.frames.length};
  const ms=this.frames.map(f=>f.interval).sort((a,b)=>a-b),total=this.frames.reduce((n,f)=>n+f.interval,0),draw=this.frames.reduce((n,f)=>n+f.cost,0)/this.frames.length;
  return {fps:Math.round(1000*this.frames.length/total),p95:Math.round(ms[Math.floor(ms.length*.95)]*10)/10,draw:Math.round(draw*100)/100,samples:this.frames.length};
 }
}
export function easePosition(current,target,dt,speed=22){return current+(target-current)*(1-Math.exp(-speed*Math.max(0,dt)));}
