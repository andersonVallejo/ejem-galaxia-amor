/* =====================================================================
   CAPA 3D (HTML)  -  coloca elementos HTML (frases, fotos, stickers)
   dentro del mundo 3D, con la MISMA camara que la galaxia.
   Ventaja: las fotos y los textos son HTML normal, asi que se ven
   nitidos, funcionan aunque abras el archivo con doble clic, y se
   pueden tocar sin errores.
   (no necesitas editar este archivo)
   ===================================================================== */

function crearCapa3D(THREE, camera) {
  const vista = document.getElementById('vista3d-vista');
  const camEl = document.getElementById('vista3d-camara');
  const dom = document.getElementById('vista3d');
  let W = innerWidth;
  let H = innerHeight;
  let fov = 1;

  const eps = v => (Math.abs(v) < 1e-10 ? 0 : v);

  /* matriz de la camara -> texto CSS (el eje Y se invierte porque en CSS Y va hacia abajo) */
  function matrizCamara(m) {
    const e = m.elements;
    return 'matrix3d(' + [e[0], -e[1], e[2], e[3], e[4], -e[5], e[6], e[7],
      e[8], -e[9], e[10], e[11], e[12], -e[13], e[14], e[15]].map(eps).join(',') + ')';
  }

  /* matriz de un objeto -> texto CSS */
  function matrizObjeto(m) {
    const e = m.elements;
    return 'translate(-50%,-50%) matrix3d(' + [e[0], e[1], e[2], e[3], -e[4], -e[5], -e[6], -e[7],
      e[8], e[9], e[10], e[11], e[12], e[13], e[14], e[15]].map(eps).join(',') + ')';
  }

  function redimensionar() {
    W = innerWidth;
    H = innerHeight;
    dom.style.width = vista.style.width = camEl.style.width = W + 'px';
    dom.style.height = vista.style.height = camEl.style.height = H + 'px';
  }

  /* llamar una vez por fotograma, despues de mover la camara */
  function actualizarCamara() {
    camera.updateMatrixWorld();
    fov = camera.projectionMatrix.elements[5] * H / 2;
    vista.style.perspective = fov + 'px';
    camEl.style.transform = 'translateZ(' + fov + 'px)' + matrizCamara(camera.matrixWorldInverse) +
      'translate(' + (W / 2) + 'px,' + (H / 2) + 'px)';
  }

  function agregar(el) { camEl.appendChild(el); }

  redimensionar();
  return { redimensionar, actualizarCamara, agregar, matrizObjeto, matrizCamara, get fov() { return fov; } };
}
