// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Update `site` to the production domain before deploying — it drives the
// canonical URL, Open Graph URLs and the sitemap.
export default defineConfig({
  site: 'https://karzhinkamal.com',
  integrations: [sitemap()],
  compressHTML: true,
  devToolbar: { enabled: false },
  build: {
    inlineStylesheets: 'auto',
  },
  image: {
    responsiveStyles: true,
  },
  vite: {
    build: {
      // The three.js About scene is its own lazily loaded chunk (~130 KB gzip),
      // fetched only when that section is near; it never blocks first load.
      chunkSizeWarningLimit: 600,
    },
  },
});
