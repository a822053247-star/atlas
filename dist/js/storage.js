const STORAGE_KEY = 'abyssal-progress';

const DEFAULT_PROGRESS = {
  unlocked: [],
  observations: {},
  totalObservations: 0,
};

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return structuredClone(DEFAULT_PROGRESS);
    }

    const saved = JSON.parse(raw);

    return {
      unlocked: Array.isArray(saved.unlocked)
        ? saved.unlocked
        : [],

      observations:
        saved.observations &&
        typeof saved.observations === 'object'
          ? saved.observations
          : {},

      totalObservations:
        Number(saved.totalObservations) || 0,
    };
  } catch (error) {
    console.warn(
      '[storage] 无法读取图鉴存档',
      error
    );

    return structuredClone(DEFAULT_PROGRESS);
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(progress)
    );
  } catch (error) {
    console.warn(
      '[storage] 无法保存图鉴存档',
      error
    );
  }
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}