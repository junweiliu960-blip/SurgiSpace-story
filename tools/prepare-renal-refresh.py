"""Prepare approved Lux3D renal refresh without overwriting prior assets."""
import bpy,bmesh,json,math,hashlib,shutil,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parents[1];work=root/'.local/renal-refresh';dest=root/'public/models/lux3d-renal-refresh';dest.mkdir(parents=True,exist_ok=True);jobs=json.loads((work/'jobs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();assert all(jobs[k].get('downloaded')for k in ['bed','kidney','cutaway'])
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(work/'bed.glb'));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:o.data.transform(o.matrix_world);o.parent=None;o.matrix_world=Matrix.Identity(4)
points=np.array([list(v.co)for o in meshes for v in o.data.vertices]);values,vectors=np.linalg.eigh(np.cov(points[:,:2].T));axis=vectors[:,np.argmax(values)];rot=Matrix.Rotation(math.atan2(axis[0],axis[1]),3,'Z')
for o in meshes:
 for v in o.data.vertices:v.co=rot@v.co
points=np.array([list(v.co)for o in meshes for v in o.data.vertices]);top=points[points[:,2]>np.quantile(points[:,2],.97)]
if top[:,1].mean()<0:
 for o in meshes:
  for v in o.data.vertices:v.co=Matrix.Rotation(math.pi,3,'Z')@v.co
points=np.array([list(v.co)for o in meshes for v in o.data.vertices]);lo=points.min(0);hi=points.max(0);span=hi-lo;factor=np.array([1.24/span[0],2.12/span[1],1.15/span[2]])
for i,o in enumerate(meshes):
 for v in o.data.vertices:v.co=Vector(tuple((np.array(v.co)-np.array([(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]]))*factor))
 o.name='Lin_Lux3D_Operating_Bed_Ensemble';o['taskId']=jobs['bed']['taskId']
 for f in o.data.polygons:f.use_smooth=True
# Cover the generator's extra left-side skin patch with sterile cloth; keep the right window.
cloth=bpy.data.materials.new('Repaired_Left_Drape');cloth.use_nodes=True;cloth.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(.035,.25,.25,1);cloth.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.95
for o in meshes:
 uv=o.data.uv_layers.active;cache={}
 for m in o.data.materials:
  n=next((n for n in m.node_tree.nodes if n.type=='TEX_IMAGE'and n.image),None)
  if n:cache[m.name]=(n.image.size[:],np.array(n.image.pixels[:],dtype=np.float32))
 slot=len(o.data.materials);o.data.materials.append(cloth)
 for f in o.data.polygons:
  c=sum((o.data.vertices[j].co for j in f.vertices),Vector())/len(f.vertices)
  if not(.03<c.x<.30 and -.30<c.y<.25 and c.z>.90):continue
  m=o.data.materials[f.material_index]
  if not uv or m.name not in cache:continue
  size,pixels=cache[m.name];p=sum((uv.data[j].uv for j in f.loop_indices),Vector((0,0)))/len(f.loop_indices);x=min(size[0]-1,max(0,int(p.x*size[0])));y=min(size[1]-1,max(0,int(p.y*size[1])));r,g,b=pixels[(y*size[0]+x)*4:(y*size[0]+x)*4+3]
  if r>g*1.06 and r>b*1.12:f.material_index=slot
bpy.ops.export_scene.gltf(filepath=str(dest/'bed.glb'),export_format='GLB',export_yup=True,export_extras=True)
for name in ['kidney','cutaway']:shutil.copyfile(work/(name+'.glb'),dest/(name+'.glb'))
# Main-line derivative: shorten generated vessel stems at the registered renal ports.
all_ports={}
for renal_kind in ['kidney','cutaway']:
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(work/(renal_kind+'.glb')));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];allpts=np.array([list(o.matrix_world@v.co)for o in meshes for v in o.data.vertices]);low=allpts.min(0);high=allpts.max(0);centre=(low+high)/2;length=max(high-low);ports={};allobjects=[]
 for o in meshes:
  o.data.transform(o.matrix_world);o.parent=None;o.matrix_world=Matrix.Identity(4)
  for v in o.data.vertices:v.co=(v.co-Vector(centre))/length
  uv=o.data.uv_layers.active;cache={}
  for m in o.data.materials:
   n=next((n for n in m.node_tree.nodes if n.type=='TEX_IMAGE'and n.image),None)
   if n:cache[m.name]=(n.image.size[:],np.array(n.image.pixels[:],dtype=np.float32))
  labels=[]
  for f in o.data.polygons:
   c=sum((o.data.vertices[j].co for j in f.vertices),Vector())/len(f.vertices);color=[.6,.3,.3]
   m=o.data.materials[f.material_index]
   if uv and m.name in cache:
    size,pixels=cache[m.name];p=sum((uv.data[j].uv for j in f.loop_indices),Vector((0,0)))/len(f.loop_indices);x=min(size[0]-1,max(0,int(p.x*size[0])));y=min(size[1]-1,max(0,int(p.y*size[1])));color=pixels[(y*size[0]+x)*4:(y*size[0]+x)*4+3]
   r,g,b=color
   label='vein'if c.x>.03 and b>r*1.12 and b>g*1.03 else 'artery'if c.x>.03 and -.12<c.z<.18 and r>g*1.3 and r>b*1.25 else 'body';labels.append(label)
  for label in ['body','artery','vein']:
   obj=o.copy();obj.data=o.data.copy();bpy.context.collection.objects.link(obj);bm=bmesh.new();bm.from_mesh(obj.data);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[f for f in bm.faces if labels[f.index]!=label],context='FACES')
   if label in ['artery','vein']:
    cut=.115264088 if label=='artery'else .152833638
    result=bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=(cut,0,0),plane_no=(1,0,0),clear_outer=True,clear_inner=False)
    ring=[v for v in bm.verts if abs(v.co.x-cut)<.00002]
    if ring:
     c=sum((v.co for v in ring),Vector())/len(ring)
     if renal_kind=='cutaway':
      target=all_ports['kidney'][label];delta=Vector((0,-target[2]-c.y,target[1]-c.z))
      for vertex in bm.verts:vertex.co+=delta*max(0,min(1,(vertex.co.x-cut+.08)/.08))
      c=Vector((cut,-target[2],target[1]))
     ports[label]=[c.x,c.z,-c.y]
    edges=[e for e in result['geom_cut']if isinstance(e,bmesh.types.BMEdge)and e.is_boundary]
    if edges:
     try:bmesh.ops.holes_fill(bm,edges=edges,sides=0)
     except:pass
   bm.to_mesh(obj.data);bm.free();obj.name='Lux3D_Right_Renal_'+label;allobjects.append(obj)
  bpy.data.objects.remove(o,do_unlink=True)
 bpy.ops.export_scene.gltf(filepath=str(dest/(renal_kind+'-registered.glb')),export_format='GLB',export_yup=True,export_extras=True)
 all_ports[renal_kind]=ports
record={'provider':'Aholo Lux3D','version':'G1','newGenerationTasks':3,'assets':{},'bedRegistration':{'widthIncludingArmSupports':1.24,'length':2.12,'height':1.15,'head':'negative Z','baseY':0},'renalPortsNormalized':all_ports['kidney'],'cutawayPortsNormalized':all_ports['cutaway'],'vascularAuthority':'Existing BodyParts3D abdominal aorta and inferior vena cava; generated artery/vein stems trimmed and bridged to registered ports.','preservedAdrenal':'Separate existing Lux3D adrenal asset'}
for name in ['bed','kidney','cutaway']:
 record['assets'][name]={'taskId':jobs[name]['taskId'],'sourceSha256':sha(work/(name+'.glb')),'outputSha256':sha(dest/(name+'.glb')),'referenceSha256':sha(root/'public/images/lux3d-renal-refresh'/(name+'-reference.png')),'bytes':(dest/(name+'.glb')).stat().st_size}
record['registeredCutawaySha256']=sha(dest/'cutaway-registered.glb');record['registeredKidneySha256']=sha(dest/'kidney-registered.glb');(dest/'provenance.json').write_text(json.dumps(record,indent=2));print(json.dumps(record))
