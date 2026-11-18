import './campaign.css';
import './photo-scene.css';
import {createScene} from './scene.js';
import {createCampaignStage} from './campaign-stage.js';
import {mountPhotoHotspots} from './photo-layout.js';
document.head.insertAdjacentHTML('beforeend','<style>html,body{height:100%;overflow:hidden}body{display:flex;flex-direction:column;margin:0;background:#102b2a;color:#ebead4;font:14px system-ui}header{flex:none;min-height:64px;display:flex;align-items:center;gap:18px;padding:0 20px;flex-wrap:wrap}button,select{padding:9px 15px;background:#254f46;color:#fff4d6;border:1px solid #8c9e7e;border-radius:5px}main{position:relative;flex:1;min-height:0;width:100%;max-width:1440px;margin:auto}#organ-controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap}#organ-controls[hidden]{display:none}header{padding:10px 20px;gap:10px}canvas{width:100%;height:100%;display:block}dialog{background:#e8e4cf;color:#1d4438;max-width:460px;border:1px solid #a5a885;border-radius:8px}dialog::backdrop{background:#082d2999}</style>');
window.addEventListener('error',event=>{const status=document.querySelector('#status');if(status)status.textContent='预览错误：'+event.message;});
const $=s=>document.querySelector(s),host=$('main');let world,stop,epoch=0;
function info(text){$('#information').textContent=text;$('dialog').showModal();}
$('#close').onclick=()=>$('dialog').close();
async function load(){const token=++epoch;stop?.();world?.dispose();$('#scene').replaceWith(Object.assign(document.createElement('canvas'),{id:'scene'}));const canvas=$('#scene'),room=$('#room').value;$('#organ-controls').hidden=room!=='appendix';host.className='viewport';host.style.setProperty('--room-image',`url('/images/backgrounds/${room==='clinic'?'clinic':'or'}-retrofuture.png')`);$('#status').textContent='加载中…';
 if(room==='appendix')world=createCampaignStage(canvas,{mode:'appendix',patient:'zhou'});
 else{world=await createScene(canvas,text=>$('#status').textContent=text);if(token!==epoch){world.dispose();return;}world.setConsultation(room==='clinic');world.setStage(room==='clinic'?0:3);}
 stop=mountPhotoHotspots(host,room==='clinic'?'clinic':'or',{computer:()=>info('电脑：患者病史、检查报告与诊疗计划。'),folder:()=>info('资料夹：会诊记录与随访资料。'),bed:()=>$('#detail').click(),monitor:()=>info('监护信息：本画面为剧情模拟，非实时监护。'),instruments:()=>info('器械核对：手术刀、拉钩、止血钳、镊、吸引器和持针器。')});$('#status').textContent='点击原图中的电脑、资料夹、床面或仪器';
}
$('#question-step').onchange=()=>{const step=Number($('#question-step').value);world?.setStep?.(step);if(step===5){world?.closeDetail?.();host.classList.remove('photo-detail');}else{world?.openDetail?.();host.classList.add('photo-detail');}};$('#question-play').onclick=async()=>{await world?.performStep?.();};
$('#organ-view').onchange=()=>{world?.setOrganView?.($('#organ-view').value);host.classList.add('photo-detail');};$('#room').onchange=load;$('#overview').onclick=()=>{world?.closeDetail?.();world?.setAnatomy?.(false);world?.view?.('overview');host.classList.remove('photo-detail');};$('#detail').onclick=()=>{if($('#room').value==='clinic'){info('诊疗资料通过原图左侧电脑查看。');return;}if(world?.openDetail){world.openDetail();host.classList.add('photo-detail');}else{world.setStage(7);world.view('kidney');}};
if(new URLSearchParams(location.search).get('case')==='appendix')$('#room').value='appendix';
await load();if(new URLSearchParams(location.search).has('step')){$('#question-step').value=new URLSearchParams(location.search).get('step');$('#question-step').onchange();}

if(new URLSearchParams(location.search).has('debug')){const diagnostic=document.createElement('pre');diagnostic.id='scene-diagnostic';document.body.append(diagnostic);setInterval(()=>{diagnostic.textContent=JSON.stringify(world?.snapshot(),null,2);},500);}

import './improvements.css';
