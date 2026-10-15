/* =====================================================================
   CONFIGURACION  -  ESTE ES EL UNICO ARCHIVO QUE NECESITAS EDITAR
   ---------------------------------------------------------------------
   Aqui cambias: estilo de color, textos, frases (con su foto y su
   mensaje), cantidades y velocidades.
   Las fotos, stickers, videos y la cancion NO se tocan aqui: solo se
   reemplazan los archivos dentro de la carpeta assets/ (ver LEEME).
   Regla de oro: no borres las comillas "" ni las comas , al final.
   ===================================================================== */

const CONFIG = {

  /* ---------- 1. ESTILO Y NOMBRE ---------- */

  // Estilo de color:  "rosa"    (galaxia rosa con agujero negro, el mas romantico)
  //                   "cosmos"  (galaxia blanca y azulada con nucleo brillante)
  //                   "violeta" (galaxia morada y magenta)
  tema: "rosa",                                  // <<< [A] ESTILO DE COLOR de toda la galaxia

  // Si lo dejas vacio ("") la galaxia es para cualquier pareja.
  // Si pones un nombre, sale en la pantalla de entrada y como frase destacada.
  nombre: "",                                    // <<< [B] NOMBRE (vacio = para cualquier pareja)

  tituloPagina: "Una galaxia para nuestro amor ♥",   // <<< [C] titulo de la pestana del navegador

  /* ---------- 2. PANTALLA DE ENTRADA ---------- */
  intro: {
    titulo: "Una galaxia para nuestro amor",                  // <<< [D] TITULO GRANDE de la tarjeta de entrada
    subtitulo: "Cada estrella es un motivo para amarte",      // <<< [E] texto pequeno bajo el dibujito
    subtituloConNombre: "Para {nombre}, con todo mi amor",    // <<< [F] igual que [E], pero si pusiste un nombre en [B]
    boton: "Entrar a nuestro universo"                        // <<< [G] texto del BOTON rosa
  },

  /* ---------- 3. EL CORAZON (el centro de todo) ---------- */
  // La FOTO PRINCIPAL va dentro del corazon: guardala como
  // assets/principal/01.jpg  (jpg, jpeg, png o webp).
  fotoPrincipal: {
    carpeta: "assets/principal/",
    archivo: "01",
    titulo: "Nuestro amor",                          // <<< [H] titulo de la tarjeta de la FOTO PRINCIPAL
    mensaje: "Eres el centro de mi universo, y todo lo bonito empieza y termina en ti.",   // <<< [I] mensaje de esa tarjeta
    tamano: 14.5                    // ancho de la foto dentro del corazon
  },

  // Texto que se lee sobre la foto principal (o solo, si no hay foto)
  textoCentral: "Te amo",                        // <<< [J] texto escrito sobre la foto principal

  // Mensaje que se escribe solo, letra por letra, cuando empieza la galaxia
  // (cada linea es un renglon; deja la lista vacia [] si no quieres mensaje)
  mensajeInicial: [
    "Cada estrella es un motivo para amarte.",            // <<< [K] 1er renglon que se escribe solo
    "Toca las fotos y las frases para abrir sus mensajes."   // <<< [K] 2do renglon
  ],

  /* ---------- 4. FRASES (cada una con su FOTO y su MENSAJE) ----------
     Las frases se leen "tendidas" sobre la galaxia, con una mini foto
     encima. Al tocarlas se abre una tarjeta con la foto y el mensaje.

       texto ..... lo que se lee en la galaxia
       foto ...... numero de la foto de assets/fotos/ ("01" = 01.jpg)
                   Si esa foto no existe, se asigna otra automaticamente,
                   asi NINGUNA frase se queda sin foto.
       titulo .... titulo de la tarjeta (opcional; si lo quitas usa el texto)
       mensaje ... texto que sale debajo de la foto al abrirla
       grande .... true = sale mas grande (opcional)

     Para agregar una frase copia una linea completa { ... } y pon una
     coma al final de la anterior.
  */
  frases: [   // <<< [L] CADA LINEA { ... } ES UNA FRASE DE LA GALAXIA (texto + foto + mensaje)
    { texto: "Te amo", foto: "01", grande: true,
      mensaje: "Te amo hoy, mañana y todos los días que vengan." },
    { texto: "Eres mi todo", foto: "02",
      mensaje: "Eres mi todo: mi calma, mi risa y mi lugar favorito." },
    { texto: "Mi amor eterno ∞", foto: "03", grande: true,
      mensaje: "Lo nuestro no tiene final, solo un camino de estrellas." },
    { texto: "Siempre juntos", foto: "04",
      mensaje: "Contigo quiero todos los siempre que existan." },
    { texto: "Nuestro universo", foto: "05",
      mensaje: "Tú y yo somos un universo entero." },
    { texto: "Eres magia", foto: "06",
      mensaje: "Contigo hasta lo simple se vuelve magia." },
    { texto: "Te adoro", foto: "07",
      mensaje: "Te adoro más de lo que las palabras pueden decir." },
    { texto: "Mi lugar favorito", foto: "08",
      mensaje: "Mi lugar favorito en el mundo es a tu lado." },
    { texto: "Amor de mi vida", foto: "09",
      mensaje: "Cuanto más tiempo pasa, más te amo." },
    { texto: "Contigo siempre", foto: "10",
      mensaje: "En los días buenos y en los difíciles, contigo siempre." },
    { texto: "Mi persona favorita", foto: "11",
      mensaje: "Entre todas las personas del mundo, te elijo a ti." },
    { texto: "Eres mi hogar", foto: "12",
      mensaje: "Donde estás tú, ahí está mi hogar." },
    { texto: "Te elegiría siempre", foto: "13",
      mensaje: "En cualquier universo, en cualquier vida: te elegiría siempre." },
    { texto: "Mi razón de sonreír", foto: "14",
      mensaje: "Eres mi razón de sonreír, incluso sin darte cuenta." },
    { texto: "Juntos hasta el final", foto: "15",
      mensaje: "Juntos hasta el final, y después también." },
    { texto: "Eres mi suerte", foto: "16",
      mensaje: "Lo mejor que me ha pasado eres tú." }
  ],

  /* ---------- 5. FOTOS, STICKERS, VIDEOS, MUSICA ---------- */
  // Los archivos van en las carpetas indicadas y se llaman 01, 02, 03...
  // (sin dejar numeros saltados). Se aceptan jpg, jpeg, png, webp.
  fotos: {
    carpeta: "assets/fotos/",
    maximo: 24,          // cuantas fotos como maximo busca (01 hasta 24)
    // Texto de las fotos SUELTAS (las que no estan asignadas a ninguna frase)
    leyendas: {
      // "20": "Mi foto favorita",
    }
  },

  stickers: {
    carpeta: "assets/stickers/",   // png con fondo transparente
    maximo: 12
  },

  videos: {
    carpeta: "assets/videos/",     // mp4 o webm, cortos (menos de 30 s)
    maximo: 4,
    leyendas: {
      // "01": "Mira este recuerdo",
    }
  },

  // UNA sola cancion de fondo: assets/musica/01.mp3
  // Empieza justo cuando se toca el boton de entrada y se repite sin parar.
  musica: {
    carpeta: "assets/musica/",
    archivo: "01",                 // nombre del archivo SIN la extension
    volumen: 0.7                   // de 0 (silencio) a 1 (maximo)
  },

  /* ---------- 6. TIPOGRAFIAS ---------- */
  // Si cambias una, tambien cambia el enlace de Google Fonts en index.html
  fuentes: {
    titulo: '"Playfair Display", Georgia, "Times New Roman", serif',
    texto:  '"Quicksand", "Segoe UI", Arial, sans-serif'
  },

  /* ---------- 7. AJUSTES AVANZADOS (opcional) ---------- */
  galaxia: {
    particulas: 70000,             // en PC
    particulasMovil: 36000,        // en celular (mas liviano)
    radio: 60,
    brazos: 2,                     // 2 = espiral clasica; prueba 3 o 4
    giro: 5.2,                     // que tan enroscados estan los brazos
    velocidadGiro: 0.05            // velocidad de rotacion
  },

  corazon: {
    particulas: 18000,
    particulasMovil: 10000,
    tamano: 38,                    // ancho del corazon
    altura: 37,                    // que tan alto flota sobre la galaxia
    grosor: 1.0,                   // grosor del borde de particulas
    delayInicio: 3.2,              // segundos antes de que empiece a subir
    duracion: 9,                   // segundos que tarda en formarse
    latido: true                   // pulsa como un corazon
  },

  // Corazones brillantes que flotan sobre la galaxia
  corazonesFlotantes: {
    cantidad: 34,                  // en PC
    cantidadMovil: 20,             // en celular
    velocidad: 1
  },

  camara: {
    autoRotar: true,
    velocidadAuto: 0.035,
    duracionIntro: 7.5,            // segundos del movimiento inicial de camara
    distancia: 108,
    elevacion: 0.50,               // 0 = de lado, 1.4 = desde arriba
    alturaObjetivo: 15,            // hacia donde mira la camara
    zoomMin: 55,
    zoomMax: 230
  },

  estrellas: {
    cantidad: 1800,
    fugaces: true                  // estrellas fugaces ocasionales
  },

  flotantes: {
    radioMin: 20,                  // las frases orbitan entre estos radios
    radioMax: 80,
    velocidad: 1,                  // 1 = normal, 2 = el doble de rapido
    escalaMundo: 0.14              // tamano general de frases y fotos (0.10 a 0.20)
  }
};


/* =====================================================================
   ESTILOS DE COLOR  (no hace falta tocar esto; el estilo se elige arriba)
   ===================================================================== */
const TEMAS = {
  rosa: {
    nucleo: "#ffe9f5", brazos: "#ff2f93", borde: "#7d1655",
    corazon: "#ff9ccf", corazonRelleno: "#ff3d97",
    texto: "#ffe8f4", brillo: "#ff2d96",
    nebulosas: ["#5a0f3c", "#3d0a33", "#7a1450", "#2a0a3a", "#4a0d40"],
    corazonesMini: ["#ff3d6e", "#ff5fa8", "#ff8fc4", "#ff6f91", "#ffb3d9", "#ffffff"],
    agujeroNegro: true, relleno: 0.5, tamParticula: 1.35, nebulosaIntensidad: 0.7
  },
  cosmos: {
    nucleo: "#fff4e0", brazos: "#d9b8ff", borde: "#7fa8ff",
    corazon: "#ffd1e8", corazonRelleno: "#ffffff",
    texto: "#ffffff", brillo: "#b9c8ff",
    nebulosas: ["#6a2c91", "#1f8a8a", "#b33a7a", "#2a3fa5", "#3b1d6e"],
    corazonesMini: ["#ff5fa8", "#ff8fc4", "#ffb3d9", "#b39bff", "#ffffff"],
    agujeroNegro: false, relleno: 0.12, tamParticula: 1.0, nebulosaIntensidad: 1.0
  },
  violeta: {
    nucleo: "#fbe7ff", brazos: "#c04bff", borde: "#4a2aa8",
    corazon: "#e3a8ff", corazonRelleno: "#b44dff",
    texto: "#f6e8ff", brillo: "#b04dff",
    nebulosas: ["#3a0f6e", "#5a1a8c", "#8a2a9c", "#1a1a6e", "#4a0d5a"],
    corazonesMini: ["#d96bff", "#ff6fd0", "#b88bff", "#ff8fc4", "#ffffff"],
    agujeroNegro: true, relleno: 0.45, tamParticula: 1.3, nebulosaIntensidad: 0.85
  }
};

/* El estilo elegido pasa a CONFIG.colores */
CONFIG.colores = Object.assign({}, TEMAS[CONFIG.tema] || TEMAS.rosa);

/* Truco para personalizar sin tocar archivos: agrega al final del link
   ?nombre=Ana   o   ?tema=cosmos   (por ejemplo: tupagina.netlify.app/?nombre=Ana) */
(function () {
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('nombre')) CONFIG.nombre = q.get('nombre').slice(0, 24);
    if (q.get('tema') && TEMAS[q.get('tema')]) {
      CONFIG.tema = q.get('tema');
      CONFIG.colores = Object.assign({}, TEMAS[CONFIG.tema]);
    }
  } catch (e) { /* sin parametros */ }
})();
