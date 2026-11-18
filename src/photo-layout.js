// Coordinates refer to the existing 1672×941 room artwork, never a new room model.
export const ROOM_SIZE={width:1672,height:941};
export const PHOTO_TARGETS={
 computer:{left:224/1672,top:323/941,width:288/1672,height:207/941},
 folder:{left:178/1672,top:578/941,width:305/1672,height:90/941},
 bed:{left:575/1672,top:420/941,width:663/1672,height:240/941},
 monitor:{left:1365/1672,top:254/941,width:132/1672,height:90/941},
 instruments:{left:103/1672,top:510/941,width:362/1672,height:123/941},
};
export function photoRect(width,height){const scale=Math.min(width/ROOM_SIZE.width,height/ROOM_SIZE.height);return {left:(width-ROOM_SIZE.width*scale)/2,top:0,width:ROOM_SIZE.width*scale,height:ROOM_SIZE.height*scale};}
export function photoBounds(width,height,bounds){const r=photoRect(width,height);return {left:r.left+bounds.left*r.width,top:r.top+bounds.top*r.height,width:bounds.width*r.width,height:bounds.height*r.height};}
export function normalizedPhotoBounds(canvas,target){const w=canvas.clientWidth||1,h=canvas.clientHeight||1,r=photoBounds(w,h,PHOTO_TARGETS[target]);return {left:r.left/w,top:r.top/h,width:r.width/w,height:r.height/h};}
export const OFFICE_TARGETS={computer:{left:45/1672,top:373/941,width:405/1672,height:371/941},phone:{left:1290/1672,top:720/941,width:205/1672,height:153/941},bills:{left:805/1672,top:682/941,width:312/1672,height:105/941}};
export function bindPhotoHotspot(button,host,target,targets=PHOTO_TARGETS){
 const update=()=>{const r=photoBounds(host.clientWidth,host.clientHeight,targets[target]);for(const k of ['left','top','width','height'])button.style[k]=r[k]+'px';};
 const observer=new ResizeObserver(update);observer.observe(host);update();return ()=>observer.disconnect();
}
export function mountPhotoHotspots(host,kind,handlers){
 const names=kind==='office'?{computer:'查看办公室电脑',phone:'接听手机',bills:'查看账单'}:kind==='clinic'?{computer:'查看电脑'}:{bed:'查看患者与术区',monitor:'查看监护信息',instruments:'查看器械台'};
 const stops=[],buttons=[];
 for(const [target,name] of Object.entries(names)){
  const button=document.createElement('button');button.className='photo-hotspot';button.dataset.photoTarget=target;button.setAttribute('aria-label',name);button.title=name;
  const text=document.createElement('span');text.textContent=name;button.append(text);button.onclick=()=>handlers[target]?.();host.append(button);buttons.push(button);stops.push(bindPhotoHotspot(button,host,target,kind==='office'?OFFICE_TARGETS:PHOTO_TARGETS));
 }
 return ()=>{stops.forEach(stop=>stop());buttons.forEach(button=>button.remove());};
}
export function placePhotoObject(object,uv,height,camera,canvas,{sourceHeight=1,baseY=0}={}){
 const w=canvas.clientWidth||1,h=canvas.clientHeight||1,r=photoRect(w,h),x=r.left+uv[0]*r.width,y=r.top+uv[1]*r.height;
 camera.updateMatrixWorld();const point=camera.position.clone().set(x/w*2-1,1-y/h*2,0).unproject(camera),dir=point.sub(camera.position).normalize();
 const distance=-camera.position.z/dir.z;object.position.copy(camera.position).addScaledVector(dir,distance);
 const worldHeight=2*Math.abs(camera.position.z)*Math.tan(camera.fov*Math.PI/360)/camera.zoom;
 const scale=height*r.height/h*worldHeight/sourceHeight;object.scale.setScalar(scale);object.position.y-=baseY*scale;
}
// The seated body's hip underside meets the existing cushion; its soles meet
// the floor in front of that chair. Both points scale with the room artwork.
export function seatClinicPatient(object,camera,canvas){
 object.rotation.y=-.80;
 placePhotoObject(object,[.655,.90],.55,camera,canvas,{sourceHeight:1.58});
}
export function fitCameraToPhoto(camera,canvas,a,b,uvA,uvB){
 const w=canvas.clientWidth||1,h=canvas.clientHeight||1,r=photoRect(w,h);
 camera.clearViewOffset();camera.zoom=1;camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const pa=a.clone().project(camera),pb=b.clone().project(camera),dx=(pb.x-pa.x)*w/2,dy=(pb.y-pa.y)*h/2;
 const tx=(uvB[0]-uvA[0])*r.width,ty=-(uvB[1]-uvA[1])*r.height;
 camera.rotateZ(Math.atan2(dy,dx)-Math.atan2(ty,tx));camera.zoom=Math.hypot(tx,ty)/Math.max(1,Math.hypot(dx,dy));camera.updateProjectionMatrix();camera.updateMatrixWorld();
 const p=a.clone().project(camera),targetX=(r.left+uvA[0]*r.width)/w*2-1,targetY=1-(r.top+uvA[1]*r.height)/h*2;
 camera.setViewOffset(w,h,(p.x-targetX)*w/2,(targetY-p.y)*h/2,w,h);camera.updateMatrixWorld();
}
