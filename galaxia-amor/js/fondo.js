/* =====================================================================
   FONDO  -  nebulosas de colores, estrellas cuadradas y fugaces
   (no necesitas editar este archivo; los colores estan en config.js)
   ===================================================================== */

function crearFondo(THREE, escena, cfg, U) {

  const grupo = new THREE.Group();
  escena.add(grupo);

  /* ---------- NEBULOSAS (manchas de color que se mueven despacio) ---------- */
  const paleta = cfg.colores.nebulosas;
  const texturas = paleta.map(hex => {
    const [r, g, b] = Util.hexRGB(hex);
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    const gr = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, `rgba(${r},${g},${b},0.60)`);
    gr.addColorStop(0.45, `rgba(${r},${g},${b},0.22)`);
    gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr;
    x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.minFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    return t;
  });

  const nebulosas = [];
  const NEB = Util.esMovil ? 9 : 14;
  for (let i = 0; i < NEB; i++) {
    const mat = new THREE.SpriteMaterial({
      map: texturas[i % texturas.length],
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0
    });
    const s = new THREE.Sprite(mat);
    const ang = Math.random() * Math.PI * 2;
    const dist = Util.rand(380, 720);
    const y0 = Util.rand(-140, 280);
    const tam = Util.rand(380, 700);
    s.scale.set(tam, tam * Util.rand(0.6, 1), 1);
    s.renderOrder = -4;
    s.position.set(Math.cos(ang) * dist, y0, Math.sin(ang) * dist);
    grupo.add(s);
    nebulosas.push({
      s, mat, ang, dist, y0,
      base: Util.rand(0.16, 0.36) * (cfg.colores.nebulosaIntensidad || 1),
      f: Util.rand(0.05, 0.16),
      ph: Util.rand(0, 6.28),
      vel: Util.rand(0.004, 0.012)
    });
  }

  /* ---------- ESTRELLAS (cuadraditos que titilan, como en el video) ---------- */
  const n = Util.esMovil ? Math.round(cfg.estrellas.cantidad * 0.6) : cfg.estrellas.cantidad;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const tam = new Float32Array(n);
  const rnd = new Float32Array(n);
  const tintes = [[1, 1, 1], [0.85, 0.9, 1], [1, 0.88, 0.95], [1, 0.97, 0.85]];
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = Util.rand(260, 950);
    const s = Math.sqrt(1 - u * u);
    pos[i * 3] = r * s * Math.cos(th);
    pos[i * 3 + 1] = r * u;
    pos[i * 3 + 2] = r * s * Math.sin(th);
    const t = tintes[Math.floor(Math.random() * tintes.length)];
    col.set(t, i * 3);
    tam[i] = Math.random() < 0.035 ? Util.rand(3.5, 6.5) : Util.rand(0.5, 1.7);
    rnd[i] = Math.random();
  }
  const geoE = new THREE.BufferGeometry();
  geoE.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geoE.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geoE.setAttribute('aSize', new THREE.BufferAttribute(tam, 1));
  geoE.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  const uFadeEstrellas = { value: 1 };
  const matE = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uScale: U.uScale, uMin: U.uMin, uFade: uFadeEstrellas },
    vertexShader: `
      attribute vec3 aColor; attribute float aSize; attribute float aRand;
      uniform float uTime, uScale, uMin, uFade;
      varying vec3 vColor; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = 0.55 + 0.45 * sin(uTime * (0.5 + aRand * 2.0) + aRand * 60.0);
        gl_PointSize = max(uMin, aSize * uScale / (-mv.z));
        vColor = aColor; vA = uFade * tw;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vA;
      void main(){ gl_FragColor = vec4(vColor, vA); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const estrellas = new THREE.Points(geoE, matE);
  estrellas.frustumCulled = false;
  estrellas.renderOrder = -3;
  grupo.add(estrellas);

  /* ---------- ESTRELLAS FUGACES ---------- */
  const fugaces = [];
  const LARGO = 26;
  if (cfg.estrellas.fugaces) {
    for (let i = 0; i < 3; i++) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LARGO * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(LARGO * 3), 3));
      const m = new THREE.PointsMaterial({
        size: 3, sizeAttenuation: false, vertexColors: true,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
      });
      const p = new THREE.Points(g, m);
      p.frustumCulled = false;
      p.visible = false;
      grupo.add(p);
      fugaces.push({ p, g, vida: 0, dur: 1, cab: new THREE.Vector3(), dir: new THREE.Vector3(), vel: 300 });
    }
  }
  let proximaFugaz = 5;
  const vR = new THREE.Vector3(), vU = new THREE.Vector3(), vF = new THREE.Vector3();

  function lanzarFugaz(camera) {
    const f = fugaces.find(x => x.vida <= 0);
    if (!f) return;
    camera.updateMatrixWorld();
    const m = camera.matrixWorld.elements;
    vR.set(m[0], m[1], m[2]);
    vU.set(m[4], m[5], m[6]);
    vF.set(-m[8], -m[9], -m[10]);
    const signo = Math.random() < 0.5 ? -1 : 1;
    f.cab.copy(camera.position)
      .addScaledVector(vF, 230)
      .addScaledVector(vR, -signo * Util.rand(40, 140))
      .addScaledVector(vU, Util.rand(30, 110));
    f.dir.copy(vR).multiplyScalar(signo).addScaledVector(vU, -Util.rand(0.25, 0.6)).normalize();
    f.vel = Util.rand(260, 380);
    f.dur = Util.rand(0.9, 1.5);
    f.vida = f.dur;
    f.p.visible = true;
  }

  function actualizarFugaz(f, dt) {
    f.vida -= dt;
    if (f.vida <= 0) { f.p.visible = false; return; }
    f.cab.addScaledVector(f.dir, f.vel * dt);
    const pa = f.g.attributes.position.array;
    const ca = f.g.attributes.color.array;
    const k = Math.sin(Math.PI * (1 - f.vida / f.dur));
    for (let i = 0; i < LARGO; i++) {
      const d = i * 3.2;
      pa[i * 3] = f.cab.x - f.dir.x * d;
      pa[i * 3 + 1] = f.cab.y - f.dir.y * d;
      pa[i * 3 + 2] = f.cab.z - f.dir.z * d;
      const b = (1 - i / LARGO) * k;
      ca[i * 3] = b; ca[i * 3 + 1] = b * 0.95; ca[i * 3 + 2] = b;
    }
    f.g.attributes.position.needsUpdate = true;
    f.g.attributes.color.needsUpdate = true;
  }

  /* ---------- ACTUALIZAR CADA FOTOGRAMA ---------- */
  function actualizar(t, dt, fade, camera) {
    nebulosas.forEach(o => {
      o.ang += o.vel * dt;
      o.s.position.x = Math.cos(o.ang) * o.dist;
      o.s.position.z = Math.sin(o.ang) * o.dist;
      o.s.position.y = o.y0 + Math.sin(t * 0.05 + o.ph) * 30;
      o.mat.opacity = fade * o.base * (0.55 + 0.45 * Math.sin(t * o.f + o.ph));
    });
    if (cfg.estrellas.fugaces) {
      proximaFugaz -= dt;
      if (proximaFugaz <= 0 && fade > 0.9) {
        lanzarFugaz(camera);
        proximaFugaz = Util.rand(3.5, 8);
      }
      fugaces.forEach(f => { if (f.vida > 0) actualizarFugaz(f, dt); });
    }
  }

  return { grupo, actualizar };
}
