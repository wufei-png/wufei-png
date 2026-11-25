(() => {
  const mark = document.querySelector("[data-three-body]");
  const toggle = mark.querySelector("[data-orbit-toggle]");
  const status = mark.querySelector("[data-orbit-status]");
  const path = mark.querySelector("[data-orbit-path]");
  const bodies = [...mark.querySelectorAll("[data-orbit-body]")];
  const trails = [...mark.querySelectorAll("[data-orbit-trail]")];
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const { frames } = window.ThreeBodyOrbit.sampleFigureEight();
  const screenX = value => 90 + value * 70;
  const screenY = value => 60 - value * 70;
  const coordinate = value => value.toFixed(2);
  const figurePath = frames.map((frame, index) =>
    `${index ? "L" : "M"}${coordinate(screenX(frame[0]))} ${coordinate(screenY(frame[1]))}`
  ).join(" ");
  path.setAttribute("d", `${figurePath} Z`);

  function positionAt(body, phase) {
    const wrapped = ((phase % 1) + 1) % 1;
    const index = wrapped * frames.length;
    const current = Math.floor(index);
    const next = (current + 1) % frames.length;
    const fraction = index - current;
    const offset = body * 2;
    const x = frames[current][offset] * (1 - fraction) + frames[next][offset] * fraction;
    const y = frames[current][offset + 1] * (1 - fraction) + frames[next][offset + 1] * fraction;
    return [coordinate(screenX(x)), coordinate(screenY(y))];
  }

  function draw(phase) {
    for (let body = 0; body < bodies.length; body++) {
      const [x, y] = positionAt(body, phase);
      bodies[body].setAttribute("cx", x);
      bodies[body].setAttribute("cy", y);
      const points = [];
      for (let i = 18; i >= 0; i--) {
        const [trailX, trailY] = positionAt(body, phase - i * 0.003);
        points.push(`${i === 18 ? "M" : "L"}${trailX} ${trailY}`);
      }
      trails[body].setAttribute("d", points.join(" "));
    }
  }

  let phase = 0;
  let playing = !reducedMotion.matches;
  let inView = true;
  let frame = 0;
  let previous;

  function animate(time) {
    frame = 0;
    if (!playing || !inView || document.hidden || reducedMotion.matches) return;
    if (previous !== undefined) phase = (phase + Math.min(100, time - previous) / 18000) % 1;
    previous = time;
    draw(phase);
    frame = window.requestAnimationFrame(animate);
  }

  function syncAnimation() {
    toggle.setAttribute("aria-pressed", String(playing));
    toggle.textContent = playing ? "Pause orbit" : "Play orbit";
    if (playing && inView && !document.hidden && !reducedMotion.matches) {
      if (!frame) frame = window.requestAnimationFrame(animate);
    } else {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previous = undefined;
    }
  }

  toggle.addEventListener("click", () => {
    playing = !playing;
    syncAnimation();
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) playing = false;
    toggle.hidden = reducedMotion.matches;
    status.hidden = !reducedMotion.matches;
    syncAnimation();
  });
  document.addEventListener("visibilitychange", syncAnimation);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncAnimation();
    }).observe(mark);
  }
  toggle.hidden = reducedMotion.matches;
  status.hidden = !reducedMotion.matches;
  draw(phase);
  syncAnimation();
})();
