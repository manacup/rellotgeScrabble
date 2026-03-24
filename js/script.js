const swver = "1.4.0";
let playing = false;

let currentPlayer = 1;
let descompte = true;

let jug1 = true;
let jug2 = true;
let so = true;
let vibracio = true;
let penalització = document.getElementById("penalització");
const timerPanel = document.querySelector(".player");
const buttons = document.querySelectorAll(".bttn");
const jugador1 = document.querySelector(".player-1");
const jugador2 = document.querySelector(".player-2");

const timesUp = new Audio("audio/460133__eschwabe3__robot-affirmative.wav");
const click = new Audio("audio/561660__mattruthsound.wav");
const compteenrere = new Audio("audio/beep-07a.wav");
const velocitat = 1000;

var versio = document.querySelectorAll(".verdicc");

// NoSleep: evita que la pantalla s'apagui durant el joc
var noSleep = new NoSleep();
var noSleepActiu = false;
function activaNoSleep() {
  if (!noSleepActiu) {
    noSleep.enable();
    noSleepActiu = true;
  }
}

// Reprodueix silenci cada minut com a fallback per mantenir pantalla activa
const silenci = new Audio('audio/silenci.mp3');
setInterval(() => {
  if (playing) silenci.play().catch(() => {});
}, 60000);

// Afegeix zero a l'esquerra per als números inferiors a 10.
const padZero = (number) => (number < 10 ? "0" + number : String(number));

// Classe per al rellotge.
class Timer {
  constructor(player, minutes) {
    this.player = player;
    this.minutes = minutes;
  }
  getMinutes(timeId) {
    return document.getElementById(timeId).textContent;
  }
}

let p1time = new Timer("min1", document.getElementById("min1").textContent);
let p2time = new Timer("min2", document.getElementById("min2").textContent);

// Marca el jugador actiu amb classe de penalització (color vermell).
const timeWarning = (player) => {
  if (player === 1) {
    document.querySelectorAll(".player__digits")[0].classList.add("penalty");
  } else {
    document.querySelectorAll(".player__digits")[1].classList.add("penalty");
  }
};

let timerId;
let p1sec = 60;
let p2sec = 60;

const startTimer = () => {
  playing = true;

  timerId = setInterval(function () {
    if (currentPlayer === 1) {
      if (playing && jug1) {
        p1time.minutes = parseInt(p1time.getMinutes("min1"), 10);
        if (p1sec === 60) {
          p1time.minutes = p1time.minutes - 1;
        }
        p1sec = p1sec - 1;
        document.getElementById("sec1").textContent = padZero(p1sec);
        document.getElementById("min1").textContent = padZero(p1time.minutes);

        if (p1sec === 0 && p1time.minutes === 0) {
          if (so) timesUp.play();
          if (vibracio) window.navigator.vibrate([1000]);
          jug1 = false;
          if (descompte) tempsDescompte();
        }
        if (p1sec === 0) p1sec = 60;

        if (p1time.minutes === 0 && p1sec <= 5) {
          if (so) compteenrere.play();
          if (vibracio) window.navigator.vibrate([300]);
        }

        p1time.seconds = p1sec;
        p1time.penal = jug1;
        p1time.jugador = document.getElementById("nomjug1").value;
        localStorage.setItem("tempsjug1", JSON.stringify(p1time));
      }
    } else {
      if (playing && jug2) {
        p2time.minutes = parseInt(p2time.getMinutes("min2"), 10);
        if (p2sec === 60) {
          p2time.minutes = p2time.minutes - 1;
        }
        p2sec = p2sec - 1;
        document.getElementById("sec2").textContent = padZero(p2sec);
        document.getElementById("min2").textContent = padZero(p2time.minutes);

        if (p2sec === 0 && p2time.minutes === 0) {
          if (so) timesUp.play();
          if (vibracio) window.navigator.vibrate([1000]);
          jug2 = false;
          if (descompte) tempsDescompte();
        }
        if (p2sec === 0) p2sec = 60;

        if (p2time.minutes === 0 && p2sec <= 5) {
          if (so) compteenrere.play();
          if (vibracio) window.navigator.vibrate([300]);
        }

        p2time.seconds = p2sec;
        p2time.penal = jug2;
        p2time.jugador = document.getElementById("nomjug2").value;
        localStorage.setItem("tempsjug2", JSON.stringify(p2time));
      }
    }
  }, velocitat);
};

let descompteID;
let p1secpenal = 0;
let p2secpenal = 0;

function tempsDescompte() {
  descompte = false;
  const maxPenal = parseInt(penalització.value, 10);

  descompteID = setInterval(function () {
    if (currentPlayer === 1) {
      if (playing && !jug1) {
        p1time.minutes = parseInt(p1time.getMinutes("min1"), 10);
        if (p1secpenal === 59) {
          p1time.minutes = p1time.minutes + 1;
          p1secpenal = 0;
        } else {
          p1secpenal = p1secpenal + 1;
          document.getElementById("penal1").textContent =
            "Penalització: -" + (p1time.minutes + 1) * 10 + " punts";
        }

        timeWarning(currentPlayer);
        document.getElementById("sec1").textContent = padZero(p1secpenal);
        document.getElementById("min1").textContent = padZero(p1time.minutes);

        if (p1secpenal === 0 && p1time.minutes === maxPenal) {
          if (so) timesUp.play();
          if (vibracio) window.navigator.vibrate([100, 50, 1000]);
          clearInterval(descompteID);
        }

        p1time.seconds = p1secpenal;
        p1time.penal = jug1;
        p1time.jugador = document.getElementById("nomjug1").value;
        localStorage.setItem("tempsjug1", JSON.stringify(p1time));
      }
    } else {
      if (playing && !jug2) {
        p2time.minutes = parseInt(p2time.getMinutes("min2"), 10);
        if (p2secpenal === 59) {
          p2time.minutes = p2time.minutes + 1;
          p2secpenal = 0;
        } else {
          p2secpenal = p2secpenal + 1;
          document.getElementById("penal2").textContent =
            "Penalització: -" + (p2time.minutes + 1) * 10 + " punts";
        }

        timeWarning(currentPlayer);
        document.getElementById("sec2").textContent = padZero(p2secpenal);
        document.getElementById("min2").textContent = padZero(p2time.minutes);

        if (p2secpenal === 0 && p2time.minutes === maxPenal) {
          if (so) timesUp.play();
          if (vibracio) window.navigator.vibrate([100, 50, 1000]);
          clearInterval(descompteID);
        }

        p2time.seconds = p2secpenal;
        p2time.penal = jug2;
        p2time.jugador = document.getElementById("nomjug2").value;
        localStorage.setItem("tempsjug2", JSON.stringify(p2time));
      }
    }
  }, velocitat);
}

function colors1() {
  jugador1.classList.add("actiu");
  if (!jug1) {
    document.querySelectorAll(".player__digits")[0].classList.remove("penalty_inactiu");
    document.querySelectorAll(".player__digits")[0].classList.add("penalty");
  }
  if (!jug2) {
    document.querySelectorAll(".player__digits")[1].classList.remove("penalty");
    document.querySelectorAll(".player__digits")[1].classList.add("penalty_inactiu");
  }
}

function colors2() {
  jugador2.classList.add("actiu");
  if (!jug2) {
    document.querySelectorAll(".player__digits")[1].classList.remove("penalty_inactiu");
    document.querySelectorAll(".player__digits")[1].classList.add("penalty");
  }
  if (!jug1) {
    document.querySelectorAll(".player__digits")[0].classList.remove("penalty");
    document.querySelectorAll(".player__digits")[0].classList.add("penalty_inactiu");
  }
}

function canvijug1() { canvitorn(2); colors2(); }
function canvijug2() { canvitorn(1); colors1(); }

function canvitorn(jug) {
  if (!playing && botoStart.textContent === "CONTINUA") {
    currentPlayer = jug;
    localStorage.setItem("jugactiu", jug);
    playing = true;
    document.querySelectorAll(".petit").forEach((e) => e.classList.remove("petit"));
    document.getElementById("cont").style.display = "none";
    amagarValidador();
    botoStart.style.color = "#EEEEEE";
    botoStart.style.backgroundColor = "#606060";
    botoStart.textContent = "PAUSA / VALIDA";
    if (so) click.play();
    if (vibracio) window.navigator.vibrate(50);
  } else if (!playing && botoStart.textContent === "COMENÇA") {
    currentPlayer = jug;
    localStorage.setItem("jugactiu", jug);
    startTimer();
    if (descompte && !jug1) tempsDescompte();
    if (descompte && !jug2) tempsDescompte();
    botoStart.style.color = "#EEEEEE";
    botoStart.style.backgroundColor = "#606060";
    botoStart.textContent = "PAUSA / VALIDA";
    if (so) click.play();
    if (vibracio) window.navigator.vibrate(50);
  } else if (currentPlayer !== jug) {
    currentPlayer = jug;
    localStorage.setItem("jugactiu", jug);
    jug === 2
      ? jugador1.classList.remove("actiu")
      : jugador2.classList.remove("actiu");
    if (so) click.play();
    if (vibracio) window.navigator.vibrate(50);
  }
}

// Amaga el resultat del validador i neteja l'input
function amagarValidador() {
  if (typeof qryDelete === "function") qryDelete(false);
  document.querySelector(".qry").value = "";
}

var botoStart = document.querySelector(".timer__start-bttn");

jugador1.addEventListener("touchstart", canvijug1, { passive: true });
jugador1.addEventListener("click", canvijug1);
jugador2.addEventListener("touchstart", canvijug2, { passive: true });
jugador2.addEventListener("click", canvijug2);

let ajust = document.getElementById("ajustaments");
ajust.addEventListener("toggle", () => {
  if (ajust.open === true) {
    document.querySelector(".player").style.display = "none";
    document.querySelector(".full-screen").style.display = "none";
    document.querySelector("summary").textContent = "X";
  } else {
    document.querySelector(".player").style.display = "";
    document.querySelector(".full-screen").style.display = "";
    document.querySelector("summary").textContent = "Ajustaments";
  }
});

var tempsBtn = document.getElementById("tempsBtn");
tempsBtn.addEventListener("click", () => {
  var temps = document.getElementById("temps").value;
  document.getElementById("min1").textContent = padZero(temps);
  document.getElementById("min2").textContent = padZero(temps);
  document.getElementById("sec1").textContent = "00";
  document.getElementById("sec2").textContent = "00";
  playing = false;

  clearInterval(timerId);
  p1sec = 60;
  p2sec = 60;
  clearInterval(descompteID);
  p1secpenal = 0;
  p2secpenal = 0;
  botoStart.textContent = "COMENÇA";
  botoStart.style.backgroundColor = "#0071D5";
  botoStart.style.color = "";

  document.getElementById("ajustaments").open = false;
  localStorage.setItem("temps", temps);
  localStorage.setItem("penalització", penalització.value);
  document.getElementById("cont").style.display = "none";
  jugador1.classList.remove("actiu");
  jugador2.classList.remove("actiu");
  document.querySelectorAll(".player__digits").forEach((a) => {
    a.classList.remove("penalty", "penalty_inactiu");
  });
  document.getElementById("penal1").textContent = "";
  document.getElementById("penal2").textContent = "";
  jug1 = true;
  jug2 = true;
  descompte = true;

  localStorage.removeItem("tempsjug1");
  localStorage.removeItem("tempsjug2");
  amagarValidador();
});

document.getElementById("nomjug1").addEventListener("change", () => {
  document.getElementById("nom1").textContent = document.getElementById("nomjug1").value;
});
document.getElementById("nomjug2").addEventListener("change", () => {
  document.getElementById("nom2").textContent = document.getElementById("nomjug2").value;
});

for (let i = 0; i < buttons.length; i++) {
  buttons[i].addEventListener("click", () => {
    activaNoSleep();
    if (buttons[i].textContent === "COMENÇA") {
      buttons[i].style.color = "#EEEEEE";
      buttons[i].style.backgroundColor = "#606060";
      buttons[i].textContent = "PAUSA / VALIDA";
      document.querySelector(".player-" + currentPlayer).classList.add("actiu");
      startTimer();
      if (descompte && !jug1) { tempsDescompte(); colors1(); }
      if (descompte && !jug2) tempsDescompte();
    } else if (buttons[i].textContent === "PAUSA / VALIDA") {
      playing = false;
      buttons[i].style.color = "#FFFFFF";
      buttons[i].style.backgroundColor = "#0071D5";
      buttons[i].textContent = "CONTINUA";
      jugador1.classList.remove("actiu");
      jugador2.classList.remove("actiu");
      document.querySelectorAll(".player__digits").forEach((a) => {
        a.classList.remove("penalty");
      });
      if (!jug1) document.querySelectorAll(".player__digits")[0].classList.add("penalty_inactiu");
      if (!jug2) document.querySelectorAll(".player__digits")[1].classList.add("penalty_inactiu");
      document.getElementById("cont").style.display = "";
      // Dóna focus a l'input del validador quan la pantalla sigui prou gran
      setTimeout(() => {
        if (window.innerWidth >= 600) document.querySelector(".qry").focus();
      }, 100);
    } else if (buttons[i].textContent === "CONTINUA") {
      playing = true;
      document.querySelectorAll(".petit").forEach((e) => e.classList.remove("petit"));
      buttons[i].style.color = "#EEEEEE";
      buttons[i].style.backgroundColor = "#606060";
      buttons[i].textContent = "PAUSA / VALIDA";
      document.querySelector(".player-" + currentPlayer).classList.add("actiu");
      if (currentPlayer === 1 && !jug1) {
        document.querySelectorAll(".player__digits")[0].classList.remove("penalty_inactiu");
        document.querySelectorAll(".player__digits")[0].classList.add("penalty");
      }
      if (currentPlayer === 2 && !jug2) {
        document.querySelectorAll(".player__digits")[1].classList.remove("penalty_inactiu");
        document.querySelectorAll(".player__digits")[1].classList.add("penalty");
      }
      document.getElementById("cont").style.display = "none";
      amagarValidador();
    }
  });
}

document.getElementById("input").addEventListener("click", () => {
  setTimeout(() => {
    window.scrollTo(0, 1000);
    document.querySelectorAll(".player__digits").forEach((e) => e.classList.add("petit"));
    document.querySelectorAll(".player__tile").forEach((e) => e.classList.add("petit"));
  }, 0);
});

var fullScreen = document.getElementById("checkFullScreen");
fullScreen.addEventListener("change", () => {
  fullScreen.checked ? openFullscreen() : closeFullscreen();
  localStorage.setItem("fullScreen", fullScreen.checked);
});

var botoSo = document.getElementById("checkSo");
botoSo.addEventListener("change", () => {
  so = botoSo.checked;
  localStorage.setItem("botoSo", so);
  if (so) click.play();
});

var botoVibr = document.getElementById("checkVibracio");
botoVibr.addEventListener("change", () => {
  vibracio = botoVibr.checked;
  localStorage.setItem("botoVibr", vibracio);
  if (vibracio) window.navigator.vibrate(50);
});

var elem = document.documentElement;

function toggleFullscreen() {
  const isFullscreen = document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.msFullscreenElement;

  if (isFullscreen) {
    closeFullscreen();
  } else {
    openFullscreen();
  }
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

document.getElementById("resetBtn").addEventListener("click", () => {
  document.getElementById("ajustaments").open = false;
});

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("swver").textContent = "v:" + swver;
  versio.forEach((d) => { d.textContent = disc.version; });

  var temps = localStorage.getItem("temps");
  var temps1 = JSON.parse(localStorage.getItem("tempsjug1"));
  var temps2 = JSON.parse(localStorage.getItem("tempsjug2"));

  // Preferències de so i vibració
  so = localStorage.getItem("botoSo") !== "false";
  vibracio = localStorage.getItem("botoVibr") !== "false";
  botoSo.checked = so;
  botoVibr.checked = vibracio;

  // Temps de joc per defecte
  if (temps === null) temps = 30;
  document.getElementById("temps").value = temps;

  // Temps de penalització
  if (localStorage.getItem("penalització") !== null) {
    penalització.value = localStorage.getItem("penalització");
  }

  // Restaura l'estat del jugador 1
  if (temps1 !== null) {
    document.getElementById("min1").textContent = padZero(temps1.minutes);
    document.getElementById("sec1").textContent = padZero(temps1.seconds);
    document.getElementById("nomjug1").value = temps1.jugador || "";
    document.getElementById("nom1").textContent = temps1.jugador || "";
    p1sec = temps1.seconds;
    jug1 = temps1.penal;
    if (!jug1) {
      p1secpenal = temps1.seconds;
      document.querySelectorAll(".player__digits")[0].classList.add("penalty_inactiu");
      document.getElementById("penal1").textContent =
        "Penalització: -" + (temps1.minutes + 1) * 10 + " punts";
    }
    document.getElementById("resetBtn").style.display = "";
  } else {
    document.getElementById("min1").textContent = padZero(temps);
    document.getElementById("sec1").textContent = "00";
  }

  // Restaura l'estat del jugador 2
  if (temps2 !== null) {
    document.getElementById("min2").textContent = padZero(temps2.minutes);
    document.getElementById("sec2").textContent = padZero(temps2.seconds);
    document.getElementById("nomjug2").value = temps2.jugador || "";
    document.getElementById("nom2").textContent = temps2.jugador || "";
    p2sec = temps2.seconds;
    jug2 = temps2.penal;
    if (!jug2) {
      p2secpenal = temps2.seconds;
      document.querySelectorAll(".player__digits")[1].classList.add("penalty_inactiu");
      document.getElementById("penal2").textContent =
        "Penalització: -" + (temps2.minutes + 1) * 10 + " punts";
    }
    document.getElementById("resetBtn").style.display = "";
  } else {
    document.getElementById("min2").textContent = padZero(temps);
    document.getElementById("sec2").textContent = "00";
  }
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register('./sw.js');
}

window.onbeforeunload = function () {
  return "Si recarregues la pàgina el comptador començarà de nou!";
};

document.getElementById("copy").addEventListener("click", () => {
  document.querySelectorAll(".petit").forEach((e) => e.classList.remove("petit"));
});
