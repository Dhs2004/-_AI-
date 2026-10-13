// Documentation-only image export. The game itself never loads this page.
const frame=document.querySelector('#game');
const button=document.querySelector('#capture');
const status=document.querySelector('#capture-status');
const fontCache=new WeakMap();
// Preserve one-line labels when SVG font metrics round slightly differently
// from the live DOM. This only changes the exported clone.
function singleLineSelectors(root){
 const selectors=[];
 function visit(el,path){
  if(!el.children.length&&el.textContent.trim()){
   const range=el.ownerDocument.createRange();range.selectNodeContents(el);
   const rects=[...range.getClientRects()].filter(r=>r.width&&r.height);
   if(rects.length&&rects.every(r=>Math.abs(r.top-rects[0].top)<2))selectors.push(path);
  }
  const counts={};
  for(const child of el.children){
   const tag=child.localName;counts[tag]=(counts[tag]||0)+1;
   visit(child,`${path} > ${tag}:nth-of-type(${counts[tag]})`);
  }
 }
 visit(root,'#readme-export-root');return selectors;
}
button.onclick=async()=>{
 button.disabled=true;status.textContent='正在导出当前界面…';
 try{
  const doc=frame.contentDocument;
  await doc.fonts.ready;
  // Run inside the iframe realm so HTMLElement checks and font discovery
  // include every descendant, including the game's serif headings.
  if(!frame.contentWindow.htmlToImage){
   await new Promise((resolve,reject)=>{
    const script=doc.createElement('script');
    script.src='../qa/vendor/html-to-image.js';
    script.onload=resolve;script.onerror=()=>reject(new Error('无法载入图文导出库。'));
    doc.head.append(script);
   });
  }
  const exporter=frame.contentWindow.htmlToImage;
  const modal=doc.querySelector('#modal');
  const scope=document.querySelector('#capture-target').value;
  const panel=scope==='panel';
  if(panel&&(!modal||modal.classList.contains('hidden')))throw new Error('请先在游戏里打开要导出的菜单。');
  const node=panel?modal.firstElementChild:scope==='stage'?doc.querySelector('#stage'):doc.body;
  const box=node.getBoundingClientRect();
  const width=Math.round(scope!=='page'?box.width:frame.contentWindow.innerWidth);
  const height=Math.round(scope!=='page'?box.height:frame.contentWindow.innerHeight);
  if(!fontCache.has(doc))fontCache.set(doc,await exporter.getFontEmbedCSS(doc.body,{preferredFontFormat:'woff2'}));
  const svgUrl=await exporter.toSvg(node,{
   width,height,fontEmbedCSS:fontCache.get(doc),
   backgroundColor:'#10202a',style:{margin:'0',transform:'none'},
  });
  const svg=new DOMParser().parseFromString(decodeURIComponent(svgUrl.split(',').slice(1).join(',')),'image/svg+xml');
  const clone=svg.querySelector('foreignObject').firstElementChild;
  clone.id='readme-export-root';
  const correction=svg.createElementNS('http://www.w3.org/1999/xhtml','style');
  const lines=singleLineSelectors(node);
  correction.textContent=lines.length?lines.join(',')+'{white-space:nowrap!important}':'';
  clone.append(correction);
  const raster=new Image();
  raster.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));
  await raster.decode();
  const canvas=document.createElement('canvas');canvas.width=width*2;canvas.height=height*2;
  canvas.getContext('2d').drawImage(raster,0,0,canvas.width,canvas.height);
  const url=canvas.toDataURL('image/png');
  const name=document.querySelector('#capture-name').value.replace(/[^a-z0-9_-]/gi,'').slice(0,60)||'starfall';
  const link=document.createElement('a');link.download=name+'.png';link.href=url;
  link.textContent='下载 '+name+'.png';link.id='capture-result';
  status.replaceChildren(document.createTextNode(`已导出 ${width*2} × ${height*2} PNG · `),link);
 }catch(error){status.textContent='导出失败：'+error.message;}
 finally{button.disabled=false;}
};
