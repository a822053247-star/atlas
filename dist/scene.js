const root=document.querySelector('.voyage');
const preparation=document.querySelector('.preparation');
const sceneUI=document.querySelector('.scene-ui');
const subLabel=document.querySelector('.sub-label');
const stops=[...document.querySelectorAll('.stop')];
const depthEl=document.querySelector('#depth');
const energyEl=document.querySelector('#energy');
const energyBar=document.querySelector('#energy-bar');
const lightControl=document.querySelector('#light-control');
const lightValue=document.querySelector('#light-value');
const systemMessage=document.querySelector('#system-message');
const collisionNote=document.querySelector('#collision-note');
const zones=[['浅海','海面光线还在身边。让眼睛慢慢适应海洋的蓝。'],['暮光带','阳光渐渐淡去，灯光开始照出岩壁轮廓。'],['午夜带','光线消失的地方，保持从容，绕开狭窄岩层。'],['深渊带','经过温暖的烟囱微光，向安静的海床靠近。']];
const obstacles=[{depth:470,x:74},{depth:840,x:26},{depth:1450,x:68},{depth:2240,x:30},{depth:2920,x:76},{depth:3650,x:24},{depth:4380,x:70},{depth:5120,x:35}];
const state={mode:'ready',depth:0,energy:100,light:70,x:50,direction:0,paused:false,last:0,collisionUntil:0,seen:new Set(),frame:0};
function zoneFor(depth){return depth<200?0:depth<1000?1:depth<3000?2:3}
function render(){const zone=zoneFor(state.depth);root.dataset.zone=zone;root.style.setProperty('--sub-x',`${state.x}%`);root.style.setProperty('--sub-x-number',state.x);root.style.setProperty('--light-level',state.light);root.style.setProperty('--light-opacity',Math.max(.18,state.light/100));root.classList.toggle('low-energy',state.energy<=0);root.classList.toggle('paused',state.paused);depthEl.innerHTML=Math.floor(state.depth).toLocaleString('zh-CN')+' <small>m</small>';document.querySelector('#zone-description').textContent=zones[zone][1];document.querySelector('#descent-bar').style.width=`${state.depth/60}%`;energyEl.value=`${Math.ceil(state.energy)}%`;energyEl.textContent=energyEl.value;energyBar.style.width=`${state.energy}%`;energyBar.style.background=state.energy<20?'#e9c37f':'var(--mint)';lightValue.value=`${state.light}%`;lightValue.textContent=lightValue.value;stops.forEach((stop,i)=>stop.classList.toggle('active',i===zone));if(state.mode==='game')document.title=`微光深处 · ${zones[zone][0]} ${Math.floor(state.depth).toLocaleString()}m`;}
function announce(text){document.querySelector('#announcement').textContent=text}
function setMessage(text){systemMessage.textContent=text}
function enter(){state.mode='game';state.depth=0;state.energy=100;state.light=Number(lightControl.value);state.x=50;state.paused=false;state.last=performance.now();state.seen.clear();root.dataset.mode='game';document.querySelector('.connection').innerHTML='<i></i>微光号 · 潜航中';preparation.hidden=true;subLabel.hidden=true;sceneUI.hidden=false;document.querySelector('#pause').textContent='暂停下潜';document.querySelector('#pause').setAttribute('aria-pressed','false');setMessage('系统稳定，缓慢下潜中');announce('潜航开始。使用左右方向键或 A、D 键驾驶潜水器。');render();cancelAnimationFrame(state.frame);state.frame=requestAnimationFrame(tick)}
function returnHome(){state.mode='ready';state.paused=false;cancelAnimationFrame(state.frame);root.dataset.mode='ready';root.classList.remove('paused','low-energy','bump');document.querySelector('.connection').innerHTML='<i></i>微光号 · 准备出发';preparation.hidden=false;subLabel.hidden=false;sceneUI.hidden=true;document.title='微光深处 · 潜航准备';document.querySelector('#launch').focus()}
function bump(obstacle){if(state.seen.has(obstacle)||performance.now()<state.collisionUntil)return;state.seen.add(obstacle);state.collisionUntil=performance.now()+1100;state.depth=Math.max(0,state.depth-18);root.style.setProperty('--bump',state.x<obstacle.x?'-10px':'10px');root.classList.add('bump');collisionNote.textContent='轻轻碰到了岩壁 · 已自动减速';collisionNote.classList.add('show');setMessage('姿态稳定，没有损伤，继续慢慢下潜');announce('潜水器轻轻碰到岩壁，已自动减速，没有损伤。');setTimeout(()=>{root.classList.remove('bump');collisionNote.classList.remove('show')},1100)}
function tick(now){if(state.mode!=='game')return;const dt=Math.min(.05,(now-state.last)/1000||0);state.last=now;if(!state.paused){state.x=Math.max(12,Math.min(82,state.x+state.direction*25*dt));const drain=(.08+state.light*.0028)*dt;state.energy=Math.max(0,state.energy-drain);const descentRate=state.energy>0?17:8;const previous=state.depth;state.depth=Math.min(6000,state.depth+descentRate*dt);for(const obstacle of obstacles){if(previous<obstacle.depth&&state.depth>=obstacle.depth&&Math.abs(state.x-obstacle.x)<13)bump(obstacle)}if(state.energy<=0){state.light=20;lightControl.value='20';setMessage('启用应急照明 · 能量不足，下潜速度放缓')}else if(state.energy<20){setMessage('能量偏低 · 调暗灯光可以延长航程')}else setMessage('系统稳定，缓慢下潜中');if(state.depth>=6000){state.paused=true;setMessage('已抵达海床 · 可以自由返航');announce('已抵达六千米海床。没有失败，可以继续停留或自由返航。')}}render();state.frame=requestAnimationFrame(tick)}
function setDirection(value){state.direction=value}
document.querySelector('#launch').addEventListener('click',enter);
document.querySelector('#return').addEventListener('click',returnHome);
document.querySelector('#pause').addEventListener('click',event=>{state.paused=!state.paused;event.currentTarget.textContent=state.paused?'继续下潜':'暂停下潜';event.currentTarget.setAttribute('aria-pressed',String(state.paused));announce(state.paused?'潜航已暂停。':'继续缓慢下潜。')});
lightControl.addEventListener('input',()=>{if(state.energy<=0){lightControl.value='20';return}state.light=Number(lightControl.value);render()});
addEventListener('keydown',event=>{if(state.mode!=='game')return;if(['ArrowLeft','a','A'].includes(event.key)){event.preventDefault();setDirection(-1)}if(['ArrowRight','d','D'].includes(event.key)){event.preventDefault();setDirection(1)}if(event.key===' '){event.preventDefault();document.querySelector('#pause').click()}});
addEventListener('keyup',event=>{if(['ArrowLeft','ArrowRight','a','A','d','D'].includes(event.key))setDirection(0)});
root.addEventListener('pointermove',event=>{if(state.mode==='game'&&event.pointerType==='mouse'&&!event.target.closest('button,input,a'))state.x=Math.max(12,Math.min(82,event.clientX/innerWidth*100))});
for(const [id,direction] of [['move-left',-1],['move-right',1]]){const button=document.querySelector(`#${id}`);button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);setDirection(direction)});button.addEventListener('pointerup',()=>setDirection(0));button.addEventListener('pointercancel',()=>setDirection(0))}
render();
