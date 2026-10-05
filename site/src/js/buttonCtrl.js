import { gsap } from 'gsap';
import { lerp, getMousePos } from './utils.js';

// Ported from the reference buttonCtrl.js (the "Reload" button of the original
// site's small-screen gate): a magnetic button. While the pointer is within
// 0.7 × the button's width of its centre, the button drifts toward the pointer
// (× 0.3, eased) and its label drifts the other way (× −0.6); crossing that
// radius toggles .button-f--hover (the inverted colours from button.scss) and
// slides the label out and back in with GSAP. The EventEmitter of the original
// is replaced by onEnter / onLeave callbacks (used to grow the custom cursor).
// The reference cached the button's rect; here the untransformed rect is
// derived each frame (rect − current translation), so it survives the
// horizontal scroll and late layout changes.

let mouse = { x: 0, y: 0 };
let tracking = false;

export function initMagneticButton(el, { onEnter, onLeave } = {}) {
  if (!el) return null;
  if (!tracking) {
    tracking = true;
    window.addEventListener('mousemove', (ev) => (mouse = getMousePos(ev)));
  }
  const text = el.querySelector('.button-f__text');
  const textInner = el.querySelector('.button-f__text-inner');
  const rendered = {
    tx: { previous: 0, current: 0, amt: 0.1 },
    ty: { previous: 0, current: 0, amt: 0.1 },
  };
  let hover = false;

  const enter = () => {
    hover = true;
    el.classList.add('button-f--hover');
    if (onEnter) onEnter();
    gsap.killTweensOf(textInner);
    gsap
      .timeline()
      .to(textInner, { duration: 0.15, ease: 'power2.in', opacity: 0, y: '-20%' })
      .to(textInner, {
        duration: 0.2,
        ease: 'expo.out',
        opacity: 1,
        startAt: { y: '100%' },
        y: '0%',
      });
  };

  const leave = () => {
    hover = false;
    el.classList.remove('button-f--hover');
    if (onLeave) onLeave();
    gsap.killTweensOf(textInner);
    gsap
      .timeline()
      .to(textInner, { duration: 0.15, ease: 'power2.in', opacity: 0, y: '20%' })
      .to(textInner, {
        duration: 0.2,
        ease: 'expo.out',
        opacity: 1,
        startAt: { y: '-100%' },
        y: '0%',
      });
  };

  const render = () => {
    const r = el.getBoundingClientRect();
    // Centre of the button as laid out, before its own magnetic translation.
    const cx = r.left + r.width / 2 - rendered.tx.previous;
    const cy = r.top + r.height / 2 - rendered.ty.previous;
    const dist = Math.hypot(mouse.x - cx, mouse.y - cy);
    const trigger = r.width * 0.7;

    let x = 0;
    let y = 0;
    if (dist < trigger) {
      if (!hover) enter();
      x = (mouse.x - cx) * 0.3;
      y = (mouse.y - cy) * 0.3;
    } else if (hover) {
      leave();
    }

    rendered.tx.current = x;
    rendered.ty.current = y;
    for (const key in rendered) {
      rendered[key].previous = lerp(rendered[key].previous, rendered[key].current, rendered[key].amt);
    }
    el.style.transform = `translate3d(${rendered.tx.previous}px, ${rendered.ty.previous}px, 0)`;
    text.style.transform = `translate3d(${-rendered.tx.previous * 0.6}px, ${-rendered.ty.previous * 0.6}px, 0)`;

    requestAnimationFrame(render);
  };
  requestAnimationFrame(render);

  return { isHover: () => hover };
}
