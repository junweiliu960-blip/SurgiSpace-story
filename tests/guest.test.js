import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {DatabaseSync} from 'node:sqlite';
import {createGuestHandler} from '../server/guest.js';import {SQLiteAdapter} from '../server/sqlite-adapter.js';import {GameState} from '../src/game-state.js';import {CloudSave} from '../src/cloud-save.js';
const origin='https://game.example';
function fixture(){const db=new DatabaseSync(':memory:');for(const file of ['0001_players.sql','0002_guests.sql'])db.exec(fs.readFileSync('server/migrations/'+file,'utf8'));let time=Date.now();const handle=createGuestHandler({db:new SQLiteAdapter(db),assets:{fetch:async()=>new Response('game')},origin,now:()=>time});return {db,advance(ms){time+=ms;},call:(path,method='GET',cookie='',data,extra={})=>handle(new Request(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',Cookie:cookie,...extra},...(data?{body:JSON.stringify(data)}:{})}),{clientIP:'test'})};}
const cookie=r=>r.headers.get('set-cookie').split(';')[0];
function snapshot(index=0){const g=new GameState();g.start('full');g.index=index;return g.snapshot();}
test('public assets require no login; guest session is cookie-only and stable',async()=>{
 const f=fixture();assert.equal((await f.call('/')).status,200);const r=await f.call('/api/session'),c=cookie(r),body=await r.json();assert.equal(body.user.kind,'guest');assert.equal(body.user.email,undefined);assert.equal(body.progress.snapshot,null);assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Lax.*Secure/);assert.equal((await(await f.call('/api/session','GET',c)).json()).user.id,body.user.id);assert.equal((await f.call('/api/progress')).status,401);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM players').get().n,1);f.db.close();
});
test('guest isolation, forged IDs, CAS conflicts and origin checks protect saves',async()=>{
 const f=fixture();const a=cookie(await f.call('/api/session')),b=cookie(await f.call('/api/session'));const body={snapshot:snapshot(3),expectedRevision:0,player_id:'forged'};
 assert.equal((await f.call('/api/progress','PUT',a,body)).status,200);assert.equal((await(await f.call('/api/progress','GET',b)).json()).snapshot,null);assert.equal((await f.call('/api/progress','PUT',a,body)).status,409);assert.equal((await f.call('/api/progress','PUT',a,body,{Origin:'https://evil.example'})).status,403);assert.equal((await f.call('/api/guest/recovery-code','POST',a,null,{'Sec-Fetch-Site':'cross-site'})).status,403);assert.equal((await f.call('/api/progress','PUT',b,{...body,snapshot:{bad:1}})).status,400);f.db.close();
});
test('recovery works on another browser; code hashes only, rotation invalidates old codes',async()=>{
 const f=fixture();const a=cookie(await f.call('/api/session'));await f.call('/api/progress','PUT',a,{snapshot:snapshot(8),expectedRevision:0});await f.call('/api/guest/profile','PATCH',a,{nickname:'林医生'});
 const code=(await(await f.call('/api/guest/recovery-code','POST',a)).json()).code;const row=f.db.prepare('SELECT recovery_hash FROM guest_profiles').get();assert.equal(row.recovery_hash.length,64);assert.ok(!row.recovery_hash.includes(code));
 const restored=await f.call('/api/guest/recover','POST','',{code});const c=cookie(restored),r=await restored.json();assert.equal(r.user.nickname,'林医生');assert.equal(r.progress.snapshot.index,8);assert.equal((await(await f.call('/api/session','GET',c)).json()).user.id,r.user.id);
 await f.call('/api/guest/recovery-code','POST',a);assert.equal((await f.call('/api/guest/recover','POST','',{code})).status,400);assert.equal((await f.call('/api/guest/profile','PATCH',a,{nickname:'x'.repeat(25)})).status,400);f.db.close();
});
test('expired guest cookies cannot read saves, recovery restores the original record',async()=>{
 const f=fixture();const r=await f.call('/api/session'),a=cookie(r),id=(await r.json()).user.id;const code=(await(await f.call('/api/guest/recovery-code','POST',a)).json()).code;
 f.advance(366*86400000);assert.equal((await f.call('/api/progress','GET',a)).status,401);const restored=await(await f.call('/api/guest/recover','POST','',{code})).json();assert.equal(restored.user.id,id);f.db.close();
});
test('switching guest cookies cannot let an older tab overwrite the new identity',async()=>{
 const f=fixture();const ra=await f.call('/api/session'),a=cookie(ra),id=(await ra.json()).user.id;const b=cookie(await f.call('/api/session'));
 const result=await f.call('/api/progress','PUT',b,{snapshot:snapshot(6),expectedRevision:0},{'X-SurgiSpace-Player':id});assert.equal(result.status,401);assert.equal((await(await f.call('/api/progress','GET',b)).json()).revision,0);assert.equal((await f.call('/api/progress','GET',a)).status,200);f.db.close();
});
test('recovery guessing is rate-limited and never creates an account by email',async()=>{
 const f=fixture();for(let i=0;i<8;i++)assert.equal((await f.call('/api/guest/recover','POST','',{code:'bad',email:'alice@example.com'})).status,400);assert.equal((await f.call('/api/guest/recover','POST','',{code:'bad'})).status,429);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM players').get().n,0);f.db.close();
});
test('CloudSave boots and writes using guest sessions without an email',async()=>{
 const f=fixture();let c='';const cloud=new CloudSave({required:true,storage:{getItem:()=>null,setItem:()=>{}},fetcher:async(url,opts={})=>{const result=await f.call(url,opts.method||'GET',c,opts.body?JSON.parse(opts.body):undefined);if(result.headers.has('set-cookie'))c=cookie(result);return result;}});await cloud.bootstrap();assert.equal(cloud.user.kind,'guest');cloud.enqueue(snapshot(2));await cloud.flush();assert.equal(cloud.status,'synced');assert.equal((await(await f.call('/api/progress','GET',c)).json()).snapshot.index,2);f.db.close();
});
