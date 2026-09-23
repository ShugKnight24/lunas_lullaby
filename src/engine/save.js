/**
 * Versioned localStorage save slot. `migrate` upgrades old saves in place;
 * a corrupt, unreadable or newer-than-supported save returns null instead of
 * throwing.
 */

export function createSave(key, version, migrate = (d) => d) {
  return {
    load() {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const data = JSON.parse(raw);
        if (data.v === version) return data;
        return data.v > version ? null : migrate(data);
      } catch {
        return null;
      }
    },
    write(data) {
      try {
        localStorage.setItem(key, JSON.stringify({ ...data, v: version }));
        return true;
      } catch {
        return false;
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {}
    },
  };
}

/**
 * Build a `migrate` for createSave from single-step upgrades: `steps[n]` turns
 * a v(n) save into v(n+1). A missing step makes the save unloadable (null).
 */
export function migrateChain(version, steps) {
  return (data) => {
    let d = data;
    for (let v = d.v ?? 1; v < version; v++) {
      if (!steps[v]) return null;
      d = steps[v](d);
    }
    return { ...d, v: version };
  };
}
