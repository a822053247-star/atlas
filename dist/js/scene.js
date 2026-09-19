import { state, resetState } from './state.js';
import { updateWorld, renderWorld } from './world.js';
import { bindControls } from './controls.js';
import {
  updateEnergy,
  setLight,
  energyMessage,
  renderEnergy
} from './energy.js';
import {
  initObstacles,
  resetObstacles,
  updateObstacles,
  renderObstacles,
  checkObstacles,
  collideWithObstacle
} from './obstacles.js';
import { resetCreatures, updateCreatures } from './creatures.js';
import { resetScanner, updateScanner } from './scanner.js';
import { resetDiscoveries } from './discoveries.js';

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
  zoneDescription: document.querySelector('#zone-description'),
  descentBar: document.querySelector('#descent-bar'),
  energyEl: document.querySelector('#energy'),
  energyBar: document.querySelector('#energy-bar'),
  durabilityEl: document.querySelector('#durability'),
  durabilityBar: document.querySelector('#durability-bar'),
  lightControl: document.querySelector('#light-control'),
  lightValue: document.querySelector('#light-value'),
  systemMessage: document.querySelector('#system-message'),
  collisionNote: document.querySelector('#collision-note'),
  announcement: document.querySelector('#announcement'),
  stops: [...document.querySelectorAll('.stop')],
};

initObstacles(ui.root);

function announce(text) {
  ui.announcement.textContent = text;
}

function setMessage(text) {
  ui.systemMessage.textContent = text;
}

function normalSystemMessage() {
  if (state.durability <= 0) {
    return '耐久归零 · 应急结构维持，可继续探索';
  }

  if (state.durability <= 30) {
    return `耐久偏低 ${Math.ceil(state.durability)}% · 谨慎驾驶`;
  }

  const energyText = energyMessage();

  return energyText === '系统稳定，缓慢下潜中'
    ? '系统稳定 · 四向驾驶正常'
    : energyText;
}

function render() {
  ui.root.classList.toggle('paused', state.paused);
  renderWorld(ui);
  renderObstacles();
  renderEnergy(ui);
}

function startDive() {
  resetState(Number(ui.lightControl.value));
  resetObstacles();
  resetCreatures();
  resetScanner();
  resetDiscoveries();

  ui.root.dataset.mode = 'game';
  ui.connection.innerHTML = '<i></i>微光号 · 横向潜航中';
  ui.preparation.hidden = true;
  ui.subLabel.hidden = true;
  ui.scene.hidden = false;

  ui.pauseButton.textContent = '暂停潜航';
  ui.pauseButton.setAttribute('aria-pressed', 'false');

  setMessage('横向航行启动 · 使用上下左右躲避障碍物');
  announce('潜航开始。使用方向键或 W、A、S、D 键上下左右驾驶潜水器。');

  render();

  cancelAnimationFrame(state.frame);
  state.frame = requestAnimationFrame(gameLoop);
}

function returnHome() {
  state.mode = 'ready';
  state.paused = false;
  state.moveX = 0;
  state.moveY = 0;
  state.vx = 0;
  state.vy = 0;

  cancelAnimationFrame(state.frame);

  ui.root.dataset.mode = 'ready';
  ui.root.classList.remove(
    'paused',
    'low-energy',
    'bump',
    'damaged',
    'critical-damage'
  );
  ui.connection.innerHTML = '<i></i>微光号 · 准备出发';
  ui.preparation.hidden = false;
  ui.subLabel.hidden = false;
  ui.scene.hidden = true;

  document.title = '微光深处 · 潜航准备';
  ui.launchButton.focus();

  render();
}

function togglePause() {
  state.paused = !state.paused;

  if (state.paused) {
    state.moveX = 0;
    state.moveY = 0;
    state.vx = 0;
    state.vy = 0;
  }

  ui.pauseButton.textContent =
    state.paused ? '继续潜航' : '暂停潜航';

  ui.pauseButton.setAttribute(
    'aria-pressed',
    String(state.paused)
  );

  announce(
    state.paused
      ? '潜航已暂停。'
      : '继续潜航。使用上下左右方向躲避障碍物。'
  );
}

function handleLightChange(value) {
  setLight(value, ui.lightControl);
  render();
}

function handleCollision(obstacle) {
  collideWithObstacle(obstacle, {
    root: ui.root,
    collisionNote: ui.collisionNote,
    setMessage,
    announce,
  });
}

function gameLoop(now) {
  if (state.mode !== 'game') return;

  const dt = Math.min(
    0.05,
    (now - state.last) / 1000 || 0
  );

  state.last = now;

  if (!state.paused) {
    updateEnergy(dt, ui.lightControl);

    const { reachedBed } = updateWorld(dt);

    updateObstacles(dt);
    checkObstacles(handleCollision);

    updateCreatures(dt);
    updateScanner(dt);

    if (performance.now() >= state.collisionUntil) {
      setMessage(normalSystemMessage());
    }

    if (reachedBed) {
      state.paused = true;
      state.moveX = 0;
      state.moveY = 0;
      state.vx = 0;
      state.vy = 0;

      setMessage('已抵达 6,000 m 航程终点 · 可以自由返航');
      announce('已完成六千米深海航程。可以停留观察或自由返航。');
    }
  }

  render();
  state.frame = requestAnimationFrame(gameLoop);
}

ui.launchButton.addEventListener('click', startDive);
ui.returnButton.addEventListener('click', returnHome);

bindControls({
  pauseButton: ui.pauseButton,
  lightControl: ui.lightControl,
  onPause: togglePause,
  onLightChange: handleLightChange,
});

render();
