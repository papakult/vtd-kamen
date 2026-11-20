(() => {
  const video = document.querySelector('[data-film]');
  const playButton = document.querySelector('.playback');
  if (video && playButton) {
    function updatePlayback() {
      const paused = video.paused || video.ended;
      playButton.classList.toggle('paused', paused);
      playButton.setAttribute('aria-label', paused ? 'Воспроизвести видео' : 'Приостановить видео');
    }
    playButton.hidden = false;
    playButton.addEventListener('click', () => {
      if (video.paused || video.ended) {
        if (!video.hasAttribute('src')) video.src = video.dataset.film;
        video.play().catch(updatePlayback);
      } else video.pause();
    });
    for (const event of ['play', 'pause', 'ended']) video.addEventListener(event, updatePlayback);
    video.addEventListener('error', () => { playButton.hidden = true; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) video.pause();
      }).observe(video);
    }
    updatePlayback();
  }

  const panel = document.querySelector('.collection');
  if (!panel) return;
  const products = [...panel.querySelectorAll('.product')];
  const facets = [...panel.querySelectorAll('.facet')];
  const search = panel.querySelector('input[type=search]');
  const empty = panel.querySelector('.noresults');
  const gallery = panel.querySelector('.catalog-gallery');
  const viewport = gallery.querySelector('.slide-viewport');
  const thumbStrip = gallery.querySelector('.thumbs');
  const controls = gallery.querySelector('.gallery-controls');
  const slides = [...viewport.querySelectorAll('.photo-slide')];
  const thumbs = [...thumbStrip.querySelectorAll('.slide-thumb')];
  const codeLetters = {а:'a', в:'b', е:'e', к:'k', м:'m', н:'h', о:'o', р:'p', с:'c', т:'t', у:'y', х:'x'};
  function fold(text) {
    return text.toLocaleLowerCase('ru').replaceAll('ё', 'е')
      .replace(/[‐‑‒–—−]/g, '-')
      .replace(/(\d),(?=\d)/g, '$1.')
      .replace(/(\d)\s*([xх×-])\s*(?=\d)/g, (_, digit, separator) => digit + (separator === '-' ? '-' : '×'))
      .replace(/[\p{L}\d]+(?:-[\p{L}\d]+)*/gu, token =>
        /\d/.test(token) ? token.replace(/[авекмнорстух]/g, letter => codeLetters[letter]) : token)
      .trim();
  }
  const searchIndex = products.map(row => {
    const fields = row.querySelectorAll('.product-title, .product-group, p, dt, dd, a');
    return fold(Array.from(fields, field => field.textContent).join(' '));
  });
  const counter = new Intl.PluralRules('ru');
  const nouns = panel.dataset.countKind === 'groups'
    ? {one: 'группа', few: 'группы', many: 'групп', other: 'групп'}
    : {one: 'позиция', few: 'позиции', many: 'позиций', other: 'позиций'};
  let group = '';
  let visible = products;
  let selected = 0;

  function markSelected(index) {
    selected = index;
    const id = visible[index]?.id;
    for (const thumb of thumbs) {
      const active = thumb.dataset.item === id;
      thumb.setAttribute('aria-pressed', String(active));
      if (active) {
        const left = thumb.getBoundingClientRect().left - thumbStrip.getBoundingClientRect().left + thumbStrip.scrollLeft;
        if (left < thumbStrip.scrollLeft) thumbStrip.scrollLeft = left;
        else if (left + thumb.offsetWidth > thumbStrip.scrollLeft + thumbStrip.clientWidth) {
          thumbStrip.scrollLeft = left + thumb.offsetWidth - thumbStrip.clientWidth;
        }
      }
    }
  }
  function showSlide(index) {
    if (!visible.length) return;
    const next = (index + visible.length) % visible.length;
    viewport.scrollLeft = next * viewport.clientWidth;
    markSelected(next);
  }
  function filter() {
    const terms = fold(search.value).split(/\s+/).filter(Boolean);
    visible = products.filter((row, i) => {
      const matches = (!group || row.dataset.group === group) && terms.every(term => searchIndex[i].includes(term));
      row.hidden = !matches;
      if (!matches) row.open = false;
      return matches;
    });
    const ids = new Set(visible.map(row => row.id));
    for (const element of [...slides, ...thumbs]) element.hidden = !ids.has(element.dataset.item);
    for (const facet of facets) facet.setAttribute('aria-pressed', String(facet.dataset.group === group));
    const n = visible.length;
    panel.querySelector('[data-count]').textContent = n;
    panel.querySelector('[data-noun]').textContent = nouns[counter.select(n)];
    empty.hidden = n > 0;
    gallery.hidden = n === 0;
    controls.hidden = n < 2;
    showSlide(0);
  }
  for (const facet of facets) {
    facet.addEventListener('click', () => { group = facet.dataset.group; filter(); });
  }
  search.addEventListener('input', filter);
  panel.querySelector('[data-reset]').addEventListener('click', () => {
    group = '';
    search.value = '';
    filter();
    search.focus();
  });

  for (const thumb of thumbs) {
    thumb.addEventListener('click', () => showSlide(visible.findIndex(row => row.id === thumb.dataset.item)));
  }
  for (const button of gallery.querySelectorAll('[data-step]')) {
    button.addEventListener('click', () => showSlide(selected + Number(button.dataset.step)));
  }
  viewport.addEventListener('scroll', () => {
    if (!visible.length || !viewport.clientWidth) return;
    const index = Math.min(visible.length - 1, Math.max(0, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    if (index !== selected) markSelected(index);
  }, {passive: true});
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showSlide(selected + (event.key === 'ArrowLeft' ? -1 : 1));
  });

  for (const row of products) {
    row.addEventListener('toggle', () => {
      const index = visible.indexOf(row);
      if (row.open && index >= 0) showSlide(index);
    });
  }
  for (const link of gallery.querySelectorAll('[data-apply-group]')) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      group = link.dataset.applyGroup;
      search.value = '';
      filter();
      visible[0]?.querySelector('summary').focus();
    });
  }

  function revealFragment() {
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    if (target.matches('.product')) {
      if (target.hidden) {
        search.value = '';
        group = '';
        filter();
      }
      for (const other of products) {
        if (other !== target && other.open) other.open = false;
      }
      target.open = true;
      showSlide(visible.indexOf(target));
    } else if (target.closest('.handbook')) {
      target.closest('.handbook').open = true;
    } else return;
    requestAnimationFrame(() => target.scrollIntoView({block: 'start', behavior: 'instant'}));
  }
  for (const link of gallery.querySelectorAll('.slide-title')) {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      // A repeated click on the same fragment does not fire hashchange.
      if (link.hash === location.hash) revealFragment();
    });
  }
  window.addEventListener('hashchange', revealFragment);
  panel.querySelector('.tools').hidden = false;
  filter();
  revealFragment();
})();
