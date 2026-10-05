import { onScroll, getLenis } from './scroll.js';
import { clamp } from './utils.js';

const SEPARATOR = '  \u2022  ';
const REPEAT = 3;
const FADE_LERP = 0.08; // per-frame easing of the layer's opacity toward its scroll target
const SLOW_RATE = 0.95; // experience's lag per px of scroll while the ribbons show (≈ 5% speed)

// Ribbon scene over the end of Work Experience: a fixed layer of crossing
// bands; only the text slides along them (parallax keyed off the scene
// section). Each band's line is written once in the markup and repeated here
// three times, bullet-separated. Once the last experience card reaches the
// centre of the screen the ribbons fade in and the experience section drops to
// a crawl behind them (so there is no empty stretch), until the artworks header
// ("Thanks for stopping by") slides in over it; the ribbons are gone when that
// header fills the screen.
export function initTape() {
  const tape = document.getElementById('tape');
  if (!tape) return;
  const scene = tape.parentElement;
  const next = document.getElementById('images-sec');
  const panel = document.getElementById('experience');
  const anchor = document.querySelector('[data-tape-anchor]');
  const spans = [...tape.querySelectorAll('.tape-item > span')];
  const lines = spans.map((span) => span.textContent.trim());

  let lag = 0; // current translateX of the experience section

  // Scroll positions that drive the layer.
  const range = () => {
    const W = window.innerWidth;
    const sceneLeft = scene.getBoundingClientRect().left + window.scrollX;
    const sceneEnd = sceneLeft + scene.offsetWidth;
    // Trigger: the last experience card (untransformed) centred on screen.
    const a = anchor ? anchor.getBoundingClientRect() : null;
    const from = a ? a.left + window.scrollX - lag + a.width / 2 - W / 2 : sceneLeft - W * 0.6;
    // Fade-out ends when the artworks header fills the screen, starting half
    // a screen earlier.
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
    lag = Math.max(0, past) * SLOW_RATE;
    if (panel) panel.style.transform = lag ? `translate3d(${lag}px, 0, 0)` : '';
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
