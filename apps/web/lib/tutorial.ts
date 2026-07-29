export const TUTORIAL_STORAGE_KEY = "fyc:tutorial:v1";

const TUTORIAL_SEEN_VALUE = "seen";

export interface TutorialStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function resolveStorage(
  storage: TutorialStorage | null | undefined,
): TutorialStorage | null {
  if (storage !== undefined) return storage;
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function shouldShowTutorial(
  storage?: TutorialStorage | null,
): boolean {
  try {
    return resolveStorage(storage)?.getItem(TUTORIAL_STORAGE_KEY) !== TUTORIAL_SEEN_VALUE;
  } catch {
    return true;
  }
}

export function markTutorialSeen(
  storage?: TutorialStorage | null,
): boolean {
  const target = resolveStorage(storage);
  if (!target) return false;

  try {
    target.setItem(TUTORIAL_STORAGE_KEY, TUTORIAL_SEEN_VALUE);
    return true;
  } catch {
    return false;
  }
}
