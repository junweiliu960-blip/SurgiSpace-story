import test from 'node:test';
import assert from 'node:assert/strict';
import {cinemaOrder,cinematicClips,sampleCutscene} from '../src/cinematic-data.js';
import {stories} from '../src/story-data.js';
test('every dialogue has finite deterministic animated shots',()=>{function finite(v){if(typeof v==='number')assert.ok(Number.isFinite(v));else if(v&&typeof v==='object')Object.values(v).forEach(finite);}for(const id of cinemaOrder){assert.equal(cinematicClips[id].length,stories[id].lines.length);cinematicClips[id].forEach((c,i)=>{for(let t=0;t<=c.duration;t+=.25)finite(sampleCutscene(id,i,t));assert.deepEqual(sampleCutscene(id,i,c.duration),sampleCutscene(id,i,c.duration+10));});}});
test('luggage changes ownership, door closes, escort keeps patient seated',()=>{assert.equal(sampleCutscene('T03',1,0).props.bag.owner,'handoff');assert.equal(sampleCutscene('T03',1,4).props.bag.owner,'huang');assert.equal(sampleCutscene('T05',7,6).actors.huang.visible,false);assert.equal(sampleCutscene('T05',7,6).linVisible,true);assert.equal(sampleCutscene('T09',3,2).actors.zhou.sit,1);assert.notDeepEqual(sampleCutscene('T09',3,0).actors.zhou.pos,sampleCutscene('T09',3,4).actors.zhou.pos);});
