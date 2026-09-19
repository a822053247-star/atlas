import { state } from './state.js';

const obstacles = [
  { depth: 470, x: 74 },
  { depth: 840, x: 26 },
  { depth: 1450, x: 68 },
  { depth: 2240, x: 30 },
  { depth: 2920, x: 76 },
  { depth: 3650, x: 24 },
  { depth: 4380, x: 70 },
  { depth: 5120, x: 35 },
];

export function checkObstacles(previousDepth, onCollision) {
  for (const obstacle of obstacles) {
    const crossed = previousDepth < obstacle.depth && state.depth >= obstacle.depth;
    if (crossed && Math.abs(state.x - obstacle.x) < 13) onCollision(obstacle);
  }
}

export function collideWithObstacle(obstacle, { root, collisionNote, setMessage, announce }) {
  if (state.seenObstacles.has(obstacle) || performance.now() < state.collisionUntil) return;
  state.seenObstacles.add(obstacle);
  state.collisionUntil = performance.now() + 1100;
  state.depth = Math.max(0, state.depth - 18);
  root.style.setProperty('--bump', state.x < obstacle.x ? '-10px' : '10px');
  root.classList.add('bump');
  collisionNote.textContent = '轻轻碰到了岩壁 · 已自动减速';
  collisionNote.classList.add('show');
  setMessage('姿态稳定，没有损伤，继续慢慢下潜');
  announce('潜水器轻轻碰到岩壁，已自动减速，没有损伤。');
  setTimeout(() => {
    root.classList.remove('bump');
    collisionNote.classList.remove('show');
  }, 1100);
}
