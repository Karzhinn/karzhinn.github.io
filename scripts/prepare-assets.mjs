/**
 * Builds the favicon PNGs, the touch icon and the Open Graph share image.
 * If `_source/og-scene.png` exists (a capture of the About section's 3D
 * scene), it is placed on the share image with softly faded edges;
 * otherwise the image is typographic.
 *
 * Run with: npm run assets
 */
import sharp from 'sharp';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const at = (p) => path.join(root, p);

/* ---------- icons ---------- */
const favicon = await readFile(at('public/favicon.svg'));
const icon = (size) => sharp(favicon, { density: 512 }).resize(size, size);

await icon(32).png().toFile(at('public/favicon-32.png'));
await icon(512).png().toFile(at('public/icon-512.png'));
// iOS applies its own mask, so the touch icon is a full-bleed square.
await icon(180).flatten({ background: '#141417' }).png().toFile(at('public/apple-touch-icon.png'));

/* ---------- Open Graph ---------- */
const W = 1200;
const H = 630;
const SCENE = 500;
const scenePath = at('_source/og-scene.png');
const hasScene = await access(scenePath).then(
  () => true,
  () => false,
);

const background = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="0.28" cy="0.3" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4a4a52"/>
      <stop offset="0.45" stop-color="#0f0f11"/>
      <stop offset="1" stop-color="#5a5a63"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="#f6f6f7"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g font-family="Inter, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif">
    <text x="82" y="200" font-size="21" font-weight="600" fill="#85858d" letter-spacing="2">PORTFOLIO</text>
    <text x="76" y="304" font-size="96" font-weight="700" fill="url(#metal)" letter-spacing="-4">Karzhin</text>
    <text x="76" y="400" font-size="96" font-weight="700" fill="url(#metal)" letter-spacing="-4">Kamal</text>
    <text x="80" y="458" font-size="24" font-weight="500" fill="#55555c">Software Engineer &amp; Computer Science Graduate</text>
  </g>
</svg>`);

const layers = [];
if (hasScene) {
  // Fade the capture's edges so it melts into the background instead of
  // showing as a rectangle.
  const fade = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${SCENE}" height="${SCENE}">
  <defs>
    <radialGradient id="fade" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0.62" stop-color="#fff" stop-opacity="1"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${SCENE}" height="${SCENE}" fill="url(#fade)"/>
</svg>`);

  const scene = await sharp(scenePath)
    .resize(SCENE, SCENE, { fit: 'cover' })
    .ensureAlpha()
    .composite([{ input: fade, blend: 'dest-in' }])
    .png()
    .toBuffer();
  layers.push({ input: scene, left: W - SCENE - 30, top: Math.round((H - SCENE) / 2) });
}

await sharp(background).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toFile(at('public/og.jpg'));

console.log(`Assets written: public/{og.jpg,favicon-32.png,icon-512.png,apple-touch-icon.png}${hasScene ? ' (with 3D scene)' : ''}`);
