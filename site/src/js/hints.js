import anime from 'animejs';
import { mqCoarse } from './caps.js';

// "scroll to navigate" hint: wording for touch screens and the two looping
// anime.js timelines from the reference (index.js:36-67).
export function initHints() {
  if (mqCoarse.matches) {
    const hint = document.querySelector('#prgs p');
    if (hint) hint.textContent = 'swipe to navigate';
  }

  anime
    .timeline({ loop: true })
    .add({
      targets: '.up-arrow',
      translateY: [5, 0],
      translateZ: 0,
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 1400,
      delay: (el, i) => 300 + 30 * i,
    })
    .add({
      targets: '.up-arrow',
      translateY: [0, -40],
      opacity: [1, 0],
      easing: 'easeInExpo',
      duration: 1200,
      delay: (el, i) => 100 + 30 * i,
    });

  anime
    .timeline({ loop: true })
    .add({
      targets: '.click-enter',
      translateZ: 0,
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 1400,
      delay: (el, i) => 300 + 30 * i,
    })
    .add({
      targets: '.click-enter',
      opacity: [1, 0],
      easing: 'easeInExpo',
      duration: 1100,
      delay: (el, i) => 100 + 30 * i,
    });
}
