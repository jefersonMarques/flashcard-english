const installButton = document.getElementById("installAppButton");
const installHelp = document.getElementById("installHelp");
let pendingInstallPrompt = null;

function isInstalled() {
  return window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

function hideInstallInterface() {
  installButton.hidden = true;
  installHelp.hidden = true;
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  pendingInstallPrompt = event;
  if (!isInstalled()) {
    installButton.hidden = false;
  }
});

window.addEventListener("appinstalled", () => {
  pendingInstallPrompt = null;
  hideInstallInterface();
});

installButton.addEventListener("click", async () => {
  if (!pendingInstallPrompt) {
    return;
  }

  const prompt = pendingInstallPrompt;
  pendingInstallPrompt = null;
  installButton.hidden = true;
  await prompt.prompt();
  await prompt.userChoice;
});

if (!isInstalled() && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
  installHelp.hidden = false;
}

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.error("Service worker registration failed", error);
    });
  });
}
