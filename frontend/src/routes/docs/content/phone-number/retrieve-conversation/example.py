import os
import requests
import json
from urllib.parse import quote

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

addressee_phone = "+14155550000"
api_url = f"https://shadowself.io/api/phone/fetch-conversation/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Accept': 'application/json'
}
params = {
    'addressee': addressee_phone
}

try:
    response = requests.get(api_url, headers=headers, params=params)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
