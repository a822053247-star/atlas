import { state } from './state.js';


// ============================================================
// 障碍物设置
// ============================================================

// 玩家能提前多远看到障碍物。
// 例如 450 表示距离障碍物还有 450m 时，
// 障碍物会从屏幕底部开始出现。
const VIEW_DISTANCE = 450;

// 潜艇在屏幕上的大致纵向位置。
// 你现在 CSS 里潜艇 top: 39%，所以这里使用 39。
const SUB_Y = 39;


// ============================================================
// 障碍物数据
// ============================================================
//
// depth：障碍物所在深度
// x：障碍物横向位置（百分比）
// size：障碍物显示大小
//
// x 越小越靠左
// x 越大越靠右
//
// 例如：
// x: 20  -> 左边
// x: 50  -> 中间
// x: 80  -> 右边
// ============================================================

const obstacles = [
  { id: 1, depth: 470,  x: 74, size: 90 },
  { id: 2, depth: 840,  x: 26, size: 110 },
  { id: 3, depth: 1450, x: 68, size: 95 },
  { id: 4, depth: 2240, x: 30, size: 120 },
  { id: 5, depth: 2920, x: 76, size: 100 },
  { id: 6, depth: 3650, x: 24, size: 105 },
  { id: 7, depth: 4380, x: 70, size: 115 },
  { id: 8, depth: 5120, x: 35, size: 100 },
];


// 用来装所有障碍物 DOM
let obstacleLayer = null;


// ============================================================
// 初始化障碍物
// ============================================================
//
// 这个函数只需要在 scene.js 启动的时候调用一次。
//
// 它会：
//
// 1. 创建障碍物图层
// 2. 为每一个障碍物创建图片
// 3. 放进 ocean 场景
//
// ============================================================

export function initObstacles(root) {

  // 防止重复初始化
  if (obstacleLayer) {
    return;
  }

  const ocean = root.querySelector('.ocean');

  if (!ocean) {
    console.warn('找不到 .ocean，无法初始化障碍物');
    return;
  }


  // 创建障碍物容器
  obstacleLayer = document.createElement('div');

  obstacleLayer.className = 'obstacle-layer';

  obstacleLayer.style.position = 'absolute';
  obstacleLayer.style.inset = '0';
  obstacleLayer.style.overflow = 'hidden';
  obstacleLayer.style.pointerEvents = 'none';


  // ==========================================================
  // 为每个障碍物创建图片
  // ==========================================================

  obstacles.forEach(obstacle => {

    const element = document.createElement('img');

    // 暂时直接使用项目里的岩壁图片
    element.src = 'assets/cliff.webp';

    element.alt = '';

    element.dataset.obstacleId = obstacle.id;

    element.style.position = 'absolute';

    element.style.width = `${obstacle.size}px`;

    element.style.height = 'auto';

    element.style.left = `${obstacle.x}%`;

    element.style.top = '100%';

    element.style.display = 'none';

    element.style.pointerEvents = 'none';

    element.style.userSelect = 'none';

    element.style.filter =
      'brightness(.55) saturate(.7) drop-shadow(0 12px 15px rgba(0,0,0,.45))';

    element.style.transformOrigin = 'center center';

    element.style.transform =
      'translate(-50%, -50%) scale(.7)';


    // 保存 DOM 引用
    obstacle.element = element;

    obstacleLayer.appendChild(element);
  });


  ocean.appendChild(obstacleLayer);
}


// ============================================================
// 绘制 / 移动障碍物
// ============================================================
//
// 每一帧都调用。
// 根据:
//
// obstacle.depth - state.depth
//
// 计算障碍物应该出现在屏幕什么位置。
//
// 玩家越靠近障碍物，障碍物越往上移动。
// ============================================================

export function renderObstacles() {

  if (!obstacleLayer) {
    return;
  }


  obstacles.forEach(obstacle => {

    if (!obstacle.element) {
      return;
    }


    // --------------------------------------------------------
    // 计算潜艇距离障碍物还有多少米
    // --------------------------------------------------------

    const distance =
      obstacle.depth - state.depth;


    // --------------------------------------------------------
    // 障碍物太远
    //
    // 或者已经经过很远
    //
    // 就隐藏
    // --------------------------------------------------------

    if (
      distance > VIEW_DISTANCE ||
      distance < -100
    ) {
      obstacle.element.style.display = 'none';
      return;
    }


    obstacle.element.style.display = 'block';


    // --------------------------------------------------------
    // progress:
    //
    // 0 = 刚进入屏幕
    // 1 = 与潜艇处于同一深度
    //
    // --------------------------------------------------------

    const progress =
      1 - distance / VIEW_DISTANCE;


    // 障碍物刚出现时的位置
    const startY = 96;


    // 根据距离计算屏幕纵向位置
    const y =
      startY -
      progress * (startY - SUB_Y);


    // --------------------------------------------------------
    // 越靠近潜艇，障碍物看起来稍微越大
    //
    // 制造“向玩家靠近”的感觉
    // --------------------------------------------------------

    const scale =
      Math.max(
        0.55,
        Math.min(
          1.25,
          0.65 + progress * 0.5
        )
      );


    obstacle.element.style.left =
      `${obstacle.x}%`;

    obstacle.element.style.top =
      `${y}%`;

    obstacle.element.style.transform =
      `translate(-50%, -50%) scale(${scale})`;
  });
}


// ============================================================
// 碰撞检测
// ============================================================
//
// scene.js 当前调用：
//
// checkObstacles(previousDepth, handleCollision);
//
// 所以保留 previousDepth 参数，
// 即使现在主要使用 state.depth 判断。
// ============================================================

export function checkObstacles(
  previousDepth,
  onCollision
) {

  for (const obstacle of obstacles) {


    // --------------------------------------------------------
    // 如果已经撞过或者已经成功躲过去
    // 就不重复检测
    // --------------------------------------------------------

    if (
      state.seenObstacles.has(obstacle.id)
    ) {
      continue;
    }


    // --------------------------------------------------------
    // 深度方向距离
    //
    // 越接近 0，说明潜艇和障碍物越接近
    // --------------------------------------------------------

    const verticalDistance =
      Math.abs(
        state.depth - obstacle.depth
      );


    // --------------------------------------------------------
    // 左右方向距离
    // --------------------------------------------------------

    const horizontalDistance =
      Math.abs(
        state.x - obstacle.x
      );


    // --------------------------------------------------------
    // 碰撞条件
    //
    // 深度差 < 22m
    // 并且
    // 左右距离 < 11%
    //
    // 两个条件同时满足才算撞上
    // --------------------------------------------------------

    const hit =
      verticalDistance < 22 &&
      horizontalDistance < 11;


    if (hit) {

      // 标记这个障碍物已经处理过
      state.seenObstacles.add(
        obstacle.id
      );

      // 通知 scene.js
      onCollision(obstacle);

      continue;
    }


    // --------------------------------------------------------
    // 如果潜艇已经超过障碍物 40m
    //
    // 说明成功躲过去了
    //
    // 同样记录下来，
    // 避免以后重复进行碰撞检测
    // --------------------------------------------------------

    if (
      state.depth >
      obstacle.depth + 40
    ) {
      state.seenObstacles.add(
        obstacle.id
      );
    }
  }
}


// ============================================================
// 发生碰撞
// ============================================================

export function collideWithObstacle(
  obstacle,
  {
    root,
    collisionNote,
    setMessage,
    announce
  }
) {

  // ----------------------------------------------------------
  // 碰撞保护时间
  //
  // 防止短时间连续触发碰撞动画
  // ----------------------------------------------------------

  if (
    performance.now() <
    state.collisionUntil
  ) {
    return;
  }


  state.collisionUntil =
    performance.now() + 1100;


  // ----------------------------------------------------------
  // 碰撞后稍微退一点深度
  //
  // 相当于撞墙以后自动减速
  // ----------------------------------------------------------

  state.depth =
    Math.max(
      0,
      state.depth - 18
    );


  // ----------------------------------------------------------
  // 根据障碍物方向决定潜艇抖动方向
  // ----------------------------------------------------------

  root.style.setProperty(
    '--bump',
    state.x < obstacle.x
      ? '-10px'
      : '10px'
  );


  root.classList.add('bump');


  // ----------------------------------------------------------
  // UI 提示
  // ----------------------------------------------------------

  collisionNote.textContent =
    '轻轻碰到了岩壁 · 已自动减速';

  collisionNote.classList.add('show');


  setMessage(
    '姿态稳定 · 注意前方岩层'
  );


  announce(
    '潜水器碰到了岩壁，请调整左右方向。'
  );


  // ----------------------------------------------------------
  // 1.1 秒以后取消碰撞效果
  // ----------------------------------------------------------

  setTimeout(() => {

    root.classList.remove('bump');

    collisionNote.classList.remove('show');

  }, 1100);
}