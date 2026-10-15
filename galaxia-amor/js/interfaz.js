/* =====================================================================
   INTERFAZ  -  pantalla de entrada, mensaje que se escribe solo,
   botones (musica / pantalla completa), tarjeta de foto/video y
   corazoncitos al tocar.
   (los textos se cambian en config.js; el diseno en css/estilos.css)
   ===================================================================== */

const Interfaz = (() => {
  const $ = id => document.getElementById(id);
  let alEntrar = () => {};
  let textoBoton = '';
  let abierto = false;

  function preparar(cfg) {
    if (modoDemo()) document.body.classList.add('demo');
    $('intro-titulo').textContent = cfg.intro.titulo;
    const sub = (cfg.nombre && cfg.intro.subtituloConNombre)
      ? cfg.intro.subtituloConNombre.replace('{nombre}', cfg.nombre)
      : cfg.intro.subtitulo;
    $('intro-subtitulo').textContent = sub;
    $('btn-texto').textContent = 'Preparando...';
    $('btn-entrar').disabled = true;
    textoBoton = cfg.intro.boton;

    /* el sticker de la tarjeta de entrada es el primero de assets/stickers/ */
    const st = $('intro-sticker');
    st.addEventListener('error', () => st.remove());
    st.src = cfg.stickers.carpeta + '01.png';

    /* IMPORTANTE: la musica empieza DENTRO de este toque (alEntrar) */
    $('btn-entrar').addEventListener('click', () => {
      alEntrar();
      $('intro').classList.add('sale');
      setTimeout(() => { const i = $('intro'); if (i) i.remove(); }, 1600);
      $('botones').classList.remove('oculto');
    }, { once: true });

    $('btn-pantalla').addEventListener('click', () => {
      const el = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
      } else {
        (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
      }
    });
    if (!document.documentElement.requestFullscreen && !document.documentElement.webkitRequestFullscreen) {
      $('btn-pantalla').remove();
    }

    $('visor-cerrar').addEventListener('click', cerrarVisor);
    $('visor').addEventListener('click', e => { if (e.target.id === 'visor') cerrarVisor(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrarVisor(); });
  }

  /* El boton de entrada se activa cuando todo esta listo */
  function listo() {
    const b = $('btn-entrar');
    if (!b) return;
    $('btn-texto').textContent = textoBoton;
    b.disabled = false;
    /* modo grabacion: tu-link/?demo entra solo y esconde los botones */
    if (modoDemo()) setTimeout(() => b.click(), 600);
  }

  function modoDemo() {
    try { return new URLSearchParams(location.search).has('demo'); } catch (e) { return false; }
  }

  /* ---------- Mensaje que se escribe como maquina de escribir ---------- */
  function escribir(el, texto, vel) {
    return new Promise(res => {
      let i = 0;
      const timer = setInterval(() => {
        i++;
        el.textContent = texto.slice(0, i);
        if (i >= texto.length) { clearInterval(timer); res(); }
      }, vel);
    });
  }

  async function mostrarMensaje(lineas) {
    if (!lineas || !lineas.length) return;
    const caja = $('mensaje-inicial');
    caja.innerHTML = '';
    caja.classList.add('visible');
    for (const linea of lineas) {
      const p = document.createElement('p');
      p.className = 'escribiendo';
      caja.appendChild(p);
      await escribir(p, linea, 48);
      p.classList.remove('escribiendo');
      await Util.dormir(1100);
    }
    await Util.dormir(4200);
    caja.classList.remove('visible');
  }

  /* ---------- Boton de musica (nota musical) ---------- */
  function botonMusica(alternar) {
    $('btn-musica').addEventListener('click', alternar);
  }
  /* suena: true/false   disponible: false = no hay cancion -> se esconde el boton */
  function estadoMusica(suena, disponible) {
    const b = $('btn-musica');
    if (!b) return;
    if (disponible === false) { b.remove(); return; }
    b.classList.toggle('suena', !!suena);
    b.classList.toggle('apagado', !suena);
    b.setAttribute('aria-pressed', String(!!suena));
    const txt = suena ? 'Pausar musica' : 'Reproducir musica';
    b.setAttribute('aria-label', txt);
    b.title = txt;
  }

  /* ---------- Tarjeta: foto (o video) + titulo + mensaje + VOLVER ---------- */
  function abrirVisor(it) {
    const medio = $('visor-medio');
    medio.innerHTML = '';
    medio.classList.remove('sin-foto');

    if (it.tipo === 'video') {
      const v = document.createElement('video');
      v.src = it.url;
      v.controls = true;
      v.autoplay = true;
      v.loop = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      medio.appendChild(v);
      Musica.pausarTemporal();
      v.play().catch(() => {});
    } else if (it.url) {
      const im = document.createElement('img');
      im.src = it.url;
      im.alt = it.titulo || '';
      medio.appendChild(im);
    } else {
      /* frase sin foto: un corazon grande en su lugar */
      medio.classList.add('sin-foto');
      medio.innerHTML = '<span class="corazon-grande">♥</span>';
    }

    const t = $('visor-titulo');
    t.textContent = it.titulo || '';
    t.style.display = it.titulo ? 'block' : 'none';
    const l = $('visor-leyenda');
    l.textContent = it.leyenda || '';
    l.style.display = it.leyenda ? 'block' : 'none';

    abierto = true;
    $('visor').classList.remove('oculto');
    requestAnimationFrame(() => $('visor').classList.add('abierto'));
  }

  function cerrarVisor() {
    if (!abierto) return;
    abierto = false;
    const visor = $('visor');
    visor.classList.remove('abierto');
    setTimeout(() => {
      if (abierto) return;
      visor.classList.add('oculto');
      $('visor-medio').innerHTML = '';
      Musica.reanudarTemporal();
    }, 250);
  }

  /* ---------- Corazoncitos al tocar el espacio ---------- */
  const colores = ['#ffb3d9', '#ff8fc4', '#ffffff', '#e0b3ff', '#ffc2e6'];
  function corazonEn(x, y) {
    const capa = $('capa-corazones');
    const n = 5;
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.textContent = '♥';
      s.className = 'corazon-tap';
      s.style.left = (x + Util.rand(-26, 26)) + 'px';
      s.style.top = (y + Util.rand(-10, 10)) + 'px';
      s.style.fontSize = Util.rand(14, 30) + 'px';
      s.style.color = colores[Math.floor(Math.random() * colores.length)];
      s.style.animationDelay = (i * 0.07) + 's';
      s.style.setProperty('--dx', Util.rand(-40, 40) + 'px');
      capa.appendChild(s);
      setTimeout(() => s.remove(), 2200);
    }
  }

  function cursor(esMano) {
    document.body.classList.toggle('mano', esMano);
  }

  return {
    preparar, listo, mostrarMensaje, botonMusica, estadoMusica,
    abrirVisor, cerrarVisor, corazonEn, cursor,
    onEntrar(fn) { alEntrar = fn; }
  };
})();
