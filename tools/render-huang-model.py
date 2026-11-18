"""Offline inspection renders of the actual generated GLB, not concept art."""
import bpy,math,json
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1]
bpy.ops.wm.read_factory_settings(use_empty=True)
source=root/'public/models/lux3d-huang/huang-rigged.glb'
if not source.exists():source=root/'.local/huang-lux3d/model.glb'
bpy.ops.import_scene.gltf(filepath=str(source))
roots=[o for o in bpy.context.scene.objects if o.parent is None]
points=[o.matrix_world@Vector(c)for o in bpy.context.scene.objects if o.type=='MESH'for c in o.bound_box]
lo=Vector([min(v[i]for v in points)for i in range(3)]);hi=Vector([max(v[i]for v in points)for i in range(3)])
wrap=bpy.data.objects.new('NormalizedCharacter',None);bpy.context.collection.objects.link(wrap)
for o in roots:o.parent=wrap
factor=1.7/(hi.z-lo.z);wrap.scale=(factor,)*3;wrap.location=(-(lo.x+hi.x)*.5*factor,-(lo.y+hi.y)*.5*factor,-lo.z*factor)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.render.resolution_x=850;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.21,.20,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
for loc,power,size in [((2,-3,4),350,4),((-3,-1,2),250,3),((1,3,3),300,3)]:
 d=bpy.data.lights.new('Area','AREA');d.energy=power;d.shape='DISK';d.size=size;o=bpy.data.objects.new('Area',d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.85))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',d);scene.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=2.05
out=root.parent/'output';out.mkdir(exist_ok=True)
for name,loc in [('front',(0,-4,1.05)),('three-quarter',(2,-4,1.1))]:
 cam.location=loc;cam.rotation_euler=(Vector((0,0,.85))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/('huang-lux3d-'+name+'.png'));bpy.ops.render.render(write_still=True)
print(json.dumps({'originalBounds':[list(lo),list(hi)],'scale':factor}))
