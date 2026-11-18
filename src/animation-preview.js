import './photo-scene.css';
import './campaign.css';
import {stories} from './story-data.js';
import {cinemaOrder,cinematicClips} from './cinematic-data.js';
import {createCinematicStage} from './cinematic-stage.js';
import {connectDialogue,screenPoint} from './dialogue-presentation.js';
const $=s=>document.querySelector(s);document.body.style.cssText='margin:0;background:#10272b;color:#dce5da;font:16px sans-serif';$('main').style.cssText='max-width:1400px;margin:auto;padding:16px';$('.campaign-stage').style.cssText='height:72vh;min-height:380px;position:relative';$('nav').style.cssText='display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px';
let stage,cleanup,scene='T00',line=0,paused=false,token=0;
$('#scene').innerHTML=cinemaOrder.map(id=>`<option value="${id}">${id} ${stories[id].title}</option>`).join('');
function play(){const t=++token;const l=stories[scene].lines[line];$('#line').value=line;$('.story-subtitles small').textContent=l.speaker;$('.story-subtitles p').textContent=l.text;cleanup?.();cleanup=connectDialogue($('.campaign-stage'),$('.story-subtitles'),{speaker:()=>l.speaker,anchor:n=>screenPoint($('canvas'),stage.speakerAnchor(n))});$('#seek').max=cinematicClips[scene][line].duration;stage.playLine(line,()=>{if(t!==token||!$('#auto').checked)return;if(line+1<stories[scene].lines.length){line++;play();}});}
async function load(){++token;cleanup?.();stage?.dispose();scene=$('#scene').value;line=0;$('.campaign-stage').className='campaign-stage stage-'+stories[scene].set;$('#line').innerHTML=stories[scene].lines.map((l,i)=>`<option value="${i}">${i+1} ${l.speaker}</option>`).join('');stage=createCinematicStage($('canvas'),{id:scene,muted:$('#mute').checked});stage.setPaused(paused);await stage.ready;play();}
$('#scene').onchange=load;$('#line').onchange=()=>{line=Number($('#line').value);play();};$('#play').onclick=play;$('#pause').onclick=()=>{paused=!paused;stage.setPaused(paused);$('#pause').textContent=paused?'继续':'暂停';};$('#mute').onchange=()=>stage.setMuted($('#mute').checked);$('#seek').oninput=()=>{stage.seek?.(Number($('#seek').value));};setInterval(()=>{const s=stage?.snapshot();if(!s)return;$('#seek').value=s.time||0;$('#time').textContent=`${(s.time||0).toFixed(1)} / ${s.duration||0} 秒`;},100);window.surgispaceAnimations={get snapshot(){return stage?.snapshot();},select:async(id,i=0)=>{$('#scene').value=id;await load();line=i;play();},seek:t=>stage.seek(t)};load();

import './improvements.css';
