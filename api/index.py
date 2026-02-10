from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import csv
import io
import os
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import requests
from dotenv import load_dotenv

app = FastAPI()

load_dotenv()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NASA_HEADERS = {"User-Agent": "wildfirerisk-dashboard/1.0"}

FIRMS_API_BASE = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
FIRMS_MAP_KEY = (
    os.getenv("FIRMS_MAP_KEY")
    or os.getenv("FIRMS_API_KEY")
    or os.getenv("MAP_KEY")
    or "b613977dc8122d603a1d9573887c2f6d"
)
FIRMS_SOURCE = os.getenv("FIRMS_SOURCE", "VIIRS_SNPP_NRT")
FIRMS_BBOX = os.getenv("FIRMS_BBOX", "97.0,5.5,106.0,20.5")  # west,south,east,north
try:
    FIRMS_DAY_RANGE = max(1, min(5, int(os.getenv("FIRMS_DAY_RANGE", "2"))))
except ValueError:
    FIRMS_DAY_RANGE = 2


def build_firms_url(map_key: str) -> str:
    return f"{FIRMS_API_BASE}/{map_key}/{FIRMS_SOURCE}/{FIRMS_BBOX}/{FIRMS_DAY_RANGE}"


def parse_acq_datetime(row: dict) -> Optional[datetime]:
    date_str = (row.get("acq_date") or "").strip()
    if not date_str:
        return None
    time_str = (row.get("acq_time") or "").strip()
    time_str = time_str.zfill(4) if time_str else "0000"
    try:
        hour = int(time_str[:-2])
        minute = int(time_str[-2:])
        date_part = datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return None
    return date_part.replace(
        hour=hour,
        minute=minute,
        second=0,
        microsecond=0,
        tzinfo=timezone.utc,
    )

@app.get("/api/v1/hotspots")
async def get_hotspots():
    data_list = []
    try:
        if not FIRMS_MAP_KEY:
            return {
                "data": [],
                "error": "FIRMS_MAP_KEY is not set. Configure a FIRMS API Map Key.",
            }

        url = build_firms_url(FIRMS_MAP_KEY)
        
        # Retry logic with increased timeout
        max_retries = 3
        response = None
        last_error = None
        
        for attempt in range(max_retries):
            try:
                response = requests.get(url, timeout=60, headers=NASA_HEADERS)
                if response.status_code == 200:
                    break
                else:
                    last_error = f"FIRMS API error: {response.status_code}"
            except requests.exceptions.RequestException as e:
                last_error = str(e)
                if attempt < max_retries - 1:
                    continue
        
        if response is None or response.status_code != 200:
            print(f"API Error ({last_error}). Switching to MOCK DATA mode.")
            return {"data": generate_mock_data()}

        content = response.text
        lines = content.splitlines()
        if not lines:
             print("Empty response. Switching to MOCK DATA mode.")
             return {"data": generate_mock_data()}
             
        header = lines[0].lower()
        if "latitude" not in header or "longitude" not in header:
            print(f"Invalid API Response: {header[:50]}... Switching to MOCK DATA mode.")
            return {"data": generate_mock_data()}

        csv_reader = csv.DictReader(io.StringIO(content))

        try:
            west, south, east, north = [float(v) for v in FIRMS_BBOX.split(",")]
        except ValueError:
            west, south, east, north = 97.0, 5.5, 106.0, 20.5

        now_utc = datetime.now(timezone.utc)
        cutoff_utc = now_utc - timedelta(hours=24)

        for row in csv_reader:
            try:
                lat = float(row['latitude'])
                lon = float(row['longitude'])

                if not (south <= lat <= north and west <= lon <= east):
                    continue

                acq_dt = parse_acq_datetime(row)
                if acq_dt is not None and acq_dt < cutoff_utc:
                    continue

                # VIIRS uses 'bright_ti4' instead of 'brightness'
                brightness = float(row.get('bright_ti4') or row.get('brightness') or 0)

                data_list.append({
                    "id": f"{lat}_{lon}_{row.get('acq_time', '')}",
                    "lat": lat,
                    "lon": lon,
                    "brightness": brightness,
                    "confidence": row.get('confidence', 'n'), # VIIRS confidence is low/nominal/high
                    "acq_date": row.get('acq_date', date.today().isoformat()),
                    "acq_time": row.get('acq_time', '')
                })
            except (ValueError, KeyError):
                continue
                
        # Sort by brightness descending to show "hottest" fires first
        data_list.sort(key=lambda x: x['brightness'], reverse=True)
        
        return {"data": data_list}
    except Exception as e:
        print(f"Error fetching data: {e}. Switching to MOCK DATA mode.")
        return {"data": generate_mock_data()}

def generate_mock_data():
    """Generate fake wildfire data for demo purposes when API fails."""
    import random
    print("WARNING: Using Mock Data")
    mock_hotspots = []
    # Approx bbox for Thailand
    west, south, east, north = 97.0, 5.5, 106.0, 20.5
    
    # Generate 50-100 random fires
    for i in range(random.randint(50, 100)):
        lat = random.uniform(south, north)
        lon = random.uniform(west, east)
        # Filter mostly to land mass (rough approximation or just random)
        
        mock_hotspots.append({
            "id": f"mock_{i}",
            "lat": lat,
            "lon": lon,
            "brightness": random.uniform(300, 400), # Kelvin
            "confidence": "n",
            "acq_date": date.today().isoformat(),
            "acq_time": "1200"
        })
    
    # Sort by brightness
    mock_hotspots.sort(key=lambda x: x['brightness'], reverse=True)
    return mock_hotspots
