(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const video = document.querySelector('[data-film]');
  const button = document.querySelector('.playback');
  if (video && button) {
    let pausedByVisitor = false;
    let motionRequested = false;
    let inView = true;
    function updateLabel() {
      button.classList.toggle('paused', video.paused);
      button.setAttribute('aria-label', video.paused ? 'Воспроизвести видео' : 'Приостановить видео');
    }
    function start() {
      if (!video.src) video.src = video.dataset.film;
      video.play().catch(updateLabel);
    }
    function sync() {
      if (!inView || document.hidden || pausedByVisitor || (reduced.matches && !motionRequested)) video.pause();
      else start();
      updateLabel();
    }
    button.hidden = false;
    button.addEventListener('click', () => {
      pausedByVisitor = !video.paused;
      motionRequested = !pausedByVisitor;
      sync();
    });
    video.addEventListener('play', updateLabel);
    video.addEventListener('pause', updateLabel);
    video.addEventListener('error', () => { button.hidden = true; });
    reduced.addEventListener('change', () => { motionRequested = false; sync(); });
    document.addEventListener('visibilitychange', sync);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); });
      observer.observe(video);
    }
    sync();
  }

  if (!reduced.matches && window.matchMedia('(pointer:fine)').matches) {
    for (const button of document.querySelectorAll('.magnet')) {
      button.addEventListener('pointermove', event => {
        const bounds = button.getBoundingClientRect();
        button.style.setProperty('--mx', ((event.clientX - bounds.left) / bounds.width - .5) * 6 + 'px');
        button.style.setProperty('--my', ((event.clientY - bounds.top) / bounds.height - .5) * 4 + 'px');
      });
      button.addEventListener('pointerleave', () => { button.style.removeProperty('--mx'); button.style.removeProperty('--my'); });
    }
  }
  const panel = document.querySelector('.collection');
  if (!panel) return;
  const products = [...panel.querySelectorAll('.product')];
  const facets = [...panel.querySelectorAll('.facet')];
  const search = panel.querySelector('input[type=search]');
  const empty = panel.querySelector('.noresults');
  const fold = text => text.toLocaleLowerCase('ru').replaceAll('ё','е').replace(/[–—−]/g,'-').trim();
  const index = products.map(row => fold(row.textContent));
  let group = '';
  function filter() {
    const terms = fold(search.value).split(/\s+/).filter(Boolean);
    const visible = [];
    products.forEach((row, i) => {
      row.hidden = !!((group && row.dataset.group !== group) || !terms.every(q => index[i].includes(q)));
      if (row.hidden) row.open = false;
      else visible.push(row);
    });
    facets.forEach(facet => facet.setAttribute('aria-pressed', String(facet.dataset.group === group)));
    const n = visible.length;
    panel.querySelector('[data-count]').textContent = n;
    panel.querySelector('[data-noun]').textContent = n%10===1 && n%100!==11 ? 'позиция' : n%10>=2 && n%10<=4 && !(n%100>=12 && n%100<=14) ? 'позиции' : 'позиций';
    empty.hidden = n > 0;

  }
  for (const facet of facets) facet.addEventListener('click', () => { group = facet.dataset.group; filter(); });
  search.addEventListener('input', filter);
  panel.querySelector('[data-reset]').addEventListener('click', () => { group=''; search.value=''; filter(); search.focus(); });
  const gallery = panel.querySelector('.catalog-gallery');
  if (gallery) {
    const viewport = gallery.querySelector('.slide-viewport');
    const slides = [...viewport.querySelectorAll('.photo-slide')];
    const thumbs = [...gallery.querySelectorAll('[data-slide]')];
    const current = () => Math.max(0, Math.min(slides.length - 1, Math.round(viewport.scrollLeft / Math.max(1, viewport.clientWidth))));
    function showSlide(index) {
      const next = (index + slides.length) % slides.length;
      viewport.scrollTo({left:next * viewport.clientWidth,behavior:reduced.matches?'instant':'smooth'});
    }
    thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => showSlide(index)));
    gallery.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => showSlide(current() + Number(button.dataset.step))));
    viewport.addEventListener('scroll', () => {
      const index = current();
      thumbs.forEach((thumb, i) => thumb.setAttribute('aria-pressed', String(i === index)));
    }, {passive:true});
    viewport.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      showSlide(current() + (event.key === 'ArrowLeft' ? -1 : 1));
    });
    for (const link of gallery.querySelectorAll('[data-apply-group]')) {
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        group = link.dataset.applyGroup;
        search.value = '';
        filter();
        const first = products.find(p => !p.hidden)?.querySelector('summary');
        if (first) { first.focus({preventScroll:true}); first.scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'center'}); }
      });
    }
    gallery.querySelector('.gallery-controls').hidden = false;
  }
  const anchor = document.getElementById(decodeURIComponentSafe(location.hash.slice(1)));
  if (anchor?.closest('.handbook')) { anchor.closest('.handbook').open = true; requestAnimationFrame(() => anchor.scrollIntoView()); }
  function decodeURIComponentSafe(value) { try { return decodeURIComponent(value); } catch { return ''; } }
  panel.querySelector('.tools').hidden = false;
})();
