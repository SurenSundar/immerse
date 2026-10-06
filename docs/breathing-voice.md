# Breathing voice clips

The Breathe page's voice guide plays recorded clips when they exist and falls
back to the device's built-in voice for any word without one. Add clips by
putting MP3 files in `public/audio/breath/`, then commit and push.

## Files (11)

| File               | Says          | Used for                         |
| ------------------ | ------------- | -------------------------------- |
| `breathe-in.mp3`   | "Breathe in"  | start of every inhale            |
| `hold.mp3`         | "Hold"        | start of every hold              |
| `breathe-out.mp3`  | "Breathe out" | start of every exhale            |
| `one.mp3` … `eight.mp3` | "one" … "eight" | the countdown in Counts mode (4-7-8 needs up to "seven") |

You can add only some of them; missing words use the device voice.

## Recording tips

- Keep each clip **under 0.9 seconds** (numbers) and **under 1.2 seconds**
  ("Breathe in/out"). Counts play once per second, so a longer clip makes the
  next number wait or be skipped.
- Trim silence at the start so the word lands exactly on the beat.
- Slow, soft and low; the same distance from the mic for every clip.
- Mono, 44.1 kHz, about 96 kbps MP3 is plenty (each file is a few KB).
- Use your own voice, a voice actor, or a TTS service whose licence allows
  commercial use. Don't use voices exported from macOS/iOS `say`; Apple's
  licence doesn't cover that.

To check them, run the site locally, open Breathe, turn **Voice on**, pick
**Counts** and the **4-7-8** pattern.
