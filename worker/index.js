import {validateCampaign} from '../src/campaign-state.js';

const json=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const GUEST_COOKIE='surgispace_guest';
async function visitor(request){
 const account=request.headers.get('oai-authenticated-user-id');
 // Existing signed-in players retain their original account save. Sign-in is optional.
 if(account)return {id:account,name:request.headers.get('oai-authenticated-user-email')||'玩家',kind:'account'};
 let token=request.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(GUEST_COOKIE+'='))?.slice(GUEST_COOKIE.length+1);
 let cookie=null;
 if(!/^[a-f0-9]{64}$/.test(token||'')){
  if(request.method!=='GET')return null;
  token=Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
  cookie=GUEST_COOKIE+'='+token+'; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000'+(new URL(request.url).protocol==='https:'?'; Secure':'');
 }
 // Return only a hash as the display/storage ID; never expose the bearer cookie to JavaScript.
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),x=>x.toString(16).padStart(2,'0')).join('');
 return {id:'guest-'+hash,name:'访客玩家',kind:'guest',cookie};
}
export async function handleProgress(request,env){
 const identity=await visitor(request);
 if(!identity)return json({message:'访客存档连接已失效，请刷新页面重新连接。'},401);
 const {cookie,...user}=identity;
 const reply=(value,status=200)=>{const response=json(value,status);if(cookie)response.headers.set('Set-Cookie',cookie);return response;};
 const key='players/'+encodeURIComponent(user.id)+'/campaign.json';
 if(request.method==='GET'){
  const object=await env.BUCKET.get(key);
  const data=object?await object.json():{revision:0,snapshot:null,updatedAt:null};
  return reply({...data,user});
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
