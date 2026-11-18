import * as T from 'three';
import {photoRect} from './photo-layout.js';
// Match the mattress support plane, not two arbitrary points on the body's upper surface.
// The registered skin's back is at y≈.835; the mattress has space around head, arms and feet.
export const BED_REGISTRATION={
 supportY:.835,halfWidth:.43,halfLength:1.02,
 imageCorners:[[1097/1672,436/941],[1227/1672,457/941],[786/1672,647/941],[579/1672,585/941]],
 camera:[2.9343355392383064,1.9570054496345861,2.6990492252653335],
 roll:-.09413423785736919,zoom:.9344396455418195,pan:[.07027210519208754,.048484048261413226]
};
export function fitPatientToBed(camera,canvas){
 const w=canvas.clientWidth||1,h=canvas.clientHeight||1,r=photoRect(w,h),b=BED_REGISTRATION;
 camera.clearViewOffset();camera.aspect=w/h;camera.fov=37;camera.up.set(0,1,0);camera.position.set(...b.camera);camera.lookAt(0,b.supportY,0);camera.rotateZ(b.roll);camera.zoom=b.zoom*r.height/h;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 camera.setViewOffset(w,h,-b.pan[0]*r.width,(h-r.height)/2-b.pan[1]*r.height,w,h);camera.updateMatrixWorld();
}

export function addBedContactShadow(parent){const b=BED_REGISTRATION,plane=new T.Mesh(new T.PlaneGeometry(b.halfWidth*2,b.halfLength*2),new T.ShadowMaterial({opacity:.26,depthWrite:false}));plane.name='Artwork_Mattress_Shadow_Only';plane.rotation.x=-Math.PI/2;plane.position.y=b.supportY-.002;plane.receiveShadow=true;parent.add(plane);return plane;}
