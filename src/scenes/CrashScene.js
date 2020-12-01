import properties from '../properties';

import FlightHudScene from "../scenes/FlightHudScene";

import Menu from '../ui/Menu';

export default class CrashScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CrashScene' });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.sounds = {
      scene: this.sound.add('crash'),
    }

    const centerX = properties.width / 2;
    const top = 80;
    
    this.title = this.add.image(centerX, top, 'title-crash');

    this.menu = new Menu(this, [
      {
        text: 'retry',
        cb: () => {
          console.log('CrashScene.retry');
          this.scene.add('FlightHudScene', FlightHudScene, true, this.playState);
          this.scene.start('FlightScene', this.playState);
          this.scene.start('FlightBackgroundScene', this.playState);
        }
      },
      {
        text: 'tow to tycho',
        cb: () => {
          console.log('CrashScene.abandon');
          this.playState.currentNode = "tycho-docks";
          this.scene.start('RouteSelectScene', this.playState);
        }
      }
    ]);

    this.sounds.scene.play();
  }

}
