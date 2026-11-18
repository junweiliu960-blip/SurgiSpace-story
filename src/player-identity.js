// Nicknames are player data; canonical speaker IDs remain unchanged for scene anchors.
export function normalizeNickname(value){
 const name=String(value??'').normalize('NFKC').trim().replace(/\s+/g,' ');
 if(!name||[...name].length>12||! /^[\p{L}\p{N}_ -]+$/u.test(name))throw Error('请输入1—12个字的昵称，可使用文字、数字、空格、下划线或短横线。');
 return name;
}
export function setPlayerNickname(value){globalThis.SURGISPACE_NICKNAME=normalizeNickname(value);return globalThis.SURGISPACE_NICKNAME;}
export function playerNickname(){return globalThis.SURGISPACE_NICKNAME||'';}
export function doctorName(){return playerNickname()?playerNickname()+'医生':'医生';}
export function doctorText(value){return String(value??'').replace(/陈医生|医生(?=[，？])/g,doctorName()).replace(/谢谢医生/g,'谢谢'+doctorName());}
export function doctorSpeaker(value){return value==='医生'?doctorName():doctorText(value);}
