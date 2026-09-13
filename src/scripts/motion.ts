import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { aboutState } from './about-state';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scrolling + every scroll-driven animation on the page.
 * Returns the Lenis instance, or null when motion is reduced. In that case
 * the CSS never hides anything (`html.motion` is absent) and nothing runs.
 */
export function initMotion(): Lenis | null {
  window.__motionReady = true;
  if (!document.documentElement.classList.contains('motion')) return null;

  const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  heroIntro();
  heroScroll();
  reveals();
  about();
  timeline();
  projects();
  stack();
  statement();
  future();
  contact();

  let refreshTimer = 0;
  const refresh = () => {
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 120);
  };
  window.addEventListener('layout:change', refresh);
  window.addEventListener('load', refresh, { once: true });
  document.fonts?.ready.then(refresh);

  return lenis;
}

/* -------------------------------------------------------------------------- */
/* Hero                                                                       */
/* -------------------------------------------------------------------------- */

function heroIntro() {
  const lines = gsap.utils.toArray<HTMLElement>('[data-hero-line]');
  const items = gsap.utils.toArray<HTMLElement>('[data-hero-item]');

  gsap
    .timeline({ defaults: { ease: 'expo.out' } })
    .fromTo('.hero-bg', { opacity: 0 }, { opacity: 1, duration: 2.4, ease: 'power2.out' }, 0)
    .fromTo('[data-nav] .nav', { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4 }, 0.3)
    .fromTo(lines, { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.6, stagger: 0.1 }, 0.15)
    .fromTo(
      items,
      { opacity: 0, y: 18, filter: 'blur(8px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, stagger: 0.08, clearProps: 'filter' },
      0.55,
    );
}

function heroScroll() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  if (!hero) return;
  const scrub = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };

  // The hero recedes as the next section takes over.
  gsap.to('[data-hero-inner]', { yPercent: -12, scale: 0.94, opacity: 0, ease: 'none', scrollTrigger: scrub });

  gsap.utils.toArray<HTMLElement>('[data-parallax]', hero).forEach((el) => {
    gsap.to(el, { yPercent: (Number(el.dataset.parallax) || 0.2) * 40, ease: 'none', scrollTrigger: scrub });
  });

  const lenses = gsap.utils.toArray<HTMLElement>('[data-lens]', hero);
  lenses.forEach((lens) => {
    gsap.to(lens, { y: -140 * (Number(lens.dataset.lens) || 1), ease: 'none', scrollTrigger: scrub });
  });

  // Lenses drift gently against the pointer: depth without distraction.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const movers = lenses.map((lens) => ({
      depth: Number(lens.dataset.lens) || 1,
      x: gsap.quickTo(lens, 'x', { duration: 1.4, ease: 'power3.out' }),
    }));
    window.addEventListener(
      'pointermove',
      (event) => {
        const dx = event.clientX / window.innerWidth - 0.5;
        movers.forEach((mover) => mover.x(dx * -36 * mover.depth));
      },
      { passive: true },
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Generic reveals                                                            */
/* -------------------------------------------------------------------------- */

function reveals() {
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.09,
        overwrite: true,
        onComplete: () =>
          batch.forEach((el) => {
            el.classList.add('is-revealed');
            gsap.set(el, { clearProps: 'opacity,transform,filter' });
          }),
      });
    },
  });

  ScrollTrigger.batch('[data-line]', {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.fromTo(batch, { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.12 }),
  });
}

/* -------------------------------------------------------------------------- */
/* About: scroll drives the 3D scene and the active chapter                   */
/* -------------------------------------------------------------------------- */

function about() {
  const section = document.querySelector<HTMLElement>('[data-about]');
  const grid = section?.querySelector<HTMLElement>('.about-grid');
  if (!section || !grid) return;

  // Read every frame by the lazily loaded scene (about-scene.ts).
  ScrollTrigger.create({
    trigger: grid,
    start: 'top 75%',
    end: 'bottom bottom',
    onUpdate: (self) => {
      aboutState.progress = self.progress;
    },
    onRefresh: (self) => {
      aboutState.progress = self.progress;
    },
  });

  const legend = gsap.utils.toArray<HTMLElement>('[data-legend]', section);
  gsap.utils.toArray<HTMLElement>('[data-chapter]', section).forEach((chapter, i) => {
    const card = chapter.querySelector<HTMLElement>('.chapter-card') ?? chapter;
    ScrollTrigger.create({
      trigger: card,
      start: 'top 78%',
      end: 'bottom 22%',
      onToggle: (self) => {
        chapter.classList.toggle('is-active', self.isActive);
        legend[i]?.classList.toggle('is-active', self.isActive);
      },
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Experience                                                                 */
/* -------------------------------------------------------------------------- */

function timeline() {
  const list = document.querySelector<HTMLElement>('[data-timeline]');
  if (!list) return;

  gsap.fromTo(
    '[data-timeline-fill]',
    { scaleY: 0 },
    { scaleY: 1, ease: 'none', scrollTrigger: { trigger: list, start: 'top 62%', end: 'bottom 62%', scrub: true } },
  );

  gsap.utils.toArray<HTMLElement>('[data-tl-item]').forEach((item) => {
    ScrollTrigger.create({
      trigger: item,
      start: 'top 62%',
      onEnter: () => item.classList.add('is-active'),
      onLeaveBack: () => item.classList.remove('is-active'),
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

function projects() {
  gsap.utils.toArray<HTMLElement>('[data-project-visual]').forEach((visual) => {
    const range = { trigger: visual, start: 'top bottom', end: 'bottom top', scrub: true };

    gsap.fromTo(
      visual,
      { scale: 0.88, opacity: 0.35 },
      { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: visual, start: 'top 96%', end: 'top 35%', scrub: true } },
    );

    // Devices and floating details move at different depths.
    visual.querySelectorAll<HTMLElement>('[data-depth]').forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 0;
      gsap.fromTo(layer, { y: 40 * depth }, { y: -40 * depth, ease: 'none', scrollTrigger: range });
    });

    // Phones tilt upright as they arrive.
    visual.querySelectorAll<HTMLElement>('[data-tilt]').forEach((device) => {
      const tilt = Number(device.dataset.tilt) || 10;
      gsap.fromTo(
        device,
        { rotateX: tilt, rotateZ: tilt * -0.35 },
        {
          rotateX: 0,
          rotateZ: 0,
          ease: 'none',
          scrollTrigger: { trigger: visual, start: 'top bottom', end: 'center center', scrub: true },
        },
      );
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Stack, design statement, future, contact                                   */
/* -------------------------------------------------------------------------- */

function stack() {
  const wrap = document.querySelector('[data-drift-wrap]');
  if (!wrap) return;
  gsap.fromTo(
    '[data-drift]',
    { xPercent: 0 },
    { xPercent: -28, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom top', scrub: true } },
  );
}

function statement() {
  const stage = document.querySelector<HTMLElement>('[data-stage]');
  if (stage) {
    gsap.fromTo(
      stage,
      { scale: 0.94 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: stage, start: 'top bottom', end: 'top 25%', scrub: true } },
    );
  }

  const words = gsap.utils.toArray<HTMLElement>('[data-word]');
  if (!words.length) return;
  gsap.fromTo(
    words,
    { opacity: 0.14 },
    {
      opacity: 1,
      ease: 'none',
      stagger: 0.12,
      scrollTrigger: { trigger: '[data-statement]', start: 'top 80%', end: 'bottom 42%', scrub: true },
    },
  );
}

function future() {
  const orbit = document.querySelector<HTMLElement>('[data-orbit]');
  if (!orbit) return;
  gsap.fromTo(
    orbit,
    { scale: 0.78, opacity: 0, rotate: -14 },
    {
      scale: 1,
      opacity: 1,
      rotate: 0,
      ease: 'none',
      scrollTrigger: { trigger: orbit, start: 'top 95%', end: 'top 40%', scrub: true },
    },
  );
}

function contact() {
  const halo = document.querySelector<HTMLElement>('[data-halo]');
  if (!halo) return;
  gsap.fromTo(
    halo,
    { scale: 0.6, opacity: 0 },
    { scale: 1, opacity: 1, ease: 'none', scrollTrigger: { trigger: halo, start: 'top bottom', end: 'center center', scrub: true } },
  );
}
