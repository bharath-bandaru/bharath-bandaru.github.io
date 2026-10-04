import anime from 'animejs';
import { startScroll, stopScroll } from './scroll.js';

// Reference index.js:441-509: test() → close(), test1() → open(), toggle().
// Added: the strip is locked while the drawer is open, Escape closes it.
export function initContact() {
  const closeTop = document.getElementById('contact-top');
  const closeBottom = document.getElementById('contact-bottom');
  let isClicked = false;

  function close() {
    isClicked = false;
    anime.timeline({ loop: false }).add({
      targets: '.contact-bottom',
      translateY: [0, 20],
      opacity: [1, 0],
      easing: 'easeOutExpo',
      duration: 1200,
      delay: (el, i) => 100 + 30 * i,
    });
    anime.timeline({ loop: false }).add({
      targets: '.contact-top',
      translateY: [0, 20],
      opacity: [1, 0],
      easing: 'easeOutExpo',
      duration: 1200,
      delay: (el, i) => 100 + 30 * i,
    });
    setTimeout(() => {
      closeBottom.classList.add('display-none');
      closeTop.classList.add('display-none');
    }, 500);
    startScroll();
  }

  function open() {
    isClicked = true;
    closeBottom.classList.remove('display-none');
    closeTop.classList.remove('display-none');
    anime.timeline({ loop: false }).add({
      targets: '.contact-bottom',
      translateY: [15, 0],
      translateZ: 0,
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 500,
      delay: (el, i) => 100 + 30 * i,
    });
    anime.timeline({ loop: false }).add({
      targets: '.contact-top',
      translateY: [15, 0],
      translateZ: 0,
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 500,
      delay: (el, i) => 100 + 30 * i,
    });
    stopScroll();
  }

  function toggle() {
    if (isClicked) close();
    else open();
  }

  document.getElementById('closeContact').addEventListener('click', close);
  document.getElementById('contact').addEventListener('click', toggle);
  closeTop.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isClicked) close();
  });

  return { open, close, toggle, isOpen: () => isClicked };
}
