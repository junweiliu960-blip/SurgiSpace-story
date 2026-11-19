import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import './gi-theatre.css';

export const GI_PARTS=[
 ['stomach','胃',[.35,.95,.16],'胃连接食管与十二指肠，参与食物的暂时储存与消化。'],
 ['duodenum','十二指肠',[-.20,.58,.16],'十二指肠连接胃与后续小肠。'],
 ['small','小肠',[0,-.10,.22],'小肠位于腹部中央，包括空肠和回肠；回肠末端连接盲肠。'],
 ['ascending','升结肠',[-.64,-.12,.16],'升结肠从患者右下腹的盲肠向上延伸。'],
 ['transverse','横结肠',[0,.34,.18],'横结肠横跨腹部上方，连接升结肠与降结肠。'],
 ['descending','降结肠',[.64,-.12,.16],'降结肠位于患者左侧，向下连接乙状结肠。'],
 ['cecum','盲肠',[-.62,-.69,.18],'盲肠位于患者右下腹，连接回肠与升结肠，阑尾附着于盲肠。'],
 ['appendix','阑尾',[-.50,-.93,.15],'阑尾为与盲肠相连、末端封闭的细管状结构。'],
 ['rectum','直肠',[0,-1.17,.12],'直肠位于消化道末段，与乙状结肠相连。']
];
export function openGILearning({onClose=()=>{}}={}){
 const dialog=document.createElement('dialog');dialog.className='gi-learning';dialog.setAttribute('aria-label','胃肠结构学习');
 dialog.innerHTML='<header><div><small>解剖学习</small><h2>胃肠结构学习</h2></div><button data-close aria-label="关闭胃肠结构学习">×</button></header><div class="gi-layout"><section class="gi-main"><div class="gi-view"><canvas aria-label="可旋转的完整胃肠三维模型"></canvas><div class="gi-hotspots"></div><p class="gi-loading" role="status">正在加载完整胃肠模型…</p></div><nav aria-label="胃肠部位"></nav><article aria-live="polite"><h3>完整胃肠结构</h3><p>拖动旋转，滚轮缩放。点击部位放大学习；点击盲肠或阑尾查看右侧连接关系。</p></article></section><aside class="gi-local" hidden><h3>盲肠与阑尾</h3><div class="gi-local-view"><canvas aria-label="盲肠与阑尾局部放大模型"></canvas><span>正在加载局部模型…</span></div><p class="gi-local-description"></p><button data-local-reset>查看完整连接关系</button></aside></div><footer><span>前面观：画面左侧为患者右侧</span><button data-reset>恢复全景</button><button data-close>返回手术</button></footer>';
 document.body.append(dialog);dialog.addEventListener('keydown',e=>e.stopPropagation());dialog.showModal();let disposed=false,frame,selected=null;
 const viewers=[];
 function viewer(canvas){
  const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();scene.background=new T.Color('#102c2b');scene.add(new T.HemisphereLight('#fff5ec','#34544b',2.2));const light=new T.DirectionalLight('#fff1db',2.4);light.position.set(2,3,4);scene.add(light);
  const camera=new T.PerspectiveCamera(36,1,.01,40);camera.position.set(0,0,5.3);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.minDistance=.35;controls.maxDistance=9;
  const resize=new ResizeObserver(()=>{const w=canvas.clientWidth||1,h=canvas.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(canvas);
  const root=new T.Group();scene.add(root);const api={renderer,scene,camera,controls,root,resize,loaded:false};viewers.push(api);return api;
 }
 let main,local;
 try{main=viewer(dialog.querySelector('.gi-main canvas'));local=viewer(dialog.querySelector('.gi-local canvas'));}catch{dialog.querySelector('.gi-loading').textContent='三维视图暂不可用，请关闭后重试。';}
 const loader=new GLTFLoader(),url=file=>new URL(import.meta.env.BASE_URL+file,document.baseURI).href;
 function release(root){root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
 function load(file,v,height,done){if(!v)return;loader.load(url(file),g=>{if(disposed){release(g.scene);return;}const box=new T.Box3().setFromObject(g.scene),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3());g.scene.position.sub(centre);const wrap=new T.Group();wrap.scale.setScalar(height/size.y);wrap.add(g.scene);v.root.add(wrap);v.loaded=true;done?.();},undefined,()=>{const text=v===main?dialog.querySelector('.gi-loading'):dialog.querySelector('.gi-local-view span');text.textContent='模型暂未载入，请关闭后重试。';});}
 load('models/lux3d-gi-theatre/gi.glb',main,2.6,()=>dialog.querySelector('.gi-loading').hidden=true);
 load('models/lux3d-appendix/02-complete.glb',local,1.55,()=>{dialog.querySelector('.gi-local-view span').hidden=true;local.root.updateWorldMatrix(true,true);local.anchors={};for(const key of ['cecum','appendix']){const box=new T.Box3();local.root.traverse(o=>{if(o.isMesh&&o.name.toLowerCase().startsWith(key))box.expandByObject(o);});if(!box.isEmpty())local.anchors[key]=box.getCenter(new T.Vector3());}});
 const localLabels=document.createElement('div');localLabels.className='gi-hotspots gi-local-hotspots';dialog.querySelector('.gi-local-view').append(localLabels);for(const [id,title]of [['cecum','盲肠'],['appendix','阑尾']]){const b=document.createElement('button');b.textContent=title;b.dataset.local=id;b.onclick=()=>{const point=local?.anchors?.[id];if(point){local.controls.target.copy(point);local.camera.position.copy(point).add(new T.Vector3(.05,.02,2.0));}};localLabels.append(b);}
 const hotspots=dialog.querySelector('.gi-hotspots'),nav=dialog.querySelector('nav'),buttons=[];
 function select(id){const part=GI_PARTS.find(p=>p[0]===id);if(!part)return;selected=id;dialog.querySelector('.gi-main article h3').textContent=part[1];dialog.querySelector('.gi-main article p').textContent=part[3];buttons.forEach(b=>b.classList.toggle('active',b.dataset.part===id));
  if(['cecum','appendix'].includes(id)){dialog.classList.add('with-local');dialog.querySelector('.gi-local').hidden=false;dialog.querySelector('.gi-local-description').textContent=part[3]+' 可拖动局部模型观察两者连接。';if(local){local.controls.target.set(0,0,0);local.camera.position.set(.12,.05,3.1);}}
  else if(main){main.controls.target.fromArray(part[2]);main.camera.position.copy(main.controls.target).add(new T.Vector3(0,0,2.2));}
 }
 for(const [id,label,point]of GI_PARTS){for(const host of [hotspots,nav]){const b=document.createElement('button');b.dataset.part=id;b.textContent=label;b.onclick=()=>select(id);host.append(b);buttons.push(b);}}
 if(main){const ray=new T.Raycaster();let down=null;main.renderer.domElement.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];});main.renderer.domElement.addEventListener('click',e=>{if(!main.loaded||down&&Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const r=e.currentTarget.getBoundingClientRect();ray.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),main.camera);const hit=ray.intersectObject(main.root,true)[0];if(!hit)return;const point=main.root.worldToLocal(hit.point);const part=GI_PARTS.map(p=>({p,d:new T.Vector3(...p[2]).distanceTo(point)})).sort((a,b)=>a.d-b.d)[0];if(part.d<.65)select(part.p[0]);});}
 function reset(){selected=null;dialog.classList.remove('with-local');dialog.querySelector('.gi-local').hidden=true;if(main){main.controls.target.set(0,0,0);main.camera.position.set(0,0,5.3);}buttons.forEach(b=>b.classList.remove('active'));dialog.querySelector('.gi-main article h3').textContent='完整胃肠结构';dialog.querySelector('.gi-main article p').textContent='点击部位放大学习；点击盲肠或阑尾，查看局部连接关系。';}
 dialog.querySelector('[data-reset]').onclick=reset;dialog.querySelector('[data-local-reset]').onclick=()=>{if(local){local.controls.target.set(0,0,0);local.camera.position.set(0,0,3.7);}};
 function tick(){if(disposed)return;for(const v of viewers){v.controls.update();if(v!==local||!dialog.querySelector('.gi-local').hidden)v.renderer.render(v.scene,v.camera);}if(main)for(const [id,label,xyz]of GI_PARTS){const p=new T.Vector3(...xyz).project(main.camera),b=hotspots.querySelector(`[data-part="${id}"]`);b.style.left=(p.x+1)*50+'%';b.style.top=(1-p.y)*50+'%';b.hidden=!main.loaded||p.z>1;}if(local?.anchors)for(const [id,point]of Object.entries(local.anchors)){const p=point.clone().project(local.camera),b=localLabels.querySelector('[data-local="'+id+'"]');b.style.left=(p.x+1)*50+'%';b.style.top=(1-p.y)*50+'%';}frame=requestAnimationFrame(tick);}tick();
 function cleanup(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);for(const v of viewers){v.resize.disconnect();v.controls.dispose();release(v.scene);v.renderer.dispose();}dialog.remove();onClose();}
 dialog.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>dialog.close());dialog.addEventListener('close',cleanup);
 return ()=>{dialog.close();cleanup();};
}
