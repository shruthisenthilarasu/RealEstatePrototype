import { describe, expect, it } from "vitest";
import { calculateVisualDelta, visualChangeBand } from "./visual-change.js";

describe("visual change heuristic", () => {
  it("returns zero for identical pixels", () => {
    const pixels = new Uint8ClampedArray([10, 20, 30, 255, 90, 80, 70, 255]);
    expect(calculateVisualDelta(pixels, pixels)).toEqual({
      deltaPercent: 0,
      changedPixelPercent: 0,
    });
  });

  it("measures changed pixels and bands the review score", () => {
    const before = new Uint8ClampedArray([0, 0, 0, 255, 10, 10, 10, 255]);
    const after = new Uint8ClampedArray([255, 255, 255, 255, 10, 10, 10, 255]);
    const result = calculateVisualDelta(before, after);
    expect(result.deltaPercent).toBe(50);
    expect(result.changedPixelPercent).toBe(50);
    expect(visualChangeBand(result.deltaPercent)).toBe("high");
  });
});
