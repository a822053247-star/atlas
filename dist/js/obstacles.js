import { state } from './state.js';

// 横屏模式下，障碍物从右侧向左移动。
// x / y 都是屏幕百分比坐标。
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
  hitUntil: 0,
  element: null,
}));

let obstacleLayer = null;

function rightmostObstacleX() {
  return Math.max(...obstacles.map(obstacle => obstacle.x));
}

function nextLane(id) {
  const lanes = [24, 38, 52, 66, 78, 31, 60, 72];
  const cycle = Math.floor(state.worldTime / 18);
  return lanes[(id + cycle) % lanes.length];
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
    obstacle.hitUntil = 0;
  });
}

export function updateObstacles(dt) {
  for (const obstacle of obstacles) {
    const collisionSlowdown =
      performance.now() < state.collisionUntil
        ? 0.75
        : 1;

    obstacle.x -=
      obstacle.speed * collisionSlowdown * dt;

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

    // 靠近画面左侧时略微降低亮度，增加空间层次。
    const opacity = Math.max(0.45, Math.min(1, (obstacle.x + 20) / 55));
    obstacle.element.style.opacity = String(opacity);
  });
}

export function checkObstacles(onCollision) {
  const now = performance.now();

  for (const obstacle of obstacles) {
    if (now < obstacle.hitUntil) continue;

    const horizontalDistance = Math.abs(state.x - obstacle.x);
    const verticalDistance = Math.abs(state.y - obstacle.y);

    // 潜艇已经缩小，因此碰撞盒也同步缩小。
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

  // 轻微向碰撞反方向推开，避免卡在障碍物内部。
  const pushX = state.x <= obstacle.x ? -2.4 : 2.4;
  const pushY = state.y <= obstacle.y ? -1.8 : 1.8;

  state.x = Math.max(10, Math.min(88, state.x + pushX));
  state.y = Math.max(18, Math.min(82, state.y + pushY));

  root.style.setProperty('--bump-x', `${pushX * 2}px`);
  root.style.setProperty('--bump-y', `${pushY * 2}px`);
  root.classList.add('bump');

  collisionNote.textContent = '碰到岩层 · 航速短暂降低';
  collisionNote.classList.add('show');

  setMessage('轻微碰撞 · 调整上下左右位置');
  announce('潜水器碰到了障碍物，请使用上下左右方向调整位置。');

  setTimeout(() => {
    root.classList.remove('bump');
    collisionNote.classList.remove('show');
  }, 900);
}
