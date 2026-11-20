# SiteLedger CRE

SiteLedger CRE is a browser-based commercial real-estate prototype for searching a property's legal, recorded, observed, and market history. The initial dataset is derived from the supplied San Antonio property archive.

The browser can run from a bundled offline dataset or connect to a Supabase spatial ledger. This keeps the prototype deployable on GitHub Pages while PostGIS, provenance, and multi-tenant access controls evolve independently.

## Tooling

- Vite for local development and production builds
- Leaflet for the interactive property map
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

The default `auto` mode uses the bundled eight-property dataset if Supabase is not configured. Copy `.env.example` to `.env.local` and add the project URL and public anonymous key to use the database. Remote results are cached in browser storage and used if the network later becomes unavailable. Production builds also install a same-origin service worker so the application shell and map asset can reopen offline after the first successful visit.

## Spatial database

The `supabase/` directory contains ordered migrations and an idempotent seed:

```bash
supabase start
supabase db reset
```

The schema enables PostGIS and pgvector, adds organization-scoped row-level security, and models properties, parcels, sources, observations, append-only events, zoning snapshots, imagery, detected site features, embeddings, watchlists, and annotations. The seed creates the eight sites extracted from the supplied archive and links their evidence to the archive source.

The frontend queries `get_properties_in_bounds`, a security-invoker RPC that respects row-level security. The seeded demo organization is publicly readable; writes require an authenticated organization owner or editor. The anonymous key is safe to expose only with these policies in place.

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
