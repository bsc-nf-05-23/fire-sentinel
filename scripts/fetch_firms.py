"""Fetch historical satellite fire detections from NASA FIRMS Archive API (VIIRS_SNPP_SP).

Usage:
    python scripts/fetch_firms.py --date 2025-09-14 --days 3 --out data/firms_zomba.csv
"""

from __future__ import annotations

import argparse
import io
import os
from pathlib import Path

import certifi
import pandas as pd
import requests
from dotenv import load_dotenv

# Default bounding box around Zomba Forest Reserve, Malawi (west, south, east, north)
ZOMBA_BBOX = (35.22, -15.44, 35.38, -15.30)


def fetch_firms_archive(
    map_key: str,
    start_date: str,
    days: int = 3,
    source: str = "VIIRS_SNPP_SP",
    bbox: tuple[float, float, float, float] = ZOMBA_BBOX,
) -> pd.DataFrame:
    if not map_key:
        raise ValueError("FIRMS_MAP_KEY must be set in .env before querying NASA FIRMS.")
    if not 1 <= days <= 10:
        raise ValueError("NASA FIRMS API accepts between 1 and 10 days per request.")

    west, south, east, north = bbox
    area_param = f"{west},{south},{east},{north}"
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{map_key}/{source}/{area_param}/{days}/{start_date}"

    resp = requests.get(url, timeout=20, verify=certifi.where())
    resp.raise_for_status()

    df = pd.read_csv(io.StringIO(resp.text))
    return df


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(description="Fetch NASA FIRMS archive detections.")
    parser.add_argument("--date", required=True, help="Start date YYYY-MM-DD")
    parser.add_argument("--days", type=int, default=3, help="Number of days (1-10)")
    parser.add_argument("--source", default="VIIRS_SNPP_SP", help="FIRMS archive source")
    parser.add_argument("--out", default="data/firms_detections.csv", help="Output CSV path")
    args = parser.parse_args()

    map_key = os.getenv("FIRMS_MAP_KEY", "").strip()
    df = fetch_firms_archive(map_key=map_key, start_date=args.date, days=args.days, source=args.source)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} FIRMS detections (~375m VIIRS pixels) to {out_path}")


if __name__ == "__main__":
    main()
