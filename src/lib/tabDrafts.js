const memory = new Map();
const storageKey = (name) => `securescan.draft.${name}`;

export function readDraft(name) {
  if (memory.has(name)) return memory.get(name);

  try {
    const raw = window.sessionStorage.getItem(storageKey(name));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeDraft(name, value, { persist = true } = {}) {
  memory.set(name, value);
  if (!persist) return;

  try {
    window.sessionStorage.setItem(storageKey(name), JSON.stringify(value));
  } catch {
    // Draft stays in memory for this session only.
  }
}