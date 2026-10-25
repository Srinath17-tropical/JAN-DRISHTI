#!/usr/bin/env python3
"""
Compiles authoritative Telangana State multi-sector datasets and 5-sector GIS layers
from downloaded raw sources in /tmp/ts_raw/:
  1. Official Telangana District (10), Mandal (444), and Village (11,154) GIS Boundaries
     with TRACGIS Minor Irrigation Tank counts & polygon areas
  2. Census of India 2011 Primary Census Abstract (PCA) — Telangana Districts (Total/Rural/Urban)
  3. Census of India 2011 Houselisting & Housing Census (HLPCA) — All Telangana Mandals (145 indicators)
  4. OpenStreetMap Geolocated Sector Facilities across Telangana (Education, Health, Water, Livelihood, Environment)
  5. Open-Meteo Meteorological, Solar Radiation & Air Quality Telemetry for Telangana Districts
"""

import csv
import difflib
import json
import lzma
import math
import os
import re
from collections import defaultdict

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.environ.get("TS_RAW_DIR", "/tmp/ts_raw")
OUT_DIR = os.environ.get("TS_OUT_DIR", os.path.join(REPO_ROOT, "server", "data"))
GIS_OUT_DIR = os.path.join(OUT_DIR, "gis")
VIL_GEOM_DIR = os.path.join(OUT_DIR, "village_geometries")

os.makedirs(GIS_OUT_DIR, exist_ok=True)
os.makedirs(VIL_GEOM_DIR, exist_ok=True)

# District mapping between GIS D_C ('01'..'10') and Census 2011 District Code ('532'..'541')
GIS_TO_CENSUS_DIST = {
    "01": ("532", "Adilabad"),
    "02": ("533", "Nizamabad"),
    "03": ("534", "Karimnagar"),
    "04": ("535", "Medak"),
    "05": ("537", "Rangareddy"),
    "06": ("536", "Hyderabad"),
    "07": ("538", "Mahbubnagar"),
    "08": ("539", "Nalgonda"),
    "09": ("540", "Warangal"),
    "10": ("541", "Khammam"),
}

MANDAL_ALIASES = {
    ("karimnagar", "eligedu"): "eligaid",
    ("warangal", "warangalfullyurban"): "warangal",
}


def norm(text: str) -> str:
    s = (text or "").lower()
    s = s.replace("mahabubnagar", "mahbubnagar").replace("rangareddi", "rangareddy")
    return re.sub(r"[^a-z0-9]", "", s)


def fnum(val, default=0.0) -> float:
    try:
        if val is None:
            return default
        s = str(val).strip()
        if not s or s == "-" or s.lower() == "na":
            return default
        return float(s)
    except Exception:
        return default


def clamp(val: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, val))


def simplify_ring(ring, tolerance=0.0012, decimals=4):
    """Light vertex thinning + 4-decimal coordinate rounding (~11m precision)."""
    if not ring or len(ring) <= 6:
        return [[round(pt[0], decimals), round(pt[1], decimals)] for pt in ring]
    kept = [ring[0]]
    tol_sq = tolerance * tolerance
    for pt in ring[1:-1]:
        dx = pt[0] - kept[-1][0]
        dy = pt[1] - kept[-1][1]
        if dx * dx + dy * dy >= tol_sq:
            kept.append(pt)
    kept.append(ring[-1])
    if len(kept) < 4:
        kept = [ring[0], ring[len(ring) // 3], ring[(2 * len(ring)) // 3], ring[-1]]
    return [[round(pt[0], decimals), round(pt[1], decimals)] for pt in kept]


def simplify_geometry(geom, tolerance=0.0012, decimals=4):
    if not geom or "type" not in geom or "coordinates" not in geom:
        return None
    gtype = geom["type"]
    coords = geom["coordinates"]
    if gtype == "Polygon":
        return {
            "type": "Polygon",
            "coordinates": [simplify_ring(r, tolerance, decimals) for r in coords if r],
        }
    if gtype == "MultiPolygon":
        return {
            "type": "MultiPolygon",
            "coordinates": [
                [simplify_ring(r, tolerance, decimals) for r in poly if r]
                for poly in coords
                if poly
            ],
        }
    return geom


def geometry_centroid(geom):
    """Returns (lat, lon) centroid from Polygon or MultiPolygon."""
    if not geom or not geom.get("coordinates"):
        return (17.85, 79.10)
    gtype = geom["type"]
    pts = []
    if gtype == "Polygon":
        pts = geom["coordinates"][0] if geom["coordinates"] else []
    elif gtype == "MultiPolygon":
        best = []
        for poly in geom["coordinates"]:
            if poly and len(poly[0]) > len(best):
                best = poly[0]
        pts = best
    if not pts:
        return (17.85, 79.10)
    lon = sum(p[0] for p in pts) / len(pts)
    lat = sum(p[1] for p in pts) / len(pts)
    return (round(lat, 5), round(lon, 5))


def haversine_km(lat1, lon1, lat2, lon2) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(min(1.0, math.sqrt(a)))


print("1. Loading Census 2011 PCA (Telangana Districts)...")
pca_by_dist = {}  # (census_dist_code, tru) -> dict
with open(os.path.join(RAW_DIR, "pca_28.csv"), encoding="utf-8") as f:
    for row in csv.reader(f):
        if len(row) < 90:
            continue
        dcode = row[1].strip()
        if dcode not in {str(x) for x in range(532, 542)}:
            continue
        level = row[2].strip()
        if level != "DISTRICT":
            continue
        tru = row[4].strip()  # Total, Rural, Urban
        tot_p = max(1.0, fnum(row[7]))
        tot_m = max(1.0, fnum(row[8]))
        tot_f = max(1.0, fnum(row[9]))
        p_06 = fnum(row[10])
        m_06 = fnum(row[11])
        f_06 = fnum(row[12])
        p_sc = fnum(row[13])
        p_st = fnum(row[16])
        p_lit = fnum(row[19])
        m_lit = fnum(row[20])
        f_lit = fnum(row[21])
        p_ill = fnum(row[22])
        tot_work = fnum(row[25])
        main_work = fnum(row[28])
        main_cl = fnum(row[31])
        main_al = fnum(row[34])
        main_hh = fnum(row[37])
        main_ot = fnum(row[40])
        marg_work = fnum(row[43])
        non_work = fnum(row[88])
        denom_7plus = max(1.0, tot_p - p_06)
        denom_m7 = max(1.0, tot_m - m_06)
        denom_f7 = max(1.0, tot_f - f_06)
        pca_by_dist[(dcode, tru)] = {
            "area_sq_km": fnum(row[5]),
            "households": int(fnum(row[6])),
            "total_population": int(tot_p),
            "male_population": int(tot_m),
            "female_population": int(tot_f),
            "children_0_6": int(p_06),
            "sc_population": int(p_sc),
            "st_population": int(p_st),
            "literate_population": int(p_lit),
            "illiterate_population": int(p_ill),
            "literacy_rate": round((p_lit / denom_7plus) * 100, 2),
            "effective_literacy_7plus": round((p_lit / denom_7plus) * 100, 2),
            "crude_literacy_rate": round((p_lit / tot_p) * 100, 2),
            "male_literacy_rate": round((m_lit / denom_m7) * 100, 2),
            "female_literacy_rate": round((f_lit / denom_f7) * 100, 2),
            "gender_literacy_gap": round(((m_lit / denom_m7) - (f_lit / denom_f7)) * 100, 2),
            "child_0_6_percent": round((p_06 / tot_p) * 100, 2),
            "female_share": round((tot_f / tot_p) * 100, 2),
            "sc_percent": round((p_sc / tot_p) * 100, 2),
            "st_percent": round((p_st / tot_p) * 100, 2),
            "total_workers": int(tot_work),
            "main_workers": int(main_work),
            "marginal_workers": int(marg_work),
            "non_workers": int(non_work),
            "worker_participation_rate": round((tot_work / tot_p) * 100, 2),
            "marginal_worker_percent": round((marg_work / max(1.0, tot_work)) * 100, 2),
            "cultivator_percent": round((main_cl / max(1.0, tot_work)) * 100, 2),
            "agri_labourer_percent": round((main_al / max(1.0, tot_work)) * 100, 2),
            "hh_industry_percent": round((main_hh / max(1.0, tot_work)) * 100, 2),
            "other_worker_percent": round((main_ot / max(1.0, tot_work)) * 100, 2),
        }

print("2. Loading Census 2011 HLPCA (All Telangana Mandals & Districts)...")
hlpca_sub_total = {}
hlpca_sub_rural = {}
hlpca_dist_total = {}
hlpca_dist_rural = {}
hlpca_mandals_by_dist = defaultdict(dict)


def parse_hlpca_row(r):
    treated_tap = fnum(r[71])
    untreated_tap = fnum(r[72])
    covered_well = fnum(r[73])
    uncovered_well = fnum(r[74])
    handpump = fnum(r[75])
    borewell = fnum(r[76])
    tank_pond = fnum(r[79])
    water_within = fnum(r[81])
    water_near = fnum(r[82])
    water_away = fnum(r[83])

    elec_light = fnum(r[84])
    kerosene_light = fnum(r[85])
    solar_light = fnum(r[86])

    latrine_within = fnum(r[90])
    septic_latrine = fnum(r[92])
    open_defecation = fnum(r[101])
    bathroom_within = fnum(r[102])
    closed_drainage = fnum(r[105])
    open_drainage = fnum(r[106])
    no_drainage = fnum(r[107])

    firewood = fnum(r[108])
    crop_residue = fnum(r[109])
    cowdung = fnum(r[110])
    lpg_png = fnum(r[113])
    biogas = fnum(r[115])
    has_kitchen = fnum(r[120])

    banking = fnum(r[126])
    tv = fnum(r[128])
    comp_net = fnum(r[129])
    comp_nonet = fnum(r[130])
    mobile_only = fnum(r[132])
    both_phone = fnum(r[133])
    bicycle = fnum(r[134])
    two_wheeler = fnum(r[135])
    four_wheeler = fnum(r[136])
    no_assets = fnum(r[138])
    permanent_house = fnum(r[139])
    good_house = fnum(r[11])
    livable_house = fnum(r[12])
    dilapidated_house = fnum(r[13])

    return {
        "tehsil_code": r[4].strip(),
        "tehsil_name": r[5].strip(),
        "good_housing_pct": round(good_house, 2),
        "livable_housing_pct": round(livable_house, 2),
        "dilapidated_housing_pct": round(dilapidated_house, 2),
        "permanent_house_pct": round(permanent_house, 2),
        "treated_tap_pct": round(treated_tap, 2),
        "untreated_tap_pct": round(untreated_tap, 2),
        "tap_water_total_pct": round(treated_tap + untreated_tap, 2),
        "well_water_pct": round(covered_well + uncovered_well, 2),
        "borewell_handpump_pct": round(handpump + borewell, 2),
        "surface_tank_drinking_pct": round(tank_pond, 2),
        "water_within_premises_pct": round(water_within, 2),
        "water_near_premises_pct": round(water_near, 2),
        "water_away_pct": round(water_away, 2),
        "electricity_lighting_pct": round(elec_light, 2),
        "kerosene_lighting_pct": round(kerosene_light, 2),
        "solar_lighting_pct": round(solar_light, 2),
        "latrine_within_pct": round(latrine_within, 2),
        "septic_tank_pct": round(septic_latrine, 2),
        "open_defecation_pct": round(open_defecation, 2),
        "bathroom_within_pct": round(bathroom_within, 2),
        "closed_drainage_pct": round(closed_drainage, 2),
        "open_drainage_pct": round(open_drainage, 2),
        "no_drainage_pct": round(no_drainage, 2),
        "clean_cooking_fuel_pct": round(lpg_png + biogas, 2),
        "solid_biomass_fuel_pct": round(firewood + crop_residue + cowdung, 2),
        "kitchen_ventilation_pct": round(has_kitchen, 2),
        "banking_access_pct": round(banking, 2),
        "television_pct": round(tv, 2),
        "computer_internet_pct": round(comp_net, 2),
        "computer_total_pct": round(comp_net + comp_nonet, 2),
        "mobile_coverage_pct": round(mobile_only + both_phone, 2),
        "bicycle_pct": round(bicycle, 2),
        "two_wheeler_pct": round(two_wheeler, 2),
        "four_wheeler_pct": round(four_wheeler, 2),
        "asset_deprivation_pct": round(no_assets, 2),
    }


with open(os.path.join(RAW_DIR, "ap_hlpca.csv"), encoding="utf-8") as f:
    for r in csv.reader(f):
        if len(r) < 140:
            continue
        dcode = r[2].strip()
        if dcode not in {str(x) for x in range(532, 542)}:
            continue
        dn = norm(r[3])
        area_label = r[8].strip()
        tru = r[9].strip()
        parsed = parse_hlpca_row(r)
        if area_label.startswith("District -"):
            if tru == "Total":
                hlpca_dist_total[dn] = parsed
            elif tru == "Rural":
                hlpca_dist_rural[dn] = parsed
        elif area_label.startswith("Sub-Dist"):
            mn = norm(r[5])
            if tru == "Total":
                hlpca_sub_total[(dn, mn)] = parsed
                hlpca_mandals_by_dist[dn][mn] = parsed
            elif tru == "Rural":
                hlpca_sub_rural[(dn, mn)] = parsed

print("3. Loading Open-Meteo Telangana Climate & Air Quality + 5-Sector OSM Facilities...")
with open(os.path.join(RAW_DIR, "telangana_climate.json"), encoding="utf-8") as f:
    climate_by_dc = json.load(f)

SECTORS = ["education", "health", "water", "livelihood", "environment"]
osm_by_sector = {}
grid_by_sector = {}  # sector -> {(lat_bin, lon_bin): [facility, ...]}

for sec in SECTORS:
    path = os.path.join(RAW_DIR, f"osm_{sec}.json")
    items = []
    if os.path.exists(path):
        with open(path, encoding="utf-8") as f:
            raw_elems = json.load(f)
        for el in raw_elems:
            lat = el.get("lat") or (el.get("center") or {}).get("lat")
            lon = el.get("lon") or (el.get("center") or {}).get("lon")
            if lat is None or lon is None:
                continue
            tags = el.get("tags") or {}
            ftype = (
                tags.get("amenity")
                or tags.get("man_made")
                or tags.get("water")
                or tags.get("generator:source")
                or tags.get("plant:source")
                or tags.get("leisure")
                or tags.get("boundary")
                or tags.get("landuse")
                or tags.get("natural")
                or sec
            )
            name = (
                tags.get("name:en")
                or tags.get("name")
                or f"{ftype.replace('_', ' ').title()}"
            )
            item = {
                "id": f"{sec}_{el.get('id', len(items))}",
                "name": name,
                "category": ftype.replace("_", " ").title(),
                "lat": round(float(lat), 5),
                "lon": round(float(lon), 5),
                "operator": tags.get("operator", ""),
            }
            items.append(item)
    osm_by_sector[sec] = items
    g = defaultdict(list)
    for it in items:
        g[(int(it["lat"] * 2), int(it["lon"] * 2))].append(it)
    grid_by_sector[sec] = g
    print(f"   Loaded {len(items)} geolocated {sec} facilities")


def query_nearest_facility(sec: str, lat: float, lon: float):
    """Fast spatial grid lookup returning (nearest_km, count_within_10km, nearest_name)."""
    g = grid_by_sector[sec]
    b_lat = int(lat * 2)
    b_lon = int(lon * 2)
    candidates = []
    for dl in (-1, 0, 1):
        for dn_ in (-1, 0, 1):
            candidates.extend(g.get((b_lat + dl, b_lon + dn_), []))
    if not candidates:
        candidates = osm_by_sector[sec]
    if not candidates:
        return (12.0, 0, "Unmapped")
    best_d = 9999.0
    best_name = candidates[0]["name"]
    within_10 = 0
    for c in candidates:
        d = haversine_km(lat, lon, c["lat"], c["lon"])
        if d < best_d:
            best_d = d
            best_name = c["name"]
        if d <= 10.0:
            within_10 += 1
    if best_d > 55.0 and candidates is not osm_by_sector[sec]:
        for c in osm_by_sector[sec]:
            d = haversine_km(lat, lon, c["lat"], c["lon"])
            if d < best_d:
                best_d = d
                best_name = c["name"]
    return (round(best_d, 2), within_10, best_name)


print("4. Processing 444 Telangana Mandals & 10 Districts GIS Boundaries...")
with open(os.path.join(RAW_DIR, "districts.json"), encoding="utf-8") as f:
    raw_districts = json.load(f)["features"]

with open(os.path.join(RAW_DIR, "blocks.json"), encoding="utf-8") as f:
    raw_blocks = json.load(f)["features"]


def get_mandal_hlpca(d_name: str, m_name: str):
    dn = norm(d_name)
    mn = norm(m_name)
    mn = MANDAL_ALIASES.get((dn, mn), mn)
    if dn == "hyderabad":
        return hlpca_dist_total.get("hyderabad") or next(iter(hlpca_dist_total.values()))
    if (dn, mn) in hlpca_sub_total:
        return hlpca_sub_total[(dn, mn)]
    cand = difflib.get_close_matches(mn, list(hlpca_mandals_by_dist.get(dn, {}).keys()), n=1, cutoff=0.68)
    if cand:
        return hlpca_mandals_by_dist[dn][cand[0]]
    return hlpca_dist_rural.get(dn) or hlpca_dist_total.get(dn)


def compute_five_sector_scores(pca_rec, hlpca_rec, climate_rec, area_sq_km, tanks_total, fac_reach):
    """Computes transparent 0-100 sector scores from observed Census + TRACGIS + OSM + Climate indicators."""
    tank_density = round((tanks_total / max(0.5, area_sq_km)) * 10.0, 2)  # tanks per 10 km2

    # 1. Education Score (Literacy + Gender Parity + Household Learning/Digital Assets + School Reach)
    lit = pca_rec["literacy_rate"]
    fem_lit = pca_rec["female_literacy_rate"]
    digital_ready = min(100.0, hlpca_rec["mobile_coverage_pct"] * 0.45 + hlpca_rec["television_pct"] * 0.4 + hlpca_rec["computer_total_pct"] * 2.2)
    school_reach_score = clamp(100.0 - fac_reach["edu_km"] * 5.2 + min(18.0, fac_reach["edu_10km"] * 1.8))
    edu_score = round(clamp(lit * 0.42 + fem_lit * 0.23 + digital_ready * 0.17 + school_reach_score * 0.18), 1)

    # 2. Health Score (Sanitation + Clean Cooking Fuel / Low Smoke + Housing Safety + Drainage + Health Facility Reach)
    sanitation = hlpca_rec["latrine_within_pct"]
    clean_fuel = hlpca_rec["clean_cooking_fuel_pct"]
    housing_safe = clamp(100.0 - hlpca_rec["dilapidated_housing_pct"] * 4.0)
    drainage = clamp(hlpca_rec["closed_drainage_pct"] * 1.4 + hlpca_rec["open_drainage_pct"] * 0.65)
    health_reach_score = clamp(100.0 - fac_reach["health_km"] * 4.5 + min(20.0, fac_reach["health_10km"] * 2.0))
    health_score = round(clamp(sanitation * 0.26 + clean_fuel * 0.24 + housing_safe * 0.16 + drainage * 0.12 + health_reach_score * 0.22), 1)

    # 3. Water Score (Tap Water Coverage + Water Within Premises + Surface Tank Storage + Water Infra Reach)
    tap_cov = hlpca_rec["tap_water_total_pct"]
    within_prem = clamp(hlpca_rec["water_within_premises_pct"] + hlpca_rec["water_near_premises_pct"] * 0.45)
    tank_buffer = clamp(min(100.0, tank_density * 14.0 + (22.0 if tanks_total > 0 else 0.0)))
    water_reach_score = clamp(100.0 - fac_reach["water_km"] * 4.0 + min(18.0, fac_reach["water_10km"] * 2.0))
    water_score = round(clamp(tap_cov * 0.34 + within_prem * 0.28 + tank_buffer * 0.20 + water_reach_score * 0.18), 1)

    # 4. Livelihood Score (Work Participation + Main-Worker Stability + Banking + Mobility/Assets + Market/Bank Reach)
    wpr_norm = clamp(pca_rec["worker_participation_rate"] * 1.65)
    main_stability = clamp(100.0 - pca_rec["marginal_worker_percent"] * 1.4)
    banking = hlpca_rec["banking_access_pct"]
    asset_security = clamp(100.0 - hlpca_rec["asset_deprivation_pct"] * 2.2 + hlpca_rec["two_wheeler_pct"] * 0.5)
    liv_reach_score = clamp(100.0 - fac_reach["liv_km"] * 4.2 + min(18.0, fac_reach["liv_10km"] * 1.8))
    livelihood_score = round(clamp(wpr_norm * 0.22 + main_stability * 0.24 + banking * 0.20 + asset_security * 0.16 + liv_reach_score * 0.18), 1)

    # 5. Environment Score (Clean Fuel / Low Biomass Pressure + Solar & Grid Clean Lighting + Tank Ecological Density + Air Quality + Eco/Solar Asset Reach)
    low_biomass = clamp(100.0 - hlpca_rec["solid_biomass_fuel_pct"] * 0.85)
    clean_light = clamp(hlpca_rec["electricity_lighting_pct"] * 0.75 + min(30.0, hlpca_rec["solar_lighting_pct"] * 12.0))
    aqi_health = clamp(100.0 - max(0.0, fnum(climate_rec.get("pm2_5"), 38.0) - 12.0) * 1.35)
    eco_buffer = clamp(min(100.0, tank_density * 12.0 + (100.0 - min(80.0, fac_reach["env_km"] * 3.0)) * 0.5))
    environment_score = round(clamp(low_biomass * 0.28 + clean_light * 0.22 + aqi_health * 0.22 + eco_buffer * 0.28), 1)

    overall_score = round(
        (edu_score + health_score + water_score + livelihood_score + environment_score) / 5.0,
        1,
    )
    vvi_v2 = round(clamp(100.0 - overall_score), 1)
    if vvi_v2 >= 52:
        vvi_level = "High Priority"
    elif vvi_v2 >= 38:
        vvi_level = "Moderate Priority"
    else:
        vvi_level = "Resilient / Emerging"

    return {
        "education_score": edu_score,
        "health_score": health_score,
        "water_score": water_score,
        "livelihood_score": livelihood_score,
        "environment_score": environment_score,
        "overall_score": overall_score,
        "vvi_v2": vvi_v2,
        "vvi_v2_level": vvi_level,
        "tank_density_per_10sqkm": tank_density,
    }


mandal_profiles = {}  # dm_c -> full dict
mandal_features_base = []

for feat in raw_blocks:
    p = feat["properties"]
    dc = str(p.get("D_C", "")).zfill(2)
    dm_c = str(p.get("DM_C", "")).strip()
    d_name_raw = str(p.get("D_N", "")).strip()
    m_name_raw = str(p.get("DM_N", "")).strip()
    census_dcode, clean_d_name = GIS_TO_CENSUS_DIST.get(dc, ("536", d_name_raw.title()))
    tru_key = "Urban" if dc == "06" or "URBAN" in m_name_raw.upper() else "Rural"
    pca_rec = pca_by_dist.get((census_dcode, tru_key)) or pca_by_dist.get((census_dcode, "Total"))
    hlpca_rec = get_mandal_hlpca(clean_d_name, m_name_raw)
    climate_rec = climate_by_dc.get(dc, {})

    area_sq_km = round(fnum(p.get("Shape_Area"), 1e8) / 1_000_000.0, 2)
    tanks_gt40 = int(fnum(p.get("More_40ha"), 0))
    tanks_lt40 = int(fnum(p.get("Less_40") or p.get("Less_40ha"), 0))
    tanks_total = int(fnum(p.get("Total"), tanks_gt40 + tanks_lt40))

    simp_geom = simplify_geometry(feat.get("geometry"), tolerance=0.0018, decimals=4)
    clat, clon = geometry_centroid(simp_geom)

    edu_km, edu_10km, edu_near = query_nearest_facility("education", clat, clon)
    hea_km, hea_10km, hea_near = query_nearest_facility("health", clat, clon)
    wat_km, wat_10km, wat_near = query_nearest_facility("water", clat, clon)
    liv_km, liv_10km, liv_near = query_nearest_facility("livelihood", clat, clon)
    env_km, env_10km, env_near = query_nearest_facility("environment", clat, clon)

    fac_reach = {
        "edu_km": edu_km,
        "edu_10km": edu_10km,
        "health_km": hea_km,
        "health_10km": hea_10km,
        "water_km": wat_km,
        "water_10km": wat_10km,
        "liv_km": liv_km,
        "liv_10km": liv_10km,
        "env_km": env_km,
        "env_10km": env_10km,
    }
    scores = compute_five_sector_scores(pca_rec, hlpca_rec, climate_rec, area_sq_km, tanks_total, fac_reach)

    m_profile = {
        "mandal_code": dm_c,
        "mandal_name": m_name_raw.title(),
        "district_code": dc,
        "census_district_code": census_dcode,
        "district_name": clean_d_name,
        "lat": clat,
        "lon": clon,
        "area_sq_km": area_sq_km,
        "tanks_total": tanks_total,
        "tanks_gt_40ha": tanks_gt40,
        "tanks_lt_40ha": tanks_lt40,
        **scores,
        "hlpca": hlpca_rec,
        "pca": pca_rec,
        "climate": climate_rec,
        "reach": {
            "nearest_school_km": edu_km,
            "schools_within_10km": edu_10km,
            "nearest_school_name": edu_near,
            "nearest_health_km": hea_km,
            "health_within_10km": hea_10km,
            "nearest_health_name": hea_near,
            "nearest_water_km": wat_km,
            "water_within_10km": wat_10km,
            "nearest_water_name": wat_near,
            "nearest_livelihood_km": liv_km,
            "livelihood_within_10km": liv_10km,
            "nearest_livelihood_name": liv_near,
            "nearest_env_km": env_km,
            "env_within_10km": env_10km,
            "nearest_env_name": env_near,
        },
    }
    mandal_profiles[dm_c] = m_profile
    mandal_features_base.append((m_profile, simp_geom))

print("5. Processing all 11,154 Telangana Villages from village_boundaries.json.xz...")
with lzma.open(os.path.join(RAW_DIR, "village_boundaries.json.xz"), "rt", encoding="utf-8") as f:
    raw_villages = json.load(f)["features"]

# Compute total mapped village area per district so rural population scales proportionally to Census 2011 district totals
dist_village_area_sum = defaultdict(float)
for vf in raw_villages:
    vp = vf["properties"]
    dc = str(vp.get("D_C", "")).zfill(2)
    a_sqkm = max(0.15, fnum(vp.get("Shape_Area"), 1e6) / 1_000_000.0)
    dist_village_area_sum[dc] += a_sqkm

villages_catalog = []
geoms_by_district = defaultdict(dict)
village_count_by_mandal = defaultdict(int)
first_village_by_mandal = {}

for idx, vf in enumerate(raw_villages):
    vp = vf["properties"]
    dc = str(vp.get("D_C", "")).zfill(2)
    dm_c = str(vp.get("DM_C", "")).strip()
    v_code = str(vp.get("DMV_C") or f"{dm_c}{idx:04d}").strip()
    # Ensure unique village_code if duplicate polygons exist
    if v_code in geoms_by_district[dc]:
        v_code = f"{v_code}_{vp.get('OBJECTID', idx)}"
    v_name = str(vp.get("DMV_N") or f"Village {v_code}").strip()
    if v_name.isupper():
        v_name = v_name.title()

    census_dcode, clean_d_name = GIS_TO_CENSUS_DIST.get(dc, ("536", str(vp.get("D_N", "Telangana")).title()))
    m_prof = mandal_profiles.get(dm_c)
    m_name = m_prof["mandal_name"] if m_prof else str(vp.get("DM_N", "Mandal")).title()
    tru_key = "Urban" if dc == "06" else "Rural"
    pca_rec = pca_by_dist.get((census_dcode, tru_key)) or pca_by_dist.get((census_dcode, "Total"))
    hlpca_rec = m_prof["hlpca"] if m_prof else get_mandal_hlpca(clean_d_name, m_name)
    climate_rec = climate_by_dc.get(dc, {})

    area_sq_km = round(max(0.08, fnum(vp.get("Shape_Area"), 2_500_000) / 1_000_000.0), 2)
    tanks_gt40 = int(fnum(vp.get("More_40ha"), 0))
    tanks_lt40 = int(fnum(vp.get("Less_40ha"), 0))
    tanks_total = int(fnum(vp.get("Total"), tanks_gt40 + tanks_lt40))

    simp_geom = simplify_geometry(vf.get("geometry"), tolerance=0.0009, decimals=4)
    clat, clon = geometry_centroid(simp_geom)
    geoms_by_district[dc][v_code] = simp_geom

    edu_km, edu_10km, edu_near = query_nearest_facility("education", clat, clon)
    hea_km, hea_10km, hea_near = query_nearest_facility("health", clat, clon)
    wat_km, wat_10km, wat_near = query_nearest_facility("water", clat, clon)
    liv_km, liv_10km, liv_near = query_nearest_facility("livelihood", clat, clon)
    env_km, env_10km, env_near = query_nearest_facility("environment", clat, clon)

    fac_reach = {
        "edu_km": edu_km,
        "edu_10km": edu_10km,
        "health_km": hea_km,
        "health_10km": hea_10km,
        "water_km": wat_km,
        "water_10km": wat_10km,
        "liv_km": liv_km,
        "liv_10km": liv_10km,
        "env_km": env_km,
        "env_10km": env_10km,
    }
    scores = compute_five_sector_scores(pca_rec, hlpca_rec, climate_rec, area_sq_km, tanks_total, fac_reach)

    # Calibrate settlement population proportionally to District Rural Census PCA population & village area
    dist_pop = pca_rec["total_population"]
    dist_hh = pca_rec["households"]
    area_share = area_sq_km / max(1.0, dist_village_area_sum[dc])
    est_pop = max(120, int(round(dist_pop * area_share)))
    est_hh = max(28, int(round(dist_hh * area_share)))

    # Modulate village literacy slightly by observed Mandal digital/TV assets and school proximity (strictly deterministic)
    mandal_edu_mod = (hlpca_rec["television_pct"] - 50.0) * 0.08 - min(4.5, edu_km * 0.25)
    v_lit = round(clamp(pca_rec["literacy_rate"] + mandal_edu_mod, 28.0, 94.0), 2)
    v_wpr = pca_rec["worker_participation_rate"]
    v_marg = round(clamp(pca_rec["marginal_worker_percent"] + (hlpca_rec["asset_deprivation_pct"] - 18.0) * 0.15, 4.0, 68.0), 2)

    village_count_by_mandal[dm_c] += 1
    if dm_c not in first_village_by_mandal:
        first_village_by_mandal[dm_c] = v_code

    villages_catalog.append({
        "vc": v_code,
        "vn": v_name,
        "mc": dm_c,
        "mn": m_name,
        "dc": dc,
        "dn": clean_d_name,
        "lat": clat,
        "lon": clon,
        "area": area_sq_km,
        "pop": est_pop,
        "hh": est_hh,
        "lit": v_lit,
        "wpr": v_wpr,
        "marg": v_marg,
        "ch06": pca_rec["child_0_6_percent"],
        "tanks": tanks_total,
        "tanks_gt40": tanks_gt40,
        "edu_s": scores["education_score"],
        "hea_s": scores["health_score"],
        "wat_s": scores["water_score"],
        "liv_s": scores["livelihood_score"],
        "env_s": scores["environment_score"],
        "ovr_s": scores["overall_score"],
        "vvi": scores["vvi_v2"],
        "vvi_lvl": scores["vvi_v2_level"],
        "edu_km": edu_km,
        "edu_10": edu_10km,
        "edu_nm": edu_near,
        "hea_km": hea_km,
        "hea_10": hea_10km,
        "hea_nm": hea_near,
        "wat_km": wat_km,
        "wat_10": wat_10km,
        "wat_nm": wat_near,
        "liv_km": liv_km,
        "liv_10": liv_10km,
        "liv_nm": liv_near,
        "env_km": env_km,
        "env_10": env_10km,
        "env_nm": env_near,
    })

print(f"   Compiled {len(villages_catalog)} Telangana village profiles.")

for dc, gmap in geoms_by_district.items():
    out_p = os.path.join(VIL_GEOM_DIR, f"{dc}.json")
    with open(out_p, "w", encoding="utf-8") as f:
        json.dump(gmap, f, separators=(",", ":"))

with open(os.path.join(OUT_DIR, "villages_catalog.json"), "w", encoding="utf-8") as f:
    json.dump(villages_catalog, f, separators=(",", ":"))

# Attach village_count & representative_village_code to mandal_profiles
for dm_c, mp in mandal_profiles.items():
    mp["village_count"] = village_count_by_mandal.get(dm_c, 0)
    mp["sample_village_code"] = first_village_by_mandal.get(dm_c, "")

with open(os.path.join(OUT_DIR, "mandals_catalog.json"), "w", encoding="utf-8") as f:
    json.dump(mandal_profiles, f, separators=(",", ":"))

print("6. Building District GeoJSON & 5 Separate Sector GIS Layers...")
district_features = []
district_summary_list = []

for df in raw_districts:
    dp = df["properties"]
    dc = str(dp.get("D_C", "")).zfill(2)
    census_dcode, clean_d_name = GIS_TO_CENSUS_DIST.get(dc, ("536", str(dp.get("D_N", "")).title()))
    pca_tot = pca_by_dist.get((census_dcode, "Total"))
    dn_norm = norm(clean_d_name)
    hlpca_tot = hlpca_dist_total.get(dn_norm) or next(iter(hlpca_dist_total.values()))
    climate_rec = climate_by_dc.get(dc, {})
    area_sq_km = round(fnum(dp.get("Shape_Area"), 1e9) / 1_000_000.0, 2)
    tanks_total = int(fnum(dp.get("Total"), 0))

    m_in_dist = [mp for mp in mandal_profiles.values() if mp["district_code"] == dc]
    v_in_dist = [v for v in villages_catalog if v["dc"] == dc]

    def avg_m(key):
        if not m_in_dist:
            return 50.0
        return round(sum(m[key] for m in m_in_dist) / len(m_in_dist), 1)

    d_props = {
        "district_code": dc,
        "census_code": census_dcode,
        "district_name": clean_d_name,
        "area_sq_km": area_sq_km,
        "mandal_count": len(m_in_dist),
        "village_count": len(v_in_dist),
        "total_population": pca_tot["total_population"],
        "households": pca_tot["households"],
        "literacy_rate": pca_tot["literacy_rate"],
        "female_literacy_rate": pca_tot["female_literacy_rate"],
        "child_0_6_percent": pca_tot["child_0_6_percent"],
        "worker_participation_rate": pca_tot["worker_participation_rate"],
        "marginal_worker_percent": pca_tot["marginal_worker_percent"],
        "tap_water_total_pct": hlpca_tot["tap_water_total_pct"],
        "treated_tap_pct": hlpca_tot["treated_tap_pct"],
        "water_within_premises_pct": hlpca_tot["water_within_premises_pct"],
        "latrine_within_pct": hlpca_tot["latrine_within_pct"],
        "clean_cooking_fuel_pct": hlpca_tot["clean_cooking_fuel_pct"],
        "solid_biomass_fuel_pct": hlpca_tot["solid_biomass_fuel_pct"],
        "banking_access_pct": hlpca_tot["banking_access_pct"],
        "solar_lighting_pct": hlpca_tot["solar_lighting_pct"],
        "tanks_total": tanks_total,
        "current_temp_c": climate_rec.get("current_temp_c"),
        "avg_solar_radiation_mj_m2": climate_rec.get("avg_solar_radiation_mj_m2"),
        "pm2_5": climate_rec.get("pm2_5"),
        "us_aqi": climate_rec.get("us_aqi"),
        "education_score": avg_m("education_score"),
        "health_score": avg_m("health_score"),
        "water_score": avg_m("water_score"),
        "livelihood_score": avg_m("livelihood_score"),
        "environment_score": avg_m("environment_score"),
        "overall_score": avg_m("overall_score"),
        "vvi_v2": avg_m("vvi_v2"),
    }
    district_summary_list.append(d_props)
    district_features.append({
        "type": "Feature",
        "properties": d_props,
        "geometry": simplify_geometry(df.get("geometry"), tolerance=0.0025, decimals=4),
    })

district_summary_list.sort(key=lambda x: x["district_code"])

with open(os.path.join(GIS_OUT_DIR, "districts.geojson"), "w", encoding="utf-8") as f:
    json.dump({"type": "FeatureCollection", "features": district_features}, f, separators=(",", ":"))

# Build 5 SEPARATE Sector GIS Files (+ overview)
SECTOR_CONFIGS = {
    "education": {
        "sector": "education",
        "title": "Telangana Education Spatial GIS (SDG 04)",
        "accent": "#ef4444",
        "palette": ["#450a0a", "#7f1d1d", "#b91c1c", "#ef4444", "#f97316", "#fbbf24"],
        "default_metric": "education_score",
        "metrics": [
            {"key": "education_score", "label": "Education Index (0–100)", "unit": "pts"},
            {"key": "literacy_rate", "label": "Effective Literacy Rate", "unit": "%"},
            {"key": "female_literacy_rate", "label": "Female Literacy Rate", "unit": "%"},
            {"key": "mobile_coverage_pct", "label": "Household Telecom Reach", "unit": "%"},
            {"key": "computer_total_pct", "label": "Computer / Digital Ownership", "unit": "%"},
        ],
        "extract": lambda mp: {
            "education_score": mp["education_score"],
            "literacy_rate": mp["pca"]["literacy_rate"],
            "female_literacy_rate": mp["pca"]["female_literacy_rate"],
            "child_0_6_percent": mp["pca"]["child_0_6_percent"],
            "mobile_coverage_pct": mp["hlpca"]["mobile_coverage_pct"],
            "television_pct": mp["hlpca"]["television_pct"],
            "computer_total_pct": mp["hlpca"]["computer_total_pct"],
            "nearest_facility_km": mp["reach"]["nearest_school_km"],
            "facilities_within_10km": mp["reach"]["schools_within_10km"],
            "nearest_facility_name": mp["reach"]["nearest_school_name"],
        },
    },
    "health": {
        "sector": "health",
        "title": "Telangana Health & Sanitation Spatial GIS (SDG 03)",
        "accent": "#10b981",
        "palette": ["#064e3b", "#065f46", "#047857", "#10b981", "#34d399", "#a7f3d0"],
        "default_metric": "health_score",
        "metrics": [
            {"key": "health_score", "label": "Health Readiness Index (0–100)", "unit": "pts"},
            {"key": "latrine_within_pct", "label": "Sanitation Within Premises", "unit": "%"},
            {"key": "clean_cooking_fuel_pct", "label": "Clean Cooking Fuel (LPG/Biogas)", "unit": "%"},
            {"key": "good_housing_pct", "label": "Safe Good-Condition Housing", "unit": "%"},
            {"key": "closed_drainage_pct", "label": "Closed Wastewater Drainage", "unit": "%"},
        ],
        "extract": lambda mp: {
            "health_score": mp["health_score"],
            "latrine_within_pct": mp["hlpca"]["latrine_within_pct"],
            "open_defecation_pct": mp["hlpca"]["open_defecation_pct"],
            "clean_cooking_fuel_pct": mp["hlpca"]["clean_cooking_fuel_pct"],
            "good_housing_pct": mp["hlpca"]["good_housing_pct"],
            "dilapidated_housing_pct": mp["hlpca"]["dilapidated_housing_pct"],
            "closed_drainage_pct": mp["hlpca"]["closed_drainage_pct"],
            "nearest_facility_km": mp["reach"]["nearest_health_km"],
            "facilities_within_10km": mp["reach"]["health_within_10km"],
            "nearest_facility_name": mp["reach"]["nearest_health_name"],
        },
    },
    "water": {
        "sector": "water",
        "title": "Telangana Water & Minor Irrigation Spatial GIS (SDG 06)",
        "accent": "#06b6d4",
        "palette": ["#083344", "#155e75", "#0e7490", "#06b6d4", "#22d3ee", "#a5f3fc"],
        "default_metric": "water_score",
        "metrics": [
            {"key": "water_score", "label": "Water Security Index (0–100)", "unit": "pts"},
            {"key": "tap_water_total_pct", "label": "Household Tap Water Access", "unit": "%"},
            {"key": "treated_tap_pct", "label": "Treated Tap Water Share", "unit": "%"},
            {"key": "water_within_premises_pct", "label": "Water Within Premises", "unit": "%"},
            {"key": "tanks_total", "label": "TRACGIS Irrigation Tanks Count", "unit": "tanks"},
        ],
        "extract": lambda mp: {
            "water_score": mp["water_score"],
            "tap_water_total_pct": mp["hlpca"]["tap_water_total_pct"],
            "treated_tap_pct": mp["hlpca"]["treated_tap_pct"],
            "borewell_handpump_pct": mp["hlpca"]["borewell_handpump_pct"],
            "water_within_premises_pct": mp["hlpca"]["water_within_premises_pct"],
            "water_away_pct": mp["hlpca"]["water_away_pct"],
            "tanks_total": mp["tanks_total"],
            "tank_density_per_10sqkm": mp["tank_density_per_10sqkm"],
            "nearest_facility_km": mp["reach"]["nearest_water_km"],
            "facilities_within_10km": mp["reach"]["water_within_10km"],
            "nearest_facility_name": mp["reach"]["nearest_water_name"],
        },
    },
    "livelihood": {
        "sector": "livelihood",
        "title": "Telangana Livelihood, Banking & Workforce GIS (SDG 08)",
        "accent": "#ec4899",
        "palette": ["#500724", "#831843", "#be185d", "#ec4899", "#f472b6", "#fbcfe8"],
        "default_metric": "livelihood_score",
        "metrics": [
            {"key": "livelihood_score", "label": "Livelihood Opportunity Index (0–100)", "unit": "pts"},
            {"key": "banking_access_pct", "label": "Household Banking Inclusion", "unit": "%"},
            {"key": "worker_participation_rate", "label": "Worker Participation Rate", "unit": "%"},
            {"key": "marginal_worker_percent", "label": "Marginal Worker Share", "unit": "%"},
            {"key": "two_wheeler_pct", "label": "Household Two-Wheeler Mobility", "unit": "%"},
        ],
        "extract": lambda mp: {
            "livelihood_score": mp["livelihood_score"],
            "banking_access_pct": mp["hlpca"]["banking_access_pct"],
            "worker_participation_rate": mp["pca"]["worker_participation_rate"],
            "marginal_worker_percent": mp["pca"]["marginal_worker_percent"],
            "cultivator_percent": mp["pca"]["cultivator_percent"],
            "agri_labourer_percent": mp["pca"]["agri_labourer_percent"],
            "two_wheeler_pct": mp["hlpca"]["two_wheeler_pct"],
            "asset_deprivation_pct": mp["hlpca"]["asset_deprivation_pct"],
            "nearest_facility_km": mp["reach"]["nearest_livelihood_km"],
            "facilities_within_10km": mp["reach"]["livelihood_within_10km"],
            "nearest_facility_name": mp["reach"]["nearest_livelihood_name"],
        },
    },
    "environment": {
        "sector": "environment",
        "title": "Telangana Environment, Solar & Climate GIS (SDG 13)",
        "accent": "#84cc16",
        "palette": ["#1a2e05", "#365314", "#4d7c0f", "#65a30d", "#84cc16", "#bef264"],
        "default_metric": "environment_score",
        "metrics": [
            {"key": "environment_score", "label": "Climate & Ecological Index (0–100)", "unit": "pts"},
            {"key": "solid_biomass_fuel_pct", "label": "Solid Biomass Fuel Pressure", "unit": "%"},
            {"key": "solar_lighting_pct", "label": "Household Solar Lighting Share", "unit": "%"},
            {"key": "tank_density_per_10sqkm", "label": "Surface Water Tank Density", "unit": "/10km²"},
            {"key": "pm2_5", "label": "District Ambient PM2.5", "unit": "µg/m³"},
        ],
        "extract": lambda mp: {
            "environment_score": mp["environment_score"],
            "solid_biomass_fuel_pct": mp["hlpca"]["solid_biomass_fuel_pct"],
            "solar_lighting_pct": mp["hlpca"]["solar_lighting_pct"],
            "electricity_lighting_pct": mp["hlpca"]["electricity_lighting_pct"],
            "tank_density_per_10sqkm": mp["tank_density_per_10sqkm"],
            "tanks_total": mp["tanks_total"],
            "pm2_5": mp["climate"].get("pm2_5"),
            "us_aqi": mp["climate"].get("us_aqi"),
            "current_temp_c": mp["climate"].get("current_temp_c"),
            "avg_solar_radiation_mj_m2": mp["climate"].get("avg_solar_radiation_mj_m2"),
            "nearest_facility_km": mp["reach"]["nearest_env_km"],
            "facilities_within_10km": mp["reach"]["env_within_10km"],
            "nearest_facility_name": mp["reach"]["nearest_env_name"],
        },
    },
}

for sec, cfg in SECTOR_CONFIGS.items():
    m_feats = []
    for mp, geom in mandal_features_base:
        props = {
            "mandal_code": mp["mandal_code"],
            "mandal_name": mp["mandal_name"],
            "district_code": mp["district_code"],
            "district_name": mp["district_name"],
            "area_sq_km": mp["area_sq_km"],
            "village_count": mp["village_count"],
            "sample_village_code": mp["sample_village_code"],
            "overall_score": mp["overall_score"],
            "vvi_v2": mp["vvi_v2"],
            **cfg["extract"](mp),
        }
        m_feats.append({
            "type": "Feature",
            "properties": props,
            "geometry": geom,
        })

    # Sample up to 650 evenly distributed OSM facilities for crisp map rendering + Open-Meteo stations for environment
    raw_facs = osm_by_sector[sec]
    stride = max(1, len(raw_facs) // 650)
    sampled_facs = raw_facs[::stride][:650]
    if sec == "environment":
        for dc_key, clim in climate_by_dc.items():
            sampled_facs.append({
                "id": f"meteo_{dc_key}",
                "name": f"{clim['district_name']} Climate & AQI Telemetry",
                "category": f"Temp {clim['current_temp_c']}°C · Solar {clim['avg_solar_radiation_mj_m2']} MJ/m² · PM2.5 {clim['pm2_5']}",
                "lat": clim["lat"],
                "lon": clim["lon"],
                "operator": "Open-Meteo",
            })

    gis_payload = {
        "sector": sec,
        "state": "Telangana",
        "title": cfg["title"],
        "accent": cfg["accent"],
        "palette": cfg["palette"],
        "default_metric": cfg["default_metric"],
        "metrics": cfg["metrics"],
        "total_mandals": len(m_feats),
        "total_facilities_statewide": len(raw_facs),
        "facilities": sampled_facs,
        "mandals": {
            "type": "FeatureCollection",
            "features": m_feats,
        },
    }
    with open(os.path.join(GIS_OUT_DIR, f"{sec}_gis.json"), "w", encoding="utf-8") as f:
        json.dump(gis_payload, f, separators=(",", ":"))
    print(f"   Wrote {sec}_gis.json ({len(m_feats)} mandals, {len(sampled_facs)} mapped facilities)")

print("7. Building Comprehensive 5-Sector Analytics Summary...")
total_ts_pop = sum(d["total_population"] for d in district_summary_list)
total_ts_hh = sum(d["households"] for d in district_summary_list)
total_ts_tanks = sum(d["tanks_total"] for d in district_summary_list)


def calc_distribution(vals, bins):
    out = []
    for i in range(len(bins) - 1):
        lo, hi = bins[i], bins[i + 1]
        cnt = sum(1 for v in vals if (lo <= v < hi if i < len(bins) - 2 else lo <= v <= hi))
        out.append({"range": f"{lo}–{hi}", "count": cnt})
    return out


all_mandals = list(mandal_profiles.values())

analytics_summary = {
    "state": "Telangana",
    "total_districts": len(district_summary_list),
    "total_mandals": len(all_mandals),
    "total_villages": len(villages_catalog),
    "total_population": total_ts_pop,
    "total_households": total_ts_hh,
    "total_irrigation_tanks": total_ts_tanks,
    "total_mapped_facilities": {s: len(osm_by_sector[s]) for s in SECTORS},
    "avg_literacy_rate": round(sum(d["literacy_rate"] * d["total_population"] for d in district_summary_list) / total_ts_pop, 2),
    "avg_female_literacy_rate": round(sum(d["female_literacy_rate"] * d["total_population"] for d in district_summary_list) / total_ts_pop, 2),
    "avg_worker_participation": round(sum(d["worker_participation_rate"] * d["total_population"] for d in district_summary_list) / total_ts_pop, 2),
    "avg_child_0_6_percent": round(sum(d["child_0_6_percent"] * d["total_population"] for d in district_summary_list) / total_ts_pop, 2),
    "avg_marginal_worker_percent": round(sum(d["marginal_worker_percent"] * d["total_population"] for d in district_summary_list) / total_ts_pop, 2),
    "state_sector_averages": {
        "education_score": round(sum(m["education_score"] for m in all_mandals) / len(all_mandals), 1),
        "health_score": round(sum(m["health_score"] for m in all_mandals) / len(all_mandals), 1),
        "water_score": round(sum(m["water_score"] for m in all_mandals) / len(all_mandals), 1),
        "livelihood_score": round(sum(m["livelihood_score"] for m in all_mandals) / len(all_mandals), 1),
        "environment_score": round(sum(m["environment_score"] for m in all_mandals) / len(all_mandals), 1),
        "overall_score": round(sum(m["overall_score"] for m in all_mandals) / len(all_mandals), 1),
        "tap_water_total_pct": round(sum(m["hlpca"]["tap_water_total_pct"] for m in all_mandals) / len(all_mandals), 1),
        "treated_tap_pct": round(sum(m["hlpca"]["treated_tap_pct"] for m in all_mandals) / len(all_mandals), 1),
        "water_within_premises_pct": round(sum(m["hlpca"]["water_within_premises_pct"] for m in all_mandals) / len(all_mandals), 1),
        "latrine_within_pct": round(sum(m["hlpca"]["latrine_within_pct"] for m in all_mandals) / len(all_mandals), 1),
        "clean_cooking_fuel_pct": round(sum(m["hlpca"]["clean_cooking_fuel_pct"] for m in all_mandals) / len(all_mandals), 1),
        "solid_biomass_fuel_pct": round(sum(m["hlpca"]["solid_biomass_fuel_pct"] for m in all_mandals) / len(all_mandals), 1),
        "banking_access_pct": round(sum(m["hlpca"]["banking_access_pct"] for m in all_mandals) / len(all_mandals), 1),
        "two_wheeler_pct": round(sum(m["hlpca"]["two_wheeler_pct"] for m in all_mandals) / len(all_mandals), 1),
        "solar_lighting_pct": round(sum(m["hlpca"]["solar_lighting_pct"] for m in all_mandals) / len(all_mandals), 2),
        "mobile_coverage_pct": round(sum(m["hlpca"]["mobile_coverage_pct"] for m in all_mandals) / len(all_mandals), 1),
    },
    "districts": district_summary_list,
    "distributions": {
        "education": calc_distribution([m["education_score"] for m in all_mandals], [30, 45, 55, 65, 75, 100]),
        "health": calc_distribution([m["health_score"] for m in all_mandals], [20, 35, 50, 65, 80, 100]),
        "water": calc_distribution([m["water_score"] for m in all_mandals], [25, 40, 55, 70, 85, 100]),
        "livelihood": calc_distribution([m["livelihood_score"] for m in all_mandals], [30, 45, 55, 65, 75, 100]),
        "environment": calc_distribution([m["environment_score"] for m in all_mandals], [25, 40, 50, 60, 75, 100]),
        "tap_water": calc_distribution([m["hlpca"]["tap_water_total_pct"] for m in all_mandals], [0, 25, 50, 70, 85, 100]),
        "sanitation": calc_distribution([m["hlpca"]["latrine_within_pct"] for m in all_mandals], [0, 20, 35, 55, 75, 100]),
        "banking": calc_distribution([m["hlpca"]["banking_access_pct"] for m in all_mandals], [0, 30, 45, 60, 75, 100]),
    },
    "mandal_scatter": [
        {
            "mandal": m["mandal_name"],
            "district": m["district_name"],
            "code": m["mandal_code"],
            "edu": m["education_score"],
            "health": m["health_score"],
            "water": m["water_score"],
            "livelihood": m["livelihood_score"],
            "environment": m["environment_score"],
            "tap_water": m["hlpca"]["tap_water_total_pct"],
            "sanitation": m["hlpca"]["latrine_within_pct"],
            "clean_fuel": m["hlpca"]["clean_cooking_fuel_pct"],
            "banking": m["hlpca"]["banking_access_pct"],
            "biomass": m["hlpca"]["solid_biomass_fuel_pct"],
            "tanks": m["tanks_total"],
        }
        for m in all_mandals
    ],
    "data_sources": [
        "Census of India 2011 — Primary Census Abstract (Telangana Districts 532–541)",
        "Census of India 2011 — Houselisting & Housing Census (444 Telangana Mandals, 145 Household Indicators)",
        "Telangana Remote Sensing Applications Centre (TRACGIS) — Official District, Mandal & 11,154 Village GIS Polygons + Minor Irrigation Tank Inventory",
        "OpenStreetMap Overpass Geospatial Infrastructure — 5,607 Geolocated Telangana Schools, Hospitals, Water Works, Markets/Banks & Solar/Forest Assets",
        "Open-Meteo Meteorological, Shortwave Solar Radiation & Ambient Air Quality (PM2.5 / PM10 / US AQI) Feed",
    ],
}

with open(os.path.join(OUT_DIR, "analytics_summary.json"), "w", encoding="utf-8") as f:
    json.dump(analytics_summary, f, indent=2)

print("DONE! All Telangana 5-sector datasets & GIS layers compiled successfully.")
