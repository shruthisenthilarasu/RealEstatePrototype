import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import { environment } from "./config/environment.js";
import { ledgerDates } from "./data/local-properties.js";
import {
  EMPTY_FEATURE_COLLECTION,
  createBexarParcelProvider,
} from "./maps/bexar-parcel-provider.js";
import {
  boundsForProperties,
  propertiesToGeoJson,
} from "./maps/property-geojson.js";
import {
  SAN_ANTONIO_BOUNDS,
  createPropertyRepository,
} from "./repositories/property-repository.js";

const repository = createPropertyRepository();
const parcelProvider = createBexarParcelProvider();
let properties = [];
let selected = null;
let currentView = "observed";
let activeQuery = "";
let playTimer = null;
let parcelRequestController = null;
let contextRequestController = null;

maplibregl.setWorkerUrl(maplibreWorkerUrl);

const map = new maplibregl.Map({
  container: "map",
  center: [-98.57, 29.49],
  zoom: 10.3,
  minZoom: 8,
  maxZoom: 20,
  attributionControl: false,
  style: {
    version: 8,
    sources: {
      satellite: {
        type: "raster",
        tiles: [environment.satelliteTileUrl],
        tileSize: 256,
        minzoom: 0,
        maxzoom: 19,
        attribution: "Esri, Maxar, Earthstar Geographics, GIS User Community",
      },
      parcels: {
        type: "geojson",
        data: EMPTY_FEATURE_COLLECTION,
      },
      properties: {
        type: "geojson",
        data: EMPTY_FEATURE_COLLECTION,
      },
    },
    layers: [
      {
        id: "satellite",
        type: "raster",
        source: "satellite",
        paint: {
          "raster-opacity": 0.76,
          "raster-saturation": -0.34,
          "raster-contrast": 0.18,
          "raster-brightness-max": 0.72,
        },
      },
      {
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": "#20e0c2",
          "fill-opacity": 0.08,
        },
      },
      {
        id: "parcels-outline",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": "#74ffe7",
          "line-opacity": 0.72,
          "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.6, 18, 1.5],
        },
      },
      {
        id: "property-halo",
        type: "circle",
        source: "properties",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 12, 16, 26],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.22,
          "circle-blur": 0.65,
        },
      },
      {
        id: "property-point",
        type: "circle",
        source: "properties",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 5, 16, 9],
          "circle-color": ["get", "color"],
          "circle-stroke-color": "#061015",
          "circle-stroke-width": 2,
          "circle-opacity": 0.96,
        },
      },
      {
        id: "selected-ring",
        type: "circle",
        source: "properties",
        filter: ["==", ["get", "id"], ""],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 9, 10, 16, 18],
          "circle-color": "rgba(0,0,0,0)",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
        },
      },
      {
        id: "property-hit",
        type: "circle",
        source: "properties",
        paint: {
          "circle-radius": 18,
          "circle-color": "rgba(0,0,0,0)",
        },
      },
    ],
  },
});

map.addControl(
  new maplibregl.NavigationControl({ showCompass: false }),
  "bottom-right",
);
map.addControl(
  new maplibregl.AttributionControl({
    compact: true,
    customAttribution:
      '<a href="https://maps.bexar.org/arcgis/rest/services/Parcels/MapServer" target="_blank" rel="noreferrer">Bexar County GIS / BCAD</a>',
  }),
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Offline shell could not be registered.", error);
    });
  });
}

function layerMatches(property) {
  const enabled = [...document.querySelectorAll("[data-layer]")]
    .filter((input) => input.checked)
    .map((input) => input.dataset.layer);
  const layerOk =
    property.tags.length === 0 ||
    property.tags.some((tag) => enabled.includes(tag));
  if (!activeQuery) return layerOk;
  const haystack = [
    property.name,
    property.address,
    property.zone,
    property.legal,
    property.recorded,
    property.observed,
    ...property.tags,
    ...property.detections.flat(),
  ]
    .join(" ")
    .toLowerCase();
  const terms = activeQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (term) =>
        term.length > 2 &&
        !["find", "show", "with", "and", "the", "all", "recent"].includes(term),
    );
  return (
    layerOk &&
    terms.every(
      (term) =>
        haystack.includes(term) ||
        (term === "through" && haystack.includes("drive")) ||
        (term === "pads" && haystack.includes("pad")),
    )
  );
}

function setPropertyFilters(ids) {
  const filter = ["in", ["get", "id"], ["literal", ids]];
  ["property-halo", "property-point", "property-hit"].forEach((layerId) =>
    map.setFilter(layerId, filter),
  );
}

function stylePropertyLayers() {
  if (!map.loaded()) return;
  const visible = properties.filter(layerMatches);
  setPropertyFilters(visible.map((property) => property.id));
  const colorExpression = {
    observed: ["get", "color"],
    legal: [
      "case",
      ["!=", ["get", "zone"], "Not stated"],
      "#20e0c2",
      "#81949a",
    ],
    recorded: "#ffb547",
  }[currentView];
  map.setPaintProperty("property-point", "circle-color", colorExpression);
  map.setPaintProperty("property-halo", "circle-color", colorExpression);
  document.getElementById("resultCount").textContent =
    `${visible.length} site${visible.length === 1 ? "" : "s"} in view`;
}

function renderPropertySource() {
  const index = Number(document.getElementById("timeSlider").value);
  map.getSource("properties").setData(propertiesToGeoJson(properties, index));
  stylePropertyLayers();
}

function createFact(label, value) {
  const row = document.createElement("div");
  const key = document.createElement("span");
  const result = document.createElement("strong");
  key.textContent = label;
  result.textContent = value || "Not reported";
  row.append(key, result);
  return row;
}

function formatCurrency(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "Not reported";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number);
}

function renderParcelContext(feature) {
  const container = document.getElementById("parcelFacts");
  container.replaceChildren();
  if (!feature) {
    container.append(
      createFact("Parcel match", "No intersecting county record"),
    );
    return;
  }
  const facts = feature.properties || {};
  container.append(
    createFact("BCAD property ID", String(facts.PropID || "Not reported")),
    createFact(
      "Situs",
      String(facts.Situs || "Not reported").replace(/\s+/g, " "),
    ),
    createFact(
      "Parcel acreage",
      facts.Acres ? `${facts.Acres} ac` : "Not reported",
    ),
    createFact("Assessed total", formatCurrency(facts.TotVal)),
    createFact("Year built", String(facts.YrBlt || "Not reported")),
    createFact("Use code", String(facts.PropUse || "Not reported")),
  );
}

async function loadParcelContext(property) {
  contextRequestController?.abort();
  contextRequestController = new AbortController();
  const container = document.getElementById("parcelFacts");
  container.replaceChildren(
    createFact("Parcel match", "Loading official GIS context…"),
  );
  try {
    const collection = await parcelProvider.queryPoint(
      property.lng,
      property.lat,
      {
        signal: contextRequestController.signal,
      },
    );
    const addressCollection = collection.features.length
      ? collection
      : await parcelProvider.queryAddress(property.address, {
          signal: contextRequestController.signal,
        });
    renderParcelContext(addressCollection.features[0]);
  } catch (error) {
    if (error.name === "AbortError") return;
    console.warn("Parcel context unavailable.", error);
    container.replaceChildren(
      createFact("Parcel match", "County service unavailable"),
    );
  }
}

function selectProperty(property, { focus = false } = {}) {
  selected = property;
  map.setFilter("selected-ring", ["==", ["get", "id"], property.id]);
  document.getElementById("parcelId").textContent = property.id;
  document.getElementById("parcelName").textContent = property.name;
  document.getElementById("parcelAddress").textContent = property.address;
  document.getElementById("confidence").textContent =
    `${property.confidence}% confidence`;
  document.getElementById("observedState").textContent = property.observed;
  document.getElementById("legalState").textContent = property.legal;
  document.getElementById("recordedState").textContent = property.recorded;
  document.getElementById("imageDate").textContent = property.imageDate;
  document.getElementById("detections").innerHTML = property.detections
    .map(
      ([label, confidence]) =>
        `<div class="detection"><span>${label}</span><strong>${confidence}%</strong></div>`,
    )
    .join("");
  document.getElementById("timeline").innerHTML = property.events
    .slice()
    .reverse()
    .map(
      ([date, title]) => `<li><time>${date}</time><span>${title}</span></li>`,
    )
    .join("");
  document.getElementById("similarityPanel").hidden = true;
  loadParcelContext(property);
  if (focus) {
    map.flyTo({
      center: [property.lng, property.lat],
      zoom: 15.4,
      duration: 900,
    });
  }
}

function runQuery(query) {
  activeQuery = query.trim();
  document.getElementById("query").value = activeQuery;
  stylePropertyLayers();
  const matches = properties.filter(layerMatches);
  document.getElementById("queryResult").textContent = activeQuery
    ? `${matches.length} matches for “${activeQuery}”`
    : `Showing ${properties.length} source-linked sites · ${repository.mode}`;
  if (matches.length) selectProperty(matches[0], { focus: true });
}

function parcelPopupContent(feature) {
  const wrapper = document.createElement("div");
  wrapper.className = "parcel-popup";
  wrapper.append(
    createFact("BCAD parcel", String(feature.properties?.PropID || "Unknown")),
    createFact("Acres", String(feature.properties?.Acres || "Not reported")),
    createFact("Assessed", formatCurrency(feature.properties?.TotVal)),
  );
  return wrapper;
}

async function refreshParcelLayer() {
  const toggle = document.getElementById("parcelLayerToggle");
  const status = document.getElementById("parcelFeedStatus");
  if (!toggle.checked) {
    map.setLayoutProperty("parcels-fill", "visibility", "none");
    map.setLayoutProperty("parcels-outline", "visibility", "none");
    status.textContent = "off";
    return;
  }
  map.setLayoutProperty("parcels-fill", "visibility", "visible");
  map.setLayoutProperty("parcels-outline", "visibility", "visible");
  if (map.getZoom() < 14) {
    map.getSource("parcels").setData(EMPTY_FEATURE_COLLECTION);
    status.textContent = "zoom in";
    return;
  }

  parcelRequestController?.abort();
  parcelRequestController = new AbortController();
  status.textContent = "loading";
  try {
    const collection = await parcelProvider.queryBounds(map.getBounds(), {
      signal: parcelRequestController.signal,
    });
    map.getSource("parcels").setData(collection);
    status.textContent = `${collection.features.length} loaded`;
  } catch (error) {
    if (error.name === "AbortError") return;
    console.warn("Parcel overlay unavailable.", error);
    status.textContent = "unavailable";
  }
}

document.querySelectorAll(".view-button").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".view-button")
      .forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    currentView = button.dataset.view;
    document.getElementById("viewLabel").textContent = {
      observed: "Property form and operating state",
      legal: "Zoning evidence coverage",
      recorded: "Archive and public-record state",
    }[currentView];
    stylePropertyLayers();
  }),
);

document
  .querySelectorAll("[data-layer]")
  .forEach((input) => input.addEventListener("change", stylePropertyLayers));

document
  .getElementById("satelliteLayerToggle")
  .addEventListener("change", (event) => {
    map.setLayoutProperty(
      "satellite",
      "visibility",
      event.target.checked ? "visible" : "none",
    );
  });
document
  .getElementById("parcelLayerToggle")
  .addEventListener("change", refreshParcelLayer);

document.getElementById("searchForm").addEventListener("submit", (event) => {
  event.preventDefault();
  runQuery(document.getElementById("query").value);
});
document
  .querySelectorAll("[data-query]")
  .forEach((button) =>
    button.addEventListener("click", () => runQuery(button.dataset.query)),
  );

document.getElementById("timeSlider").addEventListener("input", (event) => {
  const index = Number(event.target.value);
  document.getElementById("dateLabel").textContent = ledgerDates[index];
  renderPropertySource();
});

document.getElementById("playButton").addEventListener("click", () => {
  const button = document.getElementById("playButton");
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
    button.textContent = "Play history";
    button.setAttribute("aria-pressed", "false");
    return;
  }
  button.textContent = "Pause";
  button.setAttribute("aria-pressed", "true");
  playTimer = setInterval(() => {
    const slider = document.getElementById("timeSlider");
    slider.value = (Number(slider.value) + 1) % ledgerDates.length;
    slider.dispatchEvent(new Event("input"));
  }, 1000);
});

document.getElementById("similarButton").addEventListener("click", () => {
  if (!selected) return;
  const panel = document.getElementById("similarityPanel");
  panel.hidden = false;
  const candidates = properties
    .filter((property) => property.id !== selected.id)
    .map((property) => {
      const shared = property.tags.filter((tag) =>
        selected.tags.includes(tag),
      ).length;
      return {
        property,
        score: Math.min(
          96,
          64 + shared * 9 + (property.zone === selected.zone ? 8 : 0),
        ),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  document.getElementById("similarityList").innerHTML = candidates
    .map(
      ({ property, score }) =>
        `<div class="similar-result"><span>${property.name}<br><small>${property.address}</small></span><strong>${score}%</strong></div>`,
    )
    .join("");
});

async function bootstrap() {
  document.getElementById("queryResult").textContent =
    "Loading spatial property ledger…";
  properties = await repository.listPropertiesInBounds(SAN_ANTONIO_BOUNDS);
  if (!properties.length) {
    throw new Error("No properties were returned for the San Antonio bounds.");
  }
  renderPropertySource();
  document.getElementById("parcelCount").textContent =
    `${properties.length} sites monitored`;
  document.getElementById("dataMode").textContent = repository.mode;
  document.getElementById("activeSiteCount").textContent = properties.length;
  document.getElementById("queryResult").textContent =
    `Showing ${properties.length} source-linked sites · ${repository.mode}`;
  document.getElementById("parcelSourceDate").textContent =
    parcelProvider.metadataDate;
  selectProperty(properties[0]);
  map.fitBounds(boundsForProperties(properties), {
    padding: 80,
    maxZoom: 11.5,
    duration: 0,
  });
  refreshParcelLayer();
}

map.on("load", () => {
  map.on("moveend", refreshParcelLayer);
  map.on("mouseenter", "property-hit", () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", "property-hit", () => {
    map.getCanvas().style.cursor = "";
  });
  map.on("click", "property-hit", (event) => {
    const id = event.features?.[0]?.properties?.id;
    const property = properties.find((candidate) => candidate.id === id);
    if (property) selectProperty(property, { focus: true });
  });
  map.on("click", "parcels-fill", (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    new maplibregl.Popup({ closeButton: false, maxWidth: "280px" })
      .setLngLat(event.lngLat)
      .setDOMContent(parcelPopupContent(feature))
      .addTo(map);
  });
  bootstrap().catch((error) => {
    console.error(error);
    document.getElementById("queryResult").textContent =
      "The property ledger could not be loaded. Check the data configuration.";
  });
});
