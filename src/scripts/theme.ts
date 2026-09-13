export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const THEME_COLORS: Record<Theme, string> = { light: '#f6f6f7', dark: '#0a0a0b' };

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function storedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function applyTheme(theme: Theme, persist: boolean) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage unavailable (private mode); the choice still applies for this visit */
    }
  }
  window.dispatchEvent(new CustomEvent<Theme>('themechange', { detail: theme }));
}

/**
 * Switches theme with a circular reveal that grows from `origin` (the toggle),
 * falling back to a soft colour cross-fade where View Transitions are missing.
 */
export function toggleTheme(origin?: { x: number; y: number }) {
  const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.startViewTransition || reduceMotion) {
    root.classList.add('theme-fade');
    applyTheme(next, true);
    window.setTimeout(() => root.classList.remove('theme-fade'), 650);
    return;
  }

  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? 0;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(() => applyTheme(next, true));
  transition.ready
    .then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 760, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    })
    .catch(() => {
      /* transition skipped; the theme is already applied */
    });
}

/** Follow the OS setting until the visitor makes an explicit choice. */
export function watchSystemTheme() {
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  query.addEventListener('change', (event) => {
    if (storedTheme()) return;
    applyTheme(event.matches ? 'dark' : 'light', false);
  });
}
