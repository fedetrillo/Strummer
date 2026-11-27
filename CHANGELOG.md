# Changelog

## 1.0.2 — 2026-11-26

- **Fixed on Windows:** LUNA on Windows sizes the page to the window's outer size, title bar and frame included, so the bottom 39 px and the right 16 px were hidden. The page now leaves that space out on Windows, so everything at the bottom and right edges shows in full.
  the part you can see, so the controls at the bottom were hidden. The page now fits itself to
  the window size LUNA reports; nothing changes where the two match.
- **Report copy:** Alt-click on the version now always says in the status bar that the report was copied. Where the system clipboard is blocked (seen on some Windows set-ups) it uses a fallback, and if that fails too it shows the report selected so you can copy it by hand.

## 1.0.1 — 2026-11-25

- A short getting-started guide: the first time it opens it asks for your language, then walks
  you through the window in it. The **?** button brings it back.

## 1.0.0 — 2026-11-23

- First release: chords into MIDI from a chord name, a guitar shape or LUNA's Chord ruler, with
  guitar or piano voicings, rhythm patterns, chord and note lengths.
- Key of the song (or the session's key signature) with every chord in the key, borrowed
  chords and suggestions for what comes next; sevenths switch; double-click to insert.
- Strum and straighten MIDI chords: speed, direction (down, up, alternate, auto), softer
  upstrokes, humanized timing and velocity.
- Dark and grey themes, 7 languages, Alt-click the version for a support report.
