// Esperar a que THREE esté disponible
window.addEventListener('DOMContentLoaded', () => {
  initScene();
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

  // Agregar luz trasera
  const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
  backLight.position.set(-5, 5, -5);
  scene.add(backLight);

  //
  // ---------------------------------------------------
  //     ✅ CARGAR MODELO GLTF
  // ---------------------------------------------------
  //

  let loadedPlant = null;
  const loadingMessage = document.querySelector('.loading-message');

  // Verificar si GLTFLoader está disponible
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

  const loader = new THREE.GLTFLoader();

  loader.load(
    'assets/models/potted_plant_01_4k.gltf', // Ruta corregida
    function (gltf) {
      loadedPlant = gltf.scene;

      // Ajustar posición y escala
      loadedPlant.position.set(0, -1, 0);
      loadedPlant.scale.set(2.2, 2.2, 2.2);

      scene.add(loadedPlant);

      // Ocultar mensaje de carga
      loadingMessage.style.display = 'none';

      console.log("✅ Modelo GLTF cargado correctamente");
    },
    function (xhr) {
      const percent = ((xhr.loaded / xhr.total) * 100).toFixed(0);
      console.log(`Cargando modelo: ${percent}%`);
      loadingMessage.innerHTML = `
        Cargando modelo 3D... ${percent}%
        <br>
        <small style="color: #A8B2A0; margin-top: 0.5rem; display: block;">
          Por favor espera...
        </small>
      `;
    },
    function (error) {
      console.error("❌ Error cargando modelo GLTF:", error);
      loadingMessage.innerHTML = `
        ❌ Error al cargar el modelo
        <br>
        <small style="color: #F2C94C; margin-top: 0.5rem; display: block;">
          Verifica que el archivo existe en: assets/models/potted_plant_01_4k.gltf
        </small>
      `;
    }
  );

  //
  // ---------------------------------------------------
  //     BASE Y SENSORES
  // ---------------------------------------------------
  //

  const baseGeometry = new THREE.BoxGeometry(2.5, 0.3, 2.5);
  const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x2E3D34 });
  const base = new THREE.Mesh(baseGeometry, baseMaterial);
  base.position.y = -1.5;
  scene.add(base);

  const sensorPositions = [
    { x: -0.8, z: 0 },
    { x: 0, z: 0 },
    { x: 0.8, z: 0 }
  ];

  sensorPositions.forEach((pos) => {
    const sensorGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16);
    const sensorMaterial = new THREE.MeshPhongMaterial({
      color: 0x00FF9D,
      emissive: 0x00FF9D,
      emissiveIntensity: 0.3
    });
    const sensor = new THREE.Mesh(sensorGeometry, sensorMaterial);
    sensor.position.set(pos.x, -1.2, pos.z);
    scene.add(sensor);
  });

  //
  // ---------------------------------------------------
  //     CONTROLES DE CÁMARA
  // ---------------------------------------------------
  //

  camera.position.z = 5;
  camera.position.y = 2;
  camera.lookAt(0, 1, 0);

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

  // Touch móvil
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

  //
  // ---------------------------------------------------
  //     ANIMACIÓN
  // ---------------------------------------------------
  //

  function animate() {
    requestAnimationFrame(animate);

    scene.rotation.y = rotation.y;
    scene.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, rotation.x));

    renderer.render(scene, camera);
  }
  animate();

  //
  // ---------------------------------------------------
  //     RESPONSIVE
  // ---------------------------------------------------
  //

  window.addEventListener('resize', () => {
    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  });
}

//
// ---------------------------------------------------
//     INTERACTIVIDAD SENSORES
// ---------------------------------------------------
//

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

//
// ---------------------------------------------------
//     WEBSOCKET ESP32
// ---------------------------------------------------
//

let ws = null;
let reconnectInterval = null;
const WS_URL = 'ws://192.168.1.100:81';

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
        const data = JSON.parse(event.data);
        updateSensorData(data);
      } catch (error) {
        console.error('Error parseando JSON:', error);
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
    console.log('Solicitando actualización de datos...');
  } else {
    alert('WebSocket no conectado. Intentando reconectar...');
    connectWebSocket();
  }
}

function toggleAutoUpdate() {
  console.log('Toggle auto-actualización');
  // Implementar lógica de auto-actualización
}

// Iniciar WebSocket
connectWebSocket();

window.addEventListener('beforeunload', () => {
  if (ws) ws.close();
  if (reconnectInterval) clearInterval(reconnectInterval);
});