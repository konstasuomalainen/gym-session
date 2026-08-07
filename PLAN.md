# Sessions — review, decisions and implementation plan

Working document, not part of the app. Delete it once the work has landed.

**Revision 3.** Reviewed against `index.html` @ 842dc4f (808 lines), `sw.js`, `CLAUDE.md`,
`README.md`, the `fat-loss-program` skill (the authority on what the training actually is),
and — new in this revision — **direct measurement of the live app** at
`konstasuomalainen.github.io/gym-session/` in a 360 × 640 and 375 × 812 viewport.

Measuring changed seven conclusions, four of which were my own overstatements. Those
corrections are in §1.6.

---

## Status

Branch `refine-phase-1`, not merged to `main` (which deploys straight to Pages).

| Phase | State | Commit |
|---|---|---|
| 1 — stop the app fighting you | **shipped** | `290a336` |
| 2 — make it your programme again | **shipped** | `923d77c` |
| 3a — design system and dark mode | **shipped** | `b0c69fd` |
| 3b — the working screen | **shipped** | `12d6164` |
| 4 — calm and clutter *(schema 2)* | **shipped** | `1501c74` |
| 5 — become a reader | **shipped** | `1f0cd2a` |
| 6 — body data | awaiting §16.1 | |

Measured before → after, 360 × 640:

| | Before | After |
|---|---|---|
| Scroll jump on opening an exercise | 1285 px | **0 px** |
| Tapped exercise ends up | 153 px below the screen | stays put |
| Focus after toggling | `BODY` (keyboard closed) | `INPUT` |
| Taps to reach round 3 of the giant set | 6 | **0** — all nine sets on screen |
| Rest timers fired per giant set | 9 | **3**, one per round |
| Controls per set row | 4 effort + tick | 1 tick + a cut-short that appears once ticked |
| Tick button | 42 px | 52 px |
| Nav / text button hit area | 25–26 px | 44 px |
| Unit labels (`KG`, `REPS`) | 9 px | 12 px |
| Set line | 12 px | 15 px |
| Rest countdown | 20 px in a corner | 42 px across the bar |
| Hero counter | 88 px | 52 px chip |
| Home action vs the fold | 105 px **below** | 158 px **above** |
| Worst contrast, light | 3.5:1 (fails AA) | **5.02:1** |
| Worst contrast, dark | no dark theme | **5.04:1** |
| Gym exercises | 5 (no face pull) | 6 |
| Home exercises | 4, one not in the programme | 8, priority order |
| Dead kg fields in the home block | 16 | 0 |

### Corrections to this plan, found by measuring during implementation

1. **§7.2 said darkening `--muted` to `#6B6253` was optional headroom.** It was neither
   optional nor sufficient: the original `#7C7364` measured 3.5:1 on the floor and 4.11:1
   on a card, both failing AA, and `#6B6253` still fails on the floor at 4.49:1. Shipped
   `#635B4C`, the lightest value clearing 4.5:1 on all three surfaces.
2. **§8.1 assumed shrinking the hero fixed the fold.** It did not on its own — it left the
   home action 77 px below a 640 px viewport. The compact daily row is what fixed it.
3. **§3 decision 2 was applied more widely than written.** The experience rule (form folds
   after 3 logged sessions) was specified for the round block, but the same argument holds
   for an opened accordion card, so it applies there too. Opening a familiar exercise now
   lands on "Last time" and the numbers.
4. **§9.1's 1.25 kg long-press chip was dropped.** Hold-to-repeat on the 2.5 kg stepper
   covers the real case, and a step-size toggle is another control on the most crowded row
   in the app for something typing already handles.
5. **§4.4's contextual footer stays rejected**, per §3 decision 1. The footer is Timer +
   Finish; while a rest runs the timer takes the bar and Finish is hidden, which gets the
   reachability without inventing a "current set".

6. **§13.1's per-exercise view answers §2.2's lens better than planned.** The Exercises tab
   sorts trained movements first and never-logged ones last, which was not specified but is
   obviously right once you have eight home movements in the programme and none logged.
7. **§11's threshold is 3 consecutive declines within the last 4 sessions.** Verified live
   both ways: it fires on 45 → 42.5 → 40 → 37.5, and stays silent on a movement that is
   still climbing or that dipped only twice. Sessions where the movement was skipped are
   excluded before the comparison, so a bad week cannot manufacture a signal.

### Everything in the plan is now built except §14

§4.8 skip, carried over from Phase 4, shipped in Phase 5 alongside the trend as intended.

## Contents

| § | | |
|---|---|---|
| 0 | Verdict and what this revision changes | |
| 1 | **Verified findings** — measured, not asserted | new |
| 2 | **Seven perspectives** | new |
| 3 | **Decisions taken** | new |
| 4 | Bugs and defects | revised |
| 5 | Programme drift | |
| 6 | The physical context | |
| 7 | Design system, dark mode | |
| 8 | Screen by screen | revised |
| 9 | Input, feedback, motion, accessibility | revised |
| 10 | Data, durability and scale | rewritten |
| 11 | The one derived signal | new |
| 12 | What to take from other apps | |
| 13 | **Implementation contracts** — for whoever builds it | new |
| 14 | Phases | revised |
| 15 | Constraint check | |
| 16 | What remains your call | revised |

---

## 0. Verdict, and what this revision changes

The app is well built. Constraints held, storage layer defensive in the right places,
visual language distinctive, genuinely usable one-handed. Nothing here is a rewrite.

Revision 1 identified the scroll bug's root cause and the programme drift. Revision 2 added
the UI/UX layer. **This revision does three things:** it replaces assertion with measurement,
it reviews the whole thing through seven different lenses, and it converts the open questions
into decisions. Only two genuinely personal calls are left open (§16).

The headline is unchanged and is now quantified:

> Tapping an exercise to open it moves the page **1285 px**, and lands the exercise you
> tapped **153 px below the bottom of the screen**. You cannot see the thing you just
> opened. Focus goes from `INPUT` to `BODY`, so the keyboard closes too.

---

## 1. Verified findings

All measured on the live build, 360 × 640 viewport (the most common Android size), unless
noted.

### 1.1 The scroll bug, reproduced

Scrolled to the last exercise as you would mid-session, then tapped its header:

| | |
|---|---|
| `scrollY` before → after | **1285 → 0** |
| Tapped element position before | y = 283 (comfortably in view) |
| Tapped element position after | y = **793** — 153 px below a 640 px viewport |
| DOM node replaced | yes |
| `document.activeElement` before → after | **INPUT → BODY** (keyboard dismissed) |

Root cause is [`index.html:402`](index.html:402), `window.scrollTo(0,0)` inside `render()`,
which is invoked by the accordion toggle at [557](index.html:557).

### 1.2 Touch targets, measured

| Control | Measured | Floor | Verdict |
|---|---|---|---|
| `.exhead` accordion row | 74.2 px | 48 | good |
| `#finishBtn` | 59 px | 48 | good |
| `.timer` | 55 px | 48 | good |
| `.setgrid input` | 48 px | 48 | at floor, take to 52 |
| `.setdone` tick | **42 px** | 48 | **under** — and it is the most-tapped control in the app |
| `.effort` button | **68.5 × 34 px** | 48 | **well under** |
| `.linkbtn` | **26 px** | 44 | **less than half** |
| `.navlinks` button | **25 px** | 44 | **less than half** |

### 1.3 The fold, measured

| Viewport | `Start gym session` | `Start home session` |
|---|---|---|
| 375 × 812 | y = 389 ✓ | y = 745 — fits, **13 px clearance** |
| 360 × 640 | y = 389 ✓ | y = 745 — **105 px below the fold** |

### 1.4 Session screen geometry

Document height for a 5-exercise gym session with nothing expanded: **1611 px**, against a
640 px viewport — 2.5 screens of scrolling before any exercise is opened. The cardio card
alone is **199.5 px** and stays that size for the whole session after you have walked.

### 1.5 Storage at scale — measured, and smaller than I claimed

One realistic gym session serialises to **950 bytes**. `save()` runs `JSON.stringify` over
the *entire* store on every keystroke ([338](index.html:338)).

| History size | Total | Per-keystroke cost (desktop) |
|---|---|---|
| 1 session | 1.9 KB | 0.02 ms |
| 50 | 47.5 KB | 0.26 ms |
| 150 | 140.5 KB | 0.68 ms |
| 300 | 280.1 KB | 1.88 ms |

Your programme projects to roughly **430 sessions over ten months** (~130 gym at 3/week,
~300 home at daily) ≈ **400 KB**. Even at 5–10× slower on a mid-range Android that is
~10–19 ms per keystroke at the far end, and well inside the ~5 MB quota.

**This is a real but modest curve, and it kills my instinct to split the storage key.** A
debounce is proportionate; restructuring storage is not. See §10.

### 1.6 Corrections to my own earlier claims

Stating these plainly because four of them changed a recommendation.

| # | Revision-2 claim | Measured / researched reality |
|---|---|---|
| 1 | *"`type=number` silently discards comma decimals — a confirmed bug"* | **Overstated.** Chromium follows the OS/browser locale; a Finnish-locale Chrome accepts a typed `22,5` and converts it to `22.5`. Confirmed live: `navigator.language` is `fi`. The real hazard is narrower — see below |
| 2 | *"`.fadein` replays on every accordion tap"* | **Wrong for the session view.** Measured `.fadein` node count during a session: **0**. It applies to the Now screen only |
| 3 | *"`Start home session` is below the fold"* | **Half right.** 105 px below on 360 × 640; fits with 13 px to spare on 375 × 812 |
| 4 | *"Safari clears localStorage after 7 days"* | **Does not apply here.** Apple exempts home-screen-installed web apps from the 7-day cap. And you install via Chrome on Android anyway. The durability argument needed replacing — §10.2 |
| 5 | *"Wake Lock: Chrome on Android supports it, which is what you install this on"* | **Understated.** iOS Safari has supported it since 16.4 (the installed-PWA bug was fixed in 18.4). But it **requires a user gesture** and drops when backgrounded — which changes where the call goes |
| 6 | *"Cardio card reclaims ~280 px"* | **~200 px.** Measured at 199.5 |
| 7 | *"Split storage keys if it gets slow"* | **Rejected on evidence.** §1.5 |

**On the comma, precisely.** Two real failure paths survive:

- **Mixed locale.** An English-language browser UI with a Finnish keyboard — a very common
  developer configuration — rejects the comma keystroke outright. `22,5` becomes `225`. Not
  an empty field: a **ten-fold weight error, silently stored.**
- **Programmatic assignment.** Verified live: `input.value = '22,5'` yields `""`
  regardless of locale, because the IDL setter uses the spec's dot-only grammar. Any future
  code path that writes a stored value back into a field — `Copy last time`
  ([617](index.html:617)) already does exactly this — will blank it if a comma ever entered
  the data.

The fix is unchanged and still worth doing; the justification is now accurate.

### 1.7 Capability check on the target platform

Verified present: `navigator.wakeLock`, `navigator.vibrate`, `window.visualViewport`,
`navigator.storage.estimate`. Everything §9 proposes is available.

---

## 2. Seven perspectives

The same app, reviewed as seven different users. Each lens surfaced something the others
missed.

### 2.1 The lifter, mid-set — 20 seconds of attention, one hand

Covered in depth in §6. The lens's verdict: **the app is a reading surface that occasionally
accepts input, and it needs to be an input surface that occasionally shows information.**
Every measurement in §1.2 points the same way — the controls you touch are the smallest
things on screen, and the 88 px number you never act on is the largest.

### 2.2 The person at Sunday check-in — reading, not writing

Your check-in protocol needs six inputs. The app holds three of them and surfaces **none**:

| Check-in question | App holds it? | Can you get it out? |
|---|---|---|
| 7-day average weight | no | — |
| Last week's average | no | — |
| Days logged 7/7 | no | — |
| **Gym sessions this week** | **yes** | no — only a lifetime counter |
| Average daily steps | no | — |
| Anything unusual | **yes**, in notes | only by tapping each session |

This is the lens that most changes my view of the app. It is a good *logger* and a
non-existent *reviewer*. Everything you record goes in and nothing comes back out in the
shape your own protocol asks for. §8.3, §11 and §16.1 all come from this perspective.

### 2.3 The programme owner, editing `PROGRAM` in six months

The `CLAUDE.md` contract holds. But two things will bite:

- **`sets` is a number, so a "cut from the bottom" priority order is invisible.** The home
  block is explicitly priority-ordered and nothing in the UI says so (§5.3).
- **There is no way to express "not to failure".** Face pulls at 1–2 RIR, paused glute
  bridges and 60-second holds all render identically to a set to failure. This is the drift
  vector: the next time the programme gains a nuance, the data shape cannot hold it and the
  temptation will be to special-case it in the renderer, which `CLAUDE.md` forbids. Two
  optional fields now (`weight:false`, `rest`) prevent that.

### 2.4 The data at month ten — ~430 sessions

Measured in §1.5: fine. Two things that are *not* fine at that size:

- **`renderHistory()` builds every session as a DOM node on every visit** to the Log view
  ([685](index.html:685)) — 430 buttons. Survivable, but the view is unusable as navigation
  long before it is slow. It needs grouping and an exercise-first path (§8.3).
- **`lastFor()` scans history backwards until it finds a match** ([370](index.html:370)).
  Correct and fast for an exercise you do every session. For an exercise you retire and
  revisit, it is a full scan — and it runs once per exercise per render. At 430 sessions × 6
  exercises this is the one hot path worth an index if the Log view ever feels slow. Not yet.

### 2.5 The failure case

| Scenario | Today | Verdict |
|---|---|---|
| Corrupt JSON in storage | Parked under a `.corrupt.<ts>` key, not dropped ([335](index.html:335)) | **Genuinely good.** Keep exactly as is |
| Truncated / hand-edited file | `adopt()` filters and backfills ([308](index.html:308)) | good, one gap — §4.7b |
| Import of a newer schema | Refused with a clear message ([741](index.html:741)) | good |
| Import onto a populated phone | **Silently destroys everything** | §4.4 |
| Mistyped weight, session finished | **Permanent, and poisons every future comparison** | §4.5 |
| Phone lost or replaced | Manual export only | §10.2 |
| Storage evicted under pressure | No protection | §10.2 — `navigator.storage.persist()` |

### 2.6 The person having a bad week

Your programme is explicit: *adherence beats speed*, cut from the bottom rather than skip,
never punish, and there is an explicit boundary about logging producing guilt rather than
data.

The app **already gets this right and it is worth protecting.** The counter-not-calendar
model, nothing going red, no streaks, no catch-up — that is a deliberate and correct design
position, and it rules out a large family of otherwise-obvious features. Every proposal in
this plan has been checked against it. Two consequences:

- **§11's derived signal must be phrased as information, never as a warning.**
- **A skipped exercise needs an explicit "skipped" state** (§4.8) so that a bad week reads as
  a bad week rather than as a strength drop in the trend.

### 2.7 The implementing agent

You asked for a plan optimised for AI implementation. That means the plan must state
contracts, invariants and refusals, not intentions. §13 does that. The specific risks:

- **Silent constraint violation** — an agent reaching for a framework, a build step, or a
  second source file. §13.4 lists the refusals explicitly.
- **Migration damage** — editing an existing `migrate()` block instead of appending. §13.3.
- **Id churn** — "improving" an exercise id and orphaning history. §13.4.
- **Scope creep into the renderer** — putting routine knowledge in rendering code instead of
  the data shape. §13.2.

---

## 3. Decisions taken

You asked me to choose. These were open questions in revision 2; they are now decided, with
the reasoning. Reverse any of them and the rest of the plan still stands.

| # | Question | **Decision** | Why |
|---|---|---|---|
| 1 | Contextual footer — replace `Finish` with `Log set`? | **Rejected** | It requires the app to track a "current set", which is ambiguous the moment you fill fields out of order or work inside a round block. It adds state and a new failure mode to buy reachability that §6.3's work-zone scrolling and a 52 px tick already deliver. Keep `Timer` + `Finish`, put `Finish` behind a confirm |
| 2 | Cues and images — move behind a `ⓘ` overlay? | **Refined, not adopted wholesale** | Collapsing the cue is right for a barbell curl on session 30 and wrong for a hip flexor stretch you have never done. **Rule: the cue renders inline until that exercise has 3 logged sessions, then collapses behind a tap.** Automatic, no config, self-correcting for the five new mobility movements |
| 3 | Effort buttons — keep for home? | **Removed entirely** | Home push-ups are also to failure, so the home block does not rescue them. Replaced by one `✱ cut short` flag |
| 4 | Bird dog | **Removed from `PROGRAM`** | Not in your programme. History stays readable, id never reused |
| 5 | Storage — split keys or debounce? | **Debounce only** | Measured: 1.88 ms per keystroke at 300 sessions (§1.5). Splitting is unjustified complexity |
| 6 | Number inputs | **Still change to `text` + `inputmode="decimal"`** | The justification narrowed but did not disappear — the mixed-locale ten-fold error and the programmatic-write blanking are both real (§1.6) |
| 7 | Dark mode toggle | **No toggle, follow the system** | Every setting is a decision, and the app's character is having fewer of those |
| 8 | Round-block rendering for the giant set | **Yes, default, no flag** | It is how you train. The fallback for mismatched set counts is the safety net |
| 9 | Wake lock placement | **On the session-start / resume tap**, not on view mount | iOS requires a user gesture (§1.6 #5). Re-acquire on `visibilitychange` |
| 10 | Body data (weight + steps) | **Recommended in, minimally, last** | §16.1 — the one call I am still leaving to you, with a recommendation attached |

---

## 4. Bugs and defects

### 4.1 Scroll resets to top — the reported issue

Measured in §1.1. Root cause [`index.html:402`](index.html:402). `render()` wipes `#app` and
rebuilds everything; it is called by the accordion toggle ([557](index.html:557)), add-set
([613](index.html:613)), copy-last ([618](index.html:618)), nav ([791](index.html:791)) and
the session lifecycle (472, 661, 423). Only the last two want a scroll to top.

**Fix, two layers, do both.**

*Layer A — the stopgap.*

```js
let view = 'home', renderedView = null;
// end of render():
if(view !== renderedView) window.scrollTo(0,0);
renderedView = view;
```

*Layer B — the real fix.* Extract `buildExBody(exd, sets, prev)` returning a node, then:

- **Accordion toggle** — remove the open `.exbody`, append a new one, update `openEx`.
  No `render()`.
- **Scroll anchoring** — capture `head.getBoundingClientRect().top` before, restore after
  with `window.scrollBy(0, after - before)`. Collapsing a card *above* your position shifts
  everything up; this is the part that makes it feel like nothing moved.
- **Add a set** — `insertBefore` a new row. **Copy last time** — write into existing
  `input.value`. Neither calls `render()`.

**Acceptance:** with the app scrolled to the last exercise, tapping it changes `scrollY` by
less than the height of the opened body, and `document.activeElement` is not reset to `BODY`.

### 4.2 The rest timer does not survive a reload

`timerEnd` / `timerRunning` / `timerInt` are in-memory only ([665](index.html:665)). Persist
the deadline to its own key — deliberately outside `sessions.v1`, so no schema bump:

```js
const TKEY = 'sessions.timer';   // epoch ms deadline, or absent
```

Recompute from `Date.now()` on load and on `visibilitychange`, never from accumulated ticks.

### 4.3 The timer interval never stops when you leave the session

`paintTimer()` returns early with no `#timerBtn` ([672](index.html:672)) but `timerInt`
keeps firing every 250 ms forever — and because the `left === 0` check lives *inside* the
early-returning paint, **the completion toast and vibration never fire**. Move the
completion check into the interval callback; clear the interval when `view !== 'session'`.

### 4.4 Import silently overwrites everything

[742](index.html:742) — `store = adopt(data); save();`, no confirmation, button adjacent to
Export. Confirm naming both sides: *"Replace the 14 sessions on this phone with the 9 in this
file?"* Use the §9.4 sheet, not native `confirm()`.

### 4.5 A finished session cannot be corrected

No edit path after `finishSession()`. One mistyped weight is permanent and poisons "Last
time" and every future comparison. For a log whose whole job is the load number, this is the
most consequential omission after the scroll bug. Add an Edit action on an expanded Log
entry that reopens the session and writes back to the same history index.

### 4.6 Number input hazard

Per §1.6: mixed-locale keystroke rejection turning `22,5` into `225`, and programmatic writes
blanking. Fix in §9.1.

### 4.7 Smaller defects

| # | Issue | Location |
|---|---|---|
| a | `startSession()` throws on an empty template — `t.exercises[0].id` | [472](index.html:472) |
| b | `adopt()` never checks that `active.ex[id]` is an array; a hand-edited import throws in `finishSession()` | [315](index.html:315), [653](index.html:653) |
| c | Un-ticking a set leaves the rest timer running | [596](index.html:596) |
| d | Toast hardcoded to `bottom:96px` whether or not the footer is shown | [202](index.html:202) |
| e | Export filename is date-only; two exports in a day collide | [730](index.html:730) |
| f | No `aria-expanded` on `.exhead`; `.setdone` has no accessible name | 549, 584 |
| g | Exercise images use `alt=""`, marking instructional diagrams decorative | 567 |
| h | "Last session" stat splits a localised date string on spaces | [456](index.html:456) |
| i | No `<h1>`; the wordmark is a `div` | [219](index.html:219) |

### 4.8 Missing state: skipped

No way to record "shoulder was complaining, skipped the press". Blank reads as forgot, and a
faked number corrupts the trend. Explicit skip flag — see §2.6 for why this matters more than
it looks.

---

## 5. Programme drift

All `PROGRAM` and `cardioFor()` data. No rendering changes, per `CLAUDE.md`.

### 5.1 Face pulls are missing

Session A has **six** items; the app has five — confirmed live, the deployed build renders
5 exercises. The missing one is `Face pull or cable rear delt pull, 3 × 15, 1–2 RIR`, which
your own plan calls *"the single highest value addition available"* and *"if he will only add
one thing ever, this is it."* New permanent id `facepull`, last.

### 5.2 The walk card says the wrong thing

[`cardioFor()`](index.html:277) returns `when: 'after the lifting'`. You always walk first.
Gym string → `'before the lifting'`.

### 5.3 The home block is wrong in four ways

App today: `pushup`, `plank`, `birddog`, `deadbug`, plus a treadmill walk card.

| # | Programme item | In app? | Action |
|---|---|---|---|
| 1 | Push-ups, 3 × max to failure | yes | keep `pushup` |
| 2 | Half-kneeling hip flexor stretch, 60 s/side | no | add `hipflexor` |
| 3 | Deadbugs, 3 × 8/side | 2 sets | keep `deadbug`, sets 2 → 3 |
| 4 | Glute bridge, 2 × 12, 2 s pause | no | add `gluteb` |
| 5 | Prone Y raise / floor angel, 3 × 10 | no | add `proneY` |
| 6 | Thoracic extension, 60 s | no | add `tspine` |
| 7 | Chin tucks, 10 × 5 s | no | add `chintuck` |
| 8 | Plank, 2 × 30–45 s | 3 sets | keep `plank`, sets 3 → 2, move last |
| — | Bird dog | yes | **remove** (§3, decision 4) |

Plus: **no walk card on home** — `cardioFor()` returns `null` for `home`, both callers guard.
Fix the focus text, currently *"Walk plus a short bodyweight block."* And state the priority
rule in it: *"In order. On a short day, cut from the bottom."*

### 5.4 Not everything is to failure

Two optional fields on the exercise shape, pure data:

- **`weight: false`** — hide the kg input. Every home item. Removes 16 dead fields.
- **`unit: 'sec'`** — already supported; use for `hipflexor`, `tspine`, `chintuck`, `plank`.

Per-side holds go in `reps` as prose (`'60 per side'`). Do not build a per-side data model
for four exercises.

---

## 6. The physical context

### 6.1 The conditions

| Condition | Consequence |
|---|---|
| One hand; the other is on a bar | No two-finger gestures, no drag. Every long-press needs a tap equivalent |
| Out of breath, 10 s after a set to failure | Reading load near zero. Numbers must be findable without reading a sentence |
| Sweaty or chalky fingertips | Capacitive accuracy degrades. Sub-48 px targets start missing |
| Phone on a bench, or held low at hip height | 9–10 px labels are not legible; the timer must read from a metre |
| Bright gym lighting, or a dark Finnish evening | Both extremes. Needs a real dark theme *and* contrast in both |
| Music on the same phone | Audio cues unreliable and rude. Vibration is primary — but absent on iOS, so visual must stand alone |
| Interruptions; the phone locking | Everything resumable to exact state |

### 6.2 Target sizes

Measured in §1.2. **Floor: 48 px in-session, 44 px between sessions.** Where the ink must
stay small, expand the hit area without expanding the visual:

```css
.linkbtn, .navlinks button{ position:relative }
.linkbtn::before, .navlinks button::before{
  content:"";position:absolute;left:0;right:0;top:50%;height:44px;transform:translateY(-50%);
}
```

Globally:

```css
button,input,textarea,a{ touch-action:manipulation }   /* kills the 300 ms delay + double-tap zoom */
button{ -webkit-tap-highlight-color:transparent; user-select:none; -webkit-user-select:none }
```

`user-select:none` specifically stops a long-press on the tick popping the text-selection
callout mid-set.

### 6.3 The work zone

`.wrap` is `max-width:560px` ([53](index.html:53)) on a ~360 px device, so horizontal reach
is fine. Vertical is not: the comfortable one-handed thumb arc is roughly the **bottom 55 %**.

When the app moves the viewport itself — auto-advance, opening a card, advancing a round — it
should land the active row at about **58 % down**, not at the top:

```js
function bringIntoWorkZone(node){
  const r = node.getBoundingClientRect();
  const target = innerHeight * 0.58 - r.height;
  if(r.top < 90 || r.top > innerHeight - 200)
    scrollBy({top: r.top - target, behavior:'smooth'});
}
```

The `if` is the important half. The original complaint is unrequested scrolling; the fix is
not "scroll somewhere better", it is **"scroll only when you must"**.

---

## 7. Design system and dark mode

### 7.1 Type

The ramp is inverted against importance. The 88 px hero number is the largest element and the
least actionable; the **set summary line — the thing the app exists to show you — renders at
12 px grey mono**, and the input unit labels at **9 px** ([157](index.html:157)).

```css
:root{
  --t-hero: 52px;   /* was 88 */
  --t-h1:   36px;
  --t-h2:   24px;
  --t-lead: 20px;   /* buttons, set inputs */
  --t-body: 16px;
  --t-sub:  14px;   /* cues — was 13 */
  --t-data: 15px;   /* mono set lines, history — was 12 */
  --t-micro:12px;   /* ALL uppercase labels — hard floor, was 9/10/11 */
}
```

`--t-data: 15px` and the 12 px micro floor are the two lines that matter.

### 7.2 Colour

Tokens are already centralised ([19](index.html:19)) and inline hex is forbidden, which is
why dark mode is cheap. Five values escaped the system and must be extracted first:

| Hardcoded | Where | Token |
|---|---|---|
| `rgba(23,21,15,.035)` court lines | [50](index.html:50) | `--line` |
| `rgba(29,78,137,.10)` header glow | [51](index.html:51) | `--glow` |
| `rgba(29,78,137,.07)` "last time" fill | [144](index.html:144) | `--blue-wash` |
| `rgba(29,78,137,.06)` cardio fill | [170](index.html:170) | `--blue-wash` (unify) |
| `var(--chalk)` as button text | [99](index.html:99) | `--on-accent` (must flip in dark) |

**`--red` currently means three different things** — wordmark accent, running timer, and
destructive action ([781](index.html:781)). A running rest timer is not a warning. Split out
`--timer: #B9622B`.

### 7.3 Dark mode

No `prefers-color-scheme` rule exists. You train in the evening, in Finland, on a phone that
is dark from September to April. **Highest visual quality per line in the plan.**

```css
@media (prefers-color-scheme: dark){
  :root{
    --floor:#14120E; --card:#1E1B15; --chalk:#262219;
    --ink:#EFE7D6;   --muted:#9A9080; --hair:#3A3428;
    --blue:#6FA3DC;  --red:#E4705C;   --timer:#E08A4E; --ok:#6FA97E;
    --on-accent:#14120E;
    --line:rgba(239,231,214,.045);
    --glow:rgba(111,163,220,.10);
    --blue-wash:rgba(111,163,220,.12);
  }
}
```

Contrast: `--ink`/`--floor` ≈ 15:1, `--muted`/`--card` ≈ 6.5:1, `--on-accent`/`--blue` ≈ 8:1.

Three things the token swap alone gets wrong:

1. **`--ink` is used for text *and* for every 2 px structural border.** At `#EFE7D6` on a
   dark ground that turns the screen into a light-box. Override card borders to `--hair` in
   dark; keep `--ink` for text.
2. **`.ex.done` signals completion with `--chalk`** ([119](index.html:119)), which stays
   lighter than `--card` in dark, so the logic holds — but verify visually; it is the one
   place the inversion could read backwards.
3. **`meta[theme-color]`** ([6](index.html:6)) is hardcoded cream. Add a second tag with
   `media="(prefers-color-scheme: dark)"`.

---

## 8. Screen by screen

### 8.1 Now

Measured problems: the two heroes are visually identical so the eye must read to tell them
apart; `Start home session` is 105 px below the fold on a 360 × 640 phone (§1.3); the stats
strip repeats the two counters directly above it.

```
┌────────────────────────────┐
│ SESSIONS      Now Log Data │
├────────────────────────────┤
│ NEXT GYM SESSION       ·7· │  counter demoted to a mono chip
│ GYM                        │  36px, leads
│ Giant set, then three on   │
│ their own. All to failure. │
│ ▬▬ Walk 30 min · 4-6 km/h  │
├────────────────────────────┤
│    START GYM SESSION       │  above the fold on both sizes
├────────────────────────────┤
│ DAILY · HOME BLOCK      →  │  one 72px row, not a second hero
│ 8 items, under 20 min      │
├────────────────────────────┤
│ 3 gym · last 7 days        │  §8.4
│ Home block: done today     │
└────────────────────────────┘
```

The asymmetry is honest: **home is daily and gym is not**, and the layout should encode that
rather than presenting two equal choices.

### 8.2 Session — the working screen

At 1611 px document height for five exercises (§1.4), the screen never shortens as you
progress. Fix that:

```
┌────────────────────────────┐
│ GYM SESSION 7      ●●●○○○  │  progress rule, no words
├────────────────────────────┤
│ ✓ WALK  30 min done     ▾  │  collapses to 56px once ticked (−145px)
├────────────────────────────┤
│ ╔ GIANT SET · 3 ROUNDS    ╗│
│ ║ ROUND 1                 ║│
│ ║  Curl   [− 30 +][ 12 ]✓ ║│
│ ║  Press  [− 25 +][ 10 ]✓ ║│
│ ║  Row    [− 40 +][ 12 ]✓ ║│  ← rest timer fires here only
│ ║ ROUND 2 ...             ║│
│ ╚═════════════════════════╝│
├────────────────────────────┤
│ ○ LATERAL RAISE       3×12▾│
├────────────────────────────┤
│ [ 1:24 ]   [ FINISH ]      │
└────────────────────────────┘
```

1. **The giant set becomes one bound block** — the headline change. You train
   curl → press → row three times; the app makes you log three curls, then three presses,
   then three rows, which is three accordion taps per round, each costing 1285 px of scroll.
   `group` ([245](index.html:245)) already means "performed back to back with no rest", and
   three exercises done back to back *is* a round. **No `PROGRAM` change** — the renderer
   starts honouring documented meaning. Fall back to per-exercise cards if grouped exercises
   disagree on set count.
2. **Cardio collapses when ticked** — reclaims ~145 of its 199.5 px for the rest of the
   session.
3. **Completed exercises collapse** to a summary row in `--ok` at `--t-data`. The screen
   shortens as the session progresses, which is the right emotional shape for a workout.
4. **Progress rule** under the head — six dots, no text.
5. **Cue visibility follows experience** (§3, decision 2): inline until the exercise has 3
   logged sessions, then behind a tap.

### 8.3 Log — currently a logger with no reader

This is §2.2's lens made concrete. Two tabs, not two screens:

- **Sessions** — grouped under sticky week/month dividers, each row carrying a one-line
  preview at `--t-data` so "what did I row last time" needs no tap. Expanded detail becomes
  an aligned two-column table, not a `pre-wrap` blob ([709](index.html:709)). Edit action
  (§4.5).
- **Exercises** — every id ever logged; tapping one gives its history and a hand-drawn SVG
  sparkline of top-set weight, or set-1 reps where `weight:false`. **This is where the log
  becomes useful**, and it is the direct answer to your programme's *"the signal worth acting
  on is set 1 falling across weeks"* — currently unanswerable without reading exported JSON
  by hand.

### 8.4 Stats and Data

Stats strip ([452](index.html:452)) currently repeats two counters and a date. Replace with
things you would act on and that your check-in asks for: **gym sessions in the last 7 days**,
**days since the last gym session**, **whether the home block ran today**.

Data view: collapse counters and rotation behind one "Programme" disclosure; move Erase there
too with a 48 px target and a real confirm; add a quiet line showing schema version, session
count and `navigator.storage.estimate()` usage.

---

## 9. Input, feedback, motion, accessibility

### 9.1 Number inputs

```html
<input type="text" inputmode="decimal" enterkeyhint="next"
       autocomplete="off" autocorrect="off" spellcheck="false">
```

`type="text"` removes the locale-dependent keystroke rejection and the programmatic blanking
(§1.6); `inputmode="decimal"` keeps the numeric keypad, which was the only reason
`type=number` was there. Normalise on input: `v.replace(',', '.').replace(/[^0-9.]/g,'')`.

Three more, each one line and each removing a real friction:

- **`onfocus → select()`** — tapping a field holding `30` currently places a caret, so typing
  `35` yields `3035`. Every correction is tap-backspace-backspace-type.
- **Tappable ghost text** — the placeholder already shows last session's number
  ([582](index.html:582)). First tap on an empty field accepts it; second opens the keyboard.
  This is Strong's core interaction and it collapses "same as last time" to one tap — and
  makes `Copy last time` largely redundant, removing a control.
- **`enterkeyhint` wired to actually advance**, row-major through a round block: curl-kg,
  curl-reps, press-kg, press-reps — the order you perform them.

**Steppers** where `weight !== false`: `[−] [ 30.0 ] [+]`, 48 px each, 2.5 kg per tap,
repeat-on-hold after 500 ms, and a `·5` chip toggling to 1.25 kg increments — a chip rather
than long-press-only, per §6.1.

**Keyboard vs footer:** give `.foot` `transform:translateY(100%)` while an input is focused,
so it moves out of the keyboard's way instead of fighting it.

### 9.2 The rest timer

Currently a 92 px button at 20 px mono ([187](index.html:187)) that turns `--red`.

- **Running state takes the whole footer bar**: countdown at `--t-hero` in mono, thin
  progress rule draining beneath. Readable from a metre.
- **`--timer`, not `--red`** (§7.2).
- **Tap the bar adds 30 s**; long-press resets; `✕` dismisses.
- **Last 10 s**: the rule pulses, plus a haptic. On iOS, where `vibrate` is absent, the pulse
  is the only warning — so it must be unmistakable.
- **Per-exercise duration** from an optional `rest` field, default 90, **`rest: 0` inside a
  group** so the giant set stops firing a timer between curl and press.
- Survives backgrounding via §4.2.

### 9.3 Haptics

One vibration exists, at timer end ([677](index.html:677)). All guarded, all no-ops on iOS.

| Event | Pattern |
|---|---|
| Set ticked | `12` |
| Round complete | `[20,60,20]` |
| Rest done | `[200,100,200]` — one buzz is missable against music |
| 10 s remaining | `30` |
| Session finished | `[30,50,30,50,80]` |
| Destructive confirm | none — never haptically reward a delete |

### 9.4 Replace native `confirm()`

Three destructive paths use it: discard ([421](index.html:421)), finish-empty
([654](index.html:654)), erase-everything ([783](index.html:783)). In an installed PWA the
native dialog is unstyleable, visually foreign, and **suppressed entirely on some Android
builds — which would make erase-everything fire without asking.**

One reusable bottom sheet, `ask(title, body, confirmLabel, danger) → Promise<boolean>`, in the
existing card language: slides up (reachable), 56 px buttons, destructive on the right,
Cancel pre-focused on the left, backdrop and `Escape` cancel.

Where the action is reversible, **prefer undo over confirm** — a toast with UNDO after
finishing a session is strictly better than a dialog before it.

### 9.5 Motion

`.fadein` is 320 ms with staggered delays ([208](index.html:208)) — and per §1.6 #2 it is
**Now-screen only**, so the session view is already clean. Tighten it to 180 ms / 40 ms
stagger, cap at three items, and keep the `prefers-reduced-motion` block
([213](index.html:213)) exactly as written.

**Rule: once a session is underway, the working area does not animate.** Motion is for
transitions between contexts, not for data entry.

### 9.6 Accessibility

Overlaps almost entirely with "usable while out of breath in bad light".

| Item | Fix |
|---|---|
| No `<h1>` | `.mark` → `<h1>` |
| No `aria-expanded` on `.exhead` | add, plus `aria-controls` |
| Tick button named by a glyph | `aria-label="Set 1 complete"` |
| Timer has no live region | `aria-live="off"` on the countdown — announcing every second is hostile — plus a separate `role="status"` for "Rest complete" only |
| Toast invisible to AT | `role="status" aria-live="polite"` |
| `alt=""` on instructional images | `alt="<name>: start position left, end position right"` |
| Focus lost on accordion open | move focus to the first empty input; return to the head on close |
| `--muted` borderline at 9–11 px | resolved by the §7.1 size floor |
| Focus ring, dual-coded done state, reduced motion | **already correct — do not touch** |

---

## 10. Data, durability and scale

### 10.1 Save cost

Measured in §1.5. `save()` stringifies the whole store on every keystroke. At your ten-month
projection (~430 sessions, ~400 KB) that is single-digit ms desktop, ~10–19 ms on a mid-range
phone.

**Decision: debounce, do not restructure.** 250 ms debounce for text and number inputs;
immediate write for taps (tick, effort, finish). Flush on `visibilitychange` and `pagehide` so
a backgrounded PWA cannot lose the last keystroke:

```js
let pending = null;
function save(now){
  if(now){ clearTimeout(pending); pending = null; return writeNow(); }
  clearTimeout(pending); pending = setTimeout(writeNow, 250);
}
addEventListener('visibilitychange', () => { if(document.hidden) save(true); });
addEventListener('pagehide', () => save(true));
```

### 10.2 Durability — corrected

My earlier justification (Safari's 7-day cap) **does not apply**: Apple exempts home-screen
web apps, and you install via Chrome on Android regardless. The real risks are phone loss or
replacement, clearing site data, uninstalling the PWA, and **eviction under storage pressure**
— which is the one the app can actually defend against:

```js
if(navigator.storage && navigator.storage.persist) navigator.storage.persist();
```

One line, requested once, and it moves the origin into the "persistent" bucket that Chrome
will not evict under pressure. **This is the highest-value durability change available and it
was not in either earlier revision.**

Then the export nudge — track `lastExport`, one quiet line on the Data view after 10 sessions
or 30 days. Not a modal, not red.

### 10.3 Schema

`CLAUDE.md` requires a bump plus one appended block for any change to the stored shape. **Batch
everything into a single bump to `SCHEMA = 2`:**

```
session.exNote      : {}       // per-exercise notes
session.ex[id][n].c : false    // "cut short", replacing .e
session.ex[id][n].s : false    // skipped
store.lastExport    : null
store.body          : []       // only if §16.1 is a yes
```

```js
if(v === 1){
  data.history = (data.history || []).map(s => ({exNote:{}, ...s}));
  if(data.active && !data.active.exNote) data.active.exNote = {};
  data.lastExport = data.lastExport || null;
  data.body = data.body || [];
  v = 2;
}
```

Old `.e` values stay on disk and readable — an export predating this still carries them.
`migrate()` runs on import too, so old backups upgrade.

---

## 11. The one derived signal

Your programme names a specific failure mode and a specific trigger:

> *"Every set to failure across six exercises, indefinitely, in a 700 to 900 kcal deficit is
> the part of this plan most likely to fail first. If strength drops across multiple
> weeks… the first lever is failure, not calories."*

And in the boundaries section, strength dropping across multiple sessions and weeks is one of
the signals to escalate to a doctor.

The app records exactly the data needed to see this and does not look at it.

**Proposal: one derived line, and only one.** On the Log view, and in the check-in-shaped
part of the Now screen: for each exercise, compare the top set of the last three sessions to
the three before. If load has declined across three or more consecutive sessions, show one
neutral line:

> `Barbell row: top set down 3 sessions running (40 → 37.5 → 35 kg)`

Rules, which are what make this acceptable rather than nagging (§2.6):

- **Information, never a warning.** No red, no icon, no alert, no push.
- **It states the observation and stops.** It does not recommend eating more, deloading, or
  seeing anyone. Your programme owns those decisions; the app owns the observation.
- **Exactly one signal.** The temptation will be to add volume trends, tonnage, adherence
  percentages. Every one of those is noise against a programme whose only visible variable is
  load, and adding them would break the "nothing goes red" position that is currently the
  app's best feature.

This is the single most *personalised* thing the app could do, and it is roughly 25 lines.

---

## 12. What to take from other apps

**Take:** flat always-visible set rows (Strong, Hevy) — removes the broken interaction;
tappable "previous" ghost text (Strong); supersets as a bound group with round flow (Hevy);
per-exercise rest duration, auto-started (both); full-bleed large-type countdown (Strava,
Apple); wake lock (Apple Fitness, Strava); per-exercise history with a trend line (both);
"beat last time" acknowledgement (both); stepper increments (Strong); completed exercises
collapsing as you go (Hevy).

**Reject, deliberately:** social feeds, sharing, searchable exercise libraries — you have six
gym exercises and they never change, which is a feature per your own "repeat the same
sessions" rule. Calendars, streaks, anything that goes red — your README states this and it is
correct for a ten-month deficit. Auto-progression suggestions — your programme is to failure
with load as the only variable; "add 2.5 kg next week" would be noise. Estimated 1RM —
irrelevant to 12-rep-to-failure work. Onboarding and coach marks — one user, who wrote the
programme. Cloud sync and accounts — constraint, correctly. **A settings screen** — every
setting is a decision, and dark mode follows the system, rest comes from `PROGRAM`, and the
routine is edited in the file.

---

## 13. Implementation contracts

For whoever implements this, human or agent. These are the parts that are easy to get subtly
wrong.

### 13.1 New and changed functions

```js
buildExBody(exd, sets, prev) → HTMLElement     // pure; no render() call, no global reads beyond store
buildSetRow(exd, s, i, prev) → HTMLElement     // pure; one row
toggleEx(exId)                                 // local DOM swap + scroll anchoring. MUST NOT call render()
bringIntoWorkZone(node)                        // no-op when the node is already comfortably visible
ask(title, body, confirmLabel, danger) → Promise<boolean>
save(now = false)                              // debounced unless now === true
keepAwake(on)                                  // called from a user-gesture handler only
restFor(exd, isLastInGroup) → seconds          // reads exd.rest; 0 inside a group
trendFor(exId) → {declining: bool, values: []} // §11; reads history only
```

### 13.2 Invariants

1. **`render()` is only called on a view change or a session lifecycle event.** Every
   in-view mutation is a local DOM operation. This is the whole fix for the reported bug and
   it is easy to regress — a single stray `render()` in a new handler brings the 1285 px jump
   straight back.
2. **Routine knowledge lives in `PROGRAM`, never in the renderer.** The round block reads
   `group`; rest lengths read `rest`; hidden weight fields read `weight`. If a change requires
   the renderer to know what a barbell curl is, the data shape is wrong.
3. **`esc()` everything interpolated.** There is no framework doing it, and `import` accepts a
   file from outside the app — an exercise id or note from a hand-edited JSON is untrusted
   input that reaches a template string.
4. **Every write path goes through `save()`.** No direct `localStorage.setItem` on
   `sessions.v1`.
5. **Colours come from `:root`.** The dark theme depends on it and §7.2 removes the five
   existing violations rather than adding a sixth.

### 13.3 Migration rules

Bump `SCHEMA` once, append one block, **never edit block 1** — data in the wild has already
run it. Migrations run on import as well as load, so verify with an export taken *before* the
change. Update `blank()` to return the new fields.

### 13.4 Refusals — do not do these

- Do not add a framework, a bundler, a transpiler, a `dist/`, npm, or a CDN script.
- Do not add a second source file. Everything is `index.html` plus PWA plumbing and `img/`.
- Do not change an existing exercise `id`. Renaming changes `name` only. `birddog` is
  retired, not recycled.
- Do not edit an existing `migrate()` block.
- Do not add a network write, an account, or sync.
- Do not add streaks, calendars, red states, or catch-up prompts (§2.6).
- Do not add a settings screen.
- **Do not forget to bump `VERSION` in `sw.js`** in any commit touching `index.html`, or the
  installed phone serves the old file indefinitely. New `img/` files need no `ASSETS` change —
  they are runtime-cached by design.

### 13.5 Verification checklist

Per phase, on a 360 × 640 viewport:

- [ ] Scrolled to the last exercise, tapping it moves `scrollY` by less than the opened
      body's height *(baseline today: 1285 px)*
- [ ] `document.activeElement` is not `BODY` after toggling an exercise *(baseline: it is)*
- [ ] `22,5` typed into a weight field persists as `22.5` after a reload
- [ ] Rest timer started, phone locked 60 s, reopened — countdown correct
- [ ] Leaving the session view stops the timer interval
- [ ] A home session renders 8 exercises, no kg fields, no walk card
- [ ] A gym session renders 6 exercises and "before the lifting"
- [ ] Import onto populated storage asks first
- [ ] Every in-session control measures ≥ 48 px
- [ ] Dark mode: no light-box borders, `.ex.done` still reads as complete, status bar dark
- [ ] An export from before the change imports cleanly

---

## 14. Phases

Independently shippable, independently revertible, one commit each, `sw.js VERSION` bumped
every time.

**Phase 1 — stop the app fighting you.** §4.1 A+B, §4.2, §4.3, §9.1 inputs, §4.7a/b, §4.4,
§3-decision-9 wake lock, §10.1 debounce, §10.2 `storage.persist()`. No schema change.
*The single highest-value phase; ship it alone.*

**Phase 2 — make it your programme again.** §5.1–§5.4. `PROGRAM` and `cardioFor()` plus two
null-guards and one branch in the set row. No schema change.

**Phase 3a — design system and dark mode.** §7.1–§7.3, §6.2 target sizes, §9.5 motion. Almost
entirely `<style>`. *Largest perceived improvement per unit of risk — ship early.*

**Phase 3b — the working screen.** §8.2 round block, cardio collapse, completed collapse,
progress rule, experience-based cues; §9.2 timer; §9.1 steppers and ghost text; §6.3 work-zone
scrolling; §9.3 haptics.

**Phase 4 — calm and clutter.** §8.1 Now; effort → `cut short` *(schema)*; per-exercise notes
*(schema)*; §4.8 skip *(schema)*; §9.4 confirm sheet; §9.6 accessibility; §8.4 Data; §4.7 c–i.
**Bump `SCHEMA` to 2 here**, single migration block.

**Phase 5 — become a reader, not just a logger.** §8.3 Log with tabs and sparklines; §8.4
stats; §11 the derived signal; §4.5 edit a finished session; §10.2 export nudge.

**Phase 6 — body data**, only if §16.1 is a yes.

---

## 15. Constraint check

- **Single file** — everything in `index.html`, plus the `sw.js VERSION` line and new
  `img/<id>.png`. No new source files; this plan gets deleted.
- **No dependencies, no build step** — nothing added. Sparkline is hand-written SVG, the
  confirm sheet is a div, dark mode is a media query.
- **localStorage only** — one extra key for the transient timer deadline, deliberately outside
  `sessions.v1`. `storage.persist()` is a permission request, not a network write.
- **Phone first** — §6 exists for this; every proposal removes taps, removes scroll, enlarges
  a target, or makes something legible at arm's length.
- **`PROGRAM` is the single edit point** — §5 is entirely data; §8.2 and §9.2 read data fields.
- **Ids permanent** — `birddog` retired and never reused; `facepull`, `hipflexor`, `gluteb`,
  `proneY`, `tspine`, `chintuck` fixed from the moment they ship, and they are the image
  filenames.
- **Migrations append-only** — one new block, block 1 untouched.

---

## 16. What remains your call

Everything else is decided in §3. Two things are genuinely yours.

### 16.1 Body data — weight and steps

**My recommendation: yes, minimally, last.**

The case for it is §2.2. Your check-in protocol asks six questions; the app holds three and
surfaces none. Weight and steps are the two levers your programme says actually drive fat
loss, you open this app almost daily, and a `store.body[]` of `{date, kg, steps}` would make
Export a complete check-in artifact instead of a partial one.

The case against is real: `CLAUDE.md` describes a workout tracker, and your programme has an
explicit boundary about logging producing guilt rather than data.

If yes, the guardrails are the whole design: **one number per day, editable, 7-day rolling
average as the only derived figure, no target line, no goal weight on screen, no streak,
nothing ever red, and no reminder to weigh in.** It goes in Phase 6 so it is the easiest thing
in the plan to drop.

### 16.2 The six missing exercise images

`facepull`, `hipflexor`, `gluteb`, `proneY`, `tspine`, `chintuck` will have no
`img/<id>.png`. The layout degrades correctly without them — the element removes itself.

But five of the six are movements you have **never done**, and for those the two-panel
start/end frame is doing real work, more than it does for a barbell curl. Worth drawing in the
existing style. Say the word and I will produce them alongside Phase 2.

---

## Sources

Research used for the corrections in §1.6:

- [Browser support for `<input type="number">` with different decimal marks — Ctrl blog](https://www.ctrl.blog/entry/html5-input-number-localization.html)
- [Why input type="number" is broken for decimals — Stefan Bauer](https://n8d.at/inputtypenumber-and-why-it-isnt-good-for-your-user-experience/)
- [The Screen Wake Lock API is now supported in all browsers — web.dev](https://web.dev/blog/screen-wake-lock-supported-in-all-browsers)
- [Screen Wake Lock API — Can I use](https://caniuse.com/wake-lock)
- [What Safari's 7-day cap on script-writeable storage means for PWA developers — Search Engine Land](https://searchengineland.com/what-safaris-7-day-cap-on-script-writeable-storage-means-for-pwa-developers-332519)
- [Safari iOS PWA data persistence beyond 7 days — Apple Developer Forums](https://developer.apple.com/forums/thread/710157)
