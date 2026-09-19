// 全局运行时状态。各模块共享这一份状态，不在这里保存 DOM 引用。
export const state = {
  mode: 'ready',

  // 航程深度：仍然用于四段海域的推进。
  depth: 0,

  // 潜艇在横屏画面中的位置（百分比）。
  x: 34,
  y: 52,

  // 输入方向：-1 / 0 / 1。
  moveX: 0,
  moveY: 0,

  // 潜艇四向移动速度。
  horizontalSpeed: 34,
  verticalSpeed: 30,

  // 航程自动推进速度（m/s）。
  progressSpeed: 22,

  // 世界横向滚动速度，供障碍物等模块参考。
  scrollSpeed: 7.5,
  worldTime: 0,

  energy: 100,
  light: 70,

  paused: false,
  last: 0,

  collisionUntil: 0,
  frame: 0,
};

export function resetState(light = 70) {
  state.mode = 'game';

  state.depth = 0;
  state.x = 34;
  state.y = 52;

  state.moveX = 0;
  state.moveY = 0;

  state.horizontalSpeed = 34;
  state.verticalSpeed = 30;
  state.progressSpeed = 22;
  state.scrollSpeed = 7.5;
  state.worldTime = 0;

  state.energy = 100;
  state.light = light;

  state.paused = false;
  state.last = performance.now();
  state.collisionUntil = 0;
}
