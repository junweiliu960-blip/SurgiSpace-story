"""Authorized reference-to-3D + humanoid rig. Durable ledger prevents paid duplicates."""
from pathlib import Path
import sys,json,time,getpass,urllib.request,urllib.parse,hashlib
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root.parent/'tmp/lux3d-sdk'))
from manycore.aholo_sdk_core import AholoClientConfig
from manycore.aholo_sdk_lux3d import create_lux3d_client
work=root/'.local/huang-lux3d';work.mkdir(parents=True,exist_ok=True)
ledger=work/'jobs.json';jobs=json.loads(ledger.read_text())if ledger.exists()else{}
client=create_lux3d_client(AholoClientConfig(api_key=getpass.getpass('Aholo API key (hidden): '),region='cn',timeout_ms=60000))
def save():ledger.write_text(json.dumps(jobs,indent=2))
def output(result):
 for item in result.get('outputs',[]):
  if not isinstance(item,dict):continue
  url=item.get('content','')
  if url.startswith('https://')and urllib.parse.urlparse(url).path.lower().endswith('.glb'):return url
 raise RuntimeError('No GLB output; inspect saved task result before proceeding.')
try:
 client.tasks.list(page=1,page_size=1)
 print(json.dumps({'authenticated':True,'maxNewJobs':2}),flush=True)
 for kind in ['model','rig']:
  if kind not in jobs:
   jobs[kind]={'state':'submitting','submittedAt':time.time()};save()
   if kind=='model':task=client.img_to_3d.create_from_file(root/'public/images/lux3d-huang/model-reference.png',version='G1',face_count=60000,output_format=['glb'],enable_pbr=True,ai_predict_size=False)
   else:task=client.humanoid_auto_rig.create(model_url=output(jobs['model']['result']))
   jobs[kind].update(taskId=task,state='submitted');save()
   print(json.dumps({'kind':kind,'taskId':task,'state':'submitted'}),flush=True)
  j=jobs[kind]
  if not j.get('taskId'):raise RuntimeError('Uncertain submission. Reconcile task list; no automatic duplicate.')
  start=time.time()
  while time.time()-start<1800:
   result=client.tasks.retrieve(j['taskId']);old=j['state'];j.update(state=result['status'],result=result);save()
   if old!=j['state']:print(json.dumps({'kind':kind,'taskId':j['taskId'],'status':j['state']}),flush=True)
   if j['state']==3:break
   if j['state']in(4,6):raise RuntimeError('Generation failed/cancelled; no automatic paid retry.')
   time.sleep(15)
  else:raise RuntimeError('Task pending; resume ledger without resubmitting.')
  target=work/(kind+'.glb')
  if not target.exists():
   with urllib.request.urlopen(output(result),timeout=120)as r:target.write_bytes(r.read())
  j['sha256']=hashlib.sha256(target.read_bytes()).hexdigest();save()
  print(json.dumps({'kind':kind,'downloaded':True,'bytes':target.stat().st_size}),flush=True)
except Exception as e:
 print(json.dumps({'errorType':type(e).__name__,'httpStatus':getattr(e,'status_code',None),'businessCode':getattr(e,'cmd_code',None),'message':str(e)if type(e)is RuntimeError else 'Request failed; response and credentials suppressed.'}),flush=True)
 sys.exit(1)
