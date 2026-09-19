import { state } from './state.js';

/**
 * 六种生物的统一配置。
 *
 * scanner.js 后面也会直接读取这里的数据，
 * 所以扫描距离、扫描时间、扫描耗能也先统一定义在这里。
 */
export const CREATURE_DEFS = [
  {
    id: 'lanternfish',
    name: '灯笼鱼',
    latin: 'Myctophidae',
    zone: 'twilight',
    minDepth: 300,
    maxDepth: 780,
    behavior: 'school',
    lightReaction: 'avoid',
    scanRange: 180,
    scanTime: 1.8,
    scanCost: 5,
    size: 150,
    baseX: 70,
    baseY: 32,
    description: '腹部排列着发光器，在黑暗中像一串缓慢移动的微光。',
    note: '受到较强灯光照射时，鱼群会稍微远离光源。',
  },

  {
    id: 'jellyfish',
    name: '水母',
    latin: 'Siphonophorae',
    zone: 'twilight',
    minDepth: 560,
    maxDepth: 980,
    behavior: 'float',
    lightReaction: 'glow',
    scanRange: 190,
    scanTime: 2,
    scanCost: 5,
    size: 145,
    baseX: 72,
    baseY: 38,
    image: 'assets/jelly.webp',
    description: '在水流中缓慢漂浮，身体会在微弱光线下逐渐显出透明轮廓。',
    note: '受到照明后不会立即逃离，是较容易观察的目标。',
  },

  {
    id: 'isopod',
    name: '大王具足虫',
    latin: 'Bathynomus giganteus',
    zone: 'midnight',
    minDepth: 1250,
    maxDepth: 2050,
    behavior: 'crawl',
    lightReaction: 'calm',
    scanRange: 165,
    scanTime: 2.2,
    scanCost: 6,
    size: 135,
    baseX: 68,
    baseY: 70,
    image: 'assets/isopod.webp',
    description: '贴近岩壁和海床缓慢移动，对突然出现的灯光反应较弱。',
    note: '移动速度很慢，可以保持距离进行持续观察。',
  },

  {
    id: 'dragonfish',
    name: '龙鱼',
    latin: 'Stomiidae',
    zone: 'midnight',
    minDepth: 2100,
    maxDepth: 2920,
    behavior: 'patrol',
    lightReaction: 'flee',
    scanRange: 175,
    scanTime: 2,
    scanCost: 7,
    size: 170,
    baseX: 72,
    baseY: 35,
    image: 'assets/dragon.webp',
    description: '在黑暗中巡游，身体上的发光器往往比完整轮廓更早被看到。',
    note: '强光会让它明显加速离开，需要控制灯光和距离。',
  },

  {
    id: 'squid',
    name: '深海鱿鱼',
    latin: 'Teuthida',
    zone: 'abyss',
    minDepth: 3400,
    maxDepth: 4550,
    behavior: 'glide',
    lightReaction: 'dart',
    scanRange: 185,
    scanTime: 2.2,
    scanCost: 7,
    size: 160,
    baseX: 67,
    baseY: 34,
    image: 'assets/squid.webp',
    description: '以流畅的曲线在深水中移动，受到刺激后会突然加速。',
    note: '强光会触发快速闪避，弱光更适合保持观察距离。',
  },

  {
    id: 'octopus',
    name: '深海章鱼',
    latin: 'Octopoda',
    zone: 'abyss',
    minDepth: 4700,
    maxDepth: 5850,
    behavior: 'creep',
    lightReaction: 'hide',
    scanRange: 170,
    scanTime: 2.4,
    scanCost: 8,
    size: 155,
    baseX: 73,
    baseY: 67,
    image: 'assets/octopus.webp',
    description: '经常停留在岩石附近，在几乎没有光的环境中缓慢移动。',
    note: '面对较强灯光时会逐渐向岩壁方向躲避。',
  },
];

/**
 * 当前这一轮实际生成出来的生物。
 *
 * 后面的 scanner.js 会通过 getActiveCreatures()
 * 获取这些对象。
 */
const creatures = [];

let creatureLayer = null;

/**
 * 确保生物层存在。
 *
 * 不修改 index.html，
 * 直接由 JS 动态创建。
 */
function ensureCreatureLayer() {
  if (creatureLayer) return creatureLayer;

  const ocean = document.querySelector('.ocean');

  if (!ocean) {
    console.warn('[creatures] .ocean not found');
    return null;
  }

  creatureLayer = document.createElement('div');
  creatureLayer.className = 'creature-layer';
  creatureLayer.setAttribute('aria-hidden', 'true');

  ocean.appendChild(creatureLayer);

  return creatureLayer;
}

/**
 * 创建灯笼鱼群。
 *
 * 当前项目没有 lanternfish.webp，
 * 所以先用 CSS 做一小群发光鱼。
 */
function createLanternSchool() {
  const school = document.createElement('div');
  school.className = 'lantern-school';

  for (let i = 0; i < 7; i++) {
    const fish = document.createElement('i');
    fish.style.setProperty('--fish-index', i);
    school.appendChild(fish);
  }

  return school;
}

/**
 * 创建一个生物 DOM。
 */
function createCreatureElement(def) {
  const element = document.createElement('div');

  element.className = 'wild-creature';
  element.dataset.creatureId = def.id;
  element.dataset.lightReaction = def.lightReaction;

  element.style.setProperty(
    '--creature-size',
    `${def.size}px`
  );

  const glow = document.createElement('span');
  glow.className = 'bio-glow';

  element.appendChild(glow);

  if (def.id === 'lanternfish') {
    element.appendChild(createLanternSchool());
  } else {
    const image = document.createElement('img');

    image.src = def.image;
    image.alt = '';
    image.draggable = false;

    element.appendChild(image);
  }

  return element;
}

/**
 * 生成单个生物运行时数据。
 */
function createCreature(def) {
  const element = createCreatureElement(def);

  // 每一次下潜的位置稍微变化，
  // 避免每一轮完全一样。
  const randomX = (Math.random() - 0.5) * 10;
  const randomY = (Math.random() - 0.5) * 8;

  return {
    ...def,

    element,

    x: def.baseX + randomX,
    y: def.baseY + randomY,

    originX: def.baseX + randomX,
    originY: def.baseY + randomY,

    time: Math.random() * 10,

    active: false,
    illuminated: false,

    // 后面的扫描系统会用到。
    scannedThisDive: false,
  };
}

/**
 * 初始化 DOM 和运行时实例。
 */
function buildCreatures() {
  const layer = ensureCreatureLayer();

  if (!layer) return;

  layer.innerHTML = '';
  creatures.length = 0;

  for (const def of CREATURE_DEFS) {
    const creature = createCreature(def);

    creatures.push(creature);
    layer.appendChild(creature.element);
  }
}

/**
 * 当前深度是否进入这种生物的活动区。
 */
function isDepthActive(creature) {
  return (
    state.depth >= creature.minDepth &&
    state.depth <= creature.maxDepth
  );
}

/**
 * 判断潜水器灯光有没有照到生物。
 *
 * 当前潜艇灯束主要朝右，
 * 因此不仅判断距离，也要求目标大致在潜艇右侧。
 */
function getIllumination(creature) {
  const horizontalDistance = creature.x - state.x;

  if (horizontalDistance < -5) {
    return 0;
  }

  const lightRange = 14 + state.light * 0.38;

  if (horizontalDistance > lightRange) {
    return 0;
  }

  const distanceFactor =
    1 - Math.max(0, horizontalDistance) / lightRange;

  return Math.max(
    0,
    Math.min(1, distanceFactor * state.light / 70)
  );
}

/**
 * 灯光反应。
 */
function applyLightReaction(creature, dt, illumination) {
  if (illumination < 0.35) return;

  switch (creature.lightReaction) {
    case 'avoid':
      // 灯笼鱼轻微远离。
      creature.x += 2.8 * dt;
      break;

    case 'flee':
      // 龙鱼明显逃离。
      creature.x += 7 * illumination * dt;
      break;

    case 'dart':
      // 鱿鱼反应最快。
      creature.x += 12 * illumination * dt;
      break;

    case 'hide':
      // 章鱼缓慢向岩壁方向躲。
      creature.x += 3.5 * illumination * dt;
      break;

    case 'glow':
    case 'calm':
    default:
      // 水母与具足虫不会明显逃跑。
      break;
  }

  creature.x = Math.max(
    6,
    Math.min(94, creature.x)
  );
}

/**
 * 每一种生物独立的基础运动。
 */
function updateMovement(creature, dt) {
  creature.time += dt;

  switch (creature.behavior) {
    case 'school':
      creature.x +=
        Math.sin(creature.time * 0.7) *
        1.4 *
        dt;

      creature.y =
        creature.originY +
        Math.sin(creature.time * 1.1) * 2.5;
      break;

    case 'float':
      creature.x =
        creature.originX +
        Math.sin(creature.time * 0.35) * 4;

      creature.y =
        creature.originY +
        Math.sin(creature.time * 0.65) * 6;
      break;

    case 'crawl':
      creature.x =
        creature.originX +
        Math.sin(creature.time * 0.18) * 7;

      creature.y =
        creature.originY +
        Math.sin(creature.time * 0.4) * 1.5;
      break;

    case 'patrol':
      creature.x =
        creature.originX +
        Math.sin(creature.time * 0.42) * 12;

      creature.y =
        creature.originY +
        Math.sin(creature.time * 0.8) * 3;
      break;

    case 'glide':
      creature.x =
        creature.originX +
        Math.sin(creature.time * 0.5) * 13;

      creature.y =
        creature.originY +
        Math.sin(creature.time * 0.72) * 7;
      break;

    case 'creep':
      creature.x =
        creature.originX +
        Math.sin(creature.time * 0.17) * 5;

      creature.y =
        creature.originY +
        Math.sin(creature.time * 0.3) * 2;
      break;
  }
}

/**
 * 更新视觉：
 *
 * 黑暗：
 *   主要看到微光。
 *
 * 灯照到：
 *   生物轮廓逐渐显现。
 */
function renderCreature(creature, illumination) {
  const element = creature.element;

  element.hidden = !creature.active;

  if (!creature.active) return;

  element.style.left = `${creature.x}%`;
  element.style.top = `${creature.y}%`;

  element.classList.toggle(
    'is-lit',
    illumination >= 0.2
  );

  element.style.setProperty(
    '--illumination',
    illumination.toFixed(2)
  );

  const image = element.querySelector('img');
  const glow = element.querySelector('.bio-glow');

  if (image) {
    const imageOpacity =
      0.08 + illumination * 0.92;

    const brightness =
      0.18 + illumination * 0.95;

    image.style.opacity =
      imageOpacity.toFixed(2);

    image.style.filter =
      `brightness(${brightness.toFixed(2)}) ` +
      `saturate(${(0.65 + illumination * 0.5).toFixed(2)}) ` +
      `drop-shadow(0 0 ${Math.round(8 + illumination * 18)}px rgba(115,255,232,.25))`;
  }

  if (glow) {
    glow.style.opacity =
      String(
        Math.min(
          0.9,
          0.28 + illumination * 0.55
        )
      );
  }
}

/**
 * 每次重新开始下潜时调用。
 */
export function resetCreatures() {
  buildCreatures();

  for (const creature of creatures) {
    creature.active = false;
    creature.illuminated = false;
    creature.scannedThisDive = false;
    creature.time = Math.random() * 10;
  }
}

/**
 * 游戏循环每一帧都会调用。
 */
export function updateCreatures(dt) {
  for (const creature of creatures) {
    creature.active =
      isDepthActive(creature);

    if (!creature.active) {
      renderCreature(creature, 0);
      continue;
    }

    updateMovement(creature, dt);

    const illumination =
      getIllumination(creature);

    creature.illuminated =
      illumination >= 0.2;

    applyLightReaction(
      creature,
      dt,
      illumination
    );

    renderCreature(
      creature,
      illumination
    );
  }
}

/**
 * 给 scanner.js 使用。
 *
 * 只返回当前屏幕里真正出现的生物。
 */
export function getActiveCreatures() {
  return creatures.filter(
    creature => creature.active
  );
}

/**
 * 根据 id 获取指定生物。
 */
export function getCreatureById(id) {
  return creatures.find(
    creature => creature.id === id
  ) ?? null;
}