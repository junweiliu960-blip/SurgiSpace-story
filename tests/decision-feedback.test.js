import test from 'node:test';
import assert from 'node:assert/strict';
import {nodes} from '../src/case-data.js';
import {errorReason,doctorReply,failureStory} from '../src/decision-feedback.js';
import {GameState} from '../src/game-state.js';
import {validateSnapshot} from '../server/progress.js';
test('all 60 wrong choices have distinct targeted explanations and selected replies',()=>{
 for(const n of nodes){const wrong=n.options.filter(o=>o.id!==n.correctOptionId);const feedback=wrong.map(o=>errorReason(n,o.id));assert.equal(new Set(feedback).size,3,n.id);for(const o of wrong){assert.notEqual(errorReason(n,o.id),n.hint,n.id);assert.ok(doctorReply(n,o.id).length>0);assert.match(failureStory(n,errorReason(n,o.id)),/GAME OVER/);}}
});
test('failed saves preserve the selected option; old logs stay compatible',()=>{
 const g=new GameState();g.start('full');g.begin('D01_0');assert.equal(validateSnapshot(g.snapshot()).log[0].optionId,'D01_0');const old=g.snapshot();delete old.log[0].optionId;assert.equal(validateSnapshot(old).status,'diagnosisFailed');
});
test('new challenge resets won state and mode checkpoint without retaining old result',()=>{
 for(const mode of ['full','surgery']){const g=new GameState();g.start(mode);while(g.node){const r=g.begin(g.node.correctOptionId);g.complete(r.token);}while(g.status==='followup')g.advanceFollowup(g.followupStep);assert.equal(g.status,'won');const saved=g.snapshot();g.start(mode);assert.equal(g.index,mode==='full'?0:10);assert.equal(g.status,'ready');assert.deepEqual(g.log,[]);assert.equal(g.elapsed,0);assert.equal(saved.status,'won');assert.deepEqual(new GameState(g.snapshot()).snapshot(),g.snapshot());}
});
