import anime from 'animejs';
import { mqCoarse } from './caps.js';

// "scroll to navigate" hint and the two looping anime.js timelines from the
// reference (index.js:36-67). Requested tweak: on touch screens the hint reads
// "swipe to navigate" with the arrow on its left, pointing left (the swipe
// direction) and gliding leftwards instead of upwards.
export function initHints() {
  const swipe = mqCoarse.matches;
  if (swipe) {
    const hint = document.querySelector('#prgs p');
    const arrow = document.querySelector('#prgs .up-arrow');
    if (hint) {
      hint.textContent = 'swipe to navigate';
      hint.classList.remove('mr-10'); // the arrow now leads, so it carries the gap
    }
    if (hint && arrow) hint.parentElement.insertBefore(arrow, hint); // arrow on the left of the text
    document.querySelectorAll('.up-arrow').forEach((el) => el.classList.add('up-arrow--left'));
  }
  const axis = swipe ? 'translateX' : 'translateY';

  anime
    .timeline({ loop: true })
    .add({
      targets: '.up-arrow',
      [axis]: [5, 0],
      translateZ: 0,
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 1400,
      delay: (el, i) => 300 + 30 * i,
    })
    .add({
      targets: '.up-arrow',
      [axis]: [0, -40],
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
