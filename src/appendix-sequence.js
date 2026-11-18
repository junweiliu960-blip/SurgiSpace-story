export const APPENDIX_SCENES=[
 {id:'AS01',title:'方向与定位',camera:[.35,1.20,2.65],target:[.12,.92,0],scope:true,cues:['患者方向参照固定','镜头轻微旋转后重新定位'],actions:[['确认患者方向与体表参照',1]]},
 {id:'AS02',title:'辨认阑尾与连接',camera:[.25,1.15,2.45],target:[.12,.90,0],scope:true,cues:['A 盲肠','B 阑尾及根部连接','C 邻近小肠'],actions:[['查看阑尾根部与盲肠的连接',.5],['确认操作目标，保护邻近肠管',1]]},
 {id:'AS03',title:'改善视野',camera:[.35,1.13,2.4],target:[.12,.90,0],scope:true,cues:['连接被组织部分遮挡','先显露后确认'],actions:[['轻柔牵开遮挡，核对根部和邻近结构',1]]},
 {id:'AS04',title:'保护并移出标本',camera:[.30,1.13,2.55],target:[.16,.90,0],scope:true,cues:['团队已完成连接处理','装袋后移出','返回检查保留组织'],actions:[['展开取物袋',.20],['将标本置入袋内',.55],['保护下移出标本',.88],['返回术野，检查处理部位与邻近肠管',1]]},
 {id:'AS05',title:'关闭前处理异常',camera:[.15,1.10,2.50],target:[.05,.95,0],scope:true,cues:['持续渗血','纱布1块未核清','两项分别解决'],actions:[['暂停关闭，由团队处理渗血并检查相关部位',.50],['重新核对清点记录，解决纱布差异',.85],['复查术野与清点结果后再收尾',1]]},
 {id:'AS06',title:'恢复评估与安全转运',scope:false,cues:['恢复评估未完成','照护交接未完成','暂缓自行离开'],actions:[['团队完成恢复评估',.34],['完成照护交接与协助安排',.67],['确认可以安全转运后安排人员协助',1]]}
];
export function appendixScene(step){return APPENDIX_SCENES[Math.max(0,Math.min(5,step))];}
export function appendixCues(step,progress){return {bag:step===3&&progress>0&&progress<1,bleeding:step===4&&progress<.45,counting:step===4,discrepancy:step===4&&progress<.80,recovery:step===5,assessed:step===5&&progress>=.34,handedOver:step===5&&progress>=.67,transportReady:step===5&&progress>=1};}
