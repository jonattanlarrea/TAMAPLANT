// websocket.js - Comunicación WebSocket con ESP32

let ws = null;
let reconnectInterval = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const WS_URL = 'wss://tamaplant.me';

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
  } else if (status === 'failed') {
    connectionStatus.style.backgroundColor = '#8B4513';
    connectionStatus.style.color = '#E6E6E6';
    connectionStatus.innerHTML = dot + message;
    connectionStatus.querySelector('span').style.backgroundColor = '#D2691E';
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
    pressure: raw.pressure || raw.atmospheric_pressure
    // ph NO VIENE en el JSON → queda sin actualizar
  };
}

function connectWebSocket() {
  // Verificar si se alcanzó el límite de intentos
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    updateConnectionStatus('failed', `Conexión fallida (${MAX_RECONNECT_ATTEMPTS} intentos)`);
    console.error(`❌ Máximo de intentos de reconexión alcanzado (${MAX_RECONNECT_ATTEMPTS})`);
    
    if (reconnectInterval) {
      clearInterval(reconnectInterval);
      reconnectInterval = null;
    }
    
    if (typeof showNotification === 'function') {
      showNotification(
        'Conexión Fallida',
        `No se pudo conectar después de ${MAX_RECONNECT_ATTEMPTS} intentos. Recarga la página para intentar nuevamente.`,
        'error',
        0 // No auto-cerrar
      );
    }
    
    return;
  }

  reconnectAttempts++;
  updateConnectionStatus('connecting', `Conectando... (intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
  console.log(`🔄 Intento de conexión ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);

  try {
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket conectado');
      updateConnectionStatus('connected', 'Conectado a ESP32');
      
      // Resetear contador de intentos al conectar exitosamente
      reconnectAttempts = 0;

      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }

      if (typeof showNotification === 'function') {
        showNotification(
          'Conexión Establecida',
          'Conectado al sistema de sensores',
          'success',
          3000
        );
      }
    };

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        const normalized = normalizeSensorData(raw);
        updateSensorData(normalized);
      } catch (e) {
        console.error("❌ Error procesando JSON:", e);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ Error de WebSocket:', error);
      updateConnectionStatus('error', 'Error de conexión');
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket desconectado');
      
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        updateConnectionStatus('error', 'Desconectado - Reintentando...');

        if (!reconnectInterval) {
          reconnectInterval = setInterval(() => {
            connectWebSocket();
          }, 5000);
        }
      } else {
        updateConnectionStatus('failed', `Conexión fallida (${MAX_RECONNECT_ATTEMPTS} intentos)`);
      }
    };
  } catch (error) {
    console.error('❌ Error creando WebSocket:', error);
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
            // Alertas críticas
            if (data[sensorType] < 10) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ CRÍTICO';
            } else if (data[sensorType] > 35) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ CRÍTICO';
            }
            // Alertas normales
            else if (data[sensorType] < 15 || data[sensorType] > 30) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Alerta';
            } else {
              sensorCard.classList.remove('alert', 'critical');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Normal';
            }
            break;

          case 'humidity':
            formattedValue = `${Math.floor(data[sensorType])}%`;
            // Alertas críticas
            if (data[sensorType] < 15) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ MUY SECO';
            } else if (data[sensorType] > 60) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ EXCESO';
            }
            // Alertas normales
            else if (data[sensorType] < 20 || data[sensorType] > 40) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Revisar';
            } else {
              sensorCard.classList.remove('alert', 'critical');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Normal';
            }
            break;

          case 'ph':
            formattedValue = parseFloat(data[sensorType]).toFixed(1);
            // Alertas críticas
            if (data[sensorType] < 5.5) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ MUY ÁCIDO';
            } else if (data[sensorType] > 7.5) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ MUY ALCALINO';
            }
            // Alertas normales
            else if (data[sensorType] < 6.0 || data[sensorType] > 7.0) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Fuera de rango';
            } else {
              sensorCard.classList.remove('alert', 'critical');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Óptimo';
            }
            break;

          case 'light':
            formattedValue = `${Math.floor(data[sensorType])} lux`;
            // Alertas críticas
            if (data[sensorType] < 5000) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ POCA LUZ';
            } else if (data[sensorType] > 70000) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ EXCESO';
            }
            // Alertas normales
            else if (data[sensorType] < 10000 || data[sensorType] > 50000) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Subóptimo';
            } else {
              sensorCard.classList.remove('alert', 'critical');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Ideal';
            }
            break;

          case 'pressure':
            formattedValue = `${parseFloat(data[sensorType]).toFixed(1)} hPa`;
            // Alertas críticas
            if (data[sensorType] < 980) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ TORMENTA';
            } else if (data[sensorType] > 1040) {
              sensorCard.classList.add('alert', 'critical');
              statusElement.className = 'sensor-status critical';
              statusElement.textContent = '⚠️ MUY ALTA';
            }
            // Alertas normales
            else if (data[sensorType] < 1000 || data[sensorType] > 1020) {
              sensorCard.classList.add('alert');
              statusElement.className = 'sensor-status warning';
              statusElement.textContent = 'Inestable';
            } else {
              sensorCard.classList.remove('alert', 'critical');
              statusElement.className = 'sensor-status';
              statusElement.textContent = 'Normal';
            }
            break;
        }

        valueElement.textContent = formattedValue;
        valueElement.style.opacity = '1';

        // Verificar umbrales y crear alerta si es necesario
        if (typeof window.checkThreshold === 'function') {
          const threshold = window.checkThreshold(sensorType, data[sensorType]);
          if (threshold && typeof window.createAlert === 'function') {
            window.createAlert(sensorType, formattedValue, threshold);
          }
        }
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
    console.log('📡 Solicitando actualización de datos...');
  } else {
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      if (typeof showNotification === 'function') {
        showNotification(
          'Sin conexión',
          'Se alcanzó el límite de intentos. Recarga la página para reconectar.',
          'error'
        );
      }
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