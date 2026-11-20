import { describe, expect, it, vi } from "vitest";
import {
  createPlanetaryImageryProvider,
  imageryBounds,
  webMercatorTile,
} from "./planetary-imagery-provider.js";

describe("Planetary Computer imagery provider", () => {
  it("builds a property-centered STAC search and an aligned map tile", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [
          {
            id: "tx_scene_2022",
            properties: { datetime: "2022-06-07T16:00:00Z", gsd: 0.6 },
          },
        ],
      }),
    });
    const provider = createPlanetaryImageryProvider({
      stacApiUrl: "https://example.test/search",
      tileBaseUrl: "https://example.test/tiles/WebMercatorQuad",
      fetchImpl,
    });
    const scenes = await provider.searchHistory(-98.669472, 29.553007, {
      useCache: false,
    });

    const request = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(request.collections).toEqual(["naip"]);
    expect(request.bbox).toHaveLength(4);
    expect(scenes[0]).toMatchObject({ year: 2022, resolutionMeters: 0.6 });
    expect(scenes[0].previewUrl).toContain("item=tx_scene_2022");
    expect(scenes[0].previewUrl).toContain("/17/29611/54264@2x.png");
    expect(scenes[0].tile).toEqual({ zoom: 17, x: 29611, y: 54264 });
  });

  it("creates a compact bbox around the property", () => {
    const bbox = imageryBounds(-98.669472, 29.553007);
    expect(bbox[0]).toBeLessThan(-98.669472);
    expect(bbox[2]).toBeGreaterThan(-98.669472);
    expect(bbox[1]).toBeLessThan(29.553007);
    expect(bbox[3]).toBeGreaterThan(29.553007);
  });

  it("uses the same Web Mercator footprint for every capture", () => {
    expect(webMercatorTile(-98.669472, 29.553007)).toEqual({
      zoom: 17,
      x: 29611,
      y: 54264,
    });
  });
});
