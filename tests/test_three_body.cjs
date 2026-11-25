const test = require("node:test");
const assert = require("node:assert/strict");
const { sampleFigureEight } = require("../site/three-body-orbit.js");

function energy(positions, velocities) {
  let total = velocities.reduce((sum, velocity) => sum + velocity * velocity / 2, 0);
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      total -= 1 / Math.hypot(positions[2 * i] - positions[2 * j], positions[2 * i + 1] - positions[2 * j + 1]);
    }
  }
  return total;
}

test("the equal-mass figure-eight returns near its initial state without energy drift", () => {
  const orbit = sampleFigureEight();
  const maxDifference = (left, right) => Math.max(...left.map((value, index) => Math.abs(value - right[index])));
  assert.ok(maxDifference(orbit.initialPositions, orbit.finalPositions) < 1e-5);
  assert.ok(maxDifference(orbit.initialVelocities, orbit.finalVelocities) < 1e-5);
  assert.ok(Math.abs(energy(orbit.initialPositions, orbit.initialVelocities) - energy(orbit.finalPositions, orbit.finalVelocities)) < 1e-9);
});

test("the three bodies trace the same curve a third of a period apart", () => {
  const { frames } = sampleFigureEight();
  const initial = frames[0];
  for (const [index, body] of [[frames.length / 3, 1], [2 * frames.length / 3, 2]]) {
    const point = frames[index];
    assert.ok(Math.hypot(point[0] - initial[2 * body], point[1] - initial[2 * body + 1]) < 1e-5);
  }
  for (const frame of frames) {
    assert.ok(frame.every(Number.isFinite));
    assert.ok(Math.abs(frame[0] + frame[2] + frame[4]) < 1e-10);
    assert.ok(Math.abs(frame[1] + frame[3] + frame[5]) < 1e-10);
  }
});
