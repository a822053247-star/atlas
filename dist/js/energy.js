import { state } from './state.js';

export function updateEnergy(dt, lightControl) {
  state.energy = Math.max(0, state.energy - (.08 + state.light * .0028) * dt);
  if (state.energy <= 0) {
    state.light = 20;
    lightControl.value = '20';
  }
}

export function setLight(value, lightControl) {
  if (state.energy <= 0) {
    lightControl.value = '20';
    return;
  }
  state.light = Number(value);
}

export function energyMessage() {
  if (state.energy <= 0) return '启用应急照明 · 能量不足，下潜速度放缓';
  if (state.energy < 20) return '能量偏低 · 调暗灯光可以延长航程';
  return '系统稳定，缓慢下潜中';
}

export function renderEnergy({ root, energyEl, energyBar, lightValue }) {
  root.style.setProperty('--light-level', state.light);
  root.style.setProperty('--light-opacity', Math.max(.18, state.light / 100));
  root.classList.toggle('low-energy', state.energy <= 0);
  energyEl.value = `${Math.ceil(state.energy)}%`;
  energyEl.textContent = energyEl.value;
  energyBar.style.width = `${state.energy}%`;
  energyBar.style.background = state.energy < 20 ? '#e9c37f' : 'var(--mint)';
  lightValue.value = `${state.light}%`;
  lightValue.textContent = lightValue.value;
}
