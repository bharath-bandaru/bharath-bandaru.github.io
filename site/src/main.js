// Entry point. Boot order mirrors the reference index.js: hint loops → scroll
// engine (created stopped) → progress / fades / parallax / scrollbar / contact
// → pointer-only effects → preloader, whose enter step starts scrolling and
// eases the strip to the About section.
import 'locomotive-scroll/dist/locomotive-scroll.css';
import '@fontsource/source-code-pro/400.css';
import './styles/main.scss';

import { pointerFx } from './js/caps.js';
import { preloadImages } from './js/utils.js';
import { initHints } from './js/hints.js';
import {
  initScroll,
  initKeyboardScroll,
  scrollToSection,
  resizeScroll,
  startScroll,
} from './js/scroll.js';
import { initFades } from './js/fades.js';
import { initProgress } from './js/progress.js';
import { initScrollbar } from './js/scrollbar.js';
import { initParallax } from './js/parallax.js';
import { initTape } from './js/tape.js';
import { initCarousels } from './js/carousel.js';
import { runPreloader } from './js/preloader.js';
import { initContact } from './js/contact.js';
import { initCursor } from './js/cursor.js';
import { initHoverReveal } from './js/hoverReveal.js';

history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

initHints();

// Created at load like the reference, but user scrolling stays disabled until
// the intro's auto-scroll to About has settled (see runPreloader below).
initScroll();
initKeyboardScroll();
initProgress();
const contact = initContact();
const runFades = initFades();
const parallax = initParallax();
initTape();
initCarousels();
initScrollbar();

if (pointerFx()) {
  initCursor();
  initHoverReveal();
}

document.getElementById('name-header').addEventListener('click', () => {
  if (contact.isOpen()) contact.close();
  scrollToSection('#sec-1');
});

Promise.all([
  preloadImages('.splash-content img'),
  preloadImages('.art-work img'),
  document.fonts.ready,
]).then(() => {
  document.body.classList.remove('loading');
  resizeScroll();
  parallax.refresh();
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) resizeScroll();
});

runPreloader({
  onEnter: () => {
    startScroll();
    resizeScroll();
    parallax.refresh();
    // Input stays locked (Lenis `lock`) until this auto-scroll has settled.
    scrollToSection('#sec-1', { lock: true });
    runFades();
  },
});
