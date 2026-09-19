// A、B 两侧共享的唯一运行时状态。各模块直接修改字段，不保存 DOM 引用。
export const state = {
  mode: 'ready',

  // 世界位置
  depth: 0,

  // 潜艇横向位置，0~100
  x: 50,

  // -1 左，0 不动，1 右
  direction: 0,

  // 移动参数
  horizontalSpeed: 32,
  descentSpeed: 45,

  energy: 100,
  light: 70,

  paused: false,
  last: 0,

  collisionUntil: 0,
  seenObstacles: new Set(),

  frame: 0,
};
export function resetState(light = 70) {
  state.mode = 'game';

  state.depth = 0;
  state.x = 50;
  state.direction = 0;

  state.horizontalSpeed = 32;
  state.descentSpeed = 45;

  state.energy = 100;
  state.light = light;

  state.paused = false;
  state.last = performance.now();

  state.collisionUntil = 0;
  state.seenObstacles.clear();
}
