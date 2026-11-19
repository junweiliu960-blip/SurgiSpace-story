// Shot-based, deterministic animation. Reconstructing a line never requires a saved half-pose.
export const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
export const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const clip=(duration,shot,cues=[])=>({duration,shot,cues});
export const cinematicClips={
 T00:[clip(8,'T00a T00b',[[4.4,'paper']]),clip(3.2,'T00c',[[.2,'ring'],[1.6,'ring']])],
 T01:[clip(3,'T01a',[[.5,'pickup']]),clip(2.3,'T01b'),clip(2.3,'T01b'),clip(3,'T01b',[[2.4,'paper']])],
 T02:[clip(4,'T02a',[[1,'click'],[2.5,'click']]),clip(9,'T02b T02c',[[1.3,'folder'],[4.3,'bag'],[7,'travel']])],
 T03:[clip(4,'T03a'),clip(11,'T03b T03c',[[1.6,'bag'],[3.5,'step'],[4.1,'step'],[5.6,'door'],[9.2,'seat']])],
 T04:[clip(5,'T04a'),clip(6,'T04b T04c',[[1.8,'cloth'],[4,'fade']])],
 T05:[clip(5,'T05a',[[.3,'wake']]),clip(2.5,'T05a'),clip(3,'T05a'),clip(7,'T05b',[[1.8,'paper'],[4.6,'tablet']]),clip(2.5,'T05b'),clip(2.5,'T05b'),clip(3,'T05b'),clip(6,'T05c',[[1.1,'step'],[1.7,'step'],[3.7,'door'],[5.3,'lock']])],
 T06:[clip(2,'T06a'),clip(4,'T06a',[[1.2,'folder'],[2.7,'paper']]),clip(5,'T06b',[[1,'wheels'],[3,'step']])],
 T07:[clip(4,'T07a',[[.8,'calendar'],[2.1,'step']]),clip(3,'T07b',[[1,'paper']]),clip(2.5,'T07b'),clip(2,'T07b'),clip(3,'T07b',[[1.5,'lock']]),clip(5,'T07c',[[.8,'paper'],[3,'door']])],
 T08:[clip(5,'T08a',[[.6,'step'],[1.2,'step'],[3.8,'seat']]),clip(5,'T08b',[[1.9,'paper'],[3.9,'paper']]),clip(2.5,'T08b'),clip(3,'T08c',[[1.1,'memory']]),clip(2.3,'T08c')],
 FU2:[clip(3,'FU2a'),clip(2,'FU2b'),clip(3,'FU2c'),clip(3,'FU2d',[[1.2,'paper']]),clip(3,'FU2e'),clip(2,'FU2f')],
 T09:[clip(6,'T09a',[[1.2,'badge']]),clip(4,'T09b',[[.6,'wheels'],[1.2,'step'],[2.2,'step']]),clip(2,'T09b'),clip(4,'T09b',[[1,'wheels'],[2,'step']]),clip(8,'T09c',[[.4,'door'],[3.6,'seat'],[5.8,'door'],[6.6,'lock']]),clip(3,'T09c'),clip(3,'T09c')]
};
export const cinemaOrder=['T00','T01','T02','T03','T04','T05','T06','T07','T08','FU2','T09'];
export function getCinematicClip(id,line){const list=cinematicClips[id];if(!list||!Number.isInteger(line)||!list[line])throw Error('未知过场或对白镜头');return list[line];}
const person=(pos,visible=true,yaw=0)=>({pos:[...pos],yaw,visible,sit:0,lean:0,walk:0,look:0,gesture:'idle',reach:null,expression:'neutral'});
function base(id){const s={id,shot:'',camera:{p:[2.8,1.95,3.6],t:[.6,1.15,-.5]},insert:'',black:0,blur:0,eye:1,light:1,calendar:0,market:0,folder:0,phoneTilt:0,door:0,carDoor:0,road:0,bedOffset:0,chairOffset:0,firstPerson:false,hand:[0,.85,.15],hand2:[.15,.84,.15],handStyle:'doctor',handVisible:false,hand2Visible:false,handTremble:0,overlayArm:0,relief:0,vehicle:false,memory:0,
  actors:{huang:person([1.25,0,-1.15]),zhou:person([.8,-.20,-.6]),police:person([-1.15,0,-1.1],false),nurse:person([-.65,0,.0],false),family:person([-.6,0,-.6],false),greeter2:person([-1.0,0,-1.2],false),greeter3:person([-.4,0,-1.6],false)},linVisible:false,props:{
   paper:{owner:'desk',pos:[.20,.827,.06],visible:false,kind:'bill'},phone:{owner:'desk',pos:[.58,.843,.05],visible:false},bag:{owner:'desk',pos:[-.65,.28,.10],visible:false},tablet:{owner:'huang',pos:[0,0,0],visible:false},badge:{owner:'police',pos:[0,0,0],visible:false}}};
 s.actors.zhou.sit=1;
 if(['T00','T01','T02'].includes(id)){s.camera={p:[.55,1.32,1.35],t:[.0,.86,0]};for(const a of Object.values(s.actors))a.visible=false;s.props.paper.visible=true;s.props.phone.visible=true;s.props.bag.visible=true;}
 if(id==='T01'){s.props.phone.owner='doctor';s.firstPerson=true;}
 if(id==='T02')s.props.paper.kind='folder';
 if(id==='T03'){s.camera={p:[2.6,1.75,3.6],t:[.0,1.0,-.7]};s.actors.huang.pos=[-.55,0,-.6];s.actors.greeter2.visible=s.actors.greeter3.visible=true;s.actors.zhou={...person([.65,-.24,-1.0]),sit:1};s.props.bag={owner:'doctor',pos:[0,0,0],visible:true};s.vehicle=true;}
 if(id==='T04'){s.vehicle=true;s.actors.huang.visible=false;s.actors.zhou={...person([.65,-.24,-1]),sit:1};s.camera={p:[.35,1.42,.36],t:[-.25,1.28,-1.2]};s.road=1;}
 if(id==='T05'||id==='T07'){s.linVisible=true;s.actors.zhou.visible=false;if(id==='T05'){s.eye=0;s.blur=1;}else{s.actors.family.visible=false;s.props.paper={owner:'doctor',pos:[0,0,0],visible:true,kind:'followup'};}}
 if(id==='T06'||id==='FU2'){for(const a of Object.values(s.actors))a.visible=false;s.actors.nurse.visible=true;s.actors.nurse.pos=[-.6,0,-.1];s.camera={p:[2.1,2.1,2.9],t:[0,.95,-.15]};s.bedOffset=id==='T06'?.85:0;s.props.paper={owner:'doctor',pos:[0,0,0],visible:true,kind:'record'};}
 if(id==='T08'){s.actors.huang.visible=false;s.actors.zhou={...person([1.3,0,-1.85]),gesture:'pain',expression:'pain'};s.props.paper={owner:'zhou',pos:[0,0,0],visible:false,kind:'note'};}
 if(id==='T09'){for(const a of Object.values(s.actors))a.visible=false;s.actors.zhou={...person([.65,-.20,-1.2]),sit:1,expression:'tired'};s.actors.nurse={...person([.65,0,-1.8]),gesture:'push'};s.actors.police=person([-.65,0,-.9]);s.props.badge.visible=true;s.camera={p:[2.8,1.85,3.5],t:[.2,1,-.5]};}
 return s;
}
function apply(s,line,time){const id=s.id,clip=getCinematicClip(id,line),t=clamp(time,0,clip.duration),q=(a,b)=>smooth((t-a)/(b-a));const old=structuredClone(s);
 const cam=(p,target,a=0,b=clip.duration)=>{const f=q(a,b);s.camera={p:mix(old.camera.p,p,f),t:mix(old.camera.t,target,f)};};
 const move=(who,to,a,b)=>{const f=q(a,b);s.actors[who].pos=mix(old.actors[who].pos,to,f);s.actors[who].walk=f>0&&f<1?t*8:0;};
 const paper=(from,to,a,b)=>{s.props.paper.pos=mix(from,to,q(a,b));s.props.paper.owner='desk';s.props.paper.visible=true;};
 s.shot=clip.shot;s.time=t;s.duration=clip.duration;
 if(id==='T00'){
  if(line===0){s.market=q(0,4);if(t<4)cam([.2,1.2,.9],[-.3,1.02,-.10],0,3.5);else{cam([.4,1.25,.72],[.15,.82,.02],4,6);s.insert='desk';s.handVisible=true;s.handStyle='doctor';s.hand=[.17,.86,.22];paper([.20,.827,.06],[-.02,.827,.06],4.4,6.5);s.hand[0]=.17-.22*q(4.4,6.5);}}
  else{s.market=1;s.props.phone.visible=true;s.phoneTilt=Math.sin(t*45)*.045*(t<.9||t>1.5&&t<2.4?1:0);cam([.50,1.2,.80],[.50,.86,.05],0,1);}
 }
 if(id==='T01'){s.props.phone.owner='doctor';s.firstPerson=true;s.insert='phone';s.phoneTilt=0;s.handVisible=false;if(line===0){s.phoneLift=q(.15,2.1);cam([.5,1.30,1.10],[.1,1.04,-.1],0,2.5);}else{s.phoneLift=1;s.camera.t[0]+=.025*Math.sin(t*2);if(line===3){s.phoneLift=1-.35*q(2.0,3);}}}
 if(id==='T02'){s.firstPerson=false;s.props.phone.owner='desk';s.props.paper.kind='folder';s.insert='desk';if(line===0){s.handVisible=true;s.hand=[-.05,.86,.1];s.folder=.1;cam([.5,1.3,.90],[.1,.85,-.02]);}else{s.folder=q(.4,2.3);s.handVisible=true;s.hand=[.20,.86,.10];s.props.bag.visible=true;if(t>3.4){s.props.bag.owner='doctor';s.handVisible=false;s.firstPerson=true;s.bagLift=q(3.4,5.6);}if(t>6){s.insert='travel';cam([.2,1.5,1.5],[.1,1.0,-.4],6,9);s.travel=q(6,9);}}}
 if(id==='T03'){
  if(line===0){s.actors.huang.gesture='wave';s.actors.greeter2.gesture='wave';s.actors.zhou.look=q(1.5,3.5)*-.6;}
  else{s.actors.huang.gesture='receive';s.handVisible=true;s.hand=[-.10,.93,.28];s.props.bag.pos=[-.10,.9,.26];s.props.bag.owner=t<2.2?'handoff':'huang';if(t>2.2)s.handVisible=false;move('huang',[.5,0,-.4],2.3,4.9);cam([1.3,1.48,.85],[.5,1.1,-.9],2.5,6);s.carDoor=q(5,6.7)*(1-q(9.4,10.8));s.actors.zhou.look=-.75*Math.sin(q(6.8,9.5)*Math.PI);if(t>8.8){s.camera.p=mix([1.3,1.48,.85],[.35,1.42,.36],q(8.8,10.8));s.camera.t=mix([.5,1.1,-.9],[-.25,1.28,-1.2],q(8.8,10.8));}}
 }
 if(id==='T04'){s.road=1+t*.7;s.carDoor=0;if(line===0){cam([.4,1.42,.35],[.9,1.38,-1.0],0,2);s.actors.zhou.look=-.25*q(2,4);}else{s.overlayArm=q(.5,2.6);s.blur=q(1.5,4);s.black=q(4,5.5);cam([.4,1.42,.35],[.2,1.35,-.9],0,2);}}
 if(id==='T05'){
  if(line===0){s.eye=q(0,3);s.blur=1-q(.8,4);s.actors.huang.gesture='speak';cam([2.8,1.95,3.6],[.6,1.15,-.5],0,4);}else{s.eye=1;s.blur=0;}
  if(line===2)s.actors.huang.gesture='assure';
  if(line===3){s.props.paper.kind='check';s.props.paper.visible=true;s.insert=t<3.8?'check':'tablet';s.linVisible=t<3.8?false:true;s.handVisible=true;s.handStyle=t<3.5?'lin':'doctor';s.hand=mix([.28,.86,-.13],[-.06,.86,.18],q(.8,3.3));paper([.28,.827,-.13],[-.06,.827,.18],.8,3.3);if(t<3.8)cam([.4,1.24,.75],[.1,.83,.04],0,.8);else{cam([1.65,1.62,.7],[1.0,1.18,-.6],3.8,5.2);s.handVisible=false;}s.props.tablet.visible=t>3.8;s.actors.huang.gesture='tablet';s.tabletTurn=q(4.0,6.5);}
  if(line>=4&&line<7){s.linVisible=true;s.props.tablet.visible=true;s.actors.huang.gesture='tablet';s.tabletTurn=1;s.insert='';cam([2.8,1.95,3.6],[.6,1.15,-.5],0,1.5);if(line===4){s.handVisible=true;s.hand=[-.07,.86,.18];s.handTremble=Math.sin(t*24)*.004;s.insert='check';}}
  if(line===7){s.handVisible=false;s.props.tablet.visible=t<1.3;s.actors.huang.gesture='walk';move('huang',[1.35,0,-2.5],.2,4.7);s.actors.huang.yaw=Math.PI*(q(.2,1.2));s.door=q(.8,2.2)*.9*(1-q(4.6,5.5));s.actors.huang.visible=t<4.8;s.insert=t>1.5?'door':'';cam([1.7,1.55,.6],[1.2,1,-2.0],1.2,3);s.linVisible=true;}
 }
 if(id==='T06'){s.props.paper.kind='record';s.actors.nurse.gesture='receive';if(line===0)s.insert='door';if(line===1){s.insert='record';s.handVisible=true;s.hand=[-.08,.97,.3];s.props.paper.owner=t<2.1?'handoff':'nurse';s.props.paper.pos=[-.08,.95,.3];s.folder=q(0,1.1);cam([.6,1.46,1.4],[-.2,1.12,.1],0,1.2);}if(line===2){s.insert='';s.props.paper.visible=false;s.handVisible=false;s.bedOffset=.85*(1-q(0,4));s.actors.nurse.pos=[-.55,0,s.bedOffset-.2];s.actors.nurse.walk=t<4?t*7:0;s.actors.nurse.gesture='push';cam([2.1,2.1,2.9],[0,.95,-.15],0,3);}}
 if(id==='T07'){
  if(line===0){s.calendar=q(0,2);s.light=.65+.35*q(0,3.5);move('family',[1.3,0,-2.5],1.4,3.6);s.actors.family.yaw=Math.PI;s.actors.family.visible=false;s.actors.huang.pos=[1.25,0,-1.65];s.insert=t<1.8?'calendar':'';}
  if(line===1){s.props.paper.kind='followup';s.props.paper.owner='desk';paper([.10,.827,.1],[.50,.827,-.05],.4,2.0);s.handVisible=true;s.handStyle='doctor';s.hand=[.10+.40*q(.4,2),.86,.10-.15*q(.4,2)];}
  if(line>=2&&line<=4){s.handVisible=false;s.actors.huang.gesture=line===4?'block':'speak';move('huang',[1.05,0,-1.25],0,1.8);}
  if(line===5){s.insert='ticket';s.handVisible=true;s.handStyle='doctor';s.hand=[.12,.86,.12];s.props.paper.kind='ticket';paper([.12,.85,.12],[.14,.815,.15],.4,1.3);s.hand=mix([.12,.86,.12],[.10,.73,.30],q(1.2,2.5));s.door=.6*(1-q(2.5,4));cam([.5,1.22,.72],[.14,.82,.1],.5,2.5);}
 }
 if(id==='T08'){
  if(line===0){move('zhou',[.8,-.20,-.6],0,4.2);s.actors.zhou.sit=1;s.actors.zhou.lean=.13;s.actors.zhou.gesture='pain';s.actors.zhou.expression='pain';}
  if(line===1){s.props.paper.visible=true;s.actors.zhou.look=-.5*Math.sin(q(0,1.8)*Math.PI);s.actors.zhou.gesture='note';s.props.paper.owner='desk';s.props.paper.pos=mix([.48,.827,-.12],[.0,.827,.17],q(1.6,3.8));s.handVisible=t>3.6;s.hand=[0,.85,.17];s.insert='note';cam([.45,1.28,.72],[.1,.83,.05],1.3,2.5);}
  if(line===2){s.props.paper.visible=true;s.insert='note-read';s.props.paper.owner='doctor';s.handVisible=true;s.hand=[0,.86,.17];s.actors.zhou.gesture='pain';cam([.45,1.28,.72],[.1,.83,.05]);}
  if(line===3){s.handVisible=false;s.props.paper.visible=false;s.memory=q(.7,1.0)*(1-q(1.7,2.1));s.insert=t>.7&&t<2.1?'memory':'';cam([2.5,1.8,3.1],[.8,1.2,-.6],0,1.5);}
  if(line===4){s.insert='';s.memory=0;s.props.paper.visible=false;s.actors.zhou.gesture='pain';}
 }
 if(id==='FU2'){s.insert='';s.props.paper.visible=line===2||line===3;s.actors.nurse.gesture=line===3?'write':'idle';if(line===1)s.patientNod=Math.sin(t*2)*.04;if(line===3){s.props.paper.owner='nurse';s.handVisible=false;cam([1.8,1.7,2.2],[-.2,1,-.1],0,1.5);}if(line===5)s.patientNod=Math.sin(t*2)*.04;}
 if(id==='T09'){
  if(line===0){s.props.badge.visible=true;s.actors.police.gesture='badge';s.actors.zhou.look=-.35*q(2.5,4.8);cam([1.5,1.6,1.8],[-.4,1.25,-.6],0,2.5);s.badgeTurn=q(.4,2);}
  if(line===1||line===3){s.props.badge.visible=false;s.actors.police.gesture='guide';s.actors.nurse.gesture='push';const end=line===1?-.25:.6;move('zhou',[.65,-.20,end],0,3.5);move('nurse',[.65,0,end-.6],0,3.5);move('police',[-.65,0,end+.15],0,3.5);s.chairOffset=s.actors.zhou.pos[2]+1.2;cam([2.8,1.85,3.5],[.2,1,end-.2],0,3);}
  if(line===2){s.actors.police.gesture='guide';s.actors.nurse.gesture='push';}
  if(line===4){s.vehicle=true;s.insert='vehicle';s.carDoor=q(.1,1.7)*(1-q(5.0,6.6));s.actors.police.gesture='guide';s.actors.nurse.gesture='push';s.actors.zhou.visible=t<3.5;s.actors.nurse.visible=t<3.5;cam([1.35,1.48,.85],[.5,1.1,-.9],0,2);if(t>3.3){s.black=.9*Math.sin(q(3.3,4.4)*Math.PI);s.camera.p=mix([1.35,1.48,.85],[.35,1.42,.36],q(3.6,4.4));s.camera.t=mix([.5,1.1,-.9],[-.25,1.28,-1.2],q(3.6,4.4));}if(t>4.5){s.actors.police.visible=false;s.actors.zhou.visible=false;s.actors.nurse.visible=false;}}
  if(line>=5){s.insert='vehicle';s.black=0;s.vehicle=true;s.actors.police.visible=false;s.actors.nurse.visible=false;s.actors.zhou.visible=false;s.camera={p:[.35,1.42,.36],t:[-.25,1.28,-1.2]};s.firstPerson=true;s.relief=line===6?q(0,2.5):0;s.handVisible=true;s.hand=[0,.8,.2];}
 }
 for(const key of ['police','nurse','family','greeter2','greeter3'])s.actors[key].visible=false;
 return s;
}
export function sampleCutscene(id,line,time){getCinematicClip(id,line);let s=base(id);for(let i=0;i<line;i++)s=apply(s,i,cinematicClips[id][i].duration);return apply(s,line,time);}
