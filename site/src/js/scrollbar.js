import { getLenis, onScroll, scrollToSection } from './scroll.js';

// Recreates Locomotive v4's horizontal `.c-scrollbar` (styles ported in
// _styles.scss): a 10px bar at the bottom, visible while scrolling, thumb
// width sbW² / (limit + sbW), draggable.
export function initScrollbar() {
  const html = document.documentElement;
  const bar = document.createElement('span');
  bar.className = 'c-scrollbar';
  const thumb = document.createElement('span');
  thumb.className = 'c-scrollbar_thumb';
  bar.appendChild(thumb);
  document.body.appendChild(bar);

  let sbW = 0;
  let thumbW = 0;
  let hideTimer = null;

  const size = () => {
    const lenis = getLenis();
    if (!lenis) return;
    sbW = bar.getBoundingClientRect().width || window.innerWidth;
    const limit = Math.max(lenis.limit, 1);
    thumbW = (sbW * sbW) / (limit + sbW);
    thumb.style.width = `${thumbW}px`;
    position(lenis);
  };

  const position = (lenis) => {
    const limit = Math.max(lenis.limit, 1);
    const x = (lenis.scroll / limit) * (sbW - thumbW);
    thumb.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  onScroll((lenis) => {
    position(lenis);
    html.classList.add('has-scroll-scrolling');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => html.classList.remove('has-scroll-scrolling'), 300);
  });

  new ResizeObserver(size).observe(html);
  window.addEventListener('resize', size);
  size();

  // Thumb drag (v4 has-scroll-dragging).
  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  thumb.addEventListener('pointerdown', (e) => {
    const lenis = getLenis();
    if (!lenis) return;
    dragging = true;
    startX = e.clientX;
    startScroll = lenis.scroll;
    html.classList.add('has-scroll-dragging');
    thumb.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  thumb.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const lenis = getLenis();
    const ratio = lenis.limit / Math.max(sbW - thumbW, 1);
    scrollToSection(startScroll + (e.clientX - startX) * ratio, { immediate: true });
  });
  const end = () => {
    if (!dragging) return;
    dragging = false;
    html.classList.remove('has-scroll-dragging');
  };
  thumb.addEventListener('pointerup', end);
  thumb.addEventListener('pointercancel', end);

  return { resize: size };
}
