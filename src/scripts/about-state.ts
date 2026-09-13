/**
 * Shared between the scroll timeline (motion.ts) and the lazily loaded 3D
 * scene, so the scene can follow scroll without owning any ScrollTriggers.
 */
export const aboutState = {
  /** 0 → 1 across the About section. */
  progress: 0,
};
