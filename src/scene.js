import {refreshedRenalPorts,refreshedCutawayPorts} from './renal-refresh-registration.js';
import {attachLuxHuang} from './lux3d-huang.js';
import {fitPatientToBed,addBedContactShadow} from './bed-registration.js';
import {createCartoonPatient} from './cartoon-patient.js';
import {normalizedPhotoBounds,placePhotoObject,seatClinicPatient} from './photo-layout.js';
import {renalRegistration as renalReg} from './renal-registration.js';
import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const V=(x,y,z)=>new T.Vector3(x,y,z),lerp=T.MathUtils.lerp,clamp=T.MathUtils.clamp;
const CENTER=V(-.065,1.06,-.24),KIDNEY=V(...renalReg.origin),RX=.12,RZ=.155;
const colors={integumentary:'#c7987f',sensory:'#dfd6bc',digestive:'#b57e69',urinary:'#a66356',arterial:'#b34b4c',venous:'#537995',skeletal:'#dfcfad'};
export async function createScene(canvas,onStatus,options={}){
 const mobile=matchMedia('(pointer: coarse)').matches||innerWidth<=800;const signal=options.signal;let disposed=false;
 const scene=new T.Scene();scene.background=null;scene.fog=new T.Fog('#173f3c',5,12);
 const renderer=new T.WebGLRenderer({canvas,antialias:!mobile,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,mobile?1:1.5));renderer.shadowMap.enabled=!mobile;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.17;
 signal?.addEventListener('abort',()=>{disposed=true;renderer.dispose();},{once:true});
 const camera=new T.PerspectiveCamera(37,1,.005,30);const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.48;controls.minDistance=.18;controls.maxDistance=4.4;controls.enablePan=false;
 const ambient=new T.HemisphereLight('#e1f5f6','#354047',2.2);scene.add(ambient);
 const light=new T.DirectionalLight('#fff0dd',3.5);light.position.set(-1,5,-1);light.castShadow=true;light.shadow.mapSize.set(1024,1024);light.shadow.camera.left=-2;light.shadow.camera.right=2;light.shadow.camera.top=2;light.shadow.camera.bottom=-2;light.shadow.bias=-.0001;scene.add(light);
 const rim=new T.DirectionalLight('#8ac5d1',2);rim.position.set(2,2,1);scene.add(rim);
 const room=new T.Group();scene.add(room);
 const material=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 function mesh(geo,mat,pos,parent=room){const m=new T.Mesh(geo,mat);m.position.copy(pos);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 const box=(size,color,pos,parent=room,metal=0)=>mesh(new T.BoxGeometry(...size),material(color,.65,metal),V(...pos),parent);
 const loader=new GLTFLoader();let assetWarnings=[];
 async function glb(path){const r=await fetch(`${import.meta.env.BASE_URL}models/${path}`,{signal});if(!r.ok)throw Error('模型加载失败：'+path);return (await loader.parseAsync(await r.arrayBuffer(),`${import.meta.env.BASE_URL}models/`)).scene;}
 // The room photograph owns the bed, lights, trolley and monitoring equipment.
 const renalAssembly=new T.Group();renalAssembly.name='Lin_Lux3D_New_Operating_Assembly';scene.add(renalAssembly);let renalAssemblyReady=false,renalAssemblyPromise=null;const floorShadow=new T.Mesh(new T.PlaneGeometry(1.7,2.5),new T.ShadowMaterial({opacity:.30,depthWrite:false}));floorShadow.rotation.x=-Math.PI/2;floorShadow.position.y=.002;floorShadow.receiveShadow=true;renalAssembly.add(floorShadow);
 function prepareRenalAssembly(){return renalAssemblyPromise??=(async()=>{try{const model=await glb('lux3d-renal-refresh/bed.glb');if(disposed){releaseObject(model);return;}model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});renalAssembly.add(model);renalAssemblyReady=true;}catch{onStatus('新手术床暂未载入，保留原场景并可继续任务。');}})();}
 const patient=new T.Group();patient.name='PatientRoot';scene.add(patient);const bedShadow=addBedContactShadow(patient);
 onStatus('正在装配 BodyParts3D 解剖数据…');
 const [manifest,buffer]=await Promise.all([fetch(`${import.meta.env.BASE_URL}models/bodyparts-starter.json`,{signal}).then(r=>{if(!r.ok)throw Error('人体目录加载失败');return r.json();}),fetch(`${import.meta.env.BASE_URL}models/bodyparts-starter.bin`,{signal}).then(r=>{if(!r.ok)throw Error('人体网格加载失败');return r.arrayBuffer();})]);
 if(buffer.byteLength!==manifest.bytes)throw Error('人体模型文件不完整，请重新解压运行包');
 const entries=[];let fullSkin,cutSkin,skinPatch;
 const transformPoint=(x,y,z)=>V(x,.98+z,.86-y);
 function assemblePart(part,buffer){
  const pos=new Float32Array(buffer,part.positions,part.vertexCount*3),coords=new Float32Array(pos.length);
  for(let i=0;i<pos.length;i+=3){coords[i]=pos[i];coords[i+1]=.98+pos[i+2];coords[i+2]=.86-pos[i+1];}
  const indices=new Uint32Array(buffer,part.indices,part.indexCount);const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(coords,3));g.setIndex(new T.BufferAttribute(indices.slice(),1));g.computeVertexNormals();
  const isHair=/hair|eyebrow/i.test(part.name),mat=material(isHair?'#3f3731':/ureter/i.test(part.name)?'#dbc8a6':colors[part.system]||'#d0baa7',part.system==='integumentary'?.83:.58);
  const m=mesh(g,mat,V(),patient);m.name=part.name;m.userData={id:part.id,system:part.system,source:'BodyParts3D',label:part.name};entries.push({m,part});
  if(part.id==='FJ2810'){
   fullSkin=m;const keep=[],patch=[];
   for(let i=0;i<indices.length;i+=3){let x=0,y=0,z=0;for(let k=0;k<3;k++){const j=indices[i+k]*3;x+=coords[j]/3;y+=coords[j+1]/3;z+=coords[j+2]/3;}
    const inside=((x-CENTER.x)/RX)**2+((z-CENTER.z)/RZ)**2<1&&y>1.0; (inside?patch:keep).push(indices[i],indices[i+1],indices[i+2]);}
   const cg=g.clone();cg.setIndex(keep);cutSkin=mesh(cg,mat.clone(),V(),patient);cutSkin.name='BodySkin_LocalOpening';cutSkin.visible=false;
   const pg=g.clone();pg.setIndex(patch);skinPatch=mesh(pg,mat.clone(),V(),patient);skinPatch.visible=false;
  }
 }
 for(const part of manifest.parts)assemblePart(part,buffer);
 let fullAnatomyLoaded=false,anatomyReady;
 function loadFullAnatomy(){return anatomyReady??=(async()=>{try{onStatus('正在加载完整全身解剖，请稍候…');const [m,b]=await Promise.all([fetch(`${import.meta.env.BASE_URL}models/bodyparts.json`,{signal}).then(r=>{if(!r.ok)throw Error('解剖目录加载失败');return r.json();}),fetch(`${import.meta.env.BASE_URL}models/bodyparts.bin`,{signal}).then(r=>{if(!r.ok)throw Error('解剖模型加载失败');return r.arrayBuffer();})]);if(b.byteLength!==m.bytes)throw Error('解剖文件不完整');const known=new Set(entries.map(e=>e.part.id));let count=0;for(const part of m.parts)if(!known.has(part.id)){assemblePart(part,b);if(++count%20===0)await new Promise(r=>setTimeout(r,0));}fullAnatomyLoaded=true;preparePatientAsset('internal');apply(stage);}catch(e){anatomyReady=null;throw e;}})();}
 // Lazy Lux3D anatomy replaces the former HRA detail and authored sphere lesion.
 const kidneyGroup=new T.Group();kidneyGroup.name='Lux3D_Right_Kidney';patient.add(kidneyGroup);kidneyGroup.position.copy(KIDNEY);
 const adrenal=new T.Group();adrenal.name='Lux3D_Preserved_Right_Adrenal';patient.add(adrenal);adrenal.position.copy(KIDNEY);
 const luxModels=new Map(),luxPending=new Map();let renalError=null,renalVisualStage=0,cutawayOverlayModel=null;const cutawayOverlay=new T.Scene();cutawayOverlay.add(ambient.clone(),light.clone(),rim.clone());
 const luxFiles={'01':'lux3d-kidney/01-covered.glb','02':'lux3d-renal-refresh/kidney-registered.glb','04':'lux3d-renal-refresh/cutaway-registered.glb'};
 function renalView(s){return anatomy?'04':s<6?'01':'02';}
 async function prepareKidney(id){
  if(luxModels.has(id))return;
  if(luxPending.has(id))return luxPending.get(id);
  const promise=(async()=>{try{
   const source=await glb(luxFiles[id]);if(disposed){releaseObject(source);return;}
   source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),center=bounds.getCenter(V()),size=bounds.getSize(V());
   if(id==='02'||id==='04'){center.set(0,0,0);size.setScalar(1);}const length=Math.max(size.x,size.y,size.z);const normalize=new T.Matrix4().makeScale(1/length,1/length,1/length).multiply(new T.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
   const group=new T.Group();group.name='Lux3D_View_'+id;group.rotation.x=-Math.PI/2;group.scale.setScalar(renalReg.scale);group.position.y=renalReg.lift;
   const preserved=new T.Group();preserved.rotation.copy(group.rotation);preserved.scale.copy(group.scale);preserved.position.copy(group.position);
   source.traverse(o=>{if(!o.isMesh)return;const geometry=o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(normalize);const original=geometry.index?.array||Array.from({length:geometry.attributes.position.count},(_,i)=>i),body=[],top=[];
    for(let i=0;i<original.length;i+=3){const tri=[original[i],original[i+1],original[i+2]];const y=tri.reduce((v,j)=>v+geometry.attributes.position.getY(j),0)/3;body.push(...tri);}
    const make=(indices,parent,label)=>{if(!indices.length)return;const g=geometry.clone();g.setIndex(indices);const m=new T.Mesh(g,o.material);m.name=label;m.userData.label=label;m.castShadow=true;m.receiveShadow=true;parent.add(m);};
    make(body,group,id==='01'?'肾周组织遮挡下的右肾':id==='04'?'右肾内部学习剖面':'Lux3D右肾与中下部病变');make(top,preserved,'保留的右肾上腺');geometry.dispose();
   });
   if(id==='02'){const gland=await glb('lux3d-kidney/adrenal-closeup.glb');gland.updateMatrixWorld(true);gland.traverse(o=>{if(!o.isMesh)return;const m=new T.Mesh(o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(normalize),o.material);m.userData.label='保留的右肾上腺';preserved.add(m);});adrenal.add(preserved);}if(id==='04'){cutawayOverlayModel=group.clone(true);cutawayOverlayModel.matrixAutoUpdate=false;cutawayOverlay.add(cutawayOverlayModel);}kidneyGroup.add(group);luxModels.set(id,group);renalError=null;apply(stage);
  }catch(e){if(e.name!=='AbortError'){renalError='Lux3D肾脏模型加载失败，请重试三维显示。';if(!assetWarnings.includes(renalError))assetWarnings.push(renalError);onStatus(renalError);}}finally{luxPending.delete(id);}})();
  luxPending.set(id,promise);return promise;
 }
 function releaseObject(root){root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
 const vesselClips=new T.Group();patient.add(vesselClips);for(const id of ['artery','vein']){const p=V(...refreshedRenalPorts[id]).applyEuler(new T.Euler(-Math.PI/2,0,0)).multiplyScalar(renalReg.scale).add(KIDNEY).add(V(0,.003,0));box([.008,.004,.002],'#bacbc8',p.toArray(),vesselClips,.7);}
 const renalBridges=new Map();let bridgeView=false;const renalConnections=new T.Group();patient.add(renalConnections);for(const [id,port]of Object.entries(renalReg.ports)){const start=V(...port.nativeAnchor),end=refreshedRenalPorts[id]?V(...refreshedRenalPorts[id]).applyEuler(new T.Euler(-Math.PI/2,0,0)).multiplyScalar(renalReg.scale).add(KIDNEY):V(...port.kidneyAnchor),middle=start.clone().lerp(end,.5);const connection=mesh(new T.TubeGeometry(new T.CatmullRomCurve3([start,middle,end]),12,port.radius,10,false),material(id==='artery'?'#b34b4c':id==='vein'?'#537995':'#dbbf8b',.6),V(),renalConnections);renalBridges.set(id,connection);}
 const focusRing=mesh(new T.TorusGeometry(.045,.0008,8,80),new T.MeshBasicMaterial({color:'#e9c783'}),V(-.025,.06,.027),kidneyGroup);focusRing.rotation.x=-Math.PI/2;
 // Fragment-level ellipse keeps the incision edge continuous even on reduced source triangles.
 const cutUniform={value:0},clothCoverUniform={value:0};fullSkin.material.onBeforeCompile=shader=>{shader.uniforms.surgOpen=cutUniform;shader.uniforms.surgCloth=clothCoverUniform;shader.vertexShader='varying vec3 vSurgWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvSurgWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='uniform float surgOpen; uniform float surgCloth; varying vec3 vSurgWorld;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
 if(surgCloth>0.5&&vSurgWorld.z>-.55&&!(abs(vSurgWorld.x)>.27&&vSurgWorld.z<.10)){float dx=(vSurgWorld.x+.065)/.15;float dz=(vSurgWorld.z+.24)/.19;if(dx*dx+dz*dz>1.0)discard;}
 if(surgOpen>0.001 && vSurgWorld.y>1.0){float sx=(vSurgWorld.x+0.065)/(0.12*max(surgOpen,0.005));float sz=(vSurgWorld.z+0.24)/0.155;if(sx*sx+sz*sz<1.0) discard;}`);};
 const wound=new T.Group();wound.name='access_RN_R';patient.add(wound);wound.position.copy(CENTER);
 function annulus(rx,rz,inner,depth,color){const pts=[],ids=[],N=80;for(let j=0;j<=1;j++)for(let i=0;i<=N;i++){const ang=i/N*Math.PI*2;pts.push(Math.cos(ang)*rx*(j?inner:1),j?-depth:0,Math.sin(ang)*rz*(j?inner:1));}for(let i=0;i<N;i++){const a=i,b=i+1,c=i+N+1,e=c+1;ids.push(a,c,b,b,c,e);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pts,3));g.setIndex(ids);g.computeVertexNormals();return mesh(g,new T.MeshStandardMaterial({color,side:T.DoubleSide,roughness:.62}),V(),wound);}
 const rimSkin=annulus(RX,RZ,.91,.009,'#c8947c'),fat=annulus(RX*.91,RZ*.91,.88,.016,'#d7b57f'),muscle=annulus(RX*.80,RZ*.80,.92,.027,'#985c59');fat.position.y=-.009;muscle.position.y=-.025;
 patient.updateMatrixWorld(true);const skinRay=new T.Raycaster();for(const ring of [rimSkin,fat,muscle]){const a=ring.geometry.attributes.position;for(let i=0;i<a.count;i++){skinRay.set(V(CENTER.x+a.getX(i),1.6,CENTER.z+a.getZ(i)),V(0,-1,0));const hit=skinRay.intersectObject(fullSkin)[0];if(hit)a.setY(i,a.getY(i)+hit.point.y-CENTER.y+.0005);}a.needsUpdate=true;ring.geometry.computeVertexNormals();}
 const liner=annulus(RX*.75,RZ*.75,1,.12,'#915d53');
 const floor=mesh(new T.SphereGeometry(1,48,24),material('#794d48',.76),V(0,-.106,0),wound);floor.scale.set(.11,.012,.145);
 const deepCover=mesh(new T.SphereGeometry(1,40,24),material('#bb9878',.65),V(0,-.035,0),wound);deepCover.scale.set(.099,.014,.127);
 const incision=mesh(new T.BoxGeometry(.002,.001,.21),material('#803e3d'),CENTER.clone().add(V(0,.045,0)),patient);
 const sutures=new T.Group();patient.add(sutures);for(let i=0;i<9;i++){const s=mesh(new T.TorusGeometry(.008,.00045,5,12,Math.PI),material('#48595f'),V(CENTER.x,1.102,CENTER.z-.09+i*.022),sutures);s.rotation.z=Math.PI/2;}
 // Conform cloth to the actual body surface, with a defined surgical aperture.
 const drapes=new T.Group();scene.add(drapes);
 const cloth=new T.MeshStandardMaterial({color:'#3c7778',roughness:.96,side:T.DoubleSide});
 const clothG=new T.PlaneGeometry(1.16,2.02,80,120);clothG.rotateX(-Math.PI/2);clothG.translate(0,0,-.02);
 const cp=clothG.attributes.position,skinPoints=fullSkin.geometry.attributes.position,heightGrid=new Map();
 for(let i=0;i<skinPoints.count;i++){const x=skinPoints.getX(i),z=skinPoints.getZ(i),y=skinPoints.getY(i),ix=Math.round(x/.015),iz=Math.round(z/.015);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const key=(ix+a)+','+(iz+b);heightGrid.set(key,Math.max(heightGrid.get(key)||.90,y));}}
 for(let i=0;i<cp.count;i++){const x=cp.getX(i),z=cp.getZ(i);let y=(heightGrid.get(Math.round(x/.015)+','+Math.round(z/.015))||.91)+.006;if(Math.abs(x)>.43)y=.91-(Math.abs(x)-.43)*2.5;cp.setY(i,y+.0015*Math.sin(x*68+z*17));}
 const ci=clothG.index.array,kept=[];for(let i=0;i<ci.length;i+=3){let x=0,z=0;for(let k=0;k<3;k++){x+=cp.getX(ci[i+k])/3;z+=cp.getZ(ci[i+k])/3;}const y=(cp.getY(ci[i])+cp.getY(ci[i+1])+cp.getY(ci[i+2]))/3;if(y>=.99&&Math.abs(x)<=.31&&((x-CENTER.x)/(.15))**2+((z-CENTER.z)/(.19))**2>=1)kept.push(ci[i],ci[i+1],ci[i+2]);}clothG.setIndex(kept);clothG.computeVertexNormals();const baseDrape=mesh(clothG,cloth,V(),drapes);
 const marker=mesh(new T.RingGeometry(.015,.017,40),new T.MeshBasicMaterial({color:'#d5c28a',side:T.DoubleSide}),V(-.1,1.108,-.24),patient);marker.rotation.x=-Math.PI/2;
 const instrumentRoot=new T.Group();scene.add(instrumentRoot);const toolNames={scalpel:['scalpel-handle.glb',.14],retractor:['langenbeck.glb',.16],clamp:['kelly-hemostat.glb',.17],forceps:['debakey-forceps.glb',.18],suction:['suction-tip.glb',.18],needle:['mayo-hegar.glb',.17]};const tools={};
 const toolPromises={};function prepareTool(id){if(!id||!toolNames[id])return Promise.resolve();return toolPromises[id]??=(async()=>{const [file,size]=toolNames[id];try{const obj=await glb('instruments/'+file);const b=new T.Box3().setFromObject(obj),s=b.getSize(V());obj.position.sub(b.getCenter(V()));const wrap=new T.Group();wrap.add(obj);wrap.scale.setScalar(size/Math.max(s.x,s.y,s.z));instrumentRoot.add(wrap);tools[id]=wrap;wrap.visible=false;}catch{assetWarnings.push('器械加载失败：'+id);}})();}

 const bedLabel=label('患者右侧 R');bedLabel.position.set(-.3,1.17,-.18);scene.add(bedLabel);
 function label(text){const c=document.createElement('canvas');c.width=512;c.height=96;const x=c.getContext('2d');x.fillStyle='rgba(13,33,37,.88)';x.fillRect(0,0,512,96);x.fillStyle='#e1d2a1';x.font='32px Microsoft YaHei';x.textAlign='center';x.fillText(text,256,60);const sp=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:false}));sp.scale.set(.19,.036,1);return sp;}
 const targetLabel=label('右肾病变 · 8 cm');targetLabel.position.copy(KIDNEY).add(V(-.025,.09,.03));scene.add(targetLabel);targetLabel.scale.set(.065,.012,1);

 // Reuse the same BodyParts3D surface and materials in a seated pose.
 const clinic=new T.Group();clinic.name='ConsultationRoom';scene.add(clinic);clinic.visible=false;
 const clinicChair=new T.Group();clinic.add(clinicChair);
 const seated=new T.Group();seated.name='Patient_Seated_SameIdentity';clinic.add(seated);
 for(const {m,part}of entries){if(!['integumentary','sensory'].includes(part.system))continue;const geom=m.geometry.clone(),a=geom.attributes.position;for(let i=0;i<a.count;i++){const x=a.getX(i),y=a.getY(i),z=a.getZ(i),depth=y-.98;let yy,zz;if(z<.15){yy=.52+(.15-z);zz=-.57-depth;}else if(z<.58){yy=.52+depth;zz=-.57-(z-.15);}else{yy=.52-(z-.58);zz=-1.0-depth;}a.setXYZ(i,.93+x,yy,zz);}geom.computeVertexNormals();const mat=m.material.clone();mat.onBeforeCompile=()=>{};const o=mesh(geom,mat,V(),seated);o.name=m.name;}
 seated.rotation.y=Math.PI;seated.position.set(1.86,0,-1.14);
 // Fit a gown to the seated surface instead of using rigid boxes.
 const seatedSkin=seated.children.find(o=>o.name===fullSkin.name);if(seatedSkin){const g=seatedSkin.geometry.clone(),a=g.attributes.position,ix=g.index.array,keep=[];for(let i=0;i<ix.length;i+=3){let yy=0;for(let k=0;k<3;k++)yy+=a.getY(ix[i+k])/3;if(yy>.43&&yy<1.19)keep.push(ix[i],ix[i+1],ix[i+2]);}g.setIndex(keep);for(let i=0;i<a.count;i++){a.setX(i,.93+(a.getX(i)-.93)*1.035);a.setZ(i,-.57+(a.getZ(i)+.57)*1.035);}g.computeVertexNormals();mesh(g,new T.MeshStandardMaterial({color:'#809a9b',roughness:.95,side:T.DoubleSide}),V(),seated);}

 const followupHuang=new T.Group();clinic.add(followupHuang);followupHuang.visible=false;let followupLux=null,followupActive=false;
 let clinicActor=createCartoonPatient(),luxDrape=null;clinic.add(clinicActor);seated.visible=false;clinicChair.visible=false;const patientLoads=new Map(),appearanceReady=new Set();
 function applyRegisteredAppearance(source){source.updateMatrixWorld(true);source.traverse(o=>{if(!o.isMesh)return;const id=o.userData.bodypartsId||o.name,entry=entries.find(e=>e.part.id===id);if(!entry)return;const oldHook=entry.m.material.onBeforeCompile;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);if(!g.getAttribute('normal'))g.computeVertexNormals();entry.m.geometry.dispose();entry.m.geometry=g;entry.m.material=o.material.clone();entry.m.material.flatShading=false;if(entry.part.system==='skeletal')entry.m.material.color.set('#efe4c9');if(entry.part.system==='digestive'){const n=entry.part.name;entry.m.material.color.set(/liver/i.test(n)?'#9d5144':/spleen/i.test(n)?'#884954':/pancreas/i.test(n)?'#d7b56f':/gall|bile/i.test(n)?'#839957':'#c99e8b');}if(entry.part.system==='integumentary'&&id==='FJ2810')entry.m.material.color.set('#c89e84');if(/ureter/i.test(entry.part.name)){entry.m.material.map=null;entry.m.material.color.set('#dbc8a6');}if(id==='FJ2810')entry.m.material.onBeforeCompile=oldHook;entry.m.material.needsUpdate=true;});}
 function preparePatientAsset(kind){if(patientLoads.has(kind))return patientLoads.get(kind);const files={clinic:'clinic-patient.glb',drape:'operative-drape.glb',skin:'skin-base-lux.glb',internal:'internal-base-lux.glb',vascular:'vascular-base-lux.glb'};
  const promise=(async()=>{try{const source=await glb('lux3d-patient/'+files[kind]);if(disposed){releaseObject(source);return;}
   if(kind==='clinic'){releaseObject(source);}
   else if(kind==='drape'){luxDrape=source;source.traverse(o=>{if(!o.isMesh)return;for(const mat of Array.isArray(o.material)?o.material:[o.material]){mat.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 vLuxDrapeWorld;\n'+shader.vertexShader.replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvLuxDrapeWorld=(modelMatrix*vec4(transformed,1.0)).xyz;');shader.fragmentShader='varying vec3 vLuxDrapeWorld;\n'+shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(vLuxDrapeWorld.y<0.99) discard;\nif(((vLuxDrapeWorld.x+0.065)/0.15)*((vLuxDrapeWorld.x+0.065)/0.15)+((vLuxDrapeWorld.z+0.24)/0.19)*((vLuxDrapeWorld.z+0.24)/0.19)<1.0) discard;');};mat.customProgramCacheKey=()=> 'LuxDrapeRegisteredAperture';}o.castShadow=true;o.receiveShadow=true;});drapes.add(source);baseDrape.visible=false;}
   else {applyRegisteredAppearance(source);appearanceReady.add(kind);}apply(stage);
  }catch(e){if(e.name!=='AbortError'){assetWarnings.push('Lux3D人物资产加载失败：'+kind);onStatus('人物材质暂未载入，保留解剖基准。');patientLoads.delete(kind);}}})();patientLoads.set(kind,promise);return promise;
 }
 const blood=mesh(new T.SphereGeometry(1,32,16),new T.MeshStandardMaterial({color:'#8b292c',roughness:.4,transparent:true,opacity:.85}),CENTER.clone().add(V(0,-.07,0)),patient);blood.scale.set(.075,.004,.09);blood.visible=false;
 const numbered=new T.Group();scene.add(numbered);const numberSprites=[];
 for(const [text,pos] of [['① 动脉',[-.025,1.018,-.25]],['② 静脉',[-.025,1.02,-.20]],['③ 输尿管',[-.04,1.0,-.12]],['A 右肾肾门侧',[-.08,1.08,-.24]],['B 右肾外侧',[-.18,1.08,-.24]],['C 左肾',[.1,1.08,-.24]],['D 输尿管',[-.06,1.08,-.1]]]){const l=label(text);l.position.set(...pos);l.scale.set(.065,.013,1);numbered.add(l);numberSprites.push(l);}
 let inClinic=false,clinicLook='patient',emergency=false,nodeIndex=10;
 function setFollowup(v){followupActive=v;followupHuang.visible=v;if(v&&!followupLux)followupLux=attachLuxHuang(followupHuang,{isDisposed:()=>disposed});}
 function setConsultation(v){if(v===inClinic)return;inClinic=v;clinic.visible=v;room.visible=!v;patient.visible=!v;drapes.visible=!v;instrumentRoot.visible=!v;bedLabel.visible=!v;targetLabel.visible=!v&&stage>=8&&stage<11;numbered.visible=!v;lookConsultation(clinicLook);if(!v)view('overview');}
 function lookConsultation(which){clinicLook=which;if(!inClinic)return;controls.minDistance=.25;controls.maxDistance=3;cameraTween={from:camera.position.clone(),fromT:controls.target.clone(),to:V(...(which==='patient'?(mobile?[.93,1.30,2.1]:[-.15,1.35,2.0]):(mobile?[0,1.26,1.15]:[0,1.19,.72]))),toT:V(...(which==='patient'?(mobile?[.93,1.17,-.53]:[.30,1.16,-.5]):[-.05,1.02,-.5])),t:0};}
 function setNode(i){nodeIndex=i;numberSprites.forEach((l,j)=>l.visible=i===13?j<3:i===5?j>=3:false);numbered.visible=!inClinic&&i===5;}
 function setEmergency(v){emergency=v;blood.visible=v;}
 const presets={overview:{p:[1.65,2.65,2.3],t:[0,.95,-.05]},access:{p:[-.38,1.75,.25],t:[-.06,1.02,-.24]},field:{p:[-.30,1.53,.02],t:[-.06,1,-.24]},kidney:{p:[-.10,1.45,-.19],t:[-.06,.995,-.24]},closure:{p:[-.34,1.7,.2],t:[-.06,1.06,-.24]}};
 let activeView='overview',cameraInteraction=true,cameraTween=null,anim=null,paused=false,anatomy=false,stage=0,time=0,labels=true;let selectedTool=null;
 function view(id='overview',instant=false){activeView=id;if(inClinic){lookConsultation(clinicLook);return;}const pr=presets[id]||presets.overview;controls.minDistance=id==='overview'?.6:.18;controls.maxDistance=id==='overview'?4.4:1.2;cameraTween={from:camera.position.clone(),fromT:controls.target.clone(),to:V(...pr.p),toT:V(...pr.t),t:instant?1:0};if(instant){camera.position.copy(cameraTween.to);controls.target.copy(cameraTween.toT);cameraTween=null;controls.update();}}
 view('overview',true);
 function setStage(s){stage=s;apply(s);}
 function apply(s){
  renalVisualStage=s;if(!inClinic){prepareRenalAssembly();preparePatientAsset('drape');preparePatientAsset('skin');}if(!inClinic&&s>=5)preparePatientAsset('vascular');renalConnections.visible=!inClinic&&(anatomy||s>=6&&s<11);if(bridgeView!==anatomy){bridgeView=anatomy;const ports=anatomy?refreshedCutawayPorts:refreshedRenalPorts;for(const id of ['artery','vein']){const port=renalReg.ports[id],start=V(...port.nativeAnchor),end=V(...ports[id]).applyEuler(new T.Euler(-Math.PI/2,0,0)).multiplyScalar(renalReg.scale).add(KIDNEY),middle=start.clone().lerp(end,.5),bridge=renalBridges.get(id);bridge.geometry.dispose();bridge.geometry=new T.TubeGeometry(new T.CatmullRomCurve3([start,middle,end]),12,port.radius,10,false);}}numbered.visible=!anatomy&&!inClinic&&nodeIndex===5;
  const opening=clamp((s-4)/1.0,0,1),deep=clamp(s-5,0,1),removed=clamp(s-10,0,1),closed=s>=14;
  for(const {m,part}of entries){const surface=part.system==='integumentary'||part.system==='sensory';const kidneyRef=part.id==='FJ3147';m.visible=surface||anatomy||s>=6&&s<14&&/^(Right renal artery|Right renal vein|Right ureter|Abdominal aorta|Inferior vena cava)$/i.test(part.name);if(kidneyRef)m.visible=false;if(part.id==='FJ2815')m.visible=false;if(s>=11&&(part.id==='FJ3578'||part.id==='FJ3146'))m.visible=false;
   m.material.transparent=anatomy&&surface;m.material.opacity=anatomy&&surface?.09:1;m.material.depthWrite=!(anatomy&&surface);}
  fullSkin.visible=true;fullSkin.castShadow=!luxDrape&&(opening===0||closed);clothCoverUniform.value=!anatomy&&luxDrape?1:0;cutUniform.value=anatomy||closed?0:opening;cutSkin.visible=false;skinPatch.visible=false;
  wound.visible=opening>0&&!closed;wound.scale.x=Math.max(.03,opening);deepCover.visible=deep<1&&!luxModels.has('01');deepCover.scale.x=.099*(1-deep*.8);deepCover.position.x=deep*.075;
  fat.visible=s>=5;muscle.visible=s>=5;incision.visible=s>=4&&s<5||closed;sutures.visible=closed;drapes.visible=!anatomy;marker.visible=s>=1&&s<4;bedLabel.visible=labels&&s<4;
  kidneyGroup.visible=anatomy||s>=5&&s<14;kidneyGroup.position.copy(KIDNEY).lerp(V(-.75,1.02,.15),removed);kidneyGroup.rotation.z=removed*.5;
  const selectedRenal=renalView(s);for(const [id,model]of luxModels)model.visible=id===selectedRenal;
  if((anatomy||s>=4&&s<14)&&!inClinic){prepareKidney(selectedRenal);if(s>=5&&!anatomy)prepareKidney('02');}
  adrenal.visible=anatomy||s>=7&&s<14;vesselClips.visible=s>=10&&s<14;
  focusRing.visible=!anatomy&&s>=8&&s<11;targetLabel.visible=labels&&s>=8&&s<11&&!anatomy;
  if(inClinic){patient.visible=false;drapes.visible=false;bedLabel.visible=false;targetLabel.visible=false;}
  for(const [key,obj]of Object.entries(tools))obj.visible=key===selectedTool&&!!anim;
 }
 let operationEpoch=0;async function transition(s,tool){const epoch=operationEpoch;await Promise.all([prepareTool(tool),...(s>=5&&s<14?[prepareKidney(s<6?'01':'02')]:[])]);if(epoch!==operationEpoch)return false;if(anim){anim.resolve(false);anim=null;}selectedTool=tool;return new Promise(resolve=>{anim={from:stage,to:s,t:0,duration:s===11?2.6:s===14?2.5:1.6,resolve};});}
 function reset(s=0){operationEpoch++;if(anim){anim.resolve(false);anim=null;}selectedTool=null;anatomy=false;stage=s;paused=false;apply(s);view('overview');}
 const observer=new ResizeObserver(()=>{const w=canvas.clientWidth,h=canvas.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();});observer.observe(canvas);
 const clock=new T.Clock();function render(){if(disposed)return;const dt=Math.min(clock.getDelta(),.25);if(!paused){time+=dt;if(cameraTween){cameraTween.t=Math.min(1,cameraTween.t+dt/1.1);const t=cameraTween.t**2*(3-2*cameraTween.t);camera.position.lerpVectors(cameraTween.from,cameraTween.to,t);controls.target.lerpVectors(cameraTween.fromT,cameraTween.toT,t);if(cameraTween.t===1)cameraTween=null;}
   if(anim){anim.t=Math.min(1,anim.t+dt/anim.duration);const q=anim.t**2*(3-2*anim.t);apply(lerp(anim.from,anim.to,q));const tool=tools[selectedTool];if(tool){tool.position.copy(CENTER).add(V(.04*Math.sin(q*Math.PI*2),.1+.13*(1-Math.sin(q*Math.PI)),-.04+q*.08));tool.rotation.set(-.6,Math.PI/3,.4+q*.2);}if(anim.t===1){stage=anim.to;const done=anim.resolve;anim=null;selectedTool=null;apply(stage);done(true);}}
   if(clinicActor&&inClinic){clinicActor.rotation.y=Math.sin(time*.35)*.012;clinicActor.position.y=Math.sin(time*1.1)*.002;}focusRing.material.opacity=.55+.3*Math.sin(time*3);controls.update();}
  const photoOverview=inClinic||activeView==='overview'&&!anatomy;bedShadow.visible=!inClinic&&photoOverview;renalAssembly.visible=!inClinic&&photoOverview&&renalAssemblyReady;if(renalAssembly.visible){patient.visible=false;drapes.visible=false;}else{patient.visible=!inClinic;drapes.visible=!inClinic&&!anatomy;}
  canvas.closest('.viewport')?.classList.toggle('photo-detail',!photoOverview);
  if(photoOverview){
   controls.enabled=false;camera.clearViewOffset();camera.zoom=1;camera.up.set(0,1,0);camera.updateProjectionMatrix();
   if(inClinic){camera.position.set(0,1.2,4);camera.lookAt(0,1.2,0);clinic.visible=clinicLook!=='computer';if(clinicActor)seatClinicPatient(clinicActor,camera,canvas);followupHuang.visible=followupActive; if(followupActive){placePhotoObject(followupHuang,[.84,.91],.78,camera,canvas,{sourceHeight:1.90});followupLux?.update({time});}}
   else{fitPatientToBed(camera,canvas);}
  }else{camera.clearViewOffset();camera.zoom=1;camera.up.set(0,1,0);camera.updateProjectionMatrix();scene.background=new T.Color('#102b2a');controls.enabled=cameraInteraction&&!paused;}
  if(photoOverview)scene.background=null;
  if(!document.hidden&&!document.body.classList.contains('campaign-active')){const cross=anatomy&&!inClinic&&kidneyGroup.visible&&luxModels.get('04');if(cross&&cutawayOverlayModel){cross.visible=false;renderer.render(scene,camera);cross.visible=true;cross.updateWorldMatrix(true,false);cutawayOverlayModel.matrix.copy(cross.matrixWorld);renderer.autoClear=false;renderer.clearDepth();renderer.render(cutawayOverlay,camera);renderer.autoClear=true;}else renderer.render(scene,camera);}requestAnimationFrame(render);
 }apply(0);render();
 const ray=new T.Raycaster(),pointer=new T.Vector2();canvas.addEventListener('pointerup',e=>{if(!anatomy)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hit=ray.intersectObject(kidneyGroup,true).find(x=>x.object.visible);if(hit)onStatus('选中结构：'+hit.object.userData.label);});
 function dispose(){disposed=true;followupLux?.dispose();releaseObject(renalAssembly);clinicActor?.userData.cancelAssetLoad?.();operationEpoch++;if(anim){anim.resolve(false);anim=null;}observer.disconnect();controls.dispose();for(const model of luxModels.values())releaseObject(model);releaseObject(adrenal);if(clinicActor)releaseObject(clinicActor);if(luxDrape)releaseObject(luxDrape);renderer.dispose();}
 signal?.addEventListener('abort',dispose,{once:true});
 return {isFallback:false,dispose,previewTransition(s,tool,q){q=Math.max(0,Math.min(1,q));selectedTool=tool;apply(lerp(stage,s,q));const object=tools[tool];if(object){object.position.copy(CENTER).add(V(.04*Math.sin(q*Math.PI*2),.1+.13*(1-Math.sin(q*Math.PI)),-.04+q*.08));object.rotation.set(-.6,Math.PI/3,.4+q*.2);}},renalHotspots(){if(inClinic||anatomy||activeView==='overview'||stage<7||stage>=11)return [];return Object.entries(renalReg.hotspots).map(([id,xyz])=>{const p=V(...xyz).add(V(0,.008,0)).project(camera);return {id,x:(p.x+1)/2,y:(1-p.y)/2,visible:p.z<1};});},loadFullAnatomy,prepareTool,computerScreenBounds(){return normalizedPhotoBounds(canvas,'computer');},huangSpeechAnchor(){const p=followupLux?.headPosition();if(!p)return null;p.project(camera);return {x:(p.x+1)/2,y:(1-p.y)/2};},patientSpeechAnchor(){clinicActor.updateWorldMatrix(true,true);const p=clinicActor.userData.head.localToWorld(V(0,.22,0)).project(camera);return {x:(p.x+1)/2,y:(1-p.y)/2};},transition,reset,view,setStage,setFollowup,setConsultation,lookConsultation,setNode,setEmergency,setCameraInteraction(v){cameraInteraction=v;controls.enabled=v&&!paused;},setPaused(v){paused=v;controls.enabled=cameraInteraction&&!v;},setAnatomy(v){anatomy=v;apply(stage);},setLabels(v){labels=v;apply(stage);},get info(){return {roomProps:'background-artwork',bodyParts:manifest.totalParts||manifest.parts.length,startupParts:manifest.parts.length,fullAnatomyLoaded,clinicLuxReady:!!clinicActor,drapeLuxReady:!!luxDrape,appearanceReady:[...appearanceReady],hraMeshes:0,renalProvider:'Lux3D',luxKidneyViews:[...luxModels.keys()],assetWarnings,triangles:renderer.info.render.triangles,drawCalls:renderer.info.render.calls};},snapshot(){return {stage,anatomy,inClinic,clinicLook,emergency,nodeIndex,cameraSettled:!cameraTween,kidneyPosition:kidneyGroup.position.toArray(),woundVisible:wound.visible,fullSkin:fullSkin.visible,clinicLuxReady:!!clinicActor,drapeLuxReady:!!luxDrape,appearanceReady:[...appearanceReady],renalProvider:'Lux3D',refreshedAssemblyReady:renalAssemblyReady,renalVisualStage,renalView:renalView(stage),renalLoaded:luxModels.has(renalView(stage)),visibleRenalViews:[...luxModels].filter(([,m])=>m.visible&&kidneyGroup.visible&&!inClinic).map(([id])=>id),adrenalVisible:adrenal.visible&&!inClinic,adrenalMeshes:adrenal.children.reduce((n,g)=>n+g.children.length,0),adrenalPosition:adrenal.position.toArray(),renalError};}};
}




