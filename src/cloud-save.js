const clone=x=>x===null?null:JSON.parse(JSON.stringify(x));
export class CloudSave{
 constructor({fetcher=(...args)=>fetch(...args),storage=localStorage,onChange=()=>{},required=false}={}){this.fetcher=fetcher;this.storage=storage;this.onChange=onChange;this.required=required;this.intent=0;this.mode='local';this.user=null;this.latest=null;this.revision=0;this.queued=null;this.busy=null;this.blocked=false;this.status='local';}
 beginIntent(){this.intent++;}
 notify(status,message){this.status=status;this.message=message;this.onChange(this);}
 get cacheKey(){return this.user?'surgispace-cloud-v3:'+this.user.id:null;}
 cache(pending){try{this.storage.setItem(this.cacheKey,JSON.stringify({owner:this.user.id,revision:this.revision,snapshot:this.latest,pending}));}catch{}}
 async request(path,options={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await this.fetcher('/api/'+path,{credentials:'same-origin',cache:'no-store',signal:controller.signal,...options,headers:{...(this.user?{'X-SurgiSpace-Player':this.user.id}:{}),...options.headers}});if(!r.headers.get('content-type')?.includes('application/json'))throw Object.assign(Error('云端服务尚未配置'),{status:503});const body=await r.json();if(!r.ok)throw Object.assign(Error(body.message||'云端服务暂不可用'),{status:r.status});return body;}finally{clearTimeout(timer);}}

 async bootstrap(){
  try{
   const session=await this.request('session');if(!session.user?.id||!session.user.email&&session.user.kind!=='guest')throw Error('登录信息无效');this.mode='cloud';this.user=session.user;this.development=!!session.development;
   const remote=session.progress??await this.request('progress');this.revision=remote.revision;this.latest=remote.snapshot;
   let cached;try{cached=JSON.parse(this.storage.getItem(this.cacheKey));}catch{}
   if(cached?.owner===this.user.id&&cached.pending&&cached.snapshot){
    // A keepalive write can commit while navigation prevents receipt of its response.
    if(JSON.stringify(cached.snapshot)===JSON.stringify(remote.snapshot)){this.cache(false);this.notify('synced','云端存档已读取');}
    else if(cached.revision===remote.revision){this.latest=cached.snapshot;this.enqueue(this.latest);await this.flush();}
    else{this.blocked=true;this.notify('conflict','检测到本机未同步记录和另一设备的云端记录，请先读取云端进度；本机备份会保留。');return;}
   }else{this.cache(false);this.notify('synced','云端存档已读取');}
  }catch(e){if(!this.required&&this.mode==='local'){this.notify('local','本地存档模式');return;}this.blocked=true;this.notify(e.status===401?'auth':'error',e.status===401?(this.user?.kind==='guest'?'存档连接已失效，请刷新或使用恢复码。':'登录已过期，请重新验证邮箱。'):'暂时无法读取云端进度，请重试。');throw e;}
 }
 enqueue(snapshot){if(this.mode!=='cloud')return;this.latest=clone(snapshot);this.queued=this.latest;this.cache(true);if(!this.blocked&&!this.busy)this.pump();}
 pump(){
  this.busy=(async()=>{
   while(this.queued&&!this.blocked){const current=this.queued;this.queued=null;this.notify('saving','正在保存到云端…');
    try{const saved=await this.request('progress',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({snapshot:current,expectedRevision:this.revision}),keepalive:true});this.revision=saved.revision;this.cache(!!this.queued);this.notify('synced','已保存到云端');}
    catch(e){if(!this.queued)this.queued=current;this.blocked=true;this.cache(true);this.notify(e.status===409?'conflict':e.status===401?'auth':'offline',e.status===409?'另一设备已更新进度，请读取云端存档后再继续。':e.status===401?(this.user?.kind==='guest'?'存档连接已失效，本机进度已备份，请刷新后重试。':'登录已过期，本机进度已备份，请重新验证邮箱。'):'未能同步；本机已备份，请恢复网络后重试。');}
   }
  })().finally(()=>{this.busy=null;});return this.busy;
 }
 async flush(){if(this.busy)await this.busy;}
 async retry(){if(this.mode!=='cloud')return this.bootstrap();const intent=this.intent;const remote=await this.request('progress');if(intent!==this.intent)return;if(remote.revision!==this.revision){this.blocked=true;this.notify('conflict','云端已有其他设备的新进度，请先读取云端存档。');return;}this.blocked=false;if(this.queued){this.pump();await this.flush();}else this.notify('synced','云端连接已恢复');}
 async useRemote(){const intent=this.intent;const remote=await this.request('progress');if(intent!==this.intent)return undefined;
  // Preserve conflicting local data under a separate backup key until the player chooses to remove it.
  if(this.queued||this.blocked){try{const old=this.storage.getItem(this.cacheKey);if(old)this.storage.setItem(this.cacheKey+':conflict-backup',old);}catch{}}
  this.queued=null;this.latest=remote.snapshot;this.revision=remote.revision;this.blocked=false;this.cache(false);this.notify('synced','已读取云端进度');return clone(this.latest);
 }
}
