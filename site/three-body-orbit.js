/* A small, seeded three-body model for the portfolio orbit. */
((root, factory) => {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ThreeBodyOrbit = api;
})(globalThis, () => {
  const softening = 0.06;
  const softeningSquared = softening * softening;

  function randomSource(seed) {
    let state = seed >>> 0;
    return () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let value = Math.imul(state ^ (state >>> 15), state | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function create(seed) {
    const random = randomSource(seed);
    const rotation = random() * Math.PI * 2;
    const direction = random() < 0.5 ? -1 : 1;
    const bodies = Array.from({ length: 3 }, (_, index) => {
      const angle = rotation + index * Math.PI * 2 / 3 + (random() - 0.5) * 0.62;
      const radius = 0.72 + random() * 0.65;
      const speed = 0.48 + random() * 0.36;
      return {
        mass: 0.82 + random() * 0.36,
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle),
        vx: -direction * speed * Math.sin(angle) + (random() - 0.5) * 0.25,
        vy: direction * speed * Math.cos(angle) + (random() - 0.5) * 0.25,
      };
    });
    const mass = bodies.reduce((sum, body) => sum + body.mass, 0);
    for (const field of ["x", "y", "vx", "vy"]) {
      const center = bodies.reduce((sum, body) => sum + body.mass * body[field], 0) / mass;
      for (const body of bodies) body[field] -= center;
    }
    const system = { seed: seed >>> 0, bodies, time: 0 };
    system.initialEnergy = energy(system);
    return system;
  }

  function accelerations(bodies) {
    const acceleration = bodies.map(() => ({ x: 0, y: 0 }));
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const dx = bodies[j].x - bodies[i].x;
        const dy = bodies[j].y - bodies[i].y;
        const distanceSquared = dx * dx + dy * dy + softeningSquared;
        const inverseCube = 1 / (distanceSquared * Math.sqrt(distanceSquared));
        acceleration[i].x += bodies[j].mass * dx * inverseCube;
        acceleration[i].y += bodies[j].mass * dy * inverseCube;
        acceleration[j].x -= bodies[i].mass * dx * inverseCube;
        acceleration[j].y -= bodies[i].mass * dy * inverseCube;
      }
    }
    return acceleration;
  }

  function step(system, dt) {
    const before = accelerations(system.bodies);
    for (let i = 0; i < system.bodies.length; i++) {
      const body = system.bodies[i];
      body.x += body.vx * dt + before[i].x * dt * dt / 2;
      body.y += body.vy * dt + before[i].y * dt * dt / 2;
    }
    const after = accelerations(system.bodies);
    for (let i = 0; i < system.bodies.length; i++) {
      system.bodies[i].vx += (before[i].x + after[i].x) * dt / 2;
      system.bodies[i].vy += (before[i].y + after[i].y) * dt / 2;
    }
    system.time += dt;
  }

  function suitableStep(system) {
    let closest = Infinity;
    for (let i = 0; i < system.bodies.length; i++) {
      for (let j = i + 1; j < system.bodies.length; j++) {
        const dx = system.bodies[j].x - system.bodies[i].x;
        const dy = system.bodies[j].y - system.bodies[i].y;
        closest = Math.min(closest, Math.sqrt(dx * dx + dy * dy + softeningSquared));
      }
    }
    return Math.min(0.005, 0.012 * Math.pow(closest, 1.5));
  }

  function energy(system) {
    let total = system.bodies.reduce((sum, body) => sum + body.mass * (body.vx ** 2 + body.vy ** 2) / 2, 0);
    for (let i = 0; i < system.bodies.length; i++) {
      for (let j = i + 1; j < system.bodies.length; j++) {
        const a = system.bodies[i];
        const b = system.bodies[j];
        total -= a.mass * b.mass / Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + softeningSquared);
      }
    }
    return total;
  }

  return { create, step, energy, suitableStep, softening };
});
