export function calculateVisualDelta(beforePixels, afterPixels) {
  if (beforePixels.length !== afterPixels.length || beforePixels.length % 4) {
    throw new Error("Comparable RGBA image buffers are required.");
  }
  let absoluteDifference = 0;
  let changedPixels = 0;
  let measuredPixels = 0;
  for (let index = 0; index < beforePixels.length; index += 4) {
    if (beforePixels[index + 3] < 128 || afterPixels[index + 3] < 128) continue;
    const difference =
      (Math.abs(beforePixels[index] - afterPixels[index]) +
        Math.abs(beforePixels[index + 1] - afterPixels[index + 1]) +
        Math.abs(beforePixels[index + 2] - afterPixels[index + 2])) /
      3;
    absoluteDifference += difference;
    if (difference >= 28) changedPixels += 1;
    measuredPixels += 1;
  }
  if (!measuredPixels) return { deltaPercent: 0, changedPixelPercent: 0 };
  return {
    deltaPercent: Number(
      ((absoluteDifference / measuredPixels / 255) * 100).toFixed(1),
    ),
    changedPixelPercent: Number(
      ((changedPixels / measuredPixels) * 100).toFixed(1),
    ),
  };
}

export function visualChangeBand(deltaPercent) {
  if (deltaPercent >= 14) return "high";
  if (deltaPercent >= 7) return "moderate";
  return "low";
}
