export function fitPhone() {
  const phone = document.getElementById("phone");
  if (!phone) return;

  const scaleWrap = phone.parentElement;
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const scale = Math.min(1, maxW / 390, maxH / 844);

  phone.style.transform = `scale(${scale})`;
  phone.style.transformOrigin = "top center";
  scaleWrap.style.height = `${844 * scale}px`;
  scaleWrap.style.width = `${390 * scale}px`;
}

export function initPhoneFrame() {
  if (new URLSearchParams(location.search).has("capture")) {
    document.body.classList.add("capture");
    return;
  }

  window.addEventListener("resize", fitPhone);
  fitPhone();
}
