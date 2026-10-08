const $ = (id) => document.getElementById(id);
const state = { inZone: false, timer: null, canvas: null, stream: null };

function setMessage(message) { $("message").textContent = message; }
function updateZone(inZone) {
  state.inZone = inZone;
  $("dot").classList.toggle("active", inZone);
  $("zone-status").textContent = inZone ? "Zone de démonstration détectée" : "Aucune zone détectée";
  $("enter-zone").disabled = inZone;
  $("leave-zone").disabled = !inZone;
  $("campaign").hidden = !inZone;
  if (!inZone) { stopVideo(); $("player").hidden = true; }
}
function drawColors() {
  const ctx = state.canvas.getContext("2d");
  const now = performance.now() / 1000;
  const gradient = ctx.createLinearGradient(0, 0, state.canvas.width, state.canvas.height);
  gradient.addColorStop(0, `hsl(${(now * 52) % 360}, 88%, 57%)`);
  gradient.addColorStop(0.52, `hsl(${(now * 79 + 130) % 360}, 84%, 49%)`);
  gradient.addColorStop(1, `hsl(${(now * 43 + 250) % 360}, 86%, 58%)`);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
  ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "bold 36px system-ui"; ctx.textAlign = "center";
  ctx.fillText("VIDÉO D’ESSAI", state.canvas.width / 2, state.canvas.height / 2);
  requestAnimationFrame(drawColors);
}
function prepareVideo() {
  if (state.stream) return;
  state.canvas = document.createElement("canvas"); state.canvas.width = 720; state.canvas.height = 420;
  state.stream = state.canvas.captureStream(30); $("video").srcObject = state.stream; drawColors();
}
function startVideo() {
  prepareVideo(); $("player").hidden = false; $("video").play();
  let seconds = 60; $("timer").textContent = `Session d’essai en cours : ${seconds} s`;
  clearInterval(state.timer); state.timer = setInterval(() => {
    seconds -= 1; $("timer").textContent = seconds > 0 ? `Session d’essai en cours : ${seconds} s` : "Session d’essai terminée.";
    if (seconds <= 0) stopVideo();
  }, 1000);
  const canUsePiP = (document.pictureInPictureEnabled && $("video").requestPictureInPicture) || $("video").webkitSupportsPresentationMode;
  if (canUsePiP) $("pip").hidden = false;
}
function stopVideo() { clearInterval(state.timer); $("video").pause(); $("pip").hidden = true; }

$("enter-zone").addEventListener("click", async () => {
  updateZone(true); setMessage("Zone détectée : une session d’essai est disponible.");
  if ($("alerts").checked && $("notifications").checked && Notification.permission === "granted") new Notification("Zone test", { body: "Une session d’essai est disponible." });
});
$("leave-zone").addEventListener("click", () => { updateZone(false); setMessage("Sortie de zone simulée."); });
$("request-notification").addEventListener("click", async () => {
  if (!("Notification" in window)) return setMessage("Les notifications ne sont pas disponibles dans ce navigateur.");
  const result = await Notification.requestPermission(); $("notifications").checked = result === "granted";
  setMessage(result === "granted" ? "Notifications autorisées." : "Notifications non autorisées.");
});
$("open-player").addEventListener("click", startVideo);
$("stop").addEventListener("click", () => { stopVideo(); $("timer").textContent = "Lecture arrêtée."; });
$("pip").addEventListener("click", async () => {
  try {
    if ($("video").requestPictureInPicture) await $("video").requestPictureInPicture();
    else if ($("video").webkitSupportsPresentationMode && $("video").webkitSupportsPresentationMode("picture-in-picture")) $("video").webkitSetPresentationMode("picture-in-picture");
    else throw new Error("PiP indisponible");
  } catch { setMessage("Image dans l’image indisponible sur cet appareil."); }
});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");