import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const views={
 '01':{title:'01 · 组织遮挡下的术野',description:'肾周脂肪和筋膜覆盖部分肾脏。点击肾脏区域，进入完整结构学习视图。',next:'02'},
 '02':{title:'02 · 完整肾脏结构',description:'点击圆形标记选择结构，进入肾门近景或内部剖面。隐藏覆盖组织是观察功能，不代表已完成手术。'},
 '03':{title:'03 · 肾门结构近景',description:'观察肾动脉、短肾静脉及肾盂与输尿管的关系。拖动旋转，滚轮或双指缩放。'},
 artery:{title:'肾动脉 · 分支学习近景',description:'复用Lux3D动脉分支模型。其在本关中的连接位置，以主线BodyParts3D配准点为准。'},
 vein:{title:'肾静脉 · 分支学习近景',description:'复用Lux3D静脉分支模型。主线右肾静脉接入下腔静脉，近景用于观察血管结构。'},
 ureter:{title:'肾盂与输尿管 · 放大观察',description:'从既有Lux3D剖面观察尿液汇集与引流结构；位置以主线配准点为准。'},
 adrenal:{title:'肾上腺 · 独立近景',description:'复用完整Lux3D肾脏模型中分离的肾上腺。它是独立器官，本关保留。'},
 '04':{title:'04 · 肾脏内部学习剖面',description:'剖面仅用于学习内部构造，不要求在手术中切开肾脏。'}
};
const structures={
 artery:{name:'肾动脉',text:'向肾脏输送血液。右肾动脉通常从下腔静脉后方经过；模型中的颜色用于辅助辨认。',view:'artery',at:[.22,.095,.03]},
 vein:{name:'肾静脉',text:'将肾脏的血液引流至下腔静脉。右肾静脉较短，需注意与大静脉的连接关系。',view:'vein',at:[.22,.06,.1]},
 ureter:{name:'肾盂与输尿管',text:'肾盂汇集尿液，输尿管将其输送至膀胱。它们属于尿液引流系统，并非血管。',view:'ureter',at:[.17,-.29,.04]},
 adrenal:{name:'肾上腺',text:'位于肾脏上方附近的独立内分泌器官。邻近肾脏不等于属于本例切除目标。',view:'adrenal',at:[.07,.43,.04]},
 tumor:{name:'中下部病变',text:'本关设定为右肾中下部约8厘米肿块、靠近肾门。生成模型用于示意，外形与比例不能代替检查报告。',view:'04',at:[-.12,-.095,.16]},
 cortex:{name:'肾皮质与髓质',text:'皮质位于外层，髓质位于内层、形成肾锥体。尿液经乳头、肾盏汇入肾盂。',view:'04',at:[-.16,.19,.1]}
};

export async function mountKidneyExplorer(host,{signal,onClose,initialStructure}={}){
 host.innerHTML='<div class="eyebrow">LUX3D / STRUCTURE EXPLORER</div><h2 id="kidney-view-title"></h2><p id="kidney-view-description"></p><div class="kidney-navigation"><button data-kidney-view="01">01 组织遮挡</button><button data-kidney-view="02">02 完整结构</button><button data-kidney-view="03">03 肾门近景</button><button data-kidney-view="04">04 内部剖面</button></div><div class="kidney-canvas-wrap"><canvas aria-label="可旋转的肾脏三维模型"></canvas><div class="kidney-hotspots"></div><p id="kidney-load" role="status">正在加载三维模型…</p></div><div class="kidney-structure-buttons"></div><article id="kidney-structure-info" aria-live="polite"></article><button id="kidney-return" class="secondary">返回手术任务</button><small>解剖学习示意 · 不改变答题或手术进度</small>';
 const q=s=>host.querySelector(s);q('#kidney-return').onclick=onClose;let renderer;
 try{renderer=new T.WebGLRenderer({canvas:q('canvas'),antialias:innerWidth>800});}catch{q('#kidney-load').textContent='此浏览器无法启用三维显示。请开启硬件加速或使用支持 WebGL 的浏览器；关闭此窗口仍可继续游戏。';return ()=>{};}
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<800?1:1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene();scene.background=new T.Color('#202b2d');scene.add(new T.HemisphereLight(0xffffff,0x736051,2.5));const light=new T.DirectionalLight(0xffefdb,3);light.position.set(2,3,4);scene.add(light);
 const camera=new T.PerspectiveCamera(38,1,.01,100);camera.position.set(0,0,2.1);const controls=new OrbitControls(camera,q('canvas'));controls.enableDamping=true;controls.minDistance=.45;controls.maxDistance=5;
 const loader=new GLTFLoader(),cache=new Map(),allocated=new Set();let current=null,view='01',epoch=0,disposed=false,raf;
 const manifest=await fetch(`${import.meta.env.BASE_URL}models/lux3d-kidney/manifest.json`,{signal}).then(r=>{if(!r.ok)throw Error('模型目录加载失败');return r.json();}).catch(()=>null);
 const hotspots=Object.entries(structures).map(([id,s])=>{const b=document.createElement('button');b.className='kidney-hotspot';b.textContent='●';b.setAttribute('aria-label',s.name);b.title=s.name;b.onclick=()=>select(id);q('.kidney-hotspots').append(b);return {id,s,b};});
 function select(id){const s=structures[id];q('#kidney-structure-info').innerHTML=`<h3>${s.name}</h3><p>${s.text}</p>`;if(view!==s.view)show(s.view);}
 q('.kidney-structure-buttons').innerHTML=Object.entries(structures).map(([id,s])=>`<button data-structure="${id}">${s.name}</button>`).join('');
 host.querySelectorAll('[data-structure]').forEach(b=>b.onclick=()=>select(b.dataset.structure));host.querySelectorAll('[data-kidney-view]').forEach(b=>b.onclick=()=>show(b.dataset.kidneyView));
 async function show(id){view=id;const ticket=++epoch;const v=views[id];q('#kidney-view-title').textContent=v.title;q('#kidney-view-description').textContent=v.description;q('#kidney-load').hidden=false;q('#kidney-load').textContent='正在加载三维模型…';host.querySelectorAll('[data-kidney-view]').forEach(b=>b.classList.toggle('active',b.dataset.kidneyView===id));if(current){scene.remove(current);current=null;}hotspots.forEach(x=>x.b.hidden=true);
  try{if(!manifest?.views[id])throw Error('该模型暂不可用，请稍后重试');const asset=manifest.views[id];let model=cache.get(asset.file);if(!model){const r=await fetch(`${import.meta.env.BASE_URL}models/lux3d-kidney/${manifest.views[id].file}`,{signal});if(!r.ok)throw Error('模型下载失败');const data=await r.arrayBuffer();if(disposed)return;model=(await loader.parseAsync(data,'')).scene;const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());model.position.sub(center);const group=new T.Group();group.add(model);group.scale.setScalar(1/Math.max(size.x,size.y,size.z));model=group;allocated.add(model);if(disposed){destroy(model);return;}cache.set(asset.file,model);}if(disposed||ticket!==epoch)return;current=model;scene.add(model);controls.target.fromArray(asset.camera?.target||[0,0,0]);camera.position.fromArray(asset.camera?.position||[0,0,1.85]);controls.update();q('#kidney-load').hidden=true;}
  catch(e){if(!disposed&&ticket===epoch)q('#kidney-load').textContent=e.name==='AbortError'?'加载已取消':e.message;}
 }
 // A deliberate click enters the exposed view; dragging keeps camera control.
 let down,multiTouch=false;const activePointers=new Set();const canvas=q('canvas');canvas.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size===1){down=[e.clientX,e.clientY];multiTouch=false;}else multiTouch=true;});canvas.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);down=null;});canvas.addEventListener('pointerup',e=>{activePointers.delete(e.pointerId);if(multiTouch)return;if(view!=='01'||!current||!down||Math.hypot(e.clientX-down[0],e.clientY-down[1])>6)return;const rect=canvas.getBoundingClientRect(),ray=new T.Raycaster();ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),camera);if(ray.intersectObject(current,true).length)show('02');});
 const resize=new ResizeObserver(()=>{const r=q('.kidney-canvas-wrap').getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();});resize.observe(q('.kidney-canvas-wrap'));
 function frame(){if(disposed)return;controls.update();for(const {id,s,b} of hotspots){b.hidden=!current||!['02','03','04'].includes(view)||view==='03'&&!['artery','vein','ureter'].includes(s.view)||view==='04'&&s.view!=='04';if(!b.hidden){const at=manifest?.views[view]?.hotspots?.[id]||s.at;const p=new T.Vector3(...at).project(camera);b.style.left=(p.x+1)*50+'%';b.style.top=(1-p.y)*50+'%';b.hidden=p.z>1;}}renderer.render(scene,camera);raf=requestAnimationFrame(frame);}frame();if(initialStructure&&structures[initialStructure])select(initialStructure);else show('01');
 function destroy(m){m.traverse(o=>{o.geometry?.dispose();for(const mat of Array.isArray(o.material)?o.material:[o.material])if(mat){for(const v of Object.values(mat))if(v?.isTexture)v.dispose();mat.dispose();}});}
 return ()=>{disposed=true;epoch++;cancelAnimationFrame(raf);resize.disconnect();controls.dispose();for(const m of allocated)destroy(m);renderer.dispose();};
}
