const dates = [
  "MAY 2024",
  "NOV 2024",
  "MAY 2025",
  "NOV 2025",
  "MAY 2026",
  "AUG 2026",
  "NOV 2026",
];

const parcels = [
  {
    id: "ARCHIVE-2026-QSR-01",
    name: "1604 / Bandera restaurant",
    address: "11707 TX-1604 Loop, Helotes",
    lat: 29.571,
    lng: -98.69,
    zone: "C-3",
    legal: "C-3 stated in source flyer",
    recorded: "For-sale flyer in 2026/QSR",
    confidence: 98,
    tags: ["drive", "reuse", "traffic", "zoning"],
    status: "opportunity",
    observed: "Freestanding restaurant with drive-through",
    imageDate: "Source: 2026 archive PDF",
    detections: [
      ["Building: ±4,465 SF", 99],
      ["Land: ±1.21 acres", 99],
      ["Drive-through and pylon sign", 98],
      ["Combined traffic: 142,543 VPD", 97],
    ],
    events: [
      ["2003", "Year built stated in property detail"],
      ["2026", "Offered for sale as restaurant building"],
      ["2026", "C-3 zoning stated in flyer"],
      [
        "FUTURE",
        "Continuous imagery can confirm operation, signage and queue form",
      ],
    ],
  },
  {
    id: "ARCHIVE-2025-INGRAM",
    name: "Former Sonic pad",
    address: "6111 Ingram Rd, San Antonio",
    lat: 29.4605,
    lng: -98.6122,
    zone: "Not stated",
    legal: "Zoning not stated in archive source",
    recorded: "Ground-lease flyer in 2025 folder",
    confidence: 97,
    tags: ["drive", "reuse", "traffic"],
    status: "opportunity",
    observed: "Former Sonic pad marketed for ground lease",
    imageDate: "Source: 2025 archive PDF",
    detections: [
      ["Pad: 0.592 acres", 99],
      ["Former Sonic site", 99],
      ["Ingram: 19,946 cars/day", 97],
      ["Callaghan: 13,945 cars/day", 97],
    ],
    events: [
      ["2024", "Demographic snapshot included in source"],
      ["2025", "Former Sonic marketed for ground lease"],
      ["FUTURE", "Permit, sign and vacancy feeds become parcel events"],
    ],
  },
  {
    id: "ARCHIVE-2025-WURZBACH",
    name: "Loop 410 pad site",
    address: "5630 Wurzbach Rd, Leon Valley",
    lat: 29.5039,
    lng: -98.5961,
    zone: "Not stated",
    legal: "Zoning not stated in archive source",
    recorded: "Ground-lease flyer in 2025 folder",
    confidence: 97,
    tags: ["drive", "reuse", "traffic"],
    status: "opportunity",
    observed: "Former Sonic pad adjacent to Bill Miller",
    imageDate: "Source: 2025 archive PDF",
    detections: [
      ["Available: 0.83 acres", 99],
      ["Loop 410: 220,688 cars/day", 97],
      ["Bandera: 83,734 cars/day", 97],
      ["Frontage and Loop 410 access", 95],
    ],
    events: [
      ["2023", "Demographic snapshot included in source"],
      ["2025", "Pad marketed for ground lease"],
      [
        "FUTURE",
        "SiteLedger monitors sign, access and impervious-cover change",
      ],
    ],
  },
  {
    id: "ARCHIVE-2026-WALZEM",
    name: "Operating second-gen QSR",
    address: "5050 Walzem Rd, Windcrest",
    lat: 29.5095,
    lng: -98.3908,
    zone: "Not stated",
    legal: "Zoning not stated in archive source",
    recorded: "Lease flyer in 2026/QSR",
    confidence: 98,
    tags: ["drive", "reuse", "traffic"],
    status: "stable",
    observed: "2nd-generation QSR; tenant operating",
    imageDate: "Source: 2026 archive PDF",
    detections: [
      ["Available: 2,834 SF", 99],
      ["Lighted hard corner", 98],
      ["Walzem: 34,246 VPD", 97],
      ["Tenant operating; do not disturb", 99],
    ],
    events: [
      ["2026", "Offered for lease as second-generation QSR"],
      ["2026", "Source states current tenant still operating"],
      [
        "FUTURE",
        "Tax, inspection and image signals can indicate transition timing",
      ],
    ],
  },
  {
    id: "ARCHIVE-2026-BABCOCK",
    name: "Babcock outparcel",
    address: "1602 Babcock Rd, San Antonio",
    lat: 29.493,
    lng: -98.571,
    zone: "Not stated",
    legal: "Zoning not stated in archive source",
    recorded: "Ground-lease flyer in 2026/Land",
    confidence: 97,
    tags: ["reuse", "traffic"],
    status: "changed",
    observed: "0.25–0.5 acre outparcel anchored by Gold’s Gym",
    imageDate: "Source: 2026 archive PDF",
    detections: [
      ["Loop 410: 166,684 VPD", 97],
      ["Babcock: 44,683 cars/day", 97],
      ["Callaghan: 23,735 cars/day", 97],
      ["Medical Center proximity", 96],
    ],
    events: [
      ["2025", "Source cites 487,000 Gold’s Gym visits"],
      ["2026", "Outparcel offered for ground lease"],
      [
        "FUTURE",
        "Mobility and building-change signals refresh the site ledger",
      ],
    ],
  },
  {
    id: "ARCHIVE-2025-BROADWAY",
    name: "Broadway retail redevelopment",
    address: "2000 Broadway, San Antonio",
    lat: 29.4455,
    lng: -98.476,
    zone: "Not stated",
    legal: "Zoning not stated in archive source",
    recorded: "Redevelopment flyer in 2025 folder",
    confidence: 98,
    tags: ["reuse", "traffic"],
    status: "changed",
    observed: "High-profile retail redevelopment by the Pearl",
    imageDate: "Source: 2025 archive PDF",
    detections: [
      ["Available: 10,564 SF divisible", 99],
      ["Signalized intersection", 98],
      ["Broadway: 21,702 VPD", 97],
      ["Josephine: 4,000 VPD", 97],
    ],
    events: [
      ["2025", "Retail redevelopment marketed"],
      ["2025", "Conceptual demising plan included"],
      ["FUTURE", "Construction imagery and permits can verify progress"],
    ],
  },
  {
    id: "ARCHIVE-2025-CULEBRA",
    name: "Culebra / Blacktail Lot 3",
    address: "Culebra Rd at Blacktail Crossing, San Antonio",
    lat: 29.4774,
    lng: -98.6514,
    zone: "Not stated",
    legal: "Zoning not stated on supplied site plan",
    recorded: "Site plan dated March 17, 2025",
    confidence: 99,
    tags: ["drive", "reuse"],
    status: "construction",
    observed: "Proposed 5,230 SF commercial drive-through",
    imageDate: "Source: 2025 site-plan PDF",
    detections: [
      ["Lot: 1.05 acres", 99],
      ["Parking: 34 required / 36 provided", 99],
      ["Queue: 15 vehicles", 99],
      ["Cross-access, sewer and sign easements", 98],
    ],
    events: [
      ["2025-03", "Site plan prepared for Lot 3"],
      ["2025-03", "Drive-through, bypass and pickup window shown"],
      ["FUTURE", "Permit and imagery events verify delivery against the plan"],
    ],
  },
  {
    id: "ARCHIVE-2025-IH10",
    name: "IH-10 / Loop 1604 commercial sites",
    address: "SE corner IH-10 and Loop 1604, San Antonio",
    lat: 29.593,
    lng: -98.6,
    zone: "C-3",
    legal: "C-3 stated in archive filename",
    recorded: "Land offering in 2025 folder",
    confidence: 96,
    tags: ["traffic", "zoning"],
    status: "changed",
    observed: "Four commercial sites with utilities stated",
    imageDate: "Source: 2025 archive PDF",
    detections: [
      ["IH-10 tract: 5.69 acres", 99],
      ["Vance Jackson tract: ±14 acres", 99],
      ["Two UTSA Blvd corner sites: 4.2 / 2.87 acres", 99],
      ["Hotel, office, retail and restaurant positioning", 96],
    ],
    events: [
      ["2025", "Four-site commercial offering archived"],
      ["2025", "Utilities to sites stated"],
      ["FUTURE", "Plats, permits and physical grading become linked events"],
    ],
  },
];

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

const layers = new Map();
let selected = parcels[0];
let currentView = "observed";
let activeQuery = "";
let playTimer = null;

function pointFor(p) {
  const x = ((p.lng + 98.75) / 0.5) * 180;
  const y = ((p.lat - 29.3) / 0.35) * 100;
  return [Math.max(6, Math.min(94, y)), Math.max(8, Math.min(172, x))];
}

function boundsFor(p) {
  const [y, x] = pointFor(p);
  const dy = 4.1,
    dx = 6.3;
  return [
    [y - dy, x - dx],
    [y - dy, x + dx],
    [y + dy, x + dx],
    [y + dy, x - dx],
  ];
}

function statusAt(p, index) {
  if (index < 2) return "stable";
  if (index < 4 && p.status === "opportunity") return "changed";
  if (index < 5 && p.status === "construction") return "changed";
  return p.status;
}

function colorFor(status) {
  return {
    opportunity: "#20e0c2",
    changed: "#ffb547",
    construction: "#5bbcff",
    stable: "#81949a",
  }[status];
}

function layerMatches(p) {
  const enabled = [...document.querySelectorAll("[data-layer]")]
    .filter((x) => x.checked)
    .map((x) => x.dataset.layer);
  const layerOk =
    p.tags.length === 0 || p.tags.some((t) => enabled.includes(t));
  if (!activeQuery) return layerOk;
  const q = activeQuery.toLowerCase();
  const haystack = [
    p.name,
    p.address,
    p.zone,
    p.legal,
    p.recorded,
    p.observed,
    ...p.tags,
    ...p.detections.flat(),
  ]
    .join(" ")
    .toLowerCase();
  const terms = q
    .split(/\s+/)
    .filter(
      (t) =>
        t.length > 2 &&
        !["find", "show", "with", "and", "the", "all", "recent"].includes(t),
    );
  return (
    layerOk &&
    terms.every(
      (t) =>
        haystack.includes(t) ||
        (t === "through" && haystack.includes("drive")) ||
        (t === "removals" && haystack.includes("removed")),
    )
  );
}

function styleLayers() {
  const index = Number(document.getElementById("timeSlider").value);
  let count = 0;
  parcels.forEach((p) => {
    const visible = layerMatches(p);
    if (visible) count++;
    const status = statusAt(p, index);
    const layer = layers.get(p.id);
    layer.setStyle({
      color: colorFor(status),
      fillColor: colorFor(status),
      fillOpacity: visible ? (currentView === "observed" ? 0.28 : 0.15) : 0.025,
      opacity: visible ? 1 : 0.14,
      weight: p.id === selected.id ? 4 : 2,
    });
  });
  document.getElementById("resultCount").textContent =
    `${count} parcel${count === 1 ? "" : "s"} in view`;
}

parcels.forEach((p) => {
  const layer = L.polygon(boundsFor(p), {
    color: colorFor(p.status),
    weight: 2,
    fillOpacity: 0.28,
  }).addTo(map);
  layer.bindTooltip(`${p.name}<br><span>${p.observed}</span>`, {
    direction: "top",
    opacity: 0.95,
  });
  layer.on("click", () => selectParcel(p));
  layers.set(p.id, layer);
});

function selectParcel(p) {
  selected = p;
  document.getElementById("parcelId").textContent = p.id;
  document.getElementById("parcelName").textContent = p.name;
  document.getElementById("parcelAddress").textContent = p.address;
  document.getElementById("confidence").textContent =
    `${p.confidence}% confidence`;
  document.getElementById("observedState").textContent = p.observed;
  document.getElementById("legalState").textContent = p.legal;
  document.getElementById("recordedState").textContent = p.recorded;
  document.getElementById("imageDate").textContent = `Image: ${p.imageDate}`;
  document.getElementById("detections").innerHTML = p.detections
    .map(
      (d) =>
        `<div class="detection"><span>${d[0]}</span><strong>${d[1]}%</strong></div>`,
    )
    .join("");
  document.getElementById("timeline").innerHTML = p.events
    .slice()
    .reverse()
    .map((e) => `<li><time>${e[0]}</time><span>${e[1]}</span></li>`)
    .join("");
  document.getElementById("similarityPanel").hidden = true;
  styleLayers();
}

document.querySelectorAll(".view-button").forEach((button) =>
  button.addEventListener("click", () => {
    document
      .querySelectorAll(".view-button")
      .forEach((b) => b.classList.remove("active"));
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

function runQuery(query) {
  activeQuery = query.trim();
  document.getElementById("query").value = activeQuery;
  styleLayers();
  const matches = parcels.filter(layerMatches);
  document.getElementById("queryResult").textContent = activeQuery
    ? `${matches.length} matches for “${activeQuery}”`
    : "Showing eight sites extracted from the supplied archive";
  if (matches.length) {
    selectParcel(matches[0]);
    map.flyTo(pointFor(matches[0]), 2, { duration: 0.8 });
  }
}

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
  document.getElementById("dateLabel").textContent = dates[index];
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
    slider.value = (Number(slider.value) + 1) % dates.length;
    slider.dispatchEvent(new Event("input"));
  }, 1000);
});

document.getElementById("similarButton").addEventListener("click", () => {
  const panel = document.getElementById("similarityPanel");
  panel.hidden = false;
  const candidates = parcels
    .filter((p) => p.id !== selected.id)
    .map((p) => {
      const shared = p.tags.filter((t) => selected.tags.includes(t)).length;
      return {
        p,
        score: Math.min(
          96,
          64 + shared * 9 + (p.zone === selected.zone ? 8 : 0),
        ),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  document.getElementById("similarityList").innerHTML = candidates
    .map(
      (x) =>
        `<div class="similar-result"><span>${x.p.name}<br><small>${x.p.address}</small></span><strong>${x.score}%</strong></div>`,
    )
    .join("");
});

selectParcel(selected);
