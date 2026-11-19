// R2-compatible conditional save operations backed by an atomic D1 statement.
export class D1SaveBucket {
 constructor(db){this.db=db;}
 async get(key){const row=await this.db.prepare('SELECT payload, revision FROM player_saves WHERE save_key = ?').bind(key).first();return row?{etag:String(row.revision),json:async()=>JSON.parse(row.payload)}:null;}
 async put(key,payload,{onlyIf}){const revision=JSON.parse(payload).revision;let statement;
  if(onlyIf.etagDoesNotMatch==='*')statement=this.db.prepare('INSERT INTO player_saves (save_key,payload,revision) VALUES (?,?,?) ON CONFLICT(save_key) DO NOTHING').bind(key,payload,revision);
  else if(onlyIf.etagMatches!==undefined)statement=this.db.prepare('UPDATE player_saves SET payload = ?, revision = ? WHERE save_key = ? AND revision = ?').bind(payload,revision,key,Number(onlyIf.etagMatches));
  else throw Error('Conditional write required');
  const result=await statement.run();return result.meta.changes===1?{etag:String(revision)}:null;
 }
}
