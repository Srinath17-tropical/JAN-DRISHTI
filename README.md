# JAN—DRISHTI · Telangana Rural Development Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](./LICENSE)
[![State Coverage](https://img.shields.io/badge/Coverage-11%2C154%20Telangana%20Villages-orange.svg)](#authoritative-datasets--spatial-scale)
[![Spatial Granularity](https://img.shields.io/badge/GIS-444%20Mandals%20%C2%B7%2010%20Districts-cyan.svg)](./ARCHITECTURE.md)
[![Runtime](https://img.shields.io/badge/Node.js-%3E%3D20.x-339933.svg)](#quick-start--setup-instructions)

**JAN—DRISHTI** is an open-source, spatially contextualised rural development intelligence, dual-mode GIS + satellite inspection, longitudinal analytics, and evidence-locked policy formulation platform covering **11,154 villages** across **444 Mandals** and **10 erstwhile administrative districts** of **Telangana State, India**.

Built for decentralized Gram Panchayat Development Plan (GPDP) preparation, Mandal Parishad convergence reviews, and District Planning Committee audits, JAN—DRISHTI unifies official household Census baselines, TRACGIS surface-water tank inventories, OpenStreetMap facility catchment networks, and district meteorological telemetry into a single decision-support system.

---

## Table of Contents

1. [Problem Statement & Design Philosophy](#problem-statement--design-philosophy)
2. [Core Capabilities](#core-capabilities)
3. [Authoritative Datasets & Spatial Scale](#authoritative-datasets--spatial-scale)
4. [Quick Start & Setup Instructions](#quick-start--setup-instructions)
5. [Running Sample Data & Automated Tests](#running-sample-data--automated-tests)
6. [REST API Reference](#rest-api-reference)
7. [Repository Structure](#repository-structure)
8. [Data Pipeline Reproduction](#data-pipeline-reproduction)
9. [Production Deployment](#production-deployment)
10. [Architecture Documentation](#architecture-documentation)
11. [License](#license)

---

## Problem Statement & Design Philosophy

Rural development planning frequently suffers from three structural bottlenecks:

1. **Siloed Sectoral Datasets**: Household amenities (drinking water, sanitation, cooking fuel, banking), minor irrigation tank inventories, school/clinic coordinates, and climate stress indicators sit in disconnected departmental repositories.
2. **Spatial Blindness**: Tabular block averages mask severe intra-Mandal distance penalties—such as a habitation located >12 km from the nearest Primary Health Centre or secondary school despite strong district averages.
3. **Unverified Generative Outputs**: Generic language models hallucinate village figures or claim automatic welfare scheme eligibility without administrative verification.

**JAN—DRISHTI** addresses all three challenges through a **strict non-fabrication architecture**:
- Every quantitative metric displayed on maps, charts, or policy briefs is deterministically computed from compiled public datasets (`server/data/`).
- Policy synthesis is locked to a strict JSON schema (`AGENT_RESPONSE_SCHEMA`) grounded exclusively in the selected village's verified dossier, with an automatic deterministic analytical fallback so the platform functions seamlessly even in air-gapped or offline environments without external API keys.
- All candidate Central and Telangana State schemes are framed as convergence options requiring **Gram Sabha**, **MPDO**, and **District Collectorate** field verification.

---

## Core Capabilities

### 1. Five SDG-Aligned Sector Workspaces + Composite Overview
- **Education (`SDG 04`)**: Effective & female literacy rates, gender gap, household digital/telecom assets, Haversine distance (`km`) and `10 km` catchment count of mapped schools/colleges.
- **Health & Sanitation (`SDG 03`)**: In-premises sanitation, open defecation share, clean cooking fuel (`LPG/Biogas`) vs. solid-biomass indoor smoke exposure, safe housing condition, drainage, and primary healthcare reach.
- **Water & Minor Irrigation (`SDG 06`)**: Treated vs. untreated tap water, borewell/handpump reliance, source proximity, normative `55 LPCD` daily water demand, and **TRACGIS village minor irrigation tank inventory** (`tanks_total`, `>40 ha` tanks, density per `10 km²`).
- **Livelihood & Financial Inclusion (`SDG 08`)**: Worker participation rate, main vs. marginal worker stability, cultivator & agricultural labourer shares, household banking inclusion, two-wheeler mobility, and market/bank proximity.
- **Environment, Solar & Climate (`SDG 13`)**: Clean grid & solar lighting, solid-biomass pressure, surface tank ecological buffering, shortwave solar insolation (`MJ/m²/day`), ambient `PM2.5` (`µg/m³`), `US AQI`, and 7-day precipitation outlook.

### 2. Dual Spatial Engine: Vector Choropleth GIS + Satellite Imagery
- **Interactive Sector GIS (`DevelopmentMap.tsx`)**: Separate thematic choropleth layers across all `444` Mandals for each of the 5 sectors, metric switchers, geolocated OpenStreetMap facility pins, and **on-demand Mandal village boundary polygon drilldown**.
- **Dedicated Satellite Orthophoto Workspace (`SatelliteMap.tsx`)**: High-resolution Esri `World_Imagery` satellite view alongside vector GIS within each sector workspace to visually inspect village tank bunds (`cheruvus`), agrarian land-use, settlement morphology, and road connectivity.

### 3. Longitudinal Multi-Sector Analytics (`2011–2026`)
- **Time-Series Progress Visualization (`AnalyticsPanel.tsx`)**: Tracks five-sector trajectories across key Telangana development milestones (`2011` Census Baseline → `2014` State Formation → `2017` Mission Bhagiratha & Kakatiya Rollout → `2020` SHG & Rural Sanitation Push → `2023` Mana Ooru–Mana Badi & Palle Dawakhana → `2026` Readiness Horizon), comparing village trajectories against District and State series.

### 4. Village Policy Formulation & Committee Dossier (`IntelligenceStudio.tsx`)
- Synthesizes a **3-phase implementation roadmap** (`0–12 Months`, `1–3 Years`, `3–5 Years`), **deficit-weighted 5-sector budget priority mix** (summing strictly to `100%`), **institutional accountability matrix**, and **exportable Markdown/JSON Committee Report**.

### 5. Future Readiness & Deccan Civilisational Ethos
- Evaluates 5–10 year structural readiness checklists and contextualizes modern planning within Telangana's indigenous engineering heritage (Kakatiya *Golusu Kattu Cheruvulu* cascading tank chains, *Panchayat* water stewardship, and Deccan dryland agro-ecology).

---

## Authoritative Datasets & Spatial Scale

| Layer / Domain | Source | Granularity | Records / Indicators |
| :--- | :--- | :--- | :--- |
| **Administrative & Tank GIS** | TRACGIS / Telangana Remote Sensing Boundaries | `10` Districts · `444` Mandals · `11,154` Villages | Polygon geometries (`~11m` precision), `Shape_Area` (`km²`), Minor Irrigation Tank counts (`<40 ha`, `>40 ha`) |
| **Household Amenities (HLPCA)** | Census of India 2011 Houselisting & Housing Census | Mandal (`444` subdistricts) | `145` raw columns harmonized into water, sanitation, cooking fuel, lighting, banking, and asset shares |
| **Demography & Workforce (PCA)** | Census of India 2011 Primary Census Abstract | District Rural / Urban / Total | Population, households, `0–6` child share, SC/ST share, literacy, WPR, main vs. marginal workforce |
| **Facility Catchment Index** | OpenStreetMap (OSM) Telangana Extract | Point coordinates (`lat`, `lon`) | `5,607` geolocated schools, clinics/hospitals, reservoirs/waterworks, banks/mandis, and solar/forest assets |
| **Climate & Air Telemetry** | Open-Meteo Forecast & Air Quality API | District centroids (`10` stations) | Current & max temperature (`°C`), 7-day rain (`mm`), solar radiation (`MJ/m²/day`), `PM2.5`, `US AQI` |

---

## Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` LTS (recommended)
- **npm**: `v10+`
- *(Optional)* **Python 3.10+** — only required if re-running the raw GIS/Census compilation script (`scripts/build_telangana_data.py`). Pre-compiled Telangana datasets are already included in `server/data/`.

### 1. Clone the Repository & Install Dependencies

```bash
git clone <YOUR_PUBLIC_REPO_URL>
cd jan-drishti-telangana
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` if you wish to enable live LLM synthesis via Google Gemini:

```env
# Optional: Server-side API key for LLM policy synthesis.
# If omitted or left as placeholder, JAN-DRISHTI automatically uses its
# deterministic Telangana evidence synthesis engine with zero downtime.
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

# HTTP port for the unified Express + SPA server
PORT="3000"

# Public base URL
APP_URL="http://localhost:3000"
```

> **Note for Evaluators**: The platform runs **100% out-of-the-box without an external API key**. When `GEMINI_API_KEY` is omitted, `POST /api/ai/agent` automatically executes `buildDeterministicTelanganaSynthesis()`, generating complete, village-specific 5-sector policy formulations, dashboards, and committee reports directly from the verified dataset.

### 3. Start the Development Server

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Running Sample Data & Automated Tests

Sample village test cases and reference policy dossiers are provided in [`samples/`](./samples/):

- [`samples/village_test_cases.json`](./samples/village_test_cases.json): 6 benchmark Telangana settlements across districts and vulnerability tiers (`Gajwel`, `Bachannapet`, `Serimallareddipalle`, `Karchal`, `Quileshapur`, `Havaiguda`) with expected spatial coordinates, tank counts, composite scores, and test queries.
- [`samples/sample_policy_dossier_0421020_gajwel.json`](./samples/sample_policy_dossier_0421020_gajwel.json): Complete reference output schema for Village `0421020` (Gajwel, Medak District).

Run the automated verification suite (validates static dataset integrity across all `11,154` villages & `444` Mandals, verifies all sample test cases, and runs live HTTP integration tests across all REST and policy endpoints):

```bash
npm test
```

Run static TypeScript type-checking and production bundle verification:

```bash
npm run lint
npm run build
```

---

## REST API Reference

All backend routes are served from `server.ts` under `/api/*`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Returns engine status, state coverage (`11,154` villages, `444` mandals, `10` districts), and active sectors. |
| `GET` | `/api/villages/featured` | Returns representative tank-irrigated rural Telangana settlements (`1` per rural district). |
| `GET` | `/api/villages/search?name=<q>&district=<dc>&limit=16` | Prefix-prioritized search across `11,154` villages by village name, code, mandal, or district. |
| `GET` | `/api/villages/:code` | Full 5-sector village dossier (`population`, `analytics`, `vulnerability`, `sectors`, `benchmarks`, `spatial`). |
| `GET` | `/api/gis/sector/:sector` | Sector-specific Mandal GeoJSON choropleth + geolocated facilities (`overview`, `education`, `health`, `water`, `livelihood`, `environment`). |
| `GET` | `/api/gis/villages?mandal_code=<mc>` | On-demand GeoJSON polygon boundaries for all villages inside a Mandal (`mc`) or District (`district_code`). |
| `GET` | `/api/analytics/summary?village_code=<vc>` | Statewide statistical distributions, District rankings, village percentile ranks, and `2011–2026` longitudinal trends. |
| `POST` | `/api/ai/agent` | Generates schema-locked 5-sector village policy formulation, KPI dashboard, and committee report (`{ "village_code": "0421020", "query": "..." }`). |

### Example `curl` Requests

```bash
# 1. Check platform health & dataset counts
curl -s http://localhost:3000/api/health | jq .

# 2. Fetch full 5-sector dossier for Gajwel (Village Code: 0421020)
curl -s http://localhost:3000/api/villages/0421020 | jq '{village: .population.area_name, mandal: .population.mandal_name, scores: .vulnerability}'

# 3. Generate village-specific policy formulation & budget priority mix
curl -s -X POST http://localhost:3000/api/ai/agent \
  -H "Content-Type: application/json" \
  -d '{"village_code":"0421020","query":"Formulate a 3-year water, sanitation, and clean cooking convergence plan."}' \
  | jq '.outputs.analysis.policy.budget_priority_mix'
```

---

## Repository Structure

```text
jan-drishti-telangana/
├── ARCHITECTURE.md                 # Detailed system, GIS, scoring & policy engine architecture
├── LICENSE                         # Open-source MIT License
├── README.md                       # Setup, dataset, API, and testing documentation
├── .env.example                    # Environment configuration template (no secrets)
├── package.json                    # Dependencies and npm scripts (dev, build, start, test, lint)
├── server.ts                       # Express REST API, spatial lazy-loader & policy synthesis engine
├── vite.config.ts                  # Vite + React 19 + Tailwind CSS v4 build configuration
├── scripts/
│   └── build_telangana_data.py     # Reproducible Python ETL compiling Census, TRACGIS, OSM & Climate data
├── server/
│   └── data/
│       ├── analytics_summary.json  # Statewide & 10-District statistical benchmarks
│       ├── mandals_catalog.json    # 444 Mandal profiles (HLPCA + PCA + Climate + Facility Reach)
│       ├── villages_catalog.json   # 11,154 Telangana village records & composite scores
│       ├── gis/                    # District GeoJSON + 5 separate sector GIS layers
│       └── village_geometries/     # District-sharded (01.json..10.json) village polygon geometries
├── samples/
│   ├── village_test_cases.json                 # Benchmark test cases & assertions across Telangana
│   └── sample_policy_dossier_0421020_gajwel.json # Reference village dossier & policy output
├── tests/
│   └── verify_platform.mjs         # Automated dataset, sample-case & live API integration test suite
└── src/
    ├── App.tsx                     # Root React application entry
    ├── index.css                   # Global Tailwind CSS v4 styles & Samarkan display typography
    ├── app/
    │   └── page.tsx                # Multi-sector platform shell, Future Readiness & Deccan Heritage views
    └── components/
        ├── gis/
        │   ├── DevelopmentMap.tsx  # Interactive Leaflet vector choropleth & facility catchment GIS
        │   └── SatelliteMap.tsx    # High-resolution Esri World_Imagery satellite inspection workspace
        ├── analytics/
        │   └── AnalyticsPanel.tsx  # Multi-sector Recharts distributions & 2011–2026 longitudinal trends
        └── ai/
            └── IntelligenceStudio.tsx # Interactive village policy formulation & committee report studio
```

---

## Data Pipeline Reproduction

All runtime JSON and GeoJSON artifacts in `server/data/` are pre-built and ready for immediate execution. To rebuild them from raw public files (TRACGIS shapefiles/GeoJSON, Census 2011 PCA/HLPCA tables, OSM extracts, and Open-Meteo snapshots):

```bash
TS_RAW_DIR=/path/to/raw_telangana_sources python3 scripts/build_telangana_data.py
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md#2-data-engineering--spatial-harmonization-pipeline) for full details on coordinate simplification, Mandal name reconciliation, Haversine spatial indexing, and composite scoring formulas.

---

## Production Deployment

### Render Web Service (Recommended)

The repository includes [`render.yaml`](./render.yaml) and runs both the compiled React/Vite frontend (`dist/`) and the Express spatial/policy backend (`server.ts`) as a unified Node Web Service on Render:

| Render Setting | Value |
| :--- | :--- |
| **Service Type** | **Web Service** (`Node`) |
| **Build Command** | `bun install && bun run build` |
| **Start Command** | `npx tsx server.ts` |
| **Health Check Path** | `/api/health` |
| **Environment Variables** | `NODE_ENV=production`, `GEMINI_API_KEY=<your_key>` *(optional)* |

### Local / Docker / Self-Hosted Production

Build the optimized static frontend bundle (`dist/`) and start the unified production server:

```bash
bun install && bun run build
NODE_ENV=production PORT=3000 npx tsx server.ts
```

The single `server.ts` process binds to `0.0.0.0:${PORT}` and serves both the compiled SPA assets (`dist/`) and all `/api/*` endpoints across **Render**, **Docker**, **Google Cloud Run**, **Railway**, or any Linux VM.

---

## Architecture Documentation

For deep technical documentation—including system block diagrams, mathematical equations for all five sector indices and the **Village Vulnerability Index (`VVI v2`)**, longitudinal `2011–2026` calibration, District-sharded polygon lazy-loading, and LLM non-fabrication guardrails—read **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**.

---

## License

This project is released as open-source software under the **[MIT License](./LICENSE)**. Public statistical and cartographic baselines derive from the **Census of India (Office of the Registrar General & Census Commissioner)**, **Telangana Remote Sensing Applications Centre (TRACGIS)**, **OpenStreetMap Contributors (ODbL)**, and **Open-Meteo**.
