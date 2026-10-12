import {CHAPTERS,SPECIES} from './data.js';
import {journeySummary,chapterJournal,expeditionRecollection} from './journey.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const linesMarkup=lines=>lines.map(([speaker,text])=>`<p><span>${esc(speaker)}</span>${esc(text)}</p>`).join('');
const portrait=role=>`<canvas width="112" height="112" data-person="${role}" aria-hidden="true"></canvas>`;

export function journeyMarkup(game,region=game.region){
 const summary=journeySummary(game),book=chapterJournal(game,region);if(!book)return '';
 const {chapter}=book,next=summary.next;
 return `<section class="journey-cover"><div class="journey-compass" aria-hidden="true">✧<small>航程 · ${String(summary.badges).padStart(2,'0')}</small></div><div><span class="eyebrow">${esc(summary.name)}的旅途纪要</span><h3>海很远，故事还在。</h3><p>停在 ${esc(summary.island)} · ${esc(summary.location)}<br>已经同行 ${summary.time}</p></div></section>
 <div class="journey-totals"><span><b>${summary.badges}<small> / 8</small></b>点亮星灯</span><span><b>${summary.memories}<small> / 24</small></b>岛屿记忆</span><span><b>${summary.families}<small> / ${new Set(Object.values(SPECIES).map(s=>s.family)).size}</small></b>同行家族</span><span><b>${summary.quests}<small> / 24</small></b>居民委托</span></div>
 <section class="journey-next"><div><small>接下来的一步</small><h3>${esc(next.title)}</h3><p>${esc(next.detail)}</p></div><button id="journey-next" class="primary">${next.kind==='expedition'?'查看当前目标':next.kind==='trial'?'查看试航邀请':next.kind==='travel'?'打开群岛航图':'回到旅途'} →</button></section>
 <div class="journey-archive-heading"><h3>把走过的路，重新读一遍</h3><p>已抵达的岛屿与已经做出的回应，会留在这里。</p></div>
 <div class="journey-chapter-tabs" aria-label="选择回顾的章节">${summary.chapters.map(c=>`<button data-journal-region="${c.id}" aria-pressed="${c.id===region}" ${!c.visited?'disabled':''}><b>${String(c.id+1).padStart(2,'0')}</b><span>${c.visited?CHAPTERS[c.id].island:'尚未抵达'}</span><small>${c.complete?'✧':c.visited?'·':'—'}</small></button>`).join('')}</div>
 <section class="journey-chapter"><div class="journey-chapter-heading"><div><small>第 ${region+1} 章 · ${esc(chapter.island)}</small><h3>${esc(chapter.name)}</h3></div><span>${book.won?'✧ 星灯已点亮':'○ 正在路上'}</span></div><p class="journey-recap">${esc(book.recap)}</p>
 <div class="journey-scenes">${book.scenes.map(scene=>`<button data-journal-scene="${scene.id}"><span>▤</span><strong>${scene.title}</strong><small>重读对话 ↗</small></button>`).join('')||'<p class="section-note">听完这一章的开场，第一段往事便会收进来。</p>'}</div>
 <h4>这座岛的三份记忆</h4><div class="journey-expeditions">${book.expeditions.map(e=>`<article>${portrait(e.role)}<div><small>${esc(e.giver)}</small><h3>${esc(e.title)}</h3><p>${e.legacy?'旧旅程的记忆碎片':`${e.step} / ${e.total} 段经过已记录`}</p></div><button class="secondary" data-journal-expedition="${e.id}" ${e.step?'':'disabled'}>${e.step?'翻开回忆':'尚无记录'}</button></article>`).join('')}</div></section>
 <div class="journey-footer"><button id="journey-current" class="secondary">返回当前手记</button><button id="journey-bonds" class="secondary">伙伴的同行纪事</button><button id="journey-letters" class="secondary">群岛回信</button></div>`;
}
export function sceneReaderMarkup(scene,chapter){return `<div class="journey-reader-heading">${portrait(scene.role)}<div><small>${esc(chapter.island)} · ${esc(chapter.name)}</small><h3>${esc(scene.title)}</h3></div></div><article class="journey-prose">${linesMarkup(scene.lines)}</article><button class="secondary" id="journey-reader-back">返回这一章</button>`;}
export function recollectionMarkup(game,id){
 const book=expeditionRecollection(game,id);if(!book)return '';
 return `<div class="journey-reader-heading">${portrait(book.role)}<div><small>${esc(CHAPTERS[book.region].island)} · ${esc(book.giver)}</small><h3>${esc(book.title)}</h3></div></div>${book.legacy?'<p class="journey-legacy">这份旧存档保留了记忆碎片，没有记录当时的分支回应。这里收录共同经过。</p>':''}
 <div class="journey-reading-index" aria-label="选择已经走过的一段">${book.sections.map(s=>`<button data-recollection-stage="${s.id}" aria-pressed="false"><span>${String(s.number).padStart(2,'0')}</span>${esc(s.title)}</button>`).join('')}${book.ending.length?'<button data-recollection-stage="ending" aria-pressed="false"><span>✧</span>收好的记忆</button>':''}</div><div id="journey-reading-page"></div><div class="journey-reader-controls"><button id="recollection-prev" class="secondary">← 上一段</button><small id="recollection-position"></small><button id="recollection-next" class="secondary">下一段 →</button></div><button class="text-button" id="journey-reader-back">返回这一章</button>`;
}
export function recollectionPageMarkup(book,index){
 const section=book.sections[index];
 if(!section)return `<article class="journey-prose"><h3>收好的记忆</h3>${linesMarkup(book.ending)}</article>`;
 return `<article class="journey-prose"><small>第 ${section.number} 段经过</small><h3>${esc(section.title)}</h3>${linesMarkup(section.lines)}${section.success?`<p class="journey-echo">${esc(section.success)}</p>`:''}${section.choice?`<aside class="journey-kept-choice"><small>你当时的回应</small><h4>${esc(section.choice.label)}</h4>${section.choice.unread?'<p>回应的回声还没有读完，继续旅程后便会接上。</p>':linesMarkup(section.choice.reply)}</aside>`:''}${section.legacyChoice?'<p class="journey-echo">旧旅程没有留下这一次选择的记录。</p>':''}</article>`;
}
