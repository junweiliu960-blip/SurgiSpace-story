import {doctorName,doctorText,doctorSpeaker} from './player-identity.js';
import {mountSceneScreen} from './scene-screen.js';
import {DRAG_STEPS} from './presentation-rules.js';
import {mountPhotoHotspots} from './photo-layout.js';
import './photo-scene.css';
import {connectDialogue,screenPoint} from './dialogue-presentation.js';
import {mountCampaign} from './campaign.js';
import {mountLocalStorage} from './local-storage.js';
import {mountGuestStorage,downloadBackup} from './guest-storage.js';
import {answeredQuestions,mountQuestionReview} from './question-review.js';
import {followUpDialogue} from './follow-up.js';
import './style.css';
import {errorReason,doctorReply,patientSpeech,failureStory} from './decision-feedback.js';
import {CASE,nodes,surgery,evidence,phaseTitle,unlockedEvidence} from './case-data.js';
import {GameState} from './game-state.js';
import {createFallbackScene} from './fallback-scene.js';
import {CloudSave} from './cloud-save.js';
const roomAssets=new URL(import.meta.env.BASE_URL+'images/backgrounds/',document.baseURI).href;
const $=s=>document.querySelector(s),key='surgispace-v3-save'+(globalThis.SURGISPACE_PLAYER_ID?':'+encodeURIComponent(globalThis.SURGISPACE_PLAYER_ID):'');let game=new GameState(),world,selected=null,started=false,showHints=false,paused=false,sound=false,lastFocus=null;
let campaign=null;
let storageTransition=false;
const cloudRequired=import.meta.env.VITE_CLOUD_REQUIRED==='true';
const cloud=new CloudSave({required:cloudRequired,onChange:updateCloudStatus});
let kidneyCleanup=null,kidneyAbort=null;
let interaction='question',flowEpoch=0,endingTimer,speechNode=null,reportDialogIndex=null;
const icons={book:'▤',check:'✓',arrow:'↗',pause:'Ⅱ'};
document.querySelector('#app').innerHTML=`
<header class="topbar"><a class="brand" href="#" aria-label="返回主菜单"><span class="brand-icon">S<span>+</span></span><span>SurgiSpace<small>外 科 密 室</small></span></a><div class="case-header"><span class="live-dot"></span><span>病例 001</span><span class="divider"></span><strong>右肾肿瘤</strong><span class="case-tag">单人任务</span></div><div class="top-actions"><button id="account" class="quiet" hidden></button><button id="help" class="icon-btn" title="操作说明">?</button><button id="pause" class="icon-btn" aria-label="暂停">Ⅱ</button><button id="menu" class="quiet">主菜单</button></div></header>
<main class="workspace"><aside class="journey"><div class="eyebrow">OPERATION BRIEF</div><h1>观察证据，作出判断，<br>一步步推进治疗</h1><div id="phase-list"></div><div class="patient-card"><div class="patient-avatar">林</div><div><strong>林先生 <span>65 岁 · 男</span></strong><small>CASE_RN_R_001</small></div></div><dl class="vitals"><div><dt>心率</dt><dd>72 <small>bpm</small></dd></div><div><dt>血氧</dt><dd>98 <small>%</small></dd></div></dl><svg class="ecg" viewBox="0 0 240 45"><path d="M0 25h35l7-5 7 5h22l5-14 6 29 7-35 7 20h35l8-5 8 5h28l5-14 6 29 7-35 7 20h35"/></svg><div class="side-note"><span class="live-dot"></span>模拟生命体征 · 非实时监护</div><button id="credits" class="source-link">模型来源与制作说明 ↗</button></aside>
<section class="viewport" aria-label="三维手术场景"><canvas id="scene" aria-label="患者与手术室三维视图"></canvas><div id="graphics-status" role="status"><span id="graphics-message">正在准备场景…</span><button id="retry-graphics" hidden>重试三维</button></div><div class="view-top"><span class="view-label">OPERATING ROOM <b>01</b></span><span class="prototype">制作原型 · 操作示意</span></div><div id="loading" role="status"><span class="loader"></span><h2>正在准备手术室</h2><p id="load-text">正在加载本地三维资产…</p></div><div id="consultation" hidden><div class="consult-nav"><button id="look-computer">查看电脑</button><button id="look-patient">与患者对话</button></div><button id="computer-screen-trigger" aria-label="点击电脑屏幕放大查看" hidden></button><button id="report-notification" aria-label="您已收到检测结果，请查验。点击放大电脑屏幕" hidden>您已收到检测结果，请查验。</button><section id="computer-panel"><header class="computer-panel-controls"><span>诊桌电脑 · 电子病例</span><button id="close-computer" type="button" aria-label="关闭病例，返回问诊">关闭病例 ×</button></header><section id="report-arrival" hidden><header><small>林先生 · 检查报告</small><h2 id="report-notice-title"></h2></header><div id="report-preview" class="report-preview"></div><div class="report-actions"><button id="view-examination-report" class="primary">独立查看报告 ↗</button><button id="report-read-done" class="secondary">阅读完毕，返回场景</button></div></section><div class="computer-title">林先生 · 电子病历 <span>CASE 001</span></div><nav id="record-tabs"></nav><div id="record-content"></div></section><div id="dialogue-bubble"></div></div><div id="scene-markers" hidden></div><div id="anatomy-badge" hidden>解剖示意模式 · 仅观察，不改变手术进度</div><div id="renal-hotspots" hidden aria-label="肾脏结构学习点位"><svg aria-hidden="true"><line data-renal-line="artery" /><line data-renal-line="vein" /><line data-renal-line="ureter" /><line data-renal-line="adrenal" /></svg><button data-renal-structure="artery" aria-label="肾动脉"><i></i><span>① 肾动脉</span></button><button data-renal-structure="vein" aria-label="肾静脉"><i></i><span>② 肾静脉</span></button><button data-renal-structure="ureter" aria-label="输尿管"><i></i><span>③ 输尿管</span></button><button data-renal-structure="adrenal" aria-label="肾上腺"><i></i><span>肾上腺</span></button></div><div class="camera-controls"><button data-camera="overview" class="active">全身</button><button data-camera="access">术区</button><button data-camera="kidney">近景</button><button id="anatomy">解剖示意</button><button id="kidney-explorer" hidden>肾脏结构探索</button></div><div class="view-bottom"><span id="scene-status">鼠标拖动观察 · 滚轮缩放</span><button id="labels" title="结构标签">标签 <span>开</span></button></div><button id="review-answered" class="secondary" hidden>回看已答题</button><button id="next-step" class="primary" hidden>下一步 <span>→</span></button><section id="scene-decision"><div id="question-content"><div class="task-top"><span id="phase-name">术前准备</span><span id="step-count">01 / 10</span></div><div class="progress"><i id="progress-fill"></i></div><div class="eyebrow task-id" id="task-id">S01 / CHECKLIST</div><h2 id="task-title">患者与术式</h2><p id="question"></p><div id="options" role="group" aria-label="答案选项"></div><div id="hint" hidden></div><div class="task-actions"><button id="hint-button" class="quiet">查看线索</button><span>1–4 选择 · Enter 确认</span></div><button id="confirm" class="primary" disabled>确认并执行 <span>→</span></button><div id="feedback" role="status"></div></div><section id="doctor-reply" hidden><small id="reply-speaker"></small><p id="reply-text"></p><button id="advance-dialogue" class="primary">继续 <span>→</span></button></section></section><section id="surgical-brief" hidden><small>手术团队提示</small><p id="surgical-brief-text"></p></section><section id="followup-dialogue" hidden><div class="task-top"><span>术后复查</span><span id="followup-count"></span></div><h2 id="followup-speaker"></h2><p id="followup-text"></p><button id="followup-next" class="primary">继续对话 →</button></section><div id="operation-caption" role="status" hidden></div></section>
<aside class="decision"><div id="surgery-decision"></div><div class="evidence-heading"><strong>病例资料</strong><button id="case-file">完整病例 ↗</button></div><div id="evidence-links"></div><div class="toolcard"><span>当前器械</span><strong id="tool-name">核查清单</strong><small id="tool-description">先确认信息，再开始操作。</small></div><div class="footer-note">虚构教学病例 · 医学内容待专业复核</div></aside></main>
<div id="overlay" class="overlay"><section id="welcome" class="welcome"><div class="eyebrow">SURGISPACE/FIRST OPERATION</div><h2>开始你的行医之旅</h2><button class="primary" id="start-full">开始问诊 <span>→</span></button><small class="welcome-note">此为游戏制作原型，操作经过简化，不作为临床指导</small></section></div>
<div id="sync-banner" hidden><span id="sync-message"></span><button id="sync-retry">重试同步</button><button id="sync-remote">读取云端</button><button id="sync-login">重新登录</button><button id="sync-export" hidden>导出本机备份</button></div><dialog id="dialog"><button class="dialog-close" aria-label="关闭">×</button><div id="dialog-content"></div></dialog>`;
const phases=['诊疗推理','术前准备','建立术野','器官处理','收尾交接'];
function render(){
 $('#review-answered').hidden=!started||answeredQuestions(game).length===0;$('#review-answered').disabled=game.status==='animating';
 const dx=game.index<10;$('.workspace').classList.toggle('clinic-layout',dx||game.status==='followup');const host=$('#surgery-decision');if($('#question-content').parentElement!==host)host.prepend($('#question-content'));
 if(dx&&game.node&&game.status==='ready'&&speechNode!==game.node.id){speechNode=game.node.id;interaction=currentExamination()?'report':'speech';consultView='patient';world?.lookConsultation(consultView);}
 $('#next-step').hidden=!(started&&dx&&game.status==='ready'&&['speech','report-ready'].includes(interaction));$('#next-step').disabled=paused;
 $('#scene-decision').hidden=game.status==='followup';$('#followup-dialogue').hidden=game.status!=='followup';$('#followup-next').disabled=paused;$('#surgical-brief').hidden=dx||!game.node||!['ready','animating'].includes(game.status);if(!$('#surgical-brief').hidden)$('#surgical-brief-text').textContent=game.node.context.replace(/^剧情(?:线索)?：/,'');
 $('#question-content').hidden=game.status==='followup'||dx&&interaction!=='question';$('#doctor-reply').hidden=interaction!=='reply';
 $('#kidney-explorer').hidden=!started||dx||game.index<12||game.index>18||game.status!=='ready';
 const n=game.node;const won=game.status==='won';$('#phase-name').textContent=won?'任务完成':phaseTitle(game.index);$('#step-count').textContent=game.index<10?`${String(game.index+1).padStart(2,'0')} / 10`:`${String(Math.min(10,game.index-9)).padStart(2,'0')} / 10`;
 $('#progress-fill').style.width=(game.index<10?game.index/10:(game.index-10)/10)*100+'%';
 $('#phase-list').innerHTML=phases.map((p,i)=>{const current=p===phaseTitle(Math.min(game.index,19)),done=phases.indexOf(phaseTitle(Math.min(game.index,19)))>i;return `<div class="phase ${current?'current':''} ${done?'done':''}"><span>${done?'✓':String(i+1).padStart(2,'0')}</span><div><strong>${p}</strong><small>${['10 个证据节点','核对与准备','逐步显露术野','定位与处理','复查与交接'][i]}</small></div>${current?'<b>●</b>':''}</div>`;}).join('');

 if(n){$('#task-id').textContent=n.id+' / '+(n.phase==='diagnosis'?'DIAGNOSIS':'OPERATION');$('#task-title').textContent=n.title;$('#question').textContent=n.prompt;syncEncounter();const opts=[...n.options]; // Deterministic per-run shuffle, answers remain stable IDs.
 // Preserve the document's A–D ordering and numbered references.
 $('#options').innerHTML=opts.map((o,i)=>`<button class="option ${selected===o.id?'selected':''}" data-option="${o.id}" ${game.status!=='ready'||paused||interaction!=='question'?'disabled':''}><span>${String.fromCharCode(65+i)}</span><strong>${o.text}</strong><i>${selected===o.id?'●':''}</i></button>`).join('');
 $('#hint').textContent=n.hint;$('#hint').hidden=!showHints;$('#hint-button').textContent=showHints?'收起线索':'查看线索';$('#confirm').disabled=!selected||game.status!=='ready'||paused||interaction!=='question';
 const tool={scalpel:['手术刀','Lux3D 外观初稿 · 人工修整'],retractor:['拉钩','用于本关显露动画'],clamp:['止血钳','用于简化的结构处理示意'],forceps:['组织镊','用于标本移出表现'],suction:['吸引器','术野复查表现'],needle:['持针器','用于压缩的关闭动画']}[n.tools[0]]||['核查与观察','先确认信息，再推进当前任务。'];$('#tool-name').textContent=tool[0];$('#tool-description').textContent=tool[1];
 }
 $('#evidence-links').innerHTML=unlockedEvidence(game.index).filter(e=>!['labs','ct'].includes(e.id)).map(e=>`<button data-evidence="${e.id}"><span>▤</span>${e.title}<i>↗</i></button>`).join('');
 $('#pause').textContent=paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'继续':'暂停');
}
function save({checkpointOnly=false}={}){if(storageTransition)return;const snapshot=game.snapshot();campaign?.saveRenal(snapshot);if(cloudRequired){const previous=cloud.latest;if(previous){const a={...snapshot},b={...previous};if(checkpointOnly){delete a.elapsed;delete b.elapsed;}if(JSON.stringify(a)===JSON.stringify(b))return;}cloud.enqueue(snapshot);return;}try{localStorage.setItem(key,JSON.stringify(snapshot));}catch{$('#feedback').textContent='浏览器未允许存档，本局仍可继续。';$('#sync-banner').hidden=false;$('#sync-message').textContent='浏览器未能保存进度，请打开存档管理导出备份。';for(const id of ['sync-retry','sync-remote','sync-login','sync-export'])$('#'+id).hidden=true;}}
function readSave(){try{const s=cloudRequired?cloud.latest:JSON.parse(localStorage.getItem(key));if(s){new GameState(s);return s;}}catch{}return null;}
function updateCloudStatus(){if(!$('#sync-banner'))return;if($('#start-full')&&world)$('#start-full').disabled=cloudRequired&&(!cloud.user||cloud.blocked||!['synced','saving'].includes(cloud.status));$('#sync-banner').hidden=!cloudRequired;$('#sync-message').textContent=(cloud.development?'本机模拟账号 · ':'')+(cloud.message||'正在连接云端…');$('#sync-banner').dataset.state=cloud.status;$('#sync-retry').hidden=!['offline','error'].includes(cloud.status);$('#sync-remote').hidden=cloud.status!=='conflict';$('#sync-login').hidden=!['auth','error'].includes(cloud.status);let backup=false;try{backup=!!localStorage.getItem(cloud.cacheKey+':conflict-backup');}catch{}$('#sync-export').hidden=!cloud.user||!backup&&!['conflict','offline','auth'].includes(cloud.status);$('#account').hidden=cloudRequired&&!cloud.user;$('#account').textContent=!cloudRequired||cloud.user?.kind==='guest'?'存档管理':cloud.user?.email||'';$('#sync-login').textContent=cloud.user?.kind==='guest'?'重新连接':'重新登录';if(['auth','conflict'].includes(cloud.status)&&started){paused=true;game.paused=true;world?.setPaused(true);render();}}
async function retryCloud(){if(!world){location.reload();return;}try{await cloud.retry();if(!world)location.reload();else if(!cloud.blocked&&world.isFallback)upgradeGraphics();}catch(e){$('#sync-message').textContent='连接失败，请稍后重试。';}}
$('#sync-retry').onclick=retryCloud;
$('#sync-export').onclick=()=>{try{const raw=localStorage.getItem(cloud.cacheKey+(cloud.status==='synced'?':conflict-backup':''));const snapshot=JSON.parse(raw)?.snapshot;if(!snapshot)return;const url=URL.createObjectURL(new Blob([JSON.stringify({format:'surgispace-save',snapshot},null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='SurgiSpace-local-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch{}};
$('#sync-login').onclick=()=>location.reload();
$('#sync-remote').onclick=()=>{openDialog('<h2>读取云端进度？</h2><p>将切换到另一设备最后成功保存的进度。本机未同步记录会保留为备份。</p><button id="load-remote-confirm" class="primary">读取云端并继续</button>');$('#load-remote-confirm').onclick=async()=>{try{const epoch=flowEpoch;const snapshot=await cloud.useRemote();if(epoch!==flowEpoch||snapshot===undefined)return;closeDialog();if(snapshot)start(snapshot.mode,snapshot);else mainMenu();}catch{$('#dialog-content').insertAdjacentHTML('beforeend','<p>读取失败，请关闭后重试。</p>');}};};
$('#account').onclick=()=>{if(started)save();if(!cloudRequired){openDialog('<div id="local-storage"></div>');mountLocalStorage($('#local-storage'),{read:()=>started?game.snapshot():readSave(),restore:async snapshot=>{storageTransition=true;try{localStorage.setItem(key,JSON.stringify(snapshot));location.reload();}catch(e){storageTransition=false;throw Error('浏览器未允许写入存档，请检查存储权限。');}}});return;}if(cloud.user?.kind==='guest'){openDialog('<div id="guest-storage"></div>');mountGuestStorage($('#guest-storage'),cloud,{refresh:updateCloudStatus,suspendSaves:value=>storageTransition=value});return;}openDialog('<h2>玩家账号</h2><p id="account-email"></p><p>进度与此邮箱账号绑定。完成题目后自动保存；换设备验证同一邮箱后，在主菜单选择“继续上次任务”。迁移到游客版前，请先导出进度文件。</p><button id="account-export" class="secondary">导出进度文件</button><button id="logout" class="secondary">保存并退出登录</button>');$('#account-email').textContent=cloud.user.email;$('#account-export').onclick=()=>{try{downloadBackup(cloud.latest);}catch(e){$('#account-email').textContent=e.message;}};$('#logout').onclick=async()=>{if(started)save();await cloud.flush();location.assign('/cdn-cgi/access/logout');};};
function soundCue(ok=true){if(!sound)return;try{const ctx=new AudioContext(),osc=ctx.createOscillator(),gain=ctx.createGain();osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=ok?620:180;gain.gain.setValueAtTime(.05,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);osc.start();osc.stop(ctx.currentTime+.2);osc.onended=()=>ctx.close();}catch{}}
async function answer(){
 if(!world||paused||interaction!=='question'||!selected||game.status!=='ready')return;
 if(game.node.phase==='surgery'){interaction='reply';await executeSelection();return;}
 interaction='reply';$('#reply-speaker').textContent=doctorName()+(game.node.phase==='diagnosis'?'回复':'决策');
 $('#reply-text').textContent=doctorReply(game.node,selected);render();
}
async function executeSelection(){
 if(interaction!=='reply'||paused)return;
 interaction='executing';const epoch=flowEpoch,currentGame=game;
 anatomy=false;world.setAnatomy(false);$('#anatomy-badge').hidden=true;$('#anatomy').classList.remove('active');
 const result=game.begin(selected);if(!result)return;
 render();if(!result.correct){soundCue(false);save();showResult();return;}
 const manuallyPerformed=await guidedRenalOperation(result.node);
 if(epoch!==flowEpoch||currentGame!==game)return;
 soundCue(true);$('#operation-caption').hidden=false;$('#operation-caption').textContent=examinationAt(game.index+1)?'检查资料已更新，请在诊桌电脑查看。':result.node.hint+' '+result.node.feedback;
 world.view(result.node.camera);world.setEmergency(false);
 let activeWorld=world,ok=manuallyPerformed?true:await activeWorld.transition(result.node.stage,result.node.tools[0]);
 while(!ok&&epoch===flowEpoch&&currentGame===game&&world!==activeWorld){activeWorld=world;ok=await activeWorld.transition(result.node.stage,result.node.tools[0]);}
 if(epoch!==flowEpoch||currentGame!==game)return;
 if(ok&&game.complete(result.token)){
  if(game.index===10&&campaign?.renalActive)await campaign.renalBridge();
  world.setStage(game.stage);$('#operation-caption').hidden=true;selected=null;showHints=false;interaction='question';
  $('#feedback').textContent=currentExamination()?'检查资料已发送至诊桌电脑。':result.node.hint+' '+result.node.feedback;save();render();if(['won','followup'].includes(game.status))showResult();
 }
}
async function guidedRenalOperation(node){
 if(!DRAG_STEPS.has(node.id))return false;const activeWorld=world,token=flowEpoch;await activeWorld.prepareTool?.(node.tools[0]);if(token!==flowEpoch)return false;activeWorld.view(node.camera);activeWorld.setPaused(false);
 const host=$('#surgery-decision'),card=document.createElement('section');card.className='renal-operation';card.innerHTML='<p>拖动完成本题操作，术野同步演示</p><label>操作进度<input type="range" min="0" max="100" value="0" aria-label="本题操作进度"></label><button class="primary">播放并完成操作 →</button>';host.classList.add('is-operating');host.append(card);let finished=false,playing=false;
 return new Promise(resolve=>{const slider=card.querySelector('input'),button=card.querySelector('button');const finish=()=>{if(finished)return;finished=true;card.remove();host.classList.remove('is-operating');activeWorld.setStage(node.stage);resolve(true);};const update=q=>{activeWorld.previewTransition?.(node.stage,node.tools[0],q);slider.value=q*100;if(q>=.99)finish();};slider.oninput=()=>{if(!paused&&!playing)update(Number(slider.value)/100);};button.onclick=async()=>{if(playing||paused)return;playing=true;slider.disabled=true;button.disabled=true;const from=Number(slider.value)/100;for(let i=1;i<=40&&!finished;i++){while(paused)await new Promise(r=>setTimeout(r,50));if(token!==flowEpoch){card.remove();host.classList.remove('is-operating');resolve(false);return;}update(from+(1-from)*i/40);await new Promise(r=>setTimeout(r,25));}};});
}
$('#advance-dialogue').onclick=executeSelection;
$('#next-step').onclick=()=>{if(!started||paused||game.status!=='ready'||game.index>=10||!['speech','report-ready'].includes(interaction))return;interaction='question';consultView='patient';world?.lookConsultation('patient');render();};
function start(mode,saved){
 if(!world||cloudRequired&&(!cloud.user||cloud.blocked||!['synced','saving'].includes(cloud.status)))return;
 if(saved?.status==='won'){mainMenu();return;}
 flowEpoch++;reportDialogIndex=null;clearInterval(endingTimer);speechNode=null;cloud.beginIntent();
 if($('#dialog').open)closeDialog();world.reset();game=saved?new GameState(saved):new GameState();if(!saved)game.start(mode);
 started=true;paused=false;selected=null;showHints=false;interaction='question';consultView='patient';anatomy=false;
 world.setPaused(false);world.setStage(game.stage);world.setConsultation(game.index<10);world.lookConsultation('patient');world.view(game.node?.camera||'overview');
 $('#anatomy-badge').hidden=true;$('#anatomy').classList.remove('active');$('#operation-caption').hidden=true;
 $('#overlay').classList.remove('black-ending');$('#overlay').hidden=true;$('#feedback').textContent='';render();save();
 if(['failed','diagnosisFailed','followup'].includes(game.status))showResult();
}
function resultButtons(win){
 $('#retry').onclick=()=>{if(win){start(game.mode);return;}speechNode=null;flowEpoch++;clearInterval(endingTimer);cloud.beginIntent();game.restart();world.reset();world.setPaused(false);world.setStage(game.stage);world.setConsultation(game.index<10);world.view(game.node.camera);anatomy=false;$('#anatomy-badge').hidden=true;$('#anatomy').classList.remove('active');selected=null;showHints=false;paused=false;interaction='question';$('#overlay').classList.remove('black-ending');$('#overlay').hidden=true;$('#feedback').textContent='已恢复起始状态，请重新核查。';render();save();};
 $('#result-menu').onclick=mainMenu;
}
function showResult(){
 if(game.status==='won'&&campaign?.renalComplete())return;
 if(game.status==='followup'){showFollowup();return;}
 $('#followup-dialogue').hidden=true;
 const win=game.status==='won';interaction='result';$('#overlay').hidden=false;
 if(!win){
  const id=selected||game.log.at(-1)?.optionId,n=game.node,reason=errorReason(n,id);
  $('#overlay').innerHTML=`<section class="result fail"><div class="eyebrow">DECISION REVIEW</div><h2>本次选择不正确</h2><p id="wrong-choice"></p><div class="result-reason" id="wrong-reason"></div><button id="show-ending" class="primary">查看失败结局 →</button></section>`;
  $('#wrong-choice').textContent='你的选择：'+(n.options.find(o=>o.id===id)?.text||'旧存档未记录具体选项');$('#wrong-reason').textContent=reason;
  $('#show-ending').onclick=()=>{
   $('#overlay').classList.add('black-ending');$('#overlay').innerHTML='<section class="result ending"><p id="ending-story" aria-live="off"></p><button id="skip-ending" class="quiet">显示完整叙述</button><div id="ending-actions" hidden><button id="retry" class="primary">'+(n.phase==='diagnosis'?'重新接诊':'返回术前起点 S01')+'</button><button id="result-menu" class="secondary">返回主菜单</button><small>声明：本游戏剧情纯属虚构，不代表错误选择必然导致上述临床后果。</small></div></section>';
   const story=doctorText(campaign?.renalActive?reason+'\n\n'+n.hint+'\n\n团队复核了这项决定，接诊或操作被迫中止，另一名医生接手。\n\n他们不接受你的解释。门在身后关上，小黄收走了那张原本承诺报酬的支票。脚步声逼近，画面陷入黑暗。陈医生没能活着离开这里，家人的消息也从此中断。':failureStory(n,reason,id));let i=0;const epoch=flowEpoch;
   const finish=()=>{clearInterval(endingTimer);$('#ending-story').textContent=story;$('#ending-actions').hidden=false;$('#skip-ending').hidden=true;resultButtons(false);};
   endingTimer=setInterval(()=>{if(epoch!==flowEpoch){clearInterval(endingTimer);return;}$('#ending-story').textContent=story.slice(0,++i);if(i>=story.length)finish();},35);
   $('#skip-ending').onclick=finish;
  };return;
 }
 $('#overlay').innerHTML=`<section class="result win"><div class="fireworks" aria-label="通关烟花">${Array.from({length:8},(_,i)=>`<i style="--n:${i}"></i>`).join('')}</div><div class="eyebrow">OPERATION COMPLETE</div><h2>手术任务完成</h2><div class="presentation" aria-label="患者及家属赠送锦旗"><span>林先生<br><small>患者</small></span><div class="pennant">妙手回春</div><span>家属<br><small>感谢您的照护</small></span></div><p>患者与家属向你赠送锦旗。</p><div class="pathology"><span>术后病理 · 此时才获得</span><strong>透明细胞肾细胞癌</strong><p>局限于肾脏，切缘阴性。</p></div><div class="stats"><span>${Math.floor(game.elapsed/60)}<small>分钟</small></span><span>${game.retries}<small>手术重试</small></span><span>${game.log.filter(x=>x.result==='correct').length}<small>正确决策</small></span></div><button id="retry" class="primary">重新挑战 →</button><button id="result-menu" class="secondary">返回主菜单</button><button id="review-log" class="quiet">查看本局决策记录 ↗</button><small>声明：本游戏剧情纯属虚构；通关不等同于治愈。</small></section>`;
 resultButtons(true);$('#review-log').onclick=showQuestionReview;
}
function showFollowup(){
 $('.viewport').style.setProperty('--room-image',`url("${roomAssets}clinic-retrofuture.png")`);
 interaction='followup';$('#overlay').hidden=true;$('#scene-decision').hidden=true;$('#question-content').hidden=true;$('#surgical-brief').hidden=true;$('#next-step').hidden=true;$('#operation-caption').hidden=true;
 world.setFollowup?.(true);world.setConsultation(true);if(world.snapshot().clinicLook!=='patient')world.lookConsultation('patient');$('#consultation').hidden=true;$('.camera-controls').hidden=true;$('.view-label').textContent='FOLLOW-UP / 术后复查';
 const line=followUpDialogue[game.followupStep];$('#followup-dialogue').hidden=false;$('#followup-count').textContent=(game.followupStep+1)+' / '+followUpDialogue.length;$('#followup-speaker').textContent=doctorSpeaker(line.speaker);$('#followup-text').textContent=line.speaker==='场景'?'':doctorText(line.text);$('#followup-speaker').textContent=line.speaker==='场景'?'复查日 · 小黄陪同林先生':doctorSpeaker(line.speaker);$('#followup-next').textContent=game.followupStep===followUpDialogue.length-1?(campaign?.renalActive?'结束复查 →':'完成复查，进入成功结算 →'):'继续对话 →';
 const step=game.followupStep;$('#followup-next').onclick=()=>{if(paused||!game.advanceFollowup(step))return;save();render();showResult();};
}
function mainMenu(){
 if(campaign?.active){campaign.menu();return;}
 flowEpoch++;clearInterval(endingTimer);if($('#dialog').open)closeDialog();started=false;paused=false;world?.setPaused(true);interaction='menu';
 $('#overlay').classList.remove('black-ending');$('#overlay').hidden=false;$('#overlay').innerHTML='<section class="welcome"><div class="eyebrow">MAIN MENU</div><h2>主菜单</h2><p>'+ (readSave()?.status==='won'?'上次存档已通关。可开始新问诊或直接挑战手术。':'请选择继续任务或开始新局。')+'</p><button id="open-main-menu" class="primary">选择游戏模式 →</button></section>';
 // Reuse all existing mode, import and export controls inside the actual menu.
 interaction='menu-building';menu(true);interaction='menu';const content=$('#dialog-content');$('#overlay .welcome').innerHTML=content.innerHTML;closeDialog();content.innerHTML='';wireMenu();world?.setPaused(true);
}

async function openRenalExplorer(structure=null){
 if(paused||game.status!=='ready')return;
 openDialog('<div id="kidney-explorer-host">正在打开结构学习视图…</div>');$('#dialog').classList.add('kidney-dialog');
 const controller=new AbortController();kidneyAbort=controller;
 try{const {mountKidneyExplorer}=await import('./kidney-explorer.js');if(controller.signal.aborted)return;const cleanup=await mountKidneyExplorer($('#kidney-explorer-host'),{signal:controller.signal,onClose:closeDialog,initialStructure:structure});if(controller.signal.aborted)cleanup?.();else kidneyCleanup=cleanup;}
 catch(e){if(!controller.signal.aborted)$('#kidney-explorer-host').textContent='结构视图加载失败，请关闭后重试。';}
}
$('#kidney-explorer').onclick=()=>openRenalExplorer();$('#renal-hotspots').onclick=e=>{const b=e.target.closest('[data-renal-structure]');if(b)openRenalExplorer(b.dataset.renalStructure);};

function showQuestionReview(snapshot=null){if($('#dialog').open||game.status==='animating')return;openDialog('<div id="question-review-host"></div>');mountQuestionReview($('#question-review-host'),snapshot?.version?snapshot:game.snapshot(),closeDialog);}
$('#review-answered').onclick=showQuestionReview;

function openDialog(html){lastFocus=document.activeElement;$('#dialog-content').innerHTML=html;$('#dialog').showModal();world?.setPaused(true);}
function closeDialog(){kidneyAbort?.abort();kidneyAbort=null;kidneyCleanup?.();kidneyCleanup=null;$('#dialog').classList.remove('kidney-dialog');$('#dialog').close();world?.setPaused(paused);lastFocus?.focus();if(reportDialogIndex!==null){const index=reportDialogIndex;reportDialogIndex=null;if(index===game.index&&interaction==='report'){interaction='report-ready';render();}}}
function ctDiagram(){return `<div class="scan"><svg viewBox="0 0 400 180" role="img" aria-label="右肾病变位置示意"><ellipse cx="200" cy="90" rx="175" ry="73" fill="#263d43" stroke="#64818a"/><path d="M128 49C76 26 70 134 125 133Q161 127 141 104Q114 86 143 72Z" fill="#996d60"/><path d="M271 49C323 26 329 134 274 133Q238 127 258 104Q285 86 256 72Z" fill="#996d60"/><circle cx="111" cy="114" r="25" fill="#d6b37b"/><circle cx="200" cy="120" r="18" fill="#839295"/><text x="42" y="30" fill="#e2c693" font-size="16">R 患者右侧</text><text x="290" y="30" fill="#b9c5c6" font-size="16">L</text><path d="M80 139L55 158H145" fill="none" stroke="#dfbd81"/><text x="154" y="165" fill="#dfbd81" font-size="14">右肾中下部病变 8 cm</text></svg><small>位置关系示意 · 非真实 CT，图像方向按患者侧别标识</small></div>`;}
function caseDialog(id){
 const entries=(id?evidence.filter(e=>e.id===id):unlockedEvidence(game.index)).filter(e=>!['labs','ct'].includes(e.id));
 openDialog('<div class="eyebrow">PATIENT RECORD / 001</div><h2>'+ (id?entries[0]?.title||'病例资料':'林先生的病例夹')+'</h2><div class="record-meta">65 岁 · 男　|　右侧肾脏　|　虚构教学病例</div>'+entries.map(e=>'<article><h3>'+e.title+'</h3><p>'+e.text+'</p></article>').join('')+'<article><h3>诊疗回写记录</h3>'+game.log.filter(x=>x.result==='correct'&&x.id.startsWith('D')&&!['D04','D05','D06','D07'].includes(x.id)).map(x=>'<p>'+nodes.find(n=>n.id===x.id).feedback+'</p>').join('')+'</article><p class="muted">'+CASE.note+'</p>');
}
$('#options').onclick=e=>{const b=e.target.closest('[data-option]');if(!b||game.status!=='ready'||paused||interaction!=='question')return;selected=b.dataset.option;render();};$('#confirm').onclick=answer;
$('#hint-button').onclick=()=>{showHints=!showHints;render();};$('#case-file').onclick=()=>caseDialog();$('#evidence-links').onclick=e=>{const b=e.target.closest('[data-evidence]');if(b)caseDialog(b.dataset.evidence);};
document.querySelectorAll('[data-camera]').forEach(b=>b.onclick=()=>{if(!world)return;if(b.dataset.camera==='kidney'&&game.stage<6){$('#scene-status').textContent='完成术野显露后可进入肾脏近景；也可打开解剖示意观察。';return;}world.view(b.dataset.camera);document.querySelectorAll('[data-camera]').forEach(x=>x.classList.toggle('active',x===b));});
let anatomy=false,labels=true;$('#anatomy').onclick=async()=>{
 if(!world||game.status==='animating')return;const target=world;
 if(!anatomy&&!target.isFallback){$('#anatomy').disabled=true;try{await target.loadFullAnatomy();}catch(e){$('#scene-status').textContent='完整解剖暂未加载成功，请点击解剖示意重试。';return;}finally{$('#anatomy').disabled=false;}if(world!==target)return;}
 anatomy=!anatomy;world.setAnatomy(anatomy);$('#anatomy-badge').hidden=!anatomy;$('#anatomy').classList.toggle('active',anatomy);if(anatomy)world.view('kidney');else world.view(game.node?.camera||'overview');
};$('#labels').onclick=()=>{labels=!labels;world?.setLabels(labels);$('#labels span').textContent=labels?'开':'关';};
$('#pause').onclick=()=>{if(!started||$('#dialog').open||!$('#overlay').hidden)return;paused=!paused;game.paused=paused;world?.setPaused(paused);$('#scene-status').textContent=paused?'已暂停 · 点击继续恢复任务':'鼠标拖动观察 · 滚轮缩放';render();};
function menu(forResult=false){if(!$('#overlay').hidden&&interaction==='menu')return;if(cloudRequired&&(!cloud.user||cloud.blocked||!['synced','saving'].includes(cloud.status))&&forResult!==true){updateCloudStatus();return;}const saved=readSave();openDialog('<div class="eyebrow">MAIN MENU</div><h2>主菜单</h2><button id="menu-full" class="primary">开始问诊</button><button id="continue" class="secondary" '+(saved&&saved.status!=='won'?'':'disabled')+'>继续上次任务</button>'+(saved?.status==='won'?'<p class="muted">上次存档已通关，请选择“开始问诊”开启新局。</p>':''));wireMenu();}
function wireMenu(){$('#menu-full').onclick=()=>{if(readSave()&&!confirm('开始新问诊将替换当前进度，请先备份需要保留的存档。是否继续？'))return;closeDialog();start('full');};$('#continue').onclick=()=>{const s=readSave();if(s){closeDialog();start(s.mode,s);}};}
$('#menu').onclick=menu;$('.brand').onclick=e=>{e.preventDefault();menu();};
$('#help').onclick=()=>{openDialog('<div class="eyebrow">HOW TO PLAY</div><h2>观察，再作出选择。</h2><p>拖动鼠标观察患者，滚轮缩放。选择一个答案后，点击“确认并执行”，阅读医生回复后点击“继续”。正确选择会播放操作效果，错误会结束当前任务。</p><p>数字键 1–4 选择答案，Enter 确认，Esc 暂停。病例资料和线索可反复查看。解剖示意仅供观察，不改变手术进度。</p><p>本版本以预制动作与局部网格变形表现操作，不支持任意位置自由切割。解剖来源可在制作说明中查看。</p><button id="sound-toggle" class="secondary">声音：'+(sound?'开':'关')+'</button>');$('#sound-toggle').onclick=()=>{sound=!sound;$('#sound-toggle').textContent='声音：'+(sound?'开':'关');};};
$('#credits').onclick=()=>openDialog(`<div class="eyebrow">SOURCES & PRODUCTION</div><h2>参考解剖与原创表现</h2><article><h3>BodyParts3D / DBCLS</h3><p>完整体表及932个参考结构，CC BY 4.0。坐标转换为卧姿、局部术区重建、材质调整。参考模型不是本病例患者的扫描。手术躯体保留原始解剖几何，外观采用Lux3D材质；问诊使用独立Lux3D坐姿角色。</p><a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">官方来源与许可 ↗</a></article><article><h3>Human Reference Atlas / HuBMAP</h3><p>Kristen Browne、Heidi Schlehlein：男性右肾 v1.2 与右侧输尿管 v1.1，CC BY 4.0。早期版本使用的参考资源，保留文件及许可记录；当前主线右肾已替换为Lux3D模型。</p><a href="https://doi.org/10.48539/HBM272.ZVPQ.979" target="_blank" rel="noreferrer">模型 DOI ↗</a></article><article><h3>Aholo Lux3D 与人工加工</h3><p>主线使用Lux3D组织遮挡、完整右肾及学习剖面模型，肾门近景复用完整模型；肾上腺分离后独立保留；肾门动静脉与输尿管按BodyParts3D坐标接入。问诊为较精细头部与低面数身体组合，手术铺巾由Lux3D外观贴合到基准体表。复用既有手术床与器械，生成及加工记录随源码提供。切口、动画与交互为本项目制作。</p></article><article><h3>制作状态</h3><p>可玩的第一关制作原型。不能视为临床培训或完整手术仿真。</p><p>${world?JSON.stringify(world.info):'模型加载中'}</p></article>`);
$('.dialog-close').onclick=closeDialog;$('#dialog').addEventListener('cancel',e=>{e.preventDefault();closeDialog();});
$('#start-full').onclick=()=>{const saved=readSave();if(saved?.status==='won')mainMenu();else if(saved)start(saved.mode,saved);else start('full');};
document.addEventListener('keydown',e=>{if(document.body.classList.contains('campaign-active')||document.querySelector('.campaign-dialog[open]'))return;if($('#dialog').open||!$('#overlay').hidden)return;if(e.code==='Escape'){if(consultView==='computer'){e.preventDefault();closeComputer();}else $('#pause').click();return;}if(['Digit1','Digit2','Digit3','Digit4'].includes(e.code)){document.querySelectorAll('.option')[Number(e.code.slice(-1))-1]?.click();}if(e.code==='Enter'&&e.target===document.body)answer();});
setInterval(()=>{if(started&&!paused&&!document.hidden&&!$('#dialog').open&&!document.querySelector('.campaign-dialog[open]')&&$('#overlay').hidden&&game.status!=='won')game.elapsed++;},1000);window.addEventListener('beforeunload',()=>{if(started)save({checkpointOnly:true});});
setInterval(()=>{if(started&&!paused&&!document.hidden&&game.status==='ready')save();},30000);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&started)save({checkpointOnly:true});});

let recordTab='history',consultView='patient';
function examinationAt(index){
 const labs=evidence.find(e=>e.id==='labs'),ct=evidence.find(e=>e.id==='ct');
 return ({
  4:{title:'首轮检验与泌尿系统超声',sections:[{title:'实验室检查',text:labs.text},{title:'超声补充',text:'右肾约8厘米占位，建议进一步检查。异常组织的性质尚待判断。'}],analysis:'尿中红细胞支持存在血尿。现有资料没有明确感染证据；超声发现占位，但不能仅凭大小确定组织类型。'},
  5:{title:'增强 CT 检查报告',sections:[{title:ct.title,text:ct.text}],analysis:'病变位于患者右肾中下部，靠近肾门。需要同时核对患者侧别、器官和局部位置。强化肿块高度可疑恶性，但具体组织类型通常仍需病理确认；未见明确转移不能排除恶性肿瘤。'},
  6:{title:'肾功能检查结果',sections:[{title:'整体肾功能',text:'肌酐与估算肾小球滤过率正常，整体肾功能处于正常范围。'}],analysis:'这是两侧肾脏整体工作的结果，不表示两侧贡献完全相同。评估术后功能还需结合左肾影像、既往肾病等资料；是否进一步检查取决于具体情况。'}
 })[index]||null;
}
function currentExamination(){return examinationAt(game.index);}
function examinationBody(index){const report=examinationAt(index);return report.sections.map(section=>'<article><h3>'+section.title+'</h3><p>'+section.text+'</p></article>').join('')+(index===5?ctDiagram():'')+'<article class="report-interpretation"><h3>报告解析</h3><p>'+report.analysis+'</p></article>'+(index===5?ctReference():'');}
function openExamination(index,gate=false){
 const report=examinationAt(index);if(!report||paused||game.index<index)return;
 openDialog('<div class="eyebrow">EXAMINATION REPORT</div><h2>'+report.title+'</h2><div class="record-meta">林先生 · 65岁 · 男　|　虚构教学病例</div>'+examinationBody(index)+'<button id="close-examination-report" class="primary">阅读完毕，返回电脑 →</button>');
 if(gate&&interaction==='report')reportDialogIndex=game.index;
 $('#close-examination-report').onclick=closeDialog;
}
$('#report-read-done').onclick=()=>closeComputer();
$('#view-examination-report').onclick=()=>{if(['report','report-ready'].includes(interaction))openExamination(game.index,true);};
$('#record-content').onclick=e=>{const b=e.target.closest('[data-report-index]');if(b)openExamination(Number(b.dataset.reportIndex));};
function reportLibrary(){return [4,5,6].filter(index=>game.index>=index).map(index=>'<button class="report-library-item" data-report-index="'+index+'"><strong>'+examinationAt(index).title+'</strong><span>'+ (index===5?'查看报告、图像与解析 ↗':'查看报告与解析 ↗')+'</span></button>').join('')||'<p>尚未获得检查结果。</p>';}
function ctReference(){return `<article class="ct-reference"><h3>真实 CT · 独立相似病例参考</h3><img src="${import.meta.env.BASE_URL}images/renal-ct-reference-li2026.png" alt="Li等2026年图1：独立病例右肾下极约8.9厘米肿块，非林先生影像"/><p>原病例为75岁女性：右肾下极约8.9 × 6.2厘米肿块，累及肾盂，术后病理为透明细胞肾癌。该图为原文图1的首次肾癌术前CT，并非林先生的实际影像。其大小、位置及受累范围与本关有差异；本关判断以林先生的文字报告及模型标记为准。</p><p>Li J、Guo J、Huang J等，Discover Oncology，2026，图1。CC BY 4.0；原图未改动。</p><a href="https://link.springer.com/article/10.1007/s12672-026-05028-7" target="_blank" rel="noreferrer">原文与图1</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">许可</a></article>`;}
function recordBody(){const entries=unlockedEvidence(game.index);let html='';if(recordTab==='history')html=entries.filter(e=>['history','background'].includes(e.id)).map(e=>`<h3>${e.title}</h3><p>${e.text}</p>`).join('')+(game.index<1?'<p>当前主诉：小便偶尔发红，伴腰部不适。请继续询问。</p>':'');if(recordTab==='reports')html=reportLibrary();if(recordTab==='ct')html=game.index>=5?'<button class="report-library-item" data-report-index="5">查看增强 CT 图像与解析 ↗</button>':'<p>完成检查选择后解锁。</p>';if(recordTab==='plan')html=entries.filter(e=>['plan','consent'].includes(e.id)).map(e=>`<h3>${e.title}</h3><p>${e.text}</p>`).join('')||'<p>完成评估后形成方案。</p>';if(recordTab==='log')html=game.log.filter(x=>x.result==='correct').map(x=>{const n=nodes.find(n=>n.id===x.id);return `<article><h3>${n.id} · ${n.title}</h3><p>${n.feedback}</p></article>`;}).join('')||'<p>问诊记录将在每次决策后自动回写。</p>';return html;}
function syncEncounter(){if(!world)return;$('.viewport').style.setProperty('--room-image',`url("${roomAssets}${game.index<10?'clinic':'or'}-retrofuture.png")`);const dx=game.index<10;world.setFollowup?.(game.status==='followup');world.setConsultation(dx);world.setEmergency(game.index===17);$('#consultation').hidden=!dx;$('.camera-controls').hidden=dx;$('.view-label').textContent=dx?'CONSULTATION ROOM / 01':'OPERATING ROOM / 01';$('#dialogue-bubble').textContent=game.node?doctorText(patientSpeech(game.node)):'';$('#computer-panel').hidden=consultView!=='computer';$('#computer-panel').removeAttribute('style');const report=currentExamination(),reportMode=consultView==='computer'&&!!report&&['report','report-ready'].includes(interaction);$('#computer-panel').classList.toggle('report-focus',reportMode);$('#report-arrival').hidden=!reportMode;$('#report-notification').hidden=!(dx&&report&&interaction==='report'&&consultView==='patient'&&game.status==='ready');$('#report-notification').disabled=paused;$('#computer-screen-trigger').hidden=!(started&&dx&&consultView==='patient'&&game.status==='ready');$('#computer-screen-trigger').disabled=paused;world.setCameraInteraction?.(consultView!=='computer');if(reportMode){$('#report-notice-title').textContent=report.title;$('#view-examination-report').disabled=paused;$('#report-read-done').disabled=paused;const preview=$('#report-preview');if(preview.dataset.reportIndex!==String(game.index)){preview.innerHTML=examinationBody(game.index);preview.dataset.reportIndex=String(game.index);preview.scrollTop=0;}}$('#dialogue-bubble').hidden=consultView!=='patient'||interaction!=='speech';$('#record-tabs').innerHTML=[['history','病史'],['reports','报告'],['ct','参考CT'],['plan','方案'],['log','回写记录']].map(([id,t])=>`<button data-record="${id}" class="${id===recordTab?'active':''}">${t}</button>`).join('');$('#record-content').innerHTML=recordBody();const markers=game.index===13?'① 大动脉 → 右肾　② 右肾 → 大静脉　③ 右肾 → 膀胱':game.index===5&&interaction==='question'?'A 右肾中下部／肾门侧　B 右肾外侧　C 左肾　D 输尿管':'';$('#scene-markers').hidden=!markers;$('#scene-markers').textContent=markers;$('#scene-markers').style.top=!dx&&!$('#surgical-brief').hidden?($('#surgical-brief').offsetTop+$('#surgical-brief').offsetHeight+10)+'px':'';world.setNode(game.index);if(game.node?.phase==='surgery')world.prepareTool?.(game.node.tools[0]);$('.vitals').innerHTML=game.index===17?'<div><dt>心率 ↑</dt><dd>118 <small>bpm</small></dd></div><div><dt>血压 ↓</dt><dd>82/50</dd></div>':'<div><dt>心率</dt><dd>72 <small>bpm</small></dd></div><div><dt>血氧</dt><dd>98 <small>%</small></dd></div>';}
$('#record-tabs').onclick=e=>{const b=e.target.closest('[data-record]');if(b){recordTab=b.dataset.record;syncEncounter();}};
function showComputer(){if(!world||paused)return;consultView='computer';world.lookConsultation('computer');syncEncounter();}
function closeComputer(){if(!world)return;if(currentExamination()&&interaction==='report')interaction='report-ready';consultView='patient';world.lookConsultation('patient');render();$('#look-computer').focus();}
$('#close-computer').onclick=closeComputer;
$('#look-computer').onclick=showComputer;$('#computer-screen-trigger').onclick=showComputer;$('#report-notification').onclick=showComputer;$('#look-patient').onclick=closeComputer;
let graphicsLoading=false,graphicsController;
function configureWorld(target){target.setFollowup?.(game.status==='followup');target.reset();target.setStage(game.stage);target.setNode(game.index);target.setConsultation(game.index<10||game.status==='followup');if(game.index<10||game.status==='followup')target.lookConsultation(game.status==='followup'?'patient':consultView);else target.view(game.node?.camera||'overview');target.setLabels(labels);target.setAnatomy(anatomy);target.setEmergency(game.index===17);target.setPaused(paused||$('#dialog').open);}
function graphicsMessage(message,retry=false){$('#graphics-status').hidden=false;$('#graphics-message').textContent=message;$('#retry-graphics').hidden=!retry;}
function useLightweight(message){graphicsController?.abort();const old=$('#scene'),canvas=document.createElement('canvas');canvas.id='scene';canvas.setAttribute('aria-label','患者与手术场景轻量示意');world?.dispose?.();old.replaceWith(canvas);world=createFallbackScene(canvas,text=>$('#scene-status').textContent=text);configureWorld(world);$('.viewport').dataset.graphics='lightweight';graphicsMessage(message,true);render();if(game.status==='followup')showFollowup();}
async function upgradeGraphics(){
 if(graphicsLoading)return;graphicsLoading=true;const controller=new AbortController();graphicsController=controller;
 const candidate=document.createElement('canvas');candidate.className='scene-upgrade';candidate.setAttribute('aria-label','患者与手术室三维视图');$('.viewport').prepend(candidate);
 graphicsMessage('三维场景正在加载，可先开始问诊');const deadline=setTimeout(()=>controller.abort(),30000);
 try{const {createScene}=await import('./scene.js');const scene=await createScene(candidate,text=>{$('#load-text').textContent=text;},{signal:controller.signal});if(controller.signal.aborted){scene.dispose();throw Error('timeout');}
  while(game.status==='animating')await new Promise(r=>setTimeout(r,50));if(controller.signal.aborted){scene.dispose();throw Error('timeout');}
  if(anatomy)await scene.loadFullAnatomy();configureWorld(scene);scene.setAnatomy(anatomy);const old=$('#scene');world.dispose?.();candidate.id='scene';candidate.classList.remove('scene-upgrade');old.replaceWith(candidate);world=scene;$('.viewport').dataset.graphics='3d';$('#graphics-status').hidden=true;render();if(game.status==='followup')showFollowup();
  candidate.addEventListener('webglcontextlost',e=>{e.preventDefault();if(world===scene)useLightweight('三维图形中断，已切换轻量示意，可继续游戏。');});
 }catch(e){controller.abort();candidate.remove();graphicsMessage(controller.signal.aborted?'当前使用轻量示意，可正常游戏；可重试三维。':'此设备暂无法启用三维，轻量示意可正常游戏。',true);}
 finally{clearTimeout(deadline);graphicsLoading=false;}
}
$('#retry-graphics').onclick=upgradeGraphics;matchMedia('(max-width:800px)').addEventListener?.('change',()=>render());
world=createFallbackScene($('#scene'),text=>$('#scene-status').textContent=text);$('.viewport').dataset.graphics='lightweight';$('#loading').hidden=true;render();$('#start-full').disabled=true;
window.surgispace={get state(){return game.snapshot();},get scene(){return world.snapshot();},get assets(){return world.info;},get cloud(){return {mode:cloud.mode,status:cloud.status,revision:cloud.revision};}};
try{if(cloudRequired){$('#load-text').textContent='正在连接存档并读取进度…';await cloud.bootstrap();updateCloudStatus();if(readSave())$('#start-full').innerHTML=readSave().status==='won'?'存档已通关 · 选择新挑战 <span>→</span>':'继续上次任务 <span>→</span>';}if(!cloudRequired){updateCloudStatus();if(readSave())$('#start-full').innerHTML=readSave().status==='won'?'存档已通关 · 选择新挑战 <span>→</span>':'继续上次任务 <span>→</span>';}$('#start-full').disabled=cloudRequired&&cloud.blocked;$('#scene-status').textContent='拖动观察 · 触屏可单指旋转、双指缩放';if((!cloudRequired||!cloud.blocked)&&readSave()&&!localStorage.getItem('surgispace-v4-campaign'))upgradeGraphics();}catch(e){graphicsMessage('暂时无法读取游戏进度，请重试同步。');$('#scene-status').textContent='请先恢复存档连接。';}

function placePatientDialogue(){
 const points=world?.renalHotspots?.()||[],host=$('#renal-hotspots');host.hidden=!started||paused||$('#dialog').open||game.status!=='ready'||game.index<13||game.index>17||!points.length;
 if(!host.hidden)for(const b of host.querySelectorAll('button')){const p=points.find(x=>x.id===b.dataset.renalStructure);b.hidden=!p?.visible||p.x<0||p.x>1||p.y<0||p.y>1;if(p){b.style.left=p.x*100+'%';b.style.top=p.y*100+'%';const offsets={artery:[-115,-55],vein:[55,-5],ureter:[55,45],adrenal:[-125,70]},r=host.getBoundingClientRect(),[dx,dy]=offsets[p.id],lx=Math.max(8,Math.min(r.width-100,p.x*r.width+dx)),ly=Math.max(28,Math.min(r.height-35,p.y*r.height+dy));b.style.setProperty('--label-x',(lx-p.x*r.width+11)+'px');b.style.setProperty('--label-y',(ly-p.y*r.height+11)+'px');const line=host.querySelector('[data-renal-line="'+p.id+'"]');line.setAttribute('x1',p.x*r.width);line.setAttribute('y1',p.y*r.height);line.setAttribute('x2',lx+42);line.setAttribute('y2',ly+10);line.style.display=b.hidden?'none':'';}}

 if(world&&game.index<10){
  const r=world.computerScreenBounds(),trigger=$('#computer-screen-trigger');const left=Math.max(0,r.left),top=Math.max(0,r.top),right=Math.min(1,r.left+r.width),bottom=Math.min(1,r.top+r.height);
  trigger.style.left=left*100+'%';trigger.style.top=top*100+'%';trigger.style.width=Math.max(0,right-left)*100+'%';trigger.style.height=Math.max(0,bottom-top)*100+'%';
  const notice=$('#report-notification');notice.hidden=true;
  
 }
 requestAnimationFrame(placePatientDialogue);
}requestAnimationFrame(placePatientDialogue);

// Story campaign wraps the unchanged first-case state machine. Version 3 saves remain independent practice saves.
campaign=mountCampaign({
 snapshot:()=>game.snapshot(),legacySave:readSave,
 startRenal:snapshot=>{if(snapshot?.status==='won'){game=new GameState(snapshot);campaign.renalComplete();return;}start('full',snapshot);upgradeGraphics();},
 startLegacy:snapshot=>{start(snapshot.mode,snapshot);upgradeGraphics();},
 suspend:()=>{started=false;world?.setPaused(true);},
 resume:()=>{started=true;paused=false;game.paused=false;world?.setPaused(false);},
 setModalPaused:value=>world?.setPaused(value||paused),
 review:snapshot=>showQuestionReview(snapshot),
});
Object.defineProperties(window.surgispace,{campaign:{get:()=>campaign.snapshot},campaignScene:{get:()=>campaign.scene},campaignMenu:{value:()=>campaign.menu()}});

const conversationHost=$('.viewport');
connectDialogue(conversationHost,$('#dialogue-bubble'),{speaker:()=> '林先生',anchor:()=>screenPoint($('#scene'),world?.patientSpeechAnchor())});
connectDialogue(conversationHost,$('#doctor-reply'),{speaker:()=> doctorName(),anchor:()=>null});
connectDialogue(conversationHost,$('#followup-dialogue'),{speaker:()=>followUpDialogue[game.followupStep]?.speaker||'场景',anchor:name=>name==='林先生'?screenPoint($('#scene'),world?.patientSpeechAnchor()):name==='小黄'?screenPoint($('#scene'),world?.huangSpeechAnchor?.()):null});

// Click the existing artwork; reports open as document UI, never as a second monitor.
mountPhotoHotspots($('.viewport'),'or',{
 bed:()=>{if(started&&game.index>=10)world.view('access');},
 monitor:()=>openDialog('<h2>场景监护仪</h2><p>监护仪就是房间图右侧的设备。当前显示为剧情模拟数值，并非实时监护。</p><p>'+ (game.index===17?'心率118次/分，血压82/50毫米汞柱。团队应暂停推进并处理异常。':'当前情节：生命体征平稳。请结合病例资料与团队提示继续。')+'</p>'),
 instruments:()=>openDialog('<h2>场景器械台</h2><p>使用画面左侧已有的器械台核对器械。选定工具只会在实际操作时出现在术区。</p><p>'+$('#tool-name').textContent+'</p>')
});

mountPhotoHotspots($('.viewport'),'clinic',{computer:showComputer});

const patientScreen=mountSceneScreen($('.viewport'),{title:'林先生 · 电子病历',body:'主诉与问诊记录',onOpen:showComputer});
let screenCache='';setInterval(()=>{const text=game.index<10?JSON.stringify([game.index,interaction,game.log.length]):'';if(text!==screenCache){screenCache=text;patientScreen.set({title:currentExamination()?.title||'林先生 · 电子病历',body:currentExamination()?currentExamination().sections.map(s=>s.title+'：'+s.text).join('\n'):(game.node?doctorText(patientSpeech(game.node)):'病例资料已归档'),notice:interaction==='report'?'您已收到检查结果':'病例001 · 电子资料'});}$('.viewport .scene-screen').hidden=game.index>=10;},300);

import './improvements.css';

export function previewRenalNode(index){if(globalThis.SURGISPACE_PLAYER_ID!=='isolated-improvement-preview')return;const sample=new GameState();sample.start('full');while(sample.index<index){const result=sample.begin(sample.node.correctOptionId);sample.complete(result.token);}start('full',sample.snapshot());upgradeGraphics();}
