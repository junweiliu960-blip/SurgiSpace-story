import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const folder=new URL('../public/models/lux3d-huang/',import.meta.url);
test('Xiao Huang uses the recorded Lux3D model with embedded textures and skinned geometry',()=>{
 const raw=fs.readFileSync(new URL('huang-rigged.glb',folder)),record=JSON.parse(fs.readFileSync(new URL('provenance.json',folder)));
 assert.equal(raw.toString('ascii',0,4),'glTF');assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),record.outputSha256);
 assert.equal(record.provider,'Aholo Lux3D');assert(record.modelTaskId);assert(record.rigTaskId);
 const doc=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)));
 assert(doc.skins?.some(s=>s.joints.length>=15));
 assert(doc.meshes.some(m=>m.primitives.some(p=>p.attributes.JOINTS_0!==undefined&&p.attributes.WEIGHTS_0!==undefined)));
 assert(doc.images?.length);assert(doc.images.every(i=>i.bufferView!==undefined||i.uri?.startsWith('data:')));
 assert(doc.buffers.every(b=>!b.uri||b.uri.startsWith('data:')));
});
