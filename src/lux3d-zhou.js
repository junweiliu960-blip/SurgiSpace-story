import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
// Source assets contain the seated person only; furniture stays in the scene.
export function attachLuxZhou(root,{variant='ill',isDisposed=()=>false}={}){
 let cancelled=false,loaded=false,error=null;const visual=new T.Group();visual.name='Zhou_Lux3D_'+variant;root.add(visual);
 root.userData.cancelAssetLoad=()=>{cancelled=true;};
 const ready=new Promise(resolve=>new GLTFLoader().load(new URL(import.meta.env.BASE_URL+'models/lux3d-zhou/zhou-'+variant+'.glb',document.baseURI).href,g=>{
  if(cancelled||isDisposed()){release(g.scene);resolve(false);return;}
  const source=g.scene;source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),size=box.getSize(new T.Vector3()),centre=box.getCenter(new T.Vector3());
  source.position.sub(new T.Vector3(centre.x,box.min.y,centre.z));visual.scale.setScalar(1.58/size.y);visual.add(source);
  source.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  root.userData.head.position.set(0,1.43,0);root.userData.clinicLuxLoaded=true;root.userData.patientIdentity='zhou';loaded=true;resolve(true);
 },undefined,()=>{error='周先生模型加载失败';resolve(false);}));
 root.userData.assetReady=ready;
 return {ready,get loaded(){return loaded;},headPosition(){root.updateWorldMatrix(true,true);return root.userData.head.getWorldPosition(new T.Vector3());},snapshot(){return {provider:'Aholo Lux3D',variant,loaded,error};},dispose(){cancelled=true;visual.removeFromParent();release(visual);}};
}
function release(root){root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
