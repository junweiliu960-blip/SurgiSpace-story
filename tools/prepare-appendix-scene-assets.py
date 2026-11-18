import bpy,json,sys,hashlib,math
from pathlib import Path
from mathutils import Vector,Matrix
root=Path(__file__).resolve().parents[1];work=root/'.local/appendix-scene-assets';dest=root/'public/models/lux3d-appendix/scene';images=root/'public/images/lux3d-appendix/scene';dest.mkdir(parents=True,exist_ok=True);images.mkdir(parents=True,exist_ok=True)
names=sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else['field','specimen-bag','grasper'];jobs=json.loads((work/'jobs.json').read_text());provenance={}
for name in names:
 source=work/(name+'.glb')
 if not source.exists():continue
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
 for obj in meshes:
  matrix=obj.matrix_world.copy()
  for v in obj.data.vertices:v.co=matrix@v.co
  obj.parent=None;obj.matrix_world=Matrix.Identity(4)
 def bounds():
  points=[v.co for o in meshes for v in o.data.vertices];return Vector([min(p[i]for p in points)for i in range(3)]),Vector([max(p[i]for p in points)for i in range(3)])
 lo,hi=bounds()
 if name=='grasper':
  axis=max(range(3),key=lambda i:hi[i]-lo[i])
  if axis!=2:
   direction=Vector(tuple(1 if i==axis else 0 for i in range(3)));rotation=direction.rotation_difference(Vector((0,0,1))).to_matrix()
   for o in meshes:
    for v in o.data.vertices:v.co=rotation@v.co
  lo,hi=bounds();span=hi.z-lo.z
  def end_width(top):
   points=[v.co for o in meshes for v in o.data.vertices if(v.co.z>hi.z-span*.12 if top else v.co.z<lo.z+span*.12)]
   return max(max(v.x for v in points)-min(v.x for v in points),max(v.y for v in points)-min(v.y for v in points))
  if end_width(True)>end_width(False):
   for o in meshes:
    for v in o.data.vertices:v.co=Matrix.Rotation(math.pi,3,'X')@v.co
  lo,hi=bounds()
 origin=(lo+hi)/2
 if name=='grasper':origin.z=hi.z
 scale=(1.8/(hi.z-lo.z)if name=='grasper'else 1.5/(hi.z-lo.z)if name=='specimen-bag'else 1/max(hi.x-lo.x,hi.z-lo.z))
 for i,obj in enumerate(meshes):
  obj.name='Lux3D_'+name.replace('-','_')+'_'+str(i)
  for vertex in obj.data.vertices:vertex.co=(vertex.co-origin)*scale
  for poly in obj.data.polygons:poly.use_smooth=True
  obj['source_task_id']=jobs[name]['taskId'];obj['role']=name;obj.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(dest/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_extras=True,export_materials='EXPORT')
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.device='CPU';scene.render.resolution_x=850;scene.render.resolution_y=850;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
 scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
 for loc,power,size in [((2,-3,4),450,4),((-3,-1,2),300,3),((1,3,3),350,3)]:
  data=bpy.data.lights.new('Area','AREA');data.energy=power;data.size=size;o=bpy.data.objects.new('Area',data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
 data=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',data);scene.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO';data.ortho_scale=2.1 if name!='field'else 1.35
 target=Vector((0,0,-.9))if name=='grasper'else Vector()
 for view,position in [('front',(0,-4,.35)),('side',(4,0,.35))]:
  camera.location=Vector(position)+target;camera.rotation_euler=(target-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(images/(name+'-'+view+'.png'));bpy.ops.render.render(write_still=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(work/(name+'-prepared.blend')),compress=True)
 provenance[name]={'taskId':jobs[name]['taskId'],'provider':'Aholo Lux3D','version':'G1','consumedCredits':jobs[name].get('consumedCredits'),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'outputSha256':hashlib.sha256((dest/(name+'.glb')).read_bytes()).hexdigest(),'normalization':{'originBlender':list(origin),'scale':scale},'prompt':jobs[name]['prompt']}
path=dest/'provenance.json';previous=json.loads(path.read_text())if path.exists()else{};previous.update(provenance);path.write_text(json.dumps(previous,indent=2));print(json.dumps({'prepared':list(provenance)}))
