import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import worker from '../worker/cloudflare.js';
import {newCampaign} from '../src/campaign-state.js';
function fixture(){const sql=new DatabaseSync(':memory:');sql.exec(fs.readFileSync(new URL('../worker/cloudflare-schema.sql',import.meta.url),'utf8'));return {DB:{prepare(query){return {bind(...args){return {async first(){return sql.prepare(query).get(...args)||null;},async run(){const r=sql.prepare(query).run(...args);return {meta:{changes:r.changes}};}};}};}},ASSETS:{fetch:async()=>new Response('game')}};}
const request=(cookie,method='GET',data)=>new Request('https://public.example/api/campaign',{method,headers:{Cookie:cookie||'',Origin:'https://public.example','oai-authenticated-user-id':'forged-account'},...(data?{body:JSON.stringify(data)}:{})});
test('Cloudflare public entry strips forged account identity and restores isolated guest saves',async()=>{
 const env=fixture(),a=await worker.fetch(request(),env),b=await worker.fetch(request(),env),cookie=a.headers.get('set-cookie').split(';')[0],other=b.headers.get('set-cookie').split(';')[0];assert.equal((await a.json()).user.kind,'guest');
 const snapshot=newCampaign();snapshot.playerNickname='测试医生';snapshot.route='T08';snapshot.line=2;
 const results=await Promise.all([worker.fetch(request(cookie,'PUT',{revision:0,snapshot}),env),worker.fetch(request(cookie,'PUT',{revision:0,snapshot}),env)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const restored=await(await worker.fetch(request(cookie),env)).json();assert.equal(restored.revision,1);assert.equal(restored.snapshot.line,2);assert.equal((await(await worker.fetch(request(other),env)).json()).snapshot,null);
 assert.equal((await worker.fetch(request(cookie,'PUT',{revision:0,snapshot}),env)).status,409);
 assert.equal((await worker.fetch(request(cookie,'PUT',{revision:1,snapshot}),env)).status,200);
 assert.equal((await worker.fetch(new Request('https://public.example/'),env)).status,200);
});
