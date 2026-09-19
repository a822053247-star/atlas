import { state } from './state.js';

export const zones = [
  ['浅海', '海面光线还在身边。让眼睛慢慢适应海洋的蓝。'],
  ['暮光带', '阳光渐渐淡去，灯光开始照出岩壁轮廓。'],
  ['午夜带', '光线消失的地方，保持从容，绕开狭窄岩层。'],
  ['深渊带', '经过温暖的烟囱微光，向安静的海床靠近。'],
];

export function zoneFor(depth) {
  return depth < 200 ? 0 : depth < 1000 ? 1 : depth < 3000 ? 2 : 3;
}

export function updateWorld(dt) {
  const previousDepth = state.depth;

  // 左右控制
  state.x += state.direction * state.horizontalSpeed * dt;

  // 限制潜艇不能跑出屏幕
  state.x = Math.max(10, Math.min(90, state.x));

  // 自动向下潜
  let speed = state.descentSpeed;

  // 没电以后下潜变慢
  if (state.energy <= 0) {
    speed *= 0.45;
  }

  state.depth += speed * dt;

  if (state.depth >= 6000) {
    state.depth = 6000;
  }

  return {
    previousDepth,
    reachedBed: state.depth >= 6000,
  };
}

export function renderWorld({ root, depthEl, zoneDescription, descentBar, stops }) {
  const zone = zoneFor(state.depth);
  root.dataset.zone = zone;
  root.style.setProperty('--sub-x', `${state.x}%`);
  root.style.setProperty('--sub-x-number', state.x);
  depthEl.innerHTML = `${Math.floor(state.depth).toLocaleString('zh-CN')} <small>m</small>`;
  zoneDescription.textContent = zones[zone][1];
  descentBar.style.width = `${state.depth / 60}%`;
  stops.forEach((stop, index) => stop.classList.toggle('active', index === zone));
  if (state.mode === 'game') {
    document.title = `微光深处 · ${zones[zone][0]} ${Math.floor(state.depth).toLocaleString()}m`;
  }
}
