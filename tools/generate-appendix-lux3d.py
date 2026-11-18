"""One explicitly authorized G1 reference-to-3D job; keys stay in process memory."""
from pathlib import Path
import sys, json, time, getpass, hashlib, urllib.request, urllib.parse
root=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(root.parent/'tmp/lux3d-sdk'))
from manycore.aholo_sdk_core import AholoClientConfig
from manycore.aholo_sdk_lux3d import create_lux3d_client
work=root/'.local/appendix-lux3d';work.mkdir(parents=True,exist_ok=True)
ledger=work/'job.json'
key=getpass.getpass('Aholo API key (hidden): ')
client=create_lux3d_client(AholoClientConfig(api_key=key,region='cn',timeout_ms=40000))
try:
 client.tasks.list(page=1,page_size=1)
 print(json.dumps({'authenticated':True,'region':'cn'}),flush=True)
 if ledger.exists():
  job=json.loads(ledger.read_text())
  if not job.get('taskId'):
   recent=client.tasks.list(page=1,page_size=10)
   (work/'reconcile.json').write_text(json.dumps(recent,indent=2))
   if '--text-after-reconcile' not in sys.argv or any(i.get('created',0)>=int(job['submittedAt']*1000)-5000 for i in recent.get('items',[])):
    raise RuntimeError('Uncertain submission: recent tasks saved locally for reconciliation. No duplicate task submitted.')
   (work/'image-attempt-no-task.json').write_text(json.dumps(job,indent=2))
   prompt=(root/'tools/appendix-lux3d-prompt.txt').read_text()
   job={'state':'submitting','inputMethod':'text','version':'G1','faceCount':100000,'submittedAt':time.time(),'prompt':prompt}
   ledger.write_text(json.dumps(job,indent=2))
   task=client.text_to_3d.create(prompt=prompt,style='photorealistic',version='G1',face_count=100000,output_format=['glb','zip'],enable_pbr=True,ai_predict_size=False)
   job.update(taskId=task,state='submitted');ledger.write_text(json.dumps(job,indent=2))
   print(json.dumps({'taskId':task,'state':'submitted','jobsSubmitted':1,'inputMethod':'text'}),flush=True)
 else:
  job={'state':'submitting','reference':'reference.png','version':'G1','faceCount':100000,'submittedAt':time.time()}
  ledger.write_text(json.dumps(job,indent=2))
  task=client.img_to_3d.create_from_file(work/'reference.png',version='G1',face_count=100000,output_format=['glb','zip'],enable_pbr=True,ai_predict_size=False)
  job.update(taskId=task,state='submitted');ledger.write_text(json.dumps(job,indent=2))
  print(json.dumps({'taskId':task,'state':'submitted','jobsSubmitted':1}),flush=True)
 started=time.time();last=None
 while time.time()-started<1200:
  result=client.tasks.retrieve(job['taskId']);job.update(result=result,state=result['status']);ledger.write_text(json.dumps(job,indent=2))
  if result['status']!=last:print(json.dumps({'taskId':job['taskId'],'status':result['status']}),flush=True);last=result['status']
  if result['status']==3:break
  if result['status'] in (4,6):raise RuntimeError('Generation failed or cancelled; no automatic paid retry.')
  time.sleep(20)
 else:raise RuntimeError('Generation still pending; resume this ledger, do not create another task.')
 for output in result.get('outputs',[]):
  url=output.get('content','');extension=Path(urllib.parse.urlparse(url).path).suffix.lower()
  if not url.startswith('https://') or extension not in ('.glb','.zip'):continue
  path=work/('master'+extension)
  if not path.exists():
   with urllib.request.urlopen(url,timeout=120) as response:path.write_bytes(response.read())
  print(json.dumps({'downloaded':path.name,'bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()}),flush=True)
 if not (work/'master.glb').exists():raise RuntimeError('No GLB in result; inspect ZIP before continuing.')
except Exception as e:
 print(json.dumps({'errorType':type(e).__name__,'httpStatus':getattr(e,'status_code',None),'businessCode':getattr(e,'cmd_code',None),'message':str(e) if type(e) is RuntimeError else 'Request failed; credentials and response body suppressed.'}),flush=True)
 sys.exit(1)
