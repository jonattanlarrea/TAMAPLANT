// notifications.js - Sistema de notificaciones y alertas de umbrales

// Configuración de umbrales para Crassula ovata (Árbol de Jade)
const THRESHOLDS = {
  temperature: {
    min: 15,              // Mínimo para crecimiento saludable
    max: 30,              // Máximo tolerable sin estrés
    critical_low: 10,     // Daño severo por frío
    critical_high: 35     // Peligro de deshidratación
  },
  humidity: {
    min: 20,              // Suelo ligeramente húmedo
    max: 40,              // Evitar exceso de agua
    critical_low: 15,     // Alerta: planta sedienta
    critical_high: 60     // Peligro: pudrición de raíces
  },
  soilTemperature: {
    min: 6.0,             // Ligeramente ácido
    max: 7.0,             // Neutro
    critical_low: 5.5,    // Muy ácido
    critical_high: 7.5    // Muy alcalino
  },
  light: {
    min: 10000,           // Luz brillante indirecta (4-6h/día)
    max: 50000,           // Luz intensa tolerable
    critical_low: 5000,   // Poca luz, etiolación
    critical_high: 70000  // Riesgo de quemaduras
  },
  pressure: {
    min: 1000,            // Presión normal-baja
    max: 1020,            // Presión normal-alta
    critical_low: 980,    // Baja presión (tormenta)
    critical_high: 1040   // Alta presión extrema
  }
};

// Almacenamiento de notificaciones (máximo 100 en memoria)
let alertHistory = [];
const MAX_ALERTS_IN_MEMORY = 100;
const RECENT_ALERTS_DISPLAY = 7;

// Cargar historial desde localStorage al iniciar
function loadAlertHistory() {
  try {
    const stored = localStorage.getItem('tamaplant_alert_history');
    if (stored) {
      alertHistory = JSON.parse(stored);
      updateNotificationBadge();
    }
  } catch (e) {
    console.warn('No se pudo cargar historial de alertas:', e);
  }
}

// Guardar historial en localStorage
function saveAlertHistory() {
  try {
    localStorage.setItem('tamaplant_alert_history', JSON.stringify(alertHistory));
  } catch (e) {
    console.warn('No se pudo guardar historial de alertas:', e);
  }
}

// Verificar si un valor está fuera del umbral
function checkThreshold(sensorType, value) {
  const threshold = THRESHOLDS[sensorType];
  if (!threshold) return null;

  // Verificar umbrales críticos primero
  if (threshold.critical_low && value < threshold.critical_low) {
    return {
      status: 'critical_low',
      severity: 'critical',
      message: `CRÍTICO: muy por debajo del mínimo seguro (${threshold.critical_low})`
    };
  } else if (threshold.critical_high && value > threshold.critical_high) {
    return {
      status: 'critical_high',
      severity: 'critical',
      message: `CRÍTICO: muy por encima del máximo seguro (${threshold.critical_high})`
    };
  }

  // Verificar umbrales normales
  if (value < threshold.min) {
    return {
      status: 'low',
      severity: 'warning',
      message: `por debajo del mínimo recomendado (${threshold.min})`
    };
  } else if (value > threshold.max) {
    return {
      status: 'high',
      severity: 'warning',
      message: `por encima del máximo recomendado (${threshold.max})`
    };
  }

  return null;
}

// Crear una nueva alerta
function createAlert(sensorType, value, threshold) {
  const sensorNames = {
    temperature: 'Temperatura del aire',
    humidity: 'Humedad del Suelo',
    soilTemperature: 'Temperatura del Suelo',
    light: 'Luminosidad',
    pressure: 'Presión Atmosférica'
  };

  const alert = {
    id: Date.now() + Math.random(),
    sensorType,
    sensorName: sensorNames[sensorType] || sensorType,
    value,
    threshold: threshold.status,
    severity: threshold.severity,
    message: threshold.message,
    timestamp: new Date().toISOString(),
    read: false
  };

  // Agregar al inicio del array
  alertHistory.unshift(alert);

  // Limitar tamaño del array
  if (alertHistory.length > MAX_ALERTS_IN_MEMORY) {
    alertHistory = alertHistory.slice(0, MAX_ALERTS_IN_MEMORY);
  }

  saveAlertHistory();
  updateNotificationBadge();

  console.log(`🚨 Nueva alerta [${threshold.severity.toUpperCase()}]:`, alert);
  return alert;
}

// Actualizar badge de notificaciones
function updateNotificationBadge() {
  const badge = document.getElementById('notificationBadge');
  if (!badge) return;

  const unreadCount = alertHistory.filter(a => !a.read).length;

  if (unreadCount === 0) {
    badge.style.display = 'none';
    badge.textContent = '0';
  } else {
    badge.style.display = 'flex';
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
  }
}

// Formatear timestamp para mostrar
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

// Obtener ícono según tipo de sensor
function getSensorIcon(sensorType) {
  const icons = {
    temperature: '🌡️',
    humidity: '💧',
    ph: '⚗️',
    light: '☀️',
    pressure: '🔘'
  };
  return icons[sensorType] || '📊';
}

// Renderizar notificaciones en el panel
function renderNotificationPanel() {
  const content = document.getElementById('notificationPanelContent');
  if (!content) return;

  const recentAlerts = alertHistory.slice(0, RECENT_ALERTS_DISPLAY);

  if (recentAlerts.length === 0) {
    content.innerHTML = `
      <div class="notification-empty">
        <div class="empty-icon">🔔</div>
        <p>No hay alertas nuevas</p>
      </div>
    `;
    return;
  }

  content.innerHTML = recentAlerts.map(alert => {
    const icon = getSensorIcon(alert.sensorType);
    const statusClass = alert.severity === 'critical' ? 'alert-critical' : 
                       alert.threshold === 'high' || alert.threshold === 'critical_high' ? 'alert-high' : 'alert-low';
    const readClass = alert.read ? 'read' : 'unread';
    
    return `
      <div class="alert-item ${statusClass} ${readClass}" data-alert-id="${alert.id}">
        <div class="alert-icon">${icon}</div>
        <div class="alert-content">
          <div class="alert-title">${alert.sensorName}</div>
          <div class="alert-message">
            Valor: <strong>${alert.value}</strong> ${alert.message}
          </div>
          <div class="alert-time">${formatTimestamp(alert.timestamp)}</div>
        </div>
        ${!alert.read ? '<div class="unread-indicator"></div>' : ''}
      </div>
    `;
  }).join('');

  // Agregar event listeners para marcar como leído
  content.querySelectorAll('.alert-item').forEach(item => {
    item.addEventListener('click', () => {
      const alertId = parseFloat(item.dataset.alertId);
      markAlertAsRead(alertId);
    });
  });
}

// Marcar alerta como leída
function markAlertAsRead(alertId) {
  const alert = alertHistory.find(a => a.id === alertId);
  if (alert && !alert.read) {
    alert.read = true;
    saveAlertHistory();
    updateNotificationBadge();
    renderNotificationPanel();
  }
}

// Marcar todas como leídas
function markAllAsRead() {
  alertHistory.forEach(alert => alert.read = true);
  saveAlertHistory();
  updateNotificationBadge();
  renderNotificationPanel();
}

// Toggle panel de notificaciones
function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;

  const isVisible = panel.classList.contains('show');

  if (isVisible) {
    panel.classList.remove('show');
  } else {
    panel.classList.add('show');
    renderNotificationPanel();
  }
}

// Cerrar panel al hacer clic fuera
function setupNotificationPanel() {
  const bell = document.getElementById('notificationBell');
  const panel = document.getElementById('notificationPanel');
  const closeBtn = document.getElementById('closeNotificationPanel');

  if (!bell || !panel) return;

  // Toggle al hacer clic en campana
  bell.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationPanel();
  });

  // Cerrar con botón X
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.remove('show');
    });
  }

  // Cerrar al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !bell.contains(e.target)) {
      panel.classList.remove('show');
    }
  });

  // Prevenir cierre al hacer clic dentro del panel
  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  console.log('✅ Panel de notificaciones configurado');
}

// Inicializar sistema de notificaciones
function initNotificationSystem() {
  loadAlertHistory();
  setupNotificationPanel();
  updateNotificationBadge();
  
  console.log('✅ Sistema de notificaciones inicializado');
  console.log(`📊 Alertas en historial: ${alertHistory.length}`);
}

// Exportar funciones globales
window.checkThreshold = checkThreshold;
window.createAlert = createAlert;
window.markAllAsRead = markAllAsRead;
window.alertHistory = alertHistory;