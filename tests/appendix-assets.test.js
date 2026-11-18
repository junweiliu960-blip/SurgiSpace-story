import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir=new URL('../public/models/lux3d-appendix/',import.meta.url);
function read(name){const bytes=readFileSync(new URL(name,dir));assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);return {bytes,doc:JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString())};}
test('all appendix states preserve the same named anatomy and embedded PBR assets',()=>{
 const counts=[];
 for(const file of ['01-covered.glb','02-complete.glb','03-layers.glb']){const {doc}=read(file);for(const key of ['cecum','ileum','appendix','mesoappendix'])assert(doc.nodes.some(n=>n.name===key));assert(doc.images?.length>0);for(const image of doc.images)assert(doc.bufferViews[image.bufferView]);const surfaceNodes=doc.nodes.filter(n=>['cecum','ileum','appendix','mesoappendix'].includes(n.name));counts.push(surfaceNodes.map(n=>doc.meshes[n.mesh].primitives.reduce((total,p)=>total+doc.accessors[p.indices].count,0)));}
 assert.deepEqual(counts[0],counts[1]);assert.deepEqual(counts[1],counts[2]);
 const {doc:covered}=read('01-covered.glb'),{doc:full}=read('02-complete.glb');assert(covered.nodes.find(n=>n.name==='OrganCover').scale[0]>0);assert.equal(full.nodes.find(n=>n.name==='OrganCover').scale[0],0);
});
test('delivered model hashes match the single recorded Lux3D task and contain no runtime API credentials',()=>{
 const provenance=JSON.parse(readFileSync(new URL('provenance.json',dir)));assert.equal(provenance.taskId,8204091);assert.equal(provenance.sourceFaces,Object.values(provenance.semanticFaceCounts).reduce((a,b)=>a+b,0));assert.equal(provenance.inputMethod,'text-to-3D');
 for(const [name,hash]of Object.entries(provenance.outputs)){const {bytes}=read(name);assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);}
 assert(!/authorization|api_key|apiKey/.test(JSON.stringify(provenance)));
});

test('three paid scene assets embed their textures and match recorded hashes and credits',()=>{
 const provenance=JSON.parse(readFileSync(new URL('scene/provenance.json',dir)));
 assert.deepEqual(Object.values(provenance).map(x=>x.taskId),[8205876,8205880,8206264]);
 for(const [name,item]of Object.entries(provenance)){const {bytes,doc}=read('scene/'+name+'.glb');assert.equal(item.consumedCredits,20);assert.equal(createHash('sha256').update(bytes).digest('hex'),item.outputSha256);assert(doc.images.length>0);assert(doc.images.every(i=>Number.isInteger(i.bufferView)&&!i.uri));}
});
