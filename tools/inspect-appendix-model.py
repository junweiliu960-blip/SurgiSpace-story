import bpy,json,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];work=root/'.local/appendix-lux3d';out=work/'inspection';out.mkdir(exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(work/'master.glb'))
meshes=[o for o in bpy.context.scene.objects if o.type=='MESH']
points=[o.matrix_world@Vector(c) for o in meshes for c in o.bound_box];lo=Vector([min(p[i] for p in points)for i in range(3)]);hi=Vector([max(p[i] for p in points)for i in range(3)]);center=(lo+hi)/2;scale=1.8/max(hi-lo)
for o in list(bpy.context.scene.objects):
 if o.parent is None:o.location=(o.location-center)*scale;o.scale*=scale
info={'boundsBefore':[list(lo),list(hi)],'normalization':{'center':list(center),'scale':scale},'meshes':[{'name':o.name,'vertices':len(o.data.vertices),'polygons':len(o.data.polygons),'materials':[m.name for m in o.data.materials]}for o in meshes]}
(out/'info.json').write_text(json.dumps(info,indent=2))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.device='CPU';scene.render.resolution_x=900;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.6,.7,.72,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
for loc,power,size in [((2,-3,4),450,4),((-3,-1,2),300,3),((1,3,3),350,3)]:
 data=bpy.data.lights.new('Area','AREA');data.energy=power;data.shape='DISK';data.size=size;o=bpy.data.objects.new('Area',data);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Camera');camera=bpy.data.objects.new('Camera',data);scene.collection.objects.link(camera);scene.camera=camera;data.type='ORTHO';data.ortho_scale=2.25
for name,pos in [('front',(0,-4,.4)),('back',(0,4,.4)),('right',(4,0,.4))]:
 camera.location=pos;camera.rotation_euler=(-camera.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/(name+'.png'));bpy.ops.render.render(write_still=True)
print('Inspection rendered')
