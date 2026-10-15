/* =====================================================================
   PRINCIPAL  -  une todas las piezas y controla la linea de tiempo
   (no necesitas editar este archivo)

   Linea de tiempo (segundos desde que se toca el boton de entrada):
     0.0  la musica empieza, la galaxia aparece y la camara empieza a subir
     3.2  sube la columna de particulas y se forma el corazon
     5.2  empiezan a aparecer frases, fotos y stickers
     ~11  la foto principal aparece dentro del corazon
   ===================================================================== */

/* Si algo falla, con  ?debug  al final del link se ve el error en pantalla */
(function () {
  let debug = false;
  try { debug = new URLSearchParams(location.search).has('debug'); } catch (e) {}
  if (!debug) return;
  const caja = document.createElement('div');
  caja.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:999;padding:8px 10px;' +
    'background:rgba(120,0,30,.9);color:#fff;font:12px/1.4 monospace;border-radius:8px;white-space:pre-wrap;display:none';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(caja));
  window.addEventListener('error', e => {
    caja.style.display = 'block';
    caja.textContent += (e.message || 'error') + (e.filename ? '  (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '') + '\n';
  });
  window.addEventListener('unhandledrejection', e => {
    caja.style.display = 'block';
    caja.textContent += 'promesa: ' + (e.reason && e.reason.message || e.reason) + '\n';
  });
})();

(async function iniciar() {

  document.title = CONFIG.tituloPagina;

  /* colores del estilo elegido -> CSS */
  const raiz = document.documentElement.style;
  raiz.setProperty('--brillo', CONFIG.colores.brillo);
  raiz.setProperty('--texto-color', CONFIG.colores.texto);
  raiz.setProperty('--rosa', CONFIG.colores.corazon);
  raiz.setProperty('--rosa-fuerte', CONFIG.colores.brazos);
  raiz.setProperty('--fuente-titulo', CONFIG.fuentes.titulo);
  raiz.setProperty('--fuente-texto', CONFIG.fuentes.texto);

  Interfaz.preparar(CONFIG);

  const canvas = document.getElementById('lienzo');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  } catch (e) {
    document.getElementById('intro-subtitulo').textContent =
      'Tu navegador no pudo abrir la galaxia. Prueba con Chrome o Safari actualizado.';
    document.getElementById('btn-entrar').remove();
    return;
  }

  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.setClearColor(0x02010a, 1);

  const escena = new THREE.Scene();

  /* valores compartidos por todos los shaders */
  const U = { uTime: { value: 0 }, uScale: { value: 1 }, uMin: { value: pixelRatio } };

  const cam = crearCamara(THREE, CONFIG, canvas);
  const camera = cam.camera;
  const capa = crearCapa3D(THREE, camera);

  function actualizarEscala() {
    U.uScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    U.uMin.value = pixelRatio;
  }

  await Util.esperarFuentes(CONFIG);

  const fondo = crearFondo(THREE, escena, CONFIG, U);
  const galaxia = crearGalaxia(THREE, escena, CONFIG, U);
  const corazon = crearCorazon(THREE, escena, CONFIG, U);
  const minis = crearCorazonesFlotantes(THREE, escena, CONFIG);
  const flot = crearFlotantes(THREE, CONFIG, camera, capa);
  flot.onAbrir(it => Interfaz.abrirVisor(it));
  flot.ligarLatido(() => corazon.beat);
  if (!CONFIG.textoCentral) corazon.estado.textoVisible = false;

  function alRedimensionar() {
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(innerWidth, innerHeight, false);
    cam.ajustarAspecto();
    capa.redimensionar();
    flot.ajustarAspecto(innerWidth / innerHeight);
    actualizarEscala();
  }
  alRedimensionar();
  window.addEventListener('resize', alRedimensionar);
  window.addEventListener('orientationchange', () => setTimeout(alRedimensionar, 250));

  /* ---------- carga de fotos, stickers, videos y musica (en segundo plano) ---------- */
  flot.cargarFotos();
  flot.cargarStickers();
  flot.cargarVideos();
  flot.cargarPrincipal(corazon).then(hay => {
    /* con foto principal, el "Te amo" va escrito sobre la foto */
    if (hay) corazon.estado.textoVisible = false;
  });
  Musica.onCambio((suena, disponible) => Interfaz.estadoMusica(suena, disponible));
  Musica.preparar(CONFIG);
  Interfaz.botonMusica(() => Musica.alternar());
  Interfaz.estadoMusica(false, true);

  /* ---------- toque en el espacio vacio: corazoncitos ---------- */
  cam.onTap((x, y) => { if (empezado) Interfaz.corazonEn(x, y); });

  /* ---------- linea de tiempo ---------- */
  let empezado = false;
  let ts = 0;
  let floActivados = false;
  let mensajeMostrado = false;

  Interfaz.onEntrar(() => {
    /* 1) la musica va PRIMERO: debe arrancar dentro del toque del usuario */
    Musica.iniciar();
    /* 2) despues empieza la animacion */
    empezado = true;
    ts = 0;
    cam.iniciarIntro();
  });

  /* ---------- bucle de dibujo ---------- */
  const reloj = new THREE.Clock();
  let acumDt = 0, nDt = 0, ajustes = 0, errorAvisado = false;

  function bucle() {
    requestAnimationFrame(bucle);
    const dt = Math.min(reloj.getDelta(), 0.05);
    const t = (U.uTime.value += dt);
    if (empezado) ts += dt;

    const fadeGalaxia = Util.suave(Util.clamp(ts / 2.6, 0, 1));
    const progreso = Util.clamp((ts - CONFIG.corazon.delayInicio) / CONFIG.corazon.duracion, 0, 1);

    cam.update(dt);
    fondo.actualizar(t, dt, 1, camera);
    galaxia.actualizar(t, dt, fadeGalaxia);
    corazon.actualizar(t, dt, progreso, camera);
    minis.actualizar(t, dt, Util.suave(Util.clamp((ts - 1.5) / 3, 0, 1)));

    /* las frases y fotos van aparte: si algo fallara aqui, la galaxia sigue dibujandose */
    try {
      capa.actualizarCamara();
      if (empezado && !floActivados && ts > CONFIG.corazon.delayInicio + 2) {
        floActivados = true;
        flot.activar();
      }
      flot.actualizar(t, dt, progreso);
    } catch (err) {
      if (!errorAvisado) { errorAvisado = true; console.error('Error en frases/fotos:', err); }
    }

    if (empezado && !mensajeMostrado && ts > 2.2) {
      mensajeMostrado = true;
      Interfaz.mostrarMensaje(CONFIG.mensajeInicial);
    }

    renderer.render(escena, camera);

    /* calidad adaptable: si va lento, baja un poco la resolucion */
    if (empezado && ts > 8 && ajustes < 2 && pixelRatio > 1) {
      acumDt += dt; nDt++;
      if (nDt >= 90) {
        if (acumDt / nDt > 1 / 32) {
          pixelRatio = Math.max(1, pixelRatio - 0.5);
          alRedimensionar();
          ajustes++;
        }
        acumDt = 0; nDt = 0;
      }
    }
  }
  bucle();
  Interfaz.listo();

})();
