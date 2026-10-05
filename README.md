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
