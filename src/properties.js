import * as ROT from 'rot-js';

ROT.RNG.setSeed(Date.now());

export default {
  debug: false,
  rng: ROT.RNG,
  width: 640,
  height: 416,
  scale: 3,
  tileWidth: 16,
  tileHeight: 16,
  buildWidthTiles: 25,
  buildHeightTiles: 25,
  mapWidthTiles: 100,
  mapHeightTiles: 100,
  largeButtonWidth: 160,
  animFrameRate: 20,
  damageCooldown: 4000,
  turnDurationMillis: 200,
  roundIntervalMillis: 0,
  levelWaitMillis: 2000,
  uiHangMillis: 500,
  directions: ['up', 'down', 'left', 'right'],
  animDirections: ['up', 'down', 'left']
};