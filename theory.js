// Strummer's music theory: chord names to pitch classes, guitar shapes, piano voicings,
// rhythm patterns and the strum itself. No LUNA here, so it can be checked on its own.

(function (root) {
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

  function notePc(name) {
    const m = /^([A-Ga-g])([#b♯♭]*)$/.exec(String(name || '').trim());
    if (!m) return undefined;
    let pc = PC[m[1].toUpperCase()];
    for (const c of m[2]) pc += c === '#' || c === '♯' ? 1 : -1;
    return ((pc % 12) + 12) % 12;
  }

  // Chord qualities as intervals above the root. 14 = 9th, 17 = 11th, 21 = 13th.
  const TYPES = {
    '': [0, 4, 7], maj: [0, 4, 7], M: [0, 4, 7],
    m: [0, 3, 7], min: [0, 3, 7], '-': [0, 3, 7],
    5: [0, 7],
    6: [0, 4, 7, 9], m6: [0, 3, 7, 9], 69: [0, 4, 7, 9, 14], m69: [0, 3, 7, 9, 14],
    7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], M7: [0, 4, 7, 11], 'Δ': [0, 4, 7, 11], 'Δ7': [0, 4, 7, 11],
    m7: [0, 3, 7, 10], min7: [0, 3, 7, 10], '-7': [0, 3, 7, 10],
    mmaj7: [0, 3, 7, 11], mM7: [0, 3, 7, 11], 'm(maj7)': [0, 3, 7, 11],
    dim: [0, 3, 6], '°': [0, 3, 6], o: [0, 3, 6], dim7: [0, 3, 6, 9], '°7': [0, 3, 6, 9], o7: [0, 3, 6, 9],
    m7b5: [0, 3, 6, 10], 'ø': [0, 3, 6, 10], 'ø7': [0, 3, 6, 10], 'm7(b5)': [0, 3, 6, 10],
    aug: [0, 4, 8], '+': [0, 4, 8], aug7: [0, 4, 8, 10], '+7': [0, 4, 8, 10], '7#5': [0, 4, 8, 10], '7+5': [0, 4, 8, 10],
    sus2: [0, 2, 7], sus4: [0, 5, 7], sus: [0, 5, 7], '7sus4': [0, 5, 7, 10], '7sus': [0, 5, 7, 10], '7sus2': [0, 2, 7, 10],
    add9: [0, 4, 7, 14], add2: [0, 2, 4, 7], madd9: [0, 3, 7, 14], 'm(add9)': [0, 3, 7, 14], add11: [0, 4, 7, 17], add4: [0, 4, 5, 7],
    9: [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], M9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14],
    '7b9': [0, 4, 7, 10, 13], '7#9': [0, 4, 7, 10, 15], '7b5': [0, 4, 6, 10],
    11: [0, 7, 10, 14, 17], m11: [0, 3, 7, 10, 14, 17],
    13: [0, 4, 7, 10, 14, 21], maj13: [0, 4, 7, 11, 14, 21], m13: [0, 3, 7, 10, 14, 21],
  };
  const TYPE_LIST = ['', 'm', '7', 'maj7', 'm7', 'sus2', 'sus4', '7sus4', '6', 'm6', 'add9', '9', 'maj9', 'm9', 'dim', 'dim7', 'm7b5', 'aug', '5', '11', '13'];

  // "Am7", "F#m7b5", "C/E", "Bbmaj7". Returns { root, type, bass, pcs, essential, known } or undefined.
  function parseChord(text) {
    const s = String(text || '').trim().replace(/♯/g, '#').replace(/♭/g, 'b');
    const m = /^([A-Ga-g])([#b]?)\s*([^/]*?)\s*(?:\/\s*([A-Ga-g][#b]?))?$/.exec(s);
    if (!m) return undefined;
    const root = notePc(m[1] + m[2]);
    let type = m[3].replace(/\s+/g, '');
    let known = type in TYPES;
    let iv = TYPES[type];
    if (!known) {
      // Unknown suffix: keep the basic quality it starts with.
      const k = Object.keys(TYPES).filter((x) => x && type.startsWith(x)).sort((a, b) => b.length - a.length)[0];
      iv = k ? TYPES[k] : /^m(?!aj)/.test(type) ? TYPES.m : TYPES[''];
    }
    const bass = m[4] ? notePc(m[4]) : root;
    const pcs = [...new Set(iv.map((i) => (root + i) % 12))];
    // On a guitar the fifth is the first tone to drop, then the 9th and 11th of a 13th chord.
    const drop = new Set();
    if (iv.length >= 4 && iv.includes(7)) drop.add((root + 7) % 12);
    if (iv.includes(21)) { drop.add((root + 14) % 12); drop.add((root + 17) % 12); }
    const essential = pcs.filter((p) => !drop.has(p));
    if (!essential.includes(bass)) essential.push(bass);
    const flat = /b/.test(m[2]) || [5, 10, 3, 8, 1].includes(root) && !/#/.test(m[2]);
    const nm = (pc) => (flat ? NAMES_FLAT : NAMES_SHARP)[pc];
    const name = `${m[1].toUpperCase()}${m[2]}${type}${m[4] ? `/${m[4][0].toUpperCase()}${m[4].slice(1)}` : ''}`;
    return { root, type, bass, intervals: iv, pcs: [...new Set([...pcs, bass])], essential, known, name, noteName: nm };
  }

  // ---- Guitar ----------------------------------------------------------------------------------
  const STANDARD = [40, 45, 50, 55, 59, 64]; // E2 A2 D3 G3 B3 E4, low to high

  // How a guitarist would play it: the usual open chords first, then the E- and A-shape barre
  // chords moved up the neck, and for anything else (slash chords, odd types) a search.
  const X = -1;
  const OPEN = {
    C: [X, 3, 2, 0, 1, 0], Cmaj7: [X, 3, 2, 0, 0, 0], C7: [X, 3, 2, 3, 1, 0], Cadd9: [X, 3, 2, 0, 3, 0], C6: [X, 3, 2, 2, 1, 0],
    D: [X, X, 0, 2, 3, 2], Dm: [X, X, 0, 2, 3, 1], D7: [X, X, 0, 2, 1, 2], Dm7: [X, X, 0, 2, 1, 1], Dmaj7: [X, X, 0, 2, 2, 2], Dsus2: [X, X, 0, 2, 3, 0], Dsus4: [X, X, 0, 2, 3, 3], D6: [X, X, 0, 2, 0, 2],
    G: [3, 2, 0, 0, 0, 3], G7: [3, 2, 0, 0, 0, 1], Gmaj7: [3, 2, 0, 0, 0, 2], G6: [3, 2, 0, 0, 0, 0],
    B7: [X, 2, 1, 2, 0, 2], Fmaj7: [X, X, 3, 2, 1, 0], E9: [0, 2, 0, 1, 0, 2], A9: [X, 0, 2, 4, 2, 3],
  };
  const SHAPE_E = { '': [0, 2, 2, 1, 0, 0], m: [0, 2, 2, 0, 0, 0], 7: [0, 2, 0, 1, 0, 0], m7: [0, 2, 0, 0, 0, 0], maj7: [0, X, 1, 1, 0, X], sus4: [0, 2, 2, 2, 0, 0], '7sus4': [0, 2, 0, 2, 0, 0], 5: [0, 2, 2, X, X, X], aug: [0, 3, 2, 1, 1, 0] };
  const SHAPE_A = { '': [X, 0, 2, 2, 2, 0], m: [X, 0, 2, 2, 1, 0], 7: [X, 0, 2, 0, 2, 0], m7: [X, 0, 2, 0, 1, 0], maj7: [X, 0, 2, 1, 2, 0], sus4: [X, 0, 2, 2, 3, 0], sus2: [X, 0, 2, 2, 0, 0], '7sus4': [X, 0, 2, 0, 3, 0], 6: [X, 0, 2, 2, 2, 2], m6: [X, 0, 2, 2, 1, 2], 9: [X, 0, 2, 4, 2, 3], add9: [X, 0, 2, 4, 2, 0], dim: [X, 0, 1, 2, 1, X], dim7: [X, 0, 1, 2, 1, 2], m7b5: [X, 0, 1, 0, 1, X], aug: [X, 0, 3, 2, 2, 1], 5: [X, 0, 2, 2, X, X] };
  const CANON = { maj: '', M: '', min: 'm', '-': 'm', M7: 'maj7', 'Δ': 'maj7', 'Δ7': 'maj7', min7: 'm7', '-7': 'm7', '°': 'dim', o: 'dim', '°7': 'dim7', o7: 'dim7', 'ø': 'm7b5', 'ø7': 'm7b5', 'm7(b5)': 'm7b5', '+': 'aug', sus: 'sus4', '7sus': '7sus4' };
  function fits(chord, frets, tuning) {
    const sounding = frets.map((f, i) => (f < 0 ? null : tuning[i] + f)).filter((v) => v !== null);
    const have = new Set(sounding.map((v) => v % 12));
    return sounding.length && sounding[0] % 12 === chord.bass && chord.essential.every((pc) => have.has(pc)) && [...have].every((pc) => chord.pcs.includes(pc));
  }
  function guitarShape(chord, tuning = STANDARD) {
    if (!chord) return null;
    const standard = tuning.every((v, i) => v === STANDARD[i]);
    if (standard && chord.known && chord.bass === chord.root) {
      const type = CANON[chord.type] ?? chord.type;
      const names = [NAMES_SHARP[chord.root], NAMES_FLAT[chord.root]].map((n) => n + type);
      for (const n of names) if (OPEN[n] && fits(chord, OPEN[n], tuning)) return OPEN[n].slice();
      const moved = [[SHAPE_E[type], (chord.root - 4 + 12) % 12], [SHAPE_A[type], (chord.root - 9 + 12) % 12]]
        .filter(([sh]) => sh).map(([sh, r]) => sh.map((f) => (f < 0 ? -1 : f + r)))
        .filter((fr) => fits(chord, fr, tuning))
        .sort((a, b) => Math.max(...a) - Math.max(...b));
      if (moved.length) return moved[0];
    }
    return searchShape(chord, tuning);
  }
  function searchShape(chord, tuning) {
    const pcs = new Set(chord.pcs);
    const fifth = (chord.root + 7) % 12;
    let best = null;
    for (let p = 0; p <= 9; p++) {
      const lo = p === 0 ? 1 : p, hi = lo + 3;
      const options = tuning.map((open) => {
        const o = [-1];
        if (pcs.has(open % 12)) o.push(0);
        for (let f = lo; f <= hi; f++) if (pcs.has((open + f) % 12)) o.push(f);
        return o;
      });
      const pick = new Array(tuning.length);
      const walk = (i) => {
        if (i === tuning.length) { consider(pick.slice(), p); return; }
        for (const f of options[i]) { pick[i] = f; walk(i + 1); }
      };
      const consider = (frets, pos) => {
        const sounding = frets.map((f, i) => (f < 0 ? null : tuning[i] + f));
        const idx = sounding.map((v, i) => (v === null ? -1 : i)).filter((i) => i >= 0);
        if (idx.length < Math.min(4, chord.essential.length + 1)) return;
        if (sounding[idx[0]] % 12 !== chord.bass) return;
        const have = new Set(idx.map((i) => sounding[i] % 12));
        if (!chord.essential.every((pc) => have.has(pc))) return;
        const fretted = frets.filter((f) => f > 0);
        if (fretted.length && Math.max(...fretted) - Math.min(...fretted) > 3) return;
        const minF = fretted.length ? Math.min(...fretted) : 0;
        const fingers = fretted.filter((f) => f !== minF).length + (fretted.some((f) => f === minF) ? 1 : 0);
        if (fingers > 4) return;
        const first = idx[0], last = idx[idx.length - 1];
        let inner = 0; for (let i = first; i <= last; i++) if (frets[i] < 0) inner++;
        if (inner > 1) return;
        const lead = first, trail = tuning.length - 1 - last;
        const opens = frets.filter((f) => f === 0).length;
        const maxF = fretted.length ? Math.max(...fretted) : 0;
        // Open strings only go with shapes near the nut.
        if (opens && maxF > 4) return;
        const barre = fretted.filter((f) => f === minF).length >= 2 && minF > 0;
        let score = idx.length * 10 - minF * 2 - maxF * 1.5 - inner * 25 - trail * 12 - lead * 2 + opens * 2 + (have.has(fifth) ? 3 : 0) - (barre ? 2 : 0);
        // A barre has to reach the top string.
        if (barre && frets[last] !== minF) score -= 6;
        if (!best || score > best.score) best = { frets, score };
      };
      walk(0);
    }
    return best ? best.frets : null;
  }
  const shapeText = (frets) => (frets ? frets.map((f) => (f < 0 ? 'x' : String(f))).join(frets.some((f) => f > 9) ? ' ' : '') : '');
  function parseShape(text, strings = 6) {
    const s = String(text || '').trim().toLowerCase();
    const parts = /\s|,|-/.test(s) ? s.split(/[\s,\-]+/).filter(Boolean) : [...s];
    if (parts.length !== strings) return null;
    const frets = parts.map((p) => (p === 'x' || p === 'm' ? -1 : /^\d+$/.test(p) ? Number(p) : NaN));
    return frets.some((f) => Number.isNaN(f) || f > 24) ? null : frets;
  }
  const shapePitches = (frets, tuning = STANDARD) => frets.map((f, i) => (f < 0 ? null : tuning[i] + f)).filter((x) => x !== null);

  // ---- Piano -------------------------------------------------------------------------------------
  // Close position from the root around `octave` (4 = middle C), plus the bass an octave below.
  function pianoVoicing(chord, octave = 4, withBass = true) {
    if (!chord) return [];
    const base = 12 * (octave + 1) + chord.root;
    const up = chord.intervals.map((i) => base + (i > 12 ? i - 12 : i));
    const notes = [...new Set(up)].sort((a, b) => a - b);
    if (withBass) {
      let b = 12 * octave + chord.bass;
      while (b >= notes[0]) b -= 12;
      notes.unshift(b);
    } else if (chord.bass !== chord.root) {
      // Slash chord without a separate bass: put the bass note at the bottom.
      const b = notes.find((n) => n % 12 === chord.bass);
      const rest = notes.filter((n) => n !== b);
      let low = b ?? 12 * (octave + 1) + chord.bass;
      while (low >= rest[0]) low -= 12;
      return [low, ...rest];
    }
    return notes;
  }

  // ---- Rhythm ------------------------------------------------------------------------------------
  // Hits as [beat, direction, short]. `len` is the pattern length in beats.
  const PATTERNS = {
    hold: { len: 0, hits: [[0, 'D']] },
    bar: { len: 4, hits: [[0, 'D']] },
    half: { len: 4, hits: [[0, 'D'], [2, 'D']] },
    quarter: { len: 4, hits: [[0, 'D'], [1, 'D'], [2, 'D'], [3, 'D']] },
    eighths: { len: 4, hits: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map((b) => [b, b % 1 ? 'U' : 'D']) },
    pop: { len: 4, hits: [[0, 'D'], [1, 'D'], [1.5, 'U'], [2.5, 'U'], [3, 'D'], [3.5, 'U']] },
    ballad: { len: 4, hits: [[0, 'D'], [1, 'D'], [2, 'D'], [2.5, 'U'], [3, 'D']] },
    rock: { len: 4, hits: [[0, 'D'], [0.5, 'D'], [1, 'D'], [1.5, 'D'], [2, 'D'], [2.5, 'D'], [3, 'D'], [3.5, 'D']] },
    offbeat: { len: 4, hits: [[0.5, 'U', 1], [1.5, 'U', 1], [2.5, 'U', 1], [3.5, 'U', 1]] },
    sixteenths: { len: 4, hits: Array.from({ length: 16 }, (_, i) => [i / 4, i % 2 ? 'U' : 'D']) },
  };
  const PATTERN_LIST = ['hold', 'bar', 'half', 'quarter', 'eighths', 'pop', 'ballad', 'rock', 'offbeat', 'sixteenths'];

  // ---- Strum ---------------------------------------------------------------------------------------
  // notes: [{ pitch, start, stop, velocity, channel }] in absolute ticks. Returns a new list.
  // o: { gapTicks, stepTicks(at), dir(base) -> 'D'|'U', upScale, jitterTicks(at), velJitter, keepEnds, rand }
  function groupChords(notes, gapTicks) {
    const sorted = [...notes].sort((a, b) => a.start - b.start || a.pitch - b.pitch);
    const groups = [];
    let g = null;
    for (const n of sorted) {
      if (g && n.start - g.last <= gapTicks && !g.notes.some((x) => x.pitch === n.pitch)) { g.notes.push(n); g.last = n.start; }
      else { g = { notes: [n], last: n.start }; groups.push(g); }
    }
    return groups.map((x) => x.notes);
  }
  function strum(notes, o) {
    const rand = o.rand || Math.random;
    const out = [];
    for (const group of groupChords(notes, o.gapTicks)) {
      if (group.length < 2) { out.push(...group.map((n) => ({ ...n }))); continue; }
      const base0 = Math.min(...group.map((n) => n.start));
      const base = Math.max(0, base0 + Math.round((rand() * 2 - 1) * (o.jitterTicks ? o.jitterTicks(base0) : 0)));
      const dir = o.dir(base0);
      const order = [...group].sort((a, b) => (dir === 'U' ? b.pitch - a.pitch : a.pitch - b.pitch));
      const step = o.stepTicks(base);
      order.forEach((n, i) => {
        const start = base + Math.round(i * step * (i ? 1 + (rand() - 0.5) * 0.3 * (o.loose ?? 1) : 0));
        let vel = n.velocity * (dir === 'U' ? o.upScale : 1);
        vel += (rand() * 2 - 1) * (o.velJitter || 0);
        const stop = o.keepEnds ? Math.max(start + 1, n.stop) : start + (n.stop - n.start);
        out.push({ ...n, start, stop, velocity: Math.max(1, Math.min(127, Math.round(vel))) });
      });
    }
    return out;
  }


  // ---- Keys and what comes next ------------------------------------------------------------------
  const KEY_NAMES_MAJ = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const KEY_NAMES_MIN = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
  const MODES = {
    major: { steps: [0, 2, 4, 5, 7, 9, 11], tri: ['', 'm', 'm', '', '', 'm', 'dim'], sev: ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'], roman: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
      next: [[3, 4, 5, 1], [4, 6, 3], [5, 3, 1], [4, 0, 1, 5], [0, 5, 3], [3, 1, 4, 2], [0, 2]],
      borrowed: [[10, '', '7', '♭VII'], [5, 'm', 'm7', 'iv'], [8, '', 'maj7', '♭VI']] },
    minor: { steps: [0, 2, 3, 5, 7, 8, 10], tri: ['m', 'dim', '', 'm', '', '', ''], sev: ['m7', 'm7b5', 'maj7', 'm7', '7', 'maj7', '7'], roman: ['i', 'ii°', 'III', 'iv', 'V', 'VI', 'VII'],
      next: [[3, 5, 6, 4], [4, 3], [5, 3, 6], [4, 0, 6], [0, 5], [2, 3, 6, 1], [2, 0]],
      borrowed: [[5, '', '7', 'IV'], [7, 'm', 'm7', 'v'], [1, '', 'maj7', '♭II']] },
  };
  const keyUsesFlats = (pc, minor) => (minor ? [2, 7, 0, 5, 10, 3].includes(pc) : [5, 10, 3, 8, 1].includes(pc));
  function keyChords(pc, minor, sevenths) {
    const m = MODES[minor ? 'minor' : 'major'];
    const names = keyUsesFlats(pc, minor) ? NAMES_FLAT : NAMES_SHARP;
    const one = (rootPc, type) => names[(rootPc + 12) % 12] + type;
    return {
      diatonic: m.steps.map((st, i) => ({ degree: i, roman: m.roman[i], name: one(pc + st, sevenths ? m.sev[i] : m.tri[i]) })),
      borrowed: m.borrowed.map(([st, tri, sev, roman]) => ({ roman, name: (roman.startsWith('♭') ? NAMES_FLAT : names)[(pc + st) % 12] + (sevenths ? sev : tri) })),
    };
  }
  // Which degrees usually follow `chordName` in this key; the tonic, IV and V when it is not in the key.
  function suggestNext(pc, minor, chordName) {
    const m = MODES[minor ? 'minor' : 'major'];
    const c = parseChord(chordName);
    if (c) {
      const isMinor = c.intervals.includes(3) && !c.intervals.includes(4);
      const isDim = c.intervals.includes(6) && !c.intervals.includes(7);
      for (let i = 0; i < 7; i++) {
        if ((pc + m.steps[i]) % 12 !== c.root) continue;
        const q = m.tri[i];
        if ((q === 'dim' && isDim) || (q === 'm' && isMinor && !isDim) || (q === '' && !isMinor && !isDim)) return m.next[i];
      }
    }
    return minor ? [0, 3, 4] : [0, 3, 4];
  }
  const keyFromSignature = (sharpsAndFlats, minor) => {
    const maj = ((sharpsAndFlats * 7) % 12 + 12) % 12;
    return minor ? (maj + 9) % 12 : maj;
  };

  root.StrumTheory = { KEY_NAMES_MAJ, KEY_NAMES_MIN, keyChords, suggestNext, keyFromSignature, notePc, parseChord, TYPES, TYPE_LIST, NAMES_SHARP, NAMES_FLAT, STANDARD, guitarShape, shapeText, parseShape, shapePitches, pianoVoicing, PATTERNS, PATTERN_LIST, groupChords, strum };
})(typeof window !== 'undefined' ? window : globalThis);
