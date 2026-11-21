/* Tarima · trivia questions and the voice presenter.
   The question bank is hand-made and free: facts per artist (birth or founding year, where
   they come from, a few extra questions) plus general music questions. The TV builds
   four-option questions from it. */
(function (T) {
  "use strict";

  // n: name, m: words that identify the artist in a song title, b: year born, f: year founded,
  // o: where from, s: [[song, year]], q: [[question, right answer, wrong, wrong, wrong]]
  var ART = [
    { n: "Queen", m: ["queen", "freddie mercury"], f: 1970, o: "Londres (Reino Unido)", s: [["Bohemian Rhapsody", 1975], ["We Will Rock You", 1977], ["Don't Stop Me Now", 1979]],
      q: [["¿Dónde nació Freddie Mercury, cantante de Queen?", "Zanzíbar (Tanzania)", "Londres", "Bombay (India)", "Dublín"],
          ["¿En qué disco de Queen está «Bohemian Rhapsody»?", "A Night at the Opera", "News of the World", "The Game", "Innuendo"],
          ["¿En qué concierto benéfico de 1985 triunfó Queen?", "Live Aid", "Woodstock", "Rock in Rio", "Glastonbury"]] },
    { n: "Gloria Gaynor", m: ["gloria gaynor"], b: 1943, o: "Newark (Estados Unidos)", s: [["I Will Survive", 1978]],
      q: [["¿Qué estilo musical define a «I Will Survive»?", "Música disco", "Heavy metal", "Reggae", "Country"]] },
    { n: "ABBA", m: ["abba"], f: 1972, o: "Estocolmo (Suecia)", s: [["Dancing Queen", 1976], ["Mamma Mia", 1975], ["Waterloo", 1974]],
      q: [["¿Con qué canción ganó ABBA Eurovisión en 1974?", "Waterloo", "Dancing Queen", "Mamma Mia", "Fernando"],
          ["¿Cuántos miembros tenía ABBA?", "Cuatro", "Tres", "Cinco", "Seis"]] },
    { n: "Bon Jovi", m: ["bon jovi"], f: 1983, o: "Nueva Jersey (Estados Unidos)", s: [["Livin' on a Prayer", 1986], ["It's My Life", 2000]],
      q: [["¿Cuál es el apellido real de Jon Bon Jovi?", "Bongiovi", "Jovanovic", "Bonetti", "Giovanni"],
          ["¿En qué disco está «Livin' on a Prayer»?", "Slippery When Wet", "New Jersey", "Crush", "Keep the Faith"]] },
    { n: "Neil Diamond", m: ["neil diamond"], b: 1941, o: "Nueva York (Estados Unidos)", s: [["Sweet Caroline", 1969]],
      q: [["¿En el estadio de qué equipo se canta siempre «Sweet Caroline»?", "Boston Red Sox", "New York Yankees", "Chicago Bulls", "LA Lakers"]] },
    { n: "Alejandro Sanz", m: ["alejandro sanz"], b: 1968, o: "Madrid", s: [["Corazón partío", 1997]],
      q: [["¿En qué disco de Alejandro Sanz está «Corazón partío»?", "Más", "El alma al aire", "No es lo mismo", "Paraíso express"],
          ["¿Cuál es el nombre real de Alejandro Sanz?", "Alejandro Sánchez Pizarro", "Alejandro Sanz Martín", "Alejandro Pérez Sanz", "Alejandro Sanz Rubio"]] },
    { n: "Dúo Dinámico", m: ["duo dinamico", "resistire"], f: 1958, o: "Barcelona", s: [["Resistiré", 1988]],
      q: [["¿En qué año se convirtió «Resistiré» en himno en los balcones?", "2020", "2008", "1992", "2016"],
          ["¿Quiénes forman el Dúo Dinámico?", "Manuel de la Calva y Ramón Arcusa", "Los hermanos Muñoz", "Nacho y José María Cano", "Pimpinela"]] },
    { n: "Raphael", m: ["raphael"], b: 1943, o: "Linares, Jaén", s: [],
      q: [["¿En qué concurso representó Raphael a España en 1966 y 1967?", "Eurovisión", "Festival de Viña del Mar", "Sanremo", "OTI"]] },
    { n: "Jarabe de Palo", m: ["jarabe de palo", "pau dones"], o: "Barcelona", s: [["La flaca", 1996]],
      q: [["¿Cómo se llamaba el cantante de Jarabe de Palo?", "Pau Donés", "Fito Cabrales", "Dani Martín", "Leiva"]] },
    { n: "La Oreja de Van Gogh", m: ["oreja de van gogh"], f: 1996, o: "San Sebastián", s: [["Rosas", 2003], ["Puedes contar conmigo", 2003]],
      q: [["¿Quién fue la primera cantante de La Oreja de Van Gogh?", "Amaia Montero", "Leire Martínez", "Eva Amaral", "Ana Torroja"]] },
    { n: "Mecano", m: ["mecano"], f: 1981, o: "Madrid", s: [["Me cuesta tanto olvidarte", 1986], ["Hijo de la Luna", 1986]],
      q: [["¿Quién era la cantante de Mecano?", "Ana Torroja", "Amaia Montero", "Alaska", "Marta Sánchez"],
          ["¿Qué relación tienen Nacho y José María Cano?", "Son hermanos", "Son primos", "Padre e hijo", "Ninguna"]] },
    { n: "Luis Fonsi", m: ["luis fonsi", "fonsi", "despacito"], b: 1978, o: "San Juan (Puerto Rico)", s: [["Despacito", 2017]],
      q: [["¿Con quién canta Luis Fonsi «Despacito»?", "Daddy Yankee", "Bad Bunny", "J Balvin", "Maluma"]] },
    { n: "Carlos Vives", m: ["carlos vives"], b: 1961, o: "Santa Marta (Colombia)", s: [["La bicicleta", 2016]],
      q: [["¿Qué ritmo colombiano popularizó Carlos Vives?", "Vallenato", "Tango", "Bachata", "Merengue"]] },
    { n: "Shakira", m: ["shakira"], b: 1977, o: "Barranquilla (Colombia)", s: [["Waka Waka", 2010], ["Hips Don't Lie", 2006]],
      q: [["¿Para qué Mundial fue «Waka Waka»?", "Sudáfrica 2010", "Brasil 2014", "Alemania 2006", "Rusia 2018"]] },
    { n: "Daddy Yankee", m: ["daddy yankee"], b: 1977, o: "San Juan (Puerto Rico)", s: [["Gasolina", 2004]],
      q: [["¿En qué disco de Daddy Yankee está «Gasolina»?", "Barrio Fino", "El Cartel", "Talento de Barrio", "Prestige"]] },
    { n: "Marc Anthony", m: ["marc anthony"], b: 1968, o: "Nueva York (Estados Unidos)", s: [["Vivir mi vida", 2013]],
      q: [["¿Qué estilo es «Vivir mi vida»?", "Salsa", "Reguetón", "Rock", "Flamenco"]] },
    { n: "Karol G", m: ["karol g"], b: 1991, o: "Medellín (Colombia)", s: [["Tusa", 2019]],
      q: [["¿Con quién canta Karol G «Tusa»?", "Nicki Minaj", "Shakira", "Rosalía", "Becky G"]] },
    { n: "Luis Miguel", m: ["luis miguel"], b: 1970, o: "San Juan (Puerto Rico)", s: [["Hasta que me olvides", 1993]],
      q: [["¿Cómo se apoda a Luis Miguel?", "El Sol de México", "El Rey del Pop", "El Divo de Juárez", "El Puma"]] },
    { n: "Juanes", m: ["juanes"], b: 1972, o: "Medellín (Colombia)", s: [["La camisa negra", 2004]], q: [] },
    { n: "Rosalía", m: ["rosalia"], b: 1992, o: "Barcelona", s: [["Malamente", 2018], ["Despechá", 2022]],
      q: [["¿Cómo se llama el disco de Rosalía de 2018?", "El mal querer", "Motomami", "Los Ángeles", "Lux"]] },
    { n: "Bad Bunny", m: ["bad bunny"], b: 1994, o: "Vega Baja (Puerto Rico)", s: [],
      q: [["¿Cuál es el nombre real de Bad Bunny?", "Benito Antonio Martínez Ocasio", "Ramón Ayala", "José Álvaro Osorio", "Juan Luis Londoño"]] },
    { n: "Enrique Iglesias", m: ["enrique iglesias"], b: 1975, o: "Madrid", s: [["Bailando", 2014], ["Héroe", 2001]],
      q: [["¿Quién es el padre de Enrique Iglesias?", "Julio Iglesias", "Raphael", "Camilo Sesto", "Joan Manuel Serrat"]] },
    { n: "Julio Iglesias", m: ["julio iglesias"], b: 1943, o: "Madrid", s: [],
      q: [["¿En qué puesto jugó Julio Iglesias en el Real Madrid juvenil?", "Portero", "Delantero", "Defensa", "Centrocampista"]] },
    { n: "Camilo Sesto", m: ["camilo sesto"], b: 1946, o: "Alcoy, Alicante", s: [["Vivir así es morir de amor", 1978]], q: [] },
    { n: "Rocío Jurado", m: ["rocio jurado"], b: 1944, o: "Chipiona, Cádiz", s: [["Como una ola", 1981]],
      q: [["¿Cómo se apodaba a Rocío Jurado?", "La más grande", "La reina del pop", "La faraona", "La divina"]] },
    { n: "Estopa", m: ["estopa"], f: 1999, o: "Cornellà de Llobregat", s: [["Como Camarón", 1999]],
      q: [["¿Qué son los dos miembros de Estopa?", "Hermanos", "Primos", "Pareja", "Padre e hijo"]] },
    { n: "El Canto del Loco", m: ["canto del loco"], f: 1994, o: "Madrid", s: [["Zapatillas", 2005]],
      q: [["¿Quién era el cantante de El Canto del Loco?", "Dani Martín", "Pau Donés", "Leiva", "Melendi"]] },
    { n: "Amaral", m: ["amaral"], f: 1992, o: "Zaragoza", s: [["Sin ti no soy nada", 2002]], q: [] },
    { n: "Héroes del Silencio", m: ["heroes del silencio"], f: 1984, o: "Zaragoza", s: [["Entre dos tierras", 1990]],
      q: [["¿Quién era el cantante de Héroes del Silencio?", "Enrique Bunbury", "Joaquín Sabina", "Rosendo", "Fito Cabrales"]] },
    { n: "Joaquín Sabina", m: ["sabina"], b: 1949, o: "Úbeda, Jaén", s: [["19 días y 500 noches", 1999]], q: [] },
    { n: "David Bisbal", m: ["bisbal"], b: 1979, o: "Almería", s: [["Ave María", 2002]],
      q: [["¿En qué programa se dio a conocer David Bisbal?", "Operación Triunfo", "La Voz", "Factor X", "Got Talent"]] },
    { n: "Aitana", m: ["aitana"], b: 1999, o: "Sant Climent de Llobregat", s: [],
      q: [["¿En qué programa se dio a conocer Aitana?", "Operación Triunfo", "La Voz", "Factor X", "Tu cara me suena"]] },
    { n: "Pablo Alborán", m: ["pablo alboran"], b: 1989, o: "Málaga", s: [["Solamente tú", 2011]], q: [] },
    { n: "Melendi", m: ["melendi"], b: 1979, o: "Oviedo", s: [["Caminando por la vida", 2005]], q: [] },
    { n: "Malú", m: ["malu"], b: 1982, o: "Madrid", s: [],
      q: [["¿De qué famoso guitarrista es sobrina Malú?", "Paco de Lucía", "Tomatito", "Vicente Amigo", "Sabicas"]] },
    { n: "Manuel Carrasco", m: ["manuel carrasco"], b: 1981, o: "Isla Cristina, Huelva", s: [], q: [] },
    { n: "Nino Bravo", m: ["nino bravo"], b: 1944, o: "Valencia", s: [["Libre", 1972], ["Un beso y una flor", 1972]], q: [] },
    { n: "Rocío Dúrcal", m: ["rocio durcal"], b: 1944, o: "Madrid", s: [], q: [] },
    { n: "Raffaella Carrà", m: ["raffaella carra", "rafaella carra"], b: 1943, o: "Bolonia (Italia)", s: [["Fiesta", 1977]], q: [] },
    { n: "Las Ketchup", m: ["ketchup", "asereje"], o: "Córdoba", s: [["Aserejé", 2002]],
      q: [["¿Qué relación tienen las componentes de Las Ketchup?", "Son hermanas", "Son primas", "Son madre e hijas", "Ninguna"]] },
    { n: "Los del Río", m: ["los del rio", "macarena"], f: 1962, o: "Dos Hermanas, Sevilla", s: [["Macarena", 1993]], q: [] },
    { n: "Sergio Dalma", m: ["sergio dalma"], b: 1964, o: "Sabadell", s: [["Bailar pegados", 1991]],
      q: [["¿Con qué canción fue Sergio Dalma a Eurovisión 1991?", "Bailar pegados", "Esa chica es mía", "Galilea", "Tu voz"]] },
    { n: "Gloria Estefan", m: ["gloria estefan"], b: 1957, o: "La Habana (Cuba)", s: [["Conga", 1985]],
      q: [["¿Cómo se llamaba el grupo de Gloria Estefan?", "Miami Sound Machine", "Menudo", "Los Bukis", "Timbiriche"]] },
    { n: "Ricky Martin", m: ["ricky martin"], b: 1971, o: "San Juan (Puerto Rico)", s: [["Livin' la Vida Loca", 1999], ["La copa de la vida", 1998]],
      q: [["¿En qué grupo empezó Ricky Martin?", "Menudo", "Timbiriche", "Backstreet Boys", "Magneto"]] },
    { n: "Juan Gabriel", m: ["juan gabriel"], b: 1950, o: "Michoacán (México)", s: [["Querida", 1984]],
      q: [["¿Cómo apodaban a Juan Gabriel?", "El Divo de Juárez", "El Sol de México", "El Puma", "El Rey"]] },
    { n: "Thalía", m: ["thalia"], b: 1971, o: "Ciudad de México (México)", s: [], q: [] },
    { n: "Maná", m: ["mana"], f: 1986, o: "Guadalajara (México)", s: [["Rayando el sol", 1990]], q: [] },
    { n: "Soda Stereo", m: ["soda stereo"], f: 1982, o: "Buenos Aires (Argentina)", s: [["De música ligera", 1990]],
      q: [["¿Quién era el cantante de Soda Stereo?", "Gustavo Cerati", "Charly García", "Fito Páez", "Andrés Calamaro"]] },
    { n: "Laura Pausini", m: ["laura pausini"], b: 1974, o: "Faenza (Italia)", s: [["La solitudine", 1993]],
      q: [["¿Qué festival ganó Laura Pausini en 1993?", "Sanremo", "Eurovisión", "Viña del Mar", "Benidorm"]] },
    { n: "Michael Jackson", m: ["michael jackson"], b: 1958, o: "Gary (Estados Unidos)", s: [["Thriller", 1982], ["Billie Jean", 1983]],
      q: [["¿Cómo se llama el paso de baile más famoso de Michael Jackson?", "Moonwalk", "Twist", "Robot", "Macarena"],
          ["¿Cuál es el disco más vendido de la historia?", "Thriller", "Back in Black", "Abbey Road", "Bad"]] },
    { n: "Madonna", m: ["madonna"], b: 1958, o: "Michigan (Estados Unidos)", s: [["Like a Virgin", 1984], ["Like a Prayer", 1989]],
      q: [["¿Cómo se apoda a Madonna?", "La reina del pop", "La diva del soul", "La princesa del pop", "La reina del rock"]] },
    { n: "Whitney Houston", m: ["whitney houston"], b: 1963, o: "Newark (Estados Unidos)", s: [["I Will Always Love You", 1992]],
      q: [["¿En qué película sonaba «I Will Always Love You» de Whitney Houston?", "El guardaespaldas", "Titanic", "Ghost", "Pretty Woman"]] },
    { n: "Céline Dion", m: ["celine dion"], b: 1968, o: "Quebec (Canadá)", s: [["My Heart Will Go On", 1997]],
      q: [["¿De qué película es «My Heart Will Go On»?", "Titanic", "El guardaespaldas", "Pearl Harbor", "Armageddon"]] },
    { n: "Adele", m: ["adele"], b: 1988, o: "Londres (Reino Unido)", s: [["Rolling in the Deep", 2010], ["Someone Like You", 2011], ["Hello", 2015]],
      q: [["¿Cómo llama Adele a sus discos?", "Con su edad", "Con nombres de ciudades", "Con colores", "Con su nombre"]] },
    { n: "Ed Sheeran", m: ["ed sheeran"], b: 1991, o: "Halifax (Reino Unido)", s: [["Shape of You", 2017], ["Perfect", 2017]], q: [] },
    { n: "Bruno Mars", m: ["bruno mars"], b: 1985, o: "Honolulu (Hawái)", s: [["Uptown Funk", 2014]],
      q: [["¿Con quién canta Bruno Mars «Uptown Funk»?", "Mark Ronson", "Pharrell Williams", "Daft Punk", "Calvin Harris"]] },
    { n: "Lady Gaga", m: ["lady gaga"], b: 1986, o: "Nueva York (Estados Unidos)", s: [["Poker Face", 2008], ["Shallow", 2018]],
      q: [["¿Cuál es el nombre real de Lady Gaga?", "Stefani Germanotta", "Robyn Fenty", "Katheryn Hudson", "Alecia Moore"]] },
    { n: "Beyoncé", m: ["beyonce"], b: 1981, o: "Houston (Estados Unidos)", s: [["Single Ladies", 2008]],
      q: [["¿En qué grupo empezó Beyoncé?", "Destiny's Child", "Spice Girls", "TLC", "The Pussycat Dolls"]] },
    { n: "Taylor Swift", m: ["taylor swift"], b: 1989, o: "Pensilvania (Estados Unidos)", s: [["Shake It Off", 2014]], q: [] },
    { n: "The Beatles", m: ["beatles"], f: 1960, o: "Liverpool (Reino Unido)", s: [["Hey Jude", 1968], ["Let It Be", 1970], ["Yesterday", 1965]],
      q: [["¿Cuál de estos NO era un Beatle?", "Mick Jagger", "Ringo Starr", "George Harrison", "Paul McCartney"]] },
    { n: "Elvis Presley", m: ["elvis"], b: 1935, o: "Tupelo (Estados Unidos)", s: [["Jailhouse Rock", 1957]],
      q: [["¿Cómo se llama la mansión de Elvis en Memphis?", "Graceland", "Neverland", "Xanadu", "Paisley Park"]] },
    { n: "Coldplay", m: ["coldplay"], f: 1997, o: "Londres (Reino Unido)", s: [["Viva la Vida", 2008], ["Yellow", 2000]],
      q: [["¿Quién es el cantante de Coldplay?", "Chris Martin", "Bono", "Thom Yorke", "Liam Gallagher"]] },
    { n: "Oasis", m: ["oasis"], f: 1991, o: "Mánchester (Reino Unido)", s: [["Wonderwall", 1995]],
      q: [["¿Cómo se apellidan los hermanos de Oasis?", "Gallagher", "Gibb", "Jackson", "Cano"]] },
    { n: "Bee Gees", m: ["bee gees"], f: 1958, s: [["Stayin' Alive", 1977]],
      q: [["¿En qué película sonaba «Stayin' Alive»?", "Fiebre del sábado noche", "Grease", "Footloose", "Flashdance"]] },
    { n: "Elton John", m: ["elton john"], b: 1947, o: "Pinner (Reino Unido)", s: [["Rocket Man", 1972], ["Your Song", 1970]],
      q: [["¿Cuál es el nombre real de Elton John?", "Reginald Dwight", "Gordon Sumner", "David Jones", "Farrokh Bulsara"]] },
    { n: "Toto", m: ["toto"], f: 1977, o: "Los Ángeles (Estados Unidos)", s: [["Africa", 1982]], q: [] },
    { n: "Survivor", m: ["survivor", "eye of the tiger"], f: 1978, o: "Chicago (Estados Unidos)", s: [["Eye of the Tiger", 1982]],
      q: [["¿Para qué película se compuso «Eye of the Tiger»?", "Rocky III", "Top Gun", "Karate Kid", "Rambo"]] },
    { n: "Europe", m: ["final countdown"], f: 1979, o: "Upplands Väsby (Suecia)", s: [["The Final Countdown", 1986]], q: [] },
    { n: "Bonnie Tyler", m: ["bonnie tyler"], b: 1951, o: "Gales (Reino Unido)", s: [["Total Eclipse of the Heart", 1983]], q: [] },
    { n: "Spice Girls", m: ["spice girls"], f: 1994, o: "Londres (Reino Unido)", s: [["Wannabe", 1996]],
      q: [["¿Cuántas Spice Girls había?", "Cinco", "Cuatro", "Tres", "Seis"]] },
    { n: "Backstreet Boys", m: ["backstreet boys"], f: 1993, o: "Orlando (Estados Unidos)", s: [["I Want It That Way", 1999]], q: [] },
    { n: "Dua Lipa", m: ["dua lipa"], b: 1995, o: "Londres (Reino Unido)", s: [["Don't Start Now", 2019]], q: [] },
    { n: "Village People", m: ["village people", "ymca"], f: 1977, o: "Nueva York (Estados Unidos)", s: [["Y.M.C.A.", 1978]], q: [] }
  ];

  var GEN = [
    ["¿En qué país nació el karaoke?", "Japón", "Estados Unidos", "Corea del Sur", "China"],
    ["¿Qué significa «karaoke» en japonés?", "Orquesta vacía", "Voz bonita", "Cantar juntos", "Micrófono feliz"],
    ["¿Cuántas cuerdas tiene una guitarra clásica?", "6", "4", "5", "8"],
    ["¿Cuántas teclas tiene un piano normal?", "88", "76", "100", "64"],
    ["¿Qué compositor siguió componiendo tras quedarse sordo?", "Beethoven", "Mozart", "Bach", "Vivaldi"],
    ["¿A quién se conoce como «el Rey del Pop»?", "Michael Jackson", "Elvis Presley", "Prince", "Freddie Mercury"],
    ["¿A quién se conoce como «el Rey del Rock»?", "Elvis Presley", "Chuck Berry", "Mick Jagger", "Bruce Springsteen"],
    ["¿Qué instrumento tocaba Paco de Lucía?", "La guitarra", "El piano", "El cajón", "El violín"],
    ["¿Quién canta «Aserejé»?", "Las Ketchup", "Mónica Naranjo", "Rosalía", "Bellepop"],
    ["¿Quién canta «Macarena»?", "Los del Río", "Los Chunguitos", "Café Quijano", "King África"],
    ["¿Cuántos músicos forman un cuarteto?", "4", "3", "5", "6"],
    ["¿Qué ciudad es famosa por el festival de la canción de Benidorm?", "Benidorm", "Marbella", "Sitges", "Torremolinos"],
    ["¿Cuál de estos es un festival de música en España?", "Primavera Sound", "Coachella", "Lollapalooza Chicago", "Glastonbury"],
    ["¿Qué banda británica lideraba Freddie Mercury?", "Queen", "The Rolling Stones", "The Who", "Led Zeppelin"],
    ["¿De qué país es el reguetón en su origen más famoso?", "Puerto Rico", "España", "Argentina", "Chile"],
    ["¿Qué país ha ganado Eurovisión con ABBA?", "Suecia", "Noruega", "Dinamarca", "Finlandia"],
    ["¿Cuántas notas musicales hay en la escala do-re-mi?", "7", "5", "8", "12"],
    ["¿Qué artista es conocida como «la Reina del Pop»?", "Madonna", "Britney Spears", "Kylie Minogue", "Cher"],
    ["¿Qué cantante tiene un disco llamado «Motomami»?", "Rosalía", "Shakira", "Karol G", "Bad Bunny"],
    ["¿Con qué grupo se hizo famoso Pau Donés?", "Jarabe de Palo", "Estopa", "Amaral", "Mecano"]
  ];

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function years(y) {
    var set = {}; set[y] = 1; var out = [String(y)];
    while (out.length < 4) { var d = (Math.floor(Math.random() * 10) + 2) * (Math.random() < 0.5 ? -1 : 1), v = y + d; if (!set[v] && v <= 2026) { set[v] = 1; out.push(String(v)); } }
    return out;
  }
  function places(o) {
    var land = function (x) { var m = /\(([^)]+)\)/.exec(x); return m ? m[1] : "España"; };
    var pool = shuffle(ART.map(function (a) { return a.o; }).filter(function (x, i, arr) { return x && land(x) !== land(o) && arr.indexOf(x) === i; }));
    return [o].concat(pool.slice(0, 3));
  }
  // Every question an artist can give: [key, question, right, wrong, wrong, wrong]
  function questionsFor(a) {
    var out = [];
    if (a.b) out.push(["b"].concat(["¿En qué año nació " + a.n + "?"], years(a.b)));
    if (a.f) out.push(["f"].concat(["¿En qué año se formó " + a.n + "?"], years(a.f)));
    if (a.o) out.push(["o"].concat([(a.b ? "¿De dónde es " : "¿De dónde son ") + a.n + "?"], places(a.o)));
    (a.s || []).forEach(function (s, i) { out.push(["s" + i].concat(["¿En qué año salió «" + s[0] + "» de " + a.n + "?"], years(s[1]))); });
    (a.q || []).forEach(function (q, i) { out.push(["q" + i].concat(q)); });
    return out.map(function (q) { q[0] = T.norm(a.n) + ":" + q[0]; return q; });
  }
  // Finds the artist of a song from its title and artist text.
  function artistOf(text) {
    var t = " " + T.norm(text || "").replace(/[^a-z0-9ñ]+/g, " ") + " ";
    for (var i = 0; i < ART.length; i++) {
      if (ART[i].m.some(function (m) { return t.indexOf(" " + m + " ") >= 0; })) return ART[i];
    }
    return null;
  }
  // Builds one question for the song that is about to play. asked: keys already used.
  T.quizFor = function (song, asked) {
    asked = asked || [];
    var a = artistOf((song.a || "") + " " + (song.t || "")), pool = [];
    if (a) pool = questionsFor(a).filter(function (q) { return asked.indexOf(q[0]) < 0; });
    var about = a ? a.n : "";
    if (!pool.length) { about = ""; pool = GEN.map(function (q, i) { return ["g" + i].concat(q); }).filter(function (q) { return asked.indexOf(q[0]) < 0; }); }
    if (!pool.length) pool = GEN.map(function (q, i) { return ["g" + i].concat(q); });
    var q = pool[Math.floor(Math.random() * pool.length)];
    var opts = shuffle([0, 1, 2, 3]);
    return { key: q[0], q: q[1], o: opts.map(function (i) { return q[2 + i]; }), c: opts.indexOf(0), about: about };
  };
  T.quizArtists = ART.length;

  /* ---------- presenter lines ---------- */
  // {n} name, {s} song, {p} party, {a} artist, {x} answer, {k} points
  var LINES = {
    es: {
      welcome: ["¡Bienvenidos a {p}! Escanead el código de la pantalla y pedid vuestra canción.", "¡Buenas noches, {p}! Que empiece el espectáculo."],
      intro: ["¡Atención, sube a la tarima {n}! Nos va a cantar {s}.", "¡Un aplauso para {n}, que viene con {s}!", "¡Micrófono para {n}! Suena {s}."],
      auto: ["¡El dado ha hablado! Le toca a {n}.", "¡Sorpresa! El auto karaoke ha elegido a {n}."],
      quiz: ["¡Pregunta para todos!", "¡Atentos a los móviles, que hay pregunta!", "¡Vamos con una pregunta!"],
      reveal: ["La respuesta correcta era: {x}.", "¡Era {x}!"],
      nobody: ["¡Nadie ha acertado! A ver la próxima.", "Uy, ni uno. ¡Qué difícil!"],
      right: ["¡Bien, {n}! Respuesta correcta y la más rápida.", "¡Nadie ha sido más rápido que {n}!"],
      lead: ["Va ganando {n} con {k} puntos.", "{n} lidera el ranking con {k} puntos."],
      winner: ["¡Y el ganador de la noche es… {n}! ¡Enhorabuena!"],
      good: ["¡Ovación para {n}! Qué manera de cantar.", "¡{n} lo ha clavado!"],
      ok: ["¡Muy bien, {n}! Un aplauso.", "¡Bravo, {n}!"],
      brave: ["¡{n} le ha echado valor! Eso es lo que cuenta.", "¡Bien, {n}! El próximo lo bordas."],
      shy: ["{n}, todavía no te hemos oído cantar. ¿A qué esperas?", "¡Venga, {n}, que te toca animarte!"]
    },
    lat: {
      welcome: ["¡Bienvenidos a {p}! Escaneen el código de la pantalla y pidan su canción.", "¡Buenas noches, {p}! Que empiece el show."],
      intro: ["¡Atención, sube al escenario {n}! Nos va a cantar {s}.", "¡Un aplauso para {n}, que viene con {s}!", "¡Micrófono para {n}! Suena {s}."],
      auto: ["¡El dado habló! Le toca a {n}.", "¡Sorpresa! El auto karaoke eligió a {n}."],
      quiz: ["¡Pregunta para todos!", "¡Atentos a sus celulares, que hay pregunta!", "¡Vamos con una pregunta!"],
      reveal: ["La respuesta correcta era: {x}.", "¡Era {x}!"],
      nobody: ["¡Nadie acertó! A ver la próxima.", "Uy, ninguno. ¡Qué difícil!"],
      right: ["¡Bien, {n}! Respuesta correcta y la más rápida.", "¡Nadie fue más rápido que {n}!"],
      lead: ["Va ganando {n} con {k} puntos.", "{n} lidera el ranking con {k} puntos."],
      winner: ["¡Y el ganador de la noche es… {n}! ¡Felicidades!"],
      good: ["¡Ovación para {n}! Qué manera de cantar.", "¡{n} la rompió!"],
      ok: ["¡Muy bien, {n}! Un aplauso.", "¡Bravo, {n}!"],
      brave: ["¡{n} se animó! Eso es lo que cuenta.", "¡Bien, {n}! La próxima te sale perfecta."],
      shy: ["{n}, todavía no te escuchamos cantar. ¿Qué esperas?", "¡Dale, {n}, anímate!"]
    },
    en: {
      welcome: ["Welcome to {p}! Scan the code on the screen and request your song."],
      intro: ["Please welcome {n} to the stage, singing {s}!", "A big hand for {n}, with {s}!"],
      auto: ["The dice has spoken! It's {n}'s turn."],
      quiz: ["Question time for everyone!", "Phones ready, here comes a question!"],
      reveal: ["The right answer was: {x}."],
      nobody: ["Nobody got it! Maybe next time."],
      right: ["Well done {n}, the fastest right answer!"],
      lead: ["{n} is in the lead with {k} points."],
      winner: ["And tonight's winner is… {n}! Congratulations!"],
      good: ["A standing ovation for {n}!", "{n} absolutely nailed it!"],
      ok: ["Great job, {n}! Give it up!"],
      brave: ["Well done {n}, that took courage!"],
      shy: ["{n}, we haven't heard you sing yet. What are you waiting for?"]
    },
    pt: {
      welcome: ["Bem-vindos a {p}! Escaneiem o código na tela e peçam sua música."],
      intro: ["Atenção, sobe ao palco {n}, cantando {s}!", "Palmas para {n}, com {s}!"],
      auto: ["O dado decidiu! É a vez de {n}."],
      quiz: ["Pergunta para todos!", "Celulares a postos, lá vem pergunta!"],
      reveal: ["A resposta certa era: {x}."],
      nobody: ["Ninguém acertou! Fica para a próxima."],
      right: ["Muito bem, {n}, a resposta certa mais rápida!"],
      lead: ["{n} está na frente com {k} pontos."],
      winner: ["E o vencedor da noite é… {n}! Parabéns!"],
      good: ["Aplausos de pé para {n}!"], ok: ["Muito bem, {n}!"], brave: ["Valeu a coragem, {n}!"],
      shy: ["{n}, ainda não ouvimos você cantar. Vamos lá!"]
    },
    fr: {
      welcome: ["Bienvenue à {p} ! Scannez le code à l'écran et choisissez votre chanson."],
      intro: ["Accueillons {n} sur scène, qui va chanter {s} !", "On applaudit {n}, avec {s} !"],
      auto: ["Le dé a parlé ! C'est au tour de {n}."],
      quiz: ["Une question pour tout le monde !", "Téléphones prêts, voici une question !"],
      reveal: ["La bonne réponse était : {x}."],
      nobody: ["Personne n'a trouvé ! La prochaine fois."],
      right: ["Bravo {n}, la bonne réponse la plus rapide !"],
      lead: ["{n} mène avec {k} points."],
      winner: ["Et le grand gagnant de la soirée est… {n} ! Félicitations !"],
      good: ["Une ovation pour {n} !"], ok: ["Très bien, {n} !"], brave: ["Bravo pour le courage, {n} !"],
      shy: ["{n}, on ne t'a pas encore entendu chanter. Allez !"]
    },
    it: {
      welcome: ["Benvenuti a {p}! Scansionate il codice sullo schermo e scegliete la vostra canzone."],
      intro: ["Sale sul palco {n}, che canterà {s}!", "Un applauso per {n}, con {s}!"],
      auto: ["Il dado ha deciso! Tocca a {n}."],
      quiz: ["Domanda per tutti!", "Telefoni pronti, arriva una domanda!"],
      reveal: ["La risposta giusta era: {x}."],
      nobody: ["Nessuno ha indovinato! Alla prossima."],
      right: ["Complimenti {n}, la risposta giusta più veloce!"],
      lead: ["{n} è in testa con {k} punti."],
      winner: ["E il vincitore della serata è… {n}! Complimenti!"],
      good: ["Standing ovation per {n}!"], ok: ["Molto bene, {n}!"], brave: ["Che coraggio, {n}!"],
      shy: ["{n}, non ti abbiamo ancora sentito cantare. Dai!"]
    },
    de: {
      welcome: ["Willkommen bei {p}! Scannt den Code auf dem Bildschirm und wünscht euch einen Song."],
      intro: ["Auf die Bühne kommt {n} mit {s}!", "Applaus für {n}, mit {s}!"],
      auto: ["Der Würfel hat entschieden! {n} ist dran."],
      quiz: ["Eine Frage für alle!", "Handys bereit, hier kommt eine Frage!"],
      reveal: ["Die richtige Antwort war: {x}."],
      nobody: ["Niemand lag richtig! Nächstes Mal."],
      right: ["Super, {n}, die schnellste richtige Antwort!"],
      lead: ["{n} führt mit {k} Punkten."],
      winner: ["Und der Gewinner des Abends ist… {n}! Herzlichen Glückwunsch!"],
      good: ["Standing Ovations für {n}!"], ok: ["Sehr gut, {n}!"], brave: ["Mutig, {n}!"],
      shy: ["{n}, wir haben dich noch nicht singen hören. Los geht's!"]
    }
  };
  T.VOICE_LANGS = [
    ["es-ES", "Español de España", "es"], ["es-MX", "Español latino", "lat"], ["en-US", "Inglés (EE. UU.)", "en"], ["en-GB", "Inglés (Reino Unido)", "en"],
    ["pt-BR", "Portugués (Brasil)", "pt"], ["fr-FR", "Francés", "fr"], ["it-IT", "Italiano", "it"], ["de-DE", "Alemán", "de"]
  ];
  function langSet(lang) { var r = T.VOICE_LANGS.filter(function (l) { return l[0] === lang; })[0]; return LINES[r ? r[2] : "es"]; }
  T.line = function (lang, key, vars) {
    var arr = langSet(lang)[key] || LINES.es[key] || [""];
    var s = arr[Math.floor(Math.random() * arr.length)];
    return s.replace(/\{(\w)\}/g, function (_, k) { return vars && vars[k] !== undefined ? String(vars[k]) : ""; });
  };
  T.speaksSpanish = function (lang) { return !lang || lang.indexOf("es") === 0; };

  /* ---------- picking a voice ---------- */
  var FEM = /(m[oó]nica|paulina|marisol|helena|laura|sabina|elvira|luc[ií]a|dalia|paloma|penelope|lupe|\bmia\b|samantha|karen|victoria|susan|zira|hazel|serena|kate|moira|tessa|fiona|am[eé]lie|audrey|marie|julie|alice|federica|elsa|anna|petra|helga|hedda|luciana|joana|francisca|ximena|ang[eé]lica|esperanza|soledad|catalina|female|mujer|woman|aria|jenny|libby|sonia|denise|elena|isabella|clara|camila|valentina|google espa[nñ]ol$|google us english|google español de estados unidos)/i;
  var MALE = /(jorge|juan|diego|pablo|ra[uú]l|enrique|carlos|miguel|[aá]lvaro|daniel|alex|fred|david|mark|george|thomas|rishi|aaron|arthur|luca|cosimo|reed|eddy|rocko|ralph|stefan|markus|yannick|thierry|male|hombre|\bman\b|guy|ryan|eric|alvaro|dario|jorge|antonio|gonzalo|tom[aá]s|lorenzo|google uk english male)/i;
  T.pickVoice = function (voices, lang, gender) {
    var base = lang.split("-")[0];
    var exact = voices.filter(function (v) { return (v.lang || "").replace("_", "-").toLowerCase() === lang.toLowerCase(); });
    var same = exact.length ? exact : voices.filter(function (v) { return (v.lang || "").toLowerCase().indexOf(base) === 0; });
    if (lang === "es-MX" && !exact.length) {
      var lat = same.filter(function (v) { return !/es[-_]es/i.test(v.lang); });
      if (lat.length) same = lat;
    }
    if (!same.length) return { voice: null, pitch: gender === "m" ? 0.85 : 1.1 };
    var re = gender === "m" ? MALE : FEM, other = gender === "m" ? FEM : MALE;
    var hit = same.filter(function (v) { return re.test(v.name); });
    if (hit.length) return { voice: hit.sort(function (a, b) { return (b.localService ? 0 : 1) - (a.localService ? 0 : 1); })[0], pitch: 1 };
    var neutral = same.filter(function (v) { return !other.test(v.name); });
    var v = (neutral.length ? neutral : same)[0];
    return { voice: v, pitch: gender === "m" ? 0.8 : 1.15 };
  };
  var cachedVoices = [];
  function loadVoices() { try { cachedVoices = window.speechSynthesis ? speechSynthesis.getVoices() : []; } catch (e) { cachedVoices = []; } return cachedVoices; }
  if (window.speechSynthesis) { loadVoices(); try { speechSynthesis.addEventListener("voiceschanged", loadVoices); } catch (e) { speechSynthesis.onvoiceschanged = loadVoices; } }
  T.voices = function () { return cachedVoices.length ? cachedVoices : loadVoices(); };
  // Speaks a line. opts: {lang, gender, rate, onstart, onend}
  T.speak = function (text, opts) {
    opts = opts || {};
    if (!window.speechSynthesis || !text) { if (opts.onend) opts.onend(); return false; }
    var u = new SpeechSynthesisUtterance(text);
    var lang = opts.lang || "es-ES", pk = T.pickVoice(T.voices(), lang, opts.gender || "f");
    u.lang = pk.voice ? pk.voice.lang : lang; if (pk.voice) u.voice = pk.voice;
    u.pitch = pk.pitch; u.rate = opts.rate || 1.05; u.volume = 1;
    var done = false, end = function () { if (done) return; done = true; clearTimeout(guard); if (opts.onend) opts.onend(); };
    var guard = setTimeout(end, 2500 + text.length * 110);   // some TVs never fire onend
    u.onstart = function () { if (opts.onstart) opts.onstart(); };
    u.onend = end; u.onerror = end;
    try { speechSynthesis.speak(u); } catch (e) { end(); return false; }
    return true;
  };
})(window.T);
