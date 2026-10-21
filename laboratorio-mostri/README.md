# Laboratorio di Mostri

Gioco idle/merge per Playgama (Playgama Bridge v2).

## Struttura
- `index.html` – pagina e script del Playgama Bridge
- `src/main.js` – avvio (Bridge, lingua, pausa) e collegamento dei moduli
- `src/data/` – `config.js` (costanti, mondi `W`, mostri `E`), `text.js` (testi it/en e varianti dei messaggi), `lore.js` (nome e storia di ogni mostro) e `i18n/` (spagnolo, francese e cinese: testi, varianti, storie e nomi dei campioni)
- `src/core/` – `state.js` (stato `S` e variabili di runtime `R`), `util.js` (formato numeri), `dom.js`
- `src/game/` – logica **senza interfaccia**: `economy.js` (guadagni, costi, potenziamenti, Essenze, unioni), `combat.js` (statistiche, nemici, elementi, abilità), `timers.js` (motivi per tornare) e `meta.js` (progressione permanente: campioni, equipaggiamento, Torre, Pass, Invasione, album). `economy` e `combat` sono i file che usa la simulazione
- `src/data/champs.js` – i 18 Campioni del Portale, probabilità, equipaggiamento e album
- `src/ui/` – schermate: `lab`, `battle`, `hud` (barra, potenziamenti, Evocazione oscura), `missions`, `collection`, `trophies`, `tree`, `rewards` (bentornato e forzieri), `events`, `ads`, `tutorial`, `settings`, `stats`, `common`, `meta` (Portale, Torre, Pass, Invasione, Album), `juice` (solo grafica: sfondo animato, scia delle fusioni, onde d'urto, proiettili della squadra, monete che volano al contatore)
- `src/audio.js`, `src/save.js`, `src/loop.js` – suoni, salvataggio, ciclo di gioco
- `scripts/sim-economy.mjs` – simulazione dell'economia (vedi «Test dell'economia»)
- `src/style.css` – stile
- `public/playgama-bridge-config.json` – posizioni delle pubblicità: `prestige` e `world` (interstitial: solo alla Evocazione oscura e alla chiusura del messaggio «Nuovo mondo», mai durante la partita); `boost`, `bonus`, `daily`, `offline`, `chest`, `speed`, `pull` (evocazione del Portale), `pass` (Premium del pass) (rewarded). Finisce nella radice di `dist`
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
- **Impostazioni** (⚙️): lingua (English, Italiano, Español, Français, 中文; scelta salvata), effetti e musica accesi/spenti separatamente, accesso alle statistiche e «Azzera il salvataggio» con conferma (restano lingua e audio, il tutorial riparte). L'audio è generato con WebAudio, nessun file: parte dopo il primo tocco e si spegne quando la piattaforma lo disattiva, durante le pubblicità e con la scheda in background.
- **Statistiche** (da ⚙️): tempo giocato, unioni, uova, livelli vinti, mostro più alto, monete, Essenze, forzieri, eventi, abilità, serie, trofei.
- **Collezione**: toccando un mostro scoperto si vede nome e una breve storia (`src/data/lore.js`).
- **Missioni**: 3 al giorno (una di unioni, una di battaglia — livelli, livelli contro un elemento o abilità —, una di uova/potenziamenti/eventi) più una **missione settimanale** più lunga (da lunedì) con premio maggiore e 🔮1. I messaggi di vittoria, sconfitta, laboratorio pieno ecc. hanno più varianti (`VAR` in `text.js`).
- **Unione automatica**: vedi «Unione automatica con le Essenze» più sotto.
- **Battaglia**: nemici Veloci, Corazzati, Rigeneranti e boss con ingresso e furia sotto il 50%. Il **colpo a terra** del boss (ogni 5s) viene annunciato 1,6s prima: toccando l'arena lo si schiva e il boss resta stordito 2s, altrimenti la squadra perde il 10% della vita (nessun danno se il boss è stordito). Dopo 3 sconfitte di fila si torna al livello prima e si risale da soli; ◀ ▶ e **🔁 Farm** permettono di scegliere a mano un livello già raggiunto (il record resta in `S.bs`, `S.st` è il livello in corso; i forzieri dei boss si prendono solo alla prima vittoria).
- **Battaglia offline**: mentre si è via la squadra continua a vincere livelli a metà velocità (con 3s di attesa tra l'uno e l'altro, senza forzieri); il risultato compare nella finestra «bentornato».
- **Squadra ed elementi**: in battaglia combattono fino a 4 mostri del laboratorio (di default i più forti, con +30% di formazione); toccando la squadra si scelgono a mano. Ogni mostro ha un elemento proprio (tabella `ELM` in `combat.js`; i livelli 4, 5 e 6 coprono 🔥, 💧, 🌿) e ogni nemico ne ha uno: 🔥 batte 🌿, 🌿 batte 💧, 💧 batte 🔥 (+50% contro, -30% se svantaggiato).
- **Abilità attive**: 🔥 Fiammata (danno 5x l'attacco), 💧 Onda curativa (+35% vita), 🌿 Spore stordenti (3,5s). Si sbloccano con un mostro di quell'elemento di livello 4+ in squadra. Si lanciano toccando (100%); se non le tocchi partono da sole dopo 6s al 60% (la cura solo se la squadra è ferita). «Abilità rapide» riduce le ricariche.
- **Forzieri dei boss**: ogni boss sconfitto dà un forziere comune/raro/epico (monete, 🔮, boost x2). «Bottino dei boss» alza la rarità. «▶ Raddoppia il premio» usa la pubblicità `chest`.
- **Collezione** (📖): 26 mostri in 2 mondi, premio per ogni riga completata.
- **Tutorial**: 2 passaggi guidati (evoca, unisci), con salto. La Battaglia arriva dopo, come primo grande sblocco.

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

## Lingue
Inglese (predefinito), italiano, spagnolo, francese e cinese semplificato. All'avvio si usa la lingua della piattaforma (Playgama Bridge) o del browser se è una di queste, altrimenti l'**inglese**; la scelta nelle impostazioni ha la precedenza. Ogni testo mancante in una lingua ricade sull'inglese (`tr()` in `text.js`). Anche la schermata d'errore iniziale (`index.html`) è nelle 5 lingue.
- Per aggiungere una lingua: un file in `src/data/i18n/` con `tx` (testi), `vr` (varianti dei messaggi), `lore` (26 mostri) e `ch` (18 campioni), poi registrarlo in `text.js` (`MORE`, `LANGS`, `LANGN`) e `lore.js`.
- `npm test` → `check-text.mjs` controlla tutte le lingue: chiavi uguali all'inglese, stessi segnaposto (`{n}`, `{e}`…), varianti, storie e nomi completi, ed elenca le frasi rimaste identiche all'inglese.

## Bilanciamento e nuove meccaniche (ottobre 2026)
Giocando e simulando, dopo ~3 ore (giocatore ottimale) la progressione si fermava: il prezzo delle uova cresce del 7% a uovo e ogni livello richiede il doppio delle uova, quindi in una partita non si andava oltre il mostro 15. Il Mondo 2 (mostri 14-26) era quasi irraggiungibile e dopo il livello 40 non si avanzava più per giorni.
- **Incubatrice automatica** (potenziamento `f`, 8 livelli, `eggInt` in `economy.js`): un uovo gratis ogni 30s → 5s in una cella libera. Le uova gratis non alzano il prezzo di quelle comprate e non contano per missioni e statistiche. Riempie il laboratorio anche quando le uova costano molto e toglie il muro della progressione.
- **Uova antiche** nell'albero: 12 livelli invece di 6 (costi 128…4096 🔮), uova fino al livello 13. Con le Essenze dei prestigi avanzati serve per arrivare in fondo al Mondo 2.
- **Combo**: unioni fatte a mano a meno di 2,5s l'una dall'altra danno monete crescenti (½ secondo di guadagni × combo, fino a x10).
- **Fusione perfetta**: 6% di probabilità che un'unione fatta a mano salti un livello (non durante il tutorial). Il mostro intermedio viene segnato come scoperto.
- **Forzieri dei boss**: la finestra si apre solo se si sta guardando la battaglia; nel laboratorio basta un messaggio (il premio è già accreditato). Prima a ogni boss un popup interrompeva le unioni.
- Simulazione (48h): mostro 20 a ~3,2h, livello 50 a ~3,4h, alla fine livello ~65 e mostro 24 (prima: livello 40 a 23,7h, mostro 15 come tetto).

### Correzioni
- **Guadagni offline col boost**: il guadagno offline usava il reddito con il boost x2 per tutte le ore di assenza, anche se al boost restavano pochi secondi. Ora usa `incBase()` (senza boost); lo stesso vale per la battaglia offline.
- **Premi «N minuti di guadagni» col boost**: forzieri, missioni, collezione, fantasmi 👻, bonus pubblicitario e costo dei nidi raddoppiavano se il boost era attivo al momento della riscossione. Ora `rBase()` usa `incBase()`.

## Progressione permanente (`src/game/meta.js`, `src/ui/meta.js`)
Tutto in `S.ch` (in `KEEP`: resta dopo l'Evocazione oscura). Il laboratorio resta il motore; i nuovi sistemi si collegano con dei ganci (`setCK` in `combat.js`, `setHook` in `economy.js`), così da soli valgono ×1 e la simulazione non cambia.
- **Portale dei Campioni** (🌀): 39 campioni disegnati (immagini in `public/m/`, copiate in `dist/m/`): 9 comuni, 12 rari, 10 epici, 5 leggendari e 3 **speciali** fuori dal Portale (Dullaghan dall'Invasione, Conte Mezzanotte dal Pass, Ombriel al primo arrivo al piano 20 della Torre). Molti hanno una **famiglia evolutiva**: con 3 forme cambiano nome e immagine a ★3 e ★5, con 2 forme a ★4 (scritta «Evoluzione!»; nella scheda si vede la catena). I nomi sono nomi propri, uguali in tutte le lingue. L'ordine di `CH` in `src/data/champs.js` non va cambiato (il salvataggio usa l'indice). Probabilità 60/28/10/2%, **un raro garantito ogni 10** evocazioni e **un leggendario entro 50** (prima quelli che non hai). Doppioni = stelle (★1 → ★5, l'abilità raddoppia): da ★n a ★n+1 servono 3n copie (30 in tutto). Oltre ★5 si ricevono monete (e 1-2 🎫 per epici e leggendari: il rimborso medio resta sotto 1 biglietto per evocazione, altrimenti con tutto a ★5 le evocazioni diventerebbero infinite). 1 evocazione costa 1 🎫; **una gratis ogni 8 ore** e **2 al giorno con video** (`pull`).
- **Capi squadra**: fino a 2. Danno attacco alla squadra (5/10/18/30% per rarità) e la loro abilità (attacco a un elemento, attacco, vita, guadagni, monete dei livelli, spedizioni, ricariche, fusione perfetta, incubatrice, boss stordito, colpo a terra ridotto, danno ai boss, tutto insieme). Finché il giocatore non sceglie a mano, a capo vanno i più rari.
- **Biglietti 🎫**: forzieri dei boss (1/2/3), missioni (1, settimanale 3), bonus giornaliero (1, il 7° giorno 2), ogni mostro nuovo dal livello 5, Torre (ogni 3 piani, +2 ai boss), Pass, Invasione, album completi.
- **Equipaggiamento** (🎒): ⚔️ attacco, 🛡️ vita, 📿 guadagni, 4 rarità. Dai forzieri, dalla Torre (ogni 3 piani) e dal Pass. 3 slot per campione, conta solo sui capi; i pezzi nuovi si montano da soli negli slot vuoti dei capi, «Equipaggia i migliori», «Smonta» dà monete. Inventario massimo 24 (oltre si smonta il peggiore).
- **Bonus elemento** (come le fazioni): 3 mostri dello stesso elemento in squadra +20% attacco, 4 → +40%.
- **Torre giornaliera** (🗼, in Battaglia): 3 tentativi al giorno, piani dal 60% del record in su (+2 livelli a piano, boss ogni 5). Dopo ogni vittoria si sceglie 1 potenziamento su 3 per la scalata. Premi (monete, 🎫, equipaggiamento, figurine) solo la prima volta che un piano viene superato nella giornata.
- **Pass stagionale** (🎟️): 28 giorni dal primo accesso del giocatore, 30 livelli da 230 PE. PE da unioni e vittorie (massimo 60 al giorno ciascuna), boss nuovi (15), missioni (40, settimanale 150), bonus giornaliero (30), piani della Torre (15). Gratis: biglietti, figurine, equipaggiamento e al 30 il campione Conte Mezzanotte; Premium sbloccato con un video (`pass`).
- **Nemici e boss disegnati**: in `W` (`config.js`) un nemico può essere un'emoji o `'@nome'` (immagine `m/nome.webp`, vedi `ico()` in `core/util.js`). Mondo 1: 12 nemici (normali, veloci, corazzati, rigeneranti) e 4 boss; Mondo 2: 4 boss; Torre: boss propri (`tw`).
- **Invasione dei boss** (⚔️, sabato e domenica): nemici +25% vita, monete x2, punti per ogni livello vinto (`ceil(livello/5)`, boss ×5). Classifica locale con 9 rivali che salgono durante il fine settimana in proporzione al livello che avevi all'inizio. A fine evento: 1° 30 🎫 + Dullaghan, 2°-3° 20 🎫 + Dullaghan, 4°-6° 10 🎫, gli altri 4 🎫 (se non riscosso, si riscuote da solo all'invasione successiva).
- **Spedizioni con campione**: si può mandare un campione libero (premio ×1,15…×1,8 secondo rarità e stelle, più la sua abilità «spedizione»); mentre è via non guida la squadra.
- **Album di figurine** (dentro 📖 Collezione): 2 album da 9 (Laboratorio +5% guadagni, Spazio +5% attacco), l'ultima carta è rara. 3 doppioni si scambiano con una carta mancante; album completo = 25 🎫 e il bonus.
- **Varianti dorate**: ogni uovo ha il 3% di uscire dorato e ogni unione a mano il 4% (×3 guadagni). Unendo due dorati il risultato resta dorato (`S.gv`, parallelo a `S.g`).
- **Prima Evocazione oscura**: la prima Essenza arriva a 50.000 monete (`PG1`) invece di 200.000; dalle successive la soglia torna `PG`. Nella simulazione la prima arriva a ~13 minuti (prima ~30). Il pulsante mostra l'anteprima: «Ripartirai con guadagni ×A (ora ×B)».
- **Sistemi sbloccati a tappe**: sostituiti dagli «Sblocchi a obiettivi» (vedi sotto).
- Bilanciamento: `npm run sim:meta` simula 28 giorni di un giocatore occasionale e di uno attivo (biglietti, campioni, stelle, Pass, Torre). Con i valori attuali dopo 28 giorni l'attivo ha ~17/18 campioni a ★4 di media (leggendari ancora da far crescere) e chiude il Pass verso il giorno 20; l'occasionale ha ~★3,4 di media e chiude il Pass a fine stagione. La prima versione regalava troppo (quasi tutto a ★5 in due settimane) e aveva il bug delle evocazioni infinite.
- Test: `scripts/meta.mjs` (in `npm test`): garanzie del Portale su 500 evocazioni, stelle, capi, bonus elemento, equipaggiamento, Torre, Pass, Invasione con data simulata, album, varianti dorate, salvataggi rovinati.

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
- `npm run smoke`: flussi dell'interfaccia in jsdom (153 controlli, incl. sblocchi, unione automatica, video, banner, salvataggio solo con bridge.storage e Bridge simulato).
- `npm run fuzz [passi] [semi] [primo-seme]`: clic casuali su tutta l'interfaccia, salti di tempo di ore e salvataggi di partenza diversi; controlla errori JS, testi anomali (`NaN`, `undefined`) e valori impossibili nel salvataggio.

## Sblocchi a obiettivi e grafica 3.0 (`src/game/unlocks.js`)
Prima il gioco mostrava quasi tutto dall'inizio e non sembrava di fare progressi. Come nei merge/idle più giocati (AdVenture Capitalist, Egg, Inc., AFK Arena, Merge Dragons, Travel Town…) ora si parte con il **solo laboratorio** e ogni sistema si apre raggiungendo un traguardo:

| Sblocco | Requisito |
|---|---|
| ⚙️ Potenziamenti | mostro di livello 3 |
| ⚡ Boost con video | mostro di livello 4 |
| 🎁 Bonus giornaliero e missioni | mostro di livello 5 |
| 📖 Collezione | mostro di livello 7 |
| 🧭 Spedizioni, nidi, ordini, evento | mostro di livello 7 |
| 🔮 Evocazione oscura | 25.000 monete nella partita |
| ⚔️ Battaglia | prima Evocazione oscura (prima la battaglia è ferma, anche offline) |
| 🌀 Portale dei Campioni | prima Evocazione oscura |
| 🏆 Trofei | livello di battaglia 8 |
| 🔁 Scelta del livello / farm | livello 12 |
| 🎟️ Pass | livello 20 |
| 🗼 Torre | livello 25 |
| 🔥 Invasione dei boss | livello 30 |

Senza battaglia la prima Evocazione oscura arriva comunque presto: nella simulazione (giocatore ottimale) a ~6 minuti invece di ~4.

Anche i potenziamenti arrivano man mano: Sonno profondo (mostro 5), Laboratorio ampliato (7), Incubatrice (livello 10); Velocità e Livello di unione dopo aver sbloccato l'Unione automatica; il pannello mostra il prossimo con il suo requisito.
- Ogni sblocco apre la finestra **«Nuova funzione sbloccata!»** con icona, descrizione e «Andiamo!» che porta subito lì (una alla volta).
- La **barra obiettivo**, quando non c'è nulla da riscuotere, mostra il prossimo sblocco con la barra di avanzamento (🔒 Battaglia · Fai la tua prima Evocazione oscura, con l'avanzamento verso la prima Evocazione).
- Le schede chiuse (Battaglia, Potenziamenti) restano visibili con il lucchetto: toccandole si legge cosa serve.
- Lo sbloccato resta in `S.ul` (anche dopo l'Evocazione oscura). I salvataggi precedenti (senza il segno `v2`) con un'Evocazione oscura o oltre il livello 15 trovano tutto aperto; gli altri ottengono subito ciò che hanno già raggiunto.
- Per cambiare ordine o requisiti basta modificare `UL` e `UPL` in `unlocks.js` (+ i testi `ul_*`, `uld_*`).

**Grafica 3.0** (in fondo a `style.css`): HUD con monete a sinistra e Essenze/impostazioni a destra; icone in alto con etichetta corta, che compaiono solo quando sbloccate; barra di navigazione con icona sopra ed etichetta sotto; vasche con meno bagliori; potenziamenti come schede «icona · nome e descrizione · prezzo»; nei pannelli il titolo e «Chiudi» restano sempre visibili; in battaglia si vedono solo le abilità sbloccate (niente più riga di lucchetti).

### Cellulare, tablet e PC (in fondo a `style.css`)
- **Cellulare in verticale**: colonna unica (la base).
- **Tablet in verticale** (≥600px di larghezza): colonna fino a 720px, testi, icone e pulsanti più grandi.
- **Orizzontale** (PC, tablet e cellulari girati, almeno 700px e più largo che alto): barra laterale a sinistra con monete, icone, obiettivo e navigazione; a destra il laboratorio (griglia centrata con vasche quasi quadrate) o la battaglia. I pannelli diventano finestre centrate con lo sfondo scurito.
- **Cellulare girato** (altezza ≤520px): barra laterale compatta (solo icone) e laboratorio su 5 colonne.

## Unione automatica con le Essenze (`AM_COST`, `amInt`, `amMax` in `economy.js`)
- Nei Potenziamenti la scheda **🔄 Unione automatica** costa **🔮 5** e si sblocca **per sempre** (`S.am`, resta anche dopo l'Evocazione oscura). Quando hai 5 Essenze la barra obiettivo lo suggerisce.
- Da quel momento, ogni **15 secondi** si uniscono **due** mostri uguali qualsiasi: la coppia di livello più basso presente nel laboratorio (bastano 2 uova; con 10 uova di livello 1 → dopo 15s 8 uova + 1 mostro di livello 2).
- Dopo lo sblocco compaiono 2 potenziamenti a monete (si azzerano con l'Evocazione oscura come gli altri):
  - **⏱️ Velocità di unione**: −0,5s per livello, da 15s a **5s** (20 livelli, costo `250·1,5^liv`: 250, 375, 562… ~830K all'ultimo).
  - **🆙 Livello di unione**: all'inizio si uniscono solo le uova (livello 1, o il livello delle uova con «Uova antiche»); ogni livello alza di 1 il massimo (livello 5 del potenziamento → si uniscono fino ai mostri di livello 6), fino a 25. Costo `400·2,8^liv` (400, 1,1K, 3,1K… ~120K al 5°, ~29M al 10°): cresce come il valore dei mostri.
- «Unisci tutto» (stesso sblocco) unisce subito tutte le coppie fino allo stesso livello massimo, con una ricarica che scende con la Velocità.

## Playgama Bridge (`src/platform.js`, `src/ui/shop.js`, `public/playgama-bridge-config.json`)
Controllato sulla documentazione ufficiale (wiki.playgama.com: requisiti, checklist del gioco, API v2, guida alla monetizzazione) e sul codice sorgente dell'SDK (github.com/Playgama/bridge). Ogni chiamata è protetta: senza Bridge (in locale) non succede nulla.
- **Avvio**: `initialize()` (max 4s), lingua della piattaforma, `game_ready` quando il gioco è pronto.
- **Messaggi**: `gameplay_started` / `gameplay_stopped` (pagina nascosta, pausa della piattaforma, pubblicità aperta); `level_started` / `level_completed` / `level_failed` sul livello di battaglia record (`world` = mondo); `player_got_achievement` per ogni trofeo.
- **Pubblicità**: rewarded con placement (`boost`, `bonus`, `merge5`, `daily`, `offline`, `chest`, `speed`, `pull`, `pass`); interstitial ogni **50 unioni** (a mano, «Unisci tutto» o automatiche, `merge`, contatore `S.mga`): il gioco non ha pause naturali, quindi (come consiglia la guida di Playgama) aspetta 1,5s senza tocchi e poi mostra «📺 Pubblicità tra 3…2…1»; poi all'Evocazione oscura e al cambio mondo. Almeno **120s** tra due interstitial (`minimumDelayBetweenInterstitial`, la guida consiglia 120–240s). Durante ogni pubblicità a schermo intero il gioco è **in pausa** e muto. I pulsanti dei video hanno l'icona 📺 e, nella fila del laboratorio, l'etichetta «AD».
- **Video in laboratorio** (fila sotto «Evoca uovo»): ▶ **x2 per 5 minuti** (si accumula fino a 15), ▶ **+5 minuti di guadagni**, ▶ **Unione 5 minuti** (`S.amAd`): una coppia di mostri qualsiasi ogni 10 secondi per 5 minuti; quest'ultimo pulsante sparisce quando si sblocca l'Unione automatica.
- **Banner** (advanced banners, `advancedBanners` nel file di configurazione), mai sopra la griglia: in orizzontale (PC/tablet, alto almeno 640px) nell'angolo in basso a sinistra, sotto la barra laterale vuota (24%×20%); in verticale solo quando è aperto un pannello, in fondo (100%×10%), e il pannello si accorcia (`#app.bnm`) così non copre «Chiudi». Niente banner durante il tutorial e con «Niente pubblicità»; durante video e interstitial li nasconde l'SDK.
- **Salvataggio** (anche nell'app di Playgama): come richiede la wiki («never use `localStorage` directly») si salva e si carica **solo con `bridge.storage`**, una chiave sola (`ml_save_v1`) in una chiamata. L'SDK sceglie da solo il cloud o la memoria locale (con la stessa chiave, quindi i vecchi salvataggi vengono letti) e, quando il cloud riesce, cancella la copia locale: per questo il gioco non deve più scriverla lui. `localStorage` diretto solo se il Bridge non c'è proprio (offline). Sulla piattaforma si salva al massimo ogni 10s e subito quando la pagina viene nascosta, chiusa (`pagehide`, `freeze`, `beforeunload`) o messa in pausa.
  Il Bridge si carica dal CDN con uno script normale (come nella documentazione). Se `initialize()` è lento, `lateBridge()` lo collega comunque, manda `game_ready` e, se il salvataggio della piattaforma ha più tempo di gioco, riparte da quello.
- **Muto rapido** 🔊/🔇 in alto accanto alle impostazioni (la wiki chiede un pulsante per togliere l'audio). Il titolo della pagina è nella lingua del gioco (Monster Laboratory / Laboratorio di Mostri…), uguale al nome nella scheda.
- **Regole della piattaforma**: la pagina non scorre e non si zooma (`position:fixed`, `overscroll-behavior:none`, `touch-action:manipulation`, niente Ctrl+rotella né pizzico), nessuna barra di scorrimento visibile (i pannelli scorrono comunque col dito/rotella), niente menu del tasto destro, spazio e frecce non fanno scorrere la pagina, audio spento in background e durante le pubblicità, nessun link esterno.
- **Account**: in ⚙️ «Accedi per salvare nel cloud» se la piattaforma lo supporta (`player.authorize()`), poi il nome del giocatore.
- **Condivisione**: in ⚙️ solo i pulsanti supportati (condividi, schermata home, preferiti, valuta, invita, community).
- **Negozio 🛒** (icona sempre visibile dopo lo sblocco dei Potenziamenti; in cima «1 biglietto gratis» con video, 3 al giorno, placement `shop`; i prodotti senza prezzo — pagamenti non supportati o prodotto non creato nel pannello — si vedono ma non si possono comprare): Pacchetto iniziale (🎫 30 + 🔮 30 + 4 ore di guadagni, una volta), 10 / 60 / 150 biglietti, 10 / 60 / 150 Essenze, 12 e 24 ore di guadagni (consumabili, consegnati e poi `consumePurchase`), Guadagni ×2 (permanente, ripristinato a ogni avvio con `getPurchases`). Gli ordini già consegnati sono in `S.iap.got`, così nulla viene dato due volte. Gli acquisti restano anche dopo «Azzera il salvataggio».
  ⚠️ Nel file di configurazione ci sono solo gli id (come vuole la wiki). Nel pannello sviluppatore di Playgama, alla pubblicazione, va spuntato «il gioco ha acquisti» e vanno creati i prodotti con **gli stessi id** (`starter_pack`, `tickets_10`, `tickets_60`, `tickets_150`, `ess_10`, `ess_60`, `ess_150`, `coins_12h`, `coins_24h`, `income_x2`), prezzo in USD e tipo (permanenti `starter_pack` e `income_x2`, gli altri consumabili). Il negozio mostra solo i prodotti che hanno un prezzo.
- **Classifica** `best_stage` e **obiettivi** (33 trofei, id `mg0`…`ch2`) nel file di configurazione: usati sulle piattaforme che li hanno (su Playgama le classifiche non ci sono, la chiamata viene saltata).
- **Analytics**: gli eventi del gioco (`track`) vanno anche a `bridge.analytics.send`.
- **Bordi dello schermo** (notch): gestiti in CSS con `env(safe-area-inset-*)`.

## Scheda per Playgama (`store/`)
- `cover-1x1.png` (800×800), `cover-9x16.png` (1080×1920), `cover-16x9.png` (1920×1080): copertine fatte con i mostri disegnati del gioco.
- `in-app-products.json` / `in-app-products.csv`: catalogo dei 10 prodotti da importare nel pannello sviluppatore (campi `productId`, `title`, `description`, `type` = `consumable`/`non_consumable`, `priceUsd`, come nella wiki). Gli id sono gli stessi di `PROD` in `src/platform.js` e di `payments` nel config. Prezzi: pacchetto iniziale 4,99 · 10/60/150 biglietti 0,99/4,99/9,99 · 10/60/150 Essenze 0,50/2,50/4,99 · monete 12h 0,50 · 24h 1,00 · Guadagni ×2 19,99 USD.
- `descrizioni.md`: titolo, descrizione breve e lunga, caratteristiche e «come si gioca» in inglese e italiano, tag suggeriti.
- `cover.html`: la pagina da cui sono generate (`cover.html?r=sq|v|h`, fotografata con Playwright alla misura giusta). La cartella non finisce in `dist`.

## Schermata di caricamento e moneta
- **Caricamento** (`#boot` in `index.html`, `src/preload.js`): nome del gioco nella lingua del dispositivo, la zucca che saltella e una barra «Caricamento dei mostri… 45%». Mentre l'SDK si avvia e il salvataggio si carica, si scaricano e decodificano tutte le 99 immagini dei mostri (`public/m`, ~3,3 MB, elenco preso da `CH` e `W`); solo alla fine la schermata sfuma e parte `game_ready` (la wiki vuole `game_ready` quando il gioco è davvero giocabile). Tetto di 25s con una rete lentissima. Il logo di Playgama compare prima e sparisce da solo dopo l'avvio dell'SDK.
- **Moneta disegnata** (`src/assets/coin.svg`, inclusa nel bundle): al posto dell'emoji 🪙, brutta o mancante su molti dispositivi. `src/ui/coin.js` sostituisce ogni 🪙 che entra nella pagina con `<i class="ico-coin">`, quindi testi e traduzioni restano uguali.
