const swver = "1.4.3";

// ── Estat del joc ──────────────────────────────────────────────────────────
let playing = false;
let currentPlayer = 1;
let jug1 = true;    // true = temps normal, false = en penalització
let jug2 = true;
let so = true;
let vibracio = true;

// ── Temps en mil·lisegons ──────────────────────────────────────────────────
let p1ms = 0;
let p2ms = 0;
let p1penalMs = 0;
let p2penalMs = 0;
let lastTickMs = null;

const TICK_MS = 100;

// ── Flags d'estat ──────────────────────────────────────────────────────────
let timesUpTriggered1 = false;
let timesUpTriggered2 = false;
let p1penalFinal = false;
let p2penalFinal = false;

// ── Elements del DOM ──────────────────────────────────────────────────────
const penalitzacioEl = document.getElementById("penalització");
const jugador1      = document.querySelector(".player-1");
const jugador2      = document.querySelector(".player-2");
const botoStart     = document.querySelector(".timer__start-bttn");
const botoValida    = document.getElementById("btn-valida");
const botoSo        = document.getElementById("checkSo");
const botoVibr      = document.getElementById("checkVibracio");
const versio        = document.querySelectorAll(".verdicc");
const modalAjust    = document.getElementById("modal-ajust");
const modalValid    = document.getElementById("modal-valid");
const digits        = () => document.querySelectorAll(".player__digits");

// ── Àudio ─────────────────────────────────────────────────────────────────
const timesUp      = new Audio("audio/460133__eschwabe3__robot-affirmative.wav");
const clickSo      = new Audio("audio/561660__mattruthsound.wav");
const compteenrere = new Audio("audio/beep-07a.wav");
const silenci      = new Audio("audio/silenci.mp3");
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
  // Math.ceil: el "00:00" apareix ÚNICAMENT quan ms===0.
  // Amb floor, qualsevol valor entre 1ms i 999ms mostrava "00:00" en verd.
  const totalSec = Math.ceil(Math.max(0, ms) / 1000);
  return { minutes: Math.floor(totalSec / 60), seconds: totalSec % 60 };
}

function updateDisplay(n, ms) {
  const { minutes, seconds } = msToMinSec(ms);
  document.getElementById("min" + n).textContent = padZero(minutes);
  document.getElementById("sec" + n).textContent = padZero(seconds);
}

// 10 punts per cada minut o fracció de minut
function updatePenalDisplay(n, penalMs) {
  const fraccions = Math.ceil(penalMs / 60000) || 1;
  document.getElementById("penal" + n).textContent =
    "Penalització: -" + fraccions * 10 + " punts";
}

// ── Desa l'estat ──────────────────────────────────────────────────────────
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

// ── Sons de compte enrere ─────────────────────────────────────────────────
let lastBeepSec = -1;
function checkWarningSound(ms) {
  const sec = Math.floor(ms / 1000);
  if (sec <= 5 && sec > 0 && sec !== lastBeepSec) {
    lastBeepSec = sec;
    if (so) compteenrere.play();
    if (vibracio) window.navigator.vibrate([300]);
  }
}

// ── Lògica de descompte ────────────────────────────────────────────────────
// Aplicar el delta de temps al jugador actiu.
// IMPORTANT: updateDisplay(n, 0) SEMPRE s'executa DESPRÉS d'afegir en-penal,
// per garantir que el "00:00" mai apareix en verd: el verd s'atura a "00:01"
// i el "00:00" apareix directament en vermell.
function aplicaDelta(delta) {
  const maxPenalMs = parseInt(penalitzacioEl.value, 10) * 60000;

  if (currentPlayer === 1) {
    if (jug1) {
      p1ms = Math.max(0, p1ms - delta);

      if (p1ms === 0 && !timesUpTriggered1) {
        // Temps esgotat: aplica el color vermell ABANS de mostrar "00:00"
        timesUpTriggered1 = true;
        jug1 = false;
        digits()[0].classList.add("en-penal");
        updateDisplay(1, 0);
        updatePenalDisplay(1, 0);
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([1000]);
      } else if (p1ms > 0) {
        // Compte enrere normal: mai arriba a mostrar "00:00" en verd
        updateDisplay(1, p1ms);
        checkWarningSound(p1ms);
      }

    } else if (!p1penalFinal) {
      p1penalMs = Math.min(p1penalMs + delta, maxPenalMs);
      digits()[0].classList.add("en-penal");
      updateDisplay(1, p1penalMs);
      updatePenalDisplay(1, p1penalMs);
      if (p1penalMs >= maxPenalMs) {
        p1penalFinal = true;
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([100, 50, 1000]);
      }
    }

  } else {
    if (jug2) {
      p2ms = Math.max(0, p2ms - delta);

      if (p2ms === 0 && !timesUpTriggered2) {
        timesUpTriggered2 = true;
        jug2 = false;
        digits()[1].classList.add("en-penal");
        updateDisplay(2, 0);
        updatePenalDisplay(2, 0);
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([1000]);
      } else if (p2ms > 0) {
        updateDisplay(2, p2ms);
        checkWarningSound(p2ms);
      }

    } else if (!p2penalFinal) {
      p2penalMs = Math.min(p2penalMs + delta, maxPenalMs);
      digits()[1].classList.add("en-penal");
      updateDisplay(2, p2penalMs);
      updatePenalDisplay(2, p2penalMs);
      if (p2penalMs >= maxPenalMs) {
        p2penalFinal = true;
        if (so) timesUp.play();
        if (vibracio) window.navigator.vibrate([100, 50, 1000]);
      }
    }
  }
}

// ── Rellotge ──────────────────────────────────────────────────────────────
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
// Cobra al jugador sortint el delta EXACTE fins al moment del canvi.
function canviPrecis(nouJugador) {
  if (playing && lastTickMs !== null) {
    const now = Date.now();
    aplicaDelta(now - lastTickMs);
    lastTickMs = now;
  }
  currentPlayer = nouJugador;
  localStorage.setItem("jugactiu", nouJugador);
}

// ── Colors per als estats actiu/inactiu de penalització ───────────────────
function colors1() {
  jugador1.classList.add("actiu");
  if (!jug1) {
    digits()[0].classList.remove("en-penal-inactiu");
    digits()[0].classList.add("en-penal");
  }
  if (!jug2) {
    digits()[1].classList.remove("en-penal");
    digits()[1].classList.add("en-penal-inactiu");
  }
}

function colors2() {
  jugador2.classList.add("actiu");
  if (!jug2) {
    digits()[1].classList.remove("en-penal-inactiu");
    digits()[1].classList.add("en-penal");
  }
  if (!jug1) {
    digits()[0].classList.remove("en-penal");
    digits()[0].classList.add("en-penal-inactiu");
  }
}

function canvijug1() { canvitorn(2); colors2(); }
function canvijug2() { canvitorn(1); colors1(); }

function canvitorn(jug) {
  if (!playing && botoStart.textContent === "CONTINUA") {
    // Reprèn el joc i canvia de jugador
    currentPlayer = jug;
    localStorage.setItem("jugactiu", jug);
    playing = true;
    lastTickMs = Date.now();
    botoStart.textContent = "PAUSA";
    botoValida.hidden = true;
    if (so) clickSo.play();
    if (vibracio) window.navigator.vibrate(50);
  } else if (!playing && botoStart.textContent === "COMENÇA") {
    // Primera jugada: inicia el rellotge
    currentPlayer = jug;
    localStorage.setItem("jugactiu", jug);
    startTimer();
    botoStart.textContent = "PAUSA";
    botoValida.hidden = true;
    if (so) clickSo.play();
    if (vibracio) window.navigator.vibrate(50);
  } else if (playing && currentPlayer !== jug) {
    // Canvi de torn en curs: cobra el temps exacte al jugador sortint
    canviPrecis(jug);
    jug === 2
      ? jugador1.classList.remove("actiu")
      : jugador2.classList.remove("actiu");
    if (so) clickSo.play();
    if (vibracio) window.navigator.vibrate(50);
  }
}

// ── Modals ─────────────────────────────────────────────────────────────────
function obreModal(id) { document.getElementById(id).hidden = false; }
function tancaModal(id) { document.getElementById(id).hidden = true; }

// Buida el validador i tanca el seu modal
function amagarValidador() {
  if (typeof qryDelete === "function") qryDelete(false);
  document.querySelector(".qry").value = "";
  tancaModal("modal-valid");
}

// ── Ajustaments ────────────────────────────────────────────────────────────
document.getElementById("btn-ajust").addEventListener("click", () => {
  obreModal("modal-ajust");
});

document.getElementById("close-ajust").addEventListener("click", () => {
  tancaModal("modal-ajust");
  // Si no hi ha cap partida activa, el joc mostra "COMENÇA" (normal)
  // No cal fer res addicional: #joc és sempre visible.
});

// ── Validador ──────────────────────────────────────────────────────────────
botoValida.addEventListener("click", () => {
  obreModal("modal-valid");
  setTimeout(() => document.querySelector(".qry").focus(), 100);
});

document.getElementById("close-valid").addEventListener("click", amagarValidador);

// ── Botó principal ─────────────────────────────────────────────────────────
botoStart.addEventListener("click", () => {
  activaNoSleep();
  const text = botoStart.textContent;

  if (text === "COMENÇA") {
    botoStart.textContent = "PAUSA";
    botoValida.hidden = true;
    document.querySelector(".player-" + currentPlayer).classList.add("actiu");
    startTimer();

  } else if (text === "PAUSA") {
    playing = false;
    botoStart.textContent = "CONTINUA";
    botoValida.hidden = false;   // ← mostra el botó de validació
    jugador1.classList.remove("actiu");
    jugador2.classList.remove("actiu");
    digits().forEach(a => a.classList.remove("en-penal"));
    if (!jug1) digits()[0].classList.add("en-penal-inactiu");
    if (!jug2) digits()[1].classList.add("en-penal-inactiu");

  } else if (text === "CONTINUA") {
    playing = true;
    lastTickMs = Date.now();
    botoStart.textContent = "PAUSA";
    botoValida.hidden = true;
    document.querySelector(".player-" + currentPlayer).classList.add("actiu");
    if (currentPlayer === 1 && !jug1) {
      digits()[0].classList.remove("en-penal-inactiu");
      digits()[0].classList.add("en-penal");
    }
    if (currentPlayer === 2 && !jug2) {
      digits()[1].classList.remove("en-penal-inactiu");
      digits()[1].classList.add("en-penal");
    }
    amagarValidador();
  }
});

// ── Clics sobre les fitxes ─────────────────────────────────────────────────
jugador1.addEventListener("click", canvijug1);
jugador2.addEventListener("click", canvijug2);

// ── Checkboxes ─────────────────────────────────────────────────────────────
botoSo.addEventListener("change", () => {
  so = botoSo.checked;
  localStorage.setItem("botoSo", so);
});
botoVibr.addEventListener("change", () => {
  vibracio = botoVibr.checked;
  localStorage.setItem("botoVibr", vibracio);
});

// ── Nova partida ───────────────────────────────────────────────────────────
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
  currentPlayer = 1;

  clearInterval(timerId);
  timerId = null;

  updateDisplay(1, p1ms);
  updateDisplay(2, p2ms);

  botoStart.textContent = "COMENÇA";
  botoValida.hidden = true;

  jugador1.classList.remove("actiu");
  jugador2.classList.remove("actiu");
  digits().forEach(a => a.classList.remove("en-penal", "en-penal-inactiu"));
  document.getElementById("penal1").textContent = "";
  document.getElementById("penal2").textContent = "";

  localStorage.setItem("temps", tempsMinuts);
  localStorage.setItem("penalització", penalitzacioEl.value);
  localStorage.removeItem("tempsjug1");
  localStorage.removeItem("tempsjug2");

  amagarValidador();
  tancaModal("modal-ajust");
});

// ── Continua la partida ────────────────────────────────────────────────────
document.getElementById("resetBtn").addEventListener("click", () => {
  tancaModal("modal-ajust");
});

// ── Noms ───────────────────────────────────────────────────────────────────
document.getElementById("nomjug1").addEventListener("change", () => {
  document.getElementById("nom1").textContent = document.getElementById("nomjug1").value;
});
document.getElementById("nomjug2").addEventListener("change", () => {
  document.getElementById("nom2").textContent = document.getElementById("nomjug2").value;
});

// ── Inicialització ─────────────────────────────────────────────────────────
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
      digits()[0].classList.add("en-penal-inactiu");
      updatePenalDisplay(1, p1penalMs);
    }
    document.getElementById("resetBtn").hidden = false;
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
      digits()[1].classList.add("en-penal-inactiu");
      updatePenalDisplay(2, p2penalMs);
    }
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
