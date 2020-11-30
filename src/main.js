import "phaser";

import properties from "./properties";

import TitleScene from "./scenes/TitleScene";
import BootScene from "./scenes/BootScene";
import RouteSelectScene from "./scenes/RouteSelectScene";
import BuildScene from "./scenes/BuildScene";
import BuildHudScene from "./scenes/BuildHudScene";
import FlightBackgroundScene from "./scenes/FlightBackgroundScene";
import FlightScene from "./scenes/FlightScene";
import FlightHudScene from "./scenes/FlightHudScene";
import CrashScene from "./scenes/CrashScene";
import LandScene from "./scenes/LandScene";

const config = {
  type: Phaser.WEBGL,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: properties.width,
    height: properties.height,
    zoom: properties.scale,
  },
  parent: "game-container",
  physics: {
    default: 'matter',
    matter: {
        // debug: true,
    }
  },
  input: {
    gamepad: true,
  },
  scene: [
    BootScene,
    TitleScene,
    RouteSelectScene,
    BuildScene, BuildHudScene,
    FlightBackgroundScene, FlightScene, FlightHudScene,
    CrashScene, LandScene],
};

const game = new Phaser.Game(config); // eslint-disable-line no-unused-vars
