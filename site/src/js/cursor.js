import { gsap } from 'gsap';
import { lerp, getMousePos } from './utils.js';

// Reference cursor-n.js: SVG circle following the mouse with lerp 0.2,
// scale 4 / opacity 0.2 over links. Hover is wired by event delegation and
// the cursor hides when the pointer leaves the window.

let mouse = { x: 0, y: 0 };

class Cursor {
  constructor(el) {
    this.DOM = { el };
    this.DOM.el.style.opacity = 0;
    this.bounds = this.DOM.el.getBoundingClientRect();
    this.hidden = false;

    this.renderedStyles = {
      tx: { previous: 0, current: 0, amt: 0.2 },
      ty: { previous: 0, current: 0, amt: 0.2 },
      scale: { previous: 1, current: 1, amt: 0.2 },
      opacity: { previous: 1, current: 1, amt: 0.2 },
    };

    this.onMouseMoveEv = () => {
      this.renderedStyles.tx.previous = this.renderedStyles.tx.current =
        mouse.x - this.bounds.width / 2;
      this.renderedStyles.ty.previous = this.renderedStyles.ty.current =
        mouse.y - this.bounds.height / 2;
      gsap.to(this.DOM.el, { duration: 0.9, ease: 'Power3.easeOut', opacity: 1 });
      requestAnimationFrame(() => this.render());
      window.removeEventListener('mousemove', this.onMouseMoveEv);
    };
    window.addEventListener('mousemove', this.onMouseMoveEv);
  }

  enter() {
    this.renderedStyles.scale.current = 4;
    this.renderedStyles.opacity.current = 0.2;
  }

  leave() {
    this.renderedStyles.scale.current = 1;
    this.renderedStyles.opacity.current = this.hidden ? 0 : 1;
  }

  hide() {
    this.hidden = true;
    this.renderedStyles.opacity.current = 0;
  }

  show() {
    this.hidden = false;
    if (this.renderedStyles.scale.current === 1) this.renderedStyles.opacity.current = 1;
  }

  render() {
    this.renderedStyles.tx.current = mouse.x - this.bounds.width / 2;
    this.renderedStyles.ty.current = mouse.y - this.bounds.height / 2;

    for (const key in this.renderedStyles) {
      this.renderedStyles[key].previous = lerp(
        this.renderedStyles[key].previous,
        this.renderedStyles[key].current,
        this.renderedStyles[key].amt,
      );
    }

    this.DOM.el.style.transform = `translateX(${this.renderedStyles.tx.previous}px) translateY(${this.renderedStyles.ty.previous}px) scale(${this.renderedStyles.scale.previous})`;
    this.DOM.el.style.opacity = this.renderedStyles.opacity.previous;

    requestAnimationFrame(() => this.render());
  }
}

const HOVER = 'a, button, .pointer, .drag-area';

export function initCursor() {
  const el = document.querySelector('.cursor-n');
  if (!el) return null;
  window.addEventListener('mousemove', (ev) => (mouse = getMousePos(ev)));
  const cursor = new Cursor(el);

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(HOVER)) cursor.enter();
  });
  document.addEventListener('mouseout', (e) => {
    const from = e.target.closest(HOVER);
    if (!from) return;
    if (e.relatedTarget && e.relatedTarget.closest(HOVER) === from) return;
    cursor.leave();
  });
  document.documentElement.addEventListener('mouseleave', () => cursor.hide());
  document.documentElement.addEventListener('mouseenter', () => cursor.show());

  return cursor;
}
