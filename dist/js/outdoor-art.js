// Static terrain detail, painted once into each region's cached ground surface.
export function drawOutdoorBlock(ctx,region,px,py,size,variation,edges){
 if([0,1,3,5].includes(region)){
  const colors=region===5?['#243f3c','#355d4f','#48735a','#67846b']:region===1?['#28454b','#345951','#527667','#6c8c76']:['#223e38','#315749','#456b50','#6d875c'];
  ctx.fillStyle=colors[1];ctx.fillRect(px,py,size+1,size+1);
  return;
 }
 const stone=region===2?['#423e3b','#645348','#8e7055','#b79369']:region===4?['#536975','#83999e','#b5cac7','#e5e8d8']:region===6?['#283f4b','#455f64','#627b79','#9ca486']:['#30394f','#485069','#68748a','#98a2af'];
 ctx.fillStyle=stone[0];ctx.fillRect(px,py,size+1,size+1);
 ctx.fillStyle=stone[1];ctx.fillRect(px,py,size,size-3);
 if(edges.top){ctx.fillStyle=stone[2];ctx.fillRect(px,py,size,6);ctx.fillStyle=stone[3];ctx.fillRect(px+2,py+1,size-4,2);}
 if(edges.bottom){ctx.fillStyle=stone[0];ctx.fillRect(px,py+size-9,size,9);ctx.fillStyle=stone[2];ctx.fillRect(px,py+size-10,size,2);}
 if(variation>.35){ctx.fillStyle=stone[2]+'66';ctx.fillRect(px+6+variation*8,py+11,10,3);ctx.fillStyle=stone[0]+'88';ctx.fillRect(px+18,py+22,9,2);}
 if(region===2&&variation>.8){ctx.fillStyle='#d29a614d';ctx.fillRect(px+13,py+23,2,6);}
 if(region===4){ctx.fillStyle='#dce3d08a';ctx.fillRect(px+2,py+3,12+variation*10,3);}
 if(region===6&&variation>.5){ctx.fillStyle='#223642';ctx.fillRect(px+8,py+12,6,7);ctx.fillRect(px+22,py+12,6,7);ctx.fillStyle='#d3bd7044';ctx.fillRect(px+9,py+13,3,4);}
 if(region===7&&variation>.86){ctx.fillStyle='#a2c3ce88';ctx.fillRect(px+11,py+15,2,6);ctx.fillRect(px+9,py+17,6,2);}
}

// Forest crowns are a single clipped layer painted after the tile bases. Their
// silhouettes overlap tile boundaries; the cached surface adds no per-frame work.
export function drawOutdoorCanopies(ctx,map,size){
 if(![0,1,3,5].includes(map.region))return;
 const colors=map.region===5?['#23453e','#3c6652','#56815e','#809d78']:map.region===1?['#2b484a','#426756','#678978','#90aa8a']:['#2a493c','#41694e','#668653','#91a269'];
 const random=(x,y,s)=>{let n=Math.imul(x+63,374761393)+Math.imul(y+37,668265263)+s*9127;n=(n^(n>>>13))>>>0;return ((Math.imul(n,1274126177)^(n>>>16))>>>0)/4294967295;};
 const crown=(cx,cy,r,color)=>{
  ctx.fillStyle=color;ctx.beginPath();
  ctx.moveTo(cx-r*.55,cy-r);ctx.lineTo(cx+r*.35,cy-r);ctx.lineTo(cx+r*.35,cy-r*.7);
  ctx.lineTo(cx+r*.8,cy-r*.7);ctx.lineTo(cx+r*.8,cy-r*.35);ctx.lineTo(cx+r,cy-r*.35);
  ctx.lineTo(cx+r,cy+r*.45);ctx.lineTo(cx+r*.6,cy+r*.45);ctx.lineTo(cx+r*.6,cy+r*.8);
  ctx.lineTo(cx-r*.35,cy+r*.8);ctx.lineTo(cx-r*.35,cy+r*.6);ctx.lineTo(cx-r*.9,cy+r*.6);
  ctx.lineTo(cx-r*.9,cy-r*.4);ctx.lineTo(cx-r*.55,cy-r*.4);ctx.closePath();ctx.fill();
 };
 ctx.save();ctx.beginPath();
 const trees=[];
 for(let y=0;y<map.height;y++)for(let x=0;x<map.width;x++)if(map.layout[y][x]==='#'){
  ctx.rect(x*size,y*size,size,size);
  trees.push({x:x*size+size*.5+(random(x,y,1)-.5)*15,y:y*size+size*.5+(random(x,y,2)-.5)*14,r:19+random(x,y,3)*13,v:random(x,y,4)});
 }
 ctx.clip();
 for(const tree of trees){
  const {x,y,r,v}=tree;
  crown(x+2,y+5,r+2,colors[0]);crown(x,y,r,colors[1]);
  crown(x-r*.18,y-r*.24,r*.68,colors[2]);crown(x-r*.27,y-r*.4,r*.3,colors[3]+'bb');
  ctx.fillStyle=colors[3]+'99';ctx.fillRect(x+r*.25,y-r*.36,5,2);ctx.fillRect(x-r*.4,y+r*.15,4,2);
  if(map.region===5&&v>.72){ctx.fillStyle='#c2a3c788';ctx.fillRect(x+5,y+8,3,2);}
 }
 ctx.restore();
}
