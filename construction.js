document.querySelectorAll("[data-work-dialog]").forEach((button) => {
  const dialog = document.getElementById(button.dataset.workDialog);
  button.addEventListener("click", () => dialog.showModal());
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const { left, top, right, bottom } = dialog.getBoundingClientRect();
    const isOutside = event.clientX < left || event.clientX > right
      || event.clientY < top || event.clientY > bottom;
    if (isOutside) dialog.close();
  });
});
