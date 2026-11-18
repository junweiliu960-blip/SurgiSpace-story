export const TEXT_TRANSITIONS=new Set(['T03','T04']);
export function presentationKind(line){return /心理|内心/.test(line.speaker)?'thought':/场景|现场|系统|提示/.test(line.speaker)?'event':line.speaker==='纸条'?'prop':'speech';}
export const DRAG_STEPS=new Set(['S02','S03','S07','S08']);
export function bubblePosition(host,box,point,obstacles=[]){
 const pad=12,w=Math.min(box.width,host.width-2*pad),h=box.height,p=point||{x:host.width*.38,y:host.height*.45};
 const candidates=[[p.x+34,p.y-h-30],[p.x-w-34,p.y-h-30],[p.x+34,p.y+48],[p.x-w-34,p.y+48],[pad,host.height-h-pad],[host.width-w-pad,host.height-h-pad]];
 const area=(a,b)=>Math.max(0,Math.min(a.x+w,b.x+b.width)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+h,b.y+b.height)-Math.max(a.y,b.y));
 return candidates.map(([x,y])=>({x:Math.max(pad,Math.min(host.width-w-pad,x)),y:Math.max(pad,Math.min(host.height-h-pad,y))})).map(c=>({...c,score:obstacles.reduce((n,o)=>n+area(c,o)*8,0)+area(c,{x:p.x-42,y:p.y-55,width:84,height:95})*30+Math.hypot(c.x+w/2-p.x,c.y+h/2-p.y)})).sort((a,b)=>a.score-b.score)[0];
}

export function overheadBubblePosition(host,box,head){const pad=12,w=Math.min(box.width,host.width-pad*2);return {x:Math.max(pad,Math.min(host.width-w-pad,head.x-w/2)),y:Math.max(pad,head.y-box.height-36)};}
export function shortenedLeader(from,to,gap=16){const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy);if(length<=gap)return null;return {x:to.x-dx/length*gap,y:to.y-dy/length*gap};}
