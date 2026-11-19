import bpy,json,sys,math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];work=root/'.local/renal-refresh';out=root.parent/'output'
kinds=sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else['bed','kidney','cutaway'];stats={}
for kind in kinds:
 source=work/(kind+'.glb')
 if not source.exists():continue
 bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source));meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];roots=[o for o in bpy.context.scene.objects if o.parent is None];points=[o.matrix_world@Vector(c)for o in meshes for c in o.bound_box];lo=Vector([min(v[i]for v in points)for i in range(3)]);hi=Vector([max(v[i]for v in points)for i in range(3)]);center=(lo+hi)/2;factor=2/max(hi-lo)
 wrap=bpy.data.objects.new('Inspection',None);bpy.context.collection.objects.link(wrap)
 for o in roots:o.parent=wrap
 wrap.scale=(factor,)*3;wrap.location=-center*factor
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=12;scene.render.resolution_x=1000;scene.render.resolution_y=850;scene.render.resolution_percentage=100;scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.14,.17,.17,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.65
 for loc,power,size in [((2,-3,4),500,4),((-3,-1,2),300,3),((1,3,3),300,3)]:
  d=bpy.data.lights.new('Area','AREA');d.energy=power;d.size=size;o=bpy.data.objects.new('Area',d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
 d=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',d);scene.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=2.65
 for name,loc in [('front',(0,-4,1.0)),('oblique',(3,-4,3))]:
  cam.location=loc;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/('renal-refresh-raw-'+kind+'-'+name+'.png'));bpy.ops.render.render(write_still=True)
 stats[kind]={'boundsBlender':[list(lo),list(hi)],'meshes':len(meshes)}
(work/'inspection.json').write_text(json.dumps(stats,indent=2));print(json.dumps(stats))
