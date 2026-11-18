import {followUpDialogue} from './follow-up.js';
import {nodes,visualStage} from './case-data.js';
export class GameState{
 constructor(saved){this.index=10;this.mode='surgery';this.status='ready';this.retries=0;this.diagnosisFailures=0;this.correct=0;this.elapsed=0;this.token=0;this.followupStep=0;this.log=[];this.paused=false;if(saved)this.restore(saved);}
 start(mode='surgery'){this.token++;this.followupStep=0;this.mode=mode;this.index=mode==='full'?0:10;this.status='ready';this.correct=0;this.log=[];this.elapsed=0;this.retries=0;this.diagnosisFailures=0;this.paused=false;}
 get node(){return nodes[this.index];}get stage(){return visualStage(this.index);}
 begin(optionId){if(this.status!=='ready'||this.paused||!this.node||!this.node.options.some(o=>o.id===optionId))return null;
 const n=this.node;if(optionId!==n.correctOptionId){this.log.push({id:n.id,result:'incorrect',optionId});this.status=n.phase==='diagnosis'?'diagnosisFailed':'failed';if(n.phase==='diagnosis')this.diagnosisFailures++;else this.retries++;this.token++;return {correct:false,node:n};}
 this.status='animating';const token=++this.token;return {correct:true,token,node:n};}
 complete(token){if(this.status!=='animating'||token!==this.token)return false;this.correct++;this.log.push({id:this.node.id,result:'correct'});this.index++;this.status=this.index===nodes.length?'followup':'ready';return true;}
 advanceFollowup(step){if(this.status!=='followup'||this.paused||step!==this.followupStep)return false;this.followupStep++;if(this.followupStep>=followUpDialogue.length)this.status='won';return true;}
 restart(){this.token++;this.paused=false;this.index=this.status==='diagnosisFailed'?0:10;this.status='ready';}
 snapshot(){return {version:3,index:this.index,status:this.status==='animating'?'ready':this.status,mode:this.mode,retries:this.retries,diagnosisFailures:this.diagnosisFailures,correct:this.correct,elapsed:this.elapsed,log:this.log,...(['followup','won'].includes(this.status)?{followupStep:this.followupStep}:{})};}
 restore(s){if(s.version!==3||!Number.isInteger(s.index)||s.index<0||s.index>nodes.length||!['ready','won','failed','diagnosisFailed','followup'].includes(s.status)||s.index===nodes.length&&!['won','followup'].includes(s.status)||['won','followup'].includes(s.status)&&s.index!==nodes.length)throw Error('存档版本或进度无效');const step=s.followupStep??(s.status==='won'?followUpDialogue.length:0);if(!Number.isInteger(step)||step<0||step>followUpDialogue.length||s.status==='followup'&&step>=followUpDialogue.length)throw Error('复查进度无效');this.followupStep=step;this.index=s.index;this.status=s.status;this.mode=s.mode==='full'?'full':'surgery';this.retries=Math.max(0,Number(s.retries)||0);this.diagnosisFailures=Math.max(0,Number(s.diagnosisFailures)||0);this.correct=Math.max(0,Number(s.correct)||0);this.elapsed=Math.max(0,Number(s.elapsed)||0);this.log=Array.isArray(s.log)?s.log.slice(-300):[];}
}
