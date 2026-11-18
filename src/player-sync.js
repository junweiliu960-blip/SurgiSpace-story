export class PlayerSync {
 constructor({fetcher=(...args)=>fetch(...args),onStatus=()=>{},storage=localStorage}={}){this.fetcher=fetcher;this.onStatus=onStatus;this.storage=storage;this.revision=0;this.pending=null;this.running=null;this.blocked=false;this.user=null;this.timer=null;}
 status(text,kind='saved'){this.onStatus(text,kind);}
 async bootstrap(){
  const response=await this.fetcher('/api/campaign',{cache:'no-store'});
  if(!response.ok)throw Error(response.status===401?'请先登录账号，再继续游戏。':'暂时无法连接进度服务，请重试。');
  const data=await response.json();this.user=data.user;this.revision=data.revision;
  globalThis.SURGISPACE_PLAYER_ID=data.user.id;
  this.key='surgispace-v4-campaign:'+encodeURIComponent(data.user.id);
  this.backupKey=this.key+':unsynced';
  let backup=this.storage.getItem(this.backupKey);
  this.ack=JSON.stringify(data.snapshot);
  if(backup&&JSON.stringify(JSON.parse(backup).snapshot)===this.ack){this.storage.removeItem(this.backupKey);backup=null;}
  if(backup){
   const pending=JSON.parse(backup);
   if(pending.revision!==this.revision){this.pending=pending.snapshot;this.blocked=true;this.status('发现未同步备份，请选择恢复方式','conflict');}
   else{this.pending=pending.snapshot;this.storage.setItem(this.key,JSON.stringify(this.pending));this.status('正在恢复上次未同步进度…','saving');await this.flush();}
  }
  if(!this.pending&&!backup){if(data.snapshot)this.storage.setItem(this.key,JSON.stringify(data.snapshot));else this.storage.removeItem(this.key);}
  if(!this.blocked&&!this.pending)this.status(data.snapshot?'云端进度已恢复':'已登录 · 进度自动保存');
  return data;
 }
 enqueue(snapshot){if(!this.pending&&JSON.stringify(snapshot)===this.ack)return;this.pending=structuredClone(snapshot);try{this.storage.setItem(this.backupKey,JSON.stringify({revision:this.revision,snapshot:this.pending}));}catch{}this.status('正在保存进度…','saving');clearTimeout(this.timer);if(!this.blocked)this.timer=setTimeout(()=>this.flush(),500);}
 async flush(){
  clearTimeout(this.timer);if(this.running)return this.running;if(this.blocked)return false;
  this.running=(async()=>{while(this.pending&&!this.blocked){
   const snapshot=this.pending;
   try{
    const response=await this.fetcher('/api/campaign',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:this.revision,snapshot}),keepalive:true});
    if(!response.ok){if(response.status===409){this.blocked=true;this.status('另一设备已有更新 · 点击处理','conflict');return false;}if(response.status===401){this.blocked=true;this.status('登录已过期 · 点击重新登录','auth');return false;}throw Error('save');}
    const data=await response.json();this.revision=data.revision;this.ack=JSON.stringify(snapshot);
    if(this.pending===snapshot){this.pending=null;this.storage.removeItem(this.backupKey);}else this.storage.setItem(this.backupKey,JSON.stringify({revision:this.revision,snapshot:this.pending}));
    this.status('已保存到账号 · '+new Date(data.updatedAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'}));
   }catch{this.status('网络中断 · 进度已留在本机，点击重试','offline');return false;}
  }return !this.pending;})().finally(()=>{this.running=null;});return this.running;
 }
 async useRemote(){
  if(this.running)await this.running;
  const response=await this.fetcher('/api/campaign',{cache:'no-store'});if(!response.ok)throw Error('无法读取云端');const data=await response.json();
  if(data.user.id!==this.user.id)throw Error('账号已变更，请重新登录');
  if(this.pending)this.storage.setItem(this.key+':conflict-backup',JSON.stringify(this.pending));
  this.storage.removeItem(this.backupKey);if(data.snapshot)this.storage.setItem(this.key,JSON.stringify(data.snapshot));else this.storage.removeItem(this.key);
  this.pending=null;this.revision=data.revision;this.blocked=false;
 }
}
