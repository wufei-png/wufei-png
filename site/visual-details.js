(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const pose = document.querySelector("[data-research-reveal]");
  const framing = pose.querySelector(".pose-framing");
  const slider = pose.querySelector("[data-pose-slider]");
  const divider = pose.querySelector("[data-pose-divider]");
  const revealDuration = 2200 / 1.5;
  let observer;
  let sweepFrame = 0;
  let revealed = false;
  let dragging;

  function updatePose(value) {
    slider.value = Math.max(0, Math.min(100, Math.round(value)));
    pose.style.setProperty("--pose-reveal", `${slider.value}%`);
    slider.setAttribute("aria-valuetext", `${slider.value}% of the illustrative overlay visible`);
  }

  function stopSweep() {
    if (sweepFrame) window.cancelAnimationFrame(sweepFrame);
    sweepFrame = 0;
  }

  function stopObserving() {
    observer?.disconnect();
    window.removeEventListener("scroll", checkVisibility);
    window.removeEventListener("resize", checkVisibility);
  }

  function takeControl() {
    revealed = true;
    stopSweep();
    stopObserving();
  }

  function revealOnce() {
    if (revealed) return;
    revealed = true;
    stopObserving();
    if (reducedMotion.matches) return;

    updatePose(0);
    let elapsed = 0;
    let previous;
    function step(time) {
      if (previous !== undefined) elapsed += Math.min(64, time - previous);
      previous = time;
      const progress = Math.min(1, elapsed / revealDuration);
      updatePose(100 * progress * progress * (3 - 2 * progress));
      if (progress < 1) sweepFrame = window.requestAnimationFrame(step);
      else sweepFrame = 0;
    }
    sweepFrame = window.requestAnimationFrame(step);
  }

  function checkVisibility() {
    const bounds = pose.getBoundingClientRect();
    if (bounds.bottom > 0 && bounds.top < window.innerHeight * 0.8) revealOnce();
  }

  slider.addEventListener("focus", takeControl);
  slider.addEventListener("input", () => {
    takeControl();
    updatePose(Number(slider.value));
  });

  framing.addEventListener("pointerdown", event => {
    if (event.button !== 0) return;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, value: Number(slider.value), active: false };
    framing.setPointerCapture(event.pointerId);
  });
  framing.addEventListener("pointermove", event => {
    if (!dragging || dragging.id !== event.pointerId) return;
    const dx = event.clientX - dragging.x;
    const dy = event.clientY - dragging.y;
    if (!dragging.active) {
      if (Math.abs(dx) < 5 || Math.abs(dx) <= Math.abs(dy)) return;
      takeControl();
      dragging.active = true;
      framing.dataset.dragging = "";
    }
    const width = framing.getBoundingClientRect().width;
    if (width) updatePose(dragging.value + dx / width * 100);
    if (event.cancelable) event.preventDefault();
  });
  function endDrag(event) {
    if (dragging?.id !== event.pointerId) return;
    dragging = undefined;
    delete framing.dataset.dragging;
  }
  framing.addEventListener("pointerup", endDrag);
  framing.addEventListener("pointercancel", endDrag);
  framing.addEventListener("lostpointercapture", endDrag);
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) stopSweep();
  });

  updatePose(reducedMotion.matches ? 55 : 0);
  slider.hidden = false;
  divider.hidden = false;
  framing.dataset.interactive = "";
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.35)) revealOnce();
    }, { threshold: 0.35 });
    observer.observe(pose);
  } else {
    window.addEventListener("scroll", checkVisibility, { passive: true });
    window.addEventListener("resize", checkVisibility);
    checkVisibility();
  }
})();
