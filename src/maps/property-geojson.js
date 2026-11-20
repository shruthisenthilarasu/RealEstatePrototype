const STATUS_COLORS = Object.freeze({
  opportunity: "#20e0c2",
  changed: "#ffb547",
  construction: "#5bbcff",
  stable: "#81949a",
});

export function statusAt(property, index) {
  if (index < 2) return "stable";
  if (index < 4 && property.status === "opportunity") return "changed";
  if (index < 5 && property.status === "construction") return "changed";
  return property.status;
}

export function propertiesToGeoJson(properties, dateIndex = 6) {
  return {
    type: "FeatureCollection",
    features: properties.map((property) => {
      const displayStatus = statusAt(property, dateIndex);
      return {
        type: "Feature",
        id: property.id,
        geometry: {
          type: "Point",
          coordinates: [property.lng, property.lat],
        },
        properties: {
          id: property.id,
          name: property.name,
          observed: property.observed,
          zone: property.zone,
          status: displayStatus,
          color: STATUS_COLORS[displayStatus],
        },
      };
    }),
  };
}

export function boundsForProperties(properties) {
  return properties.reduce(
    (bounds, property) => [
      [
        Math.min(bounds[0][0], property.lng),
        Math.min(bounds[0][1], property.lat),
      ],
      [
        Math.max(bounds[1][0], property.lng),
        Math.max(bounds[1][1], property.lat),
      ],
    ],
    [
      [Infinity, Infinity],
      [-Infinity, -Infinity],
    ],
  );
}
