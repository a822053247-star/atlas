import { state, PLAY_BOUNDS } from './state.js';

// 横屏模式下，障碍物从右侧向左移动。
// speed 是基础速度；随着深度增加，会再乘以难度系数。
const obstacleBlueprints = [
  { id: 1, x: 112, y: 30, size: 110, speed: 7.8, asset: 'cliff.webp' },
  { id: 2, x: 145, y: 70, size: 126, speed: 6.7, asset: 'reef.webp' },
  { id: 3, x: 180, y: 47, size: 96,  speed: 8.6, asset: 'cliff.webp' },
  { id: 4, x: 218, y: 24, size: 118, speed: 7.1, asset: 'vent.webp' },
  { id: 5, x: 252, y: 76, size: 104, speed: 8.2, asset: 'cliff.webp' },
  { id: 6, x: 292, y: 54, size: 130, speed: 6.5, asset: 'reef.webp' },
  { id: 7, x: 330, y: 34, size: 106, speed: 8.9, asset: 'cliff.webp' },
  { id: 8, x: 370, y: 68, size: 120, speed: 7.4, asset: 'vent.webp' },
];

const obstacles = obstacleBlueprints.map(item => ({
  ...item,
  startX: item.x,
  startY: item.y,
  hitUntil: 0,
  element: null,
}));

let obstacleLayer = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rightmostObstacleX() {
  return Math.max(...obstacles.map(obstacle => obstacle.x));
}

function nextLane(id) {
  const lanes = [22, 34, 47, 60, 74, 28, 55, 79];
  const cycle = Math.floor(state.worldTime / 18);
  return lanes[(id + cycle) % lanes.length];
}

function depthSpeedFactor() {
  // 0m = 1.0 倍，6000m = 1.75 倍。
  const progress = clamp(state.depth / 6000, 0, 1);
  return 1 + progress * 0.75;
}

export function initObstacles(root) {
  if (obstacleLayer) return;

  const ocean = root.querySelector('.ocean');

  if (!ocean) {
    console.warn('找不到 .ocean，无法初始化障碍物');
    return;
  }

  obstacleLayer = document.createElement('div');
  obstacleLayer.className = 'obstacle-layer';
  obstacleLayer.style.position = 'absolute';
  obstacleLayer.style.inset = '0';
  obstacleLayer.style.zIndex = '3';
  obstacleLayer.style.overflow = 'hidden';
  obstacleLayer.style.pointerEvents = 'none';

  obstacles.forEach(obstacle => {
    const element = document.createElement('img');

    element.src = `assets/${obstacle.asset}`;
    element.alt = '';
    element.dataset.obstacleId = obstacle.id;
    element.className = 'moving-obstacle';

    element.style.position = 'absolute';
    element.style.width = `${obstacle.size}px`;
    element.style.height = 'auto';
    element.style.left = `${obstacle.x}%`;
    element.style.top = `${obstacle.y}%`;
    element.style.pointerEvents = 'none';
    element.style.userSelect = 'none';
    element.style.transform = 'translate(-50%, -50%)';
    element.style.transformOrigin = 'center';
    element.style.filter =
      'brightness(.56) saturate(.72) drop-shadow(0 12px 18px rgba(0,0,0,.48))';

    obstacle.element = element;
    obstacleLayer.appendChild(element);
  });

  ocean.appendChild(obstacleLayer);
}

export function resetObstacles() {
  obstacles.forEach(obstacle => {
    obstacle.x = obstacle.startX;
    obstacle.y = obstacle.startY;
    obstacle.hitUntil = 0;
  });
}

export function updateObstacles(dt) {
  const speedFactor = depthSpeedFactor();

  for (const obstacle of obstacles) {
    const collisionSlowdown =
      performance.now() < state.collisionUntil
        ? 0.75
        : 1;

    obstacle.x -=
      obstacle.speed *
      speedFactor *
      collisionSlowdown *
      dt;

    // 完全离开左侧后，重新排到所有障碍物的右边。
    if (obstacle.x < -16) {
      const rightEdge = rightmostObstacleX();

      obstacle.x = rightEdge + 34 + obstacle.id * 1.7;
      obstacle.y = nextLane(obstacle.id);
      obstacle.hitUntil = 0;
    }
  }
}

export function renderObstacles() {
  if (!obstacleLayer) return;

  obstacles.forEach(obstacle => {
    if (!obstacle.element) return;

    const visible = obstacle.x > -18 && obstacle.x < 118;
    obstacle.element.style.display = visible ? 'block' : 'none';

    if (!visible) return;

    obstacle.element.style.left = `${obstacle.x}%`;
    obstacle.element.style.top = `${obstacle.y}%`;

    const opacity = Math.max(
      0.45,
      Math.min(1, (obstacle.x + 20) / 55)
    );

    obstacle.element.style.opacity = String(opacity);
  });
}

export function checkObstacles(onCollision) {
  const now = performance.now();

  for (const obstacle of obstacles) {
    if (now < obstacle.hitUntil) continue;

    const horizontalDistance = Math.abs(state.x - obstacle.x);
    const verticalDistance = Math.abs(state.y - obstacle.y);

    const hit =
      horizontalDistance < 7.2 &&
      verticalDistance < 10.5;

    if (!hit) continue;

    obstacle.hitUntil = now + 1600;
    onCollision(obstacle);
  }
}

export function collideWithObstacle(
  obstacle,
  {
    root,
    collisionNote,
    setMessage,
    announce
  }
) {
  if (performance.now() < state.collisionUntil) return;

  state.collisionUntil = performance.now() + 900;

  // 碰撞伤害：低速擦碰约 10%，高速撞击最高约 20%。
  // 0% 耐久不会结束游戏，只进入严重受损状态。
  const impactSpeed = Math.hypot(
    state.vx / state.maxHorizontalSpeed,
    state.vy / state.maxVerticalSpeed
  );

  const speedDamage =
    clamp(impactSpeed, 0, 1) * 3;

  const sizeDamage =
    clamp((obstacle.size - 90) / 40, 0, 1) * 2;

  const damage = Math.round(
    clamp(
      3 + speedDamage + sizeDamage,
      3,
      8
    )
  );

  state.durability = Math.max(
    0,
    state.durability - damage
  );

  const pushX = state.x <= obstacle.x ? -2.4 : 2.4;
  const pushY = state.y <= obstacle.y ? -1.8 : 1.8;

  state.x = clamp(
    state.x + pushX,
    PLAY_BOUNDS.left,
    PLAY_BOUNDS.right
  );

  state.y = clamp(
    state.y + pushY,
    PLAY_BOUNDS.top,
    PLAY_BOUNDS.bottom
  );

  // 碰撞会打断当前惯性，避免继续滑进岩层。
  state.vx *= -0.22;
  state.vy *= -0.22;

  root.style.setProperty('--bump-x', `${pushX * 2}px`);
  root.style.setProperty('--bump-y', `${pushY * 2}px`);
  root.classList.add('bump');

  collisionNote.textContent =
    `碰到岩层 · 耐久 -${damage}%`;
  collisionNote.classList.add('show');

  if (state.durability <= 0) {
    setMessage('耐久归零 · 应急结构维持，可继续探索');
  } else if (state.durability <= 30) {
    setMessage(`耐久仅剩 ${Math.ceil(state.durability)}% · 谨慎驾驶`);
  } else {
    setMessage(`轻微碰撞 · 耐久剩余 ${Math.ceil(state.durability)}%`);
  }

  announce(
    `潜水器碰到了障碍物，耐久减少百分之${damage}。` +
    (state.durability <= 0
      ? '应急结构仍可维持潜航。'
      : '请调整上下左右位置。')
  );

  setTimeout(() => {
    root.classList.remove('bump');
    collisionNote.classList.remove('show');
  }, 900);
}
