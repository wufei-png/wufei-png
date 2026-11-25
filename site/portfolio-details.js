(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const soundToggle = document.querySelector(".sound-toggle");
  const listen = document.querySelector("[data-listen]");
  const toneNote = document.querySelector("[data-tone-note]");
  const peakValue = document.querySelector("[data-eeg-peak]");
  const activeNotes = new Set();
  let audio;

  function stopNotes() {
    for (const note of activeNotes) note.stop(audio.currentTime);
  }

  async function playNotes(frequencies, duration, volume, canPlay = () => true) {
    audio ??= new AudioContext();
    await audio.resume();
    if (!canPlay()) return;
    stopNotes();
    for (const [index, frequency] of frequencies.entries()) {
      const start = audio.currentTime + index * 0.06;
      const end = start + duration;
      const note = audio.createOscillator();
      const gain = audio.createGain();
      note.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.022);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      note.connect(gain).connect(audio.destination);
      activeNotes.add(note);
      note.onended = () => {
        note.disconnect();
        gain.disconnect();
        activeNotes.delete(note);
      };
      note.start(start);
      note.stop(end);
    }
  }

  const soundIsOn = () => soundToggle.getAttribute("aria-pressed") === "true";
  function cue(frequencies) {
    if (soundIsOn()) playNotes(frequencies, 0.22, 0.045, soundIsOn).catch(() => {});
  }

  if (typeof AudioContext === "function") {
    soundToggle.hidden = false;
    soundToggle.addEventListener("click", () => {
      const enabled = !soundIsOn();
      soundToggle.setAttribute("aria-pressed", String(enabled));
      soundToggle.textContent = enabled ? "Sound on" : "Sound off";
      if (enabled) cue([262, 392]);
      else stopNotes();
    });

    listen.closest(".eeg-listen").hidden = false;
    listen.addEventListener("click", async () => {
      const peak = Number.parseFloat(peakValue.textContent);
      try {
        await playNotes([peak * 16], 0.64, 0.11);
        toneNote.textContent = `${peak} Hz × 16 → ${peak * 16} Hz`;
      } catch {
        toneNote.textContent = "Audio is unavailable in this browser.";
      }
    });
  }

  const name = document.querySelector(".name-ripple");
  const letters = name.querySelectorAll(".name-letter");
  const echoes = name.querySelectorAll(".name-echo");
  let ring;
  let pressTimer;
  name.disabled = false;
  name.addEventListener("click", event => {
    cue([196, 294, 392]);
    name.setAttribute("data-press", "");
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => name.removeAttribute("data-press"), 650);
    if (reducedMotion.matches || typeof name.animate !== "function") return;

    ring?.remove();
    const box = name.getBoundingClientRect();
    const x = event.detail ? event.clientX - box.left : box.width / 2;
    const y = event.detail ? event.clientY - box.top : box.height / 2;
    const diameter = 2 * Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y));
    const wave = document.createElement("span");
    wave.className = "name-wave";
    wave.setAttribute("aria-hidden", "true");
    wave.style.inset = `${y}px auto auto ${x}px`;
    wave.style.width = wave.style.height = `${diameter}px`;
    ring = wave;
    name.append(wave);
    wave.animate([
      { transform: "translate(-50%, -50%) scale(.035)", opacity: 0.78 },
      { transform: "translate(-50%, -50%) scale(1)", opacity: 0 },
    ], { duration: 650, easing: "cubic-bezier(.13,.55,.32,1)" }).onfinish = () => wave.remove();

    for (const [index, echo] of echoes.entries()) {
      for (const running of echo.getAnimations()) running.cancel();
      const distance = (index + 1) * Math.max(4, box.width * 0.012);
      echo.animate([
        { transform: "translateX(0)", opacity: 0 },
        { transform: `translateX(${distance}px)`, opacity: 0.55 - index * 0.1, offset: 0.3 },
        { transform: `translateX(${distance * 1.3}px)`, opacity: 0 },
      ], { duration: 680 + index * 70, easing: "cubic-bezier(.2,.65,.25,1)" });
    }

    for (const letter of letters) {
      for (const running of letter.getAnimations()) running.cancel();
      const position = letter.getBoundingClientRect();
      const distance = Math.abs(position.left + position.width / 2 - box.left - x);
      const lift = Math.max(3, 9 * (1 - distance / (box.width * 1.55)));
      letter.animate([
        { transform: "translateY(0)", color: "var(--ink)" },
        { transform: `translateY(${-lift}px)`, color: "#842f25", offset: 0.26 },
        { transform: `translateY(${lift * 0.31}px)`, color: "var(--ink)", offset: 0.62 },
        { transform: "translateY(0)", color: "var(--ink)" },
      ], { duration: 395, delay: Math.min(210, distance * 0.34), easing: "cubic-bezier(.25,.46,.45,.94)" });
    }
  });

  reducedMotion.addEventListener("change", () => {
    if (!reducedMotion.matches) return;
    for (const element of [...letters, ...echoes, ...(ring ? [ring] : [])]) {
      for (const running of element.getAnimations()) running.cancel();
    }
    ring?.remove();
    ring = null;
  });

  const sticker = document.querySelector("[data-sticker-loop]");
  const stickerPlay = document.querySelector("[data-sticker-play]");
  const stickerProject = sticker.closest("details");
  const poster = sticker.getAttribute("src");
  let stickerPlaying = false;

  function setStickerPlaying(playing) {
    stickerPlaying = playing;
    sticker.src = playing ? sticker.dataset.stickerLoop : poster;
    stickerPlay.textContent = playing ? "Stop animation" : "Play animation";
  }

  stickerPlay.hidden = false;
  stickerPlay.addEventListener("click", () => {
    setStickerPlaying(!stickerPlaying);
    if (stickerPlaying) cue([330, 440]);
  });
  stickerProject.addEventListener("toggle", () => {
    if (!stickerProject.open && stickerPlaying) setStickerPlaying(false);
  });

  function revealSticker() {
    if (location.hash === "#sticker-maker") stickerProject.open = true;
  }
  window.addEventListener("hashchange", revealSticker);
  revealSticker();
})();
