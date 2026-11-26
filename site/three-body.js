(() => {
  const mark = document.querySelector("[data-three-body]");
  const physics = window.ThreeBodyOrbit;
  const canvas = mark?.querySelector("[data-orbit-canvas]");
  const context = canvas?.getContext("2d");
  if (!mark || !physics || !context) return;

  const toggle = mark.querySelector("[data-orbit-toggle]");
  const newOrbit = mark.querySelector("[data-orbit-new]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const palette = [[152, 55, 40], [47, 103, 93], [38, 53, 70]];
  let system;
  let history;
  let nextSample;
  let viewExtent;
  let lastEnergyCheck;
  let playing = !reducedMotion.matches;
  let inView = !("IntersectionObserver" in window);
  let frame = 0;
  let previousTime;

  function randomSeed() {
    if (window.crypto?.getRandomValues) return window.crypto.getRandomValues(new Uint32Array(1))[0];
    return Math.floor(Math.random() * 4294967296);
  }

  function sampleTrail() {
    system.bodies.forEach((body, index) => {
      history[index].push({ x: body.x, y: body.y });
      if (history[index].length > 320) history[index].shift();
    });
    nextSample = system.time + 0.025;
  }

  function advance(duration) {
    const end = system.time + duration;
    let steps = 0;
    while (system.time < end && steps < 12000) {
      const dt = Math.min(physics.suitableStep(system), end - system.time);
      if (!(dt > 0) || !Number.isFinite(dt)) return false;
      physics.step(system, dt);
      if (system.time >= nextSample) sampleTrail();
      steps++;
    }
    return system.time >= end;
  }

  function currentExtent() {
    let extent = 1.55;
    for (const path of history) {
      for (const point of path) extent = Math.max(extent, Math.abs(point.x), Math.abs(point.y));
    }
    for (const body of system.bodies) extent = Math.max(extent, Math.abs(body.x), Math.abs(body.y));
    return Math.min(8, extent * 1.18);
  }

  function draw() {
    if (!system || !viewExtent) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const scale = Math.min(width, height) * 0.39 / viewExtent;
    const x = value => centerX + value * scale;
    const y = value => centerY - value * scale;
    context.clearRect(0, 0, width, height);

    context.strokeStyle = "rgba(55, 70, 64, .14)";
    context.lineWidth = 0.7;
    context.setLineDash([1.5, 5]);
    context.beginPath();
    context.arc(centerX, centerY, Math.min(width, height) * 0.34, 0, 2 * Math.PI);
    context.stroke();
    context.setLineDash([]);

    history.forEach((path, bodyIndex) => {
      if (path.length < 2) return;
      const color = palette[bodyIndex].join(", ");
      const bands = 12;
      for (let band = 0; band < bands; band++) {
        const start = Math.floor((path.length - 1) * band / bands);
        const end = Math.min(path.length - 1, Math.ceil((path.length - 1) * (band + 1) / bands));
        context.strokeStyle = `rgba(${color}, ${0.1 + band * 0.052})`;
        context.lineWidth = 1.15;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(x(path[start].x), y(path[start].y));
        for (let index = start + 1; index <= end; index++) context.lineTo(x(path[index].x), y(path[index].y));
        context.stroke();
      }
    });

    system.bodies.forEach((body, index) => {
      const color = palette[index].join(", ");
      context.fillStyle = `rgb(${color})`;
      context.beginPath();
      context.arc(x(body.x), y(body.y), 2.8, 0, 2 * Math.PI);
      context.fill();
      context.strokeStyle = `rgba(${color}, .35)`;
      context.lineWidth = 0.8;
      context.beginPath();
      context.arc(x(body.x), y(body.y), 5.8, 0, 2 * Math.PI);
      context.stroke();
    });
  }

  function resize() {
    const density = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    const width = Math.round(bounds.width * density);
    const height = Math.round(bounds.height * density);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(density, 0, 0, density, 0, 0);
    draw();
  }

  function syncAnimation() {
    toggle.textContent = playing ? "Pause" : "Play";
    toggle.setAttribute("aria-label", playing ? "Pause three-body motion" : "Play three-body motion");
    if (playing && inView && !document.hidden) {
      if (!frame) frame = window.requestAnimationFrame(tick);
    } else {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      previousTime = undefined;
    }
  }

  function reset(seed) {
    system = physics.create(seed);
    history = [[], [], []];
    nextSample = 0;
    sampleTrail();
    if (!advance(4.5)) playing = false;
    viewExtent = currentExtent();
    lastEnergyCheck = system.time;
    draw();
    syncAnimation();
  }

  function tick(time) {
    frame = 0;
    if (!playing || !inView || document.hidden) return;
    if (previousTime !== undefined) {
      const elapsed = Math.min(0.05, (time - previousTime) / 1000);
      if (!advance(elapsed * 0.58)) {
        playing = false;
        syncAnimation();
        return;
      }
    }
    previousTime = time;
    viewExtent += (currentExtent() - viewExtent) * 0.035;
    if (system.time - lastEnergyCheck > 0.25) {
      const drift = Math.abs((physics.energy(system) - system.initialEnergy) / system.initialEnergy);
      lastEnergyCheck = system.time;
      if (!Number.isFinite(drift) || drift > 0.025 ||
          Math.max(...system.bodies.map(body => Math.hypot(body.x, body.y))) > 4.25) {
        // A body can escape, or a close encounter can exceed the integrator's accuracy.
        reset(randomSeed());
        return;
      }
    }
    draw();
    frame = window.requestAnimationFrame(tick);
  }

  toggle.addEventListener("click", () => {
    playing = !playing;
    syncAnimation();
  });
  newOrbit.addEventListener("click", () => reset(randomSeed()));
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) playing = false;
    syncAnimation();
  });
  document.addEventListener("visibilitychange", syncAnimation);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncAnimation();
    }).observe(mark);
  }
  canvas.hidden = false;
  mark.dataset.ready = "";
  toggle.hidden = false;
  newOrbit.hidden = false;
  reset(randomSeed());
  resize();
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  window.addEventListener("resize", resize);
})();
