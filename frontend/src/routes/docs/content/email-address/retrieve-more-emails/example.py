import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

mailbox = "INBOX"
# UID of the oldest email currently shown for INBOX
since_uid = 104
api_url = f"https://shadowself.io/api/email/load-more/{identity_id}"

headers = {
    'Authorization': f'Bearer {api_key}',
    'Accept': 'application/json'
}
params = {
    'mailbox': mailbox,
    'since': since_uid # UID reference point
}

try:
    response = requests.get(api_url, headers=headers, params=params)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
