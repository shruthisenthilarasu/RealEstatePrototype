import { describe, expect, it } from "vitest";
import { localProperties } from "../data/local-properties.js";
import {
  SAN_ANTONIO_BOUNDS,
  createLocalPropertyRepository,
} from "./property-repository.js";

describe("local property repository", () => {
  const repository = createLocalPropertyRepository(localProperties);

  it("returns all eight supplied San Antonio-area properties", async () => {
    const properties =
      await repository.listPropertiesInBounds(SAN_ANTONIO_BOUNDS);
    expect(properties).toHaveLength(8);
  });

  it("applies geographic bounds", async () => {
    const properties = await repository.listPropertiesInBounds({
      west: -98.68,
      south: 29.54,
      east: -98.66,
      north: 29.56,
    });
    expect(properties.map((property) => property.id)).toEqual([
      "ARCHIVE-2026-QSR-01",
    ]);
  });

  it("searches the offline cache", async () => {
    const properties = await repository.listPropertiesInBounds(
      SAN_ANTONIO_BOUNDS,
      "C-3",
    );
    expect(properties).toHaveLength(2);
  });
});
