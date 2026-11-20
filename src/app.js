import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ledgerDates } from "./data/local-properties.js";
import {
  SAN_ANTONIO_BOUNDS,
  createPropertyRepository,
} from "./repositories/property-repository.js";

const mapBounds = [
  [0, 0],
  [100, 180],
];
const map = L.map("map", {
  zoomControl: true,
  crs: L.CRS.Simple,
  minZoom: 0,
  maxZoom: 4,
  attributionControl: false,
});
L.imageOverlay("groundtruth-map.png", mapBounds, {
  opacity: 0.82,
  alt: "Conceptual commercial parcel corridor",
}).addTo(map);
map.fitBounds(mapBounds);

const repository = createPropertyRepository();
const layers = new Map();
let properties = [];
let selected = null;
let currentView = "observed";
let activeQuery = "";
let playTimer = null;

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch((error) => {
      console.warn("Offline shell could not be registered.", error);
    });
  });
}

function pointFor(property) {
  const x = ((property.lng + 98.75) / 0.5) * 180;
  const y = ((property.lat - 29.3) / 0.35) * 100;
  return [Math.max(6, Math.min(94, y)), Math.max(8, Math.min(172, x))];
}

function boundsFor(property) {
  const [y, x] = pointFor(property);
  const dy = 4.1;
  const dx = 6.3;
  return [
    [y - dy, x - dx],
    [y - dy, x + dx],
    [y + dy, x + dx],
    [y + dy, x - dx],
  ];
}

function statusAt(property, index) {
  if (index < 2) return "stable";
  if (index < 4 && property.status === "opportunity") return "changed";
  if (index < 5 && property.status === "construction") return "changed";
  return property.status;
}

function colorFor(status) {
  return {
    opportunity: "#20e0c2",
    changed: "#ffb547",
    construction: "#5bbcff",
    stable: "#81949a",
  }[status];
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

function styleLayers() {
  if (!selected) return;
  const index = Number(document.getElementById("timeSlider").value);
  let count = 0;
  properties.forEach((property) => {
    const visible = layerMatches(property);
    if (visible) count += 1;
    const status = statusAt(property, index);
    layers.get(property.id)?.setStyle({
      color: colorFor(status),
      fillColor: colorFor(status),
      fillOpacity: visible ? (currentView === "observed" ? 0.28 : 0.15) : 0.025,
      opacity: visible ? 1 : 0.14,
      weight: property.id === selected.id ? 4 : 2,
    });
  });
  document.getElementById("resultCount").textContent =
    `${count} parcel${count === 1 ? "" : "s"} in view`;
}

function selectProperty(property) {
  selected = property;
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
  styleLayers();
}

function renderPropertyLayers() {
  layers.forEach((layer) => layer.remove());
  layers.clear();
  properties.forEach((property) => {
    const layer = L.polygon(boundsFor(property), {
      color: colorFor(property.status),
      weight: 2,
      fillOpacity: 0.28,
    }).addTo(map);
    layer.bindTooltip(`${property.name}<br><span>${property.observed}</span>`, {
      direction: "top",
      opacity: 0.95,
    });
    layer.on("click", () => selectProperty(property));
    layers.set(property.id, layer);
  });
}

function runQuery(query) {
  activeQuery = query.trim();
  document.getElementById("query").value = activeQuery;
  styleLayers();
  const matches = properties.filter(layerMatches);
  document.getElementById("queryResult").textContent = activeQuery
    ? `${matches.length} matches for “${activeQuery}”`
    : `Showing ${properties.length} source-linked sites · ${repository.mode}`;
  if (matches.length) {
    selectProperty(matches[0]);
    map.flyTo(pointFor(matches[0]), 2, { duration: 0.8 });
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
      legal: "Zoning evidence from sources",
      recorded: "Archive and public-record state",
    }[currentView];
    styleLayers();
  }),
);

document
  .querySelectorAll("[data-layer]")
  .forEach((input) => input.addEventListener("change", styleLayers));

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
  styleLayers();
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
  renderPropertyLayers();
  document.getElementById("parcelCount").textContent =
    `${properties.length} parcels monitored`;
  document.getElementById("dataMode").textContent = repository.mode;
  document.getElementById("activeSiteCount").textContent = properties.length;
  document.getElementById("queryResult").textContent =
    `Showing ${properties.length} source-linked sites · ${repository.mode}`;
  selectProperty(properties[0]);
}

bootstrap().catch((error) => {
  console.error(error);
  document.getElementById("queryResult").textContent =
    "The property ledger could not be loaded. Check the data configuration.";
});
