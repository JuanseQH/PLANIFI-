export function html(strings, ...values) {
  return strings.reduce((out, chunk, index) => out + chunk + (values[index] ?? ""), "");
}

export function bindAmountInput(input) {
  if (!input || input.dataset.bound) return;
  input.dataset.bound = "true";
  input.addEventListener("input", () => {
    const digits = input.value.replace(/\D/g, "");
    input.value = digits ? Number(digits).toLocaleString("es-CO") : "";
  });
}

export function startVoice(onResult, onStatus) {
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) {
    onStatus?.("unavailable");
    return null;
  }
  const recognition = new Speech();
  recognition.lang = "es-CO";
  recognition.interimResults = false;
  recognition.onstart = () => onStatus?.("listening");
  recognition.onerror = () => onStatus?.("error");
  recognition.onend = () => onStatus?.("idle");
  recognition.onresult = (event) => {
    const text = event.results[0]?.[0]?.transcript || "";
    onResult(text);
  };
  recognition.start();
  return recognition;
}

export function confirmAction(message) {
  return new Promise((resolve) => {
    const host = document.getElementById("confirm-host");
    host.innerHTML = `
      <div class="overlay" data-confirm="no"></div>
      <div class="sheet-card confirm-card" role="dialog" aria-modal="true">
        <h3>Confirmar</h3>
        <p>${message}</p>
        <div class="row-actions">
          <button type="button" class="btn btn-outline" data-confirm="no">Cancelar</button>
          <button type="button" class="btn btn-danger" data-confirm="yes">Eliminar</button>
        </div>
      </div>
    `;
    host.hidden = false;
    host.onclick = (event) => {
      const choice = event.target.closest("[data-confirm]")?.dataset.confirm;
      if (!choice) return;
      host.hidden = true;
      host.innerHTML = "";
      resolve(choice === "yes");
    };
  });
}
