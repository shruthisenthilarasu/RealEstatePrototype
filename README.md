# SiteLedger CRE

SiteLedger CRE is a browser-based commercial real-estate prototype for searching a property's legal, recorded, observed, and market history. The initial dataset is derived from the supplied San Antonio property archive.

The repository intentionally starts with a lightweight stack so it can run locally and deploy to GitHub Pages without a backend.

## Tooling

- Vite for local development and production builds
- Leaflet for the interactive property map
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

## Quality checks

```bash
npm run check
```

This runs ESLint, verifies formatting, and creates a production build in `docs/`.

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
├── src/app.js
├── src/styles.css
├── index.html
├── eslint.config.js
├── package.json
└── vite.config.js
```

## Data note

Archive facts shown in the prototype come from supplied marketing and site-plan files. The map, scores, confidence values, and future public-data signals are conceptual and require source and professional verification.
