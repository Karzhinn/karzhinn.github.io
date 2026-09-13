/**
 * Expand / collapse panels (experience details). The panels render expanded
 * without JS; the `data-open` attribute drives the animated grid-row collapse.
 */
export function initDisclosures() {
  document.querySelectorAll<HTMLButtonElement>('[data-disclosure]').forEach((button) => {
    const panel = document.getElementById(button.getAttribute('aria-controls') ?? '');
    const label = button.querySelector('[data-disclosure-label]');
    if (!panel) return;

    const apply = (open: boolean) => {
      button.setAttribute('aria-expanded', String(open));
      panel.dataset.open = String(open);
      panel.inert = !open;
      if (label) label.textContent = open ? 'Show less' : 'More details';
    };

    apply(panel.dataset.open === 'true');

    button.addEventListener('click', () => {
      apply(button.getAttribute('aria-expanded') !== 'true');
      // Let scroll-driven animations re-measure once the height has settled.
      window.setTimeout(() => window.dispatchEvent(new Event('layout:change')), 650);
    });
  });
}
