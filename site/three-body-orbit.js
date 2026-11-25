/*
 * Figure-eight initial conditions and Yoshida integration adapted from
 * https://github.com/nicolasadamini/three-body-webgl/tree/9025085bc2600d26eef8539c57f5077f15c7f950
 * Copyright (c) 2026 Nicolas Adamini. MIT license: assets/THREE-BODY-LICENSE.txt
 */
((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ThreeBodyOrbit = api;
})(globalThis, () => {
  const period = 6.3259140;
  const initialPositions = [-0.97000436, 0.24308753, 0.97000436, -0.24308753, 0, 0];
  const initialVelocities = [0.466203685, 0.43236573, 0.466203685, 0.43236573, -0.93240737, -0.86473146];
  const cubeRootTwo = Math.cbrt(2);
  const w1 = 1 / (2 - cubeRootTwo);
  const w0 = -cubeRootTwo / (2 - cubeRootTwo);
  const drift = [w1 / 2, (w0 + w1) / 2, (w0 + w1) / 2, w1 / 2];
  const kick = [w1, w0, w1];

  function sampleFigureEight(sampleCount = 480, substeps = 8) {
    if (!Number.isInteger(sampleCount) || sampleCount < 3 || !Number.isInteger(substeps) || substeps < 1) {
      throw new RangeError("sampleCount and substeps must be positive integers");
    }
    const positions = Float64Array.from(initialPositions);
    const velocities = Float64Array.from(initialVelocities);
    const acceleration = new Float64Array(6);
    const frames = [];
    const dt = period / (sampleCount * substeps);

    function step() {
      for (let stage = 0; stage < 4; stage++) {
        for (let i = 0; i < 6; i++) positions[i] += drift[stage] * dt * velocities[i];
        if (stage === 3) break;
        acceleration.fill(0);
        for (let i = 0; i < 3; i++) {
          for (let j = i + 1; j < 3; j++) {
            const dx = positions[2 * j] - positions[2 * i];
            const dy = positions[2 * j + 1] - positions[2 * i + 1];
            const distanceSquared = dx * dx + dy * dy;
            const force = 1 / (distanceSquared * Math.sqrt(distanceSquared));
            acceleration[2 * i] += dx * force;
            acceleration[2 * i + 1] += dy * force;
            acceleration[2 * j] -= dx * force;
            acceleration[2 * j + 1] -= dy * force;
          }
        }
        for (let i = 0; i < 6; i++) velocities[i] += kick[stage] * dt * acceleration[i];
      }
    }

    for (let i = 0; i < sampleCount; i++) {
      frames.push(Array.from(positions));
      for (let j = 0; j < substeps; j++) step();
    }
    return {
      period,
      frames,
      initialPositions: initialPositions.slice(),
      initialVelocities: initialVelocities.slice(),
      finalPositions: Array.from(positions),
      finalVelocities: Array.from(velocities),
    };
  }

  return { sampleFigureEight };
});
