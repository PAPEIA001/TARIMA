# Tarima · karaoke para fiestas (beta)

Web app de karaoke para fiestas privadas. No hay nada que instalar: los invitados entran desde el navegador del móvil y la tele abre una página web.

- **Móviles de los invitados:** `https://papeia001.github.io/tarima/`
- **Tele:** `https://papeia001.github.io/tarima/tv.html`

## La noche de la fiesta

1. **Enciende la tele** (Samsung) y abre la app **Internet**. Escribe la dirección de la tele (`…/tarima/tv.html`) y guárdala en favoritos para no tener que escribirla más.
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
