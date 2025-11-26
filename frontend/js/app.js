// app.js - Archivo principal - Inicialización de la aplicación

window.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Iniciando TAMAPLANT...');

  // Inicializar escena 3D
  initScene();

  // Configurar controles de cámara
  setupCameraControls();

  // Configurar controles de zoom
  setupZoomControls();

  // Configurar interactividad de sensores
  setupSensorInteractivity();

  // Configurar comportamiento de scroll
  setupScrollBehavior();

  // Configurar pantalla completa
  setupFullscreenControls();

  // Configurar sistema de notificaciones
  setupNotificationSystem();

  // Inicializar WebSocket
  initWebSocket();

  // Configurar botones de modelos
  if (typeof setupModelButtons === "function") {
    setupModelButtons();
  } else {
    console.error("setupModelButtons no está definido. ¿Se cargó models.js?");
  }

  console.log('✅ TAMAPLANT inicializado correctamente');
});