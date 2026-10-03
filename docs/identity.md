# Identity

Picked from rendered tastings on 30/9/2026 and 1/10/2026.

- **Name:** Tally. Wordmark set in Newsreader italic (`app/components/TallyWordmark.vue`).
- **Type:** Newsreader for the wordmark, headings and sentences (may change to another serif later). Geist for everything you click or scan: buttons, labels, settings, metadata. Geist Mono for every digit on the board, pad, timers and stats. All three self-hosted by `@nuxt/fonts`. Geist is the base face; `h1` and `h2` take Newsreader in `app/assets/css/main.css`, and a sentence opts in with `font-serif`.
- **Colors:** four sets, Moonlight by default (in Dark mode), then Steel, Cobalt Snow, Tangerine + Ink. Tokens in `app/assets/css/themes.css`.
- **Modes:** System, Light, Dark, OLED. System follows the OS between light and dark, never OLED. OLED puts the page on true black and the board on a near-black surface.
- **Board:** the Moonrise grid with a solid cell background and "whisper" lines: cell lines at 5% ink, box lines at 16%, one rounded 10px frame. The selected cell fills with `--ink` (near-white on dark, near-black on light), its digit or notes knocked out in `--surface`, and turns `--error` red when its digit is wrong; cells with the same digit take a neutral fill (ink 10%), the row, column and box a faint band (ink 4%), hover ink 6%. No circles. Every change fades over 90ms. Given digits are Geist Mono 400, the player's are 300 in the set's `--user` color.
- **Finish:** the board thins out and a moon (the accent color) rises behind it.
- **Page transition:** "Ink in" (`app/utils/ink.ts`). The old page goes on the next frame. The new one lands as a pencil sketch, outlined type and empty surfaces with the board's grid in pencil, and inks in from the top left over about 0.8s. A puzzle opened from inside the app loads before the page changes, so its board arrives whole. Under reduced motion pages swap with no animation.
- **Contrast:** every set passes WCAG AA in all three modes: body text 7:1 on the surface, muted and digits 4.5:1, accent labels 4.5:1.

## Tokens

Each set defines eight: `--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--on-accent`, `--user`, `--error`. Everything else (lines, peer highlight, the soft accent) derives from them in `app/assets/css/main.css`, which also maps them onto Nuxt UI's `--ui-*` variables.

The chosen set and mode live in the `tally-appearance` cookie, so the server renders `data-colors` and `data-mode` on `<html>` and nothing flashes on load.
