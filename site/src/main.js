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
import { initMagneticButton } from './js/buttonCtrl.js';
import { initResumePanel } from './js/resumePanel.js';
import { initNoZoom } from './js/noZoom.js';

history.scrollRestoration = 'manual';
initNoZoom();
window.scrollTo(0, 0);

initHints();

// Created at load like the reference, but user scrolling stays disabled until
// the intro's auto-scroll to About has settled (see runPreloader below).
initScroll();
initKeyboardScroll();
initProgress();
const contact = initContact();
// Resume icon (top right): hover peeks the sheet, click slides it open.
initResumePanel({
  trigger: document.querySelector('.resume-social'),
  panel: document.getElementById('resume-panel'),
  onOpen: () => {
    if (contact.isOpen()) contact.close();
  },
});
const runFades = initFades();
const parallax = initParallax();
initTape();
initCarousels();
initScrollbar();

if (pointerFx()) {
  const cursor = initCursor();
  initHoverReveal();
  // "Hire me" behaves like the original site's Reload button: magnetic, with
  // the inverted hover look and the sliding label; the cursor grows with it.
  initMagneticButton(document.getElementById('hireMe'), {
    onEnter: () => cursor && cursor.enter(),
    onLeave: () => cursor && cursor.leave(),
  });
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
