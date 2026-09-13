import { initCursor, initMagnetic, initSheen } from './cursor';
import { initDisclosures } from './disclosure';
import { startFluidCursor } from './fluid';
import { initMotion } from './motion';
import { initNav } from './nav';
import { currentTheme, toggleTheme, watchSystemTheme } from './theme';

function initThemeToggle() {
  const button = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
  if (!button) return;

  const sync = () =>
    button.setAttribute('aria-label', currentTheme() === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  sync();

  button.addEventListener('click', () => {
    const rect = button.getBoundingClientRect();
    toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  });
  window.addEventListener('themechange', sync);
  watchSystemTheme();
}

function initFluid() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-fluid]');
  if (!canvas) return;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!finePointer || reducedMotion || !startFluidCursor(canvas)) canvas.remove();
}

/** three.js is only fetched once the About section is getting close. */
function initAboutScene() {
  const section = document.querySelector<HTMLElement>('[data-about]');
  const canvas = section?.querySelector<HTMLCanvasElement>('[data-about-canvas]');
  if (!section || !canvas) return;

  const fail = () => section.classList.add('no-webgl');
  if (!('WebGLRenderingContext' in window)) {
    fail();
    return;
  }

  const animate = document.documentElement.classList.contains('motion');
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      import('./about-scene')
        .then(({ createAboutScene }) => {
          if (!createAboutScene(canvas, { animate })) fail();
        })
        .catch(fail);
    },
    { rootMargin: '150% 0px' },
  );
  observer.observe(section);
}

function initCopyEmail() {
  document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach((button) => {
    const label = button.querySelector<HTMLElement>('[data-copy-label]');
    const status = button.parentElement?.querySelector<HTMLElement>('[data-copy-status]');
    const email = button.dataset.copyEmail ?? '';
    let timer = 0;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(email);
        if (label) label.textContent = 'Copied';
        if (status) status.textContent = 'Email address copied to clipboard';
      } catch {
        window.location.href = `mailto:${email}`;
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = 'Copy email';
        if (status) status.textContent = '';
      }, 2200);
    });
  });
}

// Disclosures first so scroll animations measure the final layout.
initDisclosures();
const lenis = initMotion();
initNav(lenis);
initThemeToggle();
initCursor();
initMagnetic();
initSheen();
initCopyEmail();
initAboutScene();

// The fluid simulation is the heaviest piece, so start it once the page is idle.
if ('requestIdleCallback' in window) window.requestIdleCallback(initFluid, { timeout: 1500 });
else setTimeout(initFluid, 300);
