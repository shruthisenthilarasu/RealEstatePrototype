# SiteLedger CRE

SiteLedger CRE is a browser-based commercial real-estate prototype for searching a property's legal, recorded, observed, and market history. The initial dataset is derived from the supplied San Antonio property archive.

> **Prototype and attribution notice**
>
> This prototype is being developed by **Shruthi Senthilarasu**, acting as a contracted software engineer, for **Tanner of Octave Commercial Real Estate Partners**. Shruthi Senthilarasu does not claim ownership of this project. It is prototype software under active development and is not a production system or a substitute for professional legal, zoning, surveying, engineering, or real-estate advice.

The browser can run from a bundled offline dataset or connect to a Supabase spatial ledger. This keeps the prototype deployable on GitHub Pages while PostGIS, provenance, and multi-tenant access controls evolve independently.

## Tooling

- Vite for local development and production builds
- MapLibre GL JS for the WebGL satellite and parcel map
- Supabase/Postgres with PostGIS and pgvector for the spatial ledger
- Zod for runtime data validation
- Vitest for repository tests
- ESLint for JavaScript checks
- Prettier for consistent formatting
- A committed `docs/` build for branch-based GitHub Pages deployment

## Local development

Requirements: Node.js 22 or later.

```bash
npm install
npm run dev
```

Open the URL printed by Vite.

The default `auto` mode uses the bundled eight-property dataset if Supabase is not configured. Copy `.env.example` to `.env.local` and add the project URL and publishable key to use the database. Remote results are cached in browser storage and used if the network later becomes unavailable. Production builds also install a same-origin service worker so the application shell and property ledger can reopen offline after the first successful visit; live satellite imagery and parcel queries still require a network connection.

## Geospatial providers

The map uses real WGS84 coordinates and keeps external context separate from SiteLedger's own property memory:

- [Esri World Imagery](https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer) supplies the attributed satellite basemap.
- [Bexar County GIS Parcels](https://maps.bexar.org/arcgis/rest/services/Parcels/MapServer) supplies viewport polygons and selected-site facts such as parcel ID, situs, acreage, assessed value, year built, and use code. Owner data is intentionally not requested.
- [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/docs/) supplies anonymously searchable USDA NAIP history through its public STAC API. Every vintage is rendered from the same Web Mercator map tile for geographic alignment.
- `VITE_SATELLITE_TILE_URL`, `VITE_PARCEL_SERVICE_URL`, `VITE_STAC_API_URL`, and `VITE_IMAGERY_TILE_URL` can replace providers without changing the map application.

The county service describes the parcel layer as an annual BCAD-derived snapshot and currently reports an older source date. It is displayed as dated context, not current legal truth. Provider endpoints, attribution, verification dates, and future append-only property snapshots are modeled in the database so later ingestion can preserve what the system knew at each point in time.

## Visual site memory

Selecting a tracked property searches historical NAIP captures, renders the earliest and latest images over one shared map footprint, and provides a swipe comparison. A lightweight browser vision pass calculates mean RGB delta and the fraction of materially changed pixels to prioritize human review. This is deliberately labeled as an experimental heuristic: seasons, shadows, sensor differences, and residual source alignment can all create false positives.

The database models the production path separately: immutable imagery assets, queued vision jobs, append-only comparisons, model versions, evidence payloads, and append-only human reviews. The next AI layer can add building, parking, drive-through, grading, signage, and impervious-cover detections without replacing the original imagery evidence or earlier model outputs.

NAIP is high-resolution rather than high-frequency imagery; USGS describes a generally multi-year acquisition cycle. Sentinel-2 or a commercial provider can later fill the monitoring-frequency gap while NAIP remains the higher-resolution ground-truth checkpoint.

## Property Memory Graph

Portfolio search uses a real-estate intent layer rather than requiring literal keyword matches. It recognizes concepts such as drive-through form, reuse, ground leases, traffic exposure, development activity, operating tenants, recent change, zoning codes, minimum acreage, and minimum VPD. Results are ranked with the supporting archive, legal, observed, and ledger evidence visible beside each score. The bundled ranker runs entirely in the browser, so search continues to work against the cached property ledger while offline.

The production schema stores source-linked property memory items with dates, confidence, evidence payloads, full-text vectors, and optional 1,536-dimension embeddings. `search_property_memory` combines spatial bounds, PostgreSQL full-text relevance, optional pgvector similarity, confidence, and freshness while returning the top evidence records for every property match. Embeddings are optional so retrieval remains usable before an AI provider is configured.

## Spatial database

The `supabase/` directory contains ordered migrations and an idempotent seed:

```bash
supabase start
supabase db reset
```

The schema enables PostGIS and pgvector, adds organization-scoped row-level security, and models properties, parcels, sources, observations, append-only events, zoning snapshots, imagery, detected site features, searchable property memory, embeddings, watchlists, and annotations. The seed creates the eight sites extracted from the supplied archive and links their evidence to the archive source.

The frontend queries `get_properties_in_bounds`, a security-invoker RPC that respects row-level security. The seeded demo organization is publicly readable; writes require an authenticated organization owner or editor. The anonymous key is safe to expose only with these policies in place.

To link a hosted Supabase project:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

No hosted project credentials or service-role keys belong in the repository.

## Quality checks

```bash
npm run check
```

This runs ESLint, verifies formatting, executes the repository tests, and creates a production build in `docs/`.

## GitHub Pages

The production build is committed in `docs/`, which avoids requiring a GitHub token with workflow permissions.

To publish it:

1. Run `npm run check` and commit any updated `docs/` files.
2. Open **Settings -> Pages** in GitHub.
3. Choose **Deploy from a branch**.
4. Select **main** and **/docs**, then save.

The expected project URL is:

`https://shruthisenthilarasu.github.io/RealEstatePrototype/`

## Project structure

```text
.
├── docs/                     # generated GitHub Pages build
├── public/groundtruth-map.png
├── src/                      # UI, schemas, data adapters and offline seed
├── supabase/                 # PostGIS schema, RLS, RPC and seed
├── index.html
├── eslint.config.js
├── package.json
└── vite.config.js
```

## Data note

Archive facts shown in the prototype come from supplied marketing and site-plan files. The map, scores, confidence values, and future public-data signals are conceptual and require source and professional verification.
