(() => {
  const cover = document.querySelector('.materials-cover');
  const video = document.getElementById('materials-film');
  if (!cover || !video?.canPlayType('video/mp4')) return;
  const control = cover.querySelector('.motion-control');
  const portrait = matchMedia('(max-width: 640px) and (orientation: portrait)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let visible = true;
  let waitingForPlay = false;

  video.defaultMuted = true;
  video.muted = true;
  // Source changes and visibility events must respect a manual pause.
  video.autoplay = false;

  function prefersPoster() {
    return reduced.matches || connection?.saveData;
  }

  function updateControl() {
    if (!control) return;
    control.hidden = prefersPoster() || !visible || document.hidden;
    control.textContent = video.paused || video.error
      ? 'Воспроизвести фоновое видео'
      : 'Приостановить фоновое видео';
  }

  function sync() {
    if (prefersPoster() || !visible || document.hidden) {
      video.pause();
      if (prefersPoster()) cover.removeAttribute('data-film-ready');
      updateControl();
      return;
    }

    const source = portrait.matches ? video.dataset.portrait : video.dataset.wide;
    if (video.getAttribute('src') !== source) {
      cover.removeAttribute('data-film-ready');
      video.src = source;
    }
    updateControl();
    if (waitingForPlay || video.error) return;
    video.play().catch(error => {
      if (error.name === 'AbortError' || video.getAttribute('src') !== source) return;
      waitingForPlay = true;
      updateControl();
    });
  }

  video.addEventListener('playing', () => {
    const source = video.getAttribute('src');
    const showFrame = () => {
      if (!video.paused && !prefersPoster() && video.getAttribute('src') === source) {
        cover.setAttribute('data-film-ready', '');
      }
    };
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(showFrame);
    else showFrame();
    updateControl();
  });
  video.addEventListener('pause', updateControl);
  video.addEventListener('error', () => {
    cover.removeAttribute('data-film-ready');
    updateControl();
  });
  control?.addEventListener('click', () => {
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
