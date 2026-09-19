import { state, resetState } from './state.js';
import { updateWorld, renderWorld } from './world.js';
import { bindControls } from './controls.js';
import { updateEnergy, setLight, energyMessage, renderEnergy } from './energy.js';
import { checkObstacles, collideWithObstacle } from './obstacles.js';
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
  lightControl: document.querySelector('#light-control'),
  lightValue: document.querySelector('#light-value'),
  systemMessage: document.querySelector('#system-message'),
  collisionNote: document.querySelector('#collision-note'),
  announcement: document.querySelector('#announcement'),
  stops: [...document.querySelectorAll('.stop')],
};

function announce(text) {
  ui.announcement.textContent = text;
}

function setMessage(text) {
  ui.systemMessage.textContent = text;
}

function render() {
  ui.root.classList.toggle('paused', state.paused);
  renderWorld(ui);
  renderEnergy(ui);
}

function startDive() {
  resetState(Number(ui.lightControl.value));
  resetCreatures();
  resetScanner();
  resetDiscoveries();

  ui.root.dataset.mode = 'game';
  ui.connection.innerHTML = '<i></i>微光号 · 潜航中';
  ui.preparation.hidden = true;
  ui.subLabel.hidden = true;
  ui.scene.hidden = false;
  ui.pauseButton.textContent = '暂停下潜';
  ui.pauseButton.setAttribute('aria-pressed', 'false');
  setMessage('系统稳定，缓慢下潜中');
  announce('潜航开始。使用左右方向键或 A、D 键驾驶潜水器。');
  render();

  cancelAnimationFrame(state.frame);
  state.frame = requestAnimationFrame(gameLoop);
}

function returnHome() {
  state.mode = 'ready';
  state.paused = false;
  cancelAnimationFrame(state.frame);
  ui.root.dataset.mode = 'ready';
  ui.root.classList.remove('paused', 'low-energy', 'bump');
  ui.connection.innerHTML = '<i></i>微光号 · 准备出发';
  ui.preparation.hidden = false;
  ui.subLabel.hidden = false;
  ui.scene.hidden = true;
  document.title = '微光深处 · 潜航准备';
  ui.launchButton.focus();
}

function togglePause() {
  state.paused = !state.paused;
  ui.pauseButton.textContent = state.paused ? '继续下潜' : '暂停下潜';
  ui.pauseButton.setAttribute('aria-pressed', String(state.paused));
  announce(state.paused ? '潜航已暂停。' : '继续缓慢下潜。');
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
  const dt = Math.min(.05, (now - state.last) / 1000 || 0);
  state.last = now;

  if (!state.paused) {
    updateEnergy(dt, ui.lightControl);
    const { previousDepth, reachedBed } = updateWorld(dt);
    checkObstacles(previousDepth, handleCollision);
    updateCreatures(dt);
    updateScanner(dt);
    setMessage(energyMessage());

    if (reachedBed) {
      state.paused = true;
      setMessage('已抵达海床 · 可以自由返航');
      announce('已抵达六千米海床。没有失败，可以继续停留或自由返航。');
    }
  }

  render();
  state.frame = requestAnimationFrame(gameLoop);
}

ui.launchButton.addEventListener('click', startDive);
ui.returnButton.addEventListener('click', returnHome);
bindControls({
  root: ui.root,
  pauseButton: ui.pauseButton,
  lightControl: ui.lightControl,
  onPause: togglePause,
  onLightChange: handleLightChange,
});

render();
