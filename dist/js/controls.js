// dist/js/controls.js

import { state } from './state.js';

const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
};

function updateAxes() {
  // 左右
  if (keys.left && !keys.right) {
    state.moveX = -1;
  } else if (keys.right && !keys.left) {
    state.moveX = 1;
  } else {
    state.moveX = 0;
  }

  // 上下
  if (keys.up && !keys.down) {
    state.moveY = -1;
  } else if (keys.down && !keys.up) {
    state.moveY = 1;
  } else {
    state.moveY = 0;
  }
}

function clearControls() {
  keys.left = false;
  keys.right = false;
  keys.up = false;
  keys.down = false;

  updateAxes();
}

function handleKey(code, pressed) {
  switch (code) {
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = pressed;
      break;

    case 'ArrowRight':
    case 'KeyD':
      keys.right = pressed;
      break;

    case 'ArrowUp':
    case 'KeyW':
      keys.up = pressed;
      break;

    case 'ArrowDown':
    case 'KeyS':
      keys.down = pressed;
      break;

    default:
      return false;
  }

  updateAxes();

  return true;
}

export function bindControls({
  pauseButton,
  lightControl,
  onPause,
  onLightChange
}) {
  // ============================================================
  // 灯光
  // ============================================================

  lightControl.addEventListener('input', () => {
    onLightChange(lightControl.value);
  });

  // ============================================================
  // 键盘
  //
  // 使用 event.code，而不是 event.key。
  // 这样即使开启中文输入法，W / A / S / D 也可以正常工作。
  // ============================================================

  window.addEventListener(
    'keydown',
    event => {
      if (state.mode !== 'game') {
        return;
      }

      if (handleKey(event.code, true)) {
        event.preventDefault();
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        onPause();
      }
    },
    { passive: false }
  );

  window.addEventListener(
    'keyup',
    event => {
      if (handleKey(event.code, false)) {
        event.preventDefault();
      }
    },
    { passive: false }
  );

  // ============================================================
  // 防止切换窗口以后按键卡住
  // ============================================================

  window.addEventListener('blur', clearControls);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearControls();
    }
  });

  // ============================================================
  // 手机 / 平板四方向控制
  // ============================================================

  const buttons = [
    ['move-left', 'left'],
    ['move-right', 'right'],
    ['move-up', 'up'],
    ['move-down', 'down'],
  ];

  for (const [id, direction] of buttons) {
    const button = document.querySelector(`#${id}`);

    if (!button) {
      continue;
    }

    const press = event => {
      if (state.mode !== 'game') {
        return;
      }

      event.preventDefault();

      keys[direction] = true;

      updateAxes();

      if (
        typeof button.setPointerCapture === 'function' &&
        event.pointerId !== undefined
      ) {
        try {
          button.setPointerCapture(event.pointerId);
        } catch {
          // 某些移动浏览器不支持时直接忽略
        }
      }
    };

    const release = event => {
      if (event) {
        event.preventDefault();
      }

      keys[direction] = false;

      updateAxes();
    };

    button.addEventListener(
      'pointerdown',
      press,
      { passive: false }
    );

    button.addEventListener(
      'pointerup',
      release,
      { passive: false }
    );

    button.addEventListener(
      'pointercancel',
      release,
      { passive: false }
    );

    button.addEventListener(
      'lostpointercapture',
      release
    );
  }

  // ============================================================
  // 暂停
  // ============================================================

  pauseButton.addEventListener('click', () => {
    clearControls();
    onPause();
  });
}