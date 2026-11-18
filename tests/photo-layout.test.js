import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {photoRect,photoBounds,PHOTO_TARGETS,fitCameraToPhoto} from '../src/photo-layout.js';
import {fitPatientToBed,BED_REGISTRATION} from '../src/bed-registration.js';

test('mattress registration preserves the same support plane and body footprint across window shapes',()=>{
 const footprint=[[0,.835,-.86],[0,.835,.86],[-.334,.835,-.1],[.334,.835,-.1]];
 const expected=[[1125.444251,455.619562],[727.729422,595.563781],[906.234913,495.358378],[1053.748272,522.699296]];
 for(const [width,height]of [[390,360],[714,580],[1280,656],[720,960]]){
  const camera=new T.PerspectiveCamera(),canvas={clientWidth:width,clientHeight:height},r=photoRect(width,height);fitPatientToBed(camera,canvas);
  footprint.forEach((v,i)=>{const p=new T.Vector3(...v).project(camera),x=(p.x+1)*width/2,y=(1-p.y)*height/2;assert(Math.abs(x-(r.left+expected[i][0]/1672*r.width))<.01);assert(Math.abs(y-expected[i][1]/941*r.height)<.01);});
  const b=BED_REGISTRATION,world=[[-b.halfWidth,b.supportY,-b.halfLength],[b.halfWidth,b.supportY,-b.halfLength],[b.halfWidth,b.supportY,b.halfLength],[-b.halfWidth,b.supportY,b.halfLength]];
  world.forEach((v,i)=>{const p=new T.Vector3(...v).project(camera);assert(Math.abs(((p.x+1)*width/2-r.left)/r.width-b.imageCorners[i][0])<.021);assert(Math.abs((1-p.y)*height/2/r.height-b.imageCorners[i][1])<.003);});
 }
});
test('artwork hotspots follow the same contained image on portrait and landscape screens',()=>{
 for(const [width,height] of [[390,360],[699,360],[1280,656],[720,960]]){
  const r=photoRect(width,height);assert(r.width<=width+.001&&r.height<=height+.001);assert.equal(r.top,0);
  for(const target of Object.values(PHOTO_TARGETS)){const box=photoBounds(width,height,target);assert(box.left>=r.left);assert(box.top>=0);assert(box.left+box.width<=r.left+r.width);assert(box.top+box.height<=r.height);}
 }
});
test('patient head and feet remain anchored to the artwork bed after a resize',()=>{
 for(const [width,height] of [[390,360],[1280,656]]){
  const camera=new T.PerspectiveCamera(37,width/height,.005,30);camera.position.set(1.65,2.65,2.3);camera.lookAt(0,.95,-.05);
  const a=new T.Vector3(0,1,-.72),b=new T.Vector3(0,1,.82),uvA=[.685,.49],uvB=[.41,.64];
  fitCameraToPhoto(camera,{clientWidth:width,clientHeight:height},a,b,uvA,uvB);const r=photoRect(width,height);
  for(const [point,uv] of [[a,uvA],[b,uvB]]){const p=point.clone().project(camera);assert(Math.abs((p.x+1)*width/2-(r.left+uv[0]*r.width))<.01);assert(Math.abs((1-p.y)*height/2-uv[1]*r.height)<.01);}
 }
});
