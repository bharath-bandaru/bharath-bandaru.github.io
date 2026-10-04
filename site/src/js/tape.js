import { onScroll, getLenis } from './scroll.js';
import { clamp } from './utils.js';

const SEPARATOR = '  •  ';
const REPEAT = 3;

// Ribbon scene (About pinned under crossing bands; the band layer is pinned
// too, only the text slides). Each band's line is written once in the markup
// and repeated here three times, bullet-separated. The layer fades in after
// some scrolling on About and out once About releases, so nothing trails
// into Portfolio.
export function initTape() {
  const tape = document.getElementById('tape');
  if (!tape) return;
  const scene = tape.parentElement;
  const spans = [...tape.querySelectorAll('.tape-item > span')];
  const lines = spans.map((span) => span.textContent.trim());

  // Scroll range in which the layer is visible: from landing on About to the
  // end of the fade-out after About releases.
  const range = () => {
    const W = window.innerWidth;
    const start = scene.getBoundingClientRect().left + window.scrollX;
    const end = start + scene.offsetWidth - W;
    // Fade-in waits `delay` of scrolling past the landing, so the About screen
    // reads clean first, then ramps over `ramp`. Fade-out starts `hold` after
    // About releases and ends when Portfolio's leading edge reaches the centre
    // of the screen (it enters at the release, so that is W/2 later).
    return { W, start, end, ramp: W * 0.3, delay: W * 0.7, hold: W * 0.1, outEnd: W * 0.46 };
  };

  const fill = () => {
    spans.forEach((span, i) => {
      span.textContent = Array(REPEAT).fill(lines[i]).join(SEPARATOR);
    });
  };

  const update = (scroll) => {
    const { start, end, ramp, delay, hold, outEnd } = range();
    const fadeIn = clamp((scroll - start - delay) / ramp, 0, 1);
    const fadeOut = clamp(1 - (scroll - end - hold) / (outEnd - hold), 0, 1);
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
