(() => {
  const cover = document.querySelector('.materials-cover');
  const video = document.getElementById('materials-film');
  const pause = cover.querySelector('.film-toggle');
  if (!video.canPlayType('video/mp4')) return;
  const portrait = matchMedia('(max-width: 640px) and (orientation: portrait)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = true;
  let visitorPaused = false;
  let blocked = false;

  video.defaultMuted = true;
  video.muted = true;

  video.addEventListener('timeupdate', () => {
    if (!reduced.matches && !document.hidden && visible && Number.isFinite(video.duration) && video.duration > 0) {
      pause.style.setProperty('--film-angle', (360 * video.currentTime / video.duration) + 'deg');
    }
  });

  function sync() {
    if (reduced.matches || !visible || document.hidden || visitorPaused || blocked) {
      video.pause();
      if (reduced.matches) {
        cover.removeAttribute('data-film-ready');
        pause.hidden = true;
      }
      return;
    }
    const source = portrait.matches ? video.dataset.portrait : video.dataset.wide;
    if (video.getAttribute('src') !== source) {
      cover.removeAttribute('data-film-ready');
      video.src = source;
    }
    video.play().catch(error => {
      if (error.name !== 'NotAllowedError') return;
      blocked = true;
      pause.hidden = true;
      cover.removeAttribute('data-film-ready');
    });
  }

  video.addEventListener('playing', () => {
    cover.setAttribute('data-film-ready', '');
    cover.setAttribute('data-playing', '');
    pause.setAttribute('aria-label', 'Приостановить смену кадров');
    pause.hidden = false;
  });
  video.addEventListener('pause', () => {
    cover.removeAttribute('data-playing');
    pause.setAttribute('aria-label', 'Продолжить смену кадров');
  });
  video.addEventListener('error', () => {
    blocked = true;
    cover.removeAttribute('data-film-ready');
    cover.removeAttribute('data-playing');
    pause.hidden = true;
  });
  pause.addEventListener('click', () => {
    visitorPaused = !visitorPaused;
    sync();
  });
  portrait.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(cover);
  }
  sync();
})();
