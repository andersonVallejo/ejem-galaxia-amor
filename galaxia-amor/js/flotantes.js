/* =====================================================================
   FLOTANTES  -  lo que orbita alrededor de la galaxia:
     * FRASES "tendidas" sobre el disco, cada una con una MINI FOTO encima
     * fotos sueltas, stickers y videos
     * la FOTO PRINCIPAL, en el centro del corazon
   Todo son elementos HTML colocados en 3D (ver capa3d.js).
   Las fotos se leen de assets/ y las frases de js/config.js.
   (no necesitas editar este archivo)
   ===================================================================== */

function crearFlotantes(THREE, cfg, camera, capa) {

  const F = cfg.flotantes;
  const items = [];
  let activo = false;
  let escalaUI = 1;
  let tiempo = 0;
  let contador = 0;
  let alAbrir = () => {};
  let principal = null;
  let latidoFn = null;

  const qFlat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const qYaw = new THREE.Quaternion();
  const ejeY = new THREE.Vector3(0, 1, 0);

  /* ---------- helpers de HTML ---------- */
  function nuevo(tag, clase) {
    const e = document.createElement(tag);
    e.className = 'it ' + clase;
    e.style.display = 'none';
    return e;
  }
  function imagen(url, alt) {
    const im = document.createElement('img');
    im.src = url;
    im.alt = alt || '';
    im.draggable = false;
    im.decoding = 'async';
    return im;
  }
  function insignia() {
    const b = document.createElement('i');
    b.className = 'insignia';
    b.textContent = '\u2665';
    return b;
  }
  function claveNumero(v) {
    if (v === undefined || v === null || v === '') return null;
    const n = parseInt(String(v), 10);
    return isNaN(n) ? null : Util.pad2(n);
  }

  /* una "parte" es un elemento HTML con su posicion 3D */
  function parte(el, modo, escala) {
    const obj = new THREE.Object3D();
    capa.agregar(el);
    return { el, obj, modo, escala: escala || 1, dy: 0 };
  }

  /* ---------- registrar un elemento que orbita ---------- */
  function registrar(partes, datos, o) {
    const idx = contador++;
    const r = Util.rand(o.rMin, o.rMax);
    const it = {
      partes, datos,
      r,
      th: idx * 2.399963 + Util.rand(-0.25, 0.25),      // angulo "dorado": reparte parejo
      w: F.velocidad * 0.055 * Math.sqrt(45 / r),
      ba: Util.rand(0.25, 0.7),
      bs: Util.rand(0.5, 1.1),
      ph: Util.rand(0, 6.28),
      inclina: Util.rand(-0.35, 0.35),
      alto: o.alto,
      retardo: 0.3 + (idx % 26) * 0.16,
      nace: null,
      ...o.extra
    };
    if (datos) {
      partes.forEach(p => {
        p.el.classList.add('tocable');
        p.el.addEventListener('click', e => { e.stopPropagation(); alAbrir(datos); });
      });
    }
    items.push(it);
    if (activo) it.nace = tiempo + 0.3;
    return it;
  }

  /* ---------- FRASES con su mini foto ---------- */
  function crearFrases(fotos) {
    const porClave = {};
    fotos.forEach(f => { porClave[f.clave] = f; });

    const lista = (cfg.frases || []).map(f => (typeof f === 'string' ? { texto: f } : f));
    if (cfg.nombre) lista.unshift({ texto: cfg.nombre, grande: true, mensaje: cfg.intro.subtituloConNombre ? cfg.intro.subtituloConNombre.replace('{nombre}', cfg.nombre) : '' });

    const usadas = new Set();
    const asignada = new Array(lista.length).fill(null);
    /* 1) las que piden una foto concreta (foto: "05") */
    lista.forEach((f, i) => {
      const k = claveNumero(f.foto);
      if (k && porClave[k]) { asignada[i] = porClave[k]; usadas.add(k); }
    });
    /* 2) las demas: primero fotos sin usar, y si se acaban, se repiten */
    let ciclo = 0;
    lista.forEach((f, i) => {
      if (asignada[i] || !fotos.length) return;
      const libre = fotos.find(p => !usadas.has(p.clave));
      if (libre) { asignada[i] = libre; usadas.add(libre.clave); }
      else { asignada[i] = fotos[ciclo % fotos.length]; ciclo++; }
    });

    const orden = lista.map((f, i) => i).sort(() => Math.random() - 0.5);
    orden.forEach(i => {
      const f = lista[i];
      const foto = asignada[i];
      const grande = !!f.grande;
      const datos = { tipo: 'frase', titulo: f.titulo || f.texto, leyenda: f.mensaje || '', url: foto ? foto.url : null };

      const txt = nuevo('div', 'it-texto' + (grande ? ' grande' : ''));
      txt.textContent = f.texto;
      const pT = parte(txt, 'plano', grande ? 1.25 : 1);
      const partes = [pT];

      if (foto) {
        const mini = nuevo('div', 'it-mini' + (grande ? ' grande' : ''));
        mini.appendChild(imagen(foto.url, f.texto));
        mini.appendChild(insignia());
        const pM = parte(mini, 'cartel', grande ? 1.25 : 1);
        pM.dy = 1;             // esta parte flota encima del texto
        partes.push(pM);
      }
      registrar(partes, datos, { rMin: F.radioMin + 4, rMax: F.radioMax - 6, alto: 0.4 });
    });
    return usadas;
  }

  /* ---------- FOTOS SUELTAS (las que no estan en ninguna frase) ---------- */
  function crearFotoSuelta(f) {
    const fc = cfg.fotos;
    const el = nuevo('div', 'it-foto');
    el.appendChild(imagen(f.url, ''));
    el.appendChild(insignia());
    const p = parte(el, 'cartel', 1);
    p.dy = 1;
    registrar([p], {
      tipo: 'foto', titulo: '', url: f.url,
      leyenda: (fc.leyendas && (fc.leyendas[f.clave] || fc.leyendas[String(f.numero)])) || ''
    }, { rMin: F.radioMin + 6, rMax: F.radioMax - 8, alto: 3.6 });
  }

  async function cargarFotos() {
    const fc = cfg.fotos;
    const fotos = await Util.buscarImagenes(fc.carpeta, fc.maximo, ['jpg', 'jpeg', 'png', 'webp']);
    const usadas = crearFrases(fotos);
    fotos.filter(f => !usadas.has(f.clave)).forEach(crearFotoSuelta);
    return fotos.length;
  }

  /* ---------- STICKERS ---------- */
  async function cargarStickers() {
    const sc = cfg.stickers;
    const lista = await Util.buscarImagenes(sc.carpeta, sc.maximo, ['png', 'webp', 'gif', 'jpg', 'jpeg']);
    lista.forEach(s => {
      const el = nuevo('img', 'it-sticker');
      el.src = s.url;
      el.alt = '';
      el.draggable = false;
      const p = parte(el, 'cartel', 1);
      p.dy = 1;
      registrar([p], null, { rMin: F.radioMin - 2, rMax: F.radioMax + 4, alto: 3.4 });
    });
    return lista.length;
  }

  /* ---------- VIDEOS ---------- */
  async function cargarVideos() {
    const vc = cfg.videos;
    const lista = await Util.buscarVideos(vc.carpeta, vc.maximo, ['mp4', 'webm']);
    lista.forEach(v => {
      const video = v.video;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'auto';
      const el = nuevo('div', 'it-foto it-video');
      el.appendChild(video);
      el.appendChild(insignia());
      const p = parte(el, 'cartel', 1.15);
      p.dy = 1;
      registrar([p], {
        tipo: 'video', titulo: '', url: v.url,
        leyenda: (vc.leyendas && (vc.leyendas[v.clave] || vc.leyendas[String(v.numero)])) || ''
      }, { rMin: F.radioMin + 6, rMax: F.radioMax - 8, alto: 4, extra: { video } });
      if (activo) video.play().catch(() => {});
    });
    return lista.length;
  }

  /* ---------- FOTO PRINCIPAL (en el centro del corazon) ---------- */
  async function cargarPrincipal(corazonInfo) {
    const pc = cfg.fotoPrincipal;
    const fotos = await Util.buscarImagenes(pc.carpeta, 1, ['jpg', 'jpeg', 'png', 'webp']);
    /* si "archivo" no es 01, tambien se acepta: usamos la primera que exista */
    if (!fotos.length) return false;
    const f = fotos[0];
    const el = nuevo('div', 'it-principal');
    el.style.setProperty('--ancho', Math.round(pc.tamano / F.escalaMundo) + 'px');
    el.appendChild(imagen(f.url, pc.titulo || ''));
    if (cfg.textoCentral) {
      const t = document.createElement('span');
      t.className = 'leyenda-principal';
      t.textContent = cfg.textoCentral;
      el.appendChild(t);
    }
    const p = parte(el, 'cartel', 1);
    const datos = { tipo: 'principal', titulo: pc.titulo || '', leyenda: pc.mensaje || '', url: f.url };
    el.classList.add('tocable');
    el.addEventListener('click', e => { e.stopPropagation(); alAbrir(datos); });
    principal = {
      parte: p,
      x: 0,
      y: corazonInfo.cy - 1.4 * corazonInfo.s,
      nace: null
    };
    return true;
  }

  /* ---------- ACTIVAR (cuando empieza la animacion) ---------- */
  function activar() {
    activo = true;
    items.forEach(it => {
      it.nace = tiempo + it.retardo;
      if (it.video) it.video.play().catch(() => {});
    });
  }

  function ajustarAspecto(aspecto) {
    escalaUI = aspecto < 1 ? 1 + (1 - aspecto) * 0.85 : 1;
  }

  function colocar(p, k) {
    p.obj.scale.setScalar(F.escalaMundo * escalaUI * p.escala * k);
    p.obj.updateMatrix();
    p.obj.matrixWorld.copy(p.obj.matrix);
    p.el.style.transform = capa.matrizObjeto(p.obj.matrixWorld);
  }

  /* ---------- CADA FOTOGRAMA ---------- */
  function actualizar(t, dt, progresoCorazon) {
    tiempo = t;
    const cx = camera.position.x;
    const cz = camera.position.z;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.nace === null) continue;
      const k = Util.clamp((t - it.nace) / 1.4, 0, 1);
      if (k <= 0) continue;
      const e = Util.easeOut(k);
      it.th += it.w * dt;
      const x = Math.cos(it.th) * it.r;
      const z = Math.sin(it.th) * it.r;
      const bob = Math.sin(t * it.bs + it.ph) * it.ba;

      for (let j = 0; j < it.partes.length; j++) {
        const p = it.partes[j];
        if (p.el.style.display === 'none') p.el.style.display = '';
        p.el.style.opacity = e;
        if (p.modo === 'plano') {
          /* texto tendido sobre el disco, leyendose bien desde la camara */
          p.obj.position.set(x, 0.35 + bob * 0.25, z);
          const psi = Math.atan2(-(x - cx), -(z - cz)) + it.inclina;
          qYaw.setFromAxisAngle(ejeY, psi);
          p.obj.quaternion.copy(qYaw).multiply(qFlat);
        } else {
          /* foto / sticker: de frente a la camara, flotando encima */
          const sube = p.dy ? (1.0 + 2.9 * escalaUI * p.escala) : 0;
          p.obj.position.set(x, it.alto + sube + bob, z);
          p.obj.quaternion.copy(camera.quaternion);
        }
        colocar(p, 0.5 + 0.5 * e);
      }
    }

    /* foto principal: aparece cuando el corazon ya se formo y late con el */
    if (principal) {
      const k = Util.suave(Util.clamp((progresoCorazon - 0.86) / 0.14, 0, 1));
      const p = principal.parte;
      if (k > 0) {
        if (p.el.style.display === 'none') p.el.style.display = '';
        p.el.style.opacity = k;
        p.obj.position.set(0, principal.y + Math.sin(t * 0.9) * 0.3, 0);
        p.obj.quaternion.copy(camera.quaternion);
        const pulso = 1 + (cfg.corazon.latido && latidoFn ? latidoFn() * 0.6 : 0);
        colocar(p, (0.7 + 0.3 * k) * pulso);
      }
    }
  }

  return {
    items, cargarFotos, cargarStickers, cargarVideos, cargarPrincipal,
    activar, actualizar, ajustarAspecto,
    onAbrir(fn) { alAbrir = fn; },
    ligarLatido(fn) { latidoFn = fn; },
    get hayPrincipal() { return !!principal; }
  };
}
