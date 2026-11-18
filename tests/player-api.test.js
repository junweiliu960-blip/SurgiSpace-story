import test from 'node:test';
import assert from 'node:assert/strict';
import {handleProgress} from '../worker/index.js';
import {newCampaign} from '../src/campaign-state.js';
function bucket(){const data=new Map();return {async get(k){const raw=data.get(k);return raw?{etag:JSON.parse(raw).revision+'',json:async()=>JSON.parse(raw)}:null;},async put(k,v,o){const old=data.get(k);if(o.onlyIf.etagMatches&&JSON.parse(old||'{}').revision+''!==o.onlyIf.etagMatches||o.onlyIf.etagDoesNotMatch==='*'&&old)return null;data.set(k,v);return {};}};}
function req(user,method='GET',body,origin='https://game.test'){return new Request('https://game.test/api/campaign',{method,headers:{...(user?{'oai-authenticated-user-id':user}:{}),'Origin':origin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});}
test('authenticated account saves survive re-login and are isolated from other players',async()=>{const env={BUCKET:bucket()};assert.equal((await handleProgress(req(null),env)).status,200);const s=newCampaign();s.route='T08';s.line=2;s.playerNickname='小宝';assert.equal((await handleProgress(req('alice','PUT',{revision:0,snapshot:s}),env)).status,200);const loaded=await (await handleProgress(req('alice'),env)).json();assert.equal(loaded.snapshot.route,'T08');assert.equal(loaded.snapshot.line,2);assert.equal(loaded.snapshot.playerNickname,'小宝');assert.equal((await (await handleProgress(req('bob'),env)).json()).snapshot,null);});
test('stale device, cross-origin request and malformed save cannot overwrite progress',async()=>{const env={BUCKET:bucket()},s=newCampaign();await handleProgress(req('a','PUT',{revision:0,snapshot:s}),env);assert.equal((await handleProgress(req('a','PUT',{revision:0,snapshot:s}),env)).status,409);assert.equal((await handleProgress(req('a','PUT',{revision:1,snapshot:s},'https://evil.test'),env)).status,403);assert.equal((await handleProgress(req('a','PUT',{revision:1,snapshot:{version:4}}),env)).status,400);assert.equal((await (await handleProgress(req('a'),env)).json()).revision,1);});
test('simultaneous first writes are conditional: exactly one device wins',async()=>{const env={BUCKET:bucket()},s=newCampaign();const results=await Promise.all([handleProgress(req('a','PUT',{revision:0,snapshot:s}),env),handleProgress(req('a','PUT',{revision:0,snapshot:s}),env)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);});

test('anonymous visitors get isolated durable saves without sign-in',async()=>{
 const env={BUCKET:bucket()};
 const first=await handleProgress(req(null),env),second=await handleProgress(req(null),env);
 const a=first.headers.get('set-cookie'),b=second.headers.get('set-cookie');
 assert.match(a,/HttpOnly/);assert.match(a,/Secure/);assert.match(a,/SameSite=Lax/);assert.notEqual(a,b);
 const original=await first.json();assert.equal(original.user.kind,'guest');assert.equal(original.snapshot,null);
 assert(!a.includes(original.user.id));
 const guest=(cookie,method='GET',body,origin='https://game.test')=>new Request('https://game.test/api/campaign',{method,headers:{Cookie:cookie.split(';')[0],Origin:origin},...(body?{body:JSON.stringify(body)}:{})});
 const save=newCampaign();save.playerNickname='小宝';save.route='T08';save.line=2;
 assert.equal((await handleProgress(guest(a,'PUT',{revision:0,snapshot:save}),env)).status,200);
 const restored=await (await handleProgress(guest(a),env)).json();assert.equal(restored.user.id,original.user.id);assert.equal(restored.snapshot.playerNickname,'小宝');assert.equal(restored.snapshot.route,'T08');
 assert.equal((await(await handleProgress(guest(b),env)).json()).snapshot,null);
 assert.equal((await handleProgress(guest(a,'PUT',{revision:1,snapshot:save},'https://other.test'),env)).status,403);
 assert.equal((await handleProgress(req(null,'PUT',{revision:0,snapshot:save}),env)).status,401);
 const forged=await(await handleProgress(guest('surgispace_guest='+original.user.id),env)).json();assert.equal(forged.snapshot,null);assert.notEqual(forged.user.id,original.user.id);
});
test('public assets are served without a player identity',async()=>{
 const {default:worker}=await import('../worker/index.js');let called=false;
 const response=await worker.fetch(new Request('https://game.test/'),{ASSETS:{fetch(){called=true;return new Response('public game');}}});
 assert.equal(response.status,200);assert(called);
});
