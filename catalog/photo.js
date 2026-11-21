(() => {
  if (typeof HTMLDialogElement === 'undefined' || !HTMLDialogElement.prototype.showModal) return;

  let modal, title, figure, message, original, close, opener;

  function buildDialog() {
    modal = document.createElement('dialog');
    modal.className = 'photo-modal';
    modal.setAttribute('aria-labelledby', 'catalog-photo-title');

    const header = document.createElement('div');
    header.className = 'photo-modal-head';
    title = document.createElement('h2');
    title.id = 'catalog-photo-title';
    close = document.createElement('button');
    close.type = 'button';
    close.className = 'muted-button';
    close.textContent = 'Закрыть';
    header.append(title, close);

    figure = document.createElement('div');
    figure.className = 'photo-media';
    message = document.createElement('p');
    message.className = 'photo-status';
    message.setAttribute('role', 'status');
    original = document.createElement('a');
    original.className = 'photo-original';
    original.textContent = 'Открыть изображение';
    modal.append(header, figure, message, original);
    document.body.append(modal);

    close.addEventListener('click', () => modal.close());
    modal.addEventListener('click', event => {
      if (event.target !== modal) return;
      const bounds = modal.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom) modal.close();
    });
    modal.addEventListener('close', () => {
      figure.replaceChildren();
      if (opener?.isConnected) opener.focus({preventScroll: true});
      opener = undefined;
    });
  }

  function showPhoto(link) {
    if (!modal) buildDialog();
    if (!modal.open) modal.showModal();
    opener = link;
    title.textContent = link.textContent.trim();
    original.href = link.href;
    message.textContent = 'Загружаем фотографию…';

    const image = new Image();
    image.alt = title.textContent;
    image.hidden = true;
    image.addEventListener('load', () => {
      if (!image.isConnected) return;
      image.hidden = false;
      message.textContent = '';
    });
    image.addEventListener('error', () => {
      if (!image.isConnected) return;
      image.remove();
      message.textContent = 'Не удалось загрузить фотографию.';
    });
    figure.replaceChildren(image);
    image.src = link.href;
    close.focus();
  }

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-photo]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    showPhoto(link);
    event.preventDefault();
  });

  function openLinkedPhoto() {
    const row = document.getElementById(location.hash.slice(1));
    const link = row?.matches('.part-row') && row.querySelector('a[data-photo]');
    if (link) showPhoto(link);
    else if (modal?.open) modal.close();
  }

  window.addEventListener('hashchange', openLinkedPhoto);
  openLinkedPhoto();
})();
