import { state, resetState } from './state.js';

import {
  updateWorld,
  renderWorld
} from './world.js';

import {
  bindControls
} from './controls.js';

import {
  updateEnergy,
  setLight,
  energyMessage,
  renderEnergy
} from './energy.js';

import {
  initObstacles,
  renderObstacles,
  checkObstacles,
  collideWithObstacle
} from './obstacles.js';

import {
  resetCreatures,
  updateCreatures
} from './creatures.js';

import {
  resetScanner,
  updateScanner
} from './scanner.js';

import {
  resetDiscoveries
} from './discoveries.js';


// ============================================================
// 页面 UI
// ============================================================

const ui = {
  root: document.querySelector('.voyage'),

  preparation: document.querySelector('.preparation'),

  scene: document.querySelector('.scene-ui'),

  subLabel: document.querySelector('.sub-label'),

  connection: document.querySelector('.connection'),

  launchButton: document.querySelector('#launch'),

  returnButton: document.querySelector('#return'),

  pauseButton: document.querySelector('#pause'),

  depthEl: document.querySelector('#depth'),

  zoneDescription:
    document.querySelector('#zone-description'),

  descentBar:
    document.querySelector('#descent-bar'),

  energyEl:
    document.querySelector('#energy'),

  energyBar:
    document.querySelector('#energy-bar'),

  lightControl:
    document.querySelector('#light-control'),

  lightValue:
    document.querySelector('#light-value'),

  systemMessage:
    document.querySelector('#system-message'),

  collisionNote:
    document.querySelector('#collision-note'),

  announcement:
    document.querySelector('#announcement'),

  stops: [
    ...document.querySelectorAll('.stop')
  ],
};


// ============================================================
// 初始化障碍物
// ============================================================
//
// obstacles.js 会在 .ocean 内创建障碍物图层。
//
// 这里只初始化一次。
//
// ============================================================

initObstacles(ui.root);


// ============================================================
// 无障碍提示
// ============================================================

function announce(text) {
  ui.announcement.textContent = text;
}


// ============================================================
// 系统消息
// ============================================================

function setMessage(text) {
  ui.systemMessage.textContent = text;
}


// ============================================================
// 渲染整个游戏画面
// ============================================================
//
// 每一帧都会调用：
//
// 1. renderWorld()
//    潜艇位置、深度、海域
//
// 2. renderObstacles()
//    障碍物位置
//
// 3. renderEnergy()
//    灯光、电量
//
// ============================================================

function render() {

  ui.root.classList.toggle(
    'paused',
    state.paused
  );


  // 潜艇 / 深度 / 海域
  renderWorld(ui);


  // 障碍物
  renderObstacles();


  // 灯光 / 电量
  renderEnergy(ui);
}


// ============================================================
// 开始下潜
// ============================================================

function startDive() {

  // 重置公共游戏状态
  resetState(
    Number(ui.lightControl.value)
  );


  // 重置其他模块
  resetCreatures();

  resetScanner();

  resetDiscoveries();


  // ----------------------------------------------------------
  // UI 切换到游戏模式
  // ----------------------------------------------------------

  ui.root.dataset.mode = 'game';


  ui.connection.innerHTML =
    '<i></i>微光号 · 潜航中';


  ui.preparation.hidden = true;

  ui.subLabel.hidden = true;

  ui.scene.hidden = false;


  ui.pauseButton.textContent =
    '暂停下潜';


  ui.pauseButton.setAttribute(
    'aria-pressed',
    'false'
  );


  setMessage(
    '系统稳定，缓慢下潜中'
  );


  announce(
    '潜航开始。使用左右方向键或 A、D 键驾驶潜水器，躲避前方岩石。'
  );


  // 立即刷新一次画面
  render();


  // ----------------------------------------------------------
  // 开始游戏循环
  // ----------------------------------------------------------

  cancelAnimationFrame(
    state.frame
  );


  state.frame =
    requestAnimationFrame(
      gameLoop
    );
}


// ============================================================
// 返回主界面
// ============================================================

function returnHome() {

  state.mode = 'ready';

  state.paused = false;


  cancelAnimationFrame(
    state.frame
  );


  ui.root.dataset.mode =
    'ready';


  ui.root.classList.remove(
    'paused',
    'low-energy',
    'bump'
  );


  ui.connection.innerHTML =
    '<i></i>微光号 · 准备出发';


  ui.preparation.hidden = false;

  ui.subLabel.hidden = false;

  ui.scene.hidden = true;


  document.title =
    '微光深处 · 潜航准备';


  ui.launchButton.focus();


  // 刷新一次，
  // 隐藏已经离开视野的障碍物
  render();
}


// ============================================================
// 暂停 / 继续
// ============================================================

function togglePause() {

  state.paused =
    !state.paused;


  ui.pauseButton.textContent =
    state.paused
      ? '继续下潜'
      : '暂停下潜';


  ui.pauseButton.setAttribute(
    'aria-pressed',
    String(state.paused)
  );


  announce(
    state.paused
      ? '潜航已暂停。'
      : '继续缓慢下潜。'
  );
}


// ============================================================
// 灯光改变
// ============================================================

function handleLightChange(value) {

  setLight(
    value,
    ui.lightControl
  );


  render();
}


// ============================================================
// 碰撞处理
// ============================================================
//
// checkObstacles() 检测到撞击以后，
// 会调用这里。
//
// 然后交给 obstacles.js
// 处理动画和提示。
// ============================================================

function handleCollision(obstacle) {

  collideWithObstacle(
    obstacle,
    {
      root: ui.root,

      collisionNote:
        ui.collisionNote,

      setMessage,

      announce,
    }
  );
}


// ============================================================
// 游戏循环
// ============================================================

function gameLoop(now) {

  // 如果已经退出游戏
  // 不继续执行
  if (
    state.mode !== 'game'
  ) {
    return;
  }


  // ----------------------------------------------------------
  // 计算两帧之间的时间差
  //
  // dt 最大限制为 0.05 秒，
  // 防止页面卡顿以后移动距离突然特别大。
  // ----------------------------------------------------------

  const dt =
    Math.min(
      0.05,
      (now - state.last) / 1000 || 0
    );


  state.last = now;


  // ==========================================================
  // 没暂停的时候才更新游戏逻辑
  // ==========================================================

  if (!state.paused) {


    // --------------------------------------------------------
    // 1. 更新电量
    // --------------------------------------------------------

    updateEnergy(
      dt,
      ui.lightControl
    );


    // --------------------------------------------------------
    // 2. 更新世界
    //
    // 包括：
    //
    // - 自动向下
    // - 左右移动
    // - 深度增加
    // --------------------------------------------------------

    const {
      previousDepth,
      reachedBed
    } = updateWorld(dt);


    // --------------------------------------------------------
    // 3. 碰撞检测
    // --------------------------------------------------------

    checkObstacles(
      previousDepth,
      handleCollision
    );


    // --------------------------------------------------------
    // 4. 其他游戏模块
    // --------------------------------------------------------

    updateCreatures(dt);

    updateScanner(dt);


    // --------------------------------------------------------
    // 5. 系统提示
    // --------------------------------------------------------

    setMessage(
      energyMessage()
    );


    // --------------------------------------------------------
    // 6. 到达 6000m
    // --------------------------------------------------------

    if (reachedBed) {

      state.paused = true;


      setMessage(
        '已抵达海床 · 可以自由返航'
      );


      announce(
        '已抵达六千米海床。没有失败，可以继续停留或自由返航。'
      );
    }
  }


  // ==========================================================
  // 每一帧重新绘制
  // ==========================================================

  render();


  // ==========================================================
  // 请求下一帧
  // ==========================================================

  state.frame =
    requestAnimationFrame(
      gameLoop
    );
}


// ============================================================
// 开始按钮
// ============================================================

ui.launchButton.addEventListener(
  'click',
  startDive
);


// ============================================================
// 返回按钮
// ============================================================

ui.returnButton.addEventListener(
  'click',
  returnHome
);


// ============================================================
// 键盘 / 鼠标 / 手机控制
// ============================================================

bindControls({

  root:
    ui.root,

  pauseButton:
    ui.pauseButton,

  lightControl:
    ui.lightControl,

  onPause:
    togglePause,

  onLightChange:
    handleLightChange,

});


// ============================================================
// 页面第一次加载时渲染
// ============================================================

render();