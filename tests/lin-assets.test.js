import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const dir=new URL('../public/models/lux3d-patient/',import.meta.url),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('Lin cleanup preserves the original asset and ships a closed, textured chair-free derivative',()=>{
 const original=fs.readFileSync(new URL('clinic-patient.glb',dir)),raw=fs.readFileSync(new URL('lin-seated-clean.glb',dir)),record=JSON.parse(fs.readFileSync(new URL('lin-seated-clean.json',dir)));
 assert.equal(sha(original),record.sourceSha256);assert.equal(sha(raw),record.outputSha256);assert.equal(record.newPaidTasks,0);assert(record.removedChairFaces>1000);assert(record.handVerticesRelaxed>100);
 const length=raw.readUInt32LE(12),doc=JSON.parse(raw.toString('utf8',20,20+length)),bin=raw.subarray(28+length);
 assert(doc.nodes.some(n=>n.name==='Clinic_Detailed_Head'));assert(doc.nodes.some(n=>n.name==='Lin_Seated_ChairRemoved_HandsCleaned'));
 assert(doc.images.every(i=>i.bufferView!==undefined||i.uri?.startsWith('data:')));
 const mesh=doc.meshes[doc.nodes.find(n=>n.name==='Lin_Seated_ChairRemoved_HandsCleaned').mesh],edges=new Map();
 function values(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],base=(v.byteOffset||0)+(a.byteOffset||0),size=a.componentType===5126?4:a.componentType===5125?4:2,components=a.type==='VEC3'?3:1,stride=v.byteStride||size*components;return Array.from({length:a.count},(_,i)=>Array.from({length:components},(_,j)=>a.componentType===5126?bin.readFloatLE(base+i*stride+j*size):size===4?bin.readUInt32LE(base+i*stride):bin.readUInt16LE(base+i*stride)));}
 for(const p of mesh.primitives){const positions=values(p.attributes.POSITION).map(v=>v.map(x=>Math.round(x/0.00005)).join(',')),ix=values(p.indices).flat();for(let i=0;i<ix.length;i+=3)for(const [a,b]of [[ix[i],ix[i+1]],[ix[i+1],ix[i+2]],[ix[i+2],ix[i]]]){const pa=positions[a],pb=positions[b];if(pa===pb)continue;const key=[pa,pb].sort().join('|');edges.set(key,(edges.get(key)||0)+1);}}
 assert.equal([...edges.values()].filter(n=>n===1).length,0,'No open cut edges after removing the fused chair');
});
