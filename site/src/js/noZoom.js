// Requested tweak: no pinch / double-tap zoom on touch devices. The viewport
// meta already says user-scalable=no, but iOS Safari ignores that for
// accessibility, so this backs it up: `touch-action: pan-x pan-y` on the root
// (see _loco-v5.scss) plus the Safari gesture events and multi-touch moves.
export function initNoZoom() {
  const block = (e) => e.preventDefault();
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) =>
    document.addEventListener(t, block, { passive: false }),
  );
  document.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1 || (typeof e.scale === 'number' && e.scale !== 1)) e.preventDefault();
    },
    { passive: false },
  );
  // Double-tap zoom: swallow a second tap within 300ms.
  let last = 0;
  document.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - last < 300) e.preventDefault();
      last = now;
    },
    { passive: false },
  );
}
