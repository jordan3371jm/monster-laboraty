# Monster Laboratory su YouTube Playables

## Cosa c'è in questa cartella
- `monster-laboratory-youtube.zip`: il gioco pronto per YouTube (è la cartella `dist-yt` compressa). Si rigenera con `npm run build:yt`.
- `miniatura-16x9.png`, `miniatura-1x1.png`, `miniatura-9x16.png`: le immagini per la scheda del gioco, **senza scritte né logo**. YouTube vieta loghi e marchi nelle miniature, nel titolo e nella descrizione.

## Come si entra (i passi che devi fare tu)
1. **Canale YouTube.** I Playables si pubblicano da un canale YouTube. Usa il canale con cui vuoi presentare il gioco.
2. **Modulo di interesse.** L'accesso è ancora su invito («early access»). Compila il [Playables interest form](https://docs.google.com/forms/d/e/1FAIpQLSdvdQ0lgIq2369aemj1O6w8R8FwGn9O5ARRGODDDUbVINCRJQ/viewform) indicando il gioco, il genere (merge/idle con battaglie), le lingue (6) e che è già pubblicato su Playgama.
3. **Se ti accettano** ti assegnano un Partner Manager e ti aprono il [Playables Developer Portal](https://www.youtube.com/playables_portal). Lì:
   - crei il Playable e carichi `monster-laboratory-youtube.zip`;
   - compili i metadati (titolo, descrizione, miniature di questa cartella, categoria, tag di accessibilità);
   - attivi la monetizzazione (pubblicità) nelle impostazioni;
   - provi il gioco con il «YouTube Dev Link» e la «Test Suite» su computer, telefono Android e iPhone;
   - lo mandi in certificazione.
4. **Guadagni.** La divisione dei ricavi è ancora un programma pilota per pochi sviluppatori scelti da YouTube. Il gioco però è già pronto per le pubblicità di YouTube.

Community ufficiale per domande: [Discord dei Playables](https://discord.gg/eEFBtMswKT). Documentazione: [developers.google.com/youtube/gaming/playables](https://developers.google.com/youtube/gaming/playables).

## Cosa cambia nella versione per YouTube (rispetto a Playgama)
Il codice è lo stesso. Il build `--mode youtube` aggiunge `src/ytbridge.js`, un adattatore che presenta l'SDK `ytgame` con la stessa forma di Playgama Bridge.

| Requisito di YouTube | Come lo rispetta il gioco |
|---|---|
| SDK caricato prima del gioco | `<script src="https://www.youtube.com/game_api/v1">` è il primo script della pagina; lo script di Playgama è tolto |
| `firstFrameReady` / `gameReady` | Il primo quando appare la schermata di caricamento; il secondo solo dopo che la schermata è sparita del tutto |
| Salvataggio solo con `saveData`, dopo `loadData` | Nessun `localStorage`. Se il salvataggio di YouTube non si legge, il gioco non salva, così i progressi veri non vengono cancellati. Un salvataggio pesa pochi KB (limite 3 MiB) |
| Lingua solo da `getLanguage` | Niente `navigator.language`; il selettore della lingua nelle impostazioni è nascosto, perché YouTube non vuole che la scelta finisca nel salvataggio |
| Audio di YouTube | Usa `isAudioEnabled` / `onAudioEnabledChange`. Il pulsante 🔊 nel gioco è nascosto; restano Effetti e Musica separati nelle impostazioni |
| Pausa solo da `onPause` / `onResume` | Niente Page Visibility API. In pausa si fermano ciclo di gioco, sfondo animato, animazioni CSS, audio e salvataggi periodici; si salva subito al momento della pausa |
| Pubblicità solo di YouTube | Video premio con `requestRewardedAd` e id fissi (`reward-boost`, `reward-bonus`, …). Interstitial solo ai cambi di schermata (cambio mondo, Evocazione oscura); quello ogni 50 unioni è tolto perché cadeva in mezzo al gioco |
| Niente acquisti né servizi esterni | Pass Premium a 4,99 $ e pacchetti a pagamento non compaiono. Il Pass si sblocca con i video. Nessuna chiamata esterna, nessuna statistica esterna, nessun link, nessuna condivisione |
| Classifica | `sendScore` invia il livello record (`S.bs`), lo stesso salvato nel gioco |
| Esc chiude le finestre | Sì, senza bloccare il tasto |
| Tutte le proporzioni (da 9:32 a 32:9), mouse e touch | Layout responsive, provato a 9:32, 1:1, 9:16 e 32:9 |
| Dimensioni | 118 file, 4,2 MB in tutto, ogni file sotto 512 KB (limiti: 30 MiB iniziali, 250 MiB in tutto) |

## Cose da sapere prima di candidarti
- **Pubblico 13+, non «per bambini».** YouTube rifiuta i giochi fatti apposta per bambini. Monster Laboratory va presentato come gioco per tutti (merge, idle, strategia), non per bambini.
- **Contenuto originale.** Immagini, suoni e font devono essere tuoi o con licenza. I font sono OFL; le immagini sono generate col codice o con l'AI.
- I requisiti completi (in inglese) sono [qui](https://developers.google.com/youtube/gaming/playables/certification/requirements?hl=en).
