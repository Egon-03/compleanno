/* =========================================================================
   CONFIGURAZIONE DEL SITO
   Qui ci sono TUTTI i testi e le impostazioni modificabili.
   Puoi cambiare liberamente i valori tra virgolette senza toccare il resto.
   Nei testi:  \n  = vai a capo,   {n} = numero del pacco,   {word} = parola segreta
   ========================================================================= */
window.CONFIG = {

  /* ---------- Generale ---------- */
  pageTitle: "Per Lalla 🤍",
  footer: { before: "fatto con", after: "da Egon" },   // il cuoricino in mezzo è il reset segreto (5 tap rapidi)
  progressLabels: ["Sorpresa 1", "Sorpresa 2", "Sorpresa 3", "Finale"],

  /* ---------- 0. Lucchetto ---------- */
  lock: {
    title: "Per Lalla 🤍",
    subtitle: "Questo posto è chiuso a chiave. La combinazione la conosci solo tu.",
    code: "12112003",                       // accetta anche 12.11.2003, 12/11/2003, 12-11-2003
    placeholder: "gg mm aaaa",
    hint: "Il giorno in cui è iniziato tutto… per te.",
    button: "Apri",
    errorMessage: "Quasi… pensa al tuo giorno speciale",
    successMessage: "Eccoti 🤍"
  },

  /* ---------- 1. Messaggio di apertura ---------- */
  message: {
    text:
      "Buon compleanno, amore mio.\n" +
      "Quest'anno niente letterina… ma ho preparato qualcosa che può sostituirla.\n" +
      "Ci sono tre sorprese nascoste, e per scoprirle dovrai giocare.\n" +
      "Sei pronta, Lalla?",
    signature: "— Egon",
    button: "Sono pronta ✨",
    skipHint: "tocca il foglio per leggere tutto subito",
    speed: 42                                // millisecondi per lettera (più basso = più veloce)
  },

  /* ---------- 2. Gioco 1: la parola nascosta ---------- */
  wordle: {
    title: "La parola nascosta",
    subtitle: "Indovina la parola di {len} lettere. Hai {max} tentativi.",
    word: "SALOTTO",
    maxAttempts: 6,
    hints: [
      { after: 3, text: "È una stanza della casa." },
      { after: 5, text: "È dove si ricevono gli ospiti, magari con una tazza di tè." }
    ],
    tooShort: "Servono {len} lettere",
    winTitle: "Bravissima! 🎉",
    winMessage: "Hai trovato la parola. Sapevo che ce l'avresti fatta.",
    loseMessage: "Era {word}! Non importa, la sorpresa è tua lo stesso 🤍",
    continueButton: "Continua →"
  },

  /* ---------- 3. Gioco 2: memory ---------- */
  memory: {
    title: "Memory",
    subtitle: "Trova tutte le coppie di ricordi.",
    pairs: 8,
    photoPath: "foto/foto{i}.jpg",           // {i} va da 1 a 8
    movesLabel: "Mosse",
    pairsLabel: "Coppie",
    endTitle: "Tutte trovate! 💞",
    endMessages: [                           // scelto in base al numero di mosse
      { maxMoves: 12, text: "{moves} mosse?! Hai una memoria incredibile." },
      { maxMoves: 18, text: "{moves} mosse: bravissima, nemmeno un ricordo ti sfugge." },
      { maxMoves: 999, text: "{moves} mosse… l'importante è che i ricordi siano tutti nostri 🤍" }
    ],
    continueButton: "Continua →"
  },

  /* ---------- 4. Gioco 3: le caselle in ordine ---------- */
  numbers: {
    title: "Le caselle in ordine",
    subtitle: "Apri le caselle dalla 1 alla {n}, il più velocemente possibile.",
    count: 24,
    startButton: "Via!",
    startText: "Pronta? Il tempo parte appena premi.",
    nextLabel: "Prossima",
    endTitle: "Fatto! ✨",
    endMessage: "Ci hai messo {time}. Una casella dopo l'altra…",
    continueButton: "Continua →"
  },

  /* ---------- Indovinelli (uno per regalo) ---------- */
  riddleTitle: "Un indizio per te",
  riddleButton: "Vado a scoprirlo →",
  riddles: [
    "In un salotto inglese, tra tazze di tè e lettere scritte a mano, qualcuno ti aspetta da più di duecento anni.",
    "C'è chi non dimentica mai nulla… e da stasera custodirà anche i nostri ricordi.",
    "Ogni mattina, fino a Natale, una piccola coccola profumata solo per te."
  ],

  /* ---------- Schermata "Apri il pacco" ---------- */
  gift: {
    title: "Ora puoi aprire il pacco n°{n} 🎁",
    tapHint: "Tocca il pacco",
    afterOpen: "Vai a prenderlo e scartalo, ti aspetto qui.",
    button: "Ho aperto, continua →",
    confirm: "Sicura di averlo aperto? Tocca di nuovo 🤍"
  },

  /* ---------- Transizione verso il finale ---------- */
  finale: {
    line1: "C'è ancora una cosa…",
    line2: "Alza il volume 🎧",
    button: "Premi play"
  },

  /* ---------- Il player finale ---------- */
  player: {
   // appName: "Lalla's Wrapped 2026",
    playlistTitle: "Canzoni per Lalla",
    playlistKind: "Playlist",
    description: "Scritte e cantate solo per te.",
    owner: "Egon",
    cover: "cover/cover.jpg",                // cover della playlist (e di riserva per i brani)
    closingMessage: "Buon compleanno, Lalla. Ti amo. — Egon 🤍",
    playingFrom: "In riproduzione dalla playlist",
    lyricsTitle: "Testo",
    errorMessage: "Questo brano non si riesce a caricare… riprova tra un attimo 🤍"
  },

  songs: [
    { title: "Lalla", artist: "Egon & PTN", src: "audio/canzone1.mp3", cover: "cover/cover1.jpg", lyrics: "lyrics/canzone1.lrc" },
    { title: "Ventitré",          artist: "Egon & PTN", src: "audio/canzone2.mp3", cover: "cover/cover2.jpg", lyrics: "lyrics/canzone2.lrc" }
    // Facoltativo: aggiungi duration: "3:24" a un brano se la durata non compare sull'iPhone prima di premere play
  ]
};
