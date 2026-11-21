document.querySelectorAll("[data-work-dialog]").forEach((button) => {
  const dialog = document.getElementById(button.dataset.workDialog);
  button.addEventListener("click", () => dialog.showModal());
});
