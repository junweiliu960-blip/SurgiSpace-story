import {setPlayerNickname,doctorName,normalizeNickname} from './player-identity.js';
export async function chooseNickname(root){
 root.querySelector('#entry-status').textContent='先为你扮演的医生取一个昵称。';
 const form=document.createElement('form');form.id='nickname-form';
 form.innerHTML='<label for="player-nickname">你的昵称</label><input id="player-nickname" name="nickname" autocomplete="nickname" maxlength="24" placeholder="例如：小宝" required aria-describedby="nickname-hint nickname-error"><p id="nickname-hint">1—12个字；游戏中将称呼你为“昵称＋医生”。只需输入昵称。</p><p id="nickname-preview" aria-live="polite">你的角色：医生</p><p id="nickname-error" role="alert"></p><button type="submit">以这个昵称进入游戏 →</button>';
 root.querySelector('#entry-status').after(form);const input=form.querySelector('input');input.focus();
 input.oninput=()=>{try{form.querySelector('#nickname-preview').textContent='你的角色：'+normalizeNickname(input.value)+'医生';form.querySelector('#nickname-error').textContent='';}catch{form.querySelector('#nickname-preview').textContent='你的角色：医生';}};
 return new Promise(resolve=>{form.onsubmit=e=>{e.preventDefault();try{const name=setPlayerNickname(input.value);form.remove();root.querySelector('#entry-status').textContent='欢迎，'+doctorName()+'。正在准备游戏…';resolve(name);}catch(error){form.querySelector('#nickname-error').textContent=error.message;input.focus();}};});
}
