function removeCurrentModel() {
  if (window.loadedPlant) {
    window.scene.remove(window.loadedPlant);
    window.loadedPlant = null;

    // Resetear cámara a posición por defecto
    if (window.camera) {
      window.camera.position.set(0, 1, 6);
      window.camera.lookAt(0, 0, 0);
    }

    // Ocultar mensaje (no mostrar nada cuando se elimina)
    window.loadingMessage.style.display = "none";
    
    console.log("🗑️ Modelo eliminado - Cámara reseteada");
  }
}

function loadNewModel(file) {
  removeCurrentModel();

  window.loadingMessage.style.display = "block";
  window.loadingMessage.innerHTML = "⏳ Cargando tu modelo 3D...";

  const newLoader = new THREE.GLTFLoader();
  const url = URL.createObjectURL(file);

  newLoader.load(
    url,
    function (gltf) {
      window.loadedPlant = gltf.scene;

      const box = new THREE.Box3().setFromObject(window.loadedPlant);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      const maxDim = Math.max(size.x, size.y, size.z);
      
      const targetSize = 4.5;
      const scale = targetSize / maxDim;

      const finalScale = scale * 1.2;
      
      window.loadedPlant.scale.setScalar(finalScale);

      box.setFromObject(window.loadedPlant);
      const scaledSize = box.getSize(new THREE.Vector3());
      box.getCenter(center);

      window.loadedPlant.position.x = -center.x;
      window.loadedPlant.position.z = -center.z;
      
      const modelBottom = box.min.y;
      window.loadedPlant.position.y = -modelBottom - 1.3;

      adjustCameraForModel(scaledSize);

      window.scene.add(window.loadedPlant);
      window.loadingMessage.style.display = "none";

      if (typeof showNotification === 'function') {
        showNotification(
          'Modelo cargado',
          `${file.name} se ha cargado correctamente`,
          'success'
        );
      }
      
      console.log("✅ Modelo cargado correctamente");
      console.log(`📏 Dimensiones originales: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
      console.log(`📏 Dimensiones escaladas: ${scaledSize.x.toFixed(2)} x ${scaledSize.y.toFixed(2)} x ${scaledSize.z.toFixed(2)}`);
      console.log(`📐 Escala aplicada: ${finalScale.toFixed(2)}`);

      URL.revokeObjectURL(url);
    },
    function (xhr) {
      if (xhr.total > 0) {
        const percent = ((xhr.loaded / xhr.total) * 100).toFixed(0);
        window.loadingMessage.innerHTML = `
          ⏳ Cargando modelo... ${percent}%
          <br>
          <small style="color: #A8B2A0; margin-top: 0.5rem; display: block;">
            Por favor espera...
          </small>
        `;
      }
    },
    function (err) {
      window.loadingMessage.innerHTML = `
        ❌ Error al cargar el modelo
        <br>
        <small style="color: #F2C94C; margin-top: 0.5rem; display: block;">
          Verifica que sea un archivo .gltf o .glb válido
        </small>
      `;
      
      if (typeof showNotification === 'function') {
        showNotification(
          'Error al cargar',
          'No se pudo cargar el modelo. Verifica que sea un archivo válido.',
          'error'
        );
      }
      
      console.error("❌ Error cargando modelo:", err);
      URL.revokeObjectURL(url);
    }
  );
}

function adjustCameraForModel(modelSize) {
  if (!window.camera) return;
  
  const maxSize = Math.max(modelSize.x, modelSize.y, modelSize.z);

  const distance = maxSize * 1.5 + 3;
  
  window.camera.position.set(0, maxSize * 0.3 + 1, distance);
  window.camera.lookAt(0, modelSize.y * 0.3, 0);
  
  console.log(`🎥 Cámara ajustada: distancia=${distance.toFixed(2)}`);
}

function setupModelButtons() {
  const uploadBtn = document.getElementById('uploadModelBtn');
  const deleteBtn = document.getElementById('deleteModelBtn');
  const fileInput = document.getElementById('model-input');

  if (!uploadBtn || !deleteBtn || !fileInput) {
    console.error("❌ No se encontraron los elementos necesarios");
    return;
  }

  // Variable para prevenir múltiples clics
  let isDeleting = false;

  // Botón para abrir el selector de archivos
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });

  // Evento cuando se selecciona un archivo
  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar extensión
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".gltf") && !fileName.endsWith(".glb")) {
      if (typeof showNotification === 'function') {
        showNotification(
          'Formato no válido',
          'Solo se permiten archivos .gltf o .glb',
          'error'
        );
      } else {
        alert("❌ Solo se permiten archivos .gltf o .glb");
      }
      event.target.value = '';
      return;
    }

    // Validar tamaño (máximo 200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      if (typeof showNotification === 'function') {
        showNotification(
          'Archivo demasiado grande',
          'El tamaño máximo permitido es 200MB',
          'error'
        );
      } else {
        alert("❌ El archivo es demasiado grande. Máximo 200MB.");
      }
      event.target.value = '';
      return;
    }

    console.log(`📦 Cargando archivo: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    if (typeof showNotification === 'function') {
      showNotification(
        'Cargando modelo',
        `Procesando ${file.name}...`,
        'info',
        3000
      );
    }
    
    loadNewModel(file);
    
    event.target.value = '';
  });

  // Botón para eliminar el modelo actual
  deleteBtn.addEventListener('click', () => {
    // Prevenir múltiples clics
    if (isDeleting) {
      console.log('⚠️ Ya hay una operación de eliminación en proceso');
      return;
    }

    if (window.loadedPlant) {
      isDeleting = true;

      if (typeof showConfirmModal === 'function') {
        showConfirmModal(
          '¿Eliminar modelo?',
          '¿Estás seguro de que deseas eliminar el modelo actual?',
          () => {
            removeCurrentModel();
            if (typeof showNotification === 'function') {
              showNotification(
                'Modelo eliminado',
                'El modelo ha sido eliminado correctamente',
                'success'
              );
            }
            isDeleting = false;
          },
          () => {
            console.log('Eliminación cancelada');
            isDeleting = false;
          }
        ).finally(() => {
          isDeleting = false;
        });
      } else {
        const confirmDelete = confirm("¿Estás seguro de eliminar el modelo actual?");
        if (confirmDelete) {
          removeCurrentModel();
        }
        isDeleting = false;
      }
    } else {
      if (typeof showNotification === 'function') {
        showNotification(
          'Sin modelo',
          'No hay ningún modelo cargado para eliminar',
          'info'
        );
      } else {
        alert("ℹ️ No hay ningún modelo cargado");
      }
    }
  });

  console.log("✅ Botones de modelo configurados correctamente");
}