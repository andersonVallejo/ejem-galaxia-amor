/* =====================================================================
   CAMARA  -  movimiento inicial (de lado -> desde arriba), giro
   automatico y control con dedo/mouse: arrastrar = girar, pellizcar o
   rueda = acercar/alejar, toque = interactuar.
   (los valores se cambian en config.js, seccion "camara")
   ===================================================================== */

function crearCamara(THREE, cfg, canvas) {
  const c = cfg.camara;
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.5, 4000);
  const objetivo = new THREE.Vector3(0, c.alturaObjetivo, 0);

  const inicio = { az: 0.5, el: 0.025, rad: c.distancia * 1.7 };
  const fin = { az: 0.5 + 1.1, el: c.elevacion, rad: c.distancia };

  const est = { az: inicio.az, el: inicio.el, vAz: 0, vEl: 0 };
  let radUser = inicio.rad;
  let mult = 1;
  let introActiva = false;
  let introTerminada = false;
  let introP = 0;
  let t = 0;
  let ultimaInteraccion = -99;
  let arrastrando = false;

  const callbacks = { tap: null, hover: null };

  function ajustarAspecto() {
    const a = innerWidth / innerHeight;
    mult = a < 1 ? 1 + (1 - a) * 0.85 : 1;
    camera.aspect = a;
    camera.updateProjectionMatrix();
  }
  ajustarAspecto();

  function iniciarIntro() {
    introActiva = true;
    introP = 0;
  }

  function update(dt) {
    t += dt;

    if (introActiva) {
      introP = Math.min(1, introP + dt / c.duracionIntro);
      const e = Util.easeInOut(introP);
      est.az = Util.lerp(inicio.az, fin.az, e);
      est.el = Util.lerp(inicio.el, fin.el, e);
      radUser = Util.lerp(inicio.rad, fin.rad, e);
      if (introP >= 1) { introActiva = false; introTerminada = true; }
    } else if (introTerminada) {
      est.az += est.vAz * dt;
      est.el += est.vEl * dt;
      const f = Math.exp(-2.6 * dt);
      est.vAz *= f;
      est.vEl *= f;
      if (!arrastrando && c.autoRotar) {
        const quieto = t - ultimaInteraccion - 2.5;
        if (quieto > 0) est.az += c.velocidadAuto * dt * Util.suave(Math.min(1, quieto / 2));
      }
      est.el = Util.clamp(est.el, 0.02, 1.4);
    }

    const respira = Math.sin(t * 0.2) * 0.01;
    const el = est.el + Math.sin(t * 0.25) * 0.012;
    const rad = radUser * mult * (1 + respira);
    camera.position.set(
      objetivo.x + rad * Math.cos(el) * Math.sin(est.az),
      objetivo.y + rad * Math.sin(el),
      objetivo.z + rad * Math.cos(el) * Math.cos(est.az)
    );
    camera.lookAt(objetivo);
  }

  /* ---------- Control con dedo / mouse ---------- */
  const punteros = new Map();
  let ultimoPinch = 0;
  let down = null;

  const distPunteros = () => {
    const p = [...punteros.values()];
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  };

  canvas.addEventListener('pointerdown', e => {
    canvas.setPointerCapture(e.pointerId);
    punteros.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    if (punteros.size === 1) {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), mov: 0 };
      arrastrando = true;
    } else if (punteros.size === 2) {
      ultimoPinch = distPunteros();
      down = null;
    }
    ultimaInteraccion = t;
  });

  canvas.addEventListener('pointermove', e => {
    const p = punteros.get(e.pointerId);
    if (!p) {
      if (callbacks.hover) callbacks.hover(e.clientX, e.clientY);
      return;
    }
    const ahora = performance.now();
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    const dts = Math.max((ahora - p.t) / 1000, 0.008);
    p.x = e.clientX; p.y = e.clientY; p.t = ahora;
    ultimaInteraccion = t;

    if (punteros.size === 1) {
      if (down) down.mov += Math.hypot(dx, dy);
      if (introTerminada) {
        est.az -= dx * 0.0055;
        est.el += dy * 0.0045;
        est.vAz = Util.clamp(-dx * 0.0055 / dts, -3, 3);
        est.vEl = Util.clamp(dy * 0.0045 / dts, -2, 2);
      }
    } else if (punteros.size === 2 && introTerminada) {
      const d = distPunteros();
      if (ultimoPinch > 0) {
        radUser = Util.clamp(radUser * (ultimoPinch / d), c.zoomMin, c.zoomMax);
      }
      ultimoPinch = d;
    }
  });

  function soltar(e, conTap) {
    if (!punteros.has(e.pointerId)) return;
    punteros.delete(e.pointerId);
    if (conTap && down && down.mov < 8 && performance.now() - down.t < 450 && callbacks.tap) {
      callbacks.tap(e.clientX, e.clientY);
    }
    if (punteros.size === 0) { arrastrando = false; down = null; }
    ultimaInteraccion = t;
  }
  canvas.addEventListener('pointerup', e => soltar(e, true));
  canvas.addEventListener('pointercancel', e => soltar(e, false));

  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (!introTerminada) return;
    radUser = Util.clamp(radUser * Math.exp(e.deltaY * 0.0012), c.zoomMin, c.zoomMax);
    ultimaInteraccion = t;
  }, { passive: false });

  return {
    camera,
    update,
    iniciarIntro,
    ajustarAspecto,
    onTap(fn) { callbacks.tap = fn; },
    onHover(fn) { callbacks.hover = fn; },
    get introTerminada() { return introTerminada; }
  };
}
