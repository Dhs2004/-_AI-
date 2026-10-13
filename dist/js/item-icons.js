/* Original 32×32 pixel items for Starfall Chronicle.
 * No images, fonts, DOM, timers or canvas allocations. Sprites are compiled
 * once into merged pixel rectangles; drawing preserves the caller's state.
 * Public coordinates use a top-left anchor. Unknown item IDs draw nothing.
 */
const INK='#173843', EDGE='#36555a', CREAM='#f3e7bd', GOLD='#d9b576';

function sprite(paint){
  const grid=new Array(32*32).fill(null);
  const put=(x,y,color)=>{x=Math.round(x);y=Math.round(y);if(x>=0&&y>=0&&x<32&&y<32)grid[y*32+x]=color;};
  const rect=(x,y,w,h,color)=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)put(xx,yy,color);};
  const line=(x,y,tx,ty,color,width=1)=>{const dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;let err=dx+dy;for(;;){rect(x,y,width,width,color);if(x===tx&&y===ty)break;const e=err*2;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}}};
  const fill=(points,color,ox=0,oy=0)=>{let lo=32,hi=0;for(const p of points){lo=Math.min(lo,p[1]);hi=Math.max(hi,p[1]);}for(let y=Math.floor(lo);y<Math.ceil(hi);y++){const xs=[],sy=y+.5;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]<=sy&&b[1]>sy)||(b[1]<=sy&&a[1]>sy))xs.push(a[0]+(sy-a[1])/(b[1]-a[1])*(b[0]-a[0]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2)for(let x=Math.ceil(xs[i]);x<=Math.floor(xs[i+1]);x++)put(x+ox,y+oy,color);}};
  const poly=(points,color,outline=INK)=>{if(outline){fill(points,outline,-1,0);fill(points,outline,1,0);fill(points,outline,0,-1);fill(points,outline,0,1);}fill(points,color);};
  const disk=(x,y,rx,ry,color)=>{for(let yy=Math.floor(y-ry);yy<=Math.ceil(y+ry);yy++){const f=(yy+.5-y)/ry;if(Math.abs(f)>1)continue;const reach=rx*Math.sqrt(1-f*f);for(let xx=Math.ceil(x-reach);xx<=Math.floor(x+reach);xx++)put(xx,yy,color);}};
  const oval=(x,y,rx,ry,color,outline=INK)=>{if(outline)disk(x,y,rx+1,ry+1,outline);disk(x,y,rx,ry,color);};
  const diamond=(x,y,rx,ry,color,outline=INK)=>poly([[x,y-ry],[x+rx,y],[x,y+ry],[x-rx,y]],color,outline);
  const ring=(x,y)=>{rect(x-1,y-2,3,1,INK);rect(x-2,y-1,5,3,INK);rect(x-1,y+2,3,1,INK);rect(x-1,y-1,3,3,GOLD);put(x,y,INK);put(x-1,y-1,CREAM);};
  paint({put,rect,line,poly,oval,diamond,ring});
  const runs=[],live=new Map();
  for(let y=0;y<32;y++){
    const row=new Map();
    for(let x=0;x<32;){const color=grid[y*32+x];if(!color){x++;continue;}let end=x+1;while(end<32&&grid[y*32+end]===color)end++;
      const key=color+':'+x+':'+(end-x),prior=live.get(key);let run;
      if(prior&&prior.y+prior.h===y){prior.h++;run=prior;}else{run={x,y,w:end-x,h:1,color};runs.push(run);}row.set(key,run);x=end;
    }
    live.clear();for(const [key,run]of row)live.set(key,run);
  }
  // Final pixels never overlap: grouping colors reduces fillStyle changes.
  runs.sort((a,b)=>a.color.localeCompare(b.color));
  return runs;
}

const ICONS={
  potion:sprite(({rect,poly,oval,line,put})=>{
    poly([[12,7],[20,7],[20,10],[24,12],[26,17],[26,23],[24,27],[20,29],[12,29],[8,27],[6,23],[6,17],[8,13],[12,10]],'#94c4b5');
    poly([[20,11],[24,14],[25,18],[25,23],[22,27],[17,28],[12,27],[20,25],[22,20]],'#578f8d',null);
    poly([[8,18],[11,16],[16,17],[21,16],[24,18],[24,24],[21,27],[12,27],[8,24]],'#62a784',null);
    rect(9,18,14,1,'#a9d5a4');rect(10,25,11,1,'#83bf92');
    rect(11,6,10,3,INK);rect(12,6,8,2,'#b7d7ba');rect(12,2,8,4,INK);rect(13,2,6,3,'#bb8f62');rect(13,2,5,1,'#e4bd85');put(17,4,'#946b51');
    rect(10,19,13,5,'#467c70');rect(9,19,13,4,'#d4c993');rect(10,19,11,1,CREAM);rect(10,22,10,1,'#baa578');
    poly([[16,18],[18,21],[17,23],[15,23],[14,21]],'#477c71',null);put(15,21,'#8abd8c');
    line(10,12,8,16,'#e2edd0');rect(8,17,2,2,'#cae5c7');rect(11,10,2,2,'#d7e8c6');rect(11,26,4,1,'#b2d3a5');put(22,13,'#bdd6bb');
  }),
  superpotion:sprite(({rect,poly,line,put,oval})=>{
    poly([[13,6],[19,6],[19,10],[23,12],[25,17],[24,25],[21,29],[11,29],[8,25],[7,17],[9,12],[13,10]],'#a3b4cb');
    poly([[19,10],[23,13],[24,18],[23,25],[20,28],[16,28],[20,22]],'#627b9c',null);
    poly([[9,17],[13,16],[17,17],[22,16],[23,19],[22,25],[20,27],[12,27],[10,24]],'#8d8fb7',null);
    poly([[17,17],[22,16],[23,19],[22,25],[20,27],[16,27],[18,22]],'#6c6c9a',null);
    rect(12,2,9,4,INK);rect(13,2,7,3,GOLD);rect(14,2,5,1,CREAM);rect(12,6,9,2,INK);rect(13,6,7,1,'#e1c88e');rect(14,8,4,2,'#cbdbd0');
    rect(8,16,2,8,'#b4bfcd');rect(10,24,2,3,'#b4bfcd');rect(22,17,1,6,'#535c83');
    oval(16,21,5,5,'#c9aa71');oval(16,20,4,4,'#596780',null);oval(16,20,3,3,'#f0deb0',null);oval(18,19,3,3,'#596780',null);
    put(19,22,'#e2bd7d');put(12,14,'#e4e6d8');rect(10,14,2,2,'#d6dfdc');rect(11,12,2,1,'#e9ead9');rect(12,27,8,1,'#c0b8d0');
    line(19,12,22,14,'#c8cacc');
  }),
  revive:sprite(({poly,line,rect,put,oval})=>{
    poly([[15,12],[19,11],[23,15],[24,20],[21,26],[17,29],[11,27],[8,23],[8,19],[11,15]],'#c69761');
    poly([[18,13],[22,16],[23,21],[20,26],[16,28],[13,26],[17,23],[19,18]],'#977358',null);
    poly([[13,15],[17,13],[18,17],[16,23],[12,25],[10,22],[10,19]],'#e0b77a',null);
    line(18,14,16,22,'#6e6850');line(16,22,12,26,'#6e6850');line(13,16,11,19,'#f0d69d');put(11,21,'#edd29b');
    line(16,17,16,8,INK,2);line(16,15,17,8,'#74a981');
    poly([[16,11],[11,10],[8,6],[8,4],[12,4],[16,7]],'#78ad89');line(10,6,15,9,'#bad3a0');
    poly([[17,9],[18,5],[23,2],[26,3],[25,7],[20,10]],'#91bc91');line(19,8,24,4,'#d0dda5');
    line(5,16,4,19,'#699a92');rect(4,20,1,3,'#99c7ab');put(5,23,'#d9d9b1');
    rect(27,16,1,3,'#709f98');rect(28,19,1,3,'#9ac6b4');put(27,22,'#d9d9b1');
    oval(19,20,1,1,'#e8ce8e',null);
  }),
  cure:sprite(({poly,rect,line,diamond,put})=>{
    poly([[12,10],[11,6],[15,7],[18,5],[21,6],[20,11],[23,14],[26,21],[24,27],[20,29],[10,28],[7,24],[7,20],[10,14]],'#c5bf9e');
    poly([[18,12],[22,15],[25,21],[23,26],[19,28],[12,27],[18,25],[20,20]],'#969c86',null);
    poly([[12,13],[16,12],[19,15],[20,19],[18,25],[11,25],[9,22],[10,17]],'#e1d7b2',null);
    rect(11,10,10,3,INK);rect(12,10,8,2,'#629890');rect(13,10,2,1,'#aad2b4');line(20,12,23,16,'#53867f');line(20,12,18,15,'#75a592');
    poly([[12,18],[21,18],[22,23],[12,24],[10,21]],'#b5d0b9',null);
    line(12,21,14,20,'#558d8a');line(14,20,16,22,'#558d8a');line(16,22,18,20,'#558d8a');line(18,20,20,21,'#558d8a');
    diamond(7,8,2,3,'#dfe9d1');put(7,6,'#f6efd1');diamond(24,7,2,2,'#a9c9c6');put(23,6,'#e6ecd6');
    rect(10,16,1,3,'#f0e5c1');line(11,26,16,27,'#e7d4a5');put(22,25,'#bdba9c');
  }),
  orb:sprite(({poly,diamond,rect,line,put})=>{
    poly([[12,4],[21,4],[27,10],[28,19],[23,26],[15,29],[8,25],[4,18],[5,10]],'#508c8c');
    poly([[12,6],[20,6],[25,11],[23,18],[15,24],[8,20],[7,12]],'#8fc6b8',null);
    poly([[20,6],[25,11],[26,18],[22,24],[15,27],[15,20],[21,15]],'#437583',null);
    poly([[9,10],[14,7],[19,7],[16,14],[10,17],[7,14]],'#c8e4c9',null);
    poly([[10,18],[15,16],[21,17],[20,21],[15,24]],'#77b2a9',null);
    line(8,22,13,25,'#a3bda0');line(22,9,25,12,'#aed8c5');
    diamond(16,16,6,7,'#396b78');poly([[16,10],[18,14],[22,16],[18,18],[16,22],[14,18],[10,16],[14,14]],'#dfca8b',null);diamond(16,16,2,3,CREAM,null);
    poly([[5,10],[8,8],[9,10],[7,13],[5,14]],GOLD);put(6,10,CREAM);
    poly([[25,17],[28,17],[27,21],[25,23],[23,21]],'#bd9966');put(26,18,'#ead398');
    poly([[11,25],[14,26],[14,29],[10,27]],'#c9aa72');put(12,26,'#efdba3');
  }),
  greatorb:sprite(({poly,diamond,line,rect,put})=>{
    poly([[16,2],[23,6],[28,15],[25,23],[17,30],[8,25],[4,17],[7,8]],'#a08d70');
    poly([[16,4],[22,8],[25,15],[23,22],[16,27],[10,23],[7,17],[9,10]],'#61779d');
    poly([[16,5],[20,9],[17,15],[10,19],[8,16],[10,10]],'#9caad0',null);
    poly([[20,10],[24,15],[22,21],[16,26],[16,17]],'#3d617e',null);
    poly([[11,21],[16,18],[19,21],[16,25]],'#69a7a4',null);
    poly([[16,8],[18,13],[23,15],[18,18],[16,24],[14,18],[9,15],[14,13]],'#ddbc78');
    poly([[16,11],[17,14],[20,15],[17,17],[16,20],[15,17],[12,15],[15,14]],'#f9e9b8',null);put(16,15,'#ffffff');
    poly([[4,13],[8,14],[9,17],[7,20],[3,18]],GOLD);rect(4,14,2,2,CREAM);
    poly([[24,12],[28,12],[29,16],[26,20],[24,17]],'#c9a66d');rect(26,13,2,2,'#ead6a0');
    poly([[10,4],[13,6],[11,10],[8,9],[8,5]],GOLD);put(9,5,CREAM);
    poly([[20,4],[24,4],[23,9],[20,10],[19,7]],GOLD);rect(21,5,2,1,CREAM);
    poly([[14,26],[18,26],[19,28],[16,31],[13,28]],'#c6a06a');put(16,27,CREAM);
    put(27,3,'#e3d6a4');rect(26,4,3,1,'#cfbf95');put(27,5,'#e3d6a4');
  }),
  emberCharm:sprite(({poly,rect,line,ring,put})=>{
    ring(16,4);rect(15,7,3,4,INK);rect(16,7,1,3,GOLD);
    poly([[12,9],[20,9],[25,14],[26,20],[21,27],[16,30],[10,27],[6,20],[7,14]],'#ad815b');
    poly([[12,11],[19,11],[23,15],[24,20],[20,25],[16,28],[11,25],[8,20],[9,15]],'#e1b678',null);
    poly([[13,12],[19,12],[22,16],[22,21],[18,25],[15,26],[11,22],[10,18]],'#5c5c56');
    poly([[17,12],[19,16],[20,18],[21,16],[22,20],[20,24],[16,27],[12,24],[11,20],[13,17],[14,19],[15,15]],'#ce795b',null);
    poly([[17,15],[18,20],[20,20],[19,23],[16,25],[13,23],[13,21],[15,19],[15,21]],'#efb576',null);
    poly([[16,20],[18,22],[17,24],[15,24],[14,22]],'#fae2a5',null);
    line(9,14,12,11,'#fae2ab');put(22,15,'#f0d192');line(11,26,15,28,'#805d4e');put(23,21,'#f2cf8c');
    rect(7,17,1,3,'#eac187');rect(16,10,1,1,'#e8c98f');
  }),
  shellCharm:sprite(({poly,oval,rect,line,ring,put})=>{
    ring(16,4);line(16,7,13,11,INK,2);line(16,7,13,11,GOLD);put(14,9,CREAM);
    poly([[13,10],[20,10],[25,14],[26,19],[24,23],[28,27],[24,28],[21,25],[17,27],[11,26],[6,22],[4,17],[7,12]],'#97b7a8');
    oval(15,18,10,8,'#c9baa0',null);oval(14,17,8,7,'#efd8ae',null);
    poly([[21,13],[24,16],[25,20],[22,23],[27,27],[24,27],[20,23],[16,24],[21,19]],'#a88976',null);
    poly([[20,17],[23,19],[21,23],[18,24],[18,21]],'#527c7c',null);
    line(9,12,15,11,'#fff0c4');line(7,14,6,18,'#dfc69e');line(7,20,10,23,'#b3967c');
    line(10,15,13,13,'#b18e74');line(13,13,17,13,'#b18e74');line(17,13,20,16,'#b18e74');line(20,16,20,19,'#b18e74');line(20,19,17,22,'#b18e74');line(17,22,13,22,'#b18e74');line(13,22,10,19,'#b18e74');line(10,19,10,17,'#b18e74');
    line(12,16,15,15,'#997963');line(15,15,17,17,'#997963');rect(15,18,2,2,'#997963');put(14,18,'#e1c495');rect(12,16,2,1,CREAM);
    line(10,25,16,26,'#6f958d');put(23,25,'#dfc391');
  }),
  featherCharm:sprite(({poly,line,rect,put})=>{
    poly([[8,28],[11,22],[11,16],[14,10],[19,5],[26,2],[27,6],[25,13],[22,18],[18,22],[13,23],[10,29]],'#76afa2');
    poly([[14,20],[14,14],[19,8],[25,4],[23,10],[20,16]],'#dce2b7',null);
    poly([[13,21],[14,16],[17,16],[18,13],[21,13],[22,9],[25,8],[24,13],[21,17],[17,20]],'#b5d5ac',null);
    poly([[16,11],[20,7],[24,4],[23,7],[20,8],[18,12]],'#f1e8bc',null);
    line(9,27,23,7,INK);line(10,27,24,7,'#e3c889');
    line(14,19,14,15,'#7da898');line(17,15,17,11,'#7da898');line(19,12,19,9,'#a5c2a1');
    line(16,19,19,18,'#85b6a0');line(19,15,22,14,'#85b6a0');
    put(11,18,INK);put(12,16,INK);put(13,13,INK);put(23,17,INK);put(21,19,INK);
    line(8,25,11,28,'#a57e5b',2);line(9,24,12,27,'#e0bd7c');put(9,24,CREAM);put(11,26,CREAM);
    rect(7,28,2,2,'#bd996a');put(8,28,'#e7c889');
  }),
  heartCharm:sprite(({poly,rect,line,ring,put})=>{
    ring(16,3);rect(15,6,3,4,INK);rect(16,6,1,3,GOLD);
    poly([[11,9],[21,9],[24,12],[8,12]],'#b99c69');rect(11,9,10,1,'#e4c791');rect(8,12,17,2,INK);rect(9,12,15,1,'#e1c58b');
    poly([[9,14],[13,13],[16,16],[19,13],[23,14],[25,17],[24,22],[20,27],[16,30],[12,27],[8,22],[7,17]],'#b98c71');
    poly([[10,15],[13,15],[16,18],[19,15],[22,15],[23,18],[22,22],[19,26],[16,28],[13,26],[10,22],[9,18]],'#d09284',null);
    poly([[10,16],[13,16],[16,19],[19,16],[21,16],[22,18],[21,21],[18,24],[16,26],[13,23],[10,20]],'#e9b1a0',null);
    poly([[21,18],[23,18],[22,22],[19,26],[16,28],[16,25],[20,21]],'#bd7b77',null);
    poly([[14,18],[16,20],[18,18],[20,19],[19,22],[16,25],[13,22],[12,20]],'#f2cd9b',null);
    rect(11,16,2,2,'#f9e5be');put(14,18,'#f6d2ac');put(20,16,'#f8dbc0');put(16,23,'#fff0bd');
    line(9,21,12,25,'#e6bf84');line(20,26,23,22,'#e8bb81');put(16,29,'#efd197');rect(11,10,1,2,'#f7dfac');rect(20,10,1,2,'#f7dfac');
  }),
  herb:sprite(({poly,line,rect,put})=>{
    line(12,29,20,7,INK,2);line(13,28,21,7,'#6d9d75');line(14,24,8,16,INK,2);line(15,23,9,16,'#7cad7c');
    poly([[15,22],[10,22],[6,19],[4,14],[5,12],[10,14],[14,18]],'#568b75');
    poly([[6,14],[10,15],[13,19],[10,18]],'#91ba89',null);line(7,16,13,21,'#afc793');
    poly([[17,23],[18,18],[23,14],[28,13],[27,18],[23,22]],'#80b891');
    poly([[19,21],[22,17],[26,15],[24,18]],'#b7d4a2',null);line(18,23,24,18,'#527f72');
    poly([[18,15],[13,14],[10,10],[11,6],[15,7],[18,10]],'#74aa87');
    poly([[12,8],[15,9],[17,12],[15,12]],'#b5d2a1',null);line(14,10,17,14,'#507e6e');
    poly([[20,11],[20,7],[23,3],[27,3],[28,6],[25,10]],'#b4cebb');
    poly([[22,7],[24,4],[26,4],[25,7],[24,8]],'#edf0cc',null);poly([[24,8],[27,5],[26,9],[23,10]],'#88abae',null);put(25,3,'#faf0c9');
    line(11,26,16,28,INK,2);line(11,26,16,28,GOLD);put(12,26,CREAM);rect(11,28,2,2,'#8daa7e');rect(15,28,1,2,'#92b284');
  }),
  shard:sprite(({poly,line,rect,put})=>{
    poly([[5,13],[10,9],[15,12],[18,25],[12,29],[6,23]],'#5e999a');
    poly([[7,14],[10,11],[12,14],[13,25],[8,22]],'#9fcfc1',null);poly([[12,13],[14,14],[16,24],[13,26]],'#447f8c',null);line(7,15,8,20,'#dfebcf');
    poly([[16,6],[23,2],[27,9],[25,18],[20,28],[15,30],[12,22]],'#75b8b1');
    poly([[17,7],[22,4],[23,10],[19,17],[14,24],[14,19]],'#b9ddc6',null);
    poly([[23,4],[26,9],[23,16],[22,22],[17,28],[20,16]],'#3d7c8c',null);
    poly([[17,17],[21,12],[22,13],[20,20],[15,27]],'#86b8c0',null);
    line(18,7,21,5,'#f0f1d3');line(16,10,15,15,'#e3ebce');put(24,10,'#b5d8c5');
    line(18,14,21,15,'#467a87');line(21,15,20,18,'#467a87');put(18,16,'#d1e1c6');
    poly([[24,19],[27,17],[29,21],[26,27],[21,29]],'#689dad');
    poly([[26,19],[27,20],[25,25],[23,27]],'#b2d4c9',null);line(23,28,26,25,'#427988');
    poly([[3,25],[5,24],[6,27],[4,29]],'#81b6b0');put(4,25,'#d1e4c5');put(28,29,'#8dbdaf');
  }),
};

Object.assign(ICONS,{
 voyageCharm:sprite(({poly,rect,line,ring,put})=>{
  ring(16,3);line(16,6,16,25,INK,3);line(16,7,16,24,GOLD);
  poly([[14,8],[5,20],[14,20]],'#e1cea0');poly([[18,9],[26,21],[18,20]],'#86bbaa');
  line(12,12,8,18,CREAM);line(19,13,23,19,'#b6d9bc');
  poly([[5,24],[26,24],[22,29],[10,29]],'#95755a');rect(9,24,13,2,GOLD);put(13,25,CREAM);line(11,28,21,28,'#5e726b');
 }),
 harborCharm:sprite(({poly,line,oval,ring,put})=>{
  ring(16,3);line(16,6,16,10,GOLD,2);
  oval(12,16,6,8,'#b3936b');oval(12,16,3,5,INK,null);
  oval(20,20,6,8,'#d1b17e');oval(20,20,3,5,INK,null);
  poly([[10,10],[14,10],[23,26],[20,29]],'#dbbf88');
  line(12,10,22,27,CREAM);line(9,13,9,17,'#f2d79c');line(24,17,25,21,'#eed9a8');
  line(6,26,11,28,'#a3bcaa',2);put(8,26,CREAM);line(21,11,27,13,'#a3bcaa',2);
 }),
 hearthCharm:sprite(({poly,rect,line,ring,diamond})=>{
  ring(16,3);poly([[11,9],[16,6],[21,9],[23,12],[9,12]],'#aa8c64');
  poly([[9,13],[23,13],[21,27],[16,30],[11,27]],'#c2ab7b');
  poly([[12,15],[20,15],[19,25],[16,27],[13,25]],'#e9c98f');
  diamond(16,21,3,5,'#f9eab9',null);line(10,13,12,26,'#678f8a',2);line(22,13,20,26,'#678f8a',2);
  rect(8,11,17,2,INK);rect(9,11,15,1,CREAM);rect(12,27,9,2,INK);rect(13,27,7,1,GOLD);
 }),
 horizonCharm:sprite(({poly,oval,line,ring,diamond,put})=>{
  ring(16,3);line(16,6,16,9,GOLD,2);
  oval(16,17,10,10,'#b19a78');oval(16,17,8,8,'#77aaa8');
  poly([[10,11],[16,9],[21,12],[18,17],[11,20],[9,16]],'#bad9c0',null);
  poly([[20,12],[23,17],[19,23],[13,24],[17,18]],'#527e95',null);
  line(8,18,23,18,'#dce1b6');diamond(17,13,2,3,CREAM,null);
  line(19,25,23,29,INK,3);line(20,25,24,29,GOLD,2);put(22,27,CREAM);line(9,12,11,10,CREAM);
 })
});

Object.assign(ICONS,{
 coastfruit:sprite(({oval,poly,line,rect,put})=>{oval(16,21,11,9,'#ba675e');oval(13,18,8,7,'#e9a481',null);poly([[16,12],[16,7],[20,4],[24,5],[21,10]],'#91b983');line(16,13,16,8,'#765e48',2);rect(8,17,3,2,'#f4c79e');put(23,22,'#91565a');line(12,27,18,28,'#914f58');}),
 oatflour:sprite(({poly,rect,line,oval})=>{poly([[10,5],[23,5],[21,11],[26,25],[23,29],[8,29],[5,25],[10,12]],'#c1ad7d');poly([[11,12],[19,12],[22,25],[18,27],[9,26],[8,22]],'#e2d1a0',null);rect(9,9,14,3,'#6a9485');line(12,19,20,19,'#ae8c5f');line(16,15,16,24,'#a58355');for(const y of [16,19,22]){oval(13,y,2,1,'#c4a66a',null);oval(19,y-1,2,1,'#c4a66a',null);}}),
 warmspice:sprite(({poly,rect,oval,diamond,line})=>{rect(11,4,12,5,INK);rect(12,4,10,3,'#c9a46c');poly([[10,10],[24,10],[26,26],[23,29],[10,29],[7,26]],'#ae7658');poly([[11,12],[22,12],[23,25],[19,27],[10,25]],'#d59b63',null);rect(9,17,16,7,'#e8d3a1');diamond(17,20,4,3,'#a16d50',null);line(11,12,10,15,CREAM);}),
 seasalt:sprite(({poly,oval,rect,line,put})=>{poly([[10,4],[22,4],[21,12],[26,26],[22,29],[9,29],[5,26],[11,12]],'#8eaeb0');poly([[11,16],[21,16],[23,25],[20,27],[10,27],[8,24]],'#e0e5cc',null);rect(9,9,15,3,'#4e777c');line(11,20,20,20,'#acc8ba');for(const [x,y] of [[11,22],[16,24],[20,22],[13,26],[18,18]])put(x,y,'#fff3d6');}),
 fruitparcel:sprite(({poly,oval,line,rect,put})=>{poly([[4,19],[12,12],[23,13],[29,20],[24,28],[8,28]],'#729675');poly([[7,20],[13,9],[21,9],[26,20],[22,25],[11,25]],'#e2c18b');oval(13,18,4,4,'#c77669',null);oval(21,18,4,4,'#e1a071',null);poly([[8,24],[17,20],[26,24],[23,28],[10,28]],'#a9be86');line(16,21,18,28,CREAM);rect(15,24,5,2,GOLD);put(12,16,'#f7cf9e');}),
 harborbread:sprite(({poly,oval,line,rect,put})=>{poly([[3,23],[27,20],[29,26],[7,30]],'#719c95');oval(15,19,12,9,'#a77c55');oval(14,16,11,7,'#deb47c',null);line(8,13,10,19,'#b3845a',2);line(14,11,16,18,'#b3845a',2);line(20,13,21,17,'#b3845a',2);for(const [x,y] of [[7,16],[13,14],[18,19],[22,17],[11,21]])put(x,y,CREAM);}),
 embertoast:sprite(({oval,poly,line,rect,put})=>{oval(16,25,14,5,'#749b95');oval(16,21,12,7,'#a8774f');oval(16,18,12,7,'#dba16b');oval(15,16,10,5,'#e9c78a',null);line(8,17,22,17,'#b58053');line(15,11,15,21,'#b58053');for(const [x,y] of [[9,14],[20,14],[12,20],[22,18]]){rect(x,y,2,1,'#bb7654');put(x,y-1,'#8b9b68');}}),
 windcracker:sprite(({poly,line,rect,put})=>{poly([[3,21],[13,8],[29,15],[22,28],[10,30]],'#739b8b');poly([[7,20],[13,6],[23,9],[18,24]],'#caa571');poly([[12,22],[19,8],[28,12],[22,27]],'#e6ca90');line(16,22,23,12,'#f1dba8');for(const [x,y] of [[14,11],[13,16],[17,12],[20,17],[23,14],[20,22],[10,20]]){put(x,y,'#ac885c');put(x+1,y+1,'#bcaf77');}}),
 snowbroth:sprite(({poly,oval,rect,line,put})=>{poly([[4,17],[28,17],[26,25],[21,29],[11,29],[6,25]],'#719a9e');oval(16,17,12,5,'#c8d8bf');oval(16,17,10,3,'#c9ae76',null);oval(11,16,3,2,'#eee1b4',null);oval(20,18,3,2,'#97b084',null);line(9,22,23,22,'#b5c8b0');rect(10,25,12,1,'#4f808a');line(11,12,9,9,'#adc3b4');line(9,9,11,6,'#adc3b4');line(20,11,22,7,'#c4d0b8');put(20,5,'#dbe0c4');}),
 mossbrew:sprite(({poly,oval,line,rect})=>{oval(25,18,5,5,'#88a99c');oval(25,18,2,2,INK,null);poly([[5,13],[23,13],[22,25],[18,28],[9,27],[6,24]],'#a4b5a0');oval(14,13,9,4,'#d2d7b2');oval(14,13,7,2,'#77957a',null);line(8,19,20,19,'#d2d7b2');poly([[12,18],[15,22],[13,25],[10,22]],'#6a8d78',null);line(12,8,15,4,'#abc3a9');line(18,9,20,6,'#cbd5b3');}),
 lanternstew:sprite(({oval,poly,rect,line})=>{rect(1,17,5,4,'#988766');rect(26,17,5,4,'#988766');poly([[4,15],[28,15],[26,26],[22,29],[10,29],[6,25]],'#9e7858');oval(16,15,12,5,'#c0a67a');oval(16,15,10,3,'#b97955',null);oval(11,15,3,2,'#d6b777',null);oval(20,14,3,2,'#a5b179',null);line(8,23,24,23,'#d4b685');rect(11,26,10,1,'#745b4b');line(11,10,13,6,'#bdb99b');line(19,9,18,4,'#d8c7a6');}),
 starcake:sprite(({poly,oval,line,diamond,put})=>{oval(16,26,14,4,'#71979f');poly([[6,18],[25,14],[25,24],[8,28]],'#94728e');poly([[6,13],[22,7],[27,14],[11,21]],'#e0cfa2');poly([[8,20],[25,15],[25,19],[8,24]],'#d9bca6',null);poly([[7,13],[22,8],[26,14],[11,20]],'#e8dec0',null);diamond(17,12,4,4,'#d4ad6c',null);diamond(17,12,2,2,CREAM,null);put(12,15,'#8fa995');put(23,13,'#ae8ab0');line(10,25,23,21,'#ba90a4');})
});

Object.assign(ICONS,{tidalCharm:sprite(({poly,oval,line,ring,put})=>{
 ring(16,3);line(16,6,16,11,GOLD,2);oval(16,20,10,9,'#77a99e');oval(16,20,6,5,INK,null);
 poly([[10,12],[14,13],[23,27],[19,29]],'#dfc18b');poly([[21,12],[24,15],[12,28],[8,25]],'#94c9b1');
 line(11,14,20,27,CREAM);line(22,14,10,26,'#d2e1b6');put(16,20,GOLD);
})});

/** Draw an original item at x/y, scaled from 32px; returns false for unknown IDs. */
export function drawItemIcon(ctx,id,x=0,y=0,size=32){
  if(!ctx||!Number.isFinite(x)||!Number.isFinite(y)||!Number.isFinite(size)||size<=0||!Object.hasOwn(ICONS,id))return false;
  ctx.save();
  try{
    ctx.translate(x,y);ctx.scale(size/32,size/32);ctx.imageSmoothingEnabled=false;
    let color;
    for(const run of ICONS[id]){if(color!==run.color){color=run.color;ctx.fillStyle=color;}ctx.fillRect(run.x,run.y,run.w,run.h);}
  }finally{ctx.restore();}
  return true;
}
