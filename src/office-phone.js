import {photoRect} from './photo-layout.js';
import {projectiveMatrix} from './scene-screen.js';
export const OFFICE_PHONE_QUAD=[[1366,735],[1471,752],[1436,847],[1312,825]];
export function mountOfficePhone(host,onAnswer){
 const screen=document.createElement('button');screen.className='office-phone-screen';screen.innerHTML='<small></small><i></i><span></span>';host.append(screen);screen.onclick=onAnswer;
 let state='idle';function update(){const r=photoRect(host.clientWidth,host.clientHeight),quad=OFFICE_PHONE_QUAD.map(([x,y])=>[r.left+x/1672*r.width,y/941*r.height]);screen.style.transform='matrix3d('+projectiveMatrix(240,360,quad).join(',')+')';}
 const observer=new ResizeObserver(update);observer.observe(host);update();
 const api={setState(value){state=value;screen.dataset.state=value;screen.querySelector('small').textContent=value==='ringing'?'陌生来电':value==='connected'?'小黄 · 通话中':'18:40';screen.querySelector('i').textContent=value==='idle'?'':'☎';screen.querySelector('span').textContent=value==='ringing'?'点击接听':value==='connected'?'正在通话':'';screen.setAttribute('aria-label',value==='ringing'?'接听陌生来电':value==='connected'?'手机：小黄通话中':'手机待机');screen.disabled=value!=='ringing';},anchor(){const r=screen.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};},dispose(){observer.disconnect();screen.remove();}};api.setState(state);return api;
}
