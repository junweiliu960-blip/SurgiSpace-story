import {GameState} from './game-state.js';
export function downloadBackup(snapshot){
 if(!snapshot)throw Error('尚无游戏进度可导出。');
 const url=URL.createObjectURL(new Blob([JSON.stringify({format:'surgispace-save',snapshot},null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download='SurgiSpace-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function mountGuestStorage(host,cloud,{refresh=()=>{},suspendSaves=()=>{}}={}){
 host.innerHTML='<h2>存档管理</h2><p>同一浏览器自动续玩。换设备或清理浏览器数据前，请保管恢复码或导出备份。</p><form id="guest-profile"><label>玩家昵称<input id="guest-nickname" maxlength="24" autocomplete="nickname" required></label><button class="secondary">保存昵称</button></form><section><h3>备份当前存档</h3><button id="guest-export" class="secondary">导出进度文件</button><p>生成新恢复码后，之前的恢复码会失效。拿到恢复码的人可以使用此存档，请妥善保管。</p><button id="guest-code" class="secondary">生成／更换恢复码</button><div id="guest-code-result" hidden><label>恢复码（请复制保存）<textarea id="guest-code-value" readonly rows="3"></textarea></label><button id="guest-code-copy" class="secondary">复制恢复码</button></div></section><section><h3>恢复其他设备的存档</h3><form id="guest-recover"><label>恢复码<input id="guest-recovery-input" maxlength="80" autocomplete="off" spellcheck="false" required></label><p>恢复后会切换到该存档，当前游客存档仍保留在服务器；请先备份当前存档的恢复码。</p><label class="guest-check"><input id="guest-recovery-confirm" type="checkbox" required>我已备份当前存档，确认切换</label><button class="primary">恢复存档并重新打开</button></form></section><section><h3>导入进度文件</h3><p>支持此游戏导出的 JSON 备份。老玩家可在原邮箱版本的账号窗口导出，再到这里导入。导入后将替换当前进度。</p><label>选择备份文件<input id="guest-import-file" type="file" accept=".json,application/json"></label><label class="guest-check"><input id="guest-import-confirm" type="checkbox">我已备份当前进度，确认替换</label><button id="guest-import" class="secondary">导入并继续</button></section><p id="guest-message" role="status"></p>';
 const q=s=>host.querySelector(s);q('#guest-nickname').value=cloud.user.nickname||'游客';
 const message=s=>q('#guest-message').textContent=s;
 async function settled(){await cloud.flush();if(cloud.blocked||cloud.queued)throw Error('当前进度尚未同步，请先关闭窗口重试同步，或导出备份。');}
 async function run(button,work){button.disabled=true;try{await work();}catch(e){message(e.message||'操作失败，请稍后重试。');}finally{button.disabled=false;}}
 q('#guest-profile').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{const r=await cloud.request('guest/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({nickname:q('#guest-nickname').value})});cloud.user=r.user;refresh();message('昵称已保存。');});};
 q('#guest-export').onclick=()=>{try{downloadBackup(cloud.latest);message('进度文件已导出，请妥善保管。');}catch(e){message(e.message);}};
 q('#guest-code').onclick=e=>run(e.currentTarget,async()=>{await settled();const r=await cloud.request('guest/recovery-code',{method:'POST'});q('#guest-code-result').hidden=false;q('#guest-code-value').value=r.code;message('恢复码已生成，请立即复制保存；关闭后无法再次显示，但可生成新码。');});
 q('#guest-code-copy').onclick=async()=>{try{await navigator.clipboard.writeText(q('#guest-code-value').value);message('恢复码已复制。');}catch{q('#guest-code-value').select();message('请长按或按 Ctrl+C 复制恢复码。');}};
 q('#guest-recover').onsubmit=e=>{e.preventDefault();run(e.submitter,async()=>{suspendSaves(true);try{await settled();await cloud.request('guest/recover',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:q('#guest-recovery-input').value})});location.reload();}catch(e){suspendSaves(false);throw e;}});};
 q('#guest-import').onclick=e=>run(e.currentTarget,async()=>{
  if(!q('#guest-import-confirm').checked)throw Error('请先勾选确认替换当前进度。');
  const file=q('#guest-import-file').files[0];if(!file||file.size>65536)throw Error('请选择小于 64 KB 的游戏 JSON 备份。');
  const data=JSON.parse(await file.text());if(data.format!=='surgispace-save')throw Error('不是有效的游戏备份文件。');
  const snapshot=new GameState(data.snapshot).snapshot();suspendSaves(true);try{await settled();cloud.beginIntent();cloud.enqueue(snapshot);await settled();location.reload();}catch(e){suspendSaves(false);throw e;}
 });
}
