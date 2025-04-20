import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')
api_url = f"https://shadowself.io/api/identity/regenerate-bio/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

try:
    # Send empty JSON object as payload for PATCH
    response = requests.patch(api_url, headers=headers, json={})
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
