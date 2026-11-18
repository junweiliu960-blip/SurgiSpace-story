"""Package the two completed Lux3D Zhou tasks without exposing credentials/URLs."""
from pathlib import Path
import json,struct,hashlib,shutil
root=Path(__file__).resolve().parents[1];work=root/'.local/zhou-lux3d';dest=root/'public/models/lux3d-zhou';images=root/'public/images/lux3d-zhou'
jobs=json.loads((work/'jobs.json').read_text());dest.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
record={'provider':'Aholo Lux3D','character':'周先生','age':32,'sex':'male','version':'G1','newGenerationTasks':2,'models':{}}
for kind in ['ill','recovery']:
 job=jobs[kind];assert job['state']==3 and job['downloaded']
 source=work/(kind+'.glb');raw=source.read_bytes();assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
 length=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+length])
 assert doc.get('meshes')and doc.get('images'),'Expected textured character mesh'
 assert all(not i.get('uri')or i['uri'].startswith('data:')for i in doc.get('images',[])),'Textures must be embedded'
 assert all(not b.get('uri')or b['uri'].startswith('data:')for b in doc.get('buffers',[])),'Buffers must be embedded'
 target=dest/('zhou-'+kind+'.glb');shutil.copyfile(source,target)
 triangles=sum(doc['accessors'][p['indices']]['count']//3 if 'indices'in p else doc['accessors'][p['attributes']['POSITION']]['count']//3 for m in doc['meshes']for p in m['primitives'])
 record['models'][kind]={'file':target.name,'taskId':job['taskId'],'inputMethod':'image-to-3D','faceCountRequested':100000,'triangles':triangles,'sha256':sha(target),'bytes':target.stat().st_size,'referenceSha256':sha(images/(kind+'-reference.png')),'conceptSha256':sha(images/(kind+'-concept.png')),'pose':'Seated, right hand guarding right lower abdomen'if kind=='ill'else'Seated, right hand gesturing to follow','furniture':'Character only; chair/wheelchair supplied separately by game scenes','skinCount':len(doc.get('skins',[]))}
 print(json.dumps({'kind':kind,'taskId':job['taskId'],'bytes':len(raw),'triangles':triangles,'textures':len(doc.get('images',[]))}))
(dest/'provenance.json').write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf8')
