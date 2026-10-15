/* =====================================================================
   CORAZON  -  columna de particulas que sube del centro de la galaxia,
   forma un corazon que late, y el texto "Te amo" en medio
   (tamano, altura y tiempos se cambian en config.js)
   ===================================================================== */

/* Punto del contorno del corazon (formula clasica), t entre 0 y 2*PI */
function puntoCorazon(t) {
  const x = 16 * Math.pow(Math.sin(t), 3);
  const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
  return [x, y];
}

/* Dice si un punto (x,y) esta dentro del corazon (para el relleno de particulas) */
function crearTestCorazon() {
  const poli = [];
  for (let i = 0; i < 240; i++) poli.push(puntoCorazon((i / 240) * Math.PI * 2));
  return (x, y) => {
    let dentro = false;
    for (let i = 0, j = poli.length - 1; i < poli.length; j = i++) {
      const xi = poli[i][0], yi = poli[i][1], xj = poli[j][0], yj = poli[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dentro = !dentro;
    }
    return dentro;
  };
}

/* Genera las particulas del corazon (sin usar WebGL) */
function generarCorazon(cfg) {
  const k = cfg.corazon;
  const c = cfg.colores;
  const N = Util.esMovil ? k.particulasMovil : k.particulas;
  const s = k.tamano / 32;                 // escala: el corazon mide 32 de ancho
  const cy = k.altura;
  const grosor = k.grosor;
  const target = new Float32Array(N * 3);
  const start = new Float32Array(N * 3);
  const col = new Float32Array(N * 3);
  const delay = new Float32Array(N);
  const rnd = new Float32Array(N);
  const tam = new Float32Array(N);
  const cH = Util.hexRGB01(c.corazon);
  const cR = Util.hexRGB01(c.corazonRelleno);
  const dentro = crearTestCorazon();
  const mezcla = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  for (let i = 0; i < N; i++) {
    const relleno = Math.random() < c.relleno;
    let x, y, z, sz, br, color, u;

    if (relleno) {
      /* relleno: particulas repartidas por todo el interior del corazon */
      let px, py, intentos = 0;
      do {
        px = Util.rand(-16, 16);
        py = Util.rand(-17, 12);
        intentos++;
      } while (!dentro(px, py) && intentos < 40);
      x = px * s;
      y = py * s + cy;
      z = Util.gauss() * 1.6 * grosor;
      sz = Util.rand(0.17, 0.46);
      br = Util.rand(0.35, 0.9);
      color = mezcla(cR, [1, 1, 1], Math.random() * 0.25);
      u = Util.clamp((py + 17) / 29, 0, 1);       // de abajo (0) hacia arriba (1)
    } else {
      /* contorno brillante */
      const t = Math.random() * Math.PI * 2;
      const [hx, hy] = puntoCorazon(t);
      x = hx * s + Util.gauss() * 0.9 * grosor;
      y = hy * s + cy + Util.gauss() * 0.9 * grosor;
      z = Util.gauss() * 1.3 * grosor;
      sz = Util.rand(0.2, 0.55);
      br = Util.rand(0.65, 1.0);
      const q = Math.random();
      color = q < 0.45 ? mezcla(cH, [1, 1, 1], 0.6) : (q < 0.85 ? cH : mezcla(cH, [1, 1, 1], 0.9));
      u = Math.abs(t - Math.PI) / Math.PI;       // 0 = punta, 1 = hendidura de arriba
    }
    target[i * 3] = x; target[i * 3 + 1] = y; target[i * 3 + 2] = z;

    /* salen del centro de la galaxia */
    start[i * 3] = Util.gauss() * 1.6;
    start[i * 3 + 1] = Math.abs(Util.gauss()) * 1.0;
    start[i * 3 + 2] = Util.gauss() * 1.6;

    /* el corazon se dibuja desde la punta de abajo hacia los lobulos de arriba */
    delay[i] = 0.5 * Math.pow(u, 0.9) + Math.random() * 0.08;

    col[i * 3] = color[0] * br; col[i * 3 + 1] = color[1] * br; col[i * 3 + 2] = color[2] * br;
    rnd[i] = Math.random();
    tam[i] = sz;
  }
  const puntaY = cy - 17 * s;
  return { N, target, start, col, delay, rnd, tam, cy, s, puntaY };
}

function crearCorazon(THREE, escena, cfg, U) {
  const d = generarCorazon(cfg);
  const grupo = new THREE.Group();
  escena.add(grupo);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(d.start, 3));
  geo.setAttribute('aStart', new THREE.BufferAttribute(d.start, 3));
  geo.setAttribute('aTarget', new THREE.BufferAttribute(d.target, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(d.col, 3));
  geo.setAttribute('aDelay', new THREE.BufferAttribute(d.delay, 1));
  geo.setAttribute('aRand', new THREE.BufferAttribute(d.rnd, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(d.tam, 1));

  const uProg = { value: 0 };
  const uBeat = { value: 0 };
  const uFade = { value: 1 };
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.uTime, uScale: U.uScale, uMin: U.uMin,
      uFade, uProg, uBeat, uCy: { value: d.cy }
    },
    vertexShader: `
      attribute vec3 aStart; attribute vec3 aTarget; attribute vec3 aColor;
      attribute float aDelay; attribute float aRand; attribute float aSize;
      uniform float uTime, uScale, uMin, uFade, uProg, uBeat, uCy;
      varying vec3 vColor; varying float vA;
      void main(){
        float k = clamp((uProg - aDelay) / 0.42, 0.0, 1.0);
        float e = k * k * (3.0 - 2.0 * k);
        vec3 p = mix(aStart, aTarget, e);
        float sw = sin(k * 3.14159) * (2.5 + aRand * 5.0);
        float an = aRand * 6.2831 + k * 10.0 + uTime * 0.6;
        p.x += cos(an) * sw;
        p.z += sin(an) * sw;
        float live = smoothstep(0.85, 1.0, k);
        p += vec3(sin(uTime * (0.6 + aRand) + aRand * 20.0),
                  cos(uTime * (0.5 + aRand) + aRand * 13.0),
                  sin(uTime * 0.8 + aRand * 7.0)) * 0.45 * live;
        vec3 c = vec3(0.0, uCy, 0.0);
        p = c + (p - c) * (1.0 + uBeat * live);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float tw = 0.55 + 0.45 * sin(uTime * (1.0 + aRand * 4.0) + aRand * 100.0);
        gl_PointSize = max(uMin, aSize * uScale / (-mv.z));
        vColor = aColor;
        vA = uFade * tw * smoothstep(0.0, 0.08, k) * (0.55 + 0.45 * live);
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
  const corazon = new THREE.Points(geo, mat);
  corazon.frustumCulled = false;
  corazon.renderOrder = 3;
  grupo.add(corazon);

  /* ---------- Columna fina que sigue conectando galaxia y corazon ---------- */
  const M = Util.esMovil ? 1500 : 2600;
  const fRnd = new Float32Array(M);
  const fTam = new Float32Array(M);
  const fCol = new Float32Array(M * 3);
  const cH = Util.hexRGB01(cfg.colores.corazon);
  for (let i = 0; i < M; i++) {
    fRnd[i] = Math.random();
    fTam[i] = Util.rand(0.16, 0.4);
    const q = Math.random();
    const c = q < 0.6 ? [1, 1, 1] : cH;
    const b = Util.rand(0.5, 1);
    fCol[i * 3] = c[0] * b; fCol[i * 3 + 1] = c[1] * b; fCol[i * 3 + 2] = c[2] * b;
  }
  const geoF = new THREE.BufferGeometry();
  geoF.setAttribute('position', new THREE.BufferAttribute(new Float32Array(M * 3), 3));
  geoF.setAttribute('aRand', new THREE.BufferAttribute(fRnd, 1));
  geoF.setAttribute('aSize', new THREE.BufferAttribute(fTam, 1));
  geoF.setAttribute('aColor', new THREE.BufferAttribute(fCol, 3));
  const uFadeF = { value: 0 };
  const matF = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uScale: U.uScale, uMin: U.uMin, uFade: uFadeF, uTip: { value: d.puntaY } },
    vertexShader: `
      attribute float aRand; attribute float aSize; attribute vec3 aColor;
      uniform float uTime, uScale, uMin, uFade, uTip;
      varying vec3 vColor; varying float vA;
      void main(){
        float ph = fract(uTime * (0.07 + aRand * 0.07) + aRand * 7.0);
        float rad = (0.8 + 2.6 * sin(ph * 3.14159)) * (0.4 + aRand);
        float an = ph * 16.0 + aRand * 6.2831 + uTime * 0.8;
        vec3 p = vec3(cos(an) * rad, ph * uTip, sin(an) * rad);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float tw = 0.6 + 0.4 * sin(uTime * (1.0 + aRand * 3.0) + aRand * 80.0);
        gl_PointSize = max(uMin, aSize * uScale / (-mv.z));
        vColor = aColor;
        vA = uFade * sin(ph * 3.14159) * tw;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vA);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const flujo = new THREE.Points(geoF, matF);
  flujo.frustumCulled = false;
  flujo.renderOrder = 3;
  grupo.add(flujo);

  /* ---------- Resplandor rosado detras del corazon ---------- */
  const cv = document.createElement('canvas');
  cv.width = cv.height = 256;
  const gx = cv.getContext('2d');
  const gr = gx.createRadialGradient(128, 128, 0, 128, 128, 128);
  const [gr0, gg0, gb0] = Util.hexRGB(cfg.colores.corazon);
  gr.addColorStop(0, `rgba(${gr0},${gg0},${gb0},0.50)`);
  gr.addColorStop(0.5, `rgba(${gr0},${gg0},${gb0},0.14)`);
  gr.addColorStop(1, `rgba(${gr0},${gg0},${gb0},0)`);
  gx.fillStyle = gr;
  gx.fillRect(0, 0, 256, 256);
  const matGlow = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, opacity: 0
  });
  const glow = new THREE.Sprite(matGlow);
  glow.scale.set(cfg.corazon.tamano * 2.0, cfg.corazon.tamano * 1.8, 1);
  glow.position.set(0, d.cy - 1, 0);
  glow.renderOrder = 2;
  escena.add(glow);

  /* ---------- Texto central ("Te amo") ---------- */
  const em = 4.6;
  const tc = Util.textoCanvas(cfg.textoCentral, {
    tam: 96, peso: 700, estilo: 'italic', familia: cfg.fuentes.titulo,
    color: '#ffffff', brillo: cfg.colores.brillo
  });
  const texTexto = new THREE.CanvasTexture(tc.c);
  texTexto.minFilter = THREE.LinearFilter;
  texTexto.generateMipmaps = false;
  const matTexto = new THREE.SpriteMaterial({ map: texTexto, transparent: true, depthWrite: false, opacity: 0 });
  const texto = new THREE.Sprite(matTexto);
  const altoMundo = em * 2.2;
  texto.scale.set(altoMundo * tc.w / tc.h, altoMundo, 1);
  texto.position.set(0, d.cy + 1.2 * d.s, 0.5);
  texto.renderOrder = 5;
  escena.add(texto);
  const estado = { textoVisible: true };

  /* ---------- Cada fotograma ---------- */
  let yaw = 0;
  function actualizar(t, dt, progreso, camera) {
    uProg.value = progreso;

    /* latido: lub-dub */
    if (cfg.corazon.latido) {
      const a = Math.pow(Math.max(0, Math.sin(t * 3.2)), 8) * 0.045;
      const b = Math.pow(Math.max(0, Math.sin(t * 3.2 - 0.9)), 8) * 0.025;
      uBeat.value = a + b;
    } else uBeat.value = 0;

    /* el corazon siempre mira hacia la camara */
    const objetivo = Math.atan2(camera.position.x, camera.position.z);
    let dif = objetivo - yaw;
    while (dif > Math.PI) dif -= Math.PI * 2;
    while (dif < -Math.PI) dif += Math.PI * 2;
    yaw += dif * Math.min(1, dt * 2.2);
    grupo.rotation.y = yaw;

    uFadeF.value = Util.suave(Util.clamp(progreso / 0.12, 0, 1)) * (0.5 + 0.5 * Util.suave(Util.clamp((progreso - 0.2) / 0.3, 0, 1))) * 0.9;

    const aparece = Util.suave(Util.clamp((progreso - 0.82) / 0.18, 0, 1));
    matTexto.opacity = estado.textoVisible ? aparece : 0;
    matGlow.opacity = Util.suave(Util.clamp((progreso - 0.5) / 0.5, 0, 1)) * (0.8 + 0.2 * Math.sin(t * 3.2));
    texto.position.y = d.cy + 1.2 * d.s + Math.sin(t * 0.9) * 0.5;
    const pulso = 1 + (cfg.corazon.latido ? uBeat.value * 1.2 : 0);
    texto.scale.set(altoMundo * tc.w / tc.h * pulso, altoMundo * pulso, 1);
  }

  return { grupo, actualizar, estado, cy: d.cy, s: d.s, get beat() { return uBeat.value; } };
}
