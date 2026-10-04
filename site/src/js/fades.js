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
  const hiThere = $('education');
  const imagesSec = $('images-sec');
  const experience = $('experience');
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
    customFadeOutAnimation(hiThere, W - 300);
    customFadeOutAnimation(imagesSec, W - 300);
    customFadeInAnimationDisplayNone(education, logoimg, W - 300);
    customFadeOutAnimation(imagesSec, W - 300);
    customFadeInAnimationDisplayNone(imagesSec, social, W - 300);
    customFadeInAnimation(imagesSec, myProgress, W - 300);
    customFadeInAnimation(imagesSec, experience, W - 500);
  };

  onScroll(run);
  return run;
}
