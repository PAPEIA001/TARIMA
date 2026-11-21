# Tarima · karaoke para fiestas (beta)

Web app de karaoke para fiestas privadas. No hay nada que instalar: los invitados entran desde el navegador del móvil y la tele abre una página web.

- **Móviles de los invitados:** `https://papeia001.github.io/TARIMA/`
- **Tele:** `https://papeia001.github.io/TARIMA/tv.html`
- **Panel de administrador:** `https://papeia001.github.io/TARIMA/admin.html`

## Panel de administrador

Crea tu cuenta de administrador (usuario y contraseña) y desde ahí:

- Crea fiestas con nombre, fecha, foto, mensaje de bienvenida, color, estilo de intro y contraseñas propias.
- Cada fiesta tiene su código, su enlace para la tele (`tv.html?f=CÓDIGO`) y su QR para invitar.
- Mira en directo quién canta y la cola de cada fiesta.
- Edita una fiesta en cualquier momento: la tele y los móviles se actualizan solos.
- En Ajustes, pon la clave de la YouTube Data API una vez y se aplica a todas tus fiestas.

Puedes entrar al panel desde cualquier dispositivo con tu usuario y contraseña. Si olvidas la contraseña no se puede recuperar.

## Novedades v6: Reality show + Spotify

- **Modo Reality show** (antes «karaoke»): con Spotify conectado, el karaoke suena desde Spotify (versión karaoke si existe, si no la original) con la letra sincronizada de LRCLIB en la tele. Sin anuncios de YouTube.
- **Modo música solo Spotify**: buscador arriba, categorías (80s, 90s, funk, pop español, latino, actual, rock, himnos), artistas y canciones. 2 canciones por móvil.
- **Música de fondo desde Spotify** en la sala de espera y el concurso; los efectos (redoble, platillos, fanfarria, premio…) siguen sonando encima.
- **17 pruebas nuevas**: cámara lenta, desfile, guitarra invisible, robot, espejo, playback, Óscar, teletienda, prohibido reírse, narrador, conga, baile del animal, baile de boda, imita al protagonista, telenovela, baile sin pies y sillas musicales. Las de baile suenan con la canción original.
- **Preguntas y pruebas de la casa**: el administrador las escribe al crear la fiesta y el moderador las añade y las lanza en directo.
- **Mesa de efectos del moderador**: barra fija abajo con 12 efectos que se pueden lanzar en cualquier momento; Spotify baja un momento para que se oigan.
- **Presentador**: elige las voces de más calidad del dispositivo, evita las voces de broma y no se corta en frases largas.

## Novedades v5: PARTIENDO LA TARIMA

- **Nuevo nombre y logo.** PARTIENDO LA TARIMA, con rótulo tipo Hollywood en la tele, el móvil, el administrador y el moderador. Quien gana la noche es «la estrella que ha partido la tarima».
- **Móvil tipo app.** Iconos, menos texto, baldosas de estilos, buscador con botón de borrar y, en modo música, solo «Pedir», «Cola» y «Fiesta».
- **Buscador arreglado.** Antes, cada letra añadía otro escuchador al buscador y al borrar se colgaba.
- **Preguntas y votaciones en una hoja inferior** con formas ▲ ◆ ● ■; se minimiza en una burbuja tocando fuera.
- **Música propia sin YouTube.** Sala de espera con una canción fiestera generada en el navegador desde el primer segundo, y música de concurso tipo circo en las preguntas.
- **Carteles en recuadro** en tele y móvil.
- **Compatibilidad con Smart TV.** compat.js rellena lo que falta en navegadores antiguos (Samsung Tizen, LG webOS): SHA-256 en JavaScript, Promise, fetch, NodeList.forEach, etc. Las librerías MQTT y QR van en vendor/ (MQTT pasada a ES5), sin depender de CDN. Si algo falla sale un aviso rojo en vez de pantalla negra.
- **Entrada corta para la tele:** tele.html pide solo el código de la fiesta y recuerda la última.

## Novedades v4: Partiendo la Tarima

- **Partiendo la Tarima.** El juego de la noche suma puntos con preguntas, pruebas y el jurado. Al final se elige a la estrella que ha partido la tarima.
- **Pruebas** (cada 2, 3 o 5 canciones, o solo a mano):
  - **Duelo de baile:** dos personas al azar bailan 45 segundos una canción elegida por la app. Luego todos votan en el móvil y el ganador se lleva 500 puntos (250 cada uno si hay empate).
  - **Congelados:** todos bailan; cuando para la música, nadie se mueve.
  - **Adivina la canción:** suena un trozo y se responde con A, B, C o D.
  - **Dúo sorpresa:** dos personas al azar cantan juntas una canción.
  - Si la tele lleva un rato parada, el presentador lanza una prueba por su cuenta.
- **Presentador de reality.** Más gamberro, coloquial y animador, con sintonía de entrada, redoble, aplausos, bocina, trombón triste y música de sala de espera hechos con el navegador (sin archivos ni coste).
- **Panel de moderador** (`mod.html?p=CÓDIGO`): ve la fiesta en directo y lanza efectos, mensajes en la tele (que el presentador puede leer), pruebas, preguntas, puntos del jurado, vaciar la cola o reiniciar la fiesta. Se entra con la clave de moderador (opcional, en Editar fiesta) o con la de anfitrión.
- **Catálogo:** 342 karaokes de unos 200 artistas en español, latinos e internacionales, con estantes por estilo. Con la clave de YouTube, al buscar un artista salen sus karaokes de todo YouTube y el botón «Cantar ya la mejor versión».

## Novedades v3

- **Juego de preguntas tipo concurso.** En modo karaoke, antes de cada canción (o cada 2 o 3, o nunca, se elige en el panel) sale en la tele una pregunta sobre el artista que va a sonar. Todos responden en el móvil con botones grandes A, B, C y D, con 20 segundos. Si aciertas pronto ganas más puntos (de 500 a 1000). Después se ve el ranking, y en el móvil del anfitrión (pestaña Fiesta) está el botón «Ver ganador final» y «Poner puntos a cero». Hay preguntas de unos 70 artistas y de cultura musical general; si el artista no está, sale una general.
- **Presentador con voz.** La tele habla como un presentador de concurso: da la bienvenida, presenta a cada cantante, lee las preguntas, dice quién va ganando y anima a quien no ha cantado. En el panel eliges voz de chica o chico, español de España, latino u otro idioma (inglés, portugués, francés, italiano, alemán) y escribes tus propias frases ({nombre} y {fiesta} se sustituyen solos). Usa las voces del propio aparato, sin coste. Si la tele no tiene voces, elige «En el móvil del anfitrión» y activa «Voz del presentador en este móvil» en la pestaña Fiesta.

## Novedades v2

- **Modo karaoke / modo música.** En el panel de administrador (página de cada fiesta) y en el móvil del anfitrión (pestaña Fiesta) hay un interruptor. En modo música la tele pone vídeos musicales sin intro y cada móvil puede pedir 2 canciones como máximo (el límite se puede quitar o cambiar).
- **Catálogo de los mejores canales de karaoke.** Sing King, KaraFun, Stingray Karaoke y KaraokeMedia (en español). El catálogo se actualiza solo cada día y puedes añadir o quitar canales en Ajustes del panel.
- **Búsqueda filtrada en todo YouTube.** Solo salen vídeos que se pueden ver en la tele, de duración normal y con «karaoke» en el título. Primero salen las de canales de confianza («Mejor versión»).
- **Anuncios.** Los anuncios de YouTube no se pueden quitar sin YouTube Premium. Si una versión tiene anuncios, el anfitrión la marca en la pestaña Cola («Esta versión tiene anuncios») y a partir de ahí se pone la última y se evita.
- **Selfie con disfraz.** Al entrar, cada invitado se hace un selfie y la app le pone un gorro de fiesta, corona o chistera y confeti. Ese avatar sale en grande en la tele cuando le toca cantar.
- **Ánimos en la tele.** Mensajes según los aplausos (botón 👏 en el móvil) y avisos animando a quien todavía no ha cantado.
- **Auto karaoke 🎲.** Elige a alguien que haya cantado poco y una canción según sus gustos. Se puede lanzar a mano o dejarlo continuo.
- **Gustos musicales.** Al entrar, cada invitado marca estilos y artistas favoritos. Con eso se llena «Para ti» en Inicio y Buscar.

## La noche de la fiesta

1. **Enciende la tele** (Samsung) y abre la app **Internet**. Escribe la dirección de la tele (`…/TARIMA/tv.html`) y guárdala en favoritos para no tener que escribirla más.
   - Si prefieres un portátil, conéctalo a la tele por HDMI y abre la misma dirección en Chrome. Es la opción más estable.
2. **La primera vez** sale la pantalla de ajustes: nombre de la fiesta, contraseña para los invitados (por defecto `fiesta`) y la clave de anfitrión (un número de 4 cifras). Pulsa **Guardar y empezar**.
   - Las siguientes veces solo verás **Empezar la fiesta**. Púlsalo con el mando: ese clic activa el sonido y la pantalla completa.
3. **En la tele aparece un QR y un código** de 5 letras. Los invitados escanean el QR (o entran en la dirección de los móviles y escriben el código), ponen su nombre y la contraseña de la fiesta.
4. **Tú entras desde tu móvil igual, pero con la clave de anfitrión** en lugar de la contraseña. Así puedes saltar canciones, reordenar la cola, quitar canciones de cualquiera y poner la música de fondo.
5. **Cada invitado elige canción** en Inicio o Buscar, o pega un enlace de YouTube. La tele hace la intro con su nombre y cuenta atrás, reproduce el karaoke y al terminar pasa sola al siguiente.
6. **Música de fondo:** en tu móvil de anfitrión, pestaña Música, pega el enlace de una playlist de YouTube. Suena en la tele cuando nadie canta y se pausa sola al empezar un karaoke.

El sonido sale por la tele, como cualquier vídeo.

## Si algo falla

| Qué pasa | Qué hacer |
| --- | --- |
| La tele muestra «Pulsa OK para reproducir» | Pulsa OK en el mando. El navegador de la tele a veces pide un clic para reproducir con sonido. |
| Una canción no se puede reproducir | Algunos vídeos de YouTube no dejan verse fuera de YouTube. La tele prueba otro vídeo de la misma canción y, si tampoco va, pasa a la siguiente. |
| El móvil dice «La tele no responde» | Comprueba que la tele sigue con la página de Tarima abierta. Si la recargas, la cola se conserva. |
| Quiero empezar de cero | En la tele: Ajustes, Nueva fiesta. Cambia el código y vacía la cola. |

## Buscar cualquier canción en YouTube (opcional)

Sin configurar nada hay un catálogo de 17 canciones y se puede pegar cualquier enlace de YouTube. Para buscar cualquier canción desde el móvil hace falta una clave gratuita de la YouTube Data API:

1. Entra en [console.cloud.google.com](https://console.cloud.google.com), crea un proyecto y activa **YouTube Data API v3**.
2. En Credenciales, crea una **clave de API**. Restríngela a la API de YouTube y al sitio `https://papeia001.github.io/*`.
3. Pégala en la tele (Ajustes) o en tu móvil de anfitrión (pestaña Fiesta).

La cuota gratuita da para unas 100 búsquedas al día. Las búsquedas repetidas no gastan cuota.

## Cómo funciona por dentro

- `index.html`: app de los invitados (pestañas Inicio, Buscar, Cola, Música y Fiesta).
- `tv.html`: pantalla de la tele, con el reproductor oficial de YouTube, intros animadas y QR.
- `shared.js`: catálogo y conexión en tiempo real.
- Los móviles y la tele se comunican en tiempo real a través de servidores MQTT públicos y gratuitos (EMQX y HiveMQ, los dos a la vez por si uno falla). La tele es quien guarda la cola. Al ser servidores públicos, esto vale para una beta de fiestas privadas; para una versión definitiva conviene pasar a Supabase con cuentas propias.
