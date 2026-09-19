import { state } from './state.js';

const keys = {
  left: false,
  right: false,
  up: false,
  down: false,
};

function updateAxes() {
  if (keys.left && !keys.right) {
    state.moveX = -1;
  } else if (keys.right && !keys.left) {
    state.moveX = 1;
  } else {
    state.moveX = 0;
  }

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
  lightControl.addEventListener('input', () => {
    onLightChange(lightControl.value);
  });

  window.addEventListener(
    'keydown',
    event => {
      if (state.mode !== 'game') return;

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

  window.addEventListener('blur', clearControls);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearControls();
  });

  const buttons = [
    ['move-left', 'left'],
    ['move-right', 'right'],
    ['move-up', 'up'],
    ['move-down', 'down'],
  ];

  for (const [id, direction] of buttons) {
    const button = document.querySelector(`#${id}`);
    if (!button) continue;

    const press = event => {
      if (state.mode !== 'game') return;

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
          // 部分移动浏览器不支持时忽略。
        }
      }
    };

    const release = event => {
      if (event) event.preventDefault();
      keys[direction] = false;
      updateAxes();
    };

    button.addEventListener('pointerdown', press, { passive: false });
    button.addEventListener('pointerup', release, { passive: false });
    button.addEventListener('pointercancel', release, { passive: false });
    button.addEventListener('lostpointercapture', release);
  }

  pauseButton.addEventListener('click', () => {
    clearControls();
    onPause();
  });
}
