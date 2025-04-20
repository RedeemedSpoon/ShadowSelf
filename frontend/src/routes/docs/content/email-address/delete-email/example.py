import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

api_url = f"https://shadowself.io/api/email/delete-email/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

payload = {
    "mailbox": "INBOX",
    "uid": 105
}

try:
    response = requests.delete(api_url, headers=headers, json=payload)
    response.raise_for_status()
    if response.content and response.headers.get('content-type') == 'application/json':
         print(json.dumps(response.json(), indent=2))
    elif response.status_code >= 200 and response.status_code < 300:
         print(f"Move to Junk successful (Status: {response.status_code})")
    else:
         print(f"Request completed with status: {response.status_code}")

except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
