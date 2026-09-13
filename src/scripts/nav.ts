import type Lenis from 'lenis';

/**
 * Floating navigation: scroll states, the sliding active-section indicator,
 * smooth in-page anchors (with focus management) and the mobile sheet.
 */
export function initNav(lenis: Lenis | null) {
  const shell = document.querySelector<HTMLElement>('[data-nav]');
  if (!shell) return;

  const links = Array.from(shell.querySelectorAll<HTMLAnchorElement>('[data-nav-link]'));
  const linksWrap = shell.querySelector<HTMLElement>('[data-nav-links]');
  const indicator = shell.querySelector<HTMLElement>('[data-nav-indicator]');
  const menuButton = shell.querySelector<HTMLButtonElement>('[data-menu-btn]');
  const menuLabel = shell.querySelector<HTMLElement>('[data-menu-label]');
  const menu = shell.querySelector<HTMLElement>('[data-mobile-menu]');
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll states ---------- */
  const bar = shell.querySelector<HTMLElement>('.nav');
  const stages = Array.from(document.querySelectorAll<HTMLElement>('[data-stage]'));

  const onScroll = () => {
    const y = window.scrollY;
    shell.classList.toggle('is-scrolled', y > 24);
    shell.classList.toggle('is-condensed', y > window.innerHeight * 0.5);

    // Switch to dark glass while the bar floats over a dark stage.
    if (bar && stages.length) {
      const navRect = bar.getBoundingClientRect();
      const mid = navRect.top + navRect.height / 2;
      const onDark = stages.some((stage) => {
        const rect = stage.getBoundingClientRect();
        return rect.top <= mid && rect.bottom >= mid;
      });
      shell.classList.toggle('on-dark', onDark);
    }
  };
  onScroll();
  if (lenis) lenis.on('scroll', onScroll);
  else window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- sliding indicator ---------- */
  let active: HTMLAnchorElement | null = null;
  let hovered: HTMLAnchorElement | null = null;

  const moveIndicator = (link: HTMLAnchorElement | null) => {
    if (!indicator) return;
    if (!link) {
      indicator.style.setProperty('--o', '0');
      return;
    }
    indicator.style.setProperty('--x', `${link.offsetLeft}px`);
    indicator.style.setProperty('--w', `${link.offsetWidth}px`);
    indicator.style.setProperty('--o', '1');
  };

  const setActive = (id: string) => {
    active = links.find((link) => link.dataset.navLink === id) ?? null;
    links.forEach((link) => {
      if (link === active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (!hovered) moveIndicator(active);
  };

  links.forEach((link) =>
    link.addEventListener('pointerenter', () => {
      hovered = link;
      moveIndicator(link);
    }),
  );
  linksWrap?.addEventListener('pointerleave', () => {
    hovered = null;
    moveIndicator(active);
  });
  window.addEventListener('resize', () => moveIndicator(hovered ?? active));
  document.fonts?.ready.then(() => moveIndicator(hovered ?? active));

  const sections = links
    .map((link) => document.getElementById(link.dataset.navLink ?? ''))
    .filter((section): section is HTMLElement => section !== null);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    },
    { rootMargin: '-45% 0px -54% 0px' },
  );
  sections.forEach((section) => observer.observe(section));

  /* ---------- mobile sheet ---------- */
  const isMenuOpen = () => menuButton?.getAttribute('aria-expanded') === 'true';

  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeMenu(true);
  };

  const onOutsidePointer = (event: PointerEvent) => {
    if (!shell.contains(event.target as Node)) closeMenu(false);
  };

  function openMenu() {
    if (!menu || !menuButton) return;
    menu.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
    menuButton.setAttribute('aria-expanded', 'true');
    if (menuLabel) menuLabel.textContent = 'Close menu';
    lenis?.stop();
    menu.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    document.addEventListener('keydown', onKeydown);
    document.addEventListener('pointerdown', onOutsidePointer);
  }

  function closeMenu(restoreFocus: boolean) {
    if (!menu || !menuButton || !isMenuOpen()) return;
    menu.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    if (menuLabel) menuLabel.textContent = 'Open menu';
    lenis?.start();
    window.setTimeout(() => {
      if (!menu.classList.contains('is-open')) menu.hidden = true;
    }, 450);
    if (restoreFocus) menuButton.focus();
    document.removeEventListener('keydown', onKeydown);
    document.removeEventListener('pointerdown', onOutsidePointer);
  }

  menuButton?.addEventListener('click', () => (isMenuOpen() ? closeMenu(true) : openMenu()));
  shell.addEventListener('focusout', (event) => {
    if (isMenuOpen() && !shell.contains(event.relatedTarget as Node | null)) closeMenu(false);
  });
  window.matchMedia('(min-width: 881px)').addEventListener('change', (event) => {
    if (event.matches) closeMenu(false);
  });

  /* ---------- in-page anchors ---------- */
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    const hash = anchor?.getAttribute('href');
    if (!anchor || !hash || hash.length < 2) return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    event.preventDefault();
    closeMenu(false);

    const toTop = hash === '#top';
    if (lenis) {
      lenis.scrollTo(toTop ? 0 : target, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    } else if (toTop) {
      window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    }

    history.pushState(null, '', toTop ? `${location.pathname}${location.search}` : hash);

    // Move focus for keyboard and screen-reader users without a second jump.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}
