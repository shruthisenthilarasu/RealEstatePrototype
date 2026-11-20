import { describe, expect, it } from "vitest";
import { localProperties } from "../data/local-properties.js";
import {
  SAN_ANTONIO_BOUNDS,
  createLocalPropertyRepository,
  createSupabasePropertyRepository,
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

describe("Supabase property memory repository", () => {
  it("calls the bounded hybrid search RPC without requiring an embedding", async () => {
    const rpc = async (name, parameters) => ({
      data: [{ reference_code: "ARCHIVE-2025-IH10", score: 0.81 }],
      error: null,
      name,
      parameters,
    });
    const calls = [];
    const client = {
      rpc: async (name, parameters) => {
        calls.push([name, parameters]);
        return rpc(name, parameters);
      },
    };
    const repository = createSupabasePropertyRepository(client);
    const results = await repository.searchPropertyMemory(
      SAN_ANTONIO_BOUNDS,
      "C-3 development",
    );

    expect(results[0].reference_code).toBe("ARCHIVE-2025-IH10");
    expect(calls[0][0]).toBe("search_property_memory");
    expect(calls[0][1]).toMatchObject({
      p_query: "C-3 development",
      p_query_embedding: null,
      p_limit: 20,
    });
  });
});
