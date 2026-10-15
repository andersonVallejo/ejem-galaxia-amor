/* =====================================================================
   UTILIDADES  -  funciones de ayuda (no necesitas editar este archivo)
   ===================================================================== */

const Util = (() => {

  const esMovil =
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    Math.min(screen.width, screen.height) < 600;

  const rand = (a, b) => a + Math.random() * (b - a);

  const gauss = () => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const suave = t => t * t * (3 - 2 * t);
  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const pad2 = n => String(n).padStart(2, '0');
  const dormir = ms => new Promise(r => setTimeout(r, ms));

  /* "#rrggbb" -> [0..255, 0..255, 0..255] */
  function hexRGB(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  /* "#rrggbb" -> [0..1, 0..1, 0..1] */
  function hexRGB01(hex) {
    return hexRGB(hex).map(v => v / 255);
  }

  /* jpg -> jpg, JPG (para servidores que distinguen mayusculas) */
  function variantesExt(exts) {
    const s = new Set();
    exts.forEach(e => { s.add(e); s.add(e.toUpperCase()); });
    return [...s];
  }

  function cargarImagen(url) {
    return new Promise(res => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => res(null);
      im.src = url;
    });
  }

  /* Busca carpeta/01.jpg, 02.jpg ... y devuelve las que existen (en orden) */
  async function buscarImagenes(carpeta, maximo, exts) {
    const lista = variantesExt(exts);
    const tareas = [];
    for (let n = 1; n <= maximo; n++) {
      tareas.push((async () => {
        for (const e of lista) {
          const url = `${carpeta}${pad2(n)}.${e}`;
          const img = await cargarImagen(url);
          if (img) return { clave: pad2(n), numero: n, img, url };
        }
        return null;
      })());
    }
    return (await Promise.all(tareas)).filter(Boolean);
  }

  /* Comprueba si un audio/video existe. Devuelve el elemento o null */
  function probarMedia(tag, url, espera = 7000) {
    return new Promise(res => {
      const el = document.createElement(tag);
      el.preload = 'metadata';
      el.muted = true;
      let listo = false;
      const fin = ok => {
        if (listo) return;
        listo = true;
        clearTimeout(reloj);
        res(ok ? el : null);
      };
      const reloj = setTimeout(() => fin(false), espera);
      el.onloadedmetadata = () => fin(true);
      el.onerror = () => fin(false);
      el.src = url;
    });
  }

  /* Busca videos 01.mp4, 02.mp4 ... */
  async function buscarVideos(carpeta, maximo, exts) {
    const lista = variantesExt(exts);
    const tareas = [];
    for (let n = 1; n <= maximo; n++) {
      tareas.push((async () => {
        for (const e of lista) {
          const url = `${carpeta}${pad2(n)}.${e}`;
          const video = await probarMedia('video', url);
          if (video) return { clave: pad2(n), numero: n, video, url };
        }
        return null;
      })());
    }
    return (await Promise.all(tareas)).filter(Boolean);
  }

  /* Espera a que carguen las tipografias (maximo 2.5 s para no bloquear offline) */
  async function esperarFuentes(cfg) {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load(`italic 700 48px ${cfg.fuentes.titulo}`),
          document.fonts.load(`700 40px ${cfg.fuentes.texto}`),
          document.fonts.load(`500 40px ${cfg.fuentes.texto}`)
        ]),
        dormir(2500)
      ]);
    } catch (e) { /* si falla se usan las tipografias de respaldo */ }
  }

  /* Dibuja un texto con brillo en un canvas. Devuelve {c, w, h} */
  function textoCanvas(texto, o) {
    const tam = o.tam || 64;
    const pad = tam * 0.7;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    const fuente = `${o.estilo || 'normal'} ${o.peso || 700} ${tam}px ${o.familia}`;
    g.font = fuente;
    const w = Math.ceil(g.measureText(texto).width + pad * 2);
    const h = Math.ceil(tam * 1.5 + pad);
    c.width = w;
    c.height = h;
    g.font = fuente;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = o.color || '#ffffff';
    g.shadowColor = o.brillo || 'rgba(255,255,255,0.9)';
    g.shadowBlur = tam * 0.35;
    g.fillText(texto, w / 2, h / 2 + tam * 0.03);
    g.shadowBlur = tam * 0.1;
    g.fillText(texto, w / 2, h / 2 + tam * 0.03);
    g.shadowBlur = 0;
    g.fillText(texto, w / 2, h / 2 + tam * 0.03);
    return { c, w, h };
  }

  /* Dibuja un corazon brillante de color (para los mini corazones flotantes) */
  function corazonCanvas(color, tamano = 128) {
    const c = document.createElement('canvas');
    c.width = c.height = tamano;
    const g = c.getContext('2d');
    const s = tamano / 44;
    const cx = tamano / 2;
    const cy = tamano * 0.47;
    g.beginPath();
    for (let i = 0; i <= 72; i++) {
      const t = (i / 72) * Math.PI * 2;
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const px = cx + x * s * 0.95;
      const py = cy - y * s * 0.95;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.shadowColor = color;
    g.shadowBlur = tamano * 0.18;
    g.fillStyle = color;
    g.fill();
    g.shadowBlur = 0;
    /* brillito blanco arriba a la izquierda */
    g.fillStyle = 'rgba(255,255,255,0.55)';
    g.beginPath();
    g.ellipse(cx - 11 * s, cy - 7 * s, 4 * s, 2.4 * s, -0.6, 0, Math.PI * 2);
    g.fill();
    return c;
  }

  return {
    esMovil, rand, gauss, clamp, lerp, suave, easeInOut, easeOut, pad2, dormir,
    hexRGB, hexRGB01, variantesExt, cargarImagen, buscarImagenes, probarMedia,
    buscarVideos, esperarFuentes, textoCanvas, corazonCanvas
  };
})();
