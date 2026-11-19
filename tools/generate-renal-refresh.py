"""Three authorized first-case operating ensemble and renal Lux3D jobs."""
from pathlib import Path
import sys,json,time,getpass,urllib.request,urllib.parse,hashlib
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root.parent/'tmp/lux3d-sdk'))
from manycore.aholo_sdk_core import AholoClientConfig
from manycore.aholo_sdk_lux3d import create_lux3d_client
work=root/'.local/renal-refresh';work.mkdir(parents=True,exist_ok=True)
ledger=work/'jobs.json';jobs=json.loads(ledger.read_text())if ledger.exists()else{}
client=create_lux3d_client(AholoClientConfig(api_key=getpass.getpass('Aholo API key (hidden): '),region='cn',timeout_ms=60000))
def save():ledger.write_text(json.dumps(jobs,indent=2))
def glb_url(result):
 for item in result.get('outputs',[]):
  if not isinstance(item,dict):continue
  url=item.get('content','')or''
  if url.startswith('https://')and urllib.parse.urlparse(url).path.lower().endswith('.glb'):return url
 raise RuntimeError('No GLB output; inspect saved result before proceeding.')
try:
 client.tasks.list(page=1,page_size=1)
 print(json.dumps({'authenticated':True,'maxNewJobs':3,'version':'G1','faceCountPerModel':100000}),flush=True)
 for kind in ['bed','kidney','cutaway']:
  if kind in jobs:
   if not jobs[kind].get('taskId'):raise RuntimeError('Uncertain prior POST; reconcile account tasks. No duplicate submitted.')
   continue
  jobs[kind]={'state':'submitting','submittedAt':time.time(),'version':'G1','faceCount':100000,'reference':kind+'-reference.png'};save()
  task=client.img_to_3d.create_from_file(root/'public/images/lux3d-renal-refresh'/(kind+'-reference.png'),version='G1',face_count=100000,output_format=['glb'],enable_pbr=True,ai_predict_size=False)
  jobs[kind].update(taskId=task,state='submitted');save()
  print(json.dumps({'kind':kind,'taskId':task,'state':'submitted'}),flush=True)
 started=time.time()
 while time.time()-started<1800:
  for kind,j in jobs.items():
   target=work/(kind+'.glb')
   if j.get('downloaded')and target.exists():continue
   result=client.tasks.retrieve(j['taskId']);old=j['state'];j.update(state=result['status'],result=result);save()
   if old!=j['state']:print(json.dumps({'kind':kind,'taskId':j['taskId'],'status':j['state']}),flush=True)
   if j['state']in(4,6):raise RuntimeError('Task failed/cancelled. No automatic paid retry.')
   if j['state']==3:
    if not target.exists():
     partial=target.with_suffix('.download')
     with urllib.request.urlopen(urllib.request.Request(glb_url(result),headers={'Connection':'close'}),timeout=45)as r,partial.open('wb')as f:
      expected=int(r.headers.get('Content-Length','0'));count=0
      while True:
       block=r.read(65536)
       if not block:break
       f.write(block);count+=len(block)
     if expected and count!=expected:raise RuntimeError('Incomplete download; resume existing task without new generation.')
     partial.replace(target)
    j.update(downloaded=True,sha256=hashlib.sha256(target.read_bytes()).hexdigest());save()
    print(json.dumps({'kind':kind,'downloaded':True,'bytes':target.stat().st_size}),flush=True)
  if all(j.get('downloaded')for j in jobs.values()):break
  time.sleep(15)
 else:raise RuntimeError('Tasks remain pending. Resume saved task IDs without submitting replacements.')
except Exception as e:
 print(json.dumps({'errorType':type(e).__name__,'httpStatus':getattr(e,'status_code',None),'businessCode':getattr(e,'cmd_code',None),'message':str(e)if type(e)is RuntimeError else 'Request failed; credentials and response body suppressed.'}),flush=True)
 sys.exit(1)
