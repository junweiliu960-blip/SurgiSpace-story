import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

// Reuses Lin's original detailed head and cleaned seated body, without furniture.
export function attachLuxLin(root){
 let cancelled=false;const fallback=[...root.children];
 root.userData.cancelAssetLoad=()=>{cancelled=true;};
 root.userData.assetReady=new Promise(resolve=>new GLTFLoader().load(new URL(import.meta.env.BASE_URL+'models/lux3d-patient/lin-seated-clean.glb',document.baseURI).href,g=>{
  if(cancelled){release(g.scene);resolve(false);return;}
  const source=g.scene;source.updateMatrixWorld(true);const box=new T.Box3().setFromObject(source),height=box.max.y-box.min.y,factor=1.58/height;
  source.position.y-=box.min.y;const visual=new T.Group();visual.name='Lin_Lux3D_Seated_NoChair';visual.scale.setScalar(factor);visual.add(source);root.add(visual);
  source.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
  root.updateWorldMatrix(true,true);const head=source.getObjectByName('Clinic_Detailed_Head'),headBox=new T.Box3().setFromObject(head||source),centre=headBox.getCenter(new T.Vector3()),anchor=new T.Group();
  anchor.position.copy(root.worldToLocal(centre));root.add(anchor);root.userData.head=anchor;
  fallback.forEach(o=>{o.visible=false;});root.name='Lin_Lux3D_Seated';root.userData.clinicLuxLoaded=true;resolve(true);
 },undefined,()=>resolve(false)));
}
function release(root){root.traverse(o=>{o.geometry?.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){for(const v of Object.values(m))if(v?.isTexture)v.dispose();m.dispose();}});}
