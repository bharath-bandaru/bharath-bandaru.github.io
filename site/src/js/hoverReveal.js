import { gsap } from 'gsap';
import { map, lerp, clamp, getMousePos } from './utils.js';
import { onScroll } from './scroll.js';
import revealImg from '../assets/images/reveal.jpg';

// Reference menuItem.js (Codrops hover image reveal) collapsed into one class
// with a single statically imported image. The broken click handler from
// menuController.js (undefined contentItems) is dropped.

let mousepos = { x: 0, y: 0 };
let mousePosCache = mousepos;
let direction = { x: mousePosCache.x - mousepos.x, y: mousePosCache.y - mousepos.y };

class HoverReveal {
  constructor(el) {
    this.DOM = { el };
    this.animatableProperties = {
      tx: { previous: 0, current: 0, amt: 0.08 },
      ty: { previous: 0, current: 0, amt: 0.08 },
      rotation: { previous: 0, current: 0, amt: 0.08 },
    };
    this.layout();
    this.initEvents();
  }

  layout() {
    this.DOM.reveal = document.createElement('div');
    this.DOM.reveal.className = 'hover-reveal';
    this.DOM.reveal.style.transformOrigin = '0% 0%';
    this.DOM.revealInner = document.createElement('div');
    this.DOM.revealInner.className = 'hover-reveal__inner';
    this.DOM.revealImage = document.createElement('div');
    this.DOM.revealImage.className = 'hover-reveal__img';
    this.DOM.revealImage.style.backgroundImage = `url(${revealImg})`;
    this.DOM.revealInner.appendChild(this.DOM.revealImage);
    this.DOM.reveal.appendChild(this.DOM.revealInner);
    this.DOM.el.appendChild(this.DOM.reveal);
  }

  initEvents() {
    this.hovering = false;
    this.mouseenterFn = () => {
      this.hovering = true;
      this.showImage();
      this.firstRAFCycle = true;
      this.loopRender();
    };
    this.mouseleaveFn = () => {
      this.hovering = false;
      this.stopRendering();
      this.hideImage();
    };
    this.DOM.el.addEventListener('mouseenter', this.mouseenterFn);
    this.DOM.el.addEventListener('mouseleave', this.mouseleaveFn);
    // The strip may move while hovering; re-measure on scroll.
    onScroll(() => {
      if (this.hovering) this.firstRAFCycle = true;
    });
  }

  calcBounds() {
    this.bounds = {
      el: this.DOM.el.getBoundingClientRect(),
      reveal: this.DOM.reveal.getBoundingClientRect(),
    };
  }

  showImage() {
    gsap.killTweensOf(this.DOM.revealInner);
    gsap.killTweensOf(this.DOM.revealImage);
    gsap
      .timeline({
        defaults: { duration: 0.8, ease: 'quint' },
        onStart: () => {
          this.DOM.reveal.style.opacity = this.DOM.revealInner.style.opacity = 1;
          gsap.set(this.DOM.el, { zIndex: 100 });
        },
      })
      .to(
        this.DOM.revealInner,
        { startAt: { x: '-50%', y: '150%', rotation: 10 }, x: '0%', y: '0%' },
        0,
      )
      .to(this.DOM.revealInner, { duration: 1, ease: 'expo', startAt: { scale: 0.2 }, scale: 1 }, 0)
      .to(
        this.DOM.revealImage,
        { duration: 1, ease: 'expo', startAt: { scale: 1.8 }, scale: 1 },
        0,
      );
  }

  hideImage() {
    return new Promise((resolve) => {
      gsap.killTweensOf(this.DOM.revealInner);
      gsap.killTweensOf(this.DOM.revealImage);
      gsap
        .timeline({
          defaults: { duration: 0.8, ease: 'quint' },
          onStart: () => gsap.set(this.DOM.el, { zIndex: 1 }),
          onComplete: () => {
            gsap.set(this.DOM.reveal, { opacity: 0 });
            resolve();
          },
        })
        .to(this.DOM.revealInner, { scale: 0.8, x: '50%', y: '-150%', opacity: 0 })
        .to(this.DOM.revealImage, { scale: 1.8 }, 0);
    });
  }

  loopRender() {
    if (!this.requestId) this.requestId = requestAnimationFrame(() => this.render());
  }

  stopRendering() {
    if (this.requestId) {
      window.cancelAnimationFrame(this.requestId);
      this.requestId = undefined;
    }
  }

  render() {
    this.requestId = undefined;
    if (this.firstRAFCycle) this.calcBounds();

    const mouseDistanceX = clamp(Math.abs(mousePosCache.x - mousepos.x), 0, 100);
    direction = { x: mousePosCache.x - mousepos.x, y: mousePosCache.y - mousepos.y };
    mousePosCache = { x: mousepos.x, y: mousepos.y };

    const p = this.animatableProperties;
    p.tx.current = Math.abs(mousepos.x - this.bounds.el.left) - this.bounds.reveal.width / 2;
    p.ty.current = Math.abs(mousepos.y - this.bounds.el.top) - this.bounds.reveal.height / 2;
    p.rotation.current = this.firstRAFCycle
      ? 0
      : map(mouseDistanceX, 0, 200, 0, direction.x < 0 ? -100 : 100);

    p.tx.previous = this.firstRAFCycle ? p.tx.current : lerp(p.tx.previous, p.tx.current, p.tx.amt);
    p.ty.previous = this.firstRAFCycle ? p.ty.current : lerp(p.ty.previous, p.ty.current, p.ty.amt);
    p.rotation.previous = this.firstRAFCycle
      ? p.rotation.current
      : lerp(p.rotation.previous, p.rotation.current, p.rotation.amt);

    gsap.set(this.DOM.reveal, {
      x: p.tx.previous,
      y: p.ty.previous,
      rotation: p.rotation.previous,
    });

    this.firstRAFCycle = false;
    this.loopRender();
  }
}

export function initHoverReveal() {
  const items = document.querySelectorAll('.menu__item');
  if (!items.length) return [];
  window.addEventListener('mousemove', (ev) => (mousepos = getMousePos(ev)));
  return [...items].map((el) => new HoverReveal(el));
}
