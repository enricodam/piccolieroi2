// ============================================================
// PICCOLI EROI 2 - Modalita' STORIA (per neofiti)
// Avventura guidata a tappe, narrata, con scelte chiare.
// Riusa mostri/oggetti ma con tanta narrazione e poche meccaniche.
//
// Tipi di scena:
//  narra  : {type:'narra', sprite?, who?, text}
//  scelta : {type:'scelta', text, sprite?, choices:[{label, reply?, gold?, items?}]}
//  prova  : {type:'prova', text, sprite?, who, stat, dc, label, success:{...}, fail:{...}}
//  combat : {type:'combat', text, sprite?, monsters, gold?, victoryText?}
//  boss   : {type:'boss', text, monsters, victoryText, finale?}
//  riposo : {type:'riposo', text}
//  dono   : {type:'dono', text, items?, gold?}
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
        { type:'narra', sprite:'sindaco', who:'Sindaco Tobia',
          text:'"Piccolo eroe, meno male che sei qui! I goblin sono scappati nel bosco con la nostra campana. Erano spaventati da qualcosa... continuavano a urlare di un GRANDE ROSSO sulla montagna. Strano, vero? Riporta la campana e sarai il nostro campione!"' },
        { type:'narra', sprite:'ranger', who:'Narratore',
          text:'Cammini lungo il sentiero del bosco. Le foglie scricchiolano, gli uccellini cinguettano, e in lontananza... senti delle risatine dispettose. I goblin sono vicini!' },
        { type:'scelta', sprite:'scoiattolo', who:'Scoiattolo Parlante',
          text:'Uno scoiattolo salta su un ramo davanti a te: "Psst! Eroe! I goblin verdi sono passati di qua con una campana enorme. Vuoi un consiglio o hai fretta?"',
          choices:[
            { label:'"Dimmi tutto, scoiattolo!"', reply:'"Il loro capo attacca due volte di fila, occhio! E se ti fai male, bevi una pozione. Tieni, ho trovato questa per terra." Lo scoiattolo ti lancia una pozione!', items:['pozione_cura'] },
            { label:'"Ho fretta, ma grazie!"', reply:'"Come vuoi! Ma non dire che non ti avevo avvisato!" Lo scoiattolo sparisce tra le foglie, scuotendo la testa.' },
          ] },
        { type:'combat', sprite:'goblin', monsters:['goblin','goblin'], gold:10,
          text:'Due goblin saltano fuori da dietro un cespuglio, agitando bastoni: "Intrusi! Questo e\' il NOSTRO bosco!" E\' ora di combattere!',
          victoryText:'I due goblin scappano via piagnucolando. Bravo!' },
        { type:'prova', sprite:'chest', who:null, stat:'DES', dc:11, label:'Aprire il forziere',
          text:'In una radura trovi un vecchio forziere di legno, mezzo sepolto tra le foglie. Sembra chiuso. Provi ad aprirlo con delicatezza?',
          success:{ text:'CLICK! Il forziere si apre e dentro trovi monete e una pozione! Che fortuna!', items:['pozione_cura'], gold:20 },
          fail:{ text:'Ahia! Era una trappola: una piccola molla ti fa un graffio. Ma niente di grave, e dentro trovi comunque qualche moneta.', gold:8, dmg:2 } },
        { type:'riposo',
          text:'Trovi un ruscello cristallino in una radura soleggiata. Ti siedi un momento, bevi acqua fresca e riprendi fiato. Ti senti meglio: le ferite si rimarginano!' },
        { type:'scelta', sprite:'goblin', who:'Goblin Piccolino',
          text:'Un goblin minuscolo e\' chiuso in una gabbia di legno: "Aiutooo! Il Re mi ha punito perche\' ho detto che rubare e\' SBAGLIATO! Mi liberi?"',
          choices:[
            { label:'Liberare il goblin', reply:'"GRAZIE eroe! Ti dico un segreto: il Re tiene la campana dietro il suo trono. E... non e\' cattivo, e\' solo spaventato dal drago. Tieni, una pozione per te!"', items:['pozione_cura'] },
            { label:'"Mi dispiace, devo sbrigarmi"', reply:'Il goblin sospira tristemente. Ti senti un pochino in colpa, ma l\'avventura chiama.' },
          ] },
        { type:'narra', sprite:'capo_goblin', who:'Narratore',
          text:'Arrivi alla caverna del trono. Su una pila di oggetti rubati siede Re Sghignazzo, il capo dei goblin, con la Campana della Festa che luccica dietro di lui. Ti vede e si alza furioso: "CHI OSA?!"' },
        { type:'boss', monsters:['capo_goblin','goblin'],
          text:'Re Sghignazzo brandisce la sua ascia: "Nessuno tocca il MIO bottino! GUARDIE, all\'attacco!" Questo e\' il momento decisivo. Sei pronto, piccolo eroe?',
          victoryText:'Re Sghignazzo cade a terra e si arrende: "Va bene, va bene! Prendi la campana! Noi torniamo nelle nostre grotte... se il drago ce lo permette." Hai vinto!' },
        { type:'narra', sprite:'campana', who:'Narratore',
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
        { type:'narra', sprite:'sindaco', who:'Sindaco Tobia',
          text:'"Eroe, la Gemma del Drago e\' l\'unica cosa che puo\' mostrarci la strada per la tana del drago. E\' custodita nelle Cripte da un cavaliere d\'ossa di nome Sir Ossarius. Ecco la chiave. Sii gentile con lui: dicono che non sia davvero cattivo, solo... triste."' },
        { type:'narra', sprite:'fantasma', who:'Narratore',
          text:'Scendi nelle cripte con una torcia in mano. Fa freddo, e le ombre sembrano muoversi. Da qualche parte, nel buio, senti un rumore di ossa che si muovono... clack, clack, clack.' },
        { type:'combat', sprite:'scheletro', monsters:['scheletro','scheletro'], gold:12,
          text:'Due scheletri si alzano dalle loro tombe, impugnando spade arrugginite! I loro occhi vuoti ti fissano. In guardia!',
          victoryText:'Gli scheletri crollano in un mucchio di ossa. Silenzio... per ora.' },
        { type:'scelta', sprite:'corvo', who:'Corvo Bianco',
          text:'Un corvo bianco come la neve ti osserva da una croce di pietra: "CRA! Il cavaliere che cerchi era il piu\' nobile della valle. Custodisce la gemma da cent\'anni. CRA! Vuoi sapere come aiutarlo?"',
          choices:[
            { label:'"Si\', dimmi come!"', reply:'"CRA! Non combattere per la gloria, ma per liberarlo dal suo dolore. E porta con te questa benedizione." Il corvo lascia cadere una fiala scintillante.', items:['acqua_benedetta'] },
            { label:'"Lo affrontero\' a modo mio"', reply:'"Come vuoi, eroe testardo! CRA!" Il corvo vola via nel buio.' },
          ] },
        { type:'prova', sprite:'fontana', who:null, stat:'INT', dc:11, label:'Risolvere l\'enigma',
          text:'Una porta magica blocca il passaggio. Sopra c\'e\' scritto un indovinello: "Parlo senza bocca e sento senza orecchie. Non ho corpo ma vivo col vento. Cosa sono?" Provi a indovinare?',
          success:{ text:'"L\'ECO!" La porta brilla e si apre, rivelando un piccolo tesoro nascosto!', items:['pozione_cura_maggiore'], gold:20 },
          fail:{ text:'Sbagli la risposta e la porta resta chiusa... ma trovi un passaggio segreto tutto intorno. Ci hai messo un po\' di piu\', ma ce l\'hai fatta!' } },
        { type:'riposo',
          text:'Trovi una piccola cappella ancora consacrata. Dentro ti senti al sicuro, lontano dai mostri. Ti riposi un momento e recuperi le forze.' },
        { type:'combat', sprite:'fantasma', monsters:['fantasma'], gold:15,
          text:'Un lamento gelido riempie la stanza. Un fantasma attraversa il muro fluttuando: "Chiii disturbaaa il mio sonnooo?" Fa un po\' paura, ma sei un eroe!',
          victoryText:'Il fantasma si dissolve con un ultimo sospiro, quasi sollevato. "Grazieee..."' },
        { type:'narra', sprite:'cavaliere_ossa', who:'Narratore',
          text:'Arrivi nella Sala del Giuramento. Un cavaliere in armatura nera siede su un trono di pietra, una gemma rossa che pulsa sul petto. Si alza lentamente, con uno scricchiolio: "Il giuramento... deve essere... messo alla prova!"' },
        { type:'boss', monsters:['cavaliere_ossa'],
          text:'Sir Ossarius solleva il suo spadone. Non sembra arrabbiato... sembra stanco. Ma devi dimostrare il tuo valore per ottenere la gemma. In bocca al lupo, eroe!',
          victoryText:'Sir Ossarius cade in ginocchio e, per un istante, la luce torna nei suoi occhi: "Grazie... piccolo eroe. Il mio giuramento e\' compiuto. Porta la gemma alla montagna... e ricorda: Vermilius non e\' sempre stato un mostro." L\'armatura si sbriciola in polvere d\'argento.' },
        { type:'dono', items:['gemma_drago'],
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
        { type:'narra', sprite:'eremita', who:'Vecchia Eremita',
          text:'A meta\' montagna incontri una vecchina che vive in una capanna di pietra: "Oh, un visitatore! Senti, te lo dico perche\' sei piccolo: il drago NON ha mai toccato il mio orto. Un drago cattivo l\'avrebbe arrostito per noia. Quel drago lassu\' sta PROTEGGENDO qualcosa. Ricordatelo."' },
        { type:'combat', sprite:'kobold_drago', monsters:['kobold_dragonico','kobold_dragonico'], gold:14,
          text:'Due kobold con scaglie dipinte di rosso ti sbarrano il sentiero: "FERMO! Il Grande Rosso non riceve visite!" Devi farti strada.',
          victoryText:'I kobold scappano lungo il sentiero gridando "RITIRATAAA!"' },
        { type:'scelta', sprite:'gemma', who:'La Gemma del Drago',
          text:'La Gemma nella tua tasca si illumina e... PARLA, con una voce calda e antica: "Piccolo eroe. Io ero il cuore di Vermilius il Vecchio, il drago buono. Mio figlio e\' lassu\': arrabbiato, spaventato e solo. Difende il suo stesso uovo, rubato cent\'anni fa. Cosa farai quando lo incontrerai?"',
          choices:[
            { label:'"Cerchero\' di parlargli."', reply:'"Saggio. Tieni la gemma pronta: mostragliela, e forse capira\' che non sei un nemico." La gemma pulsa di una luce calda e rassicurante.' },
            { label:'"Proteggero\' il villaggio, costi quel che costi."', reply:'"Capisco la tua determinazione. Ma ricorda: a volte il coraggio piu\' grande e\' abbassare la spada." La gemma resta accesa nella tua mano.' },
          ] },
        { type:'prova', sprite:'fontana', who:null, stat:'DES', dc:12, label:'Attraversare il ponte',
          text:'Un ponte di roccia traballante attraversa un fiume di lava. Devi attraversarlo con attenzione e agilita\'. Pronto a saltare i punti rotti?',
          success:{ text:'Salti da una pietra all\'altra con grazia felina e raggiungi l\'altra sponda. Sotto una lastra trovi pure un tesoro nascosto!', items:['pozione_cura_maggiore'], gold:25 },
          fail:{ text:'Quasi scivoli! Ti aggrappi all\'ultimo momento e ti tiri su, col cuore in gola e qualche graffio. Ma ce l\'hai fatta!', dmg:3 } },
        { type:'riposo',
          text:'Una grotta laterale fresca, lontana dal calore della lava. E\' l\'ultima occasione per riposare prima della cima. Chiudi gli occhi un momento e raccogli tutto il tuo coraggio.' },
        { type:'combat', sprite:'salamandra', monsters:['salamandra'], gold:18,
          text:'Le rocce si fondono e una salamandra di fuoco striscia fuori dalla lava, sibilando! Il suo corpo brucia: meglio colpirla e schivare in fretta!',
          victoryText:'La salamandra si raffredda e torna pietra. La via per la cima e\' libera.' },
        { type:'narra', sprite:'drago', who:'Narratore',
          text:'Eccoti in cima. La tana del drago si apre davanti a te: montagne d\'oro luccicano alla luce della lava. E al centro, avvolto attorno a un grande UOVO dorato, c\'e\' lui: VERMILIUS, il drago rosso. Solleva la testa enorme e ti fissa con occhi di fuoco.' },
        { type:'scelta', sprite:'drago', who:'Vermilius il Drago',
          text:'"LADRO. Sei venuto per il mio uovo, COME GLI ALTRI!" ruggisce Vermilius, e il pavimento trema. La Gemma del Drago, nella tua tasca, brilla fortissimo. Cosa fai, piccolo eroe? Questa scelta decide come finisce la storia.',
          choices:[
            { label:'Mostrare la Gemma del Drago (parla)', goto:'peace' },
            { label:'Impugnare l\'arma e combattere', goto:'fight' },
          ] },
      ],
      // Rami finali speciali (gestiti dal motore tramite 'goto')
      branches: {
        peace: [
          { type:'prova', sprite:'gemma', who:null, stat:'CAR', dc:10, label:'Parlare col drago',
            text:'Sollevi la Gemma del Drago verso Vermilius. La sua luce dorata illumina la caverna. Provi a parlargli con tutto il cuore, sperando che ti ascolti...',
            success:{ text:'Vermilius si blocca. Le sue pupille si stringono: "Quella... e\' di mio PADRE." La gemma fluttua verso di lui e si posa sull\'uovo, avvolgendolo di luce calda. Il drago abbassa la testa, e la sua voce diventa piccola: "Pensavo che il mondo mi avesse dimenticato. Che tutti volessero solo il mio oro e il mio uovo."', special:'peace' },
            fail:{ text:'Le parole ti escono confuse e Vermilius e\' troppo spaventato per ascoltare. Soffia una colonna di fuoco verso il soffitto: non c\'e\' scelta, dovrai prima calmarlo combattendo... ma con dolcezza!', special:'peace_retry' } },
        ],
        fight: [
          { type:'boss', monsters:['drago_rosso'], finale:'fight',
            text:'Sguaini la tua arma: "Proteggero\' la valle!" Vermilius ruggisce e sputa fuoco. E\' la battaglia piu\' difficile della tua vita, piccolo eroe. Mostra tutto il tuo coraggio!',
            victoryText:'Vermilius, sconfitto, spicca il volo oltre le montagne portando con se\' il suo uovo. La valle e\' salva! Ma mentre lo guardi sparire all\'orizzonte, ti chiedi se non ci fosse un altro modo...' },
        ],
        // Dopo un fallimento nel parlare: un combattimento "gentile" che porta comunque alla pace
        peace_fight: [
          { type:'boss', monsters:['cucciolo_drago'], finale:'peace',
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
