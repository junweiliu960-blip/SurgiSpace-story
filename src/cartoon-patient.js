import * as T from 'three';
import {attachLuxLin} from './lux3d-lin.js';
import {attachLuxZhou} from './lux3d-zhou.js';
// Compatibility export for existing stages; renders Lux3D only.
export function createCartoonPatient({young=false}={}){
 const root=new T.Group();root.name=young?'Zhou_Lux3D_Seated':'Lin_Lux3D_Seated';
 const head=new T.Group();head.position.set(0,1.38,0);root.add(head);root.userData.head=head;root.rotation.y=-.80;
 if(young)attachLuxZhou(root);else attachLuxLin(root);return root;
}
