import { state } from './state.js';

function setDirection(value) {
  state.direction = value;
}

export function bindControls({ root, pauseButton, lightControl, onPause, onLightChange }) {
  lightControl.addEventListener('input', () => onLightChange(lightControl.value));

  addEventListener('keydown', event => {
    if (state.mode !== 'game') return;
    if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
      event.preventDefault();
      setDirection(-1);
    }
    if (['ArrowRight', 'd', 'D'].includes(event.key)) {
      event.preventDefault();
      setDirection(1);
    }
    if (event.key === ' ') {
      event.preventDefault();
      onPause();
    }
  });

  addEventListener('keyup', event => {
    if (['ArrowLeft', 'ArrowRight', 'a', 'A', 'd', 'D'].includes(event.key)) {
      setDirection(0);
    }
  });

  root.addEventListener('pointermove', event => {
    if (state.mode === 'game' && event.pointerType === 'mouse' && !event.target.closest('button,input,a')) {
      state.x = Math.max(12, Math.min(82, event.clientX / innerWidth * 100));
    }
  });

  for (const [id, direction] of [['move-left', -1], ['move-right', 1]]) {
    const button = document.querySelector(`#${id}`);
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      setDirection(direction);
    });
    button.addEventListener('pointerup', () => setDirection(0));
    button.addEventListener('pointercancel', () => setDirection(0));
  }

  pauseButton.addEventListener('click', onPause);
}
