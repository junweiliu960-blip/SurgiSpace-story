import test from 'node:test';
import assert from 'node:assert/strict';
import {APPENDIX_SCENES,appendixScene,appendixCues} from '../src/appendix-sequence.js';
import {appendixNodes} from '../src/case-appendix.js';
test('each original surgery question has a dedicated staged scene and finite completed action',()=>{
 assert.deepEqual(APPENDIX_SCENES.map(s=>s.id),appendixNodes.filter(n=>n.phase==='surgery').map(n=>n.id));
 for(const scene of APPENDIX_SCENES){assert(scene.cues.length>0);assert.equal(scene.actions.at(-1)[1],1);let previous=0;for(const [text,target]of scene.actions){assert(text);assert(target>previous);previous=target;}}
 assert.equal(appendixScene(5).scope,false);assert(APPENDIX_SCENES.slice(0,5).every(s=>s.scope));
});
test('AS04 does not put the specimen in a bag before the correct decision and retains return-check stage',()=>{assert.equal(appendixCues(3,0).bag,false);assert.equal(appendixCues(3,.55).bag,true);assert.equal(appendixCues(3,1).bag,false);assert(appendixScene(3).actions.at(-1)[0].includes('返回术野'));});
test('AS05 treats persistent bleeding and the gauze discrepancy as separate unresolved issues',()=>{const initial=appendixCues(4,0),bloodOnly=appendixCues(4,.5),resolved=appendixCues(4,.85);assert(initial.bleeding&&initial.discrepancy);assert(!bloodOnly.bleeding&&bloodOnly.discrepancy);assert(!resolved.bleeding&&!resolved.discrepancy);});
test('AS06 cannot show safe transfer until assessment and handover are complete',()=>{assert.equal(appendixCues(5,0).transportReady,false);assert(appendixCues(5,.34).assessed);assert.equal(appendixCues(5,.34).handedOver,false);assert.equal(appendixCues(5,.67).transportReady,false);assert(appendixCues(5,1).transportReady);});
