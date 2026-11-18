import {validateCampaign} from '../src/campaign-state.js';

const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function handleProgress(request,env){
 const user=request.headers.get('oai-authenticated-user-id');
 if(!user)return json({message:'请先登录后读取游戏进度。'},401);
 const key='players/'+encodeURIComponent(user)+'/campaign.json';
 if(request.method==='GET'){
  const object=await env.BUCKET.get(key);
  const data=object?await object.json():{revision:0,snapshot:null,updatedAt:null};
  return json({...data,user:{id:user,name:request.headers.get('oai-authenticated-user-email')||'玩家'}});
 }
 if(request.method!=='PUT')return json({message:'不支持此操作'},405);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return json({message:'请求来源不符'},403);
 if(Number(request.headers.get('content-length')||0)>262144)return json({message:'存档过大'},413);
 const text=await request.text();if(new TextEncoder().encode(text).length>262144)return json({message:'存档过大'},413);
 let input,snapshot;try{input=JSON.parse(text);snapshot=validateCampaign(input.snapshot);}catch{return json({message:'存档格式无效，云端原存档未更改。'},400);}
 if(!Number.isSafeInteger(input.revision)||input.revision<0)return json({message:'存档版本无效'},400);
 const object=await env.BUCKET.get(key);
 const previous=object?await object.json():{revision:0};
 if(previous.revision!==input.revision)return json({message:'另一设备已有更新，请读取云端或导出本机备份。',revision:previous.revision},409);
 const next={revision:previous.revision+1,snapshot,updatedAt:new Date().toISOString()};
 const saved=await env.BUCKET.put(key,JSON.stringify(next),{onlyIf:object?{etagMatches:object.etag}:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
 if(!saved)return json({message:'另一设备同时保存，请读取云端进度。'},409);
 return json({revision:next.revision,updatedAt:next.updatedAt});
}
export default {async fetch(request,env){
 try{
  const url=new URL(request.url);
  if(url.pathname==='/api/campaign')return await handleProgress(request,env);
  if(url.pathname.startsWith('/api/'))return json({message:'接口不存在'},404);
  return env.ASSETS.fetch(request);
 }catch{return json({message:'存档服务暂不可用，请保留本机备份并重试。'},503);}
}};
