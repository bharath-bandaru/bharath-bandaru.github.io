import { startScroll, stopScroll } from './scroll.js';

const PEEK = 120; // visible height of the peeking sheet; keep in sync with $resume-peek
const FLICK = 0.6; // px/ms: a quicker swipe snaps in its direction regardless of position

// Resume bottom sheet, driven by the fixed resume icon (top right):
//  - hovering the icon peeks a rounded-top window up from the bottom edge;
//  - clicking the icon (or the peeking window) slides the sheet up to fill
//    the screen, top corners still rounded, with the PDF inside;
//  - the title bar can be dragged: pull up to open, down to peek or dismiss;
//  - the × button, the dimmed backdrop or Escape slide it back down.
// The strip is locked while the sheet is open, like the contact drawer. The
// PDF is only loaded into the iframe on first peek/open.
export function initResumePanel({ trigger, panel, onOpen, onClose } = {}) {
  if (!trigger || !panel) return null;
  const sheet = panel.querySelector('.resume-panel__sheet');
  const bar = panel.querySelector('.resume-panel__bar');
  const frame = panel.querySelector('iframe');
  const closeBtn = panel.querySelector('.resume-panel__close');
  const src = frame.dataset.src;
  let state = 'hidden'; // hidden | peek | open

  // The panel ships with the `hidden` attribute so it cannot flash before the
  // stylesheet applies (e.g. on a dev-server reload). Reveal it now that the
  // styles are in, and only then switch its slide transitions on, so the
  // initial off-screen position is never animated into.
  panel.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.add('is-ready')));
  let hideTimer = 0;
  // A peek the user dragged into place stays until they hover the sheet or
  // the icon again and leave (the snap-back slides the sheet out from under
  // the pointer, which would otherwise read as leaving).
  let pinnedPeek = false;

  const load = () => {
    if (!frame.getAttribute('src')) frame.src = src;
  };
  const set = (next) => {
    const wasOpen = state === 'open';
    state = next;
    panel.dataset.state = next;
    panel.setAttribute('aria-hidden', next === 'open' ? 'false' : 'true');
    if (next === 'open' && !wasOpen) {
      stopScroll();
      if (onOpen) onOpen();
    } else if (next !== 'open' && wasOpen) {
      startScroll();
      if (onClose) onClose();
    }
  };

  const peek = () => {
    if (state === 'open') return;
    clearTimeout(hideTimer);
    pinnedPeek = false;
    load();
    set('peek');
  };
  const unpeek = () => {
    if (state !== 'peek' || pinnedPeek) return;
    // Grace period so the pointer can travel from the icon (top right) down
    // to the peeking sheet before it slips away.
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (state === 'peek') set('hidden');
    }, 500);
  };
  const open = () => {
    clearTimeout(hideTimer);
    load();
    set('open');
  };
  const close = () => {
    if (state === 'open') set('hidden');
  };

  // --- Dragging the title bar -------------------------------------------
  // The sheet's resting offsets (translateY) per state; while dragging, the
  // CSS transition is off and the offset follows the pointer, clamped between
  // fully open (0) and fully hidden (its height). On release it snaps to the
  // nearest state, or in the swipe's direction for a quick flick.
  let drag = null;
  let suppressClick = false;
  const sheetHeight = () => sheet.getBoundingClientRect().height;
  const offsetFor = (st, h) => (st === 'open' ? 0 : st === 'peek' ? h - PEEK : h);

  bar.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('a, button')) return;
    const h = sheetHeight();
    drag = {
      startY: e.clientY,
      startOffset: offsetFor(state, h),
      offset: offsetFor(state, h),
      moved: false,
      lastY: e.clientY,
      lastT: performance.now(),
      vy: 0,
    };
    clearTimeout(hideTimer);
    sheet.classList.add('is-dragging'); // also turns off the iframe's pointer events
    // Track on the window: once the pointer crosses onto the PDF iframe the
    // bar stops receiving events even with pointer capture.
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);
    e.preventDefault();
  });
  const onDragMove = (e) => {
    if (!drag) return;
    const h = sheetHeight();
    const dy = e.clientY - drag.startY;
    if (Math.abs(dy) > 4) drag.moved = true;
    drag.offset = Math.min(h, Math.max(0, drag.startOffset + dy));
    const now = performance.now();
    drag.vy = (e.clientY - drag.lastY) / Math.max(1, now - drag.lastT);
    drag.lastY = e.clientY;
    drag.lastT = now;
    sheet.style.transform = `translate3d(0, ${drag.offset}px, 0)`;
  };
  const endDrag = () => {
    if (!drag) return;
    window.removeEventListener('pointermove', onDragMove);
    window.removeEventListener('pointerup', endDrag);
    window.removeEventListener('pointercancel', endDrag);
    const h = sheetHeight();
    const visible = h - drag.offset;
    // Snap: a flick decides by direction; otherwise past halfway opens, a
    // short pull on the peeking sheet keeps it peeking, anything else hides.
    let target;
    if (drag.vy < -FLICK) target = 'open';
    else if (drag.vy > FLICK) target = 'hidden';
    else if (visible > h * 0.5) target = 'open';
    else if (state === 'peek' && visible > PEEK * 0.5) target = 'peek';
    else target = 'hidden';
    if (drag.moved) suppressClick = true;
    drag = null;
    sheet.classList.remove('is-dragging');
    sheet.style.transform = '';
    if (target === 'open') open();
    else set(target);
    pinnedPeek = target === 'peek';
  };

  // --- Clicks / keys ------------------------------------------------------
  trigger.addEventListener('mouseenter', peek);
  trigger.addEventListener('mouseleave', unpeek);
  sheet.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
    pinnedPeek = false;
  });
  sheet.addEventListener('mouseleave', () => {
    if (!drag) unpeek();
  });
  trigger.addEventListener('click', (e) => {
    // Plain clicks open the sheet; modified clicks keep the link's default
    // (new tab / download).
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (state === 'open') close();
    else open();
  });
  sheet.addEventListener('click', (e) => {
    if (suppressClick) {
      suppressClick = false;
      e.preventDefault();
      return;
    }
    if (state === 'peek') {
      e.preventDefault();
      open();
    }
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    close();
  });
  panel.addEventListener('click', (e) => {
    if (e.target === panel) close(); // backdrop
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state === 'open') close();
  });

  return { open, close, peek, isOpen: () => state === 'open' };
}
