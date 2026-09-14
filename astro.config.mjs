// @ts-check
import { existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

/**
 * Where GitHub Pages serves the site. It's worked out at build time, so renaming
 * the repository or adding a custom domain never breaks links and assets:
 *
 *   public/CNAME containing a domain  → https://<that domain>/
 *   repo named karzhinn.github.io     → https://karzhinn.github.io/
 *   any other repo name, e.g. kajo    → https://karzhinn.github.io/kajo/
 *
 * GitHub Actions provides GITHUB_REPOSITORY ("Owner/repo"). Local dev and local
 * builds don't have it, so they run at the root (http://localhost:4321/).
 */
function pagesAddress() {
  const cnameFile = new URL('./public/CNAME', import.meta.url);
  const domain = existsSync(cnameFile) ? readFileSync(cnameFile, 'utf8').trim() : '';
  if (domain) return { site: `https://${domain}`, base: undefined };

  const [owner = 'Karzhinn', repo = ''] = (process.env.GITHUB_REPOSITORY ?? '').split('/').filter(Boolean);
  const host = `${owner.toLowerCase()}.github.io`;
  const isUserSite = repo.toLowerCase() === host;
  return { site: `https://${host}`, base: repo && !isUserSite ? `/${repo}` : undefined };
}

export default defineConfig({
  ...pagesAddress(),
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
