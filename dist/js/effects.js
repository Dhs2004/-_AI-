/* Original, stateless battle effects. No images, canvases, timers or randomness.
 * Coordinates are canvas coordinates; event.size is a visual scale factor.
 * Each branch stays below 60 fill/stroke primitives, including its impact.
 */
const TAU=Math.PI*2;
const COLORS={
  moss: {main:'#92ce8b',light:'#e4efb2',dark:'#4b927b',accent:'#e7bc88'},
  ember:{main:'#ec9466',light:'#ffedb1',dark:'#ad5861',accent:'#f7bb73'},
  tide: {main:'#85cdd5',light:'#e0f1d9',dark:'#408da9',accent:'#b9d8c4'},
  volt: {main:'#e9ca77',light:'#fff3bf',dark:'#679ca4',accent:'#94dbd8'},
  stone:{main:'#b9b8a3',light:'#eddfb4',dark:'#6c8a94',accent:'#e0ac7d'},
  frost:{main:'#b6d8e7',light:'#f0f7e1',dark:'#7897c1',accent:'#ceb9e5'},
  shade:{main:'#b5a2d2',light:'#edd5e5',dark:'#6c689f',accent:'#d29bb9'},
  light:{main:'#e8d49c',light:'#fff5d2',dark:'#a8bca5',accent:'#b4ded0'},
  wind: {main:'#aad9bf',light:'#f0eed0',dark:'#71a5ac',accent:'#c5c8db'},
};
const clamp=n=>Math.max(0,Math.min(1,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
function random(seed,index){let n=Math.imul(seed^(index*374761393),668265263);n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x-w*.5),Math.round(y-h*.5),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));}
function triangle(c,ax,ay,bx,by,dx,dy,color){c.fillStyle=color;c.beginPath();c.moveTo(Math.round(ax),Math.round(ay));c.lineTo(Math.round(bx),Math.round(by));c.lineTo(Math.round(dx),Math.round(dy));c.closePath();c.fill();}
function diamond(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.moveTo(Math.round(x),Math.round(y-ry));c.lineTo(Math.round(x+rx),Math.round(y));c.lineTo(Math.round(x),Math.round(y+ry));c.lineTo(Math.round(x-rx),Math.round(y));c.closePath();c.fill();}
function segment(c,x,y,tx,ty,width,color){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(tx),Math.round(ty));c.stroke();}
function ring(c,x,y,rx,ry,width,color,angle=0,sides=12){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();
  for(let i=0;i<=sides;i++){const a=angle+i*TAU/sides,px=Math.round(x+Math.cos(a)*rx),py=Math.round(y+Math.sin(a)*ry);if(i===0)c.moveTo(px,py);else c.lineTo(px,py);}c.stroke();
}
function cross(c,x,y,r,color){rect(c,x,y,r*2+1,1,color);rect(c,x,y,1,r*2+1,color);}
function leaf(c,x,y,angle,size,pal){
  const ux=Math.cos(angle),uy=Math.sin(angle),vx=-uy,vy=ux;
  c.fillStyle=pal.main;c.beginPath();c.moveTo(Math.round(x-ux*size*6),Math.round(y-uy*size*6));
  c.lineTo(Math.round(x-ux*size+vx*size*3),Math.round(y-uy*size+vy*size*3));
  c.lineTo(Math.round(x+ux*size*7),Math.round(y+uy*size*7));
  c.lineTo(Math.round(x+ux*size-vx*size*3),Math.round(y+uy*size-vy*size*3));c.closePath();c.fill();
  triangle(c,x-ux*size*4,y-uy*size*4,x+vx*size*2,y+vy*size*2,x+ux*size*5,y+uy*size*5,pal.light);
}
function crystal(c,x,y,angle,size,pal){
  const ux=Math.cos(angle),uy=Math.sin(angle),vx=-uy,vy=ux;
  c.fillStyle=pal.main;c.beginPath();c.moveTo(Math.round(x-ux*size*8),Math.round(y-uy*size*8));
  c.lineTo(Math.round(x+vx*size*3),Math.round(y+vy*size*3));c.lineTo(Math.round(x+ux*size*8),Math.round(y+uy*size*8));c.lineTo(Math.round(x-vx*size*3),Math.round(y-vy*size*3));c.closePath();c.fill();
  triangle(c,x-ux*size*7,y-uy*size*7,x+vx*size*2,y+vy*size*2,x+ux*size*6,y+uy*size*6,pal.light);
}
function rock(c,x,y,angle,size,pal){
  c.fillStyle=pal.dark;c.beginPath();
  for(let i=0;i<6;i++){const a=angle+i*TAU/6,rad=size*(i%2?5:6),px=Math.round(x+Math.cos(a)*rad),py=Math.round(y+Math.sin(a)*rad);if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();c.fill();
  triangle(c,x-size*4,y-size*2,x,y-size*5,x+size*3,y-size,pal.main);
}
function star(c,x,y,r,color){
  c.fillStyle=color;c.beginPath();for(let i=0;i<16;i++){const a=-Math.PI/2+i*TAU/16,rad=i%2?r*.3:i%4?r*.68:r,px=Math.round(x+Math.cos(a)*rad),py=Math.round(y+Math.sin(a)*rad);if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.closePath();c.fill();
}
function crescent(c,x,y,angle,r,color){
  const ux=Math.cos(angle),uy=Math.sin(angle);c.fillStyle=color;c.beginPath();
  for(let i=0;i<=14;i++){const a=-Math.PI*.77+i*Math.PI*1.54/14,px=Math.cos(a)*r,py=Math.sin(a)*r;if(i)c.lineTo(Math.round(x+px*ux-py*uy),Math.round(y+px*uy+py*ux));else c.moveTo(Math.round(x+px*ux-py*uy),Math.round(y+px*uy+py*ux));}
  for(let i=14;i>=0;i--){const a=-Math.PI*.77+i*Math.PI*1.54/14,px=Math.cos(a)*r*.69+r*.24,py=Math.sin(a)*r*.79;c.lineTo(Math.round(x+px*ux-py*uy),Math.round(y+px*uy+py*ux));}c.closePath();c.fill();
}
function slash(c,x,y,angle,length,bend,width,color){
  const ux=Math.cos(angle),uy=Math.sin(angle),vx=-uy,vy=ux;c.fillStyle=color;c.beginPath();
  for(let i=0;i<=8;i++){const t=i/8,along=(t-.5)*length,off=Math.sin(t*Math.PI)*(bend+width);const px=Math.round(x+ux*along+vx*off),py=Math.round(y+uy*along+vy*off);if(i)c.lineTo(px,py);else c.moveTo(px,py);}
  for(let i=8;i>=0;i--){const t=i/8,along=(t-.5)*length,off=Math.sin(t*Math.PI)*bend;c.lineTo(Math.round(x+ux*along+vx*off),Math.round(y+uy*along+vy*off));}c.closePath();c.fill();
}
function snowflake(c,x,y,r,color,width){
  c.strokeStyle=color;c.lineWidth=width;c.beginPath();
  for(let i=0;i<6;i++){const a=i*TAU/6,ux=Math.cos(a),uy=Math.sin(a),bx=x+ux*r*.61,by=y+uy*r*.61;c.moveTo(Math.round(x),Math.round(y));c.lineTo(Math.round(x+ux*r),Math.round(y+uy*r));
    for(let s=-1;s<=1;s+=2){const b=a+s*.76;c.moveTo(Math.round(bx),Math.round(by));c.lineTo(Math.round(bx-Math.cos(b)*r*.28),Math.round(by-Math.sin(b)*r*.28));}}
  c.stroke();
}
function bolt(c,fx,fy,tx,ty,p,seed,scale,width,color){
  const dx=tx-fx,dy=ty-fy,len=Math.max(1,Math.hypot(dx,dy)),vx=-dy/len,vy=dx/len,q=clamp(p/.36);c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(Math.round(fx),Math.round(fy));
  for(let i=1;i<=9;i++){const u=Math.min(q,i/9),jitter=i===9?0:(random(seed,i)-.5)*18*scale;c.lineTo(Math.round(fx+dx*u+vx*jitter),Math.round(fy+dy*u+vy*jitter));if(u>=q)break;}c.stroke();
}

function attack(c,element,fx,fy,tx,ty,s,p,seed,pal,alpha){
  const dx=tx-fx,dy=ty-fy,len=Math.hypot(dx,dy),ux=len>.01?dx/len:1,uy=len>.01?dy/len:0,vx=-uy,vy=ux,angle=Math.atan2(uy,ux);
  const q=smooth((p-.025)/.59),impact=clamp((p-.56)/.44),lift=Math.sin(q*Math.PI)*Math.min(30*s,len*.10),cx=fx+dx*q,cy=fy+dy*q-lift;
  const flight=1-smooth((p-.61)/.28),hit=impact>0?Math.sin(Math.PI*impact):0;
  if(element==='moss'){
    c.globalAlpha=alpha*flight*.35;slash(c,cx-ux*16*s,cy-uy*16*s,angle,48*s,-8*s,2*s,pal.dark);
    for(let i=0;i<7;i++){const lag=i*.053,t=clamp(q-lag),offset=Math.sin(q*7+i*1.9)*(3+i*.5)*s,x=fx+dx*t+vx*offset,y=fy+dy*t-Math.sin(t*Math.PI)*Math.min(30*s,len*.10)+vy*offset;c.globalAlpha=alpha*flight*(.85-i*.085);leaf(c,x,y,angle+.5*Math.sin(p*7+i),s*(.48+i*.035),pal);}
    if(hit>0)for(let i=0;i<6;i++){const a=i*TAU/6+random(seed,i)*.45,r=(7+impact*28)*s;c.globalAlpha=alpha*hit*.85;leaf(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r*.7,a+impact*2,s*(.54-impact*.22),pal);}
  }else if(element==='ember'){
    for(let i=0;i<12;i++){const lag=i*.027,t=clamp(q-lag),offset=(random(seed,i)-.5)*(5+i)*s;c.globalAlpha=alpha*flight*(.7-i*.043);rect(c,fx+dx*t+vx*offset,fy+dy*t-Math.sin(t*Math.PI)*Math.min(30*s,len*.10)+vy*offset,(4-i*.2)*s,(3-i*.12)*s,i%3?pal.main:pal.accent);}
    c.globalAlpha=alpha*flight;triangle(c,cx+ux*9*s,cy+uy*9*s,cx-ux*13*s+vx*5*s,cy-uy*13*s+vy*5*s,cx-ux*8*s-vx*5*s,cy-uy*8*s-vy*5*s,pal.main);diamond(c,cx,cy,4*s,5*s,pal.light);
    if(hit>0){for(let i=0;i<11;i++){const a=TAU*random(seed,i+20),r=(7+impact*(20+random(seed,i+40)*17))*s;c.globalAlpha=alpha*hit*(.55+random(seed,i+55)*.35);triangle(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r,tx+Math.cos(a+.15)*(r+7*s),ty+Math.sin(a+.15)*(r+7*s),tx+Math.cos(a-.11)*(r+3*s),ty+Math.sin(a-.11)*(r+3*s),i%3?pal.main:pal.accent);}c.globalAlpha=alpha*hit*.72;star(c,tx,ty,10*s,pal.light);}
  }else if(element==='tide'){
    for(let i=0;i<7;i++){const t=clamp(q-i*.045),off=Math.sin(p*8+i*1.7)*(5+i)*s,x=fx+dx*t+vx*off,y=fy+dy*t-Math.sin(t*Math.PI)*Math.min(30*s,len*.10)+vy*off,rad=(3+random(seed,i)*4)*s;c.globalAlpha=alpha*flight*(.8-i*.065);ring(c,x,y,rad,rad,1.5*s,pal.main,Math.PI/8,8);rect(c,x-rad*.27,y-rad*.48,2*s,s,pal.light);}
    c.globalAlpha=alpha*flight*.7;slash(c,cx,cy,angle,28*s,7*s,4*s,pal.main);
    if(hit>0){c.globalAlpha=alpha*hit*.7;ring(c,tx,ty+5*s,(11+impact*24)*s,(5+impact*10)*s,2*s,pal.main,0,14);ring(c,tx,ty+3*s,(7+impact*14)*s,(3+impact*6)*s,s,pal.light,0,12);for(let i=0;i<8;i++){const a=i*TAU/8,r=(8+impact*28)*s;c.globalAlpha=alpha*hit*.85;diamond(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r*.65-9*s*Math.sin(impact*Math.PI),2*s,3*s,pal.main);}}
  }else if(element==='volt'){
    const flicker=.74+.26*Math.sin(p*95+seed),jitterSeed=seed+Math.floor(p*17)*19;
    c.globalAlpha=alpha*(1-impact*.8)*flicker*.36;bolt(c,fx,fy,tx,ty,p,jitterSeed,s,6*s,pal.dark);
    c.globalAlpha=alpha*(1-impact*.8)*flicker;bolt(c,fx,fy,tx,ty,p,jitterSeed,s,2*s,pal.light);
    for(let i=0;i<3;i++){const u=.25+i*.24;if(q<u)continue;const x=fx+dx*u,y=fy+dy*u,side=i%2?1:-1;c.globalAlpha=alpha*flight*.7;segment(c,x,y,x+vx*side*13*s-ux*6*s,y+vy*side*13*s-uy*6*s,2*s,pal.main);segment(c,x+vx*side*13*s-ux*6*s,y+vy*side*13*s-uy*6*s,x+vx*side*20*s,y+vy*side*20*s,s,pal.accent);}
    if(hit>0){c.globalAlpha=alpha*hit;star(c,tx,ty,15*s,pal.main);star(c,tx,ty,7*s,pal.light);for(let i=0;i<7;i++){const a=i*TAU/7+random(seed,i)*.4,r=(9+impact*25)*s;rect(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r,2*s,3*s,i%2?pal.accent:pal.light);}}
  }else if(element==='stone'){
    for(let i=0;i<5;i++){const t=clamp(q-i*.062),off=(i-2)*6*s,x=fx+dx*t+vx*off,y=fy+dy*t-Math.sin(t*Math.PI)*(18+i*4)*s+vy*off;c.globalAlpha=alpha*flight*(.9-i*.1);rock(c,x,y,p*3+i,s*(.72+random(seed,i)*.45),pal);}
    if(hit>0){for(let i=0;i<8;i++){const a=i*TAU/8+random(seed,i)*.4,r=(4+impact*(19+random(seed,i+9)*15))*s;c.globalAlpha=alpha*hit*.9;rock(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r*.55+impact*impact*10*s,a+impact*3,s*(.48-impact*.21),pal);}for(let i=0;i<6;i++){c.globalAlpha=alpha*hit*.33;rect(c,tx+(random(seed,i+70)-.5)*(25+impact*35)*s,ty+12*s+random(seed,i+90)*7*s,(4+impact*3)*s,2*s,pal.light);}}
  }else if(element==='frost'){
    for(let i=0;i<7;i++){const t=clamp(q-i*.039),off=(i%2?1:-1)*(2+i*2.4)*s,x=fx+dx*t+vx*off,y=fy+dy*t-Math.sin(t*Math.PI)*Math.min(30*s,len*.10)+vy*off;c.globalAlpha=alpha*flight*(.88-i*.075);crystal(c,x,y,angle,s*(.55+random(seed,i)*.28),pal);}
    if(hit>0){for(let i=0;i<6;i++){const a=i*TAU/6+.2,r=(5+impact*27)*s;c.globalAlpha=alpha*hit*.8;crystal(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r*.8,a,s*(.54-impact*.2),pal);}c.globalAlpha=alpha*hit*.65;snowflake(c,tx,ty,(12+impact*12)*s,pal.light,s);snowflake(c,tx+14*s,ty-18*s,(4+impact*5)*s,pal.accent,s);}
  }else if(element==='shade'){
    for(let i=2;i>=0;i--){const lag=i*.046,t=clamp(q-lag),x=fx+dx*t,y=fy+dy*t-Math.sin(t*Math.PI)*Math.min(30*s,len*.10);c.globalAlpha=alpha*flight*(.78-i*.22);crescent(c,x,y,angle+p*1.3,16*s-i*2*s,i?pal.dark:pal.main);}
    for(let i=0;i<8;i++){const t=clamp(q-i*.024),off=Math.sin(p*6+i*1.2)*(8+i)*s;c.globalAlpha=alpha*flight*.4;rect(c,fx+dx*t+vx*off,fy+dy*t-Math.sin(t*Math.PI)*20*s+vy*off,2*s,2*s,i%2?pal.accent:pal.main);}
    if(hit>0){c.globalAlpha=alpha*hit*.55;ring(c,tx,ty,(13+impact*20)*s,(13+impact*20)*s,s,pal.main,p,10);for(let i=0;i<6;i++){const a=i*TAU/6+p,r=(11+impact*23)*s;c.globalAlpha=alpha*hit*.85;diamond(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r,2*s,4*s,pal.accent);}c.globalAlpha=alpha*hit*.7;crescent(c,tx,ty,-p*2,17*s,pal.light);}
  }else if(element==='light'){
    for(let i=0;i<6;i++){const t=clamp(q-i*.047);c.globalAlpha=alpha*flight*(.55-i*.055);rect(c,fx+dx*t,fy+dy*t-Math.sin(t*Math.PI)*Math.min(30*s,len*.10),2*s,2*s,i%2?pal.accent:pal.main);}
    c.globalAlpha=alpha*flight;star(c,cx,cy,11*s,pal.main);diamond(c,cx,cy,3*s,5*s,pal.light);
    if(hit>0){c.globalAlpha=alpha*hit*.4;ring(c,tx,ty,(9+impact*25)*s,(9+impact*25)*s,s,pal.main,Math.PI/8,8);for(let i=0;i<8;i++){const a=i*TAU/8,rr=(10+impact*20)*s;c.globalAlpha=alpha*hit*.7;segment(c,tx+Math.cos(a)*rr,ty+Math.sin(a)*rr,tx+Math.cos(a)*(rr+7*s),ty+Math.sin(a)*(rr+7*s),s,i%2?pal.accent:pal.main);}c.globalAlpha=alpha*hit;star(c,tx,ty,(17-impact*6)*s,pal.light);for(let i=0;i<4;i++){const a=i*TAU/4+.35,r=(16+impact*12)*s;cross(c,tx+Math.cos(a)*r,ty+Math.sin(a)*r,2*s,pal.main);}}
  }else{
    for(let i=0;i<3;i++){const t=clamp(q-i*.044),x=fx+dx*t+vx*(i-1)*8*s,y=fy+dy*t-Math.sin(t*Math.PI)*Math.min(30*s,len*.10)+vy*(i-1)*8*s;c.globalAlpha=alpha*flight*(.8-i*.17);slash(c,x,y,angle+.36,32*s+i*5*s,-8*s,4*s,pal.main);slash(c,x+vx*s,y+vy*s,angle+.36,25*s+i*4*s,-7*s,s,pal.light);}
    for(let i=0;i<6;i++){const t=clamp(q-i*.05),off=(random(seed,i)-.5)*34*s;c.globalAlpha=alpha*flight*.33;segment(c,fx+dx*t+vx*off,fy+dy*t+vy*off,fx+dx*t+vx*off-ux*6*s,fy+dy*t+vy*off-uy*6*s,s,pal.dark);}
    if(hit>0)for(let i=0;i<3;i++){c.globalAlpha=alpha*hit*(.7-i*.12);slash(c,tx+(i-1)*9*s,ty+(i-1)*5*s,-.9+impact*.4,42*s+impact*12*s,7*s,4*s,pal.light);}
  }
}

function heal(c,x,y,s,p,seed,alpha){
  const pal=COLORS.moss;c.globalAlpha=alpha*Math.sin(p*Math.PI)*.23;ring(c,x,y+18*s,(18+Math.sin(p*Math.PI)*8)*s,8*s,s,pal.main,0,12);ring(c,x,y+16*s,15*s,5*s,s,pal.light,0,12);
  for(let i=0;i<12;i++){
    const phase=clamp((p-random(seed,i)*.19)/.81),a=random(seed,i+17)*TAU,xx=x+Math.cos(a)*(9+random(seed,i+28)*18)*s+Math.sin(p*4+i)*2*s,yy=y+20*s-phase*(32+random(seed,i+37)*27)*s;
    c.globalAlpha=alpha*Math.sin(phase*Math.PI)*(.48+random(seed,i+57)*.35);
    if(i<5)leaf(c,xx,yy,-Math.PI/2+Math.sin(p*3+i)*.3,s*.38,pal);else if(i<8)cross(c,xx,yy,2*s,pal.light);else rect(c,xx,yy,2*s,3*s,pal.main);
  }
}
function capture(c,x,y,s,p,seed,alpha){
  const pal=COLORS.light,converge=smooth(p/.72),radius=(49-converge*28)*s,tilt=random(seed,4)*TAU;
  for(let i=0;i<3;i++){
    const a=tilt+i*TAU/3+p*TAU*1.15,xx=x+Math.cos(a)*radius,yy=y+Math.sin(a)*radius*.7;
    for(let j=3;j>0;j--){const tail=a-j*.13;c.globalAlpha=alpha*(.34-j*.065)*(1-smooth((p-.77)/.23));rect(c,x+Math.cos(tail)*radius,y+Math.sin(tail)*radius*.7,(3-j*.5)*s,(3-j*.5)*s,pal.main);}
    c.globalAlpha=alpha*(.88-smooth((p-.77)/.23)*.6);crystal(c,xx,yy,a+Math.PI/2,s*.58,pal);
  }
  const ringIn=smooth((p-.35)/.36);c.globalAlpha=alpha*ringIn*.66;ring(c,x,y,23*s,18*s,2*s,pal.main,tilt*.15,12);c.globalAlpha=alpha*ringIn*.32;ring(c,x,y,28*s,23*s,s,pal.accent,tilt*.15,12);
  for(let i=0;i<6;i++){const a=tilt*.15+i*TAU/6;c.globalAlpha=alpha*ringIn*.8;diamond(c,x+Math.cos(a)*23*s,y+Math.sin(a)*18*s,2*s,2*s,i%2?pal.accent:pal.light);}
  c.globalAlpha=alpha*smooth((p-.62)/.23)*.82;star(c,x,y,10*s,pal.main);diamond(c,x,y,3*s,5*s,pal.light);
}
function shield(c,x,y,s,p,seed,pal,alpha){
  const grow=.72+.28*smooth(p/.3),rx=27*s*grow,ry=34*s*grow;
  c.fillStyle=pal.main;c.globalAlpha=alpha*.105;c.beginPath();c.moveTo(Math.round(x),Math.round(y-ry));c.lineTo(Math.round(x+rx),Math.round(y-ry*.48));c.lineTo(Math.round(x+rx*.8),Math.round(y+ry*.48));c.lineTo(Math.round(x),Math.round(y+ry));c.lineTo(Math.round(x-rx*.8),Math.round(y+ry*.48));c.lineTo(Math.round(x-rx),Math.round(y-ry*.48));c.closePath();c.fill();
  c.globalAlpha=alpha*.72;c.strokeStyle=pal.main;c.lineWidth=2*s;c.stroke();
  c.globalAlpha=alpha*.28;triangle(c,x,y-ry*.82,x+rx*.82,y-ry*.38,x,y+ry*.78,pal.light);triangle(c,x,y+ry*.78,x-rx*.64,y+ry*.34,x-rx*.82,y-ry*.38,pal.dark);
  c.globalAlpha=alpha*.7;segment(c,x,y-ry*.64,x,y+ry*.46,s,pal.light);segment(c,x-rx*.48,y-3*s,x+rx*.48,y-3*s,s,pal.light);diamond(c,x,y-3*s,4*s,6*s,pal.light);
  for(let i=0;i<7;i++){const a=TAU*random(seed,i),r=(32+random(seed,i+9)*9)*s;c.globalAlpha=alpha*Math.sin(clamp((p-i*.02)/.86)*Math.PI)*.36;rect(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.8-p*9*s,2*s,2*s,pal.accent);}
}
function faint(c,x,y,s,p,seed,pal,alpha){
  for(let i=0;i<11;i++){const a=TAU*random(seed,i),radius=(4+p*(12+random(seed,i+17)*11))*s,xx=x+Math.cos(a)*radius,yy=y+Math.sin(a)*radius*.55+p*p*15*s;c.globalAlpha=alpha*(1-p)*(.22+random(seed,i+33)*.32);rect(c,xx,yy,(1+random(seed,i+47)*2)*s,(1+random(seed,i+57)*2)*s,i%3?pal.dark:pal.main);}
}

/**
 * Draw one normalized effect frame. Endpoints are transparent.
 * Root owns event lifetime, layout, damage labels and reduced-motion policy.
 */
export function drawBattleEffect(ctx,event,progress){
  if(!ctx||!event||!Number.isFinite(progress))return;
  const p=clamp(progress);if(p<=0||p>=1)return;
  const tx=Number(event.to?.x),ty=Number(event.to?.y);if(!Number.isFinite(tx)||!Number.isFinite(ty))return;
  const rawX=Number(event.from?.x),rawY=Number(event.from?.y),fx=Number.isFinite(rawX)?rawX:tx,fy=Number.isFinite(rawY)?rawY:ty;
  const rawSize=Number(event.size),s=Number.isFinite(rawSize)&&rawSize>0?Math.max(.2,Math.min(4,rawSize)):1,seed=Number(event.seed)|0,element=COLORS[event.element]?event.element:'light',pal=COLORS[element];
  ctx.save();
  const alpha=ctx.globalAlpha*smooth(p/.09)*(1-smooth((p-.88)/.12));
  ctx.lineCap='butt';ctx.lineJoin='miter';ctx.miterLimit=2;ctx.imageSmoothingEnabled=false;
  if(event.kind==='heal')heal(ctx,tx,ty,s,p,seed,alpha);
  else if(event.kind==='capture')capture(ctx,tx,ty,s,p,seed,alpha);
  else if(event.kind==='buff')shield(ctx,tx,ty,s,p,seed,pal,alpha);
  else if(event.kind==='faint')faint(ctx,tx,ty,s,p,seed,pal,alpha);
  else attack(ctx,element,fx,fy,tx,ty,s,p,seed,pal,alpha);
  ctx.restore();
}
