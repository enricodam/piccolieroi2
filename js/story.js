// ============================================================
// PICCOLI EROI 2 - Modalita' STORIA (per neofiti)
// Avventura guidata a tappe, narrata, con scelte chiare.
// Riusa mostri/oggetti ma con tanta narrazione e poche meccaniche.
//
// OGNI SCENA HA UN id STABILE: il progresso viene salvato per id,
// non per posizione. Si possono inserire/togliere scene senza
// rompere i salvataggi esistenti.
//
// Tipi di scena:
//  narra  : {id, type:'narra', sprite?, who?, text}
//  scelta : {id, type:'scelta', text, sprite?, choices:[...]}
//  prova  : {id, type:'prova', text, sprite?, who, stat, dc, why?, label, success:{...}, fail:{...}}
//  combat : {id, type:'combat', text, sprite?, monsters, gold?, victoryText?}
//  boss   : {id, type:'boss', text, monsters, victoryText, finale?}
//  riposo : {id, type:'riposo', text}
//  dono   : {id, type:'dono', text, items?, gold?}
//
// Schema di una choice (tutte le chiavi opzionali tranne label):
//  { label, reply?, gold?, items?, setFlag?, ifFlag?, ifNotFlag?,
//    ifCaster?, ifNotCaster?,    // visibile solo con/senza un incantatore in squadra
//    goto?,                      // salta alla scena con quell'id
//    check?: {stat, dc, why?},   // DADO TELEGRAFATO: la UI mostra stat e
//                                // difficolta' PRIMA della scelta
//    success?: {text, items?, gold?, dmg?, setFlag?, goto?, ending?},
//    fail?:    {text, items?, gold?, dmg?, setFlag?, goto?, ending?} }
//
// Regole di bilanciamento del Cantastorie (decise con Enrico):
// - triangolo rischio/ricompensa: solo i tiri riusciti danno bonus
// - l'opzione SICURA (senza dado) fa avanzare ma NON premia, e il
//   Cantastorie dichiara in chiaro a cosa si rinuncia
// - la sicura NON compare in ogni scena
// - opzione MAGIA condizionale (ifCaster) per gli incantatori
// - fail-forward: un tiro fallito costa poco ma non blocca mai
//
// Esiti (success/fail): 'goto' salta a una scena, 'ending' chiude
// l'avventura con quel finale (chiave di endings). Niente piu'
// 'special' magici: tutto il branching e' dichiarato nei dati.
//
// Scene e choices possono avere ifFlag/ifNotFlag: la scena viene
// saltata (o la scelta nascosta) se la condizione non vale.
// I flag si impostano con setFlag e vivono in GAME.flags (salvati).
// ============================================================

export const STORY = {
  chapters: [
    // ====================================================
    // CAPITOLO 1
    // ====================================================
    {
      id: 1,
      subtitle: 'Capitolo Primo',
      title: 'I Goblin del Bosco',
      banner: 'C\'era una volta, nella Valle Verde, un villaggio tranquillo di nome Borgoverde. Una notte, dei goblin dispettosi rubarono la Campana della Festa! Senza campana niente festa... e cosi\' i piccoli eroi partirono verso il bosco. Quell\'eroe sei TU.',
      scenes: [
        { id:'c1_sindaco', type:'narra', sprite:'sindaco', who:'Sindaco Tobia',
          text:'"Piccolo eroe, meno male che sei qui! I goblin sono scappati nel bosco con la nostra campana. Erano spaventati da qualcosa... continuavano a urlare di un GRANDE ROSSO sulla montagna. Strano, vero? Riporta la campana e sarai il nostro campione!"' },
        { id:'c1_sentiero', type:'narra', sprite:'ranger', who:'Il Cantastorie',
          text:'Cammini lungo il sentiero del bosco. Le foglie scricchiolano, gli uccellini cinguettano, e in lontananza... senti delle risatine dispettose. I goblin sono vicini!' },
        { id:'c1_scoiattolo', type:'scelta', sprite:'scoiattolo', who:'Scoiattolo Parlante',
          text:'Uno scoiattolo salta su un ramo davanti a te: "Psst! Eroe! I goblin verdi sono passati di qua con una campana enorme. Vuoi un consiglio o hai fretta?"',
          choices:[
            { label:'"Dimmi tutto, scoiattolo!"', reply:'"Il loro capo attacca due volte di fila, occhio! E se ti fai male, bevi una pozione. Tieni, ho trovato questa per terra." Lo scoiattolo ti lancia una pozione!', items:['pozione_cura'] },
            { label:'"Ho fretta, ma grazie!"', reply:'"Come vuoi! Ma non dire che non ti avevo avvisato!" Lo scoiattolo sparisce tra le foglie, scuotendo la testa.' },
          ] },
        { id:'c1_goblin', type:'combat', sprite:'goblin', monsters:['goblin','goblin'], gold:10,
          text:'Due goblin saltano fuori da dietro un cespuglio, agitando bastoni: "Intrusi! Questo e\' il NOSTRO bosco!" E\' ora di combattere!',
          victoryText:'I due goblin scappano via piagnucolando. Bravo!' },
        { id:'c1_forziere', type:'scelta', sprite:'chest', who:'Il Cantastorie',
          text:'In una radura trovi un vecchio forziere di legno, mezzo sepolto tra le foglie. E\' chiuso a chiave, e i forzieri abbandonati nel bosco a volte nascondono trappole... e a volte tesori. Come vuoi provarci, eroe?',
          choices:[
            { label:'Scassinare la serratura con delicatezza',
              check:{ stat:'DES', dc:11, why:'Dita agili aprono la serratura senza far scattare la molla.' },
              success:{ text:'CLICK! Il forziere si apre senza un rumore. Dentro: monete luccicanti e una pozione! Che fortuna!', items:['pozione_cura'], gold:20 },
              fail:{ text:'Ahia! Una piccola molla scatta e ti graffia un dito. Il forziere si apre lo stesso, ma dentro trovi solo qualche moneta.', gold:8, dmg:2 } },
            { label:'Forzare il coperchio a spallate',
              check:{ stat:'FOR', dc:12, why:'Il legno e\' vecchio ma robusto: servono muscoli veri.' },
              success:{ text:'CRACK! Il coperchio salta via con un colpo solo. Monete e una pozione rotolano fuori. Che forza!', items:['pozione_cura'], gold:20 },
              fail:{ text:'Il forziere resiste e la spallata ti lascia il fianco dolorante. Alla fine si apre uno spiraglio: dentro, qualche moneta.', gold:8, dmg:2 } },
            { label:'Studiare il meccanismo con calma',
              check:{ stat:'INT', dc:11, why:'Le trappole hanno una logica: chi la capisce non si fa male.' },
              success:{ text:'Noti un ago nascosto vicino alla serratura e lo blocchi con un rametto. Poi apri con tutta calma: monete e una pozione, senza un graffio!', items:['pozione_cura'], gold:15 },
              fail:{ text:'Il meccanismo e\' troppo strano per capirlo. Alla fine apri con una botta decisa: qualche moneta, e un piccolo graffio.', gold:8, dmg:1 } },
            { ifCaster:true, label:'MAGIA: aprirlo a distanza con un incantesimo',
              check:{ stat:'INT', dc:9, why:'Da lontano nessuna trappola puo\' pungerti. Ma la magia va dosata bene!' },
              success:{ text:'Una mano di luce gira la chiave invisibile e il forziere si apre da solo. Monete e una pozione, comodamente da lontano!', items:['pozione_cura'], gold:15 },
              fail:{ text:'La magia sfrigola e si spegne: il coperchio si apre solo a meta'+'\'. Con un po\' di pazienza recuperi qualche moneta.', gold:8 } },
            { ifNotCaster:true, label:'Lasciar perdere il forziere e proseguire',
              reply:'Il Cantastorie annuisce: "Prudente! Nessuna trappola ti puo\' toccare... ma il tesoro del forziere restera\' per sempre un mistero." Riprendi il cammino a mani vuote.' },
          ] },
        { id:'c1_ruscello', type:'riposo',
          text:'Trovi un ruscello cristallino in una radura soleggiata. Ti siedi un momento, bevi acqua fresca e riprendi fiato. Ti senti meglio: le ferite si rimarginano!' },
        { id:'c1_gabbia', type:'scelta', sprite:'goblin', who:'Goblin Piccolino',
          text:'Un goblin minuscolo e\' chiuso in una gabbia di legno: "Aiutooo! Il Re mi ha punito perche\' ho detto che rubare e\' SBAGLIATO! Mi liberi?"',
          choices:[
            { label:'Liberare il goblin', reply:'"GRAZIE eroe! Ti dico un segreto: il Re tiene la campana dietro il suo trono. E... non e\' cattivo, e\' solo spaventato dal drago. Tieni, una pozione per te!"', items:['pozione_cura'] },
            { label:'"Mi dispiace, devo sbrigarmi"', reply:'Il goblin sospira tristemente. Ti senti un pochino in colpa, ma l\'avventura chiama.' },
          ] },
        { id:'c1_trono', type:'narra', sprite:'capo_goblin', who:'Il Cantastorie',
          text:'Arrivi alla caverna del trono. Su una pila di oggetti rubati siede Re Sghignazzo, il capo dei goblin, con la Campana della Festa che luccica dietro di lui. Ti vede e si alza furioso: "CHI OSA?!"' },
        { id:'c1_boss', type:'boss', monsters:['capo_goblin','goblin'],
          text:'Re Sghignazzo brandisce la sua ascia: "Nessuno tocca il MIO bottino! GUARDIE, all\'attacco!" Questo e\' il momento decisivo. Sei pronto, piccolo eroe?',
          victoryText:'Re Sghignazzo cade a terra e si arrende: "Va bene, va bene! Prendi la campana! Noi torniamo nelle nostre grotte... se il drago ce lo permette." Hai vinto!' },
        { id:'c1_campana', type:'narra', sprite:'campana', who:'Il Cantastorie',
          text:'La Campana della Festa e\' tua! Ma le parole del re goblin ti restano in testa: un drago li ha cacciati dalla montagna? Forse il sindaco dovrebbe saperlo. Torni a Borgoverde da campione, con la campana che suona allegra ad ogni passo!' },
      ],
    },

    // ====================================================
    // CAPITOLO 2
    // ====================================================
    {
      id: 2,
      subtitle: 'Capitolo Secondo',
      title: 'Le Cripte Antiche',
      banner: 'Il sindaco ti ha rivelato un segreto: per fermare il drago serve la GEMMA DEL DRAGO, nascosta nelle Cripte Antiche sotto il vecchio cimitero. Ma le cripte sono piene di scheletri e fantasmi! Coraggio, piccolo eroe.',
      scenes: [
        { id:'c2_sindaco', type:'narra', sprite:'sindaco', who:'Sindaco Tobia',
          text:'"Eroe, la Gemma del Drago e\' l\'unica cosa che puo\' mostrarci la strada per la tana del drago. E\' custodita nelle Cripte da un cavaliere d\'ossa di nome Sir Ossarius. Ecco la chiave. Sii gentile con lui: dicono che non sia davvero cattivo, solo... triste."' },
        { id:'c2_discesa', type:'narra', sprite:'fantasma', who:'Il Cantastorie',
          text:'Scendi nelle cripte con una torcia in mano. Fa freddo, e le ombre sembrano muoversi. Da qualche parte, nel buio, senti un rumore di ossa che si muovono... clack, clack, clack.' },
        { id:'c2_scheletri', type:'combat', sprite:'scheletro', monsters:['scheletro','scheletro'], gold:12,
          text:'Due scheletri si alzano dalle loro tombe, impugnando spade arrugginite! I loro occhi vuoti ti fissano. In guardia!',
          victoryText:'Gli scheletri crollano in un mucchio di ossa. Silenzio... per ora.' },
        { id:'c2_corvo', type:'scelta', sprite:'corvo', who:'Corvo Bianco',
          text:'Un corvo bianco come la neve ti osserva da una croce di pietra: "CRA! Il cavaliere che cerchi era il piu\' nobile della valle. Custodisce la gemma da cent\'anni. CRA! Vuoi sapere come aiutarlo?"',
          choices:[
            { label:'"Si\', dimmi come!"', reply:'"CRA! Non combattere per la gloria, ma per liberarlo dal suo dolore. E porta con te questa benedizione." Il corvo lascia cadere una fiala scintillante.', items:['acqua_benedetta'] },
            { label:'"Lo affrontero\' a modo mio"', reply:'"Come vuoi, eroe testardo! CRA!" Il corvo vola via nel buio.' },
          ] },
        { id:'c2_enigma', type:'scelta', sprite:'fontana', who:'Il Cantastorie',
          text:'Una porta magica blocca il passaggio. Sopra c\'e\' scritto un indovinello: "Parlo senza bocca e sento senza orecchie. Non ho corpo ma vivo col vento. Cosa sono?" La porta aspetta. Come rispondi, eroe?',
          choices:[
            { label:'Ragionare sull\'indovinello',
              check:{ stat:'INT', dc:11, why:'Un indovinello si batte col cervello, non con la spada.' },
              success:{ text:'"L\'ECO!" La porta brilla e si apre, rivelando un piccolo tesoro nascosto!', items:['pozione_cura_maggiore'], gold:20 },
              fail:{ text:'Sbagli la risposta e la porta resta chiusa... ma trovi un passaggio segreto tutto intorno. Ci hai messo un po\' di piu\', ma ce l\'hai fatta!' } },
            { label:'Ascoltare la cripta in silenzio',
              check:{ stat:'SAG', dc:12, why:'A volte la risposta non si pensa: si sente.' },
              success:{ text:'Chiudi gli occhi. Il tuo stesso respiro rimbalza sulle pareti e torna indietro... "Sei l\'ECO!" La porta si apre e una nicchia si illumina: dentro c\'e\' una pozione!', items:['pozione_cura'], gold:15 },
              fail:{ text:'Ascolti, ma senti solo gocce d\'acqua e ossa che scricchiolano lontano. Brrr! Alla fine trovi un passaggio segreto tutto intorno.' } },
            { label:'Parlare gentilmente alla porta',
              check:{ stat:'CAR', dc:12, why:'Dicono che le porte magiche apprezzino le buone maniere.' },
              success:{ text:'"Cara porta, sei la piu\' elegante delle cripte. Ci faresti passare?" La porta arrossisce (per quanto possa arrossire una porta), sussurra "eco... nessuno mi aveva mai fatto i complimenti" e si apre, lasciando cadere qualche moneta di mancia!', gold:20 },
              fail:{ text:'"Ehm... porta bella?" La porta resta di pietra. Letteralmente. Ti tocca cercare un passaggio segreto tutto intorno.' } },
            { ifCaster:true, label:'MAGIA: sussurrare la domanda al vento arcano',
              check:{ stat:'INT', dc:9, why:'Il vento conosce la risposta: e\' lui che porta l\'eco in giro.' },
              success:{ text:'Il vento arcano ti soffia all\'orecchio: "eeeco... eeeco..." Ripeti la risposta e la porta si spalanca su una nicchia col tesoro!', items:['pozione_cura_maggiore'], gold:15 },
              fail:{ text:'Il vento arcano oggi e\' dispettoso e fa solo pernacchie. La porta resta chiusa, ma trovi un passaggio segreto tutto intorno.' } },
          ] },
        { id:'c2_cappella', type:'riposo',
          text:'Trovi una piccola cappella ancora consacrata. Dentro ti senti al sicuro, lontano dai mostri. Ti riposi un momento e recuperi le forze.' },
        { id:'c2_fantasma', type:'combat', sprite:'fantasma', monsters:['fantasma'], gold:15,
          text:'Un lamento gelido riempie la stanza. Un fantasma attraversa il muro fluttuando: "Chiii disturbaaa il mio sonnooo?" Fa un po\' paura, ma sei un eroe!',
          victoryText:'Il fantasma si dissolve con un ultimo sospiro, quasi sollevato. "Grazieee..."' },
        { id:'c2_sala', type:'narra', sprite:'cavaliere_ossa', who:'Il Cantastorie',
          text:'Arrivi nella Sala del Giuramento. Un cavaliere in armatura nera siede su un trono di pietra, una gemma rossa che pulsa sul petto. Si alza lentamente, con uno scricchiolio: "Il giuramento... deve essere... messo alla prova!"' },
        { id:'c2_boss', type:'boss', monsters:['cavaliere_ossa'],
          text:'Sir Ossarius solleva il suo spadone. Non sembra arrabbiato... sembra stanco. Ma devi dimostrare il tuo valore per ottenere la gemma. In bocca al lupo, eroe!',
          victoryText:'Sir Ossarius cade in ginocchio e, per un istante, la luce torna nei suoi occhi: "Grazie... piccolo eroe. Il mio giuramento e\' compiuto. Porta la gemma alla montagna... e ricorda: Vermilius non e\' sempre stato un mostro." L\'armatura si sbriciola in polvere d\'argento.' },
        { id:'c2_gemma', type:'dono', items:['gemma_drago'],
          text:'Nella tua mano, la GEMMA DEL DRAGO pulsa come un piccolo cuore caldo. Indica la Montagna di Fuoco. E\' il momento di affrontare il drago. Ma qualcosa ti dice che questa storia e\' piu\' complicata di quanto sembri...' },
      ],
    },

    // ====================================================
    // CAPITOLO 3
    // ====================================================
    {
      id: 3,
      subtitle: 'Capitolo Finale',
      title: 'La Montagna di Fuoco',
      banner: 'La Gemma del Drago ti guida sulla Montagna di Fuoco. In cima ti aspetta Vermilius, il drago rosso. La profezia di Borgoverde parla di te, piccolo eroe. Come finira\' la storia? Dipende dalle tue scelte...',
      scenes: [
        { id:'c3_eremita', type:'narra', sprite:'eremita', who:'Vecchia Eremita',
          text:'A meta\' montagna incontri una vecchina che vive in una capanna di pietra: "Oh, un visitatore! Senti, te lo dico perche\' sei piccolo: il drago NON ha mai toccato il mio orto. Un drago cattivo l\'avrebbe arrostito per noia. Quel drago lassu\' sta PROTEGGENDO qualcosa. Ricordatelo."' },
        { id:'c3_kobold', type:'combat', sprite:'kobold_drago', monsters:['kobold_dragonico','kobold_dragonico'], gold:14,
          text:'Due kobold con scaglie dipinte di rosso ti sbarrano il sentiero: "FERMO! Il Grande Rosso non riceve visite!" Devi farti strada.',
          victoryText:'I kobold scappano lungo il sentiero gridando "RITIRATAAA!"' },
        { id:'c3_gemma_parla', type:'scelta', sprite:'gemma', who:'La Gemma del Drago',
          text:'La Gemma nella tua tasca si illumina e... PARLA, con una voce calda e antica: "Piccolo eroe. Io ero il cuore di Vermilius il Vecchio, il drago buono. Mio figlio e\' lassu\': arrabbiato, spaventato e solo. Difende il suo stesso uovo, rubato cent\'anni fa. Cosa farai quando lo incontrerai?"',
          choices:[
            { label:'"Cerchero\' di parlargli."', reply:'"Saggio. Tieni la gemma pronta: mostragliela, e forse capira\' che non sei un nemico." La gemma pulsa di una luce calda e rassicurante.' },
            { label:'"Proteggero\' il villaggio, costi quel che costi."', reply:'"Capisco la tua determinazione. Ma ricorda: a volte il coraggio piu\' grande e\' abbassare la spada." La gemma resta accesa nella tua mano.' },
          ] },
        { id:'c3_ponte', type:'scelta', sprite:'fontana', who:'Il Cantastorie',
          text:'Un ponte di roccia traballante attraversa un fiume di lava. Mancano pezzi interi, e sotto... meglio non guardare sotto. Dall\'altra parte luccica qualcosa tra le lastre. Come attraversi, eroe?',
          choices:[
            { label:'Saltare da una pietra all\'altra',
              check:{ stat:'DES', dc:12, why:'Il ponte e\' pieno di buchi: servono piedi svelti e sicuri.' },
              success:{ text:'Salti da una pietra all\'altra con grazia felina e raggiungi l\'altra sponda. Sotto una lastra trovi pure un tesoro nascosto!', items:['pozione_cura_maggiore'], gold:25 },
              fail:{ text:'Quasi scivoli! Ti aggrappi all\'ultimo momento e ti tiri su, col cuore in gola e qualche graffio. Ma ce l\'hai fatta!', dmg:3 } },
            { label:'Spingere un masso a fare da passerella',
              check:{ stat:'FOR', dc:12, why:'Un macigno sopra il buco piu\' largo, e il ponte torna un ponte.' },
              success:{ text:'Il masso rotola nel punto giusto con un TONF che fa tremare la lava. Attraversi tranquillo e sotto una lastra trovi delle monete!', gold:20 },
              fail:{ text:'Il masso si incastra storto e ti schiacci un piede a sistemarlo. Alla fine passi, zoppicando un po\'.', dmg:3 } },
            { label:'Studiare le crepe e scegliere il percorso',
              check:{ stat:'SAG', dc:11, why:'La lava illumina le crepe: chi osserva bene vede dove il ponte regge.' },
              success:{ text:'Segui la linea delle rocce piu\' scure, quelle fredde e solide. Attraversi senza un brivido e raccogli pure le monete che qualcuno ha perso per strada!', gold:15 },
              fail:{ text:'Il percorso sembrava giusto... fino alla pietra che si sbriciola! Ti butti in avanti e rotoli sull\'altra sponda con qualche graffio.', dmg:2 } },
            { ifCaster:true, label:'MAGIA: farsi leggeri come una piuma',
              check:{ stat:'INT', dc:9, why:'Un incantesimo di leggerezza, e la lava fa molta meno paura.' },
              success:{ text:'Fluttui sul ponte come un soffione, leggero leggero. All\'arrivo, una lastra smossa rivela delle monete!', gold:15 },
              fail:{ text:'L\'incantesimo dura meta\' ponte, poi PUF: torni pesante di colpo e finisci l\'attraversata di corsa, scottandoti un piede.', dmg:2 } },
            { label:'Prendere il sentiero lungo intorno alla lava',
              reply:'Il Cantastorie sorride: "Saggio, forse. Lento, di sicuro." Il giro largo e\' sicuro ma faticoso, e quando arrivi dall\'altra parte qualcun altro ha gia\' raccolto cio\' che luccicava tra le lastre. Si prosegue!' },
          ] },
        { id:'c3_grotta', type:'riposo',
          text:'Una grotta laterale fresca, lontana dal calore della lava. E\' l\'ultima occasione per riposare prima della cima. Chiudi gli occhi un momento e raccogli tutto il tuo coraggio.' },
        { id:'c3_salamandra', type:'combat', sprite:'salamandra', monsters:['salamandra'], gold:18,
          text:'Le rocce si fondono e una salamandra di fuoco striscia fuori dalla lava, sibilando! Il suo corpo brucia: meglio colpirla e schivare in fretta!',
          victoryText:'La salamandra si raffredda e torna pietra. La via per la cima e\' libera.' },
        { id:'c3_cima', type:'narra', sprite:'drago', who:'Il Cantastorie',
          text:'Eccoti in cima. La tana del drago si apre davanti a te: montagne d\'oro luccicano alla luce della lava. E al centro, avvolto attorno a un grande UOVO dorato, c\'e\' lui: VERMILIUS, il drago rosso. Solleva la testa enorme e ti fissa con occhi di fuoco.' },
        { id:'c3_scelta_finale', type:'scelta', sprite:'drago', who:'Vermilius il Drago',
          text:'"LADRO. Sei venuto per il mio uovo, COME GLI ALTRI!" ruggisce Vermilius, e il pavimento trema. La Gemma del Drago, nella tua tasca, brilla fortissimo. Cosa fai, piccolo eroe? Questa scelta decide come finisce la storia.',
          choices:[
            { label:'Mostrare la Gemma del Drago (parla)', goto:'c3_pace_prova' },
            { label:'Impugnare l\'arma e combattere', goto:'c3_boss_drago' },
          ] },
      ],
      // Rami finali (raggiunti tramite 'goto' verso i loro id)
      branches: {
        peace: [
          { id:'c3_pace_prova', type:'prova', sprite:'gemma', who:null, stat:'CAR', dc:10, label:'Parlare col drago',
            why:'Non servono muscoli: serve un cuore convincente.',
            text:'Sollevi la Gemma del Drago verso Vermilius. La sua luce dorata illumina la caverna. Provi a parlargli con tutto il cuore, sperando che ti ascolti...',
            success:{ text:'Vermilius si blocca. Le sue pupille si stringono: "Quella... e\' di mio PADRE." La gemma fluttua verso di lui e si posa sull\'uovo, avvolgendolo di luce calda. Il drago abbassa la testa, e la sua voce diventa piccola: "Pensavo che il mondo mi avesse dimenticato. Che tutti volessero solo il mio oro e il mio uovo."', ending:'peace' },
            fail:{ text:'Le parole ti escono confuse e Vermilius e\' troppo spaventato per ascoltare. Soffia una colonna di fuoco verso il soffitto: non c\'e\' scelta, dovrai prima calmarlo combattendo... ma con dolcezza!', goto:'c3_boss_gentile' } },
        ],
        fight: [
          { id:'c3_boss_drago', type:'boss', monsters:['drago_rosso'], finale:'fight',
            text:'Sguaini la tua arma: "Proteggero\' la valle!" Vermilius ruggisce e sputa fuoco. E\' la battaglia piu\' difficile della tua vita, piccolo eroe. Mostra tutto il tuo coraggio!',
            victoryText:'Vermilius, sconfitto, spicca il volo oltre le montagne portando con se\' il suo uovo. La valle e\' salva! Ma mentre lo guardi sparire all\'orizzonte, ti chiedi se non ci fosse un altro modo...' },
        ],
        // Dopo un fallimento nel parlare: un combattimento "gentile" che porta comunque alla pace
        peace_fight: [
          { id:'c3_boss_gentile', type:'boss', monsters:['cucciolo_drago'], finale:'peace',
            text:'Vermilius e\' troppo agitato per ascoltare. Ma non vuoi fargli del male: devi solo mostrargli che non hai paura e che non sei un nemico. Resisti al suo sfogo senza odio nel cuore!',
            victoryText:'Quando il drago si ferma, ansante, gli mostri di nuovo la Gemma. Questa volta la guarda davvero. E capisce.' },
        ],
      },
      // Finali narrativi
      endings: {
        peace: 'Vermilius ti accompagna fino al limite del bosco, l\'uovo stretto tra gli artigli con sorprendente delicatezza. "Piccolo eroe... mio padre proteggeva questa valle. Io continuero\' il suo lavoro. E quando mio figlio nascera\', avra\' degli amici che gli insegneranno il coraggio." Da quel giorno, un\'ombra rossa veglia sulla Valle Verde. E i bambini di Borgoverde giurano di aver visto, certe sere, un drago sorridere. La profezia era vera fino all\'ultima riga: "E il fuoco diventera\' il loro amico."',
        fight: 'Torni a Borgoverde da eroe, con le tasche piene di tesoro e la valle finalmente al sicuro. La campana suona a festa in tuo onore! Eppure, ripensando a quell\'ala protettiva sull\'uovo, una piccola parte di te si chiede se ci fosse un altro modo... Forse, in una prossima avventura, lo scoprirai. (C\'e\' un finale segreto: prova a PARLARE col drago!)',
      },
    },
  ],
};

// ============================================================
// Helper puri di navigazione (nessuna dipendenza: usabili anche
// da state.js per la migrazione dei salvataggi e dai test)
// ============================================================

// Tutte le scene di un capitolo (principali + rami)
export function allScenes(ch){
  const out = [...ch.scenes];
  if(ch.branches) for(const k of Object.keys(ch.branches)) out.push(...ch.branches[k]);
  return out;
}

export function findScene(ch, id){
  return allScenes(ch).find(sc => sc.id === id) || null;
}

// null se la scena e' nel flusso principale, altrimenti la chiave del ramo
export function sceneBranch(ch, id){
  if(ch.scenes.some(s => s.id === id)) return null;
  if(ch.branches){
    for(const k of Object.keys(ch.branches)){
      if(ch.branches[k].some(s => s.id === id)) return k;
    }
  }
  return null;
}

function sceneListOf(ch, id){
  const b = sceneBranch(ch, id);
  return b ? ch.branches[b] : ch.scenes;
}

export function firstSceneId(ch){ return ch.scenes[0].id; }

// Id della scena successiva nella stessa sequenza, o null a fine sequenza
export function nextSceneId(ch, id){
  const list = sceneListOf(ch, id);
  const i = list.findIndex(s => s.id === id);
  return (i >= 0 && i + 1 < list.length) ? list[i + 1].id : null;
}

// Posizione (1-based) nel flusso principale, per la barra di progresso
export function sceneMainIndex(ch, id){
  return ch.scenes.findIndex(s => s.id === id);
}

// Migrazione progresso Storia dai salvataggi vecchi (node numerico)
// e validazione di quelli nuovi (node = id). Ritorna sempre uno
// story object consistente col capitolo dato.
export function migrateStory(st, chapterNum){
  st = (st && typeof st === 'object') ? st : {};
  const ch = STORY.chapters[chapterNum - 1] || STORY.chapters[0];
  const done = (st.done && typeof st.done === 'object') ? st.done : {};
  let branch = (typeof st.branch === 'string' && ch.branches && ch.branches[st.branch]) ? st.branch : null;
  let node = st.node;

  if(typeof node === 'number' && Number.isFinite(node)){
    // Save vecchio: converti indice -> id (clamp dentro la sequenza)
    const list = branch ? ch.branches[branch] : ch.scenes;
    const idx = Math.max(0, Math.min(list.length - 1, Math.round(node)));
    node = list[idx].id;
  } else if(typeof node === 'string' && findScene(ch, node)){
    branch = sceneBranch(ch, node);
  } else {
    node = firstSceneId(ch);
    branch = null;
  }
  return { node, branch, done };
}

// Controllo di coerenza dei dati (usato dai test e utile in authoring):
// id univoci e goto che puntano a scene esistenti
export function validateStory(){
  const errors = [];
  for(const ch of STORY.chapters){
    const ids = new Set();
    const scenes = allScenes(ch);
    for(const sc of scenes){
      if(!sc.id) errors.push(`cap ${ch.id}: scena senza id (type ${sc.type})`);
      else if(ids.has(sc.id)) errors.push(`cap ${ch.id}: id duplicato "${sc.id}"`);
      ids.add(sc.id);
    }
    const checkGoto = (g, where) => { if(g && !ids.has(g)) errors.push(`cap ${ch.id}: goto verso id inesistente "${g}" (${where})`); };
    for(const sc of scenes){
      (sc.choices || []).forEach(c => {
        checkGoto(c.goto, sc.id);
        if(c.success) checkGoto(c.success.goto, sc.id);
        if(c.fail) checkGoto(c.fail.goto, sc.id);
        if(c.check && (!c.success || !c.fail)) errors.push(`cap ${ch.id}: choice con check senza success/fail in "${sc.id}"`);
      });
      if(sc.success) checkGoto(sc.success.goto, sc.id);
      if(sc.fail) checkGoto(sc.fail.goto, sc.id);
      const endingKeys = Object.keys((STORY.chapters[2].endings) || {});
      const checkEnding = (e) => { if(e && !endingKeys.includes(e)) errors.push(`cap ${ch.id}: ending inesistente "${e}" in "${sc.id}"`); };
      if(sc.success) checkEnding(sc.success.ending);
      if(sc.fail) checkEnding(sc.fail.ending);
    }
  }
  return errors;
}
