// Firebase Analytics (Google Analytics 4) for both page variants: the desktop
// strip at / and the phone page at /m/. Loaded as a plain deferred script by
// site/index.html and m/index.html and served as-is from the repository root.
//
// GA4 records location (country, region, city), device category, OS, browser,
// screen resolution, language and referrer on its own. On top of that, one
// `portfolio_view` event per page load says which variant actually rendered
// (the redirect in each page's <head> decides that, not the device) plus the
// viewport, pointer type, orientation and whether the visitor was redirected.
//
// Not sent from localhost / LAN addresses. Add `?analytics_debug` to the URL
// (or set localStorage.analyticsDebug = '1') to send anyway with GA4 debug
// mode on, which shows the events live in Firebase > Analytics > DebugView.
(function () {
  var firebaseConfig = {
    apiKey: 'AIzaSyCmsqubTc_qOnHluvCeZdood2RK2aX0eko',
    authDomain: 'portfolio-4a2e3.firebaseapp.com',
    projectId: 'portfolio-4a2e3',
    storageBucket: 'portfolio-4a2e3.firebasestorage.app',
    messagingSenderId: '242046888491',
    appId: '1:242046888491:web:7b9d9553d427522b8e986e',
    measurementId: 'G-Q9VCW0715T',
  };
  var SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';

  var debug = false;
  try {
    debug =
      /analytics_debug/.test(location.search) || localStorage.getItem('analyticsDebug') === '1';
  } catch {
    /* storage blocked */
  }
  var host = location.hostname;
  var local =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    /\.local$/.test(host);
  if (local && !debug) return;

  // Set by the redirect script in each page's <head> just before location.replace().
  var redirectedFrom = '';
  try {
    redirectedFrom = sessionStorage.getItem('redirectedFrom') || '';
    sessionStorage.removeItem('redirectedFrom');
  } catch {
    /* storage blocked */
  }

  var mq = function (q) {
    return window.matchMedia && window.matchMedia(q).matches;
  };
  var variant = /^\/m(\/|$)/.test(location.pathname) ? 'mobile' : 'desktop';
  var bypass = /desktop/.test(location.search)
    ? 'desktop'
    : /mobile/.test(location.search)
      ? 'mobile'
      : 'none';
  var pointer = mq('(pointer: fine)') ? 'fine' : mq('(pointer: coarse)') ? 'coarse' : 'none';
  var touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  var conn = navigator.connection || {};
  var params = {
    variant: variant,
    redirected_from: redirectedFrom || 'none',
    bypass: bypass,
    viewport: window.innerWidth + 'x' + window.innerHeight,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_size: screen.width + 'x' + screen.height,
    dpr: window.devicePixelRatio || 1,
    pointer: pointer,
    touch: touch ? 'yes' : 'no',
    orientation: mq('(orientation: portrait)') ? 'portrait' : 'landscape',
    standalone: mq('(display-mode: standalone)') || navigator.standalone === true ? 'yes' : 'no',
    color_scheme: mq('(prefers-color-scheme: dark)') ? 'dark' : 'light',
    reduced_motion: mq('(prefers-reduced-motion: reduce)') ? 'yes' : 'no',
    connection: conn.effectiveType || 'unknown',
  };

  Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-analytics.js')])
    .then(function (mods) {
      var app = mods[0];
      var an = mods[1];
      return an.isSupported().then(function (ok) {
        if (!ok) return;
        var analytics = an.getAnalytics(app.initializeApp(firebaseConfig));
        if (debug) an.setAnalyticsCollectionEnabled(analytics, true);
        // User properties can slice every report (device category, country, ...)
        // by variant once registered under GA4 Admin > Custom definitions.
        an.setUserProperties(analytics, { variant: variant, pointer: pointer });
        an.logEvent(
          analytics,
          'portfolio_view',
          debug ? Object.assign({ debug_mode: true }, params) : params,
        );

        // Small helper for later: window.track('event_name', { ...params }).
        window.track = function (name, extra) {
          var p = Object.assign({ variant: variant }, extra || {});
          if (debug) p.debug_mode = true;
          an.logEvent(analytics, name, p);
        };
        if (debug) console.info('[analytics] portfolio_view', params);
      });
    })
    .catch(function (err) {
      if (debug) console.warn('[analytics] failed to load', err);
    });
})();
