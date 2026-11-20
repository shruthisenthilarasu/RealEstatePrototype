const STOP_WORDS = new Set([
  "a",
  "all",
  "and",
  "are",
  "at",
  "for",
  "find",
  "from",
  "in",
  "is",
  "me",
  "near",
  "of",
  "on",
  "or",
  "parcels",
  "properties",
  "property",
  "show",
  "site",
  "sites",
  "that",
  "the",
  "to",
  "with",
]);

const CONCEPTS = {
  drive: {
    label: "drive-through form",
    terms: ["drive through", "drive thru", "drive", "qsr", "sonic"],
  },
  reuse: {
    label: "reuse potential",
    terms: [
      "reuse",
      "former",
      "second gen",
      "2nd generation",
      "redevelopment",
      "outparcel",
    ],
  },
  traffic: {
    label: "traffic exposure",
    terms: [
      "traffic",
      "vpd",
      "cars per day",
      "highway",
      "frontage",
      "visibility",
      "loop",
    ],
  },
  zoning: {
    label: "zoning evidence",
    terms: ["zoning", "zoned", "legal use", "entitlement"],
  },
  groundLease: {
    label: "pad or ground lease",
    terms: ["ground lease", "pad", "outparcel"],
  },
  development: {
    label: "development activity",
    terms: [
      "development",
      "construction",
      "proposed",
      "grading",
      "site plan",
      "clearing",
    ],
  },
  operating: {
    label: "operating tenant",
    terms: ["operating", "occupied", "tenant", "in operation"],
  },
  change: {
    label: "recent change signal",
    terms: ["changed", "change", "recent", "redevelopment", "clearing"],
  },
};

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9.,]+/g, " ")
    .trim();
}

function includesAny(document, terms) {
  return terms.some((term) => document.includes(normalize(term)));
}

function numberFromText(value) {
  return Number(String(value).replaceAll(",", ""));
}

function findMaximum(detections, matcher) {
  return detections.reduce((maximum, [label]) => {
    if (!matcher.test(normalize(label))) return maximum;
    const numbers = String(label)
      .match(/[\d,.]+/g)
      ?.map(numberFromText)
      .filter(Number.isFinite);
    return Math.max(maximum, ...(numbers || [0]));
  }, 0);
}

function propertyProfile(property) {
  const archiveText = property.detections.map(([label]) => label).join(" ");
  const eventText = property.events.map(([, title]) => title).join(" ");
  const document = normalize(
    [
      property.name,
      property.address,
      property.zone,
      property.legal,
      property.recorded,
      property.observed,
      property.status,
      property.tags.join(" "),
      archiveText,
      eventText,
    ].join(" "),
  );
  return {
    document,
    trafficVpd: findMaximum(
      property.detections,
      /traffic|vpd|cars|loop|highway|ih 10/,
    ),
    acres: findMaximum(property.detections, /acre|land|lot|tract|pad/),
  };
}

function numericConstraint(query, unitPattern) {
  const match = normalize(query).match(
    new RegExp(
      `(?:over|above|more than|at least|minimum|larger than)\\s*([\\d,.]+)\\s*(?:${unitPattern})`,
    ),
  );
  return match ? numberFromText(match[1]) : null;
}

export function parseSearchIntent(query) {
  const normalized = normalize(query);
  const concepts = Object.entries(CONCEPTS)
    .filter(([, concept]) => includesAny(normalized, concept.terms))
    .map(([key]) => key);
  const zoneMatch = normalized.match(
    /\b(c|r|i|mf|o|d)\s*[- ]?\s*(\d(?:\.\d)?)\b/,
  );
  const zone = zoneMatch
    ? `${zoneMatch[1].toUpperCase()}-${zoneMatch[2]}`
    : null;
  const tokens = normalized
    .split(/\s+/)
    .filter((term) => term.length > 2 && !STOP_WORDS.has(term))
    .filter((term) => !/^[\d.,]+$/.test(term));
  const minAcres = numericConstraint(query, "acres?|ac");
  const minTraffic = numericConstraint(query, "vpd|cars(?: per day)?");
  const labels = concepts.map((key) => CONCEPTS[key].label);
  if (zone) labels.push(`${zone} zoning`);
  if (minAcres) labels.push(`${minAcres}+ acres`);
  if (minTraffic) labels.push(`${minTraffic.toLocaleString()}+ VPD`);
  return {
    query: String(query || "").trim(),
    normalized,
    concepts,
    zone,
    minAcres,
    minTraffic,
    tokens: [...new Set(tokens)],
    labels: [...new Set(labels)],
  };
}

function conceptMatch(key, property, profile) {
  const tags = new Set(property.tags);
  if (tags.has(key)) return true;
  if (key === "groundLease")
    return includesAny(profile.document, ["ground lease", "pad", "outparcel"]);
  if (key === "development")
    return (
      property.status === "construction" ||
      includesAny(profile.document, CONCEPTS.development.terms)
    );
  if (key === "operating")
    return (
      property.status === "stable" ||
      includesAny(profile.document, CONCEPTS.operating.terms)
    );
  if (key === "change")
    return (
      ["changed", "construction"].includes(property.status) ||
      includesAny(profile.document, ["redevelopment", "clearing"])
    );
  return includesAny(profile.document, CONCEPTS[key].terms);
}

function bestDetection(property, concept) {
  const patterns = {
    drive: /drive|queue|pickup|sonic/i,
    reuse: /former|second|available|outparcel|redevelop/i,
    traffic: /traffic|vpd|cars|loop|frontage/i,
    zoning: /zoning/i,
    groundLease: /acre|land|pad|outparcel/i,
    development: /building|parking|queue|easement|plan/i,
    operating: /tenant|operating/i,
    change: /available|redevelop|proposed/i,
  };
  return property.detections.find(([label]) => patterns[concept]?.test(label));
}

function rankProperty(property, intent) {
  const profile = propertyProfile(property);
  if (intent.zone && normalize(property.zone) !== normalize(intent.zone))
    return null;
  if (intent.minAcres && profile.acres < intent.minAcres) return null;
  if (intent.minTraffic && profile.trafficVpd < intent.minTraffic) return null;

  const matchedConcepts = intent.concepts.filter((key) =>
    conceptMatch(key, property, profile),
  );
  const matchedTokens = intent.tokens.filter((token) =>
    profile.document.includes(token),
  );
  if (
    !intent.zone &&
    !intent.minAcres &&
    !intent.minTraffic &&
    intent.concepts.length + intent.tokens.length > 0 &&
    matchedConcepts.length + matchedTokens.length === 0
  ) {
    return null;
  }

  let score = 35 + property.confidence * 0.12;
  score += matchedConcepts.length * 11;
  score += matchedTokens.length * 2.5;
  score -= (intent.concepts.length - matchedConcepts.length) * 4;
  if (intent.zone) score += 15;
  if (intent.minAcres) score += 10;
  if (intent.minTraffic) score += 10;
  if (property.status === "opportunity") score += 3;

  const evidence = [];
  if (intent.zone) {
    evidence.push({
      type: "legal",
      label: property.legal,
      source: property.imageDate,
    });
  }
  matchedConcepts.forEach((key) => {
    const detection = bestDetection(property, key);
    evidence.push({
      type: key === "zoning" ? "legal" : "observed",
      label: detection?.[0] || property.observed,
      source: detection ? property.imageDate : "Property ledger",
    });
  });
  if (intent.minAcres) {
    evidence.push({
      type: "archive",
      label: `Archive indicates up to ${profile.acres} acres`,
      source: property.imageDate,
    });
  }
  if (intent.minTraffic) {
    evidence.push({
      type: "archive",
      label: `Traffic evidence up to ${profile.trafficVpd.toLocaleString()} VPD`,
      source: property.imageDate,
    });
  }
  if (!evidence.length) {
    const detection = property.detections[0];
    evidence.push({
      type: "archive",
      label: detection?.[0] || property.observed,
      source: property.imageDate,
    });
  }

  return {
    property,
    score: Math.max(1, Math.min(99, Math.round(score))),
    reasons: matchedConcepts.map((key) => CONCEPTS[key].label).slice(0, 3),
    evidence: evidence
      .filter(
        (item, index, items) =>
          items.findIndex((candidate) => candidate.label === item.label) ===
          index,
      )
      .slice(0, 3),
    metrics: {
      acres: profile.acres,
      trafficVpd: profile.trafficVpd,
      matchedConcepts: matchedConcepts.length,
      matchedTokens: matchedTokens.length,
    },
  };
}

export function searchPropertyMemory(properties, query) {
  const intent = parseSearchIntent(query);
  const results = properties
    .map((property) => rankProperty(property, intent))
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.score - a.score || b.property.confidence - a.property.confidence,
    );
  return { intent, results };
}

export function findSimilarProperties(properties, selected, limit = 3) {
  const query = [
    ...selected.tags,
    selected.status === "construction" ? "development" : "",
    selected.status === "stable" ? "operating" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return searchPropertyMemory(
    properties.filter((property) => property.id !== selected.id),
    query,
  )
    .results.map((result) => {
      const zoningMatch =
        selected.zone !== "Not stated" &&
        result.property.zone === selected.zone;
      return zoningMatch
        ? {
            ...result,
            score: Math.min(99, result.score + 8),
            reasons: [...result.reasons, `${selected.zone} zoning`].slice(0, 3),
          }
        : result;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
