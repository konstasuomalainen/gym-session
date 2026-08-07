# Sessions

A gym and home workout tracker. One HTML file, served as a static site from GitHub Pages
at https://konstasuomalainen.github.io/gym-session/

## Hard constraints

These are deliberate. Do not relax them without being asked.

- **Single file.** All markup, styles and logic live in `index.html`. The only other files
  are PWA plumbing (`manifest.json`, `sw.js`, icons), the exercise images in `img/`, and
  `README.md`.
- **No dependencies.** No npm, no frameworks, no CDN scripts. The one external request is
  the Google Fonts stylesheet, and the app must stay usable if it fails.
- **No build step.** What is in the repo is what the browser runs. Never introduce a
  bundler, a transpiler or a `dist/` directory.
- **All data in localStorage**, under the key `sessions.v1`. No server, no account, no
  network writes. Export and import JSON is the only backup route.
- **Phone first.** It is used one-handed, mid-set, in a gym. Tap targets stay large, the
  primary action stays reachable at the bottom, and nothing depends on hover.

## The PROGRAM block

The `PROGRAM` const at the top of the `<script>` is the single edit point for changing the
routine. Adding, removing or reordering exercises and sessions means editing that object
and nothing else. If a routine change forces you to touch rendering code, the change is
wrong — fix the data shape instead.

`cardioFor()` sits just below it and owns the walk prescription. Same rule.

Optional fields on an exercise:

- `group` — a label for exercises performed back to back with no rest. Consecutive
  exercises sharing a string get one heading above the first of them.
- `unit` — what the second box counts, uppercased into its label. Defaults to `reps`.
  Use `sec` for holds.
- `weight` — set it to `false` for bodyweight work and the kg box disappears. The whole
  home block uses this.
- `link` — a demo video URL.
- there is no image field, by design. See below.

`cardioFor()` returning `null` means the track has no walk at all, which is how the home
track works. Callers must tolerate it.

## Exercise ids are permanent

History is keyed by exercise `id` (`store.history[].ex[<id>]`). The id is the identity of
the movement across every session ever logged.

- Renaming an exercise: change `name`, **keep `id`**. History follows.
- Changing an `id`: orphans every past set logged under the old one. The old data is not
  deleted, it just stops being found by "Last time" and progress lookups. Do not do this
  casually, and never as part of an unrelated change.
- Removing an exercise or a template: past sessions still reference it. Rendering must
  degrade to showing the raw id, not throw. `tmpl()` and `renderHistory()` already handle
  this — keep it that way.

## Exercise images

`img/<id>.png` — a two panel image, start position on the left, end position on the right,
with a red arrow showing the direction the weight travels. 2:1, 800x400.

Looked up by exercise id, never named in `PROGRAM`. Adding an image is dropping a file in;
there is nothing to wire up. A missing file removes its own element, so an exercise without
one is not a broken layout. This is another reason ids are permanent: the id is the
filename.

They are deliberately absent from `ASSETS` in `sw.js`. The runtime handler caches each one
the first time it is displayed, which keeps the install step from depending on files that
may not exist yet.

## Stored data shape

`SCHEMA` is the version of the stored object. Any change to the shape of what `blank()`
returns needs:

1. `SCHEMA` bumped,
2. a new `if(v === n)` block appended to `migrate()`.

Never edit an existing migration block. Data in the wild has already passed through it.
Migrations run on load and on import, so an old export from another phone is upgraded too.

## Service worker

`sw.js` caches the shell. Navigation is network-first, so a push goes live on the next
load; static assets and fonts are stale-while-revalidate. Bump `VERSION` in `sw.js` when
cached assets change, or phones keep serving the old ones.

## Conventions

- Two-space indent, single quotes in JS, no semicolon-free style.
- `esc()` everything interpolated into a template string. There is no framework doing it.
- Colours come from the CSS custom properties in `:root`. No new hex values inline.
