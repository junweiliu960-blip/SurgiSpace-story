import {openGILearning} from './gi-learning.js';
import {bindPhotoHotspot} from './photo-layout.js';
import {attachLuxHuang} from './lux3d-huang.js';
import {fitPatientToBed,addBedContactShadow} from './bed-registration.js';
import {createCartoonPatient} from './cartoon-patient.js';
import {appendixScene} from './appendix-sequence.js';
import {createAppendixSceneAssets} from './appendix-scene-assets.js';
import {createAppendixInteraction} from './appendix-interaction.js';
import {createAppendixEffects} from './appendix-effects.js';
import {createAppendixAnatomy} from './appendix-anatomy.js';
import {placePhotoObject,seatClinicPatient} from './photo-layout.js';
// Existing character assets and versioned Lux3D appendix assets; no runtime generation calls.
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export function createCampaignStage(canvas,{mode='office',patient='lin',onPick=()=>{},reducedMotion=false,onFallback=()=>{}}={}){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:innerWidth>800,alpha:true});}catch{return fallback(canvas,{onPick,onFallback,reducedMotion,mode});}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;
 const scene=new T.Scene();const photographic=['office','clinic','or','appendix'].includes(mode);scene.background=photographic?null:new T.Color('#173f3c');renderer.setClearColor('#173f3c',photographic?0:1);scene.fog=new T.Fog('#173f3c',8,18);
 const camera=new T.PerspectiveCamera(38,1,.01,40);camera.position.set(3,2.3,4.2);const target=new T.Vector3(0,1,0);
 const controls=new OrbitControls(camera,canvas);controls.target.copy(target);controls.enableDamping=true;controls.minDistance=.35;controls.maxDistance=8;controls.enabled=mode==='appendix';
 scene.add(new T.HemisphereLight('#faf3df','#344e49',2.1));const light=new T.DirectionalLight('#fff4dc',3);light.position.set(2,5,4);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-5;light.shadow.camera.right=5;light.shadow.camera.top=5;light.shadow.camera.bottom=-5;light.shadow.bias=-.001;renderer.shadowMap.enabled=innerWidth>800;renderer.shadowMap.type=T.PCFSoftShadowMap;scene.add(light);
 const objects=[];let disposed=false,paused=false,action='idle',clock=0,actionTime=0,detail=false,step=0,operation=0;
 const group=new T.Group();scene.add(group);
 const mat=c=>new T.MeshStandardMaterial({color:c,roughness:.68});
 function mesh(g,c,pos,parent=group){const m=new T.Mesh(g,mat(c));m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);objects.push(m);return m;}
 const box=(s,c,p,parent)=>mesh(new T.BoxGeometry(...s),c,p,parent);
 const sphere=(s,c,p,parent)=>{const m=mesh(new T.SphereGeometry(1,24,16),c,p,parent);m.scale.set(...s);return m;};
 function tube(points,r,color,parent=group){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),50,r,10,false),color,[0,0,0],parent);}
 function label(text,pos,parent=group){const c=document.createElement('canvas');c.width=512;c.height=90;const x=c.getContext('2d');x.fillStyle='#123835';x.fillRect(0,0,512,90);x.fillStyle='#f7e8c1';x.font='30px Microsoft YaHei';x.textAlign='center';x.fillText(text,256,56);const m=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false}));m.position.set(...pos);m.scale.set(1.1,.19,1);parent.add(m);return m;}
 if(!photographic){box([12,.08,12],'#a7ada0',[0,-.05,0]);box([12,3,.1],'#d0d7c5',[0,1.5,-2.2]);
 for(let x=-5;x<6;x+=1.2)box([.025,2.7,.03],'#b69e67',[x,1.4,-2.12]);
 box([10,.035,.05],'#d0b777',[0,2.7,-2]);box([2.5,.05,1.4],'#f4eedf',[0,3,0]);
 // Geometry is used only for scenes with no room photograph.
 for(const x of [-2.8,-1.65]){box([.9,1.0,.45],'#446a5f',[x,.5,-1.8]);box([.96,.05,.49],'#e4dec8',[x,1.03,-1.8]);for(const y of [.28,.58,.88])box([.2,.025,.025],'#c4a96c',[x,y,-1.56]);}
 const windowFrame=box([1.3,1.2,.06],'#456f66',[-2.9,1.9,-2.05]);box([1.12,1.02,.03],'#98bab2',[-2.9,1.9,-2.0]);box([1.17,.035,.05],'#c1aa73',[-2.9,1.9,-1.97]);
 const ceilingRing=mesh(new T.TorusGeometry(.7,.025,8,64),'#d9ca95',[0,2.85,0]);ceilingRing.rotation.x=Math.PI/2;
 label('SURGISPACE  园区医疗站',[.2,2.3,-2.02]).scale.set(1.8,.30,1);
 }
 const door=new T.Group();door.position.set(1.8,1,-2);group.add(door);if(!photographic){box([.95,2,.07],'#41615b',[-.46,0,0],door);box([.06,.18,.1],'#d3b97a',[-.85,0,.06],door);}
 const desk=new T.Group();group.add(desk);
 const paper=box([.32,.008,.23],'#f2e9cb',[.25,.83,.1],desk);paper.name='paper';
 const phone=box([.09,.018,.18],'#243735',[.65,.84,.12],desk);const tablet=box([.30,.02,.40],'#203b3b',[.1,.85,-.05],desk);
 const contactCanvas=document.createElement('canvas');contactCanvas.width=384;contactCanvas.height=512;const contact=contactCanvas.getContext('2d');contact.fillStyle='#e6e8d5';contact.fillRect(0,0,384,512);contact.fillStyle='#244e43';contact.font='25px Microsoft YaHei';contact.fillText('家属联系卡',28,40);for(const x of [120,260]){contact.beginPath();contact.arc(x,125,35,0,7);contact.fill();contact.fillRect(x-45,160,90,90);}contact.font='20px Microsoft YaHei';contact.fillText('虚构合影与人物资料',28,310);contact.fillText('联系人 家人',28,365);contact.fillText('电话 13*********',28,410);contact.fillText('地址 已掌握',28,455);const tabletDisplay=mesh(new T.PlaneGeometry(.27,.36),'#ffffff',[0,.012,0],tablet);tabletDisplay.rotation.x=-Math.PI/2;tabletDisplay.material=new T.MeshBasicMaterial({map:new T.CanvasTexture(contactCanvas)});tabletDisplay.visible=false;
 const bag=box([.30,.28,.12],'#624e3b',[-.9,.2,.1]);
 function actor(name,color,x,z,hair='#38362e'){
  const g=new T.Group();g.position.set(x,0,z);group.add(g);g.name=name;
  sphere([.22,.37,.14],color,[0,1.05,0],g);const head=new T.Group();head.position.y=1.58;g.add(head);sphere([.14,.19,.14],'#c49e83',[0,0,0],head);sphere([.145,.065,.145],hair,[0,.14,0],head);const eyes=[sphere([.016,.018,.01],'#243b35',[-.05,.025,.13],head),sphere([.016,.018,.01],'#243b35',[.05,.025,.13],head)];
  sphere([.025,.035,.03],'#b38d73',[0,-.025,.135],head);for(const side of [-1,1])sphere([.026,.048,.02],'#c49e83',[side*.14,-.01,0],head);tube([[-.04,-.085,.115],[0,-.095,.13],[.04,-.085,.115]],.006,'#6c4e3b',head);
  const arms=[],legs=[];for(const s of [-1,1]){const a=new T.Group();a.position.set(s*.25,1.25,0);g.add(a);sphere([.065,.23,.065],color,[0,-.18,0],a);sphere([.065,.12,.065],'#c49e83',[0,-.46,0],a);arms.push(a);const leg=new T.Group();leg.position.set(s*.1,.72,0);g.add(leg);box([.14,.31,.17],'#273e3c',[0,-.15,0],leg);const shin=new T.Group();shin.position.y=-.31;leg.add(shin);box([.13,.30,.16],'#273e3c',[0,-.15,0],shin);box([.15,.08,.28],'#27332f',[0,-.31,.045],shin);legs.push({leg,shin});}return {g,head,arms,legs,eyes};
 }
 const doctor=actor('陈医生','#d9dfce',-.95,.9),zhou=actor('周先生','#536d6a',.8,-.6),huang=actor('小黄','#35443c',1.3,-1.2),police=actor('接应警员','#2a4253',-1.4,-1.2);
 huang.arms[0].add(tablet);tablet.position.set(0,-.43,.08);
 const huangLux=['clinic','airport'].includes(mode)?attachLuxHuang(huang.g,{exclude:[tablet],isDisposed:()=>disposed}):null;
 const hands=new T.Group();camera.add(hands);scene.add(camera);hands.position.set(-.28,-.30,-.75);const cuff=box([.12,.27,.11],'#dce2cf',[0,-.10,0],hands);sphere([.065,.11,.045],'#c49e83',[0,.10,0],hands);const heldPhone=box([.075,.16,.014],'#243735',[.025,.16,-.025],hands);for(let k=0;k<4;k++)sphere([.011,.03,.012],'#c49e83',[.06,.10+k*.02,-.01],hands);
 const chair=new T.Group(),chairBack=new T.Group();group.add(chair,chairBack);
 const car=new T.Group();group.add(car);box([2.3,.8,1.1],'#304f4b',[0,.55,-.9],car);for(const x of [-.8,.8])for(const z of [-1.45,-.35]){const w=mesh(new T.CylinderGeometry(.24,.24,.10,20),'#24332e',[x,.25,z],car);w.rotation.x=Math.PI/2;}const carDoor=box([.9,.65,.06],'#506f66',[.6,.9,-.28],car);const windshield=box([1.7,.65,.035],'#8bb4b0',[0,1.2,-1.4],car);windshield.material.transparent=true;windshield.material.opacity=.32;
 const roadside=new T.Group();group.add(roadside);for(let i=0;i<8;i++){box([.07,2,.07],'#4d6f63',[2.5,1,-i*1.3],roadside);sphere([.5,.6,.5],'#657f60',[2.5,2,-i*1.3],roadside);}roadside.visible=mode==='car';
 const wheelchair=new T.Group();group.add(wheelchair);box([.48,.07,.5],'#59756e',[0,.5,0],wheelchair);for(const x of [-.3,.3]){const w=mesh(new T.TorusGeometry(.32,.025,8,24),'#b8b2a0',[x,.34,0],wheelchair);w.rotation.y=Math.PI/2;}wheelchair.position.set(.8,0,-.6);
 const bed=new T.Group();group.add(bed);
 const body=new T.Group();bed.add(body);addBedContactShadow(bed);sphere([.14,.14,.15],'#c59a7e',[0,.98,-.76],body);sphere([.28,.14,.66],'#c59a7e',[0,.98,-.08],body);sphere([.29,.145,.66],'#3e8077',[0,.985,-.08],body);
 // Existing registered Lux skin supplies the reusable head and body; the local schematic is a load/error fallback.
 let sourceBody,lin;const loader=new GLTFLoader();
 function load(path,done){loader.load(import.meta.env.BASE_URL+'models/'+path,g=>{if(disposed){release(g.scene);return;}done(g.scene);},undefined,()=>{});}
 if(mode==='or'){
  load('lux3d-patient/'+(patient==='zhou'?'zhou-supine.glb':'skin-base-lux.glb'),m=>{sourceBody=m;m.traverse(o=>{if(o.isMesh)o.castShadow=true;});bed.add(m);body.visible=false;
   if(patient==='zhou'){
    const ports=new T.Group();ports.name='laparoscopic_ports_teaching';bed.add(ports);m.updateWorldMatrix(true,true);const ray=new T.Raycaster();
    for(const [x,z] of [[0,-.25],[.12,-.12],[-.10,-.10]]){ray.set(new T.Vector3(x,2,z),new T.Vector3(0,-1,0));const hit=ray.intersectObject(m,true)[0];if(hit){const port=new T.Mesh(new T.RingGeometry(.004,.007,20),new T.MeshBasicMaterial({color:'#b47f70',side:T.DoubleSide}));port.rotation.x=-Math.PI/2;port.position.copy(hit.point).add(new T.Vector3(0,.001,0));ports.add(port);}}
   }
  });
  if(patient==='zhou')load('lux3d-patient/zhou-drape.glb',m=>{m.traverse(o=>{if(!o.isMesh)return;for(const material of Array.isArray(o.material)?o.material:[o.material]){material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vAppendixDrape;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAppendixDrape=position;');shader.fragmentShader='varying vec3 vAppendixDrape;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vAppendixDrape.y<0.99 || (abs(vAppendixDrape.x)<0.23 && vAppendixDrape.z>-0.42 && vAppendixDrape.z< -0.04))discard;');};}});bed.add(m);});
 }
 if(mode==='appendix')load('lux3d-gi-theatre/bed.glb?v=3',m=>{sourceBody=m;bed.add(m);body.visible=false;});
 if(mode==='clinic'){lin=createCartoonPatient({young:patient==='zhou'});lin.userData.baseY=0;group.add(lin);zhou.g.visible=false;}
 const organs=new T.Group();scene.add(organs);organs.position.set(0,1.05,0);organs.visible=false;
 const schematic=new T.Group();organs.add(schematic);
 // Teaching geometry with explicit provenance: cecum joins colon/ileum, a blind-ended appendix attaches at its base.
 const cecum=sphere([.30,.36,.19],'#c9987c',[-.2,0,0],schematic);cecum.name='盲肠';
 const colon=tube([[-.25,.1,0],[-.3,.5,0],[-.15,.85,0]],.14,'#c1947f',schematic);colon.name='结肠方向';
 const ileum=tube([[.05,.2,0],[.40,.3,0],[.65,.12,0],[.8,.35,0],[1,.2,0]],.10,'#d6b29a',schematic);ileum.name='邻近小肠';
 const appendix=tube([[-.12,-.20,.08],[.13,-.32,.10],[.30,-.58,.15],[.55,-.67,.17]],.072,'#b75f53',schematic);const appendixTip=sphere([.072,.072,.072],'#b75f53',[.55,-.67,.17],schematic);appendix.name='阑尾';
 const membrane=mesh(new T.PlaneGeometry(.6,.35),'#cfb08b',[.2,-.38,.04],schematic);membrane.rotation.z=-.5;membrane.material.side=T.DoubleSide;membrane.material.transparent=true;membrane.material.opacity=.8;
 const artery=tube([[-.05,-.1,.08],[.12,-.35,.12],[.38,-.55,.18]],.018,'#b54342',schematic);artery.name='阑尾附着组织内供血连接';
 const cover=sphere([.42,.25,.12],'#c79575',[.22,-.35,.29],schematic);const bleeding=sphere([.12,.025,.12],'#923c39',[.11,-.28,.3],schematic);
 const specimenBag=sphere([.24,.35,.12],'#c1d8c8',[.8,-.25,.3],schematic);specimenBag.material.transparent=true;specimenBag.material.opacity=.5;
 const labels=[label('A 盲肠',[-.55,.2,.3],schematic),label('B 阑尾',[.45,-.9,.3],schematic),label('C 邻近小肠',[.88,.55,.3],schematic)];labels.forEach(l=>l.scale.multiplyScalar(.55));
 const luxLabels=[];let detailOpened=0,study=false;const questionEffects=mode==='appendix'?createAppendixEffects(organs,canvas.parentElement):null;
 const luxAnatomy=mode==='appendix'?createAppendixAnatomy(organs,{onStatus:text=>{const note=canvas.parentElement.querySelector('.stage-note');if(note)note.textContent=text;},onReady:()=>{schematic.visible=false;organs.updateWorldMatrix(true,true);const points=luxAnatomy.anchors();for(const [key,text] of [['cecum','A 盲肠'],['appendix','B 阑尾'],['ileum','C 邻近小肠']])if(points[key]){const point=organs.worldToLocal(points[key].clone());point.z+=.12;point.y+=key==='appendix'?-.18:.20;const l=label(text,point.toArray(),organs);l.scale.multiplyScalar(.55);l.userData.part=key;luxLabels.push(l);}}}):null;
 const sceneAssets=mode==='appendix'?createAppendixSceneAssets(organs):null;
 const scopeOverlay=document.createElement('div');scopeOverlay.className='appendix-scope-overlay';scopeOverlay.hidden=true;scopeOverlay.innerHTML='<small></small><div class="scope-loading" role="status">正在准备腹腔镜术野…</div>';canvas.parentElement.append(scopeOverlay);
 const layoutScope=()=>{const r=canvas.getBoundingClientRect(),h=canvas.parentElement.getBoundingClientRect();Object.assign(scopeOverlay.style,{left:(r.left-h.left)+'px',top:(r.top-h.top)+'px',width:r.width+'px',height:r.height+'px'});};const scopeObserver=new ResizeObserver(layoutScope);scopeObserver.observe(canvas);layoutScope();
 const interaction=mode==='appendix'?createAppendixInteraction(canvas.parentElement,{getStep:()=>step,getProgress:()=>operation,setProgress:value=>{operation=value;},isPaused:()=>paused,isDisposed:()=>disposed,openScope:()=>enterDetail(false),showBody:()=>leaveDetail()}):null;
 function enterDetail(learning=false){detail=true;study=learning;detailOpened=clock;canvas.parentElement.classList.add('photo-detail');camera.clearViewOffset();camera.zoom=1;camera.up.set(0,1,0);camera.updateProjectionMatrix();scene.background=new T.Color(study?'#173f3c':'#160c0b');organs.visible=true;group.visible=false;controls.enabled=!paused;controls.enableRotate=study;const aspect=(canvas.clientWidth||400)/(canvas.clientHeight||400);
  if(study){const distance=Math.max(2.3,2.35/aspect)/(2*Math.tan(19*Math.PI/180));camera.position.set(.45,1.25,distance);controls.target.set(.2,1.0,0);}
  else{luxAnatomy?.setView('complete');const info=appendixScene(step);camera.position.fromArray(info.camera||[.3,1.15,2.6]);camera.position.z*=Math.max(1,1.55/aspect);controls.target.fromArray(info.target||[.12,.92,0]);}
  controls.update();layoutScope();
 }
 function leaveDetail(){detail=false;study=false;canvas.parentElement.classList.remove('photo-detail');scene.background=photographic?null:new T.Color('#173f3c');organs.visible=false;group.visible=true;bed.visible=true;controls.enabled=false;camera.position.set(1.8,2.6,2.4);target.set(0,.9,-.2);}
 const ray=new T.Raycaster(),pointer=new T.Vector2();function pick(e){if(!detail||paused)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);if(luxAnatomy?.loaded){const name=luxAnatomy.pick(ray);if(name)onPick(name);return;}const hit=ray.intersectObjects([cecum,appendix,ileum,artery],true)[0];if(hit)onPick(hit.object.name);}
 canvas.addEventListener('pointerup',pick);
 function setup(){
  desk.visible=['office','clinic'].includes(mode);doctor.g.visible=false;huang.g.visible=mode==='clinic'||mode==='airport';police.g.visible=mode==='rescue';zhou.g.visible=['clinic','airport','car','rescue'].includes(mode);chair.visible=mode==='clinic';bed.visible=['or','appendix'].includes(mode);car.visible=['car','airport','rescue'].includes(mode);wheelchair.visible=mode==='rescue';
  if(mode==='airport'){desk.visible=false;label('园区 到达 ARRIVALS',[0,2.4,-1.8]);zhou.g.position.set(.65,0,-1);}
  if(mode==='car'){camera.position.set(.2,1.5,1.1);target.set(.5,1.2,-.7);}
  if(mode==='appendix')camera.position.set(1.8,2.6,2.4);if(mode==='office'){camera.position.set(.5,1.75,2.2);target.set(.1,1.0,-.2);}
  if(mode==='clinic'&&patient==='zhou')huang.g.visible=false;
 }
 let closeLearning=null,thumbnail=null,thumbContext=null,screenButton=null,screenStop=null,lastThumbnail=-1;
 if(mode==='appendix'){
  screenButton=document.createElement('button');screenButton.className='theatre-screen';screenButton.setAttribute('aria-label','点击大屏幕放大腹腔镜视图');screenButton.innerHTML='<canvas aria-hidden="true"></canvas><span>点击屏幕放大 ↗</span>';canvas.parentElement.append(screenButton);thumbnail=screenButton.querySelector('canvas');thumbnail.width=280;thumbnail.height=190;thumbContext=thumbnail.getContext('2d');screenStop=bindPhotoHotspot(screenButton,canvas.parentElement,'monitor');screenButton.onclick=()=>enterDetail(false);
  const learn=document.createElement('button');learn.className='theatre-learn';learn.textContent='胃肠结构学习 ›';canvas.parentElement.append(learn);learn.onclick=()=>{if(closeLearning)return;const previousPause=paused;paused=true;closeLearning=openGILearning({onClose:()=>{closeLearning=null;paused=previousPause;}});};
  const heading=document.createElement('div');heading.className='scope-title';heading.innerHTML='<strong>腹腔镜视图</strong><button aria-label="关闭腹腔镜视图">返回手术室 ×</button>';canvas.parentElement.append(heading);heading.querySelector('button').onclick=leaveDetail;
 }
 setup();let raf,previous=performance.now();function tick(now){if(disposed)return;const dt=Math.min((now-previous)/1000,.05);previous=now;if(!paused&&!document.hidden){clock+=dt;actionTime+=dt;const p=Math.min(1,actionTime/2),e=p*p*(3-2*p),motion=reducedMotion?.25:1;
  for(const [j,a] of [doctor,zhou,huang,police].entries()){a.head.rotation.y=Math.sin(clock*.8)*.07*motion;a.head.rotation.z=Math.sin(clock*.5)*.015*motion;a.arms[0].rotation.z=Math.sin(clock)*.025*motion;a.arms[1].rotation.z=-Math.sin(clock)*.025*motion;const blink=(clock+j*.3)%4<.13;for(const eye of a.eyes)eye.scale.y=blink?.002:.018;}
  doctor.arms[1].rotation.x=['phone','folder','bills'].includes(action)?-e*1.7:0;huang.arms[0].rotation.x=['tablet','check','badge'].includes(action)?-e*1.1:action==='wave'?-1.9+Math.sin(clock*3)*.18:0;
  zhou.arms[0].rotation.x=action==='pain'?-1.2:action==='note'?-e*1.2:0;zhou.g.rotation.z=action==='pain'?.12:0;
  hands.visible=['phone','bills','folder','tremble','note','departure'].includes(action);heldPhone.visible=action==='phone';hands.position.y=-.40+e*.10+(action==='tremble'?Math.sin(clock*24)*.003:0);phone.visible=!photographic&&action!=='phone';phone.rotation.z=action==='bills'?Math.sin(clock*30)*.03:0;
  paper.visible=['note','check','folder'].includes(action);door.visible=!photographic||action==='door';chair.visible=!photographic&&mode==='clinic';chairBack.visible=!photographic&&mode==='clinic';
  paper.position.x=.25+(action==='note'||action==='check'?e*.35:action==='bills'?-e*.2:0);tablet.rotation.z=.15;tablet.rotation.x=1.8;tablet.visible=['tablet','check','tremble'].includes(action);tabletDisplay.visible=tablet.visible;
  door.rotation.y=action==='door'?e*-.8:0;carDoor.rotation.y=action==='car'?Math.sin(p*Math.PI)*1.2:0;bag.position.y=.2+(action==='departure'?e*.55:0);
  const seated=mode==='clinic'||mode==='rescue';zhou.g.position.y=seated?-.20:0;for(const {leg,shin} of zhou.legs){leg.rotation.x=seated?-Math.PI/2:0;shin.rotation.x=seated?Math.PI/2:0;}
  if(action==='wheelchair'){wheelchair.position.z=-.6+e*.6;zhou.g.position.z=wheelchair.position.z;zhou.arms[0].rotation.x=-.7;}
  if(mode==='car')roadside.position.z=(clock*1.8)%10;
  if(action==='relief')doctor.arms.forEach(a=>a.rotation.x=0);
  if(lin){lin.rotation.y=-.50+Math.sin(clock*.4)*.012;lin.position.y=lin.userData.baseY+Math.sin(clock*1.2)*.002;}
  luxAnatomy?.setProgress(operation);if(luxAnatomy?.loaded)schematic.visible=false;luxLabels.forEach(l=>l.visible=study||step===1);if(luxAnatomy?.loaded){const anchors=luxAnatomy.anchors();for(const l of luxLabels){const point=anchors[l.userData.part];if(point){l.position.copy(organs.worldToLocal(point.clone()));l.position.z+=.12;l.position.y+=l.userData.part==='appendix'?-.18:.20;}}}
  membrane.visible=step<3;cover.visible=step===2&&operation<1;bleeding.visible=step===4&&operation<1;specimenBag.visible=step>=3&&step<5;
  appendix.visible=step<4&&!(step===3&&operation>=1);appendixTip.visible=appendix.visible;artery.visible=step<4;specimenBag.position.x=step===3?.4+operation*.6:.8;
  if(operation>0&&step===3)specimenBag.position.y=-.25+Math.sin(Math.min(operation,1)*Math.PI)*.4;
  controls.autoRotate=detail&&!study&&step===0&&operation===0&&clock-detailOpened<2.5;controls.autoRotateSpeed=.65;controls.update();}
  sceneAssets?.update({step,progress:operation,detail,study,anatomy:luxAnatomy});scopeOverlay.hidden=!detail||study||mode!=='appendix';scopeOverlay.querySelector('small').textContent=appendixScene(step).id+' · 腹腔镜教学视图';scopeOverlay.querySelector('.scope-loading').hidden=!!luxAnatomy?.loaded&&sceneAssets?.snapshot().loaded.length===3;
  questionEffects?.update({step,progress:operation,detail,loaded:!!luxAnatomy?.loaded,anatomy:luxAnatomy,time:clock,sceneAssets,study});
  huangLux?.update({time:clock,look:huang.head.rotation.y,gesture:action});
  camera.lookAt(detail?controls.target:target);
  if(photographic&&!detail){
   camera.clearViewOffset();camera.zoom=1;camera.up.set(0,1,0);camera.position.set(0,1.2,4);camera.lookAt(0,1.2,0);camera.updateProjectionMatrix();
   if(mode==='or'||mode==='appendix'){doctor.g.visible=mode==='appendix'&&step===5;fitPatientToBed(camera,canvas);if(doctor.g.visible)placePhotoObject(doctor.g,[.80,.76],.54,camera,canvas,{sourceHeight:1.7});}
   else{if(lin?.visible)seatClinicPatient(lin,camera,canvas);if(zhou.g.visible)placePhotoObject(zhou.g,[.63,.91],.53,camera,canvas,{sourceHeight:1.7});if(huang.g.visible)placePhotoObject(huang.g,[.82,.72],.57,camera,canvas,{sourceHeight:1.7});}
   door.visible=false;chair.visible=false;chairBack.visible=false;paper.visible=false;phone.visible=false;bag.visible=false;
  }
  huangLux?.hold(tablet);
  if(mode==='appendix'&&!detail&&thumbContext&&clock-lastThumbnail>.35){
   lastThumbnail=clock;const wasGroup=group.visible,wasOrgans=organs.visible,background=scene.background;group.visible=false;organs.visible=true;scene.background=new T.Color('#160c0b');const info=appendixScene(step),smallCamera=new T.PerspectiveCamera(38,thumbnail.width/thumbnail.height,.01,40);smallCamera.position.fromArray(info.camera||[.3,1.15,2.6]);smallCamera.lookAt(new T.Vector3(...(info.target||[.12,.92,0])));renderer.render(scene,smallCamera);thumbContext.drawImage(canvas,0,0,thumbnail.width,thumbnail.height);group.visible=wasGroup;organs.visible=wasOrgans;scene.background=background;
  }
  if(!document.hidden)renderer.render(scene,camera);raf=requestAnimationFrame(tick);
 }
 const resize=new ResizeObserver(()=>{const w=canvas.clientWidth||1,h=canvas.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});resize.observe(canvas);raf=requestAnimationFrame(tick);
 return {speakerAnchor(name){if(/周先生/.test(name)&&['or','appendix'].includes(mode)&&!detail){const p=body.localToWorld(new T.Vector3(0,.86,-1.02)).project(camera);return {x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z<1};}let object;if(/陈医生|^医生/.test(name))return null;if(/小黄/.test(name))object=huang.g;else if(/林先生/.test(name))object=lin||zhou.g;else if(/周先生/.test(name))object=lin||zhou.g;else if(/警员|接机/.test(name))object=mode==='airport'?huang.g:police.g;else return null;if(!object?.visible||!group.visible)return null;let p;if(object===huang.g&&huangLux?.loaded){p=huangLux.headPosition();p.y+=.12*huang.g.scale.y;}else if(object===lin){p=lin.userData.head.localToWorld(new T.Vector3(0,.22,0));}else{p=object.localToWorld(new T.Vector3(0,1.82,0));}p.project(camera);return {x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z<1};},setAction(a){action=a;actionTime=0;if(lin){lin.visible=true;zhou.g.visible=false;lin.userData.head.rotation.x=a==='pain'?.10:0;}if(a==='blackout')canvas.classList.add('blackout');else canvas.classList.remove('blackout');},setPaused(v){paused=v;},setReducedMotion(v){reducedMotion=v;},setStep(s,completed=false){interaction?.dispose();step=s;canvas.parentElement.classList.toggle('theatre-recovery',step===5);operation=completed?1:0;luxAnatomy?.setStep(s);leaveDetail();},setOrganView(view){luxAnatomy?.setView(view);enterDetail(true);if(view==='layers'){camera.position.z*=1.3;controls.target.x=.30;}},openDetail(){enterDetail(false);},closeDetail:leaveDetail,performStep(){return interaction?.perform()||Promise.resolve(false);},async operate(){const frames=step===3||step===4?60:30;for(let i=0;i<=frames&&!disposed;i++){while(paused&&!disposed)await new Promise(r=>setTimeout(r,60));operation=i/frames;await new Promise(r=>setTimeout(r,35));}},snapshot(){return {camera:camera.position.toArray(),cameraTarget:controls.target.toArray(),organsVisible:organs.visible,calls:renderer.info.render.calls,geometryCount:renderer.info.memory.geometries,background:scene.background?.getHexString(),roomProps:'background-artwork',huang:huangLux?.snapshot(),mode,action,step,detail,operation,appendixAnatomy:luxAnatomy?.snapshot()||null,sceneAssets:sceneAssets?.snapshot(),scopeMode:detail&&!study,registeredBodyLoaded:!!sourceBody,patientProfile:patient==='zhou'?{caseId:'CASE_APP_002',age:32,sex:'male',source:'reused-zhou-supine'}:null};},dispose(){disposed=true;closeLearning?.();screenStop?.();screenButton?.remove();canvas.parentElement.querySelector('.theatre-learn')?.remove();canvas.parentElement.querySelector('.scope-title')?.remove();lin?.userData.cancelAssetLoad?.();huangLux?.dispose();interaction?.dispose();scopeObserver.disconnect();scopeOverlay.remove();sceneAssets?.dispose();questionEffects?.dispose();luxAnatomy?.dispose();cancelAnimationFrame(raf);resize.disconnect();controls.dispose();canvas.removeEventListener('pointerup',pick);release(scene);renderer.dispose();}};
}
function release(root){root.traverse(o=>{o.geometry?.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats)if(m){m.map?.dispose();m.dispose();}});}
function fallback(canvas,{mode,onPick,onFallback,reducedMotion}){
 // An actually animated 2D skeletal staging path when WebGL is unavailable.
 const replacement=document.createElement('canvas');replacement.className=canvas.className;canvas.replaceWith(replacement);canvas=replacement;const c=canvas.getContext('2d');let disposed=false,paused=false,t=0,action='idle',step=0,detail=false,operation=0;onFallback();
 const draw=()=>{if(disposed)return;if(!paused&&!document.hidden)t+=reducedMotion?.005:.02;const w=canvas.width=canvas.clientWidth||500,h=canvas.height=canvas.clientHeight||450;c.clearRect(0,0,w,h);if(detail){c.fillStyle='#244d49';c.fillRect(0,0,w,h);}
  if(detail){c.strokeStyle='#c49e82';c.lineWidth=40;c.beginPath();c.moveTo(w*.4,h*.3);c.lineTo(w*.4,h*.55);c.stroke();c.strokeStyle=step>=4?'#baa17d':'#bb6d61';c.lineWidth=18;c.beginPath();c.moveTo(w*.4,h*.5);c.bezierCurveTo(w*.62,h*.5,w*.50,h*.8,w*.7,h*.7);c.stroke();c.fillStyle='#fff0c8';c.font='16px sans-serif';c.fillText('A 盲肠       B 阑尾       C 邻近小肠',w*.14,h*.88);}
  else for(let i=0;i<2;i++){const x=w*(i?.7:.3),y=h*.44,arm=Math.sin(t*2)*12;c.fillStyle=i?'#879a83':'#d5dbca';c.fillRect(x-24,y+25,48,90);c.fillStyle='#cba689';c.beginPath();c.arc(x,y,25,0,7);c.fill();c.strokeStyle='#cba689';c.lineWidth=12;c.beginPath();c.moveTo(x+24,y+40);c.lineTo(x+55,y+70-arm-(action==='phone'?45:0));c.stroke();}
  c.fillStyle='#eee6c9';c.font='13px sans-serif';c.fillText(detail?'结构关系示意 · 非临床仿真':'二维骨骼演出 · '+mode,18,28);requestAnimationFrame(draw);};draw();canvas.onclick=()=>{if(detail)onPick('阑尾与盲肠连接学习示意');};return {speakerAnchor(name){return /周|林|小黄|警员|接机/.test(name)?{x:.70,y:.44,visible:true}:null;},setAction(a){action=a;},setStep(s){step=s;},setPaused(v){paused=v;},setReducedMotion(v){reducedMotion=v;},openDetail(){detail=true;canvas.parentElement.classList.add('photo-detail');},closeDetail(){detail=false;canvas.parentElement.classList.remove('photo-detail');},async operate(){await new Promise(r=>setTimeout(r,800));operation=1;},snapshot(){return {camera:camera.position.toArray(),cameraTarget:controls.target.toArray(),organsVisible:organs.visible,calls:renderer.info.render.calls,geometryCount:renderer.info.memory.geometries,background:scene.background?.getHexString(),roomProps:'background-artwork',mode,step,detail,operation,fallback:true};},dispose(){disposed=true;canvas.onclick=null;}};
}
