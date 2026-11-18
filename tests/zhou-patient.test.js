import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
function read(name){const b=readFileSync(new URL('../public/models/lux3d-patient/'+name,import.meta.url));assert.equal(b.readUInt32LE(0),0x46546c67);assert.equal(b.readUInt32LE(8),b.length);return JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString());}
test('Zhou is a registered derivative of the existing patient, with no replacement skeleton',()=>{
 const original=read('skin-base-lux.glb'),young=read('zhou-supine.glb');
 assert.deepEqual(young.meshes.map(m=>m.name),original.meshes.map(m=>m.name));assert.equal(young.asset.extras.caseId,'CASE_APP_002');assert.equal(young.asset.extras.age,32);assert.equal(young.asset.extras.sex,'male');
 const headA=original.accessors[original.meshes.find(m=>m.name==='FJ2813').primitives[0].attributes.POSITION],headB=young.accessors[young.meshes.find(m=>m.name==='FJ2813').primitives[0].attributes.POSITION];
 for(let i=0;i<3;i++){assert(Math.abs(headA.min[i]-headB.min[i])<.001);assert(Math.abs(headA.max[i]-headB.max[i])<.001);}
 assert.deepEqual(young.nodes.find(n=>n.name==='FJ2815').scale,[0,0,0]);assert(young.materials.some(m=>m.name==='Zhou_short_dark_hair'));
});
test('reused cloth is labelled for the appendix patient and retains valid embedded data',()=>{const cloth=read('zhou-drape.glb');assert.equal(cloth.asset.extras.caseId,'CASE_APP_002');assert(cloth.asset.extras.derivation.includes('no nephrectomy incision'));for(const image of cloth.images||[])assert(cloth.bufferViews[image.bufferView]);});
