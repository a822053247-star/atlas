import { state } from './state.js';
import { getActiveCreatures } from './creatures.js';

/*
 * B: 长按扫描系统
 *
 * 功能：
 * - 自动寻找附近生物
 * - 显示扫描范围
 * - 鼠标长按
 * - 手机触控长按
 * - E 键长按
 * - 扫描进度
 * - 离开范围自动取消
 * - 扫描完成后发送事件给发现/存档系统
 */

const scanner = {
  target: null,
  distance: Infinity,

  holding: false,
  progress: 0,

  successUntil: 0,
};

let ui = null;
let inputBound = false;


/* =========================================================
   UI
   ========================================================= */

function createScannerUI() {
  if (ui) return ui;

  const root = document.querySelector('.voyage');

  if (!root) {
    console.warn('[scanner] .voyage not found');
    return null;
  }

  const container = document.createElement('div');

  container.className = 'scanner-hud';

  container.innerHTML = `
    <div class="scan-reticle" hidden>
      <span class="scan-reticle-dot"></span>
    </div>

    <div class="scanner-panel" hidden>
      <div class="scanner-copy">
        <small>OBSERVATION SCAN</small>
        <strong class="scanner-name">未知目标</strong>
        <span class="scanner-hint">
          靠近目标以开始扫描
        </span>
      </div>

      <button
        class="scan-hold-button"
        type="button"
        aria-label="长按扫描"
        disabled
      >
        <span class="scan-progress-ring">
          <b class="scan-progress-value">0%</b>
        </span>

        <em>长按扫描</em>
        <small>HOLD · E</small>
      </button>
    </div>
  `;

  root.appendChild(container);

  ui = {
    container,

    reticle:
      container.querySelector('.scan-reticle'),

    panel:
      container.querySelector('.scanner-panel'),

    name:
      container.querySelector('.scanner-name'),

    hint:
      container.querySelector('.scanner-hint'),

    button:
      container.querySelector('.scan-hold-button'),

    ring:
      container.querySelector('.scan-progress-ring'),

    value:
      container.querySelector('.scan-progress-value'),
  };

  bindScannerInput();

  return ui;
}


/* =========================================================
   输入
   ========================================================= */

function bindScannerInput() {
  if (!ui || inputBound) return;

  inputBound = true;

  /*
   * 鼠标 + 手机触控
   */

  ui.button.addEventListener(
    'pointerdown',
    event => {
      event.preventDefault();

      if (ui.button.disabled) return;

      try {
        ui.button.setPointerCapture(
          event.pointerId
        );
      } catch {
        // 某些旧浏览器可能不支持，
        // 不影响基本扫描。
      }

      beginHold();
    }
  );

  ui.button.addEventListener(
    'pointerup',
    event => {
      event.preventDefault();
      endHold();
    }
  );

  ui.button.addEventListener(
    'pointercancel',
    endHold
  );

  ui.button.addEventListener(
    'lostpointercapture',
    endHold
  );

  /*
   * 防止手机长按弹出浏览器菜单。
   */
  ui.button.addEventListener(
    'contextmenu',
    event => event.preventDefault()
  );


  /*
   * 键盘：
   *
   * Space 已经被 A 用于暂停，
   * 所以扫描统一使用 E。
   */

  window.addEventListener(
    'keydown',
    event => {
      if (
        event.key !== 'e' &&
        event.key !== 'E'
      ) {
        return;
      }

      if (
        event.target.closest(
          'input, textarea, select'
        )
      ) {
        return;
      }

      if (event.repeat) return;

      if (state.mode !== 'game') return;

      event.preventDefault();

      beginHold();
    }
  );

  window.addEventListener(
    'keyup',
    event => {
      if (
        event.key !== 'e' &&
        event.key !== 'E'
      ) {
        return;
      }

      event.preventDefault();

      endHold();
    }
  );
}


/* =========================================================
   距离检测
   ========================================================= */

/*
 * 使用真实 DOM 坐标计算距离。
 *
 * 这样比简单比较 x 百分比更加可靠，
 * 手机和桌面都能使用。
 */
function distanceToCreature(creature) {
  const submarine =
    document.querySelector('.submarine');

  const target = creature.element;

  if (!submarine || !target) {
    return Infinity;
  }

  const subRect =
    submarine.getBoundingClientRect();

  const targetRect =
    target.getBoundingClientRect();

  const subX =
    subRect.left + subRect.width / 2;

  const subY =
    subRect.top + subRect.height / 2;

  const targetX =
    targetRect.left +
    targetRect.width / 2;

  const targetY =
    targetRect.top +
    targetRect.height / 2;

  return Math.hypot(
    targetX - subX,
    targetY - subY
  );
}


/*
 * 找当前距离最近的生物。
 */
function findNearestCreature() {
  const creatures =
    getActiveCreatures();

  let nearest = null;
  let nearestDistance = Infinity;

  for (const creature of creatures) {
    if (!creature.element) continue;

    const distance =
      distanceToCreature(creature);

    if (distance < nearestDistance) {
      nearest = creature;
      nearestDistance = distance;
    }
  }

  return {
    creature: nearest,
    distance: nearestDistance,
  };
}


/* =========================================================
   扫描状态
   ========================================================= */

function isInScanRange(creature, distance) {
  if (!creature) return false;

  return distance <= creature.scanRange;
}


function beginHold() {
  const target = scanner.target;

  if (!target) return;

  if (state.mode !== 'game') return;

  if (state.paused) return;

  /*
   * 能量已经为 0 时，
   * 仍然可以继续下潜，
   * 但扫描设备无法工作。
   */
  if (state.energy <= 0) {
    showTemporaryMessage(
      '能量不足 · 扫描设备不可用'
    );

    return;
  }

  if (
    !isInScanRange(
      target,
      scanner.distance
    )
  ) {
    return;
  }

  /*
   * 同一次下潜同一种实例只扫描一次，
   * 防止站在原地无限刷观测次数。
   *
   * 下一次重新下潜时 creatures.js
   * 会把这个状态重置。
   */
  if (target.scannedThisDive) {
    showTemporaryMessage(
      '本轮已完成观测'
    );

    return;
  }

  scanner.holding = true;

  ui.button.classList.add(
    'is-scanning'
  );

  ui.reticle.classList.add(
    'is-scanning'
  );
}


function endHold() {
  if (!scanner.holding) return;

  scanner.holding = false;

  /*
   * 没完成时松手，
   * 进度会逐渐下降而不是瞬间归零。
   */

  ui?.button.classList.remove(
    'is-scanning'
  );

  ui?.reticle.classList.remove(
    'is-scanning'
  );
}


/* =========================================================
   扫描完成
   ========================================================= */

function completeScan() {
  const creature = scanner.target;

  if (!creature) return;

  scanner.holding = false;
  scanner.progress = 1;

  creature.scannedThisDive = true;

  scanner.successUntil =
    performance.now() + 1300;

  ui.button.classList.remove(
    'is-scanning'
  );

  ui.reticle.classList.remove(
    'is-scanning'
  );

  ui.reticle.classList.add(
    'scan-success'
  );

  ui.name.textContent =
    creature.name;

  ui.hint.textContent =
    `观测完成 · ${creature.name}`;

  /*
   * ① 告诉 discoveries.js：
   *    有一个生物扫描成功。
   *
   * 下一阶段 discoveries.js
   * 会监听这个事件。
   */
  window.dispatchEvent(
    new CustomEvent(
      'abyss:creature-scanned',
      {
        detail: {
          id: creature.id,
          name: creature.name,
          latin: creature.latin,

          scanCost:
            creature.scanCost,

          creature,
        },
      }
    )
  );

  /*
   * ② 告诉 A 的能量模块：
   *    这一次扫描需要扣多少能量。
   *
   * B 不直接修改 energy.js。
   */
  window.dispatchEvent(
    new CustomEvent(
      'abyss:consume-energy',
      {
        detail: {
          amount:
            creature.scanCost,
        },
      }
    )
  );
}


/* =========================================================
   UI 渲染
   ========================================================= */

function renderProgress() {
  if (!ui) return;

  const progress =
    Math.max(
      0,
      Math.min(1, scanner.progress)
    );

  const percent =
    Math.round(progress * 100);

  ui.value.textContent =
    `${percent}%`;

  ui.ring.style.setProperty(
    '--scan-angle',
    `${progress * 360}deg`
  );
}


function positionReticle(creature) {
  if (!ui || !creature?.element) return;

  const root =
    document.querySelector('.voyage');

  if (!root) return;

  const rootRect =
    root.getBoundingClientRect();

  const rect =
    creature.element
      .getBoundingClientRect();

  const x =
    rect.left -
    rootRect.left +
    rect.width / 2;

  const y =
    rect.top -
    rootRect.top +
    rect.height / 2;

  ui.reticle.style.left =
    `${x}px`;

  ui.reticle.style.top =
    `${y}px`;

  /*
   * 圈显示的是扫描有效范围。
   */
  const size =
    Math.min(
      creature.scanRange * 2,
      360
    );

  ui.reticle.style.width =
    `${size}px`;

  ui.reticle.style.height =
    `${size}px`;
}


function hideScannerUI() {
  if (!ui) return;

  ui.reticle.hidden = true;
  ui.panel.hidden = true;
}


function renderTarget() {
  if (!ui) return;

  const creature = scanner.target;

  if (!creature) {
    hideScannerUI();
    return;
  }

  /*
   * 目标距离过远时不显示 UI，
   * 避免整个屏幕一直挂着扫描提示。
   */
  const detectionRange =
    creature.scanRange * 1.65;

  if (
    scanner.distance >
    detectionRange
  ) {
    hideScannerUI();
    return;
  }

  ui.reticle.hidden = false;
  ui.panel.hidden = false;

  positionReticle(creature);

  ui.name.textContent =
    creature.name;

  const inRange =
    isInScanRange(
      creature,
      scanner.distance
    );

  ui.reticle.classList.toggle(
    'in-range',
    inRange
  );

  ui.button.disabled =
    !inRange ||
    creature.scannedThisDive ||
    state.energy <= 0;

  if (
    performance.now() <
    scanner.successUntil
  ) {
    return;
  }

  ui.reticle.classList.remove(
    'scan-success'
  );

  if (creature.scannedThisDive) {
    ui.hint.textContent =
      '本轮已完成观测';

    return;
  }

  if (state.energy <= 0) {
    ui.hint.textContent =
      '能量不足 · 无法扫描';

    return;
  }

  if (!inRange) {
    ui.hint.textContent =
      '信号较弱 · 再靠近一些';

    return;
  }

  if (scanner.holding) {
    ui.hint.textContent =
      '保持扫描 · 不要离开范围';

    return;
  }

  ui.hint.textContent =
    '目标已锁定 · 长按开始扫描';
}


function showTemporaryMessage(text) {
  if (!ui) return;

  ui.hint.textContent = text;
}


/* =========================================================
   生命周期
   ========================================================= */

export function resetScanner() {
  createScannerUI();

  scanner.target = null;
  scanner.distance = Infinity;

  scanner.holding = false;
  scanner.progress = 0;

  scanner.successUntil = 0;

  if (ui) {
    ui.button.classList.remove(
      'is-scanning'
    );

    ui.reticle.classList.remove(
      'is-scanning',
      'scan-success',
      'in-range'
    );

    renderProgress();

    hideScannerUI();
  }
}


/*
 * scene.js 每一帧都会调用。
 */
export function updateScanner(dt) {
  createScannerUI();

  if (!ui) return;

  const nearest =
    findNearestCreature();

  const previousTarget =
    scanner.target;

  scanner.target =
    nearest.creature;

  scanner.distance =
    nearest.distance;


  /*
   * 换了目标时重置当前扫描。
   */
  if (
    previousTarget &&
    scanner.target !== previousTarget
  ) {
    scanner.holding = false;
    scanner.progress = 0;
  }


  /*
   * 当前没有任何生物。
   */
  if (!scanner.target) {
    scanner.holding = false;

    scanner.progress =
      Math.max(
        0,
        scanner.progress -
        dt * 2.2
      );

    hideScannerUI();
    renderProgress();

    return;
  }


  const inRange =
    isInScanRange(
      scanner.target,
      scanner.distance
    );


  /*
   * 扫描过程中离开范围，
   * 自动停止。
   */
  if (
    scanner.holding &&
    !inRange
  ) {
    endHold();
  }


  /*
   * 扫描过程。
   */
  if (
    scanner.holding &&
    inRange &&
    !scanner.target.scannedThisDive
  ) {
    const duration =
      Math.max(
        0.5,
        scanner.target.scanTime
      );

    scanner.progress +=
      dt / duration;

    if (scanner.progress >= 1) {
      scanner.progress = 1;

      completeScan();
    }
  }

  /*
   * 没有按住时，
   * 扫描进度缓慢衰减。
   */
  else if (
    !scanner.target.scannedThisDive &&
    !scanner.holding
  ) {
    scanner.progress =
      Math.max(
        0,
        scanner.progress -
        dt * 0.75
      );
  }


  renderTarget();
  renderProgress();
}


/*
 * 给其它 B 模块读取，
 * 例如以后做提示或教程。
 */
export function getScanState() {
  return {
    target:
      scanner.target,

    distance:
      scanner.distance,

    holding:
      scanner.holding,

    progress:
      scanner.progress,
  };
}