import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

api_url = f"https://shadowself.io/api/email/save-draft/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

payload = {
    "to": "recipient@example.com",
    "subject": "Updated Draft Subject",
    "body": "Continuing to write this email...",
    "attachments": [ {"filename": "idea.txt", "data": "VGhpcyBpcyBteSB..."} ],
    "draft": 45
}

try:
    response = requests.put(api_url, headers=headers, json=payload)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
