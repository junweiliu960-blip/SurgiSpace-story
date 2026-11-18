import test from 'node:test';
import assert from 'node:assert/strict';
import {presentationKind,bubblePosition,overheadBubblePosition,shortenedLeader,DRAG_STEPS,TEXT_TRANSITIONS} from '../src/presentation-rules.js';
import {projectiveMatrix,SCREEN_QUAD,OFFICE_SCREEN_QUAD} from '../src/scene-screen.js';
import {followUpDialogue} from '../src/follow-up.js';
test('monitor projection maps all four content corners to the existing artwork',()=>{
 const m=projectiveMatrix(640,400,SCREEN_QUAD);
 for(const [i,[x,y]]of [[0,[0,0]],[1,[640,0]],[2,[640,400]],[3,[0,400]]]){const w=m[3]*x+m[7]*y+1;assert(Math.abs((m[0]*x+m[4]*y+m[12])/w-SCREEN_QUAD[i][0])<1e-6);assert(Math.abs((m[1]*x+m[5]*y+m[13])/w-SCREEN_QUAD[i][1])<1e-6);}
});
test('speech bubbles fit on screen and avoid the speaker face when free space exists',()=>{const p=bubblePosition({width:900,height:550},{width:310,height:140},{x:650,y:200},[{x:50,y:120,width:300,height:220}]);assert(p.x>=12&&p.x+310<=888&&p.y>=12&&p.y+140<=538);assert(p.x+310<608||p.x>692||p.y+140<145||p.y>240);});
test('stage events are distinct from speech; only physical kidney steps use a drag',()=>{assert.equal(presentationKind({speaker:'场景'}),'event');assert.equal(presentationKind({speaker:'陈医生 · 心理活动'}),'thought');assert.equal(presentationKind({speaker:'小黄 · 电话'}),'speech');assert(TEXT_TRANSITIONS.has('T03'));assert(!DRAG_STEPS.has('S01'));assert(!DRAG_STEPS.has('S04'));assert(DRAG_STEPS.has('S03'));assert(!followUpDialogue.some(l=>l.speaker==='家属'));});

test('office monitor has a separate projective registration from the clinic',()=>{assert.notDeepEqual(OFFICE_SCREEN_QUAD,SCREEN_QUAD);const m=projectiveMatrix(640,400,OFFICE_SCREEN_QUAD);for(const [i,[x,y]]of [[0,[0,0]],[1,[640,0]],[2,[640,400]],[3,[0,400]]]){const w=m[3]*x+m[7]*y+1;assert(Math.abs((m[0]*x+m[4]*y+m[12])/w-OFFICE_SCREEN_QUAD[i][0])<1e-6);assert(Math.abs((m[1]*x+m[5]*y+m[13])/w-OFFICE_SCREEN_QUAD[i][1])<1e-6);}});

test('patient dialogue stays above the head with a short leader that does not touch it',()=>{const head={x:450,y:260},p=overheadBubblePosition({width:900,height:550},{width:290,height:75},head);assert.equal(p.x+145,head.x);assert.equal(p.y+75,head.y-36);const end=shortenedLeader({x:450,y:p.y+75},head);assert.equal(end.x,head.x);assert.equal(Math.hypot(end.x-head.x,end.y-head.y),16);assert(end.y>p.y+75&&end.y<head.y);assert.equal(shortenedLeader({x:450,y:250},head),null);});
