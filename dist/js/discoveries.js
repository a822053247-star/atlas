import {
  loadProgress,
  saveProgress,
} from './storage.js';


/*
 * 本次下潜的数据。
 *
 * 重新出发时清空，
 * 但不会影响永久图鉴。
 */

const session = {
  discoveries: new Set(),
  newDiscoveries: new Set(),
  observationCount: 0,
};


/*
 * 永久存档。
 */
let progress = loadProgress();


function recordScan(event) {
  const detail = event.detail;

  if (!detail?.id) return;

  const id = detail.id;

  /*
   * 本轮观察次数 +1
   */
  session.observationCount += 1;

  /*
   * 本轮发现记录。
   */
  session.discoveries.add(id);


  /*
   * 判断是不是第一次发现。
   */
  const isNew =
    !progress.unlocked.includes(id);

  if (isNew) {
    progress.unlocked.push(id);

    session.newDiscoveries.add(id);
  }


  /*
   * 单个生物累计观察次数。
   */
  progress.observations[id] =
    (progress.observations[id] || 0) + 1;


  /*
   * 总观察次数。
   */
  progress.totalObservations += 1;


  /*
   * 保存到设备。
   */
  saveProgress(progress);


  /*
   * 给 UI / 图鉴 / 结算系统发送通知。
   */
  window.dispatchEvent(
    new CustomEvent(
      'abyss:discovery-recorded',
      {
        detail: {
          id,
          name: detail.name,
          latin: detail.latin,

          isNew,

          observationCount:
            progress.observations[id],

          totalObservations:
            progress.totalObservations,
        },
      }
    )
  );


  console.log(
    isNew
      ? `[发现] 新物种：${detail.name}`
      : `[观察] 再次记录：${detail.name}`
  );
}


/*
 * scanner.js 扫描成功以后
 * 已经会发送这个事件。
 */
window.addEventListener(
  'abyss:creature-scanned',
  recordScan
);


/*
 * 每次重新开始潜航时调用。
 */
export function resetDiscoveries() {
  session.discoveries.clear();
  session.newDiscoveries.clear();
  session.observationCount = 0;

  /*
   * 重新读取永久存档。
   *
   * 注意：
   * 这里绝对不删除 localStorage。
   */
  progress = loadProgress();
}


/*
 * 获取本轮信息。
 *
 * 后面的 results.js 会直接使用。
 */
export function getSessionSummary() {
  return {
    discoveries: [
      ...session.discoveries
    ],

    newDiscoveries: [
      ...session.newDiscoveries
    ],

    observationCount:
      session.observationCount,
  };
}


/*
 * 获取永久图鉴信息。
 *
 * atlas.html / results.js 都可以使用。
 */
export function getProgress() {
  return {
    unlocked: [
      ...progress.unlocked
    ],

    observations: {
      ...progress.observations
    },

    totalObservations:
      progress.totalObservations,
  };
}


export function isUnlocked(id) {
  return progress.unlocked.includes(id);
}


export function getObservationCount(id) {
  return progress.observations[id] || 0;
}