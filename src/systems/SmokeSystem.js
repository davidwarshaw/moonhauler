
const TIME_FREQ = 0.50;

export default class SmokeSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.emitters = {};
    this.particles = [];
  }

  update(time, delta) {

  }

  start(emitterKey, emitter) {
    this.emitters[emitterKey] = emitter;
  }

  stop(emitterKey) {
    delete this.emitters[emitterKey];
  }
}