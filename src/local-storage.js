import {validateSnapshot} from '../server/progress.js';
import {downloadBackup} from './guest-storage.js';
export function parseBackup(raw){const data=JSON.parse(raw);if(data?.format!=='surgispace-save')throw Error('请选择游戏导出的 JSON 存档文件。');return validateSnapshot(data.snapshot);}
export function mountLocalStorage(host,{read,restore}){
 host.innerHTML='<h2>存档管理</h2><p>进度自动保存在当前浏览器，无需登录。同一设备、同一浏览器、同一网址可继续任务。换设备、换网址或清理浏览器数据前，请导出备份；隐私模式不适合长期保存。</p><section><h3>导出当前进度</h3><button id="local-export" class="secondary">导出存档文件</button></section><section><h3>导入进度</h3><p>可导入本游戏的 JSON 备份，包括旧邮箱版导出的进度。导入将替换此浏览器当前存档。</p><label>选择存档文件<input id="local-import-file" type="file" accept=".json,application/json"></label><label class="local-check"><input id="local-import-confirm" type="checkbox">我已备份当前进度，确认替换</label><button id="local-import" class="primary">导入并继续</button></section><p id="local-storage-message" role="status"></p>';
 const q=s=>host.querySelector(s),message=s=>q('#local-storage-message').textContent=s;
 q('#local-export').onclick=()=>{try{downloadBackup(read());message('已导出，请妥善保存文件。');}catch(e){message(e.message);}};
 q('#local-import').onclick=async()=>{try{if(!q('#local-import-confirm').checked)throw Error('请先勾选确认替换当前存档。');const file=q('#local-import-file').files[0];if(!file||file.size>65536)throw Error('请选择小于 64 KB 的游戏 JSON 存档。');const snapshot=parseBackup(await file.text());await restore(snapshot);}catch(e){message(e instanceof SyntaxError?'存档文件不是有效的 JSON。':e.message||'导入失败，原进度保持不变。');}};
}
