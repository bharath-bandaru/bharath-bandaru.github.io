import { onScroll } from './scroll.js';

// The reference summed section widths × per-section progress and divided by
// limit.x (index.js:511-539), which amounts to overall scroll progress. Lenis
// hands that to us directly.
export function initProgress() {
  const bar = document.getElementById('myBar');
  bar.style.width = '0%';
  onScroll(({ progress }) => {
    bar.style.width = `${Math.min(100, Math.max(0, progress * 100))}%`;
  });
}
