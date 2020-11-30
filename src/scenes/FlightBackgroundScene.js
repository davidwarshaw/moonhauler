import properties from '../properties';

const BACKGROUND_SCROLL_FACTOR = 0.5;
const FOREGROUND_SCROLL_FACTOR = 1.0;

export default class FlightBackgroundScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FlightBackgroundScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.background = this.add.tileSprite(properties.width / 2, properties.height / 2, 0, 0, 'starfield-background');
    this.foreground = this.add.tileSprite(properties.width / 2, properties.height / 2, 0, 0, 'starfield-foreground');

    const flightScene = this.scene.get('FlightScene');
    flightScene.events.on('wayfinder-change', vector => this.scroll(vector));
  }

  scroll(vector) {
    const { shipX, shipY } = vector;
    this.background.setTilePosition(shipX * BACKGROUND_SCROLL_FACTOR, shipY * BACKGROUND_SCROLL_FACTOR);
    this.foreground.setTilePosition(shipX * FOREGROUND_SCROLL_FACTOR, shipY * FOREGROUND_SCROLL_FACTOR);
  }
}
