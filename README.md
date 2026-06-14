# Piccoli Eroi 2 - La Profezia della Valle Verde

Un gioco di ruolo fantasy per giovani avventurieri, giocabile nel browser. Usa un **sistema d20 classico** (tiro di un dado a 20 facce + modificatori) in versione semplificata e spiegata, pensato per giocare insieme ai bambini.

**Gioca online:** https://enricodam.github.io/piccolieroi2/

La versione 1 resta disponibile su https://enricodam.github.io/piccolieroi/

## Caratteristiche

- **Campagna narrativa in 3 capitoli**: i Goblin del Bosco, le Cripte Antiche, la Montagna di Fuoco, con un villaggio hub (Borgoverde), PNG ricorrenti, dialoghi con scelte e **due finali diversi** (uno richiede di parlare invece di combattere)
- **Regole vere ma kid-friendly**: d20 + modificatore + competenza, vantaggio/svantaggio, tiri salvezza, slot incantesimo e trucchetti, condizioni, riposi brevi (Dadi Vita) e lunghi, critici con dadi doppi, iniziativa
- **8 classi**: Guerriero, Barbaro, Ladro, Maga, Chierico, Ranger, Bardo, Paladino, ognuna con capacita' autentiche (Furia, Attacco Furtivo, Punizione Divina, Ispirazione Bardica, Secondo Vento...)
- **6 specie**: Umano, Elfo, Nano, Halfling, Dragonide (con soffio di fuoco!), Gnomo
- **19 mostri** con tratti speciali: tattiche di branco, veleno, soffio del drago, tenacia dei non morti, aura di paura, mimic travestito da forziere
- **Party da 1 a 6 eroi**, level up fino al livello 5 con scelta della caratteristica al 4
- Enigmi, tesori con prove di caratteristica, negozio, pixel art e musica chiptune generata via Web Audio
- Salvataggio automatico nel browser (localStorage)
- Tutto in italiano, ottimizzato anche per mobile

## Installare come app (PWA)

Il gioco e' una web app installabile. Dal menu iniziale "Installa come app" ci sono le istruzioni per ogni sistema:

- iPhone/iPad (Safari): Condividi → "Aggiungi a Home"
- Android (Chrome): tre puntini → "Installa app"
- Windows/macOS/Ubuntu (Chrome/Edge): icona "Installa" nella barra indirizzi

Grazie al service worker (`sw.js`, strategia network-first) il gioco funziona anche offline e si aggiorna da solo quando si e' online: niente refresh manuali. Se esce un aggiornamento durante il gioco, compare un pulsante "Aggiorna".

I salvataggi usano localStorage (automatico) piu' un **codice partita** copia-incolla come backup robusto (menu ? → "Mostra codice salvataggio"), utile perche' i dati locali possono essere cancellati dal browser/sistema.

## Come si gioca in locale

I moduli ES richiedono un server HTTP (aprire index.html con doppio clic non funziona):

```bash
cd piccolieroi2
python -m http.server 8080
# poi apri http://localhost:8080
```

## Deploy su GitHub Pages

1. Crea il repository `piccolieroi2` su GitHub
2. Push di questa cartella sul branch `main`
3. Su GitHub: Settings, Pages, Source = "Deploy from a branch", Branch = `main` / root
4. Il gioco sara' su `https://TUONOME.github.io/piccolieroi2/`

Nessun build step richiesto: e' tutto HTML/CSS/JS vanilla.

## Struttura del progetto

```
piccolieroi2/
├── index.html          entry point
├── css/style.css       stile pixel-art retro
└── js/
    ├── main.js         bootstrap e router delle schermate
    ├── rules.js        motore regole d20 (dadi, vantaggio, salvezze, slot, riposi, level up)
    ├── data.js         classi, specie, incantesimi, mostri, oggetti
    ├── campaign.js     storia, villaggio, capitoli, mappe, dialoghi, finale
    ├── state.js        stato di gioco, creazione eroi, salvataggi
    ├── sprites.js      pixel art (griglie di caratteri su palette)
    ├── audio.js        chiptune e effetti sonori (Web Audio API)
    ├── ui-core.js      titolo, tutorial, creazione PG, villaggio, negozio, schede
    ├── ui-map.js       esplorazione dungeon, eventi, enigmi, riposi
    └── ui-combat.js    combattimento a turni con iniziativa e azioni
```

## Roadmap (idee future)

- App iOS/Android: wrap con Capacitor (la struttura vanilla JS e' gia' pronta)
- Livelli 6-10 e nuovi capitoli
- Multiclasse e sottoclassi
- Modalita' "Dungeon Master" per inventare avventure proprie

## Note sulle regole

Il gioco usa un sistema d20 classico (dado a 20 facce + modificatori) semplificato dove serve per l'eta' dei giocatori: niente morte dei personaggi (a 0 PF si sviene), gestione del movimento astratta, incantesimi selezionati, condizioni ridotte a un set comprensibile. Le spiegazioni dei tiri sono sempre esplicite per imparare giocando. Le meccaniche dei giochi di ruolo (sistemi e regole) non sono coperte da copyright e sono liberamente utilizzabili.

## Avvertenza legale

Questo e' un progetto amatoriale e gratuito, senza scopo di lucro. Nomi di personaggi, mostri, luoghi, ambientazione, testi, codice e grafica sono originali. Il gioco non e' affiliato, sponsorizzato o approvato da alcun editore di giochi di ruolo, e non utilizza marchi registrati altrui.

Creato con amore per piccoli avventurieri.
