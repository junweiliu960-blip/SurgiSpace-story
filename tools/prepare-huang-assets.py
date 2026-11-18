"""Copy completed local Lux3D output, retaining task provenance without credentials/URLs."""
from pathlib import Path
import json,struct,shutil,hashlib
root=Path(__file__).resolve().parents[1];work=root/'.local/huang-lux3d';dest=root/'public/models/lux3d-huang'
jobs=json.loads((work/'jobs.json').read_text())
assert all(jobs[k]['state']==3 for k in ['model','rig'])
source=work/'rig.glb';raw=source.read_bytes();assert raw[:4]==b'glTF'
length=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+length])
assert doc.get('skins'),'Expected skinned model from humanoid rig task'
assert all(not im.get('uri')or im['uri'].startswith('data:')for im in doc.get('images',[])),'Textures must be embedded'
dest.mkdir(parents=True,exist_ok=True);shutil.copyfile(source,dest/'huang-rigged.glb')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
provenance={'provider':'Aholo Lux3D','character':'小黄','age':25,'version':'G1','faceCountRequested':60000,'modelTaskId':jobs['model']['taskId'],'rigTaskId':jobs['rig']['taskId'],'sourceSha256':jobs['model']['sha256'],'outputSha256':sha(source),'referenceSha256':sha(root/'public/images/lux3d-huang/model-reference.png'),'conceptSha256':sha(root/'public/images/lux3d-huang/concept.png'),'runtime':'Local GLB with embedded PBR textures and humanoid skeleton; normalized to 1.70 game units at load time.'}
(dest/'provenance.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps({'bytes':len(raw),'skins':len(doc['skins']),'bones':[doc['nodes'][i].get('name')for i in doc['skins'][0]['joints']],'meshes':len(doc.get('meshes',[]))}))
