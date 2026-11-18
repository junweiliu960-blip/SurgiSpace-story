import {photoRect} from './photo-layout.js';
// Inner corners of the existing illustrated monitor, clockwise. No new monitor geometry.
export const SCREEN_QUAD=[[237,333],[496,337],[505,485],[245,503]];
export const OFFICE_SCREEN_QUAD=[[65,404],[393,429],[423,662],[99,707]];
export function projectiveMatrix(width,height,quad){
 const [a,b,c,d]=quad,dx1=b[0]-c[0],dx2=d[0]-c[0],dy1=b[1]-c[1],dy2=d[1]-c[1],sx=a[0]-b[0]+c[0]-d[0],sy=a[1]-b[1]+c[1]-d[1],det=dx1*dy2-dx2*dy1;
 const g=(sx*dy2-dx2*sy)/det,h=(dx1*sy-sx*dy1)/det;
 return [(b[0]-a[0]+g*b[0])/width,(b[1]-a[1]+g*b[1])/width,0,g/width,(d[0]-a[0]+h*d[0])/height,(d[1]-a[1]+h*d[1])/height,0,h/height,0,0,1,0,a[0],a[1],0,1];
}
export function mountSceneScreen(host,{title='电子病历',body='',onOpen=()=>{},office=false}={}){
 const screen=document.createElement('button');screen.className='scene-screen';screen.setAttribute('aria-label','放大电脑屏幕：'+title);screen.innerHTML='<small></small><strong></strong><div></div><footer>点击屏幕放大阅读 ↗</footer>';host.append(screen);screen.onclick=onOpen;if(office){screen.classList.add('office-stock-screen');const chart=document.createElement('div');chart.className='office-stock-chart';chart.innerHTML='<svg viewBox="0 0 520 130" aria-label="虚构股价下跌曲线"><path d="M5 10H515M5 65H515M5 120H515" stroke="#36504e" fill="none"/><path d="M5 15 45 25 75 18 110 42 145 35 180 58 210 52 250 76 290 69 330 94 365 86 410 108 450 103 515 125" stroke="#e08777" fill="none" stroke-width="4"/></svg>';screen.insertBefore(chart,screen.querySelector('footer'));}
 function update(){const r=photoRect(host.clientWidth,host.clientHeight),quad=(office?OFFICE_SCREEN_QUAD:SCREEN_QUAD).map(([x,y])=>[r.left+x/1672*r.width,y/941*r.height]);screen.style.transform='matrix3d('+projectiveMatrix(640,400,quad).join(',')+')';}
 const observer=new ResizeObserver(update);observer.observe(host);update();
 const api={set({title:heading=title,body:text=body,notice='SURGISPACE · 电子资料'}={}){screen.querySelector('small').textContent=notice;screen.querySelector('strong').textContent=heading;screen.querySelector('div').textContent=text;screen.setAttribute('aria-label','放大电脑屏幕：'+heading);},dispose(){observer.disconnect();screen.remove();}};api.set();return api;
}
