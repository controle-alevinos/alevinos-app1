// Registro do service worker + botão "Instalar app" (Aba lateral).
// Isolado num módulo próprio para não misturar com a lógica de login/menu.

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("Falha ao registrar service worker:", err);
    });
  });
}

// No Android/Desktop (Chrome/Edge), o navegador dispara este evento quando
// o app cumpre os requisitos de instalação (manifest + service worker +
// https). Guardamos o evento e mostramos um botão próprio, mais claro
// para o usuário do que esperar o ícone discreto da barra de endereço.
let deferredInstallPrompt = null;

export function setupInstallButton(buttonEl) {
  if (!buttonEl) return;
  buttonEl.hidden = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    buttonEl.hidden = false;
  });

  buttonEl.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    buttonEl.hidden = true;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });

  window.addEventListener("appinstalled", () => {
    buttonEl.hidden = true;
    deferredInstallPrompt = null;
  });
}
