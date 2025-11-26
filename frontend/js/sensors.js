// sensors.js - Interactividad de sensores y hotspots

function setupSensorInteractivity() {
  const sensors = document.querySelectorAll('.sensor');
  const hotspots = document.querySelectorAll('.sensor-hotspot');
  const tooltip = document.getElementById('tooltip');

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

        tooltip.style.left = e.pageX + 10 + 'px';
        tooltip.style.top = e.pageY + 10 + 'px';
      }
    });

    hotspot.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });

    hotspot.addEventListener('mousemove', e => {
      tooltip.style.left = e.pageX + 10 + 'px';
      tooltip.style.top = e.pageY + 10 + 'px';
    });
  });

  console.log('✅ Interactividad de sensores configurada');
}