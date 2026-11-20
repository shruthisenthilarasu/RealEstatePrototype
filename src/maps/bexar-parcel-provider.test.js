import { describe, expect, it, vi } from "vitest";
import { createBexarParcelProvider } from "./bexar-parcel-provider.js";

describe("Bexar parcel provider", () => {
  it("requests bounded GeoJSON in WGS84 without owner data", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: "FeatureCollection", features: [] }),
    });
    const provider = createBexarParcelProvider({
      serviceUrl: "https://example.test/query",
      fetchImpl,
    });
    await provider.queryBounds({
      getWest: () => -98.7,
      getSouth: () => 29.4,
      getEast: () => -98.6,
      getNorth: () => 29.5,
    });

    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.get("geometry")).toBe(
      "-98.700000,29.400000,-98.600000,29.500000",
    );
    expect(url.searchParams.get("outSR")).toBe("4326");
    expect(url.searchParams.get("f")).toBe("geojson");
    expect(url.searchParams.get("outFields")).not.toContain("Owner");
  });

  it("caches identical point queries", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: "FeatureCollection", features: [] }),
    });
    const provider = createBexarParcelProvider({
      serviceUrl: "https://example.test/query",
      fetchImpl,
    });
    await provider.queryPoint(-98.69, 29.571);
    await provider.queryPoint(-98.69, 29.571);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("builds a narrow situs fallback without requesting owner fields", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ type: "FeatureCollection", features: [] }),
    });
    const provider = createBexarParcelProvider({
      serviceUrl: "https://example.test/query",
      fetchImpl,
    });
    await provider.queryAddress("11707 TX-1604 Loop, Helotes");

    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.get("where")).toBe(
      "UPPER(Situs) LIKE '11707%1604%'",
    );
    expect(url.searchParams.get("outFields")).not.toContain("Owner");
  });
});
