import { onScroll } from './scroll.js';

// Ported verbatim from the reference index.js (customFadeOutAnimation 546-556,
// customFadeInAnimation 558-568, customFadeInAnimationDisplayNone 586-598).
// They read getBoundingClientRect().x, which is orientation-agnostic and works
// the same under native (Lenis) horizontal scrolling.

function customFadeOutAnimation(ele1, res) {
  if (ele1.getBoundingClientRect().x <= 0) {
    ele1.style.opacity = 1;
  } else {
    const op = (ele1.getBoundingClientRect().x - res) / res;
    if (op < 0 && Math.abs(op) >= 0 && Math.abs(op) <= 1) ele1.style.opacity = Math.abs(op);
    else ele1.style.opacity = 0;
  }
}

function customFadeInAnimation(ele2, ele3, res) {
  if (ele2.getBoundingClientRect().x <= 0) {
    ele3.style.opacity = 0;
  } else {
    const op = (ele2.getBoundingClientRect().x - res) / res;
    if (op < 0 && Math.abs(op) >= 0 && Math.abs(op) <= 1) ele3.style.opacity = 1 + op;
    else ele3.style.opacity = 1;
  }
}

function customFadeInAnimationDisplayNone(ele2, ele3, res) {
  if (ele2.getBoundingClientRect().x <= 0) {
    ele3.style.opacity = 0;
    ele3.classList.add('display-none');
  } else {
    ele3.classList.remove('display-none');
    const op = (ele2.getBoundingClientRect().x - res) / res;
    if (op < 0 && Math.abs(op) >= 0 && Math.abs(op) <= 1) ele3.style.opacity = 1 + op;
    else ele3.style.opacity = 1;
  }
}

// v4 `currentElements[id]` ≡ element intersects the viewport horizontally.
const inView = (el) => {
  const r = el.getBoundingClientRect();
  return r.right > 0 && r.left < window.innerWidth;
};

export function initFades() {
  const $ = (id) => document.getElementById(id);
  const sec0 = document.querySelector('#logo .splash');
  const sec1 = document.querySelector('#sec-1 .panel');
  const education = $('sec-1');
  const portfolio = $('portfolio');
  // Requested tweak: Education (now between Experience and the artworks) has
  // no fade at all — neither the original #education fade-in nor the fade-out
  // the section before the artworks used to get.
  const experienceSec = $('experience');
  const imagesSec = $('images-sec');
  const outro = $('outro');
  const banner = document.querySelector('.outro__banner');
  const prgs = $('prgs');
  const logoimg = $('logoimg');
  const social = $('social');
  const myProgress = $('myProgress');

  // Mirrors the lscroll.on('scroll') body at index.js:412-435, same call order.
  const run = () => {
    const W = window.innerWidth;
    if (inView(sec0) || inView(sec1)) {
      customFadeInAnimation(portfolio, prgs, W - 300);
    } else {
      prgs.style.opacity = 0;
    }
    customFadeOutAnimation(education, W - 300);
    customFadeOutAnimation(portfolio, W - 300);
    // Work Experience now follows the Portfolio; fade it in like Education did.
    customFadeOutAnimation(experienceSec, W - 300);
    customFadeOutAnimation(imagesSec, W - 300);
    customFadeInAnimationDisplayNone(education, logoimg, W - 300);
    customFadeOutAnimation(imagesSec, W - 300);
    customFadeInAnimationDisplayNone(imagesSec, social, W - 300);
    customFadeInAnimation(imagesSec, myProgress, W - 300);
    // Requested tweak: the artworks hide the fixed social icons (they carry
    // their own) and the progress bar, but the closing "Thanks again!" screen
    // brings both back, fading in as it slides on (same ramp as the other
    // fades). Runs last so it overrides the artworks' hide above.
    const ox = outro.getBoundingClientRect().x;
    if (ox < W - 300) {
      const opacity = ox <= 0 ? 1 : (W - 300 - ox) / (W - 300);
      social.classList.remove('display-none');
      social.style.opacity = opacity;
      myProgress.style.opacity = opacity;
    }
    // Requested tweak: once the closing screen fills the viewport, its content
    // stays pinned for a further 60vw of scroll (the section is 160vw wide)
    // and the banner card rises from below the screen over that stretch
    // (scroll-driven, eased). Keep the 0.6 in sync with #outro's width.
    if (banner) {
      const p = Math.min(1, Math.max(0, -ox / (W * 0.6)));
      const eased = 1 - Math.pow(1 - p, 3);
      const rise = (1 - eased) * window.innerHeight * 0.7;
      banner.style.transform = rise > 0.5 ? `translate3d(0, ${rise}px, 0)` : '';
      banner.style.opacity = eased * 0.75; // the banner tops out at 75% opacity
    }
  };

  onScroll(run);
  return run;
}
