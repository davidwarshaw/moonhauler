function keyFromTilePosition(tilePosition) {
  return `${tilePosition.x}-${tilePosition.y}`;
}

function tilePositionFromKey(key) {
  return { x: Number(key.split('-')[0]), y: Number(key.split('-')[1]) };
}

function wrapText(text, width) {
  const words = text.split(" ");
  let currentLineLength = 0;
  let wrappedText = '';
  for (let i = 0; i < words.length; i++) {
    if (i === 0) {
      wrappedText = words[i];
      currentLineLength = words[i].length;
    } else if (currentLineLength + 1 + words[i].length <= width) {
      wrappedText = wrappedText + " " + words[i];
      currentLineLength = currentLineLength + 1 + words[i].length;
    } else {
      wrappedText = wrappedText + "\n" + words[i];
      currentLineLength = words[i].length;
    }
  }

  return wrappedText;
}

export default {
  keyFromTilePosition,
  tilePositionFromKey,
  wrapText,
}