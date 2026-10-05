import { onScroll, getLenis } from './scroll.js';
import { clamp } from './utils.js';

const SEPARATOR = '  •  ';
const REPEAT = 3;
const SLOW_RATE = 0.95; // About's lag per px of scroll once the ribbons start (≈ 5% speed)
const TRIGGER = 0.1; // ribbons start this fraction of a screen after landing on About

// Ribbon scene: a fixed band layer over About; only the text slides along the
// bands (parallax). Each band's line is written once in the markup and
// repeated here three times, bullet-separated. Shortly after landing on About
// the layer fades in while About, still centred, drops to a crawl behind it;
// both fade out together over the start of Portfolio.
export function initTape() {
  const tape = document.getElementById('tape');
  if (!tape) return;
  const scene = tape.parentElement;
  const panel = scene.querySelector('.about-pin');
  const portfolioTitle = document.querySelector('#portfolio .v5-sticky h1');
  const spans = [...tape.querySelectorAll('.tape-item > span')];
  const lines = spans.map((span) => span.textContent.trim());

  // Scroll positions that drive the layer.
  const range = () => {
    const W = window.innerWidth;
    const start = scene.getBoundingClientRect().left + window.scrollX; // About lands
    const end = start + scene.offsetWidth - W; // scene ends, Portfolio enters
    const slowFrom = W * TRIGGER; // ribbons start, About starts crawling
    // Fade-out runs from `hold` after the scene ends until the "Portfolio."
    // title is centred on screen (measured before it starts sticking).
    const title = portfolioTitle ? portfolioTitle.getBoundingClientRect() : null;
    const outTo = title ? title.left + window.scrollX + title.width / 2 - W / 2 : end + W / 2;
    return { W, start, end, ramp: W * 0.3, hold: W * 0.1, outTo, slowFrom };
  };

  const fill = () => {
    spans.forEach((span, i) => {
      span.textContent = Array(REPEAT).fill(lines[i]).join(SEPARATOR);
    });
  };

  const update = (scroll) => {
    const { W, start, end, ramp, hold, outTo, slowFrom } = range();
    const past = Math.min(scroll, end + W) - start - slowFrom; // scroll since the ribbons started
    const fadeIn = clamp(past / ramp, 0, 1);
    const fadeOut = clamp((outTo - scroll) / (outTo - end - hold), 0, 1);
    if (panel) {
      const lag = Math.max(0, past) * SLOW_RATE;
      panel.style.transform = lag ? `translate3d(${lag}px, 0, 0)` : '';
      panel.style.opacity = fadeOut;
      panel.style.pointerEvents = fadeOut < 1 ? 'none' : '';
      panel.toggleAttribute('data-parallax-hold', past > 0); // keep the inner parallax still
    }
    tape.style.opacity = Math.min(fadeIn, fadeOut);
  };

  const refresh = () => {
    fill();
    const lenis = getLenis();
    update(lenis ? lenis.scroll : window.scrollX);
  };

  refresh();
  document.fonts.ready.then(refresh);
  onScroll(({ scroll }) => update(scroll));
  window.addEventListener('resize', refresh);
}
