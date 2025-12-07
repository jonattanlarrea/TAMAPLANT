// sensors.js - Interactividad de sensores y hotspots

function setupSensorInteractivity() {
  const sensors = document.querySelectorAll('.sensor');
  const hotspots = document.querySelectorAll('.sensor-hotspot');
  const tooltip = document.getElementById('tooltip');

  // Asegurar que el tooltip esté visible
  if (tooltip) {
    tooltip.style.position = 'fixed';
    tooltip.style.zIndex = '99999';
  }

  // Interactividad de tarjetas de sensores
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

  // Interactividad de hotspots
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

        // Posicionar tooltip
        positionTooltip(e);
      }
    });

    hotspot.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    hotspot.addEventListener('mousemove', e => {
      if (tooltip.classList.contains('show')) {
        positionTooltip(e);
      }
    });
  });

  // Función para posicionar el tooltip correctamente en cualquier modo
  function positionTooltip(e) {
    const offset = 15;
    let left = e.clientX + offset;
    let top = e.clientY + offset;

    // Ajustar si se sale de la pantalla
    const tooltipRect = tooltip.getBoundingClientRect();
    
    if (left + tooltipRect.width > window.innerWidth) {
      left = e.clientX - tooltipRect.width - offset;
    }
    
    if (top + tooltipRect.height > window.innerHeight) {
      top = e.clientY - tooltipRect.height - offset;
    }

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  console.log('✅ Interactividad de sensores configurada');
}