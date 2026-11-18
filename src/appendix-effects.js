import * as T from 'three';
export {appendixCues as appendixVisualState} from './appendix-sequence.js';
import {appendixCues} from './appendix-sequence.js';
// Question-specific narrative cues; no additional medical scoring.
export function createAppendixEffects(parent,host){
 const group=new T.Group();group.name='Appendix_question_effects';parent.add(group);
 const bag=new T.Group();bag.name='SpecimenBag';group.add(bag);
 const plastic=new T.MeshPhysicalMaterial({color:'#c7e5dc',transparent:true,opacity:.19,roughness:.28,side:T.DoubleSide,depthWrite:false});
 const shell=new T.Mesh(new T.SphereGeometry(1,36,24,0,Math.PI*2,.38,Math.PI-.38),plastic);bag.add(shell);
 const rim=new T.Mesh(new T.TorusGeometry(Math.sin(.38),.018,8,36),new T.MeshStandardMaterial({color:'#dce8dd',roughness:.4}));rim.rotation.x=Math.PI/2;rim.position.y=Math.cos(.38);bag.add(rim);
 const blood=new T.Group();blood.name='Persistent_ooze_cue';group.add(blood);
 const red=new T.MeshStandardMaterial({color:'#8f3436',transparent:true,opacity:.85,roughness:.4,depthWrite:false});
 const patch=new T.Mesh(new T.SphereGeometry(1,24,12),red);patch.scale.set(.037,.023,.007);blood.add(patch);
 const trickle=new T.Mesh(new T.CylinderGeometry(.003,.005,.10,12),red);trickle.position.y=-.045;blood.add(trickle);
 const board=document.createElement('section');board.className='appendix-count-board';board.setAttribute('role','status');board.hidden=true;host.append(board);
 const compass=document.createElement('aside');compass.className='appendix-direction-reference';compass.hidden=true;compass.innerHTML='<small>患者体表参照 · 不随内镜转动</small><svg viewBox="0 0 130 130" aria-label="患者前方示意，头侧朝上，右下腹为本病例定位区域"><circle cx="65" cy="19" r="11" fill="#d2c6a5"/><path d="M47 35 Q65 30 83 35 L89 91 78 100 72 122H60L53 100 41 91Z" fill="#657f74"/><circle cx="51" cy="79" r="8" fill="#cf9b66"/><text x="12" y="66" fill="#f2e5bd">R</text><text x="105" y="66" fill="#f2e5bd">L</text><text x="61" y="10" fill="#f2e5bd">↑</text></svg><span>右下腹定位示意 · 非患者影像</span>';host.append(compass);
 function update({step,progress,detail,loaded,anatomy,time,sceneAssets,study=false}){
  const state=appendixCues(step,progress);compass.hidden=study||!detail||step!==0;board.hidden=study||!(state.recovery||detail&&state.counting);
  if(!board.hidden){const text=state.recovery?`恢复评估：${state.assessed?'已完成':'待团队完成'}\n照护交接：${state.handedOver?'已完成':'尚未完成'}\n转运安排：${state.transportReady?'确认后由人员协助':'暂缓自行离开'}`:`术野：${state.bleeding?'持续渗血':'异常已由团队处理'}\n纱布：${state.discrepancy?'1 块尚未核对清楚':'清点差异已解决'}\n关闭前核查${state.discrepancy||state.bleeding?'未完成':progress<1?'待最终复核':'已完成'}`;if(board.dataset.text!==text){board.dataset.text=text;board.textContent=text;}}
  group.visible=detail&&loaded&&!study;bag.visible=state.bag&&!sceneAssets?.models['specimen-bag'];blood.visible=state.bleeding;
  if(!loaded)return;
  const box=anatomy.bounds('appendix');if(box.isEmpty())return;const center=box.getCenter(new T.Vector3()),size=box.getSize(new T.Vector3());
  bag.position.copy(parent.worldToLocal(center.clone()));bag.scale.set(size.x*.65+.04,size.y*.65+.04,size.z*.75+.04);
  const attachment=new T.Vector3(box.min.x+.02,box.max.y-.025,box.max.z+.012);blood.position.copy(parent.worldToLocal(attachment));patch.scale.x=.037+Math.sin(time*2)*.004;
 }
 return {update,dispose(){board.remove();compass.remove();group.removeFromParent();group.traverse(o=>o.geometry?.dispose());plastic.dispose();red.dispose();rim.material.dispose();}};
}
