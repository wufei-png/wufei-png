const test = require("node:test");
const assert = require("node:assert/strict");
const physics = require("../site/three-body-orbit.js");

function advance(system, duration) {
  const end = system.time + duration;
  while (system.time < end) physics.step(system, Math.min(physics.suitableStep(system), end - system.time));
}

test("a seed reproduces the same initial system and another seed changes it", () => {
  assert.deepEqual(physics.create(1234), physics.create(1234));
  assert.notDeepEqual(physics.create(1234).bodies, physics.create(1235).bodies);
});

test("the simulated bodies move under mutual gravity while conserving momentum and energy", () => {
  const system = physics.create(1234);
  const initial = system.bodies.map(body => [body.x, body.y]);
  const initialEnergy = system.initialEnergy;
  advance(system, 8);
  const momentum = field => system.bodies.reduce((sum, body) => sum + body.mass * body[field], 0);
  assert.ok(Math.abs(momentum("vx")) < 1e-10);
  assert.ok(Math.abs(momentum("vy")) < 1e-10);
  assert.ok(Math.abs((physics.energy(system) - initialEnergy) / initialEnergy) < 0.001);
  assert.ok(system.bodies.some((body, index) => Math.hypot(body.x - initial[index][0], body.y - initial[index][1]) > 0.1));
});

test("softening keeps the calculation finite for coincident positions", () => {
  const system = physics.create(91);
  system.bodies[1].x = system.bodies[0].x;
  system.bodies[1].y = system.bodies[0].y;
  physics.step(system, physics.suitableStep(system));
  assert.ok(Number.isFinite(physics.energy(system)));
  assert.ok(system.bodies.every(body => [body.x, body.y, body.vx, body.vy].every(Number.isFinite)));
});
