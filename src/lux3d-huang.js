import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Both stage systems use this single local character asset. No runtime API calls.
export function attachLuxHuang(parent,{exclude=[],isDisposed=()=>false}={}){
 const fallback=[];parent.traverse(o=>{if(o.isMesh&&!exclude.some(p=>{for(let a=o;a;a=a.parent)if(a===p)return true;return false;}))fallback.push(o);});
 const visual=new T.Group();visual.name='XiaoHuang_Lux3D';parent.add(visual);
 let loaded=false,error=null,model,head,leftHand;const bones=new Map(),rest=new Map();
 const ready=new Promise(resolve=>new GLTFLoader().load(new URL(import.meta.env.BASE_URL+'models/lux3d-huang/huang-rigged.glb',document.baseURI).href,g=>{
  if(isDisposed()){release(g.scene);resolve(false);return;}
  model=g.scene;model.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3());
  const normalizer=new T.Group();normalizer.scale.setScalar(1.70/size.y);model.position.sub(new T.Vector3(centre.x,box.min.y,centre.z));normalizer.add(model);visual.add(normalizer);
  model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}if(o.isBone){bones.set(o.name.toLowerCase().replace(/[^a-z0-9]/g,''),o);rest.set(o,o.quaternion.clone());}});
  const find=(...names)=>{for(const name of names)for(const [key,bone]of bones)if(key.endsWith(name))return bone;};
  head=find('head');leftHand=find('lefthand','handl','lhand');
  for(const o of fallback)o.visible=false;loaded=true;resolve(true);
 },undefined,()=>{error='小黄模型加载失败';resolve(false);}));
 function bone(...names){for(const name of names)for(const [key,b]of bones)if(key.endsWith(name))return b;}
 function turn(b,x=0,y=0,z=0){if(b)b.quaternion.copy(rest.get(b)).multiply(new T.Quaternion().setFromEuler(new T.Euler(x,y,z)));}
 function aim(b,child,direction){
  if(!b||!child)return;parent.updateWorldMatrix(true,true);
  const worldDirection=new T.Vector3(...direction).normalize().transformDirection(parent.matrixWorld),localDirection=worldDirection.applyQuaternion(b.parent.getWorldQuaternion(new T.Quaternion()).invert());
  const restDirection=child.position.clone().normalize().applyQuaternion(rest.get(b));
  b.quaternion.copy(new T.Quaternion().setFromUnitVectors(restDirection,localDirection).multiply(rest.get(b)));b.updateWorldMatrix(false,true);
 }
 return {ready,get loaded(){return loaded;},update({time=0,look=0,lean=0,gesture='idle',walk=0}={}){
  if(!loaded)return;
  turn(head,0,look+Math.sin(time*.65)*.025,0);turn(bone('spine2','chest','spine'),lean*.5,0,0);
  const presenting=['tablet','check','badge','receive','assure','speak','guide','block'].includes(gesture);
  for(const [side,sign]of [['left',1],['right',-1]]){
   const arm=bone(side+'arm',side+'upperarm','upperarm'+side[0]),fore=bone(side+'forearm',side+'lowerarm','forearm'+side[0]),hand=bone(side+'hand');
   const waving=gesture==='wave'&&side==='right';
   aim(arm,fore,waving?[-.6,.35,.2]:presenting?[sign*.15,-.8,.4]:[sign*.10,-1,.04+Math.sin(walk+(sign===1?0:Math.PI))*.08]);
   aim(fore,hand,waving?[Math.sin(time*3)*.15,1,.1]:presenting?[sign*.05,-.10,1]:[sign*.06,-1,.08]);
   const stride=Math.sin(walk+(sign===1?0:Math.PI));turn(bone(side+'upleg'),stride*.22);turn(bone(side+'leg'),Math.max(0,-stride)*.22);
  }
 },headPosition(){if(!loaded)return null;parent.updateWorldMatrix(true,true);return head?head.getWorldPosition(new T.Vector3()):parent.localToWorld(new T.Vector3(0,1.60,0));},handPosition(){parent.updateWorldMatrix(true,true);return loaded&&leftHand?leftHand.getWorldPosition(new T.Vector3()):null;},hold(object){
  if(!loaded||!leftHand||!object.visible)return;parent.updateWorldMatrix(true,true);
  const position=leftHand.getWorldPosition(new T.Vector3()),scale=parent.getWorldScale(new T.Vector3()).y;
  position.add(new T.Vector3(0,.07,.045).applyQuaternion(parent.getWorldQuaternion(new T.Quaternion())).multiplyScalar(scale));
  object.position.copy(object.parent.worldToLocal(position));object.quaternion.copy(object.parent.getWorldQuaternion(new T.Quaternion()).invert().multiply(parent.getWorldQuaternion(new T.Quaternion())).multiply(new T.Quaternion().setFromEuler(new T.Euler(-.15,0,0))));
  object.scale.setScalar(scale/object.parent.getWorldScale(new T.Vector3()).y);
 },dispose(){visual.removeFromParent();release(visual);},snapshot(){return {provider:'Aholo Lux3D',loaded,bones:bones.size,error};}};
}
function release(root){root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
