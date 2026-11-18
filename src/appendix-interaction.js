import {appendixScene} from './appendix-sequence.js';
export function createAppendixInteraction(host,{getStep,getProgress,setProgress,isPaused,isDisposed,openScope,showBody}){
 let cancel=null;
 async function perform(){
  cancel?.();const step=getStep(),info=appendixScene(step);if(info.scope)openScope();else showBody();
  const parent=host.querySelector('.appendix-card')||host,card=document.createElement('section');card.className='appendix-operation';
  card.innerHTML='<small>正确决策后的操作演出 · 不另计分</small><h3></h3><p class="operation-instruction"></p><div class="operation-phase"></div><label class="operation-track" hidden>拖动改善视野<input type="range" min="0" max="100" value="0" aria-label="显露进度"></label><button class="primary"></button>';
  card.querySelector('h3').textContent=info.title;parent.append(card);parent.classList.add('is-operating');let index=0,animating=false,finished=false;
  return new Promise(resolve=>{
   const finish=value=>{if(finished)return;finished=true;card.remove();parent.classList.remove('is-operating');cancel=null;resolve(value);};cancel=()=>finish(false);
   const button=card.querySelector('button'),instruction=card.querySelector('.operation-instruction'),phase=card.querySelector('.operation-phase');
   const draw=()=>{instruction.textContent=info.actions[index][0];button.textContent=info.actions[index][0]+' →';phase.textContent=(index+1)+' / '+info.actions.length;};draw();
   async function animate(target){if(animating||finished||isPaused())return;animating=true;button.disabled=true;const from=getProgress();for(let i=1;i<=40;i++){if(finished||isDisposed())return finish(false);while(isPaused()&&!finished)await new Promise(r=>setTimeout(r,50));if(finished)return;const q=i/40;setProgress(from+(target-from)*(q*q*(3-2*q)));await new Promise(r=>setTimeout(r,25));}index++;animating=false;if(index===info.actions.length){setProgress(1);finish(true);}else{button.disabled=false;draw();}}
   button.onclick=()=>animate(info.actions[index][1]);
   if(step===2){const label=card.querySelector('label'),slider=card.querySelector('input');label.hidden=false;slider.oninput=()=>{if(animating||finished||isPaused())return;setProgress(Number(slider.value)/100);if(Number(slider.value)>=95)animate(1);};}
  });
 }
 return {perform,dispose(){cancel?.();}};
}
