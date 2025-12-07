<div align="center">
  <img src="./assets/images/LogoTamaplant.png" alt="TAMAPLANT Logo" width="200"/>
  <h1>TAMAPLANT</h1>
  <p><strong>Sistema de monitoreo inteligente de plantas con visualización 3D en tiempo real</strong></p>
</div>


![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Descripción

TAMAPLANT es una aplicación web interactiva que permite monitorear en tiempo real las condiciones ambientales de tus plantas mediante sensores conectados a un ESP32. El sistema visualiza los datos en un modelo 3D interactivo y proporciona alertas cuando los valores están fuera de los rangos óptimos.

### Características Principales

- 🎨 **Visualización 3D Interactiva** - Modelo 3D rotable con controles de zoom y pantalla completa
- 📊 **Monitoreo en Tiempo Real** - 5 sensores monitoreando diferentes parámetros
- 🔔 **Sistema de Alertas** - Notificaciones cuando los valores salen de rangos óptimos
- 🌐 **Conexión WebSocket** - Comunicación en tiempo real con ESP32
- 📱 **Diseño Responsive** - Funciona en desktop, tablet y móvil
- 🔄 **Carga de Modelos Personalizados** - Soporta archivos .gltf y .glb

## 🚀 Características Técnicas

### Sensores Monitoreados

1. **💧 Humedad del Suelo**
   - Rango óptimo: 20% - 40%
   - Rango crítico: < 15% (muy seco) | > 60% (exceso de agua)

2. **⚗️ pH del Suelo**
   - Rango óptimo: 6.0 - 7.0
   - Rango crítico: < 5.5 (muy ácido) | > 7.5 (muy alcalino)

3. **🌡️ Temperatura**
   - Rango óptimo: 15°C - 30°C
   - Rango crítico: < 10°C (daño por frío) | > 35°C (deshidratación)

4. **☀️ Luminosidad**
   - Rango óptimo: 10,000 - 50,000 lux
   - Rango crítico: < 5,000 lux (poca luz) | > 70,000 lux (quemaduras)

5. **🔘 Presión Atmosférica**
   - Rango óptimo: 1,000 - 1,020 hPa
   - Rango crítico: < 980 hPa (tormenta) | > 1,040 hPa (muy alta)

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Three.js** (r128) - Renderizado 3D
- **GLTFLoader** - Carga de modelos 3D
- **WebSocket API** - Comunicación en tiempo real
- **Vanilla JavaScript** - Sin dependencias de frameworks
- **CSS3** - Animaciones y estilos modernos

### Backend / Hardware
- **ESP32** - Microcontrolador principal
- **WebSocket Server** - Puerto 8080
- **Sensores** - Humedad, pH, temperatura, luz, presión

## 📁 Estructura del Proyecto

```
tamaplant/
├── index.html                 # Página principal
├── about.html                 # Página acerca de
├── notifications.html         # Historial de alertas
├── css/
│   └── style.css             # Estilos principales
├── js/
│   ├── app.js                # Inicialización de la aplicación
│   ├── scene.js              # Configuración de escena 3D
│   ├── camera.js             # Controles de cámara y zoom
│   ├── sensors.js            # Interactividad de sensores
│   ├── notifications.js      # Sistema de alertas
│   ├── websocket.js          # Comunicación con ESP32
│   ├── scroll.js             # Comportamiento de scroll
│   ├── ui.js                 # Modales y notificaciones
│   └── models.js             # Carga/eliminación de modelos
└── assets/
    └── images/
        └── LogoTamaplant.png # Logo del proyecto
```

## 🚀 Instalación y Uso

### Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Servidor web local (opcional: Live Server, XAMPP, etc.)
- ESP32 configurado con los sensores (para modo en vivo)

### Instalación

1. **Clonar o descargar el proyecto**
   ```bash
   git clone https://github.com/tuusuario/tamaplant.git
   cd tamaplant
   ```

2. **Iniciar servidor local**
   
   Opción 1 - Python:
   ```bash
   python -m http.server 5500
   ```
   
   Opción 2 - Node.js:
   ```bash
   npx http-server -p 5500
   ```
   
   Opción 3 - VS Code Live Server:
   - Instalar extensión "Live Server"
   - Click derecho en `index.html` → "Open with Live Server"

3. **Abrir en navegador**
   ```
   http://localhost:5500
   ```

### Configuración del ESP32

1. Actualizar la URL del WebSocket en `js/websocket.js`:
   ```javascript
   const WS_URL = 'ws://TU_IP_ESP32:8080';
   ```

2. El ESP32 debe enviar datos en formato JSON:
   ```json
   {
     "soil_moisture": 45.0,
     "lux": 12000,
     "temperature_ds18b20": 22.5,
     "pressure": 1013.2
   }
   ```

## 🎮 Uso de la Aplicación

### Controles del Modelo 3D

- **Rotar**: Click y arrastrar (mouse) o touch (móvil)
- **Zoom**: Scroll del mouse o botones +/-
- **Pantalla Completa**: Click en botón ⛶
- **Cargar Modelo**: Click en "Cargar Modelo" → seleccionar .gltf/.glb
- **Eliminar Modelo**: Click en "Eliminar Modelo"

### Interacción con Sensores

- **Hotspots Verdes**: Click para activar sensor, hover para ver valor
- **Tarjetas de Sensores**: Click para activar y ver animación
- **Notificaciones**: Click en 🔔 para ver alertas recientes

### Estados de Alerta

- 🟢 **Normal**: Valores dentro del rango óptimo
- 🟡 **Alerta**: Valores fuera de rango pero no críticos
- 🔴 **Crítico**: Valores en rango peligroso para la planta

## 📊 Sistema de Notificaciones

### Tipos de Notificaciones

1. **Toast (esquina superior derecha)**
   - Aparecen automáticamente
   - Se ocultan después de 5 segundos
   - 4 tipos: success, error, warning, info

2. **Panel de Alertas**
   - Historial de últimas 7 alertas
   - Click en 🔔 para abrir
   - Marca alertas como leídas

3. **Historial Completo**
   - Página separada con todas las alertas
   - Filtros por sensor, estado, fecha
   - Paginación de 15 alertas por página
   - Búsqueda y ordenamiento

### Almacenamiento

Las alertas se guardan en `localStorage`:
- Máximo 100 alertas en memoria
- Persistente entre sesiones
- No requiere base de datos

## 🔧 Configuración Avanzada

### Personalizar Umbrales

Editar en `js/notifications.js`:

```javascript
const THRESHOLDS = {
  temperature: {
    min: 15,              // Tu valor mínimo
    max: 30,              // Tu valor máximo
    critical_low: 10,     // Tu valor crítico bajo
    critical_high: 35     // Tu valor crítico alto
  },
  // ... otros sensores
};
```

### Cambiar Posición de Hotspots

Editar en `index.html`:

```html
<div class="sensor-hotspot" 
     style="top: 70%; left: 30%;" 
     data-sensor="humidity">
</div>
```

- `top`: 0% (arriba) - 100% (abajo)
- `left`: 0% (izquierda) - 100% (derecha)

### Modificar Colores

Editar en `css/style.css`:

```css
:root {
  --primary-color: #00FF9D;    /* Verde neón */
  --bg-dark: #121A14;          /* Fondo oscuro */
  --text-light: #E6E6E6;       /* Texto claro */
  /* ... más variables */
}
```

## 🐛 Solución de Problemas

### El modelo 3D no se carga

- ✅ Verifica que Three.js y GLTFLoader estén cargados
- ✅ Revisa la consola del navegador (F12)
- ✅ Asegúrate de que el archivo sea .gltf o .glb válido
- ✅ Verifica que el tamaño sea menor a 200MB

### WebSocket no conecta

- ✅ Verifica que el ESP32 esté encendido
- ✅ Confirma la IP y puerto correctos
- ✅ Revisa que el firewall permita conexiones
- ✅ Mira el indicador de conexión (esquina superior derecha)

### Tooltip no aparece en fullscreen

- ✅ Asegúrate de usar la versión actualizada de `sensors.js`
- ✅ Verifica que el elemento `#tooltip` exista en el DOM
- ✅ Revisa la consola por errores de JavaScript

### Modales no aparecen

- ✅ Usa la versión actualizada de `ui.js`
- ✅ Verifica que `showConfirmModal` esté definido
- ✅ Revisa el z-index del modal en CSS

## 🎨 Características Visuales

### Animaciones
- ✨ Efecto de pulso en hotspots
- 🔄 Transiciones suaves en tarjetas
- 📊 Animación de valores actualizados
- 🌊 Fade in/out en notificaciones

### Responsive Design
- 📱 Móvil: < 768px
- 💻 Tablet: 768px - 1024px
- 🖥️ Desktop: > 1024px

### Modo Pantalla Completa
- Oculta header y footer
- Expande modelo 3D
- Mantiene todos los controles
- Tooltip y modales funcionan correctamente

## 📈 Roadmap

### Versión 1.1 (Próximamente)
- [ ] Gráficos históricos de sensores
- [ ] Exportar datos a CSV
- [ ] Soporte para múltiples plantas

### Versión 2.0 (Futuro)
- [ ] Base de datos en la nube
- [ ] Aplicación móvil nativa
- [ ] Machine Learning para predicciones
- [ ] Control remoto de actuadores (riego, luz)

## 👥 Autores

- **Jonattan Larrea** - Desarrollo y diseño
- **Nelson Aravena** - Desarrollo y hardware

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

**© 2025 Proyecto TAMAPLANT - Todos los derechos reservados**
