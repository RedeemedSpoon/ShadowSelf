import os
import requests
import json

api_key = os.environ.get('API_KEY')
if not api_key: exit("API_KEY missing.")

api_url = "https://shadowself.io/api/proxy"
headers = {'Authorization': f'Bearer {api_key}', 'Accept': 'application/json'}

try:
    response = requests.get(api_url, headers=headers)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except Exception as e: print(f"Request failed: {e}")
