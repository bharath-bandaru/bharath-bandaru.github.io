import anime from 'animejs';
import { mqFine, mqReduced } from './caps.js';

// Ported from the reference index.js:161-394. Timings (requested tweak: the
// terminal phase is faster than the reference's — bar at 25 ms/step instead of
// 50, no 1 s countdown before it and no hold after it):
//   t=0      "BHARATH BANDARU" → "CROSSING OCEANS TO FETCH DATA .."
//   t=4000   name screen hidden, terminal visible, loading bar starts
//   t≈5900   bar complete (75 × 25ms): terminal hides, fixed UI fades in,
//            page scrolls to About (onEnter)
// Removed: the "bigger screen" gate and the page reload that served it.
// Added: tap on the terminal skips (touch has no Enter key).

export function runPreloader({ onEnter }) {
  const $ = (id) => document.getElementById(id);
  const enter1 = $('enter-1');
  const enter2 = $('enter-2');
  const enter3 = $('enter-3');
  const name = $('name-header');
  const preLoader = $('start-name');
  const terminal = $('terminal');
  const contact = $('contact');
  const social = $('social');
  const progressHide = $('progressHide');
  const introCredit = $('intro-credit');

  [contact, enter1, enter2, enter3, name, social, progressHide].forEach((el) =>
    el.classList.add('display-none'),
  );

  let timeleft = 1;
  let clickedEnter = false;
  let entered = false;
  let nameTimer = null;

  preLoader.textContent = 'BHARATH BANDARU';
  startAnime();

  // The terminal window stays hidden (black backdrop only) while the name
  // screen plays; in the reference it sat below the fold during that phase.
  const drag = $('drag');
  const showTerminal = () => {
    drag.classList.remove('display-none');
    if (introCredit) introCredit.classList.remove('display-none');
  };

  nameTimer = setInterval(() => {
    timeleft--;
    if (timeleft <= 0) {
      preLoader.classList.add('display-none');
      showTerminal();
      enterLoader();
      clearInterval(nameTimer);
    }
  }, 4000);

  function startAnime() {
    anime
      .timeline({ loop: false })
      .add({
        targets: '.start-name',
        translateY: [10, 0],
        translateZ: 0,
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 600,
        delay: (el, i) => 300 + 30 * i,
      })
      .add({
        targets: '.start-name',
        translateY: [0, -10],
        opacity: [1, 0],
        easing: 'easeInExpo',
        duration: 600,
        delay: (el, i) => 100 + 30 * i,
        complete: function () {
          preLoader.textContent = 'CROSSING OCEANS TO FETCH DATA ..';
          anime.timeline({ loop: false }).add({
            targets: '.start-name',
            translateY: [10, 0],
            translateZ: 0,
            opacity: [0, 1],
            easing: 'easeOutExpo',
            duration: 1000,
            delay: (el, i) => 300 + 30 * i,
          });
        },
      });
  }

  function enterLoader() {
    $('countdown').innerHTML = '';
    if (!clickedEnter) enterPage();
  }

  const currentdate = new Date();
  const datetime =
    currentdate.toLocaleString('default', { weekday: 'long' }).substring(0, 3) +
    ' ' +
    currentdate.toLocaleString('default', { month: 'long' }) +
    ' ' +
    currentdate.getDate() +
    ' ' +
    currentdate.getHours() +
    ':' +
    currentdate.getMinutes() +
    ':' +
    currentdate.getSeconds();
  $('curr-date').innerHTML = datetime;

  // Enter (reference) or a tap on the overlays (touch) skips the wait.
  function skip() {
    if (entered) return;
    clickedEnter = true;
    $('countdown').classList.add('vis-hide');
    clearInterval(nameTimer);
    preLoader.classList.add('display-none');
    showTerminal();
    enterPage();
  }
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') skip();
  });
  [preLoader, terminal].forEach((el) =>
    el.addEventListener('pointerup', (e) => {
      if (e.pointerType !== 'mouse') skip();
    }),
  );

  function enterPage() {
    if (entered) return;
    entered = true;
    $('cur-blink').classList.add('display-none');
    $('click-enter').classList.add('vis-hide');
    enter1.classList.remove('display-none');
    move(reveal);
    function reveal() {
      onEnter();
      enter2.classList.remove('display-none');
      enter3.classList.remove('display-none');
      name.classList.remove('display-none');
      contact.classList.remove('display-none');
      progressHide.classList.remove('display-none');
      social.classList.remove('display-none');
      anime.timeline({ loop: false }).add({
        targets: '.name-title',
        translateY: [30, 0],
        translateZ: 0,
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 1000,
      });
      anime.timeline({ loop: false }).add({
        targets: '.position-b-r',
        translateY: [30, 0],
        translateZ: 0,
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 1500,
      });
      anime.timeline({ loop: false }).add({
        targets: '.social',
        translateY: [50, 0],
        translateZ: 0,
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 2000,
      });
      anime
        .timeline({ loop: false })
        .add({
          targets: '.git-social',
          translateY: [30, 0],
          translateZ: 0,
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 300,
        })
        .add({
          targets: '.link-social',
          translateY: [30, 0],
          translateZ: 0,
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 200,
        })
        .add({
          targets: '.insta-social',
          translateY: [30, 0],
          translateZ: 0,
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 100,
        })
        .add({
          targets: '.pin-social',
          translateY: [30, 0],
          translateZ: 0,
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 50,
        })
        .add({
          targets: '.resume-social',
          translateY: [30, 0],
          translateZ: 0,
          opacity: [0, 1],
          easing: 'easeOutExpo',
          duration: 50,
        });
    }
  }

  function move(onDone) {
    const elem = $('loadingBar');
    let width = 0;
    let greenStr = '';
    const id = setInterval(frame, 25);

    function frame() {
      if (width >= 75) {
        clearInterval(id);
        terminal.classList.add('display-none');
        if (introCredit) introCredit.classList.add('display-none');
        onDone();
      } else {
        width++;
        elem.style.width = width + '%';
        let num = (width * 100) / 75;
        num = num.toFixed(0);
        $('demo-bar-green').innerHTML = greenStr;
        if (width > 20) {
          enter2.classList.remove('display-none');
          enter3.classList.remove('display-none');
          $('demo').innerHTML = num;
        }
        greenStr = greenStr + '|';
      }
    }
  }

  if (mqFine.matches) dragElement(drag);
  if (mqReduced.matches) skip();
}

// Reference index.js:114-158 (terminal window drag by its title bar).
function dragElement(elmnt) {
  let pos1 = 0;
  let pos2 = 0;
  let pos3 = 0;
  let pos4 = 0;
  const handle = document.getElementById('drag-area');
  if (handle) {
    handle.onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = elmnt.offsetTop - pos2 + 'px';
    elmnt.style.left = elmnt.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}
