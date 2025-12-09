// notifications_history.js - Página de historial completo de alertas

let ALERTS_PER_PAGE = 10;
let currentPage = 1;
let filteredAlerts = [];
let allAlerts = [];

// Cargar alertas desde localStorage
function loadAlerts() {
  try {
    const stored = localStorage.getItem('tamaplant_alert_history');
    console.log('📦 Datos cargados de localStorage:', stored);
    
    if (stored) {
      allAlerts = JSON.parse(stored);
      console.log(`✅ ${allAlerts.length} alertas cargadas`);
    } else {
      console.log('⚠️ No hay alertas guardadas en localStorage');
      allAlerts = [];
    }
    
    filteredAlerts = [...allAlerts];
    return allAlerts;
  } catch (e) {
    console.error('❌ Error cargando alertas:', e);
    allAlerts = [];
    filteredAlerts = [];
    return [];
  }
}

// Guardar alertas
function saveAlerts() {
  try {
    localStorage.setItem('tamaplant_alert_history', JSON.stringify(allAlerts));
    console.log('💾 Alertas guardadas correctamente');
  } catch (e) {
    console.error('❌ Error guardando alertas:', e);
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
    soilTemperature: '🌡️',
    light: '☀️',
    pressure: '🔘'
  };
  return icons[sensorType] || '📊';
}

// Aplicar filtros
// Aplicar filtros
function applyFilters() {
  const sensorFilter = document.getElementById('filterSensor').value;
  const statusFilter = document.getElementById('filterStatus').value;
  const timeFilter = document.getElementById('filterTime').value;
  const readFilter = document.getElementById('filterRead').value;

  console.log('🔍 Aplicando filtros:', { sensorFilter, statusFilter, timeFilter, readFilter });

  filteredAlerts = allAlerts.filter(alert => {
    // Filtro de sensor
    if (sensorFilter !== 'all' && alert.sensorType !== sensorFilter) return false;
    
    // Filtro de estado - incluir tanto 'high' como 'critical_high', 'low' como 'critical_low'
    if (statusFilter !== 'all') {
      if (statusFilter === 'high') {
        // Incluir tanto 'high' como 'critical_high'
        if (alert.threshold !== 'high' && alert.threshold !== 'critical_high') return false;
      } else if (statusFilter === 'low') {
        // Incluir tanto 'low' como 'critical_low'
        if (alert.threshold !== 'low' && alert.threshold !== 'critical_low') return false;
      }
    }

    return true;
  });

  console.log(`✅ Filtro aplicado: ${filteredAlerts.length} de ${allAlerts.length} alertas`);

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
  
  console.log('🎨 Renderizando alertas...');
  
  if (filteredAlerts.length === 0) {
    console.log('⚠️ No hay alertas para mostrar');
    container.innerHTML = `
      <div class="alerts-empty">
        <div class="empty-icon">🔔</div>
        <h3>No hay alertas</h3>
        <p>No se encontraron alertas con los filtros seleccionados</p>
        <button onclick="window.location.href='index.html'" style="margin-top: 1rem; padding: 0.75rem 1.5rem; background: #3CB371; color: #E6E6E6; border: none; border-radius: 8px; cursor: pointer;">
          Volver al inicio
        </button>
      </div>
    `;
    return;
  }

  const startIndex = (currentPage - 1) * ALERTS_PER_PAGE;
  const endIndex = startIndex + ALERTS_PER_PAGE;
  const pageAlerts = filteredAlerts.slice(startIndex, endIndex);

  console.log(`📄 Mostrando alertas ${startIndex + 1} a ${Math.min(endIndex, filteredAlerts.length)} de ${filteredAlerts.length}`);

  container.innerHTML = pageAlerts.map(alert => {
    const icon = getSensorIcon(alert.sensorType);
    const statusClass = alert.threshold === 'high' || alert.threshold === 'critical_high' ? 'alert-high' : 'alert-low';
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
  console.log('✅ Todas las alertas marcadas como leídas');
}

// Renderizar paginación
function renderPagination() {
  const container = document.getElementById('paginationContainer');
  const totalPages = Math.ceil(filteredAlerts.length / ALERTS_PER_PAGE);

  if (filteredAlerts.length === 0) {
    container.innerHTML = '';
    return;
  }

  let paginationHTML = '<div class="pagination-wrapper">';
  
  // Contenedor de botones de página
  paginationHTML += '<div class="pagination">';

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

  paginationHTML += '</div>'; // Cierra .pagination

  // Selector de cantidad de alertas por página
  paginationHTML += `
    <div class="alerts-per-page">
      <label for="alertsPerPageSelect">Mostrar:</label>
      <select id="alertsPerPageSelect" class="alerts-per-page-select" onchange="changeAlertsPerPage(this.value)">
        <option value="10" ${ALERTS_PER_PAGE === 10 ? 'selected' : ''}>10 alertas</option>
        <option value="30" ${ALERTS_PER_PAGE === 30 ? 'selected' : ''}>30 alertas</option>
        <option value="50" ${ALERTS_PER_PAGE === 50 ? 'selected' : ''}>50 alertas</option>
        <option value="100" ${ALERTS_PER_PAGE === 100 ? 'selected' : ''}>100 alertas</option>
      </select>
    </div>
  `;

  paginationHTML += '</div>'; // Cierra .pagination-wrapper

  container.innerHTML = paginationHTML;
}

// Cambiar de página
function changePage(page) {
  const totalPages = Math.ceil(filteredAlerts.length / ALERTS_PER_PAGE);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderAlerts();
  renderPagination();
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Cambiar cantidad de alertas por página
function changeAlertsPerPage(value) {
  ALERTS_PER_PAGE = parseInt(value);
  currentPage = 1;
  console.log(`📊 Mostrando ${ALERTS_PER_PAGE} alertas por página`);
  renderAlerts();
  renderPagination();
}

// Actualizar estadísticas
function updateStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const stats = {
    total: allAlerts.length,
    unread: allAlerts.filter(a => !a.read).length,
    today: allAlerts.filter(a => new Date(a.timestamp) >= today).length,
    week: allAlerts.filter(a => new Date(a.timestamp) >= weekAgo).length
  };

  console.log('📊 Estadísticas:', stats);

  document.getElementById('totalAlerts').textContent = stats.total;
  document.getElementById('unreadAlerts').textContent = stats.unread;
  document.getElementById('todayAlerts').textContent = stats.today;
  document.getElementById('weekAlerts').textContent = stats.week;
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando página de historial de alertas...');
  
  loadAlerts();
  renderAlerts();
  renderPagination();
  updateStats();

  document.getElementById('filterSensor').addEventListener('change', applyFilters);
  document.getElementById('filterStatus').addEventListener('change', applyFilters);
  document.getElementById('filterTime').addEventListener('change', applyFilters);
  document.getElementById('filterRead').addEventListener('change', applyFilters);
  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
  document.getElementById('markAllReadBtn').addEventListener('click', markAllAsRead);

  console.log('✅ Página de historial de alertas inicializada');
});

// Hacer funciones globales
window.changePage = changePage;
window.changeAlertsPerPage = changeAlertsPerPage;