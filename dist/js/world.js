import { state, PLAY_BOUNDS } from './state.js';

export const zones = [
  ['浅海', '海面光线仍然清晰，保持航向，观察前方水域。'],
  ['暮光带', '阳光渐渐淡去，利用上下移动绕开岩层。'],
  ['午夜带', '进入黑暗水域，留意从右侧加速靠近的障碍物。'],
  ['深渊带', '接近深渊海床，保持四向机动与灯光余量。'],
];

export function zoneFor(depth) {
  return depth < 200 ? 0 : depth < 1000 ? 1 : depth < 3000 ? 2 : 3;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function updateVelocity(dt) {
  // 对角线输入归一化，避免同时按两个方向时移动更快。
  const inputLength = Math.hypot(state.moveX, state.moveY);
  const inputScale = inputLength > 1 ? 1 / inputLength : 1;

  const inputX = state.moveX * inputScale;
  const inputY = state.moveY * inputScale;

  state.vx += inputX * state.acceleration * dt;
  state.vy += inputY * state.acceleration * dt;

  // 水阻尼。松开按键以后不会立刻停下，而是自然滑行一小段。
  const damping = Math.exp(-state.drag * dt);
  state.vx *= damping;
  state.vy *= damping;

  state.vx = clamp(
    state.vx,
    -state.maxHorizontalSpeed,
    state.maxHorizontalSpeed
  );

  state.vy = clamp(
    state.vy,
    -state.maxVerticalSpeed,
    state.maxVerticalSpeed
  );
}

function updatePosition(dt) {
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  // 四周统一保留 12% 安全区。撞到边界时清除朝外的速度，防止抖动。
  if (state.x <= PLAY_BOUNDS.left) {
    state.x = PLAY_BOUNDS.left;
    if (state.vx < 0) state.vx = 0;
  }

  if (state.x >= PLAY_BOUNDS.right) {
    state.x = PLAY_BOUNDS.right;
    if (state.vx > 0) state.vx = 0;
  }

  if (state.y <= PLAY_BOUNDS.top) {
    state.y = PLAY_BOUNDS.top;
    if (state.vy < 0) state.vy = 0;
  }

  if (state.y >= PLAY_BOUNDS.bottom) {
    state.y = PLAY_BOUNDS.bottom;
    if (state.vy > 0) state.vy = 0;
  }
}

export function updateWorld(dt) {
  updateVelocity(dt);
  updatePosition(dt);

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
  durabilityEl,
  durabilityBar,
  stops
}) {
  const zone = zoneFor(state.depth);

  root.dataset.zone = zone;
  root.style.setProperty('--sub-x', `${state.x}%`);
  root.style.setProperty('--sub-y', `${state.y}%`);
  root.style.setProperty('--sub-x-number', state.x);
  root.style.setProperty('--sub-y-number', state.y);

  // 根据当前惯性速度产生艇身姿态。
  // W/S 主要控制俯仰（约 ±6°），A/D 产生轻微横向偏转（约 ±3°）。
  const verticalTilt = clamp(
    state.vy / state.maxVerticalSpeed,
    -1,
    1
  ) * 6;

  const horizontalYaw = clamp(
    state.vx / state.maxHorizontalSpeed,
    -1,
    1
  ) * 3;

  root.style.setProperty('--sub-tilt', `${verticalTilt.toFixed(2)}deg`);
  root.style.setProperty('--sub-yaw', `${horizontalYaw.toFixed(2)}deg`);

  depthEl.innerHTML =
    `${Math.floor(state.depth).toLocaleString('zh-CN')} <small>m</small>`;

  if (durabilityEl && durabilityBar) {
    const durability = Math.max(0, Math.ceil(state.durability));

    durabilityEl.value = `${durability}%`;
    durabilityEl.textContent = `${durability}%`;
    durabilityBar.style.width = `${durability}%`;

    root.classList.toggle('damaged', durability <= 40);
    root.classList.toggle('critical-damage', durability <= 15);
  }

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
