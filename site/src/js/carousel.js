import { mqReduced } from './caps.js';

const INTERVAL = 3500;

// Auto-advancing image carousel for portfolio cards ([data-carousel]): the
// slides cross-fade, the dots show and select the current slide, and the timer
// only runs while the carousel is on screen. Reduced motion: no auto-advance.
export function initCarousels() {
  document.querySelectorAll('[data-carousel]').forEach((root) => {
    const slides = [...root.querySelectorAll('.carousel__slide')];
    const dots = [...root.querySelectorAll('.carousel__dots button')];
    if (slides.length < 2) return;
    let index = 0;
    let timer = null;

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === index));
      dots.forEach((d, k) => d.classList.toggle('is-active', k === index));
    };
    const start = () => {
      if (timer || mqReduced.matches) return;
      timer = setInterval(() => show(index + 1), INTERVAL);
    };
    const stop = () => {
      clearInterval(timer);
      timer = null;
    };

    dots.forEach((d, k) =>
      d.addEventListener('click', () => {
        show(k);
        stop();
        start();
      }),
    );

    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(root);
  });
}
