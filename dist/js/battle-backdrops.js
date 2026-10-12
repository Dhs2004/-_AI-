/* Original island battle stages. Static pixel scenery is cached; the render
 * loop performs one blit and at most 40 tiny atmospheric rectangles.
 * time is seconds. Creature platforms, combatants and UI belong to the caller.
 */
import {drawIslandLandmark} from './landmarks.js';

const INK='#183443', CACHE_LIMIT=10, PIXEL_LIMIT=2200000;
const cache=new Map();let pixels=0,tick=0;
function surface(w,h){if(typeof OffscreenCanvas!=='undefined')return new OffscreenCanvas(w,h);if(typeof document!=='undefined'){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}return null;}
function r(c,x,y,w,h,color){if(w<=0||h<=0)return;c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function fill(c,points,color,dx=0,dy=0){
  c.fillStyle=color;let lo=Infinity,hi=-Infinity;for(const pt of points){lo=Math.min(lo,pt[1]);hi=Math.max(hi,pt[1]);}
  for(let y=Math.floor(lo);y<Math.ceil(hi);y++){const xs=[],sy=y+.5;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]<=sy&&b[1]>sy)||(b[1]<=sy&&a[1]>sy))xs.push(a[0]+(sy-a[1])/(b[1]-a[1])*(b[0]-a[0]));}xs.sort((a,b)=>a-b);for(let i=0;i+1<xs.length;i+=2){const x=Math.ceil(xs[i]);c.fillRect(x+dx,y+dy,Math.max(1,Math.floor(xs[i+1])-x+1),1);}}
}
function p(c,points,color,outline=null){if(outline){fill(c,points,outline,-1,0);fill(c,points,outline,1,0);fill(c,points,outline,0,-1);fill(c,points,outline,0,1);}fill(c,points,color);}
function disk(c,x,y,rx,ry,color){c.fillStyle=color;for(let yy=Math.floor(y-ry);yy<=Math.ceil(y+ry);yy++){const q=(yy+.5-y)/ry;if(Math.abs(q)>1)continue;const a=rx*Math.sqrt(1-q*q),left=Math.ceil(x-a);c.fillRect(left,yy,Math.max(1,Math.floor(x+a)-left+1),1);}}
function e(c,x,y,rx,ry,color,outline=null){if(outline)disk(c,x,y,rx+1,ry+1,outline);disk(c,x,y,rx,ry,color);}
function line(c,x,y,tx,ty,color,width=1){x=Math.round(x);y=Math.round(y);tx=Math.round(tx);ty=Math.round(ty);const dx=Math.abs(tx-x),dy=-Math.abs(ty-y),sx=x<tx?1:-1,sy=y<ty?1:-1;let err=dx+dy;for(;;){r(c,x,y,width,width,color);if(x===tx&&y===ty)break;const q=2*err;if(q>=dy){err+=dy;x+=sx;}if(q<=dx){err+=dx;y+=sy;}}}
function mix(a,b,t){let out='#';for(let i=1;i<7;i+=2)out+=Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0');return out;}
function random(i,seed=31){let n=Math.imul((i|0)^seed,374761393);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function bands(c,W,y,h,a,b,n=24){for(let i=0;i<n;i++){const top=y+Math.floor(h*i/n),bottom=y+Math.ceil(h*(i+1)/n);r(c,0,top,W,bottom-top,mix(a,b,i/(n-1)));}}
function diamond(c,x,y,rx,ry,color,outline=null){p(c,[[x,y-ry],[x+rx,y],[x,y+ry],[x-rx,y]],color,outline);}
function arch(c,x,y,w,h,color,edge){p(c,[[x,y+h],[x,y+8],[x+w*.2,y],[x+w*.8,y],[x+w,y+8],[x+w,y+h]],edge,INK);p(c,[[x+3,y+h],[x+3,y+9],[x+w*.24,y+3],[x+w*.76,y+3],[x+w-3,y+9],[x+w-3,y+h]],color);}
function moon(c,x,y,s,color='#ddd9b3'){e(c,x,y,s*1.8,s*1.8,color+'08');e(c,x,y,s*1.3,s*1.3,color+'12');e(c,x,y,s,s,color);e(c,x+s*.3,y+s*.1,s*.22,s*.23,mix(color,'#819b9a',.27));e(c,x-s*.27,y-s*.3,s*.17,s*.12,mix(color,'#9cad9d',.21));}
function cloud(c,x,y,w,h,color){p(c,[[x-w*.5,y],[x-w*.35,y-h*.25],[x-w*.21,y-h*.32],[x-w*.13,y-h],[x+w*.05,y-h*.9],[x+w*.2,y-h*.38],[x+w*.35,y-h*.4],[x+w*.5,y],[x+w*.31,y+h*.2],[x-w*.3,y+h*.2]],color);}
function mountain(c,x,y,w,h,color,snow=false){p(c,[[x-w*.6,y],[x-w*.38,y-h*.37],[x-w*.17,y-h*.43],[x,y-h],[x+w*.12,y-h*.82],[x+w*.3,y-h*.35],[x+w*.48,y-h*.23],[x+w*.61,y]],color);if(snow)p(c,[[x-w*.17,y-h*.43],[x,y-h],[x+w*.12,y-h*.82],[x+w*.24,y-h*.47],[x+w*.07,y-h*.57],[x-w*.02,y-h*.43],[x-w*.06,y-h*.65]],mix(color,'#e2e8d6',.57));}
function shrub(c,x,y,size=1,color='#426c64',light='#759d7a'){e(c,x,y,10*size,5*size,color,INK);e(c,x-3*size,y-3*size,7*size,4*size,light);r(c,x-6*size,y-4*size,5*size,size,mix(light,'#d7d6ae',.25));}
function pine(c,x,y,size,color='#446570',snow=false){p(c,[[x,y-size],[x-size*.25,y-size*.5],[x-size*.15,y-size*.55],[x-size*.39,y-size*.17],[x-size*.3,y-size*.22],[x-size*.46,y],[x+size*.44,y],[x+size*.3,y-size*.22],[x+size*.4,y-size*.17],[x+size*.14,y-size*.55],[x+size*.24,y-size*.5]],color,INK);r(c,x-1,y,3,size*.13,mix(color,'#ac9878',.35));if(snow){p(c,[[x,y-size],[x-size*.17,y-size*.64],[x,y-size*.69],[x+size*.17,y-size*.64]],'#bed3cd');p(c,[[x-size*.24,y-size*.35],[x-size*.08,y-size*.43],[x+size*.1,y-size*.42],[x+size*.27,y-size*.34],[x+size*.1,y-size*.3],[x-size*.1,y-size*.3]],'#b1cbc7');}}
function rock(c,x,y,size,color='#657b80'){p(c,[[x-size,y],[x-size*.85,y-size*.52],[x-size*.27,y-size*.85],[x+size*.5,y-size*.7],[x+size,y-size*.16],[x+size*.62,y+size*.3],[x-size*.4,y+size*.34]],color,INK);p(c,[[x-size*.77,y-size*.45],[x-size*.23,y-size*.69],[x+size*.44,y-size*.57],[x+size*.3,y-size*.25],[x-size*.3,y-size*.05]],mix(color,'#d3cfab',.3));}
function lamp(c,x,y,s=1,color='#e2c18b'){e(c,x,y-5*s,9*s,7*s,color+'0b');r(c,x,y,2*s,10*s,'#45636b');r(c,x-3*s,y-5*s,8*s,6*s,INK);r(c,x-2*s,y-4*s,6*s,4*s,color);r(c,x-4*s,y-7*s,10*s,2*s,'#849a8c');r(c,x,y-4*s,s,4*s,'#f4e0a9');}
function house(c,x,y,w,color='#8d8e82',roof='#7c7573'){const h=w*.76;r(c,x,y+h*.34,w,h*.66,INK);r(c,x+1,y+h*.36,w-2,h*.62,color);p(c,[[x-3,y+h*.37],[x+w*.22,y],[x+w*.73,y],[x+w+3,y+h*.37]],roof,INK);r(c,x+w*.2,y+h*.55,w*.17,h*.2,'#ead098');r(c,x+w*.62,y+h*.55,w*.15,h*.2,'#ddbf87');r(c,x+w*.44,y+h*.68,w*.15,h*.31,'#3d5960');}
function railing(c,W,H,y,color='#809b94',posts=10){line(c,0,y,W,y,color);line(c,0,y+4,W,y+4,mix(color,INK,.3));for(let i=0;i<=posts;i++){const x=i*W/posts;r(c,x-1,y-3,3,12,mix(color,INK,.22));r(c,x-2,y-4,5,2,mix(color,'#d8d2a4',.3));}}
function hero(c,region,W,H,portrait,y=.29,scale=1){const s=Math.min(H*(portrait?.15:.25),W*(portrait?.32:.18))*scale;drawIslandLandmark(c,region,W*.49-s*.5,H*(portrait?y-.035:y)-s*.93,s,0);}
function grain(c,W,H,start,color,seed,count=70){for(let i=0;i<count;i++){const x=random(i,seed)*W,y=start+random(i,seed+9)*(H-start);r(c,x,y,2+random(i,seed+15)*4,1,color);}}
function vignette(c,W,H){for(let i=0;i<8;i++){const a=Math.round((8-i)*2.2).toString(16).padStart(2,'0');r(c,0,i*H*.006,W,Math.ceil(H*.006),'#10232d'+a);r(c,0,H*.87+i*H*.017,W,H*.018,'#10232d'+Math.round(i*3).toString(16).padStart(2,'0'));}}

function harbor(c,W,H,portrait){
  bands(c,W,0,H,'#19394f','#6a9c96');moon(c,W*.81,H*.095,Math.min(W*.024,H*.043),'#e3d7ad');
  cloud(c,W*.33,H*.085,W*.22,H*.023,'#abc2ac16');cloud(c,W*.77,H*.205,W*.23,H*.017,'#c4d2b82a');
  mountain(c,W*.15,H*.272,W*.47,H*.13,'#315c68');mountain(c,W*.89,H*.282,W*.4,H*.11,'#426e76');
  bands(c,W,H*.27,H*.16,'#3e8090','#6a9e92',12);for(let i=0;i<35;i++)r(c,random(i,102)*W,H*(.275+random(i,111)*.13),3+random(i,115)*11,1,'#acccad35');
  p(c,[[W*.32,H*.265],[W*.38,H*.226],[W*.54,H*.22],[W*.65,H*.265]],'#548374');hero(c,0,W,H,portrait,.263,.92);
  house(c,W*.08,H*.221,W*.045,'#afb295','#8b8c7b');house(c,W*.16,H*.232,W*.037,'#9faf92','#637d7e');
  line(c,W*.09,H*.28,W*.23,H*.28,'#9aac8d');for(let i=0;i<5;i++)r(c,W*(.11+i*.025),H*.28,1,H*.033,'#728f86');
  p(c,[[0,H*.407],[W*.17,H*.361],[W*.34,H*.367],[W*.53,H*.391],[W*.7,H*.359],[W*.88,H*.351],[W,H*.377],[W,H],[0,H]],'#517f68');
  p(c,[[0,H*.421],[W*.18,H*.38],[W*.39,H*.397],[W*.61,H*.409],[W*.8,H*.379],[W,H*.398],[W,H],[0,H]],'#709473');
  p(c,[[0,H*.695],[W*.13,H*.636],[W*.34,H*.665],[W*.53,H*.728],[W*.76,H*.707],[W,H*.65],[W,H],[0,H]],'#5f876d');
  p(c,[[W*.02,H],[W*.21,H*.784],[W*.47,H*.65],[W*.63,H*.485],[W*.68,H*.463],[W*.54,H*.67],[W*.34,H*.874],[W*.3,H]],'#a4ab8170');
  grain(c,W,H,H*.405,'#b7c09526',141,90);
  for(let i=0;i<10;i++){const x=(i<5?random(i,153)*.09:.91+random(i,157)*.09)*W,y=H*(.44+random(i,159)*.31);shrub(c,x,y,.5+random(i,161)*.5,'#3f6e60','#789d72');}
  for(let i=0;i<20;i++){const x=random(i,173)*W,y=H*(.69+random(i,181)*.12);r(c,x,y,1,3,'#507865');r(c,x-1,y-1,3,1,i%2?'#c7c48c':'#d8b19b');}
  lamp(c,W*.03,H*.463,.7);lamp(c,W*.966,H*.411,.6);
}

function mirrorLake(c,W,H,portrait){
  bands(c,W,0,H,'#233b55','#83aaa7');cloud(c,W*.51,H*.091,W*.76,H*.052,'#a0b8b314');
  mountain(c,W*.13,H*.273,W*.46,H*.148,'#365974');mountain(c,W*.84,H*.276,W*.47,H*.12,'#3b647a');
  bands(c,W,H*.273,H*.73,'#6c9a9d','#355f77');
  e(c,W*.49,H*.308,W*.13,H*.034,'#a6c0b23a');
  hero(c,1,W,H,portrait,.273,1);
  p(c,[[W*.423,H*.302],[W*.58,H*.302],[W*.56,H*.39],[W*.44,H*.411]],'#bad4c112');
  for(let i=0;i<13;i++){const y=H*(.31+i*.008);r(c,W*(.448-random(i,191)*.03),y,W*(.055+random(i,197)*.055),1,'#c1d7c02a');}
  p(c,[[0,H*.56],[W*.17,H*.489],[W*.37,H*.453],[W*.61,H*.408],[W*.89,H*.44],[W,H*.48],[W,H],[0,H]],'#688e922a');
  p(c,[[W*.02,H],[W*.08,H*.72],[W*.39,H*.593],[W*.49,H*.462],[W*.52,H*.462],[W*.45,H*.633],[W*.2,H*.82],[W*.18,H]],'#7c999252');
  for(let i=0;i<24;i++){const x=random(i,211)*W,y=H*(.38+random(i,223)*.47);r(c,x,y,4+random(i,227)*13,1,'#a8c7bb20');}
  for(let side=0;side<2;side++){
    const x=side?W*.994:W*.005; p(c,[[x-5,0],[x+7,0],[x+10,H*.4],[x+4,H*.53],[x-6,H*.48]],'#254657');
    p(c,[[x,0],[side?W*.92:W*.09,0],[side?W*.94:W*.066,H*.105],[side?W*.95:W*.058,H*.163],[x,H*.08]],'#426c72');
    for(let i=0;i<6;i++){const xx=x+(side?-1:1)*(4+i*W*.009);line(c,xx,0,xx+Math.sin(i)*4,H*(.08+i*.018),'#6f979076');r(c,xx,H*(.1+i*.013),2,5,'#8ab39a65');}
  }
  for(let i=0;i<8;i++){const x=(i<4?.01+random(i,239)*.1:.91+random(i,241)*.085)*W,y=H*(.51+random(i,247)*.23);e(c,x,y,7+random(i,251)*4,2.5,'#477c72');line(c,x-1,y,x+3,y-1,'#8caf90');if(i%3===0){r(c,x,y-3,3,2,'#d7b5c5');r(c,x+1,y-4,1,1,'#e9d5b8');}}
  rock(c,W*.95,H*.708,12,'#617f89');rock(c,W*.039,H*.756,10,'#557780');
}

function volcanicFurnace(c,W,H,portrait){
  bands(c,W,0,H,'#352f4a','#a77d6b');
  moon(c,W*.82,H*.102,Math.min(W*.026,H*.039),'#d6ad80');
  mountain(c,W*.13,H*.304,W*.48,H*.26,'#53475b');mountain(c,W*.76,H*.311,W*.64,H*.173,'#625567');
  p(c,[[W*.073,H*.187],[W*.1,H*.116],[W*.128,H*.097],[W*.155,H*.139],[W*.167,H*.185],[W*.136,H*.171],[W*.116,H*.184]],'#b17c67');
  cloud(c,W*.128,H*.072,W*.11,H*.058,'#7e727224');cloud(c,W*.2,H*.031,W*.22,H*.032,'#aa8d7b14');
  p(c,[[0,H*.341],[W*.2,H*.269],[W*.37,H*.292],[W*.54,H*.28],[W*.78,H*.295],[W,H*.272],[W,H],[0,H]],'#5c565e');
  hero(c,2,W,H,portrait,.301,1.03);
  r(c,0,H*.324,W,3,'#9c7c674b');
  p(c,[[0,H*.423],[W*.2,H*.362],[W*.4,H*.383],[W*.63,H*.342],[W*.83,H*.358],[W,H*.333],[W,H],[0,H]],'#676066');
  p(c,[[0,H*.633],[W*.2,H*.687],[W*.42,H*.657],[W*.67,H*.704],[W*.87,H*.652],[W,H*.706],[W,H],[0,H]],'#514e5c');
  p(c,[[0,H*.466],[W*.047,H*.527],[W*.029,H*.626],[W*.106,H*.742],[W*.078,H],[W*.039,H],[W*.065,H*.742],[0,H*.635]],'#ad766352');
  p(c,[[W,H*.404],[W*.954,H*.515],[W*.973,H*.63],[W*.9,H*.755],[W*.932,H],[W*.968,H],[W*.943,H*.755],[W,H*.642]],'#ad766348');
  for(let side=0;side<2;side++){const edge=side?W:0,sign=side?-1:1;line(c,edge+sign*W*.008,H*.49,edge+sign*W*.047,H*.558,'#d7976a');line(c,edge+sign*W*.047,H*.558,edge+sign*W*.026,H*.616,'#e0a473');line(c,edge+sign*W*.027,H*.616,edge+sign*W*.072,H*.698,'#c99068');}
  grain(c,W,H,H*.37,'#b29b8123',263,85);
  for(let i=0;i<14;i++){const x=random(i,269)*W,y=H*(.41+random(i,271)*.4);p(c,[[x,y],[x+9,y-3],[x+18,y],[x+7,y+4]],'#45485629');}
  for(let i=0;i<4;i++){rock(c,i<2?W*.045:W*.97,H*(.455+(i%2)*.21),12+i*2,'#535565');}
  for(const xx of [W*.02,W*.976]){for(let i=0;i<8;i++)e(c,xx,i*6,2,4,i%2?'#727a7966':'#99928277');r(c,xx-5,44,11,3,'#7c79716b');}
}

function suspendedCourt(c,W,H,portrait){
  bands(c,W,0,H,'#487f94','#bfd0b4');
  for(let i=0;i<9;i++)cloud(c,random(i,283)*W,H*(.16+random(i,293)*.22),W*(.12+random(i,307)*.14),H*.025,'#dae1bd32');
  p(c,[[0,H*.341],[W*.097,H*.293],[W*.161,H*.303],[W*.18,H*.325],[W*.127,H*.359],[W*.117,H*.423],[W*.071,H*.455],[W*.03,H*.4]],'#5e8d89');
  p(c,[[W*.84,H*.338],[W*.918,H*.282],[W*.978,H*.308],[W,H*.324],[W,H*.408],[W*.93,H*.454],[W*.888,H*.402]],'#638d8d');
  for(let side=0;side<2;side++){const x=side?W*.933:W*.056,w=Math.max(8,W*.035);r(c,x-w*.5,H*.16,w,H*.32,'#668e8d');r(c,x-w*.3,H*.17,w*.3,H*.3,'#bbceb0');r(c,x-w*.7,H*.152,w*1.4,4,'#c2c8a2');p(c,[[x-w*.6,H*.145],[x,H*.096],[x+w*.6,H*.145]],'#9ba787',INK);line(c,x,H*.12,W*.5,H*.047,'#d6d0a65a');}
  hero(c,3,W,H,portrait,.31,1.03);
  p(c,[[0,H*.427],[W*.15,H*.37],[W*.48,H*.35],[W*.84,H*.371],[W,H*.41],[W,H],[0,H]],'#769c92');
  p(c,[[0,H*.455],[W*.16,H*.399],[W*.49,H*.381],[W*.84,H*.399],[W,H*.443],[W,H],[0,H]],'#a5b59b');
  e(c,W*.5,H*.672,W*.52,H*.213,'#90a693');e(c,W*.5,H*.646,W*.465,H*.178,'#b2bba0');e(c,W*.5,H*.642,W*.43,H*.157,'#9fb199');
  for(let i=0;i<12;i++){const a=i*Math.PI/6;line(c,W*.5+Math.cos(a)*W*.42,H*.642+Math.sin(a)*H*.151,W*.5+Math.cos(a)*W*.44,H*.642+Math.sin(a)*H*.161,'#ced0a55f');}
  line(c,W*.5,H*.497,W*.5,H*.775,'#c8c9a329');line(c,W*.17,H*.642,W*.84,H*.642,'#c8c9a329');
  for(let i=0;i<8;i++){const x=i*W/7,y=H*(.39+Math.abs(i-3.5)*.007);r(c,x,y,2,8,'#e0d7ab65');}
  grain(c,W,H,H*.416,'#d5d5ac28',313,45);
  shrub(c,W*.018,H*.645,.85,'#638c7b','#9cb68b');shrub(c,W*.97,H*.741,1,'#608976','#9eb68a');
  p(c,[[0,H*.83],[W*.11,H*.913],[W*.26,H*.946],[W*.75,H*.947],[W*.94,H*.894],[W,H*.827],[W,H],[0,H]],'#587f7c');
}

function snowyObservatory(c,W,H,portrait){
  bands(c,W,0,H,'#142d49','#6b939e');
  for(let i=0;i<45;i++)r(c,random(i,331)*W,random(i,337)*H*.255,1,1,i%3?'#c9d6c354':'#e0d6ba77');
  p(c,[[W*.22,0],[W*.29,H*.063],[W*.4,H*.113],[W*.48,H*.132],[W*.6,H*.12],[W*.76,H*.069],[W*.83,0],[W*.75,0],[W*.69,H*.047],[W*.56,H*.089],[W*.46,H*.097],[W*.35,H*.059],[W*.29,0]],'#81b8ae13');
  p(c,[[W*.28,0],[W*.34,H*.052],[W*.46,H*.083],[W*.56,H*.072],[W*.68,H*.024],[W*.7,0],[W*.66,0],[W*.6,H*.032],[W*.5,H*.056],[W*.39,H*.036],[W*.35,0]],'#b4bdd619');
  moon(c,W*.81,H*.096,Math.min(W*.031,H*.043),'#dbe3d1');
  mountain(c,W*.16,H*.33,W*.54,H*.221,'#3c5e7b',true);mountain(c,W*.85,H*.333,W*.53,H*.171,'#51738b',true);mountain(c,W*.44,H*.353,W*.65,H*.162,'#688d9b',true);
  p(c,[[0,H*.375],[W*.2,H*.332],[W*.37,H*.321],[W*.65,H*.341],[W*.84,H*.325],[W,H*.343],[W,H],[0,H]],'#a7bfc0');
  hero(c,4,W,H,portrait,.31,.97);
  p(c,[[0,H*.43],[W*.18,H*.386],[W*.43,H*.412],[W*.62,H*.383],[W*.87,H*.397],[W,H*.418],[W,H],[0,H]],'#bbc9c5');
  p(c,[[0,H*.727],[W*.2,H*.683],[W*.47,H*.712],[W*.65,H*.67],[W*.85,H*.692],[W,H*.658],[W,H],[0,H]],'#9cb4b9');
  p(c,[[W*.38,H],[W*.48,H*.75],[W*.57,H*.626],[W*.63,H*.46],[W*.646,H*.464],[W*.62,H*.643],[W*.58,H*.817],[W*.58,H]],'#879faa20');
  grain(c,W,H,H*.411,'#e5e8d332',347,70);
  for(let side=0;side<2;side++)for(let i=0;i<4;i++){const x=(side?.96+random(i,359)*.04:random(i,353)*.04)*W,y=H*(.32+i*.075);pine(c,x,y,(22+i*5)*(portrait?.74:1),'#507788',true);}
  for(let i=0;i<5;i++){const x=W*(.49+i*.059),y=H*(.34+i*.004);r(c,x,y,1,8,'#718c92');p(c,[[x+1,y],[x+6,y+2],[x+1,y+4]],'#c7ba99');}
  rock(c,W*.045,H*.68,9,'#8ca6ae');p(c,[[W*.045-9,H*.68-4],[W*.045-2,H*.68-8],[W*.045+6,H*.68-5],[W*.045+8,H*.68-2],[W*.045,H*.68]],'#d6e0d2');
}

function luminousTree(c,W,H,portrait){
  bands(c,W,0,H,'#152c3c','#526e6b');
  e(c,W*.49,H*.26,W*.22,H*.26,'#84aaa012');e(c,W*.49,H*.265,W*.12,H*.13,'#acc7a512');
  p(c,[[0,0],[W*.36,0],[W*.25,H*.052],[W*.161,H*.173],[W*.115,H*.379],[W*.086,H*.645],[0,H*.813]],'#314b53');
  p(c,[[W,0],[W*.64,0],[W*.76,H*.055],[W*.848,H*.157],[W*.89,H*.372],[W*.925,H*.701],[W,H*.817]],'#314b53');
  p(c,[[0,0],[W*.126,0],[W*.153,H*.142],[W*.1,H*.364],[W*.066,H*.722],[0,H*.842]],'#4e6460');
  p(c,[[W,0],[W*.897,0],[W*.862,H*.163],[W*.912,H*.393],[W*.946,H*.75],[W,H*.812]],'#4b605e');
  for(let i=0;i<6;i++){const x=W*(.012+i*.014);line(c,x,0,x+W*.015,H*.224,'#8591791c');line(c,x+W*.015,H*.224,x-W*.011,H*.611,'#8591791c');line(c,W-x,0,W-x-W*.013,H*.251,'#9c94731b');}
  for(let i=0;i<11;i++){const x=i*W/10,y=H*(.018+random(i,373)*.041);e(c,x,y,W*.073,H*.063,'#365d59',INK);e(c,x-4,y-5,W*.052,H*.045,'#547b66');}
  const heartW=Math.min(W*.095,H*.07),hx=W*.49,hy=H*(portrait?.18:.185);
  p(c,[[hx-heartW,hy+H*.07],[hx-heartW*.7,hy-H*.012],[hx,hy-H*.05],[hx+heartW*.7,hy-H*.015],[hx+heartW,hy+H*.07]],'#7d9d88',INK);
  p(c,[[hx-heartW*.61,hy+H*.068],[hx-heartW*.4,hy],[hx,hy-H*.031],[hx+heartW*.45,hy],[hx+heartW*.62,hy+H*.068]],'#b4c7a369');
  diamond(c,hx,hy+H*.022,Math.min(5,heartW*.3),H*.025,'#e0dbaf');
  p(c,[[0,H*.407],[W*.16,H*.352],[W*.32,H*.331],[W*.67,H*.332],[W*.86,H*.364],[W,H*.411],[W,H],[0,H]],'#627566');
  p(c,[[0,H*.465],[W*.19,H*.397],[W*.42,H*.414],[W*.63,H*.391],[W*.88,H*.406],[W,H*.453],[W,H],[0,H]],'#77826e');
  for(let i=0;i<8;i++){const y=H*(.424+i*.062);p(c,[[0,y],[W*.2,y-H*.019],[W*.48,y+H*.011],[W*.76,y-H*.012],[W,y+H*.028],[W,y+H*.035],[W*.76,y-H*.006],[W*.48,y+H*.017],[W*.2,y-H*.012],[0,y+H*.008]],i%2?'#485f5822':'#b5b09317');}
  e(c,W*.49,H*.63,W*.43,H*.14,'#a1a27e0c');grain(c,W,H,H*.435,'#d0c4a126',383,65);
  for(let side=0;side<2;side++){const x=side?W*.982:W*.011;for(let i=0;i<4;i++){const y=H*(.455+i*.092),rx=6+i*2;r(c,x,y,2,rx*1.2,'#819791');e(c,x+1,y,rx,rx*.45,i%2?'#7e8eaf':'#779e9a',INK);r(c,x-rx*.5,y-2,rx*.8,1,'#c3c2bc');}lamp(c,side?W*.93:W*.065,H*.298,.55,'#ccbd91');}
  p(c,[[0,H],[0,H*.791],[W*.12,H*.826],[W*.25,H*.964],[W*.38,H],[W*.23,H],[W*.084,H*.878],[W*.047,H]],'#304f4e');
  p(c,[[W,H],[W,H*.778],[W*.899,H*.818],[W*.752,H*.97],[W*.641,H],[W*.79,H],[W*.951,H*.857],[W*.973,H]],'#304b4d');
}

function endlessDawn(c,W,H,portrait){
  bands(c,W,0,H,'#647793','#d6c9a0');
  const sx=W*.505,sy=H*.097,sr=Math.min(W*.027,H*.046);e(c,sx,sy,sr*2.1,sr*2.1,'#ede3af11');e(c,sx,sy,sr*1.45,sr*1.45,'#f3e4b01a');e(c,sx,sy,sr,sr,'#f0e6b8');
  for(let i=0;i<6;i++){const x=W*(.08+i*.16);p(c,[[sx,sy],[x,H*.315],[x+W*.047,H*.315]],'#eddbab09');}
  for(let i=0;i<12;i++){const x=i*W/11,w=W*(.037+random(i,397)*.023),height=H*(.08+random(i,401)*.07);r(c,x,H*.289-height,w,height,'#7b929a');p(c,[[x-2,H*.289-height],[x+w*.5,H*.268-height],[x+w+2,H*.289-height]],'#aaa88c');for(let j=0;j<3;j++)r(c,x+w*.4,H*.296-height+j*height*.23,2,3,'#d7cba365');}
  r(c,0,H*.298,W,H*.71,'#969f9e');hero(c,6,W,H,portrait,.301,1.15);
  railing(c,W,H,H*.327,'#b9baa0',portrait?6:16);
  p(c,[[0,H*.421],[W*.18,H*.371],[W*.47,H*.349],[W*.83,H*.374],[W,H*.412],[W,H],[0,H]],'#b3b6a9');
  for(let i=1;i<9;i++){const y=H*(.36+(i/9)**1.55*.65);line(c,0,y,W,y,'#7f939322');}
  for(let i=-3;i<=8;i++){line(c,W*.5,H*.336,i*W/5,H,'#778c9422');}
  e(c,W*.51,H*.656,W*.4,H*.149,'#d5cdab13');
  for(let side=0;side<2;side++){
    const x=side?W*.985:W*.008,w=W*.044; r(c,x-w*.5,H*.148,w,H*.498,'#7e969c');r(c,x-w*.31,H*.158,w*.35,H*.471,'#cfccae');r(c,x-w*.69,H*.141,w*1.38,5,'#d4c69d');r(c,x-w*.7,H*.637,w*1.4,6,'#829993');
    p(c,[[x-w*.65,H*.14],[x,H*.084],[x+w*.65,H*.14]],'#c6b17f',INK);r(c,x,H*.076,1,H*.02,'#ede0ad');
    const bx=side?W*.951:W*.048; r(c,bx-9,H*.664,18,11,'#798f85');shrub(c,bx,H*.663,1.1,'#607c72','#aaa987');diamond(c,bx,H*.63,5,10,'#cbb582');
  }
  for(let i=0;i<5;i++){const x=W*(.042+random(i,409)*.016),y=H*(.424+i*.044);r(c,x,y,1,4,'#c7b58a');r(c,W-x,y,1,4,'#c7b58a');}
  grain(c,W,H,H*.411,'#e6d7ad1b',419,50);
}

function starwellShore(c,W,H,portrait){
  bands(c,W,0,H,'#202644','#696f9a');
  for(let i=0;i<70;i++){const x=random(i,431)*W,y=random(i,433)*H*.305;r(c,x,y,1,i%17===0?2:1,i%3?'#c0c9bb49':'#e2d8b187');}
  p(c,[[W*.32,0],[W*.41,H*.088],[W*.53,H*.171],[W*.77,H*.251],[W*.88,H*.246],[W*.72,H*.2],[W*.51,H*.127],[W*.44,H*.049],[W*.41,0]],'#bcb1d20b');
  const nodes=[[.32,.046],[.407,.078],[.46,.044],[.54,.094],[.608,.047],[.687,.075]];
  for(let i=1;i<nodes.length;i++)line(c,nodes[i-1][0]*W,nodes[i-1][1]*H,nodes[i][0]*W,nodes[i][1]*H,'#c9c5b128');for(const pt of nodes){r(c,pt[0]*W,pt[1]*H,1,2,'#d6d2b57a');}
  mountain(c,W*.18,H*.281,W*.52,H*.103,'#3d4b74');mountain(c,W*.86,H*.283,W*.42,H*.088,'#414f77');
  bands(c,W,H*.283,H*.34,'#526d91','#4c6983',18);
  hero(c,7,W,H,portrait,.287,1.06);
  for(let i=0;i<28;i++){const y=H*(.287+random(i,439)*.184),x=random(i,443)*W;r(c,x,y,3+random(i,449)*12,1,'#b3c7bc29');}
  p(c,[[0,H*.441],[W*.15,H*.387],[W*.32,H*.399],[W*.49,H*.449],[W*.72,H*.43],[W*.9,H*.388],[W,H*.409],[W,H],[0,H]],'#626d87');
  p(c,[[0,H*.505],[W*.168,H*.443],[W*.36,H*.473],[W*.57,H*.459],[W*.77,H*.487],[W,H*.447],[W,H],[0,H]],'#59677f');
  p(c,[[W*.376,H],[W*.523,H*.782],[W*.582,H*.594],[W*.604,H*.489],[W*.55,H*.44],[W*.567,H*.428],[W*.641,H*.489],[W*.636,H*.629],[W*.59,H*.822],[W*.537,H]],'#8ca1ad16');
  grain(c,W,H,H*.453,'#c4c9b723',457,100);
  for(let side=0;side<2;side++)for(let i=0;i<3;i++){
    const x=(side?.973-random(i,463)*.035:.027+random(i,461)*.035)*W,y=H*(.459+i*.123),s=9+i*4;
    p(c,[[x-s*.5,y],[x-s*.45,y-s*2],[x,y-s*2.7],[x+s*.55,y-s*1.98],[x+s*.6,y]],'#657891',INK);p(c,[[x-s*.34,y-s*1.94],[x,y-s*2.48],[x,y-2],[x-s*.34,y-2]],'#9eacb1');diamond(c,x+s*.15,y-s*1.5,2,4,'#b5d1c3');
  }
  for(let i=0;i<13;i++){const x=(i<6?random(i,467)*.105:.89+random(i,479)*.1)*W,y=H*(.62+random(i,487)*.22);r(c,x,y,1,4,'#899fa0');diamond(c,x,y-2,2,3,i%2?'#ccd6c2':'#bdb7d7');}
  e(c,W*.82,H*.835,W*.065,H*.011,'#a5babb20');e(c,W*.15,H*.837,W*.043,H*.008,'#a5babb20');
}

const SCENES=[harbor,mirrorLake,volcanicFurnace,suspendedCourt,snowyObservatory,luminousTree,endlessDawn,starwellShore];

function getBackdrop(region,width,height){
  const key=region+':'+width+'x'+height;let entry=cache.get(key);if(entry){entry.used=++tick;return entry;}
  let W=Math.min(720,Math.max(240,Math.round(width/2.5))),H=Math.max(120,Math.round(height*W/width));if(H>960){W=Math.max(72,Math.round(W*960/H));H=960;}
  const image=surface(W,H);if(!image)return null;
  const c=image.getContext('2d');c.imageSmoothingEnabled=false;SCENES[region](c,W,H,width<height);vignette(c,W,H);
  const particles=new Float32Array(32*4);for(let i=0;i<32;i++){particles[i*4]=random(i,503+region*13);particles[i*4+1]=random(i,509+region*17);particles[i*4+2]=random(i,521+region*19);particles[i*4+3]=random(i,523+region*23)*Math.PI*2;}
  entry={image,W,H,particles,used:++tick};cache.set(key,entry);pixels+=W*H;
  while(cache.size>CACHE_LIMIT||pixels>PIXEL_LIMIT){let oldestKey,oldest=Infinity;for(const [k,v]of cache){if(v.used<oldest){oldest=v.used;oldestKey=k;}}const drop=cache.get(oldestKey);pixels-=drop.W*drop.H;cache.delete(oldestKey);}
  return entry;
}

function atmosphere(c,region,W,H,t,a,baseAlpha){
  if(region===0){
    for(let i=0;i<10;i++){const j=i*4;c.globalAlpha=baseAlpha*(.1+.09*Math.sin(t*.65+a[j+3]));r(c,(a[j]*W+t*1.2)%W,H*(.28+a[j+1]*.113),3+a[j+2]*5,1,'#d1dcc0');}
    for(let i=10;i<18;i++){const j=i*4,x=(a[j]*W+t*(1+a[j+2]))%W,y=H*(.4+a[j+1]*.32)+Math.sin(t*.4+a[j+3])*3;c.globalAlpha=baseAlpha*.2;r(c,x,y,3,1,'#b7c797');r(c,x+1,y+1,1,1,'#e2d9ac');}
  }else if(region===1){
    for(let i=0;i<24;i++){const j=i*4,x=((a[j]*W-t*(5+a[j+2]*3))%W+W)%W,y=((a[j+1]*H+t*(34+a[j+2]*22))%(H*.8));c.globalAlpha=baseAlpha*(.13+a[j+2]*.13);r(c,x,y,1,3+a[j+2]*4,'#c2d9d3');}
    for(let i=24;i<30;i++){const j=i*4,f=(t*.7+a[j+2])%1,x=a[j]*W,y=H*(.39+a[j+1]*.39);c.globalAlpha=baseAlpha*(1-f)*.23;r(c,x-2-f*4,y,4+f*8,1,'#c0d6cc');r(c,x-1-f*2,y+2,2+f*4,1,'#a9c8c5');}
  }else if(region===2){
    for(let i=0;i<20;i++){const j=i*4,x=(a[j]<.5?a[j]*.16:.84+(a[j]-.5)*.32)*W+Math.sin(t*.8+a[j+3])*3,y=H*.86-((a[j+1]*H*.68+t*(4+a[j+2]*6))%(H*.68));c.globalAlpha=baseAlpha*(.2+a[j+2]*.26);r(c,x,y,1,a[j+2]>.5?2:1,i%3?'#e8b180':'#f3d99e');}
    for(let i=20;i<26;i++){const j=i*4,x=((a[j]*W+t*2)%W),y=H*(.03+a[j+1]*.26);c.globalAlpha=baseAlpha*.055;r(c,x,y,6+a[j+2]*12,2,'#d0b2a0');}
  }else if(region===3){
    for(let i=0;i<14;i++){const j=i*4,x=((a[j]*W+t*(7+a[j+2]*8))%W),y=H*(.11+a[j+1]*.54)+Math.sin(t*.4+a[j+3])*2;c.globalAlpha=baseAlpha*(.065+a[j+2]*.08);r(c,x,y,6+a[j+2]*12,1,'#e5e9c9');if(i<6)r(c,x+3,y+2,3,1,'#d4e0c2');}
    for(let i=14;i<20;i++){const j=i*4;c.globalAlpha=baseAlpha*.18;r(c,(a[j]*W+t*2)%W,H*(.4+a[j+1]*.34)+Math.sin(t*.7+a[j+3])*3,1,1,'#e2d59e');}
  }else if(region===4){
    for(let i=0;i<28;i++){const j=i*4,x=((a[j]*W+Math.sin(t*.22+a[j+3])*5+t*(1+a[j+2]*2))%W+W)%W,y=(a[j+1]*H*.82+t*(3+a[j+2]*5))%(H*.82);c.globalAlpha=baseAlpha*(.25+a[j+2]*.3);r(c,x,y,i%5===0?2:1,i%5===0?2:1,'#e0eade');}
    for(let i=28;i<32;i++){const j=i*4,x=a[j]*W,y=a[j+1]*H*.17;c.globalAlpha=baseAlpha*(.17+.15*Math.sin(t*.6+a[j+3]));r(c,x-1,y,3,1,'#ebead3');r(c,x,y-1,1,3,'#ebead3');}
  }else if(region===5){
    for(let i=0;i<16;i++){const j=i*4,x=a[j]*W+Math.sin(t*.31+a[j+3])*4,y=H*(.15+a[j+1]*.64)+Math.cos(t*.25+a[j+3])*3,pulse=.5+.5*Math.sin(t*.9+a[j+3]);c.globalAlpha=baseAlpha*(.045+pulse*.045);r(c,x-1,y-1,3,3,'#d7dba8');c.globalAlpha=baseAlpha*(.16+pulse*.34);r(c,x,y,1,1,i%3?'#dbe0ad':'#b6c8d9');}
    for(let i=16;i<22;i++){const j=i*4;c.globalAlpha=baseAlpha*.13;r(c,(a[j]*W+t*.8)%W,H*.78-((a[j+1]*H*.48+t*1.2)%(H*.48)),1,1,'#bdd2ae');}
  }else if(region===6){
    for(let i=0;i<18;i++){const j=i*4;c.globalAlpha=baseAlpha*(.1+a[j+2]*.15);r(c,(a[j]*W+t*.35)%W,H*(.13+a[j+1]*.62)+Math.sin(t*.22+a[j+3])*2,1,1,'#eadbab');}
    for(let i=18;i<24;i++){const j=i*4;c.globalAlpha=baseAlpha*(.07+.07*Math.sin(t*.7+a[j+3]));r(c,a[j]*W,H*(.35+a[j+1]*.02),3,1,'#f1e5bc');}
  }else{
    for(let i=0;i<20;i++){const j=i*4,x=a[j]*W+Math.sin(t*.2+a[j+3])*2,y=H*(.035+a[j+1]*.72);c.globalAlpha=baseAlpha*(.1+.19*(.5+.5*Math.sin(t*.8+a[j+3])));r(c,x,y,1,1,i%3?'#ced9cc':'#e1cfb0');}
    for(let i=20;i<26;i++){const j=i*4,x=a[j]*W,y=H*(.04+a[j+1]*.2);c.globalAlpha=baseAlpha*(.08+.11*(.5+.5*Math.sin(t*.6+a[j+3])));r(c,x-1,y,3,1,'#d9d3c0');r(c,x,y-1,1,3,'#d9d3c0');}
    for(let i=26;i<30;i++){const j=i*4;c.globalAlpha=baseAlpha*.16;r(c,a[j]*W+Math.sin(t*.2+a[j+3])*2,H*(.29+a[j+1]*.115),4+a[j+2]*5,1,'#becfc8');}
  }
}

/** Draw a complete island backdrop; layouts adapt rather than crop on phones. */
export function drawBattleBackdrop(ctx,region,width,height,time=0){
  if(!ctx||!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0)return;
  region=Math.max(0,Math.min(7,Math.floor(Number(region)||0)));width=Math.max(1,Math.round(width));height=Math.max(1,Math.round(height));
  const entry=getBackdrop(region,width,height),t=Number.isFinite(time)?Math.max(0,time):0;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(!entry){SCENES[region](ctx,width,height,width<height);vignette(ctx,width,height);ctx.restore();return;}
  ctx.drawImage(entry.image,0,0,width,height);ctx.scale(width/entry.W,height/entry.H);
  atmosphere(ctx,region,entry.W,entry.H,t,entry.particles,ctx.globalAlpha);ctx.restore();
}
