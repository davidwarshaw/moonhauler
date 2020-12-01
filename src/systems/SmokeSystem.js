import properties from "../properties";

const SMOKE_START_FRAME = 80;
const SMOKE_END_FRAME = 84;

export default class SmokeSystem {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    this.emitters = {};

    const start = SMOKE_START_FRAME;
    const end = SMOKE_END_FRAME;
    this.smokeAnim = this.scene.anims.create({
      key: "puff",
      frames: scene.anims.generateFrameNumbers('tileset-spritesheet', { start, end }),
      frameRate: properties.smokeFrameRate,
      repeat: 0
    });
  }

  emit(emitterKey, emitter) {
    const { x, y } = emitter.position;
    // console.log(`emit: emitterKey: ${emitterKey}`);
    // console.log(`emit: emitter: ${x}, ${y}`);
    const smokeSprite = this.scene.add.sprite(x, y, 'tileset-spritesheet', SMOKE_START_FRAME);
    smokeSprite.play(`puff`, false);
    smokeSprite.once('animationcomplete', () => smokeSprite.destroy());
    this.emitters[emitterKey].smokeSprites.push(smokeSprite);
  }

  start(emitterKey, emitter) {
    // console.log(`start: emitterKey: ${emitterKey}`);
    const config = {
      delay: properties.smokeCooldown,
      loop: true,
      callback: () => this.emit(emitterKey, emitter),
    };
    const timedEvent = this.scene.time.addEvent(config);
    const smokeSprites = [];
    this.emitters[emitterKey] = { timedEvent, emitter, smokeSprites };
    this.scene.events.emit('damage-ship', 'WARNING: FUEL LEAK DETECTED');

    this.player.addFuelLeak();
  }

  stop(emitterKey) {
    this.emitters[emitterKey].timedEvent.remove();
    delete this.emitters[emitterKey];
  }
}