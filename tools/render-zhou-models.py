"""Render the actual delivered Zhou GLBs from three views for asset QA."""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[1];out=root.parent/'output';out.mkdir(exist_ok=True)
kinds=sys.argv[sys.argv.index('--')+1:]if'--'in sys.argv else['ill','recovery']
inspection_path=root/'.local/zhou-lux3d/inspection.json'
inspection=json.loads(inspection_path.read_text())if inspection_path.exists()else{}
for kind in kinds:
 bpy.ops.wm.read_factory_settings(use_empty=True)
 source=root/'public/models/lux3d-zhou'/('zhou-'+kind+'.glb')
 if not source.exists():source=root/'.local/zhou-lux3d'/(kind+'.glb')
 bpy.ops.import_scene.gltf(filepath=str(source))
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];roots=[o for o in bpy.context.scene.objects if o.parent is None]
 points=[o.matrix_world@Vector(c)for o in meshes for c in o.bound_box];lo=Vector([min(v[i]for v in points)for i in range(3)]);hi=Vector([max(v[i]for v in points)for i in range(3)])
 wrap=bpy.data.objects.new('Inspection_Normalization',None);bpy.context.collection.objects.link(wrap)
 for o in roots:o.parent=wrap
 factor=1.58/(hi.z-lo.z);wrap.scale=(factor,)*3;wrap.location=(-(lo.x+hi.x)*.5*factor,-(lo.y+hi.y)*.5*factor,-lo.z*factor)
 scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
 scene.world=bpy.data.worlds.new('Studio');scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.18,.21,.20,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
 for loc,power,size in [((2,-3,4),350,4),((-3,-1,2),250,3),((1,3,3),300,3)]:
  d=bpy.data.lights.new('Area','AREA');d.energy=power;d.size=size;o=bpy.data.objects.new('Area',d);scene.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,.79))-o.location).to_track_quat('-Z','Y').to_euler()
 d=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',d);scene.collection.objects.link(cam);scene.camera=cam;d.type='ORTHO';d.ortho_scale=1.96
 for view,loc in [('front',(0,-4,1.1)),('side',(4,0,1.1)),('back',(0,4,1.1))]:
  cam.location=loc;cam.rotation_euler=(Vector((0,0,.79))-cam.location).to_track_quat('-Z','Y').to_euler();scene.render.filepath=str(out/('zhou-lux3d-'+kind+'-'+view+'.png'));bpy.ops.render.render(write_still=True)
 inspection[kind]={'boundsBlender':[list(lo),list(hi)],'inspectionHeight':1.58,'scale':factor,'meshCount':len(meshes)}
inspection_path.write_text(json.dumps(inspection,indent=2));print(json.dumps(inspection))
