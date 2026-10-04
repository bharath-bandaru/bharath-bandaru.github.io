import { onScroll, getLenis } from './scroll.js';

// Locomotive v4 parallax, ported exactly (Smooth.transformElements, default
// position): translate = (scrollMiddle − elementMiddle) × −(speed / 10),
// updated only while the element is in view (elements keep their last value
// once out of view, and sit untransformed until first seen, as in v4).
// Elements carry the original v4 values in `data-parallax`.

export function initParallax(selector = '[data-parallax]') {
  let items = [];

  const currentTranslateX = (el) => {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    const m = t.match(/matrix(?:3d)?\(([^)]+)\)/);
    if (!m) return 0;
    const v = m[1].split(',').map(parseFloat);
    return v.length === 16 ? v[12] : v[4];
  };

  const measure = () => {
    const sx = window.scrollX;
    items = [...document.querySelectorAll(selector)].map((el) => {
      const r = el.getBoundingClientRect();
      const left = r.left + sx - currentTranslateX(el);
      const right = left + el.offsetWidth;
      return {
        el,
        speed: parseFloat(el.dataset.parallax) / 10,
        left,
        right,
        middle: (right - left) / 2 + left,
      };
    });
  };

  const update = (scroll, all = false) => {
    const W = window.innerWidth;
    const scrollRight = scroll + W;
    const scrollMiddle = scroll + W / 2;
    for (const it of items) {
      const inView = scrollRight >= it.left && scroll < it.right;
      if (!inView && !all) continue;
      const d = (scrollMiddle - it.middle) * -it.speed;
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
