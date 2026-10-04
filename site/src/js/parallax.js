import { onScroll, getLenis } from './scroll.js';

// Locomotive v4 parallax, ported exactly (Smooth.transformElements, default
// position): translate = (scrollMiddle − elementMiddle) × −(speed / 10),
// updated only while the element is in view (elements keep their last value
// once out of view, and sit untransformed until first seen, as in v4).
// Elements carry the original v4 values in `data-parallax`. An optional
// `data-parallax-target` (v4 `data-scroll-target`) measures another element
// instead, so e.g. the tape bands all move while their section is in view.
// A `data-parallax-pin="<rate>"` (sticky) container drifts at <rate> of the
// scroll once it starts pinning (0 = fully still), and the parallax of the
// elements inside it freezes at that point, so pinned content keeps its
// landing layout and only the panel as a whole eases along.

export function initParallax(selector = '[data-parallax]') {
  let items = [];
  let pins = [];

  const currentTranslateX = (el) => {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    const m = t.match(/matrix(?:3d)?\(([^)]+)\)/);
    if (!m) return 0;
    const v = m[1].split(',').map(parseFloat);
    return v.length === 16 ? v[12] : v[4];
  };

  // Page-x where a pin container starts sticking: the start of its parent
  // (the pin sits at the parent's left edge). Its own rect is unreliable while
  // it is stuck, so read the parent instead.
  const pinStart = (pin, sx) => {
    const parent = pin.parentElement;
    return parent.getBoundingClientRect().left + sx - currentTranslateX(parent);
  };

  const measure = () => {
    const sx = window.scrollX;
    pins = [...document.querySelectorAll('[data-parallax-pin]')].map((el) => ({
      el,
      start: pinStart(el, sx),
      range: Math.max(0, el.parentElement.offsetWidth - el.offsetWidth),
      rate: parseFloat(el.dataset.parallaxPin) || 0,
    }));
    items = [...document.querySelectorAll(selector)].map((el) => {
      const target = el.dataset.parallaxTarget
        ? document.querySelector(el.dataset.parallaxTarget) || el
        : el;
      const r = target.getBoundingClientRect();
      const left = r.left + sx - currentTranslateX(target);
      const right = left + target.offsetWidth;
      const pin = el.closest('[data-parallax-pin]');
      return {
        el,
        speed: parseFloat(el.dataset.parallax) / 10,
        left,
        right,
        middle: (right - left) / 2 + left,
        freezeAt: pin ? pinStart(pin, sx) : Infinity,
      };
    });
  };

  const update = (scroll, all = false) => {
    const W = window.innerWidth;
    const scrollRight = scroll + W;
    for (const p of pins) {
      const over = Math.min(Math.max(scroll - p.start, 0), p.range);
      p.el.style.transform = `matrix3d(1,0,0.00,0,0.00,1,0.00,0,0,0,1,0,${-over * p.rate},0,0,1)`;
    }
    for (const it of items) {
      const inView = scrollRight >= it.left && scroll < it.right;
      if (!inView && !all) continue;
      const s = Math.min(scroll, it.freezeAt);
      const d = (s + W / 2 - it.middle) * -it.speed;
      it.el.style.transform = `matrix3d(1,0,0.00,0,0.00,1,0.00,0,0,0,1,0,${d},0,0,1)`;
    }
  };

  const refresh = () => {
    measure();
    const lenis = getLenis();
    update(lenis ? lenis.scroll : window.scrollX);
  };

  refresh();
  onScroll(({ scroll }) => update(scroll));
  window.addEventListener('resize', refresh);

  return { measure, update, refresh };
}
