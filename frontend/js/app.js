window.addEventListener('DOMContentLoaded', () => {
  initScene();
  setupScrollBehavior();
  setupZoomControls();
  setupFullscreenControls();
  setupNotificationSystem();

  if (typeof setupModelButtons === "function") {
    setupModelButtons();
  } else {
    console.error("setupModelButtons no está definido. ¿Se cargó models.js?");
  }
});

function initScene() {
  // Inicialización de Three.js
  const container = document.getElementById('threejs-container');
  const canvas = document.getElementById('scene');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });

  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x121A14);

  // Iluminación mejorada
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 5);
  scene.add(directionalLight);

  const pointLight = new THREE.PointLight(0x00FF9D, 0.5);
  pointLight.position.set(-5, 5, -5);
  scene.add(pointLight);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(-5, 5, -5);
  scene.add(backLight);

  // Inicializar variables globales
  let loadedPlant = null;
  const loadingMessage = document.querySelector('.loading-message');

  window.loadedPlant = loadedPlant;
  window.loadingMessage = loadingMessage;
  window.scene = scene;
  window.camera = camera;
  window.renderer = renderer;

  if (typeof THREE.GLTFLoader === 'undefined') {
    console.error('GLTFLoader no está cargado');
    loadingMessage.innerHTML = `
      ❌ Error: GLTFLoader no disponible
      <br><small style="color: #F2C94C; margin-top: 0.5rem; display: block;">
        Verifica que Three.js esté cargado correctamente
      </small>
    `;
    return;
  }

  loadingMessage.innerHTML = `
    📁 Sin modelo cargado
    <br>
    <small style="color: #A8B2A0; margin-top: 0.5rem; display: block;">
      Usa el botón "📁 Cargar Modelo" para comenzar
    </small>
  `;
  loadingMessage.style.display = 'none';

  // Base
  const baseGeometry = new THREE.BoxGeometry(3, 0.3, 3);
  const baseMaterial = new THREE.MeshPhongMaterial({
    color: 0x2E3D34,
    shininess: 30
  });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = -1.5;
  scene.add(base);

  console.log("📦 Objetos en la escena:", scene.children.length);
  scene.children.forEach((obj, index) => {
    console.log(`  ${index}: ${obj.type} - ${obj.geometry?.type || 'sin geometría'}`);
  });

  // Controles de cámara
  camera.position.set(0, 1, 6);
  camera.lookAt(0, 0, 0);

  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let rotation = { x: 0, y: 0 };

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

    const newZ = camera.position.z + delta * zoomSpeed;
    if (newZ >= 2 && newZ <= 15) {
      camera.position.z = newZ;
      console.log(`🔍 Zoom: ${camera.position.z.toFixed(2)}`);
    }
  }, { passive: false });

  // Animación
  function animate() {
    requestAnimationFrame(animate);

    scene.rotation.y = rotation.y;
    scene.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rotation.x));

    renderer.render(scene, camera);
  }
  animate();

  // Responsive
  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    console.log(`📐 Ventana redimensionada: ${width}x${height}`);
  });

  // Observer para detectar cambios de tamaño del contenedor
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;

        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
          console.log(`📐 Contenedor redimensionado: ${width}x${height}`);
        }
      }
    });

    resizeObserver.observe(container);
  }
}

// Interactividad sensores
const sensors = document.querySelectorAll('.sensor');
const hotspots = document.querySelectorAll('.sensor-hotspot');
const tooltip = document.getElementById('tooltip');

sensors.forEach(sensor => {
  sensor.addEventListener('click', () => {
    sensors.forEach(s => s.classList.remove('active'));
    sensor.classList.add('active');

    const value = sensor.querySelector('p');
    value.style.animation = 'none';
    setTimeout(() => {
      value.style.animation = 'pulse 0.5s';
    }, 10);
  });
});

hotspots.forEach(hotspot => {
  hotspot.addEventListener('click', () => {
    const sensorType = hotspot.dataset.sensor;
    const sensorCard = document.querySelector(`.sensor[data-sensor="${sensorType}"]`);
    if (sensorCard) {
      sensors.forEach(s => s.classList.remove('active'));
      sensorCard.classList.add('active');
      sensorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });

  hotspot.addEventListener('mouseenter', e => {
    const sensorType = hotspot.dataset.sensor;
    const sensorCard = document.querySelector(`.sensor[data-sensor="${sensorType}"]`);

    if (sensorCard) {
      const title = sensorCard.querySelector('h3').textContent.trim();
      const value = sensorCard.querySelector('p').textContent;

      tooltip.querySelector('h4').textContent = title;
      tooltip.querySelector('p').textContent = `Valor actual: ${value}`;
      tooltip.classList.add('show');

      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY + 10 + 'px';
    }
  });

  hotspot.addEventListener('mouseleave', () => {
    tooltip.classList.remove('show');
  });

  hotspot.addEventListener('mousemove', e => {
    tooltip.style.left = e.pageX + 10 + 'px';
    tooltip.style.top = e.pageY + 10 + 'px';
  });
});

// WebSocket ESP32
let ws = null;
let reconnectInterval = null;
const WS_URL = 'ws://tamapla1.sytes.net:8080';

const connectionStatus = document.createElement('div');
connectionStatus.style.cssText = `
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
`;
document.body.appendChild(connectionStatus);

function updateConnectionStatus(status, message) {
  const dot = '<span style="width: 8px; height: 8px; border-radius: 50%; display: inline-block;"></span>';

  if (status === 'connected') {
    connectionStatus.style.backgroundColor = '#3CB371';
    connectionStatus.style.color = '#E6E6E6';
    connectionStatus.innerHTML = dot + message;
    connectionStatus.querySelector('span').style.backgroundColor = '#00FF9D';
  } else if (status === 'connecting') {
    connectionStatus.style.backgroundColor = '#F2C94C';
    connectionStatus.style.color = '#121A14';
    connectionStatus.innerHTML = dot + message;
    connectionStatus.querySelector('span').style.backgroundColor = '#FFD700';
  } else {
    connectionStatus.style.backgroundColor = '#C62828';
    connectionStatus.style.color = '#E6E6E6';
    connectionStatus.innerHTML = dot + message;
    connectionStatus.querySelector('span').style.backgroundColor = '#FF6B6B';
  }
}

function normalizeSensorData(raw) {
  return {
    humidity: raw.soil_moisture,           // humedad del suelo
    light: raw.lux,                        // luminosidad
    temperature: raw.temperature_ds18b20,  // temperatura real
  };
}


function connectWebSocket() {
  updateConnectionStatus('connecting', 'Conectando...');

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket conectado');
      updateConnectionStatus('connected', 'Conectado a ESP32');

      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const normalized = normalizeSensorData(raw);
        updateSensorData(normalized);
      } catch (e) {
        console.error("Error procesando JSON:", e);
      }
    };

  ws.onerror = () => {
    updateConnectionStatus('error', 'Error de conexión');
  };

  ws.onclose = () => {
    updateConnectionStatus('error', 'Desconectado');

    if (!reconnectInterval) {
      reconnectInterval = setInterval(() => {
        connectWebSocket();
      }, 5000);
    }
  };
} catch (error) {
  updateConnectionStatus('error', 'No se pudo conectar');
}
}

function updateSensorData(data) {
  Object.keys(data).forEach(sensorType => {
    const sensorCard = document.querySelector(`.sensor[data-sensor="${sensorType}"]`);

    if (sensorCard) {
      const valueElement = sensorCard.querySelector('p');
      const statusElement = sensorCard.querySelector('.sensor-status');

      valueElement.style.opacity = '0.5';

      setTimeout(() => {
        let formattedValue = data[sensorType];

        switch (sensorType) {
          case 'temperature':
            formattedValue = `${parseFloat(data[sensorType]).toFixed(1)}°C`;
            if (data[sensorType] > 26) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Alerta';
            } else {
              sensorCard.classList.remove('alert');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Normal';
            }
            break;

          case 'humidity':
            formattedValue = `${Math.floor(data[sensorType])}%`;
            if (data[sensorType] < 30 || data[sensorType] > 70) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Revisar';
            } else {
              sensorCard.classList.remove('alert');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Normal';
            }
            break;

          case 'ph':
            formattedValue = parseFloat(data[sensorType]).toFixed(1);
            if (data[sensorType] < 6.0 || data[sensorType] > 7.5) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Fuera de rango';
            } else {
              sensorCard.classList.remove('alert');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Normal';
            }
            break;

          case 'light':
            formattedValue = `${Math.floor(data[sensorType])} lux`;
            break;
        }

        valueElement.textContent = formattedValue;
        valueElement.style.opacity = '1';
      }, 300);
    }
  });
}

// Funciones globales para botones
function refreshData() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ command: 'refresh' }));
    if (typeof showNotification === 'function') {
      showNotification(
        'Actualizando datos',
        'Solicitando datos actualizados del ESP32...',
        'info',
        3000
      );
    }
    console.log('Solicitando actualización de datos...');
  } else {
    if (typeof showNotification === 'function') {
      showNotification(
        'Sin conexión',
        'WebSocket no conectado. Intentando reconectar...',
        'warning'
      );
    }
    connectWebSocket();
  }
}

function toggleAutoUpdate() {
  console.log('Toggle auto-actualización');
}

connectWebSocket();

window.addEventListener('beforeunload', () => {
  if (ws) ws.close();
  if (reconnectInterval) clearInterval(reconnectInterval);
});

// Comportamiento de scroll - ocultar header
function setupScrollBehavior() {
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const scrollIndicator = document.getElementById('scrollIndicator');
  const container = document.getElementById('threejs-container');

  let lastScrollTop = 0;
  let isHeaderHidden = false;

  function resizeCanvas() {
    if (!window.camera || !window.renderer || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    window.camera.aspect = width / height;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(width, height);

    console.log(`📐 Canvas redimensionado: ${width}x${height}`);
  }

  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      if (!isHeaderHidden) {
        header.classList.add('hidden');
        main.classList.add('expanded');
        isHeaderHidden = true;
        scrollIndicator.classList.add('hidden');

        setTimeout(resizeCanvas, 450);
      } else {
        header.classList.remove('hidden');
        main.classList.remove('expanded');
        isHeaderHidden = false;
        scrollIndicator.classList.remove('hidden');

        setTimeout(resizeCanvas, 450);
      }
    });
  }

  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 50 && !isHeaderHidden) {
      header.classList.add('hidden');
      main.classList.add('expanded');
      isHeaderHidden = true;
      if (scrollIndicator) scrollIndicator.classList.add('hidden');

      setTimeout(resizeCanvas, 450);
      console.log('🔼 Header oculto - Vista expandida activada');
    }
    else if (scrollTop <= 50 && isHeaderHidden) {
      header.classList.remove('hidden');
      main.classList.remove('expanded');
      isHeaderHidden = false;
      if (scrollIndicator) scrollIndicator.classList.remove('hidden');

      setTimeout(resizeCanvas, 450);
      console.log('🔽 Header visible - Vista normal');
    }

    lastScrollTop = scrollTop;
  });

  let scrollAttempts = 0;
  window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && !isHeaderHidden) {
      scrollAttempts++;
      if (scrollAttempts >= 2) {
        header.classList.add('hidden');
        main.classList.add('expanded');
        isHeaderHidden = true;
        if (scrollIndicator) scrollIndicator.classList.add('hidden');
        scrollAttempts = 0;

        setTimeout(resizeCanvas, 450);
        console.log('🔼 Header oculto por scroll de rueda');
      }
    }
    else if (e.deltaY < 0 && isHeaderHidden) {
      scrollAttempts++;
      if (scrollAttempts >= 2) {
        header.classList.remove('hidden');
        main.classList.remove('expanded');
        isHeaderHidden = false;
        if (scrollIndicator) scrollIndicator.classList.remove('hidden');
        scrollAttempts = 0;

        setTimeout(resizeCanvas, 450);
        console.log('🔽 Header visible por scroll de rueda');
      }
    }
  });

  console.log('✅ Comportamiento de scroll configurado');
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

// Pantalla completa
function setupFullscreenControls() {
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const container = document.getElementById('threejs-container');

  if (!fullscreenBtn || !container) {
    console.warn('⚠️ Botón de pantalla completa no encontrado');
    return;
  }

  let isFullscreen = false;

  fullscreenBtn.addEventListener('click', () => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  });

  function enterFullscreen() {
    container.classList.add('fullscreen');
    document.body.classList.add('fullscreen-active');

    fullscreenBtn.innerHTML = '✕';
    fullscreenBtn.title = 'Salir de pantalla completa';

    isFullscreen = true;

    setTimeout(() => {
      if (window.camera && window.renderer && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        window.camera.aspect = width / height;
        window.camera.updateProjectionMatrix();
        window.renderer.setSize(width, height);

        console.log(`📐 Pantalla completa activada: ${width}x${height}`);
      }
    }, 100);
  }

  function exitFullscreen() {
    container.classList.remove('fullscreen');
    document.body.classList.remove('fullscreen-active');

    fullscreenBtn.innerHTML = '⛶';
    fullscreenBtn.title = 'Pantalla completa';

    isFullscreen = false;

    setTimeout(() => {
      if (window.camera && window.renderer && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        window.camera.aspect = width / height;
        window.camera.updateProjectionMatrix();
        window.renderer.setSize(width, height);

        console.log(`📐 Pantalla completa desactivada: ${width}x${height}`);
      }
    }, 100);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFullscreen) {
      exitFullscreen();
    }
  });

  console.log('✅ Controles de pantalla completa configurados');
}

// Sistema de notificaciones personalizado
function setupNotificationSystem() {
  if (!document.getElementById('notificationContainer')) {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.className = 'notification-container';
    document.body.appendChild(container);
  }

  console.log('✅ Sistema de notificaciones configurado');
}

window.showNotification = function (title, message, type = 'info', duration = 5000) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-icon">${icons[type] || icons.info}</div>
      <div class="notification-text">
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
      </div>
    </div>
    <button class="notification-close">×</button>
    <div class="notification-progress"></div>
  `;

  container.appendChild(notification);

  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', () => {
    removeNotification(notification);
  });

  if (duration > 0) {
    setTimeout(() => {
      removeNotification(notification);
    }, duration);
  }

  return notification;
};

function removeNotification(notification) {
  notification.style.animation = 'slideOutRight 0.4s ease-in';
  setTimeout(() => {
    if (notification.parentElement) {
      notification.parentElement.removeChild(notification);
    }
  }, 400);
}

window.showConfirmModal = function (title, message, onConfirm, onCancel) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-icon">⚠️</div>
          <div class="modal-title">${title}</div>
        </div>
        <div class="modal-message">${message}</div>
        <div class="modal-buttons">
          <button class="modal-btn modal-btn-cancel">Cancelar</button>
          <button class="modal-btn modal-btn-confirm">Confirmar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const confirmBtn = overlay.querySelector('.modal-btn-confirm');
    const cancelBtn = overlay.querySelector('.modal-btn-cancel');

    function closeModal(confirmed) {
      overlay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => {
        if (overlay.parentElement) {
          overlay.parentElement.removeChild(overlay);
        }
      }, 300);

      resolve(confirmed);

      if (confirmed && onConfirm) {
        onConfirm();
      } else if (!confirmed && onCancel) {
        onCancel();
      }
    }

    confirmBtn.addEventListener('click', () => closeModal(true));
    cancelBtn.addEventListener('click', () => closeModal(false));

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closeModal(false);
      }
    });

    const escapeHandler = (e) => {
      if (e.key === 'Escape') {
        closeModal(false);
        document.removeEventListener('keydown', escapeHandler);
      }
    };
    document.addEventListener('keydown', escapeHandler);
  });
};