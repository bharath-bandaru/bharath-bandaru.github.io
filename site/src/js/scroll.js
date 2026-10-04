import LocomotiveScroll from 'locomotive-scroll';
import { cubicBezier } from './utils.js';
import { isTouch, mqReduced } from './caps.js';

// Single Locomotive Scroll v5 (Lenis) instance driving the horizontal strip.
// Wheel input (vertical or horizontal) moves the strip with lerp 0.1 like v4;
// on touch screens Lenis owns touch so swipes in either axis move it.

let instance = null;
const listeners = new Set();

export function initScroll() {
  const reduced = mqReduced.matches;
  instance = new LocomotiveScroll({
    lenisOptions: {
      orientation: 'horizontal',
      gestureOrientation: 'both',
      smoothWheel: !reduced,
      lerp: reduced ? 1 : 0.1,
      wheelMultiplier: 1,
      // On touch screens Lenis owns touch so swipes in either axis move the strip.
      syncTouch: isTouch,
      syncTouchLerp: reduced ? 1 : 0.1,
      touchMultiplier: isTouch ? 1.8 : 1,
      touchInertiaExponent: 1.7,
      autoResize: true,
    },
    // Started explicitly once the intro's auto-scroll runs (see main.js);
    // Locomotive's autoStart would otherwise re-enable scrolling asynchronously.
    autoStart: false,
    triggerRootMargin: '-1px -1px -1px -1px',
    rafRootMargin: '100% 100% 100% 100%',
    scrollCallback: (lenis) => {
      for (const fn of listeners) fn(lenis);
    },
  });
  instance.lenisInstance.stop(); // blocks wheel/touch and native scrolling (lenis-stopped)
  return instance;
}

export const getLenis = () => instance?.lenisInstance;

export function onScroll(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Locomotive v4's scrollTo (Smooth.js): the scroll *target* moves along a
// cubic-bezier(0.25, 0, 0.35, 1) curve over 1000 ms while the lerp (0.1)
// smoothing trails behind it. Reproduced by re-targeting Lenis every frame.
const v4Ease = cubicBezier(0.25, 0, 0.35, 1);
let scrollToFrame = null;

export function scrollToSection(target, opts = {}) {
  if (!instance) return;
  const lenis = getLenis();
  if (mqReduced.matches) {
    instance.scrollTo(target, { ...opts, immediate: true });
    return;
  }
  const el = typeof target === 'string' ? document.querySelector(target) : target;
  let end;
  if (typeof target === 'number') end = target;
  else if (el) {
    const r = el.getBoundingClientRect();
    end = (lenis.isHorizontal ? r.left : r.top) + lenis.animatedScroll;
  } else return;
  end = Math.max(0, Math.min(lenis.limit, end));
  const start = lenis.targetScroll;
  const duration = opts.duration ?? 920; // v4: 1000 ms; trimmed for the one-frame start latency of the rAF loop
  if (scrollToFrame) cancelAnimationFrame(scrollToFrame);
  const t0 = performance.now();
  // `lock: true` makes Lenis ignore user input until the target is reached
  // (used for the intro's auto-scroll); `onComplete` fires once it has settled.
  const frame = (now) => {
    const p = Math.min(1, (now - t0) / duration);
    const value = start + (end - start) * v4Ease(p);
    lenis.scrollTo(value, {
      lerp: 0.19,
      programmatic: true,
      force: true,
      lock: !!opts.lock,
      onComplete: p >= 1 ? opts.onComplete : undefined,
    });
    scrollToFrame = p < 1 ? requestAnimationFrame(frame) : null;
  };
  scrollToFrame = requestAnimationFrame(frame);
}

export const stopScroll = () => instance?.stop();
export const startScroll = () => instance?.start();
export const resizeScroll = () => instance?.resize();
const isStopped = () => !!getLenis()?.isStopped;

// Native keys don't move a horizontal document through Lenis; map them.
export function initKeyboardScroll() {
  window.addEventListener('keydown', (e) => {
    if (!instance || isStopped()) return;
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const lenis = getLenis();
    const step = window.innerWidth * 0.8;
    let target = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case 'PageDown':
      case ' ':
        target = lenis.scroll + step;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        target = lenis.scroll - step;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = lenis.limit;
        break;
      default:
        return;
    }
    e.preventDefault();
    instance.scrollTo(Math.max(0, Math.min(lenis.limit, target)));
  });
}
