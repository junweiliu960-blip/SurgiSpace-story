"""Non-destructive cleanup of the existing Lux3D Lin asset; no generation call."""
import bpy,bmesh,json,hashlib
from pathlib import Path
from mathutils import Matrix,Vector
root=Path(__file__).resolve().parents[1];source=root/'public/models/lux3d-patient/clinic-patient.glb';dest=source.with_name('lin-seated-clean.glb')
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source))
body=next(o for o in bpy.context.scene.objects if o.name=='Clinic_Seated_Body')
body.data.transform(body.matrix_world);body.matrix_world=Matrix.Identity(4)
bm=bmesh.new();bm.from_mesh(body.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00005)
# The chair is fused to the original surface. These regions follow its rear
# backrest, underside/seat, and four outside legs, avoiding the front calves.
def chair(p):
 x,y,z=p;return (y>.225 and z<1.065)or(z<.56 and y>-.13)or(z<.60 and abs(x)>.265)or(.43<z<.535 and y>-.22)
remove=[f for f in bm.faces if chair(f.calc_center_median())];removed=len(remove)
bmesh.ops.delete(bm,geom=remove,context='FACES_ONLY')
bmesh.ops.delete(bm,geom=[v for v in bm.verts if not v.link_faces],context='VERTS')
# Remove isolated remnants produced at the fused chair/person intersections.
remaining=set(bm.verts);components=[]
while remaining:
 seed=remaining.pop();stack=[seed];part=[seed]
 while stack:
  v=stack.pop()
  for e in v.link_edges:
   w=e.other_vert(v)
   if w in remaining:remaining.remove(w);stack.append(w);part.append(w)
 components.append(part)
for part in components:
 if len(part)<120:bmesh.ops.delete(bm,geom=part,context='VERTS')
bmesh.ops.delete(bm,geom=[e for e in bm.edges if not e.link_faces],context='EDGES')
edges=[e for e in bm.edges if e.is_boundary]
boundary=list({v for e in edges for v in e.verts})
for _ in range(4):bmesh.ops.smooth_vert(bm,verts=boundary,factor=.35,use_axis_x=True,use_axis_y=True,use_axis_z=True)
caps=bmesh.ops.holes_fill(bm,edges=edges,sides=0).get('faces',[])
for name,color in [('Jacket_Repair',(.16,.17,.17,1)),('Trousers_Repair',(.065,.07,.075,1))]:
 mat=bpy.data.materials.new(name);mat.diffuse_color=color;mat.use_nodes=True;bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=color;bs.inputs['Roughness'].default_value=.85;body.data.materials.append(mat)
for f in caps:f.smooth=True;f.material_index=len(body.data.materials)-(2 if f.calc_center_median().z>.72 else 1)
bmesh.ops.triangulate(bm,faces=caps)
# Non-manifold UV junctions can leave branched boundary loops. Close each
# remaining connected rim explicitly so no open cut is shipped.
rims=set(e for e in bm.edges if e.is_boundary)
while rims:
 seed=rims.pop();part=[seed];stack=list(seed.verts)
 while stack:
  v=stack.pop()
  for edge in v.link_edges:
   if edge in rims:rims.remove(edge);part.append(edge);stack.extend(edge.verts)
 verts={v for e in part for v in e.verts};centre=sum((v.co for v in verts),Vector())/len(verts);centre.y+=.025
 middle=bm.verts.new(centre)
 for edge in part:
  try:
   f=bm.faces.new((edge.verts[1],edge.verts[0],middle));f.smooth=True;f.material_index=len(body.data.materials)-(2 if centre.z>.72 else 1)
  except ValueError:pass
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
# Keep the original hands and UVs; relax spurious sharp hand/wrist ridges.
group=body.vertex_groups.new(name='Hand_Surface_Cleanup');selected=[]
for v in body.data.vertices:
 x,y,z=v.co
 if .12<abs(x)<.30 and -.37<y<-.045 and .60<z<.80:selected.append(v.index)
group.add(selected,1,'REPLACE')
mod=body.modifiers.new('Relax redundant hand ridges','SMOOTH');mod.vertex_group=group.name;mod.factor=.40;mod.iterations=8
bpy.context.view_layer.objects.active=body;bpy.ops.object.modifier_apply(modifier=mod.name)
# Finalise after the modifier evaluation, including any remaining source rims.
bm=bmesh.new();bm.from_mesh(body.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00005)
rims=set(e for e in bm.edges if e.is_boundary)
while rims:
 seed=rims.pop();part=[seed];stack=list(seed.verts)
 while stack:
  v=stack.pop()
  for e in v.link_edges:
   if e in rims:rims.remove(e);part.append(e);stack.extend(e.verts)
 vertices={v for e in part for v in e.verts};centre=sum((v.co for v in vertices),Vector())/len(vertices);centre.y+=.025;middle=bm.verts.new(centre)
 for edge in part:
  try:
   f=bm.faces.new((edge.verts[1],edge.verts[0],middle));f.material_index=len(body.data.materials)-(2 if centre.z>.72 else 1)
  except ValueError:pass
print('FINAL_BOUNDARY_EDGES',sum(e.is_boundary for e in bm.edges))
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(body.data);bm.free()
for f in body.data.polygons:f.use_smooth=True
body.name='Lin_Seated_ChairRemoved_HandsCleaned';body['source']='Lux3D existing clinic-patient.glb';body['chairRemoved']=True;body['handCleanup']='local surface relaxation, existing UVs retained'
bpy.ops.export_scene.gltf(filepath=str(dest),export_format='GLB',export_yup=True,export_extras=True,export_materials='EXPORT')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
record={'provider':'Aholo Lux3D (reused asset)','source':'clinic-patient.glb','sourceSha256':sha(source),'outputSha256':sha(dest),'newPaidTasks':0,'removedChairFaces':removed,'handVerticesRelaxed':len(selected),'head':'Original detailed head preserved','cleanup':'Fused chair backrest, seat and legs removed; hand/wrist surface smoothed with original texture UVs retained.'}
dest.with_suffix('.json').write_text(json.dumps(record,indent=2),encoding='utf8');print(json.dumps(record))
