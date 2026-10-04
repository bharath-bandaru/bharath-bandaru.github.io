import { onScroll, getLenis } from './scroll.js';
import { clamp } from './utils.js';

const SEPARATOR = '  •  ';
const REPEAT = 3;
const SLOW_RATE = 0.5; // About's lag per px of scroll once it is mostly gone

// Ribbon scene (pinned band layer behind the normally scrolling About; only
// the text slides along the bands). Each band's line is written once in the markup
// and repeated here three times, bullet-separated. The layer fades in after
// some scrolling on About and out once About releases, so nothing trails
// into Portfolio.
export function initTape() {
  const tape = document.getElementById('tape');
  if (!tape) return;
  const scene = tape.parentElement;
  const panel = scene.querySelector('.about-pin');
  const portfolioTitle = document.querySelector('#portfolio .v5-sticky h1');
  const photo = scene.querySelector('.dp img');
  const spans = [...tape.querySelectorAll('.tape-item > span')];
  const lines = spans.map((span) => span.textContent.trim());

  // Scroll range in which the layer is visible: from landing on About to the
  // end of the fade-out after About releases.
  // Scroll positions that drive the layer.
  const range = () => {
    const W = window.innerWidth;
    const start = scene.getBoundingClientRect().left + window.scrollX; // About lands
    const end = start + scene.offsetWidth - W; // scene ends, Portfolio enters
    // Fade-out runs from `hold` after the scene ends until the "Portfolio."
    // title is centred on screen (measured before it starts sticking).
    const title = portfolioTitle ? portfolioTitle.getBoundingClientRect() : null;
    const outTo = title ? title.left + window.scrollX + title.width / 2 - W / 2 : end + W / 2;
    // Fade-in ramps over `ramp` once the About photo reaches the left edge.
    // Once About is `slowFrom` gone it moves at half speed (SLOW_RATE) so it
    // lingers behind the ribbons, still leaving before the scene ends.
    return { W, start, end, ramp: W * 0.3, hold: W * 0.1, outTo, slowFrom: W * 0.7 };
  };

  const fill = () => {
    spans.forEach((span, i) => {
      span.textContent = Array(REPEAT).fill(lines[i]).join(SEPARATOR);
    });
  };

  const update = (scroll) => {
    const { W, start, end, ramp, hold, outTo, slowFrom } = range();
    if (panel) {
      const lag = Math.max(0, Math.min(scroll, end + W) - start - slowFrom) * SLOW_RATE;
      panel.style.transform = lag ? `translate3d(${lag}px, 0, 0)` : '';
    }
    const photoLeft = photo ? photo.getBoundingClientRect().left : 0;
    const fadeIn = clamp(-photoLeft / ramp, 0, 1);
    const fadeOut = clamp((outTo - scroll) / (outTo - end - hold), 0, 1);
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
