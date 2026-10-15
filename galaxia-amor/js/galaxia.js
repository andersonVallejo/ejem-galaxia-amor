/* =====================================================================
   GALAXIA  -  la espiral de miles de particulas del centro, con su
   agujero negro luminoso (estilo "rosa" y "violeta") o su nucleo
   brillante (estilo "cosmos").
   (el estilo y la cantidad se cambian en config.js)
   ===================================================================== */

/* Genera las posiciones/colores de las particulas (sin usar WebGL) */
function generarGalaxia(cfg) {
  const g = cfg.galaxia;
  const c = cfg.colores;
  const N = Util.esMovil ? g.particulasMovil : g.particulas;
  const R = g.radio;
  const hueco = c.agujeroNegro ? R * 0.085 : 0;      // radio del agujero negro
  const h = R * 0.27;                                 // escala de caida de densidad
  const pos = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const tam = new Float32Array(N);
  const rnd = new Float32Array(N);
  const cN = Util.hexRGB01(c.nucleo);
  const cM = Util.hexRGB01(c.brazos);
  const cB = Util.hexRGB01(c.borde);
  const mult = c.tamParticula || 1;

  const mezcla = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const colorEn = t => (t < 0.45 ? mezcla(cN, cM, t / 0.45) : mezcla(cM, cB, (t - 0.45) / 0.55));
  const corte = 1 - Math.exp(-(R - hueco) / h);

  for (let i = 0; i < N; i++) {
    const tipo = Math.random();
    let x, y, z, col3, s, br;

    if (tipo < (hueco ? 0.12 : 0.13)) {
      if (hueco) {
        /* ANILLO luminoso alrededor del agujero negro */
        const r = hueco * (1.0 + Math.abs(Util.gauss()) * 0.35);
        const th = Math.random() * Math.PI * 2;
        x = r * Math.cos(th);
        z = r * Math.sin(th);
        y = Util.gauss() * R * 0.006;
        col3 = mezcla(cN, [1, 1, 1], 0.5);
        s = Util.rand(0.16, 0.34);
        br = Util.rand(0.8, 1.2);
      } else {
        /* NUCLEO brillante */
        const r = Math.abs(Util.gauss()) * R * 0.11;
        const th = Math.random() * Math.PI * 2;
        x = r * Math.cos(th);
        z = r * Math.sin(th);
        y = Util.gauss() * R * 0.03;
        col3 = mezcla(cN, [1, 1, 1], 0.4);
        s = Util.rand(0.14, 0.34);
        br = Util.rand(0.8, 1.1);
      }
    } else if (tipo < 0.68) {
      /* BRAZOS espirales */
      let r = hueco + (-h * Math.log(1 - Math.random() * corte));
      const brazo = Math.floor(Math.random() * g.brazos);
      let th = brazo * (2 * Math.PI / g.brazos) + (r / R) * g.giro;
      th += Util.gauss() * 0.36 * (1 - 0.4 * r / R);
      r += Util.gauss() * R * 0.03;
      r = Math.max(r, hueco * 1.15);
      x = r * Math.cos(th);
      z = r * Math.sin(th);
      y = Util.gauss() * (R * 0.008 + (1 - Math.min(r / R, 1)) * R * 0.012);
      col3 = colorEn(Util.clamp(r / R, 0, 1));
      s = Util.rand(0.13, 0.32);
      br = Util.rand(0.55, 1.0);
    } else {
      /* POLVO difuso del disco (la nube ancha que rodea la galaxia) */
      const r = Math.max(hueco * 1.2, R * 1.12 * Math.pow(Math.random(), 0.85));
      const th = Math.random() * Math.PI * 2;
      x = r * Math.cos(th);
      z = r * Math.sin(th);
      y = Util.gauss() * R * 0.016;
      col3 = colorEn(Util.clamp(r / R, 0, 1));
      s = Util.rand(0.12, 0.28);
      br = Util.rand(0.25, 0.55);
    }

    /* algunas estrellitas mas grandes y brillantes */
    if (Math.random() < 0.025) {
      s *= 2.6;
      br = 1.0;
      col3 = mezcla(col3, [1, 1, 1], 0.55);
    }

    pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    col[i * 3] = col3[0] * br; col[i * 3 + 1] = col3[1] * br; col[i * 3 + 2] = col3[2] * br;
    tam[i] = s * mult;
    rnd[i] = Math.random();
  }
  return { N, pos, col, tam, rnd, hueco };
}

function crearGalaxia(THREE, escena, cfg, U) {
  const d = generarGalaxia(cfg);
  const c = cfg.colores;

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(d.pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(d.col, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(d.tam, 1));
  geo.setAttribute('aRand', new THREE.BufferAttribute(d.rnd, 1));

  const uFade = { value: 0 };
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uScale: U.uScale, uMin: U.uMin, uFade },
    vertexShader: `
      attribute vec3 aColor; attribute float aSize; attribute float aRand;
      uniform float uTime, uScale, uMin, uFade;
      varying vec3 vColor; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.75 + 0.25 * sin(uTime * (0.6 + aRand * 3.0) + aRand * 50.0);
        gl_PointSize = max(uMin, aSize * uScale / (-mv.z));
        vColor = aColor * tw;
        vA = uFade * 0.62;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vColor, a * vA);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const puntos = new THREE.Points(geo, mat);
  puntos.frustumCulled = false;
  puntos.renderOrder = 0;
  escena.add(puntos);

  const cuadro = (hex0, hex1, hex2) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const x = cv.getContext('2d');
    const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, hex0);
    gr.addColorStop(0.35, hex1);
    gr.addColorStop(1, hex2);
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(cv);
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  };

  let matAgujero = null;
  let matBrillo = null;
  let matHalo = null;

  if (d.hueco) {
    /* ---------- AGUJERO NEGRO: disco negro con anillo brillante ---------- */
    const [r, g, b] = Util.hexRGB(c.corazon);
    const cv = document.createElement('canvas');
    cv.width = cv.height = 512;
    const x = cv.getContext('2d');
    const gr = x.createRadialGradient(256, 256, 0, 256, 256, 256);
    gr.addColorStop(0.00, 'rgba(0,0,0,1)');
    gr.addColorStop(0.27, 'rgba(0,0,0,1)');
    gr.addColorStop(0.31, 'rgba(255,245,250,1)');
    gr.addColorStop(0.36, 'rgba(255,235,246,0.95)');
    gr.addColorStop(0.43, `rgba(${r},${g},${b},0.75)`);
    gr.addColorStop(0.60, `rgba(${r},${g},${b},0.20)`);
    gr.addColorStop(1.00, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr;
    x.fillRect(0, 0, 512, 512);
    const tex = new THREE.CanvasTexture(cv);
    tex.minFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;
    matAgujero = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, depthTest: false, opacity: 0
    });
    /* el disco negro mide 0.27 de la mitad del plano -> plano = hueco / 0.27 * 2 */
    const lado = d.hueco / 0.27 * 2 * 1.02;
    const agujero = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado), matAgujero);
    agujero.rotation.x = -Math.PI / 2;
    agujero.position.y = 0.05;
    agujero.renderOrder = 1;
    escena.add(agujero);
  } else {
    /* ---------- NUCLEO: resplandor blanco del centro ---------- */
    const tex = cuadro('rgba(255,244,224,0.95)', 'rgba(255,225,240,0.30)', 'rgba(120,90,220,0)');
    matBrillo = new THREE.SpriteMaterial({
      map: tex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0
    });
    const brillo = new THREE.Sprite(matBrillo);
    brillo.scale.set(34, 34, 1);
    brillo.renderOrder = 2;
    escena.add(brillo);
  }

  /* ---------- Halo ancho y plano del disco ---------- */
  const [hr, hg, hb] = Util.hexRGB(c.brazos);
  const texHalo = cuadro(`rgba(${hr},${hg},${hb},0.55)`, `rgba(${hr},${hg},${hb},0.16)`, `rgba(${hr},${hg},${hb},0)`);
  matHalo = new THREE.SpriteMaterial({
    map: texHalo, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0
  });
  const halo = new THREE.Sprite(matHalo);
  halo.scale.set(cfg.galaxia.radio * 2.1, cfg.galaxia.radio * 1.0, 1);
  halo.position.y = -0.5;
  halo.renderOrder = -1;
  escena.add(halo);

  function actualizar(t, dt, fade) {
    uFade.value = fade;
    puntos.rotation.y += dt * cfg.galaxia.velocidadGiro;
    if (matAgujero) matAgujero.opacity = fade;
    if (matBrillo) matBrillo.opacity = fade * (0.55 + 0.1 * Math.sin(t * 1.3));
    matHalo.opacity = fade * (d.hueco ? 0.13 : 0.10);
  }

  return { puntos, actualizar };
}
