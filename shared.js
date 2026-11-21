/* Tarima beta: shared code for the guest app (index.html) and the TV screen (tv.html).
   Real-time sync goes through public MQTT brokers over secure WebSockets.
   Each party lives under its own topic: tarima/v1/<CODE>/... ; the TV is the source of truth. */
var T = (function () {
  "use strict";

  var BROKERS = [
    "wss://broker.emqx.io:8084/mqtt",
    "wss://broker.hivemq.com:8884/mqtt"
  ];

  // Starter catalog. Each song has several karaoke videos: if one cannot be embedded, the TV tries the next.
  var CATALOG = [
    { id: "s01", t: "Bohemian Rhapsody", a: "Queen", g: "Clásicos", ids: ["9Lxm0iSnKNc", "jfo_N0vtR44", "8lBAF3cPtNE"] },
    { id: "s02", t: "I Will Survive", a: "Gloria Gaynor", g: "Clásicos", ids: ["FsUa8P-L2Ag", "tClP0J3fpWA", "8eqKukh4zto"] },
    { id: "s03", t: "Dancing Queen", a: "ABBA", g: "Clásicos", ids: ["WHayJZ3eMcE", "ir14kJwqaus", "Tiaby1lXiVU"] },
    { id: "s04", t: "Livin' on a Prayer", a: "Bon Jovi", g: "Clásicos", ids: ["b1Zay0OWjX0", "SGW5UlsgKI0", "9xupUJCpVm0"] },
    { id: "s05", t: "Sweet Caroline", a: "Neil Diamond", g: "Clásicos", ids: ["CgVhqLL1duA", "srLoAl1mhFw", "BosJ0oQr99Q"] },
    { id: "s06", t: "Corazón partío", a: "Alejandro Sanz", g: "Española", ids: ["-mxyGh0zsfQ", "q2FRTAMvdjQ", "LYiI-QCFIoQ"] },
    { id: "s07", t: "Resistiré", a: "Dúo Dinámico", g: "Española", ids: ["P9F-YhEJd9s", "w_fNa783Smo", "EXGyhA7TPVo"] },
    { id: "s08", t: "Mi gran noche", a: "Raphael", g: "Española", ids: ["GVavte6hPek", "sIH-BX56mcY", "UNC1OOAkN8E"] },
    { id: "s09", t: "La flaca", a: "Jarabe de Palo", g: "Española", ids: ["j4oQdoL8mQc", "wRjPQs8reAE", "7n5fuy7rDc0"] },
    { id: "s10", t: "Rosas", a: "La Oreja de Van Gogh", g: "Española", ids: ["456YNhABfhI", "zkCWrx_ljbg", "TAOSwVD2_4o"] },
    { id: "s11", t: "Me cuesta tanto olvidarte", a: "Mecano", g: "Española", ids: ["gfe_hoWNlPA", "dKuu-KbPtiM", "ywyPuGcpwGU"] },
    { id: "s12", t: "Despacito", a: "Luis Fonsi", g: "Latino", ids: ["eATbjCqbYWk", "PzswTRUi-Ro", "FEPsFwAj0IQ"] },
    { id: "s13", t: "La bicicleta", a: "Carlos Vives y Shakira", g: "Latino", ids: ["VMYdnjOOYRU", "-0s1R0XNK88", "-uY1O0lx5L0"] },
    { id: "s14", t: "Gasolina", a: "Daddy Yankee", g: "Latino", ids: ["Rvq8D-GZ0Ig", "8B-3OqgP2Uo", "bifSaBwqt3A"] },
    { id: "s15", t: "Vivir mi vida", a: "Marc Anthony", g: "Latino", ids: ["km8GFyQW-rw", "CqDTuKVgaoU", "EbLw6qlgWgE"] },
    { id: "s16", t: "Tusa", a: "Karol G y Nicki Minaj", g: "Latino", ids: ["--mHajGPFCY", "YjHhbLWMR1M", "t3Vks_dpI-w"] },
    { id: "s17", t: "Hasta que me olvides", a: "Luis Miguel", g: "Baladas", ids: ["WlFZEXjEn-8", "5zHd7AzckK4", "YTdh1u71upk"] },
    { id: "s18", t: "Caminando por la vida", a: "Melendi", g: "Española", ids: ["v4QzNGBelOk", "9aD9VQQdbEE", "FEV0zKtCzUw"] },
    { id: "s19", t: "Tu jardín con enanitos", a: "Melendi", g: "Española", ids: ["EJY6MVsSrcw"] },
    { id: "s20", t: "Lágrimas desordenadas", a: "Melendi", g: "Española", ids: ["fMVkPZtQmhE", "Tf1uxjPJm-o", "FrGG3uqKJUI"] },
    { id: "s21", t: "Un violinista en tu tejado", a: "Melendi", g: "Española", ids: ["rbxkG7IXZ4A", "Br2AcHr6IxE", "e33Hg4y-1aU"] },
    { id: "s22", t: "Tocado y hundido", a: "Melendi", g: "Española", ids: ["nMWKoyZEWXI", "SxYRZgK2lT4", "0xhq8rKI230"] },
    { id: "s23", t: "Como Camarón", a: "Estopa", g: "Española", ids: ["8k0Vm-Z1l7I", "RV1U9p3QEys", "qLUPT6T11kA"] },
    { id: "s24", t: "Vino tinto", a: "Estopa", g: "Española", ids: ["dkYCwQAt6pA", "JWzICQHjd_w", "VXKUmGlv8Wk"] },
    { id: "s25", t: "La raja de tu falda", a: "Estopa", g: "Española", ids: ["enBGStvJzMA", "s9_dkDORaOY", "qmDnsuVcEj4"] },
    { id: "s26", t: "Zapatillas", a: "El Canto del Loco", g: "Española", ids: ["0xXBwwaTzqc", "TwvDUAa2U5I", "xTgwr79tW_o"] },
    { id: "s27", t: "Peter Pan", a: "El Canto del Loco", g: "Española", ids: ["-4KgKGgvL00", "XZvkroyMvI0", "Tvt-OsP7rzU"] },
    { id: "s28", t: "Besos", a: "El Canto del Loco", g: "Española", ids: ["KyBw9MI-upg", "lPRgbZgRRn8", "fP7cZaEeRls"] },
    { id: "s29", t: "Soldadito marinero", a: "Fito y Fitipaldis", g: "Rock", ids: ["VmyxJilvHuc", "7IKmSiyqcrg", "lX1nr2md06A"] },
    { id: "s30", t: "Por la boca vive el pez", a: "Fito y Fitipaldis", g: "Rock", ids: ["Q-qdwYd-8wk", "dkZVpnEHcPM", "_1-usL3azcE"] },
    { id: "s31", t: "Sin ti no soy nada", a: "Amaral", g: "Española", ids: ["l74cWsopq0Q", "4_dqi4Sdgnk", "zUy3JZ3_gfA"] },
    { id: "s32", t: "El universo sobre mí", a: "Amaral", g: "Española", ids: ["iG4r-BMjAA0", "d0BC0UFDFOk", "yWkAoOLn-wo"] },
    { id: "s33", t: "La playa", a: "La Oreja de Van Gogh", g: "Española", ids: ["EL9SRPfn8oM", "SMf5UsMzmKo", "-CB3nv5bCQQ"] },
    { id: "s34", t: "Puedes contar conmigo", a: "La Oreja de Van Gogh", g: "Española", ids: ["D0RaHqXGwFg", "ulbQUEjKUMw", "JZllo13-b2k"] },
    { id: "s35", t: "Cuídate", a: "La Oreja de Van Gogh", g: "Española", ids: ["P1n_7nrnc7M", "u98OrlgT1oo", "HEemmPzmQuI"] },
    { id: "s36", t: "Hijo de la luna", a: "Mecano", g: "Española", ids: ["CxtHYMMMk_M", "VjNhDWjZnVY", "-sxsxKSMBNc"] },
    { id: "s37", t: "La fuerza del destino", a: "Mecano", g: "Española", ids: ["-SYwqDmwD70", "NshI7RHUUHA", "NeDtEF1dB6I"] },
    { id: "s38", t: "Cruz de navajas", a: "Mecano", g: "Española", ids: ["POLSB7DVZ5g", "KhILVTl5PsU", "pq80rfuYH_g"] },
    { id: "s39", t: "Maquillaje", a: "Mecano", g: "Española", ids: ["heWlT6Eu6VA", "VZa1GL_WYD8", "6UnwI5KGr8k"] },
    { id: "s40", t: "Entre dos tierras", a: "Héroes del Silencio", g: "Rock", ids: ["fBL5i-DuOog", "zeFdndwmC_w", "BQFEH9LCi4U"] },
    { id: "s41", t: "La chispa adecuada", a: "Héroes del Silencio", g: "Rock", ids: ["_Y7FqGb3G5E", "pS44EywJhdU", "Kfk4GfPf4KM"] },
    { id: "s42", t: "Amiga mía", a: "Alejandro Sanz", g: "Baladas", ids: ["Q45rsd2QqpY", "PMHJYGmSgak", "tLbWUMesgjo"] },
    { id: "s43", t: "Y si fuera ella", a: "Alejandro Sanz", g: "Baladas", ids: ["a7HWFtn32bc", "wgNBM6nHVFE", "-s_sQhL3-Y8"] },
    { id: "s44", t: "La tortura", a: "Alejandro Sanz", g: "Latino", ids: ["FynXV_rvm6M", "daQSaDAttpw", "1LVcgE4c3AQ"] },
    { id: "s45", t: "19 días y 500 noches", a: "Joaquín Sabina", g: "Española", ids: ["tP_qPszF214", "_7CY8nJuKS0", "fWY6r1GF49I"] },
    { id: "s46", t: "Mediterráneo", a: "Joan Manuel Serrat", g: "Española", ids: ["sGrSpE9bhSs", "dMyHzRjXRek", "VC0uqFCuPcQ"] },
    { id: "s47", t: "Escándalo", a: "Raphael", g: "Española", ids: ["jJEY7aSRzoE", "9P7ist6vkrA", "NduI4TEthpQ"] },
    { id: "s48", t: "Yo soy aquel", a: "Raphael", g: "Española", ids: ["do-dcNWErnM", "dSdcnhlAhYg", "ElIzJR5p1fQ"] },
    { id: "s49", t: "Vivir así es morir de amor", a: "Camilo Sesto", g: "Baladas", ids: ["OMWahyEJooY", "FR6uwEDZnrs", "Z4XCuwAAoMA"] },
    { id: "s50", t: "Libre", a: "Nino Bravo", g: "Española", ids: ["0DowWScwqDg", "LeQPAPC86gs", "Xb-tDYZID60"] },
    { id: "s51", t: "Un beso y una flor", a: "Nino Bravo", g: "Española", ids: ["MUAjTGceHAM", "58dg58hLXOs", "OadHJo-j65g"] },
    { id: "s52", t: "Como una ola", a: "Rocío Jurado", g: "Española", ids: ["2WTymE9Rfi8", "8zxIUZeZu_I", "1habmhr5pR0"] },
    { id: "s53", t: "Se nos rompió el amor", a: "Rocío Jurado", g: "Española", ids: ["2FX7LiFMjKk", "YvRdy0wckcs", "4V4asccL6VY"] },
    { id: "s54", t: "Marinero de luces", a: "Isabel Pantoja", g: "Española", ids: ["NN7TqKMjWCs", "nd5WsOtGsiI", "l-ARNgj6uVo"] },
    { id: "s55", t: "Fiesta", a: "Raffaella Carrà", g: "Clásicos", ids: ["i7c3PQuRx6A", "jzUN4ZFl2E4", "pvQgrJfHcHw"] },
    { id: "s56", t: "Hay que venir al sur", a: "Raffaella Carrà", g: "Clásicos", ids: ["-KAYakBQ10o", "lXhL8_FiOTY", "ry3YfrLpNPA"] },
    { id: "s57", t: "En el amor todo es empezar", a: "Raffaella Carrà", g: "Clásicos", ids: ["gv4tgdRNCCc", "q2HAh1qxFKY", "A5R6AUZAfdQ"] },
    { id: "s58", t: "Aserejé", a: "Las Ketchup", g: "Española", ids: ["f9IvS9uHJys", "PoEKHZ_pSu4", "H7M1Rpn2avQ"] },
    { id: "s59", t: "Macarena", a: "Los del Río", g: "Latino", ids: ["WBqZB4_cJgI", "rzt4Y430w2k", "YYxQi4ijSJA"] },
    { id: "s60", t: "Bomba", a: "King África", g: "Latino", ids: ["J-ELFchPZoc", "SeXFiHEC9Ys", "5ynBjM71cIo"] },
    { id: "s61", t: "Ave María", a: "David Bisbal", g: "Española", ids: ["ka5YJSyN8lI", "qfyyc4krxG4", "mIRbTp-dTb4"] },
    { id: "s62", t: "Bulería", a: "David Bisbal", g: "Española", ids: ["hWcTF_lLhIk", "9IcfILgrM1s", "YVHMkP0a5qw"] },
    { id: "s63", t: "Solamente tú", a: "Pablo Alborán", g: "Baladas", ids: ["s3OEsd-I_r8", "vn5FbivX8l0", "DFvqcdO9nLE"] },
    { id: "s64", t: "Saturno", a: "Pablo Alborán", g: "Baladas", ids: ["IsZ-IjLiTHM", "ZB64iTP9TIY", "7RoV7GCAV2E"] },
    { id: "s65", t: "Aprendiz", a: "Malú", g: "Baladas", ids: ["10kjwdwHxPA", "BXNbyCBbwqo", "EPeU_GgASWg"] },
    { id: "s66", t: "Que bonito es querer", a: "Manuel Carrasco", g: "Baladas", ids: ["SFwQhKUtGNU", "F_rD4O2TH_E", "gUOZrxr7DXA"] },
    { id: "s67", t: "Malamente", a: "Rosalía", g: "Latino", ids: ["aAqlY_ds514", "HFxkQLdI8WI", "Tq-gPJq6pq4"] },
    { id: "s68", t: "Despechá", a: "Rosalía", g: "Latino", ids: ["wvPZm3sCQh8", "0UG_AnCRgmk", "8jddglWRFtw"] },
    { id: "s69", t: "Mon Amour", a: "Aitana", g: "Española", ids: ["AFwxfyV6KjA", "Wr9bOH7DmhQ", "Zj8WPiXlRbk"] },
    { id: "s70", t: "Bailar pegados", a: "Sergio Dalma", g: "Baladas", ids: ["R32tR0AnPq0", "lvCsLQ8pAYM", "t-uNIabFVOU"] },
    { id: "s71", t: "Sobreviviré", a: "Mónica Naranjo", g: "Española", ids: ["IZqPoMyP3SI", "k1-Y04YgAp0", "Qp3NRiXI0es"] },
    { id: "s72", t: "Desesperada", a: "Marta Sánchez", g: "Española", ids: ["us4iq7frGxU", "42QXRLXi0sQ", "qP1Amjh5rS4"] },
    { id: "s73", t: "Devuélveme a mi chica", a: "Hombres G", g: "Española", ids: ["LsWYt2vDBJA", "4qyTj6UxsGc", "NiFQh4qczcM"] },
    { id: "s74", t: "Venezia", a: "Hombres G", g: "Española", ids: ["2DHlYc2R0tg", "As4RW0HayHM", "ZguNvbkOuT0"] },
    { id: "s75", t: "Déjame", a: "Los Secretos", g: "Española", ids: ["GC71e25FwwI", "zTHYChFur8c", "uLkNRy8uUbM"] },
    { id: "s76", t: "En algún lugar", a: "Duncan Dhu", g: "Española", ids: ["1t2Dk01D8xA", "ZStrqoh7mNU", "gFyNzGbCm54"] },
    { id: "s77", t: "Cadillac solitario", a: "Loquillo", g: "Rock", ids: ["f5OMc0N2BFE", "hHTc2HtPGl0", "z9vnLfrXYKk"] },
    { id: "s78", t: "So payaso", a: "Extremoduro", g: "Rock", ids: ["2aVCkwpe6Ws", "qP7aToPMSKg", "ToLPlBmgeQM"] },
    { id: "s79", t: "Hay poco rock and roll", a: "Platero y Tú", g: "Rock", ids: ["f0ciPAbk2sI", "YY7tI5WM_Eg", "5I497jEjKI8"] },
    { id: "s80", t: "Waka Waka", a: "Shakira", g: "Latino", ids: ["FDaE9SgBtB4", "DHXrbMX7fPw", "TAKuexu97GI"] },
    { id: "s81", t: "Antología", a: "Shakira", g: "Baladas", ids: ["FV8nes2mEUQ", "oOfPAHYAVi8", "W2BZaYFExEQ"] },
    { id: "s82", t: "Ojos así", a: "Shakira", g: "Latino", ids: ["MYlz11ooacQ", "BL1stDE8PaE", "Rg3hhiI_JS0"] },
    { id: "s83", t: "Bzrp Music Sessions 53", a: "Shakira", g: "Latino", ids: ["hEZHzkuXL_U", "20pdbrySDqI", "HE-ucO-VJaY"] },
    { id: "s84", t: "La camisa negra", a: "Juanes", g: "Latino", ids: ["BimPHAx5-Vk", "xjNdiI35JmU", "BUUT2W7Itj0"] },
    { id: "s85", t: "Livin' la vida loca", a: "Ricky Martin", g: "Latino", ids: ["tOAs-c5jiuQ", "I75WTq3WzhE", "VoXSyncytco"] },
    { id: "s86", t: "La copa de la vida", a: "Ricky Martin", g: "Latino", ids: ["05IvyUP2wiY", "CUr6snsWGaI", "Bm2_-iIwuA4"] },
    { id: "s87", t: "Bailando", a: "Enrique Iglesias", g: "Latino", ids: ["mgPf4mYE-fw", "2k5IVqw5-X8", "hSGlICvQurU"] },
    { id: "s88", t: "Héroe", a: "Enrique Iglesias", g: "Baladas", ids: ["-3xEtSRVSV4", "_5zE6EwC08U", "Fxo6roZm4DU"] },
    { id: "s89", t: "Conga", a: "Gloria Estefan", g: "Latino", ids: ["IBnbOEGv5MM", "nKBMY4IKl-o", "QXCj32uEKRs"] },
    { id: "s90", t: "La vida es un carnaval", a: "Celia Cruz", g: "Latino", ids: ["Cv5OGUxv0vc", "n-DiixKas4o", "AJL7Jb0HoGE"] },
    { id: "s91", t: "Valió la pena", a: "Marc Anthony", g: "Latino", ids: ["7qvNhGKurO0", "Pvgk14nfP7k", "R8AYd6azW9k"] },
    { id: "s92", t: "Propuesta indecente", a: "Romeo Santos", g: "Latino", ids: ["cSjmOuUpeEE", "xAJKyYamEL0", "YoadJUZ4f9Q"] },
    { id: "s93", t: "Darte un beso", a: "Prince Royce", g: "Latino", ids: ["XNlVHDmfeyU", "EhZetKXl3BI", "XANYmsSzxIE"] },
    { id: "s94", t: "Tití me preguntó", a: "Bad Bunny", g: "Latino", ids: ["3D_RpqONxtw", "-18nYPOk2Pc", "V6C_9wKZULM"] },
    { id: "s95", t: "Danza Kuduro", a: "Don Omar", g: "Latino", ids: ["QSWmgNMK-VM", "_M57hm9zQIc", "vvxmQu2G53Q"] },
    { id: "s96", t: "El perdón", a: "Nicky Jam", g: "Latino", ids: ["dfcWLDc3ECI", "g7g_SA7_nbs", "f7cNPDC9zrk"] },
    { id: "s97", t: "Felices los 4", a: "Maluma", g: "Latino", ids: ["efDf9yz6qUA", "MZwDVO_18Ig", "UMpehssvSJg"] },
    { id: "s98", t: "Provenza", a: "Karol G", g: "Latino", ids: ["753dfvomgf4", "yofETmY6sKA", "UUmTnBD1Qi0"] },
    { id: "s99", t: "Rayando el sol", a: "Maná", g: "Latino", ids: ["U5TiuzOkJEY", "ngNTFq2vdYY", "2Afyqg5nEzE"] },
    { id: "s100", t: "Querida", a: "Juan Gabriel", g: "Baladas", ids: ["vNfNjG5Q6FU", "BuB055_0Ej0", "JIfI64IAFu4"] },
    { id: "s101", t: "La incondicional", a: "Luis Miguel", g: "Baladas", ids: ["mz3UmLV3GQg", "8t7i55m1F8M", "lEKL6ZIUZ7g"] },
    { id: "s102", t: "Como la flor", a: "Selena", g: "Latino", ids: ["d6mToWZXZKA", "rY97_dnXB7U", "QKcnn65Jf3M"] },
    { id: "s103", t: "De música ligera", a: "Soda Stereo", g: "Rock", ids: ["Ig_u_Mty0cU", "chb9iV0WsKU", "mjJ-ybMo4ZM"] },
    { id: "s104", t: "La soledad", a: "Laura Pausini", g: "Baladas", ids: ["O5qfwBHFTyk", "Q3LhUqWS9Qg", "NS02xMqG33Q"] },
    { id: "s105", t: "Amor eterno", a: "Rocío Dúrcal", g: "Baladas", ids: ["nEmb3Q-ZiRE", "UZgB8iMAuR4", "xhzkWl3mBS0"] },
    { id: "s106", t: "Torero", a: "Chayanne", g: "Latino", ids: ["DeBuHxF0rFA", "zCWtkQPa6Tk", "UDzxWw2iQbM"] },
    { id: "s107", t: "Don't Stop Me Now", a: "Queen", g: "Clásicos", ids: ["G962z-4OL9E", "fuMN34FeSL4", "ZohKTehanl8"] },
    { id: "s108", t: "We Will Rock You", a: "Queen", g: "Clásicos", ids: ["j8Mkv84V9mY", "blikQus8IQ4", "UVaBqAhTi-o"] },
    { id: "s109", t: "Somebody to Love", a: "Queen", g: "Clásicos", ids: ["dqIil7XK3V4", "a89xC8OLzJs", "8i8y972VEGg"] },
    { id: "s110", t: "Mamma Mia", a: "ABBA", g: "Clásicos", ids: ["1YN5Emwwoss", "gzk6e1X8v8Q", "NcBBH6juEUI"] },
    { id: "s111", t: "Waterloo", a: "ABBA", g: "Clásicos", ids: ["wphW2H4ucg4", "PlemEbmqAhw", "0l9aExQZEgI"] },
    { id: "s112", t: "Billie Jean", a: "Michael Jackson", g: "Clásicos", ids: ["eXqBhDAlVCc", "si1wKvKd5LQ", "2HGEFy7aXwc"] },
    { id: "s113", t: "Thriller", a: "Michael Jackson", g: "Clásicos", ids: ["k6hqitlkXRI", "67eWUvSW5RA", "fztTUhjdJLQ"] },
    { id: "s114", t: "Beat It", a: "Michael Jackson", g: "Clásicos", ids: ["pvdrN3GJFZo", "WzkoBVWdTuY", "5ptwna24d3Y"] },
    { id: "s115", t: "It's My Life", a: "Bon Jovi", g: "Rock", ids: ["y3rHoAicOo4", "bMxj9-62aiQ", "cfjXtTes6LE"] },
    { id: "s116", t: "Always", a: "Bon Jovi", g: "Rock", ids: ["RBgimRYxorE", "xiiEwokvEYs", "zVkP4Qd1S10"] },
    { id: "s117", t: "You Give Love a Bad Name", a: "Bon Jovi", g: "Rock", ids: ["tvDYNWxLr-4", "R5NrVs33-xY", "BPfKD0nyvwU"] },
    { id: "s118", t: "Bed of Roses", a: "Bon Jovi", g: "Rock", ids: ["fBGaQoyEz1o", "KcfHy_WBNvY", "9F0mAiipcwM"] },
    { id: "s119", t: "The Final Countdown", a: "Europe", g: "Rock", ids: ["KLfiWUrJ87c", "-wI4GeZYHBo", "0m31SJnyScE"] },
    { id: "s120", t: "Eye of the Tiger", a: "Survivor", g: "Rock", ids: ["83ZFZPhxskc", "ibq9lBRdGk8", "3Kaiq1gnj7Y"] },
    { id: "s121", t: "Total Eclipse of the Heart", a: "Bonnie Tyler", g: "Clásicos", ids: ["-dLeErrD9Oo", "pnJRZU4oAi8", "iN7jQEpv92I"] },
    { id: "s122", t: "Africa", a: "Toto", g: "Clásicos", ids: ["CRrZlEF7-SU", "FsTWqAKrD1U", "JZtIOGYr2_o"] },
    { id: "s123", t: "Don't Stop Believin'", a: "Journey", g: "Rock", ids: ["c8wn2fMYvns", "YRFNMAFL5j0", "4xIlrhsZnGY"] },
    { id: "s124", t: "I Wanna Dance with Somebody", a: "Whitney Houston", g: "Clásicos", ids: ["st-yPBxRVPM", "QMmc5ed_cgY", "a8E18WSen2I"] },
    { id: "s125", t: "I Will Always Love You", a: "Whitney Houston", g: "Baladas", ids: ["8kotNQ07ZEw", "6BXivcr9uvE", "5qQ0OYF4DkA"] },
    { id: "s126", t: "My Heart Will Go On", a: "Celine Dion", g: "Baladas", ids: ["cdgU8YmD3Kc", "IQEzFe9-bsg", "naOhxX3FpHo"] },
    { id: "s127", t: "Girls Just Want to Have Fun", a: "Cyndi Lauper", g: "Clásicos", ids: ["-Fg7m1ZqkxI", "fKNguSQaBxc", "n55fjqx4f9A"] },
    { id: "s128", t: "Like a Prayer", a: "Madonna", g: "Clásicos", ids: ["mTW-Ut83PPU", "JAp9wSfSAyc", "okdf13i0S0c"] },
    { id: "s129", t: "Wannabe", a: "Spice Girls", g: "Pop", ids: ["BTDPZQGqjY8", "09HAwFpXCX4", "NC7xUrWuyGE"] },
    { id: "s130", t: "I Want It That Way", a: "Backstreet Boys", g: "Pop", ids: ["NxilU56kPu0", "IjFeGYAT-5E", "9lCnW_UsjZk"] },
    { id: "s131", t: "...Baby One More Time", a: "Britney Spears", g: "Pop", ids: ["PYpU2TxIzAM", "Jww2DCiPASg", "Iaq6Ndyw2Ns"] },
    { id: "s132", t: "Y.M.C.A.", a: "Village People", g: "Clásicos", ids: ["AaH5NsLi1fM", "wwQCD7Youiw"] },
    { id: "s133", t: "Stayin' Alive", a: "Bee Gees", g: "Clásicos", ids: ["hVwtABjAH0c", "s3UKX6zsmL4", "JYJyhfulS7g"] },
    { id: "s134", t: "Hey Jude", a: "The Beatles", g: "Clásicos", ids: ["enmHYsoCMkQ", "Pex4LTVjFow", "yOt-umPG_X0"] },
    { id: "s135", t: "Can't Help Falling in Love", a: "Elvis Presley", g: "Clásicos", ids: ["gd4mB-zUcO8", "g8NQggVeW98", "JJ9ctQw87YY"] },
    { id: "s136", t: "Your Song", a: "Elton John", g: "Baladas", ids: ["fGI2vCk6ykY", "s2XQ76mFwno", "YXKbsKwmILk"] },
    { id: "s137", t: "Wonderwall", a: "Oasis", g: "Rock", ids: ["R_EXyGWI9rU", "0BFeMQkYteo", "Tpyo0fGdc6A"] },
    { id: "s138", t: "Someone Like You", a: "Adele", g: "Pop", ids: ["BPRoNqB2XK8", "_uORhCSX2f8", "KhX4QjANY0I"] },
    { id: "s139", t: "Rolling in the Deep", a: "Adele", g: "Pop", ids: ["LOd3u6FtkAk", "SRn4Fh47kok", "lgm4izk7qag"] },
    { id: "s140", t: "Perfect", a: "Ed Sheeran", g: "Pop", ids: ["sPMA1tqWuf4", "v2UCxEP0HV8", "BOiXo1kdlIE"] },
    { id: "s141", t: "Shape of You", a: "Ed Sheeran", g: "Pop", ids: ["o71_MatpYV0", "rI5HNCgpWNo", "2__oXZxu7rA"] },
    { id: "s142", t: "Uptown Funk", a: "Bruno Mars", g: "Pop", ids: ["qWst8V-P9qw", "u-TsARZWbRk", "S432WzDAzxo"] },
    { id: "s143", t: "Shallow", a: "Lady Gaga", g: "Pop", ids: ["_nHT_k9Rswc", "XgK7VLKcCTo", "I0aWp60IQj0"] },
    { id: "s144", t: "Don't Start Now", a: "Dua Lipa", g: "Pop", ids: ["jIMJQsBwsWg", "WkLVbLJtxCE", "6DeAO5PSQhE"] },
    { id: "s145", t: "Shake It Off", a: "Taylor Swift", g: "Pop", ids: ["-i5MU14JLdw", "YiPE3U3QN1I", "TZKwsbrh6h4"] },
    { id: "s146", t: "Yellow", a: "Coldplay", g: "Pop", ids: ["XZN3DaxqFuQ", "xeEegnhKsbw", "n-v2JEkEIJ0"] },
    { id: "s147", t: "Skinny Love", a: "Bon Iver", g: "Pop", ids: ["sndK-GAOLPM", "4hcZBGqfZU0", "a4JzHrGq5YU"] },
    { id: "s148", t: "Mr. Brightside", a: "The Killers", g: "Rock", ids: ["c1X3Lg7RVkk", "X7hYf20IWH4", "i5SWOQlFtUI"] },
    { id: "s149", t: "Someone You Loved", a: "Lewis Capaldi", g: "Pop", ids: ["0H3KpRuwBZ8", "3xhsM5Phs44", "mVepiMsy5mc"] },
    { id: "s150", t: "Flowers", a: "Miley Cyrus", g: "Pop", ids: ["fO4wsNsXtDg", "IpOSrHZF9Hs", "nwzRwv47U38"] },
    { id: "s151", t: "As It Was", a: "Harry Styles", g: "Pop", ids: ["JyKfmLkq3BU", "oE4GZTJ7GDg", "_H1aURw8X-Q"] },
    { id: "s152", t: "Valerie", a: "Amy Winehouse", g: "Pop", ids: ["yH2mILMKC-0", "IbBcTpKt1AI", "uogD6wdfXR8"] },
    { id: "s153", t: "Gimme! Gimme! Gimme!", a: "ABBA", g: "Clásicos", ids: ["H18SVaz-heA", "ETjlUOVBEJ4", "uMhvEasO3RI"] },
    { id: "s154", t: "The Best", a: "Tina Turner", g: "Clásicos", ids: ["X8Mygx8B54Y", "pTyoPcPDrME", "97yLL4dRPjA"] },
    { id: "s155", t: "Can't Get You Out of My Head", a: "Kylie Minogue", g: "Pop", ids: ["LRJx1QH03sU", "CXJ-ES6d81w", "IZSLWcCOd94"] },
    { id: "s156", t: "Smells Like Teen Spirit", a: "Nirvana", g: "Rock", ids: ["wanjkvlxbho", "9lkyGVSJ0oU", "ZMi842RMVB4"] },
    { id: "s157", t: "Sweet Child O' Mine", a: "Guns N' Roses", g: "Rock", ids: ["uhiamj_I7II", "GDrjxMvwwos", "TBxAAOOJzL8"] },
    { id: "s158", t: "Mi soledad y yo", a: "Alejandro Sanz", g: "Baladas", ids: ["8YebE99Tto0", "0t3v6HLtPKc", "vfcbpLHR1j0"] },
    { id: "s159", t: "Cuando nadie me ve", a: "Alejandro Sanz", g: "Baladas", ids: ["SE_Q1v93dgg", "jYfpvEjYsYA", "Cg2pZyafoLY"] },
    { id: "s160", t: "No es lo mismo", a: "Alejandro Sanz", g: "Española", ids: ["NEttsmUBnqw", "g24rilhvZ38", "KflK6lUnYJs"] },
    { id: "s161", t: "Con la luna llena", a: "Melendi", g: "Española", ids: ["bUXv3aqJftU", "pnVgzkcpOlY", "5zDaBNcLL5I"] },
    { id: "s162", t: "Barbie de extrarradio", a: "Melendi", g: "Española", ids: ["UxJX7PoT2lU", "C6Ggxbel698", "GtWgkObAcPs"] },
    { id: "s163", t: "Cheque al portamor", a: "Melendi", g: "Española", ids: ["lDbYlwzE4zA", "dV4RS5MueaM", "90R_s8S6S88"] },
    { id: "s164", t: "Destino o casualidad", a: "Melendi", g: "Española", ids: ["oQJRvN__NCk", "R98hKzSeMI8", "ermCdysnGOM"] },
    { id: "s165", t: "Me falta el aliento", a: "Estopa", g: "Española", ids: ["eswHz0iyFWo", "kcj8_xguUB0", "c3gSTJypM7U"] },
    { id: "s166", t: "Tu calorro", a: "Estopa", g: "Española", ids: ["qFgt474GC9U", "tSVxxFKZfuk", "aYwQ36_L8Ik"] },
    { id: "s167", t: "Partiendo la pana", a: "Estopa", g: "Española", ids: ["U1sE262IcJE", "pBM_LoRCjOc", "koxEYpGNSp4"] },
    { id: "s168", t: "Prometo", a: "Pablo Alborán", g: "Baladas", ids: ["ehdLPiMsTxs", "nwDTliIyJb8", "8-Mdo__sYLs"] },
    { id: "s169", t: "Te he echado de menos", a: "Pablo Alborán", g: "Baladas", ids: ["9hCaHU0Kkas", "-PnxXn3o51s", "FFSXVZD_TAQ"] },
    { id: "s170", t: "Tanto", a: "Pablo Alborán", g: "Baladas", ids: ["gbN5cyLUDoc", "_NHfB8ZBkfo", "gwnpwVFr_hM"] },
    { id: "s171", t: "Dígale", a: "David Bisbal", g: "Española", ids: ["fAI6Gy9p9KY", "wzETZaaIsGY", "baYlYpBN8jE"] },
    { id: "s172", t: "Lloraré las penas", a: "David Bisbal", g: "Española", ids: ["G1_CTKBuw4U", "n3l70M3X8DE", "TVKJx2mYEzE"] },
    { id: "s173", t: "Blanco y negro", a: "Malú", g: "Baladas", ids: ["MlvUar0fP2k", "eneAF5smDeU", "e5b4ekqG9wM"] },
    { id: "s174", t: "Devuélveme la vida", a: "Antonio Orozco", g: "Baladas", ids: ["cOY0P3i6NY0", "FyhdUpgoBDE", "gTURCM50GsM"] },
    { id: "s175", t: "Me dijeron de pequeño", a: "Manuel Carrasco", g: "Baladas", ids: ["32xMTNMI7zY", "SW8pdemuVVU", "YSUT32ReC2I"] },
    { id: "s176", t: "Cero", a: "Dani Martín", g: "Española", ids: ["zZY3hhdkw38", "Lyy6dxvBitM", "WrfDka52L8w"] },
    { id: "s177", t: "Godzilla", a: "Leiva", g: "Rock", ids: ["X4ntHYheDms", "SvQxQazrBl0", "1-Mwhn-TxSM"] },
    { id: "s178", t: "Copenhague", a: "Vetusta Morla", g: "Rock", ids: ["mqekuvK_LvQ", "Hp5XZZ9ncdQ", "2aUnreBE-V0"] },
    { id: "s179", t: "Revolución", a: "Amaral", g: "Española", ids: ["fTfhjxgFKTI", "WaQEe7JiUa4", "ojpiVuWVeAI"] },
    { id: "s180", t: "Días de verano", a: "Amaral", g: "Española", ids: ["NS79I4d9qHU", "DumhLixJH6U", "3U1c-gXXcpw"] },
    { id: "s181", t: "Jueves", a: "La Oreja de Van Gogh", g: "Baladas", ids: ["JKRpNZuNOao", "VBIbm2krjEk", "ITF9JKL2bdA"] },
    { id: "s182", t: "Me colé en una fiesta", a: "Mecano", g: "Española", ids: ["p4gAiilP1H4", "Uiejq-UHhh8", "wPFrb66hjys"] },
    { id: "s183", t: "Barco a Venus", a: "Mecano", g: "Española", ids: ["4shqPQ5BIro", "ba7f392iYvM", "M6oTPLwSU4s"] },
    { id: "s184", t: "Mujer contra mujer", a: "Mecano", g: "Baladas", ids: ["k4cngzwxr4M", "nHvBq_cW8ns", "52WCwSqdKDM"] },
    { id: "s185", t: "Voy a pasármelo bien", a: "Hombres G", g: "Española", ids: ["7bhfIQJJDVI", "scN7k0U4kY4", "ETx6USzH4q8"] },
    { id: "s186", t: "Te quiero", a: "Hombres G", g: "Española", ids: ["83K69Mdrux8", "yolXFd0jgXs", "uls5VLVxqoY"] },
    { id: "s187", t: "Pero a tu lado", a: "Los Secretos", g: "Baladas", ids: ["tErMmHCpcjo", "herAiiVY_kw", "pPTq50uZaUc"] },
    { id: "s188", t: "Quiero tener tu presencia", a: "Seguridad Social", g: "Española", ids: ["Kxl81piQMoE", "0NlugcVFWd4", "lO2ucwRtHME"] },
    { id: "s189", t: "Sin documentos", a: "Los Rodríguez", g: "Rock", ids: ["opDNeGKLW6I", "AHYDZ12vjqI", "vBkRxFFRDzQ"] },
    { id: "s190", t: "Bailaré sobre tu tumba", a: "Siniestro Total", g: "Rock", ids: ["scanD7C3jDk", "R1UsGv1gqms", "PbmxwwlvSZk"] },
    { id: "s191", t: "20 de abril", a: "Celtas Cortos", g: "Rock", ids: ["LcCyrEkiKrE", "QgaNRoGeit4", "xokQxZskXL0"] },
    { id: "s192", t: "Antes de que cuente diez", a: "Fito y Fitipaldis", g: "Rock", ids: ["gVQXt4dIXMg", "dr5adsPheQY", "AjKXfTu6NFU"] },
    { id: "s193", t: "Me equivocaría otra vez", a: "Fito y Fitipaldis", g: "Rock", ids: ["VImP5rUyimo", "v6ajRC4CvwE", "GBkx7vp1SsI"] },
    { id: "s194", t: "Corazón de mimbre", a: "Marea", g: "Rock", ids: ["QIW-OregSbA", "CZnzlgmwzow"] },
    { id: "s195", t: "Agradecido", a: "Rosendo", g: "Rock", ids: ["roS2fEH3Dog", "bzlm7j_Cod8", "vuz4P-c9khQ"] },
    { id: "s196", t: "Fiesta pagana", a: "Mägo de Oz", g: "Rock", ids: ["f3F5xx7jbiM", "9qVjA8axjmU", "sIVZm8D_Emk"] },
    { id: "s197", t: "Los rockeros van al infierno", a: "Barón Rojo", g: "Rock", ids: ["_nbb6PEAJ9g", "1QIEPq1_dOw", "rmSzKCeAcIs"] },
    { id: "s198", t: "Carolina", a: "M-Clan", g: "Rock", ids: ["g3Csm8QfOuc", "jr9Yrrp-hAk", "j-IjnTkdZps"] },
    { id: "s199", t: "Princesas", a: "Pereza", g: "Rock", ids: ["rYEAMDo1qvQ", "4eW4Z2BE-cE", "7fCpV92WMN4"] },
    { id: "s200", t: "Pa Madrid", a: "El Barrio", g: "Española", ids: ["KELRH3gnFQ0", "uyxIThPQuqg", "23dxR6AUW44"] },
    { id: "s201", t: "Cuando zarpa el amor", a: "Camela", g: "Española", ids: ["NGlRWhmQb7Q", "_aPGJ3y3xyg", "fs2czVUF0Iw"] },
    { id: "s202", t: "Me quedo contigo", a: "Los Chunguitos", g: "Española", ids: ["FKQW--LvgUs", "FSvZ93VuGVY", "S38K3JxZYzs"] },
    { id: "s203", t: "Te estoy amando locamente", a: "Las Grecas", g: "Española", ids: ["AGDd36pgHgQ", "Bm_mVLATHRI", "Pc42lBSbqZM"] },
    { id: "s204", t: "Malo", a: "Bebe", g: "Española", ids: ["Cojy8HXOIbg", "6TIzZEOnfxg", "wTvvHV2P5dk"] },
    { id: "s205", t: "Cuando tú vas", a: "Chenoa", g: "Española", ids: ["WqTgMjFDNZc", "tzFHJyJlIIA", "mJfuuDPkYA0"] },
    { id: "s206", t: "Hasta la raíz", a: "Natalia Lafourcade", g: "Latino", ids: ["I12qxf5Kr2c", "UNk-Y0Ib-7g", "9YEPxeAgSBk"] },
    { id: "s207", t: "Lo echamos a suertes", a: "Ella Baila Sola", g: "Española", ids: ["oS3h23tuiM0", "Qg25EMYoEQw", "hZ-hxfVsL2g"] },
    { id: "s208", t: "A quién le importa", a: "Alaska y Dinarama", g: "Española", ids: ["jqCyfmpMmO8", "PD3in5baNDA", "ZFmdIRZix7w"] },
    { id: "s209", t: "Retorciendo palabras", a: "Fangoria", g: "Española", ids: ["46HAtk3vqv0", "5cIsaANHnJ8", "rFLnqmU631s"] },
    { id: "s210", t: "La chica de ayer", a: "Nacha Pop", g: "Española", ids: ["2mDc8XfsSDU", "Rc00q1l6dQo", "IwEkQ2-51R0"] },
    { id: "s211", t: "Escuela de calor", a: "Radio Futura", g: "Española", ids: ["Y0f48yDYiRU", "L3pj_ERK5ZY", "2nEGEPaSDes"] },
    { id: "s212", t: "Contigo", a: "Joaquín Sabina", g: "Española", ids: ["dcy6DnkFbww", "pvb7JwbCBUU", "ASP42oV5ISU"] },
    { id: "s213", t: "Penélope", a: "Joan Manuel Serrat", g: "Española", ids: ["pJHS5ZH8U60", "MYdRwR8xqW8", "8u35TRQmf90"] },
    { id: "s214", t: "Bienvenidos", a: "Miguel Ríos", g: "Rock", ids: ["R-oKjttMcT8", "hWUIEANSAx0", "HbzaFaXKHZk"] },
    { id: "s215", t: "Soy un truhán, soy un señor", a: "Julio Iglesias", g: "Baladas", ids: ["9Cj4SdQOOXc", "YuRRRXlGUps", "KeIeEpDaa30"] },
    { id: "s216", t: "Me olvidé de vivir", a: "Julio Iglesias", g: "Baladas", ids: ["N1TTyvJ3_Ts", "tqiIdEEYAEI", "wy_eb28IpMI"] },
    { id: "s217", t: "Perdóname", a: "Camilo Sesto", g: "Baladas", ids: ["ChkhF6up2Z8", "g3Ksgm7lhFo", "GdQR4_nhnMM"] },
    { id: "s218", t: "Y cómo es él", a: "José Luis Perales", g: "Baladas", ids: ["Imq8ep35e44", "albQCAATI8g", "q1pF53Rr3X8"] },
    { id: "s219", t: "Ese hombre", a: "Rocío Jurado", g: "Española", ids: ["fEmYQI6ieGc", "GzJGHydhHi4", "V47MJQlg8qs"] },
    { id: "s220", t: "Así fue", a: "Isabel Pantoja", g: "Baladas", ids: ["86Z_ToHAPD4", "cZ0Y2mDqvtk", "av7PWXmJuUI"] },
    { id: "s221", t: "La gata bajo la lluvia", a: "Rocío Dúrcal", g: "Baladas", ids: ["mvhWEExsFvY", "ZbAYAp4j79g", "MhI1ZOOhc7Y"] },
    { id: "s222", t: "La, la, la", a: "Massiel", g: "Clásicos", ids: ["V1bjmkNVVbA", "1AABSkMq0xo", "lreaGlTsA7g"] },
    { id: "s223", t: "Pena, penita, pena", a: "Lola Flores", g: "Española", ids: ["Dt1iQVG7Ftc", "0nOZxhw3me8", "viSCIO_QjNU"] },
    { id: "s224", t: "Mi carro", a: "Manolo Escobar", g: "Española", ids: ["3_PDDhUNCnY", "o-dQlGOggII", "C8NzI7R_0lo"] },
    { id: "s225", t: "Borriquito", a: "Peret", g: "Española", ids: ["OO6COEF2T98", "fS4B10bQ_S8", "CJlcDh5PfjY"] },
    { id: "s226", t: "El chiringuito", a: "Georgie Dann", g: "Española", ids: ["3IE6WYVafbQ", "G-s4jCiRsTk", "GnxBq-0soIE"] },
    { id: "s227", t: "Formentera", a: "Aitana", g: "Española", ids: ["zCY5Pc92ras", "avSwMrQ8nEk", "ThlrVw4vkSg"] },
    { id: "s228", t: "Tú me dejaste de querer", a: "C. Tangana", g: "Latino", ids: ["CbHRurqXkW4", "6UFVsKgTqlk", "DP96URVAZ8U"] },
    { id: "s229", t: "Columbia", a: "Quevedo", g: "Latino", ids: ["sU3HwxoETWI", "53OjuzYwrQI", "bmP7lGqUCUk"] },
    { id: "s230", t: "Con altura", a: "Rosalía", g: "Latino", ids: ["iS6UtPjMNLE", "ZAcKN_3UdmU", "V4b_np0BO_o"] },
    { id: "s231", t: "La fama", a: "Rosalía", g: "Latino", ids: ["ux3u5-epOOI", "1nwR2cPvB7M", "vpUGM3zuYBQ"] },
    { id: "s232", t: "Cómo te atreves", a: "Morat", g: "Latino", ids: ["rd_57HN-CSU", "3thDV0quf4A", "hCclf6CYj-E"] },
    { id: "s233", t: "Besos en guerra", a: "Morat", g: "Latino", ids: ["JfsebY3gXSM", "daCI3rQvehs", "nfzufkc2GiA"] },
    { id: "s234", t: "Estoy aquí", a: "Shakira", g: "Latino", ids: ["fsiVykcpYLk", "Y_CQP-AwrUs", "UVDyFA0HYPw"] },
    { id: "s235", t: "Inevitable", a: "Shakira", g: "Rock", ids: ["5IEV67dMg0U", "IccrPZ7ymT0", "LVyZVP-zABw"] },
    { id: "s236", t: "Te felicito", a: "Shakira", g: "Latino", ids: ["JfK4DRT904o", "jZYm2YHGsiY", "8Vklu1QbXUk"] },
    { id: "s237", t: "A Dios le pido", a: "Juanes", g: "Latino", ids: ["1VUy20YDWoM", "9x-Xx_uXQyI", "JejPfn2NOWI"] },
    { id: "s238", t: "Es por ti", a: "Juanes", g: "Latino", ids: ["PC3Njn5wtPg", "uW2sgTmvIrs", "eo3zn9keGQw"] },
    { id: "s239", t: "Volví a nacer", a: "Carlos Vives", g: "Latino", ids: ["TrUc0XlNoPs", "kl9jpuQVETs", "z-NZhvemo2c"] },
    { id: "s240", t: "Robarte un beso", a: "Carlos Vives", g: "Latino", ids: ["smgLCk7MhKg", "igcWtQtK02o", "Byy4NL5A7I4"] },
    { id: "s241", t: "María", a: "Ricky Martin", g: "Latino", ids: ["YcFRSbk9A_Y", "1IXyPdw8Um4", "U-jedl5_RW4"] },
    { id: "s242", t: "Vente pa' ca", a: "Ricky Martin", g: "Latino", ids: ["zSE_QCbRRJA", "8YbH9tlgwVM", "X81EKNhpuOA"] },
    { id: "s243", t: "Experiencia religiosa", a: "Enrique Iglesias", g: "Baladas", ids: ["ITjerc_pQu4", "gYxGX1Jjd-0", "QsoKs1T8yIc"] },
    { id: "s244", t: "Súbeme la radio", a: "Enrique Iglesias", g: "Latino", ids: ["J8DP0SI_g14", "HAQBPpVZzVw", "uGlOQb91S2g"] },
    { id: "s245", t: "Échame la culpa", a: "Luis Fonsi", g: "Latino", ids: ["Zg06YxALGVw", "YWVOWq4BKhY", "Vqhb-53W4Vo"] },
    { id: "s246", t: "Lo que pasó, pasó", a: "Daddy Yankee", g: "Latino", ids: ["LcPUPXPq5zo", "BwtQCh8Angw", "uzokQscYR58"] },
    { id: "s247", t: "Dile", a: "Don Omar", g: "Latino", ids: ["wfZkFAeGbJc", "POI--mDwrcU", "JzTMNgtXMsU"] },
    { id: "s248", t: "Rakata", a: "Wisin y Yandel", g: "Latino", ids: ["PHnw_IUcNDk", "UavVSspozUY", "LNs68NciWo4"] },
    { id: "s249", t: "Dakiti", a: "Bad Bunny", g: "Latino", ids: ["Xi5HanixCsI", "g9eD8uyDUWA", "xMKV340XvS0"] },
    { id: "s250", t: "Me porto bonito", a: "Bad Bunny", g: "Latino", ids: ["PciLKmN17Ek", "zGaklJWgrwE", "_xZR9ysnF6A"] },
    { id: "s251", t: "Bichota", a: "Karol G", g: "Latino", ids: ["Mm98_7akE50", "QoK-jlyYtN8", "L8Mvk5ylp3I"] },
    { id: "s252", t: "Mayores", a: "Becky G", g: "Latino", ids: ["vdUIHEOaUqw", "D5i6DqQSXfk", "wkUSUD1gQ0A"] },
    { id: "s253", t: "Taki Taki", a: "Ozuna", g: "Latino", ids: ["QAiDXelc9-I", "YIcttxPCaZ0", "C9YfOPiwjaM"] },
    { id: "s254", t: "Vida de rico", a: "Camilo", g: "Latino", ids: ["9_LrFrRi264", "t92agGMLI4g", "j2VZZubQozI"] },
    { id: "s255", t: "Tacones rojos", a: "Sebastián Yatra", g: "Latino", ids: ["5kTywfvLzw4", "MkplGauFLjM", "97UdSkmWmT8"] },
    { id: "s256", t: "Traicionera", a: "Sebastián Yatra", g: "Latino", ids: ["ycY-pabdWbg", "P85WwAzp4m0", "SB5HyF6OBcw"] },
    { id: "s257", t: "La Bachata", a: "Manuel Turizo", g: "Latino", ids: ["QNZkxrcwQAE", "LZR5iM8mxak", "uKOOnFE70EA"] },
    { id: "s258", t: "Eres mía", a: "Romeo Santos", g: "Latino", ids: ["p9gk5wjP8DE", "eupJ1SCfd30", "B7wBZ41hk7c"] },
    { id: "s259", t: "Obsesión", a: "Aventura", g: "Latino", ids: ["FtJBFjiTF9M", "9uFseR6QPsY", "2ukYhkE6BtI"] },
    { id: "s260", t: "Burbujas de amor", a: "Juan Luis Guerra", g: "Latino", ids: ["s1G_7FCDtQQ", "66kn_N3WPls", "ueGTVQckkOc"] },
    { id: "s261", t: "La bilirrubina", a: "Juan Luis Guerra", g: "Latino", ids: ["8ChGap8co98", "Km1nV6nbXh4", "TdWv1aqbA38"] },
    { id: "s262", t: "Quimbara", a: "Celia Cruz", g: "Latino", ids: ["p0N-JwvICAc", "FqrfKifyfYI", "rx11V28s_a8"] },
    { id: "s263", t: "Ahora quién", a: "Marc Anthony", g: "Latino", ids: ["9mAr1eDTRvo", "qaj0UzV7His", "A_0Ny4FR9cw"] },
    { id: "s264", t: "Suavemente", a: "Elvis Crespo", g: "Latino", ids: ["J12-H5MnPFo", "_Wm454Unz8I", "L9uRYgSYOqU"] },
    { id: "s265", t: "Clavado en un bar", a: "Maná", g: "Latino", ids: ["JNsBOYtP4Vw", "H5RoAF6teWY", "-NhDxrvnk0A"] },
    { id: "s266", t: "Vivir sin aire", a: "Maná", g: "Baladas", ids: ["lcNBru4Ir-0", "cD52Atet00c", "_exx4Yus8O0"] },
    { id: "s267", t: "Espacio sideral", a: "Jesse & Joy", g: "Latino", ids: ["qygmskKM-M8", "9FzQkgAhEnU", "NiXgaKMGCXg"] },
    { id: "s268", t: "Yo quisiera", a: "Reik", g: "Baladas", ids: ["3rABQ6a5qmI", "cmvLun8rOsI", "2VMa3uo4kj8"] },
    { id: "s269", t: "Todo cambió", a: "Camila", g: "Baladas", ids: ["TXrC_raRhXs", "Dtn2hdQEm6w", "iFDvhHAt-nE"] },
    { id: "s270", t: "Ahora te puedes marchar", a: "Luis Miguel", g: "Baladas", ids: ["cCvwZVKXu1g", "GdtrjGQ-AqA", "EU2fnpp7jjw"] },
    { id: "s271", t: "Culpable o no", a: "Luis Miguel", g: "Baladas", ids: ["5yqKnzvSkIE", "L5_3e5Fqh0M", "VM7wrJLCg1I"] },
    { id: "s272", t: "Como quien pierde una estrella", a: "Alejandro Fernández", g: "Baladas", ids: ["gMlxt_58cA8", "2IFt1zibQRQ", "HTI3EzsWkEM"] },
    { id: "s273", t: "El rey", a: "Vicente Fernández", g: "Latino", ids: ["i6CBH_jDkD8", "hPxaiOOz64g", "CMexMANlOQw"] },
    { id: "s274", t: "Mío", a: "Paulina Rubio", g: "Latino", ids: ["u78eogBRdiM", "tUPfUA0J4QM", "RP0TY-yPcRw"] },
    { id: "s275", t: "Todos me miran", a: "Gloria Trevi", g: "Latino", ids: ["1EuBPfJ713c", "6E6o1zyVces", "CldBT_dXqKI"] },
    { id: "s276", t: "Bidi bidi bom bom", a: "Selena", g: "Latino", ids: ["UyrSXfceyYc", "5trvteiwpvQ", "XdYIJmJmJ-0"] },
    { id: "s277", t: "Persiana americana", a: "Soda Stereo", g: "Rock", ids: ["DCiW03wZf7A", "BFUyHZvFiJo", "01EsDGltai4"] },
    { id: "s278", t: "Lamento boliviano", a: "Los Enanitos Verdes", g: "Rock", ids: ["jy8qazh_TiI", "nz9wLfUfbn4", "P6xy7zGkyUM"] },
    { id: "s279", t: "Tren al sur", a: "Los Prisioneros", g: "Rock", ids: ["wmxgFa_RHDQ", "aCWE1fGBiTw", "7YGU2tv0D3Y"] },
    { id: "s280", t: "Eres", a: "Café Tacvba", g: "Rock", ids: ["5AYv3K50gpg", "su7Hll9KFBA", "7nafYB-lztQ"] },
    { id: "s281", t: "La negra Tomasa", a: "Caifanes", g: "Rock", ids: ["_LA-sj8DwXM", "6RnekSbw-JQ", "3riU0ISvHA0"] },
    { id: "s282", t: "Flaca", a: "Andrés Calamaro", g: "Rock", ids: ["Xkxkm_GV6Cg", "Mf8K3mJPQsg", "lj9CwmRfFDQ"] },
    { id: "s283", t: "Mariposa tecknicolor", a: "Fito Páez", g: "Rock", ids: ["lKBRWm0z82s", "8rPL77v1ktk", "hTkTpB0XkcE"] },
    { id: "s284", t: "Olvídame y pega la vuelta", a: "Pimpinela", g: "Baladas", ids: ["cQWD8JZQPXE", "5PXVycKX-3w", "Zgx69cRycn8"] },
    { id: "s285", t: "Tiempo de vals", a: "Chayanne", g: "Baladas", ids: ["y-WYYIFYbLU", "9AENWLkYFIY", "Yzyi_mAHuKw"] },
    { id: "s286", t: "Historia de taxi", a: "Ricardo Arjona", g: "Baladas", ids: ["57vCvis8KzY", "gWNZTIEunHg", "ytDGmBFvKWY"] },
    { id: "s287", t: "Te amo", a: "Franco de Vita", g: "Baladas", ids: ["rR8rvnF1IWE", "8v2zlgn-WdE", "uzufpS4qPkM"] },
    { id: "s288", t: "Me va a extrañar", a: "Ricardo Montaner", g: "Baladas", ids: ["_Be6U2nGGx4", "rt60pOcwl7I", "M9jyDNt8Xb8"] },
    { id: "s289", t: "Se fue", a: "Laura Pausini", g: "Baladas", ids: ["ASzZCnEZiMo", "AgHav3t7eMM", "T14iGEBDHEo"] },
    { id: "s290", t: "Otra como tú", a: "Eros Ramazzotti", g: "Baladas", ids: ["8cV2X0vSWJM", "OdsPx76Lm8E", "_oPlB60yMHI"] },
    { id: "s291", t: "Laura no está", a: "Nek", g: "Baladas", ids: ["zKCnC1WsK9Q", "IlH5KST92qA", "GH6M4cOfp7s"] },
    { id: "s292", t: "I Want to Break Free", a: "Queen", g: "Clásicos", ids: ["y_IIuMX0rHA", "vJez0_Ql2gY", "JUUvJK-9zfA"] },
    { id: "s293", t: "Black or White", a: "Michael Jackson", g: "Clásicos", ids: ["F5L--x9rC-Y", "8aWu3kxjUvI", "sLQfzGEo724"] },
    { id: "s294", t: "Wanted Dead or Alive", a: "Bon Jovi", g: "Rock", ids: ["RlK9pfsYwZo", "SVhO4r_g0Rw", "zNDT0SdLPF4"] },
    { id: "s295", t: "Highway to Hell", a: "AC/DC", g: "Rock", ids: ["oEuBzpKF3X8", "cnDxLTmaomc", "9ud9LX5amJ4"] },
    { id: "s296", t: "Summer of '69", a: "Bryan Adams", g: "Rock", ids: ["CDPujxEQq60", "KcRzzmWyS2w", "9N4SRu2dbCg"] },
    { id: "s297", t: "Another One Bites the Dust", a: "Queen", g: "Clásicos", ids: ["u7b3v7055gU", "erc7I8GCvkU", "MFrWqzTxpqE"] },
    { id: "s298", t: "Every Breath You Take", a: "The Police", g: "Clásicos", ids: ["gKjIiaAXfDs", "m1IuB25aLsY", "4C7Fmg3_mkw"] },
    { id: "s299", t: "Take On Me", a: "a-ha", g: "Clásicos", ids: ["bC4ER15Hj10", "IK8er6b363U", "8gCZcyp1dTw"] },
    { id: "s300", t: "Celebration", a: "Kool & The Gang", g: "Clásicos", ids: ["zPPCNwktsD4", "Cm_rQ1YUcsw", "0lYvEZauFIo"] },
    { id: "s301", t: "Last Christmas", a: "Wham!", g: "Clásicos", ids: ["kaBRnhxPLdE", "s6z1xazpGJ4", "X4QkYPYIzoY"] },
    { id: "s302", t: "Super Trouper", a: "ABBA", g: "Clásicos", ids: ["QAw2A7jCI50", "7m1Tor6D39E", "Dhp4W24Skvw"] },
    { id: "s303", t: "Rasputin", a: "Boney M", g: "Clásicos", ids: ["sJZOoWKaM84", "y4LDoGfhHMM", "D5LfyZt1trY"] },
    { id: "s304", t: "Can't Take My Eyes Off You", a: "Gloria Gaynor", g: "Clásicos", ids: ["p07d9PFGCa4", "u_072m3oWT0", "xf79d4zlvvk"] },
    { id: "s305", t: "Sex Bomb", a: "Tom Jones", g: "Clásicos", ids: ["1K5wUJk46VI", "ovEyHLTGsoc", "7zrNrnl18tA"] },
    { id: "s306", t: "My Way", a: "Frank Sinatra", g: "Clásicos", ids: ["tAEek8nO11c", "FxSEO0MW3EA", "Rx-vOb5Q_BU"] },
    { id: "s307", t: "Suspicious Minds", a: "Elvis Presley", g: "Clásicos", ids: ["Z6Zr01BfjBM", "7tHojPH74ps", "BFpzLt99e_c"] },
    { id: "s308", t: "Let It Be", a: "The Beatles", g: "Clásicos", ids: ["OhRUYf_yn_s", "KSRDIB1BQ08", "7_xoAXYm6PY"] },
    { id: "s309", t: "Twist and Shout", a: "The Beatles", g: "Clásicos", ids: ["GLm3ZryQxYg", "wf_uABo-ljc", "h1EtE3ayOUQ"] },
    { id: "s310", t: "Stand by Me", a: "Ben E. King", g: "Clásicos", ids: ["OU3699R53rs", "tGykL2bUOyY", "tWO88Hz5gbI"] },
    { id: "s311", t: "Respect", a: "Aretha Franklin", g: "Clásicos", ids: ["xEQw0C0SYEI", "olkB26ynYlk", "Gb9wdipKsDQ"] },
    { id: "s312", t: "Man! I Feel Like a Woman!", a: "Shania Twain", g: "Pop", ids: ["DRreY8aw3CE", "MV0WIBhycdA", "VwVuEZeM264"] },
    { id: "s313", t: "Complicated", a: "Avril Lavigne", g: "Pop", ids: ["vnsZ6VrprHw", "y9N9t8QwQLs", "PJCWNWoALZo"] },
    { id: "s314", t: "Roar", a: "Katy Perry", g: "Pop", ids: ["hMF4h0gYN-0", "8A_1q4xiWiI", "mrwmKZQYpRg"] },
    { id: "s315", t: "Halo", a: "Beyoncé", g: "Pop", ids: ["GuOye1zkJIw", "xB6qOBhQzrg", "lXEEDZiqHcc"] },
    { id: "s316", t: "Umbrella", a: "Rihanna", g: "Pop", ids: ["sLkaNT0y7C4", "xCJtwKRysQU", "NRMYKGHNCjg"] },
    { id: "s317", t: "Just Give Me a Reason", a: "Pink", g: "Pop", ids: ["SJVH11MFY7I", "0qE3egNettY", "JQZInTDAti0"] },
    { id: "s318", t: "Beautiful", a: "Christina Aguilera", g: "Pop", ids: ["bkkkbniDtHA", "2NdCPJkagps", "7gVhjzx-H6A"] },
    { id: "s319", t: "All I Want for Christmas Is You", a: "Mariah Carey", g: "Pop", ids: ["w_6GOrQob5o", "9UymLTtfJak", "S2oL0DD4Vvo"] },
    { id: "s320", t: "Angels", a: "Robbie Williams", g: "Pop", ids: ["pGFEj-Dv3-0", "Bl4RIPYN8Sc", "f_syy-8FGYg"] },
    { id: "s321", t: "Just the Way You Are", a: "Bruno Mars", g: "Pop", ids: ["3NY_dEEcY-A", "_fDl6h5a1Mg", "DIC1AzEgnnw"] },
    { id: "s322", t: "Thinking Out Loud", a: "Ed Sheeran", g: "Pop", ids: ["Dd9W3PthynU", "5Ub9h3JK3Ps", "wsfOZehhML8"] },
    { id: "s323", t: "Hello", a: "Adele", g: "Pop", ids: ["FTVvjIExtAU", "uYHITNpdgkc", "Ipq2geYz6xw"] },
    { id: "s324", t: "Skyfall", a: "Adele", g: "Pop", ids: ["UadrtR56n6s", "_4EiHV-y9D0", "tOGTcsley1U"] },
    { id: "s325", t: "Stay with Me", a: "Sam Smith", g: "Pop", ids: ["7C8034DlmIM", "obg_4jI_cKE", "eVWEPM0blxw"] },
    { id: "s326", t: "Blinding Lights", a: "The Weeknd", g: "Pop", ids: ["Cj4hcXZs3Lc", "LEdBLhABQRs", "GgcyCJEEpbg"] },
    { id: "s327", t: "Levitating", a: "Dua Lipa", g: "Pop", ids: ["nK9hD9_SAdU", "j6ktiPUmgmQ", "RLgUFh-EDkE"] },
    { id: "s328", t: "Bad Guy", a: "Billie Eilish", g: "Pop", ids: ["GsFlbMS7UIc", "l1aVSxQIWAw", "fiigx8wPa-A"] },
    { id: "s329", t: "Drivers License", a: "Olivia Rodrigo", g: "Pop", ids: ["C3y6jGCXiUA", "8eFjmRmg6hg", "rJVCXhhA_Eo"] },
    { id: "s330", t: "Believer", a: "Imagine Dragons", g: "Rock", ids: ["sfbCZw_c2Zs", "_7qp0JMxOTs", "CWK4s9N6YQ8"] },
    { id: "s331", t: "In the End", a: "Linkin Park", g: "Rock", ids: ["uIcmAyAJ5hE", "8RvzsS4xrjY", "iIgaExNlpuk"] },
    { id: "s332", t: "Boulevard of Broken Dreams", a: "Green Day", g: "Rock", ids: ["r8BdFXaYE8s", "r8J_ie1rMCo", "gOyuXwRirts"] },
    { id: "s333", t: "Californication", a: "Red Hot Chili Peppers", g: "Rock", ids: ["6TDgsAYz6KY", "GOIFq6bzABk", "QNtwIgEr9Bo"] },
    { id: "s334", t: "Runaway", a: "Bon Jovi", g: "Rock", ids: ["wZU1mA6xQkQ", "ffnM5gds1WE", "Y8mRVFRxMsw"] },
    { id: "s335", t: "Rehab", a: "Amy Winehouse", g: "Pop", ids: ["RQZscYrhLtA", "0DymyccRbuU", "w42pSGRICag"] },
    { id: "s336", t: "Bad Romance", a: "Lady Gaga", g: "Pop", ids: ["Ep0-h-rGHRk", "Z7sHRNNElDE", "pyp2fnjiegU"] },
    { id: "s337", t: "Poker Face", a: "Lady Gaga", g: "Pop", ids: ["kTu2QPghqZU", "hR_A0nAPAF8", "doA8KDluIrU"] },
    { id: "s338", t: "Like a Virgin", a: "Madonna", g: "Clásicos", ids: ["3XKP4ffgXLE", "6Uepuv3IF6c", "a3dKSsAtwzA"] },
    { id: "s339", t: "Believe", a: "Cher", g: "Pop", ids: ["n24s-klOW0c", "fIxg46Q5BJM", "UveQwEtU5ds"] },
    { id: "s340", t: "Happy", a: "Pharrell Williams", g: "Pop", ids: ["76vLNqL7-8w", "E6lXTnY5bBo", "WfiQVkFk9So"] },
    { id: "s341", t: "Before You Go", a: "Lewis Capaldi", g: "Pop", ids: ["5_3hSGhcuo0", "Ope9onJ_yjs", "ZJkhKQuunDY"] },
    { id: "s342", t: "Fix You", a: "Coldplay", g: "Pop", ids: ["yI2T7_wvOJs", "fRCgSvuWkQw", "PK2U2kkqAL4"] }
  ];

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rand(n, alphabet) {
    alphabet = alphabet || "abcdefghijklmnopqrstuvwxyz0123456789";
    var out = "", buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    for (var i = 0; i < n; i++) out += alphabet[buf[i] % alphabet.length];
    return out;
  }

  function hash(str) {
    var data = window.__utf8 ? window.__utf8("tarima:" + str) : new TextEncoder().encode("tarima:" + str);
    var subtle = window.crypto && (window.crypto.subtle || window.crypto.webkitSubtle);
    if (!subtle || !window.__sha256hex) {
      return subtle ? subtle.digest("SHA-256", data).then(hex) : Promise.resolve(window.__sha256hex(data));
    }
    return Promise.resolve().then(function () { return subtle.digest("SHA-256", data); }).then(hex, function () { return window.__sha256hex(data); });
  }
  // PARTIENDO LA TARIMA logo, Hollywood-sign style (needs brand.css). small = letters only.
  function logo(small) {
    var k = 0, rot = [-3, 2, -1, 3, -2, 1, -3, 2, 0, -2, 3, -1, 2, -3, 1, -2, 3];
    function line(txt, cls) {
      return '<span class="hw-l' + (cls ? " " + cls : "") + '">' + txt.split("").map(function (ch) {
        if (ch === " ") return '<span class="hw-c sp"></span>';
        var i = k++, r = rot[i % rot.length];
        return '<span class="hw-c" style="--r:' + r + "deg;--y:" + ((i * 7) % 5 - 2) * 0.02 + "em;--d:" + (i * 0.07).toFixed(2) + 's">' + ch + "</span>";
      }).join("") + "</span>";
    }
    return '<div class="hw' + (small ? " sm" : "") + '" role="img" aria-label="Partiendo la Tarima">' + (small ? "" : '<i class="hw-beam b1"></i><i class="hw-beam b2"></i>') +
      line("PARTIENDO") + line("LA TARIMA", "hw-big") + (small ? "" : '<i class="hw-hill"></i>') + "</div>";
  }
  function hex(b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ("0" + x.toString(16)).slice(-2); }).join(""); }

  // Accepts youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, music.youtube.com, or a bare 11-char id.
  function ytId(text) {
    if (!text) return null;
    text = String(text).trim();
    if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
    var m = text.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function playlistId(text) {
    if (!text) return null;
    var m = String(text).match(/[?&]list=([A-Za-z0-9_-]{10,})/);
    if (m) return m[1];
    return /^(PL|OL|UU|RD)[A-Za-z0-9_-]{10,}$/.test(String(text).trim()) ? String(text).trim() : null;
  }

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function initials(t) {
    return String(t || "?").split(/\s+/).filter(function (w) { return /^[A-Za-zÀ-ÿ0-9]/.test(w); })
      .slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase() || "♪";
  }

  function hue(s) {
    var h = 0; s = String(s || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  function art(title, px) {
    var h = hue(title);
    return '<div class="art" style="width:' + px + "px;height:" + px + "px;font-size:" + Math.round(px * 0.34) +
      "px;background:linear-gradient(135deg,hsl(" + h + " 80% 55%),hsl(" + ((h + 50) % 360) + ' 70% 30%))">' + esc(initials(title)) + "</div>";
  }

  function avatar(name, px) {
    px = px || 22;
    return '<span class="av" style="width:' + px + "px;height:" + px + "px;font-size:" + Math.round(px * 0.45) +
      "px;background:hsl(" + hue(name) + ' 60% 45%)">' + esc(String(name || "?").charAt(0).toUpperCase()) + "</span>";
  }

  function store(key, val) {
    try {
      if (val === undefined) { var v = localStorage.getItem("tarima." + key); return v ? JSON.parse(v) : null; }
      if (val === null) localStorage.removeItem("tarima." + key);
      else localStorage.setItem("tarima." + key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* Connect to every broker at once; publish to all, and drop duplicates on receive.
     subs: topics to subscribe. onMessage(topic, obj). onStatus(connectedCount). */
  function connect(subs, onMessage, onStatus) {
    var clients = [], seen = {}, seenList = [];
    function count() { return clients.filter(function (c) { return c.connected; }).length; }
    if (typeof mqtt === "undefined") { if (onStatus) onStatus(0, "nolib"); return { publish: function () {}, count: count }; }
    BROKERS.forEach(function (url) {
      var c;
      try {
        c = mqtt.connect(url, { clientId: "tarima_" + rand(12), reconnectPeriod: 3000, connectTimeout: 10000, clean: true, keepalive: 30 });
      } catch (e) { return; }
      c.on("connect", function () {
        subs.forEach(function (s) { c.subscribe(s, { qos: 1 }); });
        if (onStatus) onStatus(count());
      });
      c.on("close", function () { if (onStatus) onStatus(count()); });
      c.on("error", function () {});
      c.on("message", function (topic, buf) {
        var m;
        try { m = JSON.parse(buf.toString()); } catch (e) { return; }
        if (m && m.mid) {
          var key = topic + "|" + m.mid;
          if (seen[key]) return;
          seen[key] = 1; seenList.push(key);
          if (seenList.length > 400) delete seen[seenList.shift()];
        }
        onMessage(topic, m);
      });
      clients.push(c);
    });
    return {
      count: count,
      publish: function (topic, obj, retain) {
        var o = Object.assign({}, obj, { mid: rand(10) });
        var s = JSON.stringify(o);
        clients.forEach(function (c) { if (c.connected) c.publish(topic, s, { qos: 1, retain: !!retain }); });
      },
      clear: function (topic) { clients.forEach(function (c) { if (c.connected) c.publish(topic, "", { qos: 1, retain: true }); }); },
      subscribe: function (topic) { clients.forEach(function (c) { if (c.connected) c.subscribe(topic, { qos: 1 }); }); subs.push(topic); }
    };
  }

  function topics(code) {
    var base = "tarima/v1/" + String(code).toUpperCase();
    return { base: base, state: base + "/state", cmd: base + "/cmd", config: base + "/config", catalog: base + "/catalog", say: base + "/say",
      av: function (cid) { return base + "/av/" + cid; }, avAll: base + "/av/+", res: function (cid) { return base + "/res/" + cid; } };
  }

  // Party passwords ignore case and spaces at the ends, so phone keyboards can't break them.
  function pw(s) { return String(s == null ? "" : s).trim().toLowerCase(); }

  /* ---------- YouTube catalog and search (needs a YouTube Data API key) ---------- */
  // Trusted karaoke channels. "id" when known; otherwise resolved once from "handle" or "q".
  var CHANNELS = [
    { name: "Sing King", id: "UCwTRjvjVge51X-ILJ4i22ew", handle: "@singkingkaraoke" },
    { name: "KaraFun", handle: "@karafun", q: "KaraFun Karaoke" },
    { name: "Stingray Karaoke", handle: "@StingrayKaraoke", q: "Stingray Karaoke" },
    { name: "KaraokeMedia (español)", id: "UCmV_ZCnAAj5DbkUqpBC_CDg", q: "KaraokeMedia karaoke español" }
  ];
  var YT = "https://www.googleapis.com/youtube/v3/";
  function ytGet(path, params, key) {
    var qs = Object.keys(params).map(function (k) { return k + "=" + encodeURIComponent(params[k]); }).join("&");
    return fetch(YT + path + "?" + qs + "&key=" + encodeURIComponent(key)).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) { var e = new Error((j.error.errors && j.error.errors[0] && j.error.errors[0].reason) || j.error.message || "youtube"); e.yt = j.error; throw e; }
      return j;
    });
  }
  function decodeHtml(s) { var t = document.createElement("textarea"); t.innerHTML = s; return t.value; }
  // "Queen - Bohemian Rhapsody (Karaoke Version)" -> "Queen - Bohemian Rhapsody"
  function cleanTitle(t) {
    t = decodeHtml(String(t || ""));
    t = t.replace(/[\(\[\{][^\)\]\}]*(karaok|version|versión|lyric|letra|instrumental|official|oficial|hd|4k)[^\)\]\}]*[\)\]\}]/gi, "");
    t = t.split("|")[0];
    t = t.replace(/\bkaraok[eê]\b/gi, "").replace(/\s{2,}/g, " ").replace(/\s*[-–:]\s*$/, "").trim();
    return t || "Vídeo de YouTube";
  }
  function isoSecs(d) { var m = String(d || "").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/); return m ? (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0) : 0; }
  function resolveChannel(c, key) {
    if (c.id) return Promise.resolve(c.id);
    var byHandle = c.handle ? ytGet("channels", { part: "id", forHandle: c.handle }, key).then(function (j) { return j.items && j.items[0] && j.items[0].id; }) : Promise.resolve(null);
    return byHandle.catch(function () { return null; }).then(function (id) {
      if (id || !c.q) return id;
      return ytGet("search", { part: "snippet", type: "channel", maxResults: 1, q: c.q }, key).then(function (j) { return j.items && j.items[0] && j.items[0].id.channelId; });
    });
  }
  // Latest uploads of each trusted channel (about 1 quota unit per 50 videos).
  function syncCatalog(key, channels, perChannel) {
    perChannel = perChannel || 150;
    var out = [], resolved = [];
    return channels.reduce(function (p, c) {
      return p.then(function () {
        return resolveChannel(c, key).then(function (id) {
          if (!id) return;
          resolved.push({ name: c.name, id: id, handle: c.handle || "", q: c.q || "" });
          var pl = "UU" + id.slice(2), got = 0;
          var page = function (tok) {
            var prm = { part: "snippet", playlistId: pl, maxResults: 50 }; if (tok) prm.pageToken = tok;
            return ytGet("playlistItems", prm, key).then(function (j) {
              (j.items || []).forEach(function (it) {
                var sn = it.snippet, vid = sn.resourceId && sn.resourceId.videoId;
                if (!vid || /private|deleted/i.test(sn.title)) return;
                if (!/karaok/i.test(sn.title)) return;
                out.push({ vid: vid, t: cleanTitle(sn.title), ch: c.name, best: true });
              });
              got += 50;
              if (j.nextPageToken && got < perChannel) return page(j.nextPageToken);
            });
          };
          return page();
        }).catch(function () {});
      });
    }, Promise.resolve()).then(function () { return { items: out, channels: resolved, at: Date.now() }; });
  }
  /* Search all of YouTube. mode "karaoke": title must say karaoke, 2-8 min. mode "music": 1.5-10 min, music category.
     Trusted channels and the most viewed come first; versions marked with ads go last. */
  function searchYT(q, key, mode, trustedIds, adSet) {
    var karaoke = mode !== "music";
    var prm = { part: "snippet", type: "video", videoEmbeddable: "true", maxResults: 50, q: karaoke ? q + " karaoke" : q };
    if (!karaoke) prm.videoCategoryId = "10";
    return ytGet("search", prm, key).then(function (j) {
      var ids = (j.items || []).map(function (it) { return it.id && it.id.videoId; }).filter(Boolean);
      if (!ids.length) return [];
      return ytGet("videos", { part: "snippet,contentDetails,statistics,status", id: ids.join(",") }, key).then(function (v) {
        var min = karaoke ? 120 : 90, max = karaoke ? 480 : 600;
        return (v.items || []).filter(function (it) {
          var d = isoSecs(it.contentDetails.duration);
          if (it.status && it.status.embeddable === false) return false;
          if (d < min || d > max) return false;
          if (karaoke && !/karaok/i.test(it.snippet.title)) return false;
          return true;
        }).map(function (it) {
          var best = karaoke && trustedIds.indexOf(it.snippet.channelId) >= 0;
          return { vid: it.id, t: karaoke ? cleanTitle(it.snippet.title) : decodeHtml(it.snippet.title), ch: decodeHtml(it.snippet.channelTitle), best: best,
            ads: !!(adSet && adSet[it.id]), views: +(it.statistics && it.statistics.viewCount) || 0, dur: isoSecs(it.contentDetails.duration) };
        }).sort(function (a, b) { return (a.ads - b.ads) || (b.best - a.best) || (b.views - a.views); }).slice(0, 25);
      });
    });
  }

  /* ---------- guest tastes ---------- */
  var TASTES = [
    { k: "espanol", label: "Pop español", genres: ["Española"] },
    { k: "latino", label: "Latino y reggaetón", genres: ["Latino"] },
    { k: "clasicos", label: "Clásicos 70-80-90", genres: ["Clásicos"] },
    { k: "baladas", label: "Baladas", genres: ["Baladas"] },
    { k: "rock", label: "Rock", genres: ["Rock"] },
    { k: "pop", label: "Pop internacional", genres: ["Pop"] },
    { k: "urbano", label: "Rap y urbano", genres: ["Latino"] }
  ];
  function artistsOf(g) { return String((g && g.artists) || "").split(/[,;\n]+/).map(function (a) { return norm(a).trim(); }).filter(function (a) { return a.length > 1; }); }
  // How well a song fits a guest: favourite artist 3, favourite style 2, nothing 0.
  function fit(song, g) {
    var title = norm((song.t || "") + " " + (song.a || ""));
    if (artistsOf(g).some(function (a) { return title.indexOf(a) >= 0; })) return 3;
    var genres = [];
    TASTES.forEach(function (t) { if ((g.tastes || []).indexOf(t.k) >= 0) genres = genres.concat(t.genres); });
    if (song.g && genres.indexOf(song.g) >= 0) return 2;
    // channel catalog songs carry no genre: match the base catalog's artists of those styles
    if (!song.g && genres.length && CATALOG.some(function (b) { return genres.indexOf(b.g) >= 0 && title.indexOf(norm(b.a.split(" y ")[0])) >= 0; })) return 2;
    return 0;
  }

  /* ---------- festive selfie: crop, then draw a hat, glasses and confetti on top ---------- */
  function festive(file, accent) {
    accent = accent || "#ff3d7f";
    return new Promise(function (res, rej) {
      var fr = new FileReader(); fr.onerror = rej;
      fr.onload = function () {
        var img = new Image(); img.onerror = rej;
        img.onload = function () {
          var S = 320, cv = document.createElement("canvas"); cv.width = cv.height = S;
          var g = cv.getContext("2d");
          var side = Math.min(img.width, img.height), sx = (img.width - side) / 2, sy = (img.height - side) / 2;
          // leave head-room for the hat: crop a bit lower on portraits
          if (img.height > img.width) sy = Math.max(0, (img.height - side) * 0.35);
          g.drawImage(img, sx, sy, side, side, 0, 0, S, S);
          var face = { x: S * 0.29, y: S * 0.3, w: S * 0.42, h: S * 0.5 };
          var done = function () { decorate(g, S, face, accent); res(cv.toDataURL("image/jpeg", 0.72)); };
          if (window.FaceDetector) {
            try {
              new FaceDetector({ maxDetectedFaces: 1, fastMode: true }).detect(cv).then(function (f) {
                if (f && f[0]) { var b = f[0].boundingBox; face = { x: b.x, y: b.y, w: b.width, h: b.height }; }
                done();
              }).catch(done);
            } catch (e) { done(); }
          } else done();
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }
  function decorate(g, S, f, accent) {
    var r = Math.random, cx = f.x + f.w / 2, top = f.y + f.h * 0.06;
    // warm party light
    var grd = g.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75);
    grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, accent + "88");
    g.fillStyle = grd; g.fillRect(0, 0, S, S);
    var hat = Math.floor(r() * 3);
    g.save(); g.translate(cx, top); g.rotate((r() - 0.5) * 0.35);
    var w = f.w * 1.05;
    if (hat === 0) {            // party cone
      var h = w * 1.05;
      g.beginPath(); g.moveTo(-w * 0.42, 0); g.lineTo(0, -h); g.lineTo(w * 0.42, 0); g.closePath();
      g.fillStyle = accent; g.fill();
      g.save(); g.clip(); g.strokeStyle = "#ffd23f"; g.lineWidth = w * 0.09;
      for (var i = -3; i < 6; i++) { g.beginPath(); g.moveTo(-w, -h * 0.18 * i); g.lineTo(w, -h * 0.18 * i - h * 0.35); g.stroke(); }
      g.restore();
      g.fillStyle = "#fff"; g.beginPath(); g.arc(0, -h, w * 0.1, 0, 6.3); g.fill();
      g.fillStyle = "#ffd23f"; g.fillRect(-w * 0.46, -w * 0.05, w * 0.92, w * 0.1);
    } else if (hat === 1) {     // crown
      var ch = w * 0.5;
      g.beginPath(); g.moveTo(-w * 0.45, 0);
      [-0.45, -0.3, -0.15, 0, 0.15, 0.3, 0.45].forEach(function (k, i) { g.lineTo(w * k, i % 2 ? -ch * 0.45 : -ch); });
      g.lineTo(w * 0.45, 0); g.closePath();
      var gold = g.createLinearGradient(0, -ch, 0, 0); gold.addColorStop(0, "#fff3a0"); gold.addColorStop(1, "#e5a400");
      g.fillStyle = gold; g.fill(); g.strokeStyle = "#a86f00"; g.lineWidth = 3; g.stroke();
      ["#ff3d7f", "#3db8ff", "#3ddc97"].forEach(function (c, i) { g.fillStyle = c; g.beginPath(); g.arc(w * (i - 1) * 0.25, -ch * 0.22, w * 0.05, 0, 6.3); g.fill(); });
    } else {                    // top hat
      var th = w * 0.75;
      g.fillStyle = "#16121c"; g.fillRect(-w * 0.55, -w * 0.08, w * 1.1, w * 0.12);
      g.fillRect(-w * 0.33, -th, w * 0.66, th);
      g.fillStyle = accent; g.fillRect(-w * 0.33, -w * 0.25, w * 0.66, w * 0.12);
      g.fillStyle = "#ffd23f"; g.beginPath(); g.arc(w * 0.18, -w * 0.19, w * 0.06, 0, 6.3); g.fill();
    }
    g.restore();
    if (r() < 0.6) {            // party glasses
      var ey = f.y + f.h * 0.42, gw = f.w * 0.36, gh = f.h * 0.16;
      g.save(); g.fillStyle = "rgba(20,10,30,.78)"; g.strokeStyle = r() < 0.5 ? "#ffd23f" : accent; g.lineWidth = 4;
      [-1, 1].forEach(function (k) {
        var x = cx + k * f.w * 0.22 - gw / 2;
        g.beginPath(); if (g.roundRect) g.roundRect(x, ey - gh / 2, gw, gh, gh / 2.2); else g.rect(x, ey - gh / 2, gw, gh);
        g.fill(); g.stroke();
      });
      g.beginPath(); g.moveTo(cx - f.w * 0.04, ey); g.lineTo(cx + f.w * 0.04, ey); g.stroke(); g.restore();
    }
    var cols = ["#ff3d7f", "#ffd23f", "#3db8ff", "#3ddc97", "#a46bff", "#fff"];
    for (var c = 0; c < 70; c++) {
      var x = r() * S, y = r() * S;
      if (x > f.x - 10 && x < f.x + f.w + 10 && y > f.y - 20 && y < f.y + f.h) continue;   // keep the face clear
      g.save(); g.translate(x, y); g.rotate(r() * 6.3); g.fillStyle = cols[c % cols.length]; g.fillRect(-4, -2, 8, 4); g.restore();
    }
    g.lineWidth = 10; g.strokeStyle = accent; g.strokeRect(5, 5, S - 10, S - 10);
  }

  function adminTopic(h) { return "tarima/v1/admin/" + h; }

  var COLORS = { rosa: "#ff3d7f", naranja: "#ff8a3d", amarillo: "#ffc93d", verde: "#3ddc97", azul: "#3db8ff", lila: "#a46bff" };

  // Applies a party's accent colour to the page.
  function applyColor(name) {
    var c = COLORS[name] || COLORS.rosa;
    document.documentElement.style.setProperty("--accent", c);
  }

  function mmss(s) {
    s = Math.max(0, Math.floor(s || 0));
    return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
  }

  function siteBase() {
    return location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  }

  return { BROKERS: BROKERS, CATALOG: CATALOG, esc: esc, rand: rand, hash: hash, logo: logo, TELE: "is.gd/partiendolatarima", SPOTIFY_CLIENT: "", ytId: ytId, playlistId: playlistId, norm: norm,
    initials: initials, pw: pw, TASTES: TASTES, fit: fit, artistsOf: artistsOf, festive: festive, CHANNELS: CHANNELS, ytGet: ytGet, cleanTitle: cleanTitle, syncCatalog: syncCatalog, searchYT: searchYT, resolveChannel: resolveChannel, adminTopic: adminTopic, COLORS: COLORS, applyColor: applyColor, hue: hue, art: art, avatar: avatar, store: store, connect: connect, topics: topics, mmss: mmss, siteBase: siteBase };
})();
