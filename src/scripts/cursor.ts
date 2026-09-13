/**
 * Desktop pointer layer: a precise dot plus a trailing ring that reacts to
 * what is underneath it, magnetic buttons, and the pointer-tracked sheen on
 * glass surfaces. Everything here is skipped on touch / coarse pointers.
 */

const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type CursorState = 'default' | 'link' | 'card' | 'hidden';

const STATE_SELECTORS: [string, CursorState][] = [
  ['[data-cursor="card"]', 'card'],
  ['[data-cursor="hidden"], input, textarea, select', 'hidden'],
  ['a, button, [role="button"], summary, label[for]', 'link'],
];

export function initCursor() {
  if (!finePointer()) return;
  const cursor = document.querySelector<HTMLElement>('[data-cursor-root]');
  const dot = cursor?.querySelector<HTMLElement>('[data-cursor-dot]');
  const ring = cursor?.querySelector<HTMLElement>('[data-cursor-ring]');
  if (!cursor || !dot || !ring) return;

  const ease = reducedMotion() ? 1 : 0.2;
  let x = 0;
  let y = 0;
  let ringX = 0;
  let ringY = 0;
  let raf = 0;
  let started = false;

  const loop = () => {
    ringX += (x - ringX) * ease;
    ringY += (y - ringY) * ease;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
    if (Math.abs(x - ringX) > 0.1 || Math.abs(y - ringY) > 0.1) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = 0;
    }
  };

  const setState = (target: EventTarget | null) => {
    let state: CursorState = 'default';
    if (target instanceof Element) {
      for (const [selector, value] of STATE_SELECTORS) {
        if (target.closest(selector)) {
          state = value;
          break;
        }
      }
    }
    if (cursor.dataset.state !== state) cursor.dataset.state = state;
  };

  window.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType !== 'mouse') return;
      x = event.clientX;
      y = event.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (!started) {
        started = true;
        ringX = x;
        ringY = y;
        document.documentElement.classList.add('has-cursor');
      }
      cursor.classList.add('is-visible');
      if (!raf) raf = requestAnimationFrame(loop);
    },
    { passive: true },
  );

  document.addEventListener('pointerover', (event) => setState(event.target), { passive: true });
  document.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'), { passive: true });
  document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'), { passive: true });
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  document.documentElement.addEventListener('pointerenter', () => started && cursor.classList.add('is-visible'));
}

/** Buttons marked `data-magnetic` lean gently toward the pointer. */
export function initMagnetic() {
  if (!finePointer() || reducedMotion()) return;

  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = Number(el.dataset.magnetic) || 0.3;
    let rect: DOMRect | null = null;

    el.addEventListener('pointerenter', () => {
      // Measured once, before any pull is applied, so the math stays stable.
      rect = el.getBoundingClientRect();
    });
    el.addEventListener('pointermove', (event) => {
      if (!rect) return;
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      el.style.setProperty('--tx', `${(dx * strength).toFixed(2)}px`);
      el.style.setProperty('--ty', `${(dy * strength).toFixed(2)}px`);
    });
    el.addEventListener('pointerleave', () => {
      rect = null;
      el.style.setProperty('--tx', '0px');
      el.style.setProperty('--ty', '0px');
    });
  });
}

/** Feeds pointer coordinates to `.glass` / `.btn-solid` sheen gradients. */
export function initSheen() {
  if (!finePointer()) return;
  document.addEventListener(
    'pointermove',
    (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>('.glass, .btn-solid') : null;
      if (!target) return;
      const rect = target.getBoundingClientRect();
      target.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      target.style.setProperty('--my', `${event.clientY - rect.top}px`);
    },
    { passive: true },
  );
}
