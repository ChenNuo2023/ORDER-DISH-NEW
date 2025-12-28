const MENUS_KEY = "cooking_master_menus";
const XP_KEY = "cooking_master_xp";

export function loadMenus() {
  try {
    const raw = localStorage.getItem(MENUS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveMenus(list) {
  localStorage.setItem(MENUS_KEY, JSON.stringify(list));
}

export function loadXP() {
  try {
    const raw = localStorage.getItem(XP_KEY);
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveXP(xp) {
  localStorage.setItem(XP_KEY, String(xp));
}

export function resetXP() {
  localStorage.removeItem(XP_KEY);
}
