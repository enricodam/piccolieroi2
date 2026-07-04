// ============================================================
// PICCOLI EROI 2 - La Profezia della Valle Verde
// Campagna in 3 capitoli + villaggio hub (Borgoverde)
//
// Legenda mappe:
//   1 = muro    0 = vuoto    2 = pavimento    3 = passaggio ad arco
//   S = inizio  X = uscita/scale
//   a-z = evento (chiave nella tabella events del piano)
//   B = boss
// ============================================================

export const CAMPAIGN_TITLE = 'La Profezia della Valle Verde';

export const PROLOGUE = [
  'Tanto tempo fa, una profezia fu incisa sulla fontana di Borgoverde:',
  '"Quando il fuoco tornera\' a volare sulla valle, non saranno i grandi guerrieri a salvarla... ma i PICCOLI EROI."',
  'Per cento anni tutti hanno riso di quelle parole.',
  'Ma stanotte, in lontananza, qualcosa ha ruggito sulla Montagna di Fuoco. E al villaggio... i guai sono gia\' cominciati.',
];

// ------------------------------------------------------------
// VILLAGGIO HUB
// ------------------------------------------------------------
export const VILLAGE = {
  name: 'Borgoverde',
  desc: 'Un villaggio accogliente tra i boschi della Valle Verde. Casette di legno, una fontana antica e profumo di pane appena sfornato.',
  locations: [
    { id:'piazza', name:'Piazza della Fontana', sprite:'fontana',
      desc:'Il sindaco Tobia ti aspetta vicino alla fontana della profezia.', action:'dialogue' },
    { id:'emporio', name:'Emporio di Baruk', sprite:'mercante',
      desc:'Pozioni, pergamene e oggetti rari. "Prezzi onesti, quasi sempre!"', action:'shop' },
    { id:'locanda', name:'Locanda della Ghianda', sprite:'locanda',
      desc:'Riposo lungo (recupera PF + magie), gioco dei dadi, taglie e pettegolezzi. C\'e\' sempre da fare!', action:'tavern' },
    { id:'tempio', name:'Tempio della Luce', sprite:'tempio',
      desc:'La sacerdotessa Mirta ricarica GRATIS i Punti Ferita (ma non le magie).', action:'temple' },
    { id:'porta', name:'Porta del Villaggio', sprite:'porta',
      desc:'Da qui parte il sentiero verso l\'avventura!', action:'adventure' },
  ],
};

// Negozio: lo stock cresce con i capitoli
export const SHOP_STOCK = {
  1: ['pozione_cura','antidoto','pergamena_lucente','bomba_alchemica'],
  2: ['pozione_cura','antidoto','pergamena_lucente','bomba_alchemica','acqua_benedetta','scudo_runico','arma_magica_1'],
  3: ['pozione_cura','pozione_cura_maggiore','antidoto','pergamena_lucente','pergamena_splendente','bomba_alchemica','acqua_benedetta','scudo_runico','arma_magica_1','mantello_elfico','amuleto_vita','anello_fortuna'],
};

// Pettegolezzi della taverna: indizi e lore per capitolo
export const TAVERN_GOSSIP = {
  1: [
    { who:'Mastro Oste Gualtiero', text:'"I goblin? Spaventati a morte, ti dico! Sono scesi dalla montagna di corsa, blaterando di un GRANDE ROSSO. Mai vista una cosa simile in trent\'anni di taverna."' },
    { who:'Cacciatrice Wilma', text:'"Un consiglio per le Grotte: i goblin combattono meglio in gruppo, ma se isoli il loro capo perde coraggio. E occhio ai ragni: il loro morso avvelena, portatevi un antidoto."' },
    { who:'Vecchio Pino', text:'"Mio nonno diceva che la profezia sulla fontana non era finita. Che sotto il muschio c\'era un\'ultima riga... ma nessuno l\'ha mai pulita per leggerla. Bah, storie."' },
  ],
  2: [
    { who:'Becchino Corrado', text:'"Le Cripte? Ci ho lavorato da giovane. C\'e\' un cavaliere d\'ossa la sotto, Sir Ossarius. Non e\' cattivo... e\' solo TRISTE. Custodisce qualcosa da cent\'anni."' },
    { who:'Sacerdotessa Mirta', text:'"Contro i non morti, l\'acqua benedetta fa miracoli. E il Chierico li scaccia con la luce divina. Scheletri e zombi temono il sacro."' },
    { who:'Cacciatrice Wilma', text:'"Gli zombi sono testardi: a volte si rialzano quando li credi finiti. Colpiteli forte e non datelo per scontato finche\' non smettono di muoversi."' },
  ],
  3: [
    { who:'Eremita di passaggio', text:'"Salite alla Montagna di Fuoco? Sappiate che il drago non ha bruciato il mio orto in tre mesi. Un mostro vero l\'avrebbe fatto per noia. Quel drago... protegge qualcosa."' },
    { who:'Fabbro Ferro', text:'"Sulla montagna fa un caldo infernale. La salamandra di fuoco scotta chi la tocca: meglio colpirla da lontano con frecce o magie. E portate tante pozioni!"' },
    { who:'Mastro Oste Gualtiero', text:'"Dicono che il drago Vermilius sia il figlio del vecchio guardiano della valle. Tornato a casa dopo cent\'anni. Chissa\' se cerca vendetta... o solo la sua famiglia."' },
  ],
};

// Bacheca delle taglie: combattimenti opzionali per oro ed esperienza
export const BOUNTIES = {
  1: [
    { id:'b1_lupi', name:'Branco di lupi', desc:'I lupi spaventano il bestiame ai margini del bosco. 25 monete a chi li scaccia.', monsters:['lupo','lupo','lupo'], gold:25 },
    { id:'b1_goblin', name:'Pattuglia goblin', desc:'Una pattuglia goblin si aggira vicino al mulino. Mettetela in fuga!', monsters:['goblin','goblin_arciere','kobold'], gold:20 },
  ],
  2: [
    { id:'b2_scheletri', name:'Ronda di scheletri', desc:'Scheletri vagano fuori dal cimitero di notte. 35 monete per ripulire la zona.', monsters:['scheletro','scheletro','scheletro_arciere'], gold:35 },
    { id:'b2_pipistrelli', name:'Nido di pipistrelli', desc:'Pipistrelli giganti infestano il vecchio campanile.', monsters:['pipistrello_gigante','pipistrello_gigante','pipistrello_gigante'], gold:30 },
  ],
  3: [
    { id:'b3_orchi', name:'Mercenari orchi', desc:'Orchi pagati dal drago bloccano la strada del valico. 50 monete per sloggiarli.', monsters:['orco_mercenario','orco_mercenario'], gold:50 },
    { id:'b3_kobold', name:'Avamposto kobold', desc:'Un avamposto kobold sorveglia il sentiero. Smantellatelo!', monsters:['kobold_dragonico','kobold_dragonico','kobold_dragonico'], gold:40 },
  ],
};

// Dialoghi del sindaco Tobia: cambiano con il progresso
// stage: ch1_start, ch1_done, ch2_start, ch2_done, ch3_start, ch3_done_fight, ch3_done_peace
export const MAYOR_DIALOGUES = {
  ch1_start: {
    speaker:'Sindaco Tobia', sprite:'sindaco',
    text:'"Piccoli eroi! Che fortuna vedervi! Stanotte i GOBLIN hanno rubato tutte le provviste del villaggio e perfino la Campana della Festa! Senza campana, niente Festa del Raccolto... I goblin si nascondono nelle Grotte del Bosco, a est. Riportate la campana, vi prego! Ah... e fate attenzione: i goblin sembravano TERRORIZZATI da qualcosa. Strano, no?"',
    choices: [
      { label:'"Ci pensiamo noi! Partiamo subito!"', effect:'accept' },
      { label:'"Perche\' i goblin erano terrorizzati?"', next:{
          text:'"Non lo so... il loro capo urlava qualcosa tipo: LA MONTAGNA BRUCIA, LA MONTAGNA E\' SUA. Mah! Voi pensate alla campana, su!"',
          choices:[ { label:'"D\'accordo, andiamo alle Grotte!"', effect:'accept' } ],
        } },
    ],
  },
  ch1_done: {
    speaker:'Sindaco Tobia', sprite:'sindaco',
    text:'"LA CAMPANA! L\'avete riportata! Siete fantastici! Pero\'... quello che vi ha detto il re goblin mi preoccupa: scacciati dalla montagna da UN DRAGO?! Allora la profezia... La vecchia saggia Olga dice che nelle CRIPTE ANTICHE, sotto il cimitero, e\' custodita la Gemma del Drago: una pietra magica che mostra la strada segreta per la tana. Ma le cripte sono piene di non morti! Ecco la chiave. Buona fortuna, piccoli eroi."',
    choices: [ { label:'"Un drago?! Andiamo alle Cripte!"', effect:'accept' } ],
  },
  ch2_start: {
    speaker:'Sindaco Tobia', sprite:'sindaco',
    text:'"Le Cripte Antiche vi aspettano, piccoli eroi. Ricordate: Sir Ossarius custodisce la Gemma del Drago da cent\'anni, e dicono che non sia cattivo... solo triste. Avete la chiave con voi, vero? Se vi serve qualcosa, l\'emporio e\' li\' dietro. In bocca al lupo!"',
    choices: [
      { label:'"Andiamo alle Cripte!"', effect:'accept' },
      { label:'"Prima facciamo scorte in paese"', effect:'close' },
    ],
  },
  ch2_done: {
    speaker:'Sindaco Tobia', sprite:'sindaco',
    text:'"Avete sconfitto il Cavaliere d\'Ossa e trovato la Gemma del Drago! Guardate: indica la Montagna di Fuoco... E\' dunque vero. VERMILIUS E\' TORNATO. Il drago rosso della profezia! Piccoli eroi... tocca a voi. Salvate la valle. E... qualunque cosa troviate lassu\', ricordate: non tutto cio\' che ruggisce e\' cattivo."',
    choices: [ { label:'"E\' l\'ora della profezia. Alla Montagna!"', effect:'accept' } ],
  },
  ch3_start: {
    speaker:'Sindaco Tobia', sprite:'sindaco',
    text:'"La Montagna di Fuoco... piu\' ci penso e piu\' mi trema la fascia da sindaco. Ma la profezia parla di voi, piccoli eroi. Seguite la Gemma: conosce la strada. E ricordate le mie parole: non tutto cio\' che ruggisce e\' cattivo."',
    choices: [
      { label:'"Alla Montagna di Fuoco!"', effect:'accept' },
      { label:'"Un momento, ci prepariamo meglio"', effect:'close' },
    ],
  },
  ch3_done_fight: {
    speaker:'Sindaco Tobia', sprite:'sindaco',
    text:'"Avete sconfitto il drago! La valle e\' salva! La profezia diceva il vero: i piccoli eroi ce l\'hanno fatta! Stasera, festa GIGANTE alla locanda. E la campana suonera\' per voi!"',
    choices: [ { label:'"Evviva!"', effect:'end' } ],
  },
  ch3_done_peace: {
    speaker:'Sindaco Tobia', sprite:'sindaco',
    text:'"Incredibile... avete fatto AMICIZIA con il drago?! E quell\'uovo... diventera\' il guardiano della valle?! Piccoli eroi, avete fatto qualcosa di piu\' grande che vincere una battaglia: avete capito. La profezia era proprio vera, ma nessuno l\'aveva letta fino in fondo: guardate, sotto il muschio della fontana c\'era un\'ultima riga... "E IL FUOCO DIVENTERA\' IL LORO AMICO." Stasera si festeggia!"',
    choices: [ { label:'"Evviva!"', effect:'end' } ],
  },
};

// ------------------------------------------------------------
// CAPITOLO 1 - I Goblin del Bosco
// ------------------------------------------------------------
const CH1 = {
  id: 1,
  title: 'I Goblin del Bosco',
  subtitle: 'Capitolo Primo',
  intro: 'I goblin hanno svaligiato Borgoverde e rubato la Campana della Festa. Le loro tracce portano alle Grotte del Bosco. Ma perche\' dei goblin di montagna sono scesi fin qui?',
  outroTitle: 'La campana e\' salva!',
  outro: 'Re Sghignazzo si arrende tra mille inchini: "Scusate scusate! Non volevamo! La montagna brucia! Il GRANDE ROSSO e\' tornato nella montagna e ci ha cacciato dalle nostre caverne! Avevamo fame..." I piccoli eroi si guardano: un drago? Il sindaco deve saperlo subito.',
  objectives: [
    'Esplora le Grotte del Bosco',
    'Ritrova la Campana della Festa',
    'Sconfiggi il capo dei goblin',
  ],
  floors: [
    {
      name:'Il Sentiero nel Bosco',
      ambience:'forest',
      map:[
        '111111111111111',
        '1S2222222222221',
        '122222222222221',
        '122222222222221',
        '122222a22222221',
        '121111112222221',
        '121332222d22e21',
        '121112c22222221',
        '122212222221111',
        '122b11311111221',
        '122221222222221',
        '1222212222222X1',
        '111111111111111',
      ],
      events:{
        a:{ type:'combat', monsters:['goblin','goblin'], text:'Due goblin di vedetta saltano giu\' dagli alberi: "Intrusi! Intrusiiii!"', reward:{gold:8} },
        b:{ type:'treasure', text:'Uno zaino abbandonato dai contadini in fuga, mezzo nascosto tra i cespugli.',
            check:{stat:'SAG', dc:10, label:'Percezione'},
            success:{text:'Dentro trovate provviste e una pozione dimenticata!', items:['pozione_cura'], gold:10},
            fail:{text:'Lo zaino e\' pieno di... api arrabbiate! Ahia!', dmg:2} },
        c:{ type:'dialogue', speaker:'Scoiattolo Parlante', sprite:'scoiattolo',
            text:'Uno scoiattolo vi blocca la strada, agitando la coda: "Psst! Eroi! I verdi puzzoni sono passati di qui con una campana ENORME. Ridevano, ma avevano gli occhi spaventati. Parlavano della MONTAGNA CHE BRUCIA. Occhio al loro re: attacca due volte di fila!"',
            choices:[
              { label:'"Grazie, amico scoiattolo!"', effect:{type:'lore'} },
              { label:'Offrirgli una noce (se ce l\'avessi...)', effect:{type:'funny', text:'Lo scoiattolo ride: "Non ho bisogno di noci, ho bisogno di PACE E SILENZIO!" e sparisce in un cespuglio.'} },
            ] },
        d:{ type:'combat', monsters:['lupo','lupo'], text:'Ringhi dal sottobosco: due lupi affamati vi circondano! Attenti: i lupi si aiutano a vicenda.', reward:{} },
        e:{ type:'rest', text:'Una radura tranquilla con un ruscello cristallino. Il posto perfetto per un riposo breve: potete spendere Dadi Vita per recuperare PF.' },
      },
    },
    {
      name:'Le Grotte del Bosco',
      ambience:'cave',
      map:[
        '111111111111111',
        '1S2222222222221',
        '1222211111c1111',
        '12222222331d121',
        '12222221111e121',
        '12211b222212121',
        '12a312222212221',
        '121111122222221',
        '12221222f2g2221',
        '122212222222221',
        '122212222222221',
        '1222122222222B1',
        '111111111111111',
      ],
      events:{
        a:{ type:'combat', monsters:['kobold','kobold','kobold'], text:'Tre kobold sbucano da dietro le stalagmiti: "Il Re non vuole visite!" I kobold sono deboli da soli, ma in branco hanno vantaggio!', reward:{gold:9} },
        b:{ type:'treasure', text:'Un forziere di legno con una serratura complicata.',
            check:{stat:'DES', dc:12, label:'Scassinare'},
            success:{text:'Click! Dentro: il bottino dei goblin!', items:['pozione_cura','bomba_alchemica'], gold:25},
            fail:{text:'SNAP! Una molla scatta e una boccetta puzzolente vi esplode in faccia!', dmg:3} },
        c:{ type:'puzzle', text:'Una porta di pietra con un indovinello goblin inciso (con errori di ortografia):\n"Piu\' ne togli, piu\' divento grande. Cosa sono?"',
            answer:'buco', accepted:['buco','il buco','un buco','buca'],
            hints:['Pensa a quando scavi...','I goblin scavano gallerie...'],
            reward:{text:'La porta si apre su un piccolo tesoro nascosto!', items:['pozione_cura'], gold:20} },
        d:{ type:'combat', monsters:['slime','slime'], text:'Il pavimento... si muove! Due slime verdi scivolano verso di voi, lasciando una scia appiccicosa.', reward:{} },
        e:{ type:'dialogue', speaker:'Goblin Prigioniero', sprite:'goblin',
            text:'Un goblin minuscolo e\' chiuso in una gabbia di legno: "Aiuto! Re Sghignazzo mi ha messo in punizione perche\' ho detto che rubare e\' SBAGLIATO! Liberatemi e vi dico un segreto!"',
            choices:[
              { label:'Liberarlo', effect:{type:'gift', text:'"GRAZIE! Ecco il segreto: il Re tiene la campana DIETRO IL TRONO. E... non e\' cattivo, e\' solo spaventato. Il GRANDE ROSSO ci ha cacciato dalla montagna!" Il goblin vi regala una pozione rubata (ehm... trovata).', items:['pozione_cura'] } },
              { label:'Lasciarlo li\' (e\' pur sempre un goblin...)', effect:{type:'funny', text:'Il goblin sospira: "Capisco... pero\' almeno una merendina?" Ve ne andate sentendovi un po\' in colpa.'} },
            ] },
        f:{ type:'combat', monsters:['ragno_gigante'], text:'Ragnatele ovunque... un ragno gigante cala dal soffitto! Il suo morso avvelena: tiro salvezza su Costituzione!', reward:{} },
        g:{ type:'treasure', text:'Una nicchia naturale brilla debolmente nella parete di roccia.',
            check:{stat:'INT', dc:11, label:'Indagare'},
            success:{text:'Dietro un masso mobile: una pergamena magica conservata alla perfezione!', items:['pergamena_lucente'], gold:15},
            fail:{text:'Spostate il masso sbagliato e vi cade su un piede. OUCH.', dmg:2} },
        B:{ type:'boss', monsters:['capo_goblin','goblin','goblin'],
            text:'La caverna del trono! Re Sghignazzo siede su una pila di oggetti rubati, la Campana della Festa luccica dietro di lui. "INTRUSI! Nessuno tocca il MIO bottino! GUARDIE!"',
            victoryText:'Re Sghignazzo crolla a terra e si arrende: la Campana della Festa e\' vostra!' },
      },
    },
  ],
};

// ------------------------------------------------------------
// CAPITOLO 2 - Le Cripte Antiche
// ------------------------------------------------------------
const CH2 = {
  id: 2,
  title: 'Le Cripte Antiche',
  subtitle: 'Capitolo Secondo',
  intro: 'Sotto il vecchio cimitero dormono le Cripte Antiche, dove i primi abitanti della valle nascosero la Gemma del Drago. Ma chi disturba il sonno dei morti... li sveglia.',
  outroTitle: 'La Gemma del Drago!',
  outro: 'Sir Ossarius cade in ginocchio e, per un attimo, la luce torna nei suoi occhi vuoti: "Grazie... piccoli eroi. Cento anni fa giurai di custodire la Gemma fino al ritorno del drago. Ora il giuramento e\' compiuto... portatela alla montagna. E ricordate: Vermilius non e\' sempre stato un mostro..." L\'armatura si sbriciola in polvere d\'argento. Nel palmo della vostra mano, la Gemma del Drago pulsa come un cuore caldo.',
  objectives: [
    'Esplora le Cripte Antiche',
    'Supera le prove dei guardiani',
    'Recupera la Gemma del Drago da Sir Ossarius',
  ],
  floors: [
    {
      name:'Il Cimitero Dimenticato',
      ambience:'graveyard',
      map:[
        '111111111111111',
        '1S2222222222221',
        '12222222b1c2221',
        '122222221111121',
        '1222a2113122221',
        '121222222131221',
        '12122222e131221',
        '121112222121221',
        '122211111221221',
        '12222222g221221',
        '12d22f222111111',
        '1222222222222X1',
        '111111111111111',
      ],
      events:{
        a:{ type:'combat', monsters:['zombi'], text:'La terra si smuove... uno zombi emerge da una tomba! E\' lento, ma testardo: a volte si rialza quando sembra sconfitto!', reward:{} },
        b:{ type:'treasure', text:'Una lapide con un\'iscrizione consumata dal tempo e un piccolo scrigno ai suoi piedi.',
            check:{stat:'INT', dc:11, label:'Storia'},
            success:{text:'Decifrate l\'iscrizione: "Per il viandante stanco". Era un dono! Dentro: acqua benedetta.', items:['acqua_benedetta'], gold:15},
            fail:{text:'Non capite le rune e lo scrigno vi punge con un ago protettivo. Ahi!', dmg:2} },
        c:{ type:'combat', monsters:['scheletro','scheletro_arciere'], text:'Click clack... due scheletri montano la guardia tra le tombe. Le ossa scattano sull\'attenti!', reward:{gold:10} },
        d:{ type:'dialogue', speaker:'Corvo Bianco', sprite:'corvo',
            text:'Un corvo bianco come la neve vi osserva da una croce di pietra: "CRA! Piccoli eroi! Il cavaliere che cercate era il piu\' nobile della valle. Custodisce la gemma per il drago, da cento anni. CRA! Liberatelo dal suo giuramento... e dal suo dolore. Attenti al suo spadone: gela il sangue!"',
            choices:[
              { label:'"Chi era Sir Ossarius da vivo?"', next:{
                  text:'"CRA! Il primo amico del drago! Quando Vermilius il Vecchio mori\', il suo cucciolo scomparve... e Ossarius giuro\' di custodire la gemma fino al ritorno. La morte non gli bastava come scusa per smettere. CRA!"',
                  choices:[ { label:'"Grazie, corvo bianco."', effect:{type:'lore'} } ] } },
              { label:'"Grazie, dobbiamo andare!"', effect:{type:'lore'} },
            ] },
        e:{ type:'rest', text:'Una cappella minuscola e ancora consacrata: dentro vi sentite al sicuro. Riposo breve disponibile.' },
        f:{ type:'combat', monsters:['pipistrello_gigante','pipistrello_gigante'], text:'Strilli acuti dal campanile in rovina: pipistrelli giganti in picchiata!', reward:{} },
        g:{ type:'treasure', text:'Un mausoleo con la porta socchiusa. Dentro, qualcosa luccica.',
            check:{stat:'SAG', dc:12, label:'Percezione'},
            success:{text:'Notate il filo della trappola e lo scavalcate: il tesoro del mausoleo e\' vostro!', items:['pozione_cura','acqua_benedetta'], gold:20},
            fail:{text:'TWANG! Un dardo scatta dal muro!', dmg:4} },
      },
    },
    {
      name:'Le Cripte Profonde',
      ambience:'crypt',
      map:[
        '111111111111111',
        '1S2222222222221',
        '1221222a1111121',
        '1221122222de221',
        '122112222222221',
        '122212221112221',
        '122212221312221',
        '122b12221212221',
        '122c221f2212221',
        '122222122222221',
        '122222g2h222221',
        '1222222222222B1',
        '111111111111111',
      ],
      events:{
        a:{ type:'combat', monsters:['scheletro','scheletro','scheletro_arciere'], text:'Una pattuglia d\'ossa vi sbarra il corridoio: tre scheletri in formazione militare!', reward:{gold:12} },
        b:{ type:'puzzle', text:'Una porta sigillata da magia antica. Sopra, una scritta luminosa:\n"Parlo senza bocca e ascolto senza orecchie. Non ho corpo, ma prendo vita con il vento. Cosa sono?"',
            answer:'eco', accepted:['eco',"l'eco",'un eco',"un'eco"],
            hints:['Si sente in montagna e nelle caverne...','Ripete quello che dici...'],
            reward:{text:'La porta canta la risposta e si apre: dentro c\'e\' l\'armeria dei guardiani!', items:['arma_magica_1'], gold:25} },
        c:{ type:'combat', monsters:['fantasma'], text:'Un lamento gelido riempie la stanza... un fantasma attraversa il muro! Il suo aspetto terrificante puo\' spaventarvi: tiro salvezza su Saggezza!', reward:{} },
        d:{ type:'treasure', text:'Un forziere dall\'aria stranamente... troppo invitante, in mezzo a una stanza vuota.',
            check:{stat:'SAG', dc:13, label:'Percezione'},
            success:{text:'Un attimo... quel forziere RESPIRA! E\' un MIMIC! Lo cogliete di sorpresa voi, stavolta!', combatAdv:true, monsters:['mimic'] },
            fail:{text:'Allungate la mano verso il tesoro e... IL FORZIERE HA I DENTI!', combatDis:true, monsters:['mimic'] } },
        e:{ type:'rest', text:'La tomba di un guaritore: la sua benedizione aleggia ancora. Riposo breve disponibile, e vi sentite protetti.' },
        f:{ type:'combat', monsters:['zombi','zombi'], text:'Due zombi escono barcollando dai loculi. Uno indossa ancora il cappello da giardiniere del cimitero.', reward:{} },
        g:{ type:'treasure', text:'Lo scrittoio del custode delle cripte, coperto di polvere e pergamene.',
            check:{stat:'INT', dc:12, label:'Indagare'},
            success:{text:'Tra le pergamene: una mappa che rivela un passaggio e una pergamena magica intatta!', items:['pergamena_splendente'], gold:10},
            fail:{text:'Sollevate troppa polvere secolare: ETCIU\'! Vi sentite intontiti.', dmg:1} },
        h:{ type:'dialogue', speaker:'Eco di Ossarius', sprite:'fantasma',
            text:'Davanti alla porta del boss, una voce antica risuona: "Chi viene a reclamare la Gemma? Rispondete, viandanti: PERCHE\' combattete?"',
            choices:[
              { label:'"Per proteggere il nostro villaggio!"', effect:{type:'lore', text:'La voce si addolcisce: "Proteggere... si\'. Anche io proteggevo. Venite, piccoli eroi. Liberatemi."'} },
              { label:'"Per la gloria e il tesoro!"', effect:{type:'lore', text:'La voce ridacchia, antica e stanca: "Ah, la gloria. Anche io dicevo cosi\', da giovane. Venite, vi aspetto. Vediamo se la gloria vi basta."'} },
              { label:'"Per scoprire la verita\' sul drago."', effect:{type:'lore', text:'Silenzio. Poi, quasi un sussurro: "...allora siete VOI quelli della profezia. Venite. E\' ora."'} },
            ] },
        B:{ type:'boss', monsters:['cavaliere_ossa','scheletro'],
            text:'La Sala del Giuramento. Un cavaliere in armatura nera siede immobile su un trono di pietra, uno spadone sulle ginocchia, una gemma rossa che pulsa sul petto. Si alza con uno scricchiolio: "Il giuramento... deve essere... MESSO ALLA PROVA!"',
            victoryText:'Sir Ossarius e\' libero dal suo giuramento: la Gemma del Drago e\' vostra!' },
      },
    },
  ],
};

// ------------------------------------------------------------
// CAPITOLO 3 - La Montagna di Fuoco
// ------------------------------------------------------------
const CH3 = {
  id: 3,
  title: 'La Montagna di Fuoco',
  subtitle: 'Capitolo Finale',
  intro: 'La Gemma del Drago pulsa sempre piu\' forte man mano che salite. La Montagna di Fuoco vi sovrasta, e in cima... Vermilius. La profezia parla di voi. E\' il momento dei Piccoli Eroi.',
  outroTitle: 'La Profezia e\' compiuta!',
  outro: '',
  objectives: [
    'Scala la Montagna di Fuoco',
    'Supera i guardiani del drago',
    'Affronta Vermilius nella sua tana',
  ],
  floors: [
    {
      name:'Il Sentiero di Cenere',
      ambience:'mountain',
      map:[
        '111111111111111',
        '1S2222222222221',
        '122222ab2221221',
        '122222222131221',
        '1222221221f1221',
        '12212c122121111',
        '122122122131111',
        '12212212g22i221',
        '12211112h222221',
        '12d222222222221',
        '12e222222222121',
        '1222222222221X1',
        '111111111111111',
      ],
      events:{
        a:{ type:'combat', monsters:['kobold_dragonico','kobold_dragonico'], text:'"FERMI! Il Grande Rosso non riceve!" Due kobold d\'elite con scaglie dipinte di rosso vi sbarrano il sentiero.', reward:{gold:14} },
        b:{ type:'treasure', text:'Lo zaino bruciacchiato di un avventuriero meno fortunato di voi. Riposa in pace, collega.',
            check:{stat:'SAG', dc:11, label:'Percezione'},
            success:{text:'Nel doppio fondo: una pozione potente e delle monete fuse ma ancora buone.', items:['pozione_cura_maggiore'], gold:20},
            fail:{text:'Lo zaino si sbriciola in cenere calda. Vi scottate le dita.', dmg:2} },
        c:{ type:'dialogue', speaker:'Vecchia Eremita', sprite:'eremita',
            text:'Una vecchina vive in una capanna di pietra sul fianco della montagna, imperturbabile: "Oh, visitatori! Tofu di lava? No? Sentite, ve lo dico perche\' siete piccoli: il drago NON ha toccato il mio orto in tre mesi. Un drago cattivo l\'avrebbe arrostito per noia. Quello li\' sopra... STA PROTEGGENDO QUALCOSA. I draghi diventano feroci solo per due cose: il tesoro... e la famiglia."',
            choices:[
              { label:'"La famiglia? Cosa intendete?"', next:{
                  text:'"Cento anni fa qui viveva Vermilius il Vecchio, il drago BUONO che proteggeva la valle. Quando mori\', il suo unico uovo sparve. Se quel ragazzone lassu\' e\' chi penso io... non e\' tornato per distruggere. E\' tornato A CASA. Tenetelo a mente prima di sguainare le spade."',
                  choices:[ { label:'"Grazie, nonnina. Ci ricorderemo."', effect:{type:'lore'} } ] } },
              { label:'"Un drago e\' un drago. Grazie lo stesso!"', effect:{type:'funny', text:'L\'eremita scrolla le spalle: "I giovani... Va bene, va bene. Almeno prendete una caramella di ossidiana. No, scherzo, quella spacca i denti."'} },
            ] },
        d:{ type:'combat', monsters:['orco_mercenario'], text:'Un orco enorme affila l\'ascia su una roccia: "Il drago paga ORO per fermare i ficcanaso. Niente di personale, piccoletti."', reward:{gold:20} },
        e:{ type:'rest', text:'Una sorgente termale naturale. L\'acqua calda scioglie la stanchezza: riposo breve disponibile.' },
        f:{ type:'combat', monsters:['salamandra'], text:'Le rocce si fondono... una salamandra di fuoco striscia fuori dalla lava! Attenti a colpirla da vicino: scotta!', reward:{} },
        g:{ type:'puzzle', text:'Un ponte di ossidiana spezzato. Sull\'unica colonna rimasta, rune draconiche:\n"Sono sempre affamato e devo sempre mangiare. Ma se bevo, muoio. Cosa sono?"',
            answer:'fuoco', accepted:['fuoco','il fuoco'],
            hints:['Su questa montagna ce n\'e\' tantissimo...','L\'acqua lo spegne...'],
            reward:{text:'Le rune brillano e il ponte si ricompone pezzo per pezzo! Sotto l\'ultima lastra: un dono degli antichi.', items:['anello_fortuna'], gold:15} },
        h:{ type:'combat', monsters:['kobold_dragonico','kobold_dragonico','kobold'], text:'Un posto di guardia kobold! Suonano un corno d\'allarme: "INTRUSI SULLA MONTAGNA SACRAAA!"', reward:{gold:12} },
        i:{ type:'treasure', text:'Una cassa di rifornimenti dell\'esercito kobold, marchiata con un sigillo a forma di fiamma.',
            check:{stat:'DES', dc:12, label:'Scassinare'},
            success:{text:'Aperta senza far scattare l\'allarme! Rifornimenti di qualita\' draconica.', items:['pozione_cura_maggiore','bomba_alchemica'], gold:18},
            fail:{text:'L\'allarme scatta! Una micro-baliste vi spara un sasso prima che riusciate a scappare.', dmg:4} },
      },
    },
    {
      name:'La Tana di Vermilius',
      ambience:'lair',
      map:[
        '111111111111111',
        '1S2222222222221',
        '122222222222121',
        '1222222bc222121',
        '1222a2221122121',
        '122222222112121',
        '12222222f122121',
        '12222d222g22221',
        '12222e22222h221',
        '122221222222221',
        '122211112222121',
        '1222222222221B1',
        '111111111111111',
      ],
      events:{
        a:{ type:'combat', monsters:['cucciolo_drago'], text:'Un cucciolo di drago vi piomba addosso strillando! Non e\' Vermilius... e\' MOLTO piu\' piccolo. Ma sputa fuoco lo stesso!', reward:{} },
        b:{ type:'treasure', text:'Una pila di monete d\'oro... sospettosamente ordinata, vicino all\'ingresso.',
            check:{stat:'SAG', dc:13, label:'Percezione'},
            success:{text:'E\' un\'esca con trappola! La disinnescate e vi prendete pure l\'esca. Chi e\' il furbo adesso?', gold:40},
            fail:{text:'WHOOSH! Un getto di vapore bollente! Era una trappola anti-ladri.', dmg:5} },
        c:{ type:'combat', monsters:['salamandra','kobold_dragonico'], text:'La guardia d\'onore del drago: una salamandra e il capitano dei kobold. "Fin qui siete arrivati. Ma non oltre!"', reward:{gold:15} },
        d:{ type:'rest', text:'Una grotta laterale fresca e silenziosa, lontana dal calore della tana. L\'ultima occasione di riposare: usatela bene!' },
        e:{ type:'puzzle', text:'Una porta di scaglie dorate con un\'iscrizione draconica:\n"Appartiene a te, ma gli altri lo usano piu\' di te. Cosa e\'?"',
            answer:'nome', accepted:['nome','il nome','il mio nome','mio nome'],
            hints:['Tutti ne hanno uno...','Il drago si chiama Vermilius...'],
            reward:{text:'La porta sussurra "VERMILIUS" e si apre: la riserva privata del drago!', items:['pozione_cura_maggiore','pergamena_splendente'], gold:30} },
        f:{ type:'combat', monsters:['orco_mercenario','orco_mercenario'], text:'Gli ultimi due mercenari rimasti, giganteschi e nervosi: "Il drago non ci paga abbastanza per QUESTO... ma un contratto e\' un contratto!"', reward:{gold:35} },
        g:{ type:'dialogue', speaker:'Gemma del Drago', sprite:'gemma',
            text:'La Gemma del Drago si illumina e... PARLA, con una voce calda e antica: "Piccoli eroi. Io ero il cuore di Vermilius il Vecchio. Mio figlio e\' oltre quella porta. E\' arrabbiato, spaventato e solo. Ha trovato il suo stesso uovo, rubato cento anni fa, e lo difende da tutti. Potete combatterlo... o potete MOSTRARGLI questa gemma. La scelta sara\' vostra. Scegliete da eroi."',
            choices:[ { label:'Prendere un respiro profondo e avanzare', effect:{type:'lore'} } ],
        },
        h:{ type:'combat', monsters:['cucciolo_drago','kobold_dragonico'], text:'Un secondo cucciolo, piu\' grande del primo, difende l\'ultimo corridoio con il suo fedele kobold!', reward:{} },
        B:{ type:'boss', monsters:['drago_rosso'], finale:true,
            text:'La tana. Montagne d\'oro scintillano alla luce della lava. Al centro, avvolto attorno a un UOVO dorato, VERMILIUS solleva la testa enorme. "LADRI. Siete venuti per l\'uovo, COME GLI ALTRI." Il pavimento trema. La Gemma del Drago, nella vostra tasca, brilla fortissimo...',
            victoryText:'Vermilius si accascia, sconfitto. La valle e\' salva!' },
      },
    },
  ],
};

export const CHAPTERS = [CH1, CH2, CH3];

// Scelta finale davanti a Vermilius (gestita dal motore eventi)
export const FINALE = {
  preChoices: [
    { id:'fight', label:'"Proteggiamo la valle!" (Combatti!)' },
    { id:'gem', label:'Mostrare la Gemma del Drago', check:{stat:'CAR', dc:13, label:'Persuasione'} },
  ],
  gemSuccess: {
    text:'Sollevate la Gemma. Vermilius si blocca. Le sue pupille si stringono: "Quella... e\' di mio PADRE." La gemma fluttua verso di lui e si posa sull\'uovo, avvolgendolo di luce dorata. Il drago abbassa la testa, e per la prima volta la sua voce e\' piccola: "Pensavo che il mondo avesse dimenticato. Che TUTTI volessero solo il mio oro e il mio uovo." Guarda la valle, in basso. "Mio padre la proteggeva. Forse... posso provarci anch\'io."',
    ending:'peace',
  },
  gemFail: {
    text:'Sollevate la Gemma, ma le parole vi escono confuse e Vermilius e\' troppo furioso per ascoltare: "TRUCCHI! SOTTERFUGI!" Sputa una colonna di fuoco verso il soffitto. Non c\'e\' altra scelta: combattere! (Ma forse, se lo indebolite, ascoltera\'...)',
    ending:'fight_then_choice',
  },
  // Se il drago scende sotto meta' PF dopo un fallimento, riappare la scelta
  midFightOffer: {
    text:'Vermilius barcolla, il fianco ferito. Protegge l\'uovo con un\'ala. Per un attimo, nei suoi occhi enormi, vedete... paura. La Gemma pulsa di nuovo nella vostra tasca.',
    choices: [
      { id:'gem_again', label:'Abbassare le armi e mostrare di nuovo la Gemma', check:{stat:'CAR', dc:9, label:'Persuasione'} },
      { id:'fight_on', label:'Continuare a combattere' },
    ],
  },
  victoryFight: {
    title:'La Valle e\' Salva!',
    text:'Vermilius, sconfitto, fugge oltre le montagne portando con se\' il suo uovo. La valle e\' libera! Tornate a Borgoverde da eroi, con le tasche piene di tesoro. Eppure, ripensando a quell\'ala protettiva sull\'uovo... una piccola parte di voi si chiede se ci fosse un altro modo.',
    ending:'fight',
  },
  victoryPeace: {
    title:'Un Nuovo Guardiano',
    text:'Vermilius vi accompagna fino al limite del bosco, l\'uovo stretto tra gli artigli con delicatezza sorprendente. "Piccoli eroi... mio padre proteggeva questa valle. Io continuero\' il suo lavoro. E quando mio figlio nascera\', avra\' degli amici che gli insegneranno il coraggio." Da quel giorno, un\'ombra rossa veglia sulla Valle Verde. E i bambini di Borgoverde giurano di aver visto, certe sere, un drago sorridere.',
    ending:'peace',
  },
};
