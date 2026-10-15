/* =====================================================================
   MUSICA  -  UNA sola cancion de fondo (assets/musica/01.mp3).
   - Empieza en el mismo instante en que ella toca "Abrir mi regalo"
     (asi los navegadores de celular y PC lo permiten).
   - Se repite sin parar.
   - El boton de la nota musical la pausa / reanuda.
   - Se pausa sola si ella cambia de app o bloquea el celular, y sigue
     cuando vuelve.
   (el nombre y el volumen se cambian en config.js -> musica)
   ===================================================================== */

const Musica = (() => {
  let audio = null;
  let disponible = true;
  let volumen = 0.7;
  let pausaTemporal = false;      // pausada por ver un video con sonido
  let pausaPorSegundoPlano = false;
  let fadeTimer = null;
  let alCambiar = () => {};

  /* El navegador elige solo el primer formato que exista (mp3, m4a, ogg, wav) */
  function preparar(cfg) {
    const m = cfg.musica;
    volumen = m.volumen;
    audio = document.createElement('audio');
    audio.loop = true;
    audio.preload = 'auto';
    audio.setAttribute('playsinline', '');
    audio.setAttribute('webkit-playsinline', '');

    const formatos = [
      ['mp3', 'audio/mpeg'], ['m4a', 'audio/mp4'], ['ogg', 'audio/ogg'], ['wav', 'audio/wav'],
      ['MP3', 'audio/mpeg'], ['M4A', 'audio/mp4'], ['OGG', 'audio/ogg'], ['WAV', 'audio/wav']
    ];
    let ultima = null;
    formatos.forEach(([ext, tipo]) => {
      const s = document.createElement('source');
      s.src = `${m.carpeta}${m.archivo}.${ext}`;
      s.type = tipo;
      audio.appendChild(s);
      ultima = s;
    });

    /* si fallan TODAS las fuentes, no hay cancion: se esconde el boton */
    ultima.addEventListener('error', () => {
      if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        disponible = false;
        alCambiar(false, false);
      }
    });
    audio.addEventListener('error', () => {
      if (audio.error) { disponible = false; alCambiar(false, false); }
    });
    audio.addEventListener('playing', () => alCambiar(true, true));
    audio.addEventListener('pause', () => {
      if (!pausaTemporal && !pausaPorSegundoPlano) alCambiar(false, true);
    });

    /* pausa al cambiar de app / bloquear pantalla, y sigue al volver */
    document.addEventListener('visibilitychange', () => {
      if (!audio || !disponible) return;
      if (document.hidden) {
        if (!audio.paused) { pausaPorSegundoPlano = true; audio.pause(); }
      } else if (pausaPorSegundoPlano) {
        pausaPorSegundoPlano = false;
        audio.play().catch(() => alCambiar(false, true));
      }
    });

    audio.load();
  }

  function subirVolumen() {
    clearInterval(fadeTimer);
    try { audio.volume = 0; } catch (e) { return; }   // iPhone ignora el volumen: no pasa nada
    let i = 0;
    const pasos = 40;
    fadeTimer = setInterval(() => {
      i++;
      try { audio.volume = Util.clamp(volumen * (i / pasos), 0, 1); } catch (e) {}
      if (i >= pasos) clearInterval(fadeTimer);
    }, 3000 / pasos);
  }

  /* Se llama DENTRO del toque de "Abrir mi regalo" (requisito de celulares) */
  function iniciar() {
    if (!audio || !disponible) return;
    subirVolumen();
    const p = audio.play();
    if (p && p.catch) {
      p.catch(() => {
        /* el navegador lo bloqueo: queda el boton para que ella lo active */
        alCambiar(false, true);
      });
    }
  }

  /* El boton de la nota musical */
  function alternar() {
    if (!audio || !disponible) return;
    pausaTemporal = false;
    pausaPorSegundoPlano = false;
    if (audio.paused) {
      clearInterval(fadeTimer);
      try { audio.volume = volumen; } catch (e) {}
      audio.play().catch(() => alCambiar(false, true));
    } else {
      audio.pause();
    }
  }

  /* Pausa la musica mientras se ve un video con sonido */
  function pausarTemporal() {
    if (audio && !audio.paused) { pausaTemporal = true; audio.pause(); }
  }
  function reanudarTemporal() {
    if (audio && pausaTemporal) {
      pausaTemporal = false;
      audio.play().catch(() => alCambiar(false, true));
    }
  }

  return {
    preparar, iniciar, alternar, pausarTemporal, reanudarTemporal,
    get disponible() { return disponible; },
    get sonando() { return !!audio && !audio.paused; },
    onCambio(fn) { alCambiar = fn; }
  };
})();
