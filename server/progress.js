import {GameState} from '../src/game-state.js';
import {nodes} from '../src/case-data.js';
const ids=new Set(nodes.map(n=>n.id));
export function validateSnapshot(s){
 if(!s||typeof s!=='object'||Array.isArray(s))throw Error('无效存档');
 if(s.version!==3||!['full','surgery'].includes(s.mode))throw Error('存档版本不兼容');
 for(const k of ['index','correct','retries','diagnosisFailures','elapsed'])if(!Number.isSafeInteger(s[k])||s[k]<0||s[k]>1e8)throw Error('存档数值无效');
 if(!Array.isArray(s.log)||s.log.length>300||s.log.some(x=>!x||!ids.has(x.id)||!['correct','incorrect'].includes(x.result)))throw Error('决策记录无效');
 if(s.status==='diagnosisFailed'&&s.index>=10||s.status==='failed'&&(s.index<10||s.index>=20)||s.mode==='surgery'&&s.index<10)throw Error('阶段与存档不符');
 const state=new GameState(s);return {...state.snapshot(),log:s.log.map(({id,result,optionId})=>({id,result,...(nodes.find(n=>n.id===id)?.options.some(o=>o.id===optionId)?{optionId}:{})}))};
}
export class ProgressStore{
 constructor(db){this.db=db;}
 async findByEmail(email){return await this.db.prepare('SELECT id FROM players WHERE email=? COLLATE NOCASE').bind(email).first();}
 async identify(user){const now=new Date().toISOString();await this.db.prepare('INSERT INTO players (id,email,created_at,last_seen_at) VALUES (?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,last_seen_at=excluded.last_seen_at').bind(user.id,user.email,now,now).run();}
 async read(id){const row=await this.db.prepare('SELECT revision,snapshot,updated_at FROM progress WHERE player_id=?').bind(id).first();return row?{revision:row.revision,snapshot:JSON.parse(row.snapshot),updatedAt:row.updated_at}:{revision:0,snapshot:null,updatedAt:null};}
 async write(id,snapshot,expectedRevision){const now=new Date().toISOString();
  // A single conditional SQL statement provides compare-and-swap across devices.
  const result=expectedRevision===0
   ?await this.db.prepare('INSERT INTO progress (player_id,revision,snapshot,updated_at) VALUES (?,1,?,?) ON CONFLICT(player_id) DO NOTHING').bind(id,JSON.stringify(snapshot),now).run()
   :await this.db.prepare('UPDATE progress SET revision=revision+1,snapshot=?,updated_at=? WHERE player_id=? AND revision=?').bind(JSON.stringify(snapshot),now,id,expectedRevision).run();
  return result.meta.changes===1?{revision:expectedRevision+1,snapshot,updatedAt:now}:null;
 }
}
