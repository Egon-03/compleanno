# Per Lalla 🤍 — istruzioni per Egon

Sito statico (HTML + CSS + JavaScript, niente build). Si pubblica caricando la cartella così com'è.

```
index.html   style.css   config.js   app.js   player.js
games/       wordle.js · memory.js · numbers.js
foto/        foto1.jpg … foto8.jpg
audio/       canzone1.mp3 · canzone2.mp3
cover/       cover.jpg (+ facoltative cover1.jpg · cover2.jpg)
lyrics/      canzone1.lrc · canzone2.lrc (facoltativi)
```

---

## 1. Dove mettere i file

I nomi devono essere **esatti**, tutti minuscoli, compresa l'estensione (`.jpg`, non `.JPG` né `.jpeg`): GitHub Pages distingue maiuscole e minuscole.

| Cartella  | File                                   | A cosa serve                                     |
|-----------|----------------------------------------|--------------------------------------------------|
| `foto/`   | `foto1.jpg` … `foto8.jpg`              | le 8 coppie del Memory (meglio quadrate, ~600×600 px) |
| `audio/`  | `canzone1.mp3`, `canzone2.mp3`         | le due canzoni                                   |
| `cover/`  | `cover.jpg`                            | cover della playlist (e di riserva per i brani)  |
| `cover/`  | `cover1.jpg`, `cover2.jpg` *(facoltative)* | cover di ogni singolo brano                  |
| `lyrics/` | `canzone1.lrc`, `canzone2.lrc` *(facoltativi)* | testi sincronizzati                      |

Se un file manca **non si rompe niente**: le foto e le cover diventano un riquadro rosa con un cuoricino ("Foto 3", "Brano 1"…), i testi semplicemente non compaiono, e se manca un mp3 il player mostra un messaggio gentile.

Consigli:
- Foto: comprimile un po' (sotto i 300 KB ciascuna) così il Memory si carica subito sull'iPhone.
- Cover: quadrate, 600×600 o 1000×1000 px. Il colore dello sfondo del player viene preso in automatico dalla cover.
- MP3: va bene qualsiasi bitrate standard (128–320 kbps).

## 2. Cosa cambiare in `config.js`

Apri `config.js` con un editor di testo qualsiasi: ogni sezione è commentata. Le cose principali:

- `message.text` e `message.signature` → il messaggio di apertura "scritto a mano" (`\n` = a capo).
- `lock.code` e `lock.hint` → il codice del lucchetto (ora `12112003`) e l'indizio.
- `wordle.word` e `wordle.hints` → la parola segreta e gli aiuti progressivi.
- `riddles` → i tre indovinelli (uno per pacco).
- `numbers.count` → quante caselle nel terzo gioco (default 24).
- `memory.endMessages` → i messaggi di fine Memory in base alle mosse.
- `player.appName`, `player.playlistTitle`, `player.description`, `player.closingMessage`.
- `songs` → titolo, artista e percorsi di ogni canzone. Se sull'iPhone la durata dei brani nella lista non compare finché non premi play, aggiungi a mano `duration: "3:24"`.

Fai attenzione a lasciare virgolette e virgole al loro posto. Se dopo una modifica il sito resta bianco, quasi sempre è una virgola o una virgoletta mancante in `config.js`.

## 3. Come creare un file `.lrc` (testi sincronizzati)

È un normale file di testo (salvalo in UTF-8) con un tempo all'inizio di ogni riga, nel formato `[minuti:secondi.centesimi]`:

```
[00:00.00] ♪
[00:12.40] Prima riga della canzone
[00:16.85] Seconda riga
[00:21.10] Terza riga
[01:02.00] Ritornello…
```

- Il tempo indica quando la riga si illumina.
- Righe vuote o senza tempo vengono ignorate.
- Trucco veloce: fai partire la canzone su un player qualsiasi, mettila in pausa a ogni inizio di riga e annota il tempo. Ci sono anche siti gratuiti di "LRC generator" che ti fanno battere il tempo con la barra spaziatrice.

Salvalo come `lyrics/canzone1.lrc` / `lyrics/canzone2.lrc`. Nel player a schermo intero comparirà il pannello "Testo"; toccando una riga si salta a quel punto.

## 4. Pubblicare su GitHub Pages

1. Su GitHub il repository deve essere **pubblico** (con un account gratuito Pages funziona solo sui repo pubblici).
2. Carica tutti i file sul branch `main` (anche foto, mp3 e cover).
3. Vai su **Settings → Pages**.
4. In "Build and deployment" scegli **Source: GitHub Actions**. La pubblicazione la fa il file `.github/workflows/pages.yml` che è già nel repository: parte da solo a ogni caricamento su `main`.
   (In alternativa puoi scegliere **Deploy from a branch** → `main` → `/ (root)`: funziona lo stesso, senza bisogno del workflow.)
5. Dopo uno o due minuti il sito è online su `https://<tuo-utente>.github.io/<nome-repo>/`. Lo stato della pubblicazione si vede nella scheda **Actions** (pallino verde = online).

Ogni volta che carichi una modifica, il sito si aggiorna da solo in un paio di minuti. Se sull'iPhone vedi ancora la versione vecchia, ricarica la pagina tenendo premuto il tasto di ricarica di Safari.

Per provarlo sul computer prima di pubblicare, dalla cartella del progetto:

```bash
python3 -m http.server
```

e apri `http://localhost:8000`. (Il server di Python non permette di trascinare la barra della canzone; su GitHub Pages funziona.)

## 5. Strumenti per i test

- **`?debug=1`** → aggiungilo all'indirizzo (`…/nome-repo/?debug=1`). In alto a destra compare un 🐞: toccandolo si apre un menu per saltare a qualsiasi schermata (lucchetto, giochi, pacchi, finale, player) e un pulsante `reset`.
- **`?vai=canzoni`** → apre direttamente il player con le canzoni, senza lucchetto né giochi (`…/nome-repo/?vai=canzoni`). Funziona anche con il nome di qualsiasi schermata, es. `?vai=memory`. Non modifica il progresso salvato.
- **`?reset=1`** → apre il sito cancellando tutto il progresso e riparte dal lucchetto.
- **Reset segreto**: 5 tocchi rapidi sul cuoricino 🤍 nel footer ("fatto con 🤍 da Egon"). Cancella il progresso e torna al lucchetto.

Come funziona il salvataggio: il progresso resta nel browser. Se lei ricarica la pagina riprende da dove era; se chiude e riapre il sito le viene chiesto di nuovo il codice e poi riprende dallo stesso punto. Una volta arrivata al player, ogni riapertura porta direttamente lì (dopo il lucchetto).

## 6. Checklist prima di giovedì 12 novembre ✅

- [ ] Foto, cover e mp3 caricati con i nomi esatti (apri `…/foto/foto1.jpg` nel browser per controllare che esista).
- [ ] Testi in `config.js` riscritti e riletti.
- [ ] Provato **tutto il percorso** su **iPhone con Safari**: lucchetto, messaggio, i tre giochi, i tre pacchi, finale.
- [ ] Provato anche su **iPad** (in verticale e in orizzontale) e sul computer.
- [ ] Sull'iPhone l'audio parte premendo "Premi play" (controlla che il tasto silenzioso laterale **non** sia attivo e che il volume sia alto).
- [ ] Bloccato lo schermo durante una canzone: titolo e cover compaiono sulla schermata di blocco e i controlli funzionano.
- [ ] I pacchi fisici sono numerati 1, 2, 3 nell'ordine giusto.
- [ ] **Reset finale** fatto su ogni dispositivo che userà lei (oppure aprendo una volta il link con `?reset=1`), così parte dal lucchetto.
- [ ] Il link che le mandi è quello pulito, `https://<tuo-utente>.github.io/<nome-repo>/` — **senza `?debug=1`**, `?vai=…` o `?reset=1`.

Buon compleanno a Lalla 🎂
