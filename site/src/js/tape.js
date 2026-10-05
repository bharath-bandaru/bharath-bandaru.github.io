import { onScroll, getLenis } from './scroll.js';
import { clamp } from './utils.js';

const SEPARATOR = '  \u2022  ';
const REPEAT = 3;
const FADE_LERP = 0.08; // per-frame easing of the layer's opacity toward its scroll target
const SLOW_RATE = 0.8; // the artworks' lag per px of scroll while the ribbons build (≈ 20% speed)

// Ribbon scene closing the strip, over the end of the artworks: a fixed layer
// of crossing bands; only the text slides along them (scroll-driven here, see
// `speeds`). Each band's line is written once in the markup and repeated
// here three times, bullet-separated. Once the artworks' trailing ". . ."
// (marked data-tape-anchor) has come into view on the right the ribbons fade
// in and the artworks drop to a crawl behind them (so there is no empty
// stretch); as the closing "Thanks again!" screen (the section after the
// scene) slides in, the ribbons fade out — together with the artworks, which
// pick up full speed again for that last stretch.
export function initTape() {
  const tape = document.getElementById('tape');
  if (!tape) return;
  const scene = tape.parentElement;
  const next = scene.nextElementSibling; // the outro; null if the scene ever closes the strip
  // The section before the scene fades with the ribbons; the crawl (translate)
  // is applied to its [data-tape-panel] child when it has one, so a sticky
  // header inside the section is not dragged along (a transform on the
  // section would shift its sticky descendants).
  const section = scene.previousElementSibling;
  const panel = (section && section.querySelector('[data-tape-panel]')) || section;
  const anchor = document.querySelector('[data-tape-anchor]');
  const spans = [...tape.querySelectorAll('.tape-item > span')];
  const lines = spans.map((span) => span.textContent.trim());
  // Band text speeds (tenths of the scroll distance since the ribbons began),
  // alternating direction so neighbouring bands cross. Driven here rather than
  // by parallax.js so the bands move from the moment they fade in — the scene
  // section itself is still off to the right at that point.
  const speeds = spans.map((span, i) => ((parseFloat(span.dataset.tapeSpeed) || 3) / 10) * (i % 2 ? 1 : -1));

  let lag = 0; // current translateX of the section crawling behind the ribbons

  // Scroll positions that drive the layer.
  const range = () => {
    const W = window.innerWidth;
    const sceneLeft = scene.getBoundingClientRect().left + window.scrollX;
    const sceneEnd = sceneLeft + scene.offsetWidth;
    // Trigger: the anchor (untransformed) about 85% of the way across the
    // screen, i.e. just after the gallery's trailing ". . ." comes into view,
    // so the artworks slow down and the ribbons start while that end is
    // still on the right.
    const a = anchor ? anchor.getBoundingClientRect() : null;
    const from = a ? a.left + window.scrollX - lag + a.width / 2 - W * 0.85 : sceneLeft - W * 0.6;
    // Fade-out ends when the next section fills the screen, starting half a
    // screen earlier. (With no next section the end would lie past the maximum
    // scroll, so the ribbons would never fade out.)
    const outTo = next ? next.getBoundingClientRect().left + window.scrollX : sceneEnd;
    return { from, ramp: W * 0.3, outFrom: outTo - W * 0.5, outTo };
  };

  const fill = () => {
    spans.forEach((span, i) => {
      span.textContent = Array(REPEAT).fill(lines[i]).join(SEPARATOR);
    });
  };

  // The scroll-driven opacity is the target; the painted opacity eases toward
  // it over a few frames, so a fast wheel flick fades the ribbons in instead of
  // popping them.
  let target = 0;
  let shown = 0;
  let raf = 0;
  const tick = () => {
    shown += (target - shown) * FADE_LERP;
    if (Math.abs(target - shown) < 0.002) shown = target;
    tape.style.opacity = shown;
    raf = shown === target ? 0 : requestAnimationFrame(tick);
  };

  const update = (scroll) => {
    const { from, ramp, outFrom, outTo } = range();
    const past = Math.min(scroll, outTo) - from;
    const fadeIn = clamp(past / ramp, 0, 1);
    const fadeOut = clamp((outTo - scroll) / (outTo - outFrom), 0, 1);
    // The crawl only lasts while the ribbons build and hold; once they start
    // fading out (scroll ≥ outFrom) the lag stops growing, so the artworks
    // move at full scroll speed again while the ribbons disappear.
    lag = clamp(past, 0, Math.max(0, outFrom - from)) * SLOW_RATE;
    const travel = Math.max(0, scroll - from);
    spans.forEach((span, i) => {
      span.style.transform = `translate3d(${travel * speeds[i]}px, 0, 0)`;
    });
    if (panel) panel.style.transform = lag ? `translate3d(${lag}px, 0, 0)` : '';
    // The section fades out with the ribbons, so its tail is gone by the time
    // the next section fills the screen.
    if (section) section.style.opacity = fadeOut;
    target = Math.min(fadeIn, fadeOut);
    if (!raf) tick();
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
