"""Fetch coarse hourly wind speed & direction from Open-Meteo Historical Weather API.

Usage:
    python scripts/fetch_wind_openmeteo.py --start 2025-09-14 --end 2025-09-15 --out data/wind_zomba.csv
"""

from __future__ import annotations

import argparse
from pathlib import Path

import certifi
import pandas as pd
import requests


def fetch_hourly_wind(
    lat: float = -15.36,
    lon: float = 35.30,
    start_date: str = "2025-09-14",
    end_date: str = "2025-09-15",
) -> pd.DataFrame:
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "hourly": "wind_speed_10m,wind_direction_10m",
        "timezone": "UTC",
    }
    resp = requests.get(url, params=params, timeout=20, verify=certifi.where())
    resp.raise_for_status()
    hourly = resp.json()["hourly"]

    df = pd.DataFrame(
        {
            "valid_utc": hourly["time"],
            "speed_kmh": hourly["wind_speed_10m"],
            "direction_from_deg": hourly["wind_direction_10m"],
        }
    )
    # Meteorological wind direction is where wind blows FROM; fire spreads TOWARD +180 deg.
    df["spread_toward_deg"] = (df["direction_from_deg"] + 180.0) % 360.0
    df["source_note"] = "Open-Meteo hourly reanalysis (coarse grid)"
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Open-Meteo historical hourly wind.")
    parser.add_argument("--lat", type=float, default=-15.36)
    parser.add_argument("--lon", type=float, default=35.30)
    parser.add_argument("--start", required=True, help="Start date YYYY-MM-DD")
    parser.add_argument("--end", required=True, help="End date YYYY-MM-DD")
    parser.add_argument("--out", default="data/wind_hourly.csv")
    args = parser.parse_args()

    df = fetch_hourly_wind(lat=args.lat, lon=args.lon, start_date=args.start, end_date=args.end)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)
    print(f"Saved {len(df)} hourly wind records to {out_path}")


if __name__ == "__main__":
    main()
