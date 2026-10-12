/* Original scenic pixel assets for Starfall Chronicle.
 * time is in seconds. Public square sprites use a top-left anchor.
 * Scene generation runs only on a cache miss: 2 vista sizes, 8 landmarks.
 */
const INK='#122b3b', CREAM='#ecdeb2', GOLD='#dfbd79';
const vistas=new Map(), landmarks=new Map();

function canvas(w,h){
  if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);
  if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
  return null;
}
function r(c,x,y,w,h,color){if(w<=0||h<=0)return;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function fill(c,points,color,dx=0,dy=0){
  c.fillStyle=color;let low=Infinity,high=-Infinity;
  for(const pt of points){low=Math.min(low,pt[1]);high=Math.max(high,pt[1]);}
  for(let y=Math.floor(low);y<Math.ceil(high);y++){
    const xs=[],sy=y+.5;
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const a=points[i],b=points[j];
      if((a[1]<=sy&&b[1]>sy)||(b[1]<=sy&&a[1]>sy))xs.push(a[0]+(sy-a[1])/(b[1]-a[1])*(b[0]-a[0]));
    }
    xs.sort((a,b)=>a-b);
    for(let i=0;i+1<xs.length;i+=2){const start=Math.ceil(xs[i]);c.fillRect(start+dx,y+dy,Math.max(1,Math.floor(xs[i+1])-start+1),1);}
  }
}
function p(c,points,color,outline=INK){
  if(outline){fill(c,points,outline,-1,0);fill(c,points,outline,1,0);fill(c,points,outline,0,-1);fill(c,points,outline,0,1);}
  fill(c,points,color);
}
function disk(c,x,y,rx,ry,color){
  c.fillStyle=color;
  for(let py=Math.floor(y-ry);py<=Math.ceil(y+ry);py++){
    const v=(py+.5-y)/ry;if(Math.abs(v)>1)continue;
    const reach=rx*Math.sqrt(1-v*v),left=Math.ceil(x-reach);
    c.fillRect(left,py,Math.max(1,Math.floor(x+reach)-left+1),1);
  }
}
function e(c,x,y,rx,ry,color,outline=INK){if(outline)disk(c,x,y,rx+1,ry+1,outline);disk(c,x,y,rx,ry,color);}
function line(c,x,y,tx,ty,color,width=1){
  x=Math.round(x);y=Math.round(y);tx=Math.round(tx);ty=Math.round(ty);
  const dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;let err=dx+dy;
  for(;;){r(c,x,y,width,width,color);if(x===tx&&y===ty)break;const q=err*2;if(q>=dy){err+=dy;x+=sx;}if(q<=dx){err+=dx;y+=sy;}}
}
function diamond(c,x,y,a,color,outline=null){p(c,[[x,y-a],[x+a,y],[x,y+a],[x-a,y]],color,outline);}
function star(c,x,y,color,a=3){r(c,x,y-a,1,a*2+1,color);r(c,x-a,y,a*2+1,1,color);}
function mix(a,b,t){let out='#';for(let i=1;i<7;i+=2)out+=Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0');return out;}
function rnd(i,s=13){let h=Math.imul((i|0)^s,0x45d9f3b);h=Math.imul(h^(h>>>16),0x45d9f3b);return((h^(h>>>16))>>>0)/4294967296;}
function window(c,x,y,w=7,h=10,color='#ebc57f'){
  r(c,x-1,y-1,w+2,h+2,INK);r(c,x,y,w,h,color);r(c,x+1,y+1,w-2,2,'#fff0bc');
  r(c,x+Math.floor(w/2),y,1,h,'#6d705f');r(c,x,y+Math.floor(h/2),w,1,'#6d705f');r(c,x-2,y+h,w+4,2,'#a4b2a0');
}
function arch(c,x,y,w,h,color,frame='#a9b8ac'){
  p(c,[[x,y+h],[x,y+5],[x+4,y],[x+w-4,y],[x+w,y+5],[x+w,y+h]],frame,INK);
  p(c,[[x+3,y+h],[x+3,y+7],[x+6,y+3],[x+w-6,y+3],[x+w-3,y+7],[x+w-3,y+h]],color,null);
}
function steps(c,x,y,w,n=3,color='#a6b3a2'){
  for(let i=0;i<n;i++){r(c,x-i*2,y+i*3,w+i*4,3,INK);r(c,x-i*2,y+i*3,w+i*4,1,color);r(c,x-i*2+1,y+i*3+1,w+i*4-2,1,'#637e7e');}
}
function bush(c,x,y,s=1,berry=false){
  e(c,x,y,7*s,4*s,'#356d65',INK);e(c,x-2*s,y-2*s,5*s,3*s,'#639c78',null);
  r(c,x-4*s,y-3*s,4*s,s,'#9cbc88');if(berry){r(c,x+3*s,y-2*s,2*s,2*s,'#d6ac8a');r(c,x-3*s,y,2*s,2*s,'#c694a2');}
}
function lantern(c,x,y,small=false){
  r(c,x,y+3,2,small?7:12,INK);r(c,x-3,y-3,8,7,INK);r(c,x-2,y-2,6,5,'#d3ad70');r(c,x-1,y-1,2,3,'#f9df9f');r(c,x-4,y-4,10,2,'#789590');
}
function base(c,color='#80998c'){
  e(c,64,120,54,6,'#0d263d55',null);
  p(c,[[16,107],[37,101],[92,101],[113,109],[115,118],[99,123],[31,123],[12,117]],color,INK);
  line(c,19,116,41,120,'#bed0ad');line(c,87,120,110,115,'#bed0ad');
  r(c,22,111,12,1,'#b1c5a4');r(c,94,109,9,1,'#b1c5a4');
}

function lighthouse(c){
  base(c,'#547f72');
  p(c,[[48,110],[55,97],[64,100],[65,116],[78,120],[53,122]],'#b6b698',null);
  p(c,[[60,31],[88,31],[96,108],[55,108]],'#a4bcb0',INK);
  p(c,[[65,32],[78,32],[81,108],[61,108]],'#e0dec1',null);
  p(c,[[79,32],[87,32],[94,108],[82,108]],'#75979a',null);
  r(c,60,47,30,7,'#3d7780');r(c,63,47,16,2,'#77b6ab');r(c,57,78,36,5,'#477e85');
  r(c,65,36,6,2,'#f0e9c6');r(c,66,64,6,2,'#ece0ba');r(c,83,92,7,1,'#587d89');
  window(c,70,58,7,11);window(c,68,86,8,14,'#f0c87d');
  arch(c,68,94,15,18,'#254958','#bcc7aa');r(c,72,100,7,12,'#405e5c');r(c,77,105,2,2,GOLD);
  r(c,54,29,43,4,INK);r(c,54,30,43,2,'#9caf9d');
  r(c,58,15,35,15,INK);r(c,60,17,31,11,'#bc985f');
  r(c,62,18,8,9,'#f5d18e');r(c,73,17,8,11,'#fff0b5');r(c,84,18,5,9,'#d5ac71');
  r(c,70,16,2,13,'#4a635e');r(c,82,16,2,13,'#4a635e');r(c,60,26,31,2,'#e7c28a');
  p(c,[[56,15],[62,9],[71,5],[81,5],[90,10],[96,16]],'#526e7c',INK);
  p(c,[[63,10],[71,6],[80,6],[88,11],[67,11]],'#8aaca6',null);
  r(c,75,1,2,5,'#c6bb87');diamond(c,76,2,2,'#e6ce91',null);
  r(c,51,25,48,1,'#93ada2');r(c,51,27,48,1,'#536d73');
  for(let x=52;x<=98;x+=7)r(c,x,24,1,6,'#bac9ad');
  r(c,17,85,36,26,INK);r(c,19,87,32,23,'#b5bea0');r(c,20,106,30,4,'#80978b');
  p(c,[[13,86],[21,73],[42,73],[56,87]],'#487d83',INK);
  p(c,[[18,82],[23,75],[41,75],[49,83]],'#80ada2',null);line(c,18,82,49,82,'#426e79');
  window(c,23,92,7,9);window(c,39,92,7,9);r(c,24,104,20,1,'#d8d5af');
  r(c,22,64,3,10,INK);r(c,21,63,5,2,'#8aa39c');
  steps(c,65,112,22,3,'#dbd6b0');
  line(c,96,73,106,64,'#8aa298');r(c,105,55,2,25,INK);p(c,[[107,56],[121,60],[107,64]],'#ce9977',INK);
  bush(c,17,112,.85,true);bush(c,97,110,.8,true);bush(c,111,116,.6);
  r(c,54,63,2,21,'#5e987a');r(c,51,74,5,3,'#84af88');r(c,53,68,4,2,'#75a587');
  lantern(c,44,107,true);
}

function mirrorArchive(c){
  e(c,64,116,54,10,'#1f4f66',INK);e(c,64,115,49,7,'#538c95',null);e(c,64,114,37,4,'#72aea8',null);
  r(c,21,70,85,40,INK);r(c,23,72,81,36,'#a4bab7');r(c,26,75,76,31,'#ced5b7');
  p(c,[[14,74],[27,58],[45,58],[45,75]],'#57999f',INK);p(c,[[83,75],[83,58],[101,58],[114,74]],'#57999f',INK);
  p(c,[[18,72],[28,61],[40,61],[37,68]],'#aad6c8',null);p(c,[[89,61],[99,61],[108,71],[92,68]],'#aad6c8',null);
  r(c,36,38,57,70,INK);r(c,39,38,51,69,'#9bb7b8');r(c,43,39,39,67,'#d2d9bf');r(c,82,41,6,65,'#6f969e');
  e(c,64,31,31,17,'#537f98',INK);p(c,[[34,31],[39,19],[52,9],[65,6],[78,12],[89,23],[94,33]],'#7bb9be',INK);
  p(c,[[42,22],[53,12],[63,9],[58,24],[40,31]],'#bcddd0',null);
  p(c,[[65,9],[71,14],[75,29],[61,32]],'#8ebcc4',null);line(c,64,8,61,34,'#3c6a86');line(c,77,14,82,33,'#3c6a86');
  r(c,32,33,64,4,'#a8c8b8');r(c,34,37,60,2,'#476d80');
  diamond(c,65,4,3,'#e1d2a7',INK);
  arch(c,48,43,33,62,'#497d9b','#9bc5c0');
  p(c,[[53,53],[60,47],[73,47],[76,54],[76,91],[70,102],[53,102]],'#648fac',null);
  p(c,[[53,57],[70,48],[73,48],[54,78]],'#bcded2',null);p(c,[[55,88],[75,63],[75,70],[56,95]],'#8cc6c5',null);
  r(c,63,48,2,56,'#bfd8c2');r(c,53,75,23,2,'#bfd8c2');
  for(let x of [40,84]){r(c,x,44,3,60,'#5b8d98');r(c,x-1,42,6,3,'#e1ddbb');r(c,x-1,101,6,5,'#d2d5b3');}
  window(c,27,82,8,14);window(c,94,82,8,14);
  r(c,26,99,10,2,'#739187');r(c,95,99,10,2,'#739187');
  steps(c,48,107,34,4,'#dce0bc');
  for(let side of [0,1]){const x=side?110:15;line(c,x,112,x-2,89,'#5f7d6e',2);line(c,x-1,96,x+(side?7:-6),88,'#5f7d6e');e(c,x-4,89,7,4,'#719a8a',INK);e(c,x+3,92,5,3,'#8cb79b',null);r(c,x-5,90,2,6,'#a6c3a1');r(c,x+4,93,1,7,'#b7c7a2');}
  r(c,20,115,12,1,'#b8d7bf');r(c,91,119,12,1,'#a6cbbd');
}

function gear(c,x,y,rad,color){
  const points=[];for(let i=0;i<32;i++){const a=i*Math.PI/16,radius=i%4<2?rad:rad-3;points.push([Math.round(x+Math.cos(a)*radius),Math.round(y+Math.sin(a)*radius)]);}p(c,points,color,INK);
}
function furnace(c){
  base(c,'#746f68');
  p(c,[[82,17],[102,17],[105,76],[78,76]],'#756c6c',INK);r(c,85,18,8,56,'#a78675');r(c,97,22,4,49,'#4b5764');
  r(c,78,13,27,6,'#465b66');r(c,80,14,23,2,'#b4977c');r(c,81,28,24,4,'#455563');r(c,82,49,22,4,'#455563');
  r(c,85,2,13,11,'#37505e');r(c,89,0,6,4,'#405666');r(c,80,7,13,6,'#415363');
  r(c,23,36,13,42,INK);r(c,25,37,9,39,'#a2826b');r(c,22,35,15,4,'#485b65');r(c,26,25,7,10,'#455a63');
  r(c,17,64,93,45,INK);r(c,19,66,89,40,'#936e60');r(c,21,96,86,12,'#74645e');
  for(let yy=70;yy<108;yy+=8){r(c,20,yy,87,1,'#5f5656');for(let xx=24+(yy%16?10:0);xx<106;xx+=20)r(c,xx,yy+1,1,7,'#5f5656');}
  p(c,[[11,66],[31,42],[73,42],[114,66]],'#586f77',INK);p(c,[[20,62],[34,46],[73,46],[102,62]],'#8c9c94',null);
  line(c,26,55,88,55,'#435d69',2);line(c,34,47,33,61,'#b5b296');line(c,52,47,53,62,'#b5b296');line(c,70,47,75,62,'#b5b296');
  r(c,12,64,102,5,'#42515d');r(c,13,65,100,1,'#c2ac86');
  gear(c,64,88,28,'#415765');e(c,64,88,23,22,'#b28261',INK);e(c,64,88,19,18,'#413a47',INK);
  p(c,[[48,99],[50,87],[54,90],[57,74],[63,84],[68,72],[71,84],[77,80],[80,96],[75,102]],'#c36d5e',null);
  p(c,[[53,101],[57,88],[61,93],[65,81],[68,92],[72,86],[76,100]],'#e9ac6f',null);
  p(c,[[59,101],[63,92],[67,94],[70,101]],'#f8d997',null);
  r(c,46,99,37,5,'#354851');for(let xx=50;xx<83;xx+=8)r(c,xx,98,3,6,'#203843');
  for(const [x,y]of [[64,61],[90,84],[38,84],[64,113]])diamond(c,x,y,2,'#d2ac74',null);
  r(c,105,68,6,29,INK);r(c,106,69,4,25,'#bc9061');r(c,101,92,9,5,'#af835a');r(c,103,74,10,3,'#e0b57b');
  window(c,25,76,9,13,'#f2b373');r(c,22,96,16,9,'#547f81');r(c,23,97,14,2,'#93b8ac');
  p(c,[[8,109],[15,102],[28,104],[32,113],[24,118],[13,118]],'#8b8275',INK);r(c,15,106,10,2,'#c3b497');
  steps(c,46,112,37,3,'#b8a284');lantern(c,113,105,true);
  r(c,96,107,8,2,'#d49b64');r(c,101,110,4,2,'#7f5c53');
}

function suspendedClock(c){
  e(c,64,121,49,5,'#13313e40',null);
  p(c,[[12,104],[28,99],[40,104],[38,118],[24,125],[14,118]],'#658b85',INK);p(c,[[89,105],[105,100],[118,107],[113,120],[99,124]],'#658b85',INK);
  r(c,17,32,9,77,INK);r(c,19,34,5,74,'#a5b99f');r(c,105,30,9,78,INK);r(c,107,32,5,76,'#a5b99f');
  p(c,[[11,34],[21,23],[31,35]],'#799a92',INK);p(c,[[99,32],[109,21],[119,33]],'#799a92',INK);
  line(c,21,26,64,6,'#c8c8a0',2);line(c,64,6,109,24,'#c8c8a0',2);line(c,22,30,63,12,'#607f84');line(c,63,12,107,28,'#607f84');
  for(let yy=15;yy<29;yy+=4){r(c,46,yy,2,3,'#a8b99a');r(c,80,yy,2,3,'#a8b99a');}
  p(c,[[43,24],[82,24],[100,42],[100,69],[81,88],[46,88],[29,70],[29,43]],'#9caf96',INK);
  p(c,[[45,27],[80,27],[96,43],[96,68],[80,84],[47,84],[33,68],[33,44]],'#c4ba8d',INK);
  e(c,64,55,27,27,'#476d79',INK);e(c,64,55,24,24,'#e1d8b1',INK);e(c,64,55,20,20,'#bed1b2',null);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;const xx=Math.round(64+Math.sin(a)*21),yy=Math.round(55-Math.cos(a)*21);r(c,xx-1,yy-1,i%3===0?3:2,i%3===0?3:2,'#557578');}
  line(c,64,55,55,44,'#466371',2);line(c,64,55,78,48,'#466371',2);e(c,65,55,3,3,'#d5b677',INK);
  p(c,[[28,47],[12,41],[9,45],[13,52],[8,54],[20,62],[29,62]],'#79a9a0',INK);p(c,[[100,46],[116,40],[120,44],[116,51],[122,54],[111,62],[100,61]],'#79a9a0',INK);
  line(c,15,46,25,51,'#b7d1af',2);line(c,116,45,105,52,'#b7d1af',2);
  r(c,63,87,3,21,'#4c6e75');r(c,64,87,1,20,'#d7c891');diamond(c,65,109,7,'#cfb980',INK);diamond(c,65,108,3,'#eef0bb',null);
  r(c,20,103,91,3,'#546f6a');for(let xx=24;xx<108;xx+=8){r(c,xx,104,6,3,'#b0b48d');r(c,xx,101,1,4,'#e0d6a8');}
  line(c,23,90,39,101,'#8fa68d');line(c,39,101,87,102,'#8fa68d');line(c,87,102,107,89,'#8fa68d');
  p(c,[[13,39],[4,42],[11,49],[7,57],[14,53]],'#c3c58f',INK);p(c,[[116,37],[125,41],[119,47],[123,56],[115,52]],'#c3c58f',INK);
  bush(c,21,109,.7);bush(c,108,112,.7);r(c,44,117,10,3,'#789a8e');r(c,76,117,9,3,'#789a8e');
}

function observatory(c){
  base(c,'#8ea7ac');
  p(c,[[9,112],[18,102],[38,106],[44,102],[68,108],[85,101],[107,106],[119,114],[112,119],[15,120]],'#d1dfd1',INK);
  r(c,25,51,76,57,INK);r(c,27,54,72,51,'#819eae');r(c,30,57,49,49,'#b2c7c4');r(c,82,57,14,49,'#557b95');
  e(c,63,47,40,35,'#547d9a',INK);p(c,[[23,48],[26,33],[36,20],[49,13],[65,10],[81,15],[96,29],[104,48]],'#6b9caf',INK);
  p(c,[[27,37],[35,23],[48,16],[61,13],[54,27],[51,45],[29,46]],'#a3c8c8',null);
  p(c,[[63,12],[70,13],[77,28],[78,48],[64,49]],'#426d8c',null);
  line(c,45,17,37,47,'#476f8b');line(c,84,20,94,48,'#476f8b');r(c,23,48,81,5,'#3c617b');r(c,25,50,77,2,'#b7d5c8');
  p(c,[[58,40],[96,9],[107,17],[73,53]],'#adbec0',INK);p(c,[[61,39],[97,12],[101,16],[68,47]],'#d0ddd0',null);
  line(c,76,28,85,36,'#527688',3);line(c,88,18,97,27,'#527688',3);
  p(c,[[93,10],[103,3],[117,17],[110,24],[103,24],[91,13]],'#577f98',INK);p(c,[[103,7],[113,17],[109,20],[99,10]],'#91c7ce',INK);line(c,104,10,110,17,'#ddf0dd',2);
  r(c,30,73,68,3,'#7095a4');window(c,34,61,8,10,'#ebca94');window(c,83,63,8,10,'#c7d7ba');window(c,36,85,7,11,'#f1cc89');window(c,83,85,7,11,'#f1cc89');
  arch(c,51,82,23,26,'#24475e','#9ebcb9');r(c,56,89,12,19,'#33586b');r(c,65,98,2,2,'#e4c38c');
  r(c,48,78,29,3,'#ccdbca');steps(c,49,108,28,4,'#dce4ce');
  p(c,[[23,50],[29,45],[36,46],[39,49],[48,47],[49,52],[22,53]],'#d9e5d6',null);
  r(c,10,81,2,26,'#4c7380');line(c,3,87,19,87,'#a1c0bb');line(c,10,78,10,93,'#b9d6cb');diamond(c,11,81,4,'#c5d4b4',INK);
  p(c,[[10,100],[2,115],[19,115]],'#6f9995',INK);p(c,[[10,97],[6,105],[10,104],[14,105]],'#d0dfce',null);
  p(c,[[112,87],[103,108],[120,108]],'#668f91',INK);p(c,[[112,91],[108,100],[111,99],[116,101]],'#c5dacb',null);r(c,112,108,2,7,'#819387');
  r(c,28,111,9,2,'#edf0d8');r(c,89,112,12,2,'#edf0d8');
}

function treeTheatre(c){
  e(c,64,120,54,6,'#102a354f',null);
  p(c,[[42,36],[53,24],[74,29],[87,38],[84,68],[95,93],[110,114],[87,120],[69,112],[45,121],[23,117],[36,97],[43,73]],'#796e6b',INK);
  p(c,[[53,38],[61,36],[61,73],[52,92],[51,113],[42,114],[45,88]],'#a28a78',null);
  p(c,[[72,42],[79,41],[76,80],[86,102],[83,113],[74,99]],'#506268',null);
  p(c,[[47,58],[29,51],[20,35],[10,31],[12,24],[27,29],[36,42],[50,45]],'#786f6b',INK);
  p(c,[[77,53],[95,40],[104,25],[116,24],[118,31],[110,34],[103,50],[85,66]],'#786f6b',INK);
  line(c,47,55,30,47,'#a18c77',2);line(c,83,54,99,40,'#a18c77',2);
  e(c,23,31,20,15,'#335762',INK);e(c,106,31,18,15,'#335762',INK);e(c,64,19,42,16,'#416f6d',INK);
  e(c,28,20,21,14,'#548278',INK);e(c,99,19,22,13,'#4f777c',INK);e(c,65,11,29,10,'#638b7e',INK);
  p(c,[[14,20],[18,13],[31,10],[39,14],[36,20],[26,18],[20,23]],'#91ae8b',null);
  p(c,[[48,8],[57,4],[75,5],[82,10],[71,10],[62,9],[57,12]],'#a5b996',null);
  p(c,[[87,17],[94,11],[108,14],[114,21],[107,23],[102,19],[93,21]],'#8fa59a',null);
  p(c,[[37,29],[47,22],[64,25],[70,33],[61,37],[51,33],[44,35]],'#87a488',null);
  r(c,22,14,5,2,'#c4c7a1');r(c,65,7,6,2,'#c4c7a1');
  for(const [x,y]of [[13,29],[39,15],[84,12],[112,30],[75,28]]){e(c,x,y,2,2,'#cfa7b7',null);r(c,x,y,1,1,'#f4d4b8');}
  arch(c,41,68,45,44,'#162e43','#8b7c70');
  p(c,[[45,73],[55,71],[58,79],[55,90],[49,103],[45,107]],'#8c5977',null);p(c,[[73,72],[82,73],[82,108],[77,99],[72,86]],'#8c5977',null);
  p(c,[[45,74],[49,73],[50,88],[46,99]],'#c58d94',null);p(c,[[78,75],[80,76],[80,99],[77,92]],'#b97f8e',null);
  r(c,46,91,7,3,'#e0bc83');r(c,76,91,6,3,'#e0bc83');
  p(c,[[39,71],[49,65],[78,65],[89,72]],'#a7a288',INK);r(c,49,68,28,2,'#d2c7a1');
  r(c,28,109,72,7,INK);r(c,30,109,68,5,'#a38a70');for(let xx=36;xx<95;xx+=10)r(c,xx,110,1,4,'#695f5c');steps(c,33,116,61,2,'#c6b092');
  line(c,15,40,15,66,'#8da58e');line(c,111,40,111,61,'#8da58e');lantern(c,15,68,true);lantern(c,111,63,true);
  p(c,[[32,65],[36,68],[36,78],[32,83],[28,77],[28,68]],'#c5b69a',INK);r(c,29,71,2,2,'#4e6270');r(c,33,71,2,2,'#4e6270');r(c,31,77,2,1,'#765d6b');
  p(c,[[96,64],[101,68],[100,77],[96,81],[92,77],[92,68]],'#99b4a3',INK);r(c,93,71,2,2,'#4e6270');r(c,97,71,2,2,'#4e6270');line(c,94,76,98,76,'#546978');
  bush(c,16,115,.9,true);bush(c,112,115,.8,true);
  for(const [x,y]of [[19,108],[107,105],[8,117]]){r(c,x,y,1,6,'#b8c2a2');e(c,x,y,3,2,'#9b91b7',INK);r(c,x-1,y-1,2,1,'#e4cfd8');}
  r(c,59,105,11,1,'#b79d88');diamond(c,64,78,3,'#bdbd9b',null);
}

function dawnPalace(c){
  base(c,'#8f9d9e');
  r(c,16,61,98,47,INK);r(c,18,63,94,43,'#b5bfaf');r(c,20,68,89,36,'#d6d7b6');
  for(const x of [15,92]){
    r(c,x,42,23,66,INK);r(c,x+2,44,19,63,'#b3c5b7');r(c,x+3,46,10,59,'#ece2bd');r(c,x+17,46,3,59,'#829d9c');
    p(c,[[x-3,43],[x+5,27],[x+11,20],[x+19,30],[x+25,44]],'#b79d6e',INK);p(c,[[x+3,37],[x+11,24],[x+16,34],[x+15,39]],'#eee0a4',null);
    window(c,x+7,54,7,14,'#e4cd8b');window(c,x+7,81,7,15,'#87aaa1');r(c,x-1,70,25,4,'#8ca6a0');r(c,x,71,23,1,'#e2d7ac');
    r(c,x+10,15,2,7,'#c8b584');diamond(c,x+11,15,2,'#eee6b4',null);
  }
  r(c,45,37,40,71,INK);r(c,47,39,36,67,'#c4cdb5');r(c,50,40,17,65,'#ede5bf');r(c,76,41,6,65,'#879f9f');
  p(c,[[41,42],[49,34],[62,29],[70,29],[87,43]],'#a59a75',INK);r(c,45,42,40,3,'#e1d1a0');
  gear(c,65,29,22,'#b7a06d');e(c,65,29,16,16,'#e2d294',INK);e(c,65,29,12,12,'#91b5ac',INK);
  diamond(c,65,29,9,'#ede7b2',null);diamond(c,65,29,4,'#f9f2c9',null);
  for(const [x,y]of [[65,8],[65,50],[44,29],[86,29]])r(c,x-1,y-1,3,3,'#f5e2ab');
  for(const x of [51,70])window(c,x,56,7,16,'#eace8b');
  arch(c,52,83,26,26,'#3b6170','#bacbb7');r(c,64,87,2,22,'#d1bc86');r(c,56,89,5,11,'#73968d');r(c,69,89,5,11,'#73968d');
  r(c,44,77,42,5,'#8daaa2');r(c,44,78,42,1,'#e5dab0');
  for(const x of [38,87]){r(c,x,73,5,36,'#7a999b');r(c,x-1,72,7,3,'#d5d4ae');r(c,x-1,106,7,3,'#d5d4ae');}
  p(c,[[2,61],[8,56],[15,61],[12,64],[6,63],[7,85],[3,82]],'#bda970',INK);p(c,[[113,62],[120,56],[125,61],[123,83],[119,86],[120,64]],'#bda970',INK);
  steps(c,47,110,36,4,'#e0d7af');
  for(const x of [20,106]){r(c,x-6,111,12,7,'#7d8c83');bush(c,x,108,.9);p(c,[[x,99],[x+4,104],[x+1,108],[x-3,105]],'#d1bc7f',null);}
  r(c,36,117,7,2,'#a8b9a1');r(c,89,117,7,2,'#a8b9a1');
}

function starwell(c){
  e(c,64,115,57,11,'#12223b66',null);e(c,64,110,52,14,'#586b84',INK);e(c,64,106,50,15,'#a0adc0',INK);e(c,64,103,46,15,'#607f9b',INK);e(c,64,100,45,14,'#abbac0',INK);
  e(c,64,99,37,10,'#244a68',INK);e(c,64,99,31,7,'#4f809a',null);e(c,64,100,19,4,'#78b1b9',null);
  line(c,22,109,37,115,'#c1c9c0');line(c,88,116,106,109,'#c1c9c0');r(c,45,117,9,1,'#c1c9c0');
  p(c,[[61,50],[67,50],[69,96],[65,104],[59,96]],'#99c5bf45',null);r(c,63,53,2,47,'#c7d8bb55');
  p(c,[[32,62],[23,50],[25,34],[35,22],[43,17],[48,20],[37,29],[32,38],[31,49],[36,58]],'#8c9fb5',INK);
  p(c,[[84,18],[96,25],[104,37],[104,50],[98,61],[91,63],[91,57],[98,45],[96,35],[88,26],[81,23]],'#8c9fb5',INK);
  p(c,[[50,13],[59,8],[72,9],[80,14],[78,19],[68,16],[59,16],[53,20]],'#b4bebd',INK);
  p(c,[[37,67],[45,72],[53,75],[53,82],[43,79],[35,73]],'#829caf',INK);p(c,[[76,76],[86,71],[92,65],[97,69],[90,78],[79,83]],'#829caf',INK);
  line(c,27,41,31,30,'#d2d9c5');line(c,93,27,99,37,'#d2d9c5');line(c,59,11,71,12,'#e5e2c2');
  for(const [x,y]of [[31,45],[40,27],[89,29],[98,46],[63,13],[43,73],[85,75]]){diamond(c,x,y,2,'#a5d5d0',null);r(c,x,y-1,1,2,'#e8e9c4');}
  p(c,[[64,25],[69,37],[83,43],[70,48],[64,62],[59,49],[46,43],[59,38]],'#d7c598',INK);
  p(c,[[64,29],[66,39],[75,43],[66,45],[64,56],[61,46],[52,43],[61,40]],'#f0e6b6',null);
  diamond(c,64,43,5,'#b6d4c0',null);r(c,63,40,2,5,'#fff0c7');
  for(const [x,y,h]of [[16,97,21],[112,97,21],[40,114,14],[89,114,14]]){
    p(c,[[x-4,y],[x-3,y-h+4],[x,y-h],[x+4,y-h+4],[x+5,y]],'#758ca1',INK);r(c,x-1,y-h+5,2,h-7,'#c0ccc1');diamond(c,x+1,y-h+7,2,'#8dc3c0',null);
  }
  steps(c,51,113,27,4,'#b8c7bc');
  star(c,47,99,'#d3dcc5',2);star(c,83,100,'#a8d4cd',1);r(c,58,105,9,1,'#afd4c7');r(c,31,96,5,1,'#92bcc0');
  diamond(c,14,57,2,'#94b9bb',null);diamond(c,116,71,2,'#94b9bb',null);r(c,21,17,1,2,'#c5cfb5');r(c,108,9,1,2,'#c5cfb5');
}

const DRAWERS=[lighthouse,mirrorArchive,furnace,suspendedClock,observatory,treeTheatre,dawnPalace,starwell];

function getLandmark(region){
  let entry=landmarks.get(region);if(entry)return entry;
  const surface=canvas(128,128);if(!surface)return null;
  const c=surface.getContext('2d');c.imageSmoothingEnabled=false;DRAWERS[region](c);
  landmarks.set(region,surface);return surface;
}

/** Transparent 128 px original architecture; x/y are square top-left. */
export function drawIslandLandmark(ctx,region,x=0,y=0,size=128,time=0){
  if(!ctx||!Number.isFinite(size)||size<=0)return;
  region=Math.max(0,Math.min(7,Math.floor(Number(region)||0)));
  const sprite=getLandmark(region),t=Number.isFinite(time)?time:0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(sprite)ctx.drawImage(sprite,x,y,size,size);
  else{ctx.translate(x,y);ctx.scale(size/128,size/128);DRAWERS[region](ctx);ctx.restore();return;}
  ctx.translate(x,y);ctx.scale(size/128,size/128);
  ctx.globalAlpha*=.35+.25*Math.sin(t*1.7+region);
  const glows=[[76,21],[65,66],[63,91],[65,55],[108,15],[64,79],[65,29],[64,43]];
  const [gx,gy]=glows[region];r(ctx,gx-1,gy-2,2,4,'#fff0b5');r(ctx,gx-3,gy,6,1,'#f4dca7');
  if(region===2){r(ctx,57+Math.round(Math.sin(t*1.4)*3),77-Math.floor(t*7)%12,1,2,'#ffc991');r(ctx,74,82-Math.floor(t*5)%9,1,1,'#f7dba1');}
  if(region===5){r(ctx,15,66,2,3,'#fce0a1');r(ctx,111,62,2,3,'#fce0a1');}
  ctx.restore();
}

function farIsland(c,x,y,w,h,color){
  p(c,[[x-w*.52,y],[x-w*.37,y-h*.17],[x-w*.29,y-h*.48],[x-w*.15,y-h*.39],[x-w*.04,y-h],[x+w*.11,y-h*.94],[x+w*.23,y-h*.43],[x+w*.38,y-h*.25],[x+w*.54,y]],color,null);
  line(c,x-w*.42,y+2,x+w*.46,y+2,mix(color,'#82a9a0',.2));
}

function island(c,x,y,rx,top,depth,variant=0){
  e(c,x,y+depth*.84,rx*1.1,top*.75,'#081f3850',null);
  p(c,[[x-rx,y],[x-rx*.96,y+depth*.3],[x-rx*.7,y+depth*.7],[x-rx*.47,y+depth],[x+rx*.26,y+depth*.96],[x+rx*.72,y+depth*.72],[x+rx*.94,y+depth*.25],[x+rx,y]],'#1c3d51',INK);
  p(c,[[x-rx*.86,y],[x-rx*.56,y+depth*.15],[x-rx*.5,y+depth*.87],[x-rx*.72,y+depth*.59]],'#2f5861',null);
  p(c,[[x-rx*.37,y+depth*.09],[x-rx*.14,y+depth*.02],[x-rx*.1,y+depth*.84],[x-rx*.29,y+depth*.92]],'#37616a',null);
  p(c,[[x+rx*.18,y],[x+rx*.49,y+depth*.04],[x+rx*.41,y+depth*.8],[x+rx*.22,y+depth*.89]],'#2a4e60',null);
  p(c,[[x+rx*.69,y],[x+rx*.9,y+depth*.02],[x+rx*.82,y+depth*.44],[x+rx*.63,y+depth*.67]],'#416b6c',null);
  p(c,[[x-rx,y],[x-rx*.91,y-top*.45],[x-rx*.58,y-top*.82],[x-rx*.24,y-top],[x+rx*.2,y-top*.97],[x+rx*.54,y-top*.68],[x+rx*.85,y-top*.48],[x+rx,y],[x+rx*.69,y+top*.45],[x+rx*.3,y+top*.57],[x-rx*.29,y+top*.58],[x-rx*.74,y+top*.38]],variant?'#4b8275':'#467a70',INK);
  p(c,[[x-rx*.89,y-1],[x-rx*.59,y-top*.65],[x-rx*.23,y-top*.81],[x+rx*.19,y-top*.75],[x+rx*.6,y-top*.35],[x+rx*.85,y],[x+rx*.57,y+top*.14],[x-rx*.18,y+top*.18],[x-rx*.63,y+top*.1]],variant?'#79a382':'#6c997e',null);
  line(c,x-rx*.83,y+top*.3,x-rx*.34,y+top*.52,'#a4bf99');line(c,x+rx*.27,y+top*.52,x+rx*.74,y+top*.27,'#9abda0');
  for(let i=0;i<12;i++){
    const xx=x-rx*.85+rnd(i,variant+72)*rx*1.7,yy=y-top*.35+rnd(i,variant+93)*top*.6;
    r(c,xx,yy,3,1,i%3?'#80aa89':'#b5bca0');
  }
  line(c,x-rx*.57,y+depth+3,x-rx*.12,y+depth+3,'#6ca3a2');line(c,x+rx*.08,y+depth+4,x+rx*.48,y+depth+4,'#619a9d');
}

function miniHouse(c,x,y,variant=0){
  r(c,x+3,y+10,22,17,INK);r(c,x+4,y+11,20,15,'#a0b2a0');r(c,x+5,y+13,16,12,'#c7c4a0');r(c,x+21,y+12,3,14,'#6e8c88');
  const roof=variant===1?'#627f90':variant===2?'#658f85':'#b18772';
  p(c,[[x,y+12],[x+5,y+3],[x+20,y+3],[x+28,y+12]],roof,INK);
  p(c,[[x+4,y+9],[x+7,y+5],[x+19,y+5],[x+23,y+9]],mix(roof,'#e4c696',.3),null);
  line(c,x+3,y+9,x+24,y+9,mix(roof,INK,.3));r(c,x+1,y+12,26,2,mix(roof,INK,.2));
  r(c,x+6,y+17,5,6,INK);r(c,x+7,y+18,3,4,'#f3cc88');r(c,x+18,y+16,4,5,INK);r(c,x+19,y+17,2,3,'#d8b77d');
  r(c,x+12,y+19,5,8,'#344e54');r(c,x+15,y+22,1,1,'#dbc082');r(c,x+11,y+27,8,1,'#b5b39b');
  r(c,x+18,y,4,6,'#788a86');r(c,x+17,y,6,1,'#b6b296');
}
function tinyTree(c,x,y,s=1){
  r(c,x-1,y,3,8*s,'#8f8464');p(c,[[x-9*s,y],[x-8*s,y-7*s],[x-4*s,y-14*s],[x+2*s,y-16*s],[x+7*s,y-11*s],[x+10*s,y-4*s],[x+8*s,y+2*s],[x-3*s,y+4*s]],'#315e62',INK);
  p(c,[[x-7*s,y-7*s],[x-3*s,y-13*s],[x+2*s,y-13*s],[x+6*s,y-8*s],[x+3*s,y-5*s],[x-2*s,y-5*s],[x-5*s,y-2*s]],'#6b9b7d',null);
  r(c,x-3*s,y-11*s,4*s,s,'#acc097');r(c,x+4*s,y-3*s,3*s,s,'#729c7c');
}
function boat(c,x,y,s=1,sail=true){
  line(c,x-8*s,y+5*s,x+8*s,y+5*s,'#689b9b');
  p(c,[[x-8*s,y],[x+9*s,y-1*s],[x+5*s,y+4*s],[x-5*s,y+4*s]],'#7e7864',INK);line(c,x-6*s,y,x+6*s,y,'#c2ae82');
  if(sail){
    r(c,x,y-18*s,s,18*s,'#90a69b');p(c,[[x+2*s,y-18*s],[x+12*s,y-4*s],[x+2*s,y-3*s]],'#c8d1b3',INK);
    p(c,[[x-s,y-15*s],[x-8*s,y-3*s],[x-s,y-3*s]],'#6b9a9b',INK);r(c,x+s,y-19*s,5*s,s,'#d5ab79');
  }else{r(c,x-1*s,y-3*s,3*s,3*s,'#d6b481');r(c,x,y-4*s,s,s,'#eee0b4');}
}
function footbridge(c,x1,y1,x2,y2){
  const count=Math.max(8,Math.ceil(Math.hypot(x2-x1,y2-y1)/3));
  line(c,x1-4,y1,x2-4,y2,'#213d47',3);line(c,x1+4,y1,x2+4,y2,'#213d47',3);
  for(let i=0;i<=count;i++){const a=i/count,x=x1+(x2-x1)*a,y=y1+(y2-y1)*a;r(c,x-4,y,9,2,i%3?'#9c9775':'#c0b188');}
  line(c,x1-5,y1-5,x2-5,y2-5,'#b4b28a');line(c,x1+5,y1-5,x2+5,y2-5,'#b4b28a');
  for(let i=0;i<=count;i+=3){const a=i/count,x=x1+(x2-x1)*a,y=y1+(y2-y1)*a;r(c,x-5,y-7,1,8,'#b5b38b');r(c,x+5,y-7,1,8,'#b5b38b');}
}

function scene(c,W,H){
  const horizon=Math.round(H*.465);
  for(let i=0;i<28;i++){const y=Math.floor(i*horizon/28),next=Math.ceil((i+1)*horizon/28);r(c,0,y,W,next-y,mix('#071c30','#28566a',i/27));}
  for(let i=0;i<38;i++){const y=Math.floor(horizon+i*(H-horizon)/38),next=Math.ceil(horizon+(i+1)*(H-horizon)/38);r(c,0,y,W,next-y,mix('#246c79','#092d46',i/37));}
  // The large quiet area on the left is intentional space for live title text.
  for(let i=0;i<82;i++){
    const x=Math.floor(rnd(i,47)*W),y=Math.floor(rnd(i,53)*H*.42);
    r(c,x,y,1,i%19===0?2:1,x<W*.45?'#52788745':i%4?'#91afa57d':'#d8caa1a0');
  }
  const mx=W*.727,my=H*.166,mr=Math.min(H*.079,W*.047);
  e(c,mx,my,mr*2.3,mr*2.3,'#94b8aa06',null);e(c,mx,my,mr*1.7,mr*1.7,'#c8d4b008',null);e(c,mx,my,mr*1.3,mr*1.3,'#d5dab30d',null);
  e(c,mx,my,mr,mr,'#d4d6ae',null);e(c,mx-1,my-1,mr*.87,mr*.87,'#e7e2b9',null);
  e(c,mx+mr*.37,my+mr*.05,mr*.22,mr*.25,'#c5caaa',null);e(c,mx-mr*.27,my-mr*.32,mr*.18,mr*.13,'#d1d4af',null);e(c,mx-mr*.18,my+mr*.39,mr*.26,mr*.16,'#d4d5ae',null);
  r(c,mx-mr*.54,my-mr*.2,mr*.3,1,'#f3ebc7');
  // Long clouds remain thin enough to preserve the celestial silhouettes.
  p(c,[[W*.56,H*.245],[W*.58,H*.232],[W*.63,H*.236],[W*.65,H*.229],[W*.72,H*.241],[W*.75,H*.239],[W*.78,H*.253],[W*.61,H*.255]],'#74959422',null);
  p(c,[[W*.83,H*.155],[W*.86,H*.148],[W*.9,H*.157],[W*.93,H*.151],[W*.98,H*.166],[W*.85,H*.17]],'#90aba025',null);
  p(c,[[W*.42,H*.362],[W*.48,H*.355],[W*.53,H*.367],[W*.59,H*.365],[W*.65,H*.38],[W*.45,H*.382]],'#789c961a',null);
  const constellation=[[.466,.18],[.515,.116],[.574,.167],[.638,.102],[.674,.054]];
  for(let i=1;i<constellation.length;i++){
    const a=constellation[i-1],b=constellation[i];line(c,a[0]*W,a[1]*H,b[0]*W,b[1]*H,'#b7b79328');
  }
  for(let i=0;i<constellation.length;i++){const q=constellation[i];star(c,Math.round(q[0]*W),Math.round(q[1]*H),i%2?'#a4c7bd':'#d7c18f',i===4?2:1);}
  farIsland(c,W*.54,horizon-5,W*.11,H*.085,'#294f64');farIsland(c,W*.927,horizon-4,W*.19,H*.107,'#2c5769');farIsland(c,W*.697,horizon+3,W*.10,H*.043,'#376974');
  r(c,W*.4,horizon-1,W*.6,2,'#749b992c');r(c,W*.46,horizon+3,W*.54,1,'#7ea99f40');
  for(let i=0;i<165;i++){
    const depth=rnd(i,97),y=horizon+4+depth*(H-horizon-8),x=rnd(i,109)*W;
    const len=2+Math.floor(rnd(i,137)*(3+depth*16));
    r(c,x,y,len,1,i%4===0?'#68a5a43a':i%3===0?'#326d8170':'#27596d65');
  }
  // Broken moonlight columns give the flat sea scale without animated noise.
  for(let i=0;i<32;i++){
    const k=i/31,y=horizon+4+k*(H*.51),width=3+k*W*.075;
    const x=mx+(rnd(i,162)-.5)*width*1.8;
    r(c,x-width*.5,y,width*(.25+rnd(i,193)*.65),1,k>.6?'#a9b48b26':'#b8c8a245');
  }
  // A distant island and a pair of lights make the sea feel inhabited.
  farIsland(c,W*.988,H*.576,W*.18,H*.082,'#315c65');r(c,W*.965,H*.545,2,2,'#d0b985');r(c,W*.998,H*.531,1,2,'#d8bd8b');
  boat(c,W*.532,H*.615,.7,true);
  const cliffY=H*.724,cliffX=W*.811;
  island(c,cliffX,cliffY,W*.205,H*.048,H*.153);
  island(c,W*.588,H*.835,W*.126,H*.038,H*.068,1);
  footbridge(c,W*.669,H*.817,W*.71,H*.739);
  // Soft route through the village is painted into the landscape itself.
  p(c,[[W*.488,H*.847],[W*.54,H*.823],[W*.59,H*.824],[W*.631,H*.798],[W*.657,H*.80],[W*.616,H*.842],[W*.557,H*.846],[W*.513,H*.865]],'#acb28b',null);
  p(c,[[W*.679,H*.74],[W*.716,H*.707],[W*.761,H*.702],[W*.795,H*.739],[W*.846,H*.738],[W*.875,H*.76],[W*.789,H*.763],[W*.755,H*.724],[W*.716,H*.731]],'#97a68a',null);
  const ts=Math.min(H*.57,W*.33),tx=W*.675,ty=cliffY-ts*.875;
  const bx=tx+ts*.595,by=ty+ts*.17;
  p(c,[[bx,by],[bx-W*.29,by+H*.04],[bx-W*.27,by+H*.13]],'#ebdbaa0a',null);
  p(c,[[bx,by],[bx-W*.21,by+H*.031],[bx-W*.205,by+H*.086]],'#ebdbaa0b',null);
  p(c,[[bx,by],[bx-W*.145,by+H*.025],[bx-W*.14,by+H*.063]],'#f0d9a411',null);
  e(c,bx,by,7,6,'#f4d99b0c',null);
  tinyTree(c,W*.728,H*.694,.83);tinyTree(c,W*.971,H*.697,.95);
  const tower=getLandmark(0);if(tower)c.drawImage(tower,Math.round(tx),Math.round(ty),Math.round(ts),Math.round(ts));else{c.save();c.translate(tx,ty);c.scale(ts/128,ts/128);lighthouse(c);c.restore();}
  miniHouse(c,W*.522,H*.733,0);miniHouse(c,W*.578,H*.75,1);miniHouse(c,W*.627,H*.783,2);
  tinyTree(c,W*.496,H*.817,.7);tinyTree(c,W*.695,H*.827,.61);
  for(const [xx,yy]of [[.514,.853],[.586,.872],[.65,.83],[.716,.733],[.956,.744]]){
    const x=xx*W,y=yy*H;e(c,x,y-4,7,5,'#d9bd8120',null);r(c,x,y-5,1,7,'#aab393');r(c,x-1,y-7,3,3,'#f0d196');r(c,x,y-6,1,1,'#fff0be');
  }
  // Mooring pier, quiet dinghy, and a little flag are foreground scale cues.
  for(let i=0;i<11;i++){const x=W*.49-i*1.4,y=H*.85+i*2.3;r(c,x-5,y,10,2,i%2?'#748c80':'#a5a788');}
  line(c,W*.49-6,H*.849,W*.49-20,H*.911,'#738d86');r(c,W*.468,H*.908,2,7,'#a4ad91');
  boat(c,W*.447,H*.926,.9,false);boat(c,W*.89,H*.95,.75,true);
  r(c,W*.477,H*.929,W*.022,1,'#b3b7883e');r(c,W*.47,H*.94,W*.035,1,'#8cb8a349');
  for(let i=0;i<9;i++){
    const y=H*.884+i*H*.006,x=W*.59+(rnd(i,283)-.5)*W*.04;
    r(c,x,y,2+rnd(i,303)*6,1,'#d9bb7040');
  }
  // A few foreground leaves frame the scene, without entering the text zone.
  p(c,[[W,H],[W*.918,H],[W*.927,H*.969],[W*.941,H*.991],[W*.947,H*.939],[W*.955,H*.977],[W*.973,H*.934],[W*.975,H*.98],[W*.997,H*.948]],'#092536',null);
  p(c,[[W*.94,H],[W*.954,H*.967],[W*.958,H*.994],[W*.976,H*.961],[W*.974,H]],'#153d49',null);
  // Actual left-side contrast is baked in, so the render loop needs no filters.
  for(let x=0;x<W*.58;x+=4){const opacity=x<W*.36?.58:Math.max(0,.58*(W*.58-x)/(W*.22));const alpha=Math.round(opacity*255).toString(16).padStart(2,'0');r(c,x,0,4,H,'#06182b'+alpha);}
  for(let i=0;i<8;i++)r(c,0,H*.92+i*H*.01,W,H*.011,'#071c2d'+Math.round(i*4).toString(16).padStart(2,'0'));
}

function getVista(w,h){
  const key=w+'x'+h;let entry=vistas.get(key);if(entry)return entry;
  let W=Math.min(768,Math.max(256,Math.round(w/2.25))),H=Math.max(144,Math.round(h*W/w));
  if(H>1280){W=Math.max(96,Math.round(W*1280/H));H=1280;}
  const surface=canvas(W,H);if(!surface)return null;
  const c=surface.getContext('2d');c.imageSmoothingEnabled=false;scene(c,W,H);
  // 12 stellar glints, 10 water glints and 4 drifting light motes. Only the
  // shooting star adds up to 6 short rectangles, for <=40 rects each frame.
  const stars=Array.from({length:12},(_,i)=>({x:(.485+rnd(i,409)*.5)*W,y:(.035+rnd(i,419)*.36)*H,phase:rnd(i,421)*6.283}));
  const water=Array.from({length:10},(_,i)=>({x:(.47+rnd(i,431)*.52)*W,y:(.495+rnd(i,433)*.48)*H,phase:rnd(i,439)*6.283}));
  const motes=Array.from({length:4},(_,i)=>({x:(.66+rnd(i,443)*.29)*W,y:(.67+rnd(i,449)*.14)*H,phase:rnd(i,457)*6.283}));
  entry={surface,W,H,stars,water,motes};vistas.set(key,entry);
  if(vistas.size>2)vistas.delete(vistas.keys().next().value);
  return entry;
}

/** Bespoke title background; cached static scenery plus <=40 tiny rects. */
export function drawTitleVista(ctx,w,h,time=0){
  if(!ctx||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return;
  w=Math.max(1,Math.round(w));h=Math.max(1,Math.round(h));
  const t=Number.isFinite(time)?time:0,entry=getVista(w,h);
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(!entry){scene(ctx,w,h);ctx.restore();return;}
  ctx.drawImage(entry.surface,0,0,w,h);ctx.scale(w/entry.W,h/entry.H);
  const alpha=ctx.globalAlpha;
  for(let i=0;i<entry.stars.length;i++){
    const s=entry.stars[i];
    ctx.globalAlpha=alpha*(.16+.33*(.5+.5*Math.sin(t*.8+s.phase)));
    r(ctx,s.x,s.y,1,1,'#ecdfb4');
    if(i<8&&Math.sin(t*.8+s.phase)>.88)r(ctx,s.x-1,s.y,3,1,'#d5cfac');
  }
  for(const s of entry.water){ctx.globalAlpha=alpha*(.12+.15*(.5+.5*Math.sin(t*.65+s.phase)));r(ctx,s.x+Math.round(Math.sin(t*.22+s.phase)*3),s.y,3,1,'#bed6bc');}
  for(const s of entry.motes){ctx.globalAlpha=alpha*(.12+.25*(.5+.5*Math.sin(t+s.phase)));r(ctx,s.x+Math.sin(t*.2+s.phase)*2,s.y+Math.sin(t*.35+s.phase)*2,1,1,'#e6d89d');}
  const passage=((t+2)%11+11)%11;
  if(passage<1.25){
    const progress=passage/1.25,x=entry.W*(.495+progress*.19),y=entry.H*(.10+progress*.135);
    for(let i=3;i>=0;i--){ctx.globalAlpha=alpha*Math.sin(progress*Math.PI)*(.64-i*.14);r(ctx,x-i*4,y-i*2,4,1,i?'#d1aa78':'#f3dfaa');}
    ctx.globalAlpha=alpha*Math.sin(progress*Math.PI)*.8;r(ctx,x+2,y-1,1,3,'#fff1bd');r(ctx,x+1,y,3,1,'#fff1bd');
  }
  ctx.restore();
}
