# Sessions

A session based gym and home workout tracker. One HTML file, no backend, no build step. Data lives in the browser's localStorage on the device that used it.

## Deploy

1. Create a repo, for example `sessions`.
2. Drop `index.html` in the root and push.
3. Repo settings, Pages, source `Deploy from a branch`, branch `main`, folder `/ (root)`.
4. Wait a minute, then open `https://<username>.github.io/sessions/`.
5. On the phone, share sheet, `Add to Home Screen`. It opens without browser chrome after that.

## How it works

- The counter, not the calendar, drives everything. Session 7 is session 7 whether it happens on Tuesday or a week later. Nothing goes red, there is nothing to catch up.
- Gym rotation: Upper A, Upper B, Lower, repeat. Home is its own counter.
- The walk length, incline and speed ramp by session number. Gym days top out at 30 min, home days at 45.
- Each exercise shows what you lifted for it last time, pulled from history by exercise id.
- Everything autosaves on every keystroke. Closing the tab mid session loses nothing.

## Changing the routine

Edit the `PROGRAM` block at the top of `index.html`. It is the first thing in the script and nothing else needs to change.

Keep the `id` stable when renaming an exercise. History is stored by id, so changing `latpull` to `lat_pulldown` orphans every past entry for it.

To add a demo video, put a URL in the exercise's `link` field and a link appears in the card.

## Backup

Data, Export writes a JSON file. Do it now and then, and always before clearing browser data or moving phone. Import reads the same file back.

## Session counters

Data, Session counters adjusts which workout comes next and where the walk ramp sits. Use it if you start mid programme or skip a template.
