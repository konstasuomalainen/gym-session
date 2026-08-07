# Sessions

A session based gym and home workout tracker. One HTML file, no backend, no build step. Data lives in the browser's localStorage on the device that used it.

Live at https://konstasuomalainen.github.io/gym-session/

## Install

Open it on the phone, Chrome menu, `Install app`. It runs full screen and works offline
after the first load.

## How it works

- The counter, not the calendar, drives everything. Session 7 is session 7 whether it happens on Tuesday or a week later. Nothing goes red, there is nothing to catch up.
- Gym is one session: a giant set of barbell curl, overhead press and row, then lateral raises, machine chest press and face pulls. Everything to failure except the face pulls, which stop a rep or two short. Home is its own counter, and is meant to run daily.
- The home block is listed in priority order. On a short day, cut from the bottom rather than skipping it.
- The walk is a standing prescription, not a ramp. 30 minutes minimum at 8-10 percent and 4-6 km/h, before the lifting. Gym only: there is no walk on the home track.
- Each exercise shows what you lifted for it last time, pulled from history by exercise id. Tap an empty box to take that number.
- The Log has two tabs. Sessions is what happened on a day; Exercises is one movement across time, with a trend line. If a movement's top set has fallen three sessions running, the Exercises tab says so in one line and leaves it there. That is the only opinion the app offers.
- An exercise can be marked skipped. It reads as skipped rather than as missing, and it is left out of that movement's trend.
- A logged session can be reopened and corrected from the Log.
- Opening an exercise shows a start and end frame of the movement.
- Weight and steps go in one row a day on Now. The seven day rolling average is the only thing worked out from them. No goal weight, no target, no streak, no reminder.
- Everything autosaves as you type. Closing the tab mid session loses nothing.

## Changing the routine

Edit the `PROGRAM` block at the top of `index.html`. It is the first thing in the script and nothing else needs to change.

Keep the `id` stable when renaming an exercise. History is stored by id, so changing `chestpress` to `chest_press` orphans every past entry for it, and breaks the link to its image.

Optional fields on an exercise: `group` labels exercises done back to back with no rest, `unit` sets what the second box counts (`sec` for holds), `weight: false` removes the kg box for bodyweight work, and `link` puts a demo video URL in the card.

## Exercise images

`img/<id>.png`, two panels, start on the left and end on the right, 2:1. Matched to the
exercise by id, so adding one is dropping the file in. An exercise without an image just
does not show one.

## Backup

Data, Export writes a JSON file. Do it now and then, and always before clearing browser data or moving phone. Import reads the same file back.

## Session counters

Data, Session counters adjusts the gym and home session numbers. Use it if you start mid programme.
