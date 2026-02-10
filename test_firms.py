import requests
import os

# Try the fallback key
MAP_KEY = "b613977dc8122d603a1d9573887c2f6d"
URL = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_SNPP_NRT/97.0,5.5,106.0,20.5/1"

try:
    print(f"Testing URL: {URL}")
    response = requests.get(URL, timeout=30)
    print(f"Status Code: {response.status_code}")
    print("Response Body First 200 chars:")
    print(response.text[:200])
except Exception as e:
    print(f"Error: {e}")
