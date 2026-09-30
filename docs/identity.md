# Identity

Picked from rendered tastings on 30/9/2026.

- **Name:** Tally. Wordmark set in Newsreader italic (`app/components/TallyWordmark.vue`).
- **Type:** Newsreader for text (may change to another serif later), Geist Mono for every digit on the board, pad, timers and stats. Both self-hosted by `@nuxt/fonts`.
- **Colors:** four sets, Steel by default, then Moonlight, Cobalt Snow, Tangerine + Ink. Tokens in `app/assets/css/themes.css`.
- **Modes:** System, Light, Dark, OLED. System follows the OS between light and dark, never OLED. OLED puts the page on true black and the board on a near-black surface.
- **Board:** the Moonrise grid with a solid cell background and "whisper" lines: cell lines at 5% ink, box lines at 16%, one rounded 10px frame. Selection is a soft disc with a thin ring. Given digits are Geist Mono 400, the player's are 300 in the set's `--user` color.
- **Finish:** the board thins out and a moon (the accent color) rises behind it.
- **Contrast:** every set passes WCAG AA in all three modes: body text 7:1 on the surface, muted and digits 4.5:1, accent labels 4.5:1.

## Tokens

Each set defines eight: `--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--on-accent`, `--user`, `--error`. Everything else (lines, peer highlight, the soft accent) derives from them in `app/assets/css/main.css`, which also maps them onto Nuxt UI's `--ui-*` variables.

The chosen set and mode live in the `tally-appearance` cookie, so the server renders `data-colors` and `data-mode` on `<html>` and nothing flashes on load.
