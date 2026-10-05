import { defineConfig } from 'vite';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

// GitHub Pages serves this repository's root as-is (no build on GitHub), so the
// Vite source lives in ./site and `npm run build` writes the finished page
// (index.html + assets/) to the repository root, next to the static folders
// that are committed directly (fonts, images, icons, docs, .well-known, ...).

const ROOT_STATIC = [
  'fonts',
  'images',
  'icons',
  'docs',
  '.well-known',
  'chain-reaction-game',
  'm',
  'analytics.js',
];
const MIME = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

// Dev-server only: serve the root static folders at their real URLs.
function serveRootStatics() {
  return {
    name: 'serve-root-statics',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0]);
        const first = url.split('/')[1];
        if (!ROOT_STATIC.includes(first)) return next();
        if (url === '/m') {
          res.writeHead(302, { Location: '/m/' });
          return res.end();
        }
        let file = path.join(process.cwd(), url);
        if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream');
        createReadStream(file).pipe(res);
      });
    },
  };
}

export default defineConfig({
  root: 'site',
  base: '/',
  publicDir: false,
  plugins: [serveRootStatics()],
  build: {
    outDir: '..',
    emptyOutDir: false, // the repo root also holds the source and static folders
    sourcemap: false,
    assetsInlineLimit: 0,
  },
  server: {
    host: true,
  },
});
