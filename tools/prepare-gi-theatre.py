"""Normalize generated bed assembly to the existing room registration; retain GI source."""
import bpy,bmesh,json,math,hashlib,shutil,numpy as np
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parents[1];work=root/'.local/gi-theatre';dest=root/'public/models/lux3d-gi-theatre';dest.mkdir(parents=True,exist_ok=True)
jobs=json.loads((work/'jobs.json').read_text());sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert all(jobs[k].get('downloaded')for k in ['bed','gi'])
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(work/'bed.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
for o in meshes:o.data.transform(o.matrix_world);o.parent=None;o.matrix_world=Matrix.Identity(4)
points=np.array([list(v.co)for o in meshes for v in o.data.vertices]);cov=np.cov(points[:,:2].T);values,vectors=np.linalg.eigh(cov);axis=vectors[:,np.argmax(values)];angle=math.atan2(axis[0],axis[1]);rotation=Matrix.Rotation(angle,3,'Z')
for o in meshes:
 for v in o.data.vertices:v.co=rotation@v.co
points=np.array([list(v.co)for o in meshes for v in o.data.vertices]);top=points[points[:,2]>np.quantile(points[:,2],.96)]
if top[:,1].mean()<0:
 for o in meshes:
  for v in o.data.vertices:v.co=Matrix.Rotation(math.pi,3,'Z')@v.co
points=np.array([list(v.co)for o in meshes for v in o.data.vertices]);lo=points.min(axis=0);hi=points.max(axis=0);span=hi-lo;scale=np.array([.92/span[0],2.12/span[1],1.15/span[2]])
for i,o in enumerate(meshes):
 for v in o.data.vertices:v.co=Vector(tuple((np.array(v.co)-np.array([(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,lo[2]]))*scale))
 o.name='Lux3D_Operating_Assembly_'+str(i);o['role']='patient_bed_and_sterile_drape';o['taskId']=jobs['bed']['taskId']
 for f in o.data.polygons:f.use_smooth=True

# Reuse Zhou's completed Lux3D identity for the head omitted by the bed generator.
before=set(bpy.context.scene.objects);bpy.ops.import_scene.gltf(filepath=str(root/'public/models/lux3d-zhou/zhou-ill.glb'))
head=next(o for o in bpy.context.scene.objects if o not in before and o.type=='MESH');head.data.transform(head.matrix_world);head.parent=None;head.matrix_world=Matrix.Identity(4)
bm=bmesh.new();bm.from_mesh(head.data);bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=(0,0,.25),plane_no=(0,0,1),clear_inner=True,clear_outer=False);bm.to_mesh(head.data);bm.free()
coords=np.array([list(v.co)for v in head.data.vertices]);low=coords.min(axis=0);high=coords.max(axis=0);centre=(low+high)/2;factor=.30/(high[2]-low[2]);rotation=Matrix.Rotation(-math.pi/2,3,'X')
for v in head.data.vertices:v.co=rotation@Vector(tuple((np.array(v.co)-centre)*factor))+Vector((0,.84,.96))
head.name='Zhou_Lux3D_Head_Reused';head['source']='models/lux3d-zhou/zhou-ill.glb'
# Small skin opening and three port markers follow the existing cloth surface.
from mathutils.bvhtree import BVHTree
surface=BVHTree.FromPolygons([v.co.copy()for v in meshes[0].data.vertices],[list(f.vertices)for f in meshes[0].data.polygons])
def surface_z(x,y):
 hit=surface.ray_cast(Vector((x,y,3)),Vector((0,0,-1)))[0];return hit.z+.003 if hit else 1.05
skin=bpy.data.materials.new('Abdominal_Skin_Window');skin.diffuse_color=(.52,.32,.23,1);skin.use_nodes=True;skin.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=skin.diffuse_color;skin.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.8
window_y=-.08;window_z=max(surface_z(.13*math.cos(i*math.tau/48),window_y+.17*math.sin(i*math.tau/48))for i in range(48))+.008
points=[(0,window_y,window_z)]+[(.13*math.cos(i*math.tau/48),window_y+.17*math.sin(i*math.tau/48),window_z)for i in range(48)]
geo=bpy.data.meshes.new('Abdominal_Window');geo.from_pydata(points,[],[(0,i+1,(i+1)%48+1)for i in range(48)]);opening=bpy.data.objects.new('Abdominal_Skin_Window',geo);bpy.context.collection.objects.link(opening);geo.materials.append(skin)
for x,y in [(0,-.01),(.05,-.12),(-.05,-.12)]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=.004,location=(x,y,window_z+.002));port=bpy.context.object;port.name='Laparoscopic_Port_Marker';port.scale.z=.25;mat=bpy.data.materials.new('Port_Marker');mat.diffuse_color=(.08,.025,.02,1);port.data.materials.append(mat)

bpy.ops.export_scene.gltf(filepath=str(dest/'bed.glb'),export_format='GLB',export_yup=True,export_extras=True)
shutil.copyfile(work/'gi.glb',dest/'gi.glb')
record={'provider':'Aholo Lux3D','version':'G1','newGenerationTasks':2,'assets':{}}
for name in ['bed','gi']:
 record['assets'][name]={'taskId':jobs[name]['taskId'],'faceCountRequested':100000,'sourceSha256':sha(work/(name+'.glb')),'outputSha256':sha(dest/(name+'.glb')),'referenceSha256':sha(root/'public/images/lux3d-gi-theatre'/(name+'-reference.png')),'bytes':(dest/(name+'.glb')).stat().st_size}
record['reusedHead']={'source':'models/lux3d-zhou/zhou-ill.glb','sha256':sha(root/'public/models/lux3d-zhou/zhou-ill.glb')}
record['bedRegistration']={'width':.92,'length':2.12,'height':1.15,'head':'negative Z in game','base':'Y=0'}
record['localDetail']={'source':'models/lux3d-appendix/02-complete.glb','reuse':True}
(dest/'provenance.json').write_text(json.dumps(record,indent=2));print(json.dumps(record))
