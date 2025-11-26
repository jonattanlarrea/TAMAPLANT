// scroll.js - Comportamiento de scroll y pantalla completa

function setupScrollBehavior() {
  const header = document.querySelector('header');
  const main = document.querySelector('main');
  const scrollIndicator = document.getElementById('scrollIndicator');
  const container = document.getElementById('threejs-container');

  let lastScrollTop = 0;
  let isHeaderHidden = false;

  function resizeCanvas() {
    if (!window.camera || !window.renderer || !container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    window.camera.aspect = width / height;
    window.camera.updateProjectionMatrix();
    window.renderer.setSize(width, height);

    console.log(`📐 Canvas redimensionado: ${width}x${height}`);
  }

  if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
      if (!isHeaderHidden) {
        header.classList.add('hidden');
        main.classList.add('expanded');
        isHeaderHidden = true;
        scrollIndicator.classList.add('hidden');

        setTimeout(resizeCanvas, 450);
      } else {
        header.classList.remove('hidden');
        main.classList.remove('expanded');
        isHeaderHidden = false;
        scrollIndicator.classList.remove('hidden');

        setTimeout(resizeCanvas, 450);
      }
    });
  }

  window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 50 && !isHeaderHidden) {
      header.classList.add('hidden');
      main.classList.add('expanded');
      isHeaderHidden = true;
      if (scrollIndicator) scrollIndicator.classList.add('hidden');

      setTimeout(resizeCanvas, 450);
      console.log('🔼 Header oculto - Vista expandida activada');
    } else if (scrollTop <= 50 && isHeaderHidden) {
      header.classList.remove('hidden');
      main.classList.remove('expanded');
      isHeaderHidden = false;
      if (scrollIndicator) scrollIndicator.classList.remove('hidden');

      setTimeout(resizeCanvas, 450);
      console.log('🔽 Header visible - Vista normal');
    }

    lastScrollTop = scrollTop;
  });

  let scrollAttempts = 0;
  window.addEventListener('wheel', (e) => {
    if (e.deltaY > 0 && !isHeaderHidden) {
      scrollAttempts++;
      if (scrollAttempts >= 2) {
        header.classList.add('hidden');
        main.classList.add('expanded');
        isHeaderHidden = true;
        if (scrollIndicator) scrollIndicator.classList.add('hidden');
        scrollAttempts = 0;

        setTimeout(resizeCanvas, 450);
        console.log('🔼 Header oculto por scroll de rueda');
      }
    } else if (e.deltaY < 0 && isHeaderHidden) {
      scrollAttempts++;
      if (scrollAttempts >= 2) {
        header.classList.remove('hidden');
        main.classList.remove('expanded');
        isHeaderHidden = false;
        if (scrollIndicator) scrollIndicator.classList.remove('hidden');
        scrollAttempts = 0;

        setTimeout(resizeCanvas, 450);
        console.log('🔽 Header visible por scroll de rueda');
      }
    }
  });

  console.log('✅ Comportamiento de scroll configurado');
}

function setupFullscreenControls() {
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const container = document.getElementById('threejs-container');

  if (!fullscreenBtn || !container) {
    console.warn('⚠️ Botón de pantalla completa no encontrado');
    return;
  }

  let isFullscreen = false;

  fullscreenBtn.addEventListener('click', () => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  });

  function enterFullscreen() {
    container.classList.add('fullscreen');
    document.body.classList.add('fullscreen-active');

    fullscreenBtn.innerHTML = '✕';
    fullscreenBtn.title = 'Salir de pantalla completa';

    isFullscreen = true;

    setTimeout(() => {
      if (window.camera && window.renderer && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        window.camera.aspect = width / height;
        window.camera.updateProjectionMatrix();
        window.renderer.setSize(width, height);

        console.log(`📐 Pantalla completa activada: ${width}x${height}`);
      }
    }, 100);
  }

  function exitFullscreen() {
    container.classList.remove('fullscreen');
    document.body.classList.remove('fullscreen-active');

    fullscreenBtn.innerHTML = '⛶';
    fullscreenBtn.title = 'Pantalla completa';

    isFullscreen = false;

    setTimeout(() => {
      if (window.camera && window.renderer && container) {
        const width = container.clientWidth;
        const height = container.clientHeight;

        window.camera.aspect = width / height;
        window.camera.updateProjectionMatrix();
        window.renderer.setSize(width, height);

        console.log(`📐 Pantalla completa desactivada: ${width}x${height}`);
      }
    }, 100);
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFullscreen) {
      exitFullscreen();
    }
  });

  console.log('✅ Controles de pantalla completa configurados');
}