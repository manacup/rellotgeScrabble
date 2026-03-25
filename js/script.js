const swver = "1.4.1";

// ── Estat del joc ──────────────────────────────────────────────────────────
let playing = false;
let currentPlayer = 1;
let jug1 = true;    // true = temps normal, false = en penalització
let jug2 = true;
let so = true;
let vibracio = true;

// ── Temps en mil·lisegons (font única de veritat) ─────────────────────────
// p_ms: temps restant en compte enrere (s'esgota cap a 0)
// pPenalMs: temps de penalització acumulat en compte amunt (parteix de 0)
let p1ms = 0;
let p2ms = 0;
let p1penalMs = 0;
let p2penalMs = 0;
// Marca de temps de l'últim tick per calcular el delta real
let lastTickMs = null;

const TICK_MS = 100;  // interval del rellotge intern (alta precisió)

// ── Flags d'estat ──────────────────────────────────────────────────────────
let timesUpTriggered1 = false;
let timesUpTriggered2 = false;
let p1penalFinal = false;  // ha esgotat els minuts de penalització
let p2penalFinal = false;

// ── Elements del DOM ──────────────────────────────────────────────────────
const penalitzacioEl = document.getElementById("penalització");
const buttons = document.querySelectorAll(".bttn");
const jugador1 = document.querySelector(".player-1");
const jugador2 = document.querySelector(".player-2");
const botoStart = document.querySelector(".timer__start-bttn");
const botoSo = document.getElementById("checkSo");
const botoVibr = document.getElementById("checkVibracio");
const fullScreen = document.getElementById("checkFullScreen");
const versio = document.querySelectorAll(".verdicc");

// ── Àudio ─────────────────────────────────────────────────────────────────
const timesUp = new Audio("audio/460133__eschwabe3__robot-affirmative.wav");
const clickSo = new Audio("audio/561660__mattruthsound.wav");
const compteenrere = new Audio("audio/beep-07a.wav");
const silenci = new Audio("audio/silenci.mp3");
// Fallback per mantenir la pantalla activa en alguns navegadors
setInterval(() => { if (playing) silenci.play().catch(() => {}); }, 60000);

// ── NoSleep ────────────────────────────────────────────────────────────────
const noSleep = new NoSleep();
let noSleepActiu = false;
function activaNoSleep() {
  if (!noSleepActiu) { noSleep.enable(); noSleepActiu = true; }
}

// ── Utilitats ─────────────────────────────────────────────────────────────
const padZero = n => n < 10 ? "0" + n : String(n);

function msToMinSec(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return { minutes: Math.floor(totalSec / 60), seconds: totalSec % 60 };
}

// ── Actualització del display ──────────────────────────────────────────────
function updateDisplay(n, ms) {
  const { minutes, seconds } = msToMinSec(ms);
  document.getElementById("min" + n).textContent = padZero(minutes);
  document.getElementById("sec" + n).textContent = padZero(seconds);
}

// Penalització: 10 punts per cada minut o fracció de minut
function updatePenalDisplay(n, penalMs) {
  const fraccions = Math.ceil(penalMs / 60000) || 1;
  document.getElementById("penal" + n).textContent =
    "Penalització: -" + fraccions * 10 + " punts";
}

// ── Desa l'estat al localStorage ──────────────────────────────────────────
function saveState() {
  localStorage.setItem("tempsjug1", JSON.stringify({
    ms: p1ms, penalMs: p1penalMs, penal: jug1,
    jugador: document.getElementById("nomjug1").value
  }));
  localStorage.setItem("tempsjug2", JSON.stringify({
    ms: p2ms, penalMs: p2penalMs, penal: jug2,
    jugador: document.getElementById("nomjug2").value
  }));
}

// ── Sons de compte enrere (últims 5 segons) ────────────────────────────────
let lastBeepSec = -1;
function checkWarningSound(ms) {
  const sec = Math.floor(ms / 1000);
  if (sec <= 5 && sec > 0 && sec !== lastBeepSec) {
    lastBeepSec = sec;
    if (so) compteenrere.play();
    if (vibracio) window.navigator.vibrate([300]);
  }
}

// ── Aplica el delta de temps al jugador actiu ──────────────────────────────
// Centralitza la lògica de descompte/penalització en un sol lloc.
// S'utilitza tant des del tick periòdic com en el canvi de torn exacte.
function aplicaDelta(delta) {
  const maxPenalMs = parseInt(penalitzacioEl.value, 10) * 60000;

  if (currentPlayer === 1) {
    if (jug1) {
      // Compte enrere normal jugador 1
      p1ms = Math.max(0, p1ms - delta);
      updateDisplay(1, p1ms);
      checkWarningSound(p1ms);
      if (p1ms === 0 && !timesUpTriggered1) {
        timesUpTriggered1 = true;
        jug1 = false;
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([1000]);
      }
    } else if (!p1penalFinal) {
      // Penalització jugador 1 (comptador amunt)
      p1penalMs = Math.min(p1penalMs + delta, maxPenalMs);
      updateDisplay(1, p1penalMs);
      updatePenalDisplay(1, p1penalMs);
      document.querySelectorAll(".player__digits")[0].classList.add("en-penal");
      if (p1penalMs >= maxPenalMs) {
        p1penalFinal = true;
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([100, 50, 1000]);
      }
    }
  } else {
    if (jug2) {
      // Compte enrere normal jugador 2
      p2ms = Math.max(0, p2ms - delta);
      updateDisplay(2, p2ms);
      checkWarningSound(p2ms);
      if (p2ms === 0 && !timesUpTriggered2) {
        timesUpTriggered2 = true;
        jug2 = false;
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([1000]);
      }
    } else if (!p2penalFinal) {
      // Penalització jugador 2 (comptador amunt)
      p2penalMs = Math.min(p2penalMs + delta, maxPenalMs);
      updateDisplay(2, p2penalMs);
      updatePenalDisplay(2, p2penalMs);
      document.querySelectorAll(".player__digits")[1].classList.add("en-penal");
      if (p2penalMs >= maxPenalMs) {
        p2penalFinal = true;
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([100, 50, 1000]);
      }
    }
  }
}

// ── Tick del rellotge (cada TICK_MS ms) ───────────────────────────────────
let timerId = null;

function tick() {
  if (!playing) return;
  const now = Date.now();
  const delta = now - lastTickMs;
  lastTickMs = now;
  aplicaDelta(delta);
  saveState();
}

const startTimer = () => {
  playing = true;
  lastTickMs = Date.now();
  timerId = setInterval(tick, TICK_MS);
};

// ── Canvi de torn precís ───────────────────────────────────────────────────
// En prémer la fitxa del jugador que acaba el torn:
//  1) Es cobra al jugador actiu el delta EXACTE fins al moment del canvi.
//  2) Es canvia currentPlayer.
//  3) lastTickMs s'actualitza al moment exacte del canvi.
// Així cap jugador perd ni guanya fraccions de segon entre torns.
function canviPrecis(nouJugador) {
  if (playing && lastTickMs !== null) {
    const now = Date.now();
    aplicaDelta(now - lastTickMs);
    lastTickMs = now;
  }
  currentPlayer = nouJugador;
  localStorage.setItem("jugactiu", nouJugador);
}

// ── Colors actiu/inactiu ──────────────────────────────────────────────────
function colors1() {
  jugador1.classList.add("actiu");
  if (!jug1) {
    document.querySelectorAll(".player__digits")[0].classList.remove("en-penal-inactiu");
    document.querySelectorAll(".player__digits")[0].classList.add("en-penal");
  }
  if (!jug2) {
    document.querySelectorAll(".player__digits")[1].classList.remove("en-penal");
    document.querySelectorAll(".player__digits")[1].classList.add("en-penal-inactiu");
  }
}

function colors2() {
  jugador2.classList.add("actiu");
  if (!jug2) {
    document.querySelectorAll(".player__digits")[1].classList.remove("en-penal-inactiu");
    document.querySelectorAll(".player__digits")[1].classList.add("en-penal");
  }
  if (!jug1) {
    document.querySelectorAll(".player__digits")[0].classList.remove("en-penal");
    document.querySelectorAll(".player__digits")[0].classList.add("en-penal-inactiu");
  }
}

function canvijug1() { canvitorn(2); colors2(); }
function canvijug2() { canvitorn(1); colors1(); }

function canvitorn(jug) {
  if (!playing && botoStart.textContent === "CONTINUA") {
    // Reprèn el joc canviant de jugador
    currentPlayer = jug;
    localStorage.setItem("jugactiu", jug);
    playing = true;
    lastTickMs = Date.now();  // ← evita cobrar el temps de pausa
    document.querySelectorAll(".petit").forEach(e => e.classList.remove("petit"));
    document.getElementById("cont").style.display = "none";
    amagarValidador();
    botoStart.style.color = "#EEEEEE";
    botoStart.style.backgroundColor = "#606060";
    botoStart.textContent = "PAUSA / VALIDA";
    if (so) clickSo.play();
    if (vibracio) window.navigator.vibrate(50);
  } else if (!playing && botoStart.textContent === "COMENÇA") {
    // Primera jugada: inicia el rellotge
    currentPlayer = jug;
    localStorage.setItem("jugactiu", jug);
    startTimer();
    botoStart.style.color = "#EEEEEE";
    botoStart.style.backgroundColor = "#606060";
    botoStart.textContent = "PAUSA / VALIDA";
    if (so) clickSo.play();
    if (vibracio) window.navigator.vibrate(50);
  } else if (playing && currentPlayer !== jug) {
    // Canvi de torn: cobra el temps exacte al jugador que para
    canviPrecis(jug);
    jug === 2
      ? jugador1.classList.remove("actiu")
      : jugador2.classList.remove("actiu");
    if (so) clickSo.play();
    if (vibracio) window.navigator.vibrate(50);
  }
}

// ── Amaga el validador ────────────────────────────────────────────────────
function amagarValidador() {
  if (typeof qryDelete === "function") qryDelete(false);
  document.querySelector(".qry").value = "";
}

// ── Menú d'ajustaments ────────────────────────────────────────────────────
const ajust = document.getElementById("ajustaments");
ajust.addEventListener("toggle", () => {
  if (ajust.open) {
    document.querySelector(".player").style.display = "none";
    document.querySelector(".full-screen").style.display = "none";
    document.querySelector("summary").textContent = "X";
  } else {
    document.querySelector(".player").style.display = "";
    document.querySelector(".full-screen").style.display = "";
    document.querySelector("summary").textContent = "Ajustaments";
  }
});

// ── Botó "Nova partida" ───────────────────────────────────────────────────
document.getElementById("tempsBtn").addEventListener("click", () => {
  const tempsMinuts = parseInt(document.getElementById("temps").value, 10) || 30;
  p1ms = tempsMinuts * 60000;
  p2ms = tempsMinuts * 60000;
  p1penalMs = 0;
  p2penalMs = 0;
  timesUpTriggered1 = false;
  timesUpTriggered2 = false;
  p1penalFinal = false;
  p2penalFinal = false;
  lastBeepSec = -1;
  playing = false;
  jug1 = true;
  jug2 = true;
  lastTickMs = null;

  clearInterval(timerId);
  timerId = null;

  updateDisplay(1, p1ms);
  updateDisplay(2, p2ms);

  botoStart.textContent = "COMENÇA";
  botoStart.style.backgroundColor = "#0071D5";
  botoStart.style.color = "";

  document.getElementById("ajustaments").open = false;
  localStorage.setItem("temps", tempsMinuts);
  localStorage.setItem("penalització", penalitzacioEl.value);
  document.getElementById("cont").style.display = "none";
  jugador1.classList.remove("actiu");
  jugador2.classList.remove("actiu");
  document.querySelectorAll(".player__digits").forEach(a => {
    a.classList.remove("en-penal", "en-penal-inactiu");
  });
  document.getElementById("penal1").textContent = "";
  document.getElementById("penal2").textContent = "";

  localStorage.removeItem("tempsjug1");
  localStorage.removeItem("tempsjug2");
  amagarValidador();
});

// ── Noms dels jugadors ────────────────────────────────────────────────────
document.getElementById("nomjug1").addEventListener("change", () => {
  document.getElementById("nom1").textContent = document.getElementById("nomjug1").value;
});
document.getElementById("nomjug2").addEventListener("change", () => {
  document.getElementById("nom2").textContent = document.getElementById("nomjug2").value;
});

// ── Botó principal (COMENÇA / PAUSA / CONTINUA) ───────────────────────────
for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", () => {
    activaNoSleep();
    const text = buttons[i].textContent;

    if (text === "COMENÇA") {
      buttons[i].style.color = "#EEEEEE";
      buttons[i].style.backgroundColor = "#606060";
      buttons[i].textContent = "PAUSA / VALIDA";
      document.querySelector(".player-" + currentPlayer).classList.add("actiu");
      startTimer();

    } else if (text === "PAUSA / VALIDA") {
      playing = false;
      buttons[i].style.color = "#FFFFFF";
      buttons[i].style.backgroundColor = "#0071D5";
      buttons[i].textContent = "CONTINUA";
      jugador1.classList.remove("actiu");
      jugador2.classList.remove("actiu");
      document.querySelectorAll(".player__digits").forEach(a => a.classList.remove("en-penal"));
      if (!jug1) document.querySelectorAll(".player__digits")[0].classList.add("en-penal-inactiu");
      if (!jug2) document.querySelectorAll(".player__digits")[1].classList.add("en-penal-inactiu");
      document.getElementById("cont").style.display = "";
      // Focus al validador només en pantalles grans (evita teclat automàtic al mòbil)
      if (window.innerWidth >= 600) {
        setTimeout(() => document.querySelector(".qry").focus(), 100);
      }

    } else if (text === "CONTINUA") {
      playing = true;
      lastTickMs = Date.now();  // ← evita cobrar el temps de pausa
      document.querySelectorAll(".petit").forEach(e => e.classList.remove("petit"));
      buttons[i].style.color = "#EEEEEE";
      buttons[i].style.backgroundColor = "#606060";
      buttons[i].textContent = "PAUSA / VALIDA";
      document.querySelector(".player-" + currentPlayer).classList.add("actiu");
      if (currentPlayer === 1 && !jug1) {
        document.querySelectorAll(".player__digits")[0].classList.remove("en-penal-inactiu");
        document.querySelectorAll(".player__digits")[0].classList.add("en-penal");
      }
      if (currentPlayer === 2 && !jug2) {
        document.querySelectorAll(".player__digits")[1].classList.remove("en-penal-inactiu");
        document.querySelectorAll(".player__digits")[1].classList.add("en-penal");
      }
      document.getElementById("cont").style.display = "none";
      amagarValidador();
    }
  });
}

// ── Input del validador ───────────────────────────────────────────────────
document.getElementById("input").addEventListener("click", () => {
  setTimeout(() => {
    window.scrollTo(0, 1000);
    document.querySelectorAll(".player__digits").forEach(e => e.classList.add("petit"));
    document.querySelectorAll(".player__tile").forEach(e => e.classList.add("petit"));
  }, 0);
});

// ── Pantalla completa ─────────────────────────────────────────────────────
fullScreen.addEventListener("change", () => {
  fullScreen.checked ? openFullscreen() : closeFullscreen();
  localStorage.setItem("fullScreen", fullScreen.checked);
});

const elem = document.documentElement;

function toggleFullscreen() {
  const isFs = document.fullscreenElement || document.webkitFullscreenElement
    || document.mozFullScreenElement || document.msFullscreenElement;
  isFs ? closeFullscreen() : openFullscreen();
}

function openFullscreen() {
  if (elem.requestFullscreen) elem.requestFullscreen({ navigationUI: "hide" });
  else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen({ navigationUI: "hide" });
  else if (elem.msRequestFullscreen) elem.msRequestFullscreen({ navigationUI: "hide" });
  fullScreen.checked = true;
}

function closeFullscreen() {
  if (document.exitFullscreen) document.exitFullscreen();
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  else if (document.msExitFullscreen) document.msExitFullscreen();
  fullScreen.checked = false;
}

// ── Clics sobre les fitxes dels jugadors ─────────────────────────────────
jugador1.addEventListener("click", canvijug1);
jugador2.addEventListener("click", canvijug2);

// ── Checkboxes de so i vibració ───────────────────────────────────────────
botoSo.addEventListener("change", () => {
  so = botoSo.checked;
  localStorage.setItem("botoSo", so);
});
botoVibr.addEventListener("change", () => {
  vibracio = botoVibr.checked;
  localStorage.setItem("botoVibr", vibracio);
});

// ── Botó "Continua la partida" (del menú) ────────────────────────────────
document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("ajustaments").open = false;
});

// ── Inicialització: restaura l'estat del localStorage ────────────────────
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("swver").textContent = "v:" + swver;
  versio.forEach(d => { d.textContent = disc.version; });

  const tempsGuardat = localStorage.getItem("temps");
  const tempsMinuts = tempsGuardat !== null ? parseInt(tempsGuardat, 10) : 30;
  document.getElementById("temps").value = tempsMinuts;

  if (localStorage.getItem("penalització") !== null) {
    penalitzacioEl.value = localStorage.getItem("penalització");
  }

  so = localStorage.getItem("botoSo") !== "false";
  vibracio = localStorage.getItem("botoVibr") !== "false";
  botoSo.checked = so;
  botoVibr.checked = vibracio;

  // Restaura jugador 1
  const raw1 = localStorage.getItem("tempsjug1");
  const data1 = raw1 ? JSON.parse(raw1) : null;
  if (data1 !== null && data1.ms !== undefined) {
    p1ms = data1.ms;
    p1penalMs = data1.penalMs || 0;
    jug1 = data1.penal;
    document.getElementById("nomjug1").value = data1.jugador || "";
    document.getElementById("nom1").textContent = data1.jugador || "";
    updateDisplay(1, jug1 ? p1ms : p1penalMs);
    if (!jug1) {
      document.querySelectorAll(".player__digits")[0].classList.add("en-penal-inactiu");
      updatePenalDisplay(1, p1penalMs);
    }
    document.getElementById("resetBtn").style.display = "";
  } else {
    p1ms = tempsMinuts * 60000;
    updateDisplay(1, p1ms);
  }

  // Restaura jugador 2
  const raw2 = localStorage.getItem("tempsjug2");
  const data2 = raw2 ? JSON.parse(raw2) : null;
  if (data2 !== null && data2.ms !== undefined) {
    p2ms = data2.ms;
    p2penalMs = data2.penalMs || 0;
    jug2 = data2.penal;
    document.getElementById("nomjug2").value = data2.jugador || "";
    document.getElementById("nom2").textContent = data2.jugador || "";
    updateDisplay(2, jug2 ? p2ms : p2penalMs);
    if (!jug2) {
      document.querySelectorAll(".player__digits")[1].classList.add("en-penal-inactiu");
      updatePenalDisplay(2, p2penalMs);
    }
    document.getElementById("resetBtn").style.display = "";
  } else {
    p2ms = tempsMinuts * 60000;
    updateDisplay(2, p2ms);
  }
});

// ── Service Worker ────────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js");
}

window.onbeforeunload = () => "Si recarregues la pàgina el comptador començarà de nou!";

document.getElementById("copy").addEventListener("click", () => {
  document.querySelectorAll(".petit").forEach(e => e.classList.remove("petit"));
});
