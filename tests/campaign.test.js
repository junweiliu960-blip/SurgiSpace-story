import test from 'node:test';
import assert from 'node:assert/strict';
import {appendixNodes} from '../src/case-appendix.js';
import {newCampaign,validateCampaign,nextStory,answerAppendix,completeAppendix,advanceAppendix,retryAppendix,STORY_ORDER} from '../src/campaign-state.js';
import {stories,errorDetails} from '../src/story-data.js';
import {GameState} from '../src/game-state.js';
test('user source contains five diagnosis and six operation questions with source S01 namespaced',()=>{
 assert.equal(appendixNodes.length,11);assert.equal(appendixNodes.filter(n=>n.phase==='diagnosis').length,5);
 assert.equal(appendixNodes[5].sourceId,'S01');assert.equal(appendixNodes[5].id,'AS01');assert(!appendixNodes.some(n=>n.id==='AD06'));
 assert.deepEqual(appendixNodes.map(n=>n.correctOptionId.split('_')[1]),['0','2','1','3','0','3','3','0','2','1','3']);
 assert(appendixNodes[4].options[0].text.includes('结合您持续加重的症状和团队评估，本例建议手术治疗'));
 assert(!JSON.stringify(appendixNodes).includes('有极大的穿孔可能'));
});
test('every appendix wrong choice has an exact reason and retries its own case phase',()=>{
 let count=0;for(let i=0;i<appendixNodes.length;i++)for(const opt of appendixNodes[i].options){if(opt.id===appendixNodes[i].correctOptionId)continue;
  const s=newCampaign();s.route='appendix';s.appendixIndex=i;s.appendixStatus='question';
  assert(errorDetails[appendixNodes[i].id][Number(opt.id.split('_')[1])]);assert.equal(answerAppendix(s,opt.id).correct,false);assert.equal(answerAppendix(s,opt.id),null);
  assert.equal(validateCampaign(s).answers.at(-1).optionId,opt.id);retryAppendix(s);assert.equal(s.appendixIndex,i<5?0:5);count++;
 }assert.equal(count,33);
});
test('full story finishes only after both cases, recovery and rescue',()=>{
 const s=newCampaign();for(const id of STORY_ORDER.slice(0,6)){assert.equal(s.route,id);nextStory(s);}
 assert.equal(s.route,'renal');s.renal=new GameState().snapshot();nextStory(s);assert.equal(s.route,'T07');nextStory(s);assert.equal(s.route,'days-later');nextStory(s);nextStory(s);
 assert.equal(s.route,'appendix');for(const n of appendixNodes){s.appendixStatus='question';assert.equal(answerAppendix(s,n.correctOptionId).correct,true);assert.equal(answerAppendix(s,n.correctOptionId),null);assert.equal(advanceAppendix(s),false);completeAppendix(s);assert.equal(completeAppendix(s),false);advanceAppendix(s);}
 assert.equal(s.route,'FU2');assert.equal(advanceAppendix(s),false);assert.equal(s.route,'FU2');assert.equal(s.completed,false);nextStory(s);assert.equal(s.route,'T09');nextStory(s);assert.equal(s.completed,true);assert.equal(nextStory(s),false);
});
test('interrupted operations restore before action, source logs and renal v3 remain intact',()=>{
 const s=newCampaign();s.route='appendix';s.appendixIndex=7;s.appendixStatus='operation';s.seen=['finance-read','doc-ref','T06'];const renal=new GameState();renal.start('full');s.renal=renal.snapshot();
 assert.equal(validateCampaign(s).appendixStatus,'question');assert.deepEqual(validateCampaign(s).renal,s.renal);
 for(const bad of [{...s,route:'unknown'},{...s,answers:[{id:'D01',correct:true,optionId:'D01_0'}]},{...s,appendixIndex:11},{...s,seen:['unknown']}])assert.throws(()=>validateCampaign(bad));
});
test('all story scenes have actions and leave clinical content outside cutscene answer logic',()=>{
 assert.equal(Object.keys(stories).length,11);for(const scene of Object.values(stories)){assert(scene.lines.length>1);assert(scene.lines.every(l=>l.text&&l.speaker&&l.action));}assert(stories.T09.lines.some(l=>l.action==='wheelchair'));assert(stories.T08.lines.some(l=>l.action==='note'));
});

test('days-later intertitle resumes between the first-case aftermath and the second patient',()=>{const s=newCampaign();s.route='T07';nextStory(s);assert.equal(s.route,'days-later');const restored=validateCampaign(JSON.parse(JSON.stringify(s)));assert.equal(restored.route,'days-later');assert(!restored.seen.includes('days-later'));nextStory(restored);assert.equal(restored.route,'T08');assert(restored.seen.includes('days-later'));assert.equal(restored.line,0);});
