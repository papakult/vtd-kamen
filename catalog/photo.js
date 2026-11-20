(() => {
  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;

  let modal, title, figure, message, original, close, opener;
  function buildDialog() {
    modal = document.createElement('dialog');
    modal.className = 'photo-modal';
    modal.setAttribute('aria-labelledby','catalog-photo-title');
    const header = document.createElement('div');
    header.className = 'photo-modal-head';
    title = document.createElement('h2');
    title.id = 'catalog-photo-title';
    close = document.createElement('button');
    close.type = 'button';
    close.className = 'muted-button';
    close.textContent = 'Закрыть';
    header.append(title,close);
    figure = document.createElement('div');
    figure.className = 'photo-media';
    message = document.createElement('p');
    message.className = 'photo-status';
    message.setAttribute('role','status');
    original = document.createElement('a');
    original.className = 'photo-original';
    original.rel = 'external noreferrer';
    original.referrerPolicy = 'no-referrer';
    original.textContent = 'Открыть оригинал у поставщика ↗';
    modal.append(header,figure,message,original);
    document.body.append(modal);
    close.addEventListener('click',() => modal.close());
    modal.addEventListener('click',event => {
      if (event.target !== modal) return;
      const b = modal.getBoundingClientRect();
      const outside = event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom;
      if (outside) modal.close();
    });
    modal.addEventListener('close',() => {
      figure.replaceChildren();
      if (opener?.isConnected) opener.focus({preventScroll:true});
      opener = undefined;
    });
  }

  document.addEventListener('click',event => {
    const link = event.target.closest?.('a[data-photo]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!modal) buildDialog();
    const name = link.closest('.part-row')?.querySelector('.part-title')?.textContent || 'Фотография';
    title.textContent = name;
    original.href = link.href;
    opener = link;
    try { modal.showModal(); } catch { return; }
    event.preventDefault();
    message.textContent = 'Загружаем фотографию…';
    const image = new Image();
    image.referrerPolicy = 'no-referrer';
    image.alt = name;
    image.hidden = true;
    image.addEventListener('load',() => {
      if (!modal.open || !image.isConnected) return;
      image.hidden = false;
      message.textContent = '';
    });
    image.addEventListener('error',() => {
      if (!modal.open || !image.isConnected) return;
      image.remove();
      message.textContent = 'Фотография не загрузилась. Оригинал можно открыть у поставщика.';
    });
    figure.replaceChildren(image);
    image.src = link.href;
    close.focus();
  });
})();
