import { LANG } from '../i18n.js';
export type Words = [string, string, string, string];
export const tr = (words: Words): string => words[({fr:0,it:1,en:2,es:3} as Record<string,number>)[LANG] ?? 0];
export type Place = { name: string; town: string; icon: string; clue: Words };
const p = (name:string,town:string,icon:string,...clue:Words):Place => ({name,town,icon,clue});
export const regions = [
 { id:4, key:'adriatico', title:['Les mystères de l’Adriatique','I misteri dell’Adriatico','Adriatic mysteries','Los misterios del Adriático'] as Words, token:'🐚', boss:'Nacra', places:[
 p('Castello di Acaya','Vernole','🏰','Trouve le château du village fortifié d’Acaya.','Trova il castello del borgo fortificato di Acaya.','Find the castle in the fortified village of Acaya.','Encuentra el castillo del pueblo fortificado de Acaya.'),
 p('Roca Vecchia','Melendugno','🏛️','Cherche le site archéologique au bord de la mer à Roca.','Cerca il sito archeologico sul mare a Roca.','Find the archaeological site by the sea at Roca.','Busca el yacimiento arqueológico junto al mar en Roca.'),
 p('Faro di Punta Palascìa','Otranto','🗼','Quel phare éclaire la côte près d’Otranto ?','Quale faro illumina la costa vicino a Otranto?','Which lighthouse lights the coast near Otranto?','¿Qué faro ilumina la costa cerca de Otranto?'),
 p('Cripta di San Salvatore','Giurdignano','🖼️','À Giurdignano, trouve la crypte dédiée à San Salvatore.','A Giurdignano, trova la cripta dedicata a San Salvatore.','In Giurdignano, find the crypt dedicated to San Salvatore.','En Giurdignano, encuentra la cripta dedicada a San Salvatore.'),
 p('Castello di Casamassella','Uggiano la Chiesa','🏰','Cherche le château de Casamassella, dans la commune d’Uggiano.','Cerca il castello di Casamassella, nel comune di Uggiano.','Find Casamassella Castle in the municipality of Uggiano.','Busca el castillo de Casamassella, en el municipio de Uggiano.'),
 p('Dolmen Li Scusi','Minervino di Lecce','🪨','Quelle ancienne construction de grandes pierres se nomme Li Scusi ?','Quale antica costruzione di grandi pietre si chiama Li Scusi?','Which ancient structure of large stones is called Li Scusi?','¿Qué antigua construcción de grandes piedras se llama Li Scusi?'),
 p('Villa Sticchi','Santa Cesarea Terme','🕌','Trouve la villa à la coupole qui domine la mer à Santa Cesarea.','Trova la villa con la cupola sul mare a Santa Cesarea.','Find the domed villa overlooking the sea in Santa Cesarea.','Encuentra la villa con cúpula sobre el mar en Santa Cesarea.'),
 p('Grotta Zinzulusa','Castro','🕳️','À Castro, quelle grotte porte le nom de Zinzulusa ?','A Castro, quale grotta si chiama Zinzulusa?','In Castro, which cave is called Zinzulusa?','En Castro, ¿qué cueva se llama Zinzulusa?'),
 p('Cripta Madonna della Grotta','Ortelle','🖼️','Cherche la crypte de la Madonna della Grotta à Ortelle.','Cerca la cripta della Madonna della Grotta a Ortelle.','Find the Madonna della Grotta crypt in Ortelle.','Busca la cripta de la Madonna della Grotta en Ortelle.'),
 p('Parco dei Guerrieri, Vaste','Poggiardo','🛡️','Quel parc archéologique de Vaste porte le nom des guerriers ?','Quale parco archeologico di Vaste porta il nome dei guerrieri?','Which archaeological park in Vaste is named after warriors?','¿Qué parque arqueológico de Vaste lleva el nombre de los guerreros?')
 ]},
 { id:5,key:'capo',title:['Le grand cap du Sud','Il grande capo del Sud','The southern cape','El gran cabo del Sur'] as Words,token:'💧',boss:'Scirocco',places:[
 p('Faro di Santa Maria di Leuca','Castrignano del Capo','🗼','Trouve le phare de Santa Maria di Leuca.','Trova il faro di Santa Maria di Leuca.','Find the Santa Maria di Leuca lighthouse.','Encuentra el faro de Santa Maria di Leuca.'),
 p('Ponte del Ciolo','Gagliano del Capo','🌉','Quel pont traverse la crique du Ciolo ?','Quale ponte attraversa l’insenatura del Ciolo?','Which bridge crosses the Ciolo inlet?','¿Qué puente cruza la cala del Ciolo?'),
 p('Centopietre','Patù','🪨','À Patù, trouve le monument nommé Centopietre.','A Patù, trova il monumento chiamato Centopietre.','In Patù, find the monument called Centopietre.','En Patù, encuentra el monumento llamado Centopietre.'),
 p('Torre Vado','Morciano di Leuca','🗼','Quelle tour côtière se trouve à Torre Vado ?','Quale torre costiera si trova a Torre Vado?','Which coastal tower stands in Torre Vado?','¿Qué torre costera se encuentra en Torre Vado?'),
 p('Spiaggia di Pescoluse','Salve','🏖️','Cherche la plage de Pescoluse, dans la commune de Salve.','Cerca la spiaggia di Pescoluse, nel comune di Salve.','Find Pescoluse beach in the municipality of Salve.','Busca la playa de Pescoluse, en el municipio de Salve.'),
 p('Palazzo Ducale','Alessano','🏛️','À Alessano, trouve le palais ducal.','Ad Alessano, trova il palazzo ducale.','In Alessano, find the ducal palace.','En Alessano, encuentra el palacio ducal.'),
 p('Quercia Vallonea','Tricase','🌳','Quel grand arbre remarquable se trouve à Tricase ?','Quale grande albero monumentale si trova a Tricase?','Which remarkable old tree stands in Tricase?','¿Qué gran árbol monumental se encuentra en Tricase?'),
 p('Palazzo Serafini-Sauli','Tiggiano','🏛️','Trouve le palais de la famille Serafini-Sauli à Tiggiano.','Trova il palazzo della famiglia Serafini-Sauli a Tiggiano.','Find the Serafini-Sauli family palace in Tiggiano.','Encuentra el palacio de la familia Serafini-Sauli en Tiggiano.'),
 p('Vie del Sale','Corsano','🥾','Où les anciens chemins du sel descendent-ils vers la mer ? Cherche Corsano.','Dove scendono verso il mare le antiche vie del sale? Cerca Corsano.','Where do the old salt paths lead down to the sea? Look for Corsano.','¿Dónde bajan al mar los antiguos caminos de la sal? Busca Corsano.'),
 p('Museo Archeologico','Ugento','🏺','Quel musée raconte le passé archéologique d’Ugento ?','Quale museo racconta il passato archeologico di Ugento?','Which museum tells the archaeological story of Ugento?','¿Qué museo cuenta el pasado arqueológico de Ugento?')
 ]},
 {id:6,key:'arneo',title:['L’Arneo, entre pins et vignes','L’Arneo, tra pini e vigneti','Arneo, pines and vineyards','Arneo, pinos y viñedos'] as Words,token:'🌲',boss:'Resino',places:[
 p('Baia di Porto Selvaggio','Nardò','🌊','Trouve la baie de Porto Selvaggio, dans le territoire de Nardò.','Trova la baia di Porto Selvaggio, nel territorio di Nardò.','Find Porto Selvaggio bay in the Nardò area.','Encuentra la bahía de Porto Selvaggio, en el territorio de Nardò.'),
 p('Torre Lapillo','Porto Cesareo','🗼','Quelle tour côtière donne son nom à Torre Lapillo ?','Quale torre costiera dà il nome a Torre Lapillo?','Which coastal tower gives Torre Lapillo its name?','¿Qué torre costera da nombre a Torre Lapillo?'),
 p('Castello di Copertino','Copertino','🏰','Cherche le château de Copertino.','Cerca il castello di Copertino.','Find Copertino Castle.','Busca el castillo de Copertino.'),
 p('Torre di Federico II','Leverano','🗼','À Leverano, quelle tour porte le nom de Federico II ?','A Leverano, quale torre porta il nome di Federico II?','In Leverano, which tower is named after Federico II?','En Leverano, ¿qué torre lleva el nombre de Federico II?'),
 p('Porta Nuova','Veglie','🚪','Trouve l’ancienne porte de Veglie appelée Porta Nuova.','Trova l’antica porta di Veglie chiamata Porta Nuova.','Find the old gateway in Veglie called Porta Nuova.','Encuentra la antigua puerta de Veglie llamada Porta Nuova.'),
 p('Museo del Negroamaro','Guagnano','🍇','Quel musée de Guagnano porte le nom du Negroamaro ?','Quale museo di Guagnano porta il nome del Negroamaro?','Which museum in Guagnano is named after Negroamaro?','¿Qué museo de Guagnano lleva el nombre del Negroamaro?'),
 p('Castello Monaci','Salice Salentino','🏰','Cherche Castello Monaci dans le territoire de Salice Salentino.','Cerca Castello Monaci nel territorio di Salice Salentino.','Find Castello Monaci in the Salice Salentino area.','Busca Castello Monaci en el territorio de Salice Salentino.'),
 p('Palazzo Marchesale','Campi Salentina','🏛️','À Campi Salentina, trouve le palais des marquis.','A Campi Salentina, trova il palazzo dei marchesi.','In Campi Salentina, find the marquises’ palace.','En Campi Salentina, encuentra el palacio de los marqueses.'),
 p('Chiesa di Sant’Antonio Abate','Novoli','⛪','À Novoli, quelle église est dédiée à Sant’Antonio Abate ?','A Novoli, quale chiesa è dedicata a Sant’Antonio Abate?','In Novoli, which church is dedicated to Sant’Antonio Abate?','En Novoli, ¿qué iglesia está dedicada a Sant’Antonio Abate?'),
 p('Palazzo Petrucci','Trepuzzi','🏛️','Trouve le palais Petrucci à Trepuzzi.','Trova il palazzo Petrucci a Trepuzzi.','Find Palazzo Petrucci in Trepuzzi.','Encuentra el palacio Petrucci en Trepuzzi.')
 ]}
] as const;
export const regionById = (id:number) => regions.find(r=>r.id===id);
export const regionByKey = (key:string) => regions.find(r=>r.key===key);
