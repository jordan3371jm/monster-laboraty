# Laboratorio di Mostri

Gioco idle/merge per Playgama (Playgama Bridge v2).

## Struttura
- `index.html` – pagina e script del Playgama Bridge
- `src/main.js` – avvio (Bridge, lingua, pausa) e collegamento dei moduli
- `src/data/` – `config.js` (costanti, mondi `W`, mostri `E`), `text.js` (testi it/en e varianti dei messaggi) e `lore.js` (nome e storia di ogni mostro)
- `src/core/` – `state.js` (stato `S` e variabili di runtime `R`), `util.js` (formato numeri), `dom.js`
- `src/game/` – logica **senza interfaccia**: `economy.js` (guadagni, costi, potenziamenti, Essenze, unioni) e `combat.js` (statistiche, nemici, elementi, abilità). Sono i file che usa la simulazione
- `src/ui/` – schermate: `lab`, `battle`, `hud` (barra, potenziamenti, Evocazione oscura), `missions`, `collection`, `trophies`, `tree`, `rewards` (bentornato e forzieri), `events`, `ads`, `tutorial`, `settings`, `stats`, `common`
- `src/audio.js`, `src/save.js`, `src/loop.js` – suoni, salvataggio, ciclo di gioco
- `scripts/sim-economy.mjs` – simulazione dell'economia (vedi «Test dell'economia»)
- `src/style.css` – stile
- `public/playgama-bridge-config.json` – posizioni delle pubblicità: `prestige` e `world` (interstitial: solo alla Evocazione oscura e alla chiusura del messaggio «Nuovo mondo», mai durante la partita); `boost`, `bonus`, `daily`, `offline`, `chest` (rewarded). Finisce nella radice di `dist`
- `dist/` – build pronta da caricare

## Comandi
- `npm install` – installa Vite (una volta sola)
- `npm run dev` – prova il gioco in locale
- `npm run build` – ricrea la cartella `dist`

## Test dell'economia
- `npm run sim` – simula 48 ore di un giocatore ottimale (unisce e compra ogni secondo, combatte, fa l'Evocazione oscura) e stampa dopo quante ore raggiunge ogni traguardo. Usa `fightTime` di `src/game/combat.js`, la stessa formula del combattimento offline, e la ricalcola ogni secondo
- `npm test` – confronta quei tempi con `scripts/economy-baseline.json` (tolleranza ±20%) e poi lancia `scripts/rules.mjs` (soft cap delle Essenze, tasso offline, elementi, celle, combattimento offline)
- `npm run smoke` – ricompila e prova l'interfaccia in jsdom (impostazioni, reset, missioni, interstitial…)
- `npm run sim:update` – dopo un cambio voluto, salva i nuovi tempi come baseline
La simulazione usa le stesse formule del gioco, ma è un modello semplificato (abilità attive, forzieri, offline e pubblicità non contano): serve a confrontare prima e dopo, non a prevedere i giocatori veri.

## Caricamento su Playgama
Comprimi il **contenuto** di `dist` in uno zip, con `index.html` nella radice dello zip.

## Funzioni
- **Bonus e missioni giornaliere** (🎁): premio che cresce su una serie di 7 giorni (il 7° dà anche 🔮), 3 missioni al giorno, «▶ Raddoppia» con pubblicità rewarded (`daily`). Il giorno cambia a mezzanotte locale.
- **Impostazioni** (⚙️): lingua (Italiano/English, scelta salvata), effetti e musica accesi/spenti separatamente, accesso alle statistiche e «Azzera il salvataggio» con conferma (restano lingua e audio, il tutorial riparte). L'audio è generato con WebAudio, nessun file: parte dopo il primo tocco e si spegne quando la piattaforma lo disattiva, durante le pubblicità e con la scheda in background.
- **Statistiche** (da ⚙️): tempo giocato, unioni, uova, livelli vinti, mostro più alto, monete, Essenze, forzieri, eventi, abilità, serie, trofei.
- **Collezione**: toccando un mostro scoperto si vede nome e una breve storia (`src/data/lore.js`).
- **Missioni**: 3 al giorno (una di unioni, una di battaglia — livelli, livelli contro un elemento o abilità —, una di uova/potenziamenti/eventi) più una **missione settimanale** più lunga (da lunedì) con premio maggiore e 🔮1. I messaggi di vittoria, sconfitta, laboratorio pieno ecc. hanno più varianti (`VAR` in `text.js`).
- **Unione automatica**: potenziamento «Unione automatica» (6 livelli). Liv. 1 sblocca «Unisci tutto» (con ricarica), dal liv. 2 il laboratorio si fonde da solo ogni 25s→5s.
- **Battaglia**: nemici Veloci, Corazzati, Rigeneranti e boss con ingresso e furia sotto il 50%. Il **colpo a terra** del boss (ogni 5s) viene annunciato 1,6s prima: toccando l'arena lo si schiva e il boss resta stordito 2s, altrimenti la squadra perde il 10% della vita (nessun danno se il boss è stordito). Dopo 3 sconfitte di fila si torna al livello prima e si risale da soli; ◀ ▶ e **🔁 Farm** permettono di scegliere a mano un livello già raggiunto (il record resta in `S.bs`, `S.st` è il livello in corso; i forzieri dei boss si prendono solo alla prima vittoria).
- **Battaglia offline**: mentre si è via la squadra continua a vincere livelli a metà velocità (con 3s di attesa tra l'uno e l'altro, senza forzieri); il risultato compare nella finestra «bentornato».
- **Squadra ed elementi**: in battaglia combattono fino a 4 mostri del laboratorio (di default i più forti, con +30% di formazione); toccando la squadra si scelgono a mano. Ogni mostro ha un elemento proprio (tabella `ELM` in `combat.js`; i livelli 4, 5 e 6 coprono 🔥, 💧, 🌿) e ogni nemico ne ha uno: 🔥 batte 🌿, 🌿 batte 💧, 💧 batte 🔥 (+50% contro, -30% se svantaggiato).
- **Abilità attive**: 🔥 Fiammata (danno 5x l'attacco), 💧 Onda curativa (+35% vita), 🌿 Spore stordenti (3,5s). Si sbloccano con un mostro di quell'elemento di livello 4+ in squadra. Si lanciano toccando (100%); se non le tocchi partono da sole dopo 6s al 60% (la cura solo se la squadra è ferita). «Abilità rapide» riduce le ricariche.
- **Forzieri dei boss**: ogni boss sconfitto dà un forziere comune/raro/epico (monete, 🔮, boost x2). «Bottino dei boss» alza la rarità. «▶ Raddoppia il premio» usa la pubblicità `chest`.
- **Collezione** (📖): 26 mostri in 2 mondi, premio per ogni riga completata.
- **Tutorial**: 3 passaggi guidati (evoca, unisci, battaglia), con salto.

- **Trofei** (🏆): 30 obiettivi (unioni, uova, livelli, monete, mostri scoperti, eventi, evocazioni, serie giornaliera). Ognuno dà +1% guadagni permanente, anche dopo l'Evocazione oscura.
- **Albero delle Essenze** (🔮, toccando l'icona in alto o da «Potenziamenti»): le Essenze si spendono in 5 perk permanenti (uova antiche: uova di livello più alto ma 2x di costo per livello, abilità rapide, sonno lungo, avidità, bottino dei boss). Ogni Essenza ottenuta resta +10% guadagni (e attacco) anche se spesa, fino a 50: oltre cresce a potenza 0,6 (`essBonus` in `economy.js`), così i numeri non esplodono. La vita della squadra sale con la radice dello stesso bonus.
- **Eventi casuali**: ogni 45-105s compare un 👻 (30s di guadagni) o un 💎 (x2 per 30s) da toccare entro 9s.
- **Laboratorio ampliato**: 20 celle iniziali, fino a 28 con il nuovo potenziamento (si azzera con l'Evocazione oscura).
- **Bentornato**: dopo più di 30s di assenza compare la finestra con i guadagni offline (già accreditati); «▶ Raddoppia» aggiunge altrettanto con pubblicità rewarded (`offline`).
- **Mondi**: unendo due mostri 13 si sblocca il Mondo 2 (13 mostri nuovi, nemici nuovi, sfondo diverso, premio 🔮+3). I mondi sono dati in `W` in `src/data/config.js`: per aggiungerne uno si estendono `W`, `MAXT`, `NR` e le stringhe `wNn`.
- **Pausa piattaforma**: con `PAUSE_STATE_CHANGED` di Playgama Bridge il gioco e l'audio si fermano e il tempo in pausa non conta come offline.

## Novità (punto 1 del piano di retention)
- **Rami infiniti dell'albero delle Essenze** (`PKR`, `pkrCost` in `economy.js`): 5 potenziamenti ripetibili a costo crescente (`3·1,22^livello`): ⚗️ Alchimia (+4% guadagni/liv.), 🗡️ Furia (+2% attacco), 🛡️ Armatura (+2% vita), 🥚 Mercato nero (−2% costo uova), 👻 Richiamo spettrale (−2% attesa tra gli eventi). Pulsante «Max» per comprare tutto il possibile. Prima le Essenze non avevano più uso dopo i primi prestigi (l'albero costava 243 in tutto).
- **Scudo serie** (`S.dl.sh`): se si salta esattamente un giorno la serie giornaliera continua e lo scudo si consuma; si ricarica riscuotendo il 7° giorno.
- **Barra «prossimo obiettivo»** (`ui/goal.js`): sotto i pulsanti, propone cosa fare adesso (premi da riscuotere → Essenze da spendere → prima Evocazione oscura → mostro da scoprire → boss). Toccandola si apre la schermata giusta. Nascosta durante il tutorial.
- **Analytics** (`src/analytics.js`): nel salvataggio (`S.an`) restano ID casuale, sessioni, giorni giocati e dopo quanti secondi è successo la prima volta ogni evento (prima unione, prima battaglia, primo prestigio…); le sessioni e i giorni si vedono in ⚙️ → Statistiche. Per raccogliere i dati di tutti i giocatori imposta `ANALYTICS_URL` in `src/data/config.js` (POST JSON anonimo con `sendBeacon`); vuoto = nessun invio. Se lo attivi, controlla le regole sulla privacy della piattaforma.
- **Juice**: particelle sulle unioni (più numerose per i mostri alti) e sulle vittorie (boss: pioggia di monete), scheda di festeggiamento per ogni mostro nuovo dal livello 3 (non blocca i tocchi), tutto disattivato con «riduci animazioni».

I salvataggi esistenti restano compatibili (stessa chiave `ml_save_v1`): i campi nuovi vengono aggiunti con valori di default, le Essenze già possedute diventano spendibili e restano valide per il +10%, e chi ha già giocato salta il tutorial.

## Avvio robusto (correzioni «pagina bianca»)
- **Doppio clic**: aprire l'`index.html` della radice (sorgente) reindirizza a `dist/index.html`. Il blocco `<!--DEV-ONLY-->` viene tolto dal build da `vite.config.js`, quindi non finisce nello zip per Playgama.
- **Schermata di caricamento** (`#boot`) e **schermata d'errore** con «Azzera il salvataggio e riprova» (`window.__fatal`, in `index.html`): la pagina non resta mai bianca.
- **Playgama Bridge non bloccante**: script `async`; `main.js` lo attende al massimo 2,5s (niente attesa se il tag manca o il caricamento è fallito) e `initialize()` al massimo 4s.
- **Salvataggio**: `sanitize()` in `save.js` corregge tipi sbagliati, `null` e valori fuori limite; `save()` non scrive finché `load()` non ha letto il salvataggio (`R.loaded`), così lo stato vuoto non sovrascrive quello vero durante l'avvio.
- **Tutorial**: il banner `#tut` è nel flusso della pagina e non copre più pulsanti e griglia.

## Motivi per tornare (`src/game/timers.js`, `src/ui/timers.js`)
Tutto è calcolato da `Date.now()`, senza server: i timer proseguono a gioco chiuso. Pannello 🧭 (pallino rosso = c'è qualcosa da riscuotere; la barra «prossimo obiettivo» lo segnala).
- **Spedizioni** (1h / 4h / 8h, una alla volta): premio = guadagno/s (senza boost) × durata (in secondi) × forza squadra × moltiplicatore, con tetto al 40% del guadagno pieno del periodo. Le Essenze sono una quota di `pgain()`, non un numero fisso.
- **Nidi d'uovo** (🍒 10m, 🥚 1h, ✨ 4h, 🌟 8h): un uovo per tipo, nidi che si aprono schiudendo uova (1 → 3). Le uova **non si schiudono da sole**: restano pronte finché non le riscuoti. Il premio è fisso sul costo pagato (non cresce se nel frattempo sale il reddito).
- **Pubblicità con premio**: «▶ -1 ora» su spedizioni e uova (`adThen('speed')`; senza pubblicità il timer non scende).
- **Ordini di unione**: 2 aperti, 5 minuti, «almeno X» o «esattamente X». Si completano con un'unione fatta dopo la loro nascita (tocco, «Unisci tutto», unione automatica) e il livello è sempre creabile con i mostri presenti. Un posto libero (riscosso o scaduto) riceve un nuovo ordine dopo 5 minuti; premio massimo ~1 minuto di guadagno (in caso peggiore gli ordini valgono ~40% del reddito). Il prestigio azzera quelli aperti.
- **Evento settimanale**: elemento a rotazione (+20% guadagni se metà del laboratorio è di quell'elemento), 💠 dai 👻💎 catturati, spille (+6h di campione), negozio con 6 oggetti, uovo in regalo a chi ha partecipato la settimana prima.
- **Serie lunga**: 7 / 14 / 28 giorni, premi consegnati da soli col bonus giornaliero (28 = Drago del Tempo +2% permanente). Il Drago NON è in `S.disc` (resta fuori da statistiche e trofei).
- `sanitize()` vive in `src/sanitize.js` (puro, testabile in Node). Test: `npm test` (economia, regole, `scripts/timers.mjs`, `check-text`) e `npm run smoke`.

## Controlli automatici
- `npm test`: economia, regole (incl. `fmt`), logica dei timer (`scripts/timers.mjs`), coerenza testi it/en (`check-text.mjs`).
- `npm run smoke`: flussi dell'interfaccia in jsdom (99 controlli).
- `npm run fuzz [passi] [semi] [primo-seme]`: clic casuali su tutta l'interfaccia, salti di tempo di ore e salvataggi di partenza diversi; controlla errori JS, testi anomali (`NaN`, `undefined`) e valori impossibili nel salvataggio.
