/* =====================================================================
   CORAZONES FLOTANTES  -  corazones brillantes de varios colores que
   suben despacio sobre el disco de la galaxia y se desvanecen.
   (cantidad y colores se cambian en config.js)
   ===================================================================== */

function crearCorazonesFlotantes(THREE, escena, cfg) {
  const c = cfg.corazonesFlotantes;
  const n = Util.esMovil ? c.cantidadMovil : c.cantidad;
  const colores = cfg.colores.corazonesMini;

  /* una textura por color (se reutiliza en todos los corazones de ese color) */
  const texturas = colores.map(hex => {
    const t = new THREE.CanvasTexture(Util.corazonCanvas(hex, 128));
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  });

  const Y_MIN = -1;
  const Y_MAX = 34;
  const lista = [];
  const grupo = new THREE.Group();
  escena.add(grupo);

  function reiniciar(h, alAzar) {
    h.r = Util.rand(10, 86);
    h.th = Math.random() * Math.PI * 2;
    h.y = alAzar ? Util.rand(Y_MIN, Y_MAX) : Y_MIN;
    h.vy = Util.rand(0.9, 2.6) * c.velocidad;
    h.tam = Math.random() < 0.22 ? Util.rand(3.6, 5.6) : Util.rand(1.3, 3.0);
    h.ph = Util.rand(0, 6.28);
    h.bal = Util.rand(0.6, 2.4);
    h.w = Util.rand(0.01, 0.035);
  }

  for (let i = 0; i < n; i++) {
    const mat = new THREE.SpriteMaterial({
      map: texturas[i % texturas.length],
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0
    });
    const sp = new THREE.Sprite(mat);
    sp.renderOrder = 4;
    grupo.add(sp);
    const h = { sp, mat };
    reiniciar(h, true);
    lista.push(h);
  }

  function actualizar(t, dt, fade) {
    for (let i = 0; i < lista.length; i++) {
      const h = lista[i];
      h.y += h.vy * dt;
      h.th += h.w * dt;
      if (h.y > Y_MAX) reiniciar(h, false);

      const k = (h.y - Y_MIN) / (Y_MAX - Y_MIN);
      const vida = Math.sin(Math.PI * Util.clamp(k, 0, 1));
      const x = Math.cos(h.th) * h.r + Math.sin(t * 0.7 + h.ph) * h.bal;
      const z = Math.sin(h.th) * h.r + Math.cos(t * 0.6 + h.ph) * h.bal;
      h.sp.position.set(x, h.y, z);

      const latido = 1 + 0.12 * Math.sin(t * 3 + h.ph);
      const s = h.tam * latido;
      h.sp.scale.set(s, s, 1);
      h.mat.opacity = fade * Math.pow(vida, 0.6) * 0.85;
      h.mat.rotation = Math.sin(t * 0.8 + h.ph) * 0.25;
    }
  }

  return { grupo, actualizar };
}
