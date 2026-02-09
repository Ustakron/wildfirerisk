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

# NASA FIRMS Public CSV URL for South East Asia (24h)
NASA_URL = "https://firms.modaps.eosdis.nasa.gov/data/active_fire/modis-c6.1/csv/MODIS_C6_1_SouthEast_Asia_24h.csv"

@app.get("/api/v1/hotspots")
async def get_hotspots():
    data_list = []
    try:
        response = requests.get(NASA_URL)
        if response.status_code != 200:
             return {"data": [], "error": f"Failed to fetch data: {response.status_code}"}
        
        content = response.content.decode('utf-8')
        csv_reader = csv.DictReader(io.StringIO(content))
        
        for row in csv_reader:
            try:
                lat = float(row['latitude'])
                lon = float(row['longitude'])
                # Approximate Thailand bounding box
                if 5.6 <= lat <= 20.5 and 97.3 <= lon <= 105.7:
                    data_list.append({
                        "id": f"{lat}_{lon}_{row.get('acq_time', '')}",
                        "lat": lat,
                        "lon": lon,
                        "brightness": float(row.get('brightness', 0)),
                        "confidence": row.get('confidence', '0'),
                        "acq_date": row.get('acq_date', date.today().isoformat()),
                        "acq_time": row.get('acq_time', '')
                    })
            except ValueError:
                continue
                
        return {"data": data_list}
    except Exception as e:
        print(f"Error fetching data: {e}")
        return {"data": [], "error":str(e)} 
