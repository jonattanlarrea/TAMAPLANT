// scene.js - Inicialización de la escena 3D con Three.js

function initScene() {
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
  let modelAura = null;
  const loadingMessage = document.querySelector('.loading-message');

  window.loadedPlant = loadedPlant;
  window.loadingMessage = loadingMessage;
  window.scene = scene;
  window.camera = camera;
  window.renderer = renderer;
  window.modelAura = modelAura;

  // Verificar GLTFLoader
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

  // Posición inicial de la cámara
  camera.position.set(0, 1, 6);
  camera.lookAt(0, 0, 0);

  // ========================================
  // SISTEMA DE AURA
  // ========================================
  
  // Función para crear el aura alrededor del modelo
  window.createModelAura = function(model) {
    // Eliminar aura anterior si existe
    if (window.modelAura) {
      scene.remove(window.modelAura);
      window.modelAura.geometry.dispose();
      window.modelAura.material.dispose();
    }
    
    // Calcular el tamaño del modelo
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Crear geometría del aura (esfera ligeramente más grande que el modelo)
    const auraGeometry = new THREE.SphereGeometry(maxDim * 0.7, 32, 32);
    
    // Material con transparencia y brillo
    const auraMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff9d, // Verde por defecto (normal)
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    window.modelAura = new THREE.Mesh(auraGeometry, auraMaterial);
    window.modelAura.position.copy(center);
    
    scene.add(window.modelAura);
    
    console.log('✨ Aura de estado creada');
  };
  
  // Función para actualizar el color del aura según el estado
  window.updateAuraColor = function(alertLevel) {
    if (!window.modelAura) return;
    
    const material = window.modelAura.material;
    
    switch(alertLevel) {
      case 'normal':
        material.color.setHex(0x00ff9d); // Verde
        material.opacity = 0.15;
        break;
      case 'warning':
        material.color.setHex(0xf2c94c); // Amarillo
        material.opacity = 0.25;
        break;
      case 'critical':
        material.color.setHex(0xff6b6b); // Rojo
        material.opacity = 0.35;
        break;
    }
    
    console.log(`🎨 Aura actualizada: ${alertLevel}`);
  };
  
  // Función para eliminar el aura
  window.removeModelAura = function() {
    if (window.modelAura) {
      scene.remove(window.modelAura);
      window.modelAura.geometry.dispose();
      window.modelAura.material.dispose();
      window.modelAura = null;
      console.log('🗑️ Aura eliminada');
    }
  };

  // Animación de renderizado con pulsación del aura
  function animate() {
    requestAnimationFrame(animate);
    
    // Animación de pulsación del aura
    if (window.modelAura) {
      const scale = 1 + Math.sin(Date.now() * 0.002) * 0.08;
      window.modelAura.scale.set(scale, scale, scale);
    }
    
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

  console.log('✅ Escena 3D inicializada');
}