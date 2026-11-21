(() => {
  const sampleRate = 128;
  const duration = 8;
  const minimumWindow = 0.5;
  const step = 0.125;
  const maxFrequency = 40;
  const demo = document.querySelector("[data-eeg-console]");
  const wave = demo.querySelector("[data-eeg-wave]");
  const spectrum = demo.querySelector("[data-eeg-spectrum]");
  const waveContext = wave.getContext("2d");
  const spectrumContext = spectrum.getContext("2d");
  if (!waveContext || !spectrumContext) return;

  const start = demo.querySelector("[data-eeg-start]");
  const end = demo.querySelector("[data-eeg-end]");
  const startValue = demo.querySelector('[data-eeg-value="start"]');
  const endValue = demo.querySelector('[data-eeg-value="end"]');
  const peakValue = demo.querySelector("[data-eeg-peak]");
  const status = demo.querySelector("[data-eeg-status]");
  const tau = Math.PI * 2;

  function envelope(time, center, spread) {
    return Math.exp(-(((time - center) / spread) ** 2));
  }

  const samples = Float64Array.from({ length: sampleRate * duration }, (_, index) => {
    const time = index / sampleRate;
    return (0.12 + 0.82 * envelope(time, 1.38, 1.22)) * Math.sin(tau * 10 * time)
      + (0.12 + 0.74 * envelope(time, 4.14, 1.12)) * Math.sin(tau * 22 * time + 0.5)
      + (0.09 + 0.86 * envelope(time, 6.72, 0.94)) * Math.sin(tau * 6 * time - 0.4)
      + 0.05 * Math.sin(tau * 31 * time);
  });

  function calculateSpectrum(segment) {
    const mean = segment.reduce((sum, value) => sum + value, 0) / segment.length;
    let windowGain = 0;
    const tapered = segment.map((value, index) => {
      const weight = 0.5 - 0.5 * Math.cos(tau * index / (segment.length - 1));
      windowGain += weight;
      return (value - mean) * weight;
    });

    // Measure one-sided amplitudes at integer frequencies after Hann tapering.
    const amplitudes = new Float64Array(maxFrequency + 1);
    let peak = 1;
    for (let hz = 1; hz <= maxFrequency; hz += 1) {
      const angle = tau * hz / sampleRate;
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      let real = 0;
      let imaginary = 0;
      let cosAtSample = 1;
      let sinAtSample = 0;
      for (const sample of tapered) {
        real += sample * cosAtSample;
        imaginary += sample * sinAtSample;
        const nextCosine = cosAtSample * cosine - sinAtSample * sine;
        sinAtSample = sinAtSample * cosine + cosAtSample * sine;
        cosAtSample = nextCosine;
      }
      amplitudes[hz] = 2 * Math.hypot(real, imaginary) / windowGain;
      if (amplitudes[hz] > amplitudes[peak]) peak = hz;
    }
    return { amplitudes, peak };
  }

  const chartInset = { left: 31, right: 15, top: 9, bottom: 24 };

  function plotArea(canvas, context) {
    const { width, height } = canvas.getBoundingClientRect();
    const resolution = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(width * resolution);
    const pixelHeight = Math.round(height * resolution);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(resolution, 0, 0, resolution, 0, 0);
    context.clearRect(0, 0, width, height);
    return {
      x: chartInset.left,
      y: chartInset.top,
      width: width - chartInset.left - chartInset.right,
      height: height - chartInset.top - chartInset.bottom,
    };
  }

  function drawAxes(context, area, bottomTicks, leftTicks, unit) {
    context.lineWidth = 1;
    context.strokeStyle = "#435754";
    context.fillStyle = "#b9cdc3";
    context.font = "11px system-ui, sans-serif";
    context.textBaseline = "middle";
    const bottom = area.y + area.height;

    context.beginPath();
    const low = leftTicks[0];
    const high = leftTicks[leftTicks.length - 1];
    context.textAlign = "right";
    for (const value of leftTicks) {
      const y = bottom - (value - low) / (high - low) * area.height;
      context.moveTo(area.x, y);
      context.lineTo(area.x + area.width, y);
      context.fillText(value, area.x - 6, y);
    }
    const last = bottomTicks[bottomTicks.length - 1];
    for (const value of bottomTicks) {
      const x = area.x + value / last * area.width;
      context.moveTo(x, area.y);
      context.lineTo(x, bottom);
      context.textAlign = value === last ? "right" : "center";
      context.fillText(value === last ? `${value} ${unit}` : value, x, bottom + 13);
    }
    context.stroke();
  }

  function drawWaveform(from, to) {
    const context = waveContext;
    const area = plotArea(wave, context);
    const left = area.x + from / duration * area.width;
    const right = area.x + to / duration * area.width;
    const bottom = area.y + area.height;
    drawAxes(context, area, [0, 2, 4, 6, 8], [-1.5, 0, 1.5], "s");

    context.fillStyle = "#a8d8bc26";
    context.fillRect(left, area.y, right - left, area.height);
    context.strokeStyle = "#e8bd9c";
    context.beginPath();
    context.moveTo(left, area.y);
    context.lineTo(left, bottom);
    context.moveTo(right, area.y);
    context.lineTo(right, bottom);
    context.stroke();

    context.beginPath();
    for (const [index, sample] of samples.entries()) {
      const x = area.x + index / samples.length * area.width;
      const y = area.y + (0.5 - sample / 3) * area.height;
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.strokeStyle = "#81a89c";
    context.stroke();
    context.save();
    const selection = new Path2D();
    selection.rect(left, area.y, right - left, area.height);
    context.clip(selection);
    context.strokeStyle = "#cbf5d3";
    context.lineWidth = 1.65;
    context.stroke();
    context.restore();
  }

  function drawSpectrum({ amplitudes, peak }) {
    const context = spectrumContext;
    const area = plotArea(spectrum, context);
    drawAxes(context, area, [0, 10, 20, 30, 40], [0, 0.55, 1.1], "Hz");
    const increment = area.width / maxFrequency;
    const barWidth = Math.max(1, increment * 0.58);
    const bottom = area.y + area.height;
    for (let hz = 1; hz <= maxFrequency; hz += 1) {
      const height = amplitudes[hz] / 1.1 * area.height;
      context.fillStyle = hz === peak ? "#f1bf9b" : "#8cccc0";
      context.fillRect(area.x + hz * increment - barWidth / 2, bottom - height, barWidth, height);
    }
  }

  let frame = 0;
  let announce = false;
  let drag;

  function redraw() {
    frame = 0;
    const from = start.valueAsNumber;
    const to = end.valueAsNumber;
    const segment = samples.subarray(from * sampleRate, to * sampleRate);
    const result = calculateSpectrum(segment);
    const peak = `${result.peak} Hz`;
    const fromLabel = from.toFixed(2);
    const toLabel = to.toFixed(2);
    startValue.textContent = `${fromLabel} s`;
    endValue.textContent = `${toLabel} s`;
    start.setAttribute("aria-valuetext", `${fromLabel} seconds`);
    end.setAttribute("aria-valuetext", `${toLabel} seconds`);
    peakValue.textContent = peak;
    drawWaveform(from, to);
    drawSpectrum(result);
    if (announce) {
      status.textContent = `From ${fromLabel} to ${toLabel} seconds. Peak frequency ${peak}.`;
      announce = false;
    }
  }

  function schedule(shouldAnnounce = false) {
    announce ||= shouldAnnounce;
    if (!frame) frame = requestAnimationFrame(redraw);
  }

  function setWindow(from, to) {
    start.valueAsNumber = from;
    end.valueAsNumber = to;
    schedule();
  }

  start.addEventListener("input", () => {
    setWindow(Math.min(start.valueAsNumber, end.valueAsNumber - minimumWindow), end.valueAsNumber);
  });
  end.addEventListener("input", () => {
    setWindow(start.valueAsNumber, Math.max(end.valueAsNumber, start.valueAsNumber + minimumWindow));
  });
  start.addEventListener("change", () => schedule(true));
  end.addEventListener("change", () => schedule(true));

  function timeAt(clientX) {
    const bounds = wave.getBoundingClientRect();
    const width = bounds.width - chartInset.left - chartInset.right;
    const position = (clientX - bounds.left - chartInset.left) / width;
    const time = Math.max(0, Math.min(duration, position * duration));
    return Math.round(time / step) * step;
  }

  function selectTo(clientX) {
    const time = timeAt(clientX);
    const from = Math.min(drag.time, time, duration - minimumWindow);
    setWindow(from, Math.max(drag.time, time, from + minimumWindow));
  }

  wave.addEventListener("pointerdown", event => {
    if (event.button !== 0 || drag) return;
    drag = { pointerId: event.pointerId, time: timeAt(event.clientX) };
    wave.setPointerCapture(event.pointerId);
  });
  wave.addEventListener("pointermove", event => {
    if (drag?.pointerId === event.pointerId) selectTo(event.clientX);
  });
  wave.addEventListener("pointerup", event => {
    if (drag?.pointerId !== event.pointerId) return;
    selectTo(event.clientX);
    schedule(true);
  });
  wave.addEventListener("lostpointercapture", event => {
    if (drag?.pointerId === event.pointerId) drag = undefined;
  });

  demo.hidden = false;
  document.querySelector("[data-eeg-fallback]").hidden = true;
  const sizeObserver = new ResizeObserver(() => schedule());
  sizeObserver.observe(wave);
  sizeObserver.observe(spectrum);
  schedule();
})();
