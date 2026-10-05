// One-shot image optimizer. Pulls the images the portfolio markup uses from the
// reference project, converts them to WebP at their rendered size, and writes a
// manifest with the output dimensions (used for <img width/height>).
//
//   node scripts/optimize-images.mjs --src /path/to/my-portfolio/src/images
import { mkdir, copyFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const argv = process.argv.slice(2);
const srcIdx = argv.indexOf('--src');
const SRC = srcIdx >= 0 ? argv[srcIdx + 1] : null;
if (!SRC) {
  console.error('usage: node scripts/optimize-images.mjs --src /path/to/my-portfolio/src/images');
  process.exit(1);
}
const OUT = path.resolve('site/src/assets/images');

// [source file, output file, { width?, height?, quality? }]
const pictures = [
  ['artwork-dark-2.png', 'splash.webp', { quality: 85 }],
  ['dp.png', 'dp.webp', { quality: 85 }],
  ['roamates.png', 'projects/roamates.webp', { width: 700 }],
  ['chain.png', 'projects/chain.webp', { height: 1000 }],
  ['escape.png', 'projects/escape.webp', { width: 1000 }],
  ['chatgpt.png', 'projects/chatgpt.webp', { height: 1000 }],
  ['project-6.png', 'projects/project-6.webp', {}],
  ['screenshot.png', 'projects/screenshot.webp', {}],
  ['fickle.png', 'projects/fickle.webp', {}],
  // projects/anti-ragging-press.webp was made separately from a press clipping
  // (IMG_2561.JPG, 450×754) at width 560, quality 82.
  // projects/ux-india.webp was made separately from a conference photo
  // (IMG_20161022_185631.jpg, 3264×2448) at width 760, quality 80.
  // projects/ux-india-app.webp was made separately from an app screenshot
  // (Screenshot_2016-10-09-18-21-42.png) at height 800, quality 82.
  // experience/scripted.webp was made separately from 1-Scripted-Logo.png
  // (trimmed, alpha, height 84 = 3× the 28px chip); experience/jpmorgan.webp
  // from JP-Morgan-Chase-Emblem.png (trimmed, alpha, height 156 = 3× 52px).
  // experience/illinois-tech.webp (illinois-institute-of-technology-logo-png_
  // seeklogo-488855.png) and experience/vnrvjiet.webp (Official_logo_of_VNRVJIET.png)
  // were trimmed and exported at height 120 (3× the 40px education chips).
  // projects/chain-banner.webp was made separately from the game's store banner
  // (banner-1.webp, 3542×1778) at width 960, quality 82.
  // outro-banner.webp was made separately from the YouTube channel banner
  // (channels4_banner.jpg, 2556×424) at width 1400, quality 82.
  ['one kitchen.png', 'experience/one-kitchen.webp', {}],
  ['logo for dark bg.png', 'experience/logo-dark-bg.webp', { height: 240 }],
];

const copies = [
  ['anim.gif', 'projects/anim.gif'],
  ['18.jpg', 'reveal.jpg'],
  ['git.svg', 'ui/git.svg'],
  ['link.svg', 'ui/link.svg'],
  ['pin.svg', 'ui/pin.svg'],
  ['north_white_24dp.svg', 'ui/north.svg'],
  ['close_white_24dp.svg', 'ui/close.svg'],
  ['alternate_email_white_24dp.svg', 'ui/email.svg'],
  ['sms_white_24dp.svg', 'ui/sms.svg'],
  ['expand_less_white_24dp.svg', 'ui/expand-less.svg'],
  ['expand_more_white_24dp.svg', 'ui/expand-more.svg'],
];

// Artwork JPGs referenced by the reference index.html (mixed .jpg/.JPG case).
const artworks = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 19, 20, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32,
  33, 34, 35, 36, 37, 38, 40, 41, 43, 44, 45, 48, 49, 50,
];

const manifest = {};

async function findArtwork(n) {
  const files = await readdir(SRC);
  return files.find((f) => f === `${n}.jpg` || f === `${n}.JPG`);
}

async function convert(src, out, { width, height, quality = 82 }) {
  const dest = path.join(OUT, out);
  await mkdir(path.dirname(dest), { recursive: true });
  let img = sharp(path.join(SRC, src));
  if (width || height) img = img.resize({ width, height, fit: 'inside', withoutEnlargement: true });
  const info = await img.webp({ quality }).toFile(dest);
  manifest[out] = { width: info.width, height: info.height };
  console.log(`${src} -> ${out} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)}K`);
}

for (const [src, out, opts] of pictures) await convert(src, out, opts);

for (const [src, out] of copies) {
  const dest = path.join(OUT, out);
  await mkdir(path.dirname(dest), { recursive: true });
  await copyFile(path.join(SRC, src), dest);
  if (/\.(gif|jpg)$/.test(out)) {
    const meta = await sharp(dest).metadata();
    manifest[out] = { width: meta.width, height: meta.height };
  }
  console.log(`${src} -> ${out} (copied)`);
}

for (const n of artworks) {
  const file = await findArtwork(n);
  if (!file) {
    console.warn(`missing artwork ${n}`);
    continue;
  }
  await convert(file, `artworks/${n}.webp`, { width: 1200, height: 1200, quality: 80 });
}

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote manifest with ${Object.keys(manifest).length} entries`);
