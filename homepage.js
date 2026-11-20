(() => {
  const cover = document.querySelector('.materials-cover');
  const video = document.getElementById('materials-film');
  if (!cover || !video?.canPlayType('video/mp4')) return;
  const control = cover.querySelector('.motion-control');
  const portrait = matchMedia('(max-width: 640px) and (orientation: portrait)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let ready = false;
  let visible = !('IntersectionObserver' in window);
  let waitingForPlay = false;

  video.defaultMuted = true;
  video.muted = true;

  function prefersPoster() {
    return reduced.matches || connection?.saveData ||
      ['slow-2g', '2g', '3g'].includes(connection?.effectiveType);
  }

  function updateControl() {
    if (!control) return;
    control.hidden = !ready || prefersPoster() || !visible || document.hidden;
    control.textContent = video.paused || video.error
      ? 'Воспроизвести фоновое видео'
      : 'Приостановить фоновое видео';
  }

  function sync() {
    if (prefersPoster()) {
      cover.removeAttribute('data-film-ready');
      if (video.hasAttribute('src')) {
        video.removeAttribute('src');
        video.load();
      }
      updateControl();
      return;
    }
    if (!ready || !visible || document.hidden) {
      video.pause();
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
  // The decorative movie starts after the page load and the poster's first paint.
  function afterLoad() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ready = true;
      sync();
    }));
  }
  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });
})();
