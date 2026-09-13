// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Published on GitHub Pages at https://karzhinn.github.io/cooler-portfolio/
// `site` drives the canonical URL, Open Graph URLs and the sitemap; `base` must
// match the repository name. If you rename the repo, update `base`. If you add a
// custom domain (public/CNAME), set `site` to that domain and remove `base`.
export default defineConfig({
  site: 'https://karzhinn.github.io',
  base: '/cooler-portfolio',
  // GitHub Pages serves folders with a trailing slash; match it so the sitemap
  // and canonical URL list each page exactly once.
  trailingSlash: 'always',
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
