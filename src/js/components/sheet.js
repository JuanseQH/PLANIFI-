export function openSheetMarkup(markup) {
  const sheet = document.getElementById("sheet");
  if (!sheet || !markup) return;
  sheet.innerHTML = `
    <button class="sheet-scrim" type="button" data-close-sheet aria-label="Cerrar panel"></button>
    ${markup}
  `;
  sheet.hidden = false;
  sheet.classList.add("is-open");
  document.body.classList.add("sheet-open");
}

export function closeSheet() {
  const sheet = document.getElementById("sheet");
  if (!sheet) return;
  sheet.classList.remove("is-open");
  sheet.setAttribute("hidden", "");
  sheet.innerHTML = "";
  document.body.classList.remove("sheet-open");
}

export function isSheetOpen() {
  return document.getElementById("sheet")?.classList.contains("is-open");
}
