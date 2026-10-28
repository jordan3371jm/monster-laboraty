# Monster Laboratory su Google Play e App Store

Il gioco è lo stesso del web, chiuso dentro un'app con [Capacitor](https://capacitorjs.com).
- **Codice dell'app:** cartella `app/` (progetto Android in `app/android`, progetto iPhone in `app/ios`).
- **Pubblicità:** Google AdMob al posto di Playgama (video premio e interstitial al cambio di schermata, al massimo uno ogni 2 minuti).
- **Consenso:** il modulo di Google per Europa e UK è già dentro. In Impostazioni → Account c'è il pulsante «Privacy e pubblicità».
- **Salvataggio:** solo nel telefono.
- **Niente acquisti con soldi veri e niente classifica.** Gli store obbligano a usare i loro pagamenti, quindi il Pass si sblocca con i video.

## Cosa c'è in questa cartella
| File | A cosa serve |
|---|---|
| `play/icona-512.png` | Icona per Google Play (512×512) |
| `play/feature-graphic-1024x500.png` | Immagine in evidenza per Google Play |
| `play/screenshot-*.png` | 4 screenshot del telefono (1080×1920) |
| `appstore/icona-1024.png` | Icona per l'App Store (1024×1024, senza trasparenza) |
| `appstore/iphone-6.9-*.png` | 4 screenshot per iPhone 6,9" (1290×2796) |
| `privacy.html` | Informativa sulla privacy, pubblicata su https://jordan3371jm.github.io/monster-laboraty/privacy.html |

Il pacchetto per Google Play (`.aab`) e la chiave di firma **non** stanno nel repository: te li ho mandati a parte. Sono spiegati più sotto.

---

## 1. Google AdMob (la pubblicità, per tutte e due le app)
1. Vai su [admob.google.com](https://admob.google.com) ed entra con il tuo account Google.
2. Aggiungi l'app due volte, una per **Android** e una per **iOS**. All'inizio scegli «non è ancora sugli store».
3. Per ogni app crea due **unità pubblicitarie**: una **Con premio** (rewarded) e una **Interstitial**.
4. Mandami i 6 ID:
   - l'**ID app** Android, che ha la forma `ca-app-pub-…~…`;
   - l'**ID app** iOS;
   - i 2 ID delle unità Android (`ca-app-pub-…/…`);
   - i 2 ID delle unità iOS.

   Io li metto in `scripts/app.mjs`, in `AndroidManifest.xml` e in `Info.plist`, poi ricompilo.
5. In AdMob → Privacy e messaggi crea il messaggio **GDPR** (Europa). Il gioco lo mostra da solo.

> Fino a quel momento l'app usa gli **ID di prova di Google**: mostra annunci finti, che vanno benissimo per i test ma non pagano. **Non pubblicare in produzione con gli ID di prova.**

## 2. Google Play
1. **Account sviluppatore:** [play.google.com/console/signup](https://play.google.com/console/signup). Costa **25 $ una volta sola**.
   - Scegli account **personale**: non serve un'azienda.
   - Google verifica la tua identità con un documento.
   - Se l'app guadagna, il tuo indirizzo potrebbe diventare pubblico: leggi bene la pagina di verifica.
2. **Crea l'app:**
   - Nome «Monster Laboratory», tipo **Gioco**, **Gratis**.
   - Lingua predefinita: inglese (puoi aggiungere l'italiano).
3. **Firma:** attiva «Firma dell'app di Google Play», che è il default. Il file `.aab` che ti ho mandato è già firmato con la tua **chiave di caricamento** (upload key).
4. **Test chiuso obbligatorio** (account personali creati dopo novembre 2023):
   - carica il `.aab` in Test → **Test chiuso**;
   - aggiungi **almeno 12 tester**: email di amici e parenti con un telefono Android;
   - i tester devono tenere l'app installata per **14 giorni di fila**, poi puoi chiedere l'accesso alla produzione.
5. **Scheda dello store:**
   - descrizioni (sotto);
   - icona 512, feature graphic, almeno 2 screenshot (cartella `play/`);
   - categoria **Gioco → Casual** (o Simulazione).
6. **Contenuti dell'app**, da compilare in Play Console:
   - **Informativa privacy:** `https://jordan3371jm.github.io/monster-laboraty/privacy.html`
   - **Annunci:** Sì, l'app contiene annunci.
   - **Pubblico di destinazione:** 13+ (o 16+). **Non** scegliere fasce sotto i 13 anni: altrimenti valgono le regole «Famiglie», con altri requisiti per la pubblicità.
   - **Classificazione dei contenuti (IARC):** violenza fantasy leggera (mostri che combattono, niente sangue), niente acquisti, niente chat.
   - **Sicurezza dei dati:** l'app raccoglie dati solo tramite AdMob:
     - *Identificatori del dispositivo* (ID pubblicità) → pubblicità e analisi; condivisi con Google; non obbligatori per gli utenti UE (consenso).
     - *Posizione approssimativa* → pubblicità.
     - *Interazioni con l'app / diagnostica* → pubblicità e analisi.
     - Dati cifrati in transito: Sì. L'utente può chiedere l'eliminazione: i dati del gioco si cancellano disinstallando.
   - **App governative / finanziarie / salute:** No.
7. Dopo i 14 giorni di test chiuso: **Produzione** → nuova release con lo stesso `.aab` (o uno nuovo con `versionCode` più alto) → invia per la revisione (di solito qualche giorno).

## 3. App Store (iPhone e iPad)
1. **Apple Developer Program:** [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll). Costa **99 $ l'anno**. Va bene anche come persona fisica.
   - Nell'App Store comparirà il tuo **nome e cognome** come venditore.
   - Per l'**UE** (Digital Services Act) Apple chiede se sei un «trader». Se guadagni con la pubblicità, di solito sì, e allora indirizzo, telefono ed email diventano pubblici nell'UE. Valuta prima di iscriverti.
2. **Serve un Mac** (con Xcode) per compilare l'app per iPhone. Se non ce l'hai:
   - servizi di build in cloud con macOS, per esempio [Codemagic](https://codemagic.io), che ha un piano gratuito con minuti mensili. Si collega a questo repository GitHub e firma l'app con una chiave API di App Store Connect;
   - oppure un Mac in prestito o a noleggio per un'ora.

   Il progetto è già pronto in `app/ios`: si apre `app/ios/App/App.xcworkspace` (o `App.xcodeproj`) in Xcode.
3. **Su Xcode:**
   - Signing & Capabilities → scegli il tuo Team;
   - Bundle ID `io.github.jordan3371jm.monsterlab`;
   - Product → Archive → Distribute App → App Store Connect.
4. **App Store Connect** ([appstoreconnect.apple.com](https://appstoreconnect.apple.com)):
   - nuova app, categoria **Giochi → Casual**, prezzo Gratis;
   - icona 1024 e screenshot iPhone 6,9" (cartella `appstore/`); l'iPad serve solo se lasci attivo il supporto iPad;
   - URL privacy (lo stesso di Google);
   - **Privacy dell'app:** «Dati utilizzati per tracciarti: No» se non chiedi il tracciamento ATT (l'app non lo chiede). Dati raccolti tramite AdMob: identificatori del dispositivo, dati di utilizzo, posizione approssimativa → pubblicità di terze parti;
   - **Età:** 9+ o 12+ (violenza fantasy lieve);
   - invia per la revisione (di solito 1-3 giorni). Apple può rifiutare le app «solo sito web». Questa invece è un gioco completo che funziona offline, e va detto nelle note per il revisore.

---

## Testi per gli store (inglese)
**Nome:** Monster Laboratory
**Sottotitolo / descrizione breve (max 80 caratteri):** Merge eggs, evolve 39 cute monsters and battle epic bosses!

**Descrizione completa:**
Welcome to the Monster Laboratory! Summon mysterious eggs, merge identical monsters to create stronger and rarer creatures, and fill your lab with slimes, ghosts, dragons, space beasts and volcano creatures.
Your monsters earn coins even while you are away, so every time you come back your laboratory has grown.
Send your strongest team into battle against waves of enemies and epic bosses, use elemental skills and climb the Daily Tower.
New features unlock as you progress: daily missions, collection, expeditions, the Champion Portal with 39 hand-drawn champions, a Season Pass and weekend Boss Invasions.
Restart with the Dark Summoning to earn Essences, unlock Auto-merge forever and grow stronger and stronger.

- 39 monsters in 3 worlds, plus 39 illustrated champions
- Idle income and offline progress
- Battles with bosses, elements and active skills
- Daily rewards, missions, trophies and weekly events
- Plays offline · 6 languages

## Testi per gli store (italiano)
**Descrizione breve:** Unisci le uova, fai evolvere 39 mostri e sfida boss epici!

**Descrizione completa:**
Benvenuto nel Laboratorio dei Mostri! Evoca uova misteriose, unisci mostri uguali per crearne di più forti e rari, e riempi il laboratorio di slime, fantasmi, draghi, creature spaziali e vulcaniche.
I tuoi mostri guadagnano monete anche quando non giochi: ogni volta che torni il laboratorio è cresciuto.
Manda la squadra più forte in battaglia contro ondate di nemici e boss epici, usa le abilità elementali e scala la Torre giornaliera.
Man mano si sbloccano missioni giornaliere, collezione, spedizioni, il Portale dei Campioni con 39 campioni disegnati a mano, il Pass stagionale e le Invasioni dei Boss del weekend.
Ricomincia con l'Evocazione oscura per ottenere Essenze, sblocca l'unione automatica per sempre e diventa sempre più forte.

---

## Per gli sviluppatori: ricompilare
```
cd laboratorio-mostri
npm run build                 # build web (dist)
cd app && npm install && npm run sync   # crea app/www dal build e aggiorna android/ e ios/
cd android && ./gradlew bundleRelease   # → app/build/outputs/bundle/release/app-release.aab
```
- Serve l'Android SDK (`ANDROID_HOME`), più il file `app/android/keystore.properties` con la chiave di firma (`storeFile`, `storePassword`, `keyAlias`, `keyPassword`). Quel file non va mai nel repository.
- A ogni nuova versione aumenta `versionCode` (e `versionName`) in `app/android/app/build.gradle`.
- Icone e schermata d'avvio si rigenerano da `app/assets/` con `npx capacitor-assets generate`.
