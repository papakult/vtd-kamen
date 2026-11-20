(() => {
  const cover = document.querySelector('.materials-cover');
  const video = document.getElementById('materials-film');
  const button = cover.querySelector('.film-toggle');
  if (!video.canPlayType('video/mp4')) return;
  const label = button.querySelector('.film-label');
  function update() {
    const playing = !video.paused && !video.ended;
    cover.toggleAttribute('data-playing', playing);
    button.setAttribute('aria-pressed', String(playing));
    label.textContent = playing ? 'Пауза' : 'Смотреть фильм';
  }
  button.hidden = false;
  button.addEventListener('click', () => {
    if (!video.paused && !video.ended) {
      video.pause();
      return;
    }
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    video.play().catch(update);
  });
  for (const event of ['playing', 'pause', 'ended']) video.addEventListener(event, update);
  video.addEventListener('error', () => {
    cover.removeAttribute('data-playing');
    button.hidden = true;
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) video.pause(); }).observe(cover);
  }
})();
