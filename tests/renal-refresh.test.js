import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as T from 'three';
import {renalRegistration} from '../src/renal-registration.js';
import {refreshedRenalPorts,refreshedCutawayPorts} from '../src/renal-refresh-registration.js';
const base=new URL('../public/models/lux3d-renal-refresh/',import.meta.url),record=JSON.parse(fs.readFileSync(new URL('provenance.json',base))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
test('first-case refreshed ensemble and kidneys preserve three paid Lux3D jobs and embedded textures',()=>{
 assert.equal(record.newGenerationTasks,3);assert.equal(record.provider,'Aholo Lux3D');assert.equal(new Set(Object.values(record.assets).map(a=>a.taskId)).size,3);
 for(const [name,asset]of Object.entries(record.assets)){
  const raw=fs.readFileSync(new URL(name+'.glb',base));assert.equal(sha(raw),asset.outputSha256);const doc=JSON.parse(raw.toString('utf8',20,20+raw.readUInt32LE(12)));assert(doc.meshes.length);assert(doc.images.length);assert(doc.images.every(i=>i.bufferView!==undefined||i.uri?.startsWith('data:')));assert(doc.buffers.every(b=>!b.uri||b.uri.startsWith('data:')));
 }
 const raw=fs.readFileSync(new URL('kidney-registered.glb',base));assert.equal(sha(raw),record.registeredKidneySha256);assert.equal(sha(fs.readFileSync(new URL('cutaway-registered.glb',base))),record.registeredCutawaySha256);
});
test('refreshed renal artery and vein ports remain within bridging distance of the registered vascular anatomy',()=>{
 for(const ports of [refreshedRenalPorts,refreshedCutawayPorts])for(const id of ['artery','vein']){const point=new T.Vector3(...ports[id]).applyEuler(new T.Euler(-Math.PI/2,0,0)).multiplyScalar(renalRegistration.scale).add(new T.Vector3(...renalRegistration.origin));assert(point.distanceTo(new T.Vector3(...renalRegistration.ports[id].nativeAnchor))<.025);}
 const artery=refreshedRenalPorts.artery,vein=refreshedRenalPorts.vein;assert(artery[2]<vein[2],'Artery stays posterior to vein in the registered supine field');
});
