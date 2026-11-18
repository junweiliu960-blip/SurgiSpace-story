import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const labels={cecum:'盲肠',ileum:'邻近小肠',appendix:'阑尾',mesoappendix:'阑尾附着组织内供血连接'};
export function createAppendixAnatomy(parent,{onStatus=()=>{},onReady=()=>{}}={}){
 const root=new T.Group();root.name='Lux3D_CASE_APP_002';parent.add(root);
 let disposed=false,loaded=false,step=0,progress=0,view='complete',error=null;const parts=new Map(),origins=new Map();
 const ready=new Promise(resolve=>new GLTFLoader().load(new URL(import.meta.env.BASE_URL+'models/lux3d-appendix/02-complete.glb',document.baseURI).href,g=>{
  if(disposed){release(g.scene);resolve(false);return;}
  root.add(g.scene);g.scene.traverse(o=>{if(!o.isMesh)return;const key=Object.keys(labels).find(k=>o.name.toLowerCase().startsWith(k));if(!key)return;o.userData.appendixPart=key;o.userData.label=labels[key];if(!parts.has(key))parts.set(key,[]);parts.get(key).push(o);origins.set(o,o.position.clone());o.castShadow=true;o.receiveShadow=true;});
  root.traverse(o=>{if(o.name==='OrganCover')o.userData.coverOrigin=o.position.toArray();});loaded=true;apply();onStatus('Lux3D 阑尾器官 · 游戏教学模型');onReady();resolve(true);
 },undefined,()=>{error='Lux3D 阑尾模型暂未载入，正在使用简化教学示意。';onStatus(error);resolve(false);}));
 function apply(){
  for(const [key,meshes] of parts)for(const mesh of meshes){
   const offset=view==='layers'?({appendix:[.55,-.05,.10],mesoappendix:[.30,.02,.05]}[key]||[0,0,0]):[0,0,0];
   mesh.position.copy(origins.get(mesh)).add(new T.Vector3(...offset));
   mesh.visible=!(step>=4&&['appendix','mesoappendix'].includes(key));
   if(step===3&&key==='appendix'){const exit=Math.max(0,(progress-.55)/.45);mesh.position.x+=exit*.80;mesh.position.y+=Math.sin(exit*Math.PI)*.18;mesh.visible=progress<.95;}
   if(step===3&&key==='mesoappendix')mesh.visible=progress<.55;
  }
  root.traverse(o=>{if(o.name==='OrganCover'){o.visible=view==='covered'||view==='complete'&&step===2&&progress<1;o.scale.set(...(o.userData.coveredScale||[1.1,1,.72]));o.position.fromArray(o.userData.coverOrigin||[-.16,-.15,.07]);if(step===2){o.position.x+=progress*.45;o.position.y+=progress*.08;}}});
 }
 return {root,ready,get loaded(){return loaded;},get error(){return error;},setStep(value){step=value;progress=0;apply();},setProgress(value){progress=value;apply();},setView(value){if(!['covered','complete','layers'].includes(value))return;view=value;apply();},pick(ray){const hit=ray.intersectObject(root,true).find(h=>h.object.visible&&h.object.userData.appendixPart);return hit?.object.userData.label;},bounds(key){root.updateWorldMatrix(true,true);const box=new T.Box3();for(const mesh of parts.get(key)||[])box.expandByObject(mesh);return box;},anchors(){root.updateWorldMatrix(true,true);const result={};for(const [key,meshes]of parts){const box=new T.Box3();meshes.forEach(m=>box.expandByObject(m));result[key]=box.getCenter(new T.Vector3());}return result;},snapshot(){return {provider:loaded?'Lux3D':'schematic-fallback',loaded,view,step,error,parts:[...parts.keys()]};},dispose(){disposed=true;release(root);root.removeFromParent();}};
}
function release(root){const textures=new Set(),materials=new Set(),geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}});textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}
