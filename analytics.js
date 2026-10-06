// Visit tracking for both page variants: the desktop strip at / and the phone
// page at /m/. Loaded as a plain deferred script by site/index.html and
// m/index.html and served as-is from the repository root. Two sinks:
//
// 1. Firebase Analytics (Google Analytics 4). GA4 records location (country,
//    region, city), device category, OS, browser, screen resolution, language
//    and referrer on its own. On top of that, one `portfolio_view` event per
//    page load says which variant actually rendered (the redirect in each
//    page's <head> decides that, not the device) plus the viewport, pointer
//    type, orientation and whether the visitor was redirected.
//
// 2. Firebase Realtime Database, for a glanceable view without digging through
//    GA4 reports: ready-made counters under /stats (total, per variant, per
//    day and variant, per time zone) and one row per visit under /views.
//    Clicks on "Hire me", the social tiles, email and the resume are counted
//    under /stats/clicks.
//    Security rules (database.rules.json) only allow creating a view row and
//    incrementing a counter by exactly one; nothing is readable from the web.
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
    databaseURL: 'https://portfolio-4a2e3-default-rtdb.firebaseio.com',
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

  var timezone = 'unknown';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
  } catch {
    /* no Intl */
  }

  // One atomic multi-path write: the visit row plus every counter it belongs to.
  function recordView(db, dbApi) {
    var day = new Date().toISOString().slice(0, 10);
    var key = dbApi.push(dbApi.ref(db, 'views')).key;
    var row = {
      ts: dbApi.serverTimestamp(),
      day: day,
      variant: variant,
      redirectedFrom: redirectedFrom || 'none',
      bypass: bypass,
      timezone: timezone.slice(0, 64),
      language: (navigator.language || 'unknown').slice(0, 16),
      viewport: params.viewport,
      screen: params.screen_size,
      dpr: params.dpr,
      pointer: pointer,
      touch: touch,
      orientation: params.orientation,
      standalone: params.standalone === 'yes',
      referrer: (document.referrer || '').slice(0, 256),
      userAgent: (navigator.userAgent || '').slice(0, 512),
    };
    var updates = {};
    updates['views/' + key] = row;
    updates['stats/total'] = dbApi.increment(1);
    updates['stats/variant/' + variant] = dbApi.increment(1);
    updates['stats/daily/' + day + '/' + variant] = dbApi.increment(1);
    // Database keys cannot contain "/" (America/Chicago -> America_Chicago).
    updates['stats/timezone/' + timezone.replace(/[.#$/[\]]/g, '_').slice(0, 64)] =
      dbApi.increment(1);
    return dbApi.update(dbApi.ref(db), updates);
  }

  // Which tracked link a click landed on, by href so every copy of a tile
  // (header, contact panel, footer, phone page) counts without extra markup.
  // Repo links (github.com/bharath-bandaru/<repo>) are not the GitHub tile.
  var TARGETS = [
    ['resume', /\/docs\/resume\.pdf/],
    ['github', /^https:\/\/github\.com\/bharath-bandaru\/?$/],
    ['linkedin', /linkedin\.com\/in\//],
    ['instagram', /instagram\.com\//],
    ['pinterest', /pinterest\.com\//],
    ['email', /^mailto:/],
  ];
  function clickTarget(a) {
    if (a.id === 'hireMe') return 'hire';
    var href = a.getAttribute('href') || '';
    for (var i = 0; i < TARGETS.length; i++) if (TARGETS[i][1].test(href)) return TARGETS[i][0];
    return '';
  }

  // Counters only for clicks, no per-click rows.
  function recordClick(db, dbApi, target) {
    var day = new Date().toISOString().slice(0, 10);
    var updates = {};
    var base = 'stats/clicks/' + target + '/';
    updates[base + 'total'] = dbApi.increment(1);
    updates[base + variant] = dbApi.increment(1);
    updates[base + 'daily/' + day] = dbApi.increment(1);
    return dbApi.update(dbApi.ref(db), updates);
  }

  // Resolves once the SDK is up; clicks before that wait for it.
  var ready = Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-analytics.js'),
    import(SDK + 'firebase-database.js'),
  ]).then(function (mods) {
    var app = mods[0];
    var an = mods[1];
    var dbApi = mods[2];
    var fb = app.initializeApp(firebaseConfig);
    var db = dbApi.getDatabase(fb);

    recordView(db, dbApi)
      .then(function () {
        if (debug) console.info('[analytics] view recorded in the Realtime Database');
      })
      .catch(function (err) {
        if (debug) console.warn('[analytics] database write failed', err);
      });

    return an.isSupported().then(function (ok) {
      if (!ok) return { db: db, dbApi: dbApi };
      // Debug mode at the gtag config level marks every hit (page_view included),
      // so the session shows up as a device in Firebase > Analytics > DebugView.
      var analytics = debug
        ? an.initializeAnalytics(fb, { config: { debug_mode: true } })
        : an.getAnalytics(fb);
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
      return { db: db, dbApi: dbApi };
    });
  });
  ready.catch(function (err) {
    if (debug) console.warn('[analytics] failed to load', err);
  });

  // Every tracked link opens in a new tab (or the resume sheet, or the mail
  // app), so this page stays alive for the write. Delegated in the capture
  // phase, so it sees clicks other handlers preventDefault (the resume sheet);
  // auxclick covers middle-click.
  function onClick(e) {
    if (e.type === 'auxclick' && e.button !== 1) return;
    var a = e.target.closest && e.target.closest('a');
    var target = a && clickTarget(a);
    if (!target) return;
    ready
      .then(function (fx) {
        if (window.track) window.track('link_click', { target: target });
        return recordClick(fx.db, fx.dbApi, target);
      })
      .then(function () {
        if (debug)
          console.info('[analytics] ' + target + ' click recorded in the Realtime Database');
      })
      .catch(function (err) {
        if (debug) console.warn('[analytics] click write failed', err);
      });
  }
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
})();
