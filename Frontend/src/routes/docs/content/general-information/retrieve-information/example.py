import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')
api_url = f"https://shadowself.io/api/identity/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Accept': 'application/json'
}

try:
    response = requests.get(api_url, headers=headers)
    response.raise_for_status() # Check for HTTP errors
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
