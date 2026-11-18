import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export function createAppendixSceneAssets(parent,{onStatus=()=>{}}={}){
 const root=new T.Group();root.name='Lux3D_laparoscopy_scene_assets';parent.add(root);const models={},errors=[],loader=new GLTFLoader();let disposed=false;
 const ready=Promise.all(['field','specimen-bag','grasper'].map(name=>new Promise(resolve=>loader.load(new URL(import.meta.env.BASE_URL+'models/lux3d-appendix/scene/'+name+'.glb',document.baseURI).href,g=>{
  if(disposed){dispose(g.scene);resolve(false);return;}
  const group=new T.Group();group.name='Lux3D_'+name;group.add(g.scene);root.add(group);models[name]=group;group.visible=false;
  if(name==='specimen-bag')group.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){m.transparent=true;m.opacity=.28;m.depthWrite=false;m.side=T.DoubleSide;m.roughness=.28;}});
  onStatus('已载入 Lux3D '+({'field':'腹腔环境','specimen-bag':'取物袋','grasper':'抓持钳'}[name]));resolve(true);
 },undefined,()=>{errors.push(name);resolve(false);}))))
 function update({step,progress,detail,study,anatomy}){
  root.visible=detail&&!study;
  const field=models.field;if(field){field.visible=true;field.position.set(0,-.05,-.40);field.scale.set(2.8,2.35,1.25);}
  if(!anatomy?.loaded)return;
  const box=anatomy.bounds('appendix');if(box.isEmpty())return;const center=parent.worldToLocal(box.getCenter(new T.Vector3())),size=box.getSize(new T.Vector3());
  const bag=models['specimen-bag'];if(bag){bag.visible=step===3&&progress>0&&progress<1;bag.position.copy(center);bag.position.y-=.10*(1-Math.min(progress/.3,1));bag.position.z+=.08;bag.scale.set(Math.max(.35,size.x*.85),Math.max(.6,size.y*.75),Math.max(.25,size.z*.8));bag.rotation.z=-.18;}
  const grasper=models.grasper;if(grasper){grasper.visible=progress>0&&progress<1&&[1,2,3,4].includes(step);const tip=center.clone();tip.x-=.06;tip.y+=.32;tip.z+=.12;grasper.position.copy(tip);grasper.rotation.set(0,0,Math.PI*.70);grasper.scale.setScalar(.72);if(step===2)grasper.position.x-=progress*.25;}
 }
 return {ready,update,get models(){return models;},snapshot(){return {loaded:Object.keys(models),errors:[...errors]};},dispose(){disposed=true;dispose(root);root.removeFromParent();}};
}
function dispose(root){const maps=new Set(),materials=new Set(),geometries=new Set();root.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])if(m){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)maps.add(value);}});maps.forEach(m=>m.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());}
