import {chooseNickname} from './nickname-form.js';
import {setPlayerNickname,doctorName} from './player-identity.js';
import {PlayerSync} from './player-sync.js';
import './player.css';
const root=document.querySelector('#app');
root.innerHTML=`<main class="entry-screen"><div class="entry-mark">S<span>+</span></div><p class="entry-kicker">SURGISPACE / 外科密室</p><h1>守住判断，<br>找到回家的路。</h1><p>投资序章 · 双病例诊疗 · 悬疑逃生</p><div role="status" id="entry-status">正在登录并恢复玩家进度…</div><button id="entry-retry" hidden>重试连接</button><a href="/signin-with-chatgpt?returnTo=%2F" target="_top" id="entry-login" hidden>登录后继续</a><small>游戏流程经过简化，虚构病例不作为临床指导。</small></main>`;
const badge=document.createElement('button');badge.id='player-cloud';badge.hidden=true;document.body.append(badge);
let kind='saved';
const sync=new PlayerSync({onStatus:(text,state)=>{badge.textContent='☁ '+text;badge.dataset.state=state;kind=state;}});
function download(snapshot){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify({format:'surgispace-campaign',snapshot},null,2)],{type:'application/json'}));a.href=url;a.download='SurgiSpace-玩家进度备份.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
badge.onclick=()=>{
 if(document.querySelector('#player-dialog'))return;
 const d=document.createElement('dialog');d.id='player-dialog';d.className='player-dialog';
 d.innerHTML=`<button id="player-close" aria-label="关闭">×</button><p class="entry-kicker">PLAYER PROFILE</p><h2>玩家与云端进度</h2><p id="player-name"></p><p>两病例、剧情位置、答题记录与设置随账号保存。退出后，使用同一账号登录，再选择“继续上次任务”。</p><p id="player-result" role="status"></p><button id="player-retry">重试保存</button><button id="player-export">导出本机备份</button><button id="player-remote">读取云端进度</button><button id="player-logout">保存并退出登录</button>`;
 document.body.append(d);d.querySelector('#player-name').textContent=doctorName()+' · '+sync.user.name;d.querySelector('#player-result').textContent=badge.textContent;
 d.querySelector('#player-close').onclick=()=>{d.close();d.remove();};d.oncancel=()=>d.remove();
 d.querySelector('#player-retry').onclick=async()=>{await sync.flush();d.querySelector('#player-result').textContent=badge.textContent;};
 d.querySelector('#player-export').onclick=()=>{const raw=sync.pending||JSON.parse(localStorage.getItem(sync.key)||'null');if(raw)download(raw);else d.querySelector('#player-result').textContent='尚无游戏进度。';};
 d.querySelector('#player-remote').onclick=()=>{d.querySelector('#player-result').textContent='读取将重新载入游戏；未同步进度保留为本机备份。';const b=d.querySelector('#player-remote');b.textContent='确认读取并重新载入';b.onclick=async()=>{try{await sync.useRemote();location.reload();}catch(e){d.querySelector('#player-result').textContent=e.message;}};};
 d.querySelector('#player-logout').onclick=async()=>{window.dispatchEvent(new Event('surgispace-save-now'));const ok=await sync.flush();if(!ok){d.querySelector('#player-result').textContent='尚未同步成功，请重试或先导出备份。';return;}location.assign('/signout-with-chatgpt?returnTo=%2F');};
 d.showModal();
};
async function boot(){try{
 const data=await sync.bootstrap();
 if(sync.blocked){badge.hidden=false;root.querySelector('#entry-status').textContent='存在另一份未同步进度，请通过下方云端状态按钮导出备份或读取云端。';return;}
 window.addEventListener('surgispace-campaign-save',e=>sync.enqueue(e.detail));
 const current=JSON.parse(localStorage.getItem(sync.key)||'null');
 if(current?.playerNickname)setPlayerNickname(current.playerNickname);
 else{const nickname=await chooseNickname(root);const {newCampaign}=await import('./campaign-state.js');const snapshot=current||newCampaign();snapshot.playerNickname=nickname;localStorage.setItem(sync.key,JSON.stringify(snapshot));sync.enqueue(snapshot);await sync.flush();if(sync.blocked){badge.hidden=false;root.querySelector('#entry-status').textContent='另一设备已更新进度，请通过云端状态按钮处理后继续。';return;}}
 window.addEventListener('online',()=>sync.flush());
 document.addEventListener('visibilitychange',()=>{if(document.hidden)sync.flush();});
 await import('./main.js');badge.hidden=false;
 // The menu is the only entry: a new story never overwrites a returning player's save.
 window.surgispace.campaignMenu();
 }catch(e){root.querySelector('#entry-status').textContent=e.message;root.querySelector('#entry-retry').hidden=false;root.querySelector('#entry-login').hidden=false;root.querySelector('#entry-retry').onclick=()=>location.reload();}}
await boot();
