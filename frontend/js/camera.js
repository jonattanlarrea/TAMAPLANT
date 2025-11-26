// camera.js - Controles de cámara, rotación y zoom

function setupCameraControls() {
  const canvas = document.getElementById('scene');
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotation = { x: 0, y: 0 };

  // Rotación con mouse
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  canvas.addEventListener('mousemove', e => {
    if (isDragging) {
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      rotation.y += deltaX * 0.01;
      rotation.x += deltaY * 0.01;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    }
  });

  canvas.addEventListener('mouseup', () => isDragging = false);
  canvas.addEventListener('mouseleave', () => isDragging = false);

  // Rotación con touch
  canvas.addEventListener('touchstart', e => {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  });

  canvas.addEventListener('touchmove', e => {
    if (isDragging) {
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      rotation.y += deltaX * 0.01;
      rotation.x += deltaY * 0.01;

      previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }
  });

  canvas.addEventListener('touchend', () => isDragging = false);

  // Zoom con scroll del mouse
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();

    const zoomSpeed = 0.1;
    const delta = e.deltaY > 0 ? 1 : -1;

    const newZ = window.camera.position.z + delta * zoomSpeed;
    if (newZ >= 2 && newZ <= 15) {
      window.camera.position.z = newZ;
      console.log(`🔍 Zoom: ${window.camera.position.z.toFixed(2)}`);
    }
  }, { passive: false });

  // Aplicar rotación a la escena
  function updateRotation() {
    if (window.scene) {
      window.scene.rotation.y = rotation.y;
      window.scene.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rotation.x));
    }
    requestAnimationFrame(updateRotation);
  }
  updateRotation();

  console.log('✅ Controles de cámara configurados');
}

// Controles de zoom con botones
function setupZoomControls() {
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const zoomIndicator = document.getElementById('zoomIndicator');

  if (!zoomInBtn || !zoomOutBtn) {
    console.warn('⚠️ Botones de zoom no encontrados');
    return;
  }

  const minZoom = 2;
  const maxZoom = 15;
  const zoomStep = 0.5;
  let indicatorTimeout = null;

  function updateZoomIndicator() {
    if (!window.camera || !zoomIndicator) return;

    const currentZoom = window.camera.position.z;
    const zoomPercent = Math.round(((maxZoom - currentZoom) / (maxZoom - minZoom)) * 100);

    zoomIndicator.textContent = `${zoomPercent}%`;
    zoomIndicator.classList.add('show');

    clearTimeout(indicatorTimeout);
    indicatorTimeout = setTimeout(() => {
      zoomIndicator.classList.remove('show');
    }, 1500);
  }

  function performZoom(direction) {
    if (!window.camera) return;

    const delta = direction === 'in' ? -zoomStep : zoomStep;
    const newZ = window.camera.position.z + delta;

    if (newZ >= minZoom && newZ <= maxZoom) {
      window.camera.position.z = newZ;
      updateZoomIndicator();
      console.log(`🔍 Zoom ${direction === 'in' ? 'IN' : 'OUT'}: ${newZ.toFixed(2)}`);
    } else {
      console.log(`⚠️ Límite de zoom alcanzado`);
    }
  }

  zoomInBtn.addEventListener('click', () => performZoom('in'));
  zoomOutBtn.addEventListener('click', () => performZoom('out'));

  let zoomInterval = null;

  // Mantener presionado para zoom continuo
  zoomInBtn.addEventListener('mousedown', () => {
    zoomInterval = setInterval(() => performZoom('in'), 100);
  });

  zoomOutBtn.addEventListener('mousedown', () => {
    zoomInterval = setInterval(() => performZoom('out'), 100);
  });

  ['mouseup', 'mouseleave'].forEach(event => {
    zoomInBtn.addEventListener(event, () => {
      if (zoomInterval) {
        clearInterval(zoomInterval);
        zoomInterval = null;
      }
    });

    zoomOutBtn.addEventListener(event, () => {
      if (zoomInterval) {
        clearInterval(zoomInterval);
        zoomInterval = null;
      }
    });
  });

  // Touch events
  zoomInBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    performZoom('in');
    zoomInterval = setInterval(() => performZoom('in'), 100);
  });

  zoomOutBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    performZoom('out');
    zoomInterval = setInterval(() => performZoom('out'), 100);
  });

  ['touchend', 'touchcancel'].forEach(event => {
    zoomInBtn.addEventListener(event, () => {
      if (zoomInterval) {
        clearInterval(zoomInterval);
        zoomInterval = null;
      }
    });

    zoomOutBtn.addEventListener(event, () => {
      if (zoomInterval) {
        clearInterval(zoomInterval);
        zoomInterval = null;
      }
    });
  });

  console.log('✅ Controles de zoom configurados');
}