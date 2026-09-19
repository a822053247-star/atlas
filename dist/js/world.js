import { state } from './state.js';

export const zones = [
  ['浅海', '海面光线仍然清晰，保持航向，观察前方水域。'],
  ['暮光带', '阳光渐渐淡去，利用上下移动绕开岩层。'],
  ['午夜带', '进入黑暗水域，留意从右侧靠近的障碍物。'],
  ['深渊带', '接近深渊海床，保持四向机动与灯光余量。'],
];

export function zoneFor(depth) {
  return depth < 200 ? 0 : depth < 1000 ? 1 : depth < 3000 ? 2 : 3;
}

export function updateWorld(dt) {
  // 玩家在屏幕内自由四向移动。
  state.x += state.moveX * state.horizontalSpeed * dt;
  state.y += state.moveY * state.verticalSpeed * dt;

  // 留出 HUD 与边缘安全区。
  state.x = Math.max(10, Math.min(88, state.x));
  state.y = Math.max(18, Math.min(82, state.y));

  // 航程本身持续向深海推进，作为场景阶段与进度计。
  let progressSpeed = state.progressSpeed;

  if (state.energy <= 0) {
    progressSpeed *= 0.55;
  }

  if (performance.now() < state.collisionUntil) {
    progressSpeed *= 0.55;
  }

  state.depth += progressSpeed * dt;
  state.worldTime += dt;

  if (state.depth >= 6000) {
    state.depth = 6000;
  }

  return {
    reachedBed: state.depth >= 6000,
  };
}

export function renderWorld({
  root,
  depthEl,
  zoneDescription,
  descentBar,
  stops
}) {
  const zone = zoneFor(state.depth);

  root.dataset.zone = zone;
  root.style.setProperty('--sub-x', `${state.x}%`);
  root.style.setProperty('--sub-y', `${state.y}%`);
  root.style.setProperty('--sub-x-number', state.x);
  root.style.setProperty('--sub-y-number', state.y);

  depthEl.innerHTML =
    `${Math.floor(state.depth).toLocaleString('zh-CN')} <small>m</small>`;

  zoneDescription.textContent = zones[zone][1];
  descentBar.style.width = `${state.depth / 60}%`;

  stops.forEach((stop, index) => {
    stop.classList.toggle('active', index === zone);
  });

  if (state.mode === 'game') {
    document.title =
      `微光深处 · ${zones[zone][0]} ${Math.floor(state.depth).toLocaleString('zh-CN')}m`;
  }
}
