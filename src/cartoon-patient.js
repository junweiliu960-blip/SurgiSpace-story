import * as T from 'three';
export function createCartoonPatient({young=false}={}){
 const root=new T.Group();root.name='Cartoon_Seated_Patient';
 const skin=new T.MeshStandardMaterial({color:'#d7aa89',roughness:.85}),suit=new T.MeshStandardMaterial({color:young?'#698585':'#394e54'}),dark=new T.MeshStandardMaterial({color:'#263635'}),hair=new T.MeshStandardMaterial({color:young?'#302d2b':'#88877d'});
 function ellipsoid(parent,xyz,scale,material){const m=new T.Mesh(new T.SphereGeometry(1,20,16),material);m.position.set(...xyz);m.scale.set(...scale);parent.add(m);return m;}
 ellipsoid(root,[0,.91,0],[.23,.34,.15],suit);const head=new T.Group();head.position.set(0,1.38,.01);root.add(head);ellipsoid(head,[0,0,0],[.17,.20,.15],skin);ellipsoid(head,[0,.13,-.015],[.173,.08,.15],hair);
 for(const x of [-.059,.059]){ellipsoid(head,[x,.02,.143],[.019,.022,.009],dark);ellipsoid(head,[x,.064,.143],[.034,.009,.008],hair);}ellipsoid(head,[0,-.03,.15],[.029,.033,.03],skin);ellipsoid(head,[0,-.087,.137],[.04,.008,.008],dark);
 for(const side of [-1,1]){ellipsoid(root,[side*.25,.87,.10],[.068,.22,.068],suit);ellipsoid(root,[side*.24,.69,.25],[.065,.065,.18],suit);ellipsoid(root,[side*.22,.69,.40],[.06,.045,.075],skin);ellipsoid(root,[side*.12,.60,.22],[.10,.10,.30],dark);ellipsoid(root,[side*.12,.32,.46],[.075,.26,.075],dark);ellipsoid(root,[side*.12,.07,.52],[.09,.065,.17],dark);}
 // Chair faces the lower-left desk in the supplied artwork; hips rest on its existing seat.
 root.rotation.y=-.50;root.userData.head=head;return root;
}
