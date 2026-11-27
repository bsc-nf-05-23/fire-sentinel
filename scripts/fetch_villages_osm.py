"""Fetch OpenStreetMap place=village and place=hamlet points via Overpass API.

Usage:
    python scripts/fetch_villages_osm.py --out data/osm_villages_zomba.csv
"""

from __future__ import annotations

import argparse
from pathlib import Path

import certifi
import pandas as pd
import requests

ZOMBA_BBOX = (-15.44, 35.22, -15.30, 35.38)  # (south, west, north, east) for Overpass


def fetch_osm_villages(
    bbox_swne: tuple[float, float, float, float] = ZOMBA_BBOX,
) -> pd.DataFrame:
    south, west, north, east = bbox_swne
    query = f"""
    [out:json][timeout:25];
    (
      node["place"="village"]({south},{west},{north},{east});
      node["place"="hamlet"]({south},{west},{north},{east});
    );
    out body;
    """
    resp = requests.post(
        "https://overpass-api.de/api/interpreter",
        data={"data": query},
        timeout=30,
        verify=certifi.where(),
    )
    resp.raise_for_status()
    elements = resp.json().get("elements", [])

    rows = []
    for el in elements:
        tags = el.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        rows.append(
            {
                "osm_id": el["id"],
                "name": name,
                "place_type": tags.get("place", "village"),
                "lat": el["lat"],
                "lon": el["lon"],
            }
        )
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch OSM villages and hamlets.")
    parser.add_argument("--out", default="data/osm_villages.csv", help="Output CSV path")
    args = parser.parse_args()

    df = fetch_osm_villages()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} OSM settlements to {out_path}")


if __name__ == "__main__":
    main()
