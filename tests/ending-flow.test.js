import test from 'node:test';
import assert from 'node:assert/strict';
import {nodes} from '../src/case-data.js';
import {failureOutcome,failureStory,errorReason} from '../src/decision-feedback.js';
import {followUpDialogue} from '../src/follow-up.js';
import {GameState} from '../src/game-state.js';
import {validateSnapshot} from '../server/progress.js';
test('wrong choices use consequence groups and do not all lead to death',()=>{
 const groups=new Set();let count=0;
 for(const node of nodes)for(const option of node.options.filter(o=>o.id!==node.correctOptionId)){const outcome=failureOutcome(node,option.id);assert.ok(outcome.story.length>20);groups.add(outcome.group);assert.ok(failureStory(node,errorReason(node,option.id),option.id).includes(outcome.story));count++;}
 assert.equal(count,60);assert.ok(groups.size>10);
 const node=id=>nodes.find(n=>n.id===id);
 assert.equal(failureOutcome(node('S02'),'S02_0').group,failureOutcome(node('S02'),'S02_2').group);
 assert.notEqual(failureOutcome(node('S03'),'S03_0').group,failureOutcome(node('S03'),'S03_2').group);
 assert.match(failureOutcome(node('S08'),'S08_1').story,/死在手术台上/);assert.match(failureOutcome(node('S08'),'S08_1').story,/家属.*持刀/);
 assert.doesNotMatch(failureOutcome(node('D10'),'D10_1').story,/死亡|持刀/);assert.match(failureOutcome(node('D01'),'D01_2').story,/患者持刀/);assert.match(failureOutcome(node('S02'),'S02_0').story,/数日后/);assert.doesNotMatch(failureOutcome(node('S06'),'S06_0').story,/死在手术台|肾上腺功能衰竭/);assert.doesNotMatch(failureOutcome(node('S09'),'S09_0').story,/遗留纱布引发/);
});
test('follow-up is saved between surgery and success and adds no question or score',()=>{
 const g=new GameState();g.start('full');while(g.node){const r=g.begin(g.node.correctOptionId);g.complete(r.token);}
 assert.equal(g.status,'followup');assert.equal(g.index,20);assert.equal(g.log.length,20);assert.equal(g.correct,20);
 assert.equal(g.advanceFollowup(0),true);assert.equal(g.advanceFollowup(0),false);
 const restored=new GameState(validateSnapshot(g.snapshot()));assert.equal(restored.followupStep,1);
 restored.paused=true;assert.equal(restored.advanceFollowup(1),false);restored.paused=false;
 while(restored.status==='followup')restored.advanceFollowup(restored.followupStep);
 assert.equal(restored.status,'won');assert.equal(restored.followupStep,followUpDialogue.length);assert.equal(restored.correct,20);assert.equal(restored.log.length,20);
 assert.equal(restored.advanceFollowup(restored.followupStep),false);
 assert.throws(()=>validateSnapshot({...g.snapshot(),followupStep:999}));
 assert.equal(new GameState({...restored.snapshot(),followupStep:undefined}).status,'won');
 assert.ok(followUpDialogue.some(line=>line.speaker==='家属'));assert.ok(followUpDialogue.some(line=>line.speaker==='林先生'));assert.ok(followUpDialogue.some(line=>line.speaker==='医生'));
});

test('each wrong option has its own narrative lead and black-screen story stays distinct from the explanation',()=>{const stories=[];for(const n of nodes)for(const o of n.options.filter(o=>o.id!==n.correctOptionId)){const text=failureStory(n,errorReason(n,o.id),o.id);stories.push(text);assert.ok(text.split('\n\n').length>=4);assert.doesNotMatch(text,/你的选择：|本次错误：/);}assert.equal(new Set(stories).size,60);});
