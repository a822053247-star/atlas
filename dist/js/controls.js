import { state } from './state.js';

const keys = {
  left: false,
  right: false,
};

function updateDirection() {
  if (keys.left && !keys.right) {
    state.direction = -1;
  } else if (keys.right && !keys.left) {
    state.direction = 1;
  } else {
    state.direction = 0;
  }
}

export function bindControls({
  root,
  pauseButton,
  lightControl,
  onPause,
  onLightChange
}) {

  lightControl.addEventListener('input', () => {
    onLightChange(lightControl.value);
  });

  // ============================
  // 键盘
  // ============================

  addEventListener('keydown', event => {
    if (state.mode !== 'game') return;

    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      event.preventDefault();
      keys.left = true;
      updateDirection();
    }

    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      keys.right = true;
      updateDirection();
    }

    if (event.key === ' ') {
      event.preventDefault();
      onPause();
    }
  });

  addEventListener('keyup', event => {

    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
      keys.left = false;
      updateDirection();
    }

    if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
      keys.right = false;
      updateDirection();
    }

  });

  // ============================
  // 鼠标
  // ============================

  root.addEventListener('pointermove', event => {
    if (
      state.mode === 'game' &&
      event.pointerType === 'mouse' &&
      !event.target.closest('button,input,a')
    ) {
      state.x = Math.max(
        10,
        Math.min(90, event.clientX / innerWidth * 100)
      );
    }
  });

  // ============================
  // 手机左右按钮
  // ============================

  for (const [id, direction] of [
    ['move-left', -1],
    ['move-right', 1]
  ]) {

    const button = document.querySelector(`#${id}`);

    button.addEventListener('pointerdown', event => {
      event.preventDefault();

      button.setPointerCapture(event.pointerId);

      if (direction === -1) keys.left = true;
      if (direction === 1) keys.right = true;

      updateDirection();
    });

    function release() {
      if (direction === -1) keys.left = false;
      if (direction === 1) keys.right = false;

      updateDirection();
    }

    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
  }

  pauseButton.addEventListener('click', onPause);
}