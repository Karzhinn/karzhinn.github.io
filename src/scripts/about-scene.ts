import {
  ACESFilmicToneMapping,
  CanvasTexture,
  Color,
  DirectionalLight,
  Euler,
  Group,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Quaternion,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { aboutState } from './about-state';

/**
 * The About section's 3D piece: 27 satin-aluminium blocks. They drift as a
 * loose cloud, lock together into one cube as you scroll, then separate into
 * layers that turn against each other, like an exploded view of a system.
 */

const COUNT = 27;
/** Pose used when motion is reduced: the assembled cube, at rest. */
const STATIC_PROGRESS = 0.56;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Small seeded PRNG so the cloud looks the same on every visit. */
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createShadowTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(0.42, 'rgba(0,0,0,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

const themes = {
  light: { exposure: 1.08, environment: 1, key: 1.5, shadow: 0.6 },
  dark: { exposure: 0.95, environment: 0.78, key: 1.15, shadow: 1 },
};

export type AboutScene = { destroy(): void };

export function createAboutScene(canvas: HTMLCanvasElement, options: { animate: boolean }): AboutScene | null {
  const { animate } = options;
  const host = canvas.parentElement;
  if (!host) return null;

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }

  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, finePointer ? 2 : 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  /* ---------- scene ---------- */
  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, 0.04).texture;
  scene.environment = environment;
  pmrem.dispose();

  const camera = new PerspectiveCamera(28, 1, 0.1, 100);

  const key = new DirectionalLight(0xffffff, 1.5);
  key.position.set(-4, 7, 6);
  scene.add(key);

  const geometry = new RoundedBoxGeometry(1, 1, 1, 5, 0.16);
  const material = new MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 1,
    roughness: 0.3,
    clearcoat: 0.55,
    clearcoatRoughness: 0.2,
  });
  const blocks = new InstancedMesh(geometry, material, COUNT);
  const cluster = new Group();
  cluster.add(blocks);
  scene.add(cluster);

  const shadowMaterial = new MeshBasicMaterial({ map: createShadowTexture(), transparent: true, depthWrite: false });
  const shadow = new Mesh(new PlaneGeometry(1, 1), shadowMaterial);
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  /* ---------- per-block data ---------- */
  const random = mulberry32(11);
  const home: Vector3[] = [];
  const cloud: Vector3[] = [];
  const tumble: Quaternion[] = [];
  const phase: number[] = [];
  const delay: number[] = [];
  const silver = new Color('#e7e9ee');
  const steel = new Color('#b7bbc5');
  const graphite = new Color('#46494f');

  let i = 0;
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        home.push(new Vector3(x, y, z));
        const theta = random() * Math.PI * 2;
        const phi = Math.acos(2 * random() - 1);
        const radius = 3 + random() * 1.9;
        cloud.push(
          new Vector3(
            Math.sin(phi) * Math.cos(theta) * radius,
            Math.cos(phi) * radius * 0.72,
            Math.sin(phi) * Math.sin(theta) * radius,
          ),
        );
        tumble.push(
          new Quaternion().setFromEuler(
            new Euler(random() * Math.PI * 2, random() * Math.PI * 2, random() * Math.PI * 2),
          ),
        );
        phase.push(random() * Math.PI * 2);
        delay.push(random());
        const tone = random();
        blocks.setColorAt(i, tone < 0.13 ? graphite : tone < 0.44 ? steel : silver);
        i++;
      }
    }
  }
  if (blocks.instanceColor) blocks.instanceColor.needsUpdate = true;

  /* ---------- pose ---------- */
  const dummy = new Object3D();
  const layerTurn = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const target = new Vector3();
  const pointer = { x: 0, y: 0 };
  const pointerTarget = { x: 0, y: 0 };
  let theme = themes.light;

  function pose(p: number, t: number) {
    const assemble = smoothstep(0, 0.46, p);
    const tighten = smoothstep(0.4, 0.62, p);
    const explode = smoothstep(0.68, 0.96, p);
    const gap = lerp(1.2, 1.05, tighten);

    for (let n = 0; n < COUNT; n++) {
      const h = home[n];
      const k = easeInOutCubic(clamp01((assemble - delay[n] * 0.45) / 0.55));

      // Exploded view: each layer lifts away and turns against its neighbours.
      const angle = h.y * explode * 0.42;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      target.set((h.x * cos - h.z * sin) * gap, h.y * gap + h.y * explode * 0.95, (h.x * sin + h.z * cos) * gap);

      // The loose cloud breathes slowly until the block is pulled home.
      const c = cloud[n];
      const bob = Math.sin(t * 0.8 + phase[n]) * 0.2;
      dummy.position.set(lerp(c.x, target.x, k), lerp(c.y + bob, target.y, k), lerp(c.z, target.z, k));
      layerTurn.setFromAxisAngle(up, angle);
      dummy.quaternion.slerpQuaternions(tumble[n], layerTurn, k);
      dummy.scale.setScalar(lerp(0.76, 1, k));
      dummy.updateMatrix();
      blocks.setMatrixAt(n, dummy.matrix);
    }
    blocks.instanceMatrix.needsUpdate = true;

    cluster.rotation.y = -0.78 + p * 1.7 + t * 0.05 + pointer.x * 0.28;
    cluster.rotation.x = 0.46 - explode * 0.1 + pointer.y * 0.14;

    shadow.position.y = -2.55 - explode * 0.9;
    const size = lerp(8.6, 6.2, assemble) + explode * 1.3;
    shadow.scale.set(size, size, 1);
    shadowMaterial.opacity = lerp(0.25, 1, assemble) * (1 - explode * 0.35) * theme.shadow;
  }

  /* ---------- theme ---------- */
  function applyTheme() {
    theme = document.documentElement.dataset.theme === 'dark' ? themes.dark : themes.light;
    renderer.toneMappingExposure = theme.exposure;
    scene.environmentIntensity = theme.environment;
    key.intensity = theme.key;
  }
  applyTheme();

  /* ---------- render loop ---------- */
  let progress = animate ? aboutState.progress : STATIC_PROGRESS;
  let time = 0;
  let last = performance.now();
  let raf = 0;
  let visible = false;
  let readyMarked = false;

  const render = () => {
    pose(progress, time);
    renderer.render(scene, camera);
    if (!readyMarked) {
      readyMarked = true;
      host.classList.add('is-ready');
    }
  };

  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    progress += (aboutState.progress - progress) * Math.min(1, dt * 7);
    pointer.x += (pointerTarget.x - pointer.x) * Math.min(1, dt * 3);
    pointer.y += (pointerTarget.y - pointer.y) * Math.min(1, dt * 3);
    render();
    raf = visible && !document.hidden ? requestAnimationFrame(frame) : 0;
  };

  const start = () => {
    if (!animate || raf || !visible || document.hidden) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const resize = () => {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const fit = camera.aspect < 1 ? Math.min(1 / camera.aspect, 1.6) : 1;
    camera.position.set(0, 0.4, 14.5 * fit);
    camera.lookAt(0, -0.15, 0);
    camera.updateProjectionMatrix();
    if (!raf) render();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const visibilityObserver = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    },
    { rootMargin: '15% 0px' },
  );
  visibilityObserver.observe(host);

  const onPointerMove = (event: PointerEvent) => {
    pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointerTarget.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  if (animate && finePointer) window.addEventListener('pointermove', onPointerMove, { passive: true });

  const onTheme = () => {
    applyTheme();
    if (!raf) render();
  };
  window.addEventListener('themechange', onTheme);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  resize();

  return {
    destroy() {
      stop();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('themechange', onTheme);
      document.removeEventListener('visibilitychange', onVisibility);
      geometry.dispose();
      material.dispose();
      shadowMaterial.map?.dispose();
      shadowMaterial.dispose();
      environment.dispose();
      renderer.dispose();
    },
  };
}
