import properties from "../properties";

import Font from "../ui/Font";
import Menu from "../ui/Menu";

export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  init(playState) {
    this.playState = playState;
  }

  create() {
    this.font = new Font(this);

    this.playState.music = {
      menu: this.sound.add("music-menu"),
      flight: this.sound.add("music-flight"),
    };

    const centerX = properties.width / 2;
    const top = 80;

    this.art = [];
    this.art.push(this.add.image(centerX, 300, "art-pilot"));
    this.title = this.add.image(centerX, top, "title");

    this.menu = new Menu(
      this,
      [
        {
          text: "start",
          cb: () => {
            // this.scene.start('CrashScene', this.playState);
            this.scene.start("RouteSelectScene", this.playState);
          },
        },
      ],
      centerX,
      top + 80
    );

    this.playState.music.menu.play({ loop: true });
  }

  offsetForText(text) {
    return -(text.length * 8) / 2;
  }
}
