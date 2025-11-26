// websocket.js - Comunicación WebSocket con ESP32

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
    humidity: raw.soil_moisture,
    light: raw.lux,
    temperature: raw.temperature_ds18b20,
    // ph NO VIENE en el JSON → queda sin actualizar
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

// Iniciar conexión y cleanup
function initWebSocket() {
  connectWebSocket();

  window.addEventListener('beforeunload', () => {
    if (ws) ws.close();
    if (reconnectInterval) clearInterval(reconnectInterval);
  });

  console.log('✅ WebSocket inicializado');
}