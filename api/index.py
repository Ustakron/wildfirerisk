from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import requests
import csv
import io
from datetime import date

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# NASA FIRMS Public CSV URL for South East Asia (VIIRS SNPP 24h)
# Filename pattern changed: "SUOMI_VIIRS_C2_*" (not "SUOMI_NPP_VIIRS_C2_*")
NASA_URLS = [
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_SouthEast_Asia_24h.csv",
    # Fallback to 7-day if 24h is unavailable
    "https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_SouthEast_Asia_7d.csv",
]
NASA_HEADERS = {"User-Agent": "wildfirerisk-dashboard/1.0"}

@app.get("/api/v1/hotspots")
async def get_hotspots():
    data_list = []
    try:
        # Use a timeout to prevent hanging
        response = None
        last_status = None
        for url in NASA_URLS:
            response = requests.get(url, timeout=10, headers=NASA_HEADERS)
            last_status = response.status_code
            if response.status_code == 200:
                break
        if response is None or response.status_code != 200:
            return {"data": [], "error": f"Failed to fetch data: {last_status}"}
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        for row in csv_reader:
            try:
                lat = float(row['latitude'])
                lon = float(row['longitude'])
                
                # Thailand bounding box
                # North: 20.46, South: 5.61, West: 97.34, East: 105.63
                if 5.5 <= lat <= 20.5 and 97.0 <= lon <= 106.0:
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
        print(f"Error fetching data: {e}")
        return {"data": [], "error": str(e)}
