import {bubblePosition,overheadBubblePosition,shortenedLeader} from './presentation-rules.js';
import {photoBounds,PHOTO_TARGETS} from './photo-layout.js';
// Screen-space leaders track projected characters, not fixed decorative triangle tails.
import './dialogue-presentation.css';
const NS='http://www.w3.org/2000/svg';
export function dialogueKind(speaker=''){return /心理|内心/.test(speaker)?'thought':/场景|现场|提示|纸条|系统|解析/.test(speaker)?'narration':'speech';}
export function screenPoint(canvas,p){if(!p||p.visible===false)return null;const r=canvas.getBoundingClientRect();return {x:r.left+p.x*r.width,y:r.top+p.y*r.height};}
export function leaderGeometry(box,point){const cx=box.left+box.width/2,cy=box.top+box.height/2,dx=point.x-cx,dy=point.y-cy;
 if(point.x>=box.left&&point.x<=box.right&&point.y>=box.top&&point.y<=box.bottom)return null;
 const f=Math.min((box.width/2)/Math.max(Math.abs(dx),.001),(box.height/2)/Math.max(Math.abs(dy),.001));return {x1:cx+dx*f,y1:cy+dy*f,x2:point.x,y2:point.y};}
export function connectDialogue(host,box,{speaker=()=>'',anchor=()=>null,kind=()=>dialogueKind(speaker())}={}){
 box.classList.add('rounded-dialogue');
 const svg=document.createElementNS(NS,'svg');svg.classList.add('dialogue-leader');svg.setAttribute('aria-hidden','true');
 const line=document.createElementNS(NS,'line'),dot=document.createElementNS(NS,'circle');dot.setAttribute('r','3');svg.append(line,dot);host.append(svg);
 const avatar=document.createElement('div');avatar.className='dialogue-avatar';avatar.innerHTML='<svg viewBox="0 0 52 58" aria-hidden="true"><circle cx="26" cy="18" r="11"/><path d="M8 54v-10a18 18 0 0 1 36 0v10Z"/></svg><span></span>';host.append(avatar);
 let disposed=false,raf,last=0,cache='';
 function tick(now){if(disposed)return;raf=requestAnimationFrame(tick);if(now-last<50)return;last=now;
  const type=kind(),name=speaker(),r=host.getBoundingClientRect(),b=box.getBoundingClientRect();box.dataset.dialogueKind=type;box.dataset.speaker=name;
  const hidden=type==='narration'||!name||!box.getClientRects().length||getComputedStyle(box).visibility==='hidden'||b.width===0||b.height===0;
  svg.style.display=hidden?'none':'';avatar.hidden=true;if(hidden)return;
  let p=anchor(name),hasAnchor=!!p;if(!p||p.x<r.left+8||p.x>r.right-8||p.y<r.top+8||p.y>r.bottom-8){hasAnchor=false;p={x:r.left+r.width*.42,y:r.top+r.height*.64};}
  if(!host.classList.contains('dialogue-inset')){const obstacles=['computer','bed','instruments','monitor'].map(k=>{const o=photoBounds(r.width,r.height,PHOTO_TARGETS[k]);return {x:o.left,y:o.top,width:o.width,height:o.height};});const patient=/^(林先生|周先生)/.test(name);box.classList.toggle('patient-overhead',patient);const pos=patient&&hasAnchor?overheadBubblePosition({width:r.width,height:r.height},{width:b.width,height:b.height},{x:p.x-r.left,y:p.y-r.top}):bubblePosition({width:r.width,height:r.height},{width:b.width,height:b.height},{x:p.x-r.left,y:p.y-r.top},obstacles);box.style.position='absolute';box.style.left=pos.x+'px';box.style.top=pos.y+'px';box.style.right='auto';box.style.bottom='auto';box.style.transform='none';}const placed=box.getBoundingClientRect();const g=leaderGeometry(placed,p);svg.style.display=g&&hasAnchor?'':'none';if(!g||!hasAnchor)return;
  svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);svg.dataset.lineKind=type;line.setAttribute('stroke-dasharray',type==='thought'?'7 6':'none');
  const end=shortenedLeader({x:g.x1,y:g.y1},{x:g.x2,y:g.y2});if(!end){svg.style.display='none';return;}const value=[g.x1-r.left,g.y1-r.top,end.x-r.left,end.y-r.top].map(x=>Math.round(x*2)/2);const key=type+value.join(',');if(key!==cache){['x1','y1','x2','y2'].forEach((k,i)=>line.setAttribute(k,value[i]));dot.setAttribute('cx',value[2]);dot.setAttribute('cy',value[3]);cache=key;}
 }
 raf=requestAnimationFrame(tick);return ()=>{disposed=true;cancelAnimationFrame(raf);svg.remove();avatar.remove();box.classList.remove('rounded-dialogue');};
}
