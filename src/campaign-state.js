import {normalizeNickname,playerNickname} from './player-identity.js';
import {appendixNodes} from './case-appendix.js';
import {GameState} from './game-state.js';
export const STORY_ORDER=['T00','T01','T02','T03','T04','T05','renal','T07','days-later','T08','appendix','FU2','T09','won'];
export const CAMPAIGN_KEY='surgispace-v4-campaign'+(globalThis.SURGISPACE_PLAYER_ID?':'+encodeURIComponent(globalThis.SURGISPACE_PLAYER_ID):'');
export function newCampaign(){return {version:4,playerNickname:playerNickname(),campaignMode:'story',route:'T00',line:0,bridgePending:false,appendixIndex:0,appendixStatus:'speech',answers:[],reports:[],seen:[],renal:null,retries:0,elapsed:0,settings:{reducedMotion:false,muted:false},completed:false};}
export function validateCampaign(raw){
 if(!raw||raw.version!==4||raw.campaignMode!=='story'||!STORY_ORDER.includes(raw.route))throw Error('故事存档版本或节点无效');
 const s=structuredClone(raw);
 if(s.playerNickname!==undefined){if(typeof s.playerNickname!=='string')throw Error('昵称格式无效');s.playerNickname=s.playerNickname?normalizeNickname(s.playerNickname):'';}
 for(const [key,max] of [['line',100],['appendixIndex',appendixNodes.length-1],['retries',1e6],['elapsed',1e9]])if(!Number.isSafeInteger(s[key])||s[key]<0||s[key]>max)throw Error('故事存档数值无效');
 if(!['speech','question','operation','failed','feedback'].includes(s.appendixStatus))throw Error('病例状态无效');
 if(!Array.isArray(s.answers)||s.answers.length>600||s.answers.some(a=>!appendixNodes.some(n=>n.id===a.id&&n.options.some(o=>o.id===a.optionId))||typeof a.correct!=='boolean'))throw Error('病例答题记录无效');
 if(!Array.isArray(s.reports)||s.reports.some(r=>!['AR01','AR02','AR03'].includes(r))||!Array.isArray(s.seen)||s.seen.some(id=>!STORY_ORDER.includes(id)&&!['T06','note-read','finance-read','doc-ref','doc-company','doc-clinic'].includes(id)))throw Error('故事记录无效');
 if(s.renal)s.renal=new GameState(s.renal).snapshot();
 s.settings={reducedMotion:!!s.settings?.reducedMotion,muted:!!s.settings?.muted};s.completed=s.route==='won';
 // Operation poses are never persisted. Resume the uncommitted question.
 if(s.appendixStatus==='operation')s.appendixStatus='question';
 return s;
}
export function nextStory(s){const i=STORY_ORDER.indexOf(s.route);if(i<0||i===STORY_ORDER.length-1)return false;s.seen=[...new Set([...s.seen,s.route])];s.route=STORY_ORDER[i+1];s.line=0;s.completed=s.route==='won';return true;}
export function answerAppendix(s,optionId){if(s.route!=='appendix'||s.appendixStatus!=='question')return null;const n=appendixNodes[s.appendixIndex];if(!n.options.some(o=>o.id===optionId))return null;const correct=optionId===n.correctOptionId;s.answers.push({id:n.id,optionId,correct});if(!correct){s.retries++;s.appendixStatus='failed';}else s.appendixStatus='operation';return {node:n,correct};}
export function completeAppendix(s){if(s.route!=='appendix'||s.appendixStatus!=='operation')return false;s.appendixStatus='feedback';return true;}
export function advanceAppendix(s){if(s.route!=='appendix'||s.appendixStatus!=='feedback')return false;if(s.appendixIndex===appendixNodes.length-1){nextStory(s);return true;}s.appendixIndex++;s.appendixStatus='speech';return true;}
export function retryAppendix(s){if(s.route!=='appendix'||s.appendixStatus!=='failed')return false;s.appendixIndex=appendixNodes[s.appendixIndex].phase==='diagnosis'?0:5;s.appendixStatus='speech';if(s.appendixIndex===0)s.reports=[];return true;}
export function appendFailure(n,optionId){const choice=n.options.find(o=>o.id===optionId)?.text||'';return `你选择了：${choice}\n\n${n.hint}\n\n${n.phase==='diagnosis'?'这项判断使评估在关键处偏离，接诊被迫中断。周先生被转交给另一名医生。纸条被收走，你再也没有等到他的解释。':'团队叫停了你的操作，接手处理尚未解决的问题。你被带离手术室。那次接应没有如约出现在你面前。'}\n\n门外传来落锁声。你仍被留在这里。`;}
