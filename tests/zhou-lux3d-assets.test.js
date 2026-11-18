import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const folder=new URL('../public/models/lux3d-zhou/',import.meta.url),images=new URL('../public/images/lux3d-zhou/',import.meta.url),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
test('ill and recovery Zhou models are separate recorded Lux3D jobs with complete embedded assets',()=>{
 const provenance=JSON.parse(fs.readFileSync(new URL('provenance.json',folder)));
 assert.equal(provenance.provider,'Aholo Lux3D');assert.equal(provenance.age,32);assert.equal(provenance.newGenerationTasks,2);
 const ids=new Set(),hashes=new Set();
 for(const kind of ['ill','recovery']){
  const entry=provenance.models[kind],raw=fs.readFileSync(new URL(entry.file,folder));ids.add(entry.taskId);hashes.add(entry.sha256);
  assert.equal(hash(raw),entry.sha256);assert.equal(raw.readUInt32LE(8),raw.length);assert.equal(raw.toString('ascii',0,4),'glTF');
  assert.equal(hash(fs.readFileSync(new URL(kind+'-reference.png',images))),entry.referenceSha256);
  const doc=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)));
  assert(doc.meshes?.length);assert(doc.images?.length);assert(doc.materials?.length);
  assert(doc.images.every(i=>i.bufferView!==undefined||i.uri?.startsWith('data:')));assert(doc.buffers.every(b=>!b.uri||b.uri.startsWith('data:')));
  assert(entry.triangles>1000);assert.equal(entry.faceCountRequested,100000);
 }
 assert.equal(ids.size,2);assert.equal(hashes.size,2);
});
