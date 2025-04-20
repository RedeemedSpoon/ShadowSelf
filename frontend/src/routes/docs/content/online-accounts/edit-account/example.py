import os
import requests
import json

# Requires API_KEY and IDENTITY_ID environment variables
api_key = os.environ.get('API_KEY')
identity_id = os.environ.get('IDENTITY_ID')

if not api_key or not identity_id:
    print("Error: API_KEY and IDENTITY_ID env vars must be set.")
    exit(1)

api_url = f"https://shadowself.io/api/account/edit-account/{identity_id}"
account_entry_id = 101

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# IMPORTANT: Encrypt new password client-side first
new_encrypted_password = "U2FsdGVkX1+UpdatedPassDataLooksLikeThisMaybe=="

payload = {
    "id": account_entry_id,
    "username": "jd_service_user_revised",
    "password": new_encrypted_password,
    "website": "https://service-updated.example.com"
    # Include "totp", "algorithm" if updating TOTP
}

try:
    response = requests.put(api_url, headers=headers, json=payload)
    response.raise_for_status()
    print(json.dumps(response.json(), indent=2))
except requests.exceptions.RequestException as e:
    print(f"Request failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
