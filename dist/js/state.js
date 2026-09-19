// A、B 两侧共享的唯一运行时状态。各模块直接修改字段，不保存 DOM 引用。
export const state = {
  mode: 'ready',
  depth: 0,
  energy: 100,
  light: 70,
  x: 50,
  direction: 0,
  paused: false,
  last: 0,
  collisionUntil: 0,
  seenObstacles: new Set(),
  frame: 0,
};

export function resetState(light = 70) {
  state.mode = 'game';
  state.depth = 0;
  state.energy = 100;
  state.light = light;
  state.x = 50;
  state.direction = 0;
  state.paused = false;
  state.last = performance.now();
  state.collisionUntil = 0;
  state.seenObstacles.clear();
}
