// Device capability flags, evaluated once.
export const mqFine = window.matchMedia('(any-pointer: fine)');
export const mqCoarse = window.matchMedia('(pointer: coarse)');
export const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

// Same test Locomotive Scroll v5 uses to decide "touch device".
export const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

export const pointerFx = () => mqFine.matches && !mqReduced.matches;
