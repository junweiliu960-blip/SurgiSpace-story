"""Three authorized incremental Lux3D jobs. Resume ledger; never retry uncertain POSTs."""
from pathlib import Path
import sys,json,time,getpass,urllib.request,urllib.parse,hashlib
root=Path(__file__).resolve().parents[1];sys.path.insert(0,str(root.parent/'tmp/lux3d-sdk'))
from manycore.aholo_sdk_core import AholoClientConfig
from manycore.aholo_sdk_lux3d import create_lux3d_client
work=root/'.local/appendix-scene-assets';work.mkdir(exist_ok=True);ledger=work/'jobs.json'
prompts=json.loads((root/'tools/appendix-scene-prompts.json').read_text())
jobs=json.loads(ledger.read_text())if ledger.exists()else{}
key=getpass.getpass('Aholo API key (hidden): ');client=create_lux3d_client(AholoClientConfig(api_key=key,region='cn',timeout_ms=60000))
def save():ledger.write_text(json.dumps(jobs,indent=2))
def download(name,result):
 for output in result.get('outputs',[]):
  url=output.get('content','');ext=Path(urllib.parse.urlparse(url).path).suffix.lower()
  if url.startswith('https://')and ext=='.glb':
   target=work/(name+'.glb')
   if not target.exists():
    with urllib.request.urlopen(url,timeout=120)as response:target.write_bytes(response.read())
   jobs[name]['sha256']=hashlib.sha256(target.read_bytes()).hexdigest();jobs[name]['downloaded']=True;save()
   print(json.dumps({'name':name,'downloaded':True,'bytes':target.stat().st_size}),flush=True)
   return
 raise RuntimeError('Task completed without a GLB output')
try:
 client.tasks.list(page=1,page_size=1);print(json.dumps({'authenticated':True,'maxNewJobs':3}),flush=True)
 for name,j in jobs.items():
  if j.get('state')=='submitting'and not j.get('taskId'):raise RuntimeError('Uncertain prior POST; reconcile account task list before retrying.')
 start=time.time()
 while time.time()-start<1800:
  active=sum(j.get('state')in(0,1,'submitted')for j in jobs.values())
  for name,spec in prompts.items():
   if name in jobs or active>=2:continue
   jobs[name]={'state':'submitting','submittedAt':time.time(),'prompt':spec['prompt'],'faces':spec['faces'],'version':'G1'};save()
   try:task=client.text_to_3d.create(prompt=spec['prompt'],style='photorealistic',version='G1',face_count=spec['faces'],output_format=['glb'],enable_pbr=True,ai_predict_size=False)
   except Exception as e:
    if getattr(e,'cmd_code',None)=='GENERATION_CONCURRENCY_LIMIT_EXCEEDED':del jobs[name];save();break
    raise
   jobs[name].update(taskId=task,state='submitted');save();active+=1;print(json.dumps({'name':name,'taskId':task,'state':'submitted'}),flush=True)
  for name,j in list(jobs.items()):
   if j.get('downloaded'):continue
   result=client.tasks.retrieve(j['taskId']);old=j['state'];j.update(state=result['status'],result=result);save()
   if old!=j['state']:print(json.dumps({'name':name,'taskId':j['taskId'],'status':j['state']}),flush=True)
   if j['state']in(4,6):raise RuntimeError('A generated asset failed or was cancelled; no automatic paid replacement.')
   if j['state']==3:download(name,result)
  if len(jobs)==3 and all(j.get('downloaded')for j in jobs.values()):
   recent=client.tasks.list(page=1,page_size=10)
   for name,j in jobs.items():
    item=next((i for i in recent.get('items',[])if i['taskId']==j['taskId']),{})
    if 'consumedCredits'in item:j['consumedCredits']=item['consumedCredits']
   save();print(json.dumps({'complete':True,'tasks':{n:{'taskId':j['taskId'],'consumedCredits':j.get('consumedCredits')}for n,j in jobs.items()}}),flush=True);break
  time.sleep(20)
 else:raise RuntimeError('Tasks still pending; resume the recorded IDs without new submissions.')
except Exception as e:
 print(json.dumps({'errorType':type(e).__name__,'httpStatus':getattr(e,'status_code',None),'businessCode':getattr(e,'cmd_code',None),'message':str(e)if type(e)is RuntimeError else 'Request failed; sensitive response suppressed.'}),flush=True);sys.exit(1)
