// Strummer: writes chords into a MIDI track (from a chord name, a guitar shape or LUNA's Chord
// ruler, with a rhythm pattern) and strums chords already there, like a guitarist would: the
// strings a few milliseconds apart, down or up, softer on the upstroke, a little human.

(() => {
  const $ = (id) => document.getElementById(id);
  const T = window.StrumTheory;
  const VERSION = '1.0.0';
  const KEY = 'com.fedetrillo.strummer.';
  const store = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* not fatal */ } },
  };

  // ---- Texts ---------------------------------------------------------------------------------
  const PAT = (hold, bar, half, quarter, eighths, pop, ballad, rock, offbeat, sixteenths) => ({ hold, bar, half, quarter, eighths, pop, ballad, rock, offbeat, sixteenths });
  const I18N = {
    es: { _name: 'Español', target: 'Destino', noTrack: 'Selecciona una pista de instrumento en LUNA (y un rango, si quieres).', range: '{from} → {to}', rangeAuto: '{from} · 1 compás desde el cursor (no hay rango)',
      key: 'Tono', major: 'Mayor', minor: 'menor', fromLuna: 'De LUNA', fromLunaTip: 'Leer la armadura de la sesión', noKeyLuna: 'La sesión no tiene armadura: elige el tono a mano.', sev: 'Séptimas', next: 'Tras {c}: sugeridos en verde · doble clic inserta', nextStart: 'Acordes del tono · doble clic inserta', inKey: 'En el tono · prestados',
      dur: 'Duración', durRange: 'Todo el rango', durBeat: '1 tiempo', durHalf: '½ compás', dur1: '1 compás', dur2: '2 compases', dur4: '4 compases', len: 'Notas', lenLegato: 'Ligadas', lenHalf: 'Medias', lenShort: 'Cortas', advance: 'Avanzar', rangeDur: '{from} → {to} · desde {where}', fromSel: 'el inicio de la selección', fromCursor: 'el cursor',
      chords: 'Acordes', src: 'Origen', srcChord: 'Acorde', srcRuler: 'Regla', rulerInfo: 'Usa los acordes de la regla de LUNA dentro del rango.', rulerList: 'En el rango: {list}', rulerNone: 'No hay acordes en la regla dentro del rango.',
      inst: 'Voicing', guitar: 'Guitarra', piano: 'Piano', shape: 'Posición (6.ª → 1.ª cuerda)', auto: 'Auto', octave: 'Octava', pBass: 'Bajo una octava abajo',
      rhythm: 'Ritmo', patterns: PAT('Sostenido', 'Un golpe por compás', 'Blancas', 'Negras', 'Corcheas ↓↑', 'Pop ↓ ↓↑ ↑↓↑', 'Balada ↓ ↓ ↓↑ ↓', 'Rock (corcheas ↓)', 'Contratiempo (reggae)', 'Semicorcheas ↓↑'),
      replace: 'Reemplazar notas', strumIns: 'Rasguear al insertar', insert: 'Insertar acordes',
      strum: 'Rasgueo', speed: 'Velocidad', dir: 'Dirección', down: '↓ Abajo', up: '↑ Arriba', alt: '↕ Alterna', autoDir: 'Auto', accent: 'Arriba más suave', humT: 'Humanizar tiempo', humV: 'Humanizar fuerza',
      keepEnds: 'Mantener finales', apply: 'Rasguear', straight: 'Enderezar', applyHint: 'Actúa sobre las notas seleccionadas o, si no hay, sobre las del rango en las pistas seleccionadas. «Auto» toca abajo en los tiempos y arriba a contratiempo.',
      badChord: 'No reconozco «{c}».', unknownType: 'Tipo «{t}» desconocido: uso {u}.', badShape: 'Escribe 6 trastes, de la 6.ª a la 1.ª cuerda; x = cuerda muda.', notes: 'Notas: {n}',
      partial: 'El rango toca un clip sin cubrirlo entero: selecciona dentro de un clip o en un hueco libre.', inserted: '{n} acordes insertados. Cmd+Z en LUNA para deshacer.', strummed: '{n} acordes rasgueados. Cmd+Z para deshacer.', straightened: '{n} acordes enderezados.',
      nothing: 'No hay acordes (2 o más notas a la vez) que rasguear.', failed: 'Error: {e}', waiting: 'Esperando a LUNA…', noSession: 'Abre una sesión en LUNA.', copied: 'Informe copiado', dark: 'Oscuro', grey: 'Gris', working: 'Escribiendo…' },
    en: { _name: 'English', target: 'Target', noTrack: 'Select an instrument track in LUNA (and a range, if you like).', range: '{from} → {to}', rangeAuto: '{from} · 1 bar from the cursor (no range)',
      key: 'Key', major: 'Major', minor: 'minor', fromLuna: 'From LUNA', fromLunaTip: 'Read the session’s key signature', noKeyLuna: 'The session has no key signature: pick the key by hand.', sev: 'Sevenths', next: 'After {c}: suggestions in green · double-click inserts', nextStart: 'Chords in the key · double-click inserts', inKey: 'In the key · borrowed',
      dur: 'Length', durRange: 'Whole range', durBeat: '1 beat', durHalf: '½ bar', dur1: '1 bar', dur2: '2 bars', dur4: '4 bars', len: 'Notes', lenLegato: 'Legato', lenHalf: 'Half', lenShort: 'Short', advance: 'Move on', rangeDur: '{from} → {to} · from {where}', fromSel: 'the selection start', fromCursor: 'the cursor',
      chords: 'Chords', src: 'Source', srcChord: 'Chord', srcRuler: 'Ruler', rulerInfo: 'Uses the chords on LUNA’s Chord ruler within the range.', rulerList: 'In range: {list}', rulerNone: 'No chords on the ruler within the range.',
      inst: 'Voicing', guitar: 'Guitar', piano: 'Piano', shape: 'Shape (6th → 1st string)', auto: 'Auto', octave: 'Octave', pBass: 'Bass an octave below',
      rhythm: 'Rhythm', patterns: PAT('Sustained', 'One hit per bar', 'Half notes', 'Quarter notes', 'Eighths ↓↑', 'Pop ↓ ↓↑ ↑↓↑', 'Ballad ↓ ↓ ↓↑ ↓', 'Rock (eighths ↓)', 'Offbeat (reggae)', 'Sixteenths ↓↑'),
      replace: 'Replace notes', strumIns: 'Strum on insert', insert: 'Insert chords',
      strum: 'Strum', speed: 'Speed', dir: 'Direction', down: '↓ Down', up: '↑ Up', alt: '↕ Alternate', autoDir: 'Auto', accent: 'Softer upstroke', humT: 'Humanize timing', humV: 'Humanize velocity',
      keepEnds: 'Keep note ends', apply: 'Strum', straight: 'Straighten', applyHint: 'Acts on the selected notes or, if none, on the notes in the range on the selected tracks. "Auto" strums down on the beat and up on the off-beat.',
      badChord: 'I don’t recognise "{c}".', unknownType: 'Unknown type "{t}": using {u}.', badShape: 'Type 6 frets, 6th to 1st string; x = muted string.', notes: 'Notes: {n}',
      partial: 'The range touches a clip without covering it: select inside one clip or in an empty gap.', inserted: '{n} chords inserted. Cmd+Z in LUNA to undo.', strummed: '{n} chords strummed. Cmd+Z to undo.', straightened: '{n} chords straightened.',
      nothing: 'No chords (2 or more notes together) to strum.', failed: 'Error: {e}', waiting: 'Waiting for LUNA…', noSession: 'Open a session in LUNA.', copied: 'Report copied', dark: 'Dark', grey: 'Grey', working: 'Writing…' },
    ca: { _name: 'Català', target: 'Destí', noTrack: 'Selecciona una pista d’instrument a LUNA (i un rang, si vols).', range: '{from} → {to}', rangeAuto: '{from} · 1 compàs des del cursor (no hi ha rang)',
      key: 'To', major: 'Major', minor: 'menor', fromLuna: 'De LUNA', fromLunaTip: 'Llegir l’armadura de la sessió', noKeyLuna: 'La sessió no té armadura: tria el to a mà.', sev: 'Setenes', next: 'Després de {c}: suggerits en verd · doble clic insereix', nextStart: 'Acords del to · doble clic insereix', inKey: 'En el to · manllevats',
      dur: 'Durada', durRange: 'Rang', durBeat: '1 temps', durHalf: '½ comp.', dur1: '1 comp.', dur2: '2 comp.', dur4: '4 comp.', len: 'Notes', lenLegato: 'Lligades', lenHalf: 'Mitjanes', lenShort: 'Curtes', advance: 'Avançar', rangeDur: '{from} → {to} · des de {where}', fromSel: 'l’inici de la selecció', fromCursor: 'el cursor',
      chords: 'Acords', src: 'Origen', srcChord: 'Acord', srcRuler: 'Regle', rulerInfo: 'Fa servir els acords del regle de LUNA dins del rang.', rulerList: 'Al rang: {list}', rulerNone: 'No hi ha acords al regle dins del rang.',
      inst: 'Voicing', guitar: 'Guitarra', piano: 'Piano', shape: 'Posició (6a → 1a corda)', auto: 'Auto', octave: 'Octava', pBass: 'Baix una octava avall',
      rhythm: 'Ritme', patterns: PAT('Sostingut', 'Un cop per compàs', 'Blanques', 'Negres', 'Corxeres ↓↑', 'Pop ↓ ↓↑ ↑↓↑', 'Balada ↓ ↓ ↓↑ ↓', 'Rock (corxeres ↓)', 'Contratemps (reggae)', 'Semicorxeres ↓↑'),
      replace: 'Substituir notes', strumIns: 'Rasguejar en inserir', insert: 'Inserir acords',
      strum: 'Rasgueig', speed: 'Velocitat', dir: 'Direcció', down: '↓ Avall', up: '↑ Amunt', alt: '↕ Alterna', autoDir: 'Auto', accent: 'Amunt més suau', humT: 'Humanitzar temps', humV: 'Humanitzar força',
      keepEnds: 'Mantenir finals', apply: 'Rasguejar', straight: 'Redreçar', applyHint: 'Actua sobre les notes seleccionades o, si no n’hi ha, sobre les del rang a les pistes seleccionades. «Auto» toca avall als temps i amunt a contratemps.',
      badChord: 'No reconec «{c}».', unknownType: 'Tipus «{t}» desconegut: faig servir {u}.', badShape: 'Escriu 6 trasts, de la 6a a la 1a corda; x = corda muda.', notes: 'Notes: {n}',
      partial: 'El rang toca un clip sense cobrir-lo sencer: selecciona dins d’un clip o en un buit.', inserted: '{n} acords inserits. Cmd+Z a LUNA per desfer.', strummed: '{n} acords rasguejats. Cmd+Z per desfer.', straightened: '{n} acords redreçats.',
      nothing: 'No hi ha acords (2 o més notes alhora) per rasguejar.', failed: 'Error: {e}', waiting: 'Esperant LUNA…', noSession: 'Obre una sessió a LUNA.', copied: 'Informe copiat', dark: 'Fosc', grey: 'Gris', working: 'Escrivint…' },
    fr: { _name: 'Français', target: 'Cible', noTrack: 'Sélectionnez une piste d’instrument dans LUNA (et une plage, si vous voulez).', range: '{from} → {to}', rangeAuto: '{from} · 1 mesure depuis le curseur (pas de plage)',
      key: 'Tonalité', major: 'Majeur', minor: 'mineur', fromLuna: 'De LUNA', fromLunaTip: 'Lire l’armure de la session', noKeyLuna: 'La session n’a pas d’armure : choisissez la tonalité à la main.', sev: 'Septièmes', next: 'Après {c} : suggestions en vert · double-clic insère', nextStart: 'Accords de la tonalité · double-clic insère', inKey: 'Dans la tonalité · empruntés',
      dur: 'Durée', durRange: 'Plage', durBeat: '1 temps', durHalf: '½ mes.', dur1: '1 mes.', dur2: '2 mes.', dur4: '4 mes.', len: 'Notes', lenLegato: 'Liées', lenHalf: 'Moyennes', lenShort: 'Courtes', advance: 'Avancer', rangeDur: '{from} → {to} · depuis {where}', fromSel: 'le début de la sélection', fromCursor: 'le curseur',
      chords: 'Accords', src: 'Source', srcChord: 'Accord', srcRuler: 'Règle', rulerInfo: 'Utilise les accords de la règle de LUNA dans la plage.', rulerList: 'Dans la plage : {list}', rulerNone: 'Aucun accord sur la règle dans la plage.',
      inst: 'Voicing', guitar: 'Guitare', piano: 'Piano', shape: 'Position (6e → 1re corde)', auto: 'Auto', octave: 'Octave', pBass: 'Basse une octave en dessous',
      rhythm: 'Rythme', patterns: PAT('Tenu', 'Un coup par mesure', 'Blanches', 'Noires', 'Croches ↓↑', 'Pop ↓ ↓↑ ↑↓↑', 'Ballade ↓ ↓ ↓↑ ↓', 'Rock (croches ↓)', 'Contretemps (reggae)', 'Doubles croches ↓↑'),
      replace: 'Remplacer les notes', strumIns: 'Gratter à l’insertion', insert: 'Insérer les accords',
      strum: 'Grattage', speed: 'Vitesse', dir: 'Direction', down: '↓ Bas', up: '↑ Haut', alt: '↕ Alterné', autoDir: 'Auto', accent: 'Montée plus douce', humT: 'Humaniser le temps', humV: 'Humaniser la vélocité',
      keepEnds: 'Garder les fins', apply: 'Gratter', straight: 'Redresser', applyHint: 'Agit sur les notes sélectionnées ou, à défaut, sur celles de la plage des pistes sélectionnées. « Auto » gratte vers le bas sur le temps et vers le haut à contretemps.',
      badChord: 'Je ne reconnais pas « {c} ».', unknownType: 'Type « {t} » inconnu : j’utilise {u}.', badShape: 'Tapez 6 cases, de la 6e à la 1re corde ; x = corde étouffée.', notes: 'Notes : {n}',
      partial: 'La plage touche un clip sans le couvrir : sélectionnez dans un clip ou dans un espace vide.', inserted: '{n} accords insérés. Cmd+Z dans LUNA pour annuler.', strummed: '{n} accords grattés. Cmd+Z pour annuler.', straightened: '{n} accords redressés.',
      nothing: 'Aucun accord (2 notes ou plus ensemble) à gratter.', failed: 'Erreur : {e}', waiting: 'En attente de LUNA…', noSession: 'Ouvrez une session dans LUNA.', copied: 'Rapport copié', dark: 'Sombre', grey: 'Gris', working: 'Écriture…' },
    de: { _name: 'Deutsch', target: 'Ziel', noTrack: 'Wähle in LUNA eine Instrumentenspur (und auf Wunsch einen Bereich).', range: '{from} → {to}', rangeAuto: '{from} · 1 Takt ab dem Cursor (kein Bereich)',
      key: 'Tonart', major: 'Dur', minor: 'Moll', fromLuna: 'Aus LUNA', fromLunaTip: 'Vorzeichen der Session lesen', noKeyLuna: 'Die Session hat keine Tonart: wähle sie von Hand.', sev: 'Septimen', next: 'Nach {c}: Vorschläge in Grün · Doppelklick fügt ein', nextStart: 'Akkorde der Tonart · Doppelklick fügt ein', inKey: 'In der Tonart · entliehen',
      dur: 'Dauer', durRange: 'Bereich', durBeat: '1 Schlag', durHalf: '½ Takt', dur1: '1 Takt', dur2: '2 Takte', dur4: '4 Takte', len: 'Noten', lenLegato: 'Legato', lenHalf: 'Halb', lenShort: 'Kurz', advance: 'Weiterrücken', rangeDur: '{from} → {to} · ab {where}', fromSel: 'Auswahlbeginn', fromCursor: 'Cursor',
      chords: 'Akkorde', src: 'Quelle', srcChord: 'Akkord', srcRuler: 'Lineal', rulerInfo: 'Nimmt die Akkorde aus LUNAs Akkordlineal im Bereich.', rulerList: 'Im Bereich: {list}', rulerNone: 'Keine Akkorde im Lineal innerhalb des Bereichs.',
      inst: 'Voicing', guitar: 'Gitarre', piano: 'Klavier', shape: 'Griff (6. → 1. Saite)', auto: 'Auto', octave: 'Oktave', pBass: 'Bass eine Oktave tiefer',
      rhythm: 'Rhythmus', patterns: PAT('Gehalten', 'Ein Schlag pro Takt', 'Halbe', 'Viertel', 'Achtel ↓↑', 'Pop ↓ ↓↑ ↑↓↑', 'Ballade ↓ ↓ ↓↑ ↓', 'Rock (Achtel ↓)', 'Offbeat (Reggae)', 'Sechzehntel ↓↑'),
      replace: 'Noten ersetzen', strumIns: 'Beim Einfügen anschlagen', insert: 'Akkorde einfügen',
      strum: 'Anschlag', speed: 'Tempo', dir: 'Richtung', down: '↓ Ab', up: '↑ Auf', alt: '↕ Wechselnd', autoDir: 'Auto', accent: 'Aufschlag leiser', humT: 'Timing humanisieren', humV: 'Anschlag humanisieren',
      keepEnds: 'Notenenden behalten', apply: 'Anschlagen', straight: 'Begradigen', applyHint: 'Wirkt auf die ausgewählten Noten, sonst auf die Noten im Bereich der ausgewählten Spuren. „Auto“ schlägt auf dem Schlag ab und auf dem Offbeat auf.',
      badChord: '„{c}“ kenne ich nicht.', unknownType: 'Unbekannter Typ „{t}“: nehme {u}.', badShape: '6 Bünde eingeben, 6. bis 1. Saite; x = gedämpfte Saite.', notes: 'Noten: {n}',
      partial: 'Der Bereich berührt einen Clip, ohne ihn abzudecken: wähle innerhalb eines Clips oder in einer Lücke.', inserted: '{n} Akkorde eingefügt. Cmd+Z in LUNA macht es rückgängig.', strummed: '{n} Akkorde angeschlagen. Cmd+Z macht es rückgängig.', straightened: '{n} Akkorde begradigt.',
      nothing: 'Keine Akkorde (2 oder mehr Noten zugleich) zum Anschlagen.', failed: 'Fehler: {e}', waiting: 'Warte auf LUNA…', noSession: 'Öffne eine Session in LUNA.', copied: 'Bericht kopiert', dark: 'Dunkel', grey: 'Grau', working: 'Schreibe…' },
    it: { _name: 'Italiano', target: 'Destinazione', noTrack: 'Seleziona una traccia strumento in LUNA (e un intervallo, se vuoi).', range: '{from} → {to}', rangeAuto: '{from} · 1 battuta dal cursore (nessun intervallo)',
      key: 'Tonalità', major: 'Maggiore', minor: 'minore', fromLuna: 'Da LUNA', fromLunaTip: 'Leggi l’armatura della sessione', noKeyLuna: 'La sessione non ha armatura: scegli la tonalità a mano.', sev: 'Settime', next: 'Dopo {c}: suggeriti in verde · doppio clic inserisce', nextStart: 'Accordi della tonalità · doppio clic inserisce', inKey: 'Nella tonalità · in prestito',
      dur: 'Durata', durRange: 'Intervallo', durBeat: '1 movimento', durHalf: '½ batt.', dur1: '1 batt.', dur2: '2 batt.', dur4: '4 batt.', len: 'Note', lenLegato: 'Legate', lenHalf: 'Medie', lenShort: 'Corte', advance: 'Avanza', rangeDur: '{from} → {to} · da {where}', fromSel: 'l’inizio della selezione', fromCursor: 'il cursore',
      chords: 'Accordi', src: 'Origine', srcChord: 'Accordo', srcRuler: 'Righello', rulerInfo: 'Usa gli accordi del righello di LUNA nell’intervallo.', rulerList: 'Nell’intervallo: {list}', rulerNone: 'Nessun accordo sul righello nell’intervallo.',
      inst: 'Voicing', guitar: 'Chitarra', piano: 'Pianoforte', shape: 'Posizione (6ª → 1ª corda)', auto: 'Auto', octave: 'Ottava', pBass: 'Basso un’ottava sotto',
      rhythm: 'Ritmo', patterns: PAT('Tenuto', 'Un colpo per battuta', 'Minime', 'Semiminime', 'Crome ↓↑', 'Pop ↓ ↓↑ ↑↓↑', 'Ballata ↓ ↓ ↓↑ ↓', 'Rock (crome ↓)', 'Controtempo (reggae)', 'Semicrome ↓↑'),
      replace: 'Sostituisci note', strumIns: 'Pennata all’inserimento', insert: 'Inserisci accordi',
      strum: 'Pennata', speed: 'Velocità', dir: 'Direzione', down: '↓ Giù', up: '↑ Su', alt: '↕ Alternata', autoDir: 'Auto', accent: 'In su più morbida', humT: 'Umanizza tempo', humV: 'Umanizza forza',
      keepEnds: 'Mantieni le fini', apply: 'Pennata', straight: 'Raddrizza', applyHint: 'Agisce sulle note selezionate o, se non ce ne sono, su quelle nell’intervallo delle tracce selezionate. «Auto» va giù sul tempo e su in controtempo.',
      badChord: 'Non riconosco «{c}».', unknownType: 'Tipo «{t}» sconosciuto: uso {u}.', badShape: 'Scrivi 6 tasti, dalla 6ª alla 1ª corda; x = corda muta.', notes: 'Note: {n}',
      partial: 'L’intervallo tocca un clip senza coprirlo: seleziona dentro un clip o in uno spazio vuoto.', inserted: '{n} accordi inseriti. Cmd+Z in LUNA per annullare.', strummed: '{n} accordi con pennata. Cmd+Z per annullare.', straightened: '{n} accordi raddrizzati.',
      nothing: 'Nessun accordo (2 o più note insieme) su cui fare la pennata.', failed: 'Errore: {e}', waiting: 'In attesa di LUNA…', noSession: 'Apri una sessione in LUNA.', copied: 'Rapporto copiato', dark: 'Scuro', grey: 'Grigio', working: 'Scrittura…' },
    pt: { _name: 'Português', target: 'Destino', noTrack: 'Seleciona uma faixa de instrumento no LUNA (e um intervalo, se quiseres).', range: '{from} → {to}', rangeAuto: '{from} · 1 compasso a partir do cursor (sem intervalo)',
      key: 'Tom', major: 'Maior', minor: 'menor', fromLuna: 'Do LUNA', fromLunaTip: 'Ler a armação da sessão', noKeyLuna: 'A sessão não tem armação: escolhe o tom à mão.', sev: 'Sétimas', next: 'Depois de {c}: sugestões a verde · duplo clique insere', nextStart: 'Acordes do tom · duplo clique insere', inKey: 'No tom · emprestados',
      dur: 'Duração', durRange: 'Intervalo', durBeat: '1 tempo', durHalf: '½ comp.', dur1: '1 comp.', dur2: '2 comp.', dur4: '4 comp.', len: 'Notas', lenLegato: 'Ligadas', lenHalf: 'Médias', lenShort: 'Curtas', advance: 'Avançar', rangeDur: '{from} → {to} · a partir de {where}', fromSel: 'o início da seleção', fromCursor: 'o cursor',
      chords: 'Acordes', src: 'Origem', srcChord: 'Acorde', srcRuler: 'Régua', rulerInfo: 'Usa os acordes da régua do LUNA dentro do intervalo.', rulerList: 'No intervalo: {list}', rulerNone: 'Não há acordes na régua dentro do intervalo.',
      inst: 'Voicing', guitar: 'Guitarra', piano: 'Piano', shape: 'Posição (6.ª → 1.ª corda)', auto: 'Auto', octave: 'Oitava', pBass: 'Baixo uma oitava abaixo',
      rhythm: 'Ritmo', patterns: PAT('Sustentado', 'Um golpe por compasso', 'Mínimas', 'Semínimas', 'Colcheias ↓↑', 'Pop ↓ ↓↑ ↑↓↑', 'Balada ↓ ↓ ↓↑ ↓', 'Rock (colcheias ↓)', 'Contratempo (reggae)', 'Semicolcheias ↓↑'),
      replace: 'Substituir notas', strumIns: 'Rasgar ao inserir', insert: 'Inserir acordes',
      strum: 'Rasgueado', speed: 'Velocidade', dir: 'Direção', down: '↓ Abaixo', up: '↑ Acima', alt: '↕ Alternada', autoDir: 'Auto', accent: 'Para cima mais suave', humT: 'Humanizar tempo', humV: 'Humanizar força',
      keepEnds: 'Manter finais', apply: 'Rasgar', straight: 'Endireitar', applyHint: 'Atua sobre as notas selecionadas ou, se não houver, sobre as do intervalo nas faixas selecionadas. «Auto» toca para baixo nos tempos e para cima nos contratempos.',
      badChord: 'Não reconheço «{c}».', unknownType: 'Tipo «{t}» desconhecido: uso {u}.', badShape: 'Escreve 6 trastos, da 6.ª à 1.ª corda; x = corda abafada.', notes: 'Notas: {n}',
      partial: 'O intervalo toca num clip sem o cobrir: seleciona dentro de um clip ou num espaço vazio.', inserted: '{n} acordes inseridos. Cmd+Z no LUNA para desfazer.', strummed: '{n} acordes rasgados. Cmd+Z para desfazer.', straightened: '{n} acordes endireitados.',
      nothing: 'Não há acordes (2 ou mais notas juntas) para rasgar.', failed: 'Erro: {e}', waiting: 'À espera do LUNA…', noSession: 'Abre uma sessão no LUNA.', copied: 'Relatório copiado', dark: 'Escuro', grey: 'Cinzento', working: 'A escrever…' },
  };
  const LANGS = Object.keys(I18N);
  let lang = (() => {
    const saved = store.get('lang');
    if (saved && I18N[saved]) return saved;
    for (const l of navigator.languages ?? [navigator.language]) { const c = String(l || '').slice(0, 2).toLowerCase(); if (I18N[c]) return c; }
    return 'en';
  })();
  const t = (k, v = {}) => String(I18N[lang][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (m, x) => (x in v ? String(v[x]) : m));

  let status = { key: null, vars: {}, kind: '' };
  let statusTimer = null;
  function say(key, vars = {}, kind = '', ms = 0) {
    status = { key, vars, kind };
    clearTimeout(statusTimer);
    if (ms) statusTimer = setTimeout(() => say(null), ms);
    $('status').textContent = key ? t(key, vars) : '';
    $('status').className = `status ${kind}`;
  }
  const log = [];
  const note = (what, extra = {}) => { log.push({ t: new Date().toISOString().slice(11, 23), what, ...extra }); if (log.length > 120) log.shift(); };
  const errText = (e) => String(e?.message || e);

  // ---- Settings --------------------------------------------------------------------------------
  const opts = {
    src: 'chord', chord: 'Am', inst: 'guitar', shape: '', octave: 4, pBass: true, key: null, minor: false, sev: false, rhythm: 'pop', dur: 'range', len: 'legato', advance: true, replace: true, strumIns: true,
    speed: 18, dir: 'auto', accent: 20, humT: 4, humV: 6, keepEnds: true,
    ...(store.get('opts') ?? {}),
  };
  const save = () => store.set('opts', opts);
  let theme = store.get('theme') === 'grey' ? 'grey' : 'dark';

  // ---- Chord and shape -----------------------------------------------------------------------------
  const NOTE_NAMES = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const chordNow = () => T.parseChord(opts.chord);
  const shapeNow = () => (opts.shape ? T.parseShape(opts.shape) : null) ?? T.guitarShape(chordNow());
  const midiName = (p) => `${T.NAMES_SHARP[p % 12]}${Math.floor(p / 12) - 1}`;

  function paintChord() {
    const c = chordNow();
    const info = $('chordInfo');
    if (!c) { info.textContent = opts.chord.trim() ? t('badChord', { c: opts.chord }) : ''; info.style.color = 'var(--bad)'; }
    else {
      info.style.color = '';
      const names = c.pcs.map((pc) => c.noteName(pc)).join(' · ');
      info.textContent = c.known ? names : `${t('unknownType', { t: c.type, u: c.intervals.length === 3 && c.intervals[1] === 3 ? 'm' : 'maj' })} ${names}`;
      const m = /^([A-Ga-g][#b]?)/.exec(opts.chord.trim());
      if (m) $('root').value = NOTE_NAMES.find((n) => n.toLowerCase() === m[1].toLowerCase()) ?? $('root').value;
      $('type').value = T.TYPE_LIST.includes(c.type) ? c.type : '';
      const b = /\/\s*([A-Ga-g][#b]?)\s*$/.exec(opts.chord);
      $('bass').value = b ? NOTE_NAMES.find((n) => n.toLowerCase() === b[1].toLowerCase()) ?? '' : '';
    }
    paintShape();
    paintKey();
  }
  // The key, the chords that usually come next, and every chord in the key.
  let insertNow = () => {};
  const chip = (c, cls) => {
    const b = document.createElement('button');
    b.className = cls;
    b.innerHTML = '<i></i><b></b>';
    b.querySelector('i').textContent = c.roman; b.querySelector('b').textContent = c.name;
    b.onclick = () => setChord(c.name);
    b.ondblclick = () => { setChord(c.name); insertNow(); };
    return b;
  };
  function setChord(name) {
    opts.chord = name; opts.shape = '';
    $('chord').value = name;
    save(); paintChord();
  }
  function paintKey() {
    if (opts.key === null || opts.key === undefined) return;
    $('key').value = String(opts.key);
    seg('mode', [[false, t('major')], [true, t('minor')]], !!opts.minor, (v) => { opts.minor = v; save(); paintKeySelect(); paintKey(); });
    $('sev').checked = !!opts.sev;
    const all = T.keyChords(opts.key, opts.minor, opts.sev);
    const cur = T.parseChord(opts.chord);
    const same = (name) => { const c = T.parseChord(name); return cur && c && c.root === cur.root && c.type === cur.type; };
    const curInKey = all.diatonic.some((c) => same(c.name)) || all.borrowed.some((c) => same(c.name));
    const nextDeg = T.suggestNext(opts.key, opts.minor, opts.chord);
    $('inKeyLabel').textContent = cur && curInKey ? t('next', { c: cur.name }) : t('nextStart');
    $('diatonic').replaceChildren(...all.diatonic.map((c) => chip(c, same(c.name) ? 'cur' : nextDeg.includes(c.degree) ? 'hot' : '')));
    $('borrowed').replaceChildren(...all.borrowed.map((c) => chip(c, same(c.name) ? 'cur' : '')));
  }
  function paintKeySelect() {
    const names = opts.minor ? T.KEY_NAMES_MIN : T.KEY_NAMES_MAJ;
    $('key').replaceChildren(...names.map((n, i) => Object.assign(document.createElement('option'), { value: String(i), textContent: opts.minor ? `${n}m` : n })));
    if (opts.key !== null && opts.key !== undefined) $('key').value = String(opts.key);
  }
  function composeChord() {
    opts.chord = `${$('root').value}${$('type').value}${$('bass').value ? `/${$('bass').value}` : ''}`;
    opts.shape = '';
    $('chord').value = opts.chord;
    save(); paintChord();
  }
  function paintShape() {
    const frets = shapeNow();
    $('shape').value = opts.shape || T.shapeText(frets);
    $('shape').style.color = opts.shape && !T.parseShape(opts.shape) ? 'var(--bad)' : '';
    $('autoShape').disabled = !opts.shape;
    drawDiagram(frets);
    const pitches = opts.inst === 'guitar' ? (frets ? T.shapePitches(frets) : []) : T.pianoVoicing(chordNow(), opts.octave, opts.pBass);
    $('notesOut').textContent = pitches.length ? t('notes', { n: pitches.map(midiName).join(' ') }) : (opts.shape ? t('badShape') : '');
  }

  // The diagram: six strings, five frets; click a fret to place a finger, above the nut to toggle
  // open/muted.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs = {}, text) => { const e = document.createElementNS(SVGNS, name); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); if (text !== undefined) e.textContent = text; return e; };
  let diagramBase = 1;
  function drawDiagram(frets) {
    const svg = $('diagram');
    const X0 = 16, DX = 20, Y0 = 26, DY = 23, N = 5;
    const fretted = (frets ?? []).filter((f) => f > 0);
    const hi = fretted.length ? Math.max(...fretted) : 0;
    diagramBase = hi <= N ? 1 : Math.min(...fretted);
    const kids = [];
    if (diagramBase === 1) kids.push(el('line', { class: 'nut', x1: X0 - 1, x2: X0 + 5 * DX + 1, y1: Y0, y2: Y0 }));
    else kids.push(el('text', { x: 2, y: Y0 + DY * 0.65 }, String(diagramBase)));
    for (let i = 0; i <= N; i++) kids.push(el('line', { class: 'fretline', x1: X0, x2: X0 + 5 * DX, y1: Y0 + i * DY, y2: Y0 + i * DY }));
    for (let s = 0; s < 6; s++) kids.push(el('line', { class: 'string', x1: X0 + s * DX, x2: X0 + s * DX, y1: Y0, y2: Y0 + N * DY }));
    (frets ?? []).forEach((f, s) => {
      const x = X0 + s * DX;
      if (f < 0) { kids.push(el('path', { class: 'mark', d: `M${x - 4} ${Y0 - 15}l8 8m0 -8l-8 8` })); return; }
      if (f === 0) { kids.push(el('circle', { class: 'mark', cx: x, cy: Y0 - 11, r: 4 })); return; }
      const row = f - diagramBase;
      if (row >= 0 && row < N) kids.push(el('circle', { class: 'dot', cx: x, cy: Y0 + row * DY + DY / 2, r: 6.5 }));
    });
    // Click targets.
    for (let s = 0; s < 6; s++) {
      const x = X0 + s * DX - DX / 2;
      const top = el('rect', { class: 'hit', x, y: 0, width: DX, height: Y0, 'data-s': s, 'data-f': 'top' });
      kids.push(top);
      for (let r = 0; r < N; r++) kids.push(el('rect', { class: 'hit', x, y: Y0 + r * DY, width: DX, height: DY, 'data-s': s, 'data-f': diagramBase + r }));
    }
    svg.replaceChildren(...kids);
  }
  $('diagram').onclick = (ev) => {
    const r = ev.target.closest('rect.hit');
    if (!r) return;
    const frets = (shapeNow() ?? [-1, -1, -1, -1, -1, -1]).slice();
    const s = Number(r.dataset.s);
    if (r.dataset.f === 'top') frets[s] = frets[s] === 0 ? -1 : 0;
    else { const f = Number(r.dataset.f); frets[s] = frets[s] === f ? -1 : f; }
    opts.shape = T.shapeText(frets);
    save(); paintShape();
  };

  // ---- Static UI ---------------------------------------------------------------------------------------
  const seg = (box, items, current, onPick) => {
    $(box).replaceChildren(...items.map(([v, label]) => {
      const b = document.createElement('button');
      b.textContent = label; b.classList.toggle('on', current === v);
      b.onclick = () => onPick(v);
      return b;
    }));
  };
  let repaint = () => {};
  const DUR_KEYS = [['range', 'durRange'], ['beat', 'durBeat'], ['half', 'durHalf'], ['bar1', 'dur1'], ['bar2', 'dur2'], ['bar4', 'dur4']];
  function paintOptions() {
    seg('src', [['chord', t('srcChord')], ['ruler', t('srcRuler')]], opts.src, (v) => { opts.src = v; save(); paintOptions(); repaint(); });
    seg('inst', [['guitar', t('guitar')], ['piano', t('piano')]], opts.inst, (v) => { opts.inst = v; save(); paintOptions(); });
    seg('oct', [2, 3, 4, 5].map((o) => [o, `C${o}`]), opts.octave, (v) => { opts.octave = v; save(); paintOptions(); });
    $('dur').replaceChildren(...DUR_KEYS.map(([v, k]) => Object.assign(document.createElement('option'), { value: v, textContent: t(k) })));
    $('dur').value = opts.dur;
    seg('len', [['legato', t('lenLegato')], ['half', t('lenHalf')], ['short', t('lenShort')]], opts.len, (v) => { opts.len = v; save(); paintOptions(); });
    $('durBox').hidden = opts.src !== 'chord';
    $('advanceRow').hidden = opts.src !== 'chord' || opts.dur === 'range';
    $('advance').checked = !!opts.advance;
    seg('dir', [['D', t('down')], ['U', t('up')], ['alt', t('alt')], ['auto', t('autoDir')]], opts.dir, (v) => { opts.dir = v; save(); paintOptions(); });
    $('chordRow').hidden = opts.src !== 'chord';
    $('keyBox').hidden = opts.src !== 'chord';
    $('guitarBox').hidden = opts.inst !== 'guitar' || opts.src !== 'chord';
    $('pianoBox').hidden = opts.inst !== 'piano';
    $('pBass').checked = !!opts.pBass; $('replace').checked = !!opts.replace; $('strumIns').checked = !!opts.strumIns; $('keepEnds').checked = !!opts.keepEnds;
    for (const k of ['speed', 'accent', 'humT', 'humV']) $(k).value = opts[k];
    $('speedVal').textContent = `${opts.speed} ms`; $('accentVal').textContent = `−${opts.accent} %`;
    $('humTVal').textContent = `±${opts.humT} ms`; $('humVVal').textContent = `±${opts.humV}`;
    paintChord();
  }
  function paintStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    $('ver').textContent = `v${VERSION}`;
    $('lang').replaceChildren(...LANGS.map((c) => Object.assign(document.createElement('option'), { value: c, textContent: I18N[c]._name })));
    $('lang').value = lang;
    for (const [id, name] of [['tDark', 'dark'], ['tGrey', 'grey']]) { $(id).classList.toggle('on', theme === name); $(id).title = t(name); $(id).setAttribute('aria-label', t(name)); }
    const text = { chordsLabel: 'chords', srcLabel: 'src', instLabel: 'inst', shapeLabel: 'shape', autoShape: 'auto', octLabel: 'octave', pBassLabel: 'pBass', rhythmLabel: 'rhythm', keyLabel: 'key', keyLuna: 'fromLuna', sevLabel: 'sev', durLabel: 'dur', lenLabel: 'len', advanceLabel: 'advance',
      replaceLabel: 'replace', strumInsLabel: 'strumIns', insert: 'insert', strumLabel: 'strum', speedLabel: 'speed', dirLabel: 'dir', accentLabel: 'accent', humTLabel: 'humT', humVLabel: 'humV',
      keepEndsLabel: 'keepEnds', apply: 'apply', straight: 'straight' };
    for (const [id, k] of Object.entries(text)) $(id).textContent = t(k);
    $('apply').title = t('applyHint'); $('straight').title = t('applyHint');
    $('root').replaceChildren(...NOTE_NAMES.map((n) => Object.assign(document.createElement('option'), { value: n, textContent: n })));
    $('type').replaceChildren(...T.TYPE_LIST.map((x) => Object.assign(document.createElement('option'), { value: x, textContent: x || 'maj' })));
    $('bass').replaceChildren(Object.assign(document.createElement('option'), { value: '', textContent: '/ –' }), ...NOTE_NAMES.map((n) => Object.assign(document.createElement('option'), { value: n, textContent: `/${n}` })));
    $('rhythm').replaceChildren(...T.PATTERN_LIST.map((p) => Object.assign(document.createElement('option'), { value: p, textContent: I18N[lang].patterns[p] })));
    $('rhythm').value = opts.rhythm;
    $('chord').value = opts.chord;
    $('keyLuna').title = t('fromLunaTip');
    paintKeySelect();
    paintOptions();
    if (status.key) say(status.key, status.vars, status.kind);
  }
  $('lang').onchange = () => { lang = $('lang').value; store.set('lang', lang); paintStatic(); repaint(); };
  for (const b of [$('tDark'), $('tGrey')]) b.onclick = () => { theme = b.dataset.t; store.set('theme', theme); paintStatic(); };
  $('chord').oninput = () => { opts.chord = $('chord').value; opts.shape = ''; save(); paintChord(); };
  for (const id of ['root', 'type', 'bass']) $(id).onchange = composeChord;
  $('shape').oninput = () => { opts.shape = $('shape').value; save(); const f = T.parseShape(opts.shape); drawDiagram(f ?? shapeNow()); $('shape').style.color = f ? '' : 'var(--bad)'; $('autoShape').disabled = false; const p = f ? T.shapePitches(f) : []; $('notesOut').textContent = f ? t('notes', { n: p.map(midiName).join(' ') }) : t('badShape'); };
  $('key').onchange = () => { opts.key = Number($('key').value); save(); paintKey(); };
  $('sev').onchange = () => { opts.sev = $('sev').checked; save(); paintKey(); };
  $('autoShape').onclick = () => { opts.shape = ''; save(); paintShape(); };
  $('rhythm').onchange = () => { opts.rhythm = $('rhythm').value; save(); };
  $('dur').onchange = () => { opts.dur = $('dur').value; save(); paintOptions(); repaint(); };
  for (const k of ['pBass', 'replace', 'strumIns', 'keepEnds', 'advance']) $(k).onchange = () => { opts[k] = $(k).checked; save(); paintShape(); };
  for (const k of ['speed', 'accent', 'humT', 'humV']) $(k).oninput = () => { opts[k] = Number($(k).value); save(); paintOptions(); };
  paintStatic();

  let luna;
  let built;

  async function build() {
    const s = luna.sessions.current();
    if (s === built) return;
    built = s;
    if (!s) { say('noSession'); return; }
    await s.ready();
    if (s !== built) return;
    await s.musical.ready();
    say(null);
    const tr = s.transport, tl = s.musical.timeline, ctx = s.context;
    const TPB = Luna.TICKS_PER_BEAT;
    let busy = false;

    const msToTicks = (ms, at) => Math.max(0, tl.tickAtSeconds(tl.seconds(at) + ms / 1000) - at);
    const isMidiTrack = (x) => x && ['instrument', 'midi_matrix'].includes(x.trackType?.value);

    // ---- Where to write --------------------------------------------------------------------------
    function target() {
      const ids = ctx.selectionTracks.value ?? [];
      let tracks = ids.map((id) => s.tracks.byId(id)).filter(isMidiTrack);
      if (!tracks.length) { const last = s.tracks.byId(ctx.lastSelectedTrack.value); if (isMidiTrack(last)) tracks = [last]; }
      let S = ctx.selectionStart.value, E = ctx.selectionStop.value;
      const hasRange = !(S === null || S === undefined || E === null || E === undefined || E <= S);
      const hasStart = S !== null && S !== undefined;
      const fixed = opts.src === 'chord' && opts.dur !== 'range';
      if (fixed || !hasRange) {
        if (!hasStart) S = tr.playStart.value ?? 0;
        const bb = tl.barBeat(S);
        const barLen = (tl.tickAtBar(bb.bar + 1) - tl.tickAtBar(bb.bar)) || 4 * TPB;
        const bars = (n) => tl.tickAt({ bar: bb.bar + n, beat: bb.beat, tick: bb.tick });
        const d = fixed ? opts.dur : 'bar1';
        E = d === 'beat' ? S + TPB : d === 'half' ? S + Math.round(barLen / 2) : d === 'bar2' ? bars(2) : d === 'bar4' ? bars(4) : bars(1);
        return { tracks, S, E, auto: !fixed, fixed, from: hasStart ? 'sel' : 'cursor' };
      }
      return { tracks, S, E, auto: false, fixed: false };
    }
    function rulerChords(S, E) {
      const all = s.musical.chords.sorted.filter((c) => T.parseChord(c.name.value));
      const inside = all.filter((c) => c.location.value >= S && c.location.value < E);
      const before = all.filter((c) => c.location.value < S).pop();
      return [...(before ? [{ tick: S, name: before.name.value }] : []), ...inside.map((c) => ({ tick: c.location.value, name: c.name.value }))];
    }
    function paintTarget() {
      const box = $('target');
      const tg = target();
      if (!tg.tracks.length) { box.textContent = t('noTrack'); $('insert').disabled = true; $('apply').disabled = $('straight').disabled = !ctx.notes.length; return; }
      const lines = [
        Object.assign(document.createElement('b'), { textContent: tg.tracks.map((x) => x.name.value).join(', ') }),
        Object.assign(document.createElement('span'), { textContent: tg.auto ? t('rangeAuto', { from: tl.formatBarBeat(tg.S) }) : tg.fixed ? t('rangeDur', { from: tl.formatBarBeat(tg.S), to: tl.formatBarBeat(tg.E), where: t(tg.from === 'sel' ? 'fromSel' : 'fromCursor') }) : t('range', { from: tl.formatBarBeat(tg.S), to: tl.formatBarBeat(tg.E) }) }),
      ];
      if (opts.src === 'ruler') {
        const list = rulerChords(tg.S, tg.E);
        lines.push(Object.assign(document.createElement('div'), { textContent: list.length ? t('rulerList', { list: list.map((c) => c.name).join(' – ') }) : t('rulerNone') }));
      }
      box.replaceChildren(...lines);
      $('insert').disabled = busy;
      $('apply').disabled = $('straight').disabled = busy;
    }
    repaint = paintTarget;

    // ---- Strum settings as functions of the timeline ------------------------------------------------
    function strumOptions(dirFor, straight = false) {
      let alt = 0;
      return {
        gapTicks: Math.min(msToTicks(75, 0) || TPB / 8, TPB / 4 * 0.8),
        stepTicks: (at) => (straight ? 0 : msToTicks(opts.speed, at)),
        dir: dirFor ?? ((base) => {
          if (opts.dir === 'D' || opts.dir === 'U') return opts.dir;
          if (opts.dir === 'alt') return alt++ % 2 ? 'U' : 'D';
          const frac = tl.barBeat(base).tick / TPB;
          return frac >= 0.3 && frac < 0.8 ? 'U' : 'D';
        }),
        upScale: straight ? 1 : 1 - opts.accent / 100,
        jitterTicks: (at) => (straight ? 0 : msToTicks(opts.humT, at)),
        velJitter: straight ? 0 : opts.humV,
        loose: straight || !opts.humT ? 0 : 1,
        keepEnds: !!opts.keepEnds,
      };
    }

    // ---- Generate ------------------------------------------------------------------------------------
    function voicing(chord, prev) {
      if (opts.inst === 'guitar') {
        const frets = opts.src === 'chord' && opts.shape && T.parseShape(opts.shape) ? T.parseShape(opts.shape) : T.guitarShape(chord);
        return frets ? T.shapePitches(frets) : [];
      }
      let notes = T.pianoVoicing(chord, opts.octave, opts.pBass);
      if (prev && prev.length) {
        // Smooth piano voice leading: pick the inversion of the upper notes nearest the last chord.
        const bass = opts.pBass ? notes[0] : null;
        const upper = opts.pBass ? notes.slice(1) : notes;
        const centre = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const prevUp = opts.pBass ? prev.slice(1) : prev;
        let best = upper, bestD = Infinity;
        for (let inv = -upper.length; inv <= upper.length; inv++) {
          let v = upper.slice();
          if (inv > 0) for (let i = 0; i < inv; i++) { const n = v.shift(); v.push(n + 12); }
          if (inv < 0) for (let i = 0; i < -inv; i++) { const n = v.pop(); v.unshift(n - 12); }
          if (bass !== null && v[0] <= bass) continue;
          const d = Math.abs(centre(v) - centre(prevUp));
          if (d < bestD) { bestD = d; best = v; }
        }
        notes = bass !== null ? [bass, ...best] : best;
      }
      return notes;
    }
    function buildNotes(S, E) {
      const pat = T.PATTERNS[opts.rhythm] ?? T.PATTERNS.pop;
      const changes = opts.src === 'ruler' ? rulerChords(S, E) : [{ tick: S, name: opts.chord }];
      if (!changes.length) throw new Error(t('rulerNone'));
      // Hits from the pattern, bar by bar, plus every chord change that does not land on one.
      const hits = [];
      if (!pat.len) hits.push({ tick: S, dir: 'D' });
      else {
        let bar = tl.barBeat(S).bar;
        for (let guard = 0; guard < 2000; guard++, bar++) {
          const b0 = tl.tickAtBar(bar);
          if (b0 >= E) break;
          const beats = Math.round(((tl.tickAtBar(bar + 1) - b0) || 4 * TPB) / TPB);
          for (let rep = 0; rep * pat.len < beats; rep++) {
            for (const [beat, dir, short] of pat.hits) {
              const at = rep * pat.len + beat;
              if (at >= beats) continue;
              const tick = b0 + Math.round(at * TPB);
              if (tick >= S && tick < E) hits.push({ tick, dir, short: !!short });
            }
          }
        }
      }
      const near = TPB / 4;
      for (const c of changes) if (!hits.some((h) => Math.abs(h.tick - c.tick) < near)) hits.push({ tick: c.tick, dir: 'D' });
      hits.sort((a, b) => a.tick - b.tick);
      const out = [];
      const dirs = new Map();
      let prev = null;
      hits.forEach((h, i) => {
        const name = [...changes].reverse().find((c) => c.tick <= h.tick + near / 2)?.name ?? changes[0].name;
        const chord = T.parseChord(name);
        if (!chord) return;
        const pitches = voicing(chord, prev);
        prev = pitches;
        const next = i + 1 < hits.length ? hits[i + 1].tick : E;
        const gap = next - h.tick;
        const stop = h.short || opts.len === 'short' ? h.tick + Math.min(gap, TPB / 4) : opts.len === 'half' ? h.tick + Math.max(1, Math.round(gap / 2)) : Math.max(h.tick + 1, next - Math.round(TPB / 32));
        dirs.set(h.tick, h.dir);
        for (const p of pitches) out.push({ pitch: p, start: h.tick, stop: Math.min(stop, E), velocity: h.dir === 'U' ? 92 : 100, channel: 0 });
      });
      if (opts.strumIns && opts.inst === 'guitar') return T.strum(out, strumOptions((base) => dirs.get(base) ?? 'D'));
      return out;
    }

    async function writeNotes(track, S, E, notes) {
      const lane = s.playlistFor(track);
      await lane.clips.load();
      const over = lane.clips.items.filter((c) => c.stop.value > S && c.start.value < E);
      if (!over.length) {
        // Writing chord after chord: stretch the clip that ends right here instead of starting a new one.
        const before = lane.clips.items.find((c) => c.stop.value === S && c.clipType?.value === 'midi');
        if (before) {
          try {
            await before.trim(before.start.value, E);
            if (before.stop.value >= E) return writeNotes(track, S, E, notes);
          } catch (e) { note('extend failed', { e: errText(e) }); }
        }
        await lane.createNotes(notes.map((n) => ({ pitch: n.pitch, startTick: Math.max(S, n.start), stopTick: Math.max(Math.max(S, n.start) + 1, n.stop), velocity: n.velocity })));
        return;
      }
      const clip = over.length === 1 && over[0].start.value <= S && over[0].stop.value >= E ? over[0] : null;
      if (!clip) throw new Error(t('partial'));
      await clip.midi.ready();
      const c0 = clip.start.value, len = clip.stop.value - c0;
      await s.transaction('Strummer', async () => {
        if (opts.replace) {
          const old = clip.midi.notes.items.filter((n) => c0 + n.startTick >= S && c0 + n.startTick < E);
          if (old.length) await clip.midi.deleteNotes(old);
        }
        await clip.addNotes(notes.map((n) => {
          const tick = Math.max(0, n.start - c0);
          return { pitch: n.pitch, tick, lengthTicks: Math.max(1, Math.min(len, n.stop - c0) - tick), velocity: n.velocity, channel: n.channel ?? 0 };
        }));
      });
      await clip.midi.refresh();
    }

    async function insert() {
      if (busy) return;
      const tg = target();
      if (!tg.tracks.length) return;
      if (opts.src === 'chord' && !T.parseChord(opts.chord)) { say('badChord', { c: opts.chord }, 'bad', 5000); return; }
      busy = true; paintTarget(); say('working');
      try {
        const notes = buildNotes(tg.S, tg.E);
        for (const track of tg.tracks) await writeNotes(track, tg.S, tg.E, notes);
        const chords = new Set(notes.map((n) => n.start - (n.start % 1))).size;
        note('insert', { src: opts.src, chord: opts.chord, rhythm: opts.rhythm, inst: opts.inst, S: tg.S, E: tg.E, notes: notes.length });
        say('inserted', { n: T.groupChords(notes, strumOptions().gapTicks).length || chords }, 'ok', 5000);
        if (tg.fixed && opts.advance) {
          const len = tg.E - tg.S;
          await ctx.select({ startTick: tg.E, stopTick: tg.E + len, trackUids: tg.tracks.map((x) => x.id) }).catch(() => undefined);
          await tr.playStart.set(tg.E).catch(() => undefined);
        }
      } catch (e) {
        note('insert failed', { e: errText(e) });
        say('failed', { e: errText(e) }, 'bad', 8000);
      }
      busy = false; paintTarget();
    }

    // ---- Strum what is there -------------------------------------------------------------------------
    async function gather() {
      const jobs = [];
      const lanes = s.tracks.items.filter(isMidiTrack).map((tk) => ({ tk, lane: s.playlistFor(tk) })).filter((x) => x.lane);
      const sel = ctx.notes;
      if (sel.length) {
        for (const { playlist_uid: uid, notes } of sel) {
          const hit = lanes.find(({ lane }) => lane.id === uid || lane.uid?.value === uid);
          if (!hit) continue;
          await hit.lane.clips.load();
          const rows = new Set(notes.map((n) => n[3]));
          for (const clip of hit.lane.clips.items) {
            await clip.midi.ready();
            const chosen = clip.midi.notes.items.filter((n) => rows.has(n.rowid) && n.stopTick !== undefined);
            if (chosen.length) jobs.push({ clip, notes: chosen });
          }
        }
        return jobs;
      }
      const tg = target();
      if (tg.auto) return jobs;
      for (const tk of tg.tracks) {
        const lane = s.playlistFor(tk);
        await lane.clips.load();
        for (const clip of lane.clips.items.filter((c) => c.stop.value > tg.S && c.start.value < tg.E)) {
          await clip.midi.ready();
          const c0 = clip.start.value;
          const chosen = clip.midi.notes.items.filter((n) => n.stopTick !== undefined && c0 + n.startTick >= tg.S && c0 + n.startTick < tg.E);
          if (chosen.length) jobs.push({ clip, notes: chosen });
        }
      }
      return jobs;
    }
    async function strumExisting(straight) {
      if (busy) return;
      busy = true; paintTarget(); say('working');
      try {
        const jobs = await gather();
        const o = strumOptions(undefined, straight);
        let chords = 0;
        const plans = jobs.map(({ clip, notes }) => {
          const c0 = clip.start.value;
          const abs = notes.map((n) => ({ pitch: n.pitch, start: c0 + n.startTick, stop: c0 + n.stopTick, velocity: n.velocity, channel: n.channel, ref: n }));
          const groups = T.groupChords(abs, o.gapTicks).filter((g) => g.length > 1);
          chords += groups.length;
          const inChords = groups.flat();
          return { clip, c0, old: inChords.map((n) => n.ref), fresh: inChords.length ? T.strum(inChords, o) : [] };
        }).filter((p) => p.old.length);
        if (!chords) { say('nothing', {}, 'bad', 5000); busy = false; paintTarget(); return; }
        await s.transaction(straight ? 'Straighten chords' : 'Strum', async () => {
          for (const p of plans) {
            const len = p.clip.stop.value - p.c0;
            await p.clip.midi.deleteNotes(p.old);
            await p.clip.addNotes(p.fresh.map((n) => {
              const tick = Math.max(0, n.start - p.c0);
              return { pitch: n.pitch, tick, lengthTicks: Math.max(1, Math.min(len, n.stop - p.c0) - tick), velocity: n.velocity, channel: n.channel ?? 0 };
            }));
          }
        });
        for (const p of plans) await p.clip.midi.refresh().catch(() => undefined);
        note(straight ? 'straighten' : 'strum', { chords, clips: plans.length, speed: opts.speed, dir: opts.dir });
        say(straight ? 'straightened' : 'strummed', { n: chords }, 'ok', 5000);
      } catch (e) {
        note('strum failed', { e: errText(e) });
        say('failed', { e: errText(e) }, 'bad', 8000);
      }
      busy = false; paintTarget();
    }

    $('insert').onclick = () => void insert();
    insertNow = () => void insert();
    const readKey = (quiet) => {
      const k = s.musical.keySignatureAt?.(target().S) ?? s.musical.keySignatures.items[0];
      if (!k || typeof k.sharpsAndFlats?.value !== 'number') { if (!quiet) say('noKeyLuna', {}, 'bad', 5000); return false; }
      opts.minor = !!k.isMinor.value;
      opts.key = T.keyFromSignature(k.sharpsAndFlats.value, opts.minor);
      save(); paintKeySelect(); paintKey();
      return true;
    };
    $('keyLuna').onclick = () => readKey(false);
    if (opts.key === null || opts.key === undefined) { if (!readKey(true)) { opts.key = 0; opts.minor = false; save(); paintKeySelect(); paintKey(); } }
    $('apply').onclick = () => void strumExisting(false);
    $('straight').onclick = () => void strumExisting(true);
    $('ver').onclick = async (ev) => {
      if (!ev.altKey) return;
      const text = JSON.stringify({ version: VERSION, opts, target: (() => { const g = target(); return { tracks: g.tracks.map((x) => x.name.value), S: g.S, E: g.E, auto: g.auto }; })(), log }, null, 2);
      try { await navigator.clipboard.writeText(text); say('copied', {}, 'ok', 3000); } catch { /* nothing to do */ }
    };
    for (const p of [ctx.selectionStart, ctx.selectionStop, ctx.selectionTracks, ctx.lastSelectedTrack, ctx.selectionNotes, tr.playStart]) p?.onChange?.(() => paintTarget());
    s.musical.chords.onChange?.(() => paintTarget());
    paintTarget();
  }

  (async () => {
    for (;;) {
      try { luna = await Luna.connect(); break; }
      catch { say('waiting'); await new Promise((r) => setTimeout(r, 1500)); }
    }
    Luna.bindShortcuts(luna, { onError: () => undefined });
    await luna.sessions.ready();
    luna.sessions.focused.onChange(() => void build());
    await build();
  })();
})();
