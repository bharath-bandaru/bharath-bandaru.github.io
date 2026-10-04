// Map number x from range [a, b] to [c, d]
export const map = (x, a, b, c, d) => ((x - a) * (d - c)) / (b - a) + c;

// Linear interpolation
export const lerp = (a, b, n) => (1 - n) * a + n * b;

export const clamp = (num, min, max) => (num <= min ? min : num >= max ? max : num);

// Gets the mouse position
export const getMousePos = (e) => ({ x: e.clientX, y: e.clientY });

// Resolves once every image matching `selector` has decoded (or failed).
export const preloadImages = (selector = 'img') =>
  Promise.all(
    [...document.querySelectorAll(selector)].map((img) => {
      if (img.tagName !== 'IMG') img = img.querySelector('img');
      if (!img) return Promise.resolve();
      return img.decode().catch(() => {});
    }),
  );

// cubic-bezier(x1, y1, x2, y2) easing (same math as the bezier-easing library
// Locomotive v4 used for scrollTo). Returns a function from progress to eased.
export function cubicBezier(x1, y1, x2, y2) {
  const A = (a1, a2) => 1 - 3 * a2 + 3 * a1;
  const B = (a1, a2) => 3 * a2 - 6 * a1;
  const C = (a1) => 3 * a1;
  const calc = (t, a1, a2) => ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t;
  const slope = (t, a1, a2) => 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1);
  const solveT = (x) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (s === 0) return t;
      t -= (calc(t, x1, x2) - x) / s;
    }
    return t;
  };
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : calc(solveT(x), y1, y2));
}
