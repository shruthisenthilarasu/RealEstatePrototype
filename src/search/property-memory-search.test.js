import { describe, expect, it } from "vitest";
import { localProperties } from "../data/local-properties.js";
import {
  findSimilarProperties,
  parseSearchIntent,
  searchPropertyMemory,
} from "./property-memory-search.js";

describe("property memory search", () => {
  it("extracts real-estate concepts and numeric constraints", () => {
    expect(
      parseSearchIntent(
        "Find C-3 sites with drive-throughs and at least 100,000 VPD",
      ),
    ).toMatchObject({
      concepts: expect.arrayContaining(["drive", "traffic"]),
      zone: "C-3",
      minTraffic: 100000,
    });
  });

  it("ranks evidence-backed reuse sites", () => {
    const { results } = searchPropertyMemory(
      localProperties,
      "former restaurant pads with drive-through reuse and traffic",
    );
    expect(results[0].property.name).toMatch(/Sonic|restaurant/i);
    expect(results[0].reasons).toEqual(
      expect.arrayContaining(["drive-through form", "reuse potential"]),
    );
    expect(results[0].evidence.length).toBeGreaterThan(0);
  });

  it("applies zoning and acreage as hard constraints", () => {
    const { results } = searchPropertyMemory(
      localProperties,
      "C-3 development sites larger than 5 acres",
    );
    expect(results).toHaveLength(1);
    expect(results[0].property.id).toBe("ARCHIVE-2025-IH10");
  });

  it("returns explainable similar properties", () => {
    const selected = localProperties.at(-1);
    const results = findSimilarProperties(localProperties, selected);
    expect(results).toHaveLength(3);
    expect(results.every((result) => result.property.id !== selected.id)).toBe(
      true,
    );
    expect(results[0].reasons.length).toBeGreaterThan(0);
    expect(results[0].property.zone).toBe("C-3");
  });
});
