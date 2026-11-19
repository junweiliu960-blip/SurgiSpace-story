import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const root=new URL('../public/models/lux3d-gi-theatre/',import.meta.url);
test('theatre assembly and complete GI model retain their two paid Lux3D jobs and embedded textures',()=>{
 const record=JSON.parse(fs.readFileSync(new URL('provenance.json',root)));assert.equal(record.newGenerationTasks,2);assert.notEqual(record.assets.bed.taskId,record.assets.gi.taskId);
 for(const key of ['bed','gi']){const raw=fs.readFileSync(new URL(key+'.glb',root));assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),record.assets[key].outputSha256);assert.equal(raw.readUInt32LE(8),raw.length);const doc=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)));assert(doc.meshes.length);assert(doc.images.length);assert(doc.images.every(i=>i.bufferView!==undefined||i.uri?.startsWith('data:')));if(key==='bed'){assert(doc.nodes.some(n=>n.name==='Zhou_Lux3D_Head_Reused'));assert(doc.nodes.some(n=>n.name==='Abdominal_Skin_Window'));assert.equal(doc.nodes.filter(n=>n.name?.startsWith('Laparoscopic_Port_Marker')).length,3);}}
 assert.equal(record.localDetail.source,'models/lux3d-appendix/02-complete.glb');
});
