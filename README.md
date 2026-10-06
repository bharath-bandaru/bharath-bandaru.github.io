# bharath-bandaru.github.io

Personal portfolio served by GitHub Pages straight from this repository's root.
Desktop gets a horizontal-scroll site built with Vite and
[Locomotive Scroll v5](https://scroll.locomotive.ca/) (Lenis); screens 900px and
narrower are redirected to `/m/`, the original single-page site (append `?desktop`
to the URL to bypass); `/m/` sends wider screens back to `/` (append `?mobile` to
bypass).

## Repository layout

| Path                                                                                     | What it is                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`, `assets/`                                                                  | **Generated** by `npm run build`. Do not edit by hand.                                                                                                                                                                                                                                                                                 |
| `m/index.html`                                                                           | The original single-page site, served to phones. Self-contained.                                                                                                                                                                                                                                                                       |
| `analytics.js`                                                                           | Visit tracking shared by `/` and `/m/`, served as-is (not bundled): Firebase Analytics (GA4) plus a Realtime Database write. See [Analytics](#analytics).                                                                                                                                                                             |
| `database.rules.json`, `firebase.json`, `.firebaserc`                                    | Realtime Database security rules and the Firebase CLI config to deploy them (`firebase deploy --only database`).                                                                                                                                                                                                                      |
| `fonts/`, `images/`, `icons/`, `docs/resume.pdf`, `.well-known/`, `chain-reaction-game/` | Static files served as-is at the same URLs.                                                                                                                                                                                                                                                                                            |
| `site/index.html`                                                                        | The page source. Markup is ported verbatim from the original portfolio (`my-portfolio`), content updated.                                                                                                                                                                                                                              |
| `site/src/main.js`                                                                       | Entry point: boot order and wiring.                                                                                                                                                                                                                                                                                                    |
| `site/src/js/`                                                                           | One module per behaviour: `scroll` (Lenis setup, eased scroll-to, keyboard), `parallax` (v4 formula), `fades`, `progress`, `scrollbar`, `preloader`, `contact`, `cursor`, `hoverReveal`, `hints`, `tape` (ribbon scene after the artworks), `carousel` (image carousel in portfolio cards), plus `caps` (device flags) and `utils`. |
| `site/src/styles/`                                                                       | `main.scss` imports the ported partials (banner-marked, kept verbatim) plus `_loco-v5.scss`, which holds every adjustment for Locomotive v5 and the requested tweaks, and `_tape.scss` for the ribbon scene (crossing bands over the end of the artworks).                                                                 |
| `site/src/assets/images/`                                                                | Optimized images produced by `scripts/optimize-images.mjs`.                                                                                                                                                                                                                                                                            |
| `scripts/optimize-images.mjs`                                                            | One-shot image optimizer (sharp). `npm run images -- --src /path/to/my-portfolio/src/images`.                                                                                                                                                                                                                                          |

## Working on it

```sh
npm install
npm run dev            # http://localhost:5173, also on the LAN for phone testing
npm run lint           # ESLint
npm run format         # Prettier (ported SCSS and generated files are ignored)
npm run build          # regenerates index.html + assets/ at the repo root
npm run preview        # serves the built root
```

Press **Enter** (or tap, on touch screens) to skip the intro.

### Conventions

- Desktop must stay pixel-identical to the original site. Files with a
  "Ported verbatim" banner are not restyled; behaviour changes go in
  `site/src/js` and `site/src/styles/_loco-v5.scss`.
- Locomotive v4 attributes (`data-scroll-section`, `data-scroll-id`) remain in the
  markup as inert markers so the original CSS keeps applying. Parallax speeds use
  the original values via `data-parallax`.
- Pointer-only effects (custom cursor, hover reveal) are gated on a fine pointer
  and `prefers-reduced-motion: no-preference`.
- The strip reads newest-first: Portfolio → Work Experience (2026 → 2016) →
  Education (2021 → 2013) → artworks → ribbon scene → outro ("Thanks again!" + a Hire me
  link to LinkedIn). The dashed rail that joins
  the two timelines lives on Education's first (2021) dot (`_loco-v5.scss`).

## Analytics

Both pages load `/analytics.js`, which initialises Firebase Analytics (Google
Analytics 4) from the CDN build of the SDK. Firebase project `portfolio-4a2e3`,
web app "bharath-bandaru.github.io", GA4 stream `G-Q9VCW0715T`. Reports live in
the [Firebase console](https://console.firebase.google.com/project/portfolio-4a2e3/analytics)
and in Google Analytics.

GA4 records location (country, region, city), device category, OS, browser,
screen resolution, language and referrer by itself. On top of that every page
load sends one `portfolio_view` event with:

| Parameter                        | Values                                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| `variant`                        | `desktop` (the strip at `/`) or `mobile` (the page at `/m/`)           |
| `redirected_from`                | `/`, `/m/` or `none`: whether the head redirect sent the visitor here  |
| `bypass`                         | `desktop`, `mobile` or `none`: the `?desktop` / `?mobile` overrides    |
| `viewport`, `screen_size`, `dpr` | e.g. `390x844`, `1170x2532`, `3`                                       |
| `pointer`, `touch`               | `fine` / `coarse` / `none`, `yes` / `no`                               |
| `orientation`, `standalone`      | `portrait` / `landscape`; `yes` when opened from the home screen       |
| `color_scheme`, `reduced_motion` | OS preferences                                                         |
| `connection`                     | `4g`, `3g`, ... (Chromium only, otherwise `unknown`)                   |

`variant` and `pointer` are also set as user properties. To slice the standard
reports by them, register them once under GA4 Admin → Custom definitions
(`variant`, `pointer` as user-scoped dimensions; the event parameters above as
event-scoped ones). `window.track(name, params)` is exposed for extra events.

### Realtime Database (the quick view)

The same script also writes to the project's Realtime Database
(`portfolio-4a2e3-default-rtdb`), which gives counts without digging through
GA4 reports. Open the
[Data tab](https://console.firebase.google.com/project/portfolio-4a2e3/database/portfolio-4a2e3-default-rtdb/data/~2Fstats)
in the Firebase console:

```
stats/
  total                      every page load
  variant/desktop, mobile    page loads per variant
  daily/YYYY-MM-DD/variant   the same, per UTC day
  timezone/America_Chicago   page loads per browser time zone (a rough "where")
  clicks/<target>/total      link clicks; target = hire, resume, github, linkedin,
                             instagram, pinterest or email
  clicks/<target>/desktop    the same, per variant (and /mobile)
  clicks/<target>/daily/YYYY-MM-DD   the same, per UTC day
views/<push id>              one row per page load: ts, day, variant, redirectedFrom,
                             bypass, timezone, language, viewport, screen, dpr, pointer,
                             touch, orientation, standalone, referrer, userAgent
```

Tracked clicks are "Hire me" plus any link to the resume, the GitHub profile
(not repo links), LinkedIn, Instagram, Pinterest or email, wherever it sits on
either page; each also sends a `link_click` event (param `target`) to GA4.

Each page load is one atomic multi-path update (the row plus every counter).
The rules in `database.rules.json` allow the public site to do only that:
create a `views` row that matches the schema with a server timestamp, and
increment a counter by exactly one. Nothing is readable from the web; the
console reads as the project owner. Deploy rule changes with
`firebase deploy --only database`. Anyone can still inflate counters by
calling the write themselves; for a portfolio that is acceptable, and the
`views` rows make such noise easy to spot.

Nothing is sent from `localhost` or LAN addresses. Append `?analytics_debug`
to the URL (or set `localStorage.analyticsDebug = '1'`) to send anyway with
debug mode on; the events then appear live in Firebase → Analytics → DebugView.

## Publishing

GitHub Pages serves the `master` branch root. After changing anything under
`site/`, run `npm run build` and commit the regenerated `index.html` and
`assets/` together with the source.

## Rollback

The site before this rebuild is tagged `v1` (the old single-page `index.html`
at the repo root). The rebuild landed on `master` as a single commit, so to go
back to the old site:

```sh
git revert --no-edit <sha-of-the-rebuild-commit>   # see `git log --oneline -3`
git push origin master
```

That restores the previous files exactly (including `_config.yml`) and GitHub
Pages redeploys within a minute. To return to the rebuild afterwards, revert the
revert, or `git checkout v2.0.0 -- .`.
