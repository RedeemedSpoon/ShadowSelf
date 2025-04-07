import os
import requests
import json

api_key = os.environ.get('API_KEY')
api_url = "https://shadowself.io/api/"
headers = {'Authorization': f'Bearer {api_key}', 'Accept': 'application/json'}

try:
    response = requests.get(api_url, headers=headers)
    response.raise_for_status() # Raises exception for bad status codes
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
