"""Artist-defined spatial/colour regions of one Lux3D source, not clinical segmentation."""
import bpy,bmesh,json,math,hashlib
from collections import Counter
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parents[1];work=root/'.local/appendix-lux3d';dest=root/'public/models/lux3d-appendix';images=root/'public/images/lux3d-appendix';dest.mkdir(exist_ok=True);images.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(work/'master.glb'))
objects=[o for o in bpy.context.scene.objects if o.type=='MESH'];points=[o.matrix_world@Vector(c)for o in objects for c in o.bound_box];low=Vector([min(v[i]for v in points)for i in range(3)]);high=Vector([max(v[i]for v in points)for i in range(3)]);center=(low+high)/2;scale=1.8/max(high-low)
for obj in objects:
 matrix=obj.matrix_world.copy()
 for v in obj.data.vertices:v.co=(matrix@v.co-center)*scale
 obj.parent=None;obj.matrix_world=Matrix.Identity(4)
def tube_distance(x,z):
 points=[(.06,-.06),(.18,-.31),(.31,-.48),(.52,-.59),(.68,-.74),(.82,-.76)];dist=99
 for (ax,az),(bx,bz) in zip(points,points[1:]):
  dx=bx-ax;dz=bz-az;t=max(0,min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));dist=min(dist,math.hypot(x-ax-t*dx,z-az-t*dz))
 return dist
parts={key:[]for key in ('cecum','ileum','appendix','mesoappendix')};counts={key:0 for key in parts}
for obj in objects:
 mesh=obj.data;uv=mesh.uv_layers.active;cache={}
 for material in mesh.materials:
  node=next((n for n in material.node_tree.nodes if n.type=='TEX_IMAGE'and n.image),None)
  if node:cache[material.name]=(node.image.size[:],list(node.image.pixels[:]))
 assignment=[]
 for polygon in mesh.polygons:
  c=polygon.center;verts=[mesh.vertices[i].co for i in polygon.vertices];c=sum(verts,Vector())/len(verts);x,y,z=c
  colour=(.7,.4,.35)
  if uv and mesh.materials[polygon.material_index].name in cache:
   size,pixels=cache[mesh.materials[polygon.material_index].name];u=sum(uv.data[i].uv.x for i in polygon.loop_indices)/len(polygon.loop_indices);v=sum(uv.data[i].uv.y for i in polygon.loop_indices)/len(polygon.loop_indices);px=min(size[0]-1,max(0,int(u*size[0])));py=min(size[1]-1,max(0,int(v*size[1])));offset=(py*size[0]+px)*4;colour=pixels[offset:offset+3]
  r,g,b=colour
  if x>.005 and z>.005+.43*x:key='ileum'
  elif x>.02 and z<.13 and g>b*1.13:key='mesoappendix'
  elif x>.015 and z<.10 and tube_distance(x,z)<.135:key='appendix'
  elif x>.03 and z<.28:key='mesoappendix'
  else:key='cecum'
  assignment.append(key)
 # Join UV seam vertices before connected-region cleanup. Small colour islands
 # are absorbed by their neighbours so vessels do not float off with another part.
 vertex_ids={};canonical=[]
 for vertex in mesh.vertices:
  coordinate=tuple(round(float(v),4)for v in vertex.co);canonical.append(vertex_ids.setdefault(coordinate,len(vertex_ids)))
 edges={};adjacency=[set()for p in mesh.polygons]
 for polygon in mesh.polygons:
  ids=[canonical[v]for v in polygon.vertices]
  for a,b in zip(ids,ids[1:]+ids[:1]):edges.setdefault(tuple(sorted((a,b))),[]).append(polygon.index)
 for faces in edges.values():
  if len(faces)>1:
   for face in faces:adjacency[face].update(v for v in faces if v!=face)
 for label in parts:
  remaining={i for i,key in enumerate(assignment)if key==label};components=[]
  while remaining:
   seed=remaining.pop();component=[seed];queue=[seed]
   while queue:
    face=queue.pop();neighbours=adjacency[face]&remaining
    for neighbour in neighbours:remaining.remove(neighbour);component.append(neighbour);queue.append(neighbour)
   components.append(component)
  components.sort(key=len,reverse=True)
  for component in components[1:]:
   neighbours=Counter(assignment[n]for face in component for n in adjacency[face]if assignment[n]!=label)
   target=neighbours.most_common(1)[0][0]if neighbours else ('mesoappendix'if label=='appendix'else'cecum')
   for face in component:assignment[face]=target
 for key in parts:counts[key]+=assignment.count(key)
 for key in parts:
  duplicate=obj.copy();duplicate.data=mesh.copy();bpy.context.collection.objects.link(duplicate);duplicate.name=key
  bm=bmesh.new();bm.from_mesh(duplicate.data);bm.faces.ensure_lookup_table();remove=[f for f in bm.faces if assignment[f.index]!=key];bmesh.ops.delete(bm,geom=remove,context='FACES_ONLY');loose=[v for v in bm.verts if not v.link_faces];bmesh.ops.delete(bm,geom=loose,context='VERTS');bm.to_mesh(duplicate.data);bm.free();duplicate.data.update()
  duplicate['semantic_group']=key;duplicate['segmentation_method']='artist-defined spatial and texture regions; not clinical segmentation';parts[key].append(duplicate)
 bpy.data.objects.remove(obj,do_unlink=True)
if any(counts[k]<100 for k in parts):raise RuntimeError('Insufficient geometry for one of the named regions; inspect before use')
cover=parts['mesoappendix'][0].copy();cover.data=cover.data.copy();bpy.context.collection.objects.link(cover);cover.name='OrganCover';cover.location=Vector((-.16,-.15,.07));cover.scale=(1.1,1,.72);cover['coveredScale']=[1.1,1,.72]
material=bpy.data.materials.new('OrganCover_teaching_fat');material.diffuse_color=(.72,.48,.24,1);material.use_nodes=True;shader=material.node_tree.nodes.get('Principled BSDF');shader.inputs['Base Color'].default_value=(.72,.48,.24,1);shader.inputs['Roughness'].default_value=.65;cover.data.materials.clear();cover.data.materials.append(material)
def export(name,covered=False,layers=False):
 for meshes in parts.values():
  for obj in meshes:obj.location=(0,0,0)
 if layers:
  for obj in parts['appendix']:obj.location=(.55,-.10,-.05)
  for obj in parts['mesoappendix']:obj.location=(.30,-.05,.02)
 cover.hide_render=not covered;cover.scale=(1.1,1,.72)if covered else (0,0,0)
 # Keep cover in complete GLB so the browser can switch states without loading another asset.
 bpy.ops.export_scene.gltf(filepath=str(dest/name),export_format='GLB',export_yup=True,export_extras=True,export_materials='EXPORT',export_image_format='AUTO')
export('02-complete.glb');export('01-covered.glb',covered=True);export('03-layers.glb',layers=True)
for meshes in parts.values():
 for obj in meshes:obj.location=(0,0,0)
cover.hide_render=True;cover.scale=(0,0,0)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.device='CPU';scene.render.resolution_x=1000;scene.render.resolution_y=1000;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.6,.7,.72,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
for loc,power,size in [((2,-3,4),450,4),((-3,-1,2),300,3),((1,3,3),350,3)]:
 data=bpy.data.lights.new('Area','AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new('Area',data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',data);scene.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO';data.ortho_scale=2.35;camera.location=(0,-4,.4);camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler()
for name in ('02-complete','01-covered','03-layers'):
 cover.hide_render=name!='01-covered';cover.scale=(1.1,1,.72)if name=='01-covered'else(0,0,0)
 if name=='03-layers':
  for obj in parts['appendix']:obj.location=(.55,-.10,-.05)
  for obj in parts['mesoappendix']:obj.location=(.30,-.05,.02)
  camera.location=(.2,-4,.4);camera.rotation_euler=(Vector((.2,0,0))-camera.location).to_track_quat('-Z','Y').to_euler();data.ortho_scale=2.8
 scene.render.filepath=str(images/(name+'.png'));bpy.ops.render.render(write_still=True)
for meshes in parts.values():
 for obj in meshes:obj.location=(0,0,0)
cover.hide_render=True;bpy.ops.wm.save_as_mainfile(filepath=str(work/'appendix-master.blend'),compress=True)
job=json.loads((work/'job.json').read_text());provenance={'taskId':job['taskId'],'provider':'Aholo Lux3D','region':'cn','version':'G1','inputMethod':'text-to-3D','prompt':job['prompt'],'targetFaces':100000,'sourceFaces':sum(counts.values()),'semanticFaceCounts':counts,'sourceSha256':hashlib.sha256((work/'master.glb').read_bytes()).hexdigest(),'derivation':'All three states derive from one generated mesh. Spatial/texture regions manually defined for game animation; vessels remain integrated with mesoappendix. No clinical segmentation or free cutting.','medicalReview':'pending','outputs':{p.name:hashlib.sha256(p.read_bytes()).hexdigest()for p in dest.glob('*.glb')}}
(dest/'provenance.json').write_text(json.dumps(provenance,indent=2));print(json.dumps({'prepared':True,'faces':counts,'taskId':job['taskId']}))
