import {nodes} from './case-data.js';
import {errorReason} from './decision-feedback.js';

const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function answeredQuestions(snapshot){
 const ids=new Set((snapshot.log||[]).map(x=>x.id));
 // Older or truncated logs may omit earlier completed questions in this run.
 const start=snapshot.mode==='full'?0:10;
 for(let i=start;i<Math.min(snapshot.index,nodes.length);i++)ids.add(nodes[i].id);
 return nodes.filter(n=>ids.has(n.id));
}

export function mountQuestionReview(host,snapshot,onClose){
 const answered=answeredQuestions(snapshot);
 host.innerHTML='<div class="eyebrow">ANSWER REVIEW</div><h2>回看已答题</h2><p>选择任意已作答题查看记录与解析，关闭后继续当前任务。</p><nav class="review-jumps" aria-label="选择已作答题"></nav><section id="review-question"></section><div class="review-navigation"><button id="review-previous" class="secondary">上一题</button><button id="review-next" class="secondary">下一题</button></div><button id="review-return" class="primary">返回当前任务</button>';
 const q=s=>host.querySelector(s);q('#review-return').onclick=onClose;
 if(!answered.length){q('#review-question').textContent='尚未完成作答。';q('.review-navigation').hidden=true;return;}
 q('.review-jumps').innerHTML=answered.map(n=>`<button data-review-id="${n.id}" title="${escape(n.title)}">${n.id}</button>`).join('');
 let current=0;
 function show(index,attemptIndex){
  current=index;const n=answered[index];
  const attempts=(snapshot.log||[]).filter(x=>x.id===n.id);
  if(!attempts.length)attempts.push({id:n.id,result:'correct'});
  const ai=attemptIndex??attempts.length-1,attempt=attempts[ai];
  const chosenId=attempt.result==='correct'?n.correctOptionId:attempt.optionId;
  const known=n.options.some(o=>o.id===chosenId);
  const choice=n.options.findIndex(o=>o.id===chosenId);
  q('#review-question').innerHTML=`<div class="eyebrow">${n.phase==='diagnosis'?'问诊':'手术'} · ${n.id}</div><h3>${escape(n.title)}</h3>${attempts.length>1?`<label class="review-attempt-label">本题作答记录 <select id="review-attempt">${attempts.map((x,i)=>`<option value="${i}" ${i===ai?'selected':''}>第 ${i+1} 次 · ${x.result==='correct'?'正确':'错误'}</option>`).join('')}</select></label>`:''}<p class="review-context">${escape(n.context.replace(/^剧情(?:线索)?：/,''))}</p><p class="review-prompt">${escape(n.prompt)}</p><ol class="review-options">${n.options.map((o,i)=>`<li class="${o.id===n.correctOptionId?'review-correct':''} ${o.id===chosenId?'review-chosen':''}"><span>${String.fromCharCode(65+i)}</span><div>${escape(o.text)}<small>${o.id===chosenId?'你的选择':''}${o.id===chosenId&&o.id===n.correctOptionId?' · ':''}${o.id===n.correctOptionId?'正确答案':''}</small></div></li>`).join('')}</ol><p class="review-result">${known?'你的选择：'+String.fromCharCode(65+choice)+' · '+(attempt.result==='correct'?'正确':'错误'):'旧存档未记录具体错误选项。'}</p><article class="review-explanation"><h3>解析</h3>${attempt.result==='incorrect'&&known?`<p>${escape(errorReason(n,chosenId))}</p>`:''}<p>${escape(n.hint)}</p><p>${escape(n.feedback)}</p></article>`;
  q('#review-attempt')?.addEventListener('change',e=>show(current,Number(e.target.value)));
  host.querySelectorAll('[data-review-id]').forEach(b=>{const active=b.dataset.reviewId===n.id;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  q('#review-previous').disabled=index===0;q('#review-next').disabled=index===answered.length-1;
 }
 host.querySelectorAll('[data-review-id]').forEach((b,i)=>b.onclick=()=>show(i));
 q('#review-previous').onclick=()=>show(current-1);q('#review-next').onclick=()=>show(current+1);
 const latest=snapshot.log?.at(-1)?.id;show(Math.max(0,answered.findIndex(n=>n.id===latest)));
}
