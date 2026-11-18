"""Non-destructive derivative of existing registered assets; not a new generated person."""
from pathlib import Path
import json,struct,math,hashlib
root=Path(__file__).resolve().parents[1];folder=root/'public/models/lux3d-patient'
def read(path):
 data=path.read_bytes();size=struct.unpack_from('<I',data,12)[0]
 return json.loads(data[20:20+size]),bytearray(data[28+size:])
def write(path,doc,buffer):
 raw=json.dumps(doc,separators=(',',':')).encode();raw+=b' '*((-len(raw))%4);buffer+=b'\0'*((-len(buffer))%4)
 path.write_bytes(struct.pack('<III',0x46546c67,2,12+8+len(raw)+8+len(buffer))+struct.pack('<II',len(raw),0x4e4f534a)+raw+struct.pack('<II',len(buffer),0x004e4942)+buffer)
def positions(doc,buffer,accessor):
 a=doc['accessors'][accessor];view=doc['bufferViews'][a['bufferView']];offset=view.get('byteOffset',0)+a.get('byteOffset',0);stride=view.get('byteStride',12)
 return a,[(offset+i*stride,struct.unpack_from('<fff',buffer,offset+i*stride)) for i in range(a['count'])]
source=folder/'skin-base-lux.glb';doc,buffer=read(source)
doc['materials'][0].setdefault('pbrMetallicRoughness',{})['baseColorFactor']=[.58,.34,.23,1]
hair=len(doc['materials']);doc['materials'].append({'name':'Zhou_short_dark_hair','pbrMetallicRoughness':{'baseColorFactor':[.035,.045,.045,1],'roughnessFactor':.88,'metallicFactor':0}})
lip=len(doc['materials']);doc['materials'].append({'name':'Zhou_lip','pbrMetallicRoughness':{'baseColorFactor':[.55,.27,.23,1],'roughnessFactor':.72,'metallicFactor':0}})
for mesh in doc['meshes']:
 name=mesh.get('name','')
 for primitive in mesh['primitives']:
  if name in ('FJ2812','FJ2813'):primitive['material']=hair
  if name=='FJ2814':primitive['material']=lip
  a,verts=positions(doc,buffer,primitive['attributes']['POSITION']);changed=[]
  for offset,(x,y,z) in verts:
   # A mild adult build adjustment; all body anchors and height stay registered.
   torso=math.exp(-((z+.10)/.32)**4);x*=1-.035*torso;y-=max(0,y-.98)*.08*torso
   struct.pack_into('<fff',buffer,offset,x,y,z);changed.append((x,y,z))
  a['min']=[min(v[i] for v in changed) for i in range(3)];a['max']=[max(v[i] for v in changed) for i in range(3)]
for node in doc['nodes']:
 if node.get('name')=='FJ2815':node['scale']=[0,0,0]
doc['asset']['extras']={'caseId':'CASE_APP_002','patient':'Zhou','age':32,'sex':'male','derivation':'existing registered Lux3D/BodyParts3D mesh; mild adult build and dark hair; artistic age cue, not age estimation'}
write(folder/'zhou-supine.glb',doc,buffer)
doc,buffer=read(folder/'operative-drape.glb')
# Retain the existing drape as a separate asset. The renderer crops the renal window
# and exposes a broad abdominal preparation field, with tiny laparoscopic ports.
doc['asset']['extras']={'caseId':'CASE_APP_002','derivation':'reused drape; abdomen field cropped by the appendix renderer; no nephrectomy incision'}
write(folder/'zhou-drape.glb',doc,buffer)
provenance={'caseId':'CASE_APP_002','age':32,'sex':'male','source':'skin-base-lux.glb + operative-drape.glb','newPaidCharacterJobs':0,'changes':['mild torso taper (maximum 3.5 percent)','subtle abdominal profile adjustment','dark scalp hair and eyebrows','pubic-hair mesh hidden under drape','registered origin, height and head/feet anchors retained'],'limitations':'Artistic identity variation of an existing mesh, not a newly generated or clinically age-validated face.','outputs':{name:hashlib.sha256((folder/name).read_bytes()).hexdigest() for name in ['zhou-supine.glb','zhou-drape.glb']}}
(folder/'zhou-provenance.json').write_text(json.dumps(provenance,indent=2))
print(json.dumps({'patientAssetsPrepared':True,'newCharacterJobs':0,'files':list(provenance['outputs'])}))
