/*
 * Starfall Chronicle — original pixel art, drawn entirely in code.
 * All public draw functions use the top-left of a square as their anchor.
 * Sprite coordinates are a 64-pixel grid, deliberately rendered without
 * smoothing. No network requests, imported images, or random state are used.
 */

import {SpriteCache} from './sprite-cache.js';

const INK = '#192d3b';
const WHITE = '#fff7d6';
const PALETTES = {
  moss:  {base:'#72b973', shade:'#3f7d67', light:'#b8df8b', accent:'#f2bd76', ink:'#254840', detail:'#e5ecaf', glow:'#c7f398'},
  ember: {base:'#ec9066', shade:'#b65354', light:'#ffd396', accent:'#ffeb90', ink:'#663951', detail:'#ffeec5', glow:'#ffb866'},
  tide:  {base:'#64b7c2', shade:'#397f9b', light:'#abe2d8', accent:'#eaa3a0', ink:'#244c70', detail:'#e4f0d7', glow:'#9be4ed'},
  volt:  {base:'#e9c966', shade:'#b28551', light:'#fff0a1', accent:'#87dae0', ink:'#645344', detail:'#fff7d1', glow:'#d6f59b'},
  stone: {base:'#9fa5a8', shade:'#687c88', light:'#d4d1c1', accent:'#db9d72', ink:'#354c5a', detail:'#f0ddaf', glow:'#b7e3dd'},
  frost: {base:'#9bc8dd', shade:'#708fba', light:'#ddf1f0', accent:'#d2b2eb', ink:'#435779', detail:'#fff6dd', glow:'#ceecff'},
  shade: {base:'#a08dbd', shade:'#6d6397', light:'#cdb8df', accent:'#e3a1b0', ink:'#393958', detail:'#f4d6d4', glow:'#cfaff4'},
  light: {base:'#e4ce97', shade:'#b89978', light:'#fff0b9', accent:'#95c9bc', ink:'#655c67', detail:'#fff9e3', glow:'#fff2ad'},
  wind:  {base:'#9cc9ad', shade:'#649697', light:'#d9e8b6', accent:'#e3b5bf', ink:'#365866', detail:'#fff0d8', glow:'#d1f2dc'},
};

const spriteCache = new SpriteCache(384);

function hash(value) {
  let h = 2166136261;
  for (const ch of String(value ?? '')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

function timeValue(t) {
  const n = Number(t) || 0;
  // The public time unit is seconds; do not guess milliseconds from its
  // magnitude, since a long play session must keep the same animation rate.
  return Number.isFinite(n) ? n : 0;
}

function paletteFor(species = {}) {
  const p = {...(PALETTES[species.element] || PALETTES.light)};
  if (Array.isArray(species.palette)) {
    ['base','shade','light','accent','ink','detail','glow'].forEach((key, i) => {
      if (species.palette[i]) p[key] = species.palette[i];
    });
  } else if (species.palette && typeof species.palette === 'object') {
    Object.assign(p, species.palette);
  }
  return p;
}

function mix(a,b,f=.5) {
  if (!/^#[\da-f]{6}$/i.test(a) || !/^#[\da-f]{6}$/i.test(b)) return a;
  const channel=i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-f)+parseInt(b.slice(i,i+2),16)*f).toString(16).padStart(2,'0');
  return '#'+channel(1)+channel(3)+channel(5);
}

function r(c, x, y, w, h, color) {
  if (w <= 0 || h <= 0) return;
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function fillPolygon(c, points, color, dx = 0, dy = 0) {
  c.fillStyle = color;
  const ys = points.map(a => a[1]);
  const min = Math.ceil(Math.min(...ys));
  const max = Math.floor(Math.max(...ys));
  for (let y = min; y <= max; y++) {
    const xs = [];
    const scan = y + .5;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i], b = points[j];
      if ((a[1] <= scan && b[1] > scan) || (b[1] <= scan && a[1] > scan)) {
        xs.push(a[0] + (scan - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
    }
    xs.sort((a,b) => a-b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const start = Math.ceil(xs[i]);
      c.fillRect(start + dx, y + dy, Math.max(1, Math.floor(xs[i+1]) - start + 1), 1);
    }
  }
}

function p(c, points, color, outline = INK) {
  if (outline) {
    fillPolygon(c, points, outline, -1, 0);
    fillPolygon(c, points, outline, 1, 0);
    fillPolygon(c, points, outline, 0, -1);
    fillPolygon(c, points, outline, 0, 1);
  }
  fillPolygon(c, points, color);
}

function ellipse(c, cx, cy, rx, ry, color) {
  c.fillStyle = color;
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const k = (y + .5 - cy) / ry;
    if (Math.abs(k) > 1) continue;
    const reach = rx * Math.sqrt(1 - k * k);
    const x = Math.ceil(cx - reach);
    c.fillRect(x, y, Math.max(1, Math.floor(cx + reach) - x + 1), 1);
  }
}

function e(c, x, y, rx, ry, color, outline = INK) {
  if (outline) ellipse(c, x, y, rx + 1, ry + 1, outline);
  ellipse(c, x, y, rx, ry, color);
}

function line(c, x0, y0, x1, y1, color, width = 1) {
  x0 = Math.round(x0); y0 = Math.round(y0);
  x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1-x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1-y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    r(c, x0, y0, width, width, color);
    if (x0 === x1 && y0 === y1) break;
    const er = 2 * err;
    if (er >= dy) { err += dy; x0 += sx; }
    if (er <= dx) { err += dx; y0 += sy; }
  }
}

function diamond(c, x, y, radius, color, outline = null) {
  p(c, [[x,y-radius],[x+radius,y],[x,y+radius],[x-radius,y]], color, outline);
}

function sparkle(c, x, y, color, radius = 2) {
  r(c,x,y-radius,1,radius*2+1,color);
  r(c,x-radius,y,radius*2+1,1,color);
}

function eye(c, x, y, p, o, big = false) {
  if (o.back) return;
  if (o.blink || ['sleep','sleepy','sad','faint','fainted'].includes(o.emotion)) {
    line(c,x-1,y+1,x+2,y+1,p.ink); return;
  }
  if (o.emotion === 'happy') {
    line(c,x-1,y+1,x,y,p.ink); line(c,x,y,x+2,y+1,p.ink); return;
  }
  r(c,x,y,big?4:3,big?5:4,p.ink);
  r(c,x,y,1,2,WHITE);
  if (big) r(c,x+1,y+3,2,1,p.accent);
  if (o.emotion === 'hurt') line(c,x-1,y-1,x+3,y+1,p.ink);
  if (o.emotion === 'angry') line(c,x-1,y-2,x+3,y-1,p.ink);
}

function face(c, x, y, spread, pal, o, opts = {}) {
  if (o.back) {
    line(c,x-5,y-2,x-2,y+1,pal.shade);
    line(c,x+2,y+1,x+5,y-2,pal.shade);
    return;
  }
  eye(c,x-spread,y,pal,o,opts.big);
  eye(c,x+spread-2,y,pal,o,opts.big);
  if (opts.cheek !== false) {
    r(c,x-spread-3,y+4,3,1,pal.accent);
    r(c,x+spread+2,y+4,3,1,pal.accent);
  }
  if (opts.nose !== false) {
    r(c,x-1,y+5,3,1,pal.ink);
    r(c,x,y+6,1,1,pal.ink);
  }
  if (opts.mouth) {
    line(c,x-3,y+7,x-1,y+8,pal.ink);
    line(c,x,y+8,x+2,y+7,pal.ink);
  }
}

function motif(c, x, y, pal, element, stage = 1, flip = false) {
  c.save(); c.translate(x,y); if (flip) c.scale(-1,1);
  const q = stage > 1 ? 2 : 0;
  if (element === 'moss' || element === 'wind') {
    p(c,[[-1,2],[-8,-2],[-9,-7-q],[-3,-6],[1,-1]],pal.shade,pal.ink);
    p(c,[[0,1],[2,-8-q],[7,-12-q],[8,-5],[3,0]],pal.light,pal.ink);
    line(c,0,0,5,-8,pal.base);
    if (stage > 1) { e(c,-7,-7,2,2,pal.accent,null); r(c,-7,-8,1,1,WHITE); }
  } else if (element === 'ember') {
    p(c,[[-6,0],[-7,-5],[-3,-4],[-1,-13-q],[3,-6],[5,-8],[7,-1],[3,3]],pal.base,pal.ink);
    p(c,[[-3,1],[-2,-4],[1,-7],[2,-1],[4,1],[0,3]],pal.accent,null);
    r(c,0,-3,1,4,pal.light);
  } else if (element === 'tide') {
    p(c,[[-1,3],[-5,-4],[-8,-6],[-6,-9],[-2,-6],[-3,-13-q],[0,-14-q],[2,-6],[5,-11],[8,-9],[4,-3],[3,3]],pal.accent,pal.ink);
    line(c,0,-10,1,1,pal.light);
  } else if (element === 'volt') {
    p(c,[[-5,3],[-2,-5],[-5,-5],[2,-15-q],[2,-7],[7,-7],[1,3]],pal.accent,pal.ink);
    line(c,-1,-2,2,-6,pal.detail);
  } else if (element === 'stone' || element === 'frost') {
    p(c,[[-6,2],[-8,-5],[-4,-10],[0,-6],[2,-16-q],[6,-11],[7,-2],[3,4]],pal.light,pal.ink);
    p(c,[[2,-14-q],[2,2],[6,-2],[5,-10]],pal.accent,null);
    line(c,-4,-8,-1,1,pal.shade);
    r(c,2,-11,1,5,WHITE);
  } else if (element === 'shade') {
    p(c,[[-1,-12-q],[-7,-8],[-7,-2],[-3,3],[4,3],[8,-3],[3,-1],[-1,-2],[-3,-6]],pal.accent,pal.ink);
    diamond(c,4,-7,2,pal.light,null);
  } else {
    p(c,[[0,-13-q],[3,-6],[8,-3],[3,0],[0,4],[-3,-1],[-7,-3],[-3,-6]],pal.light,pal.ink);
    diamond(c,0,-3,2,pal.accent,null);
    r(c,0,-8,1,3,WHITE);
  }
  c.restore();
}

function paw(c, x, y, pal, width = 7) {
  e(c,x,y,width/2,2,pal.shade,pal.ink);
  r(c,x-2,y-1,4,1,pal.light);
  r(c,x-1,y+1,1,1,pal.ink);
}

function fox(c, pal, o) {
  const a = o.phase === 1 ? 1 : 0;
  p(c,[[39,44],[48,44],[51,37],[48,31],[52,27],[59,32],[61,42+a],[56,51],[44,52]],pal.base,pal.ink);
  p(c,[[51,37],[48,31],[52,27],[59,32],[59,38],[56,42],[52,41]],pal.light,null);
  line(c,49,47,55,44,pal.shade,2);
  if (o.stage > 1) motif(c,56,32,pal,o.element,o.stage,true);
  e(c,30,44,12,12,pal.base,pal.ink);
  e(c,28,42,7,10,pal.light,null);
  paw(c,21,55,pal,8); paw(c,38,55,pal,8);
  p(c,[[17,25],[14,10],[17,5],[26,21]],pal.base,pal.ink);
  p(c,[[19,22],[17,12],[22,20]],pal.accent,null);
  p(c,[[34,22],[42,7],[45,10],[43,26]],pal.base,pal.ink);
  p(c,[[38,22],[42,13],[41,25]],pal.accent,null);
  p(c,[[17,22],[22,18],[34,18],[42,23],[43,30],[47,33],[42,38],[33,41],[23,38],[14,33],[17,29]],pal.base,pal.ink);
  p(c,[[15,31],[23,31],[29,34],[35,31],[44,32],[38,37],[28,39],[20,36]],pal.light,null);
  p(c,[[22,19],[28,16],[34,19],[30,22]],pal.light,null);
  face(c,29,26,7,pal,o,{mouth:true});
  p(c,[[19,39],[23,43],[24,48],[29,45],[32,48],[36,42],[40,40],[32,39]],pal.detail,pal.ink);
  diamond(c,29,42,2,pal.accent,null);
  if (o.stage === 3) { motif(c,29,20,pal,o.element,1); r(c,17,43,2,3,pal.accent); }
}

function cat(c, pal, o) {
  p(c,[[19,49],[10,48],[5,42],[5,33],[9,28],[14,28],[17,32],[15,37],[11,37],[11,33],[8,36],[9,42],[18,43]],pal.shade,pal.ink);
  e(c,14,30,4,5,pal.accent,pal.ink); r(c,13,27,2,3,pal.detail);
  if (o.stage > 1) { r(c,12,23,4,2,pal.ink); line(c,14,23,15,19,pal.ink); sparkle(c,6,29,pal.glow); }
  e(c,33,44,13,12,pal.base,pal.ink);
  e(c,35,44,7,8,pal.light,null);
  paw(c,25,55,pal,9); paw(c,43,55,pal,9);
  p(c,[[20,26],[19,12],[23,10],[30,20],[37,19],[46,9],[48,13],[46,30]],pal.base,pal.ink);
  p(c,[[23,23],[23,16],[28,22]],pal.accent,null);
  p(c,[[40,22],[46,15],[45,25]],pal.accent,null);
  e(c,34,29,15,11,pal.base,pal.ink);
  p(c,[[19,31],[24,30],[29,34],[35,34],[41,30],[49,31],[44,37],[34,41],[25,37]],pal.light,null);
  face(c,34,27,8,pal,o,{big:true,mouth:true});
  if (!o.back) { line(c,18,32,23,33,pal.ink); line(c,46,33,51,32,pal.ink); }
  p(c,[[24,40],[31,41],[43,40],[41,44],[34,45],[25,43]],pal.accent,pal.ink);
  diamond(c,34,44,3,pal.detail,pal.ink);
  p(c,[[31,20],[32,24],[35,25],[37,20]],pal.shade,null);
  if (o.stage > 1) { line(c,42,48,47,46,pal.shade,2); motif(c,34,19,pal,o.element,o.stage); }
}

function turtle(c, pal, o) {
  paw(c,14,52,pal,10); paw(c,43,52,pal,10);
  p(c,[[11,44],[5,43],[7,47],[14,49]],pal.base,pal.ink);
  e(c,30,39,21,14,pal.shade,pal.ink);
  p(c,[[11,37],[17,29],[26,25],[38,27],[48,36],[45,44],[16,45]],pal.base,pal.ink);
  p(c,[[26,28],[35,28],[39,34],[35,41],[25,41],[21,34]],pal.light,pal.ink);
  line(c,21,34,14,34,pal.ink); line(c,39,34,45,35,pal.ink);
  line(c,25,41,20,46,pal.ink); line(c,35,41,39,46,pal.ink);
  p(c,[[10,42],[21,45],[41,45],[49,41],[47,46],[40,49],[20,49],[11,46]],pal.detail,pal.ink);
  e(c,51,43,9,8,pal.base,pal.ink);
  p(c,[[45,46],[57,46],[57,49],[49,51]],pal.light,null);
  eye(c,51,40,pal,o,true); if (!o.back) line(c,55,47,59,46,pal.ink);
  r(c,58,42,2,1,pal.shade);
  paw(c,51,52,pal,9);
  if (o.element === 'moss' || o.element === 'wind') {
    p(c,[[26,29],[28,19],[25,15],[30,17],[34,12],[33,21],[35,28]],'#7b6e57',pal.ink);
    e(c,23,16,9,5,pal.shade,pal.ink);
    e(c,36,14,10,6,pal.base,pal.ink);
    e(c,29,10,10,6,pal.light,pal.ink);
    r(c,24,8,7,2,pal.detail); e(c,40,15,2,2,pal.accent,null);
    if (o.stage > 1) { e(c,21,14,2,2,pal.accent,null); e(c,34,9,2,2,pal.accent,null); }
  } else { motif(c,28,29,pal,o.element,o.stage); if (o.stage > 1) motif(c,40,32,pal,o.element,1); }
  if (o.stage === 3) { diamond(c,29,34,3,pal.accent,pal.ink); p(c,[[44,36],[43,30],[47,33]],pal.detail,pal.ink); }
}

function bird(c, pal, o) {
  const flap = o.phase === 1 ? -2 : o.phase === 3 ? 1 : 0;
  p(c,[[23,30],[15,24+flap],[5,19+flap],[8,30],[13,33],[9,34],[18,40],[26,40]],pal.base,pal.ink);
  p(c,[[42,29],[50,22+flap],[60,18+flap],[58,29],[54,33],[58,33],[49,40],[39,40]],pal.base,pal.ink);
  p(c,[[6,21+flap],[14,25+flap],[19,33],[12,30]],pal.light,null);
  p(c,[[59,20+flap],[51,25+flap],[46,34],[53,30]],pal.light,null);
  line(c,14,30,21,35,pal.shade,2); line(c,52,30,45,35,pal.shade,2);
  p(c,[[26,43],[23,56],[30,52],[33,58],[35,51],[41,56],[39,43]],pal.shade,pal.ink);
  p(c,[[30,47],[32,53],[35,47]],pal.accent,null);
  e(c,33,37,12,15,pal.base,pal.ink);
  e(c,33,38,8,10,pal.light,null);
  e(c,33,25,11,10,pal.base,pal.ink);
  p(c,[[24,25],[28,24],[32,28],[36,24],[43,25],[38,33],[28,33]],pal.detail,null);
  face(c,33,25,7,pal,o,{nose:false,cheek:false});
  if (!o.back) p(c,[[30,31],[36,31],[33,36]],pal.accent,pal.ink);
  p(c,[[29,17],[26,10],[31,13],[33,6],[36,14],[40,11],[38,20]],pal.light,pal.ink);
  r(c,26,49,3,5,pal.accent); r(c,38,49,3,5,pal.accent);
  r(c,24,53,6,2,pal.ink); r(c,37,53,6,2,pal.ink);
  if (o.stage > 1) { motif(c,34,15,pal,o.element,o.stage); line(c,8,29,17,35,pal.accent); line(c,58,27,50,34,pal.accent); }
}

function deer(c, pal, o) {
  p(c,[[17,42],[18,56],[23,56],[24,43]],pal.base,pal.ink);
  p(c,[[37,42],[39,56],[44,56],[43,42]],pal.base,pal.ink);
  r(c,18,54,6,3,pal.ink); r(c,39,54,6,3,pal.ink);
  p(c,[[27,44],[27,53],[31,53],[32,43]],pal.shade,pal.ink);
  p(c,[[45,38],[55,33],[54,38],[49,43]],pal.light,pal.ink);
  e(c,32,39,17,10,pal.base,pal.ink);
  p(c,[[18,36],[17,25],[23,22],[27,36],[31,41],[24,45]],pal.base,pal.ink);
  p(c,[[20,31],[23,31],[25,39],[23,43],[19,38]],pal.light,null);
  p(c,[[13,24],[5,20],[5,16],[14,18],[19,23]],pal.base,pal.ink);
  p(c,[[25,23],[32,17],[35,18],[31,24]],pal.base,pal.ink);
  e(c,20,25,11,9,pal.base,pal.ink);
  p(c,[[10,27],[17,27],[22,32],[18,34],[11,32]],pal.light,null);
  eye(c,14,24,pal,o); eye(c,25,24,pal,o);
  if (!o.back) r(c,9,29,3,2,pal.ink);
  p(c,[[15,19],[14,12],[9,10],[8,6],[12,9],[13,3],[16,4],[16,12],[20,15]],pal.detail,pal.ink);
  p(c,[[23,17],[24,9],[22,5],[25,3],[27,8],[32,5],[33,8],[28,12],[27,20]],pal.detail,pal.ink);
  line(c,31,37,35,34,pal.light,2); r(c,38,39,3,2,pal.light); r(c,31,42,2,2,pal.light);
  if (o.stage > 1) { motif(c,30,10,pal,o.element,1); e(c,13,10,2,2,pal.accent,null); }
  if (o.stage === 3) { p(c,[[28,31],[33,29],[46,34],[43,39],[38,35],[32,35]],pal.light,pal.ink); diamond(c,21,36,2,pal.accent,null); }
}

function slime(c, pal, o) {
  const squash = o.phase === 1 ? 1 : 0;
  p(c,[[11,49],[13,35+squash],[20,24+squash],[28,20+squash],[35,17],[41,25+squash],[49,32],[53,46],[51,52],[44,55],[17,55],[11,52]],pal.base,pal.ink);
  p(c,[[13,47],[20,50],[28,48],[37,51],[49,46],[51,52],[43,55],[18,54],[12,51]],pal.shade,null);
  p(c,[[17,37],[21,28],[28,24],[29,28],[24,30],[21,39]],pal.light,null);
  r(c,19,31,3,3,pal.detail); r(c,17,38,2,3,pal.light);
  e(c,34,46,9,5,pal.light,null);
  face(c,34,36,7,pal,o,{big:true,nose:false,mouth:true});
  if (!o.back) { r(c,33,44,2,1,pal.ink); r(c,30,42,1,1,pal.accent); }
  motif(c,34,22,pal,o.element,o.stage);
  e(c,16,51,4,2,pal.light,null); e(c,48,50,3,2,pal.light,null);
  if (o.stage > 1) {
    e(c,7,32,3,3,pal.accent,pal.ink); r(c,6,30,1,1,pal.detail);
    e(c,56,38,3,4,pal.light,pal.ink); r(c,55,35,1,2,pal.detail);
    diamond(c,37,48,2,pal.accent,null);
  }
  if (o.stage === 3) { sparkle(c,51,20,pal.glow); e(c,9,47,2,2,pal.accent,pal.ink); }
}

function dragon(c, pal, o) {
  const flap = o.phase === 1 ? -1 : 0;
  p(c,[[37,30],[39,13+flap],[48,7+flap],[48,18],[58,20],[54,32],[49,26],[44,34]],pal.shade,pal.ink);
  p(c,[[41,29],[42,17],[47,12],[46,22],[53,22],[49,28],[47,25]],pal.accent,null);
  line(c,42,29,46,22,pal.ink); line(c,46,22,49,13,pal.ink);
  p(c,[[21,29],[15,17+flap],[7,14+flap],[10,24],[4,29],[15,30],[17,36]],pal.shade,pal.ink);
  p(c,[[19,29],[12,20],[13,26],[8,28],[16,28]],pal.accent,null);
  p(c,[[35,43],[44,49],[53,46],[55,39],[59,38],[59,47],[54,54],[46,56],[36,50]],pal.base,pal.ink);
  p(c,[[54,38],[57,31],[61,38],[59,43]],pal.light,pal.ink);
  e(c,31,40,13,13,pal.base,pal.ink);
  p(c,[[27,29],[34,28],[39,39],[35,49],[26,49],[23,43]],pal.light,pal.ink);
  line(c,27,36,35,36,pal.shade); line(c,26,41,37,41,pal.shade); line(c,27,46,35,46,pal.shade);
  paw(c,21,54,pal,10); paw(c,40,54,pal,10);
  p(c,[[17,35],[13,40],[14,46],[18,47],[21,42],[23,34]],pal.base,pal.ink);
  r(c,15,45,1,2,pal.detail); r(c,18,45,1,2,pal.detail);
  p(c,[[39,34],[45,38],[46,44],[42,47],[39,41]],pal.base,pal.ink);
  r(c,43,44,1,2,pal.detail);
  p(c,[[18,20],[17,10],[21,9],[27,18],[33,17],[38,9],[42,11],[40,22]],pal.base,pal.ink);
  p(c,[[18,13],[18,7],[22,10],[24,17]],pal.detail,pal.ink);
  p(c,[[37,16],[39,7],[43,6],[41,17]],pal.detail,pal.ink);
  e(c,29,24,13,10,pal.base,pal.ink);
  e(c,28,31,10,5,pal.light,pal.ink);
  eye(c,21,23,pal,o); eye(c,34,23,pal,o);
  if (!o.back) { r(c,24,30,2,1,pal.ink); r(c,31,30,2,1,pal.ink); line(c,22,34,34,34,pal.ink); r(c,24,34,2,2,pal.detail); }
  if (o.stage > 1) { motif(c,30,18,pal,o.element,o.stage); diamond(c,31,39,2,pal.accent,null); }
  if (o.stage === 3) { p(c,[[49,49],[48,44],[53,46]],pal.detail,pal.ink); p(c,[[42,51],[42,46],[47,49]],pal.detail,pal.ink); }
}

function moth(c, pal, o) {
  const flap = o.phase === 1 ? 1 : 0;
  p(c,[[29,29],[20,14],[9+flap,9],[5+flap,12],[5+flap,25],[9,35],[21,39],[30,36]],pal.base,pal.ink);
  p(c,[[35,29],[44,14],[55-flap,9],[59-flap,12],[59-flap,25],[55,35],[43,39],[34,36]],pal.base,pal.ink);
  p(c,[[29,37],[20,35],[12,41],[14,50],[21,55],[28,48],[32,39]],pal.light,pal.ink);
  p(c,[[35,37],[44,35],[52,41],[50,50],[43,55],[36,48],[32,39]],pal.light,pal.ink);
  p(c,[[9,15],[17,17],[26,30],[21,34],[11,30],[8,24]],pal.shade,pal.ink);
  p(c,[[55,15],[47,17],[38,30],[43,34],[53,30],[56,24]],pal.shade,pal.ink);
  p(c,[[11,18],[17,21],[22,29],[14,27]],pal.accent,null);
  p(c,[[53,18],[47,21],[42,29],[50,27]],pal.accent,null);
  diamond(c,16,25,3,pal.detail,null); diamond(c,48,25,3,pal.detail,null);
  p(c,[[16,42],[22,40],[26,43],[22,49],[18,48]],pal.accent,pal.ink);
  p(c,[[48,42],[42,40],[38,43],[42,49],[46,48]],pal.accent,pal.ink);
  r(c,8,13,3,2,pal.light); r(c,53,13,3,2,pal.light);
  line(c,28,28,22,15,pal.ink); line(c,22,15,18,13,pal.ink);
  line(c,36,28,42,15,pal.ink); line(c,42,15,46,13,pal.ink);
  e(c,18,13,2,2,pal.accent,pal.ink); e(c,46,13,2,2,pal.accent,pal.ink);
  e(c,32,38,5,12,pal.shade,pal.ink);
  r(c,30,38,5,2,pal.light); r(c,30,43,5,2,pal.light);
  e(c,32,28,7,6,pal.light,pal.ink);
  face(c,32,26,4,pal,o,{nose:false,cheek:false});
  p(c,[[27,31],[25,36],[29,34],[32,37],[35,34],[39,36],[37,31]],pal.detail,pal.ink);
  if (o.stage > 1) { diamond(c,32,23,3,pal.accent,pal.ink); sparkle(c,6,38,pal.glow,1); sparkle(c,57,39,pal.glow,1); }
  if (o.stage === 3) { line(c,21,53,18,60,pal.ink); line(c,43,53,46,60,pal.ink); diamond(c,18,60,2,pal.accent,pal.ink); diamond(c,46,60,2,pal.accent,pal.ink); }
}

function whale(c, pal, o) {
  p(c,[[48,33],[56,28],[61,19],[61,32],[57,39],[63,42],[59,45],[49,41]],pal.base,pal.ink);
  p(c,[[57,28],[60,23],[59,32],[54,36]],pal.light,null);
  e(c,28,36,23,14,pal.base,pal.ink);
  p(c,[[7,36],[12,40],[25,43],[39,41],[49,36],[47,43],[36,48],[22,50],[12,46],[7,41]],pal.light,null);
  p(c,[[20,42],[22,51],[31,55],[32,50],[29,43]],pal.shade,pal.ink);
  p(c,[[23,44],[25,49],[30,52],[29,46]],pal.base,null);
  p(c,[[37,27],[36,18],[40,19],[46,28]],pal.shade,pal.ink);
  p(c,[[12,29],[17,26],[25,25],[24,28],[15,30]],pal.light,null);
  eye(c,15,35,pal,o,true);
  if (!o.back) { line(c,7,40,14,42,pal.ink); line(c,14,42,17,41,pal.ink); r(c,10,34,2,1,pal.shade); }
  line(c,29,45,39,43,pal.shade); line(c,33,47,41,44,pal.shade);
  motif(c,30,25,pal,o.element,o.stage);
  if (o.stage > 1) {
    p(c,[[37,33],[40,32],[43,34],[40,36]],pal.accent,null);
    diamond(c,26,34,2,pal.accent,null); r(c,32,38,2,2,pal.light);
    e(c,12,17,3,3,pal.light,pal.ink); r(c,11,15,1,1,WHITE);
  }
  if (o.stage === 3) { e(c,8,23,2,2,pal.accent,pal.ink); sparkle(c,45,15,pal.glow,2); }
}

function golem(c, pal, o) {
  p(c,[[16,43],[14,54],[18,58],[27,57],[28,48],[24,42]],pal.shade,pal.ink);
  p(c,[[36,44],[36,55],[42,58],[51,57],[49,47],[43,42]],pal.shade,pal.ink);
  r(c,16,52,8,3,pal.base); r(c,39,52,9,3,pal.base);
  p(c,[[15,22],[8,22],[4,28],[5,39],[13,42],[18,35],[19,28]],pal.base,pal.ink);
  p(c,[[49,22],[57,24],[61,31],[59,41],[51,43],[47,35],[46,28]],pal.base,pal.ink);
  p(c,[[6,30],[11,26],[16,28],[13,37],[8,37]],pal.light,pal.ink);
  p(c,[[51,27],[57,29],[58,35],[55,39],[50,36]],pal.light,pal.ink);
  p(c,[[20,24],[29,20],[40,23],[47,31],[44,46],[35,52],[23,49],[16,40]],pal.base,pal.ink);
  p(c,[[22,28],[30,24],[39,27],[43,35],[38,43],[26,43],[21,37]],pal.light,pal.ink);
  p(c,[[25,36],[31,30],[38,35],[36,43],[30,46],[26,42]],pal.shade,pal.ink);
  diamond(c,31,37,4,pal.accent,pal.ink); r(c,30,34,1,3,pal.detail);
  p(c,[[22,10],[32,6],[43,12],[43,23],[37,29],[24,26],[18,19]],pal.base,pal.ink);
  p(c,[[22,11],[31,8],[34,14],[24,18],[20,17]],pal.light,null);
  p(c,[[24,18],[37,17],[39,23],[35,26],[25,24]],pal.shade,pal.ink);
  if (!o.back) { r(c,25,20,4,2,pal.accent); r(c,33,20,4,2,pal.accent); r(c,29,24,4,1,pal.ink); }
  line(c,39,11,36,16,pal.ink); line(c,36,16,39,18,pal.ink);
  r(c,10,30,2,5,pal.accent); r(c,9,31,4,1,pal.accent);
  if (o.stage > 1) { motif(c,12,25,pal,o.element,1); motif(c,53,26,pal,o.element,1,true); }
  if (o.stage === 3) { motif(c,32,12,pal,o.element,1); line(c,19,47,23,44,pal.accent,2); line(c,40,45,44,47,pal.accent,2); }
}

function rabbit(c, pal, o) {
  p(c,[[21,25],[17,15],[18,5],[23,2],[27,6],[27,24]],pal.base,pal.ink);
  p(c,[[20,9],[22,6],[24,9],[24,22],[22,22]],pal.accent,null);
  p(c,[[34,24],[38,11],[44,6],[51,7],[56,12],[54,17],[49,16],[46,12],[42,17],[40,26]],pal.base,pal.ink);
  p(c,[[40,18],[44,10],[50,10],[53,13],[49,12],[45,14],[43,21]],pal.accent,null);
  e(c,48,43,7,7,pal.light,pal.ink);
  e(c,31,43,13,12,pal.base,pal.ink);
  e(c,31,43,8,9,pal.light,null);
  e(c,20,54,8,4,pal.base,pal.ink); e(c,41,54,8,4,pal.base,pal.ink);
  r(c,17,54,5,2,pal.light); r(c,38,54,5,2,pal.light);
  e(c,30,29,15,12,pal.base,pal.ink);
  e(c,30,34,9,5,pal.light,null);
  p(c,[[24,20],[28,17],[31,20],[35,19],[32,23],[27,22]],pal.light,null);
  face(c,30,27,7,pal,o,{big:true,mouth:true});
  e(c,19,43,4,6,pal.base,pal.ink); e(c,43,43,4,6,pal.base,pal.ink);
  p(c,[[19,39],[27,41],[37,40],[43,37],[43,42],[33,45],[23,43]],pal.accent,pal.ink);
  p(c,[[37,42],[44,45],[50,52],[42,50],[36,45]],pal.accent,pal.ink);
  diamond(c,29,43,2,pal.detail,null);
  if (o.stage > 1) { motif(c,46,13,pal,o.element,o.stage); r(c,23,50,2,2,pal.accent); }
  if (o.stage === 3) { p(c,[[22,40],[24,45],[27,44],[30,47],[34,44],[37,46],[40,41]],pal.detail,pal.ink); }
}

function serpent(c, pal, o) {
  p(c,[[43,49],[52,48],[56,44],[55,39],[51,36],[48,37],[49,40],[47,42],[41,42],[35,38],[33,30],[35,24],[28,21],[23,28],[22,39],[28,47],[35,51]],pal.base,pal.ink);
  p(c,[[32,49],[21,47],[14,49],[14,53],[24,57],[43,57],[52,53],[55,48],[50,49],[44,52],[30,51]],pal.base,pal.ink);
  p(c,[[27,29],[26,38],[30,43],[37,46],[47,47],[48,44],[36,43],[31,38],[30,28]],pal.light,null);
  line(c,28,35,31,35,pal.shade); line(c,29,39,33,39,pal.shade); line(c,33,43,35,40,pal.shade);
  line(c,37,46,39,43,pal.shade); line(c,43,47,44,44,pal.shade);
  p(c,[[23,27],[13,26],[9,21],[12,13],[20,10],[31,13],[36,19],[32,25]],pal.base,pal.ink);
  p(c,[[10,20],[17,20],[25,24],[30,24],[27,28],[17,27],[11,24]],pal.light,null);
  eye(c,17,17,pal,o,true); eye(c,28,18,pal,o);
  if (!o.back) { r(c,10,22,2,1,pal.ink); line(c,11,25,18,26,pal.ink); }
  p(c,[[14,13],[9,8],[16,8],[20,12]],pal.accent,pal.ink);
  p(c,[[28,13],[34,8],[34,16]],pal.accent,pal.ink);
  line(c,18,53,30,55,pal.light); line(c,37,55,47,52,pal.light);
  diamond(c,39,39,2,pal.accent,null); diamond(c,22,50,2,pal.accent,null);
  motif(c,20,13,pal,o.element,o.stage);
  if (o.stage > 1) motif(c,54,40,pal,o.element,1);
  if (o.stage === 3) { p(c,[[30,24],[39,26],[36,30],[31,29]],pal.light,pal.ink); p(c,[[22,27],[16,31],[22,34]],pal.light,pal.ink); }
}

function crab(c, pal, o) {
  const lift = o.phase === 1 ? -1 : 0;
  for (let i=0;i<3;i++) {
    p(c,[[20,38+i*4],[10-i,39+i*5],[7-i,43+i*5],[12-i,44+i*5],[23,42+i*3]],pal.shade,pal.ink);
    p(c,[[44,38+i*4],[54+i,39+i*5],[57+i,43+i*5],[52+i,44+i*5],[41,42+i*3]],pal.shade,pal.ink);
  }
  p(c,[[19,34],[11,29],[12,24],[17,24],[23,31]],pal.base,pal.ink);
  p(c,[[45,34],[53,29],[52,24],[47,24],[41,31]],pal.base,pal.ink);
  p(c,[[10,30+lift],[4,26+lift],[3,18+lift],[7,12+lift],[10,12+lift],[10,21+lift],[13,22+lift],[15,16+lift],[19,18+lift],[19,26+lift],[16,30+lift]],pal.base,pal.ink);
  p(c,[[54,30+lift],[60,26+lift],[61,18+lift],[57,12+lift],[54,12+lift],[54,21+lift],[51,22+lift],[49,16+lift],[45,18+lift],[45,26+lift],[48,30+lift]],pal.base,pal.ink);
  p(c,[[5,19+lift],[8,16+lift],[8,23+lift],[12,26+lift],[9,27+lift],[6,24+lift]],pal.light,null);
  p(c,[[59,19+lift],[56,16+lift],[56,23+lift],[52,26+lift],[55,27+lift],[58,24+lift]],pal.light,null);
  e(c,32,40,18,12,pal.base,pal.ink);
  p(c,[[18,39],[24,31],[34,30],[43,34],[46,41],[36,44],[25,43]],pal.light,pal.ink);
  p(c,[[18,44],[27,46],[42,43],[44,47],[37,51],[25,51]],pal.shade,null);
  r(c,24,23,3,10,pal.ink); r(c,38,23,3,10,pal.ink);
  e(c,25,24,4,5,pal.base,pal.ink); e(c,39,24,4,5,pal.base,pal.ink);
  eye(c,24,22,pal,o); eye(c,38,22,pal,o);
  if (!o.back) { line(c,28,39,30,41,pal.ink); line(c,30,41,33,41,pal.ink); line(c,33,41,36,39,pal.ink); }
  if (o.stage > 1) { motif(c,32,34,pal,o.element,1); r(c,20,40,2,2,pal.accent); r(c,42,40,2,2,pal.accent); }
  if (o.stage === 3) { diamond(c,9,24,2,pal.accent,null); diamond(c,55,24,2,pal.accent,null); }
}

function wolf(c, pal, o) {
  p(c,[[43,34],[50,29],[54,22],[60,25],[59,35],[51,43],[41,42]],pal.base,pal.ink);
  p(c,[[54,23],[60,25],[59,31],[55,34],[52,30]],pal.light,null);
  p(c,[[17,38],[16,52],[12,55],[13,58],[22,58],[25,41]],pal.shade,pal.ink);
  p(c,[[38,39],[41,48],[41,55],[38,57],[47,57],[49,53],[47,39]],pal.shade,pal.ink);
  e(c,34,36,17,11,pal.base,pal.ink);
  p(c,[[22,39],[22,53],[20,57],[28,57],[31,53],[30,38]],pal.base,pal.ink);
  p(c,[[37,39],[38,48],[36,54],[42,55],[44,51],[44,40]],pal.base,pal.ink);
  r(c,23,55,5,2,pal.light); r(c,38,53,5,2,pal.light);
  p(c,[[24,22],[35,26],[35,31],[40,33],[33,35],[36,42],[28,40],[25,46],[19,39],[14,35],[17,25]],pal.light,pal.ink);
  p(c,[[12,23],[12,8],[16,7],[23,18],[28,12],[31,14],[29,26]],pal.base,pal.ink);
  p(c,[[14,18],[14,12],[19,19]],pal.accent,null);
  p(c,[[12,20],[23,18],[29,23],[27,31],[20,35],[10,33],[7,29],[5,28],[6,24]],pal.base,pal.ink);
  p(c,[[6,26],[12,26],[17,30],[23,31],[19,34],[10,32],[6,29]],pal.light,null);
  eye(c,14,23,pal,o,true); eye(c,24,24,pal,o);
  if (!o.back) { r(c,5,25,3,3,pal.ink); line(c,9,30,14,31,pal.ink); }
  p(c,[[26,30],[33,28],[40,29],[45,33],[38,34],[33,32]],pal.shade,null);
  line(c,36,37,41,39,pal.light,2);
  if (o.stage > 1) { motif(c,24,20,pal,o.element,o.stage); diamond(c,24,36,2,pal.accent,null); }
  if (o.stage === 3) { p(c,[[34,27],[34,22],[41,28]],pal.accent,pal.ink); p(c,[[42,29],[44,24],[48,33]],pal.accent,pal.ink); }
}

function owl(c, pal, o) {
  p(c,[[24,46],[22,57],[28,54],[31,59],[34,54],[39,57],[39,45]],pal.shade,pal.ink);
  e(c,32,37,17,18,pal.base,pal.ink);
  p(c,[[22,32],[19,37],[21,47],[28,51],[36,50],[43,43],[42,32]],pal.light,null);
  p(c,[[17,31],[11,34],[12,46],[18,51],[23,46],[20,36]],pal.shade,pal.ink);
  p(c,[[47,31],[53,34],[52,46],[46,51],[41,46],[44,36]],pal.shade,pal.ink);
  line(c,14,38,18,44,pal.base,2); line(c,50,38,46,44,pal.base,2);
  p(c,[[16,23],[13,10],[17,9],[26,16],[37,16],[47,8],[50,10],[48,23]],pal.base,pal.ink);
  e(c,32,25,18,13,pal.base,pal.ink);
  p(c,[[15,22],[21,18],[28,19],[32,24],[36,19],[44,18],[49,22],[45,31],[37,35],[32,30],[27,35],[19,31]],pal.light,pal.ink);
  e(c,23,25,6,6,pal.accent,pal.ink); e(c,41,25,6,6,pal.accent,pal.ink);
  eye(c,22,23,pal,o,true); eye(c,40,23,pal,o,true);
  if (!o.back) p(c,[[29,29],[35,29],[32,34]],pal.shade,pal.ink);
  p(c,[[29,16],[32,12],[36,16],[32,21]],pal.accent,pal.ink);
  for(let i=0;i<3;i++) { line(c,25+i*5,39,27+i*5,41,pal.shade); line(c,27+i*4,45,29+i*4,47,pal.shade); }
  r(c,23,53,6,2,pal.ink); r(c,36,53,6,2,pal.ink);
  if (o.stage > 1) { motif(c,32,16,pal,o.element,o.stage); sparkle(c,9,25,pal.glow,1); sparkle(c,54,23,pal.glow,1); }
  if (o.stage === 3) { p(c,[[20,34],[22,37],[32,40],[42,37],[44,33],[45,39],[32,45],[19,39]],pal.detail,pal.ink); diamond(c,32,41,2,pal.accent,null); }
}

function flower(c, pal, o) {
  p(c,[[30,37],[29,49],[24,54],[27,57],[33,54],[36,55],[41,53],[35,49],[35,36]],pal.shade,pal.ink);
  p(c,[[31,44],[24,39],[14,40],[17,47],[24,50],[30,47]],pal.base,pal.ink);
  line(c,20,43,29,47,pal.light);
  p(c,[[34,44],[40,39],[50,40],[47,48],[40,50],[34,47]],pal.light,pal.ink);
  line(c,37,47,45,43,pal.shade);
  e(c,24,55,6,3,pal.base,pal.ink); e(c,39,55,6,3,pal.base,pal.ink);
  p(c,[[21,26],[13,20],[13,12],[19,10],[26,15],[28,6],[34,4],[40,8],[40,16],[48,12],[54,16],[53,24],[46,29],[49,35],[46,42],[38,42],[32,37],[25,43],[18,41],[15,35]],pal.accent,pal.ink);
  p(c,[[17,13],[21,13],[27,21],[25,24],[19,20]],pal.detail,null);
  p(c,[[31,8],[35,8],[36,17],[33,20],[31,16]],pal.light,null);
  p(c,[[47,16],[50,18],[47,23],[40,26],[38,23]],pal.detail,null);
  p(c,[[44,34],[45,38],[39,38],[35,32]],pal.light,null);
  p(c,[[20,34],[23,32],[28,35],[24,39],[20,38]],pal.detail,null);
  e(c,32,27,12,11,pal.base,pal.ink);
  e(c,32,28,9,8,pal.light,null);
  face(c,32,25,6,pal,o,{big:true,nose:false,mouth:true});
  if (o.stage > 1) { motif(c,33,17,pal,o.element,1); sparkle(c,9,30,pal.glow,1); }
  if (o.stage === 3) { e(c,17,44,3,3,pal.accent,pal.ink); e(c,48,44,3,3,pal.accent,pal.ink); diamond(c,32,48,2,pal.accent,null); }
}

const MONSTERS = {fox,cat,turtle,bird,deer,slime,dragon,moth,whale,golem,rabbit,serpent,crab,wolf,owl,flower};

function backDetails(c,shape,pal,o) {
  // Reverse-side markings preserve the individual silhouette while removing
  // front-only masks, bellies, and eye discs. Side-bodied species keep a
  // three-quarter pose, with a visible nape and dorsal markings.
  if (shape === 'fox') {
    e(c,30,44,11,10,pal.base,null);
    p(c,[[24,41],[28,44],[32,42],[35,46],[33,51],[28,50],[25,47]],pal.shade,null);
    p(c,[[19,39],[23,43],[24,47],[29,44],[32,47],[36,42],[40,39],[32,37]],pal.detail,pal.ink);
    p(c,[[17,23],[23,20],[34,20],[42,24],[43,30],[46,33],[40,37],[33,40],[23,37],[15,33],[18,29]],pal.base,pal.ink);
    p(c,[[18,25],[24,22],[35,22],[39,24],[33,25],[27,24],[22,27]],pal.light,null);
    p(c,[[18,31],[23,34],[27,34],[29,36],[32,33],[37,34],[43,31],[39,37],[30,39],[22,36]],pal.shade,null);
    line(c,23,29,26,31,pal.shade); line(c,33,31,37,28,pal.shade);
  } else if (shape === 'cat') {
    e(c,33,44,11,10,pal.base,null);
    p(c,[[29,41],[32,44],[35,41],[37,45],[34,49],[31,48]],pal.shade,null);
    e(c,34,29,15,11,pal.base,pal.ink);
    p(c,[[22,24],[28,20],[39,21],[44,25],[38,24],[31,23],[25,26]],pal.light,null);
    p(c,[[20,31],[27,35],[34,36],[42,34],[47,31],[44,37],[34,40],[24,37]],pal.shade,null);
    p(c,[[28,23],[30,28],[32,26],[33,31],[35,26],[38,27],[40,23]],pal.shade,null);
    r(c,24,30,4,1,pal.light); r(c,40,29,4,1,pal.light);
    p(c,[[27,40],[34,42],[41,40],[40,43],[33,45],[27,43]],pal.accent,pal.ink);
  } else if (shape === 'rabbit') {
    e(c,31,44,11,10,pal.base,null);
    e(c,31,48,5,5,pal.detail,pal.ink);
    e(c,30,29,15,12,pal.base,pal.ink);
    p(c,[[20,25],[23,21],[30,19],[38,22],[40,25],[33,23],[27,23],[23,26]],pal.light,null);
    p(c,[[19,32],[24,35],[28,34],[30,37],[33,34],[37,35],[41,32],[38,38],[30,41],[22,38]],pal.shade,null);
    line(c,27,31,30,33,pal.light); line(c,30,33,33,30,pal.light);
    p(c,[[21,39],[27,41],[36,41],[41,38],[41,42],[32,45],[24,43]],pal.accent,pal.ink);
  } else if (shape === 'bird') {
    e(c,33,37,10,13,pal.base,null);
    p(c,[[25,33],[29,37],[33,35],[36,38],[41,33],[39,43],[34,46],[29,43]],pal.shade,null);
    e(c,33,25,11,10,pal.base,pal.ink);
    p(c,[[25,21],[30,18],[37,20],[41,23],[34,22],[28,23]],pal.light,null);
    p(c,[[24,27],[29,30],[33,29],[37,31],[42,27],[39,33],[33,35],[27,33]],pal.shade,null);
    line(c,29,38,32,40,pal.light); line(c,32,40,36,38,pal.light);
  } else if (shape === 'dragon') {
    e(c,31,40,11,12,pal.base,null);
    p(c,[[22,34],[28,35],[31,42],[34,35],[40,34],[37,44],[32,49],[25,46]],pal.shade,null);
    e(c,29,25,13,10,pal.base,pal.ink);
    p(c,[[19,23],[24,20],[33,20],[39,24],[31,23],[25,23],[21,26]],pal.light,null);
    p(c,[[18,29],[25,31],[31,31],[38,28],[35,34],[28,36],[22,33]],pal.shade,null);
    for(let i=0;i<4;i++) p(c,[[28,28+i*6],[30,24+i*6],[33,30+i*6],[31,33+i*6]],i%2?pal.light:pal.accent,pal.ink);
    if (o.stage>1) { line(c,23,38,25,42,pal.light); line(c,37,37,35,41,pal.light); }
  } else if (shape === 'owl') {
    e(c,32,37,15,16,pal.base,null);
    p(c,[[24,34],[32,40],[40,34],[39,44],[33,49],[26,45]],pal.shade,null);
    e(c,32,25,18,13,pal.base,pal.ink);
    p(c,[[18,22],[22,18],[30,17],[40,19],[46,23],[39,21],[33,23],[26,21],[22,24]],pal.light,null);
    p(c,[[16,27],[22,30],[27,28],[32,33],[37,28],[43,30],[48,26],[45,33],[38,36],[32,38],[24,35],[18,32]],pal.shade,null);
    line(c,23,26,26,28,pal.light); line(c,38,28,41,25,pal.light);
    for(let yy=38;yy<47;yy+=4) { line(c,28,yy,32,yy+2,pal.light); line(c,32,yy+2,36,yy,pal.light); }
  } else if (shape === 'golem') {
    p(c,[[23,12],[32,8],[41,13],[41,23],[35,27],[24,25],[20,19]],pal.base,null);
    p(c,[[23,13],[31,10],[34,14],[28,17],[22,17]],pal.light,null);
    line(c,27,20,34,23,pal.shade,2); line(c,35,14,38,20,pal.shade);
    p(c,[[23,30],[29,27],[38,29],[41,36],[36,44],[27,44],[23,37]],pal.base,null);
    p(c,[[28,29],[32,33],[30,38],[35,43],[29,42],[27,37]],pal.shade,null);
    line(c,34,31,37,36,pal.light,2);
  } else if (shape === 'flower') {
    e(c,32,27,12,11,pal.shade,pal.ink);
    p(c,[[32,17],[35,23],[41,22],[38,28],[41,33],[35,33],[32,38],[29,33],[23,34],[26,28],[22,23],[29,23]],pal.base,null);
    p(c,[[32,22],[35,27],[32,33],[29,28]],pal.light,null);
    r(c,31,29,2,9,pal.shade);
  } else if (shape === 'deer') {
    e(c,20,25,10,8,pal.base,null);
    p(c,[[13,23],[17,20],[23,20],[27,23],[22,23],[17,22]],pal.light,null);
    p(c,[[15,29],[20,30],[25,28],[24,32],[19,34]],pal.shade,null);
    line(c,23,31,26,36,pal.light,2);
  } else if (shape === 'wolf') {
    p(c,[[12,21],[21,19],[27,23],[26,30],[21,34],[11,32],[8,28],[7,25]],pal.base,null);
    p(c,[[12,22],[17,20],[22,21],[23,23],[16,23]],pal.light,null);
    p(c,[[10,28],[16,30],[21,29],[25,28],[22,33],[16,33]],pal.shade,null);
    line(c,27,33,31,31,pal.shade,2);
  } else if (shape === 'serpent') {
    p(c,[[12,19],[17,13],[25,14],[32,19],[30,24],[22,27],[15,25],[11,23]],pal.base,null);
    p(c,[[15,16],[21,13],[28,16],[27,18],[20,16],[16,18]],pal.light,null);
    line(c,23,22,28,23,pal.shade,2); line(c,28,30,29,38,pal.accent,2);
  } else if (shape === 'slime') {
    p(c,[[30,35],[34,31],[38,35],[40,42],[37,46],[31,45],[29,40]],pal.shade,null);
    diamond(c,34,39,3,pal.accent,null);
    r(c,31,34,2,2,pal.light);
  } else if (shape === 'turtle') {
    line(c,46,42,48,45,pal.shade); line(c,48,45,53,46,pal.shade);
  } else if (shape === 'whale') {
    p(c,[[18,31],[23,29],[30,29],[36,33],[32,35],[25,32]],pal.shade,null);
    r(c,24,30,4,1,pal.light);
  }
}

/** Draw an original creature sprite in a size × size square. */
export function drawMonster(ctx, species = {}, x = 0, y = 0, size = 64, opts = {}) {
  if (!ctx || !Number.isFinite(size) || size <= 0) return;
  const time = timeValue(opts.time);
  const phase = Math.floor(time * 3) % 4;
  const blink = !opts.back && Math.floor(time * 8 + hash(species.id || species.name) % 29) % 37 === 0;
  const pal = paletteFor(species);
  const stage = Math.max(1,Math.min(3,Number(species.stage) || 1));
  const o = {...opts, time, phase, blink, stage, element:species.element || 'light'};
  const shape = species.shape || 'fox';
  const key = `${shape}|${o.element}|${stage}|${JSON.stringify(pal)}|${phase}|${blink}|${!!opts.back}|${opts.emotion || ''}`;
  const sprite = spriteCache.get(key,s=>{
    (MONSTERS[shape] || fox)(s,pal,o);
    if (opts.back) backDetails(s,shape,pal,o);
  });
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x,y);
  if (opts.flip) { ctx.translate(size,0); ctx.scale(-1,1); }
  if (sprite) ctx.drawImage(sprite.surface,sprite.x,sprite.y,sprite.size,sprite.size,0,0,size,size);
  else { ctx.scale(size/64,size/64); (MONSTERS[shape] || fox)(ctx,pal,o); if (opts.back) backDetails(ctx,shape,pal,o); }
  ctx.restore();
}

const assetCache = new SpriteCache(256);

function cachedArt(ctx,x,y,size,key,draw,flip = false) {
  if (!ctx || !Number.isFinite(size) || size <= 0) return;
  const sprite = assetCache.get(key,draw);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.translate(x,y);
  if (flip) { ctx.translate(size,0); ctx.scale(-1,1); }
  if (sprite) ctx.drawImage(sprite.surface,sprite.x,sprite.y,sprite.size,sprite.size,0,0,size,size);
  else { ctx.scale(size/64,size/64); draw(ctx); }
  ctx.restore();
}

const PEOPLE = {
  player:   {coat:'#dc906e',dark:'#9e5956',light:'#ffc78d',hair:'#344658',hairLight:'#54727a',scarf:'#6bbeb6',skin:'#edbd98',hat:false},
  scholar:  {coat:'#7d9faa',dark:'#4b697f',light:'#c4d9ce',hair:'#dcd5b6',hairLight:'#fff0cb',scarf:'#d7ac79',skin:'#e9bca0',hat:false},
  rival:    {coat:'#b37b94',dark:'#704f72',light:'#ecadc0',hair:'#a8585e',hairLight:'#df8c70',scarf:'#efc66f',skin:'#deaa8b',hat:false},
  healer:   {coat:'#e5debb',dark:'#8aa69b',light:'#fff2d2',hair:'#be909b',hairLight:'#e8b6b2',scarf:'#77b9a7',skin:'#efc7a6',hat:true},
  merchant: {coat:'#bf9765',dark:'#836650',light:'#f4ce89',hair:'#765443',hairLight:'#b3835d',scarf:'#89b7a7',skin:'#c99779',hat:true},
  warden:   {coat:'#8e9ba3',dark:'#526b7d',light:'#c6cbbb',hair:'#536171',hairLight:'#8697a3',scarf:'#e6c781',skin:'#d9ac8a',hat:true},
  sailor:   {coat:'#749caa',dark:'#47697a',light:'#c1d0c4',hair:'#6c554c',hairLight:'#b18b69',scarf:'#e6b18a',skin:'#ce9d7a',hat:true},
  villager: {coat:'#9eaf83',dark:'#6c866e',light:'#d4d6a0',hair:'#8b6759',hairLight:'#be9670',scarf:'#e7b689',skin:'#e6b695',hat:false},
};

function person(c,o) {
  const role = PEOPLE[o.role] ? o.role : 'villager';
  const s = {...PEOPLE[role]};
  if (o.color) s.coat = o.color;
  if (o.hair) s.hair = o.hair;
  const side = o.facing === 'left' || o.facing === 'right';
  const up = o.facing === 'up';
  const step = o.walking ? (o.phase ? 2 : -2) : 0;
  ellipse(c,32,58,11,3,'#12323955');
  if (side && o.facing === 'left') { c.save(); c.translate(64,0); c.scale(-1,1); }
  if (side) {
    // Far boot and arm establish a readable side silhouette.
    p(c,[[27,43],[26,53-step],[29,57-step],[35,57-step],[35,53-step],[32,51-step],[33,43]],s.dark,INK);
    r(c,28,55-step,8,3,INK); r(c,30,55-step,4,1,'#7a8584');
    p(c,[[29,31],[24,33],[23,42],[27,45],[29,41]],s.dark,INK);
    p(c,[[27,31],[36,30],[41,37],[39,46],[26,46],[23,39]],s.coat,INK);
    p(c,[[34,35],[37,35],[37,44],[34,47]],s.light,null);
    r(c,27,43,12,2,s.dark);
    p(c,[[30,44],[32,52+step],[31,55+step],[37,56+step],[40,55+step],[39,52+step],[36,50+step],[37,44]],s.coat,INK);
    r(c,32,54+step,9,3,INK); r(c,34,54+step,4,1,'#9c9e8c');
    p(c,[[35,32],[40,35],[41,42],[37,45],[34,41]],s.coat,INK);
    e(c,38,43,3,3,s.skin,INK);
    // Hair, ear, and a tiny protruding nose distinguish the facing direction.
    p(c,[[24,14],[31,10],[40,13],[43,20],[43,25],[46,26],[44,29],[39,31],[27,29],[22,22]],s.hair,INK);
    p(c,[[31,18],[40,18],[42,24],[45,26],[42,28],[40,31],[32,30],[29,25]],s.skin,INK);
    p(c,[[24,15],[32,12],[40,14],[43,20],[38,18],[35,20],[30,19],[29,25],[25,25],[23,21]],s.hair,INK);
    r(c,27,14,7,2,s.hairLight); r(c,24,18,2,4,s.hairLight);
    e(c,30,25,2,3,s.skin,null);
    r(c,39,22,2,3,INK); r(c,39,22,1,1,WHITE);
    r(c,40,27,2,1,'#b3796a');
    p(c,[[27,30],[33,29],[39,31],[37,34],[28,33]],s.scarf,INK);
    p(c,[[28,32],[22,34],[18,38-step/2],[19,40-step/2],[25,38],[30,35]],s.scarf,INK);
    if (role === 'player' || role === 'merchant') {
      r(c,24,34,2,10,'#d9bd85'); p(c,[[21,38],[26,37],[29,40],[28,47],[21,46]],'#a37859',INK); r(c,22,39,5,2,'#d2ad76');
    }
    if (s.hat) {
      p(c,[[23,16],[24,10],[31,7],[40,10],[42,16]],role==='healer'?s.light:s.coat,INK);
      r(c,23,15,22,3,role==='healer'?s.scarf:s.dark); r(c,28,10,9,2,s.light);
    }
    if (role === 'scholar') { r(c,37,21,6,5,INK); r(c,38,22,4,3,'#bde6d9'); r(c,40,22,1,2,WHITE); }
    if (role === 'warden') { r(c,35,33,6,3,s.light); r(c,38,36,2,4,s.scarf); }
  } else {
    p(c,[[23,44],[23,53+step],[21,55+step],[22,58+step/2],[29,58+step/2],[30,51+step],[31,44]],s.dark,INK);
    p(c,[[34,44],[34,52-step],[34,57-step/2],[42,57-step/2],[43,54-step],[40,52-step],[41,43]],s.dark,INK);
    r(c,22,55+step/2,8,3,INK); r(c,34,55-step/2,9,3,INK);
    r(c,23,55+step/2,4,1,'#83928e'); r(c,36,55-step/2,4,1,'#83928e');
    p(c,[[23,30],[18,35],[17,43-step/2],[21,46-step/2],[25,41],[27,33]],s.coat,INK);
    p(c,[[40,30],[46,35],[47,43+step/2],[43,46+step/2],[39,41],[37,33]],s.coat,INK);
    e(c,20,45-step/2,3,3,s.skin,INK); e(c,44,45+step/2,3,3,s.skin,INK);
    p(c,[[24,30],[39,30],[43,38],[41,48],[22,48],[21,38]],s.coat,INK);
    p(c,[[24,34],[28,34],[27,44],[23,44]],s.light,null);
    r(c,23,45,18,3,s.dark); r(c,25,48,5,3,s.coat); r(c,35,48,5,3,s.coat);
    if (!up) { r(c,31,34,2,12,s.dark); r(c,32,37,1,1,s.light); r(c,32,42,1,1,s.light); r(c,30,45,4,3,s.scarf); }
    p(c,[[20,13],[26,9],[37,9],[43,14],[45,23],[41,29],[36,32],[27,32],[20,28],[18,21]],s.hair,INK);
    if (!up) {
      p(c,[[23,18],[39,18],[41,22],[40,28],[36,32],[28,32],[23,28],[22,23]],s.skin,INK);
      e(c,21,25,2,3,s.skin,null); e(c,42,25,2,3,s.skin,null);
      r(c,25,23,3,4,INK); r(c,36,23,3,4,INK); r(c,25,23,1,1,WHITE); r(c,36,23,1,1,WHITE);
      r(c,24,28,3,1,'#cd927b'); r(c,37,28,3,1,'#cd927b'); r(c,31,29,3,1,'#996b62');
      p(c,[[20,14],[27,11],[36,10],[41,14],[42,20],[37,18],[35,21],[30,17],[26,21],[22,20],[21,25],[18,23]],s.hair,INK);
      r(c,24,13,6,2,s.hairLight); r(c,21,17,3,2,s.hairLight); r(c,35,13,4,2,s.hairLight);
    } else {
      p(c,[[22,14],[27,11],[37,12],[41,16],[41,24],[36,29],[27,29],[23,25]],s.hair,null);
      r(c,24,13,7,2,s.hairLight); r(c,21,17,3,6,s.hairLight); r(c,35,15,5,2,s.hairLight);
      line(c,28,25,30,28,s.hairLight); line(c,34,28,38,24,s.hairLight);
    }
    p(c,[[23,30],[29,32],[36,32],[41,29],[40,34],[33,36],[26,34]],s.scarf,INK);
    if (up) {
      p(c,[[28,34],[37,34],[40,38],[39,47],[27,47],[24,42],[25,38]],'#967d5b',INK);
      p(c,[[27,36],[37,36],[38,40],[26,40]],'#d5b779',INK); r(c,30,41,6,4,'#b89762'); r(c,32,39,2,3,s.scarf);
      if (role === 'warden') { r(c,25,34,15,3,s.light); r(c,27,39,11,2,s.dark); }
    } else if (role === 'player' || role === 'merchant') {
      line(c,23,34,39,46,'#e7c28e',2);
      p(c,[[37,40],[43,40],[45,43],[44,49],[37,49]],'#a67a55',INK); r(c,38,42,5,2,'#d8b87c'); r(c,40,44,2,2,s.scarf);
      if (role === 'player') { r(c,27,14,3,2,'#d5daca'); r(c,24,16,3,2,'#d5daca'); }
    }
    if (s.hat) {
      const hat = role === 'healer' ? s.light : s.coat;
      p(c,[[20,16],[21,11],[27,7],[36,7],[42,11],[43,16]],hat,INK);
      r(c,18,16,28,3,role==='healer'?s.scarf:s.dark); r(c,24,10,14,2,s.light);
      if (!up && role === 'healer') { r(c,30,10,3,7,s.scarf); r(c,28,12,7,3,s.scarf); }
      if (!up && role === 'warden') diamond(c,32,12,3,s.scarf,INK);
      if (role === 'merchant') { p(c,[[20,17],[16,13],[20,10],[22,12]],s.scarf,INK); r(c,28,13,9,2,s.dark); }
    }
    if (!up && role === 'scholar') { r(c,24,22,7,6,INK); r(c,34,22,7,6,INK); r(c,25,23,5,4,'#bde0cc'); r(c,35,23,5,4,'#bde0cc'); r(c,30,24,4,1,INK); r(c,26,23,1,3,WHITE); r(c,36,23,1,3,WHITE); }
    if (!up && role === 'warden') { r(c,20,32,7,4,s.light); r(c,38,32,7,4,s.light); r(c,28,38,10,3,s.dark); diamond(c,32,39,2,s.scarf,null); }
    if (role === 'rival') { p(c,[[41,14],[45,9],[46,4],[40,8],[38,14]],s.scarf,INK); r(c,24,35,3,5,s.scarf); }
  }
  if (side && o.facing === 'left') c.restore();
}

/** Chibi overworld character; opts.facing is down/up/left/right. */
export function drawPerson(ctx,x = 0,y = 0,size = 64,opts = {}) {
  const time = timeValue(opts.time);
  const facing = opts.facing || opts.direction || 'down';
  const phase = Math.floor(time * 7) % 2;
  const o = {...opts,facing,phase,role:opts.role || 'player'};
  const key = `person|${o.role}|${facing}|${!!o.walking}|${o.walking?phase:0}|${o.color||''}|${o.hair||''}`;
  cachedArt(ctx,x,y,size,key,c=>person(c,o));
}

function tree(c,o) {
  const alt = (o.variant || 0) % 3;
  const dark = o.palette?.[0] ? mix(o.palette[0],INK,.22) : o.night ? '#234c55' : '#285d56';
  const mid = o.palette?.[0] ? mix(o.palette[0],o.palette[1],.24) : alt === 1 ? '#609b80' : alt === 2 ? '#548b79' : '#4b9577';
  const light = o.palette?.[1] || (alt === 1 ? '#a9c897' : '#8dc393');
  ellipse(c,33,57,21,5,'#183e3d45');
  p(c,[[27,36],[26,51],[20,57],[26,57],[31,54],[33,58],[40,58],[36,51],[36,34]],'#8d7756',INK);
  p(c,[[31,37],[30,51],[28,54],[33,52],[34,39]],'#b79a69',null);
  line(c,29,49,24,44,'#675940',2); line(c,34,46,39,41,'#675940',2);
  e(c,18,34,13,10,dark,INK); e(c,44,34,14,11,dark,INK);
  e(c,31,39,16,8,dark,INK);
  e(c,16,24,11,12,mid,INK); e(c,48,24,11,12,mid,INK);
  e(c,32,17,21,13,mid,INK); e(c,31,11,12,7,mid,INK);
  p(c,[[10,22],[13,16],[20,14],[22,18],[18,22],[13,24]],light,null);
  p(c,[[24,9],[30,6],[38,8],[37,11],[28,13],[24,12]],light,null);
  p(c,[[40,16],[46,17],[50,22],[47,25],[41,23],[38,20]],light,null);
  p(c,[[22,26],[28,22],[36,23],[38,28],[34,33],[27,32],[22,30]],light,null);
  r(c,25,24,7,2,mix(light,WHITE,.23)); r(c,14,18,4,2,mix(light,WHITE,.23));
  line(c,13,31,19,33,dark,2); line(c,41,32,47,29,dark,2); line(c,25,38,31,40,mid,2);
  if (alt === 1 || o.fruit) { e(c,15,27,2,2,'#efb285',INK); e(c,44,30,2,2,'#efb285',INK); r(c,14,26,1,1,WHITE); r(c,44,28,1,1,WHITE); }
  if (alt === 2) { e(c,24,18,2,2,'#d7a8be',null); e(c,39,12,2,2,'#d7a8be',null); e(c,46,28,2,2,'#d7a8be',null); }
  if (o.region === 4) {
    p(c,[[18,13],[22,7],[29,5],[37,6],[41,10],[38,14],[29,15],[25,13],[22,16]],'#d4e2d2',null);
    p(c,[[6,23],[10,18],[14,18],[19,22],[16,25],[10,26]],'#cfddd0',null);
    p(c,[[38,24],[43,19],[49,20],[54,25],[50,27],[43,27]],'#cfddd0',null);
  }
  r(c,20,56,3,2,'#7aab78'); r(c,40,54,2,4,'#8ab585');
}

function pine(c,o) {
  ellipse(c,32,58,18,4,'#183e3d45');
  p(c,[[28,42],[28,57],[36,57],[35,41]],'#8d785f',INK); r(c,30,48,3,8,'#bc9e6a');
  p(c,[[31,7],[49,33],[44,32],[57,48],[46,47],[47,51],[18,52],[19,47],[8,48],[20,32],[14,34]],'#315d5e',INK);
  p(c,[[31,12],[47,35],[40,32],[45,42],[33,44],[22,42],[26,33],[18,36]],'#468675',INK);
  p(c,[[31,5],[42,22],[37,21],[47,33],[38,31],[33,34],[22,31],[16,33],[25,21],[21,23]],'#5fa489',INK);
  p(c,[[31,7],[36,16],[31,15],[28,19],[25,18]],'#acd0a0',null);
  p(c,[[30,23],[24,29],[31,28],[35,30],[40,28],[35,23]],'#8bb995',null);
  line(c,17,46,24,44,'#5b927a',2); line(c,40,45,46,46,'#5b927a',2);
  if (o.variant % 2) { r(c,20,38,3,3,'#daaa75'); r(c,42,38,3,3,'#daaa75'); r(c,30,27,3,3,'#daaa75'); }
  if (o.region === 4) {
    p(c,[[31,6],[39,19],[35,18],[31,20],[28,18],[23,20]],'#d8e5d6',null);
    p(c,[[23,27],[30,25],[34,26],[41,30],[35,33],[29,31],[23,33],[18,33]],'#cbdccf',null);
    p(c,[[18,42],[26,40],[31,43],[39,40],[45,43],[48,47],[39,47],[35,49],[28,47],[18,48]],'#b9d0c5',null);
  }
}

function window(c,x,y,w=9,h=10,night=true) {
  r(c,x-1,y-1,w+2,h+2,INK); r(c,x,y,w,h,night?'#e9bd75':'#8ab9b0');
  r(c,x+1,y+1,w-2,2,night?'#ffe4a5':'#c9e3c9');
  r(c,x+Math.floor(w/2),y,1,h,'#755f51'); r(c,x,y+Math.floor(h/2),w,1,'#755f51');
  r(c,x-2,y+h,w+4,2,'#aa9071');
}

function house(c,o,kind='house') {
  const clinic = kind === 'clinic', shop = kind === 'shop';
  const roof = clinic ? '#5c9d95' : shop ? '#697f9b' : '#bf7969';
  const roofLight = clinic ? '#93c2a8' : shop ? '#a1b4bb' : '#e7ac87';
  const roofDark = clinic ? '#3c7072' : shop ? '#435a77' : '#8b5059';
  ellipse(c,32,59,30,4,'#193b4148');
  r(c,9,28,47,29,INK); r(c,10,28,45,28,'#d5c6a1');
  r(c,11,37,43,17,'#e9d6b0'); r(c,11,52,43,5,'#a49d86');
  r(c,11,31,3,22,'#b5a27f'); r(c,51,31,3,22,'#b5a27f');
  r(c,15,43,8,1,'#d6c39e'); r(c,44,49,7,1,'#c4b691'); r(c,16,49,7,1,'#c4b691');
  r(c,43,10,7,16,INK); r(c,44,9,5,16,'#9d8c76'); r(c,42,8,9,3,'#c9b995');
  p(c,[[3,31],[6,27],[11,14],[16,10],[45,10],[49,14],[59,29],[61,32]],roof,INK);
  p(c,[[7,28],[13,16],[17,13],[44,13],[49,20],[53,27]],roofLight,null);
  p(c,[[6,28],[56,28],[59,32],[4,32]],roofDark,null);
  for(let row=0;row<3;row++) {
    const yy=17+row*5, start=14-row*2, end=48+row*2;
    line(c,start,yy,end,yy,roofDark);
    for(let xx=start+(row%2?2:6);xx<end;xx+=8) line(c,xx,yy,xx-1,yy+3,roof);
  }
  r(c,5,31,55,2,roofLight); r(c,8,33,49,2,roofDark);
  r(c,27,37,13,21,INK); r(c,28,38,11,19,'#796856');
  r(c,29,39,9,7,'#a9beaa'); r(c,30,40,7,2,'#d7dec0'); r(c,33,39,1,7,'#6d6c5b');
  r(c,29,47,9,9,'#957d5c'); r(c,30,49,6,5,'#a68b62'); r(c,36,48,2,2,'#edcd82');
  window(c,15,38,8,9,o.night !== false); window(c,44,38,8,9,o.night !== false);
  r(c,25,57,17,2,'#c5ba9a'); r(c,24,59,19,2,'#8f998d'); r(c,25,59,17,1,'#d4c9aa');
  if (clinic) {
    r(c,25,20,14,13,INK); r(c,26,21,12,11,'#eee6bb');
    r(c,31,23,3,7,'#639c81'); r(c,29,25,7,3,'#639c81');
    r(c,11,52,9,4,'#9c7e66'); r(c,12,49,7,4,'#649779'); e(c,14,49,2,2,'#e8b7ba',null); e(c,19,48,2,2,'#e8b7ba',null);
  } else if (shop) {
    r(c,10,33,46,3,'#c9b083');
    p(c,[[10,35],[54,35],[57,41],[7,41]],'#f1c697',INK);
    for(let xx=10;xx<55;xx+=10) { p(c,[[xx,35],[xx+5,35],[xx+6,41],[xx-2,41]],'#ba7d73',null); }
    r(c,8,41,48,3,'#f5d9aa');
    r(c,11,52,11,5,'#8c785c'); r(c,12,53,9,2,'#c6a779');
    e(c,14,51,2,2,'#dba771',INK); e(c,19,51,2,2,'#8cac7c',INK);
    r(c,43,21,10,9,INK); r(c,44,22,8,7,'#e6c182'); diamond(c,48,25,2,'#ac805f',null);
  } else {
    p(c,[[27,22],[32,18],[38,23],[38,32],[27,32]],roofDark,INK);
    window(c,29,23,7,7,o.night !== false);
    r(c,44,52,9,4,'#a08065'); r(c,44,50,9,3,'#6d9a7a'); e(c,46,49,2,2,'#d6a8ae',null); e(c,51,50,2,2,'#f1cd8e',null);
  }
}

function ruin(c,o) {
  ellipse(c,32,57,29,5,'#193b4148');
  p(c,[[8,53],[7,46],[10,41],[9,23],[12,17],[22,17],[24,21],[22,27],[23,52]],'#788e8e',INK);
  p(c,[[43,52],[43,27],[40,23],[41,17],[49,15],[54,19],[54,32],[56,35],[54,53]],'#788e8e',INK);
  p(c,[[12,19],[13,11],[21,8],[26,5],[35,7],[38,12],[47,11],[51,16],[48,24],[39,21],[34,17],[27,16],[23,23]],'#9dab9d',INK);
  p(c,[[16,12],[23,11],[28,8],[34,10],[35,13],[23,13],[20,17],[14,17]],'#c2c7ad',null);
  r(c,11,25,5,16,'#acb5a2'); r(c,44,25,5,24,'#b6bcab');
  line(c,11,31,20,31,'#586e75'); line(c,11,41,20,41,'#586e75'); line(c,44,35,53,35,'#586e75');
  line(c,17,18,18,25,'#536c72'); line(c,18,25,22,26,'#536c72');
  p(c,[[26,54],[31,46],[36,47],[41,53],[45,57],[25,59]],'#82968e',INK);
  p(c,[[29,52],[32,49],[37,52],[36,56],[28,56]],'#bec3a6',null);
  p(c,[[3,57],[5,50],[14,49],[17,56]],'#9ca895',INK); r(c,4,52,8,2,'#c3c7aa');
  p(c,[[47,58],[51,50],[59,53],[60,59]],'#91a296',INK); r(c,52,53,5,2,'#c3c7aa');
  line(c,15,16,12,27,'#669b7c',2); line(c,12,27,15,38,'#669b7c',2);
  e(c,12,22,3,2,'#8aba89',null); e(c,16,32,3,2,'#79a783',null); e(c,45,14,4,2,'#82ae82',null);
  if (o.glow !== false) { diamond(c,31,12,3,'#92cebd',INK); r(c,30,10,1,3,'#e1edbf'); r(c,16,33,2,5,'#9ccdb0'); }
}

function crystal(c,o) {
  const pal = PALETTES[o.element] || PALETTES.shade;
  ellipse(c,33,56,19,4,'#17364c50');
  p(c,[[20,54],[14,29],[19,22],[28,30],[32,50]],pal.shade,INK);
  p(c,[[16,30],[19,25],[22,34],[25,49],[21,48]],pal.light,null);
  p(c,[[29,54],[25,14],[32,4],[39,15],[37,53]],pal.base,INK);
  p(c,[[27,15],[32,7],[32,47],[29,49]],pal.light,null);
  p(c,[[32,8],[37,16],[35,50],[32,47]],pal.accent,null);
  line(c,29,17,29,28,WHITE); r(c,29,31,1,3,WHITE);
  p(c,[[35,54],[40,29],[49,23],[53,32],[45,54]],pal.shade,INK);
  p(c,[[41,32],[48,26],[48,35],[42,50],[39,51]],pal.light,null);
  p(c,[[11,57],[16,50],[24,51],[29,48],[37,52],[44,49],[53,56],[51,59],[17,60]],'#657982',INK);
  r(c,16,53,7,2,'#9eaaa3'); r(c,42,54,6,2,'#9eaaa3');
  if (o.phase % 2) { sparkle(c,19,14,pal.glow,2); sparkle(c,52,43,pal.glow,1); }
}

function tinyFlower(c,x,y,color = '#e7b4a1') {
  line(c,x,y-1,x,y-7,'#4b826c'); r(c,x-2,y-3,2,1,'#76ac7e');
  e(c,x,y-9,3,2,color,null); r(c,x,y-10,1,2,'#f2d58f');
}

function flowers(c,o) {
  const a = o.variant % 2 ? '#dd9fad' : '#edc088';
  tinyFlower(c,20,53,a); tinyFlower(c,30,49,'#d8bbd7'); tinyFlower(c,41,55,a);
  tinyFlower(c,36,39,'#ece2a9'); tinyFlower(c,18,35,'#e1b5c8');
  p(c,[[24,57],[23,49],[27,52],[29,46],[31,54],[35,51],[34,58]],'#82aa7b',null);
  r(c,14,55,3,2,'#6b9b76'); r(c,43,38,3,2,'#7fab82');
}

function grassProp(c,o) {
  p(c,[[6,57],[8,45],[13,48],[15,38],[21,48],[23,33],[29,44],[33,32],[35,46],[41,40],[44,49],[50,39],[51,50],[57,44],[56,58]],'#3f7e6a',INK);
  p(c,[[10,56],[13,47],[17,53],[20,43],[24,54],[28,44],[31,55],[34,42],[38,54],[42,48],[45,55],[50,48],[53,58]],'#75aa7c',null);
  r(c,23,45,2,7,'#abd092'); r(c,36,47,2,6,'#9fc68b'); r(c,14,50,2,4,'#9fc68b');
  if (o.variant % 2) tinyFlower(c,44,49,'#dfbdb2');
}

function rock(c,o) {
  const v = (o.variant || 0) % 3;
  ellipse(c,31,56,21,4,'#17393f40');
  p(c,[[11,54],[8,44],[15,32-v*3],[30,28],[45,33],[52,46],[48,55],[33,58],[18,57]],'#829693',INK);
  p(c,[[12,43],[18,34-v*2],[29,31],[42,35],[42,40],[30,42],[23,49],[15,49]],'#b0b9a4',null);
  p(c,[[28,43],[41,39],[49,47],[45,53],[33,56],[26,52]],'#647e80',null);
  p(c,[[16,37],[21,34],[30,33],[33,35],[24,37]],'#d2d0b0',null);
  line(c,31,33,27,41,'#73887e'); line(c,27,41,31,47,'#73887e');
  p(c,[[10,53],[15,48],[22,49],[27,54],[19,56]],'#65977b',null); r(c,13,50,5,2,'#8fb384');
  if (v === 2) { diamond(c,40,43,3,'#adc4c1',INK); r(c,39,41,1,3,'#e6e6c6'); }
  if (o.region === 4) p(c,[[11,42],[16,32],[29,28],[45,33],[49,39],[42,41],[36,40],[29,44],[22,42],[16,45]],'#d7e1d1',null);
}

function chest(c,o) {
  const open = o.open || o.opened;
  ellipse(c,32,57,20,3,'#18383c55');
  r(c,13,36,39,21,INK); r(c,15,37,35,18,'#9b7051');
  r(c,16,41,33,3,'#bc8d5e'); r(c,16,46,33,2,'#bd905e'); r(c,16,52,33,2,'#81593f');
  r(c,20,37,4,18,'#e3ba76'); r(c,41,37,4,18,'#e3ba76'); r(c,21,39,1,14,'#f1d99a');
  if (open) {
    p(c,[[13,34],[16,18],[49,18],[52,35]],'#977350',INK); r(c,18,21,29,12,'#4d4c43'); r(c,16,33,34,3,'#dec18b');
    r(c,15,37,35,4,'#3e4540'); r(c,21,38,22,2,'#e0c98c');
  } else {
    p(c,[[13,36],[14,27],[19,23],[46,23],[51,28],[52,36]],'#be905e',INK);
    r(c,17,27,32,3,'#e1b779'); r(c,20,24,4,13,'#e9c680'); r(c,41,24,4,13,'#e9c680');
    r(c,14,35,37,3,'#6b5142'); r(c,29,34,8,9,INK); r(c,30,35,6,7,'#e5bf78'); r(c,32,37,2,3,'#715b46');
  }
  r(c,14,55,5,3,'#5c5244'); r(c,46,55,5,3,'#5c5244');
}

function lantern(c,o) {
  if (o.glow !== false) {
    ellipse(c,33,31,20,22,'#efc9820b'); ellipse(c,33,31,14,16,'#efc98214'); ellipse(c,33,31,9,11,'#efc9821d');
  }
  ellipse(c,32,59,8,2,'#18393e55');
  r(c,30,36,5,22,INK); r(c,31,38,2,18,'#81908a');
  p(c,[[26,60],[27,56],[37,56],[39,60]],'#526b6d',INK);
  p(c,[[23,23],[25,18],[30,16],[35,16],[39,19],[41,23]],'#778b87',INK);
  r(c,24,24,16,14,INK); r(c,26,25,12,11,'#eac789'); r(c,27,25,4,11,'#ffe7ad');
  r(c,31,24,2,14,'#766c58'); r(c,23,37,18,3,'#78897f'); r(c,24,38,16,1,'#b8ba97');
  r(c,30,13,4,3,INK); r(c,31,11,2,2,'#b7b591');
  if (o.phase % 2) r(c,35,28,2,5,'#f5d799');
}

function boat(c,o) {
  ellipse(c,32,53,28,5,'#173c4855');
  p(c,[[3,37],[17,42],[45,41],[61,33],[56,47],[46,54],[20,56],[8,48]],'#855f4e',INK);
  p(c,[[4,37],[14,32],[43,30],[60,33],[45,44],[17,45]],'#bf9b70',INK);
  p(c,[[10,37],[19,35],[43,33],[51,34],[44,40],[19,41]],'#5d6054',INK);
  r(c,22,35,4,7,'#d0b282'); r(c,37,34,4,7,'#d0b282');
  line(c,11,44,23,50,'#c79869',2); line(c,23,50,43,48,'#c79869',2); line(c,43,48,55,41,'#c79869',2);
  r(c,29,9,3,32,INK); r(c,30,10,1,28,'#c2aa7c');
  p(c,[[33,9],[53,28],[33,29]],'#e1d7b1',INK); p(c,[[34,12],[48,26],[34,26]],'#f3e7c2',null);
  p(c,[[27,12],[15,29],[27,29]],'#a1b4aa',INK); line(c,20,26,26,17,'#c5d2ba');
  p(c,[[31,8],[31,3],[44,5],[41,9]],'#d79a7b',INK);
  r(c,5,56,11,1,'#84b9b0'); r(c,47,57,12,1,'#84b9b0');
}

function bridge(c,o) {
  r(c,0,15,64,36,INK); r(c,0,18,64,29,'#a78964');
  for (let xx=0;xx<64;xx+=8) { r(c,xx,19,7,27,'#c2a478'); r(c,xx+1,21,5,1,'#dac090'); r(c,xx+4,24,1,16,'#a48b66'); r(c,xx+2,42,4,1,'#e0c498'); }
  r(c,0,16,64,3,'#6c6954'); r(c,0,46,64,3,'#665f4d');
  for (let xx=4;xx<64;xx+=18) {
    r(c,xx,8,4,16,INK); r(c,xx+1,8,2,14,'#b39a6d'); r(c,xx-1,7,6,3,'#d4b37b');
    r(c,xx,42,4,16,INK); r(c,xx+1,43,2,13,'#b39a6d'); r(c,xx-1,41,6,3,'#d4b37b');
  }
  r(c,0,12,64,2,'#b29d77'); r(c,0,50,64,2,'#c3aa7c');
}

function portal(c,o) {
  const pal = PALETTES[o.element] || PALETTES.tide;
  ellipse(c,32,56,24,6,'#162f4350');
  e(c,32,30,19,24,'#5c7c89',INK); e(c,32,30,14,19,pal.shade,INK);
  e(c,32,30,11,17,'#2d5068',null); e(c,32,31,8,13,pal.base,null); e(c,33,32,5,10,pal.light,null);
  p(c,[[24,41],[24,24],[29,17],[35,18],[40,25],[37,34],[33,39],[30,36],[34,32],[35,26],[32,24],[29,27],[29,38],[32,44]],pal.accent,null);
  r(c,30,26,2,7,pal.detail);
  line(c,21,10,25,16,'#b5c5b0',2); line(c,44,12,39,17,'#b5c5b0',2);
  line(c,14,28,20,29,'#b5c5b0',2); line(c,46,31,51,31,'#b5c5b0',2);
  line(c,18,45,23,42,'#b5c5b0',2); line(c,42,44,46,48,'#b5c5b0',2);
  p(c,[[11,59],[14,51],[24,49],[29,53],[35,52],[41,48],[51,52],[55,59]],'#889e99',INK);
  r(c,17,54,9,2,'#bac7ab'); r(c,38,55,12,2,'#bac7ab');
  diamond(c,32,8,4,pal.accent,INK); r(c,31,6,1,3,pal.detail);
  if (o.phase % 2) { sparkle(c,11,19,pal.glow); sparkle(c,53,41,pal.glow); } else { sparkle(c,50,18,pal.glow,1); sparkle(c,12,44,pal.glow,1); }
}

function sign(c,o) {
  ellipse(c,32,58,11,3,'#183d4050');
  r(c,29,31,6,26,INK); r(c,30,32,4,24,'#9a7a56'); r(c,31,35,1,17,'#c8a574');
  p(c,[[13,18],[47,18],[53,24],[48,32],[12,32]],'#bb9669',INK);
  r(c,15,20,31,3,'#d9b683'); r(c,16,30,29,1,'#876749');
  line(c,20,26,34,26,'#655c4a',2); line(c,31,23,35,26,'#655c4a',2); line(c,35,26,31,29,'#655c4a',2);
  r(c,15,24,2,2,'#7b624c'); r(c,45,24,2,2,'#7b624c');
  p(c,[[24,59],[25,52],[28,55],[30,49],[31,58]],'#71a47a',null);
}

function well(c,o) {
  ellipse(c,32,58,23,4,'#183d4050');
  e(c,32,48,19,10,'#879d95',INK); r(c,13,44,39,10,'#8da097'); e(c,32,42,19,8,'#c1c7ac',INK);
  e(c,32,42,13,4,'#325566',INK); e(c,32,43,10,2,'#669b9e',null);
  line(c,16,49,48,49,'#647f7e'); line(c,22,47,22,54,'#647f7e'); line(c,39,48,39,56,'#647f7e');
  r(c,16,24,4,21,INK); r(c,17,25,2,19,'#a98c66'); r(c,45,24,4,21,INK); r(c,46,25,2,19,'#a98c66');
  p(c,[[8,24],[18,12],[45,12],[56,24]],'#9e7967',INK);
  p(c,[[13,21],[20,15],[44,15],[50,21]],'#d3a87e',null); r(c,9,24,46,3,'#826756');
  r(c,20,29,26,3,'#8a7a5c'); r(c,30,30,2,12,'#d6bd88');
  p(c,[[27,39],[37,39],[35,46],[29,46]],'#b69365',INK); r(c,28,40,8,2,'#dcc08b');
}

const PROPS = {tree,pine,house,clinic:(c,o)=>house(c,o,'clinic'),shop:(c,o)=>house(c,o,'shop'),ruin,crystal,flower:flowers,flowers,grass:grassProp,rock,chest,lantern,boat,bridge,portal,sign,well};

/** World prop; variants, night, element, open and glow are optional. */
export function drawProp(ctx,kind,x = 0,y = 0,size = 64,opts = {}) {
  const phase = Math.floor(timeValue(opts.time) * 3) % 4;
  const element = opts.element || (Number.isInteger(opts.region) ? ['moss','tide','ember','stone','frost','shade','volt','light'][opts.region] : undefined);
  const o = {...opts,phase,element,variant:Number(opts.variant)||0};
  const animated = kind === 'crystal' || kind === 'portal' || kind === 'lantern';
  const key = `prop|${kind}|${o.variant}|${o.night}|${o.region}|${o.palette?.join?.(',')||''}|${o.element||''}|${!!(o.open||o.opened)}|${o.glow}|${!!o.fruit}|${animated?phase:0}`;
  cachedArt(ctx,x,y,size,key,c=>(PROPS[kind] || rock)(c,o),opts.flip);
}

function tile(c,kind,o) {
  const v = o.variant % 4;
  if (kind === 'water') {
    r(c,0,0,64,64,o.deep ? '#285365' : '#427d85');
    for(let row=0;row<4;row++) {
      const xx = ((row*19+v*11+o.phase*3)%60)-3;
      r(c,xx,7+row*15,13,1,'#6da89f'); r(c,xx+9,9+row*15,8,1,'#558f94');
      r(c,(xx+34)%58,14+row*14,8,1,'#518e93');
    }
    r(c,9+v*8,31,3,1,'#9ac3ad'); r(c,12+v*8,30,5,1,'#9ac3ad');
    if (o.shore) { r(c,0,0,64,3,'#b5d2ba'); r(c,0,3,64,2,'#72a49a'); r(c,6,5,16,1,'#85b6a6'); r(c,36,5,13,1,'#85b6a6'); }
  } else if (kind === 'path' || kind === 'sand') {
    r(c,0,0,64,64,kind==='sand'?'#c5ba8e':'#b5a782');
    const dark = kind==='sand'?'#b0a882':'#9d9777';
    r(c,8+v*3,12,4,1,dark); r(c,42,36-v*3,3,2,dark); r(c,19,49,5,1,dark); r(c,55,58,3,1,dark);
    r(c,26,23,4,1,'#d6c59c'); r(c,38,51,5,1,'#d6c59c'); r(c,6,42,2,1,'#d6c59c');
    if (kind === 'sand' && v === 1) { p(c,[[47,14],[49,11],[52,12],[53,15]],'#ddcfab',null); r(c,49,14,1,1,'#b5a787'); }
  } else if (kind === 'stone') {
    r(c,0,0,64,64,'#738d87');
    for(let row=0;row<4;row++) {
      const offset = row % 2 ? -16 : 0;
      for(let xx=offset;xx<64;xx+=32) { r(c,xx+1,row*16+1,30,14,'#99aa97'); r(c,xx+2,row*16+2,27,1,'#bbc2a4'); r(c,xx+29,row*16+3,1,11,'#839b8b'); }
    }
    r(c,7+v*7,12,6,1,'#aaba9d'); r(c,39,42,5,1,'#879e90');
  } else if (kind === 'wood') {
    r(c,0,0,64,64,'#716e54');
    for(let xx=0;xx<64;xx+=16) { r(c,xx+1,0,14,64,'#ae956e'); r(c,xx+2,0,2,64,'#c6ad7c'); r(c,xx+8,8+v*3,1,22,'#978463'); r(c,xx+6,37,4,1,'#977c5c'); r(c,xx+11,3,1,2,'#5f6654'); r(c,xx+11,58,1,2,'#5f6654'); }
  } else {
    r(c,0,0,64,64,o.night?'#456f68':'#65916f');
    const flecks = [[7,8],[26,15],[48,7],[15,31],[38,35],[54,47],[8,56],[29,56]];
    for (let i=0;i<flecks.length;i++) {
      const [xx,yy] = flecks[i]; const shift = ((i+v)%3)-1;
      r(c,xx+shift*2,yy,3,1,'#7da480');
      if ((i+v)%3===0) { r(c,xx+1+shift*2,yy-2,1,2,'#86ad85'); r(c,xx+3+shift*2,yy-1,1,1,'#86ad85'); }
      else r(c,xx+1,yy+1,2,1,'#587f66');
    }
    if (kind === 'flowers') {
      tinyFlower(c,13,22,'#d8b0b6'); tinyFlower(c,41,42,'#e8d8a2'); tinyFlower(c,26,58,'#d8b0b6'); tinyFlower(c,55,19,'#c5bfd8');
    }
  }
}

/** A seamlessly repeating ground tile; water accepts deep/shore flags. */
export function drawTile(ctx,kind,x = 0,y = 0,size = 64,opts = {}) {
  const o = {...opts,variant:Number(opts.variant)||0,phase:Math.floor(timeValue(opts.time)*3)%4};
  const key = `tile|${kind}|${o.variant%4}|${!!o.night}|${!!o.deep}|${!!o.shore}|${kind==='water'?o.phase:0}`;
  cachedArt(ctx,x,y,size,key,c=>tile(c,kind,o));
}

export const ART_ELEMENTS = Object.freeze(Object.fromEntries(Object.entries(PALETTES).map(([key,pal])=>[key,Object.freeze({...pal})])));
