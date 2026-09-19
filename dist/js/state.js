// 全局运行时状态。各模块共享这一份状态，不在这里保存 DOM 引用。
export const PLAY_BOUNDS = {
  left: 12,
  right: 88,
  top: 12,
  bottom: 88,
};

export const state = {
  mode: 'ready',

  // 航程深度：用于四段海域推进与难度增长。
  depth: 0,

  // 潜艇在横屏画面中的位置（百分比）。
  x: 34,
  y: 52,

  // 输入方向：-1 / 0 / 1。
  moveX: 0,
  moveY: 0,

  // 惯性速度：单位为“屏幕百分比 / 秒”。
  vx: 0,
  vy: 0,

  // 水下驾驶参数。
  acceleration: 125,
  drag: 4.2,
  maxHorizontalSpeed: 30,
  maxVerticalSpeed: 24,

  // 航程自动推进速度（m/s）。
  progressSpeed: 22,
  worldTime: 0,

  // 潜艇耐久。降到 0 也不会 Game Over，只进入严重受损状态。
  durability: 100,
  maxDurability: 100,

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
  state.vx = 0;
  state.vy = 0;

  state.acceleration = 125;
  state.drag = 4.2;
  state.maxHorizontalSpeed = 30;
  state.maxVerticalSpeed = 24;

  state.progressSpeed = 22;
  state.worldTime = 0;

  state.durability = 100;
  state.maxDurability = 100;

  state.energy = 100;
  state.light = light;

  state.paused = false;
  state.last = performance.now();
  state.collisionUntil = 0;
}
