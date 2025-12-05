// notifications-history.js - Página de historial completo de alertas

const ALERTS_PER_PAGE = 15;
let currentPage = 1;
let filteredAlerts = [];
let allAlerts = [];

// Cargar alertas desde localStorage
function loadAlerts() {
  try {
    const stored = localStorage.getItem('tamaplant_alert_history');
    allAlerts = stored ? JSON.parse(stored) : [];
    filteredAlerts = [...allAlerts];
    return allAlerts;
  } catch (e) {
    console.error('Error cargando alertas:', e);
    return [];
  }
}

// Guardar alertas
function saveAlerts() {
  try {
    localStorage.setItem('tamaplant_alert_history', JSON.stringify(allAlerts));
  } catch (e) {
    console.error('Error guardando alertas:', e);
  }
}

// Formatear fecha completa
function formatFullDate(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Formatear fecha relativa
function formatRelativeTime(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
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

// Aplicar filtros
function applyFilters() {
  const sensorFilter = document.getElementById('filterSensor').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const timeFilter = document.getElementById('filterTime').value;
  const readFilter = document.getElementById('filterRead').value;

  filteredAlerts = allAlerts.filter(alert => {
    // Filtro de sensor
    if (sensorFilter !== 'all' && alert.sensorType !== sensorFilter) return false;

    // Filtro de estado
    if (statusFilter !== 'all' && alert.threshold !== statusFilter) return false;

    // Filtro de lectura
    if (readFilter === 'read' && !alert.read) return false;
    if (readFilter === 'unread' && alert.read) return false;

    // Filtro de tiempo
    if (timeFilter !== 'all') {
      const alertDate = new Date(alert.timestamp);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (timeFilter === 'today' && alertDate < today) return false;
      if (timeFilter === 'week' && alertDate < weekAgo) return false;
      if (timeFilter === 'month' && alertDate < monthAgo) return false;
    }

    return true;
  });

  currentPage = 1;
  renderAlerts();
  renderPagination();
}

// Limpiar filtros
function clearFilters() {
  document.getElementById('filterSensor').value = 'all';
  document.getElementById('filterStatus').value = 'all';
  document.getElementById('filterTime').value = 'all';
  document.getElementById('filterRead').value = 'all';
  applyFilters();
}

// Renderizar alertas
function renderAlerts() {
  const container = document.getElementById('alertsContainer');
  
  if (filteredAlerts.length === 0) {
    container.innerHTML = `
      <div class="alerts-empty">
        <div class="empty-icon">🔔</div>
        <h3>No hay alertas</h3>
        <p>No se encontraron alertas con los filtros seleccionados</p>
      </div>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * ALERTS_PER_PAGE;
  const endIndex = startIndex + ALERTS_PER_PAGE;
  const pageAlerts = filteredAlerts.slice(startIndex, endIndex);

  container.innerHTML = pageAlerts.map(alert => {
    const icon = getSensorIcon(alert.sensorType);
    const statusClass = alert.threshold === 'high' ? 'alert-high' : 'alert-low';
    const readClass = alert.read ? 'read' : 'unread';
    
    return `
      <div class="alert-item-full ${statusClass} ${readClass}" data-alert-id="${alert.id}">
        <div class="alert-icon-full">${icon}</div>
        <div class="alert-content-full">
          <div class="alert-header-full">
            <span class="alert-sensor-name">${alert.sensorName}</span>
            <span class="alert-timestamp">${formatRelativeTime(alert.timestamp)}</span>
          </div>
          <div class="alert-value">
            Valor registrado: <strong>${alert.value}</strong>
          </div>
          <div class="alert-message-full">${alert.message}</div>
          <div class="alert-full-date">${formatFullDate(alert.timestamp)}</div>
        </div>
        ${!alert.read ? '<div class="unread-indicator-full"></div>' : ''}
      </div>
    `;
  }).join('');

  // Agregar event listeners
  container.querySelectorAll('.alert-item-full').forEach(item => {
    item.addEventListener('click', () => {
      const alertId = parseFloat(item.dataset.alertId);
      markAsRead(alertId);
    });
  });

  updateStats();
}

// Marcar como leída
function markAsRead(alertId) {
  const alert = allAlerts.find(a => a.id === alertId);
  if (alert && !alert.read) {
    alert.read = true;
    saveAlerts();
    renderAlerts();
  }
}

// Marcar todas como leídas
function markAllAsRead() {
  allAlerts.forEach(alert => alert.read = true);
  saveAlerts();
  renderAlerts();
}

// Renderizar paginación
function renderPagination() {
  const container = document.getElementById('paginationContainer');
  const totalPages = Math.ceil(filteredAlerts.length / ALERTS_PER_PAGE);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let paginationHTML = '<div class="pagination">';

  // Botón anterior
  paginationHTML += `
    <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
            onclick="changePage(${currentPage - 1})"
            ${currentPage === 1 ? 'disabled' : ''}>
      ← Anterior
    </button>
  `;

  // Páginas
  const maxButtons = 7;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxButtons - 1);

  if (endPage - startPage < maxButtons - 1) {
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  if (startPage > 1) {
    paginationHTML += `<button class="pagination-btn" onclick="changePage(1)">1</button>`;
    if (startPage > 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
              onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
    paginationHTML += `<button class="pagination-btn" onclick="changePage(${totalPages})">${totalPages}</button>`;
  }

  // Botón siguiente
  paginationHTML += `
    <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
            onclick="changePage(${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled' : ''}>
      Siguiente →
    </button>
  `;

  paginationHTML += '</div>';
  container.innerHTML = paginationHTML;
}

// Cambiar de página
function changePage(page) {
  const totalPages = Math.ceil(filteredAlerts.length / ALERTS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderAlerts();
  renderPagination();
  
  // Scroll al inicio
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Actualizar estadísticas
function updateStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  document.getElementById('totalAlerts').textContent = allAlerts.length;
  document.getElementById('unreadAlerts').textContent = allAlerts.filter(a => !a.read).length;
  document.getElementById('todayAlerts').textContent = allAlerts.filter(a => new Date(a.timestamp) >= today).length;
  document.getElementById('weekAlerts').textContent = allAlerts.filter(a => new Date(a.timestamp) >= weekAgo).length;
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
  loadAlerts();
  renderAlerts();
  renderPagination();
  updateStats();

  // Event listeners de filtros
  document.getElementById('filterSensor').addEventListener('change', applyFilters);
  document.getElementById('filterStatus').addEventListener('change', applyFilters);
  document.getElementById('filterTime').addEventListener('change', applyFilters);
  document.getElementById('filterRead').addEventListener('change', applyFilters);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
  document.getElementById('markAllReadBtn').addEventListener('click', markAllAsRead);

  console.log('✅ Página de historial de alertas inicializada');
});

// Hacer función global
window.changePage = changePage;