(() => {
  const cover = document.querySelector('.materials-cover');
  const video = document.getElementById('materials-film');
  const toggle = cover.querySelector('.film-toggle');
  if (!video.canPlayType('video/mp4')) return;

  const portrait = matchMedia('(max-width: 640px) and (orientation: portrait)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let visible = true;
  let waitingForPlay = false;

  video.defaultMuted = true;
  video.muted = true;
  // Switching sources must respect a pause even when the element has an autoplay attribute.
  video.autoplay = false;

  function prefersPoster() {
    return reduced.matches || connection?.saveData;
  }

  function showPlayControl() {
    cover.removeAttribute('data-playing');
    toggle.setAttribute('aria-label', video.currentTime > 0 ? 'Продолжить фоновое видео' : 'Воспроизвести фоновое видео');
    toggle.hidden = prefersPoster();
  }

  function sync() {
    if (prefersPoster() || !visible || document.hidden) {
      video.pause();
      if (prefersPoster()) {
        cover.removeAttribute('data-film-ready');
        toggle.hidden = true;
      }
      return;
    }

    const source = portrait.matches ? video.dataset.portrait : video.dataset.wide;
    if (video.getAttribute('src') !== source) {
      cover.removeAttribute('data-film-ready');
      toggle.style.setProperty('--film-angle', '0deg');
      video.src = source;
    }
    if (waitingForPlay || video.error) {
      showPlayControl();
      return;
    }
    video.play().catch(error => {
      if (error.name === 'AbortError' || video.getAttribute('src') !== source) return;
      // Browsers that require a tap still offer the film on the same control.
      waitingForPlay = true;
      showPlayControl();
    });
  }

  video.addEventListener('playing', () => {
    if (video.paused || prefersPoster() || waitingForPlay) return;
    const source = video.getAttribute('src');
    const showFrame = () => {
      if (!video.paused && !prefersPoster() && video.getAttribute('src') === source) {
        cover.setAttribute('data-film-ready', '');
      }
    };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(showFrame);
    else showFrame();
    cover.setAttribute('data-playing', '');
    toggle.setAttribute('aria-label', 'Приостановить фоновое видео');
    toggle.hidden = false;
  });
  video.addEventListener('timeupdate', () => {
    if (!video.paused && Number.isFinite(video.duration) && video.duration > 0) {
      toggle.style.setProperty('--film-angle', (360 * video.currentTime / video.duration) + 'deg');
    }
  });
  video.addEventListener('pause', showPlayControl);
  video.addEventListener('error', () => {
    cover.removeAttribute('data-film-ready');
    showPlayControl();
  });
  toggle.addEventListener('click', () => {
    if (!video.paused && !video.error) {
      waitingForPlay = true;
      video.pause();
      return;
    }
    waitingForPlay = false;
    if (video.error) video.load();
    sync();
  });

  portrait.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  connection?.addEventListener?.('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(cover);
  }
  sync();
})();
